# AI PDF Studio

**An AI-assisted agreement and document studio for creating, editing, reviewing, and exporting professional PDFs.**

AI PDF Studio combines a structured document editor, a reusable template catalogue, visual design controls, signature fields, PDF generation, and a natural-language AI assistant. It is designed for agreements and general-purpose business documents rather than a single industry.

> Templates are editable starting points, not legal advice. Users should verify facts, negotiated terms, applicable law, and required professional review before signing or relying on a document.

## Product capabilities

### Document creation
- Searchable template gallery spanning music and entertainment, business, real estate, creative work, employment, corporate/legal, finance, technology, marketing, and general-purpose documents.
- Separate document structure from visual theme so the same template can be styled in multiple ways.
- Blank-document creation, source-text rendering, text/Markdown import, and JSON document-model import.
- Editable sections, clauses, headings, tables, charts, images, signature panels, and document metadata.

### Editing and document control
- Structured editing with section navigation, move/duplicate/delete, merge/split, numbering, and cross-reference tools.
- Formatting controls for typography, alignment, page size, orientation, margins, page furniture, and design presets.
- Find/replace, redaction workflow, clause library, readability metrics, document validation, watermark controls, and multi-document workspace.
- Context menus and command palette for faster access to document actions.
- Undo/redo history for document changes made through the editor and AI workflow.

### Signature and execution fields
- Insert printable, typed, or drawn signature blocks.
- Convert selected labeled text into editable fields, or define custom fields when no text is selected.
- Add, rename, change type, and remove fields. Field line lengths are configurable independently.
- PDF export renders the document content and structured signature panels.

### AI document assistant
- Natural-language document instructions are sent to the server-side orchestration endpoint with the current document context and selected AI persona.
- The orchestration service returns a proposed updated document, operation summary, and execution plan.
- The client validates the returned document shape before applying changes and preserves the existing source text/integrity metadata when the service omits them.
- Failed or invalid AI responses leave the current document unchanged.
- Keep the Gemini API key on the server. Never expose it through a `VITE_*` variable or commit it to the repository.

### Design and artwork
- Design presets cover corporate, legal, executive, editorial, finance, technology, creative, and LIL SYNN visual identities.
- Original category-specific SVG artwork is bundled under `public/assets/templates/`. These assets are local, reusable, and do not depend on third-party image hosts at runtime.
- The LIL SYNN palette is intentionally preserved: near-black surfaces, hot-pink accents, silver/white typography, and restrained gold details.
- PDF page text remains vector text for selection and search; cover and page decoration is rendered using PDF drawing primitives.

## Technology stack

- React 19 and TypeScript
- Vite and Tailwind CSS 4
- jsPDF for client-side PDF generation
- Express server for API orchestration
- Google Gemini through the official `@google/genai` SDK
- Node test runner through `tsx --test`
- GitHub Actions for CI and GitHub Pages deployment

## Repository layout

| Path | Responsibility |
|---|---|
| `src/App.tsx` | Application state, editor orchestration, modal wiring, document lifecycle |
| `src/components/` | Editor, menus, modals, template gallery, AI chat, and mobile workspace |
| `src/types/document.ts` | Canonical document and design model types |
| `src/services/templateCatalog.ts` | Template catalogue, search, document construction, gallery preferences |
| `src/services/documentDesign.ts` | Design presets, normalization, and visual resolution |
| `src/services/pdfGenerator.ts` | PDF layout, page breaks, text, tables, images, and signature rendering |
| `src/services/signatureBlocks.ts` | Signature field defaults and selected-text parsing |
| `src/orchestrator/` | Structured document operations and AI document editing |
| `server.ts` | Express API and server-side AI integration |
| `public/assets/templates/` | Original bundled category artwork |
| `docs/` | Product design, implementation, deployment, and usage documentation |

## Requirements

- Node.js 20 or later (use the version supported by the repository CI workflow).
- npm or Bun. The repository includes `bun.lock`; CI commands use the package scripts in `package.json`.
- A Gemini API key for server-side AI assistance. Editing and local PDF generation can be explored without configuring AI, but orchestration requests require the backend and key.

## Local development

1. Clone the repository:

   ```bash
   git clone https://github.com/LILSYNNOFFICIAL/AI-PDF-STUDIO.git
   cd AI-PDF-STUDIO
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a local environment file:

   ```bash
   cp .env.example .env
   ```

4. Configure the server-side `GEMINI_API_KEY` in `.env`. Do not prefix this secret with `VITE_`.

5. Start the app and API server:

   ```bash
   npm run dev
   ```

The Vite client is served through the Express development server. If you run Vite independently, configure `VITE_API_BASE_URL` to point to the API server.

## Environment variables

| Variable | Used by | Purpose |
|---|---|---|
| `GEMINI_API_KEY` | Server only | Gemini API credential. Keep secret. |
| `GEMINI_MODEL` | Server only | Model identifier used by the orchestration service. |
| `NODE_ENV` | Server | Runtime environment. |
| `PORT` | Server | HTTP server port. |
| `ALLOWED_ORIGINS` | Server | Comma-separated CORS allowlist. |
| `VITE_API_BASE_URL` | Client | Optional API origin override. Empty uses same-origin locally and the configured production API on GitHub Pages. |
| `VITE_BASE_PATH` | Build | Optional deployment base path. |

See `.env.example` and `docs/deployment.md` for deployment configuration. Never commit populated secrets.

## Common workflows

### Create a document
1. Open **Templates** and search by document name, category, or keyword.
2. Select a template to inspect its included sections and clauses.
3. Choose a visual theme independently of the template content.
4. Create the document, then replace every placeholder with accurate information.

### Ask the AI assistant
Use ordinary language. Examples:
- "Turn this into a concise consulting services agreement. Keep the payment terms unchanged."
- "Add a termination-for-convenience clause after the default section."
- "Make the document look like a restrained modern legal agreement. Do not rewrite the wording."
- "Add signature, printed name, and date fields for both parties."
- "Find every reference to the old company name and replace it with the new name."

Review the execution summary after each AI change. Do not assume an AI-generated legal term is correct merely because it is well formatted.

### Add signature fields
1. Select existing labeled text if you want the selection parsed into fields.
2. Choose **Insert → Signature**.
3. If nothing is selected, rename, add, remove, or change the field types in the customization panel.
4. Adjust line lengths and choose printable, typed, or drawn signature mode.
5. Inspect the PDF preview before exporting.

### Export a PDF
1. Open PDF Preview.
2. Inspect page count, line wrapping, tables, images, signature panels, and page numbering.
3. Correct any layout or content issues in the editor.
4. Export or print the final PDF.

## Keyboard shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl/Cmd + Z` | Undo |
| `Ctrl/Cmd + Shift + Z` or `Ctrl + Y` | Redo |
| `Ctrl/Cmd + F` | Find |
| `Ctrl/Cmd + H` | Find and replace |
| `Ctrl/Cmd + P` | PDF preview / print workflow |
| `Ctrl/Cmd + S` | Export document model JSON |
| `Ctrl/Cmd + B` | Toggle bold |
| `Ctrl/Cmd + I` | Toggle italic |
| `Ctrl/Cmd + U` | Toggle underline |
| `Ctrl/Cmd + K` | Open command palette |
| `Esc` | Close the active modal/menu |

## Testing and verification

Run the repository checks before submitting changes:

```bash
npm run lint
npm test
npm run build
npm run verify:pages
```

The test suite covers document operations, AI editing, CORS behavior, text import, design normalization, image sizing, PDF generation, signature blocks, template catalogue behavior, context menus, and command search. CI is the authoritative check for the branch and deployment workflow.

## Deployment

- GitHub Pages hosts the static client.
- The Express API is deployed separately and configured through server-side environment variables.
- Set the production API origin in `VITE_API_BASE_URL` only when it differs from the default production API URL.
- Set `ALLOWED_ORIGINS` to the exact client origins that may call the API.
- Verify both the Pages build and the API health endpoint after deployment.

See [Deployment Guide](docs/deployment.md).

## Security and privacy notes

- API credentials belong only in server environment variables.
- Imported files and document text may contain confidential information. Do not submit sensitive material to an external AI service unless you are authorized to do so.
- Redaction should be verified in the exported PDF. Hiding text visually is not equivalent to securely removing underlying content.
- Review generated agreements for jurisdiction, enforceability, regulated-industry, employment, consumer, privacy, and tax requirements.
- Treat external artwork and URLs as untrusted inputs. Prefer bundled assets for repeatable output.

## Contributing

1. Create a feature branch from `main`.
2. Add a focused regression test before changing behavior.
3. Run lint, tests, build, and Pages verification.
4. Inspect the complete diff, including generated assets and lockfile changes.
5. Open a pull request with behavior, test evidence, and known limitations.

## License

No license grant is implied by repository visibility. Check the repository's license file or contact the repository owner before redistributing the application or its assets.
