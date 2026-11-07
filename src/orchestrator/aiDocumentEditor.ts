import type {
  AIPersona,
  DocumentModel,
  ExecutionResultSummary,
  PageConfig,
  Section,
  StyleConfig,
  DocumentDesign,
  SectionDesign,
  TableDesign,
  DesignColors,
  DesignTypography
} from '../types/document';
import {
  DOCUMENT_DESIGN_PRESETS,
  normalizeDocumentDesign,
  validateDocumentDesign,
  validateSectionDesign,
  validateTableDesign,
  deepCloneDesign
} from '../services/documentDesign';
import { recalculateNumbering } from './orchestrator';

export interface SectionEdit {
  sectionId: string;
  title?: string;
  content?: string;
  orderIndex?: number;
  clauses?: Array<{
    id: string;
    heading?: string;
    content?: string;
    orderIndex?: number;
  }>;
}

export interface SectionDesignUpdate {
  sectionId: string;
  design: Partial<SectionDesign> | null;
}

export interface TableDesignUpdate {
  sectionId: string;
  tableId: string;
  design: Partial<TableDesign> | null;
}

export interface DocumentDesignUpdate {
  presetId?: string;
  name?: string;
  colors?: Partial<DesignColors>;
  typography?: Partial<DesignTypography>;
  page?: Partial<DocumentDesign['page']>;
  sectionDefaults?: Partial<DocumentDesign['sectionDefaults']>;
  tableDefaults?: Partial<DocumentDesign['tableDefaults']>;
  pageFurniture?: Partial<DocumentDesign['pageFurniture']>;
}

export interface SectionRangeMove {
  /** First section included in the inclusive range. */
  startSectionId: string;
  /** First section excluded from the range. */
  endBeforeSectionId: string;
  /** Existing section that receives every block in the selected range. */
  targetSectionId: string;
}

export type JsonPatchOperation =
  | { op: 'add' | 'replace' | 'test'; path: string; value: unknown }
  | { op: 'remove'; path: string }
  | { op: 'move' | 'copy'; from: string; path: string };

export interface DocumentEditResponse {
  operationTitle: string;
  details: string[];
  sectionUpdates: SectionEdit[];
  sectionOrder?: string[];
  sectionRangeMoves?: SectionRangeMove[];
  documentPatch?: JsonPatchOperation[];
  styles?: Partial<StyleConfig>;
  pageConfig?: Partial<PageConfig>;
  design?: DocumentDesignUpdate;
  sectionDesignUpdates?: SectionDesignUpdate[];
  tableDesignUpdates?: TableDesignUpdate[];
}

export interface GeminiEditorClient {
  models: {
    generateContent(args: {
      model: string;
      contents: string;
      config?: { responseMimeType?: string };
    }): Promise<{ text?: string }>;
  };
}

export interface ExecuteDocumentEditOptions {
  instruction: string;
  currentDoc: DocumentModel;
  persona: AIPersona | string;
  aiClient: GeminiEditorClient;
  model?: string;
  maxChunkChars?: number;
  allowNoop?: boolean;
}


const DEFAULT_CHUNK_CHARS = 18000;
const GEMINI_MAX_ATTEMPTS = 3;

function isTransientGeminiError(error: unknown): boolean {
  const value = error as { status?: unknown; statusCode?: unknown; code?: unknown; message?: unknown } | null;
  const status = Number(value?.status ?? value?.statusCode ?? value?.code);
  const message = [value?.message, value?.code, error].map(item => String(item || '')).join(' ');
  return status === 408 || status === 429 || status === 500 || status === 502 ||
    status === 503 || status === 504 ||
    /\b(UNAVAILABLE|RESOURCE_EXHAUSTED|DEADLINE_EXCEEDED|temporarily unavailable|high demand|rate limit)\b/i.test(message);
}

async function generateGeminiContentWithRetry(
  aiClient: GeminiEditorClient,
  args: { model: string; contents: string; config?: { responseMimeType?: string } }
): Promise<{ text?: string }> {
  for (let attempt = 1; attempt <= GEMINI_MAX_ATTEMPTS; attempt += 1) {
    try {
      return await aiClient.models.generateContent(args);
    } catch (error) {
      if (!isTransientGeminiError(error) || attempt === GEMINI_MAX_ATTEMPTS) {
        if (isTransientGeminiError(error)) {
          throw new Error('Gemini is temporarily overloaded after 3 attempts. Please wait a moment and retry. No document changes were applied.');
        }
        throw error;
      }
      const delayMs = Math.min(4000, 500 * (2 ** (attempt - 1)));
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  throw new Error('Gemini request failed unexpectedly. No document changes were applied.');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function explicitTextEdit(instruction: string): boolean {
  return /\b(rewrite|reword|paraphrase|revise the wording|edit the wording|proofread|correct grammar|fix grammar|replace the text|change the wording|expand the text|shorten the text|summarize|condense|delete text|remove text|add (?:a |an |the )?(?:clause|paragraph|sentence|provision|section))\b/i.test(instruction);
}

function explicitSectionReorder(instruction: string): boolean {
  return /\b(reorder|re-organize|reorganize|rearrange|rearrangement|change the order of (?:the )?sections|change section order|sort the sections|move (?:the )?sections?)\b/i.test(instruction);
}


function explicitDocumentDesign(instruction: string): boolean {
  return /\b(design|styling|style the document|theme|template|colour|color|recolor|colourise|colorize|background|gradient|palette|typography|typeface|font|garamond|inter|helvetica|georgia|border|divider|page surface|section background|table style|visual|appearance|polished|sleek|elegant|professional(?:ly)? formatted|professional (?:look|design|style|template)|modern|blue|navy|red|green|black|white|purple|pink|gold|silver|gray|grey|teal|cyan|orange|yellow|beige|make (?:the )?(?:document|pages?) look|professional(?:ly)? formatted|modern(?:ize|ise) the (?:document|layout))\b/i.test(instruction);
}

function designOnlyInstruction(instruction: string): boolean {
  // Ignore quoted section names when classifying visual-design intent.
  const intent = instruction.replace(/(["']).*?\1/g, ' ');
  if (!explicitDocumentDesign(intent) || explicitTextEdit(instruction) || explicitSectionReorder(instruction)) return false;
  return !/\b(add|create|remove|delete|rename|copy|duplicate|move|merge|split|reorganize|re-order|reorder|rearrange|insert|extract|transfer|relocate)\b.{0,60}\b(section|clause|table|chart|image|paragraph|sentence|heading|title|row|column|appendix|exhibit|schedule|signature|content|text)\b/i.test(intent);
}
function mergePatch<T>(base: T, patch: unknown): T {
  if (patch === undefined) return deepCloneDesign(base);
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) return patch as T;
  const baseRecord = base && typeof base === 'object' && !Array.isArray(base)
    ? base as Record<string, unknown>
    : {};
  const patchRecord = patch as Record<string, unknown>;
  const result: Record<string, unknown> = { ...baseRecord };
  for (const [key, value] of Object.entries(patchRecord)) {
    const previous = baseRecord[key];
    result[key] = value && typeof value === 'object' && !Array.isArray(value) &&
      previous && typeof previous === 'object' && !Array.isArray(previous)
      ? mergePatch(previous, value)
      : deepCloneDesign(value);
  }
  return result as T;
}

export function buildDocumentDesignPrompt(
  instruction: string,
  document: DocumentModel,
  persona: AIPersona | string
): string {
  const normalized = normalizeDocumentDesign(document);
  const inventory = document.sections.map(section => ({
    sectionId: section.id,
    sectionNumber: section.sectionNumber,
    title: section.title,
    tables: (section.tables || []).map(table => ({ tableId: table.id, title: table.title || 'Untitled table' }))
  }));
  return [
    'You are the visual design controller for AI PDF Studio.',
    'Perform the requested visual styling by returning executable design tokens and overrides. Do not edit or reorder document content.',
    'This is a design-only operation. Never return title/content/clause changes, sectionOrder, legacy styles, or pageConfig updates.',
    'Use an existing presetId from the supplied preset list when the user requests one. For custom styling, return only the token fields that need to change.',
    'For a section-specific visual change, use sectionDesignUpdates with an exact existing sectionId. For a table-specific visual change, use tableDesignUpdates with both an exact sectionId and tableId.',
    'Do not invent IDs. If a requested target cannot be identified unambiguously, return no design changes and explain the issue in details.',
    'Return one JSON object and no markdown fences with this exact shape:',
    '{"operationTitle":"short action name","details":["actual operation performed"],"sectionUpdates":[],"design":{"presetId":"optional-known-preset-id","name":"optional-theme-name","colors":{},"typography":{},"page":{},"sectionDefaults":{},"tableDefaults":{},"pageFurniture":{}},"sectionDesignUpdates":[{"sectionId":"existing-section-id","design":{"background":{"type":"solid","color":"#ffffff"},"headingColor":"#172033","bodyTextColor":"#334155","border":{"style":"solid","color":"#dbe3ee","width":1},"padding":10}}],"tableDesignUpdates":[{"sectionId":"existing-section-id","tableId":"existing-table-id","design":{"headerBackground":{"type":"solid","color":"#eef2f7"},"headerTextColor":"#172033","bodyTextColor":"#334155","gridlineColor":"#dbe3ee","gridlineWidth":1}}]}',
    'For gradient fills use {"type":"linear-gradient","angle":135,"stops":[{"color":"#ffffff","position":0},{"color":"#e2e8f0","position":100}]}.',
    'All colors must be valid 3- or 6-digit hexadecimal values. Opacity must be 0 through 1. Border styles: none, solid, dashed, dotted, double.',
    'Do not return empty design objects. Every returned value must represent a concrete change.',
    'Current design model: ' + JSON.stringify(normalized.design),
    'Available visual presets: ' + JSON.stringify(DOCUMENT_DESIGN_PRESETS.map(preset => ({ presetId: preset.presetId, name: preset.name }))),
    'Existing section and table IDs: ' + JSON.stringify(inventory),
    'Document title: ' + document.title,
    'Persona: ' + persona,
    'User instruction: ' + instruction
  ].join('\n\n');
}


interface SectionChunk {
  sections: Section[];
  partialSectionIds: Set<string>;
  partialClauseIds: Set<string>;
}

function chunkSections(sections: Section[], maxChars: number): SectionChunk[] {
  const chunks: SectionChunk[] = [];
  let current: Section[] = [];
  let currentSize = 0;

  const flush = () => {
    if (current.length) {
      chunks.push({ sections: current, partialSectionIds: new Set(), partialClauseIds: new Set() });
      current = [];
      currentSize = 0;
    }
  };

  const addWholeSection = (section: Section) => {
    const size = JSON.stringify(section).length;
    if (current.length > 0 && currentSize + size > maxChars) flush();
    current.push(section);
    currentSize += size;
  };

  for (const section of sections) {
    const size = JSON.stringify(section).length;
    if (size <= maxChars) {
      addWholeSection(section);
      continue;
    }

    flush();
    if (section.tables?.length || section.charts?.length || section.images?.length) {
      throw new Error(`Section "${section.title}" contains large non-text blocks that cannot be safely chunked yet. No document changes were applied.`);
    }
    const base = { ...section, content: undefined, clauses: [], tables: [], charts: [], images: [] };
    const content = section.content || '';
    const fragmentSize = Math.max(500, maxChars - JSON.stringify(base).length - 500);
    let sectionContentWasSplit = false;

    if (content.length > fragmentSize) {
      sectionContentWasSplit = true;
      for (let offset = 0; offset < content.length; offset += fragmentSize) {
        const end = Math.min(content.length, offset + fragmentSize);
        const fragment: Section = {
          ...base,
          content: content.slice(offset, end),
          sourceReference: `PARTIAL_SECTION_CONTENT:${offset}:${end}`
        };
        if (JSON.stringify(fragment).length > maxChars) {
          throw new Error(`Unable to safely chunk source content for section "${section.title}". No document changes were applied.`);
        }
        chunks.push({
          sections: [fragment],
          partialSectionIds: new Set([section.id]),
          partialClauseIds: new Set()
        });
      }
    } else {
      const fragment: Section = { ...base, content, sourceReference: section.sourceReference };
      if (JSON.stringify(fragment).length > maxChars) {
        throw new Error(`Section metadata for "${section.title}" exceeds the safe AI chunk limit. No document changes were applied.`);
      }
      chunks.push({
        sections: [fragment],
        partialSectionIds: new Set(),
        partialClauseIds: new Set()
      });
    }

    let clauseBatch: typeof section.clauses = [];
    let clauseBatchSize = JSON.stringify({ ...base, content: '' }).length;
    const flushClauses = () => {
      if (!clauseBatch.length) return;
      const fragment: Section = {
        ...base,
        content: '',
        clauses: clauseBatch,
        sourceReference: section.sourceReference
      };
      chunks.push({
        sections: [fragment],
        partialSectionIds: new Set(),
        partialClauseIds: new Set()
      });
      clauseBatch = [];
      clauseBatchSize = JSON.stringify({ ...base, content: '' }).length;
    };

    for (const clause of section.clauses || []) {
      const clauseSize = JSON.stringify(clause).length;
      if (clauseSize > maxChars - clauseBatchSize) {
        flushClauses();
        if (clauseSize > maxChars - clauseBatchSize) {
          const clauseBase = { ...clause, content: '' };
          const sliceSize = Math.max(300, maxChars - JSON.stringify({ ...base, clauses: [clauseBase] }).length - 300);
          const clauseContent = clause.content || '';
          for (let offset = 0; offset < clauseContent.length; offset += sliceSize) {
            const end = Math.min(clauseContent.length, offset + sliceSize);
            const fragmentClause = {
              ...clause,
              content: clauseContent.slice(offset, end),
              sourceReference: `PARTIAL_CLAUSE_CONTENT:${offset}:${end}`
            };
            chunks.push({
              sections: [{ ...base, content: '', clauses: [fragmentClause] }],
              partialSectionIds: new Set(),
              partialClauseIds: new Set([clause.id])
            });
          }
          continue;
        }
      }
      clauseBatch.push(clause);
      clauseBatchSize += clauseSize;
    }
    flushClauses();

    if (!content && !(section.clauses || []).length && (section.tables?.length || section.charts?.length || section.images?.length)) {
      throw new Error(`Section "${section.title}" contains a non-text block larger than the safe AI chunk limit. No document changes were applied.`);
    }
    if (sectionContentWasSplit && !chunks.some(chunk => chunk.partialSectionIds.has(section.id))) {
      throw new Error(`Source content for section "${section.title}" could not be chunked safely. No document changes were applied.`);
    }
  }
  flush();
  return chunks;
}


function applySectionRangeMoves(
  sections: Section[],
  moves: SectionRangeMove[]
): { sections: Section[]; movedToTarget: Map<string, string> } {
  let working = [...sections];
  const movedToTarget = new Map<string, string>();
  const usedSections = new Set<string>();

  for (const move of moves) {
    const startIndex = working.findIndex(section => section.id === move.startSectionId);
    const endIndex = working.findIndex(section => section.id === move.endBeforeSectionId);
    if (startIndex < 0 || endIndex < 0 || endIndex <= startIndex) {
      throw new Error('AI section-range move references an unknown or invalid range boundary. No changes were applied.');
    }
    const range = working.slice(startIndex, endIndex);
    const target = range.find(section => section.id === move.targetSectionId);
    if (!target) {
      throw new Error('AI section-range destination must be inside the selected range. No changes were applied.');
    }
    if (range.some(section => usedSections.has(section.id))) {
      throw new Error('AI returned overlapping section-range moves. No changes were applied.');
    }
    range.forEach(section => usedSections.add(section.id));

    const mergedContent = range.map(section => {
      if (section.id === target.id) return section.content || '';
      const heading = section.title ? section.title : '';
      return [heading, section.content || ''].filter(Boolean).join('\n');
    }).filter(value => value.length > 0).join('\n\n');

    const mergedClauses = range.flatMap(section => section.clauses || []);
    const mergedTables = range.flatMap(section => section.tables || []);
    const mergedCharts = range.flatMap(section => section.charts || []);
    const mergedImages = range.flatMap(section => section.images || []);

    const assertUnique = (items: Array<{ id: string }>, label: string) => {
      const ids = items.map(item => item.id);
      if (new Set(ids).size !== ids.length) {
        throw new Error(`AI section-range move contains duplicate ${label} IDs. No changes were applied.`);
      }
    };
    assertUnique(mergedClauses, 'clause');
    assertUnique(mergedTables, 'table');
    assertUnique(mergedCharts, 'chart');
    assertUnique(mergedImages, 'image');

    const mergedTarget: Section = {
      ...target,
      content: mergedContent,
      clauses: mergedClauses,
      ...(mergedTables.length ? { tables: mergedTables } : { tables: undefined }),
      ...(mergedCharts.length ? { charts: mergedCharts } : { charts: undefined }),
      ...(mergedImages.length ? { images: mergedImages } : { images: undefined })
    };

    const rangeIds = new Set(range.map(section => section.id));
    working = working
      .filter(section => !rangeIds.has(section.id) || section.id === target.id)
      .map(section => section.id === target.id ? mergedTarget : section);
    range.forEach(section => {
      if (section.id !== target.id) movedToTarget.set(section.id, target.id);
    });
  }

  return {
    sections: working.map((section, index) => ({ ...section, orderIndex: index + 1 })),
    movedToTarget
  };
}

function requiresStructuralContext(instruction: string): boolean {
  return /\b(move|merge|consolidate|combine|split|reorder|re-organize|reorganize|rearrange|group|contain|place|put|inside|within|transfer|relocate|extract|insert|delete|remove|duplicate|copy|create|add|rename|everything from|move all)\b/i.test(instruction) ||
    /\b(change|update|modify|edit|replace)\b.{0,40}\b(section|clause|table|chart|image|heading|title|row|column|appendix|exhibit|schedule|signature)\b/i.test(instruction);
}
export function buildStructuralEditPrompt(
  instruction: string,
  document: DocumentModel,
  persona: AIPersona | string
): string {
  const inventory = document.sections.map((section, sectionIndex) => ({
    sectionIndex,
    sectionId: section.id,
    sectionNumber: section.sectionNumber,
    title: section.title,
    contentPreview: (section.content || '').slice(0, 1800),
    clauses: (section.clauses || []).map((clause, clauseIndex) => ({
      clauseIndex,
      clauseId: clause.id,
      heading: clause.heading || '',
      contentPreview: clause.content.slice(0, 500)
    })),
    tables: (section.tables || []).map((table, tableIndex) => ({ tableIndex, tableId: table.id, title: table.title || table.caption || '' })),
    charts: (section.charts || []).map((chart, chartIndex) => ({ chartIndex, chartId: chart.id, title: chart.title })),
    images: (section.images || []).map((image, imageIndex) => ({ imageIndex, imageId: image.id, caption: image.caption || '', altText: image.altText || '' }))
  }));
  const globalCollectionInventory = Object.fromEntries(
    ['signatures', 'definitions', 'dependencies', 'redactions'].map(key => [
      key,
      Array.isArray((document as any)[key])
        ? (document as any)[key].map((item: any, index: number) => ({
            index,
            id: item?.id || null,
            title: item?.title || item?.heading || item?.name || ''
          }))
        : []
    ])
  );

  return [
    'You are the structural document-control engine for AI PDF Studio.',
    'Interpret the complete user request and return executable, validated operations, not a summary or a plan.',
    'You have the complete section inventory. The application has the complete original content and will move structured blocks deterministically by ID.',
    'For a request such as "everything from heading A up to the box above heading B belongs inside heading A", return one sectionRangeMoves item: startSectionId is heading A, endBeforeSectionId is heading B (exclusive), targetSectionId is the destination box. Do not include the boundary section.',
    'A sectionRangeMoves operation preserves original wording, clauses, tables, charts, images, and IDs. It removes the absorbed source sections only after all blocks are transferred.',
    'For pure section reordering, return sectionOrder as a complete permutation of every section ID. Do not return sectionOrder for other requests.',
    'For all other document-wide structural changes, use documentPatch as an RFC 6902 JSON Patch operation list. Supported operations are add, remove, replace, move, copy, and test. Use the sectionIndex, clauseIndex, tableIndex, chartIndex, and imageIndex values from the inventory to construct exact JSON Pointer paths. Only target supported document roots such as /sections, /title, /styles, /design, /pageConfig, /signatures, /definitions, /dependencies, and /redactions. Never modify protected app metadata or invent IDs.',
    'Use add/create only when the user asks to add or create. Use remove only when the user explicitly asks to delete/remove. Use copy only for copy/duplicate requests. Use move only for move/transfer/reorder requests. Use replace only for explicit change/rename/rewrite/update requests. Do not mix documentPatch with sectionUpdates or other operation formats.',
    'Use sectionUpdates only for explicit title or wording changes. Never rewrite text to imitate moving, merging, or grouping.',
    'Use exact IDs for existing objects. Generate fresh unique IDs only for newly created objects. Do not omit source material. Use remove only when the user explicitly requests deletion. A sectionRangeMoves operation removes source section shells only after every original block is transferred to the destination. If the target or boundary is ambiguous, return no operations and explain exactly what is ambiguous.',
    'Return strict JSON only, using this schema: {"operationTitle":"...","details":["..."],"sectionUpdates":[],"sectionOrder":["only for explicit reorder"],"sectionRangeMoves":[{"startSectionId":"...","endBeforeSectionId":"...","targetSectionId":"..."}],"documentPatch":[{"op":"move","from":"/sections/0/clauses/0","path":"/sections/1/clauses/-"}],"styles":{},"pageConfig":{},"design":{},"sectionDesignUpdates":[],"tableDesignUpdates":[]}.',
    'Document title: ' + document.title,
    'Persona: ' + persona,
    'Section count: ' + document.sections.length,
    'Complete section inventory: ' + JSON.stringify(inventory),
    'Global document collections: ' + JSON.stringify(globalCollectionInventory),
    'User instruction: ' + instruction
  ].join('\n\n');
}

function mergeSectionUpdates(updates: SectionEdit[]): SectionEdit[] {
  const merged = new Map<string, SectionEdit>();
  for (const update of updates) {
    const existing = merged.get(update.sectionId);
    if (!existing) {
      merged.set(update.sectionId, { ...update, clauses: update.clauses ? [...update.clauses] : undefined });
      continue;
    }
    if (existing.title !== undefined && update.title !== undefined && existing.title !== update.title) {
      throw new Error(`Gemini returned conflicting titles for section ${update.sectionId}. No changes were applied.`);
    }
    if (existing.content !== undefined && update.content !== undefined && existing.content !== update.content) {
      throw new Error(`Gemini returned conflicting content for section ${update.sectionId}. No changes were applied.`);
    }
    existing.title ??= update.title;
    existing.content ??= update.content;
    if (existing.orderIndex !== undefined && update.orderIndex !== undefined && existing.orderIndex !== update.orderIndex) {
      throw new Error(`Gemini returned conflicting order indexes for section ${update.sectionId}. No changes were applied.`);
    }
    existing.orderIndex ??= update.orderIndex;
    const clauseMap = new Map((existing.clauses || []).map(clause => [clause.id, clause]));
    for (const clause of update.clauses || []) {
      const prior = clauseMap.get(clause.id);
      if (prior) {
        for (const key of ['heading', 'content', 'orderIndex'] as const) {
          const previousValue = prior[key];
          const incomingValue = clause[key];
          if (previousValue !== undefined && incomingValue !== undefined && previousValue !== incomingValue) {
            throw new Error(`Gemini returned conflicting edits for clause ${clause.id}. No changes were applied.`);
          }
          if (previousValue === undefined && incomingValue !== undefined) (prior as any)[key] = incomingValue;
        }
      } else {
        clauseMap.set(clause.id, clause);
      }
    }
    existing.clauses = [...clauseMap.values()];
  }
  return [...merged.values()];
}

function parseModelResponse(text: string | undefined): DocumentEditResponse {
  if (!text?.trim()) throw new Error('Gemini returned an empty document-edit response.');
  const normalized = text.trim().replace(/^\`\`\`(?:json)?\s*/i, '').replace(/\s*\`\`\`$/, '');
  let parsed: unknown;
  try {
    parsed = JSON.parse(normalized);
  } catch {
    throw new Error('Gemini returned invalid JSON. The document was not changed.');
  }
  if (
    !isRecord(parsed) ||
    typeof parsed.operationTitle !== 'string' ||
    !Array.isArray(parsed.details) ||
    !parsed.details.every(item => typeof item === 'string') ||
    !Array.isArray(parsed.sectionUpdates)
  ) {
    throw new Error('Gemini response does not match the required document-edit schema.');
  }
  return parsed as unknown as DocumentEditResponse;
}

export function prepareLongInstruction(
  instruction: string,
  currentDoc: DocumentModel,
  threshold = 12000
): { instruction: string; document: DocumentModel } {
  if (instruction.length <= threshold) return { instruction, document: currentDoc };

  const marker = /(?:source\s+content|document\s+content|text\s+to\s+include|following\s+text|following\s+content|full\s+text|source|content|text)\s*[:：][ \t]*/i;
  const match = marker.exec(instruction);
  if (!match || match.index === undefined) {
    throw new Error(
      'This message contains a large amount of text but no clear source-content boundary. Add a marker such as "SOURCE CONTENT:" before the material so it can be preserved and processed in chunks. No document changes were applied.'
    );
  }

  const sourceStart = match.index + match[0].length;
  const sourceText = instruction.slice(sourceStart);
  if (!sourceText.trim()) {
    throw new Error('The SOURCE CONTENT marker is present, but no source text follows it. No document changes were applied.');
  }

  const directive = instruction.slice(0, match.index).trim() || 'Format the supplied source content as a document.';
  const sectionId = `${currentDoc.id}_source_${currentDoc.version + 1}`;
  if (currentDoc.sections.some(section => section.id === sectionId)) {
    throw new Error('A source-content section with this document version already exists. No document changes were applied.');
  }

  const sourceSection: Section = {
    id: sectionId,
    sectionNumber: '',
    title: 'USER-PROVIDED SOURCE CONTENT',
    content: sourceText,
    clauses: [],
    orderIndex: currentDoc.sections.length + 1,
    sourceReference: 'User-supplied source content. Preserve verbatim unless a rewrite is explicitly requested.'
  };

  return {
    instruction: `${directive}\n\nThe complete source text is stored verbatim in section ${sectionId}. Process it in bounded chunks. Do not summarize, condense, omit, or replace the source wording unless the instruction explicitly requests a rewrite.`,
    document: recalculateNumbering({ ...currentDoc, sections: [...currentDoc.sections, sourceSection] })
  };
}

export function buildDocumentEditPrompt(
  instruction: string,
  document: DocumentModel,
  persona: AIPersona | string,
  sections: Section[]
): string {
  const sectionInventory = document.sections.map(section => ({
    id: section.id,
    sectionNumber: section.sectionNumber,
    title: section.title
  }));

  return [
    'You are the document editor inside AI PDF Studio.',
    'Execute the user instruction against the supplied document sections. You are not a summarization assistant.',
    'Never return only a description of changes. Return executable structured document updates.',
    'Never summarize, condense, paraphrase, omit, or replace source wording unless the user explicitly requests a text rewrite.',
    'When the instruction is about formatting or organization, preserve every existing content and clause string exactly.',
    'For explicit visual styling requests, use design, sectionDesignUpdates, or tableDesignUpdates. Use only exact IDs from the supplied document. Do not use content or title changes as a substitute for styling.',
    'When returning a document-wide design patch, include only the nested tokens that need to change. Color values must be hexadecimal. Gradient fills require at least two ordered stops.',
    'The current document design model is: ' + JSON.stringify(document.design || null),
    'For edits to existing objects, use only exact IDs included in the supplied document. For newly created objects explicitly requested by the user, generate fresh unique IDs that do not collide with any existing ID.',
    'If a supplied section has a sourceReference beginning with PARTIAL_SECTION_CONTENT or a clause has PARTIAL_CLAUSE_CONTENT, it is an excerpt only. Never return a replacement content value for that excerpt. Preserve the full original text by leaving its content field untouched.',
    'Never delete sections or clauses unless the user explicitly asks for deletion, or a sectionRangeMoves operation transfers every block into its destination. Preserve all supplied source text unless the instruction explicitly authorizes a targeted text edit.',
    'Do not include sectionOrder at all unless the user explicitly asks to reorder, rearrange, or change the order of document sections. For every other task, omit sectionOrder completely.',
    'For document-wide structural CRUD or block-level moves not covered by the existing fields, return documentPatch as an RFC 6902 JSON Patch array with add, remove, replace, move, copy, and test operations. Use only supported document roots and exact IDs/paths from the supplied section inventory. Never modify protected metadata. New objects require fresh unique IDs.',
    'For structural requests that move a continuous range of sections into one existing section/container, return sectionRangeMoves. Identify startSectionId from the first named heading, endBeforeSectionId from the boundary heading that must remain outside the move, and targetSectionId from the destination box. The start is inclusive and the end boundary is exclusive. The target must be inside the selected range. The application moves the original structured blocks without rewriting their wording.',
    'Never simulate a move by rewriting content. Use sectionRangeMoves for heading-bounded consolidation and sectionOrder only for pure reordering. Preserve tables, charts, images, clauses, IDs, source references, and all original wording.',
    'Return one JSON object and no markdown fences with this exact shape:',
    '{"operationTitle":"short action name","details":["actual operation performed"],"sectionUpdates":[{"sectionId":"existing-id","title":"optional title","content":"only when explicitly requested","orderIndex":1,"clauses":[{"id":"existing-clause-id","heading":"optional heading","content":"only when explicitly requested","orderIndex":1}]}],"sectionOrder":["all document section IDs in desired order, only when the user requests reordering"],"sectionRangeMoves":[{"startSectionId":"inclusive-start-id","endBeforeSectionId":"exclusive-boundary-id","targetSectionId":"existing-destination-id"}],"documentPatch":[{"op":"move","from":"/sections/0/clauses/0","path":"/sections/1/clauses/-"}],"styles":{},"pageConfig":{},"design":{},"sectionDesignUpdates":[{"sectionId":"existing-id","design":{}}],"tableDesignUpdates":[{"sectionId":"existing-id","tableId":"existing-table-id","design":{}}]}',
    'Use empty arrays/omit optional fields when no changes are needed. Do not claim an operation was completed unless you return the corresponding update.',
    `Persona: ${persona}`,
    `User instruction: ${instruction}`,
    `Document title: ${document.title}`,
    `Complete section inventory (IDs and titles only): ${JSON.stringify(sectionInventory)}`,
    `Current document chunk: ${JSON.stringify(sections)}`
  ].join('\n\n');
}

export 
const PATCHABLE_DOCUMENT_ROOTS = new Set([
  'title', 'type', 'author', 'brandProfileId', 'styles', 'design',
  'pageConfig', 'sections', 'signatures', 'definitions', 'dependencies', 'redactions'
]);
const FORBIDDEN_POINTER_SEGMENTS = new Set(['__proto__', 'prototype', 'constructor']);

function jsonPointerTokens(path: string): string[] {
  if (typeof path !== 'string' || !path.startsWith('/') || path === '/') {
    throw new Error('JSON Patch paths must target an existing document field. Root replacement is not allowed.');
  }
  const tokens = path.slice(1).split('/').map(token => token.replace(/~1/g, '/').replace(/~0/g, '~'));
  if (!tokens.length || !PATCHABLE_DOCUMENT_ROOTS.has(tokens[0])) {
    throw new Error('JSON Patch path targets a protected or unsupported document field.');
  }
  if (tokens.some(token => FORBIDDEN_POINTER_SEGMENTS.has(token))) {
    throw new Error('Unsafe JSON Patch path rejected to prevent prototype pollution.');
  }
  return tokens;
}

function arrayIndex(token: string, length: number, allowEnd: boolean): number {
  if (allowEnd && token === '-') return length;
  if (!/^(0|[1-9]\d*)$/.test(token)) throw new Error('JSON Patch contains an invalid array index.');
  const index = Number(token);
  if (!Number.isSafeInteger(index) || index < 0 || index > (allowEnd ? length : length - 1)) {
    throw new Error('JSON Patch array index does not exist or is out of range.');
  }
  return index;
}

function patchParent(root: Record<string, unknown>, path: string): { parent: Record<string, unknown> | unknown[]; key: string } {
  const tokens = jsonPointerTokens(path);
  let current: any = root;
  for (const token of tokens.slice(0, -1)) {
    if (current === null || typeof current !== 'object') throw new Error('JSON Patch path does not exist.');
    if (Array.isArray(current)) current = current[arrayIndex(token, current.length, false)];
    else {
      if (!Object.prototype.hasOwnProperty.call(current, token)) throw new Error('JSON Patch path does not exist.');
      current = current[token];
    }
  }
  if (current === null || typeof current !== 'object') throw new Error('JSON Patch parent path does not exist.');
  return { parent: current, key: tokens[tokens.length - 1] };
}

function patchGet(root: Record<string, unknown>, path: string): unknown {
  const tokens = jsonPointerTokens(path);
  let current: any = root;
  for (const token of tokens) {
    if (current === null || typeof current !== 'object') throw new Error('JSON Patch source path does not exist.');
    if (Array.isArray(current)) current = current[arrayIndex(token, current.length, false)];
    else {
      if (!Object.prototype.hasOwnProperty.call(current, token)) throw new Error('JSON Patch source path does not exist.');
      current = current[token];
    }
  }
  return current;
}

function patchAdd(root: Record<string, unknown>, path: string, value: unknown): void {
  const { parent, key } = patchParent(root, path);
  const cloned = JSON.parse(JSON.stringify(value));
  if (Array.isArray(parent)) parent.splice(arrayIndex(key, parent.length, true), 0, cloned);
  else (parent as Record<string, unknown>)[key] = cloned;
}

function patchReplace(root: Record<string, unknown>, path: string, value: unknown): void {
  const { parent, key } = patchParent(root, path);
  const cloned = JSON.parse(JSON.stringify(value));
  if (Array.isArray(parent)) parent[arrayIndex(key, parent.length, false)] = cloned;
  else {
    if (!Object.prototype.hasOwnProperty.call(parent, key)) throw new Error('JSON Patch replace target does not exist.');
    (parent as Record<string, unknown>)[key] = cloned;
  }
}

function patchRemove(root: Record<string, unknown>, path: string): unknown {
  const { parent, key } = patchParent(root, path);
  if (Array.isArray(parent)) return parent.splice(arrayIndex(key, parent.length, false), 1)[0];
  if (!Object.prototype.hasOwnProperty.call(parent, key)) throw new Error('JSON Patch remove target does not exist.');
  const value = (parent as Record<string, unknown>)[key];
  delete (parent as Record<string, unknown>)[key];
  return value;
}

function validatePatchedDocument(document: DocumentModel): void {
  if (!document || typeof document.title !== 'string' || !Array.isArray(document.sections)) {
    throw new Error('JSON Patch did not produce a valid document model.');
  }
  const sectionIds = new Set<string>();
  const clauseIds = new Set<string>();
  const tableIds = new Set<string>();
  const chartIds = new Set<string>();
  const imageIds = new Set<string>();

  for (const section of document.sections) {
    if (!section || typeof section.id !== 'string' || typeof section.title !== 'string' || !Array.isArray(section.clauses)) {
      throw new Error('JSON Patch produced a section with invalid identity, title, or clause structure.');
    }
    if (sectionIds.has(section.id)) throw new Error(`JSON Patch produced duplicate section ID: ${section.id}.`);
    sectionIds.add(section.id);
    for (const clause of section.clauses) {
      if (!clause || typeof clause.id !== 'string' || typeof clause.content !== 'string' || clauseIds.has(clause.id)) {
        throw new Error('JSON Patch produced an invalid or duplicate clause.');
      }
      clauseIds.add(clause.id);
    }
    for (const table of section.tables || []) {
      if (!table || typeof table.id !== 'string' || tableIds.has(table.id)) throw new Error('JSON Patch produced an invalid or duplicate table.');
      tableIds.add(table.id);
    }
    for (const chart of section.charts || []) {
      if (!chart || typeof chart.id !== 'string' || chartIds.has(chart.id)) throw new Error('JSON Patch produced an invalid or duplicate chart.');
      chartIds.add(chart.id);
    }
    for (const image of section.images || []) {
      if (!image || typeof image.id !== 'string' || imageIds.has(image.id)) throw new Error('JSON Patch produced an invalid or duplicate image.');
      imageIds.add(image.id);
    }
    if (section.design) validateSectionDesign(section.design);
    section.tables?.forEach(table => { if (table.design) validateTableDesign(table.design); });
  }
  if (document.design) validateDocumentDesign(document.design);
}

function applyDocumentJsonPatch(
  currentDoc: DocumentModel,
  response: DocumentEditResponse,
  instruction: string
): { updatedDoc: DocumentModel; summary: ExecutionResultSummary } {
  const patch = response.documentPatch || [];
  if (!patch.length || patch.length > 500) throw new Error('JSON Patch must contain between 1 and 500 operations.');
  if (
    response.sectionUpdates.length ||
    response.sectionOrder !== undefined ||
    response.sectionRangeMoves?.length ||
    response.styles !== undefined ||
    response.pageConfig !== undefined ||
    response.design !== undefined ||
    response.sectionDesignUpdates?.length ||
    response.tableDesignUpdates?.length
  ) {
    throw new Error('JSON Patch cannot be mixed with other document-edit operation formats. No changes were applied.');
  }

  const candidate = JSON.parse(JSON.stringify(currentDoc)) as DocumentModel;
  const instructionText = instruction.toLowerCase();
  const changesSections = patch.some(operation => operation.path.startsWith('/sections') || ('from' in operation && operation.from.startsWith('/sections')));

  for (const operation of patch) {
    if (!operation || typeof operation.path !== 'string') throw new Error('JSON Patch contains an invalid operation.');
    const path = jsonPointerTokens(operation.path);
    void path;
    if (operation.op === 'add') {
      if (!/\b(add|create|insert|append|include|build|split)\b/i.test(instructionText)) {
        throw new Error('The instruction does not authorize adding document content. No changes were applied.');
      }
      patchAdd(candidate as unknown as Record<string, unknown>, operation.path, operation.value);
    } else if (operation.op === 'remove') {
      if (!/\b(delete|remove|erase|clear|drop|omit|eliminate|discard|merge|combine|consolidate)\b/i.test(instructionText)) {
        throw new Error('The instruction does not authorize deleting document content. No changes were applied.');
      }
      patchRemove(candidate as unknown as Record<string, unknown>, operation.path);
    } else if (operation.op === 'replace') {
      if (!/\b(replace|rewrite|rename|change|update|modify|edit|set|correct|fix|format|style|design)\b/i.test(instructionText) &&
          !(operation.path.endsWith('/id') && /\b(copy|duplicate|clone)\b/i.test(instructionText))) {
        throw new Error('The instruction does not authorize replacing document content. No changes were applied.');
      }
      if (!('value' in operation)) throw new Error('JSON Patch replace operation is missing its value.');
      patchReplace(candidate as unknown as Record<string, unknown>, operation.path, operation.value);
    } else if (operation.op === 'move') {
      if (!/\b(move|transfer|relocate|reorder|rearrange|place|put|group|consolidate|merge|combine|split|contain|contained|inside|within|everything from)\b/i.test(instructionText)) {
        throw new Error('The instruction does not authorize moving document content. No changes were applied.');
      }
      const fromTokens = jsonPointerTokens(operation.from);
      const toTokens = jsonPointerTokens(operation.path);
      if (toTokens.length > fromTokens.length && fromTokens.every((token, index) => token === toTokens[index])) {
        throw new Error('JSON Patch cannot move a value into one of its descendants.');
      }
      const value = patchRemove(candidate as unknown as Record<string, unknown>, operation.from);
      patchAdd(candidate as unknown as Record<string, unknown>, operation.path, value);
    } else if (operation.op === 'copy') {
      if (!/\b(copy|duplicate|clone)\b/i.test(instructionText)) {
        throw new Error('The instruction does not authorize copying document content. No changes were applied.');
      }
      patchAdd(candidate as unknown as Record<string, unknown>, operation.path, patchGet(candidate as unknown as Record<string, unknown>, operation.from));
    } else if (operation.op === 'test') {
      const actual = patchGet(candidate as unknown as Record<string, unknown>, operation.path);
      if (JSON.stringify(actual) !== JSON.stringify(operation.value)) {
        throw new Error('JSON Patch test operation failed. No document changes were applied.');
      }
    } else {
      throw new Error('JSON Patch operation is not supported. No document changes were applied.');
    }
  }

  if (changesSections) {
    candidate.sections = recalculateNumbering(candidate).sections;
  }
  candidate.version = currentDoc.version + 1;
  candidate.updatedAt = new Date().toISOString();
  candidate.changeSummary = response.operationTitle;
  validatePatchedDocument(candidate);

  const summary: ExecutionResultSummary = {
    operationTitle: response.operationTitle || 'Document updated',
    details: response.details,
    verifications: [
      { name: 'Atomic JSON Patch application', passed: true, notes: `${patch.length} operations applied to an isolated document copy.` },
      { name: 'Document structure and unique block IDs', passed: true, notes: 'Sections, clauses, tables, charts, images, and design tokens validated.' },
      { name: 'Source-of-truth metadata preservation', passed: candidate.sourceText === currentDoc.sourceText && JSON.stringify(candidate.sourceIntegrity) === JSON.stringify(currentDoc.sourceIntegrity) }
    ],
    timestamp: new Date().toLocaleTimeString(),
    versionCreated: candidate.version
  };
  if (summary.verifications.some(check => !check.passed)) {
    throw new Error('Document integrity verification failed. No changes were applied.');
  }
  return { updatedDoc: candidate, summary };
}

function applyDocumentEditResponse(
  currentDoc: DocumentModel,
  response: DocumentEditResponse,
  instruction: string
): { updatedDoc: DocumentModel; summary: ExecutionResultSummary } {
  if (!response || !Array.isArray(response.sectionUpdates) || !Array.isArray(response.details)) {
    throw new Error('Invalid document-edit response. No changes were applied.');
  }
  if (response.documentPatch !== undefined) return applyDocumentJsonPatch(currentDoc, response, instruction);

  const originalIds = currentDoc.sections.map(section => section.id);
  const knownIds = new Set(originalIds);
  const updatedIds = new Set<string>();
  const mayEditText = explicitTextEdit(instruction);
  const isDesignOnly = designOnlyInstruction(instruction);
  const sections = currentDoc.sections.map(section => ({ ...section, clauses: section.clauses.map(clause => ({ ...clause })) }));
  if (isDesignOnly && (
    response.sectionUpdates.length > 0 ||
    response.sectionRangeMoves?.length ||
    response.sectionOrder !== undefined ||
    response.styles !== undefined ||
    response.pageConfig !== undefined
  )) {
    throw new Error('Text edits are not authorized for a design-only instruction. Section order, legacy formatting, and page layout cannot be changed in this operation. No changes were applied.');
  }

  for (const update of response.sectionUpdates) {
    if (!update || typeof update.sectionId !== 'string' || !knownIds.has(update.sectionId)) {
      throw new Error(`Gemini referenced an unknown section ID: ${String(update?.sectionId)}. No changes were applied.`);
    }
    if (updatedIds.has(update.sectionId)) {
      throw new Error(`Gemini returned duplicate updates for section ${update.sectionId}. No changes were applied.`);
    }
    updatedIds.add(update.sectionId);

    const target = sections.find(section => section.id === update.sectionId)!;
    if (update.title !== undefined) target.title = update.title;
    if (update.orderIndex !== undefined) target.orderIndex = update.orderIndex;

    if (update.content !== undefined) {
      if (!mayEditText) throw new Error('Text edits are not authorized unless the user explicitly requests a rewrite. No changes were applied.');
      target.content = update.content;
    }

    if (update.clauses !== undefined) {
      if (!Array.isArray(update.clauses)) throw new Error('Gemini returned an invalid clause update. No changes were applied.');
      const clauseIds = new Set(target.clauses.map(clause => clause.id));
      const seenClauseIds = new Set<string>();
      for (const clauseUpdate of update.clauses) {
        if (!clauseUpdate || !clauseIds.has(clauseUpdate.id)) {
          throw new Error(`Gemini referenced an unknown clause ID in section ${target.id}. No changes were applied.`);
        }
        if (seenClauseIds.has(clauseUpdate.id)) {
          throw new Error(`Gemini returned a duplicate clause update in section ${target.id}. No changes were applied.`);
        }
        seenClauseIds.add(clauseUpdate.id);
        const clause = target.clauses.find(item => item.id === clauseUpdate.id)!;
        if (clauseUpdate.heading !== undefined) clause.heading = clauseUpdate.heading;
        if (clauseUpdate.orderIndex !== undefined) clause.orderIndex = clauseUpdate.orderIndex;
        if (clauseUpdate.content !== undefined) {
          if (!mayEditText) throw new Error('Clause text edits are not authorized unless the user explicitly requests a rewrite. No changes were applied.');
          clause.content = clauseUpdate.content;
        }
      }
    }
  }

  let orderedSections = sections;
  if (response.sectionOrder !== undefined) {
    if (
      !Array.isArray(response.sectionOrder) ||
      response.sectionOrder.length !== originalIds.length ||
      new Set(response.sectionOrder).size !== originalIds.length ||
      response.sectionOrder.some(id => !knownIds.has(id))
    ) {
      throw new Error('AI section order must be a complete permutation of all existing section IDs. No changes were applied.');
    }
    orderedSections = response.sectionOrder.map(id => sections.find(section => section.id === id)!);
  }

  if (response.styles !== undefined && !isRecord(response.styles)) {
    throw new Error('Gemini returned invalid style updates. No changes were applied.');
  }
  if (response.pageConfig !== undefined && !isRecord(response.pageConfig)) {
    throw new Error('Gemini returned invalid page configuration updates. No changes were applied.');
  }

  const sectionDesignIds = new Set<string>();
  for (const update of response.sectionDesignUpdates || []) {
    if (!update || typeof update.sectionId !== 'string' || !knownIds.has(update.sectionId)) {
      throw new Error('AI returned an unknown section for a design override. No changes were applied.');
    }
    if (sectionDesignIds.has(update.sectionId)) throw new Error('AI returned duplicate section design overrides. No changes were applied.');
    sectionDesignIds.add(update.sectionId);
    const target = sections.find(section => section.id === update.sectionId)!;
    if (update.design === null) {
      target.design = undefined;
    } else {
      if (!update.design || !isRecord(update.design)) throw new Error('AI returned an invalid section design patch. No changes were applied.');
      target.design = mergePatch<SectionDesign>(target.design || {}, update.design);
      validateSectionDesign(target.design);
    }
  }

  const tableDesignIds = new Set<string>();
  for (const update of response.tableDesignUpdates || []) {
    if (!update || typeof update.sectionId !== 'string' || typeof update.tableId !== 'string' || !knownIds.has(update.sectionId)) {
      throw new Error('AI returned an unknown section or table for a design override. No changes were applied.');
    }
    const key = update.sectionId + ':' + update.tableId;
    if (tableDesignIds.has(key)) throw new Error('AI returned duplicate table design overrides. No changes were applied.');
    tableDesignIds.add(key);
    const targetSection = sections.find(section => section.id === update.sectionId)!;
    const targetTable = targetSection.tables?.find(table => table.id === update.tableId);
    if (!targetTable) throw new Error('AI returned an unknown table ID for a design override. No changes were applied.');
    if (update.design === null) {
      targetTable.design = undefined;
    } else {
      if (!update.design || !isRecord(update.design)) throw new Error('AI returned an invalid table design patch. No changes were applied.');
      targetTable.design = mergePatch<TableDesign>(targetTable.design || {}, update.design);
      validateTableDesign(targetTable.design);
    }
  }

  const rangeMoveResult = applySectionRangeMoves(orderedSections, response.sectionRangeMoves || []);
  orderedSections = rangeMoveResult.sections;

  let design = normalizeDocumentDesign(currentDoc).design!;
  if (response.design !== undefined) {
    if (!isRecord(response.design)) throw new Error('AI returned an invalid document design patch. No changes were applied.');
    const presetId = response.design.presetId;
    if (presetId !== undefined) {
      if (typeof presetId !== 'string') throw new Error('AI returned an invalid design preset ID. No changes were applied.');
      const preset = DOCUMENT_DESIGN_PRESETS.find(item => item.presetId === presetId);
      if (!preset) throw new Error('AI returned an unknown document design preset. No changes were applied.');
      design = deepCloneDesign(preset);
    }
    design = mergePatch<DocumentDesign>(design, response.design);
    validateDocumentDesign(design);
  }

  const candidate: DocumentModel = {
    ...currentDoc,
    sections: orderedSections,
    design,
    styles: { ...currentDoc.styles, ...(response.styles || {}) },
    pageConfig: { ...currentDoc.pageConfig, ...(response.pageConfig || {}) },
    version: currentDoc.version + 1,
    updatedAt: new Date().toISOString(),
    changeSummary: response.operationTitle
  };

  const updatedDoc = response.sectionOrder || response.sectionRangeMoves?.length
    ? recalculateNumbering(candidate)
    : candidate;
  const summary: ExecutionResultSummary = {
    operationTitle: response.operationTitle || 'Document updated',
    details: response.details,
    verifications: [
      {
        name: 'Existing section identity',
        passed: updatedDoc.sections.length === originalIds.length - rangeMoveResult.movedToTarget.size &&
          new Set(updatedDoc.sections.map(section => section.id)).size === updatedDoc.sections.length &&
          updatedDoc.sections.every(section => knownIds.has(section.id)) &&
          updatedDoc.sections.every(section => !rangeMoveResult.movedToTarget.has(section.id)) &&
          originalIds.filter(id => !rangeMoveResult.movedToTarget.has(id)).every(id => updatedDoc.sections.some(section => section.id === id))
      },
      {
        name: 'Untouched and transferred source content preservation',
        passed: currentDoc.sections.every(before => {
          const targetId = rangeMoveResult.movedToTarget.get(before.id) || before.id;
          const after = updatedDoc.sections.find(item => item.id === targetId);
          if (!after) return false;
          const explicitlyUpdated = response.sectionUpdates.find(item => item.sectionId === before.id);
          if (explicitlyUpdated?.content !== undefined && mayEditText) return true;
          if (rangeMoveResult.movedToTarget.has(before.id) || response.sectionRangeMoves?.some(move => move.targetSectionId === before.id)) {
            if (before.content && !(after.content || '').includes(before.content)) return false;
            if (before.id !== targetId && before.title && !(after.content || '').includes(before.title)) return false;
            for (const clause of before.clauses || []) {
              const retained = after.clauses.find(item => item.id === clause.id);
              if (!retained || retained.content !== clause.content) return false;
            }
            for (const table of before.tables || []) {
              const retained = after.tables?.find(item => item.id === table.id);
              if (!retained || JSON.stringify(retained) !== JSON.stringify(table)) return false;
            }
            for (const chart of before.charts || []) {
              const retained = after.charts?.find(item => item.id === chart.id);
              if (!retained || JSON.stringify(retained) !== JSON.stringify(chart)) return false;
            }
            for (const image of before.images || []) {
              const retained = after.images?.find(item => item.id === image.id);
              if (!retained || JSON.stringify(retained) !== JSON.stringify(image)) return false;
            }
            return true;
          }
          if (after.content !== before.content) return false;
          return before.clauses.every(clause => {
            const retained = after.clauses.find(item => item.id === clause.id);
            const clauseUpdate = explicitlyUpdated?.clauses?.find(item => item.id === clause.id);
            return !!retained && (
              retained.content === clause.content ||
              (mayEditText && clauseUpdate?.content !== undefined)
            );
          });
        })
      },
      {
        name: 'Design schema validation',
        passed: (() => {
          try {
            validateDocumentDesign(updatedDoc.design!);
            updatedDoc.sections.forEach(section => {
              if (section.design) validateSectionDesign(section.design);
              section.tables?.forEach(table => { if (table.design) validateTableDesign(table.design); });
            });
            return true;
          } catch {
            return false;
          }
        })()
      }
    ],
    timestamp: new Date().toLocaleTimeString(),
    versionCreated: updatedDoc.version
  };

  if (summary.verifications.some(check => !check.passed)) {
    throw new Error('Document integrity verification failed. No changes were applied.');
  }
  return { updatedDoc, summary };
}

export async function executeAiDocumentEdit(options: ExecuteDocumentEditOptions): Promise<{
  updatedDoc: DocumentModel;
  summary: ExecutionResultSummary;
}> {
  const { instruction, currentDoc, persona, aiClient } = options;
  if (!instruction?.trim()) throw new Error('An editing instruction is required.');
  if (requiresStructuralContext(instruction) && !designOnlyInstruction(instruction)) {
    const structuralPrompt = buildStructuralEditPrompt(instruction, currentDoc, persona);
    const structuralResult = await generateGeminiContentWithRetry(aiClient, {
      model: options.model || 'gemini-3.8-flash',
      contents: structuralPrompt,
      config: { responseMimeType: 'application/json' }
    });
    let structuralResponse = parseModelResponse(structuralResult.text);
    const requiresBoundedRange = /\b(everything from|all content from|from .+ to the box above|contained within|inside the .+ box|within the .+ box)\b/i.test(instruction);
    const hasOperations = (response: DocumentEditResponse) => Boolean(
      response.sectionRangeMoves?.length ||
      response.documentPatch?.length ||
      response.sectionOrder !== undefined ||
      response.sectionUpdates.length > 0 ||
      (response.sectionDesignUpdates?.length || 0) > 0 ||
      (response.tableDesignUpdates?.length || 0) > 0
    );

    if (!hasOperations(structuralResponse) || (requiresBoundedRange && !structuralResponse.sectionRangeMoves?.length)) {
      const correctionPrompt = [
        structuralPrompt,
        'CORRECTION REQUIRED: Your previous response did not return the required executable structural operation.',
        requiresBoundedRange
          ? 'The user explicitly requested a heading-bounded range move. Return sectionRangeMoves with the exact existing startSectionId, exclusive endBeforeSectionId, and destination targetSectionId. Do not substitute sectionOrder, documentPatch, or a textual rewrite.'
          : 'Re-evaluate the request and return the exact executable documentPatch, sectionRangeMoves, sectionOrder, sectionUpdates, or design operations needed.',
        'If a required heading or target cannot be identified unambiguously from the inventory, return no operations and explain which exact boundary is ambiguous.'
      ].join('\n\n');
      const correction = await generateGeminiContentWithRetry(aiClient, {
        model: options.model || 'gemini-3.8-flash',
        contents: correctionPrompt,
        config: { responseMimeType: 'application/json' }
      });
      structuralResponse = parseModelResponse(correction.text);
    }

    if (!hasOperations(structuralResponse) || (requiresBoundedRange && !structuralResponse.sectionRangeMoves?.length)) {
      throw new Error('Gemini could not identify the required executable structural operation after a correction attempt. It returned this clarification: ' +
        (structuralResponse.details || []).join(' ') + ' No document changes were applied.');
    }
    return applyDocumentEditResponse(currentDoc, structuralResponse, instruction);
  }
  if (designOnlyInstruction(instruction)) {
    const prompt = buildDocumentDesignPrompt(instruction, currentDoc, persona);
    const result = await generateGeminiContentWithRetry(aiClient, {
      model: options.model || 'gemini-3.8-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });
    const designResponse = parseModelResponse(result.text);
    const hasDesignOperations = designResponse.design !== undefined ||
      (designResponse.sectionDesignUpdates?.length || 0) > 0 ||
      (designResponse.tableDesignUpdates?.length || 0) > 0;
    if (!hasDesignOperations) {
      throw new Error('Gemini returned no executable design changes or actionable document updates. The document was not changed.');
    }
    return applyDocumentEditResponse(currentDoc, designResponse, instruction);
  }
  const chunks = chunkSections(currentDoc.sections, options.maxChunkChars || DEFAULT_CHUNK_CHARS);
  const aggregated: DocumentEditResponse = {
    operationTitle: 'AI document editing completed',
    details: [],
    sectionUpdates: []
  };

  const partialSectionIds = new Set<string>();
  const partialClauseIds = new Set<string>();
  const chunkConcurrency = 3;

  for (let offset = 0; offset < chunks.length; offset += chunkConcurrency) {
    const batch = chunks.slice(offset, offset + chunkConcurrency);
    batch.forEach(chunk => {
      chunk.partialSectionIds.forEach(id => partialSectionIds.add(id));
      chunk.partialClauseIds.forEach(id => partialClauseIds.add(id));
    });

    // Independent document chunks can be analyzed concurrently. Results are
    // merged in source order, and the document is still committed only once.
    const batchResults = await Promise.all(batch.map(async chunk => {
      const prompt = buildDocumentEditPrompt(instruction, currentDoc, persona, chunk.sections);
      const result = await generateGeminiContentWithRetry(aiClient, {
        model: options.model || 'gemini-3.8-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
      });
      const parsed = parseModelResponse(result.text);
      const allowedIds = new Set(chunk.sections.map(section => section.id));
      for (const update of parsed.sectionUpdates) {
        if (!allowedIds.has(update.sectionId)) {
          throw new Error(`Gemini returned an update outside the current chunk: ${update.sectionId}. No changes were applied.`);
        }
      }
      return { chunk, parsed };
    }));

    for (const { chunk, parsed } of batchResults) {
      aggregated.sectionUpdates.push(...parsed.sectionUpdates);
      aggregated.details.push(...parsed.details);
      if (parsed.operationTitle) aggregated.operationTitle = parsed.operationTitle;
      if (parsed.sectionOrder && explicitSectionReorder(instruction)) {
        if (aggregated.sectionOrder && JSON.stringify(aggregated.sectionOrder) !== JSON.stringify(parsed.sectionOrder)) {
          throw new Error('Gemini returned conflicting section-order operations. No changes were applied.');
        }
        aggregated.sectionOrder = parsed.sectionOrder;
      }
      if (parsed.styles) aggregated.styles = { ...(aggregated.styles || {}), ...parsed.styles };
      if (parsed.pageConfig) aggregated.pageConfig = { ...(aggregated.pageConfig || {}), ...parsed.pageConfig };
      if (offset === 0 && chunk === chunks[0]) {
        aggregated.design = parsed.design;
        aggregated.sectionDesignUpdates = parsed.sectionDesignUpdates;
        aggregated.tableDesignUpdates = parsed.tableDesignUpdates;
      }
    }
  }

  aggregated.sectionUpdates = mergeSectionUpdates(aggregated.sectionUpdates);
  const hasActionableUpdates =
    aggregated.sectionUpdates.length > 0 ||
    (aggregated.sectionRangeMoves?.length || 0) > 0 ||
    (aggregated.documentPatch?.length || 0) > 0 ||
    aggregated.sectionOrder !== undefined ||
    Object.keys(aggregated.styles || {}).length > 0 ||
    Object.keys(aggregated.pageConfig || {}).length > 0 ||
    aggregated.design !== undefined ||
    (aggregated.sectionDesignUpdates?.length || 0) > 0 ||
    (aggregated.tableDesignUpdates?.length || 0) > 0;
  if (!hasActionableUpdates && !options.allowNoop && chunks.length === 1) {
    const correctionPrompt = [
      buildDocumentEditPrompt(instruction, currentDoc, persona, chunks[0].sections),
      'CORRECTION REQUIRED: Your previous response described the task but returned no executable changes.',
      'Re-evaluate the user instruction. Return the exact sectionUpdates, sectionOrder, styles, or pageConfig operations needed to perform it.',
      'If the instruction genuinely requires no document change, return empty operations and do not claim completion.'
    ].join('\n\n');
    const correction = await generateGeminiContentWithRetry(aiClient, {
      model: options.model || 'gemini-3.8-flash',
      contents: correctionPrompt,
      config: { responseMimeType: 'application/json' }
    });
    const corrected = parseModelResponse(correction.text);
    const allowedIds = new Set(chunks[0].sections.map(section => section.id));
    for (const update of corrected.sectionUpdates) {
      if (!allowedIds.has(update.sectionId)) {
        throw new Error(`Gemini returned an update outside the current chunk: ${update.sectionId}. No changes were applied.`);
      }
    }
    aggregated.operationTitle = corrected.operationTitle || aggregated.operationTitle;
    aggregated.details = corrected.details;
    aggregated.sectionUpdates = mergeSectionUpdates(corrected.sectionUpdates);
    aggregated.sectionOrder = explicitSectionReorder(instruction) ? corrected.sectionOrder : undefined;
    aggregated.styles = corrected.styles;
    aggregated.pageConfig = corrected.pageConfig;
    aggregated.design = corrected.design;
    aggregated.sectionDesignUpdates = corrected.sectionDesignUpdates;
    aggregated.tableDesignUpdates = corrected.tableDesignUpdates;
  }

  const correctedHasActionableUpdates =
    aggregated.sectionUpdates.length > 0 ||
    (aggregated.sectionRangeMoves?.length || 0) > 0 ||
    (aggregated.documentPatch?.length || 0) > 0 ||
    aggregated.sectionOrder !== undefined ||
    Object.keys(aggregated.styles || {}).length > 0 ||
    Object.keys(aggregated.pageConfig || {}).length > 0 ||
    aggregated.design !== undefined ||
    (aggregated.sectionDesignUpdates?.length || 0) > 0 ||
    (aggregated.tableDesignUpdates?.length || 0) > 0;
  if (!correctedHasActionableUpdates && !options.allowNoop) {
    throw new Error('Gemini returned an execution summary without any actionable document updates after a correction attempt. The document was not changed.');
  }
  for (const update of aggregated.sectionUpdates) {
    if (partialSectionIds.has(update.sectionId) && update.content !== undefined) {
      throw new Error(`Gemini attempted to replace a partial section excerpt (${update.sectionId}) as if it were the complete section. No changes were applied.`);
    }
    for (const clause of update.clauses || []) {
      if (partialClauseIds.has(clause.id) && clause.content !== undefined) {
        throw new Error(`Gemini attempted to replace a partial clause excerpt (${clause.id}) as if it were the complete clause. No changes were applied.`);
      }
    }
  }
  return applyDocumentEditResponse(currentDoc, aggregated, instruction);
}
