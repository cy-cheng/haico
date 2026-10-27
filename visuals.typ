// Editable concept drawings in the supplied Riso paper style.
// All maps, conversations and schedules below are illustrative.
#import "theme.typ": *

#let v-put(x, y, w, body) = place(top + left, dx: x, dy: y, block(width: w, body))
#let v-icon(name, size: 0.85cm, c: "#23201b") = image(
  bytes(read("assets/icons/" + name + ".svg").replace("currentColor", c)),
  format: "svg", width: size, height: size)
#let v-label(body, c: muted, size: 10pt) = text(font: f-mono, size: size, fill: c, tracking: 0.8pt, upper(body))
#let v-sheet(w, h, c, body, angle: 0deg, stock: paper) = rotate(angle, reflow: false,
  box(width: w, height: h, {
    place(dx: 0.11cm, dy: 0.12cm, box(width: w, height: h, fill: c.transparentize(35%), radius: 3pt)[])
    box(width: w, height: h, fill: stock, stroke: 1.05pt + ink, radius: 3pt, body)
  }))
#let v-arrow(a, b, c: ink, dash: none) = {
  import cetz.draw: *
  line(a, b, stroke: (paint: c, thickness: 1.2pt, dash: dash),
    mark: (end: "stealth", fill: c, scale: 1.2))
}
#let v-node(p, body, c, w: 4.4, h: 1.45) = {
  import cetz.draw: *
  let (x, y) = p
  rect((x - w / 2 + 0.10, y - h / 2 - 0.10), (x + w / 2 + 0.10, y + h / 2 - 0.10),
    fill: c, stroke: none, radius: 0.14)
  rect((x - w / 2, y - h / 2), (x + w / 2, y + h / 2),
    fill: paper, stroke: 1.1pt + ink, radius: 0.14)
  content(p, body)
}

// Media drawings use actual labels, illustrations and message context.
#let v-source(kind, title, c, icon-name, w: 3.4cm, h: 5.3cm, angle: 0deg, portrait: false,
  preview-h: 2.45cm, preview-y: 0.92cm, label-size: 9pt, title-size: 17pt, icon-size: 1.15cm) = v-sheet(w, h, c, angle: angle, {
  v-put(0.25cm, 0.22cm, w - 0.5cm, v-label(kind, c: c.darken(15%), size: label-size))
  v-put(0.25cm, preview-y, w - 0.5cm, box(width: w - 0.5cm, height: preview-h, fill: tint(c, p: 77%), radius: 2pt, {
    place(center + horizon, v-icon(icon-name, size: icon-size))
    if portrait {
      place(bottom + right, dx: -0.12cm, dy: -0.1cm,
        text(font: f-mono, size: 8pt, fill: muted)[00:18])
    }
  }))
  v-put(0.25cm, preview-y + preview-h + 0.31cm, w - 0.5cm, par(leading: 0.12em,
    text(font: f-display, size: title-size, weight: 600, title)))
})

// A group-chat message drawn as a Discord message row (dark channel, round avatar, name, body).
// People match the prototype: Mia, Alex, Ben, Yuki and the Waymark bot.
#let dc-bg = rgb("#313338")
#let dc-people = (
  Mia: (rgb("#b93a22"), "M"), Alex: (rgb("#2a4bb0"), "A"),
  Ben: (rgb("#0b6b61"), "B"), Yuki: (rgb("#6f3a8f"), "Y"),
  Waymark: (rgb("#efa12a"), "W"),
)
#let v-dc-msg(w, ht, who, body, c: teal, angle: 0deg, size: 14pt, compact: false) = {
  let (col, ini) = dc-people.at(who)
  let av = if compact { 0.5cm } else { 0.9cm }
  let tx = if compact { 0.82cm } else { 1.3cm }
  let ny = if compact { 0.07cm } else { 0.14cm }
  let by = if compact { 0.38cm } else { 0.62cm }
  v-sheet(w, ht, c, angle: angle, stock: dc-bg, {
    v-put(if compact { 0.16cm } else { 0.25cm }, if compact { 0.14cm } else { 0.22cm }, av, box(width: av, height: av, radius: av / 2, fill: col,
      align(center + horizon, text(size: if compact { 8pt } else { 12pt }, weight: "bold", fill: rgb("#f6f0e3"), ini))))
    v-put(tx, ny, w - tx - 0.15cm, {
      text(size: if compact { 8.5pt } else { 11pt }, weight: "bold", fill: rgb("#f2f3f5"), who)
      if who == "Waymark" {
        h(0.12cm)
        box(fill: rgb("#5865f2"), radius: 2pt, inset: (x: 2.5pt, y: 1pt), text(size: if compact { 5.5pt } else { 7pt }, weight: "bold", fill: white, "APP"))
      }
    })
    v-put(tx, by, w - tx - 0.15cm, par(leading: 0.3em, text(size: size, fill: rgb("#dbdee1"), body)))
  })
}
#let v-chat-slip(w, body, c: teal, angle: 0deg, who: "Mia") = v-dc-msg(w, 1.35cm, who, body, c: c, angle: angle)

// The line, stops, labels, fold marks and color plates are all editable.
#let v-map(w: 6.5cm, h: 8cm, c: teal, angle: 0deg, market: true, title: [GROUP PLAN]) = v-sheet(w, h, c, angle: angle, {
  v-put(0.35cm, 0.25cm, w - 0.7cm, v-label(title, c: c.darken(12%), size: 9pt))
  v-put(0.35cm, 0.86cm, w - 0.7cm, text(font: f-display, weight: 600, size: 23pt)[Saturday])
  v-put(0.30cm, 2.1cm, w - 0.6cm, cetz.canvas(length: 1cm, {
    import cetz.draw: *
    let mw = w / 1cm - 0.6
    let mh = h / 1cm - 3.25
    rect((0, 0), (mw, mh), fill: paper2, stroke: none, radius: 0.06)
    for x in (mw / 3, 2 * mw / 3) {
      line((x, 0), (x, mh), stroke: (paint: faint.transparentize(35%), thickness: 0.6pt, dash: "dotted"))
    }
    // Roads on the schematic map.
    for y in (0.9, 2.1, 3.3) {
      if y < mh { line((0.15, y), (mw - 0.15, y), stroke: 5pt + paper) }
    }
    for x in (1.2, 3.5) {
      if x < mw { line((x, 0.15), (x, mh - 0.15), stroke: 5pt + paper) }
    }
    let p1 = (0.85, mh - 0.85)
    let p2 = (mw - 1.05, mh / 2 + 0.1)
    let p3 = (1.75, 0.75)
    bezier(p1, p2, (1.5, mh - 0.5), (mw - 0.65, mh - 0.5),
      stroke: (paint: c, thickness: 2.5pt, cap: "round"))
    bezier(p2, p3, (mw - 0.65, 0.2), (3.0, 0.4),
      stroke: (paint: c, thickness: 2.5pt, cap: "round"))
    for (p, num, col) in ((p1, [1], cobalt), (p2, [2], marigold), (p3, [3], if market { tomato } else { faint })) {
      rnode(p, col, r: 0.23, off: 0.07, w: 1pt)
      content(p, text(font: f-mono, size: 8pt, weight: "bold", num))
    }
  }))
  v-put(0.35cm, h - 0.78cm, w - 0.7cm, text(size: 11pt, fill: muted)[Museum / Lunch / #if market { [Market] } else { [Free] }])
})

#let v-media-pile() = box(width: 12.8cm, height: 11.7cm, {
  v-put(0.35cm, 1.15cm, 4cm, v-source([REEL LINK], [Ramen], tomato, "clapperboard",
    w: 4cm, h: 6.2cm, angle: -7deg, portrait: true, preview-h: 3.4cm, label-size: 10.5pt))
  v-put(4.2cm, 0.45cm, 4cm, v-source([IMAGE], [Art museum], cobalt, "image",
    w: 4cm, h: 6.2cm, angle: 2deg, preview-h: 3.4cm, label-size: 10.5pt))
  v-put(8.05cm, 1.25cm, 4cm, v-source([VIDEO], [Walking tour], teal, "video",
    w: 4cm, h: 6.2cm, angle: 7deg, preview-h: 3.4cm, label-size: 10.5pt))
  v-put(0.45cm, 8.1cm, 12cm, v-chat-slip(12cm, [Can we keep it under \$50?], c: marigold, angle: -1deg, who: "Ben"))
  v-put(1.15cm, 9.95cm, 11.1cm, v-chat-slip(11.1cm, [I'd prefer a relaxed pace.], c: teal, angle: 1deg, who: "Alex"))
  v-put(7.9cm, 0cm, 4cm, stamp(c: tomato, angle: 7deg, size: 9pt)[in the chat])
})

// A compact native version of the same media-and-conversation illustration.
// The paired human/AI diagrams both use this component as their input.
#let v-media-input(media-only: false) = box(width: 6.15cm, height: 6.15cm, {
  let source(kind, title, c, pict, angle) = v-source(kind, title, c, pict,
    w: 1.95cm, h: 3.3cm, angle: angle, preview-h: 1.45cm, preview-y: 0.68cm,
    label-size: 7pt, title-size: 11pt, icon-size: 0.65cm)
  v-put(0.1cm, 0.6cm, 1.95cm, source([REEL], [Ramen], tomato, "clapperboard", -7deg))
  v-put(1.95cm, 0.22cm, 1.95cm, source([IMAGE], [Art \ museum], cobalt, "image", 2deg))
  v-put(3.95cm, 0.62cm, 1.95cm, source([VIDEO], [Walking \ tour], teal, "video", 7deg))
  let chat(x, y, w, who, body, c) = v-put(x, y, w, v-dc-msg(w, 0.90cm, who, body, c: c, size: 10.5pt, compact: true))
  if not media-only {
    chat(0.1cm, 4.1cm, 5.75cm, "Ben", [Can we keep it under \$50?], marigold)
    chat(0.4cm, 5.2cm, 5.4cm, "Alex", [I'd prefer a relaxed pace.], teal)
  }
  v-put(3.3cm, -0.05cm, 2.8cm, stamp(c: tomato, angle: 7deg, size: 6pt)[in chat])
})

// An ordinal timeline of an illustrative conversation, not measured user data.
// The clippings retain the same paper, outlines and misregistered color plates.
#let v-needs-timeline() = box(width: 27cm, height: 8.4cm, {
  let columns = (
    (0cm, 3.0, [A rough idea], marigold),
    (6.9cm, 9.9, [Shared inspiration], tomato),
    (13.8cm, 16.8, [Budget and pace], teal),
    (20.7cm, 23.7, [A new request], cobalt),
  )
  for (x, cx, heading, col) in columns {
    v-put(x, 0.05cm, 6cm, align(center,
      text(font: f-display, size: 18pt, weight: 600, fill: col.darken(20%), heading)))
  }
  v-put(0cm, 0.95cm, 27cm, cetz.canvas(length: 1cm, {
    import cetz.draw: *
    rect((0, 0), (27, 1.1), stroke: none, fill: none)
    v-arrow((1.1, 0.55), (26.1, 0.55), c: faint)
    for (i, (_, cx, _, col)) in columns.enumerate() {
      rnode((cx, 0.55), col, r: 0.25, off: 0.065)
      content((cx, 0.55), text(font: f-mono, size: 9pt, weight: "medium", str(i + 1)))
      line((cx, 0.14), (cx, 0), stroke: 0.8pt + faint)
    }
  }))
  // Only an initial destination idea is known.
  v-put(0.25cm, 2.45cm, 5.5cm, v-dc-msg(5.5cm, 1.4cm, "Mia", [Osaka this fall?], c: marigold, angle: -2deg, size: 13pt))
  // Existing shared-media drawings supply the inspiration stage.
  v-put(6.85cm, 2.12cm, 6.15cm, v-media-input(media-only: true))
  // Constraints become explicit in ordinary conversation.
  v-put(13.95cm, 2.5cm, 5.7cm, v-dc-msg(5.7cm, 1.4cm, "Ben", [Under \$50 a day?],
    c: marigold, angle: -1deg, size: 13pt))
  v-put(14.10cm, 4.25cm, 5.55cm, v-dc-msg(5.55cm, 1.4cm, "Alex", [Let's keep it relaxed.],
    c: teal, angle: 1deg, size: 13pt))
  // Later input adds another priority.
  v-put(20.95cm, 2.45cm, 5.5cm, v-dc-msg(5.5cm, 1.4cm, "Yuki", [Add a food market?], c: cobalt, angle: 2deg, size: 13pt))
  v-put(21.1cm, 6.2cm, 5.2cm, align(center,
    stamp(c: cobalt, angle: -3deg, size: 8pt)[still evolving]))
})

#let v-cover-art() = box(width: 12.7cm, height: 12.3cm, {
  v-put(0.3cm, 0.2cm, 3.1cm, v-source([REEL], [Ramen], tomato, "clapperboard", w: 3.1cm, h: 5cm, angle: -10deg))
  v-put(3cm, 0.45cm, 3.1cm, v-source([IMAGE], [Museum], cobalt, "image", w: 3.1cm, h: 5cm, angle: 5deg))
  v-put(6.2cm, 3.05cm, 6cm, v-map(w: 6cm, h: 7.6cm, angle: 6deg, title: [SHARED ITINERARY]))
  v-put(0.25cm, 6.0cm, 6.3cm, v-chat-slip(6.3cm, [Let's plan Saturday.], c: teal, angle: -3deg, who: "Waymark"))
  v-put(2.25cm, 9.2cm, 7cm, cetz.canvas(length: 1cm, {
    import cetz.draw: *
    bezier((0, 0.7), (3.2, 1.55), (0.6, -0.25), (2.2, -0.15),
      stroke: (paint: teal, thickness: 1.5pt, dash: "dashed"),
      mark: (end: "stealth", fill: teal, scale: 1.3))
    rnode((-0.2, 1.15), tomato, r: 0.18)
  }))
})

// A compact concept drawing used under the chapter titles.
#let v-section-art(which) = cetz.canvas(length: 1cm, {
  import cetz.draw: *
  if which == 1 {
    for (i, col) in (tomato, cobalt, teal).enumerate() {
      let x = i * 1.65
      let y = calc.rem(i, 2) * 0.3
      rect((x + 0.08, y - 0.08), (x + 1.25, y + 1.65), fill: col.transparentize(55%), stroke: none, radius: 0.05)
      rect((x, y), (x + 1.17, y + 1.73), fill: paper, stroke: 1pt + ink, radius: 0.05)
      for j in range(3) { line((x + 0.2, y + 0.9 - j * 0.25), (x + 0.95, y + 0.9 - j * 0.25), stroke: 1.8pt + col.transparentize(45%)) }
    }
    v-arrow((4.95, 0.9), (6.25, 0.9))
    content((7.0, 0.9), text(font: f-display, size: 35pt, style: "italic", fill: tomato)[?])
  } else {
    for (p, col) in (((0, 0.2), tomato), ((0.9, 1.2), cobalt), ((1.6, -0.1), marigold)) { rnode(p, col, r: 0.24) }
    v-arrow((2.2, 0.5), (3.2, 0.5))
    v-node((4.1, 0.5), text(font: f-display, weight: 600, size: 19pt)[AI], teal, w: 1.35, h: 1.05)
    v-arrow((4.95, 0.5), (6.05, 0.5))
    line((6.4, -0.2), (7.15, 1.1), (8.2, 0.2), stroke: 1.6pt + teal)
    for p in ((6.4, -0.2), (7.15, 1.1), (8.2, 0.2)) { rnode(p, teal, r: 0.18) }
  }
})

// The organizer's recurring work: media pile, a person, and an itinerary sheet.
#let v-manual-work(ai: false) = box(width: 27cm, height: 6.4cm, {
  v-put(0.05cm, 0cm, 6.15cm, v-media-input())
  v-put(0cm, 0cm, 27cm, cetz.canvas(length: 1cm, {
    import cetz.draw: *
    rect((0, 0), (27, 6.4), stroke: none, fill: none)
    // Identical input/output drawings, spacing and flow axis make slides 4 and 6 a pair.
    v-arrow((6.3, 3.2), (11.3, 3.2))
    if ai {
      // A riso robot occupies the same center as the human organizer.
      rect((12.36, 2.49), (14.86, 4.39), fill: teal, stroke: none, radius: 0.15)
      rect((12.25, 2.6), (14.75, 4.5), fill: paper, stroke: 1.3pt + ink, radius: 0.15)
      line((13.5, 4.5), (13.5, 4.95), stroke: 1.2pt + ink)
      rnode((13.5, 5.05), teal, r: 0.13, w: 0.9pt)
      circle((12.95, 3.7), radius: 0.11, fill: ink, stroke: none)
      circle((14.05, 3.7), radius: 0.11, fill: ink, stroke: none)
      line((13.0, 3.14), (14.0, 3.14), stroke: 1.1pt + ink)
      line((11.95, 3.2), (11.95, 3.9), (12.25, 3.9), stroke: 1.2pt + ink)
      line((15.05, 3.2), (15.05, 3.9), (14.75, 3.9), stroke: 1.2pt + ink)
      content((13.5, 1.35), text(font: f-display, size: 19pt, style: "italic", fill: teal.darken(15%))[the AI assistant])
    } else {
      rnode((13.5, 4.35), marigold, r: 0.47, off: 0.11)
      bezier((12.3, 2.5), (14.7, 2.5), (12.35, 3.8), (14.65, 3.8), stroke: 1.5pt + ink)
      content((13.5, 1.35), text(font: f-display, size: 19pt, style: "italic")[the organizer])
    }
    v-arrow((15.7, 3.2), (20.7, 3.2))
    content((8.8, 4.05), text(font: f-display, style: "italic", size: 14pt, fill: muted,
      if ai { [extract] } else { [reopen] }))
    content((18.2, 4.05), text(font: f-display, style: "italic", size: 14pt, fill: muted,
      if ai { [generate / adjust] } else { [brief the planner] }))
  }))
  v-put(21.15cm, 0.2cm, 5.4cm, v-map(w: 5.4cm, h: 5.8cm, market: false, title: [CURRENT ITINERARY]))
})

// Connected architecture, with a fixed viewport and a shared row baseline.
// Chat context enters memory through AI extraction. AI stores/retrieves context.
// Proposed plans return to the chat so members can review and correct them.
#let v-architecture() = cetz.canvas(length: 1cm, {
  import cetz.draw: *
  rect((0, 0), (27, 9.1), stroke: none, fill: none)
  // One horizontal baseline, with a distinct solid-color AI processing node.
  v-node((3.4, 6.25), text(font: f-display, size: 18pt, weight: 600)[Discord channel], paper2, w: 5.8, h: 1.8)
  let ai-shape = ((10.6, 6.25), (11.1, 7.3), (15.9, 7.3), (16.4, 6.25), (15.9, 5.2), (11.1, 5.2))
  line(..ai-shape.map(((x, y)) => (x + 0.13, y - 0.12)), close: true,
    fill: tint(teal, p: 45%), stroke: none)
  line(..ai-shape, close: true, fill: teal.darken(18%), stroke: 1.3pt + ink)
  content((13.5, 6.25), text(font: f-display, size: 22pt, weight: 700, fill: paper)[AI assistant])
  v-node((23.6, 6.25), text(font: f-display, size: 21pt, weight: 600)[Draft itinerary], cobalt, w: 5.8, h: 1.8)
  v-arrow((6.55, 6.25), (10.3, 6.25))
  v-arrow((16.7, 6.25), (20.4, 6.25))
  content((8.4, 6.95), text(font: f-display, style: "italic", size: 14pt)[new messages])
  content((18.55, 6.95), text(font: f-display, style: "italic", size: 14pt)[generate / adjust])
  // Plans return to the existing chat. Group feedback enters the same loop.
  line((23.6, 7.4), (23.6, 8.4), (3.4, 8.4),
    stroke: (paint: cobalt, thickness: 1.15pt))
  v-arrow((3.4, 8.4), (3.4, 7.4), c: cobalt)
  content((13.5, 8.4), box(fill: paper, inset: (x: 10pt, y: 2pt),
    text(font: f-display, style: "italic", size: 15pt, fill: cobalt.darken(15%))[proposal back to the group]))
  // Explicit chat-to-memory connection, labeled with the AI's extraction role.
  line((3.4, 5.1), (3.4, 1.65), stroke: 1.15pt + teal)
  v-arrow((3.4, 1.65), (10.15, 1.65), c: teal)
  content((2.8, 4.05), anchor: "east", text(size: 14pt, fill: muted)[Text, Reels \ images, videos])
  content((6.7, 2.35), text(font: f-display, style: "italic", size: 14pt, fill: teal.darken(15%))[AI captures chat context])
  // The memory cylinder is centered below the AI.
  let cx = 13.5
  let cy = 1.65
  let rx = 3.1
  // Fill the bottom curve as well as the body, so no unfilled crescent shows.
  circle((cx, cy - 0.85), radius: (rx, 0.38), fill: paper2, stroke: none)
  rect((cx - rx, cy - 0.85), (cx + rx, cy + 0.85), fill: paper2, stroke: none)
  line((cx - rx, cy - 0.85), (cx - rx, cy + 0.85), stroke: 1.05pt + ink)
  line((cx + rx, cy - 0.85), (cx + rx, cy + 0.85), stroke: 1.05pt + ink)
  circle((cx, cy + 0.85), radius: (rx, 0.38), fill: paper2, stroke: 1.05pt + ink)
  arc((cx + rx, cy - 0.85), start: 0deg, stop: -180deg, radius: (rx, 0.38), stroke: 1.05pt + ink)
  content((cx, 1.8), text(font: f-display, size: 21pt)[Travel memory])
  content((cx, 0.98), text(size: 12pt, fill: muted)[places / sources / preferences])
  // Store and recall are distinct directions, with labels outside the paths.
  v-arrow((12.5, 5.1), (12.5, 3.1), c: teal)
  v-arrow((14.5, 3.1), (14.5, 5.1), c: teal)
  content((11.55, 4.1), text(font: f-display, style: "italic", size: 14pt, fill: teal.darken(15%))[store])
  content((15.5, 4.1), text(font: f-display, style: "italic", size: 14pt, fill: teal.darken(15%))[recall])
  content((23.6, 4.65), text(font: f-display, style: "italic", size: 15pt, fill: cobalt.darken(15%))[members review])
})

// Two optional group routes, with riso people rather than a row of stock icons.
#let v-preference-routes() = cetz.canvas(length: 1cm, {
  import cetz.draw: *
  rect((0, -1.0), (26.0, 7.2), stroke: none, fill: none)
  let person(p, initial, col, caption) = {
    let (x, y) = p
    rnode((x, y + 0.4), col, r: 0.32, off: 0.09)
    bezier((x - 0.6, y - 0.62), (x + 0.6, y - 0.62), (x - 0.6, y + 0.12), (x + 0.6, y + 0.12), stroke: 1.2pt + ink)
    content((x, y + 0.4), text(font: f-mono, size: 9pt, initial))
    content((x, y - 1.15), text(size: 14pt, fill: col.darken(15%), caption))
  }
  person((1.0, 5.3), [M], cobalt, [Mia])
  person((3.3, 5.3), [A], cobalt, [Alex])
  person((1.0, 1.7), [B], tomato, [Ben])
  person((3.3, 1.7), [Y], tomato, [Yuki])
  content((2.1, 6.9), text(font: f-display, style: "italic", size: 18pt, fill: cobalt)[“We love museums.”])
  content((2.1, -0.55), text(font: f-display, style: "italic", size: 17pt, fill: tomato)[“Let's try local food.”])
  v-arrow((4.25, 4.9), (7.5, 3.65), c: cobalt)
  v-arrow((4.25, 1.95), (7.5, 3.2), c: tomato)
  v-node((10.1, 3.4), text(font: f-display, size: 19pt, weight: 600)[Preferences], marigold, w: 4.7)
  content((10.1, 5.0), text(size: 14pt, fill: muted)[interests / budget / pace])
  content((10.1, 1.65), text(font: f-display, style: "italic", size: 16pt, fill: teal.darken(15%))[members confirm or correct])
  v-arrow((12.7, 3.8), (15.8, 5.1), c: cobalt)
  v-arrow((12.7, 3.0), (15.8, 1.6), c: tomato)
  v-node((19.0, 5.2), text(font: f-display, size: 18pt, weight: 600)[Museum group], cobalt, w: 5.5, h: 1.2)
  v-node((19.0, 1.5), text(font: f-display, size: 18pt, weight: 600)[Food group], tomato, w: 5.5, h: 1.2)
  line((22.1, 5.2), (23.7, 5.2), (23.7, 1.5), (22.1, 1.5), stroke: (paint: teal, thickness: 1.2pt))
  rnode((23.7, 3.35), teal, r: 0.25)
  content((23.7, 6.55), text(font: f-display, style: "italic", size: 15pt, fill: teal.darken(15%))[meet for dinner])
})

#let v-replanning() = box(width: 27cm, height: 8.7cm, {
  v-put(0.45cm, 1.4cm, 5.7cm, v-map(w: 5.7cm, h: 6.1cm, c: faint, market: false, title: [CURRENT PLAN]))
  v-put(7.6cm, 0cm, 11.8cm, v-chat-slip(11.8cm, [Can we add a food market?], c: plum, who: "Ben"))
  v-put(0cm, 0cm, 27cm, cetz.canvas(length: 1cm, {
    import cetz.draw: *
    rect((0, 0), (27, 8.6), stroke: none, fill: none)
    // All flows share the same center line. The message aligns with the AI.
    v-arrow((13.5, 6.9), (13.5, 5.15), c: plum)
    v-node((13.5, 4.2), text(font: f-display, size: 18pt, weight: 600)[AI proposes an update], plum, w: 8.7)
    v-arrow((6.55, 4.2), (8.9, 4.2), c: faint)
    v-arrow((18.1, 4.2), (20.45, 4.2), c: plum)
  }))
  v-put(20.85cm, 1.4cm, 5.7cm, v-map(w: 5.7cm, h: 6.1cm, c: teal, title: [PROPOSED UPDATE]))
  v-put(7.0cm, 5.65cm, 13cm, align(center, text(size: 17pt)[“Add the market after lunch.”]))
  v-put(6.5cm, 6.65cm, 14cm, align(center, text(size: 18pt)[Members #hl(c: teal)[accept], edit, or reject.]))
  v-put(6.25cm, 7.65cm, 14.5cm, align(center,
    text(font: f-display, style: "italic", size: 15pt, fill: muted)[Only accepted changes enter the shared plan.]))
  v-put(21.0cm, 7.95cm, 5.4cm, align(center, stamp(c: plum, angle: 0deg, size: 8pt)[for review]))
})
