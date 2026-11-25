import { randomUUID } from 'node:crypto'
import type { DatabaseSync } from 'node:sqlite'
import type { AsyncCommand, Job, JobRef, PlanRequest, Proposal, TripView } from '@waymark/contracts'
import { manualDifferences } from './manual-differences.js'
import { manualPreview } from './manual.js'
import { pendingProposal, requireBase, runOperation, storeProposal, TripError } from './service.js'

export type ManualPlanCommand = Omit<Extract<AsyncCommand, { kind: 'plan' }>, 'request'> & {
  request: Extract<PlanRequest, { kind: 'manual' }>
}

export function getJob(db: DatabaseSync, view: TripView, id: string): Job {
  const row = db.prepare('SELECT payload FROM review_jobs WHERE trip_id = ? AND id = ?').get(view.trip.id, id)
  if (!row) throw new TripError(404, 'NOT_FOUND', 'Job not found.')
  return JSON.parse(String(row.payload)) as Job
}

function createProposal(
  db: DatabaseSync, view: TripView, command: ManualPlanCommand, replaced: Proposal | undefined, sourceId: string,
): Proposal {
  if (!view.accepted) throw new TripError(422, 'INFEASIBLE', 'An accepted itinerary is needed for a manual change.')
  const accepted = view.accepted.itinerary
  const { preview } = manualPreview(view, replaced?.preview ?? accepted, command.request.changes)
  const { differences, sourceIds } = manualDifferences(view, accepted, preview)
  const proposal: Proposal = {
    id: randomUUID(), status: 'pending', base: command.base, preview, differences, warnings: replaced?.warnings ?? [],
    sourceIds: [...new Set([...(replaced?.sourceIds ?? []), ...sourceIds, sourceId])],
  }
  storeProposal(db, view.trip.id, proposal)
  if (replaced) {
    storeProposal(db, view.trip.id, { ...replaced, status: 'stale' })
    view.pending = view.pending.filter(other => other.id !== replaced.id)
  }
  view.pending.push(proposal)
  return proposal
}

export function runManualJob(db: DatabaseSync, tripId: string, memberId: string, key: string, command: ManualPlanCommand): JobRef {
  // All work is bounded local itinerary processing. The terminal job, source, proposal
  // and retry receipt commit together before the HTTP acknowledgement.
  return runOperation(db, tripId, memberId, key, command, view => {
    requireBase(view, command.base)
    const replaced = command.replacesProposalId ? pendingProposal(db, view, command.replacesProposalId) : undefined
    if (replaced) requireBase(view, replaced.base)
    const sourceId = randomUUID()
    view.memory.sources.push({ id: sourceId, origin: 'app', authorId: memberId, at: new Date().toISOString(),
      url: null, text: JSON.stringify(command.request) })
    const id = randomUUID()
    let job: Job
    try {
      const proposal = createProposal(db, view, command, replaced, sourceId)
      job = { id, status: 'succeeded', result: { kind: 'proposal', proposalId: proposal.id } }
    } catch (error) {
      if (!(error instanceof TripError) || error.code !== 'INFEASIBLE') throw error
      job = { id, status: 'failed', error: error.body().error }
    }
    db.prepare('INSERT INTO review_jobs (trip_id, id, source_id, payload) VALUES (?, ?, ?, ?)')
      .run(tripId, id, sourceId, JSON.stringify(job))
    return { jobId: id }
  })
}
