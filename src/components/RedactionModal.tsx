import React, { useState, useMemo } from 'react';
import { ShieldAlert, ShieldCheck, X, Check, AlertTriangle, Lock, History } from 'lucide-react';
import { DocumentModel } from '../types/document';
import { redactSensitiveContent } from '../orchestrator/orchestrator';

interface RedactionModalProps {
  document: DocumentModel;
  isOpen: boolean;
  onClose: () => void;
  onApplyRedaction: (updatedDoc: DocumentModel, redactedCount: number, summaryText: string) => void;
}

export const RedactionModal: React.FC<RedactionModalProps> = ({
  document,
  isOpen,
  onClose,
  onApplyRedaction
}) => {
  const [termToRedact, setTermToRedact] = useState('');
  const [redactionLabel, setRedactionLabel] = useState('[REDACTED: PRIVILEGED/CONFIDENTIAL]');
  const [lastRedactedCount, setLastRedactedCount] = useState<number | null>(null);

  // Live match count preview
  const previewMatches = useMemo(() => {
    if (!termToRedact.trim()) return 0;
    try {
      const escaped = termToRedact.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, 'gi');
      let count = 0;

      document.sections.forEach(sec => {
        const tm = sec.title.match(regex);
        if (tm) count += tm.length;
        if (sec.content) {
          const cm = sec.content.match(regex);
          if (cm) count += cm.length;
        }
        sec.clauses.forEach(cl => {
          if (cl.heading) {
            const hm = cl.heading.match(regex);
            if (hm) count += hm.length;
          }
          const bm = cl.content.match(regex);
          if (bm) count += bm.length;
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
  }, [termToRedact, document]);

  if (!isOpen) return null;

  const handleExecuteRedaction = () => {
    if (!termToRedact.trim()) return;
    try {
      const res = redactSensitiveContent(document, termToRedact, redactionLabel);
      setLastRedactedCount(res.redactedCount);
      onApplyRedaction(
        res.updatedDoc,
        res.redactedCount,
        `Permanently scrubbed ${res.redactedCount} instance(s) of "${termToRedact}" with label "${redactionLabel}".`
      );
    } catch (err: any) {
      alert(err.message || 'Redaction failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-rose-900/50 w-full max-w-lg rounded-xl shadow-2xl text-slate-100 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-rose-950/40">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <h2 className="text-sm font-semibold tracking-wide text-rose-200">
              True Redaction &amp; Privacy Sanitization Engine
            </h2>
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
          {/* Information Callout */}
          <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-800/40 text-rose-200/90 leading-relaxed flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-rose-300">True Redaction Guarantee:</span>
              <p className="mt-0.5 text-slate-300">
                Unlike simple visual black bars that can be selected or extracted with OCR, True Redaction permanently scrubs the target text string from the Document Object Model and PDF text stream.
              </p>
            </div>
          </div>

          {/* Sensitive Term Input */}
          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Sensitive Term or Token to Scrub
            </label>
            <div className="relative">
              <input
                type="text"
                autoFocus
                placeholder="e.g. Elena Rostova, Marcus Vance, SSN, 50.0%"
                value={termToRedact}
                onChange={(e) => setTermToRedact(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-rose-300 placeholder-slate-500 focus:outline-none focus:border-rose-500 font-mono text-xs"
              />
              {termToRedact && (
                <span className="absolute right-3 top-2 text-[10px] text-rose-400 font-mono bg-rose-950 px-1.5 py-0.5 rounded border border-rose-800">
                  {previewMatches} occurrences detected
                </span>
              )}
            </div>
          </div>

          {/* Redaction Label */}
          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Sanitized Replacement Label
            </label>
            <input
              type="text"
              value={redactionLabel}
              onChange={(e) => setRedactionLabel(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500 font-mono text-xs"
            />
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={() => setRedactionLabel('[REDACTED: PRIVILEGED]')}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300"
              >
                [REDACTED: PRIVILEGED]
              </button>
              <button
                type="button"
                onClick={() => setRedactionLabel('████████████')}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300"
              >
                Solid Block (████)
              </button>
              <button
                type="button"
                onClick={() => setRedactionLabel('[CONFIDENTIAL: FINANCIAL]')}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300"
              >
                [CONFIDENTIAL: FINANCIAL]
              </button>
            </div>
          </div>

          {/* Redactions Ledger Audit Trail */}
          {document.redactions && document.redactions.length > 0 && (
            <div className="pt-2 border-t border-slate-800">
              <div className="flex items-center gap-1.5 font-medium text-slate-400 mb-2">
                <History className="w-3.5 h-3.5" />
                <span>Applied Redactions in this Document ({document.redactions.length})</span>
              </div>
              <div className="max-h-28 overflow-y-auto space-y-1.5 pr-1">
                {document.redactions.map(r => (
                  <div key={r.id} className="p-2 bg-slate-950 rounded border border-slate-800 flex items-center justify-between text-[11px]">
                    <div>
                      <span className="font-mono text-rose-400">"{r.targetTerm}"</span>
                      <span className="text-slate-500 mx-1.5">→</span>
                      <span className="font-mono text-slate-300">{r.replacementText}</span>
                    </div>
                    <span className="text-[10px] text-slate-500">{r.instancesCount} instances</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Success Message */}
          {lastRedactedCount !== null && (
            <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-300 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Sanitized and logged {lastRedactedCount} instance(s) from document model.</span>
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
            onClick={handleExecuteRedaction}
            disabled={!termToRedact.trim() || previewMatches === 0}
            className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:hover:bg-rose-600 text-white font-medium text-xs flex items-center gap-1.5 shadow-md shadow-rose-950 transition-all"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Execute True Redaction ({previewMatches})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
