import test from 'node:test';
import assert from 'node:assert/strict';
import { clampContextMenuPosition, getContextMenuActionIds } from './contextMenu';

test('context menu action registry exposes only actions relevant to each document object', () => {
  assert.deepEqual(getContextMenuActionIds('text'), [
    'cut', 'copy', 'paste', 'select-all', 'insert-signature'
  ]);
  assert.deepEqual(getContextMenuActionIds('section'), [
    'add-clause', 'duplicate-section', 'move-section-up', 'move-section-down',
    'toggle-page-break', 'edit-section-design', 'delete-section'
  ]);
  assert.deepEqual(getContextMenuActionIds('clause'), [
    'copy-clause', 'add-clause-after', 'duplicate-clause', 'delete-clause'
  ]);
  assert.deepEqual(getContextMenuActionIds('image'), [
    'align-left', 'align-center', 'align-right', 'increase-image-size',
    'decrease-image-size', 'set-image-size', 'reset-image-size', 'duplicate-image',
    'edit-caption', 'edit-alt-text', 'delete-image'
  ]);
  assert.deepEqual(getContextMenuActionIds('header-image'), [
    'align-left', 'align-center', 'align-right', 'increase-image-size',
    'decrease-image-size', 'edit-caption', 'edit-alt-text', 'delete-image'
  ]);
  assert.deepEqual(getContextMenuActionIds('table'), [
    'add-table-row', 'add-table-column', 'delete-table'
  ]);
  assert.deepEqual(getContextMenuActionIds('signature'), [
    'edit-signature', 'duplicate-signature', 'toggle-signature-method', 'delete-signature'
  ]);
});


test('canvas and cover context menus expose direct editing actions', () => {
  assert.deepEqual(getContextMenuActionIds('document'), [
    'add-section', 'insert-image', 'document-design'
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
