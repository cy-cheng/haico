export type ProviderFetch = (url: string, init: RequestInit) => Promise<Response>

type ProviderOperation =
  | { provider: 'anthropic'; operation: 'extract' | 'ground' | 'summarize' | 'draft' | 'revise'; requestedModel: string }
  | { provider: 'whisper'; operation: 'transcribe'; requestedModel: string; sourceId: string }
  | { provider: 'google_places'; operation: 'search' | 'facts' }

type Failure = 'transport' | 'timeout' | 'http' | 'invalid_response' | 'refused' | 'incomplete'
  | 'missing_audio' | 'unsupported_audio' | 'no_speech'

type Usage = { inputTokens?: number; outputTokens?: number; cacheReadInputTokens?: number;
  cacheCreationInputTokens?: number; audioSeconds?: number }

type AttemptDetails = { httpStatus?: number; model?: string; usage?: Usage }

export type ProviderAttempt = ProviderOperation & AttemptDetails & { durationMs: number } &
  ({ status: 'ok' } | { status: 'failed'; reason: Failure })

export type ObserveProvider = (attempt: ProviderAttempt) => void | Promise<void>

const descriptions: Record<Failure, string> = {
  transport: 'could not be reached',
  timeout: 'did not respond before the deadline',
  http: 'rejected the request',
  invalid_response: 'returned an invalid response',
  refused: 'refused to generate a result',
  incomplete: 'did not finish generating a result',
  missing_audio: 'received no audio data',
  unsupported_audio: 'received an unsupported audio format',
  no_speech: 'returned no transcript',
}

export class ProviderError extends Error {
  readonly code: 'UPSTREAM_UNAVAILABLE' | 'MEDIA_UNAVAILABLE'

  constructor(readonly provider: ProviderOperation['provider'], readonly reason: Failure, readonly httpStatus?: number) {
    super(`${provider} ${descriptions[reason]}${httpStatus === undefined ? '' : ` (HTTP ${httpStatus})`}`)
    this.name = 'ProviderError'
    this.code = reason === 'missing_audio' || reason === 'unsupported_audio' || reason === 'no_speech'
      ? 'MEDIA_UNAVAILABLE'
      : 'UPSTREAM_UNAVAILABLE'
  }
}

export function record(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined
}

export function nonNegativeNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : undefined
}

export async function providerAttempt<T>(
  operation: ProviderOperation,
  observe: ObserveProvider | undefined,
  run: (details: AttemptDetails) => Promise<T>,
): Promise<T> {
  const start = performance.now()
  const details: AttemptDetails = {}
  const report = (result: { status: 'ok' } | { status: 'failed'; reason: Failure }) => {
    try {
      void Promise.resolve(observe?.({ ...operation, ...details, ...result, durationMs: performance.now() - start }))
        .catch(() => {})
    } catch {
      // Telemetry must not change the outcome of a provider call.
    }
  }

  try {
    const result = await run(details)
    report({ status: 'ok' })
    return result
  } catch (error) {
    const failure = error instanceof ProviderError ? error : new ProviderError(operation.provider, 'invalid_response')
    report({ status: 'failed', reason: failure.reason })
    throw failure
  }
}

export async function fetchProviderJson(
  provider: ProviderOperation['provider'], fetch: ProviderFetch, url: string, init: RequestInit, details: AttemptDetails,
): Promise<unknown> {
  let response: Response
  try {
    response = await fetch(url, init)
  } catch (error) {
    const timedOut = error instanceof Error && (error.name === 'AbortError' || error.name === 'TimeoutError')
    throw new ProviderError(provider, timedOut ? 'timeout' : 'transport')
  }
  details.httpStatus = response.status
  if (!response.ok) {
    await response.body?.cancel().catch(() => {})
    throw new ProviderError(provider, 'http', response.status)
  }
  try {
    return await response.json() as unknown
  } catch (error) {
    const timedOut = error instanceof Error && (error.name === 'AbortError' || error.name === 'TimeoutError')
    throw new ProviderError(provider, timedOut ? 'timeout' : 'invalid_response', response.status)
  }
}
