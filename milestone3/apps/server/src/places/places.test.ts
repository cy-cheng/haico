import assert from 'node:assert/strict'
import { test } from 'node:test'
import { replayFetch } from '../model/fixtures.js'
import { createGooglePlaces } from './index.js'
import {
  closedHours, nishikiHours, nishikiSearch, placesFixtureNow, replayPlaceDetails, replayTextSearch,
  riversideSearch, unknownHours,
} from './fixtures.js'

const timezone = 'Asia/Tokyo'
const day2 = '2026-11-21'
const point = (day: number, hour: number, minute = 0) => ({ date: { year: 2026, month: 11, day }, hour, minute })

test('Google Places keeps identically named locations separate and preserves missing coordinates', async () => {
  const replay = replayFetch(nishikiSearch, riversideSearch)
  const places = createGooglePlaces({ fetch: (url, init) => {
    const mask = new Headers(init.headers).get('x-goog-fieldmask')
    assert.ok(mask?.includes('places.id'))
    assert.ok(mask?.includes('places.location'))
    assert.equal(JSON.parse(String(init.body)).textQuery.trim(), JSON.parse(String(init.body)).textQuery)
    return replay(url, init)
  } })
  assert.deepEqual(await places.searchPlaces('osaka', '  Nishiki Market '), [{
    id: 'place-nishiki', name: 'Nishiki Market', city: 'Kyoto', address: 'Nakagyo Ward, Kyoto, Japan',
    coordinates: { lat: 35.005, lng: 135.765 },
  }])
  assert.deepEqual(await places.searchPlaces('osaka', 'Riverside café'), [
    { id: 'place-riverside-kyoto', name: 'Riverside café', city: 'Kyoto', address: 'Higashiyama, Kyoto, Japan',
      coordinates: { lat: 35.006, lng: 135.772 } },
    { id: 'place-riverside-osaka', name: 'Riverside café', city: 'Osaka', address: 'Kita Ward, Osaka, Japan',
      coordinates: null },
  ])
})

test('an empty search is not an upstream or response-format failure', async () => {
  const places = createGooglePlaces({ fetch: replayFetch(
    replayTextSearch({}), replayTextSearch({ places: [{ name: 'not a place result' }] }),
    replayTextSearch({ error: { status: 'RESOURCE_EXHAUSTED' } }, 429),
  ) })
  assert.deepEqual(await places.searchPlaces('osaka', ''), [])
  assert.deepEqual(await places.searchPlaces('osaka', 'No matching place'), [])
  await assert.rejects(places.searchPlaces('osaka', 'Malformed result'), { code: 'UPSTREAM_UNAVAILABLE', reason: 'invalid_response' })
  await assert.rejects(places.searchPlaces('osaka', 'Throttled'), { code: 'UPSTREAM_UNAVAILABLE', httpStatus: 429 })
})

test('facts report dated hours, confirmed closure, and unavailable hours as distinct values', async () => {
  const places = createGooglePlaces({ now: placesFixtureNow,
    fetch: replayFetch(nishikiHours, nishikiHours, unknownHours, closedHours, nishikiHours) })
  assert.deepEqual(await places.facts('place-nishiki', day2, timezone), { placeId: 'place-nishiki',
    openingIntervals: [{ start: '2026-11-21T00:00:00.000Z', end: '2026-11-21T08:00:00.000Z' }] })
  assert.deepEqual((await places.facts('place-nishiki', '2026-11-22', timezone)).openingIntervals, [])
  assert.equal((await places.facts('place-riverside-kyoto', day2, timezone)).openingIntervals, null)
  assert.deepEqual((await places.facts('place-riverside-osaka', day2, timezone)).openingIntervals, [])
  assert.equal((await places.facts('place-nishiki', '2026-11-26', timezone)).openingIntervals, null)
})

test('an overnight period is clipped to the requested day, even when the trip uses a different timezone', async () => {
  const nightHours = replayPlaceDetails('night', { id: 'night', timeZone: { id: 'Asia/Tokyo' },
    currentOpeningHours: { periods: [{ open: point(20, 22), close: point(21, 3, 30) }] } })
  const places = createGooglePlaces({ now: placesFixtureNow, fetch: replayFetch(nightHours, nightHours, nightHours) })
  assert.deepEqual((await places.facts('night', day2, timezone)).openingIntervals, [
    { start: '2026-11-20T15:00:00.000Z', end: '2026-11-20T18:30:00.000Z' },
  ])
  assert.deepEqual((await places.facts('night', '2026-11-20', 'UTC')).openingIntervals, [
    { start: '2026-11-20T13:00:00.000Z', end: '2026-11-20T18:30:00.000Z' },
  ])
  assert.equal((await places.facts('night', '2026-11-25', 'UTC')).openingIntervals, null)
})

test('Google’s clipped 24-hour record includes the end of the last covered day', async () => {
  const places = createGooglePlaces({ now: placesFixtureNow, fetch: replayFetch(replayPlaceDetails('always', {
    id: 'always', timeZone: { id: timezone }, currentOpeningHours: { periods: [
      { open: { ...point(19, 0), truncated: true }, close: { ...point(25, 23, 59), truncated: true } },
    ] },
  })) })
  assert.deepEqual((await places.facts('always', '2026-11-25', timezone)).openingIntervals, [
    { start: '2026-11-24T15:00:00.000Z', end: '2026-11-25T15:00:00.000Z' },
  ])
})

test('a known DST transition shifts the opening time without drifting the date', async () => {
  const places = createGooglePlaces({ now: () => new Date('2026-10-31T18:00:00Z'),
    fetch: replayFetch(replayPlaceDetails('cafe', { id: 'cafe', timeZone: { id: 'America/New_York' },
      currentOpeningHours: { periods: [{ open: point(1, 0), close: point(1, 4) }] },
    })) })
  assert.deepEqual((await places.facts('cafe', '2026-11-01', 'America/New_York')).openingIntervals, [
    { start: '2026-11-01T04:00:00.000Z', end: '2026-11-01T09:00:00.000Z' },
  ])
})

test('missing periods or a malformed period stay unknown, while HTTP and mismatched IDs are errors', async () => {
  const places = createGooglePlaces({ now: placesFixtureNow, fetch: replayFetch(
    replayPlaceDetails('cafe', { id: 'cafe', timeZone: { id: timezone }, currentOpeningHours: { openNow: false } }),
    replayPlaceDetails('cafe', { id: 'cafe', timeZone: { id: timezone },
      currentOpeningHours: { periods: [{ open: point(21, 9) }] } }),
    replayPlaceDetails('cafe', { error: { status: 'UNAVAILABLE' } }, 503),
    replayPlaceDetails('cafe', { id: 'another-cafe' }),
  ) })
  assert.equal((await places.facts('cafe', day2, timezone)).openingIntervals, null)
  assert.equal((await places.facts('cafe', day2, timezone)).openingIntervals, null)
  await assert.rejects(places.facts('cafe', day2, timezone), { code: 'UPSTREAM_UNAVAILABLE', httpStatus: 503 })
  await assert.rejects(places.facts('cafe', day2, timezone), { code: 'UPSTREAM_UNAVAILABLE', reason: 'invalid_response' })
})
