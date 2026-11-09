import test from 'node:test';
import assert from 'node:assert/strict';
import { filterEditorCommands } from './commandSearch';

const commands = [
  { id: 'insert-image', label: 'Insert image', keywords: ['picture', 'artwork'] },
  { id: 'resize-logo', label: 'Resize cover logo', keywords: ['scale', 'brand'] },
  { id: 'page-background', label: 'Change page background', keywords: ['color', 'fill'] }
];

test('command search matches labels and aliases without case sensitivity', () => {
  assert.deepEqual(filterEditorCommands(commands, 'LOGO'), [commands[1]]);
  assert.deepEqual(filterEditorCommands(commands, 'picture insert'), [commands[0]]);
});

test('command search returns all commands for an empty query and none for unmatched terms', () => {
  assert.deepEqual(filterEditorCommands(commands, '   '), commands);
  assert.deepEqual(filterEditorCommands(commands, 'rotate video'), []);
});
