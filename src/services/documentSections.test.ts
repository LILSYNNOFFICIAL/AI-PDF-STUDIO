import test from 'node:test';
import assert from 'node:assert/strict';
import { appendAppendixSection } from './documentSections';
import type { DocumentModel } from '../types/document';

function makeDocument(): DocumentModel {
  return {
    id: 'doc-test', title: 'Test', type: 'legal_agreement', version: 3,
    createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
    author: 'Test', changeSummary: '', sections: [{
      id: 'section-1', sectionNumber: '1.0', title: 'Existing Section',
      content: 'Existing content', clauses: [], orderIndex: 1
    }]
  } as DocumentModel;
}

test('Appendix / Exhibit appends a real editable appendix without replacing the current document', () => {
  const original = makeDocument();
  const updated = appendAppendixSection(original, 'test-id');
  assert.equal(updated.id, original.id);
  assert.equal(updated.sections.length, 2);
  const appendix = updated.sections[1];
  assert.equal(appendix.id, 'appendix_test-id');
  assert.equal(appendix.title, 'APPENDIX B: SCHEDULE OF INTELLECTUAL PROPERTY');
  assert.equal(appendix.isAppendix, true);
  assert.equal(appendix.forcePageBreakBefore, true);
  assert.equal(appendix.clauses.length, 1);
  assert.match(appendix.clauses[0].content, /ISRC/);
  assert.equal(updated.version, original.version + 1);
  assert.equal(original.sections.length, 1);
});

test('Appendix / Exhibit assigns fresh clause identities for repeated insertions', () => {
  const original = makeDocument();
  const once = appendAppendixSection(original, 'first');
  const twice = appendAppendixSection(once, 'second');
  assert.notEqual(once.sections[1].id, twice.sections[2].id);
  assert.notEqual(once.sections[1].clauses[0].id, twice.sections[2].clauses[0].id);
});
