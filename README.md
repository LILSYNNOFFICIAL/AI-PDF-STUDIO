# AI PDF Studio

**AI-assisted PDF agreement and document creation, editing, design, and export.**

AI PDF Studio helps people create professional agreements and general-purpose documents from templates, natural-language instructions, or imported source material. It combines a visual document editor, an AI document-control assistant, reusable design themes, structured signature fields, and PDF export in one workspace.

> Templates are editable drafting starting points, not legal advice. Review all terms, facts, and jurisdiction-specific requirements before signing or relying on a document.

## What it does

- **Create from templates:** Browse a searchable catalog of 100 structured templates across music and entertainment, business, real estate, creative work, employment, corporate/legal, finance, technology, marketing, and general use.
- **Name the agreement:** Standard templates let you enter the agreement type or document title before creation. The LIL SYNN legacy template keeps its own branded agreement identity.
- **Create from a prompt:** Start a new document by describing the document you need and the information it should contain.
- **Edit visually:** Update document titles, cover details, section headings, body text, clauses, tables, charts, images, and signature blocks in the editor.
- **Ask the AI to make changes:** Describe the outcome in ordinary language. The assistant maps the request to document operations such as rewriting, formatting, adding or removing content, moving sections, adjusting page setup, and changing visual design.
- **Choose a visual theme:** Keep document content separate from visual presentation. Apply a theme without replacing the document's wording or structure. Modern Graphic covers use restrained vector geometry that is rendered in both the editor and exported PDF; LIL SYNN retains its exact brand palette with the updated graphic cover treatment.
- **Insert signing fields:** Select labeled text such as `Date: ____`, `Name: ____`, or custom `Label: ____` lines to populate a signature block, or insert a blank block and customize its labels and values.
- **Export and review:** Preview and export PDF, print, inspect document quality, and work with structured document data.

## Quick start

1. Open AI PDF Studio.
2. Choose **Templates** to browse the catalog, or create a blank document / start from an AI prompt.
3. Select a template and enter the agreement type or title.
4. Choose a visual theme and create the document.
5. Replace bracketed placeholders with the actual parties, dates, amounts, scope, rights, and other deal-specific information.
6. Use the editor to revise any wording or layout. Right-click a document object or blank document canvas for contextual actions. Use the **More ›** menu for secondary utilities such as metadata, the clause library, watermarks, readability, multi-document tools, source integrity, outline visibility, and the AI panel.
7. Open the AI assistant and describe the result you want, for example:
   - "Make the headings more modern and increase the whitespace."
   - "Move the payment terms directly after scope."
   - "Add a signature and date area after the final clause."
   - "Remove the unused optional schedule."
   - "Change the page to landscape and keep the tables readable."
8. Review the changes, run the quality audit, preview the PDF, and export when ready.

## Templates and agreement types

The template catalog contains 100 editable template definitions in 10 categories. A template provides document-specific structure and starter wording. A design theme provides colors, typography, cover treatment, page furniture, section appearance, tables, and signature styling.

These are deliberately separate: changing a theme should not silently rewrite the agreement.

For standard templates, the agreement type / document title field can be customized at creation. If left unchanged, the template's title is used. Music-category templates are not automatically classified as the special LIL SYNN music agreement type.

## Signature and date fields

The signature insertion tool supports:
- Selecting existing labeled text to parse field names and any entered values.
- Default blank fields for Date, Name, Extra field 1, Extra field 2, and Signature when no text is selected.
- Renaming field labels, editing values, adding fields, and removing fields before insertion.
- Printable blank signature lines, typed signatures, and drawn signatures.

A field line can be as long as the user needs. The label is the text before the colon; the value is the text after it. Underscores and blank line markers are treated as empty values.

## AI document assistant

The AI assistant is designed to execute document edits rather than merely explain how to perform them. It receives the document structure and available editing operations, interprets natural-language intent, and returns structured changes for validation and application.

Examples of ordinary-language requests:
- "Make this less wordy" -> concise rewrite of the targeted text.
- "Put the signatures at the end" -> move the signature block to the requested location.
- "Get rid of the second clause" -> remove the identified clause.
- "Make this look more premium" -> apply visual design tokens while preserving wording.
- "Turn this into a two-column table" -> create or restructure a table when the required source data is present.

The assistant should ask for clarification only when the target or requested outcome cannot be resolved safely from the document context. Destructive edits should be explicit. Review AI-generated legal or commercial wording before use.

## Editing and context menus

Right-click supported objects to access actions relevant to that object. Right-clicking the document canvas exposes document-level actions, including section insertion, image insertion, signature/date insertion, page-break control, design settings, page size, orientation, page background, cover visibility, and page numbering.

Use the command palette (Ctrl/Cmd+K) to search available editor commands. The **Help** button opens the built-in searchable Help Center. Undo and redo are available for document changes.

## Design themes

Themes control the visual system independently from template content. The design system supports typography, colors, page backgrounds, cover-page treatments, section appearance, tables, signatures, headers, footers, and page furniture. The LIL SYNN branded design retains its defined black, hot-pink, white, silver, and gold palette.

A professional-looking PDF still depends on readable contrast, sensible margins, appropriate page size, and complete content. Always inspect the PDF preview before distribution.

## Quality and document integrity

AI PDF Studio includes document validation and integrity-oriented workflows. Use the quality audit and preview to check structure, formatting, pagination, and references. Imported source material may include integrity metadata; avoid replacing source wording unless the edit is intentional.

## Development

### Requirements

- Node.js compatible with the versions used in CI
- npm

### Install and run

```bash
npm install
npm run dev
```

### Verification

```bash
npm test
npm run lint
npm run build
npm run verify:pages
```

- `npm test` runs the Node test suite through `tsx`.
- `npm run lint` runs the TypeScript compiler with no emit.
- `npm run build` creates the production Vite build.
- `npm run verify:pages` checks the GitHub Pages build artifact.

### Architecture overview

- `src/types/document.ts`: shared document and design model.
- `src/services/templateCatalog.ts`: template definitions, search, preferences, and fresh document builders.
- `src/services/documentDesign.ts`: design presets, normalization, and theme application.
- `src/components/TemplateGalleryModal.tsx`: template discovery and creation UI.
- `src/components/VisualEditor.tsx`: visual document editing, object controls, command palette, and context menus.
- `src/components/InsertObjectModal.tsx`: table, chart, image, and signature insertion.
- `src/orchestrator/aiDocumentEditor.ts`: AI prompt construction, structured edits, patch validation, and execution.
- `src/services/pdfGenerator.ts`: PDF generation.
- `src/App.tsx`: application state and workflow integration.

## Deployment

The project is configured for GitHub Pages and an API service. Deployment workflows and runtime configuration are maintained in the repository. A successful build does not by itself prove that the live site or API is available; check the relevant workflow and service health before announcing a deployment.

## Legal and safety note

AI PDF Studio is a document preparation tool. It does not provide legal representation, determine enforceability, guarantee compliance, or replace review by a qualified professional. Template wording must be adapted to the transaction, parties, facts, and applicable law. Do not enter secrets or sensitive personal information unless you understand the data handling and deployment configuration of the instance you are using.


## Bundled template artwork

The template gallery uses original, locally bundled SVG artwork in `public/assets/templates/`. The category set includes music and entertainment, business, real estate, creative work, employment, corporate/legal, finance, technology, marketing, and general-purpose documents, plus a dedicated LIL SYNN visual. These assets are first-party repository files, so the gallery does not depend on third-party image hosts or require users to upload artwork. Asset paths are resolved through the Vite base path for GitHub Pages subpath deployments.

## Signature and custom-field sizing

The signature insertion workflow can read selected labeled text such as `Date: ________` and `Name: __________` into editable fields. When no text is selected, the insertion panel supplies neutral Date, Name, Extra field, and Signature rows. Each field can be renamed, changed between Text, Date, and Signature, removed, and assigned its own approximate underline length. The PDF renderer fits long lines to the available printable width rather than imposing a fixed character-count ceiling.

## Built-in Help Center

Open **More → Help & Getting Started** for in-app instructions covering document creation, AI prompting, text and section editing, signature/date fields, visual themes, PDF preview/export, review responsibilities, and keyboard shortcuts. A standalone guide is maintained at `docs/help/user-guide.md`.
