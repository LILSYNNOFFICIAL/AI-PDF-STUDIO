import test from 'node:test';
import assert from 'node:assert/strict';
import { createDefaultSignatureFields, parseSignatureFields } from './signatureBlocks';

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
