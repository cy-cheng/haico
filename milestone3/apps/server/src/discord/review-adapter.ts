import type { Actor, Id, TripPort } from '@waymark/contracts'
import { TripError } from '../review/service.js'
import { appHttpsOrigin, buildAcceptedCard, buildChangeProposalCard, parseReviewComponent, type ReviewMessage } from './review-cards.js'

export type ReviewMessageAddress = { channelId: Id; messageId: Id }
export type ReviewCardBinding = ReviewMessageAddress & { tripId: Id; proposalId: Id }

// The transport has already authenticated the event and resolved the clicker's member ID.
export type AuthenticatedReviewInteraction = ReviewMessageAddress & {
  id: Id
  memberId: Id
  customId: unknown
}

export interface ReviewMessageTransport {
  editMessage(address: ReviewMessageAddress, message: ReviewMessage): Promise<void>
}

type ReviewTrips = Pick<TripPort, 'forChannel' | 'view' | 'proposal' | 'run'>

function wrongCard(): never {
  throw new TripError(403, 'FORBIDDEN', 'This action does not belong to a review card you can access.')
}

export function createReviewAdapter(trips: ReviewTrips, transport: ReviewMessageTransport, appOrigin: string) {
  const origin = appHttpsOrigin(appOrigin)
  const bindings = new Map<Id, ReviewCardBinding>()
  const edits = new Map<Id, Promise<void>>()

  function register(binding: ReviewCardBinding): void {
    const prior = bindings.get(binding.messageId)
    if (prior && (prior.channelId !== binding.channelId || prior.tripId !== binding.tripId || prior.proposalId !== binding.proposalId)) {
      throw new Error('A review message cannot be rebound to another channel, trip, or proposal.')
    }
    bindings.set(binding.messageId, { ...binding })
  }

  function originalCard(address: ReviewMessageAddress): ReviewCardBinding {
    const card = bindings.get(address.messageId)
    if (!card || card.channelId !== address.channelId) return wrongCard()
    return card
  }

  async function checkChannel(actor: Actor, card: ReviewCardBinding): Promise<void> {
    const trip = await trips.forChannel(actor, card.channelId)
    if (trip?.id !== card.tripId || trip.channelId !== card.channelId) wrongCard()
  }

  async function inMessageOrder<T>(messageId: Id, work: () => Promise<T>): Promise<T> {
    // An older Discord edit must finish before the next fresh read for that message.
    const task = (edits.get(messageId) ?? Promise.resolve()).then(work)
    const tail = task.then(() => {}, () => {})
    edits.set(messageId, tail)
    try {
      return await task
    } finally {
      if (edits.get(messageId) === tail) edits.delete(messageId)
    }
  }

  async function repaint(actor: Actor, card: ReviewCardBinding): Promise<ReviewMessage> {
    let proposal = await trips.proposal(actor, card.tripId, card.proposalId)
    let view = await trips.view(actor, card.tripId)
    if (proposal.status === 'pending' && !view.pending.some(item => item.id === card.proposalId)) {
      // Another surface closed the proposal between the two reads.
      proposal = await trips.proposal(actor, card.tripId, card.proposalId)
      view = await trips.view(actor, card.tripId)
    }
    if (view.trip.id !== card.tripId || view.trip.channelId !== card.channelId) wrongCard()
    const message = proposal.status === 'accepted'
      ? buildAcceptedCard(view, proposal, origin)
      : buildChangeProposalCard(view, proposal, origin)
    await transport.editMessage({ channelId: card.channelId, messageId: card.messageId }, message)
    return message
  }

  async function refresh(actor: Actor, address: ReviewMessageAddress): Promise<ReviewMessage> {
    const card = originalCard(address)
    return inMessageOrder(card.messageId, async () => {
      await checkChannel(actor, card)
      return repaint(actor, card)
    })
  }

  async function handle(event: AuthenticatedReviewInteraction): Promise<boolean> {
    const component = parseReviewComponent(event.customId)
    if (!component || !/^[1-9]\d{0,19}$/.test(event.id)) return false
    const card = originalCard(event)
    const { tripId, command } = component
    if (tripId !== card.tripId || (command.kind === 'decide' && command.proposalId !== card.proposalId)) return wrongCard()
    const actor = { memberId: event.memberId }
    const id = event.id
    return inMessageOrder(card.messageId, async () => {
      await checkChannel(actor, card)
      if (command.kind !== 'decide') {
        const proposal = await trips.proposal(actor, card.tripId, card.proposalId)
        if (proposal.status !== 'accepted' || command.planVersion !== proposal.base.planVersion + 1) wrongCard()
      }
      try {
        await trips.run(actor, card.tripId, command, id)
      } catch (err) {
        if (err instanceof TripError && (err.code === 'STALE_BASE' || err.code === 'ALREADY_DECIDED')) {
          await repaint(actor, card)
        }
        throw err
      }
      // `run` can return the cached result of a retry, not the current trip.
      await repaint(actor, card)
      return true
    })
  }

  return { register, refresh, handle }
}
