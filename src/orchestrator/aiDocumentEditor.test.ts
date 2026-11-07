import test from 'node:test';
import assert from 'node:assert/strict';
import { buildDocumentFromPrompt } from './orchestrator';
import {
  applyDocumentEditResponse,
  buildDocumentEditPrompt,
  executeAiDocumentEdit,
  prepareLongInstruction,
  type DocumentEditResponse
} from './aiDocumentEditor';

function makeDocument() {
  const doc = buildDocumentFromPrompt('Agreement').updatedDoc;
  doc.sections[0].content = 'SOURCE-BEGIN alpha original wording. SOURCE-MIDDLE preserve every word. SOURCE-END omega.';
  return doc;
}

test('AI formatting edits preserve all untouched document text exactly', () => {
  const doc = makeDocument();
  const originalOtherSections = doc.sections.slice(1).map(section => JSON.stringify(section));
  const response: DocumentEditResponse = {
    operationTitle: 'Reformat first section',
    details: ['Updated the first section heading'],
    sectionUpdates: [{ sectionId: doc.sections[0].id, title: 'REFORMATTED TITLE' }]
  };

  const result = applyDocumentEditResponse(doc, response, 'Format the first section heading only.');

  assert.equal(result.updatedDoc.sections[0].title, 'REFORMATTED TITLE');
  assert.equal(result.updatedDoc.sections[0].content, doc.sections[0].content);
  assert.deepEqual(result.updatedDoc.sections.slice(1).map(section => JSON.stringify(section)), originalOtherSections);
  assert.match(result.updatedDoc.sections[0].content || '', /SOURCE-BEGIN.*SOURCE-MIDDLE.*SOURCE-END/);
});

test('AI cannot rewrite source text unless the user explicitly requests a rewrite', () => {
  const doc = makeDocument();
  const response: DocumentEditResponse = {
    operationTitle: 'Unexpected rewrite',
    details: [],
    sectionUpdates: [{ sectionId: doc.sections[0].id, content: 'Condensed replacement text.' }]
  };

  assert.throws(
    () => applyDocumentEditResponse(doc, response, 'Make the page look more professional.'),
    /explicitly request.*text|text.*not authorized/i
  );
});

test('explicit rewrite changes only the targeted section', () => {
  const doc = makeDocument();
  const untouched = doc.sections.slice(1).map(section => JSON.stringify(section));
  const response: DocumentEditResponse = {
    operationTitle: 'Rewrite requested paragraph',
    details: ['Rewrote the requested paragraph'],
    sectionUpdates: [{ sectionId: doc.sections[0].id, content: 'User-authorized rewritten paragraph.' }]
  };

  const result = applyDocumentEditResponse(doc, response, 'Rewrite the text in the first section.');

  assert.equal(result.updatedDoc.sections[0].content, 'User-authorized rewritten paragraph.');
  assert.deepEqual(result.updatedDoc.sections.slice(1).map(section => JSON.stringify(section)), untouched);
});

test('rejects AI updates that reference unknown sections', () => {
  const doc = makeDocument();
  const response: DocumentEditResponse = {
    operationTitle: 'Invalid update',
    details: [],
    sectionUpdates: [{ sectionId: 'not-a-real-section', title: 'Injected section' }]
  };

  assert.throws(() => applyDocumentEditResponse(doc, response, 'Rename a section.'), /unknown section/i);
});

test('section reordering must be a complete permutation and preserves section content', () => {
  const doc = makeDocument();
  const response: DocumentEditResponse = {
    operationTitle: 'Reorder sections',
    details: ['Moved sections'],
    sectionUpdates: [],
    sectionOrder: [...doc.sections].reverse().map(section => section.id)
  };

  const result = applyDocumentEditResponse(doc, response, 'Reorganize the document sections.');
  assert.deepEqual(result.updatedDoc.sections.map(section => section.id), [...doc.sections].reverse().map(section => section.id));
  assert.deepEqual(
    result.updatedDoc.sections.map(section => section.content),
    [...doc.sections].reverse().map(section => section.content)
  );

  const invalid = { ...response, sectionOrder: response.sectionOrder!.slice(1) };
  assert.throws(() => applyDocumentEditResponse(doc, invalid, 'Reorganize the document sections.'), /complete permutation/i);
});

test('AI prompt requires actual document operations and forbids unsolicited summarization', () => {
  const doc = makeDocument();
  const prompt = buildDocumentEditPrompt('Format the document without changing wording.', doc, 'music_specialist', doc.sections);
  assert.match(prompt, /execute.*instruction.*document/i);
  assert.match(prompt, /never summarize|do not summarize/i);
  assert.match(prompt, /sectionUpdates/);
  assert.match(prompt, /SOURCE-BEGIN/);
});

test('executor sends real section content to Gemini and applies returned edits', async () => {
  const doc = makeDocument();
  doc.sections = doc.sections.slice(0, 1);
  const prompts: string[] = [];
  const client = {
    models: {
      generateContent: async ({ contents }: { model: string; contents: string; config?: { responseMimeType?: string } }) => {
        prompts.push(contents);
        return {
          text: JSON.stringify({
            operationTitle: 'AI updated the requested heading',
            details: ['Updated the requested heading'],
            sectionUpdates: [{ sectionId: doc.sections[0].id, title: 'AI-EDITED HEADING' }]
          })
        };
      }
    }
  };

  const result = await executeAiDocumentEdit({
    instruction: 'Format the first section heading only.',
    currentDoc: doc,
    persona: 'music_specialist',
    aiClient: client
  });

  assert.equal(prompts.length, 1);
  assert.ok(prompts[0].includes('SOURCE-BEGIN'));
  assert.equal(result.updatedDoc.sections[0].title, 'AI-EDITED HEADING');
  assert.equal(result.updatedDoc.sections[0].content, doc.sections[0].content);
});

test('500-page-scale section source is processed in ordered chunks without losing text', async () => {
  const doc = makeDocument();
  doc.sections = doc.sections.slice(0, 1);
  const original = `LONG-SOURCE-BEGIN ${'Preserve every source sentence exactly. '.repeat(30000)} LONG-SOURCE-END`;
  doc.sections[0].content = original;
  let calls = 0;
  const client = {
    models: {
      generateContent: async () => {
        calls += 1;
        return {
          text: JSON.stringify({
            operationTitle: 'Large source inspected in chunks',
            details: ['Processed one source fragment'],
            sectionUpdates: [],
            styles: { fontSize: 12 }
          })
        };
      }
    }
  };

  const result = await executeAiDocumentEdit({
    instruction: 'Format the section without changing its wording.',
    currentDoc: doc,
    persona: 'auto_architect',
    aiClient: client,
    maxChunkChars: 18000
  });

  assert.ok(calls > 50, 'Expected 500-page-scale source to be processed through many bounded AI calls');
  assert.equal(result.updatedDoc.sections[0].content, original);
  assert.equal(result.updatedDoc.styles.fontSize, 12);
  assert.match(result.updatedDoc.sections[0].content || '', /^LONG-SOURCE-BEGIN/);
  assert.match(result.updatedDoc.sections[0].content || '', /LONG-SOURCE-END$/);
});

test('large pasted source content is separated from the instruction and stored verbatim', () => {
  const doc = makeDocument();
  const source = `\n\nSOURCE-START ${'Keep every supplied sentence. '.repeat(600)} SOURCE-END  \n`;
  const prepared = prepareLongInstruction(
    `Create a professionally formatted PDF from the following source content:${source}`,
    doc,
    100
  );
  const sourceSection = prepared.document.sections.at(-1)!;

  assert.equal(sourceSection.title, 'USER-PROVIDED SOURCE CONTENT');
  assert.equal(sourceSection.content, source);
  assert.ok(prepared.instruction.includes(sourceSection.id));
  assert.ok(!prepared.instruction.includes('Keep every supplied sentence.'));
});

test('large pasted content without an explicit source boundary is rejected, not silently clipped', () => {
  const doc = makeDocument();
  assert.throws(
    () => prepareLongInstruction('Unstructured long input '.repeat(1000), doc, 100),
    /SOURCE CONTENT.*No document changes were applied/i
  );
});

test('AI summary without document operations is rejected as a no-op', async () => {
  const doc = makeDocument();
  doc.sections = doc.sections.slice(0, 1);
  const client = {
    models: {
      generateContent: async () => ({
        text: JSON.stringify({
          operationTitle: 'Claimed completion',
          details: ['No actual operation was returned'],
          sectionUpdates: []
        })
      })
    }
  };

  await assert.rejects(
    executeAiDocumentEdit({
      instruction: 'Make the document more professional.',
      currentDoc: doc,
      persona: 'auto_architect',
      aiClient: client
    }),
    /without any actionable document updates/i
  );
});
