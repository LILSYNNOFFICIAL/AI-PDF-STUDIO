import type { SignatureField } from '../types/document';

export function createDefaultSignatureFields(): SignatureField[] {
  return [
    { id: 'signature-field-date', label: 'Date', kind: 'date', value: '' },
    { id: 'signature-field-name', label: 'Name', kind: 'text', value: '' },
    { id: 'signature-field-extra-1', label: 'Extra field 1', kind: 'text', value: '' },
    { id: 'signature-field-extra-2', label: 'Extra field 2', kind: 'text', value: '' },
    { id: 'signature-field-signature', label: 'Signature', kind: 'signature', value: '' }
  ];
}

export function parseSignatureFields(source: string): SignatureField[] {
  const fields: SignatureField[] = [];
  const lines = source.replace(/\r\n?/g, '\n').split('\n');

  for (const line of lines) {
    const match = line.match(/^\s*\*{0,2}([^:*]+?)\*{0,2}\s*:\s*(.*?)\s*$/);
    if (!match) continue;

    const label = match[1].replace(/\*+/g, '').trim();
    if (!label) continue;
    const value = (match[2] || '').replace(/\*+/g, '').trim();
    const normalized = label.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    const kind: SignatureField['kind'] = normalized === 'signature'
      ? 'signature'
      : normalized === 'date' || normalized === 'signed date'
        ? 'date'
        : 'text';

    fields.push({
      id: 'signature-field-' + (fields.length + 1),
      label,
      kind,
      value: /^[_\-–—.\s]+$/.test(value) ? '' : value
    });
  }

  return fields;
}
