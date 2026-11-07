import test from 'node:test';
import assert from 'node:assert/strict';
import { buildDocumentFromPrompt } from '../orchestrator/orchestrator';
import {
  DOCUMENT_DESIGN_PRESETS,
  applyDocumentPreset,
  clearDesignOverrides,
  listSavedThemes,
  saveTheme,
  renameTheme,
  deleteTheme,
  normalizeDocumentDesign,
  resolveSectionDesign,
  resolveTableDesign,
  resolveCellFill,
  fillToCss,
  validateDocumentDesign
} from './documentDesign';

class MemoryStorage {
  private data = new Map<string, string>();
  getItem(key: string): string | null { return this.data.get(key) ?? null; }
  setItem(key: string, value: string): void { this.data.set(key, value); }
  removeItem(key: string): void { this.data.delete(key); }
}

test('all eight built-in presets contain valid semantic tokens', () => {
  assert.equal(DOCUMENT_DESIGN_PRESETS.length, 8);
  for (const preset of DOCUMENT_DESIGN_PRESETS) {
    validateDocumentDesign(preset);
    assert.ok(preset.colors.primary);
    assert.ok(preset.colors.accent);
    assert.ok(preset.colors.bodyText);
    assert.ok(preset.colors.headingText);
    assert.ok(preset.page.background);
    assert.ok(preset.tableDefaults.headerBackground);
  }
});

test('legacy design migration preserves all document content and structure', () => {
  const doc = buildDocumentFromPrompt('Agreement').updatedDoc;
  doc.sections[0].tables = [{
    id: 'table-1',
    headers: [{ id: 'h1', content: 'Name', bg: '#eeeeee' }],
    rows: [[{ id: 'c1', content: 'Original value', bg: '#f0f0f0' }]]
  }];
  doc.sections[0].images = [{ id: 'image-1', url: 'data:image/png;base64,AA==', alignment: 'center', widthPercent: 40 }];
  doc.signatures = { id: 'signatures-1', parties: [{ id: 'party-1', role: 'ARTIST', name: 'Original Name' }] };
  const before = JSON.stringify({
    title: doc.title,
    sections: doc.sections,
    signatures: doc.signatures,
    styles: doc.styles,
    pageConfig: doc.pageConfig
  });

  const migrated = normalizeDocumentDesign(doc);

  assert.equal(migrated.design?.schemaVersion, 1);
  assert.equal(JSON.stringify({
    title: migrated.title,
    sections: migrated.sections,
    signatures: migrated.signatures,
    styles: migrated.styles,
    pageConfig: migrated.pageConfig
  }), before);
  assert.equal(migrated.design?.typography.bodyFontSize, doc.styles.fontSize);
  assert.equal(migrated.design?.colors.primary, doc.styles.primaryColor);
});

test('section, table and cell overrides resolve from most specific to inherited styles', () => {
  const doc = normalizeDocumentDesign(buildDocumentFromPrompt('Agreement').updatedDoc);
  const section = {
    ...doc.sections[0],
    design: { background: { type: 'solid' as const, color: '#ddeeff' }, bodyTextColor: '#102030' },
    tables: [{
      id: 'table-1',
      headers: [{ id: 'h1', content: 'Name' }],
      rows: [[{ id: 'c1', content: 'Value', bg: '#ffcc00' }]],
      design: { headerBackground: { type: 'solid' as const, color: '#112233' } }
    }]
  };

  const sectionResolved = resolveSectionDesign(doc, section);
  const tableResolved = resolveTableDesign(doc, section, section.tables[0]);
  const cellResolved = resolveCellFill(tableResolved, section.tables[0].rows[0][0], 0);

  assert.equal(sectionResolved.background?.type, 'solid');
  assert.equal(sectionResolved.bodyTextColor, '#102030');
  assert.equal(tableResolved.headerBackground.type, 'solid');
  assert.equal(tableResolved.headerBackground.color, '#112233');
  assert.equal(cellResolved, '#ffcc00');
});

test('invalid colors, gradient stops and opacity are rejected', () => {
  const preset = DOCUMENT_DESIGN_PRESETS[0];
  assert.throws(() => validateDocumentDesign({
    ...preset,
    colors: { ...preset.colors, accent: 'royalblue' }
  } as any), /accent.*color|color.*accent/i);
  assert.throws(() => validateDocumentDesign({
    ...preset,
    page: { background: { type: 'linear-gradient', angle: 30, stops: [{ color: '#ffffff', position: 0 }] } }
  } as any), /two.*stops|at least two/i);
  assert.throws(() => validateDocumentDesign({
    ...preset,
    page: { background: { type: 'solid', color: '#ffffff', opacity: 1.5 } }
  } as any), /opacity/i);
});

test('applying a preset retains section, table and cell overrides', () => {
  const doc = normalizeDocumentDesign(buildDocumentFromPrompt('Agreement').updatedDoc);
  doc.sections[0].design = { headingColor: '#ff00ff' };
  doc.sections[0].tables = [{
    id: 'table-1',
    headers: [{ id: 'h1', content: 'Name' }],
    rows: [[{ id: 'c1', content: 'Value', bg: '#123456' }]],
    design: { gridlineColor: '#654321' }
  }];
  const updated = applyDocumentPreset(doc, 'luxury-executive');
  assert.equal(updated.sections[0].design?.headingColor, '#ff00ff');
  assert.equal(updated.sections[0].tables?.[0].design?.gridlineColor, '#654321');
  assert.equal(updated.sections[0].tables?.[0].rows[0][0].bg, '#123456');
});

test('clearing overrides is explicit and removes only styling overrides', () => {
  const doc = normalizeDocumentDesign(buildDocumentFromPrompt('Agreement').updatedDoc);
  doc.sections[0].design = { headingColor: '#ff00ff' };
  doc.sections[0].tables = [{
    id: 'table-1',
    headers: [{ id: 'h1', content: 'Name', bg: '#eeeeee' }],
    rows: [[{ id: 'c1', content: 'Original value', bg: '#f0f0f0' }]],
    design: { gridlineColor: '#654321' }
  }];
  const cleared = clearDesignOverrides(doc);
  assert.equal(cleared.sections[0].design, undefined);
  assert.equal(cleared.sections[0].tables?.[0].design, undefined);
  assert.equal(cleared.sections[0].tables?.[0].headers[0].bg, undefined);
  assert.equal(cleared.sections[0].tables?.[0].rows[0][0].content, 'Original value');
});

test('saved themes round-trip, rename, delete, and recover from corrupt storage', () => {
  const storage = new MemoryStorage();
  const design = DOCUMENT_DESIGN_PRESETS[0];
  saveTheme(storage as any, { id: 'theme-1', name: 'My Theme', design, updatedAt: new Date().toISOString() });
  assert.equal(listSavedThemes(storage as any)[0].name, 'My Theme');
  renameTheme(storage as any, 'theme-1', 'Renamed');
  assert.equal(listSavedThemes(storage as any)[0].name, 'Renamed');
  deleteTheme(storage as any, 'theme-1');
  assert.equal(listSavedThemes(storage as any).length, 0);

  storage.setItem('ai-pdf-studio.saved-themes.v1', '{broken json');
  assert.deepEqual(listSavedThemes(storage as any), []);
});


test('gradient fill CSS preserves opacity and ordered color stops', () => {
  const css = fillToCss({
    type: 'linear-gradient',
    angle: 135,
    opacity: 0.4,
    stops: [
      { color: '#112233', position: 0 },
      { color: '#aabbcc', position: 100 }
    ]
  });
  assert.match(css, /^linear-gradient\(135deg,/);
  assert.match(css, /rgba\(17, 34, 51, 0\.4\) 0%/);
  assert.match(css, /rgba\(170, 187, 204, 0\.4\) 100%/);
});

test('gradient opacity outside the supported range is rejected', () => {
  const preset = DOCUMENT_DESIGN_PRESETS[0];
  assert.throws(() => validateDocumentDesign({
    ...preset,
    page: {
      background: {
        type: 'linear-gradient',
        angle: 45,
        opacity: 1.1,
        stops: [
          { color: '#ffffff', position: 0 },
          { color: '#000000', position: 100 }
        ]
      }
    }
  } as any), /opacity/i);
});
