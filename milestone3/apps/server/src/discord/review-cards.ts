import type { Id, Proposal, SyncCommand, TripView } from '@waymark/contracts'

export type ReviewCommand = Extract<SyncCommand, { kind: 'decide' | 'confirm' | 'unconfirm' }>

type CommandButton = { type: 2; style: 1 | 2; label: string; custom_id: string }
type LinkButton = { type: 2; style: 5; label: string; url: string }
export type ReviewMessage = {
  content: string
  components: [{ type: 1; components: (CommandButton | LinkButton)[] }]
  allowed_mentions: { parse: [] }
  flags: 4
}

const cardPrefix = 'wm:review:'
const reviewId = /^[A-Za-z0-9_-]{1,40}$/

export function parseReviewComponent(customId: unknown): { tripId: Id; command: ReviewCommand } | null {
  if (typeof customId !== 'string' || customId.length > 100 || !customId.startsWith(cardPrefix)) return null
  const [action, tripId, target, ...rest] = customId.slice(cardPrefix.length).split(':')
  if (rest.length || !tripId || !target || !reviewId.test(tripId)) return null
  if (action === 'apply' || action === 'reject') {
    return reviewId.test(target) ? { tripId, command: { kind: 'decide', proposalId: target, action } } : null
  }
  if (action !== 'confirm' && action !== 'unconfirm') return null
  const planVersion = Number(target)
  if (!/^[1-9]\d{0,15}$/.test(target) || !Number.isSafeInteger(planVersion)) return null
  return { tripId, command: { kind: action, planVersion } }
}

function commandButton(tripId: Id, action: 'apply' | 'reject' | 'confirm' | 'unconfirm', target: Id | number,
  label: string, style: 1 | 2): CommandButton {
  const custom_id = `${cardPrefix}${action}:${tripId}:${target}`
  if (!parseReviewComponent(custom_id)) throw new Error('Review button has an unsupported trip, proposal, or version ID.')
  return { type: 2, style, label, custom_id }
}

export function appHttpsOrigin(value: string): string {
  const url = new URL(value)
  if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    throw new Error('Waymark app links require an HTTPS origin with no credentials or path.')
  }
  return url.origin
}

function appButton(appOrigin: string, tripId: Id, proposalId?: Id): LinkButton {
  if (!reviewId.test(tripId) || (proposalId !== undefined && !reviewId.test(proposalId))) {
    throw new Error('The app link has an unsupported trip or proposal ID.')
  }
  const path = `/trips/${tripId}` + (proposalId === undefined ? '' : `/proposals/${proposalId}`)
  return { type: 2, style: 5, label: 'Open in app', url: new URL(path, appHttpsOrigin(appOrigin)).href }
}

function plain(text: string, max: number): string {
  const escaped = text.replace(/\s+/g, ' ').trim().replace(/[\\`*_~|<>()[\]#!]/g, '\\$&')
  return escaped.length <= max ? escaped : escaped.slice(0, max - 1).replace(/[\\\uD800-\uDBFF]$/, '') + '…'
}

function sourceLines(view: TripView, proposal: Proposal): string[] {
  if (!proposal.sourceIds.length) return ['No source recorded.']
  const lines = proposal.sourceIds.slice(0, 2).map(id => {
    const source = view.memory.sources.find(item => item.id === id)
    const author = view.members.find(member => member.id === source?.authorId)?.name ?? source?.authorId
    if (!source || !author) return `• ${plain(id, 40)} (source not in this snapshot)`
    return `• ${plain(author, 40)} (${plain(id, 40)}) · ${plain(source.text, 180)}`
  })
  if (proposal.sourceIds.length > lines.length) lines.push('More sources in the app.')
  return lines
}

function message(lines: string[], buttons: (CommandButton | LinkButton)[]): ReviewMessage {
  return {
    content: lines.join('\n'),
    components: [{ type: 1, components: buttons }],
    allowed_mentions: { parse: [] },
    flags: 4, // Suppress link previews in source excerpts.
  }
}

export function buildChangeProposalCard(view: TripView, proposal: Proposal, appOrigin: string): ReviewMessage {
  const tripId = view.trip.id
  const status = { pending: 'Pending review', accepted: 'Accepted', rejected: 'Original kept', stale: 'Out of date' }[proposal.status]
  const differences = proposal.differences.slice(0, 4).map(diff => `• ${plain(diff, 170)}`)
  if (proposal.differences.length > differences.length) differences.push('More changes in the app.')
  const warning = proposal.warnings[0]
  return message([
    `**Change proposal · ${plain(view.trip.name, 80)}**`,
    `${status} · Base v${proposal.base.planVersion} · Memory revision ${proposal.base.memoryRevision}`,
    '', '**Changes**', ...(differences.length ? differences : ['No itinerary changes.']),
    ...(warning ? [`**Note** ${plain(warning.message, 180)}`] : []),
    '', '**Source**', ...sourceLines(view, proposal),
  ], [
    ...(proposal.status === 'pending' ? [
      commandButton(tripId, 'apply', proposal.id, 'Apply', 1),
      commandButton(tripId, 'reject', proposal.id, 'Keep original', 2),
    ] : []),
    appButton(appOrigin, tripId, proposal.id),
  ])
}

export function buildAcceptedCard(view: TripView, proposal: Proposal, appOrigin: string): ReviewMessage {
  const accepted = view.accepted
  if (!accepted || proposal.status !== 'accepted') throw new Error('The proposal has not been accepted.')
  const planVersion = accepted.version
  const proposalVersion = proposal.base.planVersion + 1
  const memberIds = new Set(view.members.map(member => member.id))
  const confirmedBy = new Set(accepted.confirmedBy.filter(id => memberIds.has(id)))
  return message([
    `**${plain(view.trip.name, 80)} · Accepted v${planVersion}**`,
    `${confirmedBy.size}/${memberIds.size} members confirmed`,
    planVersion === proposalVersion ? 'Confirm or withdraw your own confirmation.'
      : `This proposal created v${proposalVersion}. Open the app to review the current version.`,
    '', '**Source**', ...sourceLines(view, proposal),
  ], [
    ...(planVersion === proposalVersion ? [
      commandButton(view.trip.id, 'confirm', planVersion, 'Confirm', 1),
      commandButton(view.trip.id, 'unconfirm', planVersion, 'Unconfirm', 2),
    ] : []),
    appButton(appOrigin, view.trip.id),
  ])
}
