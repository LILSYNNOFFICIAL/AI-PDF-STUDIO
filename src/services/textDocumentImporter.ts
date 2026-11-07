import type { DocumentModel, Section } from '../types/document';

const SECTION_HEADING = /^##\\s+(\\d{1,3})\\.\\s+(.+?)\\s*$/;
const APPENDIX_HEADING = /^#\\s+(APPENDIX\\s+[A-Z0-9]+(?:\\.[^\\n]*)?)\\s*$/i;
const REVIEW_HEADING = /^#\\s+(IMPORTANT REVIEW NOTE)\\s*$/i;

/**
 * Imports Markdown/plain-text agreements without asking an LLM to reconstruct
 * their structure. Numbered H2 headings and Appendix/Review H1 headings become
 * top-level sections. All text between those boundaries is retained verbatim,
 * including nested headings, lists, URLs, and signature blocks.
 */
export function parseTextDocument(
  source: string,
  baseDocument: DocumentModel,
  now = new Date().toISOString()
): DocumentModel {
  const normalized = source.replace(/^\\uFEFF/, '').replace(/\\r\\n?/g, '\\n');
  if (!normalized.trim()) throw new Error('The document is empty.');

  const lines = normalized.split('\\n');
  const titleLineIndex = lines.findIndex(line => /^#\\s+\\S/.test(line));
  const rawTitle = titleLineIndex >= 0
    ? lines[titleLineIndex].replace(/^#\\s+/, '').trim()
    : 'Imported Document';
  const subtitle = lines.slice(Math.max(0, titleLineIndex + 1)).find(line => /^##\\s+[^0-9]/.test(line));
  const title = subtitle
    ? `${rawTitle} ${subtitle.replace(/^##\\s+/, '').trim()}`
    : rawTitle;

  const boundaries: Array<{ line: number; number: string; title: string; appendix: boolean }> = [];
  for (let i = Math.max(0, titleLineIndex + 1); i < lines.length; i += 1) {
    const line = lines[i].trim();
    const numbered = SECTION_HEADING.exec(line);
    const appendix = APPENDIX_HEADING.exec(line);
    const review = REVIEW_HEADING.exec(line);
    if (numbered) {
      boundaries.push({ line: i, number: `${numbered[1]}.0`, title: numbered[2].trim(), appendix: false });
    } else if (appendix) {
      boundaries.push({ line: i, number: appendix[1].split(/[.:]/)[0].toUpperCase(), title: appendix[1].trim(), appendix: true });
    } else if (review) {
      boundaries.push({ line: i, number: 'REVIEW NOTE', title: review[1], appendix: false });
    }
  }

  if (!boundaries.length) {
    throw new Error('No numbered sections or Appendix headings were found. Use Markdown headings such as "## 1. PARTIES".');
  }

  const sections: Section[] = boundaries.map((boundary, index) => {
    const end = boundaries[index + 1]?.line ?? lines.length;
    const body = lines.slice(boundary.line + 1, end).join('\\n').replace(/^\\n+|\\n+$/g, '');
    return {
      id: `imported_${index + 1}_${Math.random().toString(36).slice(2, 9)}`,
      sectionNumber: boundary.number,
      title: boundary.title,
      content: body,
      clauses: [],
      orderIndex: index + 1,
      ...(boundary.appendix ? { isAppendix: true, appendixCode: boundary.number } : {}),
      sourceReference: 'Imported verbatim from user-provided text. Nested Markdown headings and all body text are preserved.'
    };
  });

  return {
    ...baseDocument,
    id: `doc_imported_${Date.now()}`,
    title,
    type: 'music_agreement',
    version: 1,
    createdAt: now,
    updatedAt: now,
    sections,
    signatures: undefined,
    changeSummary: `Imported ${sections.length} sections from source text; source body text preserved verbatim.`
  };
}
