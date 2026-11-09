import test from 'node:test';
import assert from 'node:assert/strict';
import { buildDocumentFromPrompt } from '../orchestrator/orchestrator';
import { generatePdfDocument } from './pdfGenerator';

const pixel = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGP4//8/AAX+Av4N70a4AAAAAASUVORK5CYII';

function renderedHeaderImageWidth(widthPercent: number): number {
  const doc = buildDocumentFromPrompt('Header image sizing').updatedDoc;
  doc.imageHeaderRequested = true;
  doc.pageHeaderImages = [{
    id: 'header-size-test',
    url: pixel,
    widthPercent,
    alignment: 'center'
  }];
  const output = generatePdfDocument(doc).output();
  const matrices = [...output.matchAll(/([\d.]+) 0 0 ([\d.]+) [\d.]+ [\d.]+ cm\s*\/I\d+ Do/g)];
  assert.ok(matrices.length > 0, 'Expected a positioned image in the PDF page content');
  return Number(matrices[0][1]);
}

test('PDF header image width follows the saved editor width instead of a fixed thumbnail height', () => {
  const smaller = renderedHeaderImageWidth(20);
  const enlarged = renderedHeaderImageWidth(80);
  assert.ok(enlarged > smaller * 3, `Expected 80% image to be substantially wider than 20% image; got ${smaller}mm and ${enlarged}mm`);
});
