import { randomUUID } from 'node:crypto'
import type { Day, Itinerary, Leg, ManualChange, Stop, TripView } from '@waymark/contracts'
import { TripError } from './service.js'

function invalid(message: string): never {
  throw new TripError(422, 'INFEASIBLE', message)
}

function localDate(time: string, timezone: string): string {
  if (!time.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/) || !Number.isFinite(Date.parse(time))) {
    invalid('Use an ISO timestamp with a timezone offset.')
  }
  const fields = new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' })
    .formatToParts(new Date(time))
  return ['year','month','day'].map(key => fields.find(field => field.type === key)?.value).join('-')
}

function validateDay(day: Day, timezone: string): void {
  const departure = Date.parse(day.departAt)
  if (localDate(day.departAt, timezone) !== day.date) invalid('Departure is outside the selected day.')
  function validateSequence(stops: Stop[], earliest: number, latest = Infinity) {
    let end = earliest
    for (const stop of stops) {
      if (localDate(stop.start, timezone) !== day.date || localDate(stop.end, timezone) !== day.date) invalid('Stop is outside the selected day.')
      const start = Date.parse(stop.start)
      const finish = Date.parse(stop.end)
      if (start < end || finish <= start || finish > latest) invalid('Stop times overlap or miss the meetup.')
      end = finish
    }
  }
  function validateTravel(stops: Stop[], legs: Leg[]) {
    const times = new Map(stops.map(stop => [stop.id, stop]))
    for (const leg of legs) {
      const from = times.get(leg.fromStopId)
      const to = times.get(leg.toStopId)
      if (!from || !to) invalid('A travel leg is missing its departure or arrival stop.')
      if (leg.minutes !== null && Date.parse(to.start) - Date.parse(from.end) < leg.minutes * 60_000) {
        invalid('There is not enough time for the trip between these stops.')
      }
    }
  }
  validateSequence(day.stops, departure)
  validateTravel(day.stops, day.legs)
  if (day.split) {
    const start = day.stops.find(stop => stop.id === day.split?.afterStopId)
    const meet = day.stops.find(stop => stop.id === day.split?.meetingStopId)
    if (!start || !meet || Date.parse(start.end) > Date.parse(meet.start)) invalid('The split and meetup need common stops in chronological order.')
    if (day.stops.indexOf(meet) !== day.stops.indexOf(start) + 1) {
      invalid('Schedule a whole-group stop before the split or after the meetup.')
    }
    for (const branch of day.split.branches) {
      validateSequence(branch.stops, Date.parse(start.end), Date.parse(meet.start))
      validateTravel([start, ...branch.stops, meet], branch.legs)
    }
  }
}

export function manualPreview(view: TripView, original: Itinerary, changes: ManualChange[]) {
  const preview = structuredClone(original)
  const differences: string[] = []
  const modified = new Set<Day>()
  for (const change of changes) {
    if (change.kind === 'retime_day' || change.kind === 'add_stop') {
      const day = preview.days.find(item => item.date === change.date)
      if (!day) invalid('Unknown trip day.')
      if (change.kind === 'retime_day') {
        differences.push(`Departure on ${day.date}: ${day.departAt} → ${change.departAt}`)
        day.departAt = change.departAt
      } else {
        const candidate = view.memory.candidates.find(item => item.id === change.candidateId && item.state === 'resolved')
        if (!candidate) invalid('Select a resolved candidate from this trip.')
        const stop = { id: randomUUID(), candidateId: candidate.id, start: change.start, end: change.end, sourceIds: [...candidate.sourceIds] }
        day.stops.push(stop)
        day.stops.sort((a, b) => Date.parse(a.start) - Date.parse(b.start))
        const position = day.stops.indexOf(stop)
        const before = day.stops[position - 1]?.id
        const after = day.stops[position + 1]?.id
        day.legs = day.legs.filter(leg => leg.fromStopId !== before || leg.toStopId !== after)
        differences.push(`Add ${candidate.label} on ${day.date}`)
      }
      modified.add(day)
    } else if (change.kind === 'remove_stop' || change.kind === 'retime') {
      let found = false
      for (const day of preview.days) {
        const paths = [day, ...(day.split?.branches ?? [])]
        for (const path of paths) {
          const stop = path.stops.find(item => item.id === change.stopId)
          if (!stop) continue
          found = true
          const label = view.memory.candidates.find(item => item.id === stop.candidateId)?.label ?? stop.candidateId
          if (change.kind === 'remove_stop') {
            if (day.split && [day.split.afterStopId, day.split.meetingStopId].includes(stop.id)) invalid('Preserve the split and meetup stops.')
            path.stops = path.stops.filter(item => item.id !== stop.id)
            path.legs = path.legs.filter(leg => leg.fromStopId !== stop.id && leg.toStopId !== stop.id)
            differences.push(`Remove ${label} from ${day.date}; keep the place in Drafts`)
          } else {
            stop.start = change.start
            stop.end = change.end
            differences.push(`Change ${label} to ${change.start}–${change.end}`)
          }
          modified.add(day)
        }
      }
      if (!found) invalid('Unknown stop.')
    } else {
      throw new TripError(422, 'UNSUPPORTED_COMMAND', 'This manual change is not yet supported in the local preview.')
    }
  }
  for (const day of modified) validateDay(day, view.trip.timezone)
  return { preview, differences }
}
