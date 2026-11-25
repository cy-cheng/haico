// Waymark v1. These declarations are shared by the web client, Discord adapter and server.
export type Id = string
export type Actor = { memberId: Id } // Created by the server from an authenticated session or Gateway event.
export type Member = { id: Id; name: string }
export type ReadScope =
  | { mode: 'from_now' | 'history' }
  | { mode: 'from_message'; messageId: Id }

// A summary selects raw messages inside the already authorized collection window.
export type SummaryRange =
  | { mode: 'from_reply' | 'from_here'; messageId: Id }
  | { mode: 'all_earlier' }
export type Reaction = 'heart' | 'check' | 'minus' | 'cross'
export type SavedSummary = {
  id: Id; range: SummaryRange; firstAt: string; lastAt: string; messageCount: number
  notes: { id: Id; state: 'decided' | 'undecided'; text: string; sourceIds: Id[] }[]
  poll: { id: Id; question: string; options: { id: Id; label: string; voterIds: Id[] }[] } | null
}
export type Source = {
  id: Id; authorId: Id; text: string; url: string | null; at: string
  sharedPost?: { url: string; platform: string; author: string | null; thumbnailUrl: string | null }
}
export type ScopedSource = {
  tripId: Id; epoch: number; source: Source
  media: { kind: 'link' | 'image' | 'video' | 'audio'; url: string }[]
}
export type Place = {
  id: Id; name: string; coordinates: { lat: number; lng: number } | null
}
export type Candidate = {
  id: Id; label: string; state: 'unresolved' | 'resolved' | 'excluded'
  place: Place | null; choices: Place[]; sourceIds: Id[]
  votes: { memberId: Id; value: Reaction }[]
  tags?: string[]; description?: string
}
export type Preference = {
  id: Id; memberId: Id; text: string; confirmed: boolean; sourceIds: Id[]
}
export type MemorySnapshot = {
  summaries: SavedSummary[]
  revision: number; candidates: Candidate[]; preferences: Preference[]; sources: Source[]
}
export type MemoryEdit =
  | { kind: 'resolve'; candidateId: Id; placeId: Id }
  | { kind: 'add_place'; label: string; url?: string; placeId?: Id }
  | { kind: 'exclude'; candidateId: Id }
  | { kind: 'preference'; preferenceId: Id; text: string; confirmed: boolean }
  | { kind: 'vote'; candidateId: Id; value: Reaction | null }
  | { kind: 'edit_note'; summaryId: Id; noteId: Id; text: string }
  | { kind: 'vote_option'; summaryId: Id; pollId: Id; optionId: Id | null }

export type Mode = 'walk' | 'rail' | 'bus' | 'taxi' | 'bike' | 'drive'
export type RouteOption = {
  id: Id; minutes: number | null; fare: { amount: number; currency: string } | null
  transfers: number | null; steps: { mode: Mode; label: string; minutes: number | null }[]
}
export type Stop = {
  id: Id; candidateId: Id; start: string; end: string; sourceIds: Id[]
}
export type Leg = {
  fromStopId: Id; toStopId: Id; mode: Mode | 'transit'; minutes: number | null; route?: RouteOption
}
export type Branch = { memberIds: Id[]; stops: Stop[]; legs: Leg[] }
export type Day = {
  date: string; departAt: string; stops: Stop[]; legs: Leg[]
  split: { afterStopId: Id; branches: [Branch, Branch]; meetingStopId: Id } | null
}
export type Itinerary = { days: Day[] }
export type AcceptedPlan = { version: number; itinerary: Itinerary; confirmedBy: Id[] }
export type ManualChange =
  | { kind: 'add_stop'; date: string; candidateId: Id; start: string; end: string }
  | { kind: 'remove_stop'; stopId: Id }
  | { kind: 'retime'; stopId: Id; start: string; end: string }
  | { kind: 'retime_day'; date: string; departAt: string }
  | { kind: 'reorder'; date: string; stopIds: Id[] }
  | { kind: 'split'; date: string; split: Day['split'] }
  | { kind: 'choose_route'; fromStopId: Id; toStopId: Id; optionId: Id }
export type PlanRequest =
  | { kind: 'draft' }
  | { kind: 'revise'; instruction: string }
  | { kind: 'manual'; changes: ManualChange[] }
export type Base = { planVersion: number; memoryRevision: number }
export type Warning = { code: string; message: string; stopId?: Id }
export type Proposal = {
  id: Id; base: Base; status: 'pending' | 'accepted' | 'rejected' | 'stale'
  preview: Itinerary; differences: string[]; warnings: Warning[]; sourceIds: Id[]
}
export type Outcome =
  | { kind: 'proposal'; proposalId: Id }
  | { kind: 'clarify'; question: string }
  | { kind: 'memory'; revision: number }
  | { kind: 'summary'; summaryId: Id; sourceIds: Id[] }
export type ApiError = { error: { code: string; message: string; current?: Base } }
export type Job =
  | { id: Id; status: 'queued' | 'running' | 'cancelled' }
  | { id: Id; status: 'succeeded'; result: Outcome }
  | { id: Id; status: 'failed'; error: ApiError['error'] }
export type JobRef = { jobId: Id }

export type TripInfo = {
  id: Id; name: string; channelId: Id; timezone: string; firstDate: string; lastDate: string
}
export type TripView = {
  trip: TripInfo; members: Member[]; collection: 'inactive' | 'active' | 'paused'
  epoch: number; scope: ReadScope | null; memory: MemorySnapshot
  accepted: AcceptedPlan | null; pending: Proposal[]
}
export type NewTrip = Omit<TripInfo, 'id'>
export type SyncCommand =
  | { kind: 'collect'; scope: ReadScope }
  | { kind: 'pause' }
  | { kind: 'edit_memory'; memoryRevision: number; edit: MemoryEdit }
  | { kind: 'decide'; proposalId: Id; action: 'apply' | 'reject' }
  | { kind: 'confirm' | 'unconfirm'; planVersion: number }
export type AsyncCommand =
  | { kind: 'summarize'; range: SummaryRange }
  | { kind: 'plan'; base: Base; request: PlanRequest; replacesProposalId?: Id }
  | { kind: 'answer'; jobId: Id; text: string }
export type Command = SyncCommand | AsyncCommand

// Session and event identity enter through B. Ports below run inside the shared server.
export interface TripPort {
  list(actor: Actor): Promise<TripInfo[]>
  forChannel(actor: Actor, channelId: Id): Promise<TripInfo | null>
  create(actor: Actor, input: NewTrip, key: Id): Promise<TripInfo>
  join(actor: Actor, tripId: Id, key: Id): Promise<TripView>
  view(actor: Actor, tripId: Id): Promise<TripView>
  proposal(actor: Actor, tripId: Id, proposalId: Id): Promise<Proposal>
  searchPlaces(actor: Actor, tripId: Id, query: string): Promise<Place[]>
  routeOptions(actor: Actor, tripId: Id, version: number, fromStopId: Id, toStopId: Id, modes: Mode[]): Promise<RouteOption[]>
  job(actor: Actor, tripId: Id, jobId: Id): Promise<Job>
  calendar(actor: Actor, tripId: Id, version: number): Promise<string>
  onMessage(channelId: Id, source: Source, media: ScopedSource['media']): Promise<JobRef | null>
  run(actor: Actor, tripId: Id, cmd: SyncCommand, key: Id): Promise<TripView>
  run(actor: Actor, tripId: Id, cmd: AsyncCommand, key: Id): Promise<JobRef>
}
export type PlaceFacts = {
  placeId: Id; openingIntervals: { start: string; end: string }[] | null
}
export interface MemoryPort {
  ingest(input: ScopedSource): Promise<void>
  snapshot(tripId: Id): Promise<MemorySnapshot>
  edit(actor: Actor, tripId: Id, atRevision: number, edit: MemoryEdit): Promise<void>
  summarize(tripId: Id, range: SummaryRange, allowedSources: Source[]): Promise<Extract<Outcome, { kind: 'summary' }>>
  searchPlaces(tripId: Id, query: string): Promise<Place[]>
  facts(placeId: Id, date: string, timezone: string): Promise<PlaceFacts>
}
export interface TranscriptionPort {
  transcribe(input: { sourceId: Id; audio: Uint8Array }): Promise<{ text: string; sourceId: Id }>
}
export type GenerationInput = {
  trip: TripInfo; members: Member[]; memory: MemorySnapshot; accepted: AcceptedPlan | null
  request: PlanRequest; requestSourceId: Id; answers: Source[]; editing: Proposal | null
}
export type DraftResult =
  | { kind: 'drafted'; preview: Itinerary; sourceIds: Id[]; warnings: Warning[] }
  | { kind: 'patch'; changes: ManualChange[]; sourceIds: Id[]; warnings: Warning[] }
  | Extract<Outcome, { kind: 'clarify' }>
export interface PlannerPort {
  generate(input: GenerationInput): Promise<DraftResult>
}
export interface ReviewPort {
  accepted(tripId: Id): Promise<AcceptedPlan | null>
  pending(tripId: Id): Promise<Proposal[]>
  get(tripId: Id, proposalId: Id): Promise<Proposal>
  propose(tripId: Id, base: Base, draft: Exclude<DraftResult, {kind: 'clarify'}>, replacesProposalId?: Id): Promise<Proposal>
  decide(actor: Actor, tripId: Id, proposalId: Id, action: 'apply' | 'reject', key: Id): Promise<void>
  setConfirmation(actor: Actor, tripId: Id, version: number, confirmed: boolean, key: Id): Promise<void>
  calendar(tripId: Id, version: number): Promise<string>
}
export interface ModelPort {
  generate(input: {
    task: 'extract' | 'ground' | 'summarize' | 'draft' | 'revise'; instruction: string; text: string; images?: string[]
    jsonSchema: Record<string, unknown>
  }): Promise<unknown>
}
export interface RoutesPort {
  options(fromPlaceId: Id, toPlaceId: Id, departAt: string, modes: Mode[]): Promise<RouteOption[]>
}
