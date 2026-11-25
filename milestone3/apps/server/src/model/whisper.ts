import type { TranscriptionPort } from '@waymark/contracts'
import { fetchProviderJson, nonNegativeNumber, ProviderError, providerAttempt, record } from './provider.js'
import type { ObserveProvider, ProviderFetch } from './provider.js'

export const TRANSCRIPTIONS_URL = 'https://api.openai.com/v1/audio/transcriptions'

export function createWhisperTranscription({ fetch, model, observe }: {
  fetch: ProviderFetch
  model: string
  observe?: ObserveProvider
}): TranscriptionPort {
  return {
    transcribe({ audio, sourceId }) {
      return providerAttempt({ provider: 'whisper', operation: 'transcribe', requestedModel: model, sourceId }, observe,
        async (details) => {
          if (audio.length === 0) throw new ProviderError('whisper', 'missing_audio')
          const extension = audioExtension(audio)
          if (!extension) throw new ProviderError('whisper', 'unsupported_audio')

          const form = new FormData()
          form.set('file', new Blob([new Uint8Array(audio)]), `audio.${extension}`)
          form.set('model', model)
          form.set('response_format', 'json')
          const payload = record(await fetchProviderJson('whisper', fetch, TRANSCRIPTIONS_URL, {
            method: 'POST', body: form,
          }, details))

          if (typeof payload?.model === 'string') details.model = payload.model
          const usage = record(payload?.usage)
          const seconds = nonNegativeNumber(usage?.seconds) ?? nonNegativeNumber(payload?.duration)
          if (usage || seconds !== undefined) details.usage = {
            audioSeconds: seconds,
            inputTokens: nonNegativeNumber(usage?.input_tokens),
            outputTokens: nonNegativeNumber(usage?.output_tokens),
          }

          if (typeof payload?.text !== 'string') throw new ProviderError('whisper', 'invalid_response')
          const text = payload.text.trim()
          if (!text) throw new ProviderError('whisper', 'no_speech')
          return { text, sourceId }
        })
    },
  }
}

function audioExtension(bytes: Uint8Array): string | undefined {
  const header = new TextDecoder('latin1').decode(bytes.subarray(0, 12))
  if (header.startsWith('RIFF') && header.slice(8) === 'WAVE') return 'wav'
  if (header.startsWith('OggS')) return 'ogg'
  if (header.startsWith('fLaC')) return 'flac'
  if (header.slice(4, 8) === 'ftyp') return 'mp4'
  if (bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3) return 'webm'
  if (header.startsWith('ID3')) return 'mp3'
  const secondByte = bytes[1]
  if (bytes[0] === 0xff && secondByte !== undefined && (secondByte & 0xe0) === 0xe0 && (secondByte & 0x06) !== 0) {
    return 'mp3'
  }
  if (bytes[0] === 0 && bytes[1] === 0 && bytes[2] === 1 && bytes[3] === 0xba) return 'mpeg'
}
