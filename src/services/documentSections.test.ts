import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const menuSource = readFileSync(new URL('../components/MenuBar.tsx', import.meta.url), 'utf8');

test('Appendix / Exhibit menu item calls a dedicated append action instead of creating a new document', () => {
  const labelIndex = menuSource.indexOf('Appendix / Exhibit');
  const buttonStart = menuSource.lastIndexOf('<button', labelIndex);
  const buttonEnd = menuSource.indexOf('</button>', labelIndex) + '</button>'.length;
  const appendixButton = buttonStart >= 0 && buttonEnd >= '</button>'.length
    ? menuSource.slice(buttonStart, buttonEnd)
    : '';
  assert.ok(appendixButton, 'Appendix / Exhibit menu item must exist');
  assert.match(appendixButton, /onAddAppendix/);
  assert.doesNotMatch(appendixButton, /onNewDocument/);
});

test('App wires the appendix menu action to an append operation on the current document', () => {
  const appSource = readFileSync(new URL('../App.tsx', import.meta.url), 'utf8');
  assert.match(appSource, /const handleAddAppendix = \(\) =>/);
  assert.match(appSource, /sections: \[\.\.\.document\.sections, appendix\]/);
  assert.match(appSource, /onAddAppendix=\{handleAddAppendix\}/);
});
