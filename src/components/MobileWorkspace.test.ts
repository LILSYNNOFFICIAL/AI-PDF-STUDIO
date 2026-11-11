import test from 'node:test';
import assert from 'node:assert/strict';
import { getMobileToolActions, type MobileWorkspaceProps } from './MobileWorkspace';

test('mobile workspace exposes the important desktop tools that were previously missing', () => {
  const called: string[] = [];
  const props = new Proxy({}, {
    get: (_target, key) => () => called.push(String(key))
  }) as unknown as MobileWorkspaceProps;
  const actions = getMobileToolActions(props);
  const labels = actions.map(action => action.label);

  for (const label of [
    'Help center',
    'Import text / Markdown',
    'Add appendix / exhibit',
    'Insert signature'
  ]) {
    assert.ok(labels.includes(label), 'Missing mobile tool: ' + label);
  }

  for (const [label, callback] of [
    ['Help center', 'onOpenHelp'],
    ['Import text / Markdown', 'onImportText'],
    ['Add appendix / exhibit', 'onAddAppendix'],
    ['Insert signature', 'onInsertSignature']
  ] as const) {
    const action = actions.find(item => item.label === label);
    assert.ok(action, 'Missing action ' + label);
    action.action();
    assert.ok(called.includes(callback), label + ' should call ' + callback);
  }
});

test('mobile tool actions preserve the existing tools and keep labels unique', () => {
  const props = new Proxy({}, {
    get: () => () => undefined
  }) as unknown as MobileWorkspaceProps;
  const labels = getMobileToolActions(props).map(action => action.label);
  assert.equal(new Set(labels).size, labels.length, 'Mobile tool labels must be unique');
  for (const label of [
    'Source of Truth / Render',
    'Document design',
    'Template gallery',
    'Find & replace',
    'Redact text',
    'Insert table',
    'Insert image',
    'Insert chart',
    'Clause library',
    'Watermark',
    'Readability',
    'Document metadata',
    'Multi-document',
    'Print',
    'Export JSON',
    'Import JSON',
    'Export Markdown',
    'Export text',
    'Copy document'
  ]) {
    assert.ok(labels.includes(label), 'Existing mobile tool disappeared: ' + label);
  }
});
