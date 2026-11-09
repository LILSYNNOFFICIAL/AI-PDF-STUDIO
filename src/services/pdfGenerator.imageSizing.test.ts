import test from 'node:test';
import assert from 'node:assert/strict';
import { buildDocumentFromPrompt } from '../orchestrator/orchestrator';
import { generatePdfDocument } from './pdfGenerator';
import { normalizeDocumentDesign } from './documentDesign';
import type { DocumentModel, ImageBlock } from '../types/document';

const squarePixel = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGOQq/jwHwAExAKGMOAiWwAAAABJRU5ErkJggg==';
const landscapePixel = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAABCAYAAAD0In+KAAAADklEQVR4nGOQq/jwH4QBE5sFC613TjIAAAAASUVORK5CYII=';
const portraitPixel = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAACCAYAAACZgbYnAAAAEElEQVR4nGOQq/jwnwFEAAAWIQUL6Dcm/wAAAABJRU5ErkJggg==';
const tallPixel = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAECAYAAABP2FU6AAAAEElEQVR4nGOQq/jwnwGVAABepgoVIs5ydQAAAABJRU5ErkJggg==';

interface ImagePlacement {
  widthPoints: number;
  heightPoints: number;
  xPoints: number;
  yPoints: number;
}

function makeImage(id: string, url: string, widthPercent = 80): ImageBlock {
  return { id, url, widthPercent, alignment: 'center', altText: id };
}

function makeHeaderDocument(
  images: ImageBlock[],
  orientation: 'portrait' | 'landscape' = 'portrait'
): DocumentModel {
  const doc = buildDocumentFromPrompt('Header image sizing').updatedDoc;
  doc.title = 'HEADER-FIT-TITLE';
  doc.pageConfig = {
    ...doc.pageConfig,
    orientation,
    headerText: '',
    margins: { top: 25, bottom: 25, left: 25, right: 25 }
  };
  doc.imageHeaderRequested = true;
  doc.pageHeaderImages = images;
  doc.sections = [{
    ...doc.sections[0],
    content: 'HEADER-BODY-MARKER'
  }];
  return doc;
}

function imagePlacements(doc: DocumentModel, pageNumber = 1): ImagePlacement[] {
  const pdf = generatePdfDocument(doc);
  const pages = (pdf as any).internal.pages as string[][];
  const content = pages[pageNumber]?.join('') || '';
  const expression = /([-0-9.]+)\s+0\s+0\s+([-0-9.]+)\s+([-0-9.]+)\s+([-0-9.]+)\s+cm\s*\/I\d+\s+Do/g;
  return [...content.matchAll(expression)].map(match => ({
    widthPoints: Math.abs(Number(match[1])),
    heightPoints: Math.abs(Number(match[2])),
    xPoints: Number(match[3]),
    yPoints: Number(match[4])
  }));
}

const pointsToMillimeters = (points: number) => points * 25.4 / 72;

test('PDF header image width follows the saved editor width instead of a fixed thumbnail size', () => {
  const smaller = imagePlacements(makeHeaderDocument([makeImage('small', squarePixel, 20)]))[0];
  const enlarged = imagePlacements(makeHeaderDocument([makeImage('large', squarePixel, 80)]))[0];

  assert.ok(smaller, 'Expected the 20% image to be embedded in the PDF');
  assert.ok(enlarged, 'Expected the 80% image to be embedded in the PDF');
  assert.ok(
    enlarged.widthPoints > smaller.widthPoints * 3.9,
    `Expected 80% image to be about four times wider than 20%; got ${smaller.widthPoints}pt and ${enlarged.widthPoints}pt`
  );
});

test('PDF rendering preserves portrait and landscape image aspect ratios', () => {
  const landscape = imagePlacements(makeHeaderDocument([makeImage('landscape', landscapePixel, 70)]))[0];
  const portrait = imagePlacements(makeHeaderDocument([makeImage('portrait', portraitPixel, 70)]))[0];

  assert.ok(landscape && portrait, 'Expected both aspect-ratio fixtures to render');
  assert.ok(Math.abs(landscape.widthPoints / landscape.heightPoints - 2) < 0.02);
  assert.ok(Math.abs(portrait.widthPoints / portrait.heightPoints - 0.5) < 0.02);
});

test('multiple @ images render in separate non-overlapping slots on the same row', () => {
  const placements = imagePlacements(makeHeaderDocument([
    makeImage('first', squarePixel, 100),
    makeImage('second', squarePixel, 100)
  ])).sort((left, right) => left.xPoints - right.xPoints);

  assert.equal(placements.length, 2, 'Expected both selected images to be embedded');
  assert.ok(
    placements[0].xPoints + placements[0].widthPoints < placements[1].xPoints,
    'Expected a visible gap between adjacent images'
  );
  assert.ok(
    Math.abs(placements[0].yPoints - placements[1].yPoints) < 0.01,
    'Expected both images to share a row'
  );
});

test('very tall @ images stay inside the page content area and leave room for the document title', () => {
  const doc = makeHeaderDocument([makeImage('very-tall', tallPixel, 100)]);
  const pdf = generatePdfDocument(doc);
  const pages = (pdf as any).internal.pages as string[][];
  const firstPageContent = pages[1].join('');
  const placement = imagePlacements(doc)[0];
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margins = doc.pageConfig.margins;
  const bottomLimit = pageHeight - margins.bottom - 10;
  const reservedContentHeight = 42;
  const maximumImageHeight = bottomLimit - margins.top - reservedContentHeight;

  assert.ok(placement, 'Expected the tall image to be embedded');
  assert.ok(
    pointsToMillimeters(placement.heightPoints) <= maximumImageHeight + 0.2,
    `Expected image height <= ${maximumImageHeight.toFixed(1)}mm, got ${pointsToMillimeters(placement.heightPoints).toFixed(1)}mm`
  );
  assert.ok(firstPageContent.includes('HEADER-FIT-TITLE'), 'Expected the document title to remain on the first page');
});

test('legacy header images without a saved width use the same 80% default as the editor', () => {
  const image = makeImage('legacy-image', squarePixel);
  delete image.widthPercent;
  const doc = makeHeaderDocument([image]);
  const placement = imagePlacements(doc)[0];
  const pdf = generatePdfDocument(doc);
  const contentWidth = pdf.internal.pageSize.getWidth() - doc.pageConfig.margins.left - doc.pageConfig.margins.right;

  assert.ok(placement, 'Expected the legacy image to render');
  assert.ok(Math.abs(pointsToMillimeters(placement.widthPoints) - contentWidth * 0.8) < 0.2);
});

test('wide images keep their requested width on landscape pages when height allows it', () => {
  const doc = makeHeaderDocument([makeImage('wide-landscape', landscapePixel, 80)], 'landscape');
  const placement = imagePlacements(doc)[0];
  const pdf = generatePdfDocument(doc);
  const contentWidth = pdf.internal.pageSize.getWidth() - doc.pageConfig.margins.left - doc.pageConfig.margins.right;

  assert.ok(placement, 'Expected the landscape page image to render');
  assert.ok(Math.abs(pointsToMillimeters(placement.widthPoints) - contentWidth * 0.8) < 0.2);
});

test('leading @ images honor left, center and right alignment within their own slots', () => {
  const left = makeImage('left-aligned', squarePixel, 50);
  const center = makeImage('center-aligned', squarePixel, 50);
  const right = makeImage('right-aligned', squarePixel, 50);
  left.alignment = 'left';
  center.alignment = 'center';
  right.alignment = 'right';
  const doc = makeHeaderDocument([left, center, right]);
  const placements = imagePlacements(doc).sort((a, b) => a.xPoints - b.xPoints);
  const pageWidth = generatePdfDocument(doc).internal.pageSize.getWidth();
  const margins = doc.pageConfig.margins;
  const contentWidth = pageWidth - margins.left - margins.right;
  const gap = 3;
  const slotWidth = (contentWidth - gap * 2) / 3;
  const expectedLeft = margins.left;
  const expectedRight = margins.left + 2 * (slotWidth + gap) + slotWidth * 0.5;

  assert.equal(placements.length, 3);
  assert.ok(Math.abs(pointsToMillimeters(placements[0].xPoints) - expectedLeft) < 0.2);
  assert.ok(Math.abs(pointsToMillimeters(placements[1].xPoints) - (margins.left + slotWidth + gap + slotWidth * 0.25)) < 0.2);
  assert.ok(Math.abs(pointsToMillimeters(placements[2].xPoints) - expectedRight) < 0.2);
});

test('leading @ image captions are included in the PDF when the header image is the only image', () => {
  const image = makeImage('captioned-header', squarePixel, 70);
  image.caption = 'HEADER-ONLY-CAPTION-MARKER';
  const pdf = generatePdfDocument(makeHeaderDocument([image]));
  assert.ok(pdf.output().includes('HEADER-ONLY-CAPTION-MARKER'));
});

test('resized header dimensions survive the document JSON save and reopen round trip', () => {
  const original = makeHeaderDocument([makeImage('saved-image', squarePixel, 80)]);
  const reopened = JSON.parse(JSON.stringify(original)) as DocumentModel;
  assert.equal(reopened.pageHeaderImages?.[0]?.widthPercent, 80);

  const originalPlacement = imagePlacements(original)[0];
  const reopenedPlacement = imagePlacements(reopened)[0];
  assert.ok(originalPlacement && reopenedPlacement);
  assert.equal(reopenedPlacement.widthPoints, originalPlacement.widthPoints);
});


test('cover logo width follows the persisted editor resize value in PDF output', () => {
  const makeLogoDocument = (widthPercent: number) => {
    const doc = normalizeDocumentDesign(buildDocumentFromPrompt('Cover logo sizing').updatedDoc);
    doc.design!.coverPage.enabled = true;
    doc.design!.coverPage.showLogoPlaceholder = true;
    doc.brandLogoUrl = squarePixel;
    (doc as DocumentModel & { brandLogoWidthPercent?: number }).brandLogoWidthPercent = widthPercent;
    return doc;
  };
  const coverLogoWidth = (doc: DocumentModel) => {
    const placement = imagePlacements(doc)[0];
    assert.ok(placement, 'Expected the cover logo image to be embedded on page one');
    return placement.widthPoints;
  };
  const small = coverLogoWidth(makeLogoDocument(50));
  const large = coverLogoWidth(makeLogoDocument(150));
  assert.ok(large > small * 2.9, `Expected 150% logo to be three times 50%; got ${small}pt and ${large}pt`);
});
