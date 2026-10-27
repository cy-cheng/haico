// HAICO Milestone 2: Motivation & Problem / Refined Goal
// Compile: typst compile --font-path fonts slides.typ slides.pdf
// Template: ../slide_tem/theme.typ. Drawings: visuals.typ.
// All conversations, maps and schedules are illustrative, not a working demo.
#import "theme.typ": *
#import "visuals.typ": *
#show: setup
#set document(title: "Travel Planning in Group Chats — HAICO Milestone 2", author: "HAICO project team")

#let put = v-put
#let diagram(body, height: 10.9cm) = box(width: 100%, height: height, body)
#let words(body, size: 18pt, fill: ink, weight: 400) = text(size: size, fill: fill, weight: weight, body)

// COVER — Shared media and a proposed group route.
#{
  place(top + left, dx: 1.3cm, ribbon(teal))
  place(top + left, dx: 2.05cm, dy: 0.62cm, kicker[HAICO 2026 / Milestone 2])
  place(top + left, dx: 1.3cm, dy: 3.2cm, block(width: 16cm, {
    block(par(leading: 14pt,
      text(font: f-display, size: 57pt, weight: 700, tracking: -1pt)[Travel Planning \ in #em(teal)[Group Chats]]))
  }))
  place(top + left, dx: 1.4cm, dy: 9.3cm, block(width: 14cm,
    text(font: f-display, size: 23pt, style: "italic", fill: muted)[An AI assistant for shared ideas \ and evolving itineraries]))
  place(top + left, dx: 16.7cm, dy: 1.65cm,
    scale(x: 94%, y: 94%, origin: top + left, reflow: false, v-cover-art()))
  place(bottom + left, dx: 1.4cm, dy: -1.25cm,
    text(size: 15pt)[Human–AI Interaction & Collaboration 2026])
  place(bottom + right, dx: -1.2cm, dy: -0.5cm, folio())
  box(width: 100%, height: 100%)[]
}

// SECTION 1 — The template's monumental halftone numeral.
#divider("1", [the problem], [Motivation \ & #em(tomato)[Problem]],
  [Why the conversation still needs an organizer], tomato, v-section-art(1))

// CONTENT 1 — Preferences emerge over an ongoing conversation, about 35 seconds.
// Notes: Friends may start with a rough destination idea. Shared Reels, images
// and videos introduce places. Budget, pace and new priorities become clearer
// later. The four stages are an illustrative sequence, not measured time points
// or interview quotations. Members need not know every requirement up front.
#slide(title: [Travel needs emerge through conversation], kicker-text: [Motivation & Problem], accent: teal)[
  #diagram[
    #put(0cm, 0.05cm, 26.5cm, words([Example: friends planning an Osaka trip in Discord or LINE], size: 21pt))
    #put(0.1cm, 1.5cm, 27cm, v-needs-timeline())
    #put(0.3cm, 9.55cm, 26.4cm, align(center,
      text(font: f-display, size: takeaway-size, style: "italic", fill: teal.darken(15%))[Preferences become clearer over time.]))
  ]
]

// CONTENT 2 — Central pain point, about 55 seconds.
// Evidence: M1's six informal interviews with students and young adults.
// Source: M1 interview notes (team Google Doc; link kept out of the public repo).
// Notes: Someone must reopen media, identify places, recover preferences and
// transfer them into a plan. New discussion requires further manual updates.
// Supporting evidence for the spoken explanation, kept off the slide:
// "In our M1 interviews, participants described searching for places from shared
// Reels one by one. In our product exploration, we also had to explain the trip
// context again in a separate planning app."
// Product exploration: the team described repeated prompting and rebuilding
// trip context in dedicated planning interfaces. This is the team's observation,
// not a universal claim that every app requires a complete brief up front.
// Mindtrip's own FAQ asks travelers to share their interests, budget and other
// preferences, and also supports iterative changes:
// https://resources.mindtrip.ai/travelers/help/traveler-faqs
#slide(title: [Keeping the itinerary aligned takes work], kicker-text: [Motivation & Problem], accent: tomato)[
  #diagram[
    #put(0cm, 0.05cm, 26.7cm, text(font: f-display, size: key-statement-size, weight: 600)[Someone has to #hl(c: tomato)[rebuild the plan].])
    #put(0cm, 1.35cm, 27cm, v-manual-work())
    #put(6.1cm, 7.15cm, 14.8cm, align(center, stamp(c: tomato, angle: 0deg, size: 11pt)[repeat after new messages]))
    #put(0cm, 8.3cm, 27cm, line(length: 27cm, stroke: 0.7pt + faint))
    #put(0.3cm, 9.1cm, 26.4cm, align(center,
      text(font: f-display, size: takeaway-size, style: "italic", fill: tomato.darken(15%))[New preferences mean another round of manual updates.]))
  ]
]

// SECTION 2
#divider("2", [the proposed system], [Refined \ #em(teal)[Goal]],
  [Planning that stays connected to the conversation], teal, v-section-art(2))

// CONTENT 3 — Direct visual counterpart of slide 4, about 20 seconds.
// The side sheets and their positions are identical. AI takes over extracting
// and structuring ideas; members continue to decide preferences and changes.
#slide(title: [AI helps keep the itinerary aligned], kicker-text: [Refined Goal], accent: teal)[
  #diagram[
    #put(0cm, 0.05cm, 26.7cm, text(font: f-display, size: key-statement-size, weight: 600)[AI turns shared ideas into #hl(c: teal)[a draft itinerary].])
    #put(0cm, 1.35cm, 27cm, v-manual-work(ai: true))
    #put(6.1cm, 7.15cm, 14.8cm, align(center, stamp(c: teal, angle: 0deg, size: 11pt)[inside the existing Discord channel]))
    #put(0cm, 8.3cm, 27cm, line(length: 27cm, stroke: 0.7pt + faint))
    #put(0.1cm, 8.85cm, 26cm, words([The plan develops as the group's preferences become clearer.], size: takeaway-size))
    #put(0.1cm, 9.95cm, 26cm, words([Members confirm preferences and approve itinerary changes.], size: 20pt, fill: muted))
  ]
]

// CONTENT 4 — Connected chat, AI and memory architecture, about 25 seconds.
// Notes: AI joins the existing group chat, understands text and media, and keeps
// places, original sources and members' preferences in shared travel memory.
// It uses that context to propose a shared itinerary. This describes the design,
// not the current implementation status of the demo.
#slide(title: [The conversation and the plan stay connected], kicker-text: [Refined Goal], accent: teal)[
  #diagram[
    #put(0cm, 0.02cm, 26.5cm, words([New messages update context for the next proposal], size: 21pt))
    #put(0cm, 1.10cm, 27cm, v-architecture())
    #put(0.15cm, 10.5cm, 26.5cm, align(center,
      text(font: f-display, size: takeaway-size, style: "italic", fill: teal.darken(15%))[Members can review and correct what the AI remembers.]))
  ]
]

// CONTENT 5 — Personal preferences, optional subgroups and itinerary choices.
// Notes: People confirm or correct AI's interpretation of their interests,
// budget and pace. Confirmed preferences help AI suggest a shared plan or
// optional subgroups. The museum and food groups are illustrative.
#slide(title: [Preferences shape groups and itineraries], kicker-text: [Refined Goal], accent: cobalt)[
  #diagram[
    #put(0cm, 0.05cm, 26.5cm, words([The conversation reveals what different members want], size: 21pt))
    #put(0.4cm, 1.75cm, 26cm, v-preference-routes())
    #put(0.2cm, 10.5cm, 26.2cm, align(center,
      text(font: f-display, size: takeaway-size, style: "italic", fill: teal.darken(15%))[Optional subgroups within a shared itinerary]))
  ]
]

// CONTENT 6 — Continuous planning and human control, about 20 seconds.
// Notes: AI proposes an update after new messages or media. People accept, edit
// or reject it. Only accepted changes enter the plan. Since M1, the focus is one
// continuous planning loop that reduces repeated manual input.
#slide(title: [The itinerary evolves with the discussion], kicker-text: [Refined Goal], accent: plum)[
  #diagram[
    #put(0cm, 0.35cm, 27cm, v-replanning())
    #put(0.1cm, 9.1cm, 26.5cm, v-label([Our focus since Milestone 1], c: plum.darken(10%)))
    #put(0.1cm, 9.85cm, 26.5cm, text(font: f-display, size: takeaway-size, weight: 600)[One continuous conversation and planning loop])
  ]
]

// SECTION 2 CLOSE — PoC interaction questions, not evaluation results.
// The user initiates the Bot and chooses its readable scope. AI organizes and
// proposes; members inspect sources, correct content and accept/reject edits.
// Context persists through discussion until the user explicitly stops organizing.
#slide(title: [PoC: planning in the group chat], kicker-text: [Refined Goal · Proof of Concept], accent: teal)[
  #diagram[
    #put(0cm, 1.0cm, 27cm, v-poc-workflow())
    #put(0cm, 9.1cm, 27cm, align(center,
      text(font: f-display, size: 22pt, style: "italic", fill: teal.darken(15%))[
        Goal: less copying and re-explaining
      ]))
  ]
]
