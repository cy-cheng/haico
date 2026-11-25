import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { TripView } from '@waymark/contracts'
import fixture from '../../../../fixtures/trip-view.json' with { type: 'json' }
import { manualPreview } from './manual.js'
import { TripError } from './service.js'

const view = fixture as TripView
const local = (time: string) => '2026-11-22T' + time + ':00+09:00'
const infeasible = (error: unknown) => error instanceof TripError && error.code === 'INFEASIBLE'

test('a shared stop cannot be inserted while both groups are on their own outings', () => {
  assert.throws(() => manualPreview(view, view.accepted!.itinerary, [{
    kind: 'add_stop', date: '2026-11-22', candidateId: 'castle', start: local('13:15'), end: local('13:45'),
  }]), infeasible)
})

test('retiming a branch stop allows for the known journey back to the meetup', () => {
  const itinerary = structuredClone(view.accepted!.itinerary)
  itinerary.days[2].split!.branches[0].legs[1].minutes = 45
  assert.throws(() => manualPreview(view, itinerary, [{
    kind: 'retime', stopId: 'sUmeda', start: local('14:30'), end: local('15:30'),
  }]), infeasible)
  assert.equal(itinerary.days[2].split!.branches[0].stops[0].end, local('14:30'))
})

test('adding an intermediate stop drops the old direct leg, preserving the accepted itinerary', () => {
  const itinerary = view.accepted!.itinerary
  const result = manualPreview(view, itinerary, [{
    kind: 'add_stop', date: '2026-11-22', candidateId: 'yasaka', start: local('11:35'), end: local('11:45'),
  }])
  assert.deepEqual(result.preview.days[2].legs, [])
  assert.deepEqual(result.preview.days[2].split, itinerary.days[2].split)
  assert.equal(itinerary.days[2].legs.length, 1)
})
