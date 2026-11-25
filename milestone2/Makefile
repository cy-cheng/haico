TYPST ?= typst
BUILD_DIR ?= build

.PHONY: all report presentation working help

all: report presentation

report:
	mkdir -p "$(BUILD_DIR)"
	$(TYPST) compile --font-path slides_presentation/fonts slides_report.typ "$(BUILD_DIR)/GROUP_4_MILESTONE_2.pdf"

presentation:
	mkdir -p "$(BUILD_DIR)"
	$(TYPST) compile --font-path slides_presentation/fonts slides_presentation/slides_presentation.typ "$(BUILD_DIR)/slides_presentation.pdf"

working:
	mkdir -p "$(BUILD_DIR)"
	$(TYPST) compile --font-path fonts slides.typ "$(BUILD_DIR)/slides.pdf"

help:
	@printf '%s\n' 'make               Rebuild report and frozen presentation into build/' 'make report        Rebuild the 47-page report into build/' 'make presentation  Rebuild the 38-page frozen presentation into build/' 'make working       Build the editable working deck into build/' 'Saved PDFs in the milestone2 directory are never overwritten.'
