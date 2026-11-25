import type { MemoryPort, Place } from '@waymark/contracts'
import { fetchProviderJson, ProviderError, providerAttempt, record } from '../model/provider.js'
import type { ObserveProvider, ProviderFetch } from '../model/provider.js'
import { currentOpeningIntervals, tripDayWindow } from './hours.js'

export const PLACES_BASE_URL = 'https://places.googleapis.com/v1/places'

const searchFields = 'places.id,places.displayName,places.formattedAddress,places.addressComponents,places.location'
const factsFields = 'id,timeZone,businessStatus,currentOpeningHours.periods'
const cityTypes = ['locality', 'postal_town', 'administrative_area_level_3']

type PlacesPort = Pick<MemoryPort, 'searchPlaces' | 'facts'>

export function createGooglePlaces({ fetch, now = () => new Date(), observe }: {
  fetch: ProviderFetch
  now?: () => Date
  observe?: ObserveProvider
}): PlacesPort {
  return {
    async searchPlaces(_tripId, query) {
      const textQuery = query.trim()
      if (!textQuery) return []
      return providerAttempt({ provider: 'google_places', operation: 'search' }, observe, async (details) => {
        const result = await fetchProviderJson('google_places', fetch, `${PLACES_BASE_URL}:searchText`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-goog-fieldmask': searchFields },
          body: JSON.stringify({ textQuery }),
        }, details)
        return parsePlaces(result)
      })
    },

    async facts(placeId, date, timezone) {
      const window = tripDayWindow(date, timezone)
      if (!placeId || placeId === '.' || placeId === '..') throw new RangeError('Expected a Google place ID')
      return providerAttempt({ provider: 'google_places', operation: 'facts' }, observe, async (details) => {
        const payload = record(await fetchProviderJson('google_places', fetch,
          `${PLACES_BASE_URL}/${encodeURIComponent(placeId)}`, {
            method: 'GET', headers: { 'x-goog-fieldmask': factsFields },
          }, details))
        if (payload?.id !== placeId) throw new ProviderError('google_places', 'invalid_response')
        return { placeId, openingIntervals: currentOpeningIntervals(payload, window, now()) }
      })
    },
  }
}

function parsePlaces(value: unknown): Place[] {
  const payload = record(value)
  if (!payload || payload.error !== undefined) throw new ProviderError('google_places', 'invalid_response')
  if (payload.places === undefined) return []
  if (!Array.isArray(payload.places)) throw new ProviderError('google_places', 'invalid_response')

  const places = new Map<string, Place>()
  for (const entry of payload.places as unknown[]) {
    const place = parsePlace(entry)
    if (place && !places.has(place.id)) places.set(place.id, place)
  }
  if (places.size === 0 && payload.places.length > 0) throw new ProviderError('google_places', 'invalid_response')
  return [...places.values()]
}

function parsePlace(value: unknown): Place | undefined {
  const item = record(value)
  const id = nonEmptyString(item?.id)
  const name = nonEmptyString(record(item?.displayName)?.text)
  if (!id || !name) return

  const location = record(item?.location)
  const lat = location?.latitude
  const lng = location?.longitude
  const coordinates = typeof lat === 'number' && Math.abs(lat) <= 90 && typeof lng === 'number' && Math.abs(lng) <= 180
    ? { lat, lng } : null
  const address = nonEmptyString(item?.formattedAddress)
  const components = Array.isArray(item?.addressComponents) ? item.addressComponents.map(record) : []
  const city = cityTypes.map(type => components
    .map(component => Array.isArray(component?.types) && component.types.includes(type)
      ? nonEmptyString(component.longText) : undefined)
    .find(Boolean)).find(Boolean)
  return { id, name, coordinates, ...(address ? { address } : {}), ...(city ? { city } : {}) }
}

function nonEmptyString(value: unknown): string | undefined {
  return typeof value === 'string' ? value.trim() || undefined : undefined
}
