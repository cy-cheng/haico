import assert from 'node:assert/strict'
import { randomInt, randomUUID } from 'node:crypto'
import { test, type TestContext } from 'node:test'
import type { Actor, AsyncCommand, Command, JobRef, Source, SyncCommand, TripView } from '@waymark/contracts'
import { readTrip, seedDemo, testDatabase } from '../db/index.js'
import { buildLocalServer } from '../http/server.js'
import { getJob, runManualJob } from '../review/manual-jobs.js'
import { seedReviewDemo } from '../review/seed-proposal.js'
import { getProposal, memberTrip, runCommand, TripError } from '../review/service.js'
import { createReviewAdapter, type ReviewMessageAddress } from './review-adapter.js'
import { buildChangeProposalCard, parseReviewComponent, type ReviewMessage } from './review-cards.js'

const appOrigin = 'https://waymark.example.test'
const tripId = 'osaka'
const proposalId = 'p7'
const alex = { memberId: 'alex' }
const mia = { memberId: 'mia' }
const snowflake = () => String(randomInt(10 ** 13, 10 ** 14))

function setup(t: TestContext) {
  const db = testDatabase()
  seedDemo(db)
  seedReviewDemo(db)
  const initial = readTrip(db, tripId)!
  const address = { channelId: initial.trip.channelId, messageId: snowflake() }
  const edits: { address: ReviewMessageAddress; message: ReviewMessage }[] = []
  const runCalls: { actor: Actor; key: string }[] = []
  const channelChecks: { actor: Actor; channelId: string }[] = []
  const allowed = new Set(initial.members.map(member => member.id))
  let failNextEdit = false
  let waitForEdit: (() => Promise<void>) | undefined

  async function run(actor: Actor, tripId: string, command: SyncCommand, key: string): Promise<TripView>
  async function run(actor: Actor, tripId: string, command: AsyncCommand, key: string, source?: Source): Promise<JobRef>
  async function run(actor: Actor, tripId: string, command: Command, key: string): Promise<TripView | JobRef> {
    runCalls.push({ actor, key })
    assert.ok(command.kind === 'decide' || command.kind === 'confirm' || command.kind === 'unconfirm')
    return runCommand(db, tripId, actor.memberId, key, command)
  }

  const adapter = createReviewAdapter({
    async forChannel(actor, channelId) {
      channelChecks.push({ actor, channelId })
      const view = readTrip(db, tripId)!
      return allowed.has(actor.memberId) && view.trip.channelId === channelId ? view.trip : null
    },
    async view(actor, id) {
      return memberTrip(db, id, actor.memberId)
    },
    async proposal(actor, id, proposal) {
      return getProposal(db, memberTrip(db, id, actor.memberId), proposal)
    },
    run,
  }, {
    async editMessage(address, message) {
      const wait = waitForEdit
      waitForEdit = undefined
      if (wait) await wait()
      if (failNextEdit) {
        failNextEdit = false
        throw new Error('Simulated Discord edit failure.')
      }
      edits.push({ address, message })
    },
  }, appOrigin)
  adapter.register({ ...address, tripId, proposalId })

  const alexToken = randomUUID()
  const miaToken = randomUUID()
  const expiresAt = Date.now() + 60_000
  const app = buildLocalServer(db, new Map([
    [alexToken, { ...alex, expiresAt }],
    [miaToken, { ...mia, expiresAt }],
  ]))
  t.after(async () => { await app.close(); db.close() })
  const url = `/api/v1/trips/${tripId}`
  async function readHttp(token = miaToken) {
    const response = await app.inject({ url, headers: { authorization: `Bearer ${token}` } })
    assert.equal(response.statusCode, 200, response.body)
    return response.json<TripView>()
  }
  async function postHttp(command: SyncCommand) {
    const response = await app.inject({ url: `${url}/commands`, method: 'POST',
      headers: { authorization: `Bearer ${miaToken}`, 'idempotency-key': randomUUID() }, payload: command })
    assert.equal(response.statusCode, 200, response.body)
    return response.json<TripView>()
  }
  function event(member: Actor, customId: string) {
    return { ...address, ...member, id: snowflake(), customId }
  }
  function holdEdit() {
    let release!: () => void
    let started!: () => void
    const blocked = new Promise<void>(resolve => { release = resolve })
    const inFlight = new Promise<void>(resolve => { started = resolve })
    waitForEdit = () => { started(); return blocked }
    return { inFlight, release }
  }
  return { adapter, initial, address, db, edits, allowed, runCalls, channelChecks, event, readHttp, postHttp, alexToken,
    holdEdit, failEdit: () => { failNextEdit = true } }
}

function buttons(message: ReviewMessage) {
  return message.components[0].components
}

function clickId(message: ReviewMessage, label: string): string {
  const button = buttons(message).find(button => button.label === label)
  assert.ok(button && 'custom_id' in button)
  return button.custom_id
}

test('the Day 3 proposal card shows Mia’s source, v1 base, changes and exact app link', async t => {
  const { adapter, address, initial } = setup(t)
  const card = await adapter.refresh(alex, address)
  assert.match(card.content, /Pending review · Base v1 · Memory revision 4/)
  assert.match(card.content, /08:30.*11:00/)
  assert.match(card.content, /Osaka Castle/)
  assert.match(card.content, /Mia \(m3\) · Start Day 3 at 11:00 and skip Osaka Castle\./)
  assert.deepEqual(card.allowed_mentions, { parse: [] })
  assert.deepEqual(buttons(card).map(button => button.label), ['Apply', 'Keep original', 'Open in app'])
  assert.deepEqual(buttons(card).at(-1), {
    type: 2, style: 5, label: 'Open in app', url: `${appOrigin}/trips/osaka/proposals/p7`,
  })
  assert.throws(() => buildChangeProposalCard(initial, initial.pending[0], 'http://localhost:3000'))
  assert.throws(() => buildChangeProposalCard(initial, initial.pending[0], `${appOrigin}/base`))
  const long = buildChangeProposalCard(initial, { ...initial.pending[0],
    differences: Array(64).fill('*'.repeat(1000)), warnings: [{ code: 'test', message: '<'.repeat(1000) }],
  }, appOrigin)
  assert.ok(long.content.length <= 2000)
  assert.match(long.content, /More changes in the app/)
})

test('a Discord Apply shares v2 with HTTP and a replay never displays the cached 0/4 after Mia confirms', async t => {
  const { adapter, address, edits, readHttp, event, postHttp, runCalls, channelChecks, initial } = setup(t)
  const pending = await adapter.refresh(alex, address)
  const apply = event(alex, clickId(pending, 'Apply'))
  assert.equal(await adapter.handle(apply), true)
  const accepted = edits.at(-1)!.message
  assert.deepEqual(edits.at(-1)!.address, address)
  assert.match(accepted.content, /Accepted v2/)
  assert.match(accepted.content, /0\/4 members confirmed/)
  assert.deepEqual(buttons(accepted).map(button => button.label), ['Confirm', 'Unconfirm', 'Open in app'])
  assert.deepEqual(buttons(accepted).at(-1), { type: 2, style: 5, label: 'Open in app', url: `${appOrigin}/trips/osaka` })

  const view = await readHttp()
  assert.equal(view.accepted?.version, 2)
  const days = view.accepted!.itinerary.days
  assert.deepEqual(days.slice(0, 2), initial.accepted!.itinerary.days.slice(0, 2))
  assert.deepEqual(days[2].split, initial.accepted!.itinerary.days[2].split)
  assert.equal(days[2].departAt, '2026-11-22T11:00:00+09:00')
  assert.ok(!days[2].stops.some(stop => stop.id === 'sCastle'))
  assert.ok(view.memory.candidates.some(candidate => candidate.id === 'castle'))
  const confirmed = await postHttp({ kind: 'confirm', planVersion: 2 })
  assert.deepEqual(confirmed.accepted?.confirmedBy, ['mia'])
  assert.match((await adapter.refresh(mia, address)).content, /1\/4 members confirmed/)

  assert.equal(await adapter.handle(apply), true)
  assert.match(edits.at(-1)!.message.content, /1\/4 members confirmed/)
  assert.deepEqual(runCalls, [{ actor: alex, key: apply.id }, { actor: alex, key: apply.id }])
  assert.equal(channelChecks.filter(check => check.actor.memberId === 'alex').length, 3)
  assert.deepEqual(await readHttp(), confirmed)
})

test('an HTTP Apply refreshes the original Discord card and confirmation buttons use the actual clicker', async t => {
  const { adapter, address, event, postHttp, readHttp, edits, alexToken } = setup(t)
  await adapter.refresh(mia, address)
  await postHttp({ kind: 'decide', proposalId, action: 'apply' })
  const card = await adapter.refresh(mia, address)
  const confirm = event(alex, clickId(card, 'Confirm'))
  await adapter.handle(confirm)
  assert.deepEqual((await readHttp(alexToken)).accepted?.confirmedBy, ['alex'])
  await adapter.handle(confirm)
  assert.match(edits.at(-1)!.message.content, /1\/4 members confirmed/)
  await adapter.handle(event(mia, clickId(card, 'Unconfirm')))
  assert.deepEqual((await readHttp()).accepted?.confirmedBy, ['alex'])
  await adapter.handle(event(alex, clickId(card, 'Unconfirm')))
  assert.match(edits.at(-1)!.message.content, /0\/4 members confirmed/)
  assert.deepEqual((await readHttp()).accepted?.confirmedBy, [])
})

test('Keep original closes the card without writing a new version', async t => {
  const { adapter, address, edits, readHttp, event, initial } = setup(t)
  const card = await adapter.refresh(alex, address)
  await adapter.handle(event(alex, clickId(card, 'Keep original')))
  const closed = edits.at(-1)!.message
  assert.match(closed.content, /Original kept · Base v1/)
  assert.deepEqual(buttons(closed).map(button => button.label), ['Open in app'])
  assert.deepEqual((await readHttp()).accepted, initial.accepted)
  await assert.rejects(adapter.handle(event(mia, clickId(card, 'Apply'))), { code: 'ALREADY_DECIDED' })
  assert.match(edits.at(-1)!.message.content, /Original kept/)
})

test('copied buttons, revoked access, foreign plans and malformed commands cannot write', async t => {
  const { adapter, address, initial, edits, allowed, runCalls, event, readHttp } = setup(t)
  const card = await adapter.refresh(alex, address)
  const apply = event(alex, clickId(card, 'Apply'))
  const forbidden = (error: unknown) => error instanceof TripError && error.code === 'FORBIDDEN'
  await assert.rejects(adapter.handle({ ...apply, messageId: snowflake() }), forbidden)
  await assert.rejects(adapter.handle({ ...apply, channelId: 'another-channel' }), forbidden)
  await assert.rejects(adapter.handle({ ...apply, customId: 'wm:review:apply:other:p7' }), forbidden)
  await assert.rejects(adapter.handle({ ...apply, customId: 'wm:review:apply:osaka:p8' }), forbidden)
  await assert.rejects(adapter.handle({ ...apply, customId: 'wm:review:confirm:osaka:2' }), forbidden)
  assert.throws(() => adapter.register({ ...address, tripId, proposalId: 'p8' }), /cannot be rebound/)
  allowed.delete(alex.memberId)
  await assert.rejects(adapter.handle(apply), forbidden)
  await assert.rejects(adapter.refresh(alex, address), forbidden)
  assert.equal(await adapter.handle({ ...apply, id: 'bad' }), false)
  for (const customId of [
    'wm:review:reject:osaka:p7:mia', 'wm:review:confirm:osaka:01', 'wm:review:confirm:osaka:9007199254740992',
    'wm:review:pause:osaka:p7', 'wm:review:apply:osaka:../p7', `wm:review:apply:osaka:${'x'.repeat(100)}`,
  ]) {
    assert.equal(parseReviewComponent(customId), null)
    assert.equal(await adapter.handle({ ...apply, customId }), false)
  }
  assert.deepEqual(runCalls, [])
  assert.equal(edits.length, 1)
  assert.deepEqual(await readHttp(), initial)
})

test('failed Discord edits can replay the committed action without resetting a later HTTP confirmation', async t => {
  const { adapter, address, event, postHttp, readHttp, edits, failEdit } = setup(t)
  const card = await adapter.refresh(alex, address)
  const apply = event(alex, clickId(card, 'Apply'))
  failEdit()
  await assert.rejects(adapter.handle(apply), /Simulated Discord edit failure/)
  assert.equal((await readHttp()).accepted?.version, 2)
  assert.equal(edits.length, 1)
  await postHttp({ kind: 'confirm', planVersion: 2 })
  await adapter.handle(apply)
  assert.match(edits.at(-1)!.message.content, /1\/4 members confirmed/)
})

test('an in-flight edit cannot overtake the current confirmation count', async t => {
  const { adapter, address, event, postHttp, edits, holdEdit } = setup(t)
  const card = await adapter.refresh(alex, address)
  const { inFlight, release } = holdEdit()
  const applied = adapter.handle(event(alex, clickId(card, 'Apply')))
  try {
    await inFlight
    await postHttp({ kind: 'confirm', planVersion: 2 })
    const refreshed = adapter.refresh(mia, address)
    release()
    await Promise.all([applied, refreshed])
  } finally {
    release()
  }
  assert.match(edits.at(-2)!.message.content, /0\/4 members confirmed/)
  assert.match(edits.at(-1)!.message.content, /1\/4 members confirmed/)
})

test('replaying a v2 confirmation cannot add consent or buttons for a later v3', async t => {
  const { adapter, address, db, event, postHttp, readHttp, edits } = setup(t)
  await postHttp({ kind: 'decide', proposalId, action: 'apply' })
  const card = await adapter.refresh(alex, address)
  const confirm = event(alex, clickId(card, 'Confirm'))
  await adapter.handle(confirm)

  const { jobId } = runManualJob(db, tripId, mia.memberId, randomUUID(), {
    kind: 'plan', base: { planVersion: 2, memoryRevision: 4 },
    request: { kind: 'manual', changes: [{ kind: 'retime_day', date: '2026-11-22', departAt: '2026-11-22T10:30:00+09:00' }] },
  })
  const job = getJob(db, memberTrip(db, tripId, mia.memberId), jobId)
  assert.ok(job.status === 'succeeded' && job.result.kind === 'proposal')
  await postHttp({ kind: 'decide', proposalId: job.result.proposalId, action: 'apply' })
  await postHttp({ kind: 'confirm', planVersion: 3 })
  await adapter.handle(confirm)
  assert.deepEqual((await readHttp()).accepted?.confirmedBy, ['mia'])
  const refreshed = edits.at(-1)!.message
  assert.match(refreshed.content, /Accepted v3/)
  assert.match(refreshed.content, /1\/4 members confirmed/)
  assert.deepEqual(buttons(refreshed).map(button => button.label), ['Open in app'])
  await assert.rejects(adapter.handle(event(alex, confirm.customId)), { code: 'STALE_BASE' })
  await assert.rejects(adapter.handle({ ...confirm, customId: 'wm:review:confirm:osaka:3' }), { code: 'FORBIDDEN' })
})
