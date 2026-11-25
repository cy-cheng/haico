import type { ReplayStep } from '../model/fixtures.js'
import { PLACES_BASE_URL } from './index.js'

export const placesFixtureNow = () => new Date('2026-11-19T12:00:00Z')

export function replayTextSearch(body: unknown, status?: number): ReplayStep {
  return { url: `${PLACES_BASE_URL}:searchText`, method: 'POST', body, status }
}

export function replayPlaceDetails(id: string, body: unknown, status?: number): ReplayStep {
  return { url: `${PLACES_BASE_URL}/${encodeURIComponent(id)}`, method: 'GET', body, status }
}

export const nishikiSearch = replayTextSearch({ places: [{
  id: 'place-nishiki', displayName: { text: 'Nishiki Market', languageCode: 'en' },
  formattedAddress: 'Nakagyo Ward, Kyoto, Japan',
  addressComponents: [{ longText: 'Kyoto', types: ['locality', 'political'] }],
  location: { latitude: 35.005, longitude: 135.765 },
}] })

export const riversideSearch = replayTextSearch({ places: [
  { id: 'place-riverside-kyoto', displayName: { text: 'Riverside café' }, formattedAddress: 'Higashiyama, Kyoto, Japan',
    addressComponents: [{ longText: 'Kyoto', types: ['locality', 'political'] }],
    location: { latitude: 35.006, longitude: 135.772 } },
  { id: 'place-riverside-osaka', displayName: { text: 'Riverside café' }, formattedAddress: 'Kita Ward, Osaka, Japan',
    addressComponents: [{ longText: 'Osaka', types: ['locality', 'political'] }] },
] })

export const nishikiHours = replayPlaceDetails('place-nishiki', {
  id: 'place-nishiki', businessStatus: 'OPERATIONAL', timeZone: { id: 'Asia/Tokyo' },
  currentOpeningHours: { periods: [{
    open: { date: { year: 2026, month: 11, day: 21 }, day: 6, hour: 9, minute: 0 },
    close: { date: { year: 2026, month: 11, day: 21 }, day: 6, hour: 17, minute: 0 },
  }] },
})

export const unknownHours = replayPlaceDetails('place-riverside-kyoto', {
  id: 'place-riverside-kyoto', businessStatus: 'OPERATIONAL', timeZone: { id: 'Asia/Tokyo' },
})

export const closedHours = replayPlaceDetails('place-riverside-osaka', {
  id: 'place-riverside-osaka', timeZone: { id: 'Asia/Tokyo' }, businessStatus: 'CLOSED_TEMPORARILY',
  currentOpeningHours: { periods: [] },
})
