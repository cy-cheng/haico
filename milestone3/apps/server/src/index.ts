import { randomBytes } from 'node:crypto'
import { isDemoTrip, openDatabase } from './db/index.js'
import { buildLocalServer, type DemoSession } from './http/server.js'

const db = openDatabase()
if (!isDemoTrip(db)) {
  db.close()
  throw new Error('Run npm run seed:demo first and use the same WAYMARK_DB_PATH.')
}

const sessions = new Map<string, DemoSession>()
for (const memberId of ['alex', 'mia']) {
  sessions.set(randomBytes(32).toString('base64url'), { memberId, expiresAt: Date.now() + 2 * 60 * 60 * 1000 })
}
const server = buildLocalServer(db, sessions)
server.addHook('onClose', async () => db.close())
try {
  const address = await server.listen({ host: '127.0.0.1', port: 3000 })
  console.log('Waymark local preview at %s. Enter one of these two-hour tokens in the app:', address)
  for (const [token, session] of sessions) console.log('%s: %s', session.memberId, token)
  for (const signal of ['SIGTERM', 'SIGINT']) process.once(signal, () => { void server.close() })
} catch (error) {
  await server.close()
  throw error
}
