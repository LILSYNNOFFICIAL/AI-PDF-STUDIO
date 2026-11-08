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

test('converts Markdown tables and explicit signature parties into editable document objects', () => {
  const source = [
    '# Recording Agreement', '',
    '## 1. ROYALTY SPLITS', '',
    '| Party | Share |', '| --- | --- |', '| Artist | 50% |', '| Producer | 50% |', '',
    '## SIGNATURES', '',
    'ARTIST', 'By: Alex Example', 'Signature: __________________', 'Date: __________', '',
    'PRODUCER', 'By: Sam Example', 'Signature: __________________', 'Date: __________'
  ].join('\n');
  const doc = parseTextDocument(source, base);
  assert.equal(doc.sections[0].tables?.length, 1);
  assert.deepEqual(doc.sections[0].tables?.[0].headers.map(cell => cell.content), ['Party', 'Share']);
  assert.equal(doc.sections[0].tables?.[0].rows.length, 2);
  assert.equal(doc.signatures?.parties.length, 2);
  assert.equal(doc.signatures?.parties[0].name, 'Alex Example');
  assert.equal(doc.signatures?.parties[1].role, 'PRODUCER');
  assert.equal(doc.sourceText, source);
});

test('keeps explicit Markdown section numbering and classifies Markdown appendices', () => {
  const source = [
    '# Contract', '',
    '## 4. PARTIES', 'The parties are identified here.', '',
    '# APPENDIX A. EXHIBITS', 'Exhibit A is attached.'
  ].join('\n');
  const doc = parseTextDocument(source, base);
  const mainSection = doc.sections.find(section => /PARTIES/.test(section.title));
  const appendix = doc.sections.find(section => /APPENDIX A/.test(section.title));
  assert.equal(mainSection?.sectionNumber, '4');
  assert.equal(appendix?.isAppendix, true);
  assert.match(appendix?.content || '', /Exhibit A is attached/);
});

test('reports a signature heading even when no participant details can be safely extracted', () => {
  const source = '# Contract\n\n## SIGNATURES\n\nExecuted by the parties on the date written below.';
  const doc = parseTextDocument(source, base);
  assert.equal(doc.sourceIntegrity?.detectedSignatureSection, true);
  assert.equal(doc.sourceIntegrity?.signaturePartyCount, 0);
  assert.match(doc.sections.find(section => /SIGNATURES/.test(section.title))?.content || '', /Executed by the parties/);
});


test('keeps bracket-delimited reference material in one scrollable block within its parent section', () => {
  const source = [
    '# Collaboration Agreement',
    '',
    '## 17. LIL SYNN CHARACTER REFERENCE AND UNIVERSE',
    'The following reference material governs the recurring characters.',
    '',
    '[[',
    '# MASTER CHARACTER REFERENCE',
    'LIL SYNN remains faceless in every scene.',
    '## THE SHADOW MAN',
    'The Shadow Man wears a dark hood.',
    '## THE GIRL',
    'The Girl wears a yellow dress.',
    '## THE BLACK MAINE COON',
    'A black Maine Coon appears throughout the universe.',
    ']]',
    '',
    '## 18. REPRESENTATIONS, CLEARANCES AND RESPONSIBILITY',
    'The parties remain responsible for all required clearances.'
  ].join('\n');

  const doc = parseTextDocument(source, base, '2026-01-01T00:00:00.000Z');
  const reference = doc.sections.find(section => /LIL SYNN CHARACTER REFERENCE/.test(section.title));
  const next = doc.sections.find(section => /REPRESENTATIONS, CLEARANCES/.test(section.title));

  assert.ok(reference, 'Section 17 should remain a single section');
  assert.ok(next, 'Section 18 should remain a separate following section');
  assert.equal(reference.scrollableContent, [
    '# MASTER CHARACTER REFERENCE',
    'LIL SYNN remains faceless in every scene.',
    '## THE SHADOW MAN',
    'The Shadow Man wears a dark hood.',
    '## THE GIRL',
    'The Girl wears a yellow dress.',
    '## THE BLACK MAINE COON',
    'A black Maine Coon appears throughout the universe.'
  ].join('\n'));
  assert.match(reference.content || '', /following reference material governs/);
  assert.doesNotMatch(reference.content || '', /MASTER CHARACTER REFERENCE/);
  assert.match(next.content || '', /required clearances/);
  assert.equal(doc.sections.filter(section => /MASTER CHARACTER REFERENCE|SHADOW MAN|THE GIRL|MAINE COON/.test(section.title)).length, 0);
  assert.equal(doc.sourceText, source);
});

test('rejects unmatched bracket delimiters rather than silently flattening the reference block', () => {
  const source = '# Agreement\n\n## 17. CHARACTER REFERENCE\n[[\nReference content';
  assert.throws(() => parseTextDocument(source, base), /unmatched|closing.*\\]\\]/i);
});


test('treats a standalone @ line as an image-header marker rather than document body text', () => {
  const source = [
    '# Image Header Agreement',
    '',
    '@',
    '',
    '## 1. PARTIES',
    'The parties are identified here.'
  ].join('\n');
  const doc = parseTextDocument(source, base, '2026-01-01T00:00:00.000Z');
  const body = doc.sections.map(section => section.content || '').join('\n');
  assert.equal(doc.imageHeaderRequested, true);
  assert.doesNotMatch(body, /^\s*@\s*$/m);
  assert.equal(doc.sourceText, source);
});


test('supports the image-header marker before the document title', () => {
  const source = ['@', '# Header Image Agreement', '', 'Opening paragraph.'].join('\\n');
  const doc = parseTextDocument(source, base, '2026-01-01T00:00:00.000Z');
  assert.equal(doc.title, 'Header Image Agreement');
  assert.equal(doc.imageHeaderRequested, true);
  assert.match(doc.sections[0].content || '', /Opening paragraph/);
});
