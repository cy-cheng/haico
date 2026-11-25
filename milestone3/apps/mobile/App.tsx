import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { AppState, BackHandler, Linking, Platform, Pressable, Share, StatusBar, Text, View } from 'react-native'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'
import type { AsyncCommand, Member, Mode, PlanContext, PlanRequest, Proposal, SyncCommand, TripInfo, TripView } from '@waymark/contracts'
import { actionKey, RequestError, type Destination, type WaymarkClient } from './src/platform/api'
import { createDemoClient } from './src/platform/demo'
import { readDestination } from './src/platform/destination'
import { ChatScreen, type ChatContext, type ChatEntry, type Clarification } from './src/features/chat/ChatScreen'
import { ManageScreen } from './src/features/manage/ManageScreen'
import { MemoryScreen } from './src/features/memory/MemoryScreen'
import { launchSafeLink, MapScreen, PlaceScreen } from './src/features/map/places'
import { Button, common, Copy, dateRange, ErrorText, Heading, Icon, localTripTime, Meta, p, Page, Panel, shareCalendar, Title } from './src/ui/primitives'
import { ConnectPreview } from './src/ui/session'
import { ProposalScreen, TransportScreen, TripScreen, type Segment } from './src/features/trip/TripScreen'

const tabs = [
  { id: 'chat', label: 'AI Chat' }, { id: 'map', label: 'Map' },
  { id: 'trip', label: 'Trip' }, { id: 'manage', label: 'Manage' },
] as const
type Tab = typeof tabs[number]['id']
type Screen = { kind: 'memory' } | { kind: 'place'; id: string } | { kind: 'proposal'; id: string } | { kind: 'transport'; segment: Segment }
type PreviewScenario = Parameters<typeof createDemoClient>[1]
type Failure = { message: string; retry?: () => void }

const pause = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))
const messageOf = (err: unknown) => err instanceof Error ? err.message : 'Something went wrong. Try again.'

export type WaymarkProps = {
  client: WaymarkClient
  destination?: Destination | null
  serverUrl?: string
  preview?: boolean
  testConnection?: boolean
  onConnectPreview?: () => void
  onDisconnect?: () => void
  onResetDemo?: (scenario: PreviewScenario) => void
}

export function Waymark(props: WaymarkProps) {
  return <Frame><TripWorkspace {...props} /></Frame>
}

function Frame({ children }: { children: ReactNode }) {
  return <SafeAreaProvider>
    <SafeAreaView style={{ flex: 1, backgroundColor: p.bg }}>
      <StatusBar barStyle="dark-content" backgroundColor={p.bg} />
      {children}
    </SafeAreaView>
  </SafeAreaProvider>
}

function TripWorkspace({ client, destination, serverUrl, preview = false, testConnection = false, onConnectPreview, onDisconnect, onResetDemo }: WaymarkProps) {
  const [tab, setTab] = useState<Tab>('chat')
  const [stack, setStack] = useState<Screen[]>([])
  const [member, setMember] = useState<Member | null>(null)
  const [trips, setTrips] = useState<TripInfo[]>([])
  const [tripId, setTripId] = useState('')
  const [tripPicker, setTripPicker] = useState(false)
  const [view, setView] = useState<TripView | null>(null)
  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [date, setDate] = useState('')
  const [failure, setFailure] = useState<Failure | null>(null)
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)
  const [initial, setInitial] = useState(true)
  const [boot, setBoot] = useState(0)
  const active = useRef(true)
  const doingWork = useRef(false)
  const viewSequence = useRef(0)
  const [chat, setChat] = useState<ChatEntry[]>([])
  const [clarify, setClarify] = useState<Clarification | null>(null)
  const [context, setContext] = useState<ChatContext | null>(null)
  const [editing, setEditing] = useState('')
  const screen = stack.at(-1)
  const shownProposalId = screen?.kind === 'proposal' ? screen.id : ''
  const requestedTripId = destination?.tripId
  const requestedProposalId = destination?.proposalId
  const requestedJoin = destination?.join
  const requestedJoinKey = useMemo(() => actionKey(), [destination])

  useEffect(() => {
    active.current = true
    return () => { active.current = false }
  }, [])

  const selectTab = (value: Tab) => { setTab(value); setStack([]); setFailure(null); setTripPicker(false) }
  const push = (entry: Screen) => { setFailure(null); setStack((current) => [...current, entry]) }
  const back = useCallback(() => { setFailure(null); setStack((current) => current.slice(0, -1)); setTripPicker(false) }, [])

  function openTrip(snapshot: TripView, proposalId?: string) {
    ++viewSequence.current
    setTripId(snapshot.trip.id)
    setView(snapshot)
    setDate(snapshot.trip.firstDate)
    setStack(proposalId ? [{ kind: 'proposal', id: proposalId }] : [])
    if (proposalId) setTab('trip')
    setTripPicker(false)
    setProposal(null)
    setChat([])
    setClarify(null)
    setContext(null)
    setEditing('')
    setStatus('')
  }

  useEffect(() => {
    let live = true
    setInitial(true)
    setFailure(null)
    setView(null)
    setTripId('')
    async function load() {
      const [who, available] = await Promise.all([client.me(), client.trips()])
      if (!live) return
      setMember(who)
      setTrips(available)
      const id = requestedTripId || available[0]?.id
      if (!id) return
      const snapshot = requestedJoin && requestedTripId ? await client.join(id, requestedJoinKey) : await client.view(id)
      if (live) {
        if (!available.some((entry) => entry.id === snapshot.trip.id)) setTrips([...available, snapshot.trip])
        openTrip(snapshot, requestedProposalId)
      }
    }
    void load().catch((err) => { if (live) setFailure({ message: messageOf(err), retry: () => setBoot((value) => value + 1) }) })
      .finally(() => { if (live) setInitial(false) })
    return () => { live = false }
  }, [client, requestedTripId, requestedProposalId, requestedJoin, requestedJoinKey, boot])

  const refresh = useCallback(async (id: string) => {
    const generation = ++viewSequence.current
    const next = await client.view(id)
    if (active.current && viewSequence.current === generation) setView(next)
    return next
  }, [client])

  useEffect(() => {
    if (!tripId || preview) return
    let live = true
    const reload = () => {
      if (!live || doingWork.current || AppState.currentState === 'background') return
      void refresh(tripId).catch((err) => {
        if (live && err instanceof RequestError && (err.status === 401 || err.status === 403)) {
          ++viewSequence.current
          setView(null)
          setFailure({ message: err.message, retry: () => setBoot((value) => value + 1) })
        }
      })
    }
    const state = AppState.addEventListener('change', (next) => { if (next === 'active') reload() })
    const interval = setInterval(reload, 8_000)
    return () => { live = false; state.remove(); clearInterval(interval) }
  }, [tripId, preview, refresh])

  useEffect(() => {
    if (!shownProposalId || !tripId) return
    let live = true
    setProposal(null)
    function load() {
      void client.proposal(tripId, shownProposalId).then((next) => { if (live) setProposal(next) })
        .catch((err) => { if (live) setFailure({ message: messageOf(err), retry: load }) })
    }
    load()
    return () => { live = false }
  }, [client, tripId, shownProposalId, view?.accepted?.version, view?.memory.revision])

  useEffect(() => {
    const listener = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!screen && !tripPicker) return false
      back()
      return true
    })
    return () => listener.remove()
  }, [screen, tripPicker, back])

  async function task(operation: () => Promise<void>, label = 'Working…', retryable = true) {
    if (doingWork.current || !active.current) return
    doingWork.current = true
    ++viewSequence.current
    setBusy(true)
    setFailure(null)
    setStatus(label)
    try { await operation() }
    catch (err) {
      if (!active.current) return
      if (err instanceof RequestError && (err.status === 401 || err.status === 403)) {
        setView(null)
        setFailure({ message: messageOf(err), retry: () => setBoot((value) => value + 1) })
      } else {
        if (err instanceof RequestError && err.status === 409 && tripId) {
          await refresh(tripId).catch(() => undefined)
          if (shownProposalId) await client.proposal(tripId, shownProposalId).then(setProposal).catch(() => undefined)
        }
        setFailure({ message: messageOf(err), retry: retryable && (!(err instanceof RequestError) || err.status >= 500)
          ? () => void task(operation, label, retryable) : undefined })
      }
    } finally {
      doingWork.current = false
      if (active.current) { setBusy(false); setStatus('') }
    }
  }

  function command(cmd: SyncCommand, onDone?: () => Promise<void>) {
    const key = actionKey()
    return task(async () => {
      const next = await client.command(tripId, cmd, key)
      if (!active.current) return
      setView(next)
      await onDone?.()
    }, cmd.kind === 'decide' ? 'Saving your decision…' : 'Saving…')
  }

  function work(cmd: AsyncCommand) {
    const key = actionKey()
    let jobId: string | null = null
    void task(async () => {
      jobId ??= (await client.command(tripId, cmd, key)).jobId
      for (let pass = 0; pass < 40 && active.current; pass += 1) {
        const job = await client.job(tripId, jobId)
        if (!active.current) return
        if (job.status === 'cancelled') throw new Error('The trip server cancelled this request.')
        if (job.status === 'failed') {
          await refresh(tripId).catch(() => undefined)
          throw new RequestError(job.error.code === 'STALE_BASE' ? 409 : 422, job.error)
        }
        if (job.status === 'succeeded') {
          const result = job.result
          await refresh(tripId)
          if (result.kind === 'proposal') {
            setClarify(null)
            setEditing('')
            setChat((old) => [...old, { role: 'waymark', text: 'Your preview is ready to review.' }])
            setStack((current) => [...current.filter((entry) => entry.kind !== 'proposal'), { kind: 'proposal', id: result.proposalId }])
          } else if (result.kind === 'clarify') {
            setTab('chat')
            setStack([])
            setClarify({ jobId, outcome: result })
          }
          return
        }
        await pause(Math.min(700 + pass * 170, 2_000))
      }
      throw new Error('Still working. Retry to check this same request.')
    }, cmd.kind === 'retry_import' ? 'Re-analyzing source…' : 'Preparing your preview…')
  }

  function plan(request: PlanRequest, replacesProposalId?: string) {
    if (!view) return
    work({ kind: 'plan', base: { planVersion: view.accepted?.version ?? 0, memoryRevision: view.memory.revision }, request, replacesProposalId })
  }

  function planContext(selectedDate: string, withAfternoon: boolean): PlanContext {
    const snapshot = view!
    return { date: selectedDate, ...(withAfternoon ? { window: {
      start: localTripTime(selectedDate, '13:15', snapshot.trip.timezone),
      end: localTripTime(selectedDate, '17:30', snapshot.trip.timezone),
    } } : {}) }
  }

  function askFrom(selectedDate: string, origin: string) {
    if (!view) return
    const days = dateRange(view.trip.firstDate, view.trip.lastDate)
    const day = selectedDate || view.trip.firstDate
    setTab('chat')
    setStack([])
    setContext({ data: planContext(day, day === days[1]), label: `Day ${days.indexOf(day) + 1} · from ${origin}` })
    setClarify(null)
    setEditing('')
    setFailure(null)
  }

  const segment = screen?.kind === 'transport' ? screen.segment : null
  const from = segment?.from
  const to = segment?.to
  const version = view?.accepted?.version
  const loadRoutes = useCallback((modes: Mode[]) => {
    if (!from || !to || !version) return Promise.resolve([])
    return client.routes(tripId, version, from, to, modes)
  }, [client, tripId, version, from, to])

  const showPlace = (id: string) => push({ kind: 'place', id })
  const showProposal = (id: string) => push({ kind: 'proposal', id })
  const secureExternal = (url: string) => void launchSafeLink(url, (message) => setFailure({ message }))

  function titleFor(snapshot: TripView) {
    if (screen?.kind === 'memory') return 'Trip memory'
    if (screen?.kind === 'proposal') return 'Review proposal'
    if (screen?.kind === 'transport') return 'Transport'
    if (screen?.kind === 'place') return snapshot.memory.candidates.find((candidate) => candidate.id === screen.id)?.label ?? 'Saved place'
    if (tab === 'chat') return 'AI assistant'
    if (tab === 'map') return 'Saved places'
    if (tab === 'trip') return 'Itinerary'
    return snapshot.trip.name
  }

  function renderScreen(snapshot: TripView, actor: string) {
    const accepted = snapshot.accepted
    if (screen?.kind === 'memory') return <MemoryScreen view={snapshot} busy={busy} onPlace={showPlace} onRetry={testConnection ? undefined : (sourceId) => work({ kind: 'retry_import', sourceId })} onExternal={secureExternal} />
    if (screen?.kind === 'place') {
      const entry = snapshot.memory.candidates.find((candidate) => candidate.id === screen.id)
      if (!entry) return <Page><Copy>This place is no longer in the trip memory.</Copy></Page>
      return <PlaceScreen key={entry.id} view={snapshot} candidate={entry} actor={actor} busy={busy} resolveAvailable={!testConnection} onEdit={(edit) => void command({
        kind: 'edit_memory', memoryRevision: snapshot.memory.revision, edit,
      })} onPlan={(slot) => plan({ kind: 'manual', changes: [{ kind: 'add_stop', candidateId: entry.id, ...slot }] })}
        onSearch={(query) => client.search(tripId, query)} onExternal={secureExternal} />
    }
    if (screen?.kind === 'proposal') {
      if (!proposal || proposal.id !== screen.id) return <Page><Copy muted>{failure ? 'This proposal could not be loaded.' : 'Opening proposal…'}</Copy></Page>
      const decide = (action: 'apply' | 'reject') => void command({ kind: 'decide', proposalId: screen.id, action }, async () => {
        setProposal(await client.proposal(tripId, screen.id))
        if (action === 'apply') {
          setTab('trip')
          setDate(proposal.preview.days.find((day) => JSON.stringify(day) !== JSON.stringify(accepted?.itinerary.days.find((old) => old.date === day.date)))?.date ?? date)
        }
      })
      return <ProposalScreen key={proposal.id} proposal={proposal} view={snapshot} busy={busy} onPlace={showPlace}
        onApply={() => decide('apply')} onReject={() => decide('reject')} onEdit={testConnection ? undefined : () => {
          selectTab('chat')
          setContext(null)
          setClarify(null)
          setEditing(proposal.id)
          setChat((old) => [...old, { role: 'waymark', text: `What should change in proposal ${proposal.id}?` }])
        }} />
    }
    if (screen?.kind === 'transport') return <TransportScreen key={`${screen.segment.from}/${screen.segment.to}`} segment={screen.segment}
      busy={busy} onLoad={loadRoutes} onUse={(option) => plan({ kind: 'manual', changes: [{
        kind: 'choose_route', fromStopId: screen.segment.from, toStopId: screen.segment.to, optionId: option.id,
      }] })} />
    if (tab === 'map') return <MapScreen view={snapshot} onPlace={showPlace} onAsk={testConnection ? undefined : () => askFrom(date, 'Map')} />
    if (tab === 'trip') return <TripScreen view={snapshot} date={date} onDate={setDate} actor={actor} busy={busy} onPlace={showPlace}
      onTransport={testConnection ? undefined : (value) => push({ kind: 'transport', segment: value })} onAsk={testConnection ? undefined : (value) => askFrom(value, 'Trip')} onProposal={showProposal}
      onConfirm={() => { if (accepted) void command({ kind: accepted.confirmedBy.includes(actor) ? 'unconfirm' : 'confirm', planVersion: accepted.version }) }} />
    if (tab === 'manage') return <ManageScreen view={snapshot} actor={actor} busy={busy} preview={preview} onMemory={() => push({ kind: 'memory' })}
      onPause={() => void command({ kind: 'pause' })} onResume={testConnection ? undefined : () => void command({ kind: 'collect', scope: { mode: 'from_now' } })}
      onConnect={onConnectPreview} onExit={onDisconnect} onResetDemo={onResetDemo}
      onShare={serverUrl && !testConnection ? () => void task(async () => {
        const invitation = `${serverUrl}/trips/${encodeURIComponent(tripId)}?join=1`
        if (Platform.OS === 'web') await navigator.clipboard.writeText(invitation)
        else await Share.share({ message: `Join ${snapshot.trip.name} in Waymark: ${invitation}` })
      }, 'Preparing invitation…', false) : undefined}
      onExport={() => {
        if (accepted) void task(async () => shareCalendar(await client.calendar(tripId, accepted.version), `waymark-v${accepted.version}.ics`), 'Preparing calendar…')
      }} />
    return <ChatScreen offline={preview} planning={!testConnection} context={context} view={snapshot} busy={busy} conversation={chat} clarify={clarify} onProposal={showProposal}
      onResetContext={() => setContext(null)} onPlan={(instruction, suggestion) => {
        setChat((old) => [...old, { role: 'you', text: instruction }])
        const days = dateRange(snapshot.trip.firstDate, snapshot.trip.lastDate)
        const requestContext = suggestion?.summary.poll ? {
          ...planContext(days[1] ?? days[0], !!days[1]),
          selectedOption: { summaryId: suggestion.summary.id, pollId: suggestion.summary.poll.id, optionId: suggestion.optionId },
        } : context?.data ?? (!editing && accepted && days[1] && /day\s*2|second day|afternoon/i.test(instruction) ? planContext(days[1], true) : undefined)
        plan(accepted || editing ? { kind: 'revise', instruction, context: requestContext } : { kind: 'draft', instruction, context: requestContext }, editing || undefined)
      }} onAnswer={(answer) => {
        if (!clarify) return
        const text = 'text' in answer ? answer.text : clarify.outcome.options?.find((option) => option.id === answer.optionId)?.label ?? answer.optionId
        setChat((old) => [...old, { role: 'you', text }])
        work({ kind: 'answer', jobId: clarify.jobId, ...answer })
      }} />
  }

  return <View style={{ flex: 1 }}>
    <View style={[common.rail, { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 9, borderBottomWidth: 1, borderColor: p.line }]}>
      {screen ? <Button label="Back" icon="back" kind="quiet" onPress={back} style={{ alignSelf: 'flex-start', paddingHorizontal: 0 }} />
        : <Meta style={{ letterSpacing: 1 }}>{preview ? 'WAYMARK · OFFLINE DEMO' : testConnection ? 'WAYMARK · TEST SERVER' : 'WAYMARK · CONNECTED'}</Meta>}
      <View style={common.between}>
        <View style={common.grow}><Title>{view ? titleFor(view) : 'Waymark'}</Title>
          {view && !screen && tab !== 'manage' && <Meta>{view.trip.name}</Meta>}
        </View>
        {view && !screen && tab === 'chat' && <Button label="Trip memory" onPress={() => push({ kind: 'memory' })} icon="memory" />}
        {!!view && !screen && tab === 'manage' && trips.length > 1 && <Button label="Switch trip" onPress={() => setTripPicker(true)} />}
      </View>
    </View>
    {failure && <View style={[common.rail, { paddingHorizontal: 16, paddingTop: 8, gap: 4 }]}>
      <ErrorText message={failure.message} />
      <View style={common.row}>
        {failure.retry && <Button label="Retry" kind="quiet" onPress={failure.retry} disabled={busy} />}
        {view && <Button label="Dismiss" kind="quiet" onPress={() => setFailure(null)} />}
      </View>
    </View>}
    {!!status && <View accessibilityLiveRegion="polite" style={[common.rail, { paddingHorizontal: 16, paddingTop: 7 }]}><Meta>{status}</Meta></View>}
    {initial ? <Page><Copy muted>Opening your trips…</Copy></Page>
      : tripPicker && view ? <Page>
        <Heading>Your trips</Heading>
        {trips.map((trip) => <Button key={trip.id} label={trip.name} onPress={() => void task(async () => openTrip(await client.view(trip.id)), 'Opening trip…')} selected={trip.id === tripId} />)}
        <Button label="Cancel" kind="quiet" onPress={() => setTripPicker(false)} />
      </Page>
      : view && member ? renderScreen(view, member.id)
        : <Page>
          {!failure && <Panel><Heading>No trips yet</Heading><Copy muted>Open an invitation to join a trip from your Discord channel.</Copy></Panel>}
          {onDisconnect && <Button label="Disconnect test session" onPress={onDisconnect} />}
          {onConnectPreview && <Button label="Connect to test server" onPress={onConnectPreview} />}
        </Page>}
    {view && <View style={[common.rail, { flexDirection: 'row', borderTopWidth: 1, borderColor: p.fine, backgroundColor: p.paper, paddingVertical: 4 }]} accessibilityRole="tablist">
      {tabs.map(({ id, label }) => <Pressable key={id} accessibilityRole="tab" accessibilityState={{ selected: tab === id }} onPress={() => selectTab(id)}
        style={({ pressed }) => ({ flex: 1, minHeight: 52, justifyContent: 'center', alignItems: 'center', gap: 2, paddingHorizontal: 2, opacity: pressed ? 0.66 : 1 })}>
        <View style={{ borderRadius: 14, paddingVertical: 3, paddingHorizontal: 15, backgroundColor: tab === id ? p.tint : 'transparent' }}><Icon name={id} size={19} color={p.forest} /></View>
        <Text style={{ color: p.ink, fontSize: 11, fontWeight: tab === id ? '800' : '500', textAlign: 'center' }}>{label}</Text>
      </Pressable>)}
    </View>}
  </View>
}

const address = process.env.EXPO_PUBLIC_API_URL ?? ''
const allowTestSession = __DEV__ || process.env.EXPO_PUBLIC_ALLOW_TEST_SESSION === '1'

export default function App() {
  const [demo, setDemo] = useState(() => createDemoClient())
  const [instance, setInstance] = useState(0)
  const [connecting, setConnecting] = useState(false)
  const [connection, setConnection] = useState<{ client: WaymarkClient; origin: string } | null>(null)
  const [link, setLink] = useState<{ url: string } | null>(null)
  const openedLink = useRef(false)
  const linkOrigin = Platform.OS === 'web' && typeof window !== 'undefined' ? window.location.origin : connection?.origin || address
  const destination = useMemo(() => readDestination(link?.url ?? null, linkOrigin), [link, linkOrigin])
  useEffect(() => {
    let active = true
    const listener = Linking.addEventListener('url', event => {
      if (!readDestination(event.url, linkOrigin)) return
      openedLink.current = true
      setLink({ url: event.url })
    })
    void Linking.getInitialURL().then(url => {
      if (active && !openedLink.current && url && readDestination(url, linkOrigin)) {
        openedLink.current = true
        setLink({ url })
      }
    }, () => undefined)
    return () => { active = false; listener.remove() }
  }, [linkOrigin])
  if (connecting) return <Frame><ConnectPreview address={address} onClose={() => setConnecting(false)} onConnect={(client, origin) => {
    setConnecting(false)
    setConnection({ client, origin })
  }} /></Frame>
  if (connection) return <Waymark key="connected" testConnection client={connection.client} serverUrl={connection.origin} destination={destination}
    onDisconnect={() => setConnection(null)} />
  return <Waymark key={instance} client={demo} preview destination={destination} onConnectPreview={allowTestSession ? () => setConnecting(true) : undefined}
    onResetDemo={(scenario) => { setDemo(createDemoClient('alex', scenario)); setInstance((value) => value + 1) }} />
}
