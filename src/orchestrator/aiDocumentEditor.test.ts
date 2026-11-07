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


test('executor retries transient Gemini 503 responses before applying the edit', async () => {
  const doc = makeDocument();
  doc.sections = doc.sections.slice(0, 1);
  let calls = 0;
  const client = {
    models: {
      generateContent: async () => {
        calls += 1;
        if (calls === 1) {
          throw Object.assign(new Error('The model is currently experiencing high demand'), {
            status: 503,
            code: 503
          });
        }
        return {
          text: JSON.stringify({
            operationTitle: 'Updated heading after retry',
            details: ['Updated the requested heading'],
            sectionUpdates: [{ sectionId: doc.sections[0].id, title: 'RETRIED HEADING' }]
          })
        };
      }
    }
  };

  const result = await executeAiDocumentEdit({
    instruction: 'Rename the first section heading.',
    currentDoc: doc,
    persona: 'auto_architect',
    aiClient: client
  });

  assert.equal(calls, 2);
  assert.equal(result.updatedDoc.sections[0].title, 'RETRIED HEADING');
});


test('executor asks Gemini to correct a summary-only response before failing the operation', async () => {
  const doc = makeDocument();
  doc.sections = doc.sections.slice(0, 1);
  let calls = 0;
  const client = {
    models: {
      generateContent: async () => {
        calls += 1;
        if (calls === 1) {
          return {
            text: JSON.stringify({
              operationTitle: 'I will rename the heading',
              details: ['The heading will be renamed'],
              sectionUpdates: []
            })
          };
        }
        return {
          text: JSON.stringify({
            operationTitle: 'Heading renamed',
            details: ['Renamed the first heading'],
            sectionUpdates: [{ sectionId: doc.sections[0].id, title: 'CORRECTED HEADING' }]
          })
        };
      }
    }
  };

  const result = await executeAiDocumentEdit({
    instruction: 'Rename the first section heading.',
    currentDoc: doc,
    persona: 'auto_architect',
    aiClient: client
  });

  assert.equal(calls, 2);
  assert.equal(result.updatedDoc.sections[0].title, 'CORRECTED HEADING');
});


test('executor ignores an unsolicited incomplete section order during a non-reordering edit', async () => {
  const doc = makeDocument();
  const target = doc.sections[0];
  const client = {
    models: {
      generateContent: async () => ({
        text: JSON.stringify({
          operationTitle: 'Updated document formatting',
          details: ['Updated the requested heading'],
          sectionUpdates: [{ sectionId: target.id, title: 'FORMATTED HEADING' }],
          sectionOrder: [target.id]
        })
      })
    }
  };

  const result = await executeAiDocumentEdit({
    instruction: 'Make the document formatting more professional without changing its wording.',
    currentDoc: doc,
    persona: 'auto_architect',
    aiClient: client
  });

  assert.equal(result.updatedDoc.sections.length, doc.sections.length);
  assert.equal(result.updatedDoc.sections[0].title, 'FORMATTED HEADING');
  assert.deepEqual(
    result.updatedDoc.sections.map(section => section.id),
    doc.sections.map(section => section.id)
  );
});


test('AI visual-design requests apply a preset without changing document wording or structure', async () => {
  const doc = makeDocument();
  const originalContent = doc.sections.map(section => section.content);
  const prompts: string[] = [];
  const client = {
    models: {
      generateContent: async ({ contents }: { model: string; contents: string; config?: { responseMimeType?: string } }) => {
        prompts.push(contents);
        return {
          text: JSON.stringify({
            operationTitle: 'Applied Luxury Executive design',
            details: ['Applied the Luxury Executive visual preset'],
            sectionUpdates: [],
            design: { presetId: 'luxury-executive' }
          })
        };
      }
    }
  };

  const result = await executeAiDocumentEdit({
    instruction: 'Apply the Luxury Executive design to this document.',
    currentDoc: doc,
    persona: 'document_designer',
    aiClient: client
  });

  assert.equal(prompts.length, 1, 'Design-only instructions should not chunk or send source text to the model');
  assert.match(prompts[0], /luxury-executive/);
  assert.equal(result.updatedDoc.design?.presetId, 'luxury-executive');
  assert.deepEqual(result.updatedDoc.sections.map(section => section.content), originalContent);
  assert.equal(
    JSON.stringify(result.updatedDoc.sections.map(section => ({ ...section, design: undefined }))),
    JSON.stringify(doc.sections.map(section => ({ ...section, design: undefined })))
  );
  assert.deepEqual(result.updatedDoc.sections, doc.sections);
  assert.ok(result.summary.verifications.every(check => check.passed));
});

test('AI section and table design overrides apply only to validated existing targets', () => {
  const doc = makeDocument();
  const target = doc.sections[0];
  target.tables = [{
    id: 'tbl-design-target',
    headers: [{ id: 'header-1', content: 'Party' }],
    rows: [[{ id: 'cell-1', content: 'Artist' }]]
  }];
  const response: DocumentEditResponse = {
    operationTitle: 'Style target section and table',
    details: ['Applied section background and table header styling'],
    sectionUpdates: [],
    sectionDesignUpdates: [{
      sectionId: target.id,
      design: { background: { type: 'solid', color: '#102030' }, headingColor: '#ffffff' }
    }],
    tableDesignUpdates: [{
      sectionId: target.id,
      tableId: 'tbl-design-target',
      design: { headerBackground: { type: 'solid', color: '#334455' }, headerTextColor: '#ffffff' }
    }]
  };

  const result = applyDocumentEditResponse(doc, response, 'Set the first section background and style its table header.');
  assert.equal(result.updatedDoc.sections[0].design?.background?.type, 'solid');
  assert.equal(result.updatedDoc.sections[0].design?.headingColor, '#ffffff');
  assert.equal(result.updatedDoc.sections[0].tables?.[0].design?.headerTextColor, '#ffffff');
  assert.equal(result.updatedDoc.sections[0].content, doc.sections[0].content);
  assert.ok(result.summary.verifications.every(check => check.passed));
});

test('AI design updates reject invalid targets and colors without mutating the source document', () => {
  const doc = makeDocument();
  const before = JSON.stringify(doc);
  const invalidSection: DocumentEditResponse = {
    operationTitle: 'Invalid section styling',
    details: ['Attempted invalid styling'],
    sectionUpdates: [],
    sectionDesignUpdates: [{ sectionId: 'missing-section', design: { headingColor: '#ffffff' } }]
  };
  assert.throws(() => applyDocumentEditResponse(doc, invalidSection, 'Change the document design.'), /unknown section/i);
  assert.equal(JSON.stringify(doc), before);

  const invalidColor: DocumentEditResponse = {
    operationTitle: 'Invalid color styling',
    details: ['Attempted invalid styling'],
    sectionUpdates: [],
    design: { colors: { accent: 'electric-purple' as any } }
  };
  assert.throws(() => applyDocumentEditResponse(doc, invalidColor, 'Change the document design.'), /hexadecimal color/i);
  assert.equal(JSON.stringify(doc), before);
});

test('design-only instructions cannot smuggle in content edits', () => {
  const doc = makeDocument();
  const response: DocumentEditResponse = {
    operationTitle: 'Style and unexpectedly edit',
    details: [],
    sectionUpdates: [{ sectionId: doc.sections[0].id, title: 'Rewritten title' }],
    design: { colors: { accent: '#aabbcc' } }
  };
  assert.throws(
    () => applyDocumentEditResponse(doc, response, 'Apply a modern visual design.'),
    /Text edits are not authorized/i
  );
});


test('AI can move a heading-bounded section range into one existing target box without losing content', () => {
  const doc = makeDocument();
  const target = doc.sections[0];
  target.title = 'WRITTEN DESCRIPTION + VISUAL REFERENCE';
  target.content = 'Target box original text.';
  target.clauses = [];
  const middle = { ...doc.sections[1], id: 'sec_middle', title: 'VISUAL DETAILS', content: 'Middle section exact wording.', clauses: [{ id: 'cl_middle', clauseNumber: '2.1', heading: 'Details', content: 'Clause wording stays exact.', orderIndex: 1 }] };
  const boundary = { ...doc.sections[2], id: 'sec_boundary', title: 'REPRESENTATIONS, CLEARANCES AND RESPONSIBILITY', content: 'Boundary must remain outside the move.' };
  target.tables = [{ id: 'target-table', headers: [{ id: 'th', content: 'Existing' }], rows: [] }];
  middle.tables = [{ id: 'middle-table', headers: [{ id: 'mth', content: 'Moved table' }], rows: [] }];
  doc.sections = [target, middle, boundary];

  const response: DocumentEditResponse = {
    operationTitle: 'Consolidate written description content',
    details: ['Moved all content before the representations section into the written description box.'],
    sectionUpdates: [],
    sectionRangeMoves: [{
      startSectionId: target.id,
      endBeforeSectionId: boundary.id,
      targetSectionId: target.id
    }]
  };

  const result = applyDocumentEditResponse(
    doc,
    response,
    "Everything from 'WRITTEN DESCRIPTION + VISUAL REFERENCE' to the box above 'REPRESENTATIONS, CLEARANCES AND RESPONSIBILITY' needs to all be contained within the 'WRITTEN DESCRIPTION + VISUAL REFERENCE' box."
  );

  assert.deepEqual(result.updatedDoc.sections.map(section => section.id), [target.id, boundary.id]);
  assert.equal(result.updatedDoc.sections[0].content, 'Target box original text.\n\nVISUAL DETAILS\nMiddle section exact wording.');
  assert.deepEqual(result.updatedDoc.sections[0].clauses.map(clause => clause.content), ['Clause wording stays exact.']);
  assert.deepEqual(result.updatedDoc.sections[0].tables?.map(table => table.id), ['target-table', 'middle-table']);
  assert.equal(result.updatedDoc.sections[1].content, 'Boundary must remain outside the move.');
  assert.equal(JSON.stringify(doc.sections[1]).includes('Middle section exact wording.'), true, 'The input document remains unchanged');
  assert.ok(result.summary.verifications.every(check => check.passed));
});

test('AI rejects ambiguous or destructive section-range moves without mutating the source document', () => {
  const doc = makeDocument();
  const before = JSON.stringify(doc);
  const response: DocumentEditResponse = {
    operationTitle: 'Invalid range move',
    details: [],
    sectionUpdates: [],
    sectionRangeMoves: [{
      startSectionId: 'missing-start',
      endBeforeSectionId: doc.sections[1].id,
      targetSectionId: doc.sections[0].id
    }]
  };
  assert.throws(() => applyDocumentEditResponse(doc, response, 'Move the requested section range.'), /unknown section|range/i);
  assert.equal(JSON.stringify(doc), before);
});


test('structural executor gives Gemini the complete section inventory and applies range operations in one planning pass', async () => {
  const doc = makeDocument();
  const target = doc.sections[0];
  target.title = 'WRITTEN DESCRIPTION + VISUAL REFERENCE';
  const middle = { ...doc.sections[1], id: 'range-middle', title: 'ADDITIONAL VISUAL DETAILS', content: 'All additional detail.' };
  const boundary = { ...doc.sections[2], id: 'range-boundary', title: 'REPRESENTATIONS, CLEARANCES AND RESPONSIBILITY' };
  doc.sections = [target, middle, boundary];
  const prompts: string[] = [];
  const client = {
    models: {
      generateContent: async ({ contents }: { model: string; contents: string; config?: { responseMimeType?: string } }) => {
        prompts.push(contents);
        return {
          text: JSON.stringify({
            operationTitle: 'Consolidated written description',
            details: ['Moved the bounded section range into the destination section.'],
            sectionUpdates: [],
            sectionRangeMoves: [{
              startSectionId: target.id,
              endBeforeSectionId: boundary.id,
              targetSectionId: target.id
            }]
          })
        };
      }
    }
  };

  const result = await executeAiDocumentEdit({
    instruction: "Everything from 'WRITTEN DESCRIPTION + VISUAL REFERENCE' to the box above 'REPRESENTATIONS, CLEARANCES AND RESPONSIBILITY' belongs in the first box.",
    currentDoc: doc,
    persona: 'auto_architect',
    aiClient: client
  });

  assert.equal(prompts.length, 1);
  assert.match(prompts[0], /WRITTEN DESCRIPTION \+ VISUAL REFERENCE/);
  assert.match(prompts[0], /REPRESENTATIONS, CLEARANCES AND RESPONSIBILITY/);
  assert.deepEqual(result.updatedDoc.sections.map(section => section.id), [target.id, boundary.id]);
  assert.match(result.updatedDoc.sections[0].content || '', /All additional detail\./);
});


test('generic document patch can move an existing clause between sections by stable JSON paths', () => {
  const doc = makeDocument();
  const source = doc.sections[0];
  const target = doc.sections[1];
  const moved = source.clauses[0];
  const response: DocumentEditResponse = {
    operationTitle: 'Move clause to ownership section',
    details: ['Moved the selected clause without rewriting it.'],
    sectionUpdates: [],
    documentPatch: [{
      op: 'move',
      from: `/sections/0/clauses/0`,
      path: `/sections/1/clauses/-`
    }]
  };

  const result = applyDocumentEditResponse(doc, response, 'Move the first clause into the second section.');
  assert.equal(result.updatedDoc.sections[0].clauses.some(clause => clause.id === moved.id), false);
  assert.equal(result.updatedDoc.sections[1].clauses.some(clause => clause.id === moved.id && clause.content === moved.content), true);
  assert.equal(doc.sections[0].clauses.some(clause => clause.id === moved.id), true, 'The original document remains unchanged');
  assert.ok(result.summary.verifications.every(check => check.passed));
});

test('generic document patch can create a new section and update a document title atomically', () => {
  const doc = makeDocument();
  const newSection = {
    id: 'sec_ai_created',
    sectionNumber: '',
    title: 'NEW COMMERCIAL TERMS',
    content: 'New terms supplied by the user.',
    clauses: [],
    orderIndex: doc.sections.length + 1
  };
  const response: DocumentEditResponse = {
    operationTitle: 'Add commercial terms',
    details: ['Created a new section and updated the document title.'],
    sectionUpdates: [],
    documentPatch: [
      { op: 'replace', path: '/title', value: 'Updated Agreement' },
      { op: 'add', path: '/sections/-', value: newSection }
    ]
  };

  const result = applyDocumentEditResponse(doc, response, 'Rename the agreement and add a new section.');
  assert.equal(result.updatedDoc.title, 'Updated Agreement');
  assert.equal(result.updatedDoc.sections.at(-1)?.id, 'sec_ai_created');
  assert.equal(result.updatedDoc.sections.at(-1)?.content, 'New terms supplied by the user.');
  assert.equal(doc.title, 'Agreement');
  assert.equal(doc.sections.some(section => section.id === 'sec_ai_created'), false);
});

test('generic document patches reject prototype pollution and invalid paths without mutating the source', () => {
  const doc = makeDocument();
  const before = JSON.stringify(doc);
  const malicious: DocumentEditResponse = {
    operationTitle: 'Unsafe patch',
    details: [],
    sectionUpdates: [],
    documentPatch: [{ op: 'add', path: '/sections/0/__proto__/polluted', value: true }]
  };
  assert.throws(() => applyDocumentEditResponse(doc, malicious, 'Add a property.'), /unsafe|prototype|path/i);
  assert.equal(JSON.stringify(doc), before);

  const invalid: DocumentEditResponse = {
    operationTitle: 'Invalid patch',
    details: [],
    sectionUpdates: [],
    documentPatch: [{ op: 'replace', path: '/sections/999/title', value: 'Missing' }]
  };
  assert.throws(() => applyDocumentEditResponse(doc, invalid, 'Rename a section.'), /does not exist|invalid path|index/i);
  assert.equal(JSON.stringify(doc), before);
});

test('structural planner advertises generic JSON Patch operations for document-wide CRUD', () => {
  const doc = makeDocument();
  const prompt = buildDocumentEditPrompt('Add a new section.', doc, 'auto_architect', doc.sections);
  assert.match(prompt, /documentPatch/);
  assert.match(prompt, /RFC 6902|JSON Patch/i);
});


test('generic document patch supports splitting a section by creating a child and moving the selected clause', () => {
  const doc = makeDocument();
  const source = doc.sections[0];
  const moved = source.clauses[0];
  const child = {
    id: 'sec_split_child',
    sectionNumber: '',
    title: 'CHILD SECTION',
    content: '',
    clauses: [],
    orderIndex: 2
  };
  const response: DocumentEditResponse = {
    operationTitle: 'Split section',
    details: ['Created a child section and moved the selected clause.'],
    sectionUpdates: [],
    documentPatch: [
      { op: 'add', path: '/sections/1', value: child },
      { op: 'move', from: '/sections/0/clauses/0', path: '/sections/1/clauses/-' }
    ]
  };

  const result = applyDocumentEditResponse(doc, response, 'Split the first section into a new child section.');
  assert.equal(result.updatedDoc.sections[1].id, 'sec_split_child');
  assert.equal(result.updatedDoc.sections[1].clauses[0].id, moved.id);
  assert.equal(result.updatedDoc.sections[1].clauses[0].content, moved.content);
  assert.equal(result.updatedDoc.sections[0].clauses.some(clause => clause.id === moved.id), false);
});

test('generic merge patches cannot discard a non-empty source section before transferring its blocks', () => {
  const doc = makeDocument();
  const before = JSON.stringify(doc);
  const response: DocumentEditResponse = {
    operationTitle: 'Merge sections',
    details: [],
    sectionUpdates: [],
    documentPatch: [{ op: 'remove', path: '/sections/0' }]
  };
  assert.throws(
    () => applyDocumentEditResponse(doc, response, 'Merge the first section into the second section.'),
    /until all of its content and blocks have been transferred/i
  );
  assert.equal(JSON.stringify(doc), before);
});

test('generic document patch cannot replace source wording unless the user explicitly requests a text edit', () => {
  const doc = makeDocument();
  const before = JSON.stringify(doc);
  const response: DocumentEditResponse = {
    operationTitle: 'Unexpected wording replacement',
    details: [],
    sectionUpdates: [],
    documentPatch: [{ op: 'replace', path: '/sections/0/content', value: 'Rewritten content.' }]
  };
  assert.throws(
    () => applyDocumentEditResponse(doc, response, 'Reorganize the first section.'),
    /explicit text-edit instruction/i
  );
  assert.equal(JSON.stringify(doc), before);
});
