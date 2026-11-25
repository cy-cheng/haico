// Report: unchanged main presentation, followed by one topic-organized appendix.
// Build a review copy without overwriting the saved PDFs: make report
#import "slides_presentation/theme.typ": *
#import "slides_presentation/visuals.typ": *
#import "report_sources/backups.typ": *
#import "report_sources/technical_appendix.typ": *
#show: setup

#include "report_sources/main.typ"

#divider("A", [report supplement], [Report \ #em(teal)[Appendix]],
  [Detailed interaction flows and proposed technical design], teal, v-section-art(2))

// Query destination labels so page numbers stay correct after reordering.
#let toc-row(title, destination) = context {
  let target = query(destination).first()
  let n = counter(page).at(target.location()).first()
  link(destination, block(width: 100%, above: 0pt, below: 0pt,
    grid(columns: (1fr, 0.75cm), column-gutter: 0.15cm, align: left + horizon,
      text(size: 15pt, title),
      align(right, text(font: f-mono, size: 12pt, str(n))),
    )))
}
#let toc-group(letter, title, items, c) = stack(dir: ttb, spacing: 0.26cm,
  link(items.first().at(1), text(font: f-display, size: 19pt, weight: 600, fill: c.darken(15%))[#letter. #title]),
  stack(dir: ttb, spacing: 0.18cm, ..items.map(((title, destination)) => toc-row(title, destination))),
)

#slide(title: [Appendix contents], kicker-text: [Report appendix · Contents], accent: teal)[
  #a-body[
    #v-put(0cm, 0.02cm, 27cm, a-subtitle[Interaction detail, technical design, evaluation and supporting sources])
    #v-put(0.1cm, 1.1cm, 12.45cm, stack(dir: ttb, spacing: 0.8cm,
      toc-group([A], [Human–AI interaction], (
        ([Invitation and readable scope], <app-a1>),
        ([Discussion to draft itinerary], <app-a2>),
        ([Inspect sources and correct context], <app-a3>),
        ([Subgroups and transport], <app-a4>),
        ([Review proposed changes], <app-a5>),
        ([Save and stop collection], <app-a6>),
      ), cobalt),
      toc-group([B], [Architecture, data and RAG], (
        ([End-to-end system architecture], <app-b1>),
        ([Media extraction and memory], <app-b2>),
        ([Retrieval and context building], <app-b3>),
      ), teal),
    ))
    #v-put(14.05cm, 1.1cm, 12.55cm, stack(dir: ttb, spacing: 0.5cm,
      toc-group([C], [Bot, models and tools], (
        ([Discord integration], <app-c1>),
        ([Four AI responsibilities], <app-c2>),
        ([Models, tools and cost assumptions], <app-c3>),
      ), marigold),
      toc-group([D], [Planning, validation and control], (
        ([Tool-grounded planning], <app-d1>),
        ([Prompts and code checks], <app-d2>),
        ([Approval, versions and collection], <app-d3>),
      ), tomato),
      toc-group([E], [Limitations and evaluation], (
        ([Current limitations and next steps], <app-e1>),
        ([Evaluation plan], <app-e2>),
      ), plum),
      toc-group([F], [References], (
        ([Technical sources and PoC status], <app-f1>),
      ), teal),
    ))
    #v-put(0.1cm, 10.65cm, 26.6cm, a-refline("Page numbers refer to this report. Select a title or page number to jump to that page."))
  ]
]

// A. Original detailed interaction screens, in end-to-end task order.
#b-activation() <app-a1>
#b-draft() <app-a2>
#b-review() <app-a3>
#b-groups() <app-a4>
#b-approval() <app-a5>
#b-finish() <app-a6>

// B. Proposed architecture and the data it plans with.
#t-architecture() <app-b1>
#t-memory() <app-b2>
#t-retrieval() <app-b3>

// C. Platform integration, AI responsibilities, models and tools.
#b-discord() <app-c1>
#b-ai-jobs() <app-c2>
#b-models() <app-c3>

// D. Grounded planning, deterministic checks, approval and version state.
#t-planner() <app-d1>
#b-steering() <app-d2>
#t-versions() <app-d3>

// E. Current gaps followed by the evaluation plan.
#b-limitations() <app-e1>
#t-evaluation() <app-e2>

// F. Primary technical references and prototype status.
#t-references() <app-f1>

#set document(title: "Waymark — Milestone 2 Report and Topic-Organized Appendix", author: "HAICO project team")
