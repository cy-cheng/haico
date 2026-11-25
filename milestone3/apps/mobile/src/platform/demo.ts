import type {
  AcceptedPlan, AsyncCommand, Candidate, Command, Day, Itinerary, Job, JobRef, ManualChange,
  Member, Outcome, Place, Proposal, RouteOption, Source, Stop, SyncCommand, TripView,
} from '@waymark/contracts'
import data from '../../../../fixtures/trip-view.json'
import day3Patch from '../../../../fixtures/day3-patch.json'
import { RequestError, type WaymarkClient } from './api'

const copy = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const asTime = (date: string, time: string) => `${date}T${time}:00+09:00`
const stop = (day: Day, id: string, candidate: Candidate, start: string, end: string): Stop => ({
  id, candidateId: candidate.id, start: asTime(day.date, start), end: asTime(day.date, end), sourceIds: [...candidate.sourceIds],
})

const extraPlaces: Record<string, [string, number, number, string]> = {
  castle: ['Osaka', 34.6873, 135.5262, '1-1 Osakajo, Chuo Ward'],
  lunch: ['Osaka', 34.6528, 135.5062, 'Shinsekai, Naniwa Ward'],
  namba: ['Osaka', 34.6674, 135.5003, 'Namba, Chuo Ward'],
  umeda: ['Osaka', 34.7053, 135.4906, '1-1-88 Oyodonaka, Kita Ward'],
  tsuten: ['Osaka', 34.6525, 135.5063, '1-18-6 Ebisuhigashi, Naniwa Ward'],
  bamboo: ['Kyoto', 35.0171, 135.6714, 'Sagaogurayama Tabuchiyamacho, Ukyo Ward'],
  nishiki: ['Kyoto', 35.005, 135.765, 'Nishikikoji-dori, Nakagyo Ward, Kyoto'],
}

const café: Place = {
  id: 'place-cafe', name: 'Riverside Café (sample)', city: 'Kyoto', address: 'Kamogawa, Kyoto (sample)',
  coordinates: { lat: 35.006, lng: 135.770 },
}

const sampleRoutes: RouteOption[] = [
  { id: 'demo-rail', minutes: 22, fare: { amount: 240, currency: 'JPY' }, transfers: 1, steps: [
    { mode: 'walk', label: 'Walk to the station', minutes: 6 },
    { mode: 'rail', label: 'Take the local train', minutes: 11 },
    { mode: 'walk', label: 'Walk to the next stop', minutes: 5 },
  ] },
  { id: 'demo-bus', minutes: 31, fare: null, transfers: 0, steps: [
    { mode: 'bus', label: 'Take the local bus', minutes: 24 },
    { mode: 'walk', label: 'Walk to the next stop', minutes: 7 },
  ] },
]

const baseFixture = (): TripView => {
  const trip = copy(data as TripView)
  for (const candidate of trip.memory.candidates) {
    const entry = extraPlaces[candidate.id]
    if (!entry || !candidate.place) continue
    const [city, lat, lng, address] = entry
    candidate.place = { ...candidate.place, city, address, coordinates: { lat, lng } }
  }
  const nishiki = trip.memory.candidates.find((candidate) => candidate.id === 'nishiki')
  if (nishiki) {
    nishiki.tags = ['Food']
    nishiki.description = 'A narrow market street with tamagoyaki, pickles, and seafood skewers.'
  }
  for (const candidate of trip.memory.candidates) if (!candidate.tags?.length) candidate.tags = [candidate.id === 'lunch' ? 'Food' : candidate.id === 'namba' ? 'Transit' : 'Sights']
  if (!trip.memory.candidates.some((candidate) => candidate.id === 'riverside')) {
    trip.memory.candidates.push({ id: 'riverside', label: 'Riverside café', state: 'unresolved', place: null, choices: [café], sourceIds: ['demo-cafe'], votes: [], tags: ['Food'] })
    trip.memory.sources.push({ id: 'demo-cafe', origin: 'discord', authorId: 'ben', url: null, at: '2026-11-19T18:07:00+09:00',
      text: 'Could we stop at the Riverside café?', importState: { status: 'needs_details', jobId: 'demo-cafe' } })
  }
  if (!trip.memory.sources.some((source) => source.importState?.status === 'failed')) {
    trip.memory.sources.push({ id: 'demo-failed', origin: 'discord', authorId: 'yuki', url: null, at: '2026-11-19T18:08:00+09:00',
      text: 'Shared a clip with no accessible location.', importState: { status: 'failed', jobId: 'demo-failed', reason: 'The original clip was not accessible.' } })
  }
  for (const source of trip.memory.sources) {
    if (source.id === 'm1' || source.id === 'ky1') source.importState ??= { status: 'imported', jobId: source.id }
  }
  if (!trip.memory.sources.some((source) => source.id === 'm3')) trip.memory.sources.push({
    id: 'm3', origin: 'discord', authorId: 'mia', url: null, at: '2026-11-19T18:09:00+09:00',
    text: 'On Day 3, leave at 11:00 and skip Osaka Castle.',
  })
  return trip
}

export function createDemoClient(memberId = 'alex', scenario: 'standard' | 'no-summary' | 'empty' = 'standard'): WaymarkClient {
  const state = baseFixture()
  const actor = state.members.find((member) => member.id === memberId) ?? state.members[0]
  const jobs = new Map<string, Job>()
  const proposals = new Map<string, Proposal>()
  const versions = new Map<number, AcceptedPlan>()
  const seen = new Map<string, { command: string; result: TripView | JobRef }>()
  let sequence = 0
  if (scenario === 'no-summary') state.memory.summaries = []
  if (scenario === 'empty') state.accepted = null
  if (state.accepted) versions.set(state.accepted.version, copy(state.accepted))

  const current = () => ({ planVersion: state.accepted?.version ?? 0, memoryRevision: state.memory.revision })
  const snapshot = () => copy({ ...state, pending: Array.from(proposals.values()).filter((proposal) => proposal.status === 'pending') })
  const fail = (status: number, code: string, message: string): never => { throw new RequestError(status, { code, message, ...(status === 409 ? { current: current() } : {}) }) }
  const checkTrip = (id: string) => { if (id !== state.trip.id) fail(404, 'NOT_FOUND', 'This trip is not in the preview.') }
  const candidate = (id: string): Candidate => state.memory.candidates.find((entry) => entry.id === id) ?? fail(404, 'NOT_FOUND', 'This place does not exist.')
  const source = (id: string): Source => state.memory.sources.find((entry) => entry.id === id) ?? fail(404, 'NOT_FOUND', 'This source does not exist.')
  const proposal = (id: string): Proposal => proposals.get(id) ?? fail(404, 'NOT_FOUND', 'This preview does not exist.')
  const job = (id: string): Job => jobs.get(id) ?? fail(404, 'NOT_FOUND', 'This work item does not exist.')

  function finish(result: Outcome, id = `j-demo-${++sequence}`): JobRef {
    jobs.set(id, { id, status: 'succeeded', result })
    return { jobId: id }
  }

  function makeProposal(preview: Itinerary, differences: string[], sourceIds: string[], id = `p-demo-${++sequence}`) {
    proposals.set(id, { id, base: current(), status: 'pending', preview, differences, warnings: [], sourceIds })
    return id
  }

  function manual(preview: Itinerary, changes: ManualChange[]) {
    const differences: string[] = []
    for (const change of changes) {
      if (change.kind === 'retime_day' || change.kind === 'add_stop') {
        let day = preview.days.find((entry) => entry.date === change.date)
        if (!day && change.kind === 'add_stop') {
          day = { date: change.date, departAt: change.start, stops: [], legs: [], split: null }
          preview.days.push(day)
          preview.days.sort((a, b) => a.date.localeCompare(b.date))
        }
        if (!day) continue
        if (change.kind === 'retime_day') {
          differences.push(`Day ${preview.days.indexOf(day) + 1} departure: ${day.departAt.slice(11, 16)} → ${change.departAt.slice(11, 16)}`)
          day.departAt = change.departAt
        } else {
          const entry = candidate(change.candidateId)
          const stops = [...day.stops, ...(day.split?.branches.flatMap((branch) => branch.stops) ?? [])]
          if (stops.some((existing) => existing.start < change.end && change.start < existing.end)) {
            fail(422, 'INVALID_INPUT', 'That time overlaps an existing stop. Choose a free slot.')
          }
          if (change.start < day.departAt) day.departAt = change.start
          day.stops.push({ id: `s-demo-${++sequence}`, candidateId: entry.id, start: change.start, end: change.end, sourceIds: [...entry.sourceIds] })
          day.stops.sort((a, b) => a.start.localeCompare(b.start))
          differences.push(`Add ${entry.label} at ${change.start.slice(11, 16)}`)
        }
      }
      if (change.kind === 'remove_stop') {
        for (const day of preview.days) {
          const entry = day.stops.find((s) => s.id === change.stopId)
          if (!entry) continue
          day.stops = day.stops.filter((s) => s.id !== change.stopId)
          day.legs = day.legs.filter((leg) => leg.fromStopId !== change.stopId && leg.toStopId !== change.stopId)
          differences.push(`Remove ${candidate(entry.candidateId).label} from the day and return it to Drafts`)
        }
      }
      if (change.kind === 'choose_route') {
        const route = sampleRoutes.find((entry) => entry.id === change.optionId) ?? fail(422, 'INVALID_INPUT', 'No preview route matches that option.')
        const leg = preview.days.flatMap((day) => [...day.legs, ...(day.split?.branches.flatMap((branch) => branch.legs) ?? [])])
          .find((entry) => entry.fromStopId === change.fromStopId && entry.toStopId === change.toStopId)
        if (!leg) fail(422, 'INVALID_INPUT', 'That transport segment is no longer in the itinerary.')
        if (leg) Object.assign(leg, { mode: 'transit', route, minutes: route.minutes })
        differences.push(`Use the ${route.steps.some((step) => step.mode === 'rail') ? 'rail' : 'bus'} route (${route.minutes} min)`)
      }
    }
    return differences
  }

  function seedDay3(preview: Itinerary) {
    return manual(preview, day3Patch.changes as ManualChange[])
  }

  if (state.accepted && scenario === 'standard') {
    const preview = copy(state.accepted.itinerary)
    makeProposal(preview, seedDay3(preview), day3Patch.sourceIds, 'p7')
    finish({ kind: 'proposal', proposalId: 'p7' }, 'j7')
  }

  const directions = [
    { id: 'arashiyama', label: 'Arashiyama · Bamboo Grove', sourceIds: ['ky2'] },
    { id: 'gion', label: 'Gion · Old-town stroll', sourceIds: ['ky1'] },
    { id: 'rest', label: 'Keep time free', sourceIds: ['ky2'] },
  ]

  function afternoon(preview: Itinerary, option: string) {
    const day = preview.days.find((day) => day.date === '2026-11-21')
    if (!day) return ['Preview the trip draft']
    if (option === 'rest') return ['Keep Day 2 from 13:15 to 17:30 free']
    if (option === 'arashiyama') {
      day.stops.push(stop(day, `s-demo-${++sequence}`, candidate('bamboo'), '14:30', '16:30'))
      const from = day.stops.at(-2)
      if (from) day.legs.push({ fromStopId: from.id, toStopId: day.stops.at(-1)!.id, mode: 'transit', minutes: null })
      return ['Day 2 · Add Arashiyama Bamboo Grove from 14:30 to 16:30']
    }
    if (option !== 'gion') fail(422, 'INVALID_INPUT', 'Choose one of the afternoon options.')
    const previous = day.stops.at(-1)
    const yasaka = stop(day, `s-demo-${++sequence}`, candidate('yasaka'), '14:00', '14:45')
    const hanamikoji = stop(day, `s-demo-${++sequence}`, candidate('hanamikoji'), '15:00', '16:30')
    if (previous) day.legs.push({ fromStopId: previous.id, toStopId: yasaka.id, mode: 'transit', minutes: null })
    day.legs.push({ fromStopId: yasaka.id, toStopId: hanamikoji.id, mode: 'walk', minutes: 10 })
    day.stops.push(yasaka, hanamikoji)
    return ['Day 2 · Add Yasaka Shrine from 14:00 to 14:45', 'Day 2 · Add Hanamikoji from 15:00 to 16:30']
  }

  function run(command: Command): TripView | JobRef {
    switch (command.kind) {
      case 'plan':
      case 'answer': {
        if (command.kind === 'plan' && (command.base.planVersion !== current().planVersion || command.base.memoryRevision !== current().memoryRevision))
          fail(409, 'STALE_BASE', 'The trip changed. Review the latest version and try again.')
        const replacing = command.kind === 'plan' && command.replacesProposalId ? proposal(command.replacesProposalId) : null
        const preview = copy(replacing?.preview ?? state.accepted?.itinerary ?? (data as TripView).accepted!.itinerary)
        const request = command.kind === 'plan' ? command.request : null
        const selected = command.kind === 'answer'
          ? command.optionId ?? (/gion|祇園/i.test(command.text ?? '') ? 'gion' : /arashiyama/i.test(command.text ?? '') ? 'arashiyama' : 'rest')
          : request?.kind !== 'manual' ? request?.context?.selectedOption?.optionId : undefined
        const instruction = request && request.kind !== 'manual' ? request.instruction ?? '' : ''
        const day3 = /day 3|third day|castle|大阪城|第三天/i.test(instruction) || (request?.kind === 'revise' && request.context?.date === '2026-11-22')
        if (command.kind === 'answer') {
          const previous = job(command.jobId)
          if (previous.status !== 'succeeded' || previous.result.kind !== 'clarify') fail(422, 'INVALID_INPUT', 'That prompt is no longer available.')
        }
        if (request?.kind === 'revise' && !selected && !day3 && !replacing) {
          return finish({ kind: 'clarify', question: 'How should we spend Day 2 from 13:15 to 17:30?', options: directions })
        }
        if (selected && preview.days.find((day) => day.date === '2026-11-21')?.stops.some((s) => ['yasaka', 'hanamikoji', 'bamboo'].includes(s.candidateId))) {
          fail(422, 'INVALID_INPUT', 'There is already a plan for this afternoon.')
        }
        const differences = request?.kind === 'manual' ? manual(preview, request.changes)
          : selected ? afternoon(preview, selected) : day3 ? seedDay3(preview) : ['Draft three days in Osaka and Kyoto']
        const id = makeProposal(preview, differences, selected ? directions.find((option) => option.id === selected)?.sourceIds ?? [] : day3 ? ['m3'] : ['m1', 'm2'])
        if (replacing) replacing.status = 'stale'
        return finish({ kind: 'proposal', proposalId: id })
      }
      case 'decide': {
        const change = proposal(command.proposalId)
        if (change.status !== 'pending' || change.base.planVersion !== current().planVersion || change.base.memoryRevision !== current().memoryRevision) {
          if (change.status === 'pending') change.status = 'stale'
          fail(409, 'STALE_BASE', 'This preview is out of date. The current version has been refreshed.')
        }
        if (command.action === 'reject') change.status = 'rejected'
        else {
          change.status = 'accepted'
          state.accepted = { version: current().planVersion + 1, itinerary: copy(change.preview), confirmedBy: [] }
          versions.set(state.accepted.version, copy(state.accepted))
          for (const other of proposals.values()) if (other.status === 'pending') other.status = 'stale'
        }
        return snapshot()
      }
      case 'confirm':
      case 'unconfirm': {
        const accepted = state.accepted
        if (!accepted || command.planVersion !== accepted.version) return fail(409, 'STALE_BASE', 'Confirm the current itinerary version.')
        accepted.confirmedBy = accepted.confirmedBy.filter((id) => id !== actor.id)
        if (command.kind === 'confirm') accepted.confirmedBy.push(actor.id)
        return snapshot()
      }
      case 'edit_memory': {
        if (state.memory.revision !== command.memoryRevision) fail(409, 'STALE_BASE', 'The trip memory has changed.')
        const edit = command.edit
        if (edit.kind === 'vote') {
          const entry = candidate(edit.candidateId)
          entry.votes = entry.votes.filter((vote) => vote.memberId !== actor.id)
          if (edit.value) entry.votes.push({ memberId: actor.id, value: edit.value })
        } else if (edit.kind === 'set_candidate_note') {
          const entry = candidate(edit.candidateId)
          entry.notes = (entry.notes ?? []).filter((note) => note.memberId !== actor.id)
          if (edit.text) entry.notes.push({ memberId: actor.id, text: edit.text })
        } else if (edit.kind === 'resolve') {
          const entry = candidate(edit.candidateId)
          const place = [...entry.choices, café].find((p) => p.id === edit.placeId) ?? fail(422, 'INVALID_INPUT', 'Choose a matching place.')
          entry.place = place
          entry.label = place.name
          entry.state = 'resolved'
          for (const id of entry.sourceIds) {
            const original = source(id)
            if (original.importState?.status === 'needs_details') original.importState = { ...original.importState, status: 'imported' }
          }
        } else if (edit.kind === 'exclude') {
          candidate(edit.candidateId).state = 'excluded'
        } else {
          fail(422, 'INVALID_INPUT', 'This edit is not available in the preview.')
        }
        if (edit.kind !== 'vote' && edit.kind !== 'set_candidate_note') {
          state.memory.revision += 1
          for (const change of proposals.values()) if (change.status === 'pending') change.status = 'stale'
        }
        return snapshot()
      }
      case 'retry_import': {
        const original = source(command.sourceId)
        if (original.importState?.status !== 'failed' || state.collection !== 'active') fail(422, 'INVALID_INPUT', 'Only failed imports can be retried while collection is active.')
        const id = `j-demo-${++sequence}`
        const reason = 'The original clip is still inaccessible in this preview.'
        original.importState = { status: 'failed', jobId: id, reason }
        jobs.set(id, { id, status: 'failed', error: { code: 'UPSTREAM_UNAVAILABLE', message: reason } })
        return { jobId: id }
      }
      case 'summarize': {
        const summary = state.memory.summaries.at(-1) ?? fail(422, 'INVALID_INPUT', 'The preview has no saved summary.')
        return finish({ kind: 'summary', summaryId: summary.id, sourceIds: summary.notes.flatMap((note) => note.sourceIds) })
      }
      case 'collect':
        state.collection = 'active'
        state.scope = command.scope
        state.epoch += 1
        return snapshot()
      case 'pause':
        state.collection = 'paused'
        return snapshot()
    }
  }

  function command(id: string, action: SyncCommand, key: string): Promise<TripView>
  function command(id: string, action: AsyncCommand, key: string): Promise<JobRef>
  async function command(id: string, action: Command, key: string) {
    checkTrip(id)
    const previously = seen.get(key)
    const serialized = JSON.stringify(action)
    if (previously) {
      if (previously.command !== serialized) fail(409, 'IDEMPOTENCY_CONFLICT', 'This request key was already used.')
      return copy(previously.result)
    }
    const result = run(action)
    seen.set(key, { command: serialized, result: copy(result) })
    return copy(result)
  }

  const stamp = (iso: string) => new Date(iso).toISOString().replaceAll('-', '').replaceAll(':', '').replace('.000', '')
  const escape = (str: string) => str.replaceAll('\\', '\\\\').replaceAll(',', '\\,').replaceAll(';', '\\;').replace(/\r?\n/g, '\\n')
  return {
    me: async (): Promise<Member> => copy(actor),
    trips: async () => [copy(state.trip)],
    create: async () => fail(422, 'INVALID_INPUT', 'The preview has one trip.'),
    join: async (id) => { checkTrip(id); return snapshot() },
    view: async (id) => { checkTrip(id); return snapshot() },
    proposal: async (id, p) => { checkTrip(id); return copy(proposal(p)) },
    job: async (id, j) => { checkTrip(id); return copy(job(j)) },
    search: async (id, query) => {
      checkTrip(id)
      return copy([café, ...state.memory.candidates.flatMap((entry) => entry.place ? [entry.place] : [])]
        .filter((place) => `${place.name} ${place.address ?? ''}`.toLowerCase().includes(query.trim().toLowerCase())))
    },
    routes: async (id, version, _from, _to, modes) => {
      checkTrip(id)
      if (version !== current().planVersion) fail(409, 'STALE_BASE', 'This route belongs to a previous version.')
      return copy(sampleRoutes.filter((route) => route.steps.some((step) => modes.includes(step.mode))))
    },
    calendar: async (id, version) => {
      checkTrip(id)
      const plan = versions.get(version) ?? fail(404, 'NOT_FOUND', 'That accepted version is not available.')
      const events = plan.itinerary.days.flatMap((day) => [...day.stops, ...(day.split?.branches.flatMap((branch) => branch.stops) ?? [])])
        .flatMap((entry) => ['BEGIN:VEVENT', `UID:${entry.id}-v${version}@waymark.preview`, `DTSTAMP:${stamp(new Date().toISOString())}`,
          `DTSTART:${stamp(entry.start)}`, `DTEND:${stamp(entry.end)}`, `SUMMARY:${escape(candidate(entry.candidateId).label)}`, 'END:VEVENT'])
      return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Waymark//Preview//EN', ...events, 'END:VCALENDAR', ''].join('\r\n')
    },
    command,
  }
}
