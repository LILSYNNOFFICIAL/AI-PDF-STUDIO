import React, { useEffect, useState } from 'react';
import { X, Download, Printer, CheckCircle, RefreshCw, FileText, ExternalLink } from 'lucide-react';
import { DocumentModel } from '../types/document';
import { generatePdfBlobUrl, downloadPdf } from '../services/pdfGenerator';

interface PDFPreviewModalProps {
  document: DocumentModel;
  isOpen: boolean;
  onClose: () => void;
}

export const PDFPreviewModal: React.FC<PDFPreviewModalProps> = ({
  document,
  isOpen,
  onClose
}) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsGenerating(true);
      try {
        const url = generatePdfBlobUrl(document);
        setBlobUrl(url);
      } catch (err) {
        console.error('Error generating PDF preview:', err);
      } finally {
        setIsGenerating(false);
      }
    } else {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
        setBlobUrl(null);
      }
    }
  }, [isOpen, document]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Modal Header */}
        <div className="h-14 px-4 border-b border-slate-800 flex items-center justify-between bg-slate-950 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-blue-500/20 text-blue-400 rounded-md">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm text-white">PDF Production Engine &amp; Preview</h3>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-mono">
                  Validated
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate max-w-md">
                {document.title} (v{document.version})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => downloadPdf(document)}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-md text-xs font-medium shadow-sm transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* PDF Inspection Viewer */}
        <div className="flex-1 bg-slate-950 p-4 flex items-center justify-center overflow-hidden relative">
          {isGenerating ? (
            <div className="flex flex-col items-center gap-3 text-slate-400 text-xs">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
              <span>Rendering high-fidelity PDF pages...</span>
            </div>
          ) : blobUrl ? (
            <iframe 
              src={blobUrl} 
              title="PDF Preview"
              className="w-full h-full rounded border border-slate-800 bg-white"
            />
          ) : (
            <div className="text-rose-400 text-xs">Failed to render PDF preview.</div>
          )}
        </div>

        {/* Footer Metrics */}
        <div className="h-10 px-4 border-t border-slate-800 bg-slate-950 text-slate-400 text-xs flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4 text-[11px]">
            <span>Format: <strong>{document.pageConfig.pageSize}</strong></span>
            <span>Orientation: <strong>{document.pageConfig.orientation.toUpperCase()}</strong></span>
            <span>Sections: <strong>{document.sections.length}</strong></span>
            <span>Font: <strong>{document.styles.fontFamily} ({document.styles.fontSize}pt)</strong></span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Ready for Signing &amp; Distribution</span>
          </div>
        </div>
      </div>
    </div>
  );
};
