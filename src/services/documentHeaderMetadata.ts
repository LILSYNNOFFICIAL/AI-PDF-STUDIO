import { DocumentHeaderFieldId, DocumentHeaderMetadataConfig, DocumentModel } from '../types/document';

export interface DocumentHeaderField {
  id: DocumentHeaderFieldId;
  label: string;
  value: string;
}

const DEFAULT_LABELS: Record<DocumentHeaderFieldId, string> = {
  version: 'Version',
  documentType: 'Document Type',
  date: 'Date',
  author: 'Author'
};

export function getDocumentHeaderFields(document: DocumentModel): DocumentHeaderField[] {
  const config = document.headerMetadata;
  const hidden = new Set(config?.hidden ?? []);
  const defaults: DocumentHeaderField[] = [
    { id: 'version', label: DEFAULT_LABELS.version, value: String(document.version) },
    { id: 'documentType', label: DEFAULT_LABELS.documentType, value: document.type.replace(/_/g, ' ').toUpperCase() },
    { id: 'date', label: DEFAULT_LABELS.date, value: new Date(document.updatedAt).toLocaleDateString() },
    { id: 'author', label: DEFAULT_LABELS.author, value: document.author }
  ];
  return defaults
    .filter(field => !hidden.has(field.id))
    .map(field => ({
      ...field,
      label: config?.labels?.[field.id] ?? field.label,
      value: config?.values?.[field.id] ?? field.value
    }));
}

export function updateDocumentHeaderField(
  document: DocumentModel,
  id: DocumentHeaderFieldId,
  patch: Partial<Pick<DocumentHeaderField, 'label' | 'value'>>
): DocumentModel {
  const current: DocumentHeaderMetadataConfig = document.headerMetadata ?? {};
  const next: DocumentHeaderMetadataConfig = {
    ...current,
    labels: patch.label === undefined ? current.labels : { ...current.labels, [id]: patch.label },
    values: patch.value === undefined ? current.values : { ...current.values, [id]: patch.value }
  };
  return {
    ...document,
    headerMetadata: next,
    ...(id === 'author' && patch.value !== undefined ? { author: patch.value } : {})
  };
}

export function removeDocumentHeaderField(
  document: DocumentModel,
  id: DocumentHeaderFieldId
): DocumentModel {
  const current = document.headerMetadata ?? {};
  return {
    ...document,
    headerMetadata: {
      ...current,
      hidden: Array.from(new Set([...(current.hidden ?? []), id]))
    }
  };
}

export function restoreDocumentHeaderField(
  document: DocumentModel,
  id: DocumentHeaderFieldId
): DocumentModel {
  const current = document.headerMetadata ?? {};
  return {
    ...document,
    headerMetadata: {
      ...current,
      hidden: (current.hidden ?? []).filter(fieldId => fieldId !== id)
    }
  };
}
