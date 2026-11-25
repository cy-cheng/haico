import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { DatabaseSync } from 'node:sqlite'
import { test, type TestContext } from 'node:test'
import type { FastifyInstance } from 'fastify'
import { createApiClient, RequestError } from '../apps/mobile/src/platform/api.js'
import { openDatabase, readTrip, saveTrip, seedDemo } from '../apps/server/src/db/index.js'
import { buildLocalServer } from '../apps/server/src/http/server.js'
import { seedReviewDemo } from '../apps/server/src/review/seed-proposal.js'
import { storeProposal } from '../apps/server/src/review/service.js'

const apply = { kind: 'decide', proposalId: 'p7', action: 'apply' } as const
const reject = { ...apply, action: 'reject' } as const
const demo = 'osaka'

// Run the same client that sends requests from the phone against Fastify's HTTP entry point.
function transport(app: FastifyInstance): typeof fetch {
  return async (input, init) => {
    const request = new Request(input, init)
    assert.ok(request.method === 'GET' || request.method === 'POST')
    const { pathname, search } = new URL(request.url)
    const response = await app.inject({
      method: request.method, url: pathname + search,
      headers: Object.fromEntries(request.headers),
      payload: request.body ? await request.text() : undefined,
    })
    return new Response(response.body, {
      status: response.statusCode,
      headers: { 'Content-Type': String(response.headers['content-type']) },
    })
  }
}

function apiError(status: number, code?: string) {
  return (reason: unknown) => reason instanceof RequestError && reason.status === status
    && (!code || reason.detail.code === code)
}

function start(t: TestContext, path = ':memory:') {
  const db = openDatabase(path)
  seedDemo(db)
  seedReviewDemo(db)
  const expiresAt = Date.now() + 60_000
  const alexToken = randomUUID()
  const miaToken = randomUUID()
  const expiredToken = randomUUID()
  const app = buildLocalServer(db, new Map([
    [alexToken, { memberId: 'alex', expiresAt }],
    [miaToken, { memberId: 'mia', expiresAt }],
    [expiredToken, { memberId: 'mia', expiresAt: Date.now() - 1000 }],
  ]))
  const http = transport(app)
  const client = (token: string) => createApiClient('http://127.0.0.1', { accessToken: () => token }, http)
  let closed = false
  async function close() {
    if (closed) return
    await app.close()
    db.close()
    closed = true
  }
  t.after(close)
  return { db, app, alex: client(alexToken), mia: client(miaToken), expired: client(expiredToken), alexToken, close }
}

function addSecondProposal(db: DatabaseSync) {
  const view = readTrip(db, demo)
  assert.ok(view?.pending[0])
  const rival = { ...view.pending[0], id: 'p8' }
  view.pending.push(rival)
  storeProposal(db, demo, rival)
  saveTrip(db, view)
}

test('a trip and its calendar are visible only with a current demo session', async t => {
  const { app, db, alex, mia, expired } = start(t)
  assert.equal((await app.inject({ url: '/api/v1/trips/osaka' })).statusCode, 401)
  await assert.rejects(expired.calendar(demo, 1), apiError(401))
  assert.equal((await alex.me()).id, 'alex')
  assert.equal((await mia.me()).id, 'mia')
  const another = readTrip(db, demo)!
  another.trip = { ...another.trip, id: 'other', channelId: 'other-channel' }
  saveTrip(db, another)
  assert.deepEqual((await alex.trips()).map(trip => trip.id), [demo])
  await assert.rejects(alex.view('other'), apiError(404))
  await assert.rejects(alex.proposal('other', 'p7'), apiError(404))
  const current = readTrip(db, demo)!
  current.members = current.members.filter(member => member.id !== 'alex')
  saveTrip(db, current)
  await assert.rejects(alex.command(demo, apply, 'removed-member'), apiError(403))
  assert.equal((await mia.view(demo)).accepted?.version, 1)
})

test('writing requires an operation key and only the session owner can make the change', async t => {
  const { app, alexToken, alex } = start(t)
  const url = '/api/v1/trips/osaka/commands'
  const headers = { authorization: 'Bearer ' + alexToken }
  const missing = await app.inject({ method: 'POST', url, headers, payload: apply })
  assert.equal(missing.statusCode, 422)
  const invalid = await app.inject({
    method: 'POST', url, headers: { ...headers, 'idempotency-key': 'invalid-author' },
    payload: { kind: 'confirm', planVersion: 1, memberId: 'mia' },
  })
  assert.equal(invalid.statusCode, 422)
  const trip = await alex.view(demo)
  assert.equal(trip.accepted?.version, 1)
  assert.deepEqual(trip.accepted?.confirmedBy, [])
})

test('review preserves both groups, exports the requested version and restores decisions after restart', async t => {
  const dir = mkdtempSync(join(tmpdir(), 'waymark-review-'))
  const path = join(dir, 'trip.sqlite')
  try {
    const { db, alex, mia, close } = start(t, path)
    addSecondProposal(db)
    const initial = await alex.view(demo)
    const original = initial.accepted
    assert.ok(original)
    assert.equal(original.version, 1)
    const proposal = await alex.proposal(demo, 'p7')
    assert.equal(proposal.status, 'pending')
    assert.deepEqual(proposal.base, { planVersion: 1, memoryRevision: 4 })
    assert.deepEqual(proposal.sourceIds, ['m3'])
    assert.equal(initial.memory.sources.find(source => source.id === 'm3')?.authorId, 'mia')
    const [day1, day2, day3] = proposal.preview.days
    const before = original.itinerary.days[2]
    assert.deepEqual([day1, day2], original.itinerary.days.slice(0, 2))
    assert.equal(day3.departAt, '2026-11-22T11:00:00+09:00')
    assert.deepEqual(day3.stops, before.stops.filter(stop => stop.id !== 'sCastle'))
    assert.deepEqual(day3.split, before.split)
    assert.equal(day3.stops.find(stop => stop.id === day3.split?.meetingStopId)?.start, '2026-11-22T16:00:00+09:00')
    assert.ok(before.stops.some(stop => stop.id === 'sCastle'))
    assert.deepEqual((await alex.view(demo)).accepted, original)

    const applied = await alex.command(demo, apply, 'alex-apply')
    assert.deepEqual(applied.accepted, { version: 2, itinerary: proposal.preview, confirmedBy: [] })
    assert.deepEqual(applied.pending, [])
    assert.deepEqual(applied.memory, initial.memory)
    assert.equal((await mia.proposal(demo, 'p7')).status, 'accepted')
    assert.equal((await mia.proposal(demo, 'p8')).status, 'stale')
    await assert.rejects(mia.command(demo, { ...apply, proposalId: 'p8' }, 'mia-apply'), apiError(409, 'STALE_BASE'))
    await assert.rejects(mia.command(demo, { kind: 'confirm', planVersion: 1 }, 'mia-old'), apiError(409, 'STALE_BASE'))
    const confirmed = await mia.command(demo, { kind: 'confirm', planVersion: 2 }, 'mia-confirm')
    assert.deepEqual(confirmed.accepted?.confirmedBy, ['mia'])
    assert.equal(confirmed.members.length, 4)
    assert.deepEqual(await alex.command(demo, apply, 'alex-apply'), applied)
    await assert.rejects(alex.command(demo, reject, 'alex-apply'), apiError(409, 'KEY_REUSED'))
    assert.deepEqual(await alex.view(demo), confirmed)

    const v1 = await mia.calendar(demo, 1)
    const v2 = await mia.calendar(demo, 2)
    assert.match(v1, /SUMMARY:Osaka Castle\r\n/)
    assert.doesNotMatch(v2, /SUMMARY:Osaka Castle/)
    assert.match(v2, /SUMMARY:Umeda Sky Building\r\n/)
    assert.match(v2, /SUMMARY:Tsutenkaku\r\n/)
    assert.match(v2, /DTSTART:20261122T070000Z\r\n/)
    await assert.rejects(mia.calendar(demo, 3), apiError(404))

    await close()
    const reopened = start(t, path)
    assert.deepEqual(await reopened.alex.view(demo), confirmed)
    assert.deepEqual(await reopened.alex.command(demo, apply, 'alex-apply'), applied)
    assert.equal((await reopened.mia.proposal(demo, 'p7')).status, 'accepted')
    assert.match(await reopened.mia.calendar(demo, 1), /SUMMARY:Osaka Castle/)
    await reopened.close()
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('Keep original closes the proposal and leaves the current version intact', async t => {
  const { alex, mia } = start(t)
  const original = await alex.view(demo)
  const kept = await mia.command(demo, reject, 'mia-keep-original')
  assert.deepEqual(kept.accepted, original.accepted)
  assert.equal(kept.pending.length, 0)
  assert.equal((await alex.proposal(demo, 'p7')).status, 'rejected')
  await assert.rejects(alex.command(demo, apply, 'alex-late'), apiError(409))
  await assert.rejects(alex.calendar(demo, 2), apiError(404))
})

test('a member vote makes a proposal from the previous memory revision ineligible for Apply', async t => {
  const { alex, mia } = start(t)
  const vote = await mia.command(demo, {
    kind: 'edit_memory', memoryRevision: 4, edit: { kind: 'vote', candidateId: 'castle', value: 'heart' },
  }, 'mia-heart')
  assert.equal(vote.memory.revision, 5)
  assert.deepEqual(vote.memory.candidates.find(candidate => candidate.id === 'castle')?.votes, [{ memberId: 'mia', value: 'heart' }])
  assert.deepEqual(vote.pending, [])
  const historical = await alex.proposal(demo, 'p7')
  assert.equal(historical.status, 'stale')
  assert.deepEqual(historical.base, { planVersion: 1, memoryRevision: 4 })
  const fresh = await mia.view(demo)
  const newBase = { planVersion: fresh.accepted?.version, memoryRevision: fresh.memory.revision }
  assert.deepEqual(newBase, { planVersion: 1, memoryRevision: 5 })
  await assert.rejects(alex.command(demo, apply, 'alex-old-preview'), (err: unknown) => {
    assert.ok(err instanceof RequestError)
    assert.equal(err.status, 409)
    assert.equal(err.detail.code, 'STALE_BASE')
    assert.deepEqual(err.detail.current, newBase)
    return true
  })
})

test('repeating an existing poll selection keeps the pending proposal reviewable', async t => {
  const { mia, alex } = start(t)
  const before = await mia.view(demo)
  const after = await mia.command(demo, {
    kind: 'edit_memory', memoryRevision: before.memory.revision,
    edit: { kind: 'vote_option', summaryId: 'sum2', pollId: 'poll2', optionId: 'gion' },
  }, 'mia-reselect-gion')
  assert.deepEqual(after, before)
  assert.equal((await alex.proposal(demo, 'p7')).status, 'pending')
  assert.equal((await alex.command(demo, apply, 'alex-apply-unchanged')).accepted?.version, 2)
})

test('when a pair of apply requests race only one version is accepted', async t => {
  const { alex, mia } = start(t)
  const results = await Promise.allSettled([
    alex.command(demo, apply, 'alex-racing'),
    mia.command(demo, apply, 'mia-racing'),
  ])
  assert.equal(results.filter(result => result.status === 'fulfilled').length, 1)
  const loser = results.find(result => result.status === 'rejected')
  assert.ok(loser && apiError(409)(loser.reason))
  assert.equal((await mia.view(demo)).accepted?.version, 2)
})
