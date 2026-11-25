import type { DraftResult } from '@waymark/contracts'
import { ANTHROPIC_MESSAGES_URL } from './anthropic.js'
import type { ProviderFetch } from './provider.js'
import { TRANSCRIPTIONS_URL } from './whisper.js'

export type ReplayStep = { url: string; method: string; body: unknown; status?: number }

export function replayFetch(...steps: ReplayStep[]): ProviderFetch {
  let position = 0
  return async (url, { method = 'GET' }) => {
    const step = steps[position]
    if (url !== step?.url || method !== step.method) {
      throw new Error(`Unexpected request for provider replay at step ${position + 1}`)
    }
    position++
    return Response.json(step.body, { status: step.status ?? 200 })
  }
}

export const fixtureModels = { extraction: 'claude-haiku-4-5', planning: 'claude-sonnet-4-6' }

export function anthropicReply(model: string, output: unknown) {
  return {
    id: 'msg_waymark_fixture', type: 'message', role: 'assistant', model,
    content: [{ type: 'text', text: JSON.stringify(output), citations: null }],
    stop_reason: 'end_turn', stop_sequence: null,
    usage: { input_tokens: 105, output_tokens: 52, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 },
  }
}

export function replayAnthropic(body: unknown, status?: number): ReplayStep {
  return { url: ANTHROPIC_MESSAGES_URL, method: 'POST', body, status }
}

export function replayWhisper(body: unknown, status?: number): ReplayStep {
  return { url: TRANSCRIPTIONS_URL, method: 'POST', body, status }
}

// Synthetic wire responses. The text and source IDs match the milestone scenarios, not live recordings.
export const nishikiExtraction = replayAnthropic(anthropicReply('claude-haiku-4-5-20251001', {
  mentions: [{ label: 'Nishiki Market', city: 'Kyoto', sourceIds: ['m1', 'ky1'] }],
}))

export const riversideExtraction = replayAnthropic(anthropicReply('claude-haiku-4-5-20251001', {
  mentions: [{ label: 'Riverside café', city: null, sourceIds: ['riverside-share'] }],
}))

export const gionRevision = replayAnthropic(anthropicReply(fixtureModels.planning, {
  kind: 'patch',
  changes: [
    { kind: 'add_stop', date: '2026-11-21', candidateId: 'yasaka',
      start: '2026-11-21T14:00:00+09:00', end: '2026-11-21T14:40:00+09:00' },
    { kind: 'add_stop', date: '2026-11-21', candidateId: 'hanamikoji',
      start: '2026-11-21T15:00:00+09:00', end: '2026-11-21T15:45:00+09:00' },
  ],
  sourceIds: ['ky1'], warnings: [],
} satisfies DraftResult))

export const osakaRevision = replayAnthropic(anthropicReply(fixtureModels.planning, {
  kind: 'patch', changes: [
    { kind: 'retime_day', date: '2026-11-22', departAt: '2026-11-22T11:00:00+09:00' },
    { kind: 'remove_stop', stopId: 'sCastle' },
  ],
  sourceIds: ['m3'], warnings: [],
} satisfies DraftResult))

export const nishikiTranscript = replayWhisper({ text: ' 錦市場でお昼を食べよう。 ', usage: { type: 'duration', seconds: 2 } })
export const silentTranscript = replayWhisper({ text: '   ' })
export const transcriptionUnavailable = replayWhisper({ error: { message: 'Service unavailable' } }, 503)

export function waveSample(): Uint8Array {
  return Uint8Array.of(
    82, 73, 70, 70, 38, 0, 0, 0, 87, 65, 86, 69, 102, 109, 116, 32, 16, 0, 0, 0,
    1, 0, 1, 0, 128, 62, 0, 0, 0, 125, 0, 0, 2, 0, 16, 0, 100, 97, 116, 97, 2, 0, 0, 0, 0, 0,
  )
}
