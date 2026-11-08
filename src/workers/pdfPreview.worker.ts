import { DocumentModel } from '../types/document';
import { generatePdfDocument } from '../services/pdfGenerator';

type WorkerScope = {
  addEventListener: (type: 'message', listener: (event: MessageEvent<DocumentModel>) => void) => void;
  postMessage: (message: unknown, transfer: Transferable[]) => void;
};

const scope = globalThis as unknown as WorkerScope;

scope.addEventListener('message', event => {
  try {
    const pdf = generatePdfDocument(event.data);
    const buffer = pdf.output('arraybuffer') as ArrayBuffer;
    scope.postMessage({ buffer }, [buffer]);
  } catch (error) {
    scope.postMessage({ error: error instanceof Error ? error.message : 'PDF rendering failed.' }, []);
  }
});
