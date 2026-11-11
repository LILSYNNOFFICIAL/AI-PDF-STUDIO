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

test('selected underline lengths are retained independently for each field', () => {
  const fields = parseSignatureFields('Date: ____________________\nName: ____________\nExtra: ____');
  assert.deepEqual(fields.map(field => field.lineLength), [20, 12, 4]);
  assert.ok(fields.every(field => field.value === ''));
});

test('provides neutral editable Date, Name and Extra fields when no text is selected', () => {
  const fields = createDefaultSignatureFields();
  assert.deepEqual(fields.map(field => [field.label, field.kind]), [
    ['Date', 'date'],
    ['Name', 'text'],
    ['Extra field 1', 'text'],
    ['Extra field 2', 'text'],
    ['Signature', 'signature']
  ]);
  assert.ok(fields.every(field => field.value === ''));
});

test('parses custom signature fields with unrestricted line lengths', () => {
  const longLabel = 'Additional execution detail '.repeat(12).trim();
  const longValue = 'Custom value '.repeat(30).trim();
  const fields = parseSignatureFields('Date: ____\nName: _____\n' + longLabel + ': ' + longValue);
  assert.deepEqual(fields.map(field => field.label), ['Date', 'Name', longLabel]);
  assert.equal(fields[2].value, longValue);
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


test('uses a selected bare label as a customizable field instead of falling back to defaults', () => {
  const fields = parseSignatureFields('Effective Date');
  assert.equal(fields.length, 1);
  assert.equal(fields[0].label, 'Effective Date');
  assert.equal(fields[0].kind, 'date');
});


test('duplicates a signature field immediately after the source with an independent ID', async () => {
  const { duplicateSignatureField } = await import('./signatureBlocks');
  const source = createDefaultSignatureFields();
  source[1].value = 'Alex Example';
  const duplicated = duplicateSignatureField(source, source[1].id, 'signature-field-copy-1');
  assert.equal(duplicated.length, source.length + 1);
  assert.deepEqual(duplicated.slice(1, 3).map(field => field.label), ['Name', 'Name (copy)']);
  assert.equal(duplicated[2].value, 'Alex Example');
  assert.notEqual(duplicated[2].id, duplicated[1].id);
  assert.equal(source.length, 5, 'The original field list must not be mutated');
});

test('moves signature fields up and down without mutating the original list', async () => {
  const { moveSignatureField } = await import('./signatureBlocks');
  const source = createDefaultSignatureFields();
  const movedUp = moveSignatureField(source, source[2].id, 'up');
  assert.deepEqual(movedUp.map(field => field.label), ['Date', 'Extra field 1', 'Name', 'Extra field 2', 'Signature']);
  const movedDown = moveSignatureField(movedUp, movedUp[1].id, 'down');
  assert.deepEqual(movedDown.map(field => field.label), ['Date', 'Name', 'Extra field 1', 'Extra field 2', 'Signature']);
  assert.deepEqual(source.map(field => field.label), ['Date', 'Name', 'Extra field 1', 'Extra field 2', 'Signature']);
  assert.equal(moveSignatureField(source, source[0].id, 'up')[0].label, 'Date');
  assert.equal(moveSignatureField(source, source[4].id, 'down')[4].label, 'Signature');
});
