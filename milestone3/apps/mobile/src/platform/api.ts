import type {
  ApiError, AsyncCommand, Command, Id, Job, JobRef, Member, Mode, NewTrip, Place,
  Proposal, RouteOption, SyncCommand, TripInfo, TripView,
} from '@waymark/contracts'

export interface WaymarkClient {
  me(): Promise<Member>
  trips(): Promise<TripInfo[]>
  create(trip: NewTrip, key: string): Promise<TripInfo>
  join(tripId: Id, key: string): Promise<TripView>
  view(tripId: Id): Promise<TripView>
  proposal(tripId: Id, proposalId: Id): Promise<Proposal>
  job(tripId: Id, jobId: Id): Promise<Job>
  search(tripId: Id, query: string): Promise<Place[]>
  routes(tripId: Id, version: number, from: Id, to: Id, modes: Mode[]): Promise<RouteOption[]>
  calendar(tripId: Id, version: number): Promise<string>
  command(tripId: Id, command: SyncCommand, key: string): Promise<TripView>
  command(tripId: Id, command: AsyncCommand, key: string): Promise<JobRef>
}

export class RequestError extends Error {
  constructor(readonly status: number, readonly detail: ApiError['error']) {
    super(detail.message)
    this.name = 'RequestError'
  }
}

export type SessionSource = {
  accessToken(): string | null | Promise<string | null>
  onUnauthorized?(accessToken: string): void | Promise<void>
}

export type Destination = { tripId: string; proposalId?: string; join?: boolean }

let actionSequence = 0
export function actionKey(): string {
  return `mobile-${Date.now().toString(36)}-${(++actionSequence).toString(36)}-${Math.random().toString(36).slice(2)}`
}

function isLocalHost(host: string) {
  if (host === 'localhost' || host === '[::1]') return true
  if (!/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(host)) return false
  const [a, b, c, d] = host.split('.').map(Number)
  if ([a, b, c, d].some((part) => part > 255)) return false
  return a === 127 || a === 10 || (a === 192 && b === 168) || (a === 172 && b >= 16 && b <= 31)
}

export function serverOrigin(value: string): string {
  const input = value.trim()
  const match = /^(https?):\/\/(\[::1\]|[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?)(?::([0-9]{1,5}))?(?:\/(?:api\/v1\/?)?)?$/i.exec(input)
  if (!match) throw new Error('Enter the HTTPS server address, without credentials or a trip path.')
  const [, protocol, host, port] = match
  const hostname = host.toLowerCase()
  const scheme = protocol.toLowerCase()
  if (scheme === 'http' && !isLocalHost(hostname)) {
    throw new Error('Use an HTTPS address. HTTP is available only on this device or a private network.')
  }
  if (port && (+port < 1 || +port > 65535)) throw new Error('Enter a valid server port.')
  return `${scheme}://${hostname}${port ? `:${Number(port)}` : ''}`
}

export function createApiClient(address: string, session: SessionSource, http: typeof fetch = fetch): WaymarkClient {
  const base = `${serverOrigin(address)}/api/v1`
  const tripPath = (id: Id) => `/trips/${encodeURIComponent(id)}`
  const query = (path: string, values: Record<string, string | number>) => `${path}?${Object.entries(values)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`).join('&')}`

  async function request<T>(path: string, opts: { post?: boolean; data?: object; key?: string; text?: boolean } = {}): Promise<T> {
    const token = await session.accessToken()
    if (!token) throw new RequestError(401, { code: 'UNAUTHENTICATED', message: 'Sign in to open this trip.' })
    const headers: Record<string, string> = {
      Accept: opts.text ? 'text/calendar' : 'application/json', Authorization: `Bearer ${token}`,
    }
    if (opts.data) headers['Content-Type'] = 'application/json'
    if (opts.key) headers['Idempotency-Key'] = opts.key
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 15_000)
    try {
      let response: Response
      try {
        response = await http(`${base}${path}`, {
          method: opts.post ? 'POST' : 'GET', headers, signal: controller.signal,
          body: opts.data ? JSON.stringify(opts.data) : undefined,
        })
      } catch {
        throw new Error(controller.signal.aborted ? 'The server took too long to respond.' : 'Could not reach the trip server. Check its address and your connection.')
      }
      if (!response.ok) {
        if (response.status === 401) await session.onUnauthorized?.(token)
        const parsed = await response.json().catch(() => null) as Partial<ApiError> | null
        const fallbackMessage = response.status === 403 ? 'This Discord account cannot open the trip.' : `The trip server returned ${response.status}.`
        throw new RequestError(response.status, parsed?.error?.message ? parsed.error : { code: `HTTP_${response.status}`, message: fallbackMessage })
      }
      return (opts.text ? await response.text() : await response.json()) as T
    } finally {
      clearTimeout(timer)
    }
  }

  function command(id: Id, command: SyncCommand, key: string): Promise<TripView>
  function command(id: Id, command: AsyncCommand, key: string): Promise<JobRef>
  function command(id: Id, command: Command, key: string) {
    return request<TripView | JobRef>(`${tripPath(id)}/commands`, { post: true, data: command, key })
  }

  return {
    me: () => request<Member>('/me'),
    trips: () => request<TripInfo[]>('/trips'),
    create: (data, key) => request<TripInfo>('/trips', { post: true, data, key }),
    join: (id, key) => request<TripView>(`${tripPath(id)}/join`, { post: true, key }),
    view: (id) => request<TripView>(tripPath(id)),
    proposal: (id, proposal) => request<Proposal>(`${tripPath(id)}/proposals/${encodeURIComponent(proposal)}`),
    job: (id, job) => request<Job>(`${tripPath(id)}/jobs/${encodeURIComponent(job)}`),
    search: (id, q) => request<Place[]>(query(`${tripPath(id)}/places/search`, { q })),
    routes: (id, version, from, to, modes) => request<RouteOption[]>(query(`${tripPath(id)}/routes`, { version, from, to, modes: modes.join(',') })),
    calendar: (id, version) => request<string>(query(`${tripPath(id)}/calendar.ics`, { version }), { text: true }),
    command,
  }
}
