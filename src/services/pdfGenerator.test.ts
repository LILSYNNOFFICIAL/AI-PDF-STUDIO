import test from 'node:test';
import assert from 'node:assert/strict';
import { buildDocumentFromPrompt } from '../orchestrator/orchestrator';
import { generatePdfDocument } from './pdfGenerator';
import { applyDocumentPreset } from './documentDesign';

function outputText(pdf: ReturnType<typeof generatePdfDocument>): string {
  return pdf.output();
}

test('long paragraphs paginate line by line and retain beginning and ending text', () => {
  const doc = buildDocumentFromPrompt('Agreement').updatedDoc;
  doc.sections = [{
    ...doc.sections[0],
    content: [
      'PARAGRAPH-START-UNIQUE',
      ...Array.from({ length: 420 }, (_, index) => `Long preserved source sentence number ${index + 1} with exact wording and punctuation.`),
      'PARAGRAPH-END-UNIQUE'
    ].join(' ')
  }];
  const pdf = generatePdfDocument(doc);
  const text = outputText(pdf);

  assert.ok(pdf.getNumberOfPages() > 3, `Expected multi-page flow, received ${pdf.getNumberOfPages()} pages`);
  assert.ok(text.includes('PARAGRAPH-START-UNIQUE'));
  assert.ok(text.includes('PARAGRAPH-END-UNIQUE'));
});

test('long table cells wrap and table headers repeat across pages', () => {
  const doc = buildDocumentFromPrompt('Agreement').updatedDoc;
  doc.sections = [{
    ...doc.sections[0],
    tables: [{
      id: 'table-regression',
      title: 'PAGINATED TABLE',
      headers: [
        { id: 'h1', content: 'PARTY' },
        { id: 'h2', content: 'DETAILS' }
      ],
      rows: Array.from({ length: 28 }, (_, index) => [
        { id: `r${index}-c1`, content: `ROW-${index + 1}` },
        {
          id: `r${index}-c2`,
          content: `TABLE-CELL-START-${index + 1} ${'Preserve this long table cell wording across wrapped lines. '.repeat(9)} TABLE-CELL-END-${index + 1}`
        }
      ])
    }]
  }];
  const pdf = generatePdfDocument(doc);
  const text = outputText(pdf);

  assert.ok(pdf.getNumberOfPages() > 1);
  assert.ok(text.includes('TABLE-CELL-START-1'));
  assert.ok(text.includes('TABLE-CELL-END-28'));
  const repeatedHeaders = text.match(/\(PARTY\)/g) || [];
  assert.ok(repeatedHeaders.length > 1, 'Expected the table header to repeat after a page break');
});


test('design presets, page gradients, section fills, borders and table overrides render to PDF', async () => {
  const {
    applyDocumentPreset,
    normalizeDocumentDesign
  } = await import('./documentDesign');
  const doc = normalizeDocumentDesign(buildDocumentFromPrompt('Agreement').updatedDoc);
  doc.pageConfig.headerText = 'DESIGN THEME HEADER';
  doc.pageConfig.footerText = 'DESIGN THEME FOOTER';
  doc.design = {
    ...doc.design!,
    page: {
      background: {
        type: 'linear-gradient',
        angle: 135,
        opacity: 0.18,
        stops: [
          { color: '#f8fafc', position: 0 },
          { color: '#dbeafe', position: 100 }
        ]
      },
      firstPageBackground: { type: 'solid', color: '#ffffff' }
    }
  };
  doc.sections = [{
    ...doc.sections[0],
    content: [
      'DESIGN-PDF-BEGIN',
      ...Array.from({ length: 180 }, (_, index) => 'Styled section paragraph ' + (index + 1) + ' must remain selectable and present after export.'),
      'DESIGN-PDF-END'
    ].join(' '),
    design: {
      background: {
        type: 'linear-gradient',
        angle: 90,
        stops: [
          { color: '#eff6ff', position: 0 },
          { color: '#ffffff', position: 100 }
        ]
      },
      bodyTextColor: '#243247',
      headingColor: '#123456',
      border: { style: 'dashed', color: '#2563eb', width: 1, sides: ['left', 'bottom'] },
      padding: 4
    },
    tables: [{
      id: 'design-table',
      title: 'DESIGN TABLE TITLE',
      caption: 'Design table caption',
      headers: [
        { id: 'h1', content: 'DESIGN COLUMN A' },
        { id: 'h2', content: 'DESIGN COLUMN B' }
      ],
      rows: [
        [{ id: 'r1c1', content: 'DESIGN CELL ONE', bg: '#ffeedd' }, { id: 'r1c2', content: 'DESIGN CELL TWO' }],
        [{ id: 'r2c1', content: 'DESIGN CELL THREE' }, { id: 'r2c2', content: 'DESIGN CELL FOUR' }]
      ],
      design: {
        headerBackground: { type: 'solid', color: '#102a43' },
        headerTextColor: '#ffffff',
        bodyBackground: { type: 'solid', color: '#f8fafc' },
        bodyTextColor: '#243247',
        alternateRowBackground: { type: 'solid', color: '#e0f2fe' },
        gridlineColor: '#64748b',
        gridlineWidth: 0.6,
        captionColor: '#475569'
      }
    }]
  }];
  doc.signatures = {
    id: 'design-signatures',
    title: 'DESIGN SIGNATURES',
    layout: 'stacked',
    onDedicatedPage: true,
    parties: [{
      id: 'design-signer',
      role: 'ARTIST',
      name: 'DESIGN SIGNER',
      title: 'Recording Artist',
      company: 'Example Music LLC',
      date: 'November 7, 2026',
      signaturePlaceholder: '/s/ DESIGN SIGNER'
    }]
  };
  const presetDesign = applyDocumentPreset(doc, 'technology-professional').design!;
  doc.design = {
    ...presetDesign,
    page: {
      ...presetDesign.page,
      background: {
        type: 'linear-gradient',
        angle: 135,
        opacity: 0.18,
        stops: [
          { color: '#f8fafc', position: 0 },
          { color: '#dbeafe', position: 100 }
        ]
      }
    }
  };

  const pdf = generatePdfDocument(doc);
  const output = outputText(pdf);

  assert.ok(pdf.getNumberOfPages() > 1, 'Styled document should paginate while retaining its background');
  for (const marker of [
    'DESIGN-PDF-BEGIN',
    'DESIGN-PDF-END',
    'DESIGN TABLE TITLE',
    'DESIGN COLUMN A',
    'DESIGN CELL FOUR',
    'DESIGN THEME HEADER',
    'DESIGN THEME FOOTER',
    'DESIGN SIGNATURES',
    'DESIGN SIGNER'
  ]) {
    assert.ok(output.includes(marker), 'Expected exported PDF to contain ' + marker);
  }
});

test('PDF export includes all text from the scrollable editor block in normal document flow', () => {
  const doc = buildDocumentFromPrompt('Agreement').updatedDoc;
  doc.sections = [{
    ...doc.sections[0],
    content: 'SECTION-INTRO-RETAINED',
    scrollableContent: [
      'SCROLLABLE-BLOCK-BEGIN',
      ...Array.from({ length: 80 }, (_, index) => `Reference line ${index + 1} remains present in the exported PDF. REFERENCE-LINE-${index + 1}-END`),
      'SCROLLABLE-BLOCK-END'
    ].join(' ')
  }];
  const pdf = generatePdfDocument(doc);
  const text = outputText(pdf);

  assert.ok(pdf.getNumberOfPages() > 1, 'Long scrollable source material should paginate in PDF output');
  assert.ok(text.includes('SECTION-INTRO-RETAINED'));
  assert.ok(text.includes('SCROLLABLE-BLOCK-BEGIN'));
  assert.ok(text.includes('REFERENCE-LINE-80-END'));
  assert.ok(text.includes('SCROLLABLE-BLOCK-END'));
});


test('page-header and section images are embedded in multi-page PDF output', () => {
  const doc = buildDocumentFromPrompt('Image Header Agreement').updatedDoc;
  const pixel = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGP4//8/AAX+Av4N70a4AAAAAElFTkSuQmCC';
  const image = {
    id: 'test-image',
    url: pixel,
    altText: 'Test pixel',
    caption: 'IMAGE-CAPTION-TEST',
    widthPercent: 50,
    alignment: 'center' as const
  };
  doc.imageHeaderRequested = true;
  doc.pageHeaderImages = [image];
  doc.sections = [{
    ...doc.sections[0],
    content: 'PDF-IMAGE-HEADER-START ' + 'Long page content. '.repeat(500),
    images: [image]
  }];
  const pdf = generatePdfDocument(doc);
  const output = pdf.output();
  assert.ok(pdf.getNumberOfPages() > 1, 'Expected image-header document to paginate');
  assert.ok(output.includes('/Subtype /Image'), 'Expected the selected image to be embedded in the PDF');
  assert.ok(output.includes('IMAGE-CAPTION-TEST'));
  const pages = (pdf as any).internal.pages as string[][];
  const firstPageContent = pages[1].join('');
  const secondPageContent = pages[2].join('');
  assert.match(firstPageContent, /\/I\d+ Do/, 'The leading @ image should appear on the first page');
  assert.doesNotMatch(secondPageContent, /\/I\d+ Do/, 'The leading @ image must not repeat on later pages');
});


test('premium enabled cover page renders as a separate first page before agreement content', async () => {
  const { applyDocumentPreset, normalizeDocumentDesign } = await import('./documentDesign');
  const doc = normalizeDocumentDesign(buildDocumentFromPrompt('Cover page rendering').updatedDoc);
  doc.title = 'MIDNIGHT EXECUTIVE COVER TITLE';
  doc.author = 'COVER AUTHOR';
  doc.sections = [{
    ...doc.sections[0],
    sectionNumber: '1.0',
    title: 'FIRST CONTENT SECTION',
    content: 'BODY MUST BEGIN AFTER COVER PAGE',
    clauses: [],
    tables: [],
    charts: [],
    images: []
  }];
  doc.signatures = undefined;
  doc.imageHeaderRequested = false;
  doc.pageHeaderImages = [];
  doc.pageConfig.headerText = 'RUNNING HEADER ON CONTENT PAGES';
  doc.pageConfig.footerText = 'RUNNING FOOTER ON CONTENT PAGES';
  const themed = applyDocumentPreset(doc, 'midnight-executive');
  const pdf = generatePdfDocument(themed);
  assert.equal(pdf.getNumberOfPages(), 2, 'Expected one cover page and one content page');
  const pages = (pdf as any).internal.pages as string[][];
  const coverPage = pages[1].join('');
  const contentPage = pages[2].join('');
  assert.ok(coverPage.includes('(MIDNIGHT EXECUTIVE)'));
  assert.ok(coverPage.includes('(COVER TITLE)'));
  assert.ok(coverPage.includes('AGREEMENT'));
  assert.ok(coverPage.includes('COVER AUTHOR'));
  assert.ok(!coverPage.includes('BODY MUST BEGIN AFTER COVER PAGE'));
  assert.ok(!coverPage.includes('RUNNING HEADER ON CONTENT PAGES'));
  assert.ok(!coverPage.includes('RUNNING FOOTER ON CONTENT PAGES'));
  assert.ok(contentPage.includes('BODY MUST BEGIN AFTER COVER PAGE'));
  assert.ok(contentPage.includes('RUNNING HEADER ON CONTENT PAGES'));
  assert.ok(contentPage.includes('RUNNING FOOTER ON CONTENT PAGES'));
});

test('disabled cover page keeps title and body content together on the first page', () => {
  const doc = buildDocumentFromPrompt('Cover page disabled').updatedDoc;
  doc.title = 'NO COVER TITLE';
  doc.sections = [{
    ...doc.sections[0],
    sectionNumber: '1.0',
    title: 'FIRST CONTENT SECTION',
    content: 'NO COVER BODY',
    clauses: [],
    tables: [],
    charts: [],
    images: []
  }];
  doc.signatures = undefined;
  doc.imageHeaderRequested = false;
  doc.pageHeaderImages = [];
  const pdf = generatePdfDocument(doc);
  const pages = (pdf as any).internal.pages as string[][];
  const firstPage = pages[1].join('');

  assert.equal(pdf.getNumberOfPages(), 1);
  assert.ok(firstPage.includes('NO COVER TITLE'));
  assert.ok(firstPage.includes('NO COVER BODY'));
});


test('cover page embeds the selected brand logo instead of printing a static BRAND placeholder', async () => {
  const { normalizeDocumentDesign } = await import('./documentDesign');
  const doc = normalizeDocumentDesign(buildDocumentFromPrompt('Brand logo cover test').updatedDoc);
  doc.design = {
    ...doc.design!,
    coverPage: { ...doc.design!.coverPage, enabled: true, showLogoPlaceholder: true }
  };
  doc.brandName = 'SYNTIENT RECORDS';
  doc.brandLogoUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGOQq/jwHwAExAKGMOAiWwAAAABJRU5ErkJggg==';
  const pdf = generatePdfDocument(doc);
  const output = outputText(pdf);

  assert.match(output, /\/Subtype \/Image/);
  assert.ok(!output.includes('(BRAND)'));
});


test('PDF cover artwork renders safely for every template category and LIL SYNN', () => {
  const categories = [
    'Music & Entertainment', 'Business & Commercial', 'Real Estate & Rentals',
    'Creative & Freelance', 'Employment & HR', 'Corporate & Legal',
    'Finance & Investment', 'Technology & Data', 'Marketing & Partnerships',
    'Personal & General', 'lil-synn'
  ];
  for (const artworkCategory of categories) {
    const base = applyDocumentPreset(buildDocumentFromPrompt('Cover artwork verification').updatedDoc, 'midnight-executive');
    const document = {
      ...base,
      design: {
        ...base.design!,
        coverPage: { ...base.design!.coverPage, enabled: true, style: 'modern-graphic' as const, artworkCategory }
      }
    };
    const pdf = generatePdfDocument(document);
    assert.ok(pdf.getNumberOfPages() >= 2, 'Expected cover plus document pages for ' + artworkCategory);
    assert.ok(outputText(pdf).length > 1000, 'Expected PDF content for ' + artworkCategory);
  }
});


test('exports the editable right-side running header label', () => {
  const doc = buildDocumentFromPrompt('Editable running header').updatedDoc;
  doc.pageConfig.headerRightText = 'INTERNAL DRAFT';
  const text = outputText(generatePdfDocument(doc));
  assert.ok(text.includes('INTERNAL DRAFT'));
});


test('exports customizable labels for each signatory detail field', () => {
  const doc = buildDocumentFromPrompt('Custom signatory labels').updatedDoc;
  doc.signatures = {
    id: 'custom-label-signature-block',
    title: 'EXECUTION',
    executionText: 'The parties sign below.',
    parties: [{
      id: 'custom-label-party',
      role: 'AUTHORIZED SIGNATORY',
      name: 'Alex Example',
      nameLabel: 'Signer',
      title: 'Chief Executive Officer',
      titleLabel: 'Position',
      company: 'Example Corporation',
      companyLabel: 'Organization',
      date: '2026-11-11',
      dateLabel: 'Signed on'
    }]
  };
  const text = outputText(generatePdfDocument(doc));
  assert.ok(text.includes('Signer: Alex Example'));
  assert.ok(text.includes('Position: Chief Executive Officer'));
  assert.ok(text.includes('Organization: Example Corporation'));
  assert.ok(text.includes('Signed on: 2026-11-11'));
});


test('cover page exports user-editable author label and date text', () => {
  const doc = normalizeDocumentDesign(buildDocumentFromPrompt('Editable cover metadata').updatedDoc);
  doc.design = {
    ...doc.design!,
    coverPage: { ...doc.design!.coverPage, enabled: true }
  };
  doc.author = 'LIL SYNN';
  doc.coverAuthorLabel = 'CREATED FOR';
  doc.coverDateText = 'CUSTOM RELEASE DATE';
  const text = outputText(generatePdfDocument(doc));
  assert.ok(text.includes('CREATED FOR'));
  assert.ok(text.includes('CUSTOM RELEASE DATE'));
  assert.ok(text.includes('LIL SYNN'));
  assert.ok(!text.includes('PREPARED BY'));
});
