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


test('template profiles give distinct legal structures to specialized agreement families', async () => {
  const api = await import('./templateCatalog') as unknown as {
    buildTemplateDocument: (id: string) => import('../types/document').DocumentModel;
  };
  const expectations: Array<[string, RegExp, RegExp]> = [
    ['beat-license-agreement', /License Grant & Permitted Exploitation/i, /Territory, Term & Distribution Limits/i],
    ['music-collaboration-split-sheet', /Writer Contributions & Composition Shares/i, /Publisher Splits & Registration Duties/i],
    ['residential-lease-agreement', /Premises, Occupancy & Authorized Residents/i, /Rent, Deposits & Utility Allocation/i],
    ['real-estate-purchase-agreement', /Purchase Price, Earnest Money & Escrow/i, /Title, Survey & Closing Conditions/i],
    ['photography-services-agreement', /Creative Brief, Shot List & Production Plan/i, /Image License, Model Releases & Portfolio Rights/i],
    ['employment-offer-letter', /Position, Reporting Line & Start Conditions/i, /Base Pay, Incentives & Benefits/i],
    ['llc-operating-agreement', /Members, Purpose & Company Formation/i, /Capital Accounts, Allocations & Distributions/i],
    ['promissory-note', /Principal, Funding & Promise to Pay/i, /Interest, Maturity & Payment Application/i],
    ['saas-subscription-agreement', /Subscription Scope, Seats & Authorized Use/i, /Service Availability, Support & Maintenance/i],
    ['cybersecurity-incident-response', /Incident Scope, Authority & Response Activation/i, /Containment, Evidence Handling & Recovery/i],
    ['influencer-campaign-agreement', /Campaign Brief, Deliverables & Posting Calendar/i, /Disclosure, Usage Rights & Paid Amplification/i],
    ['bill-of-sale', /Goods, Seller Authority & Transfer/i, /Price, Delivery & Acceptance/i]
  ];
  for (const [id, firstHeading, secondHeading] of expectations) {
    const doc = api.buildTemplateDocument(id);
    const text = doc.sections.map(section => [
      section.title,
      section.content || '',
      ...section.clauses.map(clause => clause.heading + ' ' + clause.content)
    ].join('\\n')).join('\\n');
    assert.match(text, firstHeading, id + ' should use its specialized first provision');
    assert.match(text, secondHeading, id + ' should use its specialized second provision');
  }
});

test('specialized templates no longer reuse the same category-wide six-section outline', async () => {
  const api = await import('./templateCatalog') as unknown as {
    buildTemplateDocument: (id: string) => import('../types/document').DocumentModel;
  };
  const recording = api.buildTemplateDocument('recording-artist-agreement');
  const beatLicense = api.buildTemplateDocument('beat-license-agreement');
  const residentialLease = api.buildTemplateDocument('residential-lease-agreement');
  const purchase = api.buildTemplateDocument('real-estate-purchase-agreement');
  assert.notDeepEqual(recording.sections.map(section => section.title), beatLicense.sections.map(section => section.title));
  assert.notDeepEqual(residentialLease.sections.map(section => section.title), purchase.sections.map(section => section.title));
});


test('expanded template families receive their own operationally specific clause structures', async () => {
  const api = await import('./templateCatalog') as unknown as {
    buildTemplateDocument: (id: string) => import('../types/document').DocumentModel;
  };
  const expectations: Array<[string, RegExp, RegExp]> = [
    ['recording-artist-agreement', /Artist Engagement & Recording Commitment/i, /Master Ownership & Exploitation/i],
    ['music-producer-agreement', /Production Brief & Deliverables/i, /Producer Fee & Royalty Participation/i],
    ['featured-artist-agreement', /Featured Performance & Recording Scope/i, /Feature Fee, Royalty & Credit/i],
    ['music-management-agreement', /Management Appointment & Authority/i, /Commission Base & Accounting/i],
    ['live-performance-agreement', /Engagement, Venue & Performance/i, /Guarantee, Deposit & Settlement/i],
    ['master-services-agreement', /Services, Deliverables & Acceptance/i, /Fees, Expenses & Invoicing/i],
    ['confidentiality-agreement', /Protected Information & Purpose/i, /Permitted Disclosure & Safeguards/i],
    ['commercial-property-lease', /Commercial Premises & Permitted Use/i, /Operating Costs & Tenant Charges/i],
    ['property-management-agreement', /Property Portfolio & Management Appointment/i, /Rent Collection & Owner Accounting/i],
    ['graphic-design-services-agreement', /Design Brief & Creative Deliverables/i, /Source Files, Usage License & Portfolio/i],
    ['executive-employment-agreement', /Executive Appointment & Authority/i, /Compensation, Incentives & Equity/i],
    ['shareholders-agreement', /Share Capital & Shareholder Rights/i, /Board Composition & Reserved Matters/i],
    ['business-loan-agreement', /Facility, Borrower & Funding Conditions/i, /Interest, Repayment & Prepayment/i],
    ['api-license-agreement', /API Products & Licensed Access/i, /Rate Limits, Availability & Support/i],
    ['brand-sponsorship-agreement', /Sponsorship Property & Deliverables/i, /Sponsorship Fee & Performance Metrics/i],
    ['event-services-agreement', /Event Scope, Venue & Production Plan/i, /Ticketing, Revenue & Settlement/i]
  ];
  for (const [id, first, second] of expectations) {
    const doc = api.buildTemplateDocument(id);
    const headings = doc.sections.flatMap(section => [section.title, ...section.clauses.map(clause => clause.heading)]);
    assert.ok(headings.some(value => first.test(value)), id + ' must have a family-specific opening provision');
    assert.ok(headings.some(value => second.test(value)), id + ' must have a family-specific commercial or operational provision');
  }
});
