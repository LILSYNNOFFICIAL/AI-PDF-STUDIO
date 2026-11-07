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
