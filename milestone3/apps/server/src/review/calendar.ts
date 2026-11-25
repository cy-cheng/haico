import type { AcceptedPlan, TripView } from '@waymark/contracts'

function escape(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/\r\n|\r|\n/g, '\\n').replace(/[,;]/g, char => '\\' + char)
}

function utc(value: string) {
  return new Date(value).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')
}

function fold(line: string): string {
  const lines: string[] = []
  let current = ''
  let bytes = 0
  for (const char of line) {
    const size = Buffer.byteLength(char)
    if (bytes + size > 75) {
      lines.push(current)
      current = ' '
      bytes = 1
    }
    current += char
    bytes += size
  }
  return [...lines, current].join('\r\n')
}

export function toCalendar(view: TripView, plan: AcceptedPlan): string {
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Waymark//Trip Planner//EN', 'CALSCALE:GREGORIAN']
  const labels = new Map(view.memory.candidates.map(item => [item.id, item.label]))
  const names = new Map(view.members.map(member => [member.id, member.name]))
  const stamp = utc(new Date().toISOString())
  for (const day of plan.itinerary.days) {
    for (const group of [{ stops: day.stops, memberIds: [] as string[] }, ...(day.split?.branches ?? [])]) {
      for (const stop of group.stops) {
        lines.push('BEGIN:VEVENT', 'UID:' + encodeURIComponent(view.trip.id) + '-' + encodeURIComponent(stop.id) + '@waymark',
          'SEQUENCE:' + plan.version, 'DTSTAMP:' + stamp, 'DTSTART:' + utc(stop.start), 'DTEND:' + utc(stop.end),
          'SUMMARY:' + escape(labels.get(stop.candidateId) ?? stop.candidateId))
        const people = group.memberIds.map(id => names.get(id) ?? id).join(', ')
        lines.push('DESCRIPTION:' + escape(people || view.trip.name), 'END:VEVENT')
      }
    }
  }
  lines.push('END:VCALENDAR')
  return lines.map(fold).join('\r\n') + '\r\n'
}
