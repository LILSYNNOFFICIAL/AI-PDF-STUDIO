import React from 'react';
import { 
  X, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Wrench, 
  Sparkles, 
  BookOpen, 
  FileCheck,
  Percent
} from 'lucide-react';
import { DocumentModel, QualityReport } from '../types/document';
import { assessDocumentQuality } from '../orchestrator/orchestrator';

interface ValidationReportModalProps {
  document: DocumentModel;
  isOpen: boolean;
  onClose: () => void;
  onAutoRepairReferences: () => void;
}

export const ValidationReportModal: React.FC<ValidationReportModalProps> = ({
  document,
  isOpen,
  onClose,
  onAutoRepairReferences
}) => {
  if (!isOpen) return null;

  const report: QualityReport = assessDocumentQuality(document);

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-400 border-emerald-500/40 bg-emerald-950/30';
    if (score >= 75) return 'text-amber-400 border-amber-500/40 bg-amber-950/30';
    return 'text-rose-400 border-rose-500/40 bg-rose-950/30';
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="h-14 px-4 border-b border-slate-800 flex items-center justify-between bg-slate-950 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-md">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-white">Document Quality &amp; Integrity Assessment</h3>
              <p className="text-[11px] text-slate-400">
                Automated 15-point audit of structure, cross-references, and content preservation
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Top Score Gauge */}
          <div className="grid grid-cols-1 sm:grid-cols-6 gap-3">
            <div className={`sm:col-span-2 p-4 rounded-xl border flex flex-col items-center justify-center text-center ${getScoreColor(report.overallScore)}`}>
              <span className="text-[11px] font-semibold uppercase tracking-wider mb-1">
                Overall Quality Index
              </span>
              <div className="text-4xl font-black font-mono my-1">
                {report.overallScore}<span className="text-xl font-normal">/100</span>
              </div>
              <span className="text-[10px] text-slate-400">
                {report.overallScore >= 90 ? 'Executive & Legal Grade' : 'Optimization Recommended'}
              </span>
            </div>

            <div className="sm:col-span-4 grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-800/60 p-2.5 rounded-lg border border-slate-700/60 flex flex-col justify-between">
                <span className="text-slate-400 text-[11px]">Source Preservation</span>
                <span className="text-emerald-400 font-bold text-base mt-1">{report.integrityScore}%</span>
              </div>
              <div className="bg-slate-800/60 p-2.5 rounded-lg border border-slate-700/60 flex flex-col justify-between">
                <span className="text-slate-400 text-[11px]">Structural Hierarchy</span>
                <span className="text-blue-400 font-bold text-base mt-1">{report.structureScore}%</span>
              </div>
              <div className="bg-slate-800/60 p-2.5 rounded-lg border border-slate-700/60 flex flex-col justify-between">
                <span className="text-slate-400 text-[11px]">Cross-Reference Graph</span>
                <span className="text-indigo-400 font-bold text-base mt-1">{report.referencesScore}%</span>
              </div>
              <div className="bg-slate-800/60 p-2.5 rounded-lg border border-slate-700/60 flex flex-col justify-between">
                <span className="text-slate-400 text-[11px]">Pagination &amp; Formatting</span>
                <span className="text-emerald-400 font-bold text-base mt-1">{report.formattingScore}%</span>
              </div>
            </div>
          </div>

          {/* Action to Auto Repair */}
          {report.findings.some(f => f.category === 'References') && (
            <div className="bg-blue-950/40 border border-blue-500/40 rounded-lg p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-blue-400 shrink-0" />
                <span className="text-xs text-blue-200">
                  Detected cross-reference updates or discrepancies that can be repaired automatically.
                </span>
              </div>
              <button
                onClick={() => {
                  onAutoRepairReferences();
                  onClose();
                }}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-3 py-1.5 rounded font-medium shrink-0 ml-3"
              >
                Auto-Repair All
              </button>
            </div>
          )}

          {/* Findings List */}
          <div>
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
              Diagnostic Audit Findings ({report.findings.length})
            </h4>

            {report.findings.length === 0 ? (
              <div className="p-6 bg-slate-950/60 border border-emerald-500/30 rounded-xl text-center flex flex-col items-center gap-2 text-slate-400 text-xs">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                <span className="font-semibold text-slate-200 text-sm">Perfect Document Integrity</span>
                <span>All clauses, dynamic numbering, cross-references, and execution lines pass validation.</span>
              </div>
            ) : (
              <div className="space-y-2">
                {report.findings.map((finding, idx) => (
                  <div 
                    key={idx}
                    className="p-3 bg-slate-800/60 border border-slate-700/80 rounded-lg flex items-start gap-3 text-xs"
                  >
                    <div className="mt-0.5">
                      {finding.severity === 'high' ? (
                        <AlertTriangle className="w-4 h-4 text-rose-400" />
                      ) : finding.severity === 'medium' ? (
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-blue-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-200">{finding.title}</span>
                        <span className="text-[10px] font-mono bg-slate-700/60 text-slate-300 px-1.5 py-0.5 rounded">
                          {finding.category}
                        </span>
                      </div>
                      <p className="text-slate-400 mt-1">{finding.description}</p>
                      {finding.suggestedFix && (
                        <div className="mt-1.5 text-[11px] text-blue-300 flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-blue-400" />
                          <span>Recommendation: {finding.suggestedFix}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="h-12 px-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
          <span>Audited: {new Date(report.generatedAt).toLocaleTimeString()}</span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-medium"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
};
