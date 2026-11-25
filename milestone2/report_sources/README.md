# Report sources

The report entry point is [`../slides_report.typ`](../slides_report.typ). It defines the appendix order and generates its clickable contents page.

| File | Purpose |
|---|---|
| `main.typ` | Presentation pages 1–27, preserved in the report |
| `backups.typ` | Original backup material, organized by topic with report clarifications |
| `technical_appendix.typ` | Additional architecture, retrieval, validation and evaluation pages |
| `appendix_visuals.typ` | Editable diagrams used by the technical appendix |

The report reuses the fonts, theme, drawings, cover section and assets in [`../slides_presentation/`](../slides_presentation/). Keep that frozen snapshot intact. Edit report-specific content here, then run `make report` from the milestone2 directory. Rebuilds go to `build/` and do not overwrite the saved PDFs.
