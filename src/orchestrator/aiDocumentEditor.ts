import type {
  AIPersona,
  DocumentModel,
  ExecutionResultSummary,
  PageConfig,
  Section,
  StyleConfig
} from '../types/document';
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

export interface DocumentEditResponse {
  operationTitle: string;
  details: string[];
  sectionUpdates: SectionEdit[];
  sectionOrder?: string[];
  styles?: Partial<StyleConfig>;
  pageConfig?: Partial<PageConfig>;
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
}

const DEFAULT_CHUNK_CHARS = 18000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function explicitTextEdit(instruction: string): boolean {
  return /\b(rewrite|reword|paraphrase|revise the wording|edit the wording|proofread|correct grammar|fix grammar|replace the text|change the wording|expand the text|shorten the text|summarize|condense|delete text|remove text|add (?:a |an |the )?(?:clause|paragraph|sentence|provision|section))\b/i.test(instruction);
}

function chunkSections(sections: Section[], maxChars: number): Section[][] {
  const chunks: Section[][] = [];
  let current: Section[] = [];
  let currentSize = 0;

  for (const section of sections) {
    const size = JSON.stringify(section).length;
    if (size > maxChars) {
      throw new Error(
        `Section "${section.title}" contains ${size} characters and exceeds the safe AI chunk limit of ${maxChars}. Split this section into smaller clauses or content blocks before requesting AI editing. No document changes were applied.`
      );
    }
    if (current.length > 0 && currentSize + size > maxChars) {
      chunks.push(current);
      current = [];
      currentSize = 0;
    }
    current.push(section);
    currentSize += size;
  }
  if (current.length) chunks.push(current);
  return chunks;
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
    'Only update section IDs and clause IDs included in the supplied chunk. Never invent IDs.',
    'Do not delete sections or clauses. Do not merge away content. Preserve all supplied source text unless the instruction explicitly authorizes a targeted text edit.',
    'Return one JSON object and no markdown fences with this exact shape:',
    '{"operationTitle":"short action name","details":["actual operation performed"],"sectionUpdates":[{"sectionId":"existing-id","title":"optional title","content":"only when explicitly requested","orderIndex":1,"clauses":[{"id":"existing-clause-id","heading":"optional heading","content":"only when explicitly requested","orderIndex":1}]}],"sectionOrder":["all document section IDs in desired order, only when the user requests reordering"],"styles":{},"pageConfig":{}}',
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
  const sections = currentDoc.sections.map(section => ({ ...section, clauses: section.clauses.map(clause => ({ ...clause })) }));

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

  const candidate: DocumentModel = {
    ...currentDoc,
    sections: orderedSections,
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
  const chunks = chunkSections(currentDoc.sections, options.maxChunkChars || DEFAULT_CHUNK_CHARS);
  const aggregated: DocumentEditResponse = {
    operationTitle: 'AI document editing completed',
    details: [],
    sectionUpdates: []
  };

  for (const chunk of chunks) {
    const prompt = buildDocumentEditPrompt(instruction, currentDoc, persona, chunk);
    const result = await aiClient.models.generateContent({
      model: options.model || 'gemini-3.8-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });
    const parsed = parseModelResponse(result.text);
    const allowedIds = new Set(chunk.map(section => section.id));
    for (const update of parsed.sectionUpdates) {
      if (!allowedIds.has(update.sectionId)) {
        throw new Error(`Gemini returned an update outside the current chunk: ${update.sectionId}. No changes were applied.`);
      }
      aggregated.sectionUpdates.push(update);
    }
    aggregated.details.push(...parsed.details);
    if (parsed.operationTitle) aggregated.operationTitle = parsed.operationTitle;
    if (parsed.sectionOrder) {
      if (aggregated.sectionOrder) throw new Error('Gemini returned more than one section-order operation. No changes were applied.');
      aggregated.sectionOrder = parsed.sectionOrder;
    }
    if (parsed.styles) aggregated.styles = { ...(aggregated.styles || {}), ...parsed.styles };
    if (parsed.pageConfig) aggregated.pageConfig = { ...(aggregated.pageConfig || {}), ...parsed.pageConfig };
  }

  return applyDocumentEditResponse(currentDoc, aggregated, instruction);
}
