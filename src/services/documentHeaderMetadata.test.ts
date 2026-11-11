import test from 'node:test';
import assert from 'node:assert/strict';
import { buildDocumentFromPrompt } from '../orchestrator/orchestrator';
import {
  getDocumentHeaderFields,
  updateDocumentHeaderField,
  removeDocumentHeaderField,
  restoreDocumentHeaderField
} from './documentHeaderMetadata';

test('header metadata defaults to editable version, type, date and author fields', () => {
  const doc = buildDocumentFromPrompt('Header metadata defaults').updatedDoc;
  const fields = getDocumentHeaderFields(doc);
  assert.deepEqual(fields.map(field => field.id), ['version', 'documentType', 'date', 'author']);
  assert.deepEqual(fields.map(field => field.label), ['Version', 'Document Type', 'Date', 'Author']);
  assert.equal(fields[0].value, String(doc.version));
  assert.equal(fields[1].value, doc.type.replace(/_/g, ' ').toUpperCase());
  assert.equal(fields[3].value, doc.author);
});

test('header metadata labels and values can be customized without mutating internal version or type', () => {
  const doc = buildDocumentFromPrompt('Header metadata edits').updatedDoc;
  const withLabel = updateDocumentHeaderField(doc, 'documentType', { label: 'Agreement category' });
  const withValue = updateDocumentHeaderField(withLabel, 'documentType', { value: 'Publishing Agreement' });
  const fields = getDocumentHeaderFields(withValue);
  assert.equal(fields.find(field => field.id === 'documentType')?.label, 'Agreement category');
  assert.equal(fields.find(field => field.id === 'documentType')?.value, 'Publishing Agreement');
  assert.equal(withValue.type, doc.type);
  assert.equal(withValue.version, doc.version);
});

test('header metadata fields can be deleted and restored, and an empty list stays empty', () => {
  const doc = buildDocumentFromPrompt('Header metadata delete').updatedDoc;
  const withoutDate = removeDocumentHeaderField(doc, 'date');
  assert.deepEqual(getDocumentHeaderFields(withoutDate).map(field => field.id), ['version', 'documentType', 'author']);
  const withoutAny = (['version', 'documentType', 'author'] as const).reduce(
    (current, id) => removeDocumentHeaderField(current, id),
    withoutDate
  );
  assert.deepEqual(getDocumentHeaderFields(withoutAny), []);
  const restored = restoreDocumentHeaderField(withoutAny, 'date');
  assert.deepEqual(getDocumentHeaderFields(restored).map(field => field.id), ['date']);
});

test('editing the displayed author also updates the canonical document author', () => {
  const doc = buildDocumentFromPrompt('Header author').updatedDoc;
  const updated = updateDocumentHeaderField(doc, 'author', { value: 'LIL SYNN' });
  assert.equal(updated.author, 'LIL SYNN');
  assert.equal(getDocumentHeaderFields(updated).find(field => field.id === 'author')?.value, 'LIL SYNN');
});
