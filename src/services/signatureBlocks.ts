import type { SignatureField } from '../types/document';

export function createDefaultSignatureFields(): SignatureField[] {
  return [
    { id: 'signature-field-date', label: 'Date', kind: 'date', value: '', lineLength: 30 },
    { id: 'signature-field-name', label: 'Name', kind: 'text', value: '', lineLength: 48 },
    { id: 'signature-field-extra-1', label: 'Extra field 1', kind: 'text', value: '', lineLength: 48 },
    { id: 'signature-field-extra-2', label: 'Extra field 2', kind: 'text', value: '', lineLength: 48 },
    { id: 'signature-field-signature', label: 'Signature', kind: 'signature', value: '', lineLength: 48 }
  ];
}

export function parseSignatureFields(source: string): SignatureField[] {
  const fields: SignatureField[] = [];
  const lines = source.replace(/\r\n?/g, '\n').split('\n');

  for (const line of lines) {
    const match = line.match(/^\s*\*{0,2}([^:*]+?)\*{0,2}\s*:\s*(.*?)\s*$/);
    const bareLabel = line.replace(/\*+/g, '').trim();
    const label = match ? match[1].replace(/\*+/g, '').trim() : bareLabel;
    if (!label || /[.!?]/.test(label) || /^[_\-–—\s]+$/.test(label)) continue;
    const rawValue = match ? (match[2] || '').replace(/\*+/g, '').trim() : '';
    const lineLength = Math.max(1, (rawValue.match(/[_\-–—.]/g) || []).length || 48);
    const value = /^[_\-–—.\s]+$/.test(rawValue) ? '' : rawValue;
    const normalized = label.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    const kind: SignatureField['kind'] = normalized === 'signature' || normalized.endsWith(' signature')
      ? 'signature'
      : normalized === 'date' || normalized === 'signed date' || normalized.endsWith(' date')
        ? 'date'
        : 'text';

    fields.push({
      id: 'signature-field-' + (fields.length + 1),
      label,
      kind,
      value,
      lineLength
    });
  }

  return fields;
}


export function duplicateSignatureField(fields: SignatureField[], fieldId: string, requestedId: string): SignatureField[] {
  const index = fields.findIndex(field => field.id === fieldId);
  if (index < 0) return fields;
  let id = requestedId;
  let suffix = 1;
  while (fields.some(field => field.id === id)) id = requestedId + '-copy-' + suffix++;
  const source = fields[index];
  const duplicate: SignatureField = { ...source, id, label: source.label ? source.label + ' (copy)' : 'Field copy' };
  const next = [...fields];
  next.splice(index + 1, 0, duplicate);
  return next;
}

export function moveSignatureField(fields: SignatureField[], fieldId: string, direction: 'up' | 'down'): SignatureField[] {
  const index = fields.findIndex(field => field.id === fieldId);
  const targetIndex = direction === 'up' ? index - 1 : index + 1;
  if (index < 0 || targetIndex < 0 || targetIndex >= fields.length) return fields;
  const next = [...fields];
  [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
  return next;
}
