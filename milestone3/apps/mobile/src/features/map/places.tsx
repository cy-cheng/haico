import { useState } from 'react'
import { Pressable, View, type DimensionValue } from 'react-native'
import Svg, { Line, Path, Rect } from 'react-native-svg'
import type { Candidate, MemoryEdit, Place, Reaction, Source, TripView } from '@waymark/contracts'
import { Button, Copy, ErrorText, Heading, Input, Meta, Page, Panel, common, dateRange, formatDate, formatSourceDate, localTripTime, openExternal, p } from '../../ui/primitives'

export function Plot({ candidates, onPlace, stops }: {
  candidates: Candidate[]; onPlace(id: string): void; stops?: string[];
}) {
  const markers = candidates.flatMap((entry) => entry.place?.coordinates ? [{ entry, ...entry.place.coordinates }] : [])
  if (!markers.length) return <Panel><Copy muted>No locations with coordinates in this view.</Copy></Panel>
  const lats = markers.map((pin) => pin.lat)
  const lngs = markers.map((pin) => pin.lng)
  const lat = Math.min(...lats)
  const lng = Math.min(...lngs)
  const latSpan = Math.max(Math.max(...lats) - lat, 0.004)
  const lngSpan = Math.max(Math.max(...lngs) - lng, 0.004)
  const mapped = markers.map((pin) => ({
    ...pin,
    x: lats.length === 1 ? 50 : 15 + 70 * (pin.lng - lng) / lngSpan,
    y: lats.length === 1 ? 50 : 75 - 58 * (pin.lat - lat) / latSpan,
  }))
  const route = (stops ?? []).flatMap((id) => mapped.find((pin) => pin.entry.id === id) ?? [])
  return <View style={{ height: 230, position: 'relative', backgroundColor: p.tint, borderRadius: 14, borderWidth: 1, borderColor: p.fine }}>
    <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute' }} accessible={false}>
      <Rect x="1" y="1" width="98" height="98" rx="3" fill="#dfe8df" />
      {[10, 22, 34, 46, 58, 70, 82, 94].map((line) => <Line key={`x${line}`} x1={line} x2={line} y1="0" y2="100" stroke="#f5f7f1" strokeWidth="0.5" />)}
      {[13, 27, 41, 55, 69, 83].map((line) => <Line key={`y${line}`} x1="0" x2="100" y1={line} y2={line} stroke="#f5f7f1" strokeWidth="0.7" />)}
      {route.length > 1 && <Path d={route.map(({ x, y }, index) => `${index ? 'L' : 'M'}${x} ${y}`).join(' ')}
        fill="none" stroke={p.forest} strokeWidth="0.8" strokeDasharray="1.6 1.2" />}
    </Svg>
    <Meta style={{ position: 'absolute', left: 11, top: 7 }}>N ↑</Meta>
    {mapped.map(({ entry, x, y }, index) => <Pressable key={entry.id} accessibilityRole="button" accessibilityLabel={`Open ${entry.label}`}
      onPress={() => onPlace(entry.id)}
      style={({ pressed }) => ({
        position: 'absolute', left: `${x}%` as DimensionValue, top: `${y}%` as DimensionValue, marginLeft: -22, marginTop: -22,
        width: 44, height: 44, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.6 : 1,
      })}>
      <View style={{ backgroundColor: entry.tags?.includes('Food') ? p.orange : p.forest, borderRadius: 14, borderWidth: 2, borderColor: p.paper, width: 25, height: 25, justifyContent: 'center', alignItems: 'center' }}>
        <Meta style={{ color: p.white, fontSize: 11 }}>{index + 1}</Meta>
      </View>
    </Pressable>)}
    <Meta style={{ position: 'absolute', right: 8, bottom: 6, backgroundColor: '#dfe8df' }}>Place positions · No street detail</Meta>
  </View>
}

export function MapScreen({ view, onPlace, onAsk }: { view: TripView; onPlace(id: string): void; onAsk?(): void }) {
  const [query, setQuery] = useState('')
  const [city, setCity] = useState('')
  const [category, setCategory] = useState('')
  const active = view.memory.candidates.filter((entry) => entry.state !== 'excluded')
  const cities = [...new Set([...(view.trip.details?.cities ?? []), ...active.flatMap((entry) => entry.place?.city ? [entry.place.city] : [])])]
  const tags = [...new Set(active.flatMap((entry) => entry.tags ?? []))]
  const filtered = active.filter((entry) =>
    `${entry.label} ${entry.place?.address ?? ''} ${entry.place?.city ?? ''}`.toLowerCase().includes(query.trim().toLowerCase())
    && (!city || entry.place?.city === city) && (!category || entry.tags?.includes(category)))
  const withCoordinates = filtered.filter((entry) => entry.place?.coordinates)
  return <Page>
    <Input accessibilityLabel="Search saved places" value={query} onChangeText={setQuery} placeholder="Search saved places" returnKeyType="search" />
    {cities.length > 0 && <View style={common.row}>
      <Button label="All cities" selected={!city} onPress={() => setCity('')} />
      {cities.map((name) => <Button key={name} label={name} selected={city === name} onPress={() => setCity(name)} />)}
    </View>}
    {tags.length > 0 && <View style={common.row}>
      <Button label="All categories" kind="quiet" selected={!category} onPress={() => setCategory('')} />
      {tags.map((name) => <Button key={name} label={name} kind="quiet" selected={category === name} onPress={() => setCategory(name)} />)}
    </View>}
    <Plot candidates={filtered} onPlace={onPlace} />
    <View style={common.between}><Heading>{filtered.length} saved {filtered.length === 1 ? 'place' : 'places'}</Heading>{onAsk && <Button label="Ask AI" icon="chat" onPress={onAsk} />}</View>
    {filtered.length === 0 && <Copy muted>No places match these filters.</Copy>}
    {filtered.map((entry) => {
      const number = withCoordinates.indexOf(entry) + 1
      return <Pressable key={entry.id} onPress={() => onPlace(entry.id)} accessibilityRole="button" accessibilityLabel={`Open ${entry.label}`}
        style={({ pressed }) => [common.panel, common.between, { opacity: pressed ? 0.7 : 1 }]}>
        <View style={common.grow}>
          <Heading>{number > 0 ? `${number} · ` : ''}{entry.label}</Heading>
          <Meta>{[entry.place?.city, entry.tags?.join(', '), `${entry.sourceIds.length} ${entry.sourceIds.length === 1 ? 'source' : 'sources'}`].filter(Boolean).join(' · ')}</Meta>
        </View>
        <Meta>{entry.state === 'unresolved' ? 'Needs details' : ''} ›</Meta>
      </Pressable>
    })}
  </Page>
}

export function SourceLink({ source, view, onExternal }: { source: Source; view: TripView; onExternal(url: string): void }) {
  const author = view.members.find((member) => member.id === source.authorId)?.name ?? source.authorId
  return <View style={common.column}>
    <Meta>{author} · {formatSourceDate(source.at, view.trip.timezone)} · {source.origin === 'app' ? 'App' : 'Discord'}</Meta>
    <Copy>{source.text}</Copy>
    <View style={common.row}>
      {source.url && <Button label="Discord message" kind="quiet" onPress={() => onExternal(source.url!)} />}
      {source.sharedPost?.url && <Button label={`Open ${source.sharedPost.platform} post`} kind="quiet" onPress={() => onExternal(source.sharedPost!.url)} />}
    </View>
  </View>
}

const reactions: [Reaction, string][] = [['heart', 'Must go'], ['check', 'Want to'], ['minus', 'No opinion'], ['cross', 'Skip']]

export function PlaceScreen({ view, candidate, actor, busy, onEdit, onPlan, onSearch, onExternal, resolveAvailable = true }: {
  resolveAvailable?: boolean; view: TripView; candidate: Candidate; actor: string; busy: boolean; onEdit(edit: MemoryEdit): void;
  onPlan(slot: { date: string; start: string; end: string }): void; onSearch(query: string): Promise<Place[]>; onExternal(url: string): void;
}) {
  const [note, setNote] = useState(candidate.notes?.find((note) => note.memberId === actor)?.text ?? '')
  const [choice, setChoice] = useState('')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Place[] | null>(null)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState('')
  const [date, setDate] = useState('')
  const [start, setStart] = useState('14:00')
  const [end, setEnd] = useState('14:45')
  const days = dateRange(view.trip.firstDate, view.trip.lastDate)
  const booked = view.accepted?.itinerary.days.filter((day) =>
    [...day.stops, ...(day.split?.branches.flatMap((branch) => branch.stops) ?? [])].some((stop) => stop.candidateId === candidate.id)).map((day) => day.date) ?? []
  const ownVote = candidate.votes.find((vote) => vote.memberId === actor)?.value
  const venue = candidate.place
  const isTime = (value: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(value)

  async function search() {
    setSearching(true)
    setChoice('')
    setError('')
    try { setResults(await onSearch(query.trim())) }
    catch (err) { setError(err instanceof Error ? err.message : 'Place search failed.') }
    finally { setSearching(false) }
  }

  return <Page>
    <Panel style={{ backgroundColor: p.tint }}>
      <Meta>{[venue?.city, candidate.tags?.join(', ')].filter(Boolean).join(' · ') || 'SAVED PLACE'}</Meta>
      <Heading>{candidate.label}</Heading>
      <Copy muted>{venue?.address || (venue ? 'Address not provided.' : 'Needs a confirmed location.')}</Copy>
      {candidate.description && <Copy>{candidate.description}</Copy>}
      {venue && <Button label="Open in Google Maps" kind="outline" onPress={() => onExternal(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([venue.name, venue.address, venue.city].filter(Boolean).join(' '))}`)} style={{ alignSelf: 'flex-start' }} />}
      {booked.length > 0 && <Meta>Scheduled · {booked.map(formatDate).join(' · ')}</Meta>}
    </Panel>

    {candidate.state === 'unresolved' && !resolveAvailable && <Copy muted>Place lookup is unavailable on this test server.</Copy>}
    {candidate.state === 'unresolved' && resolveAvailable && <Panel>
      <Heading>Match this place</Heading>
      <Copy muted>Choose a result to keep the original share attached to this candidate.</Copy>
      <Input accessibilityLabel="Search for matching places" placeholder="Name or address" value={query} onChangeText={setQuery} onSubmitEditing={() => { if (query.trim()) void search() }} />
      <Button label={searching ? 'Searching…' : 'Search places'} onPress={() => void search()} disabled={searching || !query.trim()} />
      {error && <ErrorText message={error} />}
      {results?.length === 0 && <Copy muted>No matches. Try another address or name.</Copy>}
      {(results ?? candidate.choices).map((place) => <Button key={place.id} label={[place.name, place.address].filter(Boolean).join(' · ')} selected={choice === place.id} onPress={() => setChoice(place.id)} />)}
      <View style={common.row}>
        <Button label="Save match" kind="dark" disabled={busy || !choice} onPress={() => onEdit({ kind: 'resolve', candidateId: candidate.id, placeId: choice })} />
        <Button label="Not this time" disabled={busy} onPress={() => onEdit({ kind: 'exclude', candidateId: candidate.id })} />
      </View>
    </Panel>}

    <Panel>
      <Heading>Group reactions</Heading>
      <View style={common.row}>{reactions.map(([reaction, label]) => <Button key={reaction} label={`${label} · ${candidate.votes.filter((vote) => vote.value === reaction).length}`}
        selected={ownVote === reaction} disabled={busy} onPress={() => onEdit({ kind: 'vote', candidateId: candidate.id, value: ownVote === reaction ? null : reaction })} />)}</View>
      {candidate.votes.map((vote) => <Meta key={vote.memberId}>{view.members.find((member) => member.id === vote.memberId)?.name ?? vote.memberId} · {reactions.find(([id]) => id === vote.value)?.[1]}</Meta>)}
    </Panel>

    <Panel>
      <Heading>Sources · {candidate.sourceIds.length}</Heading>
      {!candidate.sourceIds.length && <Copy muted>No source is attached to this place.</Copy>}
      {candidate.sourceIds.map((id) => {
        const source = view.memory.sources.find((entry) => entry.id === id)
        return source ? <SourceLink key={id} source={source} view={view} onExternal={onExternal} /> : <Meta key={id}>Source {id}</Meta>
      })}
    </Panel>

    <Panel>
      <Heading>Your note</Heading>
      <Input accessibilityLabel="Your note" placeholder="Something the group should know" value={note} onChangeText={setNote} multiline />
      <Button label="Save note" disabled={busy || note.trim() === (candidate.notes?.find((entry) => entry.memberId === actor)?.text ?? '')} onPress={() => onEdit({ kind: 'set_candidate_note', candidateId: candidate.id, text: note.trim() || null })} />
      {candidate.notes?.filter((entry) => entry.memberId !== actor).map((entry) => <Copy key={entry.memberId}>{view.members.find((member) => member.id === entry.memberId)?.name ?? entry.memberId} · {entry.text}</Copy>)}
    </Panel>

    {candidate.state === 'resolved' && <Panel>
      <Heading>Add to an itinerary</Heading>
      <Copy muted>Choose a date and time. The accepted itinerary stays as it is until someone applies the proposal.</Copy>
      <View style={common.row}>
        {days.map((value, index) => <Button key={value} label={`Day ${index + 1} · ${formatDate(value)}`} selected={date === value} onPress={() => setDate(value)} />)}
      </View>
      {!!date && <>
        <View style={common.row}>
          <View style={common.grow}><Meta>Start (HH:MM)</Meta><Input accessibilityLabel="Start time" value={start} onChangeText={setStart} placeholder="14:00" /></View>
          <View style={common.grow}><Meta>End (HH:MM)</Meta><Input accessibilityLabel="End time" value={end} onChangeText={setEnd} placeholder="14:45" /></View>
        </View>
        <Button label="Preview addition" kind="dark" disabled={busy || !isTime(start) || !isTime(end) || start >= end} onPress={() => onPlan({
          date, start: localTripTime(date, start, view.trip.timezone), end: localTripTime(date, end, view.trip.timezone),
        })} />
      </>}
    </Panel>}
  </Page>
}

export async function launchSafeLink(url: string, onError: (message: string) => void) {
  try { await openExternal(url) }
  catch (err) { onError(err instanceof Error ? err.message : 'Could not open this link.') }
}
