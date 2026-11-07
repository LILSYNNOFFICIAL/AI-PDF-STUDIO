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

test('imports numbered agreement sections and appendix without losing nested headings or text', () => {
  const source = [
    '# MUSIC COLLABORATION AGREEMENT', '## “SHADOWS”', '',
    '## 1. PARTIES', 'Party A text.', '',
    '## 2. PROJECT', 'Project text.', '',
    '## 17. CHARACTER REFERENCE', '### 1. PRESERVE IDENTITY', 'Nested content.', '',
    '# APPENDIX A. REFERENCES', 'https://example.com', '',
    '# IMPORTANT REVIEW NOTE', 'Review text.'
  ].join('\n');
  const doc = parseTextDocument(source, base, '2026-01-01T00:00:00.000Z');
  assert.equal(doc.title, 'MUSIC COLLABORATION AGREEMENT “SHADOWS”');
  assert.equal(doc.sections.length, 5);
  assert.equal(doc.sections[0].sectionNumber, '1.0');
  assert.equal(doc.sections[2].content, '### 1. PRESERVE IDENTITY\nNested content.');
  assert.equal(doc.sections[3].isAppendix, true);
  assert.equal(doc.sections[3].content, 'https://example.com');
  assert.equal(doc.sections[4].title, 'IMPORTANT REVIEW NOTE');
});

test('rejects empty and unstructured input instead of silently importing a blank document', () => {
  assert.throws(() => parseTextDocument('  ', base), /empty/i);
  assert.throws(() => parseTextDocument('Just a paragraph', base), /No numbered sections/i);
});
