// ───────────────────────────────────────────────────────────────
//  "Riso paper" theme — cream stock, serif type, misregistered ink
// ───────────────────────────────────────────────────────────────
#import "@preview/cetz:0.4.2"

// ── palette ────────────────────────────────────────────────────
#let ink      = rgb("#23201b")
#let paper    = rgb("#f6f0e3")
#let paper2   = rgb("#ece3cf")
#let muted    = rgb("#7a7164")
#let faint    = rgb("#b9ae9b")

#let tomato   = rgb("#e4573d")
#let marigold = rgb("#efa12a")
#let teal     = rgb("#14988a")
#let cobalt   = rgb("#3a62d6")
#let plum     = rgb("#8d4fb0")
#let pink     = rgb("#ee86a9")

// one colour per act / dimension
#let c-setup = teal
#let dim0    = marigold
#let dim1    = cobalt
#let dim2    = tomato
#let c-wrap  = plum
#let c-check = rgb("#3b3631")   // act IV: my reproduction

#let tint(c, p: 72%) = c.lighten(p)

// ── type ───────────────────────────────────────────────────────
#let f-display = ("Fraunces", "GenRyuMin2 TC R")
#let f-body    = ("Newsreader 16pt", "GenRyuMin2 TC R")
#let f-mono    = ("IBM Plex Mono", "JuliaMono")

// Type hierarchy shared by every content page.
#let slide-title-size = 25pt
#let key-statement-size = 24pt
#let takeaway-size = 22pt

#let talk-short = [HAICO / Milestone 2]

// the five questions are presenter-only scaffolding; flip to true while rehearsing
#let show-tracker = false
// slide numbers are on for cross-reference during review
#let show-folio = true

// ── paper grain: deterministic speckle tiling ─────────────────
#let grain = {
  let s = 20261020
  let items = ()
  for i in range(110) {
    s = calc.rem(s * 1103515245 + 12345, 2147483648)
    let x = calc.rem(calc.quo(s, 4096), 1600) / 10
    s = calc.rem(s * 1103515245 + 12345, 2147483648)
    let y = calc.rem(calc.quo(s, 4096), 1600) / 10
    s = calc.rem(s * 1103515245 + 12345, 2147483648)
    let r = 0.18 + calc.rem(calc.quo(s, 4096), 45) / 100
    s = calc.rem(s * 1103515245 + 12345, 2147483648)
    let a = 78 + calc.rem(calc.quo(s, 4096), 16)
    items.push(place(dx: x * 1pt, dy: y * 1pt,
      circle(radius: r * 1pt, fill: rgb("#6b4f2c").transparentize(a * 1%))))
  }
  tiling(size: (160pt, 160pt), items.join())
}

#let halftone(c, step: 5pt, r: 1.35pt) = tiling(size: (step, step),
  place(dx: step / 2 - r, dy: step / 2 - r, circle(radius: r, fill: c)))

// ── inline helpers ─────────────────────────────────────────────
// highlighter stroke behind text
#let hl(c: marigold, body) = highlight(fill: c.transparentize(55%),
  top-edge: 0.62em, bottom-edge: -0.14em, extent: 0.06em, body)

// coloured italic display emphasis
#let em(c, body) = text(font: f-display, style: "italic", fill: c, weight: 600, body)

#let kicker(c: muted, body) = text(font: f-mono, size: 10.5pt, tracking: 1.6pt,
  fill: c, weight: "medium", upper(body))

#let mono(body) = text(font: f-mono, size: 0.82em, body)

// riso tag: ink-outlined label with a misregistered colour plate behind it
#let tag(c: marigold, size: 13pt, fill: paper, body) = box({
  let pad = (x: 7pt, y: 4.5pt)
  place(dx: 2.6pt, dy: 2.6pt,
    box(fill: c, radius: 4pt, inset: pad, text(size: size, fill: c, body)))
  box(fill: fill, stroke: 1pt + ink, radius: 4pt, inset: pad, text(size: size, body))
})

// rubber stamp
#let stamp(c: tomato, angle: -8deg, size: 13pt, body) = rotate(angle, reflow: false,
  box(stroke: 2.2pt + c.transparentize(10%), radius: 4pt, inset: (x: 9pt, y: 5pt),
    box(stroke: 0.7pt + c.transparentize(25%), radius: 2pt, inset: (x: 6pt, y: 3pt),
      text(font: f-mono, weight: "medium", size: size, fill: c.transparentize(5%),
        tracking: 2pt, upper(body)))))

// sticky note
#let sticky(c: marigold, angle: -2deg, width: 100%, body) = rotate(angle, reflow: false,
  block(width: width, fill: tint(c, p: 62%), inset: (x: 14pt, top: 13pt, bottom: 15pt),
    radius: (bottom-right: 10pt, rest: 2pt),
    stroke: (bottom: 2.5pt + tint(c, p: 30%), right: 1.5pt + tint(c, p: 45%)),
    body))

// paper card
#let card(fill: paper2, stroke: none, inset: 14pt, width: 100%, height: auto, body) = block(
  width: width, height: height, fill: fill, stroke: stroke, radius: 6pt, inset: inset, body)

// marginal note in italic with a little hook
#let aside(c: muted, body) = text(font: f-display, style: "italic", size: 14pt, fill: c,
  weight: 400)[↳ #body]

// a clipping taped onto the page (for figures lifted from papers)
#let taped(angle: -0.8deg, caption: none, body) = box({
  let tape = rect(width: 2.4cm, height: 0.62cm, fill: marigold.lighten(55%).transparentize(30%))
  rotate(angle, reflow: false, block(fill: white, inset: 10pt, stroke: 0.5pt + faint, {
    body
    if caption != none {
      v(-2pt)
      align(right, text(font: f-display, style: "italic", size: 11pt, fill: muted, caption))
    }
  }))
  place(top + left, dx: 0.9cm, dy: -9pt, rotate(-11deg, tape))
  place(top + right, dx: -0.9cm, dy: -9pt, rotate(9deg, tape))
})

// big riso numeral (or any display text): halftone plate + ink outline
#let riso-text(c, size: 200pt, dx: 7pt, dy: 7pt, weight: 900, body) = box({
  place(dx: dx, dy: dy, text(font: f-display, weight: weight, size: size,
    fill: halftone(c), body))
  text(font: f-display, weight: weight, size: size,
    fill: c.transparentize(78%), stroke: 1.6pt + ink, body)
})

// ── cetz helpers ───────────────────────────────────────────────
#let rnode(p, c, r: 0.26, off: 0.07, w: 1.1pt, name: none) = {
  import cetz.draw: *
  let (x, y) = p
  circle((x + off, y - off), radius: r, fill: c, stroke: none)
  circle((x, y), radius: r, fill: paper.transparentize(100%), stroke: w + ink, name: name)
}
#let rface(pts, c, off: 0.07, alpha: 35%) = {
  import cetz.draw: *
  line(..pts.map(((x, y)) => (x + off, y - off)), close: true,
    fill: c.transparentize(alpha), stroke: none)
}
#let redge(a, b, w: 1.3pt, c: ink, dash: none) = {
  import cetz.draw: *
  line(a, b, stroke: (paint: c, thickness: w, dash: dash, cap: "round"))
}
#let elabel(p, body, size: 10.5pt) = {
  import cetz.draw: *
  content(p, box(fill: paper, inset: 1.5pt,
    text(font: f-display, style: "italic", size: size, fill: muted, body)))
}

// ── five-questions tracker ─────────────────────────────────────
#let tracker(q, accent) = {
  if q == none or not show-tracker { return none }
  let cur = if type(q) == int { (q,) } else { q }
  let lo = calc.min(..cur)
  let dot(i) = {
    let (f, s, t) = if i in cur { (accent, 1pt + ink, white) }
      else if i < lo { (ink, none, paper) }
      else { (paper.transparentize(100%), 0.8pt + faint, faint) }
    box(width: 15pt, height: 15pt, radius: 50%, fill: f, stroke: s,
      align(center + horizon, text(font: f-mono, size: 8pt, weight: "medium", fill: t, str(i))))
  }
  box(stack(dir: ltr, spacing: 4pt,
    box(height: 15pt, align(horizon, text(font: f-mono, size: 8pt, fill: muted, tracking: 1pt)[5 Q#h(3pt)])),
    ..range(1, 6).map(dot)))
}

// ── page furniture ─────────────────────────────────────────────
#let ribbon(c) = polygon(fill: c, (0pt, 0pt), (13pt, 0pt), (13pt, 34pt), (6.5pt, 27pt), (0pt, 34pt))

#let folio() = context {
  if not show-folio { return none }
  let n = counter(page).get().first()
  text(font: f-display, style: "italic", size: 12pt, fill: muted)[#n]
}

#let setup(body) = {
  set page(paper: "presentation-16-9", margin: 0pt, fill: paper,
    background: rect(width: 100%, height: 100%, fill: grain, stroke: none))
  set text(font: f-body, size: 18pt, fill: ink, lang: "en")
  set par(leading: 0.62em, justify: false)
  show math.equation: set text(font: "New Computer Modern Math")
  set list(marker: text(fill: muted, sym.bullet), indent: 2pt, body-indent: 8pt, spacing: 0.75em)
  set enum(indent: 2pt, body-indent: 8pt, spacing: 0.75em)
  show strong: set text(weight: 600)
  body
}

#let slide(title: none, kicker-text: none, accent: teal, q: none, body) = {
  pagebreak(weak: true)
  place(top + left, dx: 1.3cm, ribbon(accent))
  if kicker-text != none {
    place(top + left, dx: 2.05cm, dy: 0.62cm, kicker(c: accent.darken(10%), kicker-text))
  }
  place(top + right, dx: -1.2cm, dy: 0.5cm, tracker(q, accent))
  place(bottom + left, dx: 1.3cm, dy: -0.55cm,
    text(font: f-display, style: "italic", size: 11pt, fill: faint, talk-short))
  place(bottom + right, dx: -1.2cm, dy: -0.5cm, folio())
  block(width: 100%, height: 100%,
    inset: (left: 1.3cm, right: 1.3cm,
      top: if title == none { 1.45cm } else { 1.9cm }, bottom: 1.15cm), {
    if title != none {
      text(font: f-display, size: slide-title-size, weight: 600, tracking: -0.3pt, title)
      v(0.32cm)
    }
    body
  })
}

#let divider(num, label, title, teaser, accent, picture) = {
  pagebreak(weak: true)
  place(top + left, dx: 1.3cm, ribbon(accent))
  place(bottom + right, dx: -1.2cm, dy: -0.5cm, folio())
  place(left + horizon, dx: 1.0cm, dy: -0.4cm, riso-text(accent, size: 290pt, num))
  // Fixed anchors keep both chapter pages aligned regardless of text or artwork.
  place(top + left, dx: 10.6cm, dy: 2.25cm,
    kicker(c: accent.darken(10%), label))
  place(top + left, dx: 10.6cm, dy: 4.2cm, block(width: 15.5cm,
    par(leading: 14pt, text(font: f-display, size: 46pt, weight: 600, tracking: -0.6pt, title))))
  place(top + left, dx: 10.6cm, dy: 9.95cm, block(width: 15.5cm,
    text(font: f-display, style: "italic", size: 19pt, fill: muted, teaser)))
  place(top + left, dx: 10.6cm, dy: 11.85cm, picture)
}
