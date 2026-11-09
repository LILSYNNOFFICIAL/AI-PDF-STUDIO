import test from 'node:test';
import assert from 'node:assert/strict';
import { createDefaultSignatureFields, parseSignatureFields } from './signatureBlocks';
import { buildDocumentFromPrompt } from '../orchestrator/orchestrator';
import { generatePdfDocument } from './pdfGenerator';

test('parses the requested bold-label signature text into editable fields', () => {
  const fields = parseSignatureFields([
    '**Legal name:** Jarred Gainer',
    '**Artist name:** LIL SYNN',
    '**Label:** SYNTIENT RECORDS',
    '**Signature:**',
    '__________________________________________________',
    '**Date:**'
  ].join('\n'));

  assert.deepEqual(fields.map(field => [field.label, field.value, field.kind]), [
    ['Legal name', 'Jarred Gainer', 'text'],
    ['Artist name', 'LIL SYNN', 'text'],
    ['Label', 'SYNTIENT RECORDS', 'text'],
    ['Signature', '', 'signature'],
    ['Date', '', 'date']
  ]);
});

test('parses plain labels and preserves custom fields', () => {
  const fields = parseSignatureFields('Legal name: Alex Example\nCapacity: Producer\nDate: 2026-11-08');
  assert.deepEqual(fields.map(field => [field.label, field.value, field.kind]), [
    ['Legal name', 'Alex Example', 'text'],
    ['Capacity', 'Producer', 'text'],
    ['Date', '2026-11-08', 'date']
  ]);
});

test('returns no fields for text that is not a labeled signature template', () => {
  assert.deepEqual(parseSignatureFields('Please sign below.\nThank you.'), []);
});

test('provides the five standard empty signature fields when no text is selected', () => {
  const fields = createDefaultSignatureFields();
  assert.deepEqual(fields.map(field => field.label), ['Legal name', 'Artist name', 'Label', 'Signature', 'Date']);
  assert.ok(fields.every(field => field.value === ''));
});

test('PDF places an inline signature panel between the surrounding section text', () => {
  const doc = buildDocumentFromPrompt('Signature block PDF placement').updatedDoc;
  const before = 'INLINE-SIGNATURE-BEFORE';
  const after = 'INLINE-SIGNATURE-AFTER';
  const signatureText = 'Jarred Gainer';
  const content = before + '\n' + after;
  doc.sections = [{
    ...doc.sections[0],
    content,
    signatureBlocks: [{
      id: 'signature-test-1',
      title: 'SIGNATURE DETAILS',
      position: before.length + 1,
      signatureMode: 'typed',
      signatureValue: 'Jarred Gainer',
      fields: [
        { id: 'legal', label: 'Legal name', kind: 'text', value: 'Jarred Gainer' },
        { id: 'signature', label: 'Signature', kind: 'signature', value: 'Jarred Gainer' },
        { id: 'date', label: 'Date', kind: 'date', value: '2026-11-08' }
      ]
    }]
  }];

  const pdf = generatePdfDocument(doc);
  const pages = (pdf as any).internal.pages as string[][];
  const allPages = pages.slice(1).map(page => page.join('')).join('');
  assert.ok(allPages.includes(before), 'Expected text before the signature block');
  assert.ok(allPages.includes(signatureText) || allPages.includes('Jarred Gainer'), 'Expected the signatory name in the exported PDF');
  assert.ok(allPages.includes(after), 'Expected text after the signature block');
  assert.ok(allPages.indexOf(before) < allPages.indexOf('Jarred Gainer'), 'Expected the block after the preceding text');
  assert.ok(allPages.indexOf('Jarred Gainer') < allPages.indexOf(after), 'Expected the block before the following text');
});
