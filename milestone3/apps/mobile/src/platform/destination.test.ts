import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readDestination } from './destination'

test('an app link opens the same trip and proposal as its corresponding web link', () => {
  const result = { tripId: 'osaka', proposalId: 'p7' }
  assert.deepEqual(readDestination('waymark://trips/osaka/proposals/p7'), result)
  assert.deepEqual(readDestination('https://waymark.example/trips/osaka/proposals/p7', 'https://waymark.example'), result)
  assert.deepEqual(readDestination('waymark://trips/osaka?join=1'), { tripId: 'osaka', join: true })
})

test('opening a trip link cannot change the server, credentials or authority', () => {
  for (const link of [
    'https://elsewhere.example/trips/osaka', 'waymark://auth/callback?code=one',
    'waymark://trips/osaka?token=some-token', 'waymark://trips/osaka/proposals/%2Fother',
    'waymark://trips/osaka/proposals/%', 'waymark://trips:777/osaka', 'waymark://user@trips/osaka',
  ]) assert.equal(readDestination(link, 'https://waymark.example'), null)
})
