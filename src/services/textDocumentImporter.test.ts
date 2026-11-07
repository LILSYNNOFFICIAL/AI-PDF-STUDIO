import test from 'node:test';
import assert from 'node:assert/strict';
import { parseTextDocument } from './textDocumentImporter.ts';
import type { DocumentModel } from '../types/document';

const base = {
  id: 'base', title: 'Base', type: 'general', version: 1, createdAt: '', updatedAt: '',
  author: 'Test', styles: { fontFamily: 'Times New Roman', fontSize: 11, lineHeight: 1.5, paragraphSpacing: 12, primaryColor: '#000000', accentColor: '#000000', headingFont: 'Times New Roman', heading1Size: 18, heading2Size: 14, heading3Size: 12, headingCase: 'none', alignment: 'left' },
  pageConfig: { pageSize: 'LETTER', orientation: 'portrait', margins: {top:25,bottom:25,left:25,right:25}, headerText:'', footerText:'', showPageNumbers:true, pageNumberFormat:'PAGE_X', firstPageDifferent:false },
  sections: []
} as unknown as DocumentModel;

test('renders ordinary pasted text even when it has no recognized heading syntax', () => {
  const source = 'Collaboration Agreement\n\nThe parties agree to collaborate.\n\nPayment is due within thirty days.';
  const doc = parseTextDocument(source, base, '2026-01-01T00:00:00.000Z');
  assert.equal(doc.sourceText, source);
  assert.equal(doc.sections.length, 1);
  assert.match(doc.sections[0].content || '', /The parties agree to collaborate/);
  assert.match(doc.sections[0].content || '', /Payment is due within thirty days/);
});

test('recognizes common heading styles while preserving every source line in the source of truth', () => {
  const source = [
    'MUSIC COLLABORATION AGREEMENT', '',
    '1. PARTIES', 'Party A and Party B agree.', '',
    '2.1 Ownership and Rights', 'The parties own the work equally.', '',
    'PAYMENT TERMS', 'Payment is due within thirty days.', '',
    'SIGNATURES', 'Artist: ____________________', 'Producer: ____________________'
  ].join('\n');
  const doc = parseTextDocument(source, base, '2026-01-01T00:00:00.000Z');
  assert.equal(doc.sourceText, source);
  assert.ok(doc.sections.length >= 3);
  assert.ok(doc.sections.some(section => /PARTIES/i.test(section.title)));
  assert.ok(doc.sections.some(section => /Ownership and Rights/i.test(section.title)));
  assert.ok(doc.sections.some(section => /PAYMENT TERMS/i.test(section.title)));
  const represented = doc.sections.map(section => [section.sourceHeading || '', section.content || ''].join('\n')).join('\n');
  for (const required of ['Party A and Party B agree.', 'The parties own the work equally.', 'Payment is due within thirty days.', 'Artist: ____________________', 'Producer: ____________________']) {
    assert.ok(represented.includes(required), 'missing source content: ' + required);
  }
});

test('rejects only empty input and does not require a numbered section heading', () => {
  assert.throws(() => parseTextDocument('  ', base), /empty/i);
  const doc = parseTextDocument('A single unstructured paragraph that must survive.', base);
  assert.match(doc.sections[0].content || '', /must survive/);
});
