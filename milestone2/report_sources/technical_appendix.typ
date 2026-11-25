// Report-only supplement. No presentation page is replaced or edited.
// API documentation describes capabilities; all architecture below is proposed.
#import "../slides_presentation/theme.typ": *
#import "../slides_presentation/visuals.typ": *
#import "appendix_visuals.typ": *

#let a-body(body) = box(width: 27cm, height: 10.9cm, body)
#let a-subtitle(body) = text(size: 19pt, fill: muted, body)
#let a-table(widths, headings, rows, size: 15.5pt) = table(
  columns: widths, inset: (x: 8pt, y: 9pt), align: left + top,
  stroke: (x, y) => (bottom: if y == 0 { 1pt + ink } else { 0.5pt + faint }),
  ..headings.map(h => v-label(h, c: teal.darken(15%), size: 10pt)),
  ..rows.map(row => row.enumerate().map(((i, body)) =>
    par(leading: 0.34em, text(font: if i == 0 { f-display } else { f-body },
      size: size, weight: if i == 0 { 600 } else { 400 }, body)))).flatten(),
)


#let t-architecture() = [
#slide(title: [System architecture: retrieval, tools and review], kicker-text: [Appendix B1 · Proposed architecture], accent: teal)[
  #a-body[
    #v-put(0cm, 0.02cm, 27cm, a-subtitle[Multimodal extraction, shared memory and an approval-controlled planning loop])
    #v-put(0cm, 0.75cm, 27cm, a-overview())
    #v-put(0.1cm, 10.6cm, 26.6cm, a-refline("References: [1], [3], [4]. The backend shown here is proposed, not connected in the PoC."))
  ]
]

// A2. Image understanding: [5]. Structured extraction: [2]. Place IDs: [3].
]

#let t-memory() = [
#slide(title: [From shared media to source-linked memory], kicker-text: [Appendix B2 · Proposed data pipeline], accent: cobalt)[
  #a-body[
    #v-put(0cm, 0.02cm, 27cm, a-subtitle[Read only the allowed scope; keep the evidence behind each extracted item])
    #v-put(0cm, 1.0cm, 13cm, a-ingestion())
    #v-put(14.1cm, 1.2cm, 12.4cm, v-sheet(12.4cm, 7.35cm, cobalt, {
      v-put(0.4cm, 0.35cm, 11.6cm, v-label([Example memory fields], c: cobalt.darken(15%), size: 10pt))
      v-put(0.25cm, 1.0cm, 11.9cm, table(
        columns: (3.1cm, 1fr), inset: (x: 7pt, y: 6pt), align: left + top,
        stroke: (top: none, bottom: 0.45pt + faint, left: none, right: none),
        ..(
          ("trip_id", [Trip identifier]),
          ("read_scope", [Channel and message range]),
          ("provenance", [Message IDs, URLs, sharer, time]),
          ("place", [Place ID + original source IDs]),
          ("preference", [Value + confirmation state]),
          ("item_status", [Unresolved, candidate or confirmed]),
          ("plan_state", [Accepted + proposed versions]),
        ).map(((key, value)) => (
          text(font: f-mono, size: 11pt, key),
          par(leading: 0.25em, text(size: 15.5pt, value)),
        )).flatten(),
      ))
    }))
    #v-put(0.2cm, 9.25cm, 26.5cm, a-caption[Private or unreadable media stays unresolved; ask for an accessible source.])
    #v-put(0.1cm, 10.6cm, 26.6cm, a-refline("References: [2], [3], [5]. Fields and extraction stages are proposed implementation details."))
  ]
]

// A3. Retrieval is a replaceable module; a vector database is not required initially.
]

#let t-retrieval() = [
#slide(title: [Retrieve evidence without losing confirmed needs], kicker-text: [Appendix B3 · Proposed RAG context design], accent: cobalt)[
  #a-body[
    #v-put(0cm, 0.05cm, 27cm, v-chat-slip(27cm, [Can we add a food market?], c: cobalt, who: "Ben"))
    #v-put(0cm, 1.8cm, 27cm, a-retrieval())
    #v-put(0.1cm, 8.95cm, 26.6cm, text(size: 17pt)[Start with metadata filters and keyword search. Keep related replies together.])
    #v-put(0.1cm, 9.85cm, 26.6cm, a-caption[Add semantic retrieval only if it improves relevant-evidence recall.])
    #v-put(0.1cm, 10.65cm, 26.6cm, a-refline("Reference: [1]. Message IDs and plan v3 are illustrative. Confirmed constraints bypass relevance ranking."))
  ]
]

// A4. Schema compliance [2] is separate from application-level correctness checks.
]

#let t-planner() = [
#slide(title: [Plan with tools, then validate proposed changes], kicker-text: [Appendix D1 · Proposed LLM and code responsibilities], accent: tomato)[
  #a-body[
    #v-put(0cm, 0.02cm, 27cm, a-subtitle[The model proposes operations; tools provide facts; code checks before review])
    #v-put(0cm, 0.85cm, 27cm, a-planner())
    #v-put(0.1cm, 5.85cm, 26.6cm, v-label([Code checks before a proposal reaches members], c: tomato.darken(15%), size: 10pt))
    #v-put(0cm, 6.4cm, 27cm, a-checks())
    #v-put(0.1cm, 9.4cm, 26.6cm, a-caption[Missing hours or prices remain flagged. Valid JSON alone does not prove a feasible plan.])
    #v-put(0.1cm, 10.6cm, 26.6cm, a-refline("References: [2], [3], [4]. Travel and visit durations are estimates; validation uses the available evidence."))
  ]
]

// A5. Explicit approval, base-version checking and collection state are design rules.
]

#let t-versions() = [
#slide(title: [Review, commit and pause are separate actions], kicker-text: [Appendix D3 · Proposed update and collection states], accent: teal)[
  #a-body[
    #v-put(0cm, 0.03cm, 27cm, a-subtitle[Illustrative trace: adding the market after lunch while keeping the accepted plan intact])
    #v-put(0.1cm, 1.0cm, 9.1cm, v-sheet(9.1cm, 7.65cm, cobalt, {
      v-put(0.4cm, 0.35cm, 8.3cm, v-label([Proposed change set], c: cobalt.darken(15%), size: 10pt))
      v-put(0.4cm, 1.15cm, 8.3cm, {
        set text(font: f-mono, size: 12.5pt)
        show raw: set text(font: f-mono, size: 12.5pt)
        raw("{\n  \"base_version\": \"v3\",\n  \"op\": \"add_stop\",\n  \"after\": \"lunch\",\n  \"candidate_id\": \"p_market\",\n  \"source_ids\": [\"m173\"],\n  \"status\": \"proposed\"\n}", lang: "json", block: true)
      })
      v-put(0.4cm, 6.15cm, 8.3cm, a-caption([Check the base version again before applying the change.], size: 15.5pt))
    }))
    #v-put(9.75cm, 0.9cm, 17.2cm, a-review())
    #v-put(0.1cm, 9.1cm, 26.6cm, text(size: 17pt)[Record confirmation per member; keep pending confirmations visible.])
    #v-put(0.1cm, 10.0cm, 26.6cm, a-caption([“Save and finish” pauses collection. Viewing a saved plan does not resume it.], size: 15.5pt))
    #v-put(0.1cm, 10.7cm, 26.6cm, a-refline("Illustrative schema and states, not an executed backend trace. A rejected proposal keeps the current plan."))
  ]
]

// A6. No evaluation outcomes are asserted; the dataset size follows the submitted plan.
]

#let t-evaluation() = [
#slide(title: [Implementation scope and evaluation plan], kicker-text: [Appendix E2 · Planned evaluation], accent: marigold)[
  #a-body[
    #v-put(0cm, 0.02cm, 27cm, a-subtitle[Connect the backend, then test extraction, retrieval and controlled updates])
    #v-put(0.1cm, 1.05cm, 26.6cm, text(font: f-display, size: 22pt, weight: 600)[Initial data: #hl(c: marigold)[3 consented chat histories], manually annotated])
    #v-put(0cm, 2.2cm, 27cm, a-table((4.5cm, 13.0cm, 9.5cm), ([Component], [Test design], [Observe]), (
      ([Extraction], [Annotate candidate places, original sources and expressed preferences.], [Place precision / recall; source traceability]),
      ([Retrieval], [Use the same planner and requests. Compare scoped full context, keyword retrieval and optional semantic retrieval.], [Relevant-evidence recall; missed confirmed constraints]),
      ([Updates], [Replay accept, reject, edit and stale-version cases against a saved plan.], [Unapproved writes; source validity; constraint violations]),
      ([Group use], [Later: 3–5 friend groups complete one shared planning task.], [Correction success; task time and steps; approval understanding]),
    ), size: 15pt))
    #v-put(0.1cm, 10.3cm, 26.6cm, a-caption([No backend results are claimed. Model choices and cost estimates remain planning assumptions.], size: 15pt))
  ]
]

// A7. Primary sources checked 2026-10-28. References support capabilities,
// not a claim that the current clickable prototype implements these components.
]

#let t-references() = [
#slide(title: [Technical references and implementation status], kicker-text: [Appendix F1 · Sources], accent: teal)[
  #a-body[
    #let entry(y, n, title, url, description) = {
      v-put(0.1cm, y + 0.03cm, 0.8cm, text(font: f-mono, size: 12pt, fill: teal.darken(15%), n))
      v-put(1.05cm, y, 25.5cm, {
        set par(leading: 0.28em)
        text(font: f-display, size: 18pt, weight: 600, link(url, title))
        linebreak()
        text(size: 15pt, fill: muted, description)
      })
    }
    #entry(0.1cm, "[1]", [Anthropic — Introducing Contextual Retrieval (2024)],
      "https://www.anthropic.com/research/contextual-retrieval",
      [RAG, context selection and retrieval as a knowledge base grows.])
    #entry(1.45cm, "[2]", [Claude Docs — Structured outputs],
      "https://platform.claude.com/docs/en/build-with-claude/structured-outputs",
      [Schema-constrained outputs; application-level checks remain separate.])
    #entry(2.8cm, "[3]", [Google Maps Platform — Place Details (New)],
      "https://developers.google.com/maps/documentation/places/web-service/place-details",
      [Place IDs and requested place fields, including opening hours.])
    #entry(4.15cm, "[4]", [Google Maps Platform — Get a route matrix],
      "https://developers.google.com/maps/documentation/routes/compute_route_matrix",
      [Estimated travel durations and distances between candidate places.])
    #entry(5.5cm, "[5]", [Claude Docs — Vision],
      "https://platform.claude.com/docs/en/build-with-claude/vision",
      [Image understanding in the proposed media extraction pipeline.])
    #entry(6.85cm, "[6]", [Claude Docs — Pricing],
      "https://platform.claude.com/docs/en/about-claude/pricing",
      [Published model rates and the input-length condition for Haiku 5.5.])
    #v-put(0.1cm, 8.7cm, 26.5cm, line(length: 26.5cm, stroke: 0.7pt + faint))
    #v-put(0.1cm, 9.15cm, 26.5cm, text(size: 16pt)[Current PoC: clickable Discord and app interface states. No live Bot or AI backend is connected.])
    #v-put(0.1cm, 10.15cm, 26.5cm, a-refline("Accessed 28 October 2026. This appendix proposes the implementation behind the demonstrated interactions."))
  ]
]
]
