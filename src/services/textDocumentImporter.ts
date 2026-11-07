import type { DocumentModel, Section, SignatureParty, TableBlock, TableCell } from '../types/document';
import { DOCUMENT_DESIGN_PRESETS, deepCloneDesign } from './documentDesign';

type HeadingMatch = { line: number; text: string; level: number; sectionNumber?: string; appendix?: boolean };
const MARKDOWN_HEADING = /^(#{1,3})\s+(.+?)\s*$/;
const NUMBERED_HEADING = /^(?:(?:SECTION|ARTICLE)\s+)?(\d{1,3}(?:\.\d{1,3}){0,3})[.)]?\s+(.{2,140})$/i;
const APPENDIX_HEADING = /^(APPENDIX|EXHIBIT|SCHEDULE)\s+([A-Z0-9]+)(?:[.: -]+(.+))?$/i;
const SIGNATURE_HEADING = /^(SIGNATURES?(?:\s*(?:AND|&)\s*EXECUTION)?|EXECUTION|AGREED\s+AND\s+ACCEPTED)$/i;
const SIGNATURE_ROLE_LABEL = /^(ARTIST|PRODUCER|PRIMARY ARTIST|FEATURED ARTIST|RECORDING ARTIST|LICENSOR|LICENSEE|PUBLISHER|WRITER|PARTY\s+[A-Z0-9]+|COMPANY|WITNESS)(?:\s*[:：])?$/i;

function cleanHeading(value: string): string {
  return value.replace(/^\*{1,2}|\*{1,2}$/g, '').replace(/^_{1,2}|_{1,2}$/g, '').trim();
}

function isLikelyPlainHeading(line: string): boolean {
  const value = line.trim();
  if (!value || value.length > 110 || value.length < 3 || /[.!?]$/.test(value) || SIGNATURE_ROLE_LABEL.test(value)) return false;
  if (/^[-*+•]\s/.test(value)) return false;
  const letters = value.replace(/[^A-Za-z]/g, '');
  return letters.length >= 4 && letters === letters.toUpperCase();
}

function detectHeadings(lines: string[], firstContentLine: number): HeadingMatch[] {
  const headings: HeadingMatch[] = [];
  for (let index = firstContentLine; index < lines.length; index += 1) {
    const value = lines[index].trim();
    if (!value) continue;
    const markdown = MARKDOWN_HEADING.exec(value);
    if (markdown) {
      headings.push({ line: index, text: cleanHeading(markdown[2]), level: markdown[1].length });
      continue;
    }
    const appendix = APPENDIX_HEADING.exec(value);
    if (appendix) {
      headings.push({ line: index, text: [appendix[1], appendix[2], appendix[3]].filter(Boolean).join(' ').trim(), level: 1, appendix: true });
      continue;
    }
    const numbered = NUMBERED_HEADING.exec(value);
    if (numbered && !/^\d{1,2}:\d{2}/.test(value)) {
      headings.push({ line: index, text: cleanHeading(numbered[2]), level: 2, sectionNumber: numbered[1] });
      continue;
    }
    if (SIGNATURE_HEADING.test(value) || isLikelyPlainHeading(value)) headings.push({ line: index, text: value, level: 2 });
  }
  return headings;
}

function countWords(value: string): number {
  return value.trim() ? (value.trim().match(/\S+/g) || []).length : 0;
}

function parseTableLines(lines: string[], sectionIndex: number): { content: string; tables: TableBlock[]; rowCount: number } {
  const retained: string[] = [];
  const tables: TableBlock[] = [];
  let index = 0;
  let rowCount = 0;
  while (index < lines.length) {
    if (!/^\s*\|.*\|\s*$/.test(lines[index])) {
      retained.push(lines[index++]);
      continue;
    }
    const tableLines: string[] = [];
    while (index < lines.length && /^\s*\|.*\|\s*$/.test(lines[index])) tableLines.push(lines[index++]);
    const rows = tableLines.map(line => line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(cell => cell.trim()));
    if (rows.length < 2 || !rows[1].every(cell => /^:?-{3,}:?$/.test(cell.replace(/\s/g, '')))) {
      retained.push(...tableLines);
      continue;
    }
    const headers: TableCell[] = rows[0].map((content, cellIndex) => ({
      id: 'source_table_' + sectionIndex + '_h_' + cellIndex, content, isHeader: true, bold: true
    }));
    const bodyRows = rows.slice(2).map((row, rowIndex) =>
      headers.map((_, cellIndex) => ({
        id: 'source_table_' + sectionIndex + '_r_' + rowIndex + '_c_' + cellIndex,
        content: row[cellIndex] || ''
      }))
    );
    tables.push({ id: 'source_table_' + sectionIndex + '_' + (tables.length + 1), headers, rows: bodyRows });
    rowCount += tableLines.length;
  }
  return { content: retained.join('\n').replace(/^\n+|\n+$/g, ''), tables, rowCount };
}

function parseSignatureParties(content: string): SignatureParty[] {
  const lines = content.split(/\r?\n/);
  const parties: SignatureParty[] = [];
  let current: { role: string; lines: string[] } | null = null;
  const flush = () => {
    if (!current) return;
    const valueFor = (label: string) => current!.lines.find(line => new RegExp('^\\s*(?:' + label + ')\\s*:', 'i').test(line))?.replace(/^\s*[^:]+:\s*/i, '').trim() || '';
    const by = valueFor('By|Name|Printed Name');
    const signature = valueFor('Signature');
    const date = valueFor('Date');
    const title = valueFor('Title');
    const company = valueFor('Company');
    parties.push({
      id: 'source_signature_party_' + (parties.length + 1),
      role: current.role,
      name: by,
      ...(title ? { title } : {}),
      ...(company ? { company } : {}),
      ...(date ? { date } : {}),
      ...(signature ? { signaturePlaceholder: signature } : {})
    });
  };
  for (const line of lines) {
    const trimmed = line.trim();
    if (SIGNATURE_ROLE_LABEL.test(trimmed)) {
      flush();
      current = { role: trimmed.replace(/[:：]$/, '').toUpperCase(), lines: [] };
    } else if (current) current.lines.push(line);
  }
  flush();
  return parties;
}

export function parseTextDocument(source: string, baseDocument: DocumentModel, now = new Date().toISOString(), presetId?: string): DocumentModel {
  if (!source.trim()) throw new Error('The source document is empty. Paste your complete document before rendering.');
  const normalized = source.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  const lines = normalized.split('\n');
  const firstNonEmpty = lines.findIndex(line => line.trim().length > 0);
  const firstLine = lines[firstNonEmpty].trim();
  const firstIsMarkdownTitle = MARKDOWN_HEADING.test(firstLine);
  const title = cleanHeading(firstIsMarkdownTitle ? firstLine.replace(/^#+\s*/, '') : firstLine).replace(/\*{1,2}/g, '').slice(0, 180) || 'Imported Document';
  const headings = detectHeadings(lines, firstNonEmpty + 1);
  const sections: Section[] = [];
  let signatureParties: SignatureParty[] = [];
  let detectedTableRows = 0;

  const appendSection = (headingText: string, sourceHeading: string, contentLines: string[], appendix = false, sectionNumber?: string) => {
    const parsed = parseTableLines(contentLines, sections.length + 1);
    detectedTableRows += parsed.rowCount;
    const isSignatureSection = SIGNATURE_HEADING.test(headingText);
    const parties = isSignatureSection ? parseSignatureParties(parsed.content) : [];
    if (parties.length) signatureParties = parties;
    const isAppendix = appendix || /^(APPENDIX|EXHIBIT|SCHEDULE)\b/i.test(headingText);
    const number = sectionNumber || (isAppendix
      ? headingText.match(/^(?:APPENDIX|EXHIBIT|SCHEDULE)\s+([A-Z0-9]+)/i)?.[1] || ''
      : String(sections.filter(section => !section.isAppendix).length + 1));
    sections.push({
      id: 'source_section_' + (sections.length + 1),
      sectionNumber: number,
      title: headingText,
      sourceHeading,
      content: isSignatureSection && parties.length ? '' : parsed.content,
      clauses: [],
      ...(parsed.tables.length ? { tables: parsed.tables } : {}),
      orderIndex: sections.length + 1,
      ...(isAppendix ? { isAppendix: true, appendixCode: number } : {}),
      sourceReference: 'Original source text retained in the Source of Truth record.'
    });
  };

  const preambleEnd = headings[0]?.line ?? lines.length;
  const preamble = lines.slice(firstNonEmpty + 1, preambleEnd);
  if (preamble.join('\n').trim()) appendSection('INTRODUCTION', '', preamble);

  headings.forEach((heading, index) => {
    const nextLine = headings[index + 1]?.line ?? lines.length;
    appendSection(heading.text, lines[heading.line], lines.slice(heading.line + 1, nextLine), heading.appendix, heading.sectionNumber);
  });

  if (!sections.length) {
    const parsed = parseTableLines(lines.slice(firstNonEmpty + 1), 1);
    detectedTableRows = parsed.rowCount;
    sections.push({
      id: 'source_section_1', sectionNumber: '1', title: 'DOCUMENT CONTENT', sourceHeading: '',
      content: [lines[firstNonEmpty], parsed.content].filter(Boolean).join('\n'),
      clauses: [], ...(parsed.tables.length ? { tables: parsed.tables } : {}), orderIndex: 1,
      sourceReference: 'Complete unstructured source retained verbatim.'
    });
  }

  const selectedPreset = DOCUMENT_DESIGN_PRESETS.find(preset => preset.presetId === presetId)
    || DOCUMENT_DESIGN_PRESETS.find(preset => preset.presetId === 'contemporary-legal')
    || DOCUMENT_DESIGN_PRESETS[0];
  const design = deepCloneDesign(selectedPreset);
  const detectedLists = (normalized.match(/^\s*(?:[-*+•]|\d+[.)])\s+/gm) || []).length;

  return {
    ...baseDocument,
    id: 'doc_source_' + Date.now(),
    title,
    type: baseDocument.type || 'general',
    version: 1,
    createdAt: now,
    updatedAt: now,
    sections,
    signatures: signatureParties.length ? {
      id: 'source_signature_block',
      title: 'SIGNATURES & EXECUTION',
      parties: signatureParties,
      layout: 'side_by_side'
    } : undefined,
    sourceText: source,
    sourceIntegrity: {
      characterCount: source.length,
      wordCount: countWords(source),
      sectionCount: sections.length,
      detectedSignatureSection: signatureParties.length > 0,
      detectedTableRows,
      detectedListItems: detectedLists
    },
    design,
    styles: {
      ...baseDocument.styles,
      fontFamily: design.typography.bodyFontFamily,
      fontSize: design.typography.bodyFontSize,
      lineHeight: design.typography.bodyLineHeight,
      paragraphSpacing: design.typography.paragraphSpacing,
      headingFont: design.typography.headingFontFamily,
      heading1Size: design.typography.heading1Size,
      heading2Size: design.typography.heading2Size,
      heading3Size: design.typography.heading3Size,
      headingCase: design.typography.headingCase,
      primaryColor: design.colors.primary,
      accentColor: design.colors.accent
    },
    changeSummary: 'Rendered ' + sections.length + ' editable sections from the complete source of truth (' + countWords(source) + ' words). Original source retained.'
  };
}

export function getSourceIntegrityReport(doc: DocumentModel) {
  const source = doc.sourceText || '';
  const rendered = [doc.title, ...doc.sections.map(section => [
    section.sourceHeading || '',
    section.content || '',
    ...(section.tables || []).flatMap(table => [table.headers.map(cell => cell.content).join(' '), ...table.rows.map(row => row.map(cell => cell.content).join(' '))])
  ].join('\n')), ...(doc.signatures?.parties || []).flatMap(party => [
    party.role, party.name, party.title || '', party.company || '', party.date || '', party.signaturePlaceholder || ''
  ])].join('\n');
  return {
    sourceCharacters: source.length,
    sourceWords: countWords(source),
    renderedCharacters: rendered.length,
    renderedWords: countWords(rendered),
    sourceRetained: Boolean(source),
    sectionCount: doc.sections.length,
    signaturePartyCount: doc.signatures?.parties.length || 0
  };
}
