import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { clampContextMenuPosition, getNextEnabledContextMenuIndex, type ContextMenuItem } from '../services/contextMenu';

interface DocumentContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
  label?: string;
}

export const DocumentContextMenu: React.FC<DocumentContextMenuProps> = ({
  x,
  y,
  items,
  onClose,
  label = 'Document actions'
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [position, setPosition] = useState({ x, y });

  useLayoutEffect(() => {
    const rect = menuRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPosition(clampContextMenuPosition(
      x,
      y,
      rect.width,
      rect.height,
      window.innerWidth,
      window.innerHeight
    ));
  }, [x, y, items.length]);

  useEffect(() => {
    const first = itemRefs.current.find(Boolean);
    first?.focus();

    const handlePointerDown = (event: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) onClose();
    };
    const handleResize = () => {
      const rect = menuRef.current?.getBoundingClientRect();
      if (!rect) return;
      setPosition(clampContextMenuPosition(x, y, rect.width, rect.height, window.innerWidth, window.innerHeight));
    };
    window.document.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('resize', handleResize);
    return () => {
      window.document.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('resize', handleResize);
    };
  }, [onClose, x, y]);

  const focusItem = (currentIndex: number, direction: 'next' | 'previous') => {
    const nextIndex = getNextEnabledContextMenuIndex(items, currentIndex, direction);
    if (nextIndex !== null) itemRefs.current[nextIndex]?.focus();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const currentIndex = itemRefs.current.findIndex(item => item === window.document.activeElement);
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      focusItem(currentIndex, 'next');
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      focusItem(currentIndex, 'previous');
    } else if (event.key === 'Home') {
      event.preventDefault();
      focusItem(-1, 'next');
    } else if (event.key === 'End') {
      event.preventDefault();
      focusItem(-1, 'previous');
    } else if (event.key === 'Tab') {
      onClose();
    }
  };

  return (
    <div
      ref={menuRef}
      role="menu"
      aria-label={label}
      onKeyDown={handleKeyDown}
      style={{ position: 'fixed', left: position.x, top: position.y, zIndex: 100 }}
      className="min-w-[224px] max-w-[min(320px,calc(100vw-16px))] overflow-hidden rounded-xl border border-slate-700 bg-[#0d121b]/[0.98] p-1.5 text-slate-100 shadow-[0_18px_60px_rgba(0,0,0,0.55)] backdrop-blur-xl"
    >
      <div className="px-2.5 pb-1.5 pt-1 text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">{label}</div>
      {items.map((item, index) => (
        <button
          key={item.id}
          ref={node => { itemRefs.current[index] = node; }}
          type="button"
          role="menuitem"
          disabled={item.disabled}
          onClick={() => {
            onClose();
            item.onSelect();
          }}
          className={'flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-[11px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ' + (
            item.destructive
              ? 'text-rose-300 hover:bg-rose-500/10 focus:bg-rose-500/10'
              : 'text-slate-200 hover:bg-slate-700/70 focus:bg-slate-700/70'
          ) + (item.disabled ? ' cursor-not-allowed opacity-40' : '')}
        >
          <span className="min-w-0 flex-1">{item.label}</span>
          {item.shortcut && <span className="text-[9px] text-slate-500">{item.shortcut}</span>}
          {item.id === 'edit-section-design' && <ChevronRight className="h-3 w-3 text-slate-500" />}
        </button>
      ))}
    </div>
  );
};
