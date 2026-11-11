import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const menuSource = readFileSync(new URL('./MenuBar.tsx', import.meta.url), 'utf8');

test('desktop menu dropdowns are not clipped by the primary menu strip', () => {
  const stripClass = menuSource.match(/className="(flex min-w-0 flex-1 items-center[^"]*)"/)?.[1] ?? '';
  assert.match(stripClass, /overflow-visible/);
  assert.doesNotMatch(stripClass, /overflow-x-auto|overflow-hidden|overflow-clip/);
});

test('the menu bar establishes a top-level stacking layer above the editor canvas', () => {
  const root = menuSource.match(/<div\s+ref=\{menuBarRef\}\s+className="([^"]+)"/)?.[1] ?? '';
  assert.match(root, /relative/);
  assert.match(root, /z-\[?\d+\]?/);
});

test('menu buttons switch only on explicit clicks, avoiding hover-then-click toggle closure', () => {
  assert.doesNotMatch(menuSource, /handleMenuHover|onMouseEnter=\{\(\) => setActiveMenu/);
  assert.match(menuSource, /onClick=\{\(\) => handleMenuClick\('file'\)\}/);
  assert.match(menuSource, /onClick=\{\(\) => handleMenuClick\('more'\)\}/);
});
