import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateImageResizeWidth } from './imageResize.ts';

test('dragging a right corner outward increases the image width', () => {
  assert.equal(calculateImageResizeWidth(50, 100, 500, 'bottom-right'), 70);
});

test('dragging a left corner outward increases the image width in the opposite pointer direction', () => {
  assert.equal(calculateImageResizeWidth(50, -100, 500, 'top-left'), 70);
});

test('image resizing is clamped between 10 and 100 percent', () => {
  assert.equal(calculateImageResizeWidth(95, 1000, 500, 'bottom-right'), 100);
  assert.equal(calculateImageResizeWidth(15, 1000, 500, 'top-left'), 10);
});

test('invalid container dimensions cannot produce a non-finite width', () => {
  assert.equal(calculateImageResizeWidth(50, 10, 0, 'bottom-right'), 100);
  assert.equal(calculateImageResizeWidth(50, Number.NaN, 500, 'bottom-right'), 50);
});
