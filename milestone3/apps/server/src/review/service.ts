import type { DatabaseSync } from 'node:sqlite'
import type { AcceptedPlan, ApiError, Base, Command, JobRef, MemoryEdit, Proposal, SyncCommand, TripView } from '@waymark/contracts'
import { migrate, readTrip, saveTrip, transaction } from '../db/index.js'

export class TripError extends Error {
  constructor(readonly status: number, readonly code: string, message: string, readonly current?: Base) {
    super(message)
  }

  body(): ApiError {
    return { error: { code: this.code, message: this.message, ...(this.current && { current: this.current }) } }
  }
}

export function setupReview(db: DatabaseSync): void {
  migrate(db, [{ id: 'review-v1', sql: `
    CREATE TABLE review_proposals (
      trip_id TEXT NOT NULL, id TEXT NOT NULL, payload TEXT NOT NULL,
      PRIMARY KEY (trip_id, id)
    );
    CREATE TABLE review_versions (
      trip_id TEXT NOT NULL, version INTEGER NOT NULL, payload TEXT NOT NULL,
      PRIMARY KEY (trip_id, version)
    );
    CREATE TABLE review_operations (
      trip_id TEXT NOT NULL, member_id TEXT NOT NULL, key TEXT NOT NULL,
      command TEXT NOT NULL, response TEXT NOT NULL,
      PRIMARY KEY (trip_id, member_id, key)
    );
  ` }, { id: 'review-manual-jobs-v1', sql: `
    CREATE TABLE review_jobs (
      trip_id TEXT NOT NULL REFERENCES trips(id), id TEXT NOT NULL,
      source_id TEXT NOT NULL, payload TEXT NOT NULL CHECK (json_valid(payload)),
      PRIMARY KEY (trip_id, id)
    ) STRICT;
  ` }])
}

export function memberTrip(db: DatabaseSync, tripId: string, memberId: string): TripView {
  const trip = readTrip(db, tripId)
  if (!trip) throw new TripError(404, 'NOT_FOUND', 'Trip not found.')
  if (!trip.members.some(member => member.id === memberId)) {
    throw new TripError(403, 'FORBIDDEN', 'You are not a member of this trip.')
  }
  return trip
}

export function storeProposal(db: DatabaseSync, tripId: string, proposal: Proposal): void {
  db.prepare(`INSERT INTO review_proposals VALUES (?, ?, ?)
    ON CONFLICT(trip_id, id) DO UPDATE SET payload = excluded.payload`)
    .run(tripId, proposal.id, JSON.stringify(proposal))
}

export function getProposal(db: DatabaseSync, view: TripView, id: string): Proposal {
  const pending = view.pending.find(proposal => proposal.id === id)
  if (pending) return pending
  const row = db.prepare('SELECT payload FROM review_proposals WHERE trip_id = ? AND id = ?').get(view.trip.id, id)
  if (!row) throw new TripError(404, 'NOT_FOUND', 'Proposal not found.')
  return JSON.parse(String(row.payload)) as Proposal
}

function archiveAccepted(db: DatabaseSync, view: TripView): void {
  if (!view.accepted) return
  db.prepare(`INSERT INTO review_versions VALUES (?, ?, ?)
    ON CONFLICT(trip_id, version) DO UPDATE SET payload = excluded.payload`)
    .run(view.trip.id, view.accepted.version, JSON.stringify(view.accepted))
}

export function getAccepted(db: DatabaseSync, view: TripView, version: number): AcceptedPlan {
  if (view.accepted?.version === version) return view.accepted
  const row = db.prepare('SELECT payload FROM review_versions WHERE trip_id = ? AND version = ?').get(view.trip.id, version)
  if (!row) throw new TripError(404, 'NOT_FOUND', 'Accepted version not found.')
  return JSON.parse(String(row.payload)) as AcceptedPlan
}

function base(view: TripView): Base {
  return { planVersion: view.accepted?.version ?? 0, memoryRevision: view.memory.revision }
}

function stale(view: TripView): never {
  throw new TripError(409, 'STALE_BASE', 'Refresh this trip and review the new version.', base(view))
}

export function requireBase(view: TripView, expected: Base): void {
  const current = base(view)
  if (expected.planVersion !== current.planVersion || expected.memoryRevision !== current.memoryRevision) stale(view)
}

function closeOutdatedProposals(db: DatabaseSync, view: TripView, appliedId?: string): void {
  const current = base(view)
  view.pending = view.pending.filter(proposal => {
    if (proposal.id === appliedId) return false
    if (proposal.base.planVersion === current.planVersion && proposal.base.memoryRevision === current.memoryRevision) return true
    storeProposal(db, view.trip.id, { ...proposal, status: 'stale' })
    return false
  })
}

export function pendingProposal(db: DatabaseSync, view: TripView, id: string): Proposal {
  const proposal = getProposal(db, view, id)
  if (proposal.status === 'stale') stale(view)
  if (proposal.status !== 'pending') throw new TripError(409, 'ALREADY_DECIDED', 'This proposal has already been closed.', base(view))
  return proposal
}

function decide(db: DatabaseSync, view: TripView, id: string, action: 'apply' | 'reject'): void {
  const proposal = pendingProposal(db, view, id)
  if (action === 'apply') {
    requireBase(view, proposal.base)
    archiveAccepted(db, view)
    view.accepted = { version: proposal.base.planVersion + 1, itinerary: proposal.preview, confirmedBy: [] }
    closeOutdatedProposals(db, view, id)
    archiveAccepted(db, view)
  } else {
    view.pending = view.pending.filter(other => other.id !== id)
  }
  storeProposal(db, view.trip.id, { ...proposal, status: action === 'apply' ? 'accepted' : 'rejected' })
}

function editCandidate(view: TripView, memberId: string, revision: number, edit: MemoryEdit): void {
  if (view.memory.revision !== revision) stale(view)
  if (edit.kind === 'vote_option') {
    const poll = view.memory.summaries.find(summary => summary.id === edit.summaryId)?.poll
    if (!poll || poll.id !== edit.pollId || (edit.optionId !== null && !poll.options.some(option => option.id === edit.optionId))) {
      throw new TripError(422, 'INVALID_INPUT', 'Unknown poll or option.')
    }
    const changed = poll.options.some(option => option.voterIds.includes(memberId) !== (option.id === edit.optionId))
    if (!changed) return
    for (const option of poll.options) {
      option.voterIds = option.voterIds.filter(voter => voter !== memberId)
      if (option.id === edit.optionId) option.voterIds.push(memberId)
    }
  } else if (edit.kind === 'vote' || edit.kind === 'set_candidate_note') {
    const candidate = view.memory.candidates.find(item => item.id === edit.candidateId)
    if (!candidate) throw new TripError(404, 'NOT_FOUND', 'Candidate not found.')
    if (edit.kind === 'vote') {
      if ((candidate.votes.find(vote => vote.memberId === memberId)?.value ?? null) === edit.value) return
      candidate.votes = candidate.votes.filter(vote => vote.memberId !== memberId)
      if (edit.value !== null) candidate.votes.push({ memberId, value: edit.value })
    } else {
      if ((candidate.notes?.find(note => note.memberId === memberId)?.text ?? null) === edit.text) return
      candidate.notes = (candidate.notes ?? []).filter(note => note.memberId !== memberId)
      if (edit.text !== null) candidate.notes.push({ memberId, text: edit.text })
    }
  } else {
    throw new TripError(422, 'UNSUPPORTED_COMMAND', 'This memory edit is not available in the local preview.')
  }
  view.memory.revision += 1
}

// Callers pass validated commands. Normalized JSON makes retries insensitive to field order.
function commandFingerprint(value: unknown): string {
  if (Array.isArray(value)) return '[' + value.map(commandFingerprint).join(',') + ']'
  if (value && typeof value === 'object') {
    return '{' + Object.entries(value).sort(([a], [b]) => a.localeCompare(b))
      .map(([key, item]) => JSON.stringify(key) + ':' + commandFingerprint(item)).join(',') + '}'
  }
  return JSON.stringify(value)
}

export function runOperation<T extends TripView | JobRef>(
  db: DatabaseSync, tripId: string, memberId: string, key: string, command: Command, apply: (view: TripView) => T,
): T {
  return transaction<TripView | JobRef>(db, () => {
    const view = memberTrip(db, tripId, memberId)
    const signature = commandFingerprint(command)
    const previous = db.prepare('SELECT command, response FROM review_operations WHERE trip_id = ? AND member_id = ? AND key = ?')
      .get(tripId, memberId, key)
    if (previous) {
      if (previous.command !== signature) throw new TripError(409, 'KEY_REUSED', 'This key was already used for a different command.')
      return JSON.parse(String(previous.response)) as TripView | JobRef
    }
    const response = apply(view)
    saveTrip(db, view)
    db.prepare('INSERT INTO review_operations VALUES (?, ?, ?, ?, ?)').run(tripId, memberId, key, signature, JSON.stringify(response))
    return response
  }) as T
}

export function runCommand(db: DatabaseSync, tripId: string, memberId: string, key: string, command: SyncCommand): TripView {
  return runOperation(db, tripId, memberId, key, command, view => {
    switch (command.kind) {
      case 'decide': decide(db, view, command.proposalId, command.action); break
      case 'confirm':
      case 'unconfirm': {
        if (!view.accepted || view.accepted.version !== command.planVersion) stale(view)
        const confirmed = new Set(view.accepted.confirmedBy)
        if (command.kind === 'confirm') confirmed.add(memberId)
        else confirmed.delete(memberId)
        view.accepted.confirmedBy = [...confirmed]
        archiveAccepted(db, view)
        break
      }
      case 'pause':
        view.collection = 'paused'
        break
      case 'edit_memory':
        editCandidate(view, memberId, command.memoryRevision, command.edit)
        if (view.memory.revision !== command.memoryRevision) closeOutdatedProposals(db, view)
        break
      default:
        throw new TripError(422, 'UNSUPPORTED_COMMAND', 'This command is not available in the local preview.')
    }
    return view
  })
}
