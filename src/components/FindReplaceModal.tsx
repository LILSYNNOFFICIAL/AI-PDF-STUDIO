import React, { useState, useMemo } from 'react';
import { Search, Replace, X, Check, AlertCircle, ArrowRight } from 'lucide-react';
import { DocumentModel } from '../types/document';
import { findAndReplaceText } from '../orchestrator/orchestrator';

interface FindReplaceModalProps {
  document: DocumentModel;
  isOpen: boolean;
  onClose: () => void;
  onApplyReplace: (updatedDoc: DocumentModel, matchCount: number, summaryText: string) => void;
}

export const FindReplaceModal: React.FC<FindReplaceModalProps> = ({
  document,
  isOpen,
  onClose,
  onApplyReplace
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [replaceTerm, setReplaceTerm] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [scope, setScope] = useState<'all' | 'clauses' | 'titles'>('all');
  const [lastReplacedCount, setLastReplacedCount] = useState<number | null>(null);

  // Real-time match count preview
  const previewMatches = useMemo(() => {
    if (!searchTerm.trim()) return 0;
    try {
      let flags = caseSensitive ? 'g' : 'gi';
      let escaped = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (wholeWord) escaped = `\\b${escaped}\\b`;
      const regex = new RegExp(escaped, flags);
      let count = 0;

      document.sections.forEach(sec => {
        if (scope !== 'clauses') {
          const tm = sec.title.match(regex);
          if (tm) count += tm.length;
        }
        if (scope !== 'titles' && sec.content) {
          const cm = sec.content.match(regex);
          if (cm) count += cm.length;
        }
        sec.clauses.forEach(cl => {
          if (cl.heading && scope !== 'clauses') {
            const hm = cl.heading.match(regex);
            if (hm) count += hm.length;
          }
          if (scope !== 'titles') {
            const bm = cl.content.match(regex);
            if (bm) count += bm.length;
          }
        });
        (sec.tables || []).forEach(tbl => {
          tbl.headers.forEach(h => {
            const m = h.content.match(regex);
            if (m) count += m.length;
          });
          tbl.rows.forEach(r => {
            r.forEach(c => {
              const m = c.content.match(regex);
              if (m) count += m.length;
            });
          });
        });
      });

      if (document.signatures?.parties) {
        document.signatures.parties.forEach(p => {
          [p.name, p.company, p.title, p.witnessName].forEach(val => {
            if (val) {
              const m = val.match(regex);
              if (m) count += m.length;
            }
          });
        });
      }

      return count;
    } catch {
      return 0;
    }
  }, [searchTerm, caseSensitive, wholeWord, scope, document]);

  if (!isOpen) return null;

  const handleExecuteReplace = () => {
    if (!searchTerm.trim()) return;
    try {
      const res = findAndReplaceText(document, searchTerm, replaceTerm, {
        caseSensitive,
        wholeWord,
        scope
      });
      setLastReplacedCount(res.matchCount);
      onApplyReplace(
        res.updatedDoc,
        res.matchCount,
        `Replaced ${res.matchCount} occurrence(s) of "${searchTerm}" with "${replaceTerm}" across ${scope} scope.`
      );
    } catch (err: any) {
      alert(err.message || 'Replace operation failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-xl shadow-2xl text-slate-100 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-semibold tracking-wide">Find &amp; Replace Engine</h2>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs">
          {/* Search Term */}
          <div>
            <label className="block text-slate-300 font-medium mb-1">Find What</label>
            <div className="relative">
              <input
                type="text"
                autoFocus
                placeholder="e.g. Syntient Records, Party A, Net Receipts"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono text-xs"
              />
              {searchTerm && (
                <span className="absolute right-3 top-2 text-[10px] text-blue-400 font-mono bg-blue-950 px-1.5 py-0.5 rounded border border-blue-800">
                  {previewMatches} found
                </span>
              )}
            </div>
          </div>

          {/* Replace Term */}
          <div>
            <label className="block text-slate-300 font-medium mb-1">Replace With</label>
            <input
              type="text"
              placeholder="e.g. Apex Global Media, Primary Licensor"
              value={replaceTerm}
              onChange={(e) => setReplaceTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono text-xs"
            />
          </div>

          {/* Options Grid */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <label className="flex items-center gap-2 text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={caseSensitive}
                onChange={(e) => setCaseSensitive(e.target.checked)}
                className="rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-0"
              />
              <span>Match Case</span>
            </label>

            <label className="flex items-center gap-2 text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={wholeWord}
                onChange={(e) => setWholeWord(e.target.checked)}
                className="rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-0"
              />
              <span>Match Whole Word Only</span>
            </label>
          </div>

          {/* Search Scope */}
          <div>
            <label className="block text-slate-300 font-medium mb-1">Search Scope</label>
            <select
              value={scope}
              onChange={(e) => setScope(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500 text-xs"
            >
              <option value="all">Entire Document (Sections, Clauses, Tables, Signatures)</option>
              <option value="clauses">Provisions &amp; Clauses Only</option>
              <option value="titles">Headings &amp; Section Titles Only</option>
            </select>
          </div>

          {/* Result Alert */}
          {lastReplacedCount !== null && (
            <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-300 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Successfully replaced {lastReplacedCount} occurrence(s) in document model.</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors text-xs font-medium"
          >
            Close
          </button>
          <button
            onClick={handleExecuteReplace}
            disabled={!searchTerm.trim() || previewMatches === 0}
            className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 text-white font-medium text-xs flex items-center gap-1.5 shadow-md shadow-blue-900/30 transition-all"
          >
            <Replace className="w-3.5 h-3.5" />
            <span>Replace All ({previewMatches})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
