import test from 'node:test';
import assert from 'node:assert/strict';
import { 
  buildDocumentFromPrompt, 
  recalculateNumbering, 
  mergeSections, 
  splitSection, 
  reorganizeDocument, 
  applyFormatting, 
  assessDocumentQuality, 
  rollbackDocument,
  updateCrossReferences,
  findAndReplaceText,
  redactSensitiveContent
} from './orchestrator';

test('buildDocumentFromPrompt generates comprehensive 10-section agreement', () => {
  const result = buildDocumentFromPrompt('Music collaboration agreement with Syntient Records');
  assert.ok(result.updatedDoc);
  assert.equal(result.updatedDoc.sections.length >= 10, true);
  assert.equal(result.updatedDoc.sections[0].sectionNumber, '1.0');
  assert.equal(result.updatedDoc.signatures?.parties.length, 2);
  assert.equal(result.summary.verifications.length >= 4, true);
});

test('recalculateNumbering sequentially updates sections, clauses, and appendices', () => {
  const { updatedDoc } = buildDocumentFromPrompt('Agreement');
  const renumbered = recalculateNumbering(updatedDoc);
  assert.equal(renumbered.sections[0].sectionNumber, '1.0');
  assert.equal(renumbered.sections[1].sectionNumber, '2.0');
  assert.equal(renumbered.sections[0].clauses[0].clauseNumber, '1.1');
  assert.equal(renumbered.sections[0].clauses[1].clauseNumber, '1.2');
  
  // Last section is an appendix
  const lastSection = renumbered.sections[renumbered.sections.length - 1];
  assert.equal(lastSection.sectionNumber, 'APPENDIX A');
  assert.equal(lastSection.clauses[0].clauseNumber, 'A.1');
});

test('mergeSections merges sections, removes duplicates, and updates numbering and refs', () => {
  const { updatedDoc: initialDoc } = buildDocumentFromPrompt('Agreement');
  const sec2Id = initialDoc.sections[1].id;
  const sec3Id = initialDoc.sections[2].id;

  const mergeResult = mergeSections(
    initialDoc, 
    [sec2Id, sec3Id], 
    'MASTER RIGHTS, OWNERSHIP & DISTRIBUTION UNIFIED', 
    'intelligent'
  );

  assert.equal(mergeResult.updatedDoc.sections.length, initialDoc.sections.length - 1);
  const unified = mergeResult.updatedDoc.sections.find(s => s.title === 'MASTER RIGHTS, OWNERSHIP & DISTRIBUTION UNIFIED');
  assert.ok(unified);
  assert.equal(unified.clauses.length >= 4, true);
  assert.equal(mergeResult.summary.verifications[0].passed, true);
});

test('splitSection breaks a section into separate child sections', () => {
  const { updatedDoc: initialDoc } = buildDocumentFromPrompt('Agreement');
  const targetSecId = initialDoc.sections[1].id; // Section 2.0 with 3 clauses

  const splitResult = splitSection(initialDoc, targetSecId, [
    { title: 'MASTER RECORDING OWNERSHIP', clauseIndices: [0] },
    { title: 'COMMERCIAL EXPLOITATION & LICENSING', clauseIndices: [1, 2] }
  ]);

  assert.equal(splitResult.updatedDoc.sections.length, initialDoc.sections.length + 1);
  assert.ok(splitResult.updatedDoc.sections.find(s => s.title === 'MASTER RECORDING OWNERSHIP'));
  assert.ok(splitResult.updatedDoc.sections.find(s => s.title === 'COMMERCIAL EXPLOITATION & LICENSING'));
});

test('reorganizeDocument positions Definitions first and renumbers all sections', () => {
  const { updatedDoc: initialDoc } = buildDocumentFromPrompt('Agreement');
  // Intentionally shuffle sections
  const shuffled = {
    ...initialDoc,
    sections: [...initialDoc.sections].reverse()
  };

  const reorganized = reorganizeDocument(shuffled);
  assert.equal(reorganized.updatedDoc.sections[0].title.includes('DEFINITIONS'), true);
  assert.equal(reorganized.updatedDoc.sections[0].sectionNumber, '1.0');
});

test('applyFormatting correctly modifies styles and page configuration', () => {
  const { updatedDoc: initialDoc } = buildDocumentFromPrompt('Agreement');
  const formatted = applyFormatting(initialDoc, {
    fontFamily: 'Garamond',
    fontSize: 12,
    heading1Size: 18,
    headingCase: 'uppercase'
  }, {
    orientation: 'portrait',
    margins: { top: 30, bottom: 30, left: 30, right: 30 }
  });

  assert.equal(formatted.updatedDoc.styles.fontFamily, 'Garamond');
  assert.equal(formatted.updatedDoc.styles.fontSize, 12);
  assert.equal(formatted.updatedDoc.styles.heading1Size, 18);
  assert.equal(formatted.updatedDoc.pageConfig.margins.top, 30);
});

test('assessDocumentQuality generates quality report and finds broken references', () => {
  const { updatedDoc: initialDoc } = buildDocumentFromPrompt('Agreement');
  // Inject a broken reference to Section 99
  initialDoc.sections[0].content += ' Subject to Section 99.';
  const report = assessDocumentQuality(initialDoc);
  assert.ok(report.overallScore > 0);
  assert.ok(report.findings.some(f => f.title.includes('Broken Cross-Reference') && f.description.includes('99')));
});

test('rollbackDocument restores previous snapshot version', () => {
  const { updatedDoc: initialDoc } = buildDocumentFromPrompt('Agreement');
  const snapshot = JSON.parse(JSON.stringify(initialDoc));
  
  // Make a modification
  const modified = {
    ...initialDoc,
    title: 'Altered Title',
    version: initialDoc.version + 1,
    sections: initialDoc.sections.slice(0, 3)
  };

  const rolledBack = rollbackDocument(modified, snapshot);
  assert.equal(rolledBack.updatedDoc.title, initialDoc.title);
  assert.equal(rolledBack.updatedDoc.sections.length, initialDoc.sections.length);
  assert.equal(rolledBack.updatedDoc.version, modified.version + 1);
});

test('findAndReplaceText accurately replaces terms and returns match counts', () => {
  const { updatedDoc: initialDoc } = buildDocumentFromPrompt('Agreement');
  const { updatedDoc, matchCount } = findAndReplaceText(initialDoc, 'Master Recording', 'Studio Audio Master');
  assert.ok(matchCount > 0);
  assert.equal(updatedDoc.version, initialDoc.version + 1);
});

test('redactSensitiveContent scrubs target text and appends redaction ledger record', () => {
  const { updatedDoc: initialDoc } = buildDocumentFromPrompt('Agreement');
  const { updatedDoc, redactedCount } = redactSensitiveContent(initialDoc, 'Elena Rostova', '[REDACTED: SENSITIVE PARTY]');
  assert.ok(redactedCount > 0);
  assert.ok(updatedDoc.redactions && updatedDoc.redactions.length > 0);
  assert.equal(updatedDoc.redactions[0].targetTerm, 'Elena Rostova');
});

