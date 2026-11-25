import type { DatabaseSync } from 'node:sqlite'
import Fastify from 'fastify'
import type { FastifyRequest } from 'fastify'
import { isDemoTrip } from '../db/index.js'
import { getAccepted, getProposal, memberTrip, runCommand, setupReview, TripError } from '../review/service.js'
import { toCalendar } from '../review/calendar.js'
import { getJob, runManualJob } from '../review/manual-jobs.js'
import { readCommand } from './commands.js'

export type DemoSession = { memberId: string; expiresAt: number }

function browserOrigin(origin: string): boolean {
  try {
    const url = new URL(origin)
    return url.origin === origin && ['https:', 'http:'].includes(url.protocol)
      && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
  } catch {
    return false
  }
}

export function buildLocalServer(db: DatabaseSync, sessions: ReadonlyMap<string, DemoSession>) {
  setupReview(db)
  const app = Fastify({ bodyLimit: 64 * 1024 })

  app.addHook('onRequest', async (req, reply) => {
    reply.header('Cache-Control', 'no-store')
    const origin = req.headers.origin
    if (origin) {
      if (!browserOrigin(origin)) throw new TripError(403, 'FORBIDDEN', 'Use the local Expo browser preview.')
      reply.header('Access-Control-Allow-Origin', origin).header('Vary', 'Origin')
      reply.header('Access-Control-Allow-Headers', 'Authorization, Content-Type, Idempotency-Key')
      reply.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    }
  })
  app.options('/*', async (_req, reply) => reply.code(204).send())
  app.setErrorHandler((error, _req, reply) => {
    if (error instanceof TripError) return reply.code(error.status).send(error.body())
    const status = typeof error === 'object' && error && 'statusCode' in error ? Number(error.statusCode) : 500
    if (status >= 400 && status < 500) {
      return reply.code(status).send({ error: { code: 'INVALID_INPUT', message: 'The request could not be read.' } })
    }
    return reply.code(500).send({ error: { code: 'INTERNAL', message: 'The trip server could not complete the request.' } })
  })
  app.setNotFoundHandler((_req, reply) => reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Route not found.' } }))
  app.get('/health', async () => ({ status: 'ok' }))

  function memberId(req: FastifyRequest): string {
    const bearer = /^Bearer (\S+)$/i.exec(req.headers.authorization ?? '')
    const session = bearer && sessions.get(bearer[1])
    if (!session || session.expiresAt <= Date.now()) throw new TripError(401, 'UNAUTHENTICATED', 'Enter a current demo token.')
    return session.memberId
  }

  function trip(req: FastifyRequest, id: string) {
    const actor = memberId(req)
    if (id !== 'osaka' || !isDemoTrip(db)) throw new TripError(404, 'NOT_FOUND', 'Demo trip not found.')
    return memberTrip(db, id, actor)
  }

  app.get('/api/v1/me', async req => {
    const view = trip(req, 'osaka')
    return view.members.find(member => member.id === memberId(req))!
  })
  app.get('/api/v1/trips', async req => [trip(req, 'osaka').trip])
  app.get<{ Params: { id: string } }>('/api/v1/trips/:id', async req => trip(req, req.params.id))
  app.get<{ Params: { id: string; proposal: string } }>('/api/v1/trips/:id/proposals/:proposal', async req =>
    getProposal(db, trip(req, req.params.id), req.params.proposal))
  app.get<{ Params: { id: string; job: string } }>('/api/v1/trips/:id/jobs/:job', async req =>
    getJob(db, trip(req, req.params.id), req.params.job))
  app.post<{ Params: { id: string } }>('/api/v1/trips/:id/commands', async (req, reply) => {
    const view = trip(req, req.params.id)
    const key = req.headers['idempotency-key']
    if (typeof key !== 'string' || !/^[\x21-\x7E]{1,200}$/.test(key)) {
      throw new TripError(422, 'INVALID_INPUT', 'Supply an Idempotency-Key for this operation.')
    }
    const command = readCommand(req.body)
    if (command.kind === 'plan') {
      return reply.code(202).send(runManualJob(db, view.trip.id, memberId(req), key, command))
    }
    return runCommand(db, view.trip.id, memberId(req), key, command)
  })
  app.get<{ Params: { id: string }; Querystring: { version?: string } }>('/api/v1/trips/:id/calendar.ics', async (req, reply) => {
    const view = trip(req, req.params.id)
    if (!/^[1-9]\d*$/.test(req.query.version ?? '') || !Number.isSafeInteger(Number(req.query.version))) {
      throw new TripError(422, 'INVALID_INPUT', 'Choose an accepted version.')
    }
    const plan = getAccepted(db, view, Number(req.query.version))
    return reply.type('text/calendar; charset=utf-8').send(toCalendar(view, plan))
  })
  return app
}
