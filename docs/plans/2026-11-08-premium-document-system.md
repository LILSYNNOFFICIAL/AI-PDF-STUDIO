# Premium Document System Implementation Plan

> **For agentic workers:** Use the host's available task-by-task implementation workflow. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a premium document system with an expanded theme designer, 100 additional structured templates, and object-aware right-click menus.

**Architecture:** Keep templates as independent content definitions and DocumentDesign as an independent visual theme. A gallery composes the two at creation time; the editor and PDF renderer consume the same normalized design model. Context menus call the editor's existing mutation and history pathways rather than editing the DOM directly.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS 4, jsPDF, Node test runner via tsx, GitHub Actions, GitHub Pages.

## Global Constraints

- Preserve document content and source integrity while applying visual themes.
- Retain existing LIL SYNN colors exactly: #050505, #080808, #ff4fa3, #f5f5f5, #d1d5db, #c5c5c5, #d99a32.
- Separate template content from design theme.
- Existing templates remain accessible and receive redesigned visual defaults.
- Exactly 100 new editable templates, across the approved category counts.
- All visible design controls must persist and affect editor and PDF output.
- Context menus must be object-aware, keyboard accessible, viewport constrained, and history-safe.
- Preserve old-document compatibility and current mobile layout behavior.
- Legal template text remains an editable starting point and must not claim universal jurisdiction compliance.
- Merge each milestone only after the full relevant CI and deployment checks succeed.

---

## Stage 1: Premium Design Foundation and LIL SYNN Redesign

### Task 1: Extend design schema and professional theme presets

**Files:**
- Modify: `src/types/document.ts`
- Modify: `src/services/documentDesign.ts`
- Test: `src/services/documentDesign.test.ts`

**Interfaces:**
- Consumes: `DocumentDesign`, `ColorFill`, `BorderConfig`, `normalizeDocumentDesign`, `applyDocumentPreset`
- Produces: typed `coverPage` and `layoutDefaults` design properties plus stable premium presets.

- [x] **Step 1: Add failing tests** for the exact LIL SYNN color values, professional LIL SYNN cover/layout defaults, Midnight Executive and Art Deco preset existence, and legacy design normalization of newly added properties.
- [x] **Step 2: Verify red** with `bun test src/services/documentDesign.test.ts`; expected: missing property or preset assertions fail, not import/setup errors.
- [x] **Step 3: Implement** optional backwards-compatible `coverPage` and `layoutDefaults` properties. Add Midnight Executive, Art Deco, Dark Luxury, Bauhaus, Glassmorphism, Modern Legal, Editorial, Corporate, Japandi and other distinct presets. Upgrade LIL SYNN with identical existing palette values, professional title/body font hierarchy, premium cover defaults, consistent gold rules and tuned section/table/signature styling. Extend validation and merge defaults for legacy documents.
- [x] **Step 4: Verify green** with the identical focused test command.
- [x] **Step 5: Run** `bun test src/services/documentDesign.test.ts` and `bun run lint`.
- [x] **Step 6: Commit** the independently passing design-model deliverable.

### Task 2: Render premium cover pages and layout settings in editor/PDF

**Files:**
- Modify: `src/components/VisualEditor.tsx`
- Modify: `src/services/pdfGenerator.ts`
- Modify: `src/types/document.ts`
- Test: `src/services/pdfGenerator.test.ts` and `src/services/pdfGenerator.imageSizing.test.ts`

**Interfaces:**
- Consumes: normalized `DocumentDesign.coverPage` and `layoutDefaults`.
- Produces: consistent editable cover-page and section treatment in the editor and generated PDF.

- [x] **Step 1: Add failing PDF/editor helper tests** for enabled/disabled cover, page count, background/frame/title content, and pagination safety with long titles.
- [x] **Step 2: Verify red** using the focused PDF test command; expected: cover content/structure assertions fail.
- [x] **Step 3: Implement** a cover-page renderer using vector shapes/text in jsPDF and a matching HTML cover in VisualEditor. Honor cover style, background, title/detail colors, border, eyebrow/brand line and logo placeholder. Add professional section heading/divider styling where the layout options request it. Keep cover and interior backgrounds distinct when configured.
- [x] **Step 4: Verify green** with focused tests.
- [x] **Step 5: Run** `bun test src/services/pdfGenerator.test.ts src/services/pdfGenerator.imageSizing.test.ts`, `bun run lint`, and `bun run build`.
- [x] **Step 6: Commit** the verified cover/layout renderer.

### Task 3: Rebuild Document Design Studio 2.0

**Files:**
- Modify: `src/components/DocumentDesignModal.tsx`
- Modify: `src/App.tsx`
- Modify: `src/services/documentDesign.ts`
- Test: `src/services/documentDesign.test.ts`

**Interfaces:**
- Consumes: `DocumentDesign`, `DocumentDesignModalProps`, existing section/table apply callbacks and saved-theme helpers.
- Produces: larger live-preview design workspace with Cover, Layout, Typography, Colors, Sections, Tables, Signatures and Saved Themes controls.

- [x] **Step 1: Add failing tests** for theme JSON import/export validation, safe malformed theme input, preset application preserving document content, and saved-theme duplication.
- [x] **Step 2: Verify red** using the focused design tests.
- [x] **Step 3: Implement** organized panels, live preview, cover/layout controls, typography controls, page settings, heading/section styling, header/footer settings, theme duplicate/rename/delete, and import/export JSON. Ensure apply remains explicit and preview edits do not mutate the document before Apply.
- [x] **Step 4: Verify green** using the identical command.
- [x] **Step 5: Run** `bun test src/services/documentDesign.test.ts`, `bun run lint`, and `bun run build`.
- [x] **Step 6: Commit** the verified design studio.

**Stage 1 acceptance:** Existing documents retain content; LIL SYNN values match exact palette; cover and theme previews match PDF output; all new options save and reload; all legacy design tests pass.

---

## Stage 2: Template Gallery and 100 New Templates

### Task 4: Add an independently tested 100-item template catalog

**Files:**
- Create: `src/services/templateCatalog.ts`
- Test: `src/services/templateCatalog.test.ts`
- Modify: `src/types/document.ts` only if the catalog requires a typed template descriptor.

**Interfaces:**
- Produces: `DocumentTemplateDefinition`, `DOCUMENT_TEMPLATE_CATALOG`, `getTemplateById(id)`, `buildTemplateDocument(id)`.
- Consumes: `DocumentModel`, existing section/clause types and `applyDocumentPreset` only at the gallery composition layer.

- [x] **Step 1: Add failing tests** asserting exactly 100 unique stable IDs, approved category counts, non-empty summaries/tags/sections, fresh IDs on every build, no shared nested mutable arrays, and template-specific content for representative templates in every category.
- [x] **Step 2: Verify red** with `bun test src/services/templateCatalog.test.ts`.
- [x] **Step 3: Implement** the 100 templates using structured per-template definitions and focused category-specific provision blueprints. Every built document has a tailored title, editable placeholder data, multiple named sections and substantive clauses that reflect its purpose. Include an editable notice that state/local law and transaction facts may require review. Reuse content builders, never share mutable DocumentModel instances.
- [x] **Step 4: Verify green** with the identical test command.
- [x] **Step 5: Run** `bun test src/services/templateCatalog.test.ts` and `bun run lint`.
- [x] **Step 6: Commit** the catalog.

### Task 5: Build and wire the Template Gallery

**Files:**
- Create: `src/components/TemplateGalleryModal.tsx`
- Modify: `src/components/MenuBar.tsx`
- Modify: `src/App.tsx`
- Modify: `src/services/sampleDocuments.ts` only for compatibility helpers if required.
- Test: `src/services/templateCatalog.test.ts` and new focused gallery utility tests if filtering/persistence is extracted.

**Interfaces:**
- Consumes: `DOCUMENT_TEMPLATE_CATALOG`, `DOCUMENT_DESIGN_PRESETS`, `buildTemplateDocument`, `applyDocumentPreset`.
- Produces: Template Gallery open callback and selection callback `(templateId, themeId) => void).

- [x] **Step 1: Add failing tests** for category counts, search across title/description/tags, category filter, favorite/recent persistence, and selecting a theme that changes style but not document content.
- [x] **Step 2: Verify red** with the catalog/gallery utility tests.
- [x] **Step 3: Implement** a responsive visual gallery with search, categories, favorite/recent state, template details, preview, and theme selector. Add a first-class Templates menu entry. Route new and legacy templates through the redesign theme defaults; preserve the old seven IDs and menu access while making the gallery the primary entry point.
- [x] **Step 4: Verify green** with focused tests.
- [x] **Step 5a:** Run the full automated test suite, TypeScript check, production build and Pages artifact verification in GitHub Actions.
- [ ] **Step 5b:** Complete live browser QA for the gallery, responsive layout, and end-to-end editor interactions.
- [x] **Step 6: Commit** the verified gallery.

**Stage 2 acceptance:** Exactly 100 new catalog entries appear. Search/category/filter/favorite/recent work. Each template opens with a chosen theme, can be customized afterward, and remains editable. Existing template IDs still load.

---

## Stage 3: Object-Aware Right-Click Context Menus

### Task 6: Add reusable context menu and wire document objects

**Files:**
- Create: `src/components/DocumentContextMenu.tsx`
- Modify: `src/components/VisualEditor.tsx`
- Modify: `src/App.tsx` only for cross-component commands, if needed.
- Test: new `src/components/DocumentContextMenu.test.tsx` or focused menu action utility tests.

**Interfaces:**
- Produces: `ContextMenuState`, `ContextMenuAction`, reusable context-menu component.
- Consumes: existing editor callbacks for duplicate/delete/update section and existing table/image/signature mutations.

- [x] **Step 1: Add failing tests** for menu viewport clamping, outside click, Escape close, focusable keyboard actions, and correct action sets per target type.
- [x] **Step 2: Verify red** with the focused context-menu tests.
- [x] **Step 3: Implement** object-aware menus for selected text, sections, clauses, images, tables and signature blocks. Add text cut/copy/paste/select-all/format/Insert Signature; section add/duplicate/move/page-break/design/delete; clause add/duplicate/delete/copy; image align/resize/caption/alt-text/delete; table row/column/delete/style actions; signature edit/duplicate/method/design/delete. Use current editor mutation callbacks and history so Undo works.
- [x] **Step 4: Verify green** with the identical command.
- [x] **Step 5a:** Run the full automated test suite, TypeScript check, production build and Pages artifact verification in GitHub Actions.
- [ ] **Step 5b:** Complete live browser QA for the gallery, responsive layout, and end-to-end editor interactions.
- [x] **Step 6: Commit** the verified context menu.

**Stage 3 acceptance:** Supported object types show the correct menus, actions work and preserve history, menu placement stays within the viewport, Escape/outside-click closes, and native browser context menus remain available outside the editor.

---

## Additional Implementation Hardening

- [x] Make cover author label and cover date editable in the editor and PDF output.
- [x] Make left and right running headers editable in the editor and Document Design preview; render both in exported PDFs.
- [x] Make signatory name/title/company/date labels editable and preserve custom labels in both PDF signature layouts.
- [x] Add arbitrary signature-field duplication, ordering, removal and custom line lengths.
- [x] Repair undo/redo to store before/after snapshots and coalesce manual editing sessions.
- [x] Prevent stale AI responses from overwriting edits made while orchestration is running.
- [x] Scope AI version rollback to the active document ID as well as version number.
- [x] Keep the More menu pinned outside the scrolling primary menu strip.
- [x] Add keyboard navigation that skips disabled context-menu items and wraps safely.
- [x] Apply the Music Agreement default only to music templates using the LIL SYNN theme; preserve freeform titles for all other templates.

**Implementation merge record:** PRs #39–#46 are merged into main. Main commit at this status update: ae1764e1dd67021587c4f7743fdaa2c9ed4ed44e. Main CI and GitHub Pages deployment passed.

**Live QA so far:** A fresh browser session loaded the deployed app, opened the 100-template gallery, selected Recording Artist Agreement with the LIL SYNN theme, verified the default title was “Music Agreement”, and created the document. The live backend health endpoint returned `status: ok` and `geminiConfigured: true`. The Source of Truth modal appeared on fresh load and was dismissed.

**Live QA still pending:** Editing the cover metadata and running header, verifying the More menu at narrow widths, blank-canvas context-menu interaction, AI edit/validation, undo/redo in the browser, and exported PDF content.

## Final Verification and Release

- Run full repository suite: `bun test`.
- Run type-check: `bun run lint`.
- Run production build: `bun run build`.
- Run Pages artifact verification: `bun run verify:pages`.
- Inspect each PR head SHA, changed files and all required workflow jobs before merge.
- Merge each milestone only when tests, lint, build and required deployment checks are green.
- [x] After the latest merge, verify main CI and GitHub Pages deployment.
- [x] Run an initial live smoke test of app load, gallery selection, LIL SYNN theme and Music Agreement default.
- [ ] Finish live browser tests for PDF cover rendering, editable metadata, context menus, AI edits, undo/redo and responsive More-menu access.
