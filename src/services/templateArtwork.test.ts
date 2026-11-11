import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { TEMPLATE_CATEGORIES } from './templateCatalog';
import { getLilSynnArtworkPath, getTemplateArtworkPath } from './templateArtwork';

test('returns a base-path aware local artwork path for template categories', () => {
  assert.equal(getTemplateArtworkPath('Corporate & Legal', '/AI-PDF-STUDIO/'), '/AI-PDF-STUDIO/assets/templates/corporate-legal.svg');
  assert.equal(getTemplateArtworkPath('Music & Entertainment', '/'), '/assets/templates/music-entertainment.svg');
});

test('returns the dedicated LIL SYNN artwork path', () => {
  assert.equal(getLilSynnArtworkPath('/studio'), '/studio/assets/templates/lil-synn.svg');
});


test('every template category and the LIL SYNN identity have a bundled, well-formed SVG asset', () => {
  for (const category of TEMPLATE_CATEGORIES) {
    const assetUrl = new URL('../../public' + getTemplateArtworkPath(category), import.meta.url);
    assert.ok(existsSync(assetUrl), 'Missing local artwork for ' + category);
    const svg = readFileSync(assetUrl, 'utf8');
    assert.match(svg, /^<svg\b/);
    assert.match(svg, /<\/svg>\s*$/);
  }
  const lilSynnUrl = new URL('../../public' + getLilSynnArtworkPath(), import.meta.url);
  assert.ok(existsSync(lilSynnUrl), 'Missing dedicated LIL SYNN artwork');
  assert.match(readFileSync(lilSynnUrl, 'utf8'), /^<svg\b/);
});
