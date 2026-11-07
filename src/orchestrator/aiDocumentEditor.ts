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

export interface DocumentEditResponse {
  operationTitle: string;
  details: string[];
  sectionUpdates: SectionEdit[];
  sectionOrder?: string[];
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
  return /\b(design|styling|style the document|theme|template|colour|color|recolor|colourise|colorize|background|gradient|palette|typography|typeface|font|garamond|inter|helvetica|georgia|heading|border|divider|page surface|section background|table style|visual|appearance|polished|sleek|elegant|make (?:the )?(?:document|pages?) look|professional(?:ly)? formatted|modern(?:ize|ise) the (?:document|layout))\b/i.test(instruction);
}

function designOnlyInstruction(instruction: string): boolean {
  if (!explicitDocumentDesign(instruction) || explicitTextEdit(instruction) || explicitSectionReorder(instruction)) return false;
  return !/\b(merge|split|reorganize|re-order|reorder|rearrange|move section|add section|delete section|remove section|insert section)\b/i.test(instruction);
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
    'Only update section IDs and clause IDs included in the supplied chunk. Never invent IDs.',
    'If a supplied section has a sourceReference beginning with PARTIAL_SECTION_CONTENT or a clause has PARTIAL_CLAUSE_CONTENT, it is an excerpt only. Never return a replacement content value for that excerpt. Preserve the full original text by leaving its content field untouched.',
    'Do not delete sections or clauses. Do not merge away content. Preserve all supplied source text unless the instruction explicitly authorizes a targeted text edit.',
    'Do not include sectionOrder at all unless the user explicitly asks to reorder, rearrange, or change the order of document sections. For every other task, omit sectionOrder completely.',
    'Return one JSON object and no markdown fences with this exact shape:',
    '{"operationTitle":"short action name","details":["actual operation performed"],"sectionUpdates":[{"sectionId":"existing-id","title":"optional title","content":"only when explicitly requested","orderIndex":1,"clauses":[{"id":"existing-clause-id","heading":"optional heading","content":"only when explicitly requested","orderIndex":1}]}],"sectionOrder":["all document section IDs in desired order, only when the user requests reordering"],"styles":{},"pageConfig":{},"design":{},"sectionDesignUpdates":[{"sectionId":"existing-id","design":{}}],"tableDesignUpdates":[{"sectionId":"existing-id","tableId":"existing-table-id","design":{}}]}',
    'Use empty arrays/omit optional fields when no changes are needed. Do not claim an operation was completed unless you return the corresponding update.',
    `Persona: ${persona}`,
    `User instruction: ${instruction}`,
    `Document title: ${document.title}`,
    `Complete section inventory (IDs and titles only): ${JSON.stringify(sectionInventory)}`,
    `Current document chunk: ${JSON.stringify(sections)}`
  ].join('\n\n');
}

export function applyDocumentEditResponse(
  currentDoc: DocumentModel,
  response: DocumentEditResponse,
  instruction: string
): { updatedDoc: DocumentModel; summary: ExecutionResultSummary } {
  if (!response || !Array.isArray(response.sectionUpdates) || !Array.isArray(response.details)) {
    throw new Error('Invalid document-edit response. No changes were applied.');
  }

  const originalIds = currentDoc.sections.map(section => section.id);
  const knownIds = new Set(originalIds);
  const updatedIds = new Set<string>();
  const mayEditText = explicitTextEdit(instruction);
  const isDesignOnly = designOnlyInstruction(instruction);
  const sections = currentDoc.sections.map(section => ({ ...section, clauses: section.clauses.map(clause => ({ ...clause })) }));
  if (isDesignOnly && (
    response.sectionUpdates.length > 0 ||
    response.sectionOrder !== undefined ||
    response.styles !== undefined ||
    response.pageConfig !== undefined
  )) {
    throw new Error('A design-only instruction cannot modify text, section order, legacy formatting, or page layout. No changes were applied.');
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

  const updatedDoc = response.sectionOrder ? recalculateNumbering(candidate) : candidate;
  const summary: ExecutionResultSummary = {
    operationTitle: response.operationTitle || 'Document updated',
    details: response.details,
    verifications: [
      {
        name: 'Existing section identity',
        passed: updatedDoc.sections.length === currentDoc.sections.length &&
          updatedDoc.sections.every(section => knownIds.has(section.id))
      },
      {
        name: 'Untouched source text preservation',
        passed: updatedDoc.sections.every(section => {
          const before = currentDoc.sections.find(item => item.id === section.id);
          if (!before) return false;
          const explicitlyUpdated = response.sectionUpdates.find(item => item.sectionId === section.id);
          if (explicitlyUpdated?.content !== undefined && mayEditText) return true;
          if (section.content !== before.content) return false;
          return section.clauses.every(clause => {
            const oldClause = before.clauses.find(item => item.id === clause.id);
            const clauseUpdate = explicitlyUpdated?.clauses?.find(item => item.id === clause.id);
            return !!oldClause && (
              (clause.content === oldClause.content) ||
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
      throw new Error('Gemini did not return any executable design changes. The document was not changed.');
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
  for (const chunk of chunks) {
    chunk.partialSectionIds.forEach(id => partialSectionIds.add(id));
    chunk.partialClauseIds.forEach(id => partialClauseIds.add(id));
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
      aggregated.sectionUpdates.push(update);
    }
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
    if (chunk === chunks[0]) {
      aggregated.design = parsed.design;
      aggregated.sectionDesignUpdates = parsed.sectionDesignUpdates;
      aggregated.tableDesignUpdates = parsed.tableDesignUpdates;
    }
  }

  aggregated.sectionUpdates = mergeSectionUpdates(aggregated.sectionUpdates);
  const hasActionableUpdates =
    aggregated.sectionUpdates.length > 0 ||
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
