# Premium Document System Design

## Product outcome

Replace the dated template and formatting experience in AI PDF Studio with a premium, flexible document system. Templates define document content and structure; design themes define visual presentation. Users can combine any compatible template with any design theme without changing the document's legal or business wording.

## Approved visual direction

The default direction is Midnight Executive: restrained near-black cover, refined serif display typography paired with a clean sans-serif body, fine metallic-gold framing, generous spacing, and warm-white interior pages. Built-in themes will include Art Deco, Dark Luxury, Modern Legal, Editorial, Corporate, Bauhaus-inspired, Minimalist, Financial, Technology, and other distinct visual directions.

The LIL SYNN theme retains its existing palette exactly:
- Black/page surface: #050505
- Deep black/section surface: #080808
- Hot pink accent and headings: #ff4fa3
- White body text: #f5f5f5
- Silver secondary/muted tones: #d1d5db and #c5c5c5
- Gold frame/border: #d99a32

The LIL SYNN redesign uses a disciplined hierarchy, considered whitespace, premium title treatment, restrained gold rules, polished section cards, and consistent tables, headers, footers, and signature blocks. It must not introduce additional palette colors that change the brand identity.

## Reference-informed visual principles

The Magnific dark-contract reference could not be fetched by the text browser, so it is treated as the user's named visual direction rather than as an inspected implementation reference. The AI Formatter rental gallery exposes 30 template variants and highlights Art Deco, Bauhaus, corporate, formal, glassmorphism, luxury, and midnight-luxury directions. The implementation should adopt the visual variety and layout principles, not copy third-party templates or wording.

## System architecture

1. **Template catalog:** structured, searchable content definitions with stable IDs, categories, descriptions, tags, document type, and focused provisions. A template builder produces a fresh editable DocumentModel. Template definitions do not own color, typography, page background, or decorative theme choices.
2. **Design theme system:** DocumentDesign holds reusable global presentation settings, including cover-page treatment, section layout, page furniture, typography, colors, tables, signatures, and decorative borders. Applying a theme changes presentation only.
3. **Template gallery:** a first-class gallery provides search, category filters, favorites, recent templates, a detail view, and a design-theme selector before creation. Existing templates remain available and receive the redesigned visual default.
4. **Context menus:** reusable, keyboard-accessible menus are anchored to the clicked object and expose actions specific to text, sections, clauses, images, tables, and signature blocks.
5. **Rendering:** editor and PDF renderer share design settings. Any new visible design option must be supported in both where it is applicable. Legacy documents receive safe default design values through existing normalization.

## Initial template inventory

The first catalog release adds exactly 100 new editable templates:
- Music & Entertainment: 20
- Business & Commercial: 12
- Real Estate & Rentals: 12
- Creative & Freelance: 10
- Employment & HR: 10
- Corporate & Legal: 10
- Finance & Investment: 8
- Technology & Data: 8
- Marketing & Partnerships: 5
- Personal & General: 5

Each template will have a meaningful title, category, use-case description, search tags, and content tailored to its purpose. The builder will produce clear party/subject, scope, duties, money/rights, term/change, and execution structures as relevant to the template. All variable facts stay as conspicuous editable placeholders. Template copy is a starting point, not a representation that every clause is valid in every jurisdiction.

## Document Design Studio 2.0

The studio gains a larger workspace, visual preview, organized controls, and direct edit/apply flow. Controls include:
- Theme presets, saved themes, duplicate/rename/delete, and import/export JSON.
- Cover-page enablement, cover style, background, title/detail colors, border, brand label, and logo placeholder.
- Page background, page size/orientation and margins.
- Body and heading font pairing, font size, weight, letter spacing, line height, paragraph spacing, and alignment.
- Section heading treatment, dividers, section spacing and padding.
- Header/footer text, rules, colors, and page-number settings.
- Table header/body fills, typography, gridlines, row striping and cell spacing.
- Signature appearance and per-section/per-table overrides.
- Contrast warnings and a live representative preview.

A setting is not exposed as functional unless it is persisted and applied to the editor and PDF rendering.

## Context menu behavior

Menus open on right-click or the keyboard context-menu key, are positioned within the viewport, close on Escape/outside click, and expose focusable actions. Text actions include cut/copy/paste/select-all/format and Insert Signature. Section actions include add/duplicate/move/page-break/design/delete. Clause actions include add/duplicate/delete and copy. Image actions include alignment, resize, caption/alt-text entry and delete. Table actions include row/column operations and delete. Signature actions include edit/duplicate/method/appearance/delete. Destructive actions execute through existing document update/history mechanisms.

## Safety, compatibility, and failure handling

- Preserve existing document wording, section order, source integrity and per-object styling when applying themes.
- Do not overwrite user custom colors or saved themes when adding new presets.
- Missing new design properties in old documents fall back to defaults.
- Search, favorites and recent lists degrade gracefully when localStorage is blocked or malformed.
- Prevent duplicate template IDs and avoid mutating shared template seeds between uses.
- Prevent context menus from opening off-screen and avoid intercepting browser context menus outside the document workspace.
- PDF layout must paginate covers, avoid clipping and keep text selectable.
- Legal forms are editable starting points and identify jurisdiction-specific review needs; no universal enforceability claims.

## Success criteria

- Exactly 100 additional catalog items are available and each produces a fresh, independently editable multi-section document.
- All existing template entry points use the redesigned theme system.
- LIL SYNN preserves the exact supplied palette and renders professionally in the editor and PDF.
- A user can apply any design theme to any compatible template without changing its content.
- The Design Studio exposes the new settings and previews their effect before apply.
- Context menus work for the supported object types with mouse and keyboard.
- Existing documents open without migration errors or content loss.
- Tests cover catalog count/uniqueness, document independence, theme content-preservation, preset integrity, cover rendering, context actions, and regression behavior.
