import test from 'node:test';
import assert from 'node:assert/strict';
import { clampContextMenuPosition, getContextMenuActionIds } from './contextMenu';

test('context menu action registry exposes only actions relevant to each document object', () => {
  assert.deepEqual(getContextMenuActionIds('text'), [
    'cut', 'copy', 'paste', 'select-all', 'insert-signature', 'ai-rewrite', 'ai-expand', 'ai-shorten', 'ai-professional', 'ai-grammar', 'ai-summarize'
  ]);
  assert.deepEqual(getContextMenuActionIds('section'), [
    'add-clause', 'add-section-before', 'add-section-after', 'rename-section', 'convert-to-appendix',
    'duplicate-section', 'move-section-up', 'move-section-down', 'toggle-page-break', 'edit-section-design', 'delete-section'
  ]);
  assert.deepEqual(getContextMenuActionIds('clause'), [
    'copy-clause', 'edit-clause', 'add-clause-after', 'duplicate-clause', 'move-clause-up', 'move-clause-down', 'renumber-clauses', 'delete-clause'
  ]);
  assert.deepEqual(getContextMenuActionIds('image'), [
    'align-left', 'align-center', 'align-right', 'increase-image-size',
    'decrease-image-size', 'set-image-size', 'reset-image-size', 'duplicate-image',
    'edit-caption', 'edit-alt-text', 'delete-image'
  ]);
  assert.deepEqual(getContextMenuActionIds('header-image'), [
    'align-left', 'align-center', 'align-right', 'increase-image-size',
    'decrease-image-size', 'set-image-size', 'reset-image-size', 'duplicate-image',
    'edit-caption', 'edit-alt-text', 'delete-image'
  ]);
  assert.deepEqual(getContextMenuActionIds('table'), [
    'add-table-row', 'add-table-column', 'delete-table-row', 'delete-table-column', 'duplicate-table', 'delete-table'
  ]);
  assert.deepEqual(getContextMenuActionIds('signature'), [
    'edit-signature', 'duplicate-signature', 'toggle-signature-method', 'delete-signature'
  ]);
});


test('canvas and cover context menus expose direct editing actions', () => {
  assert.deepEqual(getContextMenuActionIds('document'), [
    'add-section', 'insert-image', 'insert-signature', 'toggle-page-break', 'document-design', 'toggle-page-numbers', 'toggle-cover-page', 'change-page-size', 'change-page-orientation', 'change-page-background'
  ]);
  assert.deepEqual(getContextMenuActionIds('cover-logo'), [
    'upload-logo', 'edit-brand-name', 'increase-logo-size', 'decrease-logo-size',
    'set-logo-size', 'reset-logo-size', 'remove-logo'
  ]);
  assert.deepEqual(getContextMenuActionIds('cover-text'), [
    'edit-cover-text', 'clear-cover-text'
  ]);
});

test('context menu placement stays inside viewport near right and bottom edges', () => {
  assert.deepEqual(
    clampContextMenuPosition(980, 760, 220, 180, 1200, 900),
    { x: 972, y: 712 }
  );
  assert.deepEqual(
    clampContextMenuPosition(40, 20, 220, 180, 1200, 900),
    { x: 40, y: 20 }
  );
});

test('context menu placement handles menus wider or taller than the viewport', () => {
  assert.deepEqual(
    clampContextMenuPosition(800, 700, 500, 600, 320, 480),
    { x: 8, y: 8 }
  );
});

test('context menu placement rejects non-finite coordinates and dimensions', () => {
  assert.deepEqual(
    clampContextMenuPosition(Number.NaN, 10, 200, 100, 800, 600),
    { x: 8, y: 10 }
  );
  assert.deepEqual(
    clampContextMenuPosition(10, Infinity, 200, 100, 800, 600),
    { x: 10, y: 8 }
  );
});


test('keyboard navigation skips disabled context-menu items and wraps at both ends', async () => {
  const api = await import('./contextMenu') as unknown as {
    getNextEnabledContextMenuIndex: (
      items: Array<{ disabled?: boolean }>,
      currentIndex: number,
      direction: 'next' | 'previous'
    ) => number | null;
  };
  assert.equal(typeof api.getNextEnabledContextMenuIndex, 'function');
  const items = [
    { disabled: false },
    { disabled: true },
    { disabled: false },
    { disabled: true },
    { disabled: false }
  ];
  assert.equal(api.getNextEnabledContextMenuIndex(items, 0, 'next'), 2);
  assert.equal(api.getNextEnabledContextMenuIndex(items, 2, 'next'), 4);
  assert.equal(api.getNextEnabledContextMenuIndex(items, 4, 'next'), 0);
  assert.equal(api.getNextEnabledContextMenuIndex(items, 2, 'previous'), 0);
  assert.equal(api.getNextEnabledContextMenuIndex(items, 0, 'previous'), 4);
  assert.equal(api.getNextEnabledContextMenuIndex(items, -1, 'next'), 0);
  assert.equal(api.getNextEnabledContextMenuIndex(items, -1, 'previous'), 4);
  assert.equal(api.getNextEnabledContextMenuIndex(items.map(() => ({ disabled: true })), 0, 'next'), null);
});
