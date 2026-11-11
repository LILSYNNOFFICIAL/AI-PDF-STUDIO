import test from 'node:test';
import assert from 'node:assert/strict';
import type { DocumentModel } from '../types/document';
import {
  appendDocumentHistory,
  redoDocumentHistory,
  undoDocumentHistory,
  type DocumentHistoryState
} from './documentHistory';

function doc(id: string, title: string): DocumentModel {
  return { id, title } as DocumentModel;
}

const emptyHistory = (): DocumentHistoryState => ({ snapshots: [], index: -1 });

test('first edit stores both the pre-edit and post-edit document for undo and redo', () => {
  const before = doc('doc-1', 'Original');
  const after = doc('doc-1', 'Edited');
  const recorded = appendDocumentHistory(emptyHistory(), before, after);

  assert.deepEqual(recorded.snapshots, [before, after]);
  assert.equal(recorded.index, 1);

  const undone = undoDocumentHistory(recorded);
  assert.equal(undone.document, before);
  assert.equal(undone.state.index, 0);

  const redone = redoDocumentHistory(undone.state);
  assert.equal(redone.document, after);
  assert.equal(redone.state.index, 1);
});

test('new edits after undo discard the abandoned redo branch', () => {
  const first = doc('doc-1', 'First');
  const second = doc('doc-1', 'Second');
  const third = doc('doc-1', 'Third');
  const fourth = doc('doc-1', 'Fourth');
  const firstEdit = appendDocumentHistory(emptyHistory(), first, second);
  const secondEdit = appendDocumentHistory(firstEdit, second, third);
  const undone = undoDocumentHistory(secondEdit);
  const branched = appendDocumentHistory(undone.state, second, fourth);

  assert.deepEqual(branched.snapshots, [first, second, fourth]);
  assert.equal(branched.index, 2);
  assert.equal(redoDocumentHistory(branched).document, null);
});

test('history does not create duplicate snapshots for a no-op transition', () => {
  const unchanged = doc('doc-1', 'Same');
  const result = appendDocumentHistory(emptyHistory(), unchanged, unchanged);

  assert.deepEqual(result.snapshots, [unchanged]);
  assert.equal(result.index, 0);
  assert.equal(undoDocumentHistory(result).document, null);
});

test('undo and redo are safe at their respective history boundaries', () => {
  const initial = doc('doc-1', 'Initial');
  const state = { snapshots: [initial], index: 0 };

  assert.equal(undoDocumentHistory(state).document, null);
  assert.equal(redoDocumentHistory(state).document, null);
});


test('version rollback lookup never crosses document boundaries', async () => {
  const api = await import('./documentHistory') as unknown as {
    findDocumentVersionSnapshot: (
      snapshots: DocumentModel[],
      documentId: string,
      version: number
    ) => DocumentModel | null;
  };
  assert.equal(typeof api.findDocumentVersionSnapshot, 'function');
  const previousDocument = doc('previous-document', 'Old document');
  const currentVersionOne = doc('current-document', 'Current version one');
  const otherDocumentVersionOne = doc('other-document', 'Other version one');
  const currentVersionTwo = doc('current-document', 'Current version two');
  const snapshots = [previousDocument, currentVersionOne, otherDocumentVersionOne, currentVersionTwo];

  assert.equal(api.findDocumentVersionSnapshot(snapshots, 'current-document', 1), currentVersionOne);
  assert.equal(api.findDocumentVersionSnapshot(snapshots, 'current-document', 2), currentVersionTwo);
  assert.equal(api.findDocumentVersionSnapshot(snapshots, 'missing-document', 1), null);
});
