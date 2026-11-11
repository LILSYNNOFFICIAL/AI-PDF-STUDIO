import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const editor = readFileSync(new URL('./VisualEditor.tsx', import.meta.url), 'utf8');

test('document header metadata row disappears completely when every metadata field is removed', () => {
  assert.match(editor, /\{headerMetadataFields\.length > 0 && \(/);
  assert.match(editor, /headerMetadataFields\.length === 0 && hiddenHeaderMetadataIds\.length > 0/);
  assert.match(editor, /className="absolute bottom-0 right-0[^"]*"/);
});
