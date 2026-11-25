import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { isDemoTrip, listTrips, migrate, openDatabase, readTrip, saveTrip, seedDemo, testDatabase, transaction } from './index.js'

test('a seeded file reopens with its version, sources and membership intact', t => {
  const dir = mkdtempSync(join(tmpdir(), 'waymark-db-test-'))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  const path = join(dir, 'nested', 'test.sqlite')
  const fixture = JSON.parse(readFileSync(new URL('../../../../fixtures/trip-view.json', import.meta.url), 'utf8'))
  const first = openDatabase(path)
  try {
    assert.equal(seedDemo(first), true)
    assert.deepEqual(readTrip(first, 'osaka'), fixture)
    assert.equal(isDemoTrip(first), true)
    const updated = readTrip(first, 'osaka')!
    updated.collection = 'paused'
    saveTrip(first, updated)
  } finally {
    first.close()
  }
  const second = openDatabase(path)
  try {
    assert.equal(seedDemo(second), false)
    const saved = readTrip(second, 'osaka')!
    assert.equal(saved.collection, 'paused')
    assert.deepEqual(saved.accepted, fixture.accepted)
    assert.deepEqual(saved.memory.sources, fixture.memory.sources)
    assert.deepEqual(listTrips(second, 'mia'), [fixture.trip])
    assert.deepEqual(listTrips(second, 'visitor'), [])
  } finally {
    second.close()
  }
})

test('migrations are atomic, immutable and replayable', t => {
  const db = testDatabase()
  t.after(() => db.close())
  const migration = { id: 'test-1', sql: 'CREATE TABLE replay_test(value TEXT)' }
  migrate(db, [migration])
  migrate(db, [migration])
  assert.throws(() => migrate(db, [{ ...migration, sql: 'SELECT 10' }]), /changed/)
  assert.throws(() => migrate(db, [{ id: 'test-bad', sql: 'CREATE TABLE scratch(n); SELECT * FROM missing' }]))
  assert.equal(db.prepare("SELECT name FROM sqlite_master WHERE name = 'scratch'").get(), undefined)
  assert.equal(db.prepare("SELECT id FROM migrations WHERE id = 'test-bad'").get(), undefined)
  const add = db.prepare('INSERT INTO replay_test(value) VALUES (?)')
  transaction(db, () => {
    add.run('outer')
    assert.throws(() => transaction(db, () => { add.run('inner'); throw new Error('abort inner') }))
    add.run('kept')
  })
  assert.deepEqual(db.prepare('SELECT value FROM replay_test ORDER BY rowid').all().map(row => row.value), ['outer', 'kept'])
})

test('demo seeding preserves colliding user trips and isolated test connections', t => {
  const source = testDatabase()
  const user = testDatabase()
  t.after(() => { source.close(); user.close() })
  seedDemo(source)
  const ownTrip = readTrip(source, 'osaka')!
  ownTrip.trip.name = 'My real trip'
  saveTrip(user, ownTrip)
  assert.equal(seedDemo(user), false)
  assert.equal(isDemoTrip(user), false)
  assert.equal(readTrip(user, 'osaka')?.trip.name, 'My real trip')
  assert.equal(readTrip(source, 'osaka')?.trip.name, 'Kansai Fall Trip')
})
