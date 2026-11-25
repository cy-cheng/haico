import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { fileURLToPath } from 'node:url'
import type { TripInfo, TripView } from '@waymark/contracts'

const workspaceRoot = fileURLToPath(new URL('../../../../', import.meta.url))
export const defaultDatabasePath = resolve(workspaceRoot, 'data/waymark.sqlite')
const demoFixture = new URL('../../../../fixtures/trip-view.json', import.meta.url)

export type Migration = { id: string; sql: string }
const core: Migration = {
  id: 'workspace-001',
  sql: `
    CREATE TABLE trips (
      id TEXT PRIMARY KEY NOT NULL,
      channel_id TEXT UNIQUE NOT NULL,
      snapshot TEXT NOT NULL CHECK (json_valid(snapshot))
    ) STRICT;
    CREATE TABLE demo_seeds (
      trip_id TEXT PRIMARY KEY REFERENCES trips(id) ON DELETE CASCADE
    ) STRICT;
  `,
}

let savepoint = 0

// An inner operation can roll back independently while a command owns the outer transaction.
export function transaction<T>(db: DatabaseSync, work: () => T extends PromiseLike<unknown> ? never : T): T {
  const nested = db.isTransaction
  const name = 'waymark_tx_' + ++savepoint
  db.exec(nested ? 'SAVEPOINT ' + name : 'BEGIN IMMEDIATE')
  try {
    const result = work()
    if (result && typeof result === 'object' && 'then' in result && typeof result.then === 'function') {
      throw new TypeError('SQLite transaction callbacks must finish synchronously.')
    }
    db.exec(nested ? 'RELEASE ' + name : 'COMMIT')
    return result
  } catch (error) {
    if (nested) {
      db.exec('ROLLBACK TO ' + name)
      db.exec('RELEASE ' + name)
    } else {
      db.exec('ROLLBACK')
    }
    throw error
  }
}

export function migrate(db: DatabaseSync, migrations: readonly Migration[] = []): void {
  transaction(db, () => {
    db.exec(`CREATE TABLE IF NOT EXISTS migrations (
      id TEXT PRIMARY KEY NOT NULL,
      checksum TEXT NOT NULL
    ) STRICT`)
    const find = db.prepare('SELECT checksum FROM migrations WHERE id = ?')
    const record = db.prepare('INSERT INTO migrations(id, checksum) VALUES (?, ?)')
    for (const migration of [core, ...migrations]) {
      const checksum = createHash('sha256').update(migration.sql).digest('hex')
      const applied = find.get(migration.id)
      if (applied) {
        if (applied.checksum !== checksum) {
          throw new Error('Applied migration has changed: ' + migration.id)
        }
        continue
      }
      db.exec(migration.sql)
      record.run(migration.id, checksum)
    }
  })
}

export function openDatabase(path = process.env.WAYMARK_DB_PATH || defaultDatabasePath): DatabaseSync {
  if (path !== ':memory:') mkdirSync(dirname(resolve(path)), { recursive: true })
  const db = new DatabaseSync(path)
  try {
    db.exec('PRAGMA busy_timeout = 5000; PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;')
    migrate(db)
    return db
  } catch (error) {
    db.close()
    throw error
  }
}

export function testDatabase(): DatabaseSync {
  return openDatabase(':memory:')
}

export function readTrip(db: DatabaseSync, tripId: string): TripView | null {
  const row = db.prepare('SELECT snapshot FROM trips WHERE id = ?').get(tripId)
  return row ? JSON.parse(String(row.snapshot)) as TripView : null
}

export function saveTrip(db: DatabaseSync, view: TripView): void {
  db.prepare(`INSERT INTO trips(id, channel_id, snapshot) VALUES (?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET channel_id = excluded.channel_id, snapshot = excluded.snapshot`)
    .run(view.trip.id, view.trip.channelId, JSON.stringify(view))
}

export function listTrips(db: DatabaseSync, memberId: string): TripInfo[] {
  const rows = db.prepare(`SELECT json_extract(snapshot, '$.trip') AS info FROM trips
    WHERE EXISTS (
      SELECT 1 FROM json_each(snapshot, '$.members') AS member
      WHERE json_extract(member.value, '$.id') = ?
    ) ORDER BY id`).all(memberId)
  return rows.map(row => JSON.parse(String(row.info)) as TripInfo)
}

export function isDemoTrip(db: DatabaseSync): boolean {
  return Boolean(db.prepare('SELECT 1 FROM demo_seeds WHERE trip_id = ?').get('osaka'))
}

export function seedDemo(db: DatabaseSync): boolean {
  const fixture: TripView = JSON.parse(readFileSync(demoFixture, 'utf8'))
  return transaction(db, () => {
    const inserted = db.prepare('INSERT INTO trips(id, channel_id, snapshot) VALUES (?, ?, ?) ON CONFLICT DO NOTHING')
      .run(fixture.trip.id, fixture.trip.channelId, JSON.stringify(fixture))
    if (!inserted.changes) return false
    db.prepare('INSERT INTO demo_seeds(trip_id) VALUES (?)').run(fixture.trip.id)
    return true
  })
}
