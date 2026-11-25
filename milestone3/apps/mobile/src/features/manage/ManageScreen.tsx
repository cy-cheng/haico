import { useState } from 'react'
import { View } from 'react-native'
import type { TripView } from '@waymark/contracts'
import { Button, Copy, Heading, Meta, Page, Panel, common, formatDate, p } from '../../ui/primitives'

type PreviewScenario = 'standard' | 'no-summary' | 'empty'

export function ManageScreen({ view, actor, busy, preview, onMemory, onShare, onExport, onPause, onResume, onConnect, onExit, onResetDemo }: {
  view: TripView; actor: string; busy: boolean; preview: boolean; onMemory(): void; onShare?: () => void; onExport(): void;
  onPause(): void; onResume?(): void; onConnect?: () => void; onExit?: () => void;
  onResetDemo?: (scenario: PreviewScenario) => void;
}) {
  const [finish, setFinish] = useState(false)
  const trip = view.trip
  const accepted = view.accepted
  return <Page>
    <Panel>
      <Meta>TRIP DETAILS</Meta>
      <Field label="Dates" value={`${formatDate(trip.firstDate)} – ${formatDate(trip.lastDate)}`} />
      <Field label="Time zone" value={trip.timezone} />
      <Field label="Cities" value={trip.details?.cities.join(', ')} />
      <Field label="Stay" value={trip.details?.stay} />
      <Field label="Flights" value={trip.details?.flights} />
      <Field label="Pace" value={trip.details?.pace.join(', ')} />
    </Panel>
    <Panel>
      <Heading>Members · {view.members.length}</Heading>
      {view.members.map((member) => <View key={member.id} style={common.between}>
        <View style={common.row}>
          <View style={{ backgroundColor: member.id === actor ? p.forest : p.tint, borderRadius: 16, minWidth: 31, minHeight: 31, justifyContent: 'center', alignItems: 'center' }}>
            <Meta style={member.id === actor ? { color: p.white } : undefined}>{member.name.slice(0, 1).toUpperCase()}</Meta>
          </View>
          <Copy>{member.name}{member.id === actor ? ' · you' : ''}</Copy>
        </View>
        <Meta>{member.id === trip.creatorId ? 'Creator' : 'Member'}</Meta>
      </View>)}
      {onShare && <Button label="Share invitation" onPress={onShare} style={{ alignSelf: 'flex-start' }} />}
    </Panel>
    <Panel style={{ backgroundColor: p.tint }}>
      <View style={common.between}>
        <View style={common.grow}><Heading>Discord</Heading><Copy>#{trip.channelName || trip.channelId}</Copy></View>
        <Meta>{view.collection === 'active' ? 'Collecting' : view.collection === 'paused' ? 'Paused' : 'Not collecting'}</Meta>
      </View>
      {view.collection === 'active' && !!accepted && !finish && <Button label="Save & finish" onPress={() => setFinish(true)} style={{ alignSelf: 'flex-start' }} />}
      {view.collection === 'active' && !!accepted && finish && <>
        <Copy>Keep the accepted itinerary v{accepted.version} and pause collecting new Discord shares. You can resume collection later.</Copy>
        <View style={common.row}>
          <Button label="Pause collection" kind="dark" onPress={() => { setFinish(false); onPause() }} disabled={busy} />
          <Button label="Cancel" kind="quiet" onPress={() => setFinish(false)} />
        </View>
      </>}
      {view.collection === 'paused' && onResume && <Button label="Resume from now" onPress={onResume} disabled={busy} style={{ alignSelf: 'flex-start' }} />}
    </Panel>
    <View style={common.row}>
      <Button label="Trip memory" onPress={onMemory} icon="memory" />
      {accepted && <Button label={`Export v${accepted.version} .ics`} onPress={onExport} disabled={busy} />}
    </View>
    {preview && onResetDemo && <Panel>
      <Heading>Preview data</Heading>
      <Copy muted>These scenarios use the shared Kansai fixture. Restarting a scenario resets your preview changes.</Copy>
      <View style={common.row}>
        <Button label="Restart preview" kind="quiet" onPress={() => onResetDemo('standard')} />
        <Button label="Start without a poll" kind="quiet" onPress={() => onResetDemo('no-summary')} />
        <Button label="Start without an itinerary" kind="quiet" onPress={() => onResetDemo('empty')} />
      </View>
    </Panel>}
    {onConnect && <Button label="Connect to test server" onPress={onConnect} style={{ alignSelf: 'flex-start' }} />}
    {onExit && <Button label="Disconnect test session" onPress={onExit} style={{ alignSelf: 'flex-start' }} />}
  </Page>
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return <View style={[common.between, { borderTopWidth: 1, borderColor: p.line, paddingVertical: 8 }]}>
    <Meta style={{ minWidth: 72 }}>{label}</Meta><Copy style={[common.grow, { textAlign: 'right' }]}>{value || 'Not provided'}</Copy>
  </View>
}
