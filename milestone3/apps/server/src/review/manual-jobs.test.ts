import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test, type TestContext } from 'node:test'
import type { Job, ManualChange, Proposal, TripView } from '@waymark/contracts'
import { openDatabase, seedDemo } from '../db/index.js'
import { buildLocalServer } from '../http/server.js'
import { seedReviewDemo } from './seed-proposal.js'

const root = '/api/v1/trips/osaka'
const token = { authorization: 'Bearer member' }
const base = { planVersion: 1, memoryRevision: 4 }

function manual(changes: ManualChange[], replacesProposalId?: string) {
  return { kind: 'plan', base, request: { kind: 'manual', changes }, ...(replacesProposalId && { replacesProposalId }) }
}

function server(t: TestContext, file = ':memory:') {
  const db = openDatabase(file)
  seedDemo(db)
  seedReviewDemo(db)
  const expiresAt = Date.now() + 60_000
  const app = buildLocalServer(db, new Map([
    ['member', { memberId: 'alex', expiresAt }], ['outsider', { memberId: 'guest', expiresAt }],
  ]))
  let closed = false
  async function close() {
    if (closed) return
    await app.close()
    db.close()
    closed = true
  }
  t.after(close)
  const post = (payload: object, key: string) => app.inject({
    method: 'POST', url: root + '/commands', headers: { ...token, 'idempotency-key': key }, payload,
  })
  const get = (path: string) => app.inject({ url: root + path, headers: token })
  async function plan(payload: object, key: string) {
    const response = await post(payload, key)
    assert.equal(response.statusCode, 202, response.body)
    const { jobId } = response.json<{ jobId: string }>()
    const job = await get('/jobs/' + jobId)
    assert.equal(job.statusCode, 200)
    return job.json<Job>()
  }
  return { db, app, close, post, get, plan }
}

test('a replacement compares its final schedule with the accepted itinerary and preserves its sources', async t => {
  const api = server(t)
  const first = await api.get('')
  const original = first.json<TripView>()
  const request = manual([
    { kind: 'retime_day', date: '2026-11-22', departAt: '2026-11-22T08:30:00+09:00' },
    { kind: 'add_stop', date: '2026-11-21', candidateId: 'yasaka', start: '2026-11-21T14:15:00+09:00', end: '2026-11-21T14:45:00+09:00' },
    { kind: 'retime', stopId: 'sTsuten', start: '2026-11-22T13:05:00+09:00', end: '2026-11-22T14:05:00+09:00' },
  ], 'p7')
  const job = await api.plan(request, 'edit')
  assert.ok(job.status === 'succeeded' && job.result.kind === 'proposal')
  const proposal = (await api.get('/proposals/' + job.result.proposalId)).json<Proposal>()
  assert.equal(proposal.differences.length, 3)
  const changes = proposal.differences.join('\n')
  assert.match(changes, /Remove Osaka Castle/)
  assert.match(changes, /Add Yasaka Shrine/)
  assert.match(changes, /Change Tsutenkaku/)
  assert.doesNotMatch(changes, /Departure/)
  const view = (await api.get('')).json<TripView>()
  assert.deepEqual(view.accepted, original.accepted)
  assert.equal(view.memory.revision, original.memory.revision)
  assert.deepEqual(view.pending.map(p => p.id), [proposal.id])
  assert.equal((await api.get('/proposals/p7')).json<Proposal>().status, 'stale')
  const appSources = view.memory.sources.filter(source => source.origin === 'app')
  assert.equal(appSources.length, 1)
  assert.equal(appSources[0].authorId, 'alex')
  assert.equal(appSources[0].url, null)
  assert.deepEqual(JSON.parse(appSources[0].text), request.request)
  for (const sourceId of ['m3', 'm1', 'm2', 'ky1', appSources[0].id]) assert.ok(proposal.sourceIds.includes(sourceId))
  const sync = { kind: 'decide', proposalId: proposal.id, action: 'apply' }
  assert.equal((await api.post(sync, 'edit')).json().error.code, 'KEY_REUSED')
  const applied = await api.post(sync, 'apply')
  assert.equal(applied.statusCode, 200)
  assert.deepEqual(applied.json<TripView>().accepted, { version: 2, itinerary: proposal.preview, confirmedBy: [] })
  assert.deepEqual(await api.plan(request, 'edit'), job)
  assert.equal((await api.post(request, 'apply')).json().error.code, 'KEY_REUSED')
  const stale = await api.post(request, 'another-attempt')
  assert.equal(stale.statusCode, 409)
  assert.deepEqual(stale.json().error.current, { planVersion: 2, memoryRevision: 4 })
})

test('editing out an intermediate stop still discloses the direct travel leg removed by the first edit', async t => {
  const api = server(t)
  const first = await api.plan(manual([{ kind: 'add_stop', date: '2026-11-22', candidateId: 'yasaka',
    start: '2026-11-22T11:35:00+09:00', end: '2026-11-22T11:45:00+09:00' }]), 'intermediate')
  assert.ok(first.status === 'succeeded' && first.result.kind === 'proposal')
  const proposal = (await api.get('/proposals/' + first.result.proposalId)).json<Proposal>()
  const intermediate = proposal.preview.days[2].stops.find(stop => stop.candidateId === 'yasaka')
  assert.ok(intermediate)
  const edited = await api.plan(manual([{ kind: 'remove_stop', stopId: intermediate.id }], proposal.id), 'undo-stop')
  assert.ok(edited.status === 'succeeded' && edited.result.kind === 'proposal')
  const final = (await api.get('/proposals/' + edited.result.proposalId)).json<Proposal>()
  assert.equal(final.differences.length, 1)
  assert.match(final.differences[0], /direct travel leg from Osaka Castle to Shinsekai/)
})

test('an infeasible edit keeps its predecessor pending and its failed job survives a restart', async t => {
  const directory = mkdtempSync(join(tmpdir(), 'waymark-manual-'))
  const path = join(directory, 'jobs.sqlite')
  t.after(() => rmSync(directory, { recursive: true, force: true }))
  const first = server(t, path)
  const request = manual([{ kind: 'remove_stop', stopId: 'sMeet' }], 'p7')
  const job = await first.plan(request, 'bad-edit')
  assert.ok(job.status === 'failed')
  assert.equal(job.error.code, 'INFEASIBLE')
  assert.match(job.error.message, /meetup/i)
  await first.close()
  const restored = server(t, path)
  assert.deepEqual(await restored.plan(request, 'bad-edit'), job)
  const view = (await restored.get('')).json<TripView>()
  assert.deepEqual(view.pending.map(p => p.id), ['p7'])
  assert.equal(view.pending[0].status, 'pending')
  assert.equal(view.accepted?.version, 1)
  assert.equal(view.memory.sources.filter(source => source.origin === 'app').length, 1)
  assert.equal((await restored.app.inject({ url: root + '/jobs/' + job.id })).statusCode, 401)
  assert.equal((await restored.app.inject({ url: root + '/jobs/' + job.id, headers: { authorization: 'Bearer outsider' } })).statusCode, 403)
  assert.equal((await restored.app.inject({ url: '/api/v1/trips/another/jobs/' + job.id, headers: token })).statusCode, 404)
  assert.equal((await restored.get('/jobs/missing')).statusCode, 404)
})

test('a failed job write rolls back the replacement, predecessor status, source and operation receipt', async t => {
  const api = server(t)
  const request = manual([{ kind: 'remove_stop', stopId: 's1' }], 'p7')
  const original = (await api.get('')).json<TripView>()
  api.db.exec("CREATE TRIGGER fail_job BEFORE INSERT ON review_jobs BEGIN SELECT RAISE(ABORT, 'simulated write failure'); END")
  assert.equal((await api.post(request, 'write-failure')).statusCode, 500)
  assert.deepEqual((await api.get('')).json<TripView>(), original)
  assert.deepEqual((await api.get('/proposals/p7')).json<Proposal>(), original.pending[0])
  assert.equal(api.db.prepare('SELECT count(*) AS n FROM review_proposals').get()?.n, 1)
  api.db.exec('DROP TRIGGER fail_job')
  assert.equal((await api.plan(request, 'write-failure')).status, 'succeeded')
})

test('the command boundary validates nested manual inputs before recording a job', async t => {
  const api = server(t)
  const valid = manual([{ kind: 'remove_stop', stopId: 's1' }])
  for (const payload of [
    { ...valid, memberId: 'mia' }, { ...valid, replacesProposalId: null }, { ...valid, base: { ...base, planVersion: '1' } },
    { ...valid, request: { kind: 'manual', changes: [] } },
    { ...valid, request: { kind: 'manual', changes: [null] } },
    { ...valid, request: { kind: 'manual', changes: [{ kind: 'remove_stop', stopId: 's1', authorId: 'mia' }] } },
    { ...valid, request: { kind: 'manual', changes: [{ kind: 'retime_day', date: '2026-11-20', departAt: '10:00' }] } },
    { ...valid, request: { kind: 'manual', changes: [{ kind: 'add_stop', date: '2026-11-21', candidateId: 'yasaka' }] } },
  ]) {
    const result = await api.post(payload, 'check-format')
    assert.equal(result.statusCode, 422, result.body)
    assert.equal(result.json().error.code, 'INVALID_INPUT')
  }
  for (const request of [{ kind: 'draft' }, { kind: 'manual', changes: [{ kind: 'reorder' }] }]) {
    const result = await api.post({ ...valid, request }, 'unsupported')
    assert.equal(result.statusCode, 422)
    assert.equal(result.json().error.code, 'UNSUPPORTED_COMMAND')
  }
  const stale = await api.post({ ...valid, base: { ...base, memoryRevision: 3 } }, 'stale')
  assert.equal(stale.statusCode, 409)
  assert.deepEqual(stale.json().error.current, base)
  assert.equal(api.db.prepare('SELECT count(*) AS n FROM review_jobs').get()?.n, 0)
})
