import type { ModelPort } from '@waymark/contracts'
import { fetchProviderJson, nonNegativeNumber, ProviderError, providerAttempt, record } from './provider.js'
import type { ObserveProvider, ProviderFetch } from './provider.js'

export const ANTHROPIC_MESSAGES_URL = 'https://api.anthropic.com/v1/messages'

export function createAnthropicModel({ fetch, models, maxTokens = 4096, observe }: {
  fetch: ProviderFetch
  models: { extraction: string; planning: string }
  maxTokens?: number
  observe?: ObserveProvider
}): ModelPort {
  return {
    generate(input) {
      const model = input.task === 'draft' || input.task === 'revise' ? models.planning : models.extraction
      return providerAttempt({ provider: 'anthropic', operation: input.task, requestedModel: model }, observe,
        async (details) => {
          const payload = record(await fetchProviderJson('anthropic', fetch, ANTHROPIC_MESSAGES_URL, {
            method: 'POST',
            headers: { 'content-type': 'application/json', 'anthropic-version': '2023-06-01' },
            body: JSON.stringify({
              model,
              max_tokens: maxTokens,
              system: input.instruction,
              messages: [{ role: 'user', content: [
                { type: 'text', text: input.text },
                ...(input.images ?? []).map(imageBlock),
              ] }],
              output_config: { format: { type: 'json_schema', schema: input.jsonSchema } },
            }),
          }, details))

          if (typeof payload?.model === 'string') details.model = payload.model
          const usage = record(payload?.usage)
          if (usage) details.usage = {
            inputTokens: nonNegativeNumber(usage.input_tokens),
            outputTokens: nonNegativeNumber(usage.output_tokens),
            cacheReadInputTokens: nonNegativeNumber(usage.cache_read_input_tokens),
            cacheCreationInputTokens: nonNegativeNumber(usage.cache_creation_input_tokens),
          }

          return parseMessage(payload)
        })
    },
  }
}

function imageBlock(image: string) {
  const data = /^data:(image\/(?:jpeg|png|gif|webp));base64,([A-Za-z0-9+/]+={0,2})$/u.exec(image)
  const source = data
    ? { type: 'base64', media_type: data[1], data: data[2] }
    : { type: 'url', url: image }
  return { type: 'image', source }
}

function parseMessage(payload: Record<string, unknown> | undefined): unknown {
  if (payload?.stop_reason === 'refusal') throw new ProviderError('anthropic', 'refused')
  if (payload?.stop_reason === 'max_tokens' || payload?.stop_reason === 'model_context_window_exceeded') {
    throw new ProviderError('anthropic', 'incomplete')
  }
  if (payload?.type !== 'message' || payload.stop_reason !== 'end_turn' || !Array.isArray(payload.content)) {
    throw new ProviderError('anthropic', 'invalid_response')
  }
  const text = payload.content.flatMap((value: unknown) => {
    const block = record(value)
    if (block?.type !== 'text') return []
    if (typeof block.text !== 'string') throw new ProviderError('anthropic', 'invalid_response')
    return [block.text]
  }).join('')
  return JSON.parse(text) as unknown
}
