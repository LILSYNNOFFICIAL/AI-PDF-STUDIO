import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { 
  buildDocumentFromPrompt, 
  mergeSections, 
  splitSection, 
  reorganizeDocument, 
  applyFormatting, 
  assessDocumentQuality,
  recalculateNumbering,
  rollbackDocument
} from './src/orchestrator/orchestrator.ts';
import { DocumentModel } from './src/types/document.ts';
import { executeAiDocumentEdit } from './src/orchestrator/aiDocumentEditor.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '20mb' }));

// Initialize Google GenAI
const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({
  apiKey: apiKey || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Central Orchestrator Endpoint
app.post('/api/orchestrate', async (req, res) => {
  try {
    const { instruction, currentDoc, persona } = req.body || {};
    if (typeof instruction !== 'string' || !instruction.trim()) {
      return res.status(400).json({ error: 'Instruction is required.' });
    }
    if (!currentDoc || !Array.isArray(currentDoc.sections)) {
      return res.status(400).json({ error: 'A valid current document is required. No changes were applied.' });
    }
    if (!apiKey) {
      return res.status(503).json({
        error: 'AI editing is unavailable because GEMINI_API_KEY is not configured on the backend. No changes were applied.',
        documentUnchanged: true
      });
    }

    const doc = currentDoc as DocumentModel;
    const result = await executeAiDocumentEdit({
      instruction,
      currentDoc: doc,
      persona: persona || 'auto_architect',
      aiClient: ai,
      model: process.env.GEMINI_MODEL || 'gemini-3.8-flash'
    });

    return res.json({
      plan: [
        { id: '1', title: 'Read the complete document context in bounded sections', status: 'completed' },
        { id: '2', title: 'Generate structured document-edit operations', status: 'completed' },
        { id: '3', title: 'Validate section references and source-text preservation', status: 'completed' },
        { id: '4', title: 'Apply validated operations to the document model', status: 'completed' }
      ],
      updatedDoc: result.updatedDoc,
      summary: result.summary
    });
  } catch (err: any) {
    console.error('AI document editing failed:', err?.message || err);
    const message = err?.message || 'AI document editing failed. No changes were applied.';
    const status = /safe AI chunk limit/i.test(message) ? 413 : 502;
    return res.status(status).json({ error: message, documentUnchanged: true });
  }
});

// Quality Assessment Endpoint
app.post('/api/quality-report', (req, res) => {
  try {
    const { document } = req.body;
    if (!document) return res.status(400).json({ error: 'Document is required' });
    const report = assessDocumentQuality(document);
    res.json(report);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`AI PDF Studio server listening on http://localhost:${port}`);
  });
}

startServer();
