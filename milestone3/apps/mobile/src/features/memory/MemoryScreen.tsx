import { useState } from 'react'
import { View } from 'react-native'
import type { Source, TripView } from '@waymark/contracts'
import { Button, Copy, Heading, Meta, Page, Panel, common, formatSourceDate, p } from '../../ui/primitives'
import { SourceLink } from '../map/places'

const stateLabel: Record<NonNullable<Source['importState']>['status'], string> = {
  queued: 'Queued', running: 'Analyzing', cancelled: 'Cancelled',
  imported: 'Imported', needs_details: 'Needs details', failed: 'Import failed',
}

export function MemoryScreen({ view, busy, onPlace, onRetry, onExternal }: {
  view: TripView; busy: boolean; onPlace(id: string): void; onRetry?(id: string): void; onExternal(url: string): void;
}) {
  const [section, setSection] = useState<'imports' | 'summaries'>('imports')
  const sources = view.memory.sources.filter((source) => source.importState)
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
  return <Page>
    <View style={common.row}>
      <Button label={`Import log · ${sources.length}`} selected={section === 'imports'} onPress={() => setSection('imports')} />
      <Button label={`Summaries · ${view.memory.summaries.length}`} selected={section === 'summaries'} onPress={() => setSection('summaries')} />
    </View>
    {section === 'imports' ? (sources.length ? sources.map((source) => {
      const state = source.importState!
      const candidates = view.memory.candidates.filter((entry) => entry.sourceIds.includes(source.id))
      return <Panel key={source.id}>
        <Meta style={{ color: state.status === 'failed' ? p.orange : p.forest }}>{stateLabel[state.status].toUpperCase()}</Meta>
        <SourceLink source={source} view={view} onExternal={onExternal} />
        {state.status === 'failed' && <Copy muted>{state.reason}</Copy>}
        <View style={common.row}>
          {candidates.map((entry) => <Button key={entry.id} label={entry.label} icon="map" onPress={() => onPlace(entry.id)} />)}
          {state.status === 'failed' && view.collection === 'active' && onRetry && <Button label="Re-analyze" disabled={busy} onPress={() => onRetry(source.id)} />}
        </View>
      </Panel>
    }) : <Panel><Heading>No imports yet</Heading><Copy muted>Posts analyzed from the linked Discord channel appear here.</Copy></Panel>)
      : view.memory.summaries.length ? view.memory.summaries.map((summary) => <Panel key={summary.id}>
        <Meta>{formatSourceDate(summary.firstAt, view.trip.timezone)} – {formatSourceDate(summary.lastAt, view.trip.timezone)} · {summary.messageCount} messages</Meta>
        {(['decided', 'undecided'] as const).map((state) => {
          const notes = summary.notes.filter((note) => note.state === state)
          return <View key={state} style={common.column}>
            <Heading>{state === 'decided' ? 'Decided' : 'Undecided'}</Heading>
            {notes.length === 0 && <Copy muted>No notes in this section.</Copy>}
            {notes.map((note) => <View key={note.id}>
              <Copy>{note.text}</Copy><Meta>{note.sourceIds.length} {note.sourceIds.length === 1 ? 'source' : 'sources'}</Meta>
            </View>)}
          </View>
        })}
        {!!summary.poll && <View style={common.column}>
          <Heading>{summary.poll.question}</Heading>
          {summary.poll.options.map((option) => <Copy key={option.id}>{option.label} · {option.voterIds.length} {option.voterIds.length === 1 ? 'vote' : 'votes'}</Copy>)}
        </View>}
      </Panel>) : <Panel><Heading>No saved summaries</Heading><Copy muted>Summaries saved from Discord appear here.</Copy></Panel>}
  </Page>
}
