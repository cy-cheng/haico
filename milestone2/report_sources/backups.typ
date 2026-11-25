// Original backup content, exported for topic-based report ordering.
#import "../slides_presentation/theme.typ": *
#import "../slides_presentation/visuals.typ": *
#import "main.typ": details, ai-job, spec-table

#let b-ai-jobs() = [
#slide(title: [Inside the assistant: four model jobs, checked by code], kicker-text: [Appendix C2 · Proposed AI responsibilities], accent: teal)[
  #box(width: 27cm, height: 11.15cm, {
    // The interaction mode decides how often each job runs, and so which model it needs.
    v-put(0.2cm, 0cm, 12.8cm, align(center, v-label([Auto · active scope only], c: teal.darken(15%))))
    v-put(13.8cm, 0cm, 12.8cm, align(center, v-label([On user request], c: tomato.darken(10%))))
    v-put(0cm, 0cm, 27cm, cetz.canvas(length: 1cm, {
      import cetz.draw: *
      rect((0, 0), (27, 11.15), stroke: none, fill: none)
      for (a, b, col) in ((0.2, 13.0, teal), (13.8, 26.6, tomato)) {
        line((a, 10.35), (a, 10.6), (b, 10.6), (b, 10.35), stroke: 1pt + col)
      }
      for x in (6.2, 13.0, 19.8) { v-arrow((x + 0.14, 8.03), (x + 0.7, 8.03)) }
    }))
    v-put(0.2cm, 1.0cm, 6cm, ai-job([01], [Understand],
      [Read accessible captions, photos and tags; make a sourced card or flag unclear media.],
      [Haiku 5.5 · Whisper], teal))
    v-put(7.0cm, 1.0cm, 6cm, ai-job([02], [Ground],
      [Match each mention to a real place. Repeated shares of one place get one ID.],
      [Haiku 5.5 → Google Places], teal))
    v-put(13.8cm, 1.0cm, 6cm, ai-job([03], [Draft],
      [Turn candidates, preferences and travel times into a day-by-day plan.],
      [Opus 5.5 · Google Routes], tomato))
    v-put(20.6cm, 1.0cm, 6cm, ai-job([04], [Revise],
      [Turn “Start day 3 at 11:00” into a short list of typed changes.],
      [Opus 5.5], tomato))
    v-put(0.2cm, 5.7cm, 26.4cm, v-sheet(26.4cm, 1.55cm, faint, stock: paper2, {
      v-put(0.35cm, 0.2cm, 25.7cm, v-label([Code, not the model], c: ink, size: 9.5pt))
      v-put(0.35cm, 0.66cm, 25.7cm, text(size: 14.5pt)[Filters the chosen scope · checks every cited source · validates each plan · keeps versions · records each member’s approval])
    }))
    v-put(0.2cm, 7.95cm, 26.4cm, kicker(c: teal.darken(10%))[Why AI is needed])
    v-put(0.2cm, 8.6cm, 26.4cm, par(leading: 0.45em, text(size: 17pt)[The interface prototype uses predefined examples to simulate extraction. Real chats contain nicknames, mixed languages and Reels. Planned language-and-vision models would interpret these references using original sources and map tools.]))
  })
]
]

#let b-discord() = [
#details([How the Discord bot would work], [Appendix C1 · Proposed Discord integration], ("d-draft", "d-proposal", false), (
  ([Events in], [After activation, link posts, \@mentions and button taps arrive as events. The bot reads only joined channels and the raw-message scope the user chose.]),
  ([Cards out], [Replies are Components v2 messages: cards, buttons and forms. A tap updates the same message instead of posting a new one.]),
  ([Same memory as the app], [Cards, reactions and confirmations are saved to the shared trip memory, so the app and the channel always show the same state.]),
), accent: cobalt)
]

#let b-models() = [
#slide(title: [Models and tools, and why], kicker-text: [Appendix C3 · Planned models and tools], accent: cobalt)[
  #box(width: 27cm, height: 11.15cm, {
    v-put(0cm, 0cm, 27cm, spec-table((5.3cm, 5.9cm, 1fr), ([Job], [Choice], [Why]), (
      ([Link cards], [Claude Haiku 5.5],
        [Image and structured extraction for allowed links. Input: US\$0.10 per million tokens for prompts up to 100k tokens \[6\].]),
      ([Reel audio], [Whisper, open source],
        [Audio transcripts supplement captions and frames when accessible. Self-hosting still incurs compute costs.]),
      ([Places and travel], [Google Places + Routes],
        [Map APIs provide place IDs, available opening hours and travel-time estimates for grounding and checks.]),
      ([Draft and revise], [Claude Opus 5.5],
        [Runs only on a request, but members wait for it and judge it. Must balance many constraints and keep other days intact.]),
      ([Chat platform], [Discord bot + web app],
        [Reads joined channels, flags \@mentions, posts cards and buttons; a web app shows the plan. LINE could follow, without old messages.]),
    ), cobalt))
    let note(x, head, body) = v-put(x, 9.15cm, 12.9cm, par(leading: 0.4em,
      text(size: 15pt)[#text(font: f-display, weight: 600)[#head] #body]))
    note(0cm, [Budget estimate.], [About US\$2/trip (300 messages, 3 drafts, 10 revisions), not measured. US\$100 is the development and test budget.])
    note(14.1cm, [Start simple.], text(fill: muted)[Use metadata filters and keyword retrieval first. Add semantic retrieval or fine-tuning only if evaluation justifies it.])
  })
]
]

#let b-steering() = [
#slide(title: [Prompts guide the model; code enforces the promises], kicker-text: [Appendix D2 · Planned steering and code checks], accent: tomato)[
  #box(width: 27cm, height: 11.15cm, {
    v-put(0cm, 0cm, 27cm, spec-table((8.2cm, 1fr), ([Design rule], [Planned enforcement]), (
      ([Reads only authorized context], [Raw messages must be in the chosen scope. Reuse only previously authorized trip memory.]),
      ([Keeps every source], [The model must cite message IDs. Code drops any item without a valid one.]),
      ([Asks instead of guessing], [If Places finds no match, or several, the share stays unresolved and Waymark asks.]),
      ([Edits stay local], [The model returns typed changes (retime, move, remove). Code applies only accepted ones, as a new version.]),
      ([Checks feasibility], [Check available hours, route estimates and the group’s pace. Flag missing facts instead of claiming feasibility.]),
      ([Stays out of the way], [Link cards may appear automatically within the active scope. Summaries, plans and changes require a user request.]),
    ), tomato))
    v-put(0cm, 10.05cm, 27cm, text(font: f-display, size: 15.5pt, style: "italic", fill: muted)[Every model output is JSON checked against a schema. The system prompt and example chats set format and tone.])
  })
]
]

#let b-limitations() = [
#slide(title: [What is missing, what is uncertain, what comes next], kicker-text: [Appendix E1 · Current limitations], accent: plum)[
  #box(width: 27cm, height: 11.15cm, {
    let col(x, c, label, body) = v-put(x, 0.1cm, 8.4cm, v-sheet(8.4cm, 9.6cm, c, {
      v-put(0.4cm, 0.4cm, 7.6cm, v-label(label, c: c.darken(18%), size: 10pt))
      v-put(0.4cm, 1.1cm, 7.6cm, {
        set par(leading: 0.42em)
        set list(spacing: 0.75em)
        set enum(spacing: 0.75em)
        text(size: 16pt, body)
      })
    }))
    col(0.1cm, faint, [Still missing], [
      - No bot or model code yet: the design shows the screens.
      - No Discord connection, Places lookup or reel processing.
      - State lives in one browser, so there is no multi-user sync.
      - *Platform limits:* Discord needs history and message-content permissions. LINE bots see only messages sent after they join.
    ])
    col(9.2cm, tomato, [Biggest uncertainty], [
      - *Technical:* accuracy on real, messy chats: nicknames, mixed languages, reels that never name the place.
      - *Interaction:* one member picks the scope, but everyone’s messages are read. Will the others accept that?
      - Will members read “1 of 4 confirmed” as individual, not group, approval?
    ])
    col(18.3cm, plum, [Next], [
      + Build a test set from about 3 consented group chats. Measure extraction and merge accuracy, and invented venues (target: 0).
      + Connect Discord, Haiku, Places and Whisper, then Opus.
      + Test with 3–5 friend groups.
      + Later: suggest new places, labelled as suggestions, and add LINE.
    ])
  })
]

// This is the supplied User Flow. English labels overlay its original nodes.
// Connector artwork, node positions and rectangle/diamond types are retained.
// Backup for Q&A: the earlier step-by-step screens, one per user-flow stage.
]

#let b-activation() = [
#details([The user invites Waymark and chooses its scope], [Appendix A1 · User goal and activation], ("d-scope0", "a-map"), (
  ([Users and shared goal], [Friends planning a trip in an existing chat want one editable itinerary. This example follows four friends in Osaka, Nov 20–22.]),
  ([User action], [Mia calls \@Waymark and chooses a message range. Link capture starts only after this choice. Page 17 shows this active state.]),
  ([Shared workspace], [Members review one shared plan in Discord and the app. Authorized trip memory remains reviewable; the chosen scope limits raw messages.]),
), accent: cobalt)
]

#let b-draft() = [
#details([AI turns the selected discussion into a draft], [Appendix A2 · Draft generation], ("d-summary", "a-trip"), (
  ([Input], [Selected messages provide places and preferences. Accessible travel links become sourced candidates; unclear or unreadable shares remain unresolved.]),
  ([AI behavior], [Merge repeated places, retain sources and ask about unclear venues. The planned backend checks available hours and route estimates.]),
  ([Output], [One progress message updates in place. Drafts keep sources and unresolved details visible. The nearby picks on p. 17 illustrate a future feature.]),
), accent: teal)
]

#let b-review() = [
#details([Members inspect sources and correct the context], [Appendix A3 · Review and correction], ("a-place", "a-memory-form", false), (
  ([Review], [Open a place to see who shared it and return to the original post. Repeated shares retain their sources.]),
  ([Correct], [Add a missing location or edit a preference without restarting. “Not this time” keeps a clarified place out of this trip.]),
  ([Edit directly], [Adjust times, reorder stops or add a candidate in the app. Share the revised version back to the group.]),
), accent: plum)
]

#let b-groups() = [
#details([Subgroups and transport stay in one itinerary], [Appendix A4 · Flexible planning], ("a-branch-map", "a-transit", false), (
  ([Split and meet again], [In this Day 3 example, Mia and Yuki take one route, Alex and Ben another. Both routes meet at Namba Station and continue together.]),
  ([Choose transport], [The right screen illustrates a separate Kyoto leg. Compare routes and filter transport modes; public transit is enabled by default.]),
  ([Keep gaps visible], [Unfilled slots stay visible. Members can choose a saved candidate or add a map place. AI discovery of unshared places is planned for later.]),
), accent: cobalt)
]

#let b-approval() = [
#details([Members review changes before they are applied], [Appendix A5 · Proposal and approval], ("d-proposal", "a-applied"), (
  ([Request], [“Start day 3 at 11:00 and skip Osaka Castle.” AI proposes only those differences; other arrangements stay intact.]),
  ([Accept or reject], [“Apply” creates a new version; “Keep original” retains the current plan. The app view on p. 19 shows the state after Apply.]),
  ([Confirm individually], [Apply commits a change; Confirm records one member’s agreement. “1 of 4 confirmed” is not group approval. Saving can retain pending confirmations.]),
), accent: tomato)
]

#let b-finish() = [
#details([The user saves the plan and stops collection], [Appendix A6 · Save and finish], ("d-finish", "a-manage-paused"), (
  ([End explicitly], [“Save and finish” pauses new-message collection and automatic link capture. Cancel to keep discussing.]),
  ([Preserve the result], [The saved itinerary retains its sources and approval status, including pending confirmations. Collection is shown as paused.]),
  ([Return later], [Reopen the itinerary or download its calendar file. Viewing the saved plan does not restart collection.]),
), accent: plum)
]
