import type { Day, Itinerary, Stop, TripView } from '@waymark/contracts'

function stopsOf(day: Day): Stop[] {
  return [...day.stops, ...(day.split?.branches.flatMap(branch => branch.stops) ?? [])]
}

// Manual commands preserve days and branch membership. Stable stop IDs also identify
// a stop whose time was changed more than once while editing a proposal.
export function manualDifferences(view: TripView, accepted: Itinerary, preview: Itinerary) {
  const differences: string[] = []
  const sourceIds = new Set<string>()
  const names = new Map(view.memory.candidates.map(candidate => [candidate.id, candidate.label]))
  function describe(stop: Stop, action: string) {
    differences.push(action)
    for (const source of stop.sourceIds) sourceIds.add(source)
  }
  for (const [index, day] of preview.days.entries()) {
    const original = accepted.days[index]
    if (Date.parse(original.departAt) !== Date.parse(day.departAt)) {
      differences.push(`Departure on ${day.date}: ${original.departAt} → ${day.departAt}`)
    }
    const before = new Map(stopsOf(original).map(stop => [stop.id, stop]))
    for (const stop of stopsOf(day)) {
      const name = names.get(stop.candidateId) ?? stop.candidateId
      const prior = before.get(stop.id)
      if (!prior) {
        describe(stop, `Add ${name} from ${stop.start} to ${stop.end}`)
      } else if (Date.parse(prior.start) !== Date.parse(stop.start) || Date.parse(prior.end) !== Date.parse(stop.end)) {
        describe(stop, `Change ${name} from ${prior.start}–${prior.end} to ${stop.start}–${stop.end}`)
      }
      before.delete(stop.id)
    }
    for (const removed of before.values()) {
      describe(removed, `Remove ${names.get(removed.candidateId) ?? removed.candidateId} from ${day.date}`)
    }
    const shared = new Map(day.stops.map(stop => [stop.id, stop]))
    for (const leg of original.legs) {
      const from = shared.get(leg.fromStopId)
      const to = shared.get(leg.toStopId)
      if (from && to && !day.legs.some(item => item.fromStopId === from.id && item.toStopId === to.id)) {
        differences.push(`Remove the direct travel leg from ${names.get(from.candidateId) ?? from.candidateId} to ${names.get(to.candidateId) ?? to.candidateId}`)
      }
    }
  }
  return { differences, sourceIds: [...sourceIds] }
}
