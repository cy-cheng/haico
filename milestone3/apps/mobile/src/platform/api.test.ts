import assert from 'node:assert/strict'
import test from 'node:test'
import type { Proposal } from '@waymark/contracts'
import { createApiClient, RequestError, serverOrigin } from './api'
import { createDemoClient } from './demo'

test('the client limits cleartext HTTP to loopback and private numeric addresses', () => {
  for (const url of ['http://127.bad.example', 'http://10.xyz', 'http://192.168.attacker.test', 'http://example.com']) {
    assert.throws(() => serverOrigin(url), /HTTPS/)
  }
  assert.throws(() => serverOrigin('https://tester:secret@waymark.example'), /credentials/)
  assert.throws(() => serverOrigin('https://waymark.example/trips/osaka'), /trip path/)
  assert.equal(serverOrigin('http://10.0.2.2:3000/api/v1/'), 'http://10.0.2.2:3000')
  assert.equal(serverOrigin('https://waymark.example/api/v1'), 'https://waymark.example')
})

test('typed request sends the configured session and stable command key', async () => {
  let endpoint = ''
  let request: RequestInit | undefined
  const client = createApiClient('https://waymark.example', { accessToken: () => 'test-session' },
    async (input, init) => { endpoint = String(input); request = init; return new Response('{}', { status: 200 }) })
  const command = { kind: 'decide', proposalId: 'p7', action: 'apply' } as const
  await client.command('one/two', command, 'request-1')
  assert.equal(endpoint, 'https://waymark.example/api/v1/trips/one%2Ftwo/commands')
  assert.equal(request?.method, 'POST')
  const headers = new Headers(request?.headers)
  assert.equal(headers.get('Authorization'), 'Bearer test-session')
  assert.equal(headers.get('Idempotency-Key'), 'request-1')
  assert.deepEqual(JSON.parse(String(request?.body)), command)
})

test('unauthorized and stale API errors stay machine-readable', async () => {
  let expired: string | undefined
  const client = createApiClient('https://waymark.example', {
    accessToken: () => 'test-session', onUnauthorized: (token) => { expired = token },
  }, async () => new Response(JSON.stringify({ error: { code: 'UNAUTHENTICATED', message: 'Expired' } }), { status: 401 }))
  await assert.rejects(() => client.me(), (err: unknown) =>
    err instanceof RequestError && err.status === 401 && err.detail.code === 'UNAUTHENTICATED')
  assert.equal(expired, 'test-session')
})

test('Day 3 review changes no accepted data before Apply and preserves the meetup', async () => {
  const client = createDemoClient()
  const before = await client.view('osaka')
  const preview = await client.proposal('osaka', 'p7')
  assert.equal(preview.status, 'pending')
  assert.equal(before.accepted?.version, 1)
  assert.deepEqual(preview.preview.days.slice(0, 2), before.accepted?.itinerary.days.slice(0, 2))
  const originalDay = before.accepted?.itinerary.days[2]
  const revised = preview.preview.days[2]
  assert.equal(revised.departAt.slice(11, 16), '11:00')
  assert.ok(!revised.stops.some((stop) => stop.candidateId === 'castle'))
  assert.deepEqual(revised.split, originalDay?.split)
  const result = await client.command('osaka', { kind: 'decide', action: 'apply', proposalId: 'p7' }, 'decide-1')
  assert.equal(result.accepted?.version, 2)
  assert.deepEqual(result.accepted?.confirmedBy, [])
  assert.deepEqual(await client.command('osaka', { kind: 'decide', action: 'apply', proposalId: 'p7' }, 'decide-1'), result)
  const confirmed = await client.command('osaka', { kind: 'confirm', planVersion: 2 }, 'confirm-1')
  assert.deepEqual(confirmed.accepted?.confirmedBy, ['alex'])
  assert.match(await client.calendar('osaka', 2), /BEGIN:VCALENDAR/)
})

test('Gion preview and Keep original leave the saved poll and accepted plan unchanged', async () => {
  const client = createDemoClient()
  const before = await client.view('osaka')
  const { jobId } = await client.command('osaka', {
    kind: 'plan',
    base: { planVersion: 1, memoryRevision: 4 },
    request: { kind: 'revise', instruction: 'Plan Gion', context: { date: '2026-11-21', selectedOption: { summaryId: 'sum2', pollId: 'poll2', optionId: 'gion' } } },
  }, 'plan-1')
  const job = await client.job('osaka', jobId)
  assert.ok(job.status === 'succeeded' && job.result.kind === 'proposal')
  const proposal: Proposal = await client.proposal('osaka', job.result.proposalId)
  assert.deepEqual(proposal.preview.days[0], before.accepted?.itinerary.days[0])
  assert.deepEqual(proposal.preview.days[2], before.accepted?.itinerary.days[2])
  assert.deepEqual((await client.view('osaka')).accepted, before.accepted)
  const rejected = await client.command('osaka', { kind: 'decide', action: 'reject', proposalId: proposal.id }, 'reject-1')
  assert.deepEqual(rejected.accepted, before.accepted)
  assert.deepEqual(rejected.memory.summaries, before.memory.summaries)
})
