import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createAnthropicModel, createWhisperTranscription, ProviderError } from './index.js'
import type { ProviderAttempt } from './index.js'
import {
  anthropicReply, fixtureModels, gionRevision, nishikiExtraction, nishikiTranscript, replayAnthropic,
  replayFetch, riversideExtraction, silentTranscript, transcriptionUnavailable, waveSample,
} from './fixtures.js'

const schema = {
  type: 'object',
  properties: { mentions: { type: 'array', items: {
    type: 'object', properties: { label: { type: 'string' }, city: { type: ['string', 'null'] },
      sourceIds: { type: 'array', items: { type: 'string' } } }, required: ['label', 'city', 'sourceIds'],
    additionalProperties: false,
  } } },
  required: ['mentions'],
  additionalProperties: false,
}
const extraction = { task: 'extract' as const, instruction: 'Extract places with source IDs.',
  text: 'm1 and ky1 mention Nishiki Market.', jsonSchema: schema }

test('Anthropic replays extraction and revision using separate model tiers and structured output', async () => {
  const replay = replayFetch(nishikiExtraction, riversideExtraction, gionRevision)
  const requests: Record<string, unknown>[] = []
  const attempts: ProviderAttempt[] = []
  const model = createAnthropicModel({ models: fixtureModels, observe: attempt => { attempts.push(attempt) },
    fetch: (url, init) => {
      requests.push(JSON.parse(String(init.body)))
      assert.equal(new Headers(init.headers).get('anthropic-version'), '2023-06-01')
      return replay(url, init)
    },
  })

  assert.deepEqual(await model.generate({ ...extraction, images: ['https://example.test/nishiki.webp',
    'data:image/jpeg;base64,/9j/'] }), {
    mentions: [{ label: 'Nishiki Market', city: 'Kyoto', sourceIds: ['m1', 'ky1'] }],
  })
  assert.deepEqual(await model.generate({ ...extraction, text: 'riverside-share: Riverside café' }), {
    mentions: [{ label: 'Riverside café', city: null, sourceIds: ['riverside-share'] }],
  })
  const revisionSchema = { type: 'object', additionalProperties: false }
  assert.deepEqual(await model.generate({ ...extraction, task: 'revise', text: 'Schedule Yasaka Shrine on day 2.',
    jsonSchema: revisionSchema }), {
    kind: 'patch', changes: [
      { kind: 'add_stop', date: '2026-11-21', candidateId: 'yasaka',
        start: '2026-11-21T14:00:00+09:00', end: '2026-11-21T14:40:00+09:00' },
      { kind: 'add_stop', date: '2026-11-21', candidateId: 'hanamikoji',
        start: '2026-11-21T15:00:00+09:00', end: '2026-11-21T15:45:00+09:00' },
    ], sourceIds: ['ky1'], warnings: [],
  })

  assert.deepEqual(requests[0], {
    model: fixtureModels.extraction, max_tokens: 4096, system: extraction.instruction,
    messages: [{ role: 'user', content: [
      { type: 'text', text: extraction.text },
      { type: 'image', source: { type: 'url', url: 'https://example.test/nishiki.webp' } },
      { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: '/9j/' } },
    ] }],
    output_config: { format: { type: 'json_schema', schema } },
  })
  assert.equal(requests[2].model, fixtureModels.planning)
  assert.deepEqual(requests[2].output_config, { format: { type: 'json_schema', schema: revisionSchema } })
  assert.ok(attempts[0].provider === 'anthropic')
  assert.equal(attempts[0].model, 'claude-haiku-4-5-20251001')
  assert.equal(attempts[0].requestedModel, fixtureModels.extraction)
  assert.equal(attempts[0].usage?.inputTokens, 105)
  assert.equal(attempts[0].httpStatus, 200)
  assert.ok(attempts[0].durationMs >= 0)
})

test('Anthropic reports refusals, token limits, and invalid JSON even on HTTP 200', async () => {
  const valid = anthropicReply(fixtureModels.extraction, { mentions: [] })
  const model = createAnthropicModel({ models: fixtureModels, fetch: replayFetch(
    replayAnthropic({ ...valid, stop_reason: 'refusal' }), replayAnthropic({ ...valid, stop_reason: 'max_tokens' }),
    replayAnthropic({ ...valid, content: [{ type: 'text', text: 'not JSON' }] }),
  ) })
  for (const reason of ['refused', 'incomplete', 'invalid_response']) {
    await assert.rejects(model.generate(extraction), { code: 'UPSTREAM_UNAVAILABLE', reason })
  }
})

test('network errors are distinct from timeouts and do not expose transport details', async () => {
  const model = createAnthropicModel({ models: fixtureModels, fetch: async () => { throw new Error('private request URL') } })
  const timeout = createAnthropicModel({ models: fixtureModels,
    fetch: async () => { throw new DOMException('private request URL', 'TimeoutError') } })
  await assert.rejects(model.generate(extraction), (err: unknown) =>
    err instanceof ProviderError && err.reason === 'transport' && !err.message.includes('private request URL'))
  await assert.rejects(timeout.generate(extraction), { code: 'UPSTREAM_UNAVAILABLE', reason: 'timeout' })
})

test('Whisper retains source ID, detects the audio file format and reports duration when available', async () => {
  const replay = replayFetch(nishikiTranscript)
  const attempts: ProviderAttempt[] = []
  const whisper = createWhisperTranscription({ model: 'whisper-1', observe: attempt => { attempts.push(attempt) },
    fetch: async (url, init) => {
      assert.ok(init.body instanceof FormData)
      assert.equal(init.body.get('model'), 'whisper-1')
      assert.equal(init.body.get('response_format'), 'json')
      const file = init.body.get('file')
      assert.ok(file instanceof File)
      assert.equal(file.name, 'audio.wav')
      assert.deepEqual(new Uint8Array(await file.arrayBuffer()), waveSample())
      assert.equal(new Headers(init.headers).has('content-type'), false)
      return replay(url, init)
    },
  })
  assert.deepEqual(await whisper.transcribe({ sourceId: 'm1', audio: waveSample() }),
    { sourceId: 'm1', text: '錦市場でお昼を食べよう。' })
  assert.equal(attempts[0].provider === 'whisper' && attempts[0].sourceId, 'm1')
  assert.equal(attempts[0].usage?.audioSeconds, 2)
})

test('missing, unsupported, and silent audio are distinct from Whisper being down', async () => {
  const whisper = createWhisperTranscription({ model: 'whisper-1',
    fetch: replayFetch(silentTranscript, transcriptionUnavailable) })
  await assert.rejects(whisper.transcribe({ sourceId: 'm1', audio: new Uint8Array() }),
    { code: 'MEDIA_UNAVAILABLE', reason: 'missing_audio' })
  await assert.rejects(whisper.transcribe({ sourceId: 'm1', audio: new TextEncoder().encode('<html>') }),
    { code: 'MEDIA_UNAVAILABLE', reason: 'unsupported_audio' })
  await assert.rejects(whisper.transcribe({ sourceId: 'm1', audio: waveSample() }),
    { code: 'MEDIA_UNAVAILABLE', reason: 'no_speech' })
  await assert.rejects(whisper.transcribe({ sourceId: 'm1', audio: waveSample() }),
    { code: 'UPSTREAM_UNAVAILABLE', reason: 'http', httpStatus: 503 })
})
