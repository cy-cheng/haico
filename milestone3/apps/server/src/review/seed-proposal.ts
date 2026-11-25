import type { DatabaseSync } from 'node:sqlite'
import type { DraftResult, Proposal } from '@waymark/contracts'
import changes from '../../../../fixtures/day3-patch.json' with { type: 'json' }
import { isDemoTrip, readTrip, saveTrip, transaction } from '../db/index.js'
import { manualPreview } from './manual.js'
import { setupReview, storeProposal } from './service.js'

export function seedReviewDemo(db: DatabaseSync): void {
  setupReview(db)
  transaction(db, () => {
    if (!isDemoTrip(db)) return
    const view = readTrip(db, 'osaka')
    if (!view?.accepted || view.accepted.version !== 1 || view.memory.revision !== 4) return
    const prior = db.prepare('SELECT 1 FROM review_proposals WHERE trip_id = ? AND id = ?').get('osaka', 'p7')
    if (prior) return
    const patch = changes as Extract<DraftResult, { kind: 'patch' }>
    const proposal: Proposal = {
      id: 'p7', base: { planVersion: 1, memoryRevision: 4 }, status: 'pending',
      ...manualPreview(view, view.accepted.itinerary, patch.changes), warnings: [], sourceIds: patch.sourceIds
    }
    view.memory.sources.push({ id: 'm3', origin: 'discord', authorId: 'mia',
      text: 'Start Day 3 at 11:00 and skip Osaka Castle.', url: null, at: '2026-11-19T21:02:00+09:00' })
    view.pending.push(proposal)
    storeProposal(db, view.trip.id, proposal)
    saveTrip(db, view)
  })
}
