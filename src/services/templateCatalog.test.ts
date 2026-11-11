import test from 'node:test';
import assert from 'node:assert/strict';
import { applyDocumentPreset } from './documentDesign';
import { DOCUMENT_DESIGN_PRESETS } from './documentDesign';

const EXPECTED_COUNTS = {
  'Music & Entertainment': 21,
  'Business & Commercial': 12,
  'Real Estate & Rentals': 12,
  'Creative & Freelance': 10,
  'Employment & HR': 10,
  'Corporate & Legal': 10,
  'Finance & Investment': 8,
  'Technology & Data': 8,
  'Marketing & Partnerships': 5,
  'Personal & General': 5
};

test('the catalog contains exactly 100 templates in the approved category counts', async () => {
  const catalogApi = await import('./templateCatalog') as unknown as {
    DOCUMENT_TEMPLATE_CATALOG: Array<{ id: string; title: string; category: string; description: string; tags: string[]; sectionTitles: string[] }>;
    TEMPLATE_CATEGORY_COUNTS: Record<string, number>;
  };
  assert.ok(Array.isArray(catalogApi.DOCUMENT_TEMPLATE_CATALOG));
  assert.equal(catalogApi.DOCUMENT_TEMPLATE_CATALOG.length, 101);
  assert.deepEqual(catalogApi.TEMPLATE_CATEGORY_COUNTS, EXPECTED_COUNTS);
  const ids = catalogApi.DOCUMENT_TEMPLATE_CATALOG.map(item => item.id);
  assert.equal(new Set(ids).size, 101, 'All 101 template IDs must be unique');
  for (const item of catalogApi.DOCUMENT_TEMPLATE_CATALOG) {
    assert.ok(item.id.trim());
    assert.ok(item.title.trim());
    assert.ok(item.description.trim());
    assert.ok(item.tags.length > 0);
    assert.ok(item.tags.every(tag => tag.trim()));
    assert.ok(item.sectionTitles.length >= 5, item.id + ' should expose a section outline for the gallery preview');
  }
});

test('each catalog template builds a fresh multi-section editable document', async () => {
  const catalogApi = await import('./templateCatalog') as unknown as {
    DOCUMENT_TEMPLATE_CATALOG: Array<{ id: string }>;
    buildTemplateDocument: (id: string) => import('../types/document').DocumentModel;
  };
  assert.equal(typeof catalogApi.buildTemplateDocument, 'function');
  for (const template of catalogApi.DOCUMENT_TEMPLATE_CATALOG) {
    const first = catalogApi.buildTemplateDocument(template.id);
    const second = catalogApi.buildTemplateDocument(template.id);
    assert.notEqual(first.id, second.id, template.id + ' should receive a fresh document ID');
    assert.notEqual(first.sections[0].id, second.sections[0].id, template.id + ' should receive fresh section IDs');
    assert.ok(first.sections.length >= 5, template.id + ' should include multiple substantive sections');
    assert.ok(first.sections.every(section => section.clauses.length > 0), template.id + ' sections should contain editable clauses');
    assert.notEqual(first.sections, second.sections, template.id + ' should not share section arrays');
    assert.notEqual(first.sections[0].clauses, second.sections[0].clauses, template.id + ' should not share clause arrays');
  }
});

test('representative templates contain distinct category-specific provisions', async () => {
  const catalogApi = await import('./templateCatalog') as unknown as {
    getTemplateById: (id: string) => { title: string; category: string; scope: string } | undefined;
    buildTemplateDocument: (id: string) => import('../types/document').DocumentModel;
  };
  const samples = [
    ['recording-artist-agreement', 'Music & Entertainment', /master recording|recording artist/i],
    ['residential-lease-agreement', 'Real Estate & Rentals', /premises|residential tenancy/i],
    ['influencer-campaign-agreement', 'Marketing & Partnerships', /campaign|social media/i],
    ['saas-subscription-agreement', 'Technology & Data', /software|subscription/i]
  ] as const;
  for (const [id, category, contentPattern] of samples) {
    const template = catalogApi.getTemplateById(id);
    assert.ok(template, 'Missing representative template ' + id);
    assert.equal(template.category, category);
    const doc = catalogApi.buildTemplateDocument(id);
    const content = doc.sections.map(section => [
      section.title,
      section.content || '',
      ...section.clauses.map(clause => clause.heading + ' ' + clause.content)
    ].join('\n')).join('\n');
    assert.match(content, contentPattern, id + ' should contain its distinct subject matter');
  }
});

test('template search matches titles, descriptions and tags and can filter categories', async () => {
  const catalogApi = await import('./templateCatalog') as unknown as {
    searchTemplates: (query: string, category?: string) => Array<{ id: string; category: string }>;
  };
  assert.equal(typeof catalogApi.searchTemplates, 'function');
  assert.ok(catalogApi.searchTemplates('master recording').some(item => item.id === 'recording-artist-agreement'));
  assert.ok(catalogApi.searchTemplates('residential').some(item => item.id === 'residential-lease-agreement'));
  assert.ok(catalogApi.searchTemplates('rental', 'Real Estate & Rentals').every(item => item.category === 'Real Estate & Rentals'));
  assert.deepEqual(catalogApi.searchTemplates('definitely-no-template-match'), []);
});

test('applying a selected visual theme never changes template content', async () => {
  const catalogApi = await import('./templateCatalog') as unknown as {
    buildTemplateDocument: (id: string) => import('../types/document').DocumentModel;
  };
  const doc = catalogApi.buildTemplateDocument('recording-artist-agreement');
  const before = JSON.stringify({
    title: doc.title,
    type: doc.type,
    sections: doc.sections,
    signatures: doc.signatures,
    sourceIntegrity: doc.sourceIntegrity
  });
  const updated = applyDocumentPreset(doc, 'midnight-executive');
  assert.equal(JSON.stringify({
    title: updated.title,
    type: updated.type,
    sections: updated.sections,
    signatures: updated.signatures,
    sourceIntegrity: updated.sourceIntegrity
  }), before);
  assert.equal(updated.design?.presetId, 'midnight-executive');
  assert.equal(DOCUMENT_DESIGN_PRESETS.find(item => item.presetId === 'midnight-executive')?.name, 'Midnight Executive');
});


test('template gallery favorites and recent history survive storage round trips and malformed storage', async () => {
  const api = await import('./templateCatalog') as unknown as {
    TEMPLATE_GALLERY_STORAGE_KEY: string;
    loadTemplateGalleryPreferences: (storage: any) => { favorites: string[]; recents: string[] };
    saveTemplateGalleryPreferences: (storage: any, preferences: { favorites: string[]; recents: string[] }) => boolean;
    recordTemplateRecent: (preferences: { favorites: string[]; recents: string[] }, id: string) => { favorites: string[]; recents: string[] };
  };
  assert.equal(typeof api.loadTemplateGalleryPreferences, 'function');
  assert.equal(typeof api.saveTemplateGalleryPreferences, 'function');
  assert.equal(typeof api.recordTemplateRecent, 'function');

  const values = new Map<string, string>();
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); }
  };
  const initial = { favorites: ['recording-artist-agreement'], recents: ['residential-lease-agreement'] };
  assert.equal(api.saveTemplateGalleryPreferences(storage, initial), true);
  assert.deepEqual(api.loadTemplateGalleryPreferences(storage), initial);

  const updated = api.recordTemplateRecent(initial, 'recording-artist-agreement');
  assert.deepEqual(updated.recents, ['recording-artist-agreement', 'residential-lease-agreement']);
  assert.deepEqual(updated.favorites, initial.favorites);

  values.set(api.TEMPLATE_GALLERY_STORAGE_KEY, '{broken json');
  assert.deepEqual(api.loadTemplateGalleryPreferences(storage), { favorites: [], recents: [] });

  const blockedStorage = {
    getItem: () => { throw new Error('storage blocked'); },
    setItem: () => { throw new Error('storage blocked'); }
  };
  assert.deepEqual(api.loadTemplateGalleryPreferences(blockedStorage), { favorites: [], recents: [] });
  assert.equal(api.saveTemplateGalleryPreferences(blockedStorage, initial), false);
});


test('standard music-category templates use a neutral legal type and accept a user-defined agreement type', async () => {
  const api = await import('./templateCatalog') as unknown as {
    buildTemplateDocument: (id: string, agreementType?: string) => import('../types/document').DocumentModel;
  };
  const doc = api.buildTemplateDocument('recording-artist-agreement', 'Independent Recording Services Agreement');
  assert.equal(doc.type, 'legal_agreement');
  assert.equal(doc.title, 'Independent Recording Services Agreement');
  assert.equal(doc.pageConfig.headerText, 'INDEPENDENT RECORDING SERVICES AGREEMENT');
  const fallback = api.buildTemplateDocument('recording-artist-agreement');
  assert.equal(fallback.title, 'Recording Artist Agreement');
  assert.notEqual(fallback.type, 'music_agreement');
});


test('only the dedicated LIL SYNN template defaults to Music Agreement; other templates remain freely named', async () => {
  const api = await import('./templateCatalog') as unknown as {
    LIL_SYNN_TEMPLATE_ID: string;
    getTemplateById: (id: string) => { id: string; title: string; category: string; documentType: string } | undefined;
    getTemplateAgreementDefaults: (
      template: { id: string; title: string; category: string; documentType: string } | null
    ) => { agreementType: string; documentType: string | null; brandName?: string };
    buildTemplateDocument: (id: string, agreementType?: string) => import('../types/document').DocumentModel;
  };
  const lilSynnTemplate = api.getTemplateById('lil-synn-music-agreement');
  const musicTemplate = api.getTemplateById('recording-artist-agreement')!;
  const businessTemplate = api.getTemplateById('master-services-agreement')!;
  assert.ok(lilSynnTemplate);
  assert.equal(api.LIL_SYNN_TEMPLATE_ID, 'lil-synn-music-agreement');
  assert.deepEqual(api.getTemplateAgreementDefaults(lilSynnTemplate!), {
    agreementType: 'Music Agreement',
    documentType: 'music_agreement',
    brandName: 'LIL SYNN'
  });
  assert.deepEqual(api.getTemplateAgreementDefaults(musicTemplate), {
    agreementType: musicTemplate.title,
    documentType: musicTemplate.documentType
  });
  assert.deepEqual(api.getTemplateAgreementDefaults(businessTemplate), {
    agreementType: businessTemplate.title,
    documentType: businessTemplate.documentType
  });
  const specialDocument = api.buildTemplateDocument('lil-synn-music-agreement');
  assert.equal(specialDocument.title, 'Music Agreement');
  assert.equal(specialDocument.type, 'music_agreement');
  const customDocument = api.buildTemplateDocument('recording-artist-agreement', 'Independent Recording Services Agreement');
  assert.equal(customDocument.title, 'Independent Recording Services Agreement');
  assert.equal(customDocument.type, 'legal_agreement');
});


test('category templates use their own professional clause hierarchy instead of generic boilerplate headings', async () => {
  const api = await import('./templateCatalog') as unknown as {
    buildTemplateDocument: (id: string) => import('../types/document').DocumentModel;
  };
  const samples = [
    ['recording-artist-agreement', ['Creative Services, Deliverables & Approval', 'Compensation, Royalties & Accounting', 'Master Rights, Composition Rights & Credits', 'Release Obligations, Clearances & Termination']],
    ['residential-lease-agreement', ['Premises, Permitted Use & Occupancy Duties', 'Rent, Deposits, Utilities & Other Charges', 'Access, Condition, Repairs & Property Records', 'Property Condition, Default & Surrender']],
    ['professional-services-sow', ['Service Levels, Work Orders & Acceptance', 'Fees, Expenses, Taxes & Invoicing', 'Work Product, Business Records & Confidential Information', 'Commercial Risk, Change Control & Exit']]
  ] as const;
  for (const [id, expectedHeadings] of samples) {
    const doc = api.buildTemplateDocument(id);
    const headings = doc.sections.flatMap(section => section.clauses.map(clause => clause.heading || ''));
    for (const expected of expectedHeadings) {
      assert.ok(headings.includes(expected), id + ' should include clause heading: ' + expected);
    }
    assert.ok(!headings.includes('Performance Standard'), id + ' must not fall back to generic headings');
    assert.ok(!headings.includes('Amount & Payment Schedule'), id + ' must not fall back to generic headings');
  }
});
