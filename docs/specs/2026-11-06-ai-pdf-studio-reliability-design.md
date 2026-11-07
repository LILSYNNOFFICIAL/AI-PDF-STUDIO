# AI PDF Studio Reliability and Content-Preservation Design

Date: 2026-11-06
Repository: LILSYNNOFFICIAL/AI-PDF-STUDIO
Target branch: work/ai-pdf-studio-reliability

## Goal

Repair the published application and make AI-assisted editing operate on the actual document model while preserving user-supplied content exactly unless the user explicitly requests a content change.

## Current-state evidence

- `index.html` points to `/src/main.tsx`, a Vite source entry, rather than a built asset. The project is currently served at the GitHub Pages project path `/AI-PDF-STUDIO/`.
- `vite.config.ts` has no project-site `base` setting.
- `package.json` has Vite build, TypeScript lint, and node test scripts; the app depends on Express and Google GenAI.
- `server.ts` routes common words such as merge, split, reorganize, format, create, agreement, and generate to deterministic local helpers before AI. Its generic Gemini request includes only the instruction, document title, and section count, then asks Gemini for a concise operational summary. That response is stored as `changeSummary`; it does not edit the document.
- The client has a local fallback path, so a failed or unavailable API can silently result in deterministic template operations instead of actual AI document editing.
- `src/services/pdfGenerator.ts` uses fixed-height table rows and draws table cell content without wrapping. Several long text blocks are checked for page overflow as a whole, but are not split across pages. These behaviors can clip or overflow large content.

## Workstream A: Static frontend deployment

- Configure Vite's `base` for the repository project path, with a build-time override so preview or non-Pages hosting can use another base.
- Keep `index.html` as the Vite entry point; rely on Vite's production build to rewrite the module entry and asset URLs.
- Add a GitHub Actions Pages workflow that installs the lockfile-defined dependencies, runs type checks and tests, builds the frontend, uploads only `dist`, and deploys through the Pages artifact/deployment actions.
- Document the required GitHub Pages setting: Pages source must be GitHub Actions.
- Verify the built HTML and every generated asset URL resolve beneath `/AI-PDF-STUDIO/`.

## Workstream B: Express/Gemini backend deployment

- Retain Express and Google GenAI on a separate Node host. Render is the selected target for this design, subject to the user's account and service provisioning.
- Keep `GEMINI_API_KEY` exclusively in backend environment variables. Never place it in Vite-exposed variables or browser code.
- Add configurable frontend API origin and backend CORS allowlisting for the deployed Pages origin and local development.
- Add a health endpoint suitable for deployment checks and clear errors when the API is unavailable or unconfigured.
- Provide a Render deployment blueprint or exact service configuration, build/start commands, required environment variables, and a deployment guide. Do not claim the service is live until account-side provisioning and health checks succeed.
- GitHub Pages remains static and must not be expected to run Express routes.

## Workstream C: Actual AI document editing and source integrity

- Replace the summary-only Gemini request with a structured editing contract. The model must return validated operations or a complete structured document update, not a prose summary pretending an edit occurred.
- Pass the relevant document content to the model, not merely the title and section count. Apply a size-aware strategy: direct processing for bounded inputs and ordered, stable-ID chunk processing for large inputs.
- Preserve the original source separately from the editable presentation/model. Track source segment IDs and offsets so content can be mapped into sections without reauthoring it.
- Default behavior is formatting/structural editing only. No summarizing, paraphrasing, shortening, omission, or replacement unless the user explicitly requests a content transformation.
- Validate every proposed operation against a strict schema and the current document state. Apply operations deterministically, preserve untouched content, and reject unsupported or ambiguous actions rather than claiming success.
- Add content-integrity checks for source coverage, order, duplicate spans, missing spans, and preservation of exact text where no rewrite was authorized. Do not report a validation as passed unless it was actually executed.
- Remove misleading success claims from the client fallback. If the backend is unavailable, show an explicit error or offer only clearly labeled local deterministic operations.
- Return a short execution summary separately from the actual updated document.

## Workstream D: PDF rendering reliability

- Replace fixed table row heights with measured cell wrapping and dynamic row heights.
- Split long paragraphs and clauses across pages without clipping, while preserving text and order.
- Continue tables across pages, repeat table headers, and prevent borders/cell text from being drawn outside page bounds.
- Respect explicit page breaks and document margins; keep headers, footers, page numbering, and signature blocks within page bounds.
- Add regression tests for long paragraphs, long table cells, multi-page tables, page breaks, and large documents.

## Error handling and security

- Enforce request-size limits with explicit 413 responses and a documented large-document/chunking strategy.
- Validate request bodies and document shape at API boundaries.
- Restrict CORS to configured origins; do not use wildcard credentialed CORS.
- Never expose the Gemini key in client bundles, logs, or error messages.
- Treat partial AI output as incomplete. Do not mutate the live document until all chunks/operations validate and the integrity checks pass.
- Keep a copy of the pre-edit document for undo/rollback.

## Verification and acceptance criteria

1. A production Vite build succeeds and generated `index.html` references built assets under the configured Pages path, not `/src/main.tsx`.
2. The GitHub Actions workflow runs type checks, tests, build, and Pages deployment in that order; Pages artifact contains the built `dist` output.
3. The deployed site renders the React app at the project URL, with no missing JS/CSS assets or root-mount errors.
4. Backend health check succeeds on the deployed host, and the frontend can call it from the Pages origin.
5. A generic AI instruction demonstrably changes the document model and rendered document, not only `changeSummary`.
6. A preservation test using long input with unique markers at the beginning, middle, and end verifies all markers and exact source spans remain present and ordered after structural formatting.
7. An explicitly requested rewrite may alter only the targeted content; unrelated content remains unchanged.
8. Invalid, truncated, incomplete, or mismatched AI output is rejected without mutating the current document.
9. PDF regression tests verify long text and tables paginate without clipping or loss.
10. Tests, type checks, production build, and post-deployment smoke checks are recorded with actual outcomes. Any unavailable account-side deployment step is reported as blocked, not passed.

## Delivery sequence

1. Establish baseline tests and add failing regression tests for summary-only AI behavior, content preservation, API fallback honesty, and PDF overflow.
2. Implement the document operation contract, source-preserving pipeline, and integrity validation.
3. Repair PDF pagination and table layout with regression coverage.
4. Configure the static Pages build/deploy workflow and project base path.
5. Configure the Render backend service and frontend API origin; complete account-side provisioning only when credentials/access are available.
6. Run independent verification, inspect generated artifacts, and smoke-test the live frontend and backend.

## Scope boundaries

- Do not migrate away from React, Vite, Express, Google GenAI, or jsPDF unless a verified blocker requires it.
- Do not rewrite or summarize user document content by default.
- Do not fabricate deployment success or successful validation states.
- No unrelated UI redesign or feature expansion is included.
