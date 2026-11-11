export type DocumentContextTargetType = 'document' | 'cover-logo' | 'cover-text' | 'text' | 'section' | 'clause' | 'image' | 'header-image' | 'table' | 'signature';

export interface ContextMenuPosition {
  x: number;
  y: number;
}

export interface ContextMenuItem {
  id: string;
  label: string;
  shortcut?: string;
  destructive?: boolean;
  disabled?: boolean;
  onSelect: () => void;
}

const ACTIONS: Record<DocumentContextTargetType, string[]> = {
  document: ['add-section', 'insert-image', 'insert-signature', 'toggle-page-break', 'document-design', 'toggle-page-numbers', 'toggle-cover-page', 'change-page-size', 'change-page-orientation', 'change-page-background'],
  'cover-logo': ['upload-logo', 'edit-brand-name', 'increase-logo-size', 'decrease-logo-size', 'set-logo-size', 'reset-logo-size', 'remove-logo'],
  'cover-text': ['edit-cover-text', 'clear-cover-text'],
  text: ['cut', 'copy', 'paste', 'select-all', 'insert-signature', 'ai-rewrite', 'ai-expand', 'ai-shorten', 'ai-professional', 'ai-grammar', 'ai-summarize'],
  section: ['add-clause', 'add-section-before', 'add-section-after', 'rename-section', 'convert-to-appendix', 'duplicate-section', 'move-section-up', 'move-section-down', 'toggle-page-break', 'edit-section-design', 'delete-section'],
  clause: ['copy-clause', 'edit-clause', 'add-clause-after', 'duplicate-clause', 'move-clause-up', 'move-clause-down', 'renumber-clauses', 'delete-clause'],
  image: ['align-left', 'align-center', 'align-right', 'increase-image-size', 'decrease-image-size', 'set-image-size', 'reset-image-size', 'duplicate-image', 'edit-caption', 'edit-alt-text', 'delete-image'],
  'header-image': ['align-left', 'align-center', 'align-right', 'increase-image-size', 'decrease-image-size', 'set-image-size', 'reset-image-size', 'duplicate-image', 'edit-caption', 'edit-alt-text', 'delete-image'],
  table: ['add-table-row', 'add-table-column', 'delete-table-row', 'delete-table-column', 'duplicate-table', 'delete-table'],
  signature: ['edit-signature', 'duplicate-signature', 'toggle-signature-method', 'delete-signature']
};

export function getContextMenuActionIds(targetType: DocumentContextTargetType): string[] {
  return [...ACTIONS[targetType]];
}

function safeCoordinate(value: number): number {
  return Number.isFinite(value) ? value : 8;
}

export function clampContextMenuPosition(
  x: number,
  y: number,
  menuWidth: number,
  menuHeight: number,
  viewportWidth: number,
  viewportHeight: number,
  margin = 8
): ContextMenuPosition {
  const safeMargin = Number.isFinite(margin) && margin >= 0 ? margin : 8;
  const width = Number.isFinite(menuWidth) && menuWidth > 0 ? menuWidth : 0;
  const height = Number.isFinite(menuHeight) && menuHeight > 0 ? menuHeight : 0;
  const viewportW = Number.isFinite(viewportWidth) && viewportWidth > 0 ? viewportWidth : 0;
  const viewportH = Number.isFinite(viewportHeight) && viewportHeight > 0 ? viewportHeight : 0;
  const maxX = Math.max(safeMargin, viewportW - width - safeMargin);
  const maxY = Math.max(safeMargin, viewportH - height - safeMargin);
  return {
    x: Math.min(maxX, Math.max(safeMargin, safeCoordinate(x))),
    y: Math.min(maxY, Math.max(safeMargin, safeCoordinate(y)))
  };
}


/**
 * Return the next enabled menu item index for keyboard navigation.
 * Navigation wraps at either end and returns null when every item is disabled.
 */
export function getNextEnabledContextMenuIndex(
  items: Array<Pick<ContextMenuItem, 'disabled'>>,
  currentIndex: number,
  direction: 'next' | 'previous'
): number | null {
  const enabledIndexes = items
    .map((item, index) => ({ item, index }))
    .filter(entry => !entry.item.disabled)
    .map(entry => entry.index);

  if (!enabledIndexes.length) return null;

  const currentPosition = enabledIndexes.indexOf(currentIndex);
  if (currentPosition < 0) {
    return direction === 'next'
      ? enabledIndexes[0]
      : enabledIndexes[enabledIndexes.length - 1];
  }

  const offset = direction === 'next' ? 1 : -1;
  const nextPosition = (currentPosition + offset + enabledIndexes.length) % enabledIndexes.length;
  return enabledIndexes[nextPosition];
}
