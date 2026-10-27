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
#let ai-job(num, name, body, tool, c) = v-sheet(6cm, 4.25cm, c, {
  v-put(0.32cm, 0.28cm, 5.4cm, v-label([#num · #name], c: c.darken(18%), size: 10pt))
  v-put(0.32cm, 0.82cm, 5.4cm, par(leading: 0.36em, text(size: 15pt, body)))
  v-put(0.32cm, 3.62cm, 5.4cm, text(font: f-mono, size: 9.5pt, fill: muted, tool))
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

// Section 3: six interaction slides following the unchanged User Flow.
#details([The user invites Waymark and chooses its scope], [User goal & activation], ("d-scope0", "a-map"), (
  ([Shared goal], [Four friends are planning Osaka for Nov 20–22. They want one editable itinerary while continuing their group chat.]),
  ([User action], [Mia mentions \@Waymark and chooses “From now on” or “Include earlier messages”. Organizing uses only that scope.]),
  ([Shared workspace], [The draft appears in Discord. Members open the web app to inspect places and edit the itinerary.]),
), accent: cobalt)

#details([AI turns the selected discussion into a draft], [AI input, behavior & output], ("d-summary", "a-trip"), (
  ([Input], [Selected messages provide dates, shared places and each member’s preferences. Shared links get place cards automatically.]),
  ([AI behavior], [Merge repeated places and retain their sources. Ask about unclear venues instead of guessing. Check hours and travel times.]),
  ([Output], [One progress message updates in place. The result is a draft itinerary with source links and unresolved details visible.]),
), accent: teal)

#details([Members inspect sources and correct the context], [User response · Review & correct], ("a-place", "a-memory-form", false), (
  ([Review], [Open a place to see who shared it and return to the original post. Repeated shares retain their sources.]),
  ([Correct], [Add a missing location or edit a preference without restarting. “Not this time” keeps a clarified place out of this trip.]),
  ([Edit directly], [Adjust times, reorder stops or add a candidate in the app. Share the revised version back to the group.]),
), accent: plum)

#details([Subgroups and transport stay in one itinerary], [System output · Flexible planning], ("a-branch-map", "a-transit", false), (
  ([Split and meet again], [Mia and Yuki take one route, Alex and Ben another. Both routes meet at Namba Station and continue together.]),
  ([Choose transport], [Compare routes for each leg and filter acceptable modes. Public transit is enabled by default.]),
  ([Keep gaps visible], [Unfilled slots stay visible. Members can add a place from the map or ask the AI for suggestions.]),
), accent: cobalt)

#details([Members review changes before they are applied], [User request · Proposal & approval], ("d-proposal", "a-applied"), (
  ([Request], [“Start day 3 at 11:00 and skip Osaka Castle.” AI proposes only those differences; other arrangements stay intact.]),
  ([Accept or reject], [“Apply” creates a new version. “Keep original” preserves the current plan. Members can keep discussing either way.]),
  ([Confirm individually], [Confirmation is recorded per member. “1 of 4 confirmed” does not mean the whole group agrees.]),
), accent: tomato)

#details([The user saves the plan and stops collection], [User action · Save & finish], ("d-finish", "a-manage-paused"), (
  ([End explicitly], [“Save and finish” explains that new messages will stop being collected. Cancel to keep discussing.]),
  ([Preserve the result], [The saved itinerary retains its sources and approval status, including pending confirmations. Collection is shown as paused.]),
  ([Return later], [Reopen the itinerary or download its calendar file. Viewing the saved plan does not restart collection.]),
), accent: plum)

#divider("4", [what the model does, and what code checks], [Role of AI \ & #em(teal)[Technical Approach]],
  [What the AI does, which models, and how code keeps it in check], teal, v-section-art-ai)

// Section 4 follows the front section's pattern: one statement, one drawing, one takeaway.
// About 40 seconds per slide; the detailed versions are kept as backup at the end.
#let s4-statement(body) = text(font: f-display, size: key-statement-size, weight: 600, body)
#let s4-rule = line(length: 27cm, stroke: 0.7pt + faint)
#let s4-line(body) = text(size: takeaway-size, body)
#let s4-quiet(body) = text(size: 20pt, fill: muted, body)
#let s4-step(n, body) = [#text(font: f-mono, size: 10pt, fill: muted)[0#n] #h(0.15cm) #body]

// CONTENT 4a — Inside the assistant: two kinds of work, about 45 seconds.
#slide(title: [Links get a card on their own; plans come when asked], kicker-text: [Role of AI], accent: teal)[
  #box(width: 27cm, height: 10.9cm, {
    v-put(0cm, 0.05cm, 26.7cm, s4-statement[AI turns a messy chat into #hl(c: teal)[a plan with sources].])
    v-put(0cm, 1.7cm, 27cm, cetz.canvas(length: 1cm, {
      import cetz.draw: *
      rect((0, 0), (27, 6.6), stroke: none, fill: none)
      let y = 3.0
      v-node((2.4, y), par(leading: 0.3em, align(center, text(font: f-display, size: 17pt, weight: 600)[Discord \ channel])), paper2, w: 4.4, h: 2.0)
      content((2.4, y - 1.4), text(size: 12pt, fill: muted)[texts · links · reels])
      v-node((9.5, y), [], teal, w: 7.4, h: 3.0)
      v-node((22.5, y), [], tomato, w: 7.4, h: 3.0)
      // Trip memory, centred between the two kinds of work.
      let (cx, rx) = (16.0, 2.1)
      // Fill the bottom curve as well as the body, so no unfilled crescent shows.
      circle((cx, y - 0.75), radius: (rx, 0.34), fill: paper2, stroke: none)
      rect((cx - rx, y - 0.75), (cx + rx, y + 0.75), fill: paper2, stroke: none)
      line((cx - rx, y - 0.75), (cx - rx, y + 0.75), stroke: 1.05pt + ink)
      line((cx + rx, y - 0.75), (cx + rx, y + 0.75), stroke: 1.05pt + ink)
      circle((cx, y + 0.75), radius: (rx, 0.34), fill: paper2, stroke: 1.05pt + ink)
      arc((cx + rx, y - 0.75), start: 0deg, stop: -180deg, radius: (rx, 0.34), stroke: 1.05pt + ink)
      content((cx, y + 0.05), text(font: f-display, size: 17pt)[Trip memory])
      content((cx, y - 0.5), text(size: 11pt, fill: muted)[places · sources])
      v-arrow((4.7, y), (5.7, y))
      v-arrow((13.3, y), (13.8, y))
      v-arrow((18.2, y), (18.7, y))
      // Proposals return to the same channel for review.
      line((22.5, y + 1.6), (22.5, 5.9), (2.4, 5.9), stroke: (paint: cobalt, thickness: 1.15pt))
      v-arrow((2.4, 5.9), (2.4, y + 1.1), c: cobalt)
      content((12.45, 5.9), box(fill: paper, inset: (x: 10pt, y: 2pt),
        text(font: f-display, style: "italic", size: 15pt, fill: cobalt.darken(15%))[proposal card · members accept, edit or reject]))
    }))
    let lane(x, c, label, a, b) = v-put(x, 4.1cm, 6.7cm, {
      v-label(label, c: c.darken(18%), size: 10pt)
      v(0.1cm)
      set par(leading: 0.45em)
      text(size: 15pt)[#s4-step(1, a) \ #s4-step(2, b)]
    })
    lane(6.15cm, teal, [On its own · each link], [Read caption, photos, tags], [Post a place card, or ask])
    lane(19.15cm, tomato, [When \@mentioned], [Summarize or draft a plan], [Turn requests into changes])
    v-put(0cm, 8.3cm, 27cm, s4-rule)
    v-put(0.1cm, 8.85cm, 26.6cm, s4-line[Why AI? Chats are full of nicknames, three languages and reels.])
    v-put(0.1cm, 9.95cm, 26.6cm, s4-quiet[No fixed list of place names keeps up; a language-and-vision model can.])
  })
]

// CONTENT 4b — Two models, chosen by how often they run, about 45 seconds.
#slide(title: [Two models, chosen by how often they run], kicker-text: [Technical approach · Models], accent: cobalt)[
  #box(width: 27cm, height: 10.9cm, {
    v-put(0cm, 0.05cm, 26.5cm, text(size: 21pt)[A Discord bot posts the cards; a web app shows the plan.])
    let card(x, c, label, name, why, tools) = v-put(x, 1.45cm, 13cm, v-sheet(13cm, 5.9cm, c, {
      v-put(0.5cm, 0.45cm, 12cm, v-label(label, c: c.darken(18%), size: 10.5pt))
      v-put(0.5cm, 1.1cm, 12cm, text(font: f-display, size: 28pt, weight: 600, name))
      v-put(0.5cm, 2.45cm, 12cm, par(leading: 0.42em, text(size: 17pt, why)))
      v-put(0.5cm, 4.55cm, 12cm, tools.map(t => tag(c: c, size: 12pt, t)).join(h(0.4cm)))
    }))
    card(0cm, teal, [On its own · every shared link], [Claude Haiku 5.5],
      [Runs on every link anyone posts, so it must be fast and cheap.], ([Whisper · reel audio], [Google Places]))
    card(13.9cm, tomato, [When \@mentioned], [Claude Opus 5.5],
      [Members wait for the summary or plan, so quality matters more than cost.], ([Google Routes],))
    v-put(0cm, 8.3cm, 27cm, s4-rule)
    v-put(0.1cm, 8.85cm, 26.6cm, s4-line[About \$2 per planned trip; the link cards cost cents.])
    v-put(0.1cm, 9.95cm, 26.6cm, s4-quiet[Not needed now: fine-tuning or a vector database.])
  })
]

// CONTENT 4c — Control: the model drafts, code checks, members decide, about 40 seconds.
#slide(title: [Prompts guide the model; code keeps the promises], kicker-text: [Technical approach · Control], accent: tomato)[
  #box(width: 27cm, height: 10.9cm, {
    v-put(0cm, 0.05cm, 26.7cm, s4-statement[Nothing changes the plan until #hl(c: tomato)[a member accepts it].])
    v-put(0cm, 1.35cm, 27cm, cetz.canvas(length: 1cm, {
      import cetz.draw: *
      rect((0, 0), (27, 6.4), stroke: none, fill: none)
      let y = 3.2
      v-node((2.5, y), text(font: f-display, size: 18pt, weight: 600)[Model draft], teal, w: 4.4, h: 1.7)
      content((2.5, y - 1.25), text(size: 12pt, fill: muted)[JSON only])
      v-node((18.3, y), text(font: f-display, size: 18pt, weight: 600)[Proposal card], cobalt, w: 4.4, h: 1.7)
      v-node((24.5, y), text(font: f-display, size: 18pt, weight: 600)[Members], paper2, w: 4.4, h: 1.7)
      content((24.5, y - 1.25), text(size: 13pt)[accept · edit · reject])
      v-arrow((4.8, y), (5.9, y))
      v-arrow((15.5, y), (15.95, y))
      v-arrow((20.6, y), (22.15, y))
    }))
    v-put(6.15cm, 2.25cm, 9.1cm, v-sheet(9.1cm, 4.7cm, marigold, {
      v-put(0.45cm, 0.4cm, 8.2cm, v-label([Code checks], c: marigold.darken(30%), size: 10pt))
      v-put(0.45cm, 1.05cm, 8.2cm, {
        set par(leading: 0.5em)
        for (i, t) in ([Only the chosen scope], [Every item cites a message], [Real places, real opening hours], [Within the group’s pace]).enumerate() {
          box(baseline: 20%, v-icon("circle-check", size: 0.5cm, c: "#14988a"))
          h(0.25cm)
          text(size: 16pt, t)
          if i < 3 { linebreak() }
        }
      })
    }))
    v-put(21.4cm, 6.1cm, 6.2cm, align(center, stamp(c: plum, angle: 0deg, size: 9pt)[new version]))
    v-put(0cm, 8.3cm, 27cm, s4-rule)
    v-put(0.1cm, 8.85cm, 26.6cm, s4-line[Unclear place? Waymark asks instead of guessing.])
    v-put(0.1cm, 9.95cm, 26.6cm, s4-quiet[The system prompt and example chats set the format and tone.])
  })
]

// CONTENT 5 — Limitations and next steps as one timeline, about 40 seconds.
#slide(title: [What is missing, and what comes next], kicker-text: [Current limitations & next steps], accent: plum)[
  #box(width: 27cm, height: 10.9cm, {
    v-put(0cm, 0.05cm, 26.7cm, s4-statement[Biggest unknown: can it #hl(c: plum)[read real, messy chats]?])
    let steps = (
      ([Today], muted, [Discord and app screens designed; no bot or model code yet.]),
      ([Connect], teal, [Discord bot, Haiku, Places and Whisper, then Opus.]),
      ([Measure], marigold, [20 consented chats: place accuracy, zero invented venues.]),
      ([Test], cobalt, [3–5 friend groups: scope, approvals, trust.]),
    )
    for (i, (head, c, body)) in steps.enumerate() {
      let x = i * 6.85cm
      v-put(x, 1.45cm, 6.2cm, align(center, text(font: f-display, size: 19pt, weight: 600, fill: c.darken(15%), head)))
      v-put(x, 3.35cm, 6.2cm, v-sheet(6.2cm, 2.9cm, if c == muted { faint } else { c }, {
        v-put(0.35cm, 0.35cm, 5.5cm, par(leading: 0.45em, text(size: 16pt, body)))
      }))
    }
    v-put(0cm, 2.35cm, 27cm, cetz.canvas(length: 1cm, {
      import cetz.draw: *
      rect((0, 0), (27, 0.8), stroke: none, fill: none)
      v-arrow((0.8, 0.4), (26.4, 0.4), c: faint)
      for (i, c) in (faint, teal, marigold, cobalt).enumerate() {
        rnode((3.1 + i * 6.85, 0.4), c, r: 0.25, off: 0.065)
        content((3.1 + i * 6.85, 0.4), text(font: f-mono, size: 9pt, weight: "medium", str(i + 1)))
      }
    }))
    v-put(19.8cm, 6.75cm, 7.2cm, align(center, stamp(c: plum, angle: -3deg, size: 8.5pt)[later: new places · LINE]))
    v-put(0cm, 8.3cm, 27cm, s4-rule)
    v-put(0.3cm, 9.1cm, 26.4cm, align(center,
      text(font: f-display, size: takeaway-size, style: "italic", fill: plum.darken(15%))[Also open: will others accept that one member picks the scope?]))
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

// Backup for Q&A: the detailed section 4 and 5 slides.
#slide(title: [Inside the assistant: four model jobs, checked by code], kicker-text: [Backup · Role of AI · What it does], accent: teal)[
  #box(width: 27cm, height: 11.15cm, {
    // The interaction mode decides how often each job runs, and so which model it needs.
    v-put(0.2cm, 0cm, 12.8cm, align(center, v-label([On its own · each shared link], c: teal.darken(15%))))
    v-put(13.8cm, 0cm, 12.8cm, align(center, v-label([When \@mentioned], c: tomato.darken(10%))))
    v-put(0cm, 0cm, 27cm, cetz.canvas(length: 1cm, {
      import cetz.draw: *
      rect((0, 0), (27, 11.15), stroke: none, fill: none)
      for (a, b, col) in ((0.2, 13.0, teal), (13.8, 26.6, tomato)) {
        line((a, 10.35), (a, 10.6), (b, 10.6), (b, 10.35), stroke: 1pt + col)
      }
      for x in (6.2, 13.0, 19.8) { v-arrow((x + 0.14, 8.03), (x + 0.7, 8.03)) }
    }))
    v-put(0.2cm, 1.0cm, 6cm, ai-job([01], [Understand],
      [Read each shared link: caption, photos and tags. Post it as a place card.],
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
    v-put(0.2cm, 8.6cm, 26.4cm, par(leading: 0.45em, text(size: 17pt)[Our prototype matches a fixed list of place names. Real chats use nicknames, say “the market Ben sent”, mix Chinese, Japanese and English, or share only a reel. No fixed list keeps up with that; a model that reads language and images can.]))
  })
]

#details([How the Discord bot works], [Backup · Technical approach · Discord bot], ("d-draft", "d-proposal", false), (
  ([Events in], [Link posts, \@mentions and button taps arrive as events. The bot reads only the channels it was added to, and only the scope the user chose.]),
  ([Cards out], [Replies are Components v2 messages: cards, buttons and forms. A tap updates the same message instead of posting a new one.]),
  ([Same memory as the app], [Cards, reactions and confirmations are saved to the shared trip memory, so the app and the channel always show the same state.]),
), accent: cobalt)

#slide(title: [Models and tools, and why], kicker-text: [Backup · Technical approach · Models and tools], accent: cobalt)[
  #box(width: 27cm, height: 11.15cm, {
    v-put(0cm, 0cm, 27cm, spec-table((5.3cm, 5.9cm, 1fr), ([Job], [Choice], [Why]), (
      ([Link cards], [Claude Haiku 5.5],
        [Runs on every shared link, so cost decides (\$0.10 per million input tokens). Reads images; returns schema-checked JSON.]),
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
    note(0cm, [Budget.], [About \$2 per planned trip (300 messages, 3 drafts, 10 revisions); link cards cost cents. \$100 covers development and user tests.])
    note(14.1cm, [Not needed now.], text(fill: muted)[Fine-tuning: no training data, and prompts with schemas suffice. Vector search: one trip’s chat fits in context.])
  })
]

#slide(title: [Prompts guide the model; code enforces the promises], kicker-text: [Backup · Technical approach · Steering], accent: tomato)[
  #box(width: 27cm, height: 11.15cm, {
    v-put(0cm, 0cm, 27cm, spec-table((8.2cm, 1fr), ([Promise in the demo], [How it is enforced]), (
      ([Reads only the chosen scope], [Chosen when Waymark is invited. Other messages never reach a model.]),
      ([Keeps every source], [The model must cite message IDs. Code drops any item without a valid one.]),
      ([Asks instead of guessing], [If Places finds no match, or several, the share stays unresolved and Waymark asks.]),
      ([Edits stay local], [The model returns typed changes (retime, move, remove). Code applies only accepted ones, as a new version.]),
      ([Plans stay realistic], [A validator checks opening hours, travel times and the group’s pace limit.]),
      ([Stays out of the way], [Only link cards appear on their own. Summaries, plans and changes wait for an \@mention.]),
    ), tomato))
    v-put(0cm, 10.05cm, 27cm, text(font: f-display, size: 15.5pt, style: "italic", fill: muted)[Every model output is JSON checked against a schema. The system prompt and example chats set format and tone.])
  })
]

#slide(title: [What is missing, what is uncertain, what comes next], kicker-text: [Backup · Current limitations & next steps], accent: plum)[
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
      + Build a test set from about 20 consented group chats. Measure extraction and merge accuracy, and invented venues (target: 0).
      + Connect Discord, Haiku, Places and Whisper, then Opus.
      + Test with 3–5 friend groups.
      + Later: suggest new places, labelled as suggestions, and add LINE.
    ])
  })
]
