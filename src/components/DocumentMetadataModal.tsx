import React from 'react';
import { FileText, X, Download, Copy, Check, Calendar, Hash, Tag, Layers, ShieldCheck } from 'lucide-react';
import { DocumentModel } from '../types/document';

interface DocumentMetadataModalProps {
  document: DocumentModel;
  isOpen: boolean;
  onClose: () => void;
  onExportJson: () => void;
}

export const DocumentMetadataModal: React.FC<DocumentMetadataModalProps> = ({
  document,
  isOpen,
  onClose,
  onExportJson
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  // Compute stats
  const totalClauses = document.sections.reduce((acc, s) => acc + (s.clauses?.length || 0), 0);
  const totalTables = document.sections.reduce((acc, s) => acc + (s.tables?.length || 0), 0);
  const totalCharts = document.sections.reduce((acc, s) => acc + (s.charts?.length || 0), 0);
  
  let fullText = document.title + ' ' + (document.changeSummary || '');
  document.sections.forEach(s => {
    fullText += ' ' + s.title + ' ' + (s.content || '');
    s.clauses?.forEach(c => {
      fullText += ' ' + (c.heading || '') + ' ' + c.content;
    });
  });

  const wordCount = fullText.trim().split(/\s+/).filter(Boolean).length;
  const characterCount = fullText.length;

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(document, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-xl shadow-2xl text-slate-100 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-semibold tracking-wide">Document Properties &amp; Statistics</h2>
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
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-3 bg-slate-950 p-3.5 rounded-lg border border-slate-800">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase tracking-wider">Document Title</span>
              <span className="font-semibold text-slate-200">{document.title}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase tracking-wider">Document Type</span>
              <span className="font-mono text-blue-400">{document.type}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase tracking-wider">Version &amp; State</span>
              <span className="text-emerald-400 font-semibold">v{document.version} (Active Model)</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase tracking-wider">Author / Engine</span>
              <span className="text-slate-200">{document.author}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase tracking-wider">Typography</span>
              <span className="text-slate-200">{document.styles.fontFamily} ({document.styles.fontSize}pt)</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase tracking-wider">Page Format</span>
              <span className="text-slate-200">{document.pageConfig.pageSize} • {document.pageConfig.orientation}</span>
            </div>
          </div>

          {/* Metrics Stats */}
          <div>
            <h3 className="text-slate-400 font-semibold mb-2 uppercase text-[10px] tracking-wider">Document Quantitative Metrics</h3>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-slate-950 p-2.5 rounded border border-slate-800 text-center">
                <span className="text-lg font-bold text-white block">{wordCount.toLocaleString()}</span>
                <span className="text-[10px] text-slate-400">Word Count</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded border border-slate-800 text-center">
                <span className="text-lg font-bold text-white block">{characterCount.toLocaleString()}</span>
                <span className="text-[10px] text-slate-400">Characters</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded border border-slate-800 text-center">
                <span className="text-lg font-bold text-blue-400 block">{document.sections.length}</span>
                <span className="text-[10px] text-slate-400">Sections</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded border border-slate-800 text-center">
                <span className="text-lg font-bold text-emerald-400 block">{totalClauses}</span>
                <span className="text-[10px] text-slate-400">Clauses</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded border border-slate-800 text-center">
                <span className="text-lg font-bold text-amber-400 block">{totalTables}</span>
                <span className="text-[10px] text-slate-400">Data Tables</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded border border-slate-800 text-center">
                <span className="text-lg font-bold text-purple-400 block">{totalCharts}</span>
                <span className="text-[10px] text-slate-400">Visual Charts</span>
              </div>
            </div>
          </div>

          {/* Redactions Ledger */}
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
            <span className="text-slate-400 font-semibold block mb-1 text-[10px] uppercase tracking-wider">Privacy &amp; Redactions</span>
            <div className="text-slate-300">
              {document.redactions && document.redactions.length > 0 ? (
                <span>{document.redactions.length} scrub operations logged in audit ledger.</span>
              ) : (
                <span className="text-slate-500">No content redacted yet. Use Tools &gt; True Redaction to sanitize sensitive data.</span>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={handleCopyJson}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied Model' : 'Copy JSON'}</span>
            </button>
            <button
              onClick={onExportJson}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span>Export File</span>
            </button>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
