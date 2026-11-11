import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const menuSource = readFileSync(new URL('../components/MenuBar.tsx', import.meta.url), 'utf8');

test('Appendix / Exhibit menu item calls a dedicated append action instead of creating a new document', () => {
  const appendixButton = menuSource.match(/<button[\s\S]*?Appendix \/ Exhibit[\s\S]*?<\/button>/)?.[0] ?? '';
  assert.ok(appendixButton, 'Appendix / Exhibit menu item must exist');
  assert.match(appendixButton, /onAddAppendix/);
  assert.doesNotMatch(appendixButton, /onNewDocument/);
});
