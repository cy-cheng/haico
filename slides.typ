// Waymark · English presentation with a live prototype link.
// Supplied front.typ, theme.typ and visuals.typ are preserved unchanged.
#import "theme.typ": *
#import "visuals.typ": *
#show: setup
#set document(title: "Waymark — Human–AI Interaction and Prototype", author: "HAICO project team")
#include "front.typ"

#let photo(name, w: 14.7cm, h: 10.7cm) = box(width: w, height: h,
  align(center + horizon, image("assets/screens/" + name + ".jpg", width: w, height: h, fit: "contain")))

// Prototype screens: a thin phone frame around a PNG exported from the Design canvas.
// Names start with d- (Discord) or a- (web app). Discord messages fill only the top of the screen,
// so those PNGs are cropped to `vis-px` of the 844 pixels, and drawn larger.
#let vis-px = ("d-scope0": 360, "d-scope1": 400, "d-progress": 380, "d-draft": 500, "d-clarify": 330,
  "d-clarify-form": 560, "d-clarified": 330, "d-proposal": 450, "d-applied": 450, "d-kept": 330,
  "d-confirm": 350, "d-finish": 520, "d-saved": 300)
#let phone-w(name, h, wmax) = calc.min(wmax, h * 390 / vis-px.at(name, default: 844))
#let phone(name, h: 10.0cm, wmax: 5.9cm, crop: none) = {
  let w = phone-w(name, h, wmax)
  let src = "assets/screens/ui/" + name + ".png"
  box(width: w, height: w * vis-px.at(name, default: 844) / 390, radius: 0.4cm, clip: true, stroke: 1.3pt + ink,
    image(src, width: w))
}
#let shot-label(name) = v-label(if name.starts-with("d-") { [Discord] } else { [App] }, c: muted, size: 9pt)
// One or two screens in the picture area of a detail slide, with an arrow when the second follows the first.
#let duo(a, b: none, arrow: true, h: 10.0cm, crop-b: none) = {
  let col(name, cx, crop: none) = {
    let w = phone-w(name, h, 5.9cm)
    v-put(cx - w / 2, 0cm, w, align(center, shot-label(name)))
    v-put(cx - w / 2, 0.6cm, w, phone(name, h: h, crop: crop))
  }
  box(width: 13.7cm, height: 10.9cm, {
    if b == none { col(a, 6.85cm) } else {
      col(a, 3.3cm)
      col(b, 10.4cm, crop: crop-b)
      if arrow { v-put(6.0cm, 0.6cm + h / 2 - 0.5cm, 1.7cm, align(center, text(size: 22pt, fill: ink, sym.arrow.r))) }
    }
  })
}
// A row of screens across the whole slide, each with its own mono label.
#let gallery(shots, h: 9.4cm) = {
  let w = h * 390 / 844
  let n = shots.len()
  let gap = (27cm - n * w) / (n + 1)
  box(width: 27cm, height: h + 0.7cm, for (i, sh) in shots.enumerate() {
    let x = gap + i * (w + gap)
    v-put(x, 0cm, w, align(center, v-label(sh.at(1), c: muted, size: 9pt)))
    v-put(x, 0.65cm, w, phone(sh.at(0), h: h))
  })
}
#let details(title, label, shots, blocks, accent: teal, note: none) = slide(title: title, kicker-text: label, accent: accent)[
  #box(width: 27cm, height: 11.15cm, {
    v-put(0cm, 0.1cm, 12.0cm, {
      set par(leading: 0.42em)
      for (i, pair) in blocks.enumerate() {
        kicker(c: accent.darken(10%), pair.at(0))
        v(0.18cm)
        text(size: 17pt, pair.at(1))
        if i < blocks.len() - 1 { v(0.15cm) }
      }
    })
    v-put(13.0cm, 0.05cm, 13.7cm, duo(shots.at(0), b: shots.at(1, default: none), arrow: shots.at(2, default: true), crop-b: none))
    if note != none {
      v-put(0cm, 10.65cm, 26.8cm, text(font: f-display, size: 15.5pt, style: "italic", fill: muted, note))
    }
  })
]

// One AI job as a paper card: label, what it does, and the model or tool behind it.
#let ai-job(num, name, body, tool, c) = v-sheet(6cm, 3.95cm, c, {
  v-put(0.32cm, 0.28cm, 5.4cm, v-label([#num · #name], c: c.darken(18%), size: 10pt))
  v-put(0.32cm, 0.82cm, 5.4cm, par(leading: 0.36em, text(size: 15pt, body)))
  v-put(0.32cm, 3.32cm, 5.4cm, text(font: f-mono, size: 9.5pt, fill: muted, tool))
})

// A ruled table with a mono header row, used for the model and steering slides.
#let spec-table(widths, header, rows, accent) = table(
  columns: widths, align: left + top, inset: (x: 7pt, y: 8pt),
  stroke: (x, y) => (bottom: if y == 0 { 1pt + ink } else { 0.5pt + faint }),
  ..header.map(h => kicker(c: accent.darken(10%), h)),
  ..rows.map(r => r.enumerate().map(((i, cell)) =>
    if i == 0 { text(font: f-display, size: 16pt, weight: 600, cell) }
    else if i == 1 and r.len() == 3 { text(size: 15.5pt, fill: accent.darken(15%), weight: 600, cell) }
    else { par(leading: 0.4em, text(size: 15.5pt, cell)) })).flatten(),
)

// Divider art for section 4: the model's output passes a check before the plan.
#let v-section-art-ai = cetz.canvas(length: 1cm, {
  import cetz.draw: *
  v-node((0.7, 0.5), text(font: f-display, weight: 600, size: 19pt)[AI], teal, w: 1.35, h: 1.05)
  v-arrow((1.55, 0.5), (2.65, 0.5))
  v-node((3.5, 0.5), text(font: f-mono, weight: "bold", size: 15pt)[{ }], marigold, w: 1.35, h: 1.05)
  v-arrow((4.35, 0.5), (5.45, 0.5))
  rnode((6.05, 0.5), teal, r: 0.34)
  line((5.88, 0.5), (6.0, 0.36), (6.22, 0.66), stroke: (paint: ink, thickness: 1.4pt, cap: "round"))
})

#divider("3", [the shared planning interaction], [User Flow \ & #em(cobalt)[Human–AI Interaction]],
  [From an explicit invitation to an editable shared plan], cobalt, v-section-art(2))

// This is the supplied User Flow. English labels overlay its original nodes.
// Connector artwork, node positions and rectangle/diamond types are retained.
#slide(title: [The complete User Flow], kicker-text: [Key User Flow], accent: cobalt)[
  #box(width: 27cm, height: 11cm, {
    v-put(0cm, 1.15cm, 27cm, image("assets/user-flow-en-original-layout.svg", width: 27cm))
    v-put(0cm, 7.5cm, 27cm, text(font: f-display, size: 24pt, weight: 600)[One conversation supports invitation, revision and an explicit end.])
  })
]

#slide(title: [Activation and conversation scope], kicker-text: [User Flow · Close-up 1], accent: teal)[
  #box(width: 27cm, height: 11cm, {
    v-put(0cm, 0.6cm, 27cm, image("assets/user-flow-en-start.svg", width: 27cm, height: 8.2cm, fit: "contain"))
    v-put(0cm, 9.45cm, 27cm, text(font: f-display, size: 22pt, fill: teal.darken(15%))[An explicit invitation starts the Bot. The user chooses what it may read.])
  })
]

#slide(title: [Organizing, reviewing and revising], kicker-text: [User Flow · Close-up 2], accent: tomato)[
  #box(width: 27cm, height: 11cm, {
    v-put(0cm, 0.45cm, 27cm, image("assets/user-flow-en-middle.svg", width: 27cm, height: 8.7cm, fit: "contain"))
    v-put(0cm, 9.6cm, 27cm, text(font: f-display, size: 22pt, fill: tomato.darken(15%))[Members review the result and decide which revisions to accept.])
  })
]

#slide(title: [Confirmation, saving and stopping], kicker-text: [User Flow · Close-up 3], accent: plum)[
  #box(width: 27cm, height: 11cm, {
    v-put(0cm, 0.4cm, 27cm, image("assets/user-flow-en-end.svg", width: 27cm, height: 8.7cm, fit: "contain"))
    v-put(0cm, 9.6cm, 27cm, text(font: f-display, size: 22pt, fill: plum.darken(15%))[The saved plan stays editable. Ending collection is explicit.])
  })
]

#details([Four friends want one shared Osaka itinerary], [User goal], ("d-chat", "a-map"), (
  ([Scenario], [Mia, Alex, Ben and Yuki are planning Osaka for Nov 20–22, staying in Namba.]),
  ([Goal], [Keep discussing naturally in the existing group while building one itinerary they can confirm and edit together.]),
  ([Current difficulty], [Places and preferences are scattered across messages. Repeated shares and later changes create more manual organizing.]),
), accent: teal)

#details([A shared link becomes a place card], [System output · Link cards], ("d-chat", "a-memory"), (
  ([Share a link], [A member pastes an Instagram, Threads or Facebook link. This is the one kind of message Waymark answers on its own.]),
  ([Read the post], [It reads the caption, photos and tags, finds the place and writes a short summary. A failed read is listed in the app, where it can be retried.]),
  ([Post a card], [Publisher, category, summary, photos, address, map link and the original post appear as one card. Members react with four emotes, and the app shows the same counts.]),
), accent: tomato)

#details([The user explicitly invites Waymark], [User action], ("d-scope0",), (
  ([Invite the Bot], [Mia mentions \@Waymark and sends a request to organize the Osaka discussion. This is where AI enters the interaction.]),
  ([Choose a scope], [The user chooses “From now on” or “Include earlier messages”. The Bot does not silently decide which history to read.]),
  ([Stay in the channel], [One tap replaces the buttons with a summary of what will be read, and organizing starts. Members can keep sharing ideas in the same channel.]),
), accent: cobalt)

#details([What the AI receives from this conversation], [AI input], ("d-scope1", "a-memory"), (
  ([Selected messages], [Use the available earlier group history and new messages, or only messages from the activation point onward.]),
  ([Travel context], [The discussion provides Osaka, Nov 20–22, four travelers, Namba accommodation and a preference for relaxed travel.]),
  ([Evidence and preferences], [Shared place names, source messages, links and individual preferences support the draft. Unclear venue details remain marked for clarification.]),
), accent: cobalt)

#details([Progress stays visible while the AI works], [System output · Progress], ("d-progress", "a-chat-busy"), (
  ([Show each step], [Waymark edits one message as it reads the scope, matches places, builds the days and checks hours and travel times.]),
  ([Keep the channel quiet], [Progress is one message that changes in place. It does not post a new message for each step.]),
  ([Same job in the app], [The Chat tab shows the same steps, then the draft with “Apply” and “Keep original”.]),
), accent: cobalt)

#details([AI structures the discussion and preserves evidence], [AI behavior], ("d-summary", "a-memory-sums"), (
  ([Extract the travel context], [Identify dates, group size, where the group is staying, candidate places and personal preferences.]),
  ([Merge repeated shares], [Group the same place together while preserving who shared it, the original message and the source link.]),
  ([Keep uncertainty visible], [A cafe without a clear name stays unresolved. AI asks for clarification instead of silently adding a guessed venue.]),
), accent: tomato)

#details([The result stays inside the conversation], [System output], ("d-draft", "a-trip"), (
  ([Result card in the channel], [When organizing finishes, Waymark posts a card in the channel: the days, the places and anything still unresolved.]),
  ([Shared itinerary draft], [A three-day draft gives members a concrete plan to inspect. Days, times and source links stay available in the web app.]),
  ([What happens next], [Members tap “Open in app” to filter candidates, open a source, add a place or revise the draft, or simply keep talking in the channel.]),
), accent: teal)

#slide(title: [One trip, four tabs], kicker-text: [System output · Web app], accent: teal)[
  #box(width: 27cm, height: 11.15cm, {
    v-put(0cm, 0cm, 27cm, gallery((("a-chat", [AI chat]), ("a-map", [Map]), ("a-trip", [Itinerary]), ("a-manage", [Manage])), h: 8.9cm))
    v-put(0cm, 10.3cm, 27cm, align(center, text(font: f-display, size: 20pt, style: "italic", fill: teal.darken(15%))[The channel starts the conversation; the app is where places and days are edited.]))
  })
]

#details([Members can inspect what the AI used], [User response · Review], ("d-chat", "a-place"), (
  ([User action], [Mia opens Nishiki Market and checks who shared it and the original post.]),
  ([AI and system behavior], [Repeated shares appear as one candidate, while both sources remain visible and traceable.]),
  ([User control], [The user can return to the original message before deciding whether the suggestion belongs in the itinerary.]),
), accent: cobalt)

#details([A correction does not require a restart], [User response · Correct], ("d-clarify-form", "a-memory-form"), (
  ([User action], [Mia adds the missing location for the riverside cafe and chooses “Not this time”.]),
  ([AI and system behavior], [Keep the clarification together with the original share. Do not add the cafe to this trip against the user’s choice.]),
  ([Result], [The share becomes clarified. The added detail stays available, so the user does not have to explain it again.]),
), accent: plum)

#details([Members can refine the context directly], [User response · Refine], ("a-memory-sums", "a-manage", false), (
  ([Correct a preference], [Mia edits her preference to include a relaxed pace and an 11:00 start on day three.]),
  ([Make direct edits], [The itinerary also supports time edits, reordering, removing a stop and manually adding candidate places.]),
  ([Share the revision], [Direct itinerary edits can be shared back to the group as a new version. The other members can review the updated plan.]),
), accent: teal)

#details([Subgroups can split up and meet again], [System output · Splitting], ("a-branch-map", "a-branch-list", false), (
  ([Split], [On day three Mia and Yuki take one route, Alex and Ben another. Each group has its own colour on the map, the timeline and the list.]),
  ([Meet again], [Both routes end at Namba Station, where the day continues as one plan.]),
  ([Keep gaps visible], [A slot without a place stays in the plan as a gap. Members add a place from the AI, or from the map.]),
), accent: plum)

#slide(title: [Every leg has a transport choice], kicker-text: [System output · Transit], accent: cobalt)[
  #box(width: 27cm, height: 11.15cm, {
    v-put(0cm, 0cm, 27cm, gallery((("a-seg", [Select a leg]), ("a-transit", [Compare routes]), ("a-transit-filter", [Filter modes])), h: 8.9cm))
    v-put(0cm, 10.3cm, 27cm, align(center, text(font: f-display, size: 20pt, style: "italic", fill: cobalt.darken(15%))[Public transit is on by default; members choose the modes they accept.]))
  })
]

#details([A natural-language request produces a proposal], [AI input, behavior & output], ("d-proposal", "a-prop"), (
  ([New AI input], [“Start day 3 at 11:00 and skip Osaka Castle.” The existing trip context stays available.]),
  ([AI behavior], [Interpret the request as a focused change. Keep the unrelated days and arrangements intact.]),
  ([System output], [Show the proposed differences first: a later start, and Osaka Castle returned to Candidates. Nothing is applied until approval.]),
), accent: tomato)

#details([Rejecting a proposal keeps the current plan], [User response · Reject], ("d-kept", "a-branch-list"), (
  ([User action], [Mia selects “Keep original” instead of applying the proposed changes.]),
  ([AI and system behavior], [Record that this proposal was not applied. Keep the existing itinerary version and the conversation.]),
  ([Continue], [The user can make another request, clarify a condition or edit the itinerary directly. Rejection does not end planning.]),
), accent: plum)

#details([Accepting a change creates a reviewable version], [User response · Accept & confirm], ("d-confirm", "a-applied"), (
  ([User action], [Mia accepts the new proposal, then confirms version two.]),
  ([AI and system behavior], [Apply only the accepted differences. Day three starts at 11:00, and Osaka Castle remains a candidate.]),
  ([Individual approval], [Show 1 of 4 confirmed, with three members still pending. One person’s confirmation does not imply group agreement.]),
), accent: teal)

#details([The user decides when collection ends], [User action & system response], ("d-finish", "d-saved"), (
  ([Continue after a reply], [Members can keep chatting after a proposal or confirmation. They do not need to rebuild the trip context.]),
  ([End explicitly], [Mia taps “Save and finish” on Waymark’s message. A dialog explains that the current version will be kept and new messages will stop being collected.]),
  ([Keep the distinction clear], [Saving can preserve a draft with pending confirmations. The user can cancel the dialog and keep discussing instead.]),
), accent: cobalt)

#details([Saved results remain available without restarting], [System output & user response], ("d-saved", "a-manage-paused"), (
  ([Saved output], [Keep the itinerary, sources and current approval status. Waymark’s message and the app both show that collection has paused.]),
  ([User action], [Reopen the saved itinerary or download its calendar file. Viewing the saved version does not restart collection.]),
  ([Optional feedback], [The user may ask for fewer stops or more options, or skip feedback. The saved itinerary remains available.]),
), accent: plum)

#divider("4", [what the model does, and what code checks], [Role of AI \ & #em(teal)[Technical Approach]],
  [Four model jobs, two models, and rules that code enforces], teal, v-section-art-ai)

#slide(title: [Inside the assistant: four model jobs, checked by code], kicker-text: [Role of AI · What it does], accent: teal)[
  #box(width: 27cm, height: 11.15cm, {
    // The interaction mode decides how often each job runs, and so which model it needs.
    v-put(0.2cm, 0cm, 12.8cm, align(center, v-label([Silent · every batch of new messages], c: teal.darken(15%))))
    v-put(13.8cm, 0cm, 12.8cm, align(center, v-label([When invited, or asked for a change], c: tomato.darken(10%))))
    v-put(0cm, 0cm, 27cm, cetz.canvas(length: 1cm, {
      import cetz.draw: *
      rect((0, 0), (27, 11.15), stroke: none, fill: none)
      for (a, b, col) in ((0.2, 13.0, teal), (13.8, 26.6, tomato)) {
        line((a, 10.35), (a, 10.6), (b, 10.6), (b, 10.35), stroke: 1pt + col)
      }
      for x in (6.2, 13.0, 19.8) { v-arrow((x + 0.14, 8.18), (x + 0.7, 8.18)) }
    }))
    v-put(0.2cm, 1.0cm, 6cm, ai-job([01], [Understand],
      [Read texts, links, screenshots and reels. Turn each shared link into a place card.],
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
    v-put(0.2cm, 5.45cm, 26.4cm, v-sheet(26.4cm, 1.55cm, faint, stock: paper2, {
      v-put(0.35cm, 0.2cm, 25.7cm, v-label([Code, not the model], c: ink, size: 9.5pt))
      v-put(0.35cm, 0.66cm, 25.7cm, text(size: 15pt)[Filters the chosen scope · checks every cited source · validates each plan · keeps versions · records each member’s approval])
    }))
    v-put(0.2cm, 7.7cm, 26.4cm, kicker(c: teal.darken(10%))[Why AI is needed])
    v-put(0.2cm, 8.35cm, 26.4cm, par(leading: 0.45em, text(size: 17pt)[Our prototype matches a fixed list of place names. Real chats use nicknames, say “the market Ben sent”, mix Chinese, Japanese and English, or share only a reel. No fixed list keeps up with that; a model that reads language and images can.]))
  })
]

#details([How the Discord bot works], [Technical approach · Discord bot], ("d-draft", "d-proposal", false), (
  ([Events in], [Link posts, \@mentions and button taps arrive as events. The bot reads only the channels it was added to, and only the scope the user chose.]),
  ([Cards out], [Replies are Components v2 messages: cards, buttons and forms. A tap updates the same message instead of posting a new one.]),
  ([Same memory as the app], [Cards, reactions and confirmations are saved to the shared trip memory, so the app and the channel always show the same state.]),
), accent: cobalt)

#slide(title: [Models and tools, and why], kicker-text: [Technical approach · Models and tools], accent: cobalt)[
  #box(width: 27cm, height: 11.15cm, {
    v-put(0cm, 0cm, 27cm, spec-table((5.3cm, 5.9cm, 1fr), ([Job], [Choice], [Why]), (
      ([Silent reading], [Claude Haiku 5.5],
        [Runs on every message batch, so cost decides (\$0.10 per million input tokens). Reads images; returns schema-checked JSON.]),
      ([Reel audio], [Whisper, open source],
        [Many reels are narrated: transcript, caption and a few frames cover most. Runs on our server; uses no credits.]),
      ([Places and travel], [Google Places + Routes],
        [Place IDs, opening hours and travel times come from a map database, not the model’s memory.]),
      ([Draft and revise], [Claude Opus 5.5],
        [Runs only on a request, but members wait for it and judge it. Must balance many constraints and keep other days intact.]),
      ([Chat platform], [Discord bot + web app],
        [Reads joined channels, flags \@mentions, posts cards and buttons; a web app shows the plan. LINE could follow, without old messages.]),
    ), cobalt))
    let note(x, head, body) = v-put(x, 9.15cm, 12.9cm, par(leading: 0.4em,
      text(size: 15pt)[#text(font: f-display, weight: 600)[#head] #body]))
    note(0cm, [Budget.], [About \$2 per planned trip (300 messages, 3 drafts, 10 revisions); only \$0.04 is silent work. \$100 covers development and user tests.])
    note(14.1cm, [Not needed now.], text(fill: muted)[Fine-tuning: no training data, and prompts with schemas suffice. Vector search: one trip’s chat fits in context.])
  })
]

#slide(title: [Prompts guide the model; code enforces the promises], kicker-text: [Technical approach · Steering], accent: tomato)[
  #box(width: 27cm, height: 11.15cm, {
    v-put(0cm, 0cm, 27cm, spec-table((8.2cm, 1fr), ([Promise in the demo], [How it is enforced]), (
      ([Reads only the chosen scope], [Chosen when Waymark is invited. Other messages never reach a model.]),
      ([Keeps every source], [The model must cite message IDs. Code drops any item without a valid one.]),
      ([Asks instead of guessing], [If Places finds no match, or several, the share stays unresolved and Waymark asks.]),
      ([Edits stay local], [The model returns typed changes (retime, move, remove). Code applies only accepted ones, as a new version.]),
      ([Plans stay realistic], [A validator checks opening hours, travel times and the group’s pace limit.]),
      ([Stays out of the way], [Only link cards appear on their own. Other silent jobs update the collection; Waymark replies only when invited or asked for a change.]),
    ), tomato))
    v-put(0cm, 10.05cm, 27cm, text(font: f-display, size: 15.5pt, style: "italic", fill: muted)[Every model output is JSON checked against a schema. The system prompt and example chats set format and tone.])
  })
]

#slide(title: [What is missing, what is uncertain, what comes next], kicker-text: [Current limitations & next steps], accent: plum)[
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
      - A fixed name list stands in for the model.
      - Discord bot designed, not connected; no Places lookup or reel processing.
      - State lives in one browser, so there is no multi-user sync.
      - *Platform limits:* Discord needs history and message-content permissions. LINE bots see only messages sent after they join.
    ])
    col(9.2cm, tomato, [Biggest uncertainty], [
      - *Technical:* accuracy on real, messy chats: nicknames, mixed languages, reels that never name the place.
      - *Interaction:* one member picks the scope, but everyone’s messages are read. Will the others accept that?
      - Will members read “1 of 4 confirmed” as individual, not group, approval?
    ])
    col(18.3cm, plum, [Next], [
      + Build a test set from about 20 consented group chats. Measure extraction and merge accuracy, and invented venues (target: 0).
      + Connect Discord, Haiku, Places and Whisper, then Opus.
      + Test with 3–5 friend groups.
      + Later: suggest new places, labelled as suggestions, and add LINE.
    ])
  })
]

// Live design access after the interaction explanation.
#slide(title: [Waymark design prototype], kicker-text: [Prototype], accent: cobalt)[
  #box(width: 27cm, height: 11cm, {
    v-put(0cm, 2.0cm, 27cm, text(font: f-display, size: 34pt, weight: 600,
      link("https://claude.ai/artifact/75jXxDxX1EwALYK2eui1Xs")[Open the design ↗]))
    v-put(0cm, 4.5cm, 27cm, text(font: f-mono, size: 18pt, fill: cobalt,
      link("https://claude.ai/artifact/75jXxDxX1EwALYK2eui1Xs")[claude.ai/artifact/75jXxDxX1EwALYK2eui1Xs]))
    v-put(0cm, 6.2cm, 27cm, text(font: f-display, size: 20pt, style: "italic", fill: muted)[Discord cards and the web app: every screen in this talk, with the states you can switch.])
  })
]
