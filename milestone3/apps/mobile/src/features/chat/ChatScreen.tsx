import { useState } from 'react'
import { KeyboardAvoidingView, Platform, View } from 'react-native'
import type { Outcome, PlanContext, SavedSummary, TripView } from '@waymark/contracts'
import { Button, Copy, Heading, Icon, Input, Meta, Page, Panel, common, p } from '../../ui/primitives'

type Suggestion = { summary: SavedSummary; optionId: string; label: string }
export type Clarification = { jobId: string; outcome: Extract<Outcome, { kind: 'clarify' }> }
export type ChatEntry = { text: string; role: 'you' | 'waymark' }
export type ChatContext = { data: PlanContext; label: string }

export function ChatScreen({ view, context, busy, conversation, clarify, onPlan, onAnswer, onResetContext, onProposal, planning = true, offline = false }: {
  planning?: boolean; offline?: boolean; view: TripView; context: ChatContext | null; busy: boolean; conversation: ChatEntry[]; clarify: Clarification | null;
  onPlan(text: string, suggestion?: Suggestion): void;
  onAnswer(answer: { optionId: string } | { text: string }): void;
  onResetContext(): void;
  onProposal(id: string): void;
}) {
  const [message, setMessage] = useState('')
  const summary = view.memory.summaries.findLast((entry) => !!entry.poll)
  const poll = summary?.poll
  function submit() {
    const instruction = message.trim()
    if (!instruction || busy) return
    setMessage('')
    if (clarify) onAnswer({ text: instruction })
    else onPlan(instruction)
  }
  return <KeyboardAvoidingView style={common.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <Page>
      {!planning && <Panel style={{ backgroundColor: p.tint }}><Heading>Chat is not connected here</Heading><Copy muted>The test server supports itinerary review and manual changes. It does not run AI planning or live Discord imports.</Copy></Panel>}
      {planning && !conversation.length && <Panel style={{ backgroundColor: p.tint, borderColor: p.fine }}>
        <View style={common.row}><Icon name="chat" color={p.forest} /><Meta>WAYMARK PLANNING</Meta></View>
        <Heading>{view.accepted ? 'What should we plan next?' : 'Draft the first itinerary'}</Heading>
        <Copy>{view.accepted
          ? 'Plan from the places your group saved. You’ll see a preview before anything changes.'
          : 'Use saved places and notes to draft your trip, then review it before you apply.'}</Copy>
        {offline && <Copy muted>This offline demo uses scripted replies. Try asking about Day 2 in Gion or leaving later on Day 3.</Copy>}
        {!view.accepted && <Button label="Generate trip draft" kind="dark" onPress={() => onPlan('Draft the full itinerary from our saved places.')} disabled={busy} style={{ alignSelf: 'flex-start' }} />}
      </Panel>}
      {!!context && <View style={common.between}>
        <Meta style={common.grow}>{context.label}</Meta>
        <Button label="Clear context" kind="quiet" onPress={onResetContext} />
      </View>}
      {conversation.map((entry, index) => <Panel key={index} style={entry.role === 'you'
        ? { alignSelf: 'flex-end', maxWidth: '86%', backgroundColor: p.forest, borderColor: p.forest }
        : { alignSelf: 'flex-start', maxWidth: '94%' }}>
        <Meta style={entry.role === 'you' ? { color: '#dceee5' } : undefined}>{entry.role === 'you' ? 'You' : 'Waymark'}</Meta>
        <Copy style={entry.role === 'you' ? { color: p.white } : undefined}>{entry.text}</Copy>
      </Panel>)}
      {planning && (clarify ? <Panel>
        <Heading>{clarify.outcome.question}</Heading>
        {clarify.outcome.options?.map((option) => <Button key={option.id} label={option.label} disabled={busy} onPress={() => onAnswer({ optionId: option.id })} />)}
      </Panel> : !!poll && !!summary && !context && <View style={common.column}>
        <Heading>{poll.question}</Heading>
        <Copy muted>Saved direction poll · Selecting an option here opens a proposal and does not change the votes.</Copy>
        {poll.options.map((option) => <Panel key={option.id}>
          <View style={common.between}>
            <View style={common.grow}><Heading>{option.label}</Heading><Meta>{option.voterIds.length} {option.voterIds.length === 1 ? 'vote' : 'votes'}</Meta></View>
            <Button label="Preview" kind={option.id === 'gion' ? 'dark' : 'outline'} onPress={() => onPlan(`Plan Day 2 afternoon: ${option.label}.`, { summary, optionId: option.id, label: option.label })} disabled={busy} />
          </View>
        </Panel>)}
      </View>)}
      {view.pending.length > 0 && <View style={common.column}>
        <Heading>Awaiting review</Heading>
        {view.pending.map((proposal) => <Panel key={proposal.id}>
          <Meta>PROPOSAL · BASE V{proposal.base.planVersion}</Meta>
          <Copy>{proposal.differences[0] ?? 'Review the itinerary preview.'}</Copy>
          <Button label="Review proposal" icon="arrow" onPress={() => onProposal(proposal.id)} kind="quiet" style={{ alignSelf: 'flex-start' }} />
        </Panel>)}
      </View>}
    </Page>
    {planning && <View style={{ paddingHorizontal: 16, paddingVertical: 8, gap: 4, borderTopWidth: 1, borderColor: p.line, backgroundColor: p.bg }}>
      <Meta>{clarify ? 'Reply to Waymark' : 'Message Waymark'}</Meta>
      <View style={common.between}>
        <Input accessibilityLabel={clarify ? 'Reply to Waymark' : 'Message Waymark'}
          value={message} onChangeText={setMessage} placeholder="Plan Day 2 after lunch…" returnKeyType="send"
          onSubmitEditing={submit} style={common.grow} />
        <Button label="Send" icon="send" kind="dark" disabled={busy || !message.trim()} onPress={submit} />
      </View>
    </View>}
  </KeyboardAvoidingView>
}
