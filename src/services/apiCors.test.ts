import test from 'node:test';
import assert from 'node:assert/strict';
import { isAllowedApiOrigin } from './apiCors.ts';

test('allows the production GitHub Pages origin without Render env configuration', () => {
  assert.equal(isAllowedApiOrigin('https://lilsynnofficial.github.io', '', 'production'), true);
});

test('rejects unrelated origins in production', () => {
  assert.equal(isAllowedApiOrigin('https://evil.example', '', 'production'), false);
});

test('preserves explicitly configured origins', () => {
  assert.equal(isAllowedApiOrigin('https://preview.example', 'https://preview.example', 'production'), true);
});

test('allows localhost only outside production', () => {
  assert.equal(isAllowedApiOrigin('http://localhost:5173', '', 'development'), true);
  assert.equal(isAllowedApiOrigin('http://localhost:5173', '', 'production'), false);
});
