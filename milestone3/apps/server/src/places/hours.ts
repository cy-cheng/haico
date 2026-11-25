import type { PlaceFacts } from '@waymark/contracts'
import { record } from '../model/provider.js'

const MINUTE = 60_000
const DAY = MINUTE * 1440
type Window = { start: number; end: number }

export function tripDayWindow(date: string, timezone: string): Window {
  const day = parseDay(date)
  if (day === null) throw new RangeError('Expected a valid date in YYYY-MM-DD format')
  const formatter = clock(timezone)
  const start = instantAt(day, formatter)
  const end = instantAt(day + DAY, formatter)
  if (start === null || end === null) throw new RangeError('Trip date has an ambiguous or missing local midnight')
  return { start, end }
}

export function currentOpeningIntervals(
  payload: Record<string, unknown>, window: Window, now: Date,
): PlaceFacts['openingIntervals'] {
  if (payload.businessStatus === 'CLOSED_PERMANENTLY' && window.end > now.getTime()) return []
  const zone = record(payload.timeZone)?.id
  const periods = record(payload.currentOpeningHours)?.periods
  if (typeof zone !== 'string' || !Array.isArray(periods)) return null

  let formatter: Intl.DateTimeFormat
  try {
    formatter = clock(zone)
  } catch {
    return null
  }
  const today = localDay(now.getTime(), formatter)
  const start = instantAt(today, formatter)
  const end = instantAt(today + 7 * DAY, formatter)
  // Current hours cover seven place-local dates and include holiday exceptions.
  // A weekly pattern outside that window cannot confirm a date-specific closure.
  if (start === null || end === null || window.start < start || window.end > end) return null

  const intervals: Window[] = []
  for (const value of periods as unknown[]) {
    const period = record(value)
    const open = record(period?.open)
    const close = record(period?.close)
    if (!open) return null
    const from = pointTime(open, formatter)
    let until = close ? pointTime(close, formatter) : null

    if (close?.truncated === true && close.hour === 23 && close.minute === 59 &&
      pointDay(close) === today + 6 * DAY) until = end

    if (from === null || until === null || until <= from || from < start || until > end) return null
    if (from < window.end && until > window.start) {
      intervals.push({ start: Math.max(from, window.start), end: Math.min(until, window.end) })
    }
  }

  return mergeIntervals(intervals).map(({ start, end }) => ({
    start: new Date(start).toISOString(), end: new Date(end).toISOString(),
  }))
}

function mergeIntervals(intervals: Window[]): Window[] {
  const merged: Window[] = []
  for (const interval of intervals.sort((a, b) => a.start - b.start)) {
    const last = merged.at(-1)
    if (last && last.end >= interval.start) last.end = Math.max(last.end, interval.end)
    else merged.push(interval)
  }
  return merged
}

function parseDay(date: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(date)) return null
  const millis = Date.parse(`${date}T00:00:00Z`)
  return Number.isFinite(millis) && new Date(millis).toISOString().slice(0, 10) === date ? millis : null
}

function pointDay(point: Record<string, unknown>): number | null {
  const date = record(point.date)
  if (!date || !integer(date.year, 1, 9999) || !integer(date.month, 1, 12) || !integer(date.day, 1, 31)) return null
  return parseDay(`${String(date.year).padStart(4, '0')}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`)
}

function pointTime(point: Record<string, unknown>, formatter: Intl.DateTimeFormat): number | null {
  const day = pointDay(point)
  const { hour, minute } = point
  if (day === null || !integer(hour, 0, 23) || !integer(minute, 0, 59)) return null
  return instantAt(day + MINUTE * (hour * 60 + minute), formatter)
}

function integer(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max
}

function clock(timeZone: string): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit', timeZoneName: 'longOffset',
  })
}

function localDay(epoch: number, formatter: Intl.DateTimeFormat): number {
  const parts = formatter.formatToParts(epoch)
  const get = (type: string) => parts.find(part => part.type === type)?.value ?? ''
  return parseDay(`${get('year').padStart(4, '0')}-${get('month')}-${get('day')}`) ?? NaN
}

function clockOffset(epoch: number, formatter: Intl.DateTimeFormat): number {
  const offset = formatter.formatToParts(epoch).find(part => part.type === 'timeZoneName')?.value
  if (offset === 'GMT') return 0
  const parts = /^GMT([+-])(\d{2}):(\d{2})(?::(\d{2}))?$/u.exec(offset ?? '')
  return parts ? (parts[1] === '+' ? 1 : -1) * (MINUTE * (60 * Number(parts[2]) + Number(parts[3])) +
    1000 * Number(parts[4] ?? 0)) : NaN
}

function instantAt(wall: number, formatter: Intl.DateTimeFormat): number | null {
  // The offset might change near midnight or around a daylight-saving transition.
  // Accept a wall time only when exactly one offset maps back to it.
  const offsets = new Set([wall - DAY, wall, wall + DAY].map(epoch => clockOffset(epoch, formatter)))
  const matches = [...offsets].map(offset => wall - offset)
    .filter(epoch => Number.isFinite(epoch) && epoch + clockOffset(epoch, formatter) === wall)
  return matches.length === 1 ? matches[0]! : null
}
