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
  syncLegacyStyleChanges,
  resolveSectionDesign,
  resolveTableDesign,
  resolveCellFill,
  fillToCss,
  contrastRatio,
  validateDocumentDesign
} from './documentDesign';

class MemoryStorage {
  private data = new Map<string, string>();
  getItem(key: string): string | null { return this.data.get(key) ?? null; }
  setItem(key: string, value: string): void { this.data.set(key, value); }
  removeItem(key: string): void { this.data.delete(key); }
}

test('all eighteen built-in themes contain valid semantic tokens', () => {
  assert.equal(DOCUMENT_DESIGN_PRESETS.length, 18);
  for (const preset of DOCUMENT_DESIGN_PRESETS) {
    validateDocumentDesign(preset);
    assert.ok(preset.colors.primary);
    assert.ok(preset.colors.accent);
    assert.ok(preset.colors.bodyText);
    assert.ok(preset.colors.headingText);
    assert.ok(preset.page.background);
    assert.ok(preset.tableDefaults.headerBackground);
  }
  const lilSynn = DOCUMENT_DESIGN_PRESETS.find(preset => preset.presetId === 'lil-synn');
  assert.ok(lilSynn);
  assert.equal(lilSynn.name, 'LIL SYNN');
  assert.equal(lilSynn.colors.pageSurface, '#050505');
  assert.equal(lilSynn.colors.bodyText, '#f5f5f5');
  assert.equal(lilSynn.colors.headingText, '#ff4fa3');
  assert.equal(lilSynn.colors.border, '#d99a32');
  assert.equal(lilSynn.tableDefaults.bodyBackground.type, 'solid');
  assert.equal(lilSynn.tableDefaults.bodyBackground.color, '#050505');
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


test('legacy formatting changes continue to synchronize into an existing document theme', () => {
  const previous = normalizeDocumentDesign(buildDocumentFromPrompt('Agreement').updatedDoc);
  const next = {
    ...previous,
    styles: {
      ...previous.styles,
      fontFamily: 'Garamond' as const,
      fontSize: 13,
      heading2Size: 16,
      primaryColor: '#202020',
      accentColor: '#aa3344',
      textColor: '#304050'
    }
  };
  const synchronized = syncLegacyStyleChanges(previous, next);

  assert.equal(synchronized.design?.typography.bodyFontFamily, 'Garamond');
  assert.equal(synchronized.design?.typography.bodyFontSize, 13);
  assert.equal(synchronized.design?.typography.heading2Size, 16);
  assert.equal(synchronized.design?.colors.primary, '#202020');
  assert.equal(synchronized.design?.colors.headingText, '#202020');
  assert.equal(synchronized.design?.colors.accent, '#aa3344');
  assert.equal(synchronized.design?.colors.bodyText, '#304050');
  assert.deepEqual(synchronized.sections, previous.sections);
});

test('explicit theme updates remain authoritative and synchronize legacy ribbon values', () => {
  const previous = normalizeDocumentDesign(buildDocumentFromPrompt('Agreement').updatedDoc);
  const next = {
    ...previous,
    design: {
      ...previous.design!,
      presetId: 'luxury-executive',
      typography: {
        ...previous.design!.typography,
        bodyFontFamily: 'Garamond' as const,
        bodyFontSize: 11.5,
        headingFontFamily: 'Garamond' as const,
        heading2Size: 15,
        headingCase: 'none' as const
      },
      colors: {
        ...previous.design!.colors,
        primary: '#25211d',
        accent: '#b08a45',
        bodyText: '#403a33'
      }
    }
  };
  const synchronized = syncLegacyStyleChanges(previous, next);
  assert.equal(synchronized.design?.typography.bodyFontFamily, 'Garamond');
  assert.equal(synchronized.styles.fontFamily, 'Garamond');
  assert.equal(synchronized.styles.fontSize, 11.5);
  assert.equal(synchronized.styles.headingFont, 'Garamond');
  assert.equal(synchronized.styles.heading2Size, 15);
  assert.equal(synchronized.styles.headingCase, 'none');
  assert.equal(synchronized.styles.primaryColor, '#25211d');
  assert.equal(synchronized.styles.accentColor, '#b08a45');
  assert.equal(synchronized.styles.textColor, '#403a33');
});


test('contrast ratio helper distinguishes accessible and low-contrast pairs', () => {
  assert.equal(contrastRatio('#000000', '#ffffff'), 21);
  assert.equal(contrastRatio('#ffffff', '#ffffff'), 1);
  assert.ok(contrastRatio('#777777', '#ffffff') < 4.5);
});


test('premium dark design presets include distinct Midnight Executive, Art Deco and luxury directions', () => {
  const byId = new Map(DOCUMENT_DESIGN_PRESETS.map(preset => [preset.presetId, preset]));
  assert.ok(byId.has('midnight-executive'));
  assert.ok(byId.has('art-deco'));
  assert.ok(byId.has('dark-luxury'));
  assert.ok(byId.has('bauhaus-modern'));
  assert.ok(byId.has('glassmorphism'));
});

test('LIL SYNN theme preserves its exact palette and uses a professional framed cover hierarchy', () => {
  const preset = DOCUMENT_DESIGN_PRESETS.find(item => item.presetId === 'lil-synn')!;
  assert.deepEqual(
    {
      page: preset.colors.pageSurface,
      section: preset.colors.sectionSurface,
      heading: preset.colors.headingText,
      accent: preset.colors.accent,
      body: preset.colors.bodyText,
      secondary: preset.colors.secondary,
      muted: preset.colors.mutedText,
      border: preset.colors.border
    },
    {
      page: '#050505',
      section: '#080808',
      heading: '#ff4fa3',
      accent: '#ff4fa3',
      body: '#f5f5f5',
      secondary: '#d1d5db',
      muted: '#c5c5c5',
      border: '#d99a32'
    }
  );
  const cover = (preset as any).coverPage;
  assert.deepEqual(cover, {
    enabled: true,
    style: 'art-deco',
    background: { type: 'solid', color: '#050505', opacity: 1 },
    titleColor: '#ff4fa3',
    detailColor: '#c5c5c5',
    borderColor: '#d99a32',
    eyebrow: 'LIL SYNN • SYNTIENT RECORDS',
    brandLine: 'MUSIC • CREATIVE • INTELLECTUAL PROPERTY',
    showFrame: true,
    showLogoPlaceholder: true,
    showOrnamentalRule: true
  });
  assert.equal((preset as any).layoutDefaults?.sectionHeadingStyle, 'editorial-rule');
  assert.equal((preset as any).layoutDefaults?.sectionSpacing, 28);
});

test('legacy document design normalization supplies cover and layout defaults', () => {
  const doc = buildDocumentFromPrompt('Legacy design migration').updatedDoc;
  doc.design = undefined;
  const normalized = normalizeDocumentDesign(doc);
  const cover = (normalized.design as any).coverPage;
  const layout = (normalized.design as any).layoutDefaults;

  assert.deepEqual(cover, {
    enabled: false,
    style: 'midnight-executive',
    background: { type: 'solid', color: '#0b0d12', opacity: 1 },
    titleColor: '#f8fafc',
    detailColor: '#94a3b8',
    borderColor: '#b08a45',
    eyebrow: 'AGREEMENT',
    brandLine: '',
    showFrame: true,
    showLogoPlaceholder: false,
    showOrnamentalRule: true
  });
  assert.deepEqual(layout, {
    sectionHeadingStyle: 'editorial-rule',
    sectionSpacing: 22,
    headerRule: true,
    footerRule: true,
    paragraphIndent: 0,
    sectionPadding: 12
  });
});

test('applying any visual preset preserves all agreement content and structure', () => {
  const doc = buildDocumentFromPrompt('Theme must not rewrite agreement content').updatedDoc;
  doc.title = 'Contract Text Must Stay Exact';
  doc.sections[0].content = 'PRESERVE THIS EXACT LEGAL LANGUAGE.';
  doc.sections[0].clauses[0].content = 'DO NOT REWRITE THIS CLAUSE.';
  const before = JSON.stringify({
    title: doc.title,
    sections: doc.sections,
    signatures: doc.signatures,
    sourceText: doc.sourceText
  });

  assert.ok(DOCUMENT_DESIGN_PRESETS.some(preset => preset.presetId === 'midnight-executive'));
  const updated = applyDocumentPreset(doc, 'midnight-executive');

  assert.equal(JSON.stringify({
    title: updated.title,
    sections: updated.sections,
    signatures: updated.signatures,
    sourceText: updated.sourceText
  }), before);
});


test('document design themes export and import as a validated JSON round trip', async () => {
  const api = await import('./documentDesign') as unknown as {
    serializeDocumentTheme: (design: typeof DOCUMENT_DESIGN_PRESETS[number]) => string;
    parseDocumentTheme: (source: string) => typeof DOCUMENT_DESIGN_PRESETS[number];
  };
  assert.equal(typeof api.serializeDocumentTheme, 'function');
  assert.equal(typeof api.parseDocumentTheme, 'function');
  const source = DOCUMENT_DESIGN_PRESETS.find(preset => preset.presetId === 'lil-synn')!;
  const serialized = api.serializeDocumentTheme(source);
  const parsed = api.parseDocumentTheme(serialized);
  assert.deepEqual(parsed, source);
  assert.throws(() => api.parseDocumentTheme('{invalid json'), /valid JSON/i);
  const invalid = JSON.parse(serialized);
  invalid.coverPage.titleColor = 'not-a-color';
  assert.throws(() => api.parseDocumentTheme(JSON.stringify(invalid)), /hexadecimal color/i);
});

test('saved theme duplication creates an independent named copy without changing the original', async () => {
  const api = await import('./documentDesign') as unknown as {
    duplicateSavedTheme: (storage: any, sourceId: string, newName: string) => SavedTheme[];
  };
  assert.equal(typeof api.duplicateSavedTheme, 'function');
  const storage = new MemoryStorage();
  saveTheme(storage as any, {
    id: 'theme-source',
    name: 'Source Theme',
    design: DOCUMENT_DESIGN_PRESETS.find(preset => preset.presetId === 'lil-synn')!,
    updatedAt: '2026-11-08T00:00:00.000Z'
  } as any);
  const duplicated = api.duplicateSavedTheme(storage as any, 'theme-source', 'Professional LIL SYNN');
  assert.equal(duplicated.length, 2);
  const copy = duplicated.find(item => item.name === 'Professional LIL SYNN');
  const original = duplicated.find(item => item.id === 'theme-source');
  assert.ok(copy);
  assert.ok(original);
  assert.notEqual(copy.id, original.id);
  assert.deepEqual(copy.design, original.design);
  copy.design.name = 'Modified copy';
  assert.equal(listSavedThemes(storage as any).find(item => item.id === 'theme-source')?.design.name, 'LIL SYNN');
});

type SavedTheme = ReturnType<typeof listSavedThemes>[number];
