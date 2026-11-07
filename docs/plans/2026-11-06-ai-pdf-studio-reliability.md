# AI PDF Studio Reliability Implementation Plan

> **For agentic workers:** Use the host's available task-by-task implementation workflow. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore a working published application and make AI document operations modify the real document model without silently summarizing or dropping supplied content.

**Architecture:** GitHub Pages will host the Vite-built React frontend at the repository subpath. The existing Express server will run as a separate Render web service, with Gemini credentials held only in backend environment variables. AI editing will use validated, bounded section operations and fail closed when content integrity cannot be demonstrated. The jsPDF renderer will measure and paginate text and table cells rather than drawing fixed-height rows.

**Tech Stack:** React 19, TypeScript, Vite 8, Express 4, Google GenAI SDK, jsPDF, Bun lockfile, GitHub Actions Pages deployment, Render web service.

## Global Constraints

- Preserve the existing React, Vite, Express, Google GenAI, and jsPDF architecture.
- Never summarize, condense, paraphrase, or omit supplied content unless the user explicitly requests a content transformation.
- Keep `GEMINI_API_KEY` on the backend only.
- GitHub Pages is static hosting and must not be treated as an Express runtime.
- Never report an operation as successful unless the document was actually changed and validations were executed.
- Do not mutate the live document if AI output is incomplete, malformed, references unknown section IDs, or fails preservation checks.
- Keep work on `work/ai-pdf-studio-reliability`; do not merge into `main` without separate user authorization.
- Use tests-first for behavior changes and record the observed failing and passing outcomes.
- The Render service can be configured in repository files, but account-side creation and secret entry require the user's Render access.

---

### Task 1: Reproducible static-site deployment

**Files:**
- Modify: `vite.config.ts`
- Create: `.github/workflows/deploy.yml`
- Create: `docs/deployment.md`
- Test: `scripts/verify-pages-build.mjs` (proposed)

**Interfaces:**
- Vite consumes `VITE_BASE_PATH`, defaulting to `/AI-PDF-STUDIO/` for the Pages project deployment.
- The build produces `dist/index.html` and bundled assets with URLs beneath the configured base.
- GitHub Actions uploads only `dist` using the Pages artifact action.

- [ ] **Step 1: Add a failing build-artifact check**

Create `scripts/verify-pages-build.mjs`. It reads `dist/index.html`, rejects a source reference to `/src/main.tsx`, and checks that script and stylesheet asset URLs begin with the configured base path. Run it before the build and confirm it fails because `dist` does not exist.

- [ ] **Step 2: Configure Vite's Pages base path**

Set Vite `base` from `process.env.VITE_BASE_PATH || '/AI-PDF-STUDIO/'`. Keep local server behavior unchanged. Run `bun run build` and the artifact check; expect built asset paths under `/AI-PDF-STUDIO/`.

- [ ] **Step 3: Add Pages workflow**

Create a workflow triggered by pushes to `main` and manual dispatch. Use checkout, Bun setup, `bun install --frozen-lockfile`, `bun run lint`, `bun test`, `bun run build`, Pages configure, upload `dist`, and deploy. Set least-privilege contents/pages/id-token permissions and serialize deployments.

- [ ] **Step 4: Document Pages settings and verify the artifact**

Document Settings → Pages → Source → GitHub Actions. Run the build and artifact check locally or in Actions. Expected: no source TSX URL in output, and every generated asset URL resolves under the project base path.

- [ ] **Step 5: Commit the independently passing deployment change**

Commit only the files in this task with message `fix: build and deploy Vite app to GitHub Pages`.

### Task 2: Backend hosting configuration and truthful API connectivity

**Files:**
- Modify: `server.ts`
- Modify: `src/App.tsx`
- Modify: `.env.example`
- Create: `render.yaml`
- Modify: `docs/deployment.md`
- Test: `src/server.test.ts` (proposed)

**Interfaces:**
- Frontend reads `VITE_API_BASE_URL`; an empty value means same-origin API for local Express development.
- Backend reads `ALLOWED_ORIGINS` as a comma-separated origin allowlist.
- `GET /api/health` returns service health and whether Gemini is configured, never the key.
- `POST /api/orchestrate` returns a non-2xx error for invalid requests or unavailable AI rather than a false success.

- [ ] **Step 1: Add failing API-origin and CORS tests**

Test origin allowlisting, disallowed-origin rejection, health response shape, and explicit missing-Gemini-key status. Run `bun test src/server.test.ts`; expected failures identify the missing configuration behavior.

- [ ] **Step 2: Add configurable CORS and API base**

Configure Express CORS using exact allowed origins and local development origins. Update frontend fetch URL construction to use `VITE_API_BASE_URL`. Remove silent deterministic fallback after network/API failure; display a clear connection error without changing the document.

- [ ] **Step 3: Add Render Blueprint and deployment guide**

Configure a Node web service using `bun install --frozen-lockfile` and `bun run start`, health check `/api/health`, `NODE_ENV=production`, and a dashboard-supplied `GEMINI_API_KEY` secret. Configure the Pages origin as an allowed origin. Document that the service is not live until created and its secret is entered in Render.

- [ ] **Step 4: Verify backend tests and start command**

Run `bun test src/server.test.ts`, `bun run lint`, and start the server with a test environment. Expected: health check responds on the configured `PORT`; a disallowed browser origin is not granted CORS access; no API key is returned.

- [ ] **Step 5: Commit the independently passing backend configuration**

Commit only the files in this task with message `feat: configure separate Render API service`.

### Task 3: Real AI document operations with preservation validation

**Files:**
- Create: `src/orchestrator/aiDocumentEditor.ts`
- Create: `src/orchestrator/aiDocumentEditor.test.ts`
- Modify: `server.ts`
- Modify: `src/App.tsx`
- Modify: `package.json` only if a test script adjustment is required

**Interfaces:**
- `executeAiDocumentEdit({ instruction, currentDoc, persona, aiClient })` returns `{ updatedDoc, summary, plan }` or throws a typed error without changing the input.
- AI response contract is JSON with a short `operationTitle`, `details`, and `sectionUpdates`; each update identifies an existing section by ID and may provide approved structural fields.
- The editor receives the complete relevant section data in bounded sequential chunks. Each chunk response must account for its supplied section IDs exactly once.
- Untouched text fields remain byte-for-byte unchanged unless the instruction explicitly requests rewriting those fields.

- [ ] **Step 1: Add failing tests for the current defect**

Add tests with a long document and unique markers at the beginning, middle, and end. Assert the model receives section content, changes are applied to `updatedDoc` rather than only `changeSummary`, untouched content remains exact, unknown IDs are rejected, and malformed or incomplete chunk output does not mutate the input. Run `bun test src/orchestrator/aiDocumentEditor.test.ts`; expected failure is missing editor module/behavior.

- [ ] **Step 2: Implement bounded AI edit contract**

Create a typed request/response contract and sequential chunk builder that never splits a single section payload. Use the configured Gemini model with JSON output. Prompt explicitly: execute the requested document operation; never return only a summary; do not rewrite text unless requested; return only updates for supplied section IDs. Validate parsed output and reject unknown, duplicate, or missing IDs.

- [ ] **Step 3: Apply operations transactionally**

Clone the document before applying changes. Allow section order/title, clause order, and style/page configuration updates through explicit fields. For text replacements, require explicit rewrite intent and validate the affected target IDs. Preserve all other fields. Recalculate numbering after structural edits. Return the complete updated document and a separate summary. If the model cannot satisfy the schema or content-preservation contract, return an error and keep the original document unchanged.

- [ ] **Step 4: Route orchestration through the AI editor**

Remove keyword-based template construction from the general AI path. Keep existing deterministic operations only where the user explicitly invokes a supported deterministic operation and the target is unambiguous. The generic AI route must call `executeAiDocumentEdit` with the current document content. Return truthful failed status when Gemini is missing or fails.

- [ ] **Step 5: Verify long-document preservation and existing tests**

Run `bun test src/orchestrator/aiDocumentEditor.test.ts`, `bun test`, and `bun run lint`. Expected: marker order and exact untouched content preserved; invalid outputs rejected; all existing orchestrator tests continue passing.

- [ ] **Step 6: Commit the independently passing AI-edit deliverable**

Commit only the files in this task with message `fix: apply validated AI edits to document model`.

### Task 4: Correct PDF pagination and table rendering

**Files:**
- Modify: `src/services/pdfGenerator.ts`
- Create: `src/services/pdfGenerator.test.ts`
- Modify: `package.json` only if a test script adjustment is required

**Interfaces:**
- `generatePdfDocument(doc)` continues returning a jsPDF instance.
- Internal text layout helpers measure wrapped lines and move individual lines/cells across pages without dropping source text.
- Table layout calculates each row height from the maximum wrapped cell height and repeats the header when a table continues on a new page.

- [ ] **Step 1: Add failing PDF regression tests**

Test a long paragraph spanning several pages, a table cell containing a long sentence, a multi-page table with repeated headers, and a document containing unique text markers at the beginning and end. Assert extracted PDF text includes all markers in order and the expected page count is greater than one. Run `bun test src/services/pdfGenerator.test.ts`; expected failures demonstrate missing pagination/wrapping behavior.

- [ ] **Step 2: Implement measured text flow**

Add a shared text-flow helper that wraps text to content width, checks available vertical space line-by-line, adds pages as needed, and returns the new cursor position. Use it for document title, section headings, section content, and clauses.

- [ ] **Step 3: Implement dynamic table layout**

Wrap each header and cell to its column width, compute row height from the tallest cell, draw borders around the measured row, and create a new page with a repeated header before continuing a row. Keep every cell within horizontal margins.

- [ ] **Step 4: Verify PDF output and full suite**

Run `bun test src/services/pdfGenerator.test.ts`, `bun test`, `bun run lint`, and `bun run build`. Expected: long text markers remain present and ordered, long tables span pages without fixed-height clipping, and the production bundle builds.

- [ ] **Step 5: Commit the independently passing PDF deliverable**

Commit only the files in this task with message `fix: paginate long PDF text and tables`.

## Deployment acceptance checks

After the branch is pushed, inspect the GitHub Actions run and Pages artifact. The live Pages URL must serve the React app, load JS/CSS beneath `/AI-PDF-STUDIO/`, and show no root-mount or missing-asset errors. Create the Render service from `render.yaml`, add `GEMINI_API_KEY` and `ALLOWED_ORIGINS` in the Render dashboard, and verify `/api/health` and a real AI edit before claiming end-to-end deployment success.

## Unresolved external access decisions

- Render workspace/service creation and secret entry require an authenticated Render account session. Repository changes can prepare the service, but cannot establish that account-side service without that access.
- GitHub Pages publishing source may require changing repository Settings → Pages to GitHub Actions if it is not already configured. The workflow itself cannot prove that repository setting until a deployment run succeeds.
