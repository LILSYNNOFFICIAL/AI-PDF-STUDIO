import type { DocumentModel } from '../types/document';

export interface DocumentHistoryState {
  snapshots: DocumentModel[];
  index: number;
}

export interface DocumentHistoryTransition {
  state: DocumentHistoryState;
  document: DocumentModel | null;
}

export function appendDocumentHistory(
  state: DocumentHistoryState,
  before: DocumentModel,
  after: DocumentModel
): DocumentHistoryState {
  const snapshots = state.snapshots.slice(0, Math.max(0, state.index + 1));
  if (!snapshots.length) snapshots.push(before);
  else if (snapshots[snapshots.length - 1] !== before) snapshots.push(before);

  if (snapshots[snapshots.length - 1] !== after) snapshots.push(after);
  return { snapshots, index: snapshots.length - 1 };
}

export function undoDocumentHistory(state: DocumentHistoryState): DocumentHistoryTransition {
  if (state.index <= 0 || !state.snapshots[state.index - 1]) {
    return { state, document: null };
  }
  const index = state.index - 1;
  return { state: { ...state, index }, document: state.snapshots[index] };
}

export function redoDocumentHistory(state: DocumentHistoryState): DocumentHistoryTransition {
  if (state.index < 0 || state.index >= state.snapshots.length - 1) {
    return { state, document: null };
  }
  const index = state.index + 1;
  return { state: { ...state, index }, document: state.snapshots[index] };
}


/**
 * Find a version snapshot only within the requested document.
 * The history may also contain snapshots from documents opened earlier.
 */
export function findDocumentVersionSnapshot(
  snapshots: DocumentModel[],
  documentId: string,
  version: number
): DocumentModel | null {
  for (let index = snapshots.length - 1; index >= 0; index -= 1) {
    const snapshot = snapshots[index];
    if (snapshot.id === documentId && snapshot.version === version) return snapshot;
  }
  return null;
}
