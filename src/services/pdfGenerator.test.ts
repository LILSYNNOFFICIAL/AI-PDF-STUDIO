import test from 'node:test';
import assert from 'node:assert/strict';
import { buildDocumentFromPrompt } from '../orchestrator/orchestrator';
import { generatePdfDocument } from './pdfGenerator';

function outputText(pdf: ReturnType<typeof generatePdfDocument>): string {
  return pdf.output();
}

test('long paragraphs paginate line by line and retain beginning and ending text', () => {
  const doc = buildDocumentFromPrompt('Agreement').updatedDoc;
  doc.sections = [{
    ...doc.sections[0],
    content: [
      'PARAGRAPH-START-UNIQUE',
      ...Array.from({ length: 420 }, (_, index) => `Long preserved source sentence number ${index + 1} with exact wording and punctuation.`),
      'PARAGRAPH-END-UNIQUE'
    ].join(' ')
  }];
  const pdf = generatePdfDocument(doc);
  const text = outputText(pdf);

  assert.ok(pdf.getNumberOfPages() > 3, `Expected multi-page flow, received ${pdf.getNumberOfPages()} pages`);
  assert.ok(text.includes('PARAGRAPH-START-UNIQUE'));
  assert.ok(text.includes('PARAGRAPH-END-UNIQUE'));
});

test('long table cells wrap and table headers repeat across pages', () => {
  const doc = buildDocumentFromPrompt('Agreement').updatedDoc;
  doc.sections = [{
    ...doc.sections[0],
    tables: [{
      id: 'table-regression',
      title: 'PAGINATED TABLE',
      headers: [
        { id: 'h1', content: 'PARTY' },
        { id: 'h2', content: 'DETAILS' }
      ],
      rows: Array.from({ length: 28 }, (_, index) => [
        { id: `r${index}-c1`, content: `ROW-${index + 1}` },
        {
          id: `r${index}-c2`,
          content: `TABLE-CELL-START-${index + 1} ${'Preserve this long table cell wording across wrapped lines. '.repeat(9)} TABLE-CELL-END-${index + 1}`
        }
      ])
    }]
  }];
  const pdf = generatePdfDocument(doc);
  const text = outputText(pdf);

  assert.ok(pdf.getNumberOfPages() > 1);
  assert.ok(text.includes('TABLE-CELL-START-1'));
  assert.ok(text.includes('TABLE-CELL-END-28'));
  const repeatedHeaders = text.match(/\(PARTY\)/g) || [];
  assert.ok(repeatedHeaders.length > 1, 'Expected the table header to repeat after a page break');
});


test('design presets, page gradients, section fills, borders and table overrides render to PDF', async () => {
  const {
    applyDocumentPreset,
    normalizeDocumentDesign
  } = await import('./documentDesign');
  const doc = normalizeDocumentDesign(buildDocumentFromPrompt('Agreement').updatedDoc);
  doc.pageConfig.headerText = 'DESIGN THEME HEADER';
  doc.pageConfig.footerText = 'DESIGN THEME FOOTER';
  doc.design = {
    ...doc.design!,
    page: {
      background: {
        type: 'linear-gradient',
        angle: 135,
        opacity: 0.18,
        stops: [
          { color: '#f8fafc', position: 0 },
          { color: '#dbeafe', position: 100 }
        ]
      },
      firstPageBackground: { type: 'solid', color: '#ffffff' }
    }
  };
  doc.sections = [{
    ...doc.sections[0],
    content: [
      'DESIGN-PDF-BEGIN',
      ...Array.from({ length: 180 }, (_, index) => 'Styled section paragraph ' + (index + 1) + ' must remain selectable and present after export.'),
      'DESIGN-PDF-END'
    ].join(' '),
    design: {
      background: {
        type: 'linear-gradient',
        angle: 90,
        stops: [
          { color: '#eff6ff', position: 0 },
          { color: '#ffffff', position: 100 }
        ]
      },
      bodyTextColor: '#243247',
      headingColor: '#123456',
      border: { style: 'dashed', color: '#2563eb', width: 1, sides: ['left', 'bottom'] },
      padding: 4
    },
    tables: [{
      id: 'design-table',
      title: 'DESIGN TABLE TITLE',
      caption: 'Design table caption',
      headers: [
        { id: 'h1', content: 'DESIGN COLUMN A' },
        { id: 'h2', content: 'DESIGN COLUMN B' }
      ],
      rows: [
        [{ id: 'r1c1', content: 'DESIGN CELL ONE', bg: '#ffeedd' }, { id: 'r1c2', content: 'DESIGN CELL TWO' }],
        [{ id: 'r2c1', content: 'DESIGN CELL THREE' }, { id: 'r2c2', content: 'DESIGN CELL FOUR' }]
      ],
      design: {
        headerBackground: { type: 'solid', color: '#102a43' },
        headerTextColor: '#ffffff',
        bodyBackground: { type: 'solid', color: '#f8fafc' },
        bodyTextColor: '#243247',
        alternateRowBackground: { type: 'solid', color: '#e0f2fe' },
        gridlineColor: '#64748b',
        gridlineWidth: 0.6,
        captionColor: '#475569'
      }
    }]
  }];
  doc.signatures = {
    id: 'design-signatures',
    title: 'DESIGN SIGNATURES',
    layout: 'stacked',
    onDedicatedPage: true,
    parties: [{
      id: 'design-signer',
      role: 'ARTIST',
      name: 'DESIGN SIGNER',
      title: 'Recording Artist',
      company: 'Example Music LLC',
      date: 'November 7, 2026',
      signaturePlaceholder: '/s/ DESIGN SIGNER'
    }]
  };
  const presetDesign = applyDocumentPreset(doc, 'technology-professional').design!;
  doc.design = {
    ...presetDesign,
    page: {
      ...presetDesign.page,
      background: {
        type: 'linear-gradient',
        angle: 135,
        opacity: 0.18,
        stops: [
          { color: '#f8fafc', position: 0 },
          { color: '#dbeafe', position: 100 }
        ]
      }
    }
  };

  const pdf = generatePdfDocument(doc);
  const output = outputText(pdf);

  assert.ok(pdf.getNumberOfPages() > 1, 'Styled document should paginate while retaining its background');
  for (const marker of [
    'DESIGN-PDF-BEGIN',
    'DESIGN-PDF-END',
    'DESIGN TABLE TITLE',
    'DESIGN COLUMN A',
    'DESIGN CELL FOUR',
    'DESIGN THEME HEADER',
    'DESIGN THEME FOOTER',
    'DESIGN SIGNATURES',
    'DESIGN SIGNER'
  ]) {
    assert.ok(output.includes(marker), 'Expected exported PDF to contain ' + marker);
  }
});

test('PDF export includes all text from the scrollable editor block in normal document flow', () => {
  const doc = buildDocumentFromPrompt('Agreement').updatedDoc;
  doc.sections = [{
    ...doc.sections[0],
    content: 'SECTION-INTRO-RETAINED',
    scrollableContent: [
      'SCROLLABLE-BLOCK-BEGIN',
      ...Array.from({ length: 80 }, (_, index) => `Reference line ${index + 1} remains present in the exported PDF.`),
      'SCROLLABLE-BLOCK-END'
    ].join('\\n')
  }];
  const pdf = generatePdfDocument(doc);
  const text = outputText(pdf);

  assert.ok(pdf.getNumberOfPages() > 1, 'Long scrollable source material should paginate in PDF output');
  assert.ok(text.includes('SECTION-INTRO-RETAINED'));
  assert.ok(text.includes('SCROLLABLE-BLOCK-BEGIN'));
  assert.ok(text.includes('Reference line 80 remains present'));
  assert.ok(text.includes('SCROLLABLE-BLOCK-END'));
});
