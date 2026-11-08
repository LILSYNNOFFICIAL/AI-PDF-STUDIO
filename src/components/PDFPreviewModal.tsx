import React, { useEffect, useRef, useState } from 'react';
import { X, Download, CheckCircle, RefreshCw, FileText } from 'lucide-react';
import { DocumentModel } from '../types/document';
import { downloadPdf } from '../services/pdfGenerator';

interface PDFPreviewModalProps {
  document: DocumentModel;
  isOpen: boolean;
  onClose: () => void;
}

type PdfJsModule = {
  GlobalWorkerOptions: { workerSrc: string };
  getDocument: (options: { data: Uint8Array }) => { promise: Promise<any>; destroy: () => Promise<void> };
};

export const PDFPreviewModal: React.FC<PDFPreviewModalProps> = ({ document, isOpen, onClose }) => {
  const [pdfData, setPdfData] = useState<Uint8Array | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRenderingPages, setIsRenderingPages] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [renderProgress, setRenderProgress] = useState({ current: 0, total: 0 });
  const viewerRef = useRef<HTMLDivElement>(null);

  // Generate the PDF away from the UI thread.
  useEffect(() => {
    if (!isOpen) {
      setPdfData(null);
      setIsGenerating(false);
      setIsRenderingPages(false);
      setPreviewError(null);
      setRenderProgress({ current: 0, total: 0 });
      return;
    }

    setPdfData(null);
    setPreviewError(null);
    setIsGenerating(true);
    const worker = new Worker(new URL('../workers/pdfPreview.worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (event: MessageEvent<{ buffer?: ArrayBuffer; error?: string }>) => {
      if (event.data.error || !event.data.buffer) {
        setPreviewError(event.data.error || 'The PDF renderer returned no document data.');
        setIsGenerating(false);
        return;
      }
      setPdfData(new Uint8Array(event.data.buffer));
      setIsGenerating(false);
    };
    worker.onerror = event => {
      setPreviewError(event.message || 'The PDF generation worker failed.');
      setIsGenerating(false);
    };
    try {
      worker.postMessage(document);
    } catch (error) {
      setPreviewError(error instanceof Error ? error.message : 'Unable to send the document to the PDF renderer.');
      setIsGenerating(false);
    }
    return () => worker.terminate();
  }, [isOpen, document]);

  // Render PDF pages to high-DPI canvases. This avoids relying on the browser's
  // inconsistent built-in PDF iframe viewer and gives us predictable sharpness.
  useEffect(() => {
    if (!isOpen || !pdfData || !viewerRef.current) return;
    let cancelled = false;
    let pdfDocument: any = null;
    setIsRenderingPages(true);
    setPreviewError(null);
    setRenderProgress({ current: 0, total: 0 });

    const render = async () => {
      try {
        await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
        const viewer = viewerRef.current;
        if (!viewer) throw new Error('The PDF preview surface is unavailable.');
        viewer.replaceChildren();

        const dynamicImport = new Function('url', 'return import(url)') as (url: string) => Promise<PdfJsModule>;
        const version = '4.10.38';
        const pdfjs = await dynamicImport('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/' + version + '/pdf.min.mjs');
        if (cancelled) return;
        pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/' + version + '/pdf.worker.min.mjs';

        const loadingTask = pdfjs.getDocument({ data: new Uint8Array(pdfData) });
        pdfDocument = await loadingTask.promise;
        if (cancelled) return;
        setRenderProgress({ current: 0, total: pdfDocument.numPages });

        const pixelRatio = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
        for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber += 1) {
          if (cancelled || !viewerRef.current) return;
          const page = await pdfDocument.getPage(pageNumber);
          const baseViewport = page.getViewport({ scale: 1 });
          const availableWidth = Math.max(240, viewerRef.current.clientWidth - 40);
          const scale = availableWidth / baseViewport.width;
          const viewport = page.getViewport({ scale });
          const canvas = window.document.createElement('canvas');
          const context = canvas.getContext('2d', { alpha: false });
          if (!context) throw new Error('The browser could not create a PDF page canvas.');
          canvas.width = Math.ceil(viewport.width * pixelRatio);
          canvas.height = Math.ceil(viewport.height * pixelRatio);
          canvas.style.width = viewport.width + 'px';
          canvas.style.height = viewport.height + 'px';
          canvas.style.maxWidth = '100%';
          canvas.style.background = '#ffffff';
          canvas.style.boxShadow = '0 3px 18px rgba(0,0,0,.28)';
          canvas.setAttribute('aria-label', 'PDF page ' + pageNumber);
          viewerRef.current.appendChild(canvas);
          await page.render({
            canvasContext: context,
            viewport,
            transform: [pixelRatio, 0, 0, pixelRatio, 0, 0],
            background: '#ffffff'
          }).promise;
          if (cancelled) return;
          setRenderProgress({ current: pageNumber, total: pdfDocument.numPages });
        }
        setIsRenderingPages(false);
      } catch (error) {
        if (!cancelled) {
          setPreviewError(error instanceof Error ? error.message : 'Unable to render the PDF pages.');
          setIsRenderingPages(false);
        }
      }
    };

    void render();
    return () => {
      cancelled = true;
      if (pdfDocument) void pdfDocument.destroy();
    };
  }, [isOpen, pdfData]);

  if (!isOpen) return null;

  const isBusy = isGenerating || isRenderingPages;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        <div className="h-14 px-4 border-b border-slate-800 flex items-center justify-between bg-slate-950 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-blue-500/20 text-blue-400 rounded-md">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm text-white">PDF Production Engine &amp; Preview</h3>
                <span className={previewError ? 'text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-1.5 py-0.5 rounded font-mono' : 'text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-mono'}>
                  {previewError ? 'Preview Error' : isBusy ? 'Rendering' : 'Rendered'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate max-w-md">{document.title} (v{document.version})</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => downloadPdf(document)} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-md text-xs font-medium shadow-sm transition-colors">
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition-colors" aria-label="Close PDF preview">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 bg-slate-950 p-4 overflow-hidden relative">
          {isBusy && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-slate-950/90 text-slate-400 text-xs">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
              <span>{isGenerating ? 'Generating PDF…' : 'Rendering page ' + renderProgress.current + ' of ' + renderProgress.total + '…'}</span>
            </div>
          )}
          {previewError && <div role="alert" className="absolute inset-0 z-20 flex items-center justify-center p-8 text-center text-sm text-rose-300">{previewError}</div>}
          <div ref={viewerRef} className="h-full w-full overflow-auto flex flex-col items-center gap-5 py-2" />
        </div>

        <div className="h-10 px-4 border-t border-slate-800 bg-slate-950 text-slate-400 text-xs flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4 text-[11px]">
            <span>Format: <strong>{document.pageConfig.pageSize}</strong></span>
            <span>Orientation: <strong>{document.pageConfig.orientation.toUpperCase()}</strong></span>
            <span>Sections: <strong>{document.sections.length}</strong></span>
            <span>Font: <strong>{document.styles.fontFamily} ({document.styles.fontSize}pt)</strong></span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>{previewError ? 'PDF download remains available' : isBusy ? 'Preparing preview' : 'PDF pages rendered'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
