import test from 'node:test';
import assert from 'node:assert/strict';
import { getLilSynnArtworkPath, getTemplateArtworkPath } from './templateArtwork';

test('returns a base-path aware local artwork path for each template category', () => {
  assert.equal(getTemplateArtworkPath('Corporate & Legal', '/AI-PDF-STUDIO/'), '/AI-PDF-STUDIO/assets/templates/corporate-legal.svg');
  assert.equal(getTemplateArtworkPath('Music & Entertainment', '/'), '/assets/templates/music-entertainment.svg');
});

test('returns the dedicated LIL SYNN brand artwork path', () => {
  assert.equal(getLilSynnArtworkPath('/studio'), '/studio/assets/templates/lil-synn.svg');
});
