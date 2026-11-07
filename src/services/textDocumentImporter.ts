import type { DocumentModel, Section } from '../types/document';
import { DOCUMENT_DESIGN_PRESETS, deepCloneDesign } from './documentDesign';

type HeadingMatch = { line: number; text: string; level: number; sectionNumber?: string; appendix?: boolean };

const MARKDOWN_HEADING = /^(#{1,3})\s+(.+?)\s*$/;
const NUMBERED_HEADING = /^(?:(?:SECTION|ARTICLE)\s+)?(\d{1,3}(?:\.\d{1,3}){0,3})[.)]?\s+(.{2,140})$/i;
const APPENDIX_HEADING = /^(APPENDIX|EXHIBIT|SCHEDULE)\s+([A-Z0-9]+)(?:[.: -]+(.+))?$/i;
const SIGNATURE_HEADING = /^(SIGNATURES?(?:\s*(?:AND|&)\s*EXECUTION)?|EXECUTION|AGREED\s+AND\s+ACCEPTED)$/i;

function cleanHeading(value: string): string {
  return value.replace(/^\*{1,2}|\*{1,2}$/g, '').replace(/^_{1,2}|_{1,2}$/g, '').trim();
}

function isLikelyPlainHeading(line: string): boolean {
  const value = line.trim();
  if (!value || value.length > 110 || value.length < 3) return false;
  if (/[.!?]$/.test(value)) return false;
  if (/^[-*+•]\s/.test(value)) return false;
  if (/^\d{1,2}[.)]\s/.test(value)) return true;
  const letters = value.replace(/[^A-Za-z]/g, '');
  if (letters.length >= 4 && letters === letters.toUpperCase()) return true;
  return false;
}

function detectHeadings(lines: string[], firstContentLine: number): HeadingMatch[] {
  const headings: HeadingMatch[] = [];
  for (let index = firstContentLine; index < lines.length; index += 1) {
    const raw = lines[index];
    const value = raw.trim();
    if (!value) continue;
    const markdown = MARKDOWN_HEADING.exec(value);
    if (markdown) {
      headings.push({ line: index, text: cleanHeading(markdown[2]), level: markdown[1].length });
      continue;
    }
    const appendix = APPENDIX_HEADING.exec(value);
    if (appendix) {
      headings.push({
        line: index,
        text: [appendix[1], appendix[2], appendix[3]].filter(Boolean).join(' ').trim(),
        level: 1,
        appendix: true
      });
      continue;
    }
    const numbered = NUMBERED_HEADING.exec(value);
    if (numbered && !/^\d{1,2}:\d{2}/.test(value)) {
      headings.push({ line: index, text: cleanHeading(numbered[2]), level: 2, sectionNumber: numbered[1] });
      continue;
    }
    if (SIGNATURE_HEADING.test(value) || isLikelyPlainHeading(value)) {
      headings.push({ line: index, text: value, level: 2 });
    }
  }
  return headings;
}

function countWords(value: string): number {
  return value.trim() ? (value.trim().match(/\S+/g) || []).length : 0;
}

/**
 * Converts pasted text into an editable document model while retaining the exact
 * original source in sourceText. Heading recognition is deliberately permissive:
 * unknown or unstructured content is still rendered as a document section.
 */
export function parseTextDocument(
  source: string,
  baseDocument: DocumentModel,
  now = new Date().toISOString(),
  presetId?: string
): DocumentModel {
  if (!source.trim()) throw new Error('The source document is empty. Paste your complete document before rendering.');
  const normalized = source.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  const lines = normalized.split('\n');
  const firstNonEmpty = lines.findIndex(line => line.trim().length > 0);
  const firstLine = lines[firstNonEmpty].trim();
  const firstIsHeading = MARKDOWN_HEADING.test(firstLine);
  const title = cleanHeading(firstIsHeading ? firstLine.replace(/^#+\s*/, '') : firstLine)
    .replace(/\*{1,2}/g, '')
    .slice(0, 180) || 'Imported Document';
  const firstHeadingLine = firstIsHeading ? firstNonEmpty + 1 : firstNonEmpty + 1;
  const headings = detectHeadings(lines, firstHeadingLine);

  const sections: Section[] = [];
  const preambleEnd = headings[0]?.line ?? lines.length;
  const preamble = lines.slice(firstNonEmpty + 1, preambleEnd).join('\n').replace(/^\n+|\n+$/g, '');
  if (preamble.trim()) {
    sections.push({
      id: 'source_section_preamble',
      sectionNumber: '',
      title: 'INTRODUCTION',
      sourceHeading: '',
      content: preamble,
      clauses: [],
      orderIndex: sections.length + 1,
      sourceReference: 'Preamble preserved from source document.'
    });
  }

  headings.forEach((heading, index) => {
    const nextLine = headings[index + 1]?.line ?? lines.length;
    const content = lines.slice(heading.line + 1, nextLine).join('\n').replace(/^\n+|\n+$/g, '');
    const isAppendix = heading.appendix || /^(APPENDIX|EXHIBIT|SCHEDULE)\b/i.test(heading.text);
    const sectionNumber = heading.sectionNumber
      ? heading.sectionNumber.endsWith('.0') ? heading.sectionNumber : heading.sectionNumber
      : isAppendix ? heading.text.match(/^(?:APPENDIX|EXHIBIT|SCHEDULE)\s+([A-Z0-9]+)/i)?.[1] || ''
      : String(sections.filter(section => !section.isAppendix).length + 1);
    sections.push({
      id: `source_section_${index + 1}`,
      sectionNumber,
      title: heading.text,
      sourceHeading: lines[heading.line],
      content,
      clauses: [],
      orderIndex: sections.length + 1,
      ...(isAppendix ? { isAppendix: true, appendixCode: sectionNumber } : {}),
      sourceReference: 'Section content retained verbatim from source document.'
    });
  });

  if (!sections.length) {
    sections.push({
      id: 'source_section_1',
      sectionNumber: '1',
      title: 'DOCUMENT CONTENT',
      sourceHeading: '',
      content: normalized,
      clauses: [],
      orderIndex: 1,
      sourceReference: 'Complete unstructured source retained verbatim.'
    });
  }

  const selectedPreset = DOCUMENT_DESIGN_PRESETS.find(preset => preset.presetId === presetId)
    || DOCUMENT_DESIGN_PRESETS.find(preset => preset.presetId === 'contemporary-legal')
    || DOCUMENT_DESIGN_PRESETS[0];
  const design = deepCloneDesign(selectedPreset);
  const signaturesHeading = headings.find(heading => SIGNATURE_HEADING.test(heading.text));
  const detectedTables = (normalized.match(/^\s*\|.*\|\s*$/gm) || []).length;
  const detectedLists = (normalized.match(/^\s*(?:[-*+•]|\d+[.)])\s+/gm) || []).length;

  return {
    ...baseDocument,
    id: `doc_source_${Date.now()}`,
    title,
    type: baseDocument.type || 'general',
    version: 1,
    createdAt: now,
    updatedAt: now,
    sections,
    signatures: undefined,
    sourceText: source,
    sourceIntegrity: {
      characterCount: source.length,
      wordCount: countWords(source),
      sectionCount: sections.length,
      detectedSignatureSection: Boolean(signaturesHeading),
      detectedTableRows: detectedTables,
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
    changeSummary: `Rendered ${sections.length} editable sections from the complete source of truth (${countWords(source)} words). Original source retained for integrity checks.`
  };
}

export function getSourceIntegrityReport(doc: DocumentModel): {
  sourceCharacters: number;
  sourceWords: number;
  renderedCharacters: number;
  renderedWords: number;
  sourceRetained: boolean;
  sectionCount: number;
} {
  const source = doc.sourceText || '';
  const rendered = doc.sections.map(section => [section.sourceHeading || '', section.content || ''].join('\n')).join('\n');
  return {
    sourceCharacters: source.length,
    sourceWords: countWords(source),
    renderedCharacters: rendered.length,
    renderedWords: countWords(rendered),
    sourceRetained: Boolean(source),
    sectionCount: doc.sections.length
  };
}
