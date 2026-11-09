import React, { useEffect, useRef, useState } from 'react';
import { Command, Search, X } from 'lucide-react';
import { filterEditorCommands, type SearchableEditorCommand } from '../services/commandSearch';

export interface EditorCommand extends SearchableEditorCommand {
  description?: string;
  onSelect: () => void;
}

interface EditorCommandPaletteProps {
  open: boolean;
  commands: EditorCommand[];
  onClose: () => void;
}

export const EditorCommandPalette: React.FC<EditorCommandPaletteProps> = ({ open, commands, onClose }) => {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const filtered = filterEditorCommands(commands, query);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setActiveIndex(0);
    window.requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  useEffect(() => setActiveIndex(0), [query]);

  if (!open) return null;

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex(index => filtered.length ? (index + 1) % filtered.length : 0);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex(index => filtered.length ? (index - 1 + filtered.length) % filtered.length : 0);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      filtered[activeIndex]?.onSelect();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-start justify-center bg-slate-950/65 px-4 pt-[12vh] backdrop-blur-sm" onMouseDown={onClose}>
      <section role="dialog" aria-modal="true" aria-label="Search editor commands" className="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-700 bg-[#0d121b] shadow-2xl" onMouseDown={event => event.stopPropagation()}>
        <div className="flex items-center gap-3 border-b border-slate-800 px-4">
          <Search className="h-4 w-4 shrink-0 text-slate-400" />
          <input
            ref={inputRef}
            aria-label="Search commands"
            value={query}
            onChange={event => setQuery(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search commands, actions, and tools…"
            className="h-14 min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
          />
          <kbd className="rounded border border-slate-700 px-1.5 py-1 text-[10px] text-slate-500">ESC</kbd>
          <button type="button" aria-label="Close command palette" onClick={onClose} className="rounded p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"><X className="h-4 w-4" /></button>
        </div>
        <div className="max-h-[55vh] overflow-y-auto p-2">
          {filtered.length ? filtered.map((command, index) => (
            <button
              key={command.id}
              type="button"
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => { command.onSelect(); onClose(); }}
              className={'flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left ' + (index === activeIndex ? 'bg-blue-500/15 text-white' : 'text-slate-300 hover:bg-slate-800')}
            >
              <Command className="h-4 w-4 shrink-0 text-blue-400" />
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-semibold">{command.label}</span>
                {command.description && <span className="mt-0.5 block text-[10px] text-slate-500">{command.description}</span>}
              </span>
              <span className="text-[10px] text-slate-600">↵</span>
            </button>
          )) : <div className="px-4 py-10 text-center text-xs text-slate-500">No commands match “{query}”.</div>}
        </div>
        <div className="flex items-center justify-between border-t border-slate-800 px-4 py-2 text-[10px] text-slate-500">
          <span>↑ ↓ Navigate · Enter Run · Esc Close</span>
          <span>{filtered.length} commands</span>
        </div>
      </section>
    </div>
  );
};
