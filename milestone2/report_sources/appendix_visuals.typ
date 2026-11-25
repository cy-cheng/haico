// Editable diagrams for the report appendix. The presentation sources stay frozen.
#import "../slides_presentation/theme.typ": *
#import "../slides_presentation/visuals.typ": *

#let a-node(p, title, c: teal, w: 5.0, h: 1.55, sub: none, size: 16pt) = v-node(p,
  block(width: (w - 0.35) * 1cm, align(center, {
    set par(leading: 0.26em)
    text(font: f-display, size: size, weight: 600, title)
    if sub != none {
      linebreak()
      text(size: 12.5pt, fill: muted, sub)
    }
  })), c, w: w, h: h)

#let a-memory(p, title, w: 5.2, h: 1.4, sub: none, compact: false) = {
  import cetz.draw: *
  let (x, y) = p
  let rx = w / 2
  let top = y + h / 2
  let bot = y - h / 2
  let cap = if compact { 0.18 } else { 0.28 }
  circle((x, bot), radius: (rx, cap), fill: paper2, stroke: none)
  rect((x - rx, bot), (x + rx, top), fill: paper2, stroke: none)
  line((x - rx, bot), (x - rx, top), stroke: 1.05pt + ink)
  line((x + rx, bot), (x + rx, top), stroke: 1.05pt + ink)
  circle((x, top), radius: (rx, cap), fill: paper2, stroke: 1.05pt + ink)
  arc((x + rx, bot), start: 0deg, stop: -180deg, radius: (rx, cap), stroke: 1.05pt + ink)
  content((x, y + if compact { 0.04 } else { 0.12 }),
    text(font: f-display, size: if compact { 15.5pt } else { 17pt }, weight: 600, title))
  if sub != none {
    content((x, y - if compact { 0.35 } else { 0.38 }),
      text(size: if compact { 11pt } else { 11.5pt }, fill: muted, sub))
  }
}

#let a-caption(body, c: muted, size: 16pt) = text(font: f-display, style: "italic", size: size, fill: c, body)
#let a-refline(body) = text(font: f-mono, size: 10pt, fill: muted, body)

// B1: solid arrows retain keyword/metadata retrieval. The upper dashed branch
// optionally embeds authorized records and the query in the same vector space.
#let a-overview() = cetz.canvas(length: 1cm, {
  import cetz.draw: *
  rect((0, 0), (27, 9.6), fill: none, stroke: none)
  // Narrower cards leave roughly 2 cm of visible horizontal arrow shaft.
  let node(p, title, c, sub: none, h: 1.2) = v-node(p,
    block(width: 4.25cm, align(center, {
      set par(leading: 0.16em)
      text(font: f-display, size: 14.5pt, weight: 600, title)
      if sub != none {
        linebreak()
        text(size: 11pt, fill: muted, sub)
      }
    })), c, w: 4.6, h: h)
  let arrow(a, b, c: ink, optional: false) = line(a, b,
    stroke: (paint: c, thickness: 1.2pt, dash: if optional { "dashed" } else { none }),
    mark: (end: "stealth", fill: c, scale: 1.0))

  rect((7.15, 7.4), (19.95, 9.55), fill: tint(plum, p: 96%),
    stroke: (paint: plum, thickness: 1.05pt, dash: "dashed"), radius: 0.12)
  content((13.55, 9.28), v-label([Optional · semantic retrieval], c: plum.darken(15%), size: 9.5pt))
  rect((13.95, 4.75), (26.75, 6.95), fill: tint(cobalt, p: 95%),
    stroke: 0.85pt + cobalt, radius: 0.12)
  content((23.45, 6.65), v-label([RAG · retrieve + augment], c: cobalt.darken(15%), size: 9.5pt))

  // Document indexing and query embedding meet at the vector index.
  node((3.2, 8.4), [Chat + media], teal, sub: [Chosen message scope])
  node((10.1, 8.4), [Embedding], plum, sub: [Model · scoped chunks])
  node((17.0, 8.4), [Vector index], plum, sub: [Scoped semantic search])
  node((23.9, 8.4), [User request], paper2,
    sub: [Query embedding \ optional · same model], h: 1.6)
  arrow((12.55, 8.4), (14.55, 8.4), c: plum, optional: true)
  arrow((21.45, 8.4), (19.45, 8.4), c: plum, optional: true)
  arrow((10.1, 6.53), (10.1, 7.65), c: plum, optional: true)
  arrow((17.0, 7.65), (17.0, 6.4), c: plum, optional: true)

  // Baseline requests bypass the optional embedding branch.
  arrow((3.2, 7.65), (3.2, 6.4))
  arrow((22.9, 7.4), (18.2, 6.4), c: cobalt)
  node((3.2, 5.65), [Extract], teal, sub: [Places / preferences])
  a-memory((10.1, 5.65), [Trip memory], w: 4.9, h: 1.1, compact: true,
    sub: [sources / needs / versions])
  node((17.0, 5.65), [Retrieve], cobalt, sub: [Keywords + scope filters])
  node((23.9, 5.65), [Build context], cobalt, sub: [Confirmed needs + plan])
  arrow((5.65, 5.65), (7.5, 5.65))
  arrow((12.7, 5.65), (14.55, 5.65), c: teal)
  arrow((19.45, 5.65), (21.45, 5.65), c: cobalt)

  node((23.9, 2.95), [Planning LLM], teal, sub: [Draft or edit proposal])
  node((17.0, 2.95), [Code validation], tomato, sub: [Evidence / constraints])
  node((10.1, 2.95), [Member review], tomato, sub: [Accept / edit / reject])
  arrow((23.9, 4.9), (23.9, 3.7), c: cobalt)
  arrow((21.45, 2.95), (19.45, 2.95), c: tomato)
  arrow((14.55, 2.95), (12.55, 2.95), c: tomato)
  arrow((10.1, 3.7), (10.1, 4.77), c: teal)
  content((5.3, 4.24), box(width: 8.6cm, align(right,
    a-caption([Accepted version + confirmed corrections], c: teal.darken(15%), size: 11.5pt))))

  node((23.9, 0.5), [Places + Routes], marigold, h: 0.8)
  arrow((23.2, 2.2), (23.2, 1.05), c: marigold.darken(15%))
  arrow((24.6, 1.05), (24.6, 2.2), c: marigold.darken(15%))
  content((21.9, 1.62), a-caption([query], size: 11.5pt))
  content((25.85, 1.62), a-caption([facts], size: 11.5pt))
  content((9.35, 0.65), text(size: 11.5pt, fill: muted)[Solid: baseline flow · dashed: optional semantic retrieval])
})

// A2: an accessible source is converted to a record that retains provenance.
#let a-ingestion() = cetz.canvas(length: 1cm, {
  import cetz.draw: *
  rect((0, 0), (13, 7.9), fill: none, stroke: none)
  for (x, name) in ((1.5, "messages-square"), (4.3, "clapperboard"), (7.1, "image"), (9.9, "video")) {
    content((x, 7.3), v-icon(name, size: 0.72cm))
  }
  a-node((6.0, 5.65), [Normalize allowed content], c: teal, w: 11.0, h: 1.7,
    sub: [Text / captions / OCR / audio transcripts / key frames])
  v-arrow((6.0, 6.98), (6.0, 6.68), c: teal)
  a-node((6.0, 3.0), [Extract places + preferences], c: cobalt, w: 11.0, h: 1.7,
    sub: [Resolve place IDs; ask when the match is unclear])
  v-arrow((6.0, 4.6), (6.0, 4.02), c: teal)
  v-arrow((11.75, 3.0), (12.85, 3.0), c: cobalt)
  content((6.0, 1.25), a-caption([Merge duplicate places; retain every source.], c: teal.darken(15%), size: 17pt))
  content((6.0, 0.35), text(size: 15pt, fill: muted)[Sharing alone does not confirm a preference.])
})

// A3: mandatory state bypasses relevance ranking; evidence remains scoped.
#let a-retrieval() = cetz.canvas(length: 1cm, {
  import cetz.draw: *
  rect((0, 0), (27, 6.8), fill: none, stroke: none)
  a-memory((3.0, 4.1), [Trip records], w: 5.2, h: 1.5, sub: [Source-linked memory])
  a-node((12.2, 5.1), [Always include], c: teal, w: 10.4, h: 2.1,
    sub: [Confirmed needs + latest accepted plan \ m104: budget / m128: pace / plan v3], size: 18pt)
  a-node((12.2, 1.65), [Retrieve relevant evidence], c: cobalt, w: 10.4, h: 2.1,
    sub: [Related messages + nearby replies + source IDs \ m173: market request and linked source], size: 18pt)
  line((5.85, 4.1), (6.25, 4.1), (6.25, 5.1), stroke: 1.1pt + teal)
  v-arrow((6.25, 5.1), (6.78, 5.1), c: teal)
  line((6.25, 4.1), (6.25, 1.65), stroke: 1.1pt + cobalt)
  v-arrow((6.25, 1.65), (6.78, 1.65), c: cobalt)
  content((11.8, 6.55), v-label([Trip + permission + message-scope filters], c: muted, size: 9.3pt))
  a-node((23.25, 3.4), [Context package], c: marigold, w: 6.2, h: 2.2,
    sub: [Request + needs \ + plan + evidence], size: 19pt)
  line((17.65, 5.1), (18.65, 5.1), (18.65, 3.85), stroke: 1.1pt + teal)
  v-arrow((18.65, 3.85), (19.9, 3.85), c: teal)
  line((17.65, 1.65), (18.65, 1.65), (18.65, 2.95), stroke: 1.1pt + cobalt)
  v-arrow((18.65, 2.95), (19.9, 2.95), c: cobalt)
})

// A4: LLM tool requests and typed changes precede deterministic checks.
#let a-planner() = cetz.canvas(length: 1cm, {
  import cetz.draw: *
  rect((0, -0.1), (27, 4.9), fill: none, stroke: none)
  a-node((3.0, 3.5), [Context package], c: cobalt, w: 5.2, h: 1.55)
  a-node((12.5, 3.5), [Planning LLM], c: teal, w: 5.4, h: 1.55)
  a-node((23.0, 3.5), [Typed change set], c: tomato, w: 6.7, h: 1.55, sub: [Add / move / remove / retime])
  v-arrow((5.85, 3.5), (9.52, 3.5))
  v-arrow((15.45, 3.5), (19.4, 3.5))
  a-node((12.5, 0.9), [Places + Routes], c: marigold, w: 10.0, h: 1.35,
    sub: [Place IDs / known hours / travel-time estimates])
  v-arrow((11.6, 2.52), (11.6, 1.8), c: marigold.darken(15%))
  v-arrow((13.4, 1.8), (13.4, 2.52), c: marigold.darken(15%))
  content((10.4, 2.05), a-caption([query], size: 12pt))
  content((14.6, 2.05), a-caption([facts], size: 12pt))
})

#let a-checks() = cetz.canvas(length: 1cm, {
  import cetz.draw: *
  rect((0, 0), (27, 2.65), fill: none, stroke: none)
  a-node((4.1, 1.35), [Schema + scope], c: tomato, w: 8.0, h: 2.0,
    sub: [Required fields \ Allowed message IDs])
  a-node((13.5, 1.35), [Sources + place IDs], c: tomato, w: 8.0, h: 2.0,
    sub: [Valid references \ Unresolved places flagged])
  a-node((22.9, 1.35), [Feasibility + version], c: tomato, w: 8.0, h: 2.0,
    sub: [Known hours / travel / budget \ Current base version])
  v-arrow((8.3, 1.35), (9.3, 1.35), c: tomato)
  v-arrow((17.7, 1.35), (18.7, 1.35), c: tomato)
})

// A5: rejected proposals never overwrite the accepted plan.
#let a-review() = cetz.canvas(length: 1cm, {
  import cetz.draw: *
  rect((0, 0), (17.2, 8.0), fill: none, stroke: none)
  a-node((8.0, 7.1), [Current plan v3], c: paper2, w: 5.8, h: 1.15)
  a-node((8.0, 5.25), [Pending proposal], c: cobalt, w: 5.8, h: 1.2)
  v-arrow((8.0, 6.3), (8.0, 6.05))
  a-node((8.0, 3.25), [Member review], c: teal, w: 5.8, h: 1.2)
  v-arrow((8.0, 4.45), (8.0, 4.05))
  a-node((2.25, 1.1), [Keep v3], c: faint, w: 4.3, h: 1.2)
  line((4.85, 3.25), (2.25, 3.25), stroke: 1.1pt + muted)
  v-arrow((2.25, 3.25), (2.25, 1.9), c: muted)
  content((3.1, 3.88), a-caption([reject], size: 14pt))
  a-node((8.0, 0.78), [Save v4], c: teal, w: 4.8, h: 1.2)
  v-arrow((8.0, 2.45), (8.0, 1.58), c: teal)
  content((9.0, 2.03), a-caption([accept], c: teal.darken(15%), size: 14pt))
  line((11.15, 3.25), (13.05, 3.25), (13.05, 5.25), stroke: 1.1pt + cobalt)
  v-arrow((13.05, 5.25), (11.15, 5.25), c: cobalt)
  content((15.0, 4.25), text(size: 14pt, fill: cobalt.darken(15%))[edit / \ regenerate])
})
