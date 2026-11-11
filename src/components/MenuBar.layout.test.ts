import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const menuSource = readFileSync(new URL('./MenuBar.tsx', import.meta.url), 'utf8');

test('desktop menu dropdowns are not clipped by the primary menu strip', () => {
  assert.match(menuSource, /className="[^"]*menu-primary-strip/);
  const stripRule = stylesheet.match(/\.menu-primary-strip\s*\{([^}]*)\}/)?.[1] ?? '';
  assert.match(stripRule, /overflow\s*:\s*visible\s*;/);
  assert.doesNotMatch(stripRule, /overflow(?:-x|-y)?\s*:\s*(?:auto|hidden|clip)\s*;/);
});

test('the menu bar establishes a top-level stacking layer above the editor canvas', () => {
  const root = menuSource.match(/<div\s+ref=\{menuBarRef\}\s+className="([^"]+)"/)?.[1] ?? '';
  assert.match(root, /relative/);
  assert.match(root, /z-\[?\d+\]?/);
});
