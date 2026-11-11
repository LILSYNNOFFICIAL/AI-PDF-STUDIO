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
  _state: DocumentHistoryState,
  _before: DocumentModel,
  _after: DocumentModel
): DocumentHistoryState {
  throw new Error('Not implemented');
}

export function undoDocumentHistory(_state: DocumentHistoryState): DocumentHistoryTransition {
  throw new Error('Not implemented');
}

export function redoDocumentHistory(_state: DocumentHistoryState): DocumentHistoryTransition {
  throw new Error('Not implemented');
}
