export type DocumentContextTargetType = 'text' | 'section' | 'clause' | 'image' | 'header-image' | 'table' | 'signature';

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
  text: ['cut', 'copy', 'paste', 'select-all', 'insert-signature'],
  section: ['add-clause', 'duplicate-section', 'move-section-up', 'move-section-down', 'toggle-page-break', 'edit-section-design', 'delete-section'],
  clause: ['copy-clause', 'add-clause-after', 'duplicate-clause', 'delete-clause'],
  image: ['align-left', 'align-center', 'align-right', 'increase-image-size', 'decrease-image-size', 'edit-caption', 'edit-alt-text', 'delete-image'],
  'header-image': ['align-left', 'align-center', 'align-right', 'increase-image-size', 'decrease-image-size', 'edit-caption', 'edit-alt-text', 'delete-image'],
  table: ['add-table-row', 'add-table-column', 'delete-table'],
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
