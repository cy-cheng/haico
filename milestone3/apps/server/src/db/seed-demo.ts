import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { seedReviewDemo } from '../review/seed-proposal.js'
import { defaultDatabasePath, isDemoTrip, openDatabase, seedDemo, transaction } from './index.js'

const args = process.argv.slice(2)
if (args.length > 1 || (args.length === 1 && args[0] !== '--fresh')) {
  throw new Error('Usage: npm run seed:demo -- [--fresh]')
}
const path = args[0] === '--fresh'
  ? join(mkdtempSync(join(tmpdir(), 'waymark-demo-')), 'waymark.sqlite')
  : resolve(process.env.WAYMARK_DB_PATH || defaultDatabasePath)
const db = openDatabase(path)
try {
  const seeded = transaction(db, () => {
    seedDemo(db)
    if (!isDemoTrip(db)) return false
    seedReviewDemo(db)
    return true
  })
  console.log(seeded ? 'Kansai Fall Trip demo available.' : 'A trip already uses the demo ID or channel. Use --fresh for a separate database.')
  console.log('Database:', path)
} finally {
  db.close()
}
