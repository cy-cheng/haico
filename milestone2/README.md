# Waymark — HAICO 2026 Milestone 2

Waymark helps friends turn travel ideas shared in an existing group chat into an itinerary they can review and revise together. This directory contains the English presentation, the expanded report, editable Typst sources and prototype visuals for Group 4.

The current PoC is a **clickable interface prototype** for Discord and a companion web app. AI extraction, a live Bot, map-service integration and shared backend state are proposed work.

## Deliverables

| File | Contents |
|---|---|
| [GROUP_4_MILESTONE_2.pdf](GROUP_4_MILESTONE_2.pdf) | 47-page report: presentation pages 1–27, an appendix divider and contents, then 18 supporting pages |
| [slides_presentation.pdf](slides_presentation.pdf) | Frozen 38-page presentation, including its original 11 backup slides |

The report appendix is organized into interaction, architecture and RAG, models and tools, planning controls, evaluation, and references. Its contents page links to the corresponding report pages.

[Open the clickable design](https://claude.ai/artifact/75jXxDxX1EwALYK2eui1Xs).

## Build

Use an installed [Typst](https://typst.app) compiler; the project has been checked with Typst 0.15.1. Fonts are bundled. The first build may need internet access to fetch the pinned CeTZ 0.4.2 package.

```sh
make                  # Report and frozen presentation
make report           # build/GROUP_4_MILESTONE_2.pdf
make presentation     # build/slides_presentation.pdf
make working          # build/slides.pdf, from the editable working deck
```

All rebuilds go into `build/`. **The two saved PDFs in this milestone directory are never overwritten by these commands.**

On macOS, double-click [`render.command`](render.command) to build and open the report. It uses an installed Typst compiler, or downloads the pinned official compiler after verifying its checksum. To choose another deck:

```sh
./render.command presentation
./render.command working
```

The downloaded compiler and render log stay local. If `make` is unavailable, compile the report directly:

```sh
mkdir -p build
typst compile --font-path slides_presentation/fonts slides_report.typ build/GROUP_4_MILESTONE_2.pdf
```

## Source layout

| Path | Purpose |
|---|---|
| `slides_report.typ` | Report entry point, appendix order and automatic contents page |
| [`report_sources/`](report_sources/) | Report main pages, appendix text and editable technical diagrams |
| [`slides_presentation/`](slides_presentation/) | Independent frozen snapshot of the presentation sources, assets and fonts |
| `slides.typ`, `front.typ` | Editable working presentation; `front.typ` contains the cover and sections 1–2 |
| `theme.typ`, `visuals.typ` | Theme and drawings for the working deck |
| `assets/`, `fonts/` | Working-deck visuals, screenshots and fonts |
| `tools/make_flow.py` | Generator for the English flow overview and three close-ups |
| [`docs/archive/`](docs/archive/) | Historical planning notes; page numbers and unresolved questions may be outdated |
| `build/` | Local rebuilds, excluded from Git |

Edit report-specific material in `report_sources/`. The report reuses supporting files from the frozen presentation so a third copy of its assets is unnecessary. Keep the frozen snapshot unchanged.

To update the working deck's flow diagrams, edit `tools/make_flow.py`, then run `python3 tools/make_flow.py assets`. This does not change the frozen snapshot or saved PDFs.

## Fonts and assets

- **Fonts:** Fraunces, Newsreader and IBM Plex Mono, under the SIL Open Font License; licence files are in `fonts/` and the frozen snapshot. The static Fraunces files use the family name `Fraunces` to match the theme.
- **Icons:** Lucide, under the ISC licence in `assets/icons/LICENSE`.
- **Screens:** `assets/screens/ui/` contains the Discord (`d-`) and web-app (`a-`) interface states. Older screenshots and flow fragments remain as source material.

VS Code's Tinymist configuration already points to the bundled working-deck fonts. When compiling manually, use the `--font-path` argument shown above to preserve the intended layout.
