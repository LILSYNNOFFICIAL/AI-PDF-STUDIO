import React, { useMemo } from 'react';
import { FileText, WandSparkles, X, ShieldCheck, AlertTriangle } from 'lucide-react';
import { DOCUMENT_DESIGN_PRESETS } from '../services/documentDesign';

interface SourceOfTruthModalProps {
  isOpen: boolean;
  source: string;
  selectedPresetId: string;
  onSourceChange: (value: string) => void;
  onPresetChange: (value: string) => void;
  onRender: () => void;
  onClose: () => void;
  isRendering?: boolean;
}

export const SourceOfTruthModal: React.FC<SourceOfTruthModalProps> = ({
  isOpen, source, selectedPresetId, onSourceChange, onPresetChange, onRender, onClose, isRendering = false
}) => {
  const metrics = useMemo(() => ({
    characters: source.length,
    words: source.trim() ? source.trim().split(/\s+/).length : 0,
    lines: source ? source.split(/\r\n?|\n/).length : 0
  }), [source]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="source-truth-title">
      <div className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 shadow-2xl">
        <header className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-blue-400/30 bg-blue-500/10 p-2"><FileText className="h-5 w-5 text-blue-300" /></div>
            <div>
              <h2 id="source-truth-title" className="text-base font-semibold text-white">Source of Truth</h2>
              <p className="text-xs text-slate-400">Your original document is authoritative. Rendering builds the editable layout around it.</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close Source of Truth" className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"><X className="h-4 w-4" /></button>
        </header>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-y-auto p-5 lg:grid-cols-[minmax(0,1fr)_280px]">
          <section className="flex min-h-[360px] flex-col">
            <div className="mb-2 flex items-center justify-between">
              <label htmlFor="source-document-input" className="text-xs font-semibold uppercase tracking-wider text-slate-300">Complete original document</label>
              <span className="text-[10px] text-slate-500">Paste the entire document below</span>
            </div>
            <textarea
              id="source-document-input"
              value={source}
              onChange={event => onSourceChange(event.target.value)}
              spellCheck={false}
              placeholder={'Paste your complete document here...\n\nThe renderer will preserve the original wording and order, then build editable sections and apply your selected design.'}
              className="min-h-[360px] flex-1 resize-y rounded-xl border border-slate-700 bg-slate-900/80 p-4 font-mono text-xs leading-6 text-slate-100 outline-none placeholder:text-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30"
            />
            <div className="mt-2 flex flex-wrap gap-4 text-[10px] font-mono text-slate-500">
              <span>{metrics.words.toLocaleString()} words</span><span>{metrics.characters.toLocaleString()} characters</span><span>{metrics.lines.toLocaleString()} lines</span>
            </div>
          </section>

          <aside className="space-y-4">
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
              <label htmlFor="source-design-preset" className="mb-2 block text-xs font-semibold text-slate-200">Document design</label>
              <select id="source-design-preset" value={selectedPresetId} onChange={event => onPresetChange(event.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-xs text-white outline-none focus:border-blue-500">
                {DOCUMENT_DESIGN_PRESETS.map(preset => <option key={preset.presetId} value={preset.presetId}>{preset.name}</option>)}
              </select>
              <p className="mt-2 text-[10px] leading-5 text-slate-500">The design changes typography, colors, page styling, section surfaces and table styling. It does not rewrite your text.</p>
            </div>

            <div className="rounded-xl border border-emerald-800/60 bg-emerald-950/20 p-4">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-emerald-300"><ShieldCheck className="h-4 w-4" /> Source protection</div>
              <ul className="space-y-2 text-[10px] leading-5 text-emerald-100/80">
                <li>• Original pasted text is stored separately from the editable document.</li>
                <li>• Unrecognized formatting does not cause the import to fail.</li>
                <li>• Existing sample-template content is replaced when you render.</li>
                <li>• AI edits remain separate from the saved original source.</li>
              </ul>
            </div>

            <div className="rounded-xl border border-amber-800/50 bg-amber-950/20 p-4">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-amber-300"><AlertTriangle className="h-4 w-4" /> Important</div>
              <p className="text-[10px] leading-5 text-amber-100/75">Rendering is a structural and visual operation. It will not invent missing contract terms, participant names, signature dates, or table values.</p>
            </div>
          </aside>
        </div>

        <footer className="flex flex-col-reverse gap-3 border-t border-slate-800 bg-slate-950/90 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[10px] text-slate-500">The current canvas is replaced only after rendering succeeds.</p>
          <div className="flex items-center justify-end gap-2">
            <button onClick={onClose} className="rounded-lg border border-slate-700 px-4 py-2 text-xs text-slate-300 hover:bg-slate-800">Cancel</button>
            <button onClick={onRender} disabled={!source.trim() || isRendering} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-blue-950/40 hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40">
              <WandSparkles className="h-4 w-4" /> {isRendering ? 'Rendering…' : 'Render Document'}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};
