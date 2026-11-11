# Universal AI Document Studio Upgrade Implementation Plan

> **For agentic workers:** Use the host's available task-by-task implementation workflow. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade AI PDF Studio into a polished, general-purpose AI-assisted agreement and document studio while preserving existing editor and PDF functionality.

**Architecture:** Retain the existing React/TypeScript document model, template catalogue, design system, PDF renderer, and server-side AI orchestration. Add locally bundled original artwork and user help, strengthen editable metadata and signature fields, expand document-level context actions, and make the menu responsive. All source changes remain on a feature branch until CI and the complete diff are reviewed.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS 4, jsPDF, Express, Gemini, Node test runner, GitHub Actions.

## Global Constraints

- Do not break existing document import/export, PDF rendering, undo/redo, template creation, or mobile workspace.
- Template content and visual theme remain independent.
- Only the LIL SYNN template may default its agreement type to Music Agreement. Other templates must leave the agreement type blank until the user supplies it.
- Every visible text field, including generated text and metadata, must be editable or removable.
- Signature/date/custom fields must use selected text when it is available, and offer field customization when it is not.
- Signature line lengths must be user-configurable without an arbitrary fixed preset ceiling; rendering may safely fit a line to the printable page width.
- Keep original assets local to the repository. No user download/upload steps and no runtime dependency on external artwork hosts.
- Preserve the established LIL SYNN near-black, hot-pink, silver/white, and gold palette.
- AI operations must inspect the document context, preserve unrelated content, validate results, and report failures without applying partial invalid state.
- Never merge unverified code. Run lint, tests, production build, Pages verification, inspect CI, and review the full PR diff before merging.

---

### Task 1: Local artwork system and professional template previews

**Files:**
- Create: `public/assets/templates/*.svg`
- Create: `src/services/templateArtwork.ts`
- Create: `src/services/templateArtwork.test.ts`
- Modify: `src/components/TemplateGalleryModal.tsx`
- Modify: `src/services/pdfGenerator.ts` when extending cover ornamentation

- [ ] Add original, locally bundled category artwork for music, business, real estate, creative, employment, legal, finance, technology, marketing, general, and LIL SYNN.
- [ ] Resolve asset URLs through the Vite base path so GitHub Pages subpath deployments work.
- [ ] Replace the generic text-only template card mock cover with the category artwork, preserving readable title and theme overlay.
- [ ] Extend PDF cover ornamentation with vector-drawn motifs so artwork and page decoration remain crisp and do not rasterize document text.
- [ ] Add tests for category coverage and base-path URL construction.
- [ ] Verify the SVG files are well-formed and that every mapped file exists in the tree.

### Task 2: Editable agreement metadata and signature fields

**Files:**
- Modify: `src/types/document.ts`
- Modify: `src/components/DocumentMetadataModal.tsx`
- Modify: `src/components/InsertObjectModal.tsx`
- Modify: `src/services/signatureBlocks.ts`
- Modify: `src/services/signatureBlocks.test.ts`
- Modify: `src/services/pdfGenerator.ts`
- Modify: `src/App.tsx`

- [ ] Add an optional free-form agreement type to the document model and editable metadata interface.
- [ ] Leave the agreement type empty for general templates. Set Music Agreement only for the LIL SYNN template identity.
- [ ] Add focused tests for custom labels, selected line lengths, date/signature field type detection, and no-selection defaults.
- [ ] Add per-field kind and line-length controls, and preserve field values/line lengths when a block is inserted.
- [ ] Render text/date/signature blank lines according to each field's configured character length, capped only by available printable width.
- [ ] Verify PDF generation retains existing typed and drawn signature behavior.

### Task 3: Help, menu overflow, and document-space context actions

**Files:**
- Create: `src/components/HelpGuideModal.tsx`
- Modify: `src/components/MenuBar.tsx`
- Modify: `src/components/DocumentContextMenu.tsx`
- Modify: `src/services/contextMenu.ts`
- Modify: `src/components/VisualEditor.tsx`
- Modify: `src/App.tsx`

- [ ] Add searchable beginner help topics for creating documents, AI prompting, editing, signatures, design, export, review, and shortcuts.
- [ ] Add a keyboard- and touch-accessible More menu that contains secondary commands and Help.
- [ ] Prevent the menu row from pushing beyond the viewport; preserve access to all items on narrow screens.
- [ ] Expand blank-page context actions for adding text/sections, page breaks, page layout, signatures, and document design.
- [ ] Keep context menus viewport-constrained and ensure actions are available only when their callbacks exist.
- [ ] Add tests for new context target action availability and keyboard accessibility where practical.

### Task 4: AI orchestration, editable text coverage, documentation, and release verification

**Files:**
- Modify: `src/orchestrator/aiDocumentEditor.ts`
- Modify: `src/orchestrator/orchestrator.ts`
- Modify: `server.ts`
- Modify: relevant tests under `src/orchestrator/`
- Create: `README.md`
- Create: `docs/help/user-guide.md`
- Modify: `package.json` if new tests are added

- [ ] Inventory available document operations and expose a capability description to the AI orchestration prompt.
- [ ] Add intent examples and preservation constraints for natural-language requests, including ambiguous instructions and follow-up edits.
- [ ] Verify generated document changes against the current document structure before applying them.
- [ ] Ensure generated section text, clause headings/content, document title, page furniture, and agreement metadata remain user-editable.
- [ ] Document setup, architecture, configuration, security, common workflows, shortcuts, troubleshooting, testing, and deployment.
- [ ] Run `npm run lint`, `npm test`, `npm run build`, and `npm run verify:pages` in a connected build environment.
- [ ] Inspect GitHub Actions for the feature branch and verify the entire PR diff.
- [ ] Merge to `main` only after all required checks succeed and the merge head SHA matches the verified PR head.

## Release acceptance

- Every template category has a local artwork asset and the gallery displays it using the configured deployment base path.
- LIL SYNN retains its brand identity; non-LIL SYNN templates do not silently assume a music agreement type.
- Custom signature fields can be labeled, typed, removed, and sized independently; selected labels are parsed into editable fields.
- Help is reachable from the menu and explains the common workflows in beginner-friendly language.
- Menu actions remain accessible at desktop and mobile widths.
- Blank document whitespace exposes document-level context actions.
- AI orchestration uses a current capability inventory, validates results, and preserves unrelated source content.
- Lint, tests, build, Pages verification, and CI checks pass before merge.
