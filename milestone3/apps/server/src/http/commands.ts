import type { ManualChange, MemoryEdit, Reaction, SyncCommand } from '@waymark/contracts'
import type { ManualPlanCommand } from '../review/manual-jobs.js'
import { TripError } from '../review/service.js'

function invalid(message: string): never {
  throw new TripError(422, 'INVALID_INPUT', message)
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) invalid('Expected a JSON object.')
  return value as Record<string, unknown>
}

function string(value: unknown, field: string, max = 256): string {
  if (typeof value !== 'string' || !value.trim() || value.length > max) invalid('Invalid ' + field + '.')
  return value
}

function number(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) invalid('Invalid ' + field + '.')
  return value
}

function only(obj: Record<string, unknown>, names: string[]) {
  if (Object.keys(obj).some(key => !names.includes(key))) invalid('Unexpected command field.')
}

function memoryEdit(value: unknown): MemoryEdit {
  const edit = record(value)
  switch (edit.kind) {
    case 'vote': {
      only(edit, ['kind', 'candidateId', 'value'])
      if (edit.value !== null && !['heart', 'check', 'minus', 'cross'].includes(String(edit.value))) invalid('Unknown reaction.')
      if (edit.value !== null && typeof edit.value !== 'string') invalid('Invalid reaction.')
      return { kind: edit.kind, candidateId: string(edit.candidateId, 'candidateId'), value: edit.value as Reaction | null }
    }
    case 'set_candidate_note':
      only(edit, ['kind', 'candidateId', 'text'])
      return { kind: edit.kind, candidateId: string(edit.candidateId, 'candidateId'), text: edit.text === null ? null : string(edit.text, 'text', 2000) }
    case 'vote_option':
      only(edit, ['kind', 'summaryId', 'pollId', 'optionId'])
      return { kind: edit.kind, summaryId: string(edit.summaryId, 'summaryId'), pollId: string(edit.pollId, 'pollId'), optionId: edit.optionId === null ? null : string(edit.optionId, 'optionId') }
    default: throw new TripError(422, 'UNSUPPORTED_COMMAND', 'This memory edit is not available in the local preview.')
  }
}

function tripDate(value: unknown): string {
  const date = string(value, 'date', 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) invalid('Use a date in YYYY-MM-DD format.')
  return date
}

function instant(value: unknown, field: string): string {
  const time = string(value, field, 64)
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(time)
    || !Number.isFinite(Date.parse(time))) invalid('Use an ISO timestamp with a timezone offset for ' + field + '.')
  return time
}

function manualChange(value: unknown): ManualChange {
  const change = record(value)
  switch (change.kind) {
    case 'retime_day':
      only(change, ['kind', 'date', 'departAt'])
      return { kind: change.kind, date: tripDate(change.date), departAt: instant(change.departAt, 'departAt') }
    case 'add_stop':
      only(change, ['kind', 'date', 'candidateId', 'start', 'end'])
      return { kind: change.kind, date: tripDate(change.date), candidateId: string(change.candidateId, 'candidateId'),
        start: instant(change.start, 'start'), end: instant(change.end, 'end') }
    case 'remove_stop':
      only(change, ['kind', 'stopId'])
      return { kind: change.kind, stopId: string(change.stopId, 'stopId') }
    case 'retime':
      only(change, ['kind', 'stopId', 'start', 'end'])
      return { kind: change.kind, stopId: string(change.stopId, 'stopId'), start: instant(change.start, 'start'), end: instant(change.end, 'end') }
    default:
      throw new TripError(422, 'UNSUPPORTED_COMMAND', 'This manual change is not available in the local preview.')
  }
}

function manualPlan(cmd: Record<string, unknown>): ManualPlanCommand {
  only(cmd, ['kind', 'base', 'request', 'replacesProposalId'])
  const base = record(cmd.base)
  only(base, ['planVersion', 'memoryRevision'])
  const request = record(cmd.request)
  if (request.kind !== 'manual') throw new TripError(422, 'UNSUPPORTED_COMMAND', 'Choose a manual itinerary change.')
  only(request, ['kind', 'changes'])
  if (!Array.isArray(request.changes) || !request.changes.length || request.changes.length > 64) {
    invalid('Supply between 1 and 64 manual changes per request.')
  }
  return {
    kind: 'plan', base: { planVersion: number(base.planVersion, 'planVersion'), memoryRevision: number(base.memoryRevision, 'memoryRevision') },
    request: { kind: 'manual', changes: request.changes.map(manualChange) },
    ...('replacesProposalId' in cmd && { replacesProposalId: string(cmd.replacesProposalId, 'replacesProposalId') }),
  }
}

export function readCommand(value: unknown): SyncCommand | ManualPlanCommand {
  const cmd = record(value)
  switch (cmd.kind) {
    case 'plan':
      return manualPlan(cmd)
    case 'decide':
      only(cmd, ['kind', 'proposalId', 'action'])
      if (cmd.action !== 'apply' && cmd.action !== 'reject') invalid('Choose apply or reject.')
      return { kind: cmd.kind, proposalId: string(cmd.proposalId, 'proposalId'), action: cmd.action }
    case 'confirm':
    case 'unconfirm':
      only(cmd, ['kind', 'planVersion'])
      return { kind: cmd.kind, planVersion: number(cmd.planVersion, 'planVersion') }
    case 'pause':
      only(cmd, ['kind'])
      return { kind: cmd.kind }
    case 'edit_memory':
      only(cmd, ['kind', 'memoryRevision', 'edit'])
      return { kind: cmd.kind, memoryRevision: number(cmd.memoryRevision, 'memoryRevision'), edit: memoryEdit(cmd.edit) }
    default: throw new TripError(422, 'UNSUPPORTED_COMMAND', 'This command is not available in the local preview.')
  }
}
