import { useEffect, useState } from 'react'
import { Text, View } from 'react-native'
import type { Candidate, Day, Leg, Mode, Proposal, RouteOption, Stop, TripView } from '@waymark/contracts'
import { Plot } from '../map/places'
import { Button, Copy, ErrorText, Heading, Meta, Page, Panel, common, dateRange, formatDate, formatTime, p } from '../../ui/primitives'

export type Segment = { from: string; to: string; title: string }

function stopName(view: TripView, stop: Stop) {
  return view.memory.candidates.find((candidate) => candidate.id === stop.candidateId)?.label ?? stop.candidateId
}
function allStops(day: Day) { return [...day.stops, ...(day.split?.branches.flatMap((branch) => branch.stops) ?? [])] }

export function DayTimeline({ day, view, onPlace, onTransport, readonly = false }: {
  day: Day; view: TripView; onPlace(id: string): void; onTransport?(segment: Segment): void; readonly?: boolean;
}) {
  const names = (memberIds: string[]) => memberIds.map((id) => view.members.find((member) => member.id === id)?.name ?? id).join(' · ')
  const departure = <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}><Meta style={{ width: 56 }}>{formatTime(day.departAt)}</Meta>
    <View style={{ height: 11, width: 11, borderRadius: 7, borderWidth: 2, borderColor: p.forest }} /><Heading>Departure</Heading></View>
  const stopCard = (stop: Stop, label?: string, compact = false) => <View style={{ flexDirection: compact ? 'column' : 'row', gap: compact ? 3 : 9, alignItems: compact ? 'stretch' : 'center' }}>
    <View style={compact ? undefined : { width: 51 }}><Meta>{formatTime(stop.start)}{compact ? `–${formatTime(stop.end)}` : ''}</Meta>{!compact && <Meta style={{ fontWeight: '400' }}>{formatTime(stop.end)}</Meta>}</View>
    <Panel style={[{ flex: compact ? undefined : 1, alignItems: 'flex-start' }, label ? { backgroundColor: p.tint, borderColor: p.fine } : {}]}>
      {label && <Meta>{label}</Meta>}
      <Heading>{stopName(view, stop)}</Heading>
      {!compact && !readonly && <Button label="Place details" onPress={() => onPlace(stop.candidateId)} kind="quiet" />}
    </Panel>
  </View>
  const transport = (leg: Leg, compact = false) => {
    const from = allStops(day).find((stop) => stop.id === leg.fromStopId)
    const to = allStops(day).find((stop) => stop.id === leg.toStopId)
    if (!from || !to) return null
    const routeLabel = leg.route?.steps.find((step) => step.mode !== 'walk')?.mode ?? leg.mode
    const title = `${stopName(view, from)} to ${stopName(view, to)}`
    const summary = `${routeLabel === 'transit' ? 'Transit' : routeLabel[0].toUpperCase() + routeLabel.slice(1)}${leg.minutes == null ? '' : ` · ${leg.minutes} min`}`
    return <View key={`${leg.fromStopId}/${leg.toStopId}`} style={{ marginLeft: compact ? 0 : 60, alignItems: 'flex-start' }}>
      {onTransport && !readonly
        ? <Button label={`Transport · ${summary}`} onPress={() => onTransport({ from: leg.fromStopId, to: leg.toStopId, title })} kind="quiet" />
        : <Meta>{summary}</Meta>}
    </View>
  }
  return <View style={common.column}>
    {departure}
    {!day.stops.length && <Copy muted>No stops scheduled.</Copy>}
    {day.stops.map((stop) => <View key={stop.id} style={{ gap: 8 }}>
      {stopCard(stop, day.split?.meetingStopId === stop.id ? 'MEET BOTH GROUPS' : undefined)}
      {day.legs.filter((leg) => leg.fromStopId === stop.id).map((leg) => transport(leg))}
      {day.split?.afterStopId === stop.id && <View style={{ gap: 8 }}>
        <Meta style={{ paddingLeft: 60 }}>SPLIT INTO TWO GROUPS</Meta>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' }}>
          {day.split.branches.map((branch, index) => <View key={index}
            style={{ backgroundColor: index === 0 ? p.blueWash : p.blush, borderColor: index === 0 ? p.blue : p.orange, borderWidth: 1, borderRadius: 12, padding: 9, gap: 7, flex: 1, minWidth: 132 }}>
            <Meta style={{ color: index === 0 ? p.blue : p.orange }}>GROUP {index + 1} · {names(branch.memberIds)}</Meta>
            {branch.stops.map((entry) => <View key={entry.id} style={{ gap: 3 }}>{branch.legs.filter((leg) => leg.toStopId === entry.id).map((leg) => transport(leg, true))}
              {stopCard(entry, undefined, true)}</View>)}
            {branch.legs.filter((leg) => leg.toStopId === day.split?.meetingStopId).map((leg) => transport(leg, true))}
          </View>)}
        </View>
      </View>}
    </View>)}
  </View>
}

export function TripScreen({ view, date, onDate, actor, busy, onPlace, onTransport, onAsk, onProposal, onConfirm }: {
  view: TripView; date: string; onDate(date: string): void; actor: string; busy: boolean;
  onPlace(id: string): void; onTransport?(segment: Segment): void; onAsk?(date: string): void; onProposal(id: string): void; onConfirm(): void;
}) {
  const [map, setMap] = useState(false)
  const dates = dateRange(view.trip.firstDate, view.trip.lastDate)
  const accepted = view.accepted
  const day = accepted?.itinerary.days.find((entry) => entry.date === date)
  const scheduled = new Set(accepted?.itinerary.days.flatMap((entry) => allStops(entry).map((stop) => stop.candidateId)) ?? [])
  const draft = view.memory.candidates.filter((entry) => entry.state !== 'excluded' && !scheduled.has(entry.id))
  const inMap = new Set(day ? allStops(day).map((stop) => stop.candidateId) : [])
  const number = dates.indexOf(date)
  const confirmed = accepted?.confirmedBy.includes(actor)
  return <Page>
    <View style={common.row}>
      {dates.map((value, index) => <Button key={value} label={`Day ${index + 1}`} selected={date === value} onPress={() => onDate(value)} />)}
    </View>
    <View style={common.between}>
      <View style={common.grow}>
        <Meta>{date ? formatDate(date) : 'TRIP DATES'}</Meta>
        <Heading>{number >= 0 ? `Day ${number + 1}` : 'Itinerary'}</Heading>
      </View>
      {onAsk && <Button label="Ask AI" kind="dark" icon="chat" onPress={() => onAsk(date)} />}
    </View>
    {accepted ? <Panel style={{ backgroundColor: p.tint }}>
      <View style={common.between}><View style={common.grow}>
        <Meta>ACCEPTED · V{accepted.version}</Meta>
        <Copy>{accepted.confirmedBy.length}/{view.members.length} confirmed</Copy>
      </View>
      <Button label={confirmed ? 'Unconfirm' : 'Confirm'} onPress={onConfirm} disabled={busy} />
      </View>
    </Panel> : <Panel><Heading>No accepted itinerary yet</Heading><Copy muted>Ask Waymark to draft your trip, or review a pending proposal.</Copy></Panel>}
    {view.pending.map((proposal) => <Panel key={proposal.id}>
      <Meta>AWAITING REVIEW · {proposal.id}</Meta>
      <Copy>{proposal.differences[0] ?? 'Preview the proposed itinerary.'}</Copy>
      <Button label="Review proposal" icon="arrow" onPress={() => onProposal(proposal.id)} style={{ alignSelf: 'flex-start' }} />
    </Panel>)}
    {!!day && <>
      <View style={common.row}><Button label="Timeline" selected={!map} onPress={() => setMap(false)} /><Button label="Day map" selected={map} onPress={() => setMap(true)} /></View>
      {map ? <Plot candidates={view.memory.candidates.filter((entry) => inMap.has(entry.id))} stops={day.stops.map((stop) => stop.candidateId)} onPlace={onPlace} />
        : <DayTimeline day={day} view={view} onPlace={onPlace} onTransport={onTransport} />}
    </>}
    {!!accepted && !day && <Copy muted>No stops scheduled for this day.</Copy>}
    <View style={common.column}><Heading>Drafts · {draft.length}</Heading>
      <Copy muted>Saved places not yet in the accepted itinerary.</Copy>
      {draft.length === 0 ? <Copy muted>No unplaced candidates.</Copy> : <View style={common.row}>
        {draft.map((entry) => <Button key={entry.id} label={entry.label} onPress={() => onPlace(entry.id)} />)}
      </View>}
    </View>
  </Page>
}

const statusText = { pending: 'Pending review', accepted: 'Applied', stale: 'Out of date', rejected: 'Kept original' } as const

export function ProposalScreen({ proposal, view, busy, onApply, onReject, onEdit, onPlace }: {
  proposal: Proposal; view: TripView; busy: boolean; onApply(): void; onReject(): void; onEdit?(): void; onPlace(id: string): void;
}) {
  const inOriginal = (day: Day) => view.accepted?.itinerary.days.find((entry) => entry.date === day.date)
  const changed = proposal.preview.days.filter((day) => JSON.stringify(day) !== JSON.stringify(inOriginal(day)))
  const [showAll, setShowAll] = useState(false)
  const preview = showAll || changed.length === 0 ? proposal.preview.days : changed
  const unchanged = proposal.preview.days.length - changed.length
  const waiting = proposal.status === 'pending'
  return <Page>
    <Panel style={{ backgroundColor: waiting ? p.tint : p.paper, borderColor: p.fine }}>
      <Meta>{statusText[proposal.status].toUpperCase()} · {proposal.id}</Meta>
      <Heading>Version {proposal.base.planVersion} → {waiting ? 'preview' : statusText[proposal.status].toLowerCase()}</Heading>
      <Copy muted>{waiting ? `This preview does not change the accepted itinerary until you apply it.`
        : proposal.status === 'stale' ? 'The trip changed after this proposal was made. Review the current itinerary before proposing a new change.'
          : `The current accepted version is v${view.accepted?.version ?? 0}.`}</Copy>
      {waiting && <View style={common.row}>
        <Button label="Apply" kind="dark" disabled={busy} onPress={onApply} />
        <Button label="Keep original" disabled={busy} onPress={onReject} />
        {onEdit && <Button label="Edit" kind="quiet" disabled={busy} onPress={onEdit} />}
      </View>}
    </Panel>
    <Panel>
      <Heading>What changes</Heading>
      {proposal.differences.length === 0 && <Copy muted>No recorded differences.</Copy>}
      {proposal.differences.map((difference, index) => <Copy key={index}>• {difference}</Copy>)}
      {proposal.warnings.map((warning, index) => <ErrorText key={index} message={warning.message} />)}
    </Panel>
    {waiting && unchanged > 0 && <View style={common.between}>
      <Meta style={common.grow}>{unchanged} {unchanged === 1 ? 'day stays' : 'days stay'} unchanged</Meta>
      <Button label={showAll ? 'Show changed days' : 'Show all days'} kind="quiet" onPress={() => setShowAll(!showAll)} />
    </View>}
    {preview.map((day) => <View key={day.date} style={common.column}>
      <Heading>{formatDate(day.date)}</Heading>
      <DayTimeline day={day} view={view} onPlace={onPlace} readonly />
    </View>)}
    {proposal.sourceIds.length > 0 && <Panel>
      <Heading>Sources for this proposal</Heading>
      {proposal.sourceIds.map((id) => {
        const source = view.memory.sources.find((entry) => entry.id === id)
        return <Copy key={id}>{source ? source.text : id}</Copy>
      })}
    </Panel>}
  </Page>
}

export function TransportScreen({ segment, busy, onLoad, onUse }: {
  segment: Segment; busy: boolean; onLoad(modes: Mode[]): Promise<RouteOption[]>; onUse(option: RouteOption): void;
}) {
  const [modes, setModes] = useState<Mode[]>(['rail', 'bus'])
  const [options, setOptions] = useState<RouteOption[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [repeat, setRepeat] = useState(0)
  useEffect(() => {
    let live = true
    setLoading(true)
    setOptions(null)
    setError('')
    onLoad(modes).then((results) => { if (live) setOptions(results) })
      .catch((err) => { if (live) setError(err instanceof Error ? err.message : 'Could not load transport.') })
      .finally(() => { if (live) setLoading(false) })
    return () => { live = false }
  }, [modes, repeat, onLoad])
  const toggle = (mode: Mode) => setModes((current) => current.includes(mode) ? current.length === 1 ? current : current.filter((entry) => entry !== mode) : [...current, mode])
  return <Page>
    <Heading>{segment.title}</Heading>
    <View style={common.row}>
      <Button label="Rail" selected={modes.includes('rail')} onPress={() => toggle('rail')} />
      <Button label="Bus" selected={modes.includes('bus')} onPress={() => toggle('bus')} />
    </View>
    {loading && <Copy muted>Looking up transport options…</Copy>}
    {error && <Panel><ErrorText message={error} /><Button label="Retry transport" onPress={() => setRepeat((value) => value + 1)} /></Panel>}
    {options?.length === 0 && <Copy muted>No options for these modes.</Copy>}
    {options?.map((option) => <Panel key={option.id}>
      <Heading>{option.minutes === null ? 'Time not available' : `${option.minutes} min`}</Heading>
      <Copy>{option.fare ? `${option.fare.amount} ${option.fare.currency}` : 'Fare not available'} · {option.transfers === null ? 'Transfers unknown' : `${option.transfers} ${option.transfers === 1 ? 'transfer' : 'transfers'}`}</Copy>
      {option.steps.map((step, index) => <Copy key={index} muted>{step.label}{step.minutes === null ? '' : ` · ${step.minutes} min`}</Copy>)}
      <Button label="Use this route" kind="dark" disabled={busy} onPress={() => onUse(option)} style={{ alignSelf: 'flex-start' }} />
    </Panel>)}
  </Page>
}
