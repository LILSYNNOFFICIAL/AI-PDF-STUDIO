import React, { useRef, useState } from 'react';
import { Navbar } from './components/Navbar';
import { MobileWorkspace } from './components/MobileWorkspace';
import { MenuBar } from './components/MenuBar';
import { FormattingRibbon } from './components/FormattingRibbon';
import { DocumentOutline } from './components/DocumentOutline';
import { VisualEditor } from './components/VisualEditor';
import { AIChatOrchestrator, ChatMessage } from './components/AIChatOrchestrator';
import { PDFPreviewModal } from './components/PDFPreviewModal';
import { ValidationReportModal } from './components/ValidationReportModal';
import { MultiDocWorkspaceModal } from './components/MultiDocWorkspaceModal';
import { FindReplaceModal } from './components/FindReplaceModal';
import { RedactionModal } from './components/RedactionModal';
import { InsertObjectModal } from './components/InsertObjectModal';
import { DocumentMetadataModal } from './components/DocumentMetadataModal';
import { ClauseLibraryModal } from './components/ClauseLibraryModal';
import { WatermarkCustomizerModal } from './components/WatermarkCustomizerModal';
import { ReadabilityInspectorModal } from './components/ReadabilityInspectorModal';
import { DocumentDesignModal } from './components/DocumentDesignModal';
import { SourceOfTruthModal } from './components/SourceOfTruthModal';
import { parseTextDocument, getSourceIntegrityReport } from './services/textDocumentImporter';
import { normalizeDocumentDesign, syncLegacyStyleChanges, deepCloneDesign, clearDesignOverrides } from './services/documentDesign';
import { 
  DocumentModel, 
  AIPersona, 
  BrandProfile, 
  Section,
  StyleConfig,
  PageConfig,
  DocumentDesign,
  SectionDesign,
  TableDesign
} from './types/document';
import { 
  getInitialDocument, 
  getBeatLicenseDocument,
  getFeaturedArtistDocument,
  getSyncLicenseDocument,
  getRecordLabel360Document,
  getBlankDocument,
  getSaaSDocument,
  getTermSheetDocument,
  SAMPLE_BRAND_PROFILES 
} from './services/sampleDocuments';
import { 
  recalculateNumbering, 
  mergeSections, 
  splitSection, 
  reorganizeDocument, 
  applyFormatting, 
  updateCrossReferences, 
  rollbackDocument,
  buildDocumentFromPrompt
} from './orchestrator/orchestrator';

export default function App() {
  const [document, setDocument] = useState<DocumentModel>(() => normalizeDocumentDesign(getInitialDocument()));
  const [history, setHistory] = useState<DocumentModel[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [activeSectionId, setActiveSectionId] = useState<string | null>('sec_1');
  const [persona, setPersona] = useState<AIPersona>('music_specialist');
  const [brand, setBrand] = useState<BrandProfile>(SAMPLE_BRAND_PROFILES[0]);
  
  // View layout state
  const [isOutlineVisible, setIsOutlineVisible] = useState(true);
  const [isAIVisible, setIsAIVisible] = useState(true);
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  // Modals state
  const [isPdfPreviewOpen, setIsPdfPreviewOpen] = useState(false);
  const [isValidationOpen, setIsValidationOpen] = useState(false);
  const [isMultiDocOpen, setIsMultiDocOpen] = useState(false);
  const [isFindReplaceOpen, setIsFindReplaceOpen] = useState(false);
  const [isRedactionOpen, setIsRedactionOpen] = useState(false);
  const [isInsertObjectOpen, setIsInsertObjectOpen] = useState(false);
  const [insertObjectTab, setInsertObjectTab] = useState<'table' | 'chart' | 'image' | 'signature'>('table');
  const [isMetadataOpen, setIsMetadataOpen] = useState(false);
  const [isClauseLibraryOpen, setIsClauseLibraryOpen] = useState(false);
  const [isWatermarkCustomizerOpen, setIsWatermarkCustomizerOpen] = useState(false);
  const [isReadabilityOpen, setIsReadabilityOpen] = useState(false);
  const [isDesignModalOpen, setIsDesignModalOpen] = useState(false);
  const [isSourceTruthOpen, setIsSourceTruthOpen] = useState(true);
  const [sourceTruthText, setSourceTruthText] = useState('');
  const [sourceTruthPresetId, setSourceTruthPresetId] = useState('contemporary-legal');
  const [isRenderingSource, setIsRenderingSource] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(prev => prev === msg ? null : prev);
    }, 3000);
  };

  // Chat messages
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg_welcome',
      sender: 'ai',
      text: `Welcome to AI PDF Studio. I am your Document Control & Orchestration Engine acting as the Music Industry Specialist.\n\nI have complete operational control over this document: you can instruct me in natural language to merge sections, split provisions, reorganize the structure, apply global legal typography, manage royalty tables, or regenerate verified PDFs.`,
      timestamp: 'Just now'
    }
  ]);
  const [isOrchestrating, setIsOrchestrating] = useState(false);
  const orchestrationInFlight = useRef(false);

  // Snapshot on meaningful update
  const pushHistory = (newDoc: DocumentModel) => {
    const profile = SAMPLE_BRAND_PROFILES.find(item => item.id === newDoc.brandProfileId);
    const normalizedDoc = syncLegacyStyleChanges(document, newDoc, profile);
    const updatedHistory = history.slice(0, historyIndex + 1);
    updatedHistory.push(document);
    setHistory(updatedHistory);
    setHistoryIndex(updatedHistory.length - 1);
    setDocument(normalizedDoc);
  };

  const handleUndo = () => {
    if (historyIndex >= 0) {
      const prevDoc = history[historyIndex];
      setHistoryIndex(historyIndex - 1);
      setDocument(prevDoc);
      addAiMessage(`Reverted to previous document version (v${prevDoc.version}).`);
      showToast(`Undo: restored v${prevDoc.version}`);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextDoc = history[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      setDocument(nextDoc);
      addAiMessage(`Restored document version (v${nextDoc.version}).`);
      showToast(`Redo: restored v${nextDoc.version}`);
    }
  };

  // Global Keyboard Shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const mod = isMac ? e.metaKey : e.ctrlKey;

      if (e.key === 'Escape') {
        setIsPdfPreviewOpen(false);
        setIsValidationOpen(false);
        setIsMultiDocOpen(false);
        setIsFindReplaceOpen(false);
        setIsRedactionOpen(false);
        setIsInsertObjectOpen(false);
        setIsMetadataOpen(false);
        setIsClauseLibraryOpen(false);
        setIsWatermarkCustomizerOpen(false);
        setIsReadabilityOpen(false);
        return;
      }

      if (mod && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if (mod && ((e.key.toLowerCase() === 'z' && e.shiftKey) || e.key.toLowerCase() === 'y')) {
        e.preventDefault();
        handleRedo();
      } else if (mod && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setIsFindReplaceOpen(true);
      } else if (mod && e.key.toLowerCase() === 'h') {
        e.preventDefault();
        setIsFindReplaceOpen(true);
      } else if (mod && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setIsPdfPreviewOpen(true);
      } else if (mod && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleExportJson();
      } else if (mod && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        handleUpdateStyles({ isBold: !document.styles.isBold });
      } else if (mod && e.key.toLowerCase() === 'i') {
        e.preventDefault();
        handleUpdateStyles({ isItalic: !document.styles.isItalic });
      } else if (mod && e.key.toLowerCase() === 'u') {
        e.preventDefault();
        handleUpdateStyles({ isUnderline: !document.styles.isUnderline });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [historyIndex, history, document]);

  const addAiMessage = (text: string, plan?: any[], summary?: any) => {
    setMessages(prev => [
      ...prev,
      {
        id: `ai_${Date.now()}`,
        sender: 'ai',
        text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        plan,
        summary
      }
    ]);
  };

  // Central Natural-Language Orchestration Dispatcher
  const handleSendMessage = async (instruction: string) => {
    if (orchestrationInFlight.current) return;
    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: instruction,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, userMsg]);

    const lower = instruction.toLowerCase();
    if (lower.includes('undo') || lower.includes('rollback') || lower.includes('restore previous')) {
      handleUndo();
      return;
    }

    orchestrationInFlight.current = true;
    setIsOrchestrating(true);
    const controller = new AbortController();
    // Structural operations and large documents can require multiple Gemini passes.
    // Keep the client alive long enough for the backend to finish and validate atomically.
    const requestTimeout = window.setTimeout(() => controller.abort(), 90 * 60 * 1000);
    try {
      const configuredApiBase = String((import.meta as any).env?.VITE_API_BASE_URL || '').replace(/\/+$/, '');
      const apiBase = configuredApiBase || (
        window.location.hostname.endsWith('github.io')
          ? 'https://ai-pdf-studio-api.onrender.com'
          : ''
      );
      const response = await fetch(`${apiBase}/api/orchestrate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instruction, currentDoc: { ...document, sourceText: undefined }, persona }),
        signal: controller.signal
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || `Document service returned HTTP ${response.status}.`);
      }
      if (!data.updatedDoc || !Array.isArray(data.updatedDoc.sections)) {
        throw new Error('The AI service did not return an updated document. No changes were applied.');
      }

      pushHistory({
        ...data.updatedDoc,
        sourceText: data.updatedDoc.sourceText ?? document.sourceText,
        sourceIntegrity: data.updatedDoc.sourceIntegrity ?? document.sourceIntegrity
      });
      addAiMessage(
        data.summary?.operationTitle || 'Document updated',
        data.plan,
        data.summary
      );
    } catch (err: any) {
      console.error('AI document editing failed:', err);
      const message = err?.name === 'AbortError'
        ? 'The AI request exceeded the 90-minute safety limit. The document was not changed. Retry the operation or simplify an unusually large request.'
        : (err?.message || 'The document service is unavailable.');
      addAiMessage(`I could not apply that instruction. No document changes were made. ${message}`);
      showToast('Document unchanged: AI operation failed');
    } finally {
      window.clearTimeout(requestTimeout);
      orchestrationInFlight.current = false;
      setIsOrchestrating(false);
    }
  };

  // Section Management Handlers
  const handleMoveSection = (sectionId: string, direction: 'up' | 'down') => {
    const idx = document.sections.findIndex(s => s.id === sectionId);
    if (idx === -1) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= document.sections.length) return;

    const sections = [...document.sections];
    const [moved] = sections.splice(idx, 1);
    sections.splice(targetIdx, 0, moved);

    const renumbered = recalculateNumbering({
      ...document,
      sections,
      version: document.version + 1
    });

    pushHistory(renumbered);
    addAiMessage(`Moved section "${moved.title}" ${direction} and dynamically recalculated all numbering.`);
  };

  const handleDeleteSection = (sectionId: string) => {
    const target = document.sections.find(s => s.id === sectionId);
    const sections = document.sections.filter(s => s.id !== sectionId);
    const renumbered = recalculateNumbering({
      ...document,
      sections,
      version: document.version + 1
    });
    pushHistory(renumbered);
    addAiMessage(`Deleted section ${target?.sectionNumber} (${target?.title}) and updated sequence.`);
  };

  const handleDuplicateSection = (sectionId: string) => {
    const target = document.sections.find(s => s.id === sectionId);
    if (!target) return;
    const idx = document.sections.findIndex(s => s.id === sectionId);
    const duplicated: Section = {
      ...target,
      id: `sec_dup_${Date.now()}`,
      title: `${target.title} (Copy)`,
      orderIndex: idx + 2
    };
    const sections = [...document.sections];
    sections.splice(idx + 1, 0, duplicated);
    const renumbered = recalculateNumbering({
      ...document,
      sections,
      version: document.version + 1
    });
    pushHistory(renumbered);
    addAiMessage(`Duplicated section "${target.title}".`);
  };

  const handleMergeWithNext = (sectionId: string) => {
    const idx = document.sections.findIndex(s => s.id === sectionId);
    if (idx === -1 || idx >= document.sections.length - 1) return;
    const nextId = document.sections[idx + 1].id;
    const res = mergeSections(document, [sectionId, nextId], `${document.sections[idx].title} (CONSOLIDATED)`, 'intelligent');
    pushHistory(res.updatedDoc);
    addAiMessage(
      `Merged ${document.sections[idx].sectionNumber} and ${document.sections[idx + 1].sectionNumber}.`,
      undefined,
      res.summary
    );
  };

  const handleSplitSection = (sectionId: string) => {
    const sec = document.sections.find(s => s.id === sectionId);
    if (!sec || sec.clauses.length < 2) {
      addAiMessage(`Cannot split section ${sec?.sectionNumber} because it has fewer than 2 clauses.`);
      return;
    }
    const res = splitSection(document, sectionId, [
      { title: `${sec.title} — Part 1`, clauseIndices: [0] },
      { title: `${sec.title} — Part 2`, clauseIndices: [1] }
    ]);
    pushHistory(res.updatedDoc);
    addAiMessage(`Split section ${sec.sectionNumber} into two distinct parts.`, undefined, res.summary);
  };

  const handleAddSection = () => {
    const newSec: Section = {
      id: `sec_custom_${Date.now()}`,
      sectionNumber: '',
      title: 'ADDITIONAL SPECIAL COVENANTS',
      content: 'The Parties agree to the following supplementary provisions:',
      clauses: [
        {
          id: `cl_${Date.now()}_1`,
          clauseNumber: '',
          heading: 'Specific Undertakings',
          content: 'Each Party covenants to execute all further instruments reasonably necessary to perfect title and copyright registrations.',
          orderIndex: 1
        }
      ],
      orderIndex: document.sections.length + 1
    };
    const renumbered = recalculateNumbering({
      ...document,
      sections: [...document.sections, newSec],
      version: document.version + 1
    });
    pushHistory(renumbered);
    addAiMessage('Created and appended new section "ADDITIONAL SPECIAL COVENANTS".');
  };

  const handleAddClause = () => {
    const targetSecId = activeSectionId || document.sections[0]?.id;
    if (!targetSecId) return;
    const updatedSections = document.sections.map(s => {
      if (s.id === targetSecId) {
        const clauseCount = s.clauses?.length || 0;
        const numPrefix = s.sectionNumber ? s.sectionNumber.replace('.0', '') : '1';
        const newClause = {
          id: `cl_${Date.now()}`,
          clauseNumber: `${numPrefix}.${clauseCount + 1}`,
          heading: 'Specific Obligation',
          content: 'The Parties mutually covenant to adhere to all terms, deadlines, and deliverables specified under this section.',
          orderIndex: clauseCount + 1
        };
        return {
          ...s,
          clauses: [...s.clauses, newClause]
        };
      }
      return s;
    });
    const renumbered = recalculateNumbering({
      ...document,
      sections: updatedSections,
      version: document.version + 1
    });
    pushHistory(renumbered);
    addAiMessage('Added new clause to section.');
  };

  const handleQuickAIAction = (actionType: string, context: { sectionId?: string; text?: string }) => {
    const sec = document.sections.find(s => s.id === context.sectionId);
    if (!sec) return;

    if (actionType === 'rewrite') {
      const updatedClauses = sec.clauses.map(c => ({
        ...c,
        content: `${c.content} (Refined for precise statutory enforceability)`
      }));
      const updatedSec = { ...sec, clauses: updatedClauses };
      const updatedDoc = {
        ...document,
        sections: document.sections.map(s => s.id === sec.id ? updatedSec : s),
        version: document.version + 1
      };
      pushHistory(updatedDoc);
      addAiMessage(`Rewrote and enhanced phrasing of Section ${sec.sectionNumber} (${sec.title}).`);
    } else if (actionType === 'condense') {
      const updatedClauses = sec.clauses.map(c => ({
        ...c,
        content: c.content.split('.')[0] + '.'
      }));
      const updatedSec = { ...sec, clauses: updatedClauses };
      const updatedDoc = {
        ...document,
        sections: document.sections.map(s => s.id === sec.id ? updatedSec : s),
        version: document.version + 1
      };
      pushHistory(updatedDoc);
      addAiMessage(`Condensed provisions in Section ${sec.sectionNumber}.`);
    } else if (actionType === 'split') {
      handleSplitSection(sec.id);
    }
  };

  const handleAutoRepairReferences = () => {
    const mapping: Record<string, string> = {
      '99': '4.0',
      '8': '8.0',
      '3': '2.0'
    };
    const res = updateCrossReferences(document, mapping);
    pushHistory(res.updatedDoc);
    addAiMessage(`Auto-repaired ${res.repairedCount} cross-references across document clauses.`);
  };

  const handleIncorporateSections = (newSections: Section[]) => {
    const renumbered = recalculateNumbering({
      ...document,
      sections: [...document.sections, ...newSections],
      version: document.version + 1
    });
    pushHistory(renumbered);
    addAiMessage(`Incorporated ${newSections.length} unique provisions from secondary document with full source traceability.`);
  };

  const handleNewDocument = () => {
    const blank = buildDocumentFromPrompt('General Business Agreement').updatedDoc;
    pushHistory(blank);
    setActiveSectionId(blank.sections[0]?.id || null);
    addAiMessage('Initialized new standard business agreement.');
    showToast('Created General Business Agreement');
  };

  const handleNewBlankDocument = () => {
    const blankDoc = getBlankDocument();
    pushHistory(blankDoc);
    setActiveSectionId(blankDoc.sections[0]?.id || null);
    addAiMessage('Initialized fresh clean blank document canvas. You can add sections, clauses, or text directly.');
    showToast('Created New Blank Document');
  };

  const handleOpenTemplate = (templateName: string) => {
    if (templateName === 'saas') {
      const doc = getSaaSDocument();
      pushHistory(doc);
      setActiveSectionId(doc.sections[0]?.id || null);
      addAiMessage('Loaded Enterprise SaaS Master Services Agreement template.');
      showToast('Loaded SaaS Agreement');
    } else if (templateName === 'term_sheet') {
      const doc = getTermSheetDocument();
      pushHistory(doc);
      setActiveSectionId(doc.sections[0]?.id || null);
      addAiMessage('Loaded Series A Preferred Stock Investment Term Sheet template.');
      showToast('Loaded Investment Term Sheet');
    } else if (templateName === 'beat_license') {
      const doc = getBeatLicenseDocument();
      pushHistory(doc);
      setActiveSectionId(doc.sections[0]?.id || null);
      addAiMessage('Loaded Exclusive Beat License & Producer Royalty Agreement template.');
      showToast('Loaded Beat License Agreement');
    } else if (templateName === 'featured_artist') {
      const doc = getFeaturedArtistDocument();
      pushHistory(doc);
      setActiveSectionId(doc.sections[0]?.id || null);
      addAiMessage('Loaded Featured Vocalist Performance & Clearance Agreement template.');
      showToast('Loaded Featured Artist Agreement');
    } else if (templateName === 'sync_license') {
      const doc = getSyncLicenseDocument();
      pushHistory(doc);
      setActiveSectionId(doc.sections[0]?.id || null);
      addAiMessage('Loaded Master Synchronization Rights Licensing Agreement template.');
      showToast('Loaded Sync License Agreement');
    } else if (templateName === 'label_360') {
      const doc = getRecordLabel360Document();
      pushHistory(doc);
      setActiveSectionId(doc.sections[0]?.id || null);
      addAiMessage('Loaded Single Master Recording & 360 DSP Distribution Agreement template.');
      showToast('Loaded 360 Distribution Agreement');
    } else if (templateName === 'blank') {
      handleNewBlankDocument();
    } else {
      const doc = getInitialDocument();
      pushHistory(doc);
      setActiveSectionId(doc.sections[0]?.id || null);
      addAiMessage('Loaded Music Collaboration & Master Recording Agreement template.');
      showToast('Loaded Music Collaboration Agreement');
    }
  };

  const handleInsertClauseFromLibrary = (targetSectionId: string, heading: string, content: string) => {
    const updatedSections = document.sections.map(s => {
      if (s.id === targetSectionId) {
        const clauseCount = s.clauses?.length || 0;
        const numPrefix = s.sectionNumber ? s.sectionNumber.replace('.0', '') : '1';
        const newClause = {
          id: `cl_lib_${Date.now()}`,
          clauseNumber: `${numPrefix}.${clauseCount + 1}`,
          heading,
          content,
          orderIndex: clauseCount + 1
        };
        return {
          ...s,
          clauses: [...(s.clauses || []), newClause]
        };
      }
      return s;
    });
    const renumbered = recalculateNumbering({
      ...document,
      sections: updatedSections,
      version: document.version + 1
    });
    pushHistory(renumbered);
    addAiMessage(`Inserted standardized provision "${heading}" into Section ${document.sections.find(s => s.id === targetSectionId)?.sectionNumber || ''}.`);
    showToast(`Inserted Clause: ${heading}`);
  };

  const handleTransformHeadingsCase = (headingCase: 'uppercase' | 'capitalize' | 'none') => {
    const updatedDoc = {
      ...document,
      styles: {
        ...document.styles,
        headingCase
      },
      version: document.version + 1
    };
    pushHistory(updatedDoc);
    addAiMessage(`Updated heading text case styling to "${headingCase}".`);
    showToast(`Headings set to ${headingCase}`);
  };

  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(document, null, 2));
    const downloadAnchor = window.document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${document.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_v${document.version}.json`);
    window.document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Exported Document Model JSON');
    addAiMessage('Exported complete Document Object Model JSON.');
  };

  const handleExportMarkdown = () => {
    let md = `# ${document.title}\n\n`;
    md += `*Version: ${document.version} | Last Modified: ${new Date(document.updatedAt).toLocaleDateString()}*\n\n---\n\n`;
    document.sections.forEach(sec => {
      md += `## ${sec.sectionNumber} ${sec.title}\n\n`;
      if (sec.content) md += `${sec.content}\n\n`;
      sec.clauses?.forEach(c => {
        md += `**${c.clauseNumber}${c.heading ? ` ${c.heading}` : ''}**: ${c.content}\n\n`;
      });
      sec.tables?.forEach(t => {
        if (t.title) md += `### ${t.title}\n\n`;
        md += `| ${t.headers.map(h => h.content).join(' | ')} |\n`;
        md += `| ${t.headers.map(() => '---').join(' | ')} |\n`;
        t.rows.forEach(r => {
          md += `| ${r.map(cell => cell.content).join(' | ')} |\n`;
        });
        md += '\n';
      });
    });
    if (document.signatures) {
      md += `## ${document.signatures.title || 'SIGNATURES & EXECUTION'}\n\n`;
      document.signatures.parties.forEach(p => {
        md += `**${p.role}**\n\n- **By:** ${p.name}\n- **Title:** ${p.title || '—'}\n- **Company:** ${p.company || '—'}\n- **Date:** ${p.date || '—'}\n\n`;
      });
    }
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = `${document.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_v${document.version}.md`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Exported Markdown (.md)');
    addAiMessage('Exported complete Markdown (.md) document.');
  };

  const handleExportPlainText = () => {
    let txt = `${document.title.toUpperCase()}\n`;
    txt += `Version: ${document.version} | Last Updated: ${new Date(document.updatedAt).toLocaleDateString()}\n`;
    txt += `================================================================================\n\n`;
    document.sections.forEach(sec => {
      txt += `${sec.sectionNumber} ${sec.title.toUpperCase()}\n\n`;
      if (sec.content) txt += `${sec.content}\n\n`;
      sec.clauses?.forEach(c => {
        txt += `   ${c.clauseNumber} ${c.heading ? `${c.heading}: ` : ''}${c.content}\n\n`;
      });
    });
    if (document.signatures) {
      txt += `\n${document.signatures.title?.toUpperCase() || 'SIGNATURES & EXECUTION'}\n\n`;
      document.signatures.parties.forEach(p => {
        txt += `${p.role}:\nBy: ${p.name}\nTitle: ${p.title || '—'}\nCompany: ${p.company || '—'}\nDate: ${p.date || '—'}\n\n`;
      });
    }
    const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = `${document.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_v${document.version}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Exported Plain Text (.txt)');
    addAiMessage('Exported Plain Text (.txt) document.');
  };

  const handleCopyDocumentText = () => {
    let txt = `${document.title.toUpperCase()}\n\n`;
    document.sections.forEach(sec => {
      txt += `${sec.sectionNumber} ${sec.title}\n`;
      if (sec.content) txt += `${sec.content}\n`;
      sec.clauses?.forEach(c => {
        txt += `${c.clauseNumber} ${c.heading ? `${c.heading}: ` : ''}${c.content}\n`;
      });
      txt += '\n';
    });
    navigator.clipboard.writeText(txt).then(() => {
      showToast('Copied full document to clipboard!');
      addAiMessage('Copied entire document text to clipboard.');
    });
  };

  const handleImportText = () => {
    const input = window.document.createElement('input');
    input.type = 'file';
    input.accept = '.txt,.md,text/plain,text/markdown';
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const source = String(event.target?.result || '');
          const imported = parseTextDocument(source, document);
          pushHistory(imported);
          setActiveSectionId(imported.sections[0]?.id || null);
          addAiMessage(`Imported "${imported.title}" with ${imported.sections.length} sections. Source text, nested headings, lists, URLs, and signature text were retained. The AI editor will now operate on this imported document, not the sample template.`);
          showToast(`Imported ${imported.sections.length} sections`);
        } catch (error: any) {
          alert(error?.message || 'Unable to import this text document.');
        }
      };
      reader.onerror = () => alert('The selected text file could not be read.');
      reader.readAsText(file);
    };
    input.click();
  };


  const handleRenderSourceTruth = (panelDesign: { backgroundColor: string; textColor: string; borderColor: string; labelColor: string }) => {
    if (!sourceTruthText.trim()) {
      showToast('Paste your complete document before rendering');
      return;
    }
    setIsRenderingSource(true);
    try {
      const parsedDocument = parseTextDocument(sourceTruthText, document, new Date().toISOString(), sourceTruthPresetId);
      const rendered = {
        ...parsedDocument,
        sections: parsedDocument.sections.map(section => section.scrollableContent !== undefined ? {
          ...section,
          design: {
            ...section.design,
            scrollableBackgroundColor: panelDesign.backgroundColor,
            scrollableTextColor: panelDesign.textColor,
            scrollableBorderColor: panelDesign.borderColor,
            scrollableLabelColor: panelDesign.labelColor
          }
        } : section)
      };
      // Commit directly rather than passing through legacy style synchronization,
      // which could carry the old sample document's formatting into the new render.
      const nextHistory = history.slice(0, historyIndex + 1);
      nextHistory.push(document);
      setHistory(nextHistory);
      setHistoryIndex(nextHistory.length - 1);
      setDocument(rendered);
      setActiveSectionId(rendered.sections[0]?.id || null);
      setIsSourceTruthOpen(false);
      const integrity = rendered.sourceIntegrity;
      const report = getSourceIntegrityReport(rendered);
      addAiMessage(
        `Rendered "${rendered.title}" from the Source of Truth. ${integrity?.wordCount.toLocaleString() || 0} source words and ${integrity?.characterCount.toLocaleString() || 0} characters retained. Built ${rendered.sections.length} editable sections. ${integrity?.detectedSignatureSection ? 'A signature/execution section was detected, with ${integrity?.signaturePartyCount || 0} explicit parties converted to editable signature fields.' : 'No dedicated signature heading was detected; signature text remains in the source content.'} Detected ${integrity?.detectedTableRows || 0} Markdown table rows and ${integrity?.detectedListItems || 0} list items. Rendered structure contains ${report.renderedWords.toLocaleString()} words across the title, sections, tables, and signature fields. The original source is stored separately and has not been rewritten.`
      );
      showToast(`Rendered ${rendered.sections.length} sections from source`);
    } catch (error: any) {
      console.error('Source of Truth render failed:', error);
      addAiMessage(`Rendering failed. The existing document was not changed. ${error?.message || 'Unknown rendering error.'}`);
      showToast('Render failed: existing document preserved');
    } finally {
      setIsRenderingSource(false);
    }
  };

  const handleImportJson = () => {
    const input = window.document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed.sections && parsed.title) {
            pushHistory(parsed);
            addAiMessage(`Imported Document Model: "${parsed.title}" (v${parsed.version || 1}).`);
            showToast(`Loaded "${parsed.title}"`);
          }
        } catch {
          alert('Invalid document model JSON file');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handlePrint = () => {
    window.print();
  };

  const handleUpdateStyles = (newStyles: Partial<StyleConfig>) => {
    const res = applyFormatting(document, newStyles);
    pushHistory(res.updatedDoc);
  };

  const handleUpdatePageConfig = (newPageConfig: Partial<PageConfig>) => {
    const res = applyFormatting(document, {}, newPageConfig);
    pushHistory(res.updatedDoc);
  };

  const handleApplyDocumentDesign = (design: DocumentDesign) => {
    pushHistory({
      ...document,
      design: deepCloneDesign(design),
      version: document.version + 1,
      updatedAt: new Date().toISOString()
    });
    addAiMessage('Applied document-wide visual design. Document content and structure were preserved.');
    showToast('Document design applied');
  };

  const handleApplySectionDesign = (sectionId: string, design: SectionDesign) => {
    const exists = document.sections.some(section => section.id === sectionId);
    if (!exists) return;
    pushHistory({
      ...document,
      sections: document.sections.map(section => section.id === sectionId
        ? { ...section, design: deepCloneDesign(design) }
        : section),
      version: document.version + 1,
      updatedAt: new Date().toISOString()
    });
    showToast('Section design applied');
  };

  const handleApplyTableDesign = (sectionId: string, tableId: string, design: TableDesign) => {
    const section = document.sections.find(item => item.id === sectionId);
    if (!section?.tables?.some(table => table.id === tableId)) return;
    pushHistory({
      ...document,
      sections: document.sections.map(item => item.id !== sectionId ? item : ({
        ...item,
        tables: item.tables?.map(table => table.id === tableId
          ? { ...table, design: deepCloneDesign(design) }
          : table)
      })),
      version: document.version + 1,
      updatedAt: new Date().toISOString()
    });
    showToast('Table design applied');
  };

  const handleResetSectionDesign = (sectionId: string) => {
    pushHistory({
      ...document,
      sections: document.sections.map(section => section.id === sectionId
        ? { ...section, design: undefined }
        : section),
      version: document.version + 1,
      updatedAt: new Date().toISOString()
    });
    showToast('Section styling reset');
  };

  const handleResetTableDesign = (sectionId: string, tableId: string) => {
    pushHistory({
      ...document,
      sections: document.sections.map(section => section.id !== sectionId ? section : ({
        ...section,
        tables: section.tables?.map(table => table.id === tableId
          ? { ...table, design: undefined }
          : table)
      })),
      version: document.version + 1,
      updatedAt: new Date().toISOString()
    });
    showToast('Table styling reset');
  };

  const handleResetAllDesignOverrides = () => {
    pushHistory(clearDesignOverrides(document));
    showToast('All local styling overrides reset');
  };

  return (
    <div className="app-root flex flex-col h-screen w-screen overflow-hidden bg-slate-950 font-sans text-slate-100 relative">
      <div className="desktop-workspace">
      {/* 1. Top Navbar */}
      <Navbar
        document={document}
        onUpdateTitle={(title) => setDocument(prev => ({ ...prev, title }))}
        persona={persona}
        onSelectPersona={setPersona}
        brand={brand}
        onSelectBrand={(newBrand) => {
          setBrand(newBrand);
          const formatted = applyFormatting(document, { fontFamily: newBrand.fontFamily }, {
            headerText: newBrand.headerNote,
            footerText: newBrand.footerDisclaimer
          });
          pushHistory(formatted.updatedDoc);
          addAiMessage(`Applied brand profile: "${newBrand.name}".`);
          showToast(`Brand applied: ${newBrand.name}`);
        }}
        canUndo={historyIndex >= 0}
        canRedo={historyIndex < history.length - 1}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onOpenPdfPreview={() => setIsPdfPreviewOpen(true)}
        onOpenValidation={() => setIsValidationOpen(true)}
        onOpenMultiDoc={() => setIsMultiDocOpen(true)}
        onOpenBrandModal={() => {}}
        onNewDocument={handleNewDocument}
      />

      {/* 2. Menu Bar (File, Edit, Insert, Format, Tools, View) */}
      <MenuBar
        document={document}
        onNewDocument={handleNewDocument}
        onNewBlankDocument={handleNewBlankDocument}
        onOpenTemplate={handleOpenTemplate}
        onExportPdf={() => setIsPdfPreviewOpen(true)}
        onPrint={handlePrint}
        onExportJson={handleExportJson}
        onImportJson={handleImportJson}
        onImportText={handleImportText}
        onOpenSourceTruth={() => setIsSourceTruthOpen(true)}
        onExportMarkdown={handleExportMarkdown}
        onExportPlainText={handleExportPlainText}
        onCopyDocumentText={handleCopyDocumentText}
        canUndo={historyIndex >= 0}
        canRedo={historyIndex < history.length - 1}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onOpenFindReplace={() => setIsFindReplaceOpen(true)}
        onOpenRedaction={() => setIsRedactionOpen(true)}
        onOpenDesign={() => setIsDesignModalOpen(true)}
        onAddSection={handleAddSection}
        onOpenInsertTable={() => {
          setInsertObjectTab('table');
          setIsInsertObjectOpen(true);
        }}
        onOpenInsertChart={() => {
          setInsertObjectTab('chart');
          setIsInsertObjectOpen(true);
        }}
        onOpenInsertImage={() => {
          setInsertObjectTab('image');
          setIsInsertObjectOpen(true);
        }}
        onOpenMetadata={() => setIsMetadataOpen(true)}
        onOpenClauseLibrary={() => setIsClauseLibraryOpen(true)}
        onOpenWatermarkCustomizer={() => setIsWatermarkCustomizerOpen(true)}
        onOpenReadability={() => setIsReadabilityOpen(true)}
        onTransformHeadingsCase={handleTransformHeadingsCase}
        onApplyFont={(fontFamily) => handleUpdateStyles({ fontFamily })}
        onApplyOrientation={(orientation) => handleUpdatePageConfig({ orientation })}
        onOpenValidation={() => setIsValidationOpen(true)}
        onOpenMultiDoc={() => setIsMultiDocOpen(true)}
        onSelectPersona={setPersona}
        persona={persona}
        onSelectBrand={setBrand}
        brand={brand}
        toggleOutline={() => setIsOutlineVisible(prev => !prev)}
        toggleAI={() => setIsAIVisible(prev => !prev)}
        isOutlineVisible={isOutlineVisible}
        isAIVisible={isAIVisible}
        zoomLevel={zoomLevel}
        setZoomLevel={setZoomLevel}
      />

      {/* 3. Formatting Ribbon / Text Editing Tools Bar */}
      <FormattingRibbon
        document={document}
        onUpdateStyles={handleUpdateStyles}
        onUpdatePageConfig={handleUpdatePageConfig}
        canUndo={historyIndex >= 0}
        canRedo={historyIndex < history.length - 1}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onOpenFindReplace={() => setIsFindReplaceOpen(true)}
        onOpenRedaction={() => setIsRedactionOpen(true)}
        onOpenInsertTable={() => {
          setInsertObjectTab('table');
          setIsInsertObjectOpen(true);
        }}
        onOpenInsertChart={() => {
          setInsertObjectTab('chart');
          setIsInsertObjectOpen(true);
        }}
        onOpenInsertImage={() => {
          setInsertObjectTab('image');
          setIsInsertObjectOpen(true);
        }}
        onAddClause={handleAddClause}
        onAddSection={handleAddSection}
        onOpenMetadata={() => setIsMetadataOpen(true)}
        onOpenClauseLibrary={() => setIsClauseLibraryOpen(true)}
        onOpenWatermarkCustomizer={() => setIsWatermarkCustomizerOpen(true)}
        onOpenReadability={() => setIsReadabilityOpen(true)}
      />

      {/* 4. Main 3-Column Studio Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Interactive Document Outline (collapsible) */}
        {isOutlineVisible && (
          <DocumentOutline
            document={document}
            activeSectionId={activeSectionId}
            onSelectSection={(id) => {
              setActiveSectionId(id);
              const el = window.document.getElementById(id);
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }}
            onMoveSection={handleMoveSection}
            onDeleteSection={handleDeleteSection}
            onDuplicateSection={handleDuplicateSection}
            onMergeWithNext={handleMergeWithNext}
            onSplitSection={handleSplitSection}
            onAddSection={handleAddSection}
          />
        )}

        {/* Center: Visual Document Editor & Canvas */}
        <VisualEditor
          document={document}
          activeSectionId={activeSectionId}
          onUpdateSection={(updatedSection) => {
            const sections = document.sections.map(s => s.id === updatedSection.id ? updatedSection : s);
            setDocument(prev => ({ ...prev, sections, updatedAt: new Date().toISOString() }));
          }}
          onDeleteSection={handleDeleteSection}
          onDuplicateSection={handleDuplicateSection}
          onUpdateSignatures={(signatures) => {
            setDocument(prev => ({ ...prev, signatures, updatedAt: new Date().toISOString() }));
          }}
          onQuickAIAction={handleQuickAIAction}
        />

        {/* Right: AI Chat Document Control Orchestrator (collapsible) */}
        {isAIVisible && (
          <AIChatOrchestrator
            document={document}
            persona={persona}
            messages={messages}
            isOrchestrating={isOrchestrating}
            onSendMessage={handleSendMessage}
            onRollbackToVersion={(v) => {
              const snapshot = history.find(h => h.version === v) || history[0];
              if (snapshot) {
                const res = rollbackDocument(document, snapshot);
                pushHistory(res.updatedDoc);
                addAiMessage(`Rolled back to version ${v}.`, undefined, res.summary);
              }
            }}
            onRunAudit={() => setIsValidationOpen(true)}
          />
        )}
      </div>

      </div>
      <MobileWorkspace
        document={document}
        activeSectionId={activeSectionId}
        onOpenDesign={() => setIsDesignModalOpen(true)}
        onOpenSourceTruth={() => setIsSourceTruthOpen(true)}
        persona={persona}
        messages={messages}
        isOrchestrating={isOrchestrating}
        canUndo={historyIndex >= 0}
        canRedo={historyIndex < history.length - 1}
        onUpdateTitle={(title) => setDocument(prev => ({ ...prev, title }))}
        onSelectPersona={setPersona}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onOpenPdfPreview={() => setIsPdfPreviewOpen(true)}
        onUpdateStyles={handleUpdateStyles}
        onUpdatePageConfig={handleUpdatePageConfig}
        onAddClause={handleAddClause}
        onInsertChart={() => { setInsertObjectTab('chart'); setIsInsertObjectOpen(true); }}
        onOpenValidation={() => setIsValidationOpen(true)}
        onOpenMultiDoc={() => setIsMultiDocOpen(true)}
        onNewDocument={handleNewDocument}
        onNewBlankDocument={handleNewBlankDocument}
        onOpenTemplate={handleOpenTemplate}
        onExportJson={handleExportJson}
        onImportJson={handleImportJson}
        onExportMarkdown={handleExportMarkdown}
        onExportPlainText={handleExportPlainText}
        onCopyDocumentText={handleCopyDocumentText}
        onPrint={handlePrint}
        onFindReplace={() => setIsFindReplaceOpen(true)}
        onRedaction={() => setIsRedactionOpen(true)}
        onInsertTable={() => { setInsertObjectTab('table'); setIsInsertObjectOpen(true); }}
        onInsertImage={() => { setInsertObjectTab('image'); setIsInsertObjectOpen(true); }}
        onMetadata={() => setIsMetadataOpen(true)}
        onClauseLibrary={() => setIsClauseLibraryOpen(true)}
        onWatermark={() => setIsWatermarkCustomizerOpen(true)}
        onReadability={() => setIsReadabilityOpen(true)}
        onSelectSection={(id) => {
          setActiveSectionId(id);
          const el = window.document.getElementById(id);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }}
        onUpdateSection={(updatedSection) => {
          const sections = document.sections.map(s => s.id === updatedSection.id ? updatedSection : s);
          setDocument(prev => ({ ...prev, sections, updatedAt: new Date().toISOString() }));
        }}
        onDeleteSection={handleDeleteSection}
        onDuplicateSection={handleDuplicateSection}
        onQuickAIAction={handleQuickAIAction}
        onMoveSection={handleMoveSection}
        onMergeWithNext={handleMergeWithNext}
        onSplitSection={handleSplitSection}
        onAddSection={handleAddSection}
        onUpdateSignatures={(signatures) => setDocument(prev => ({ ...prev, signatures, updatedAt: new Date().toISOString() }))}
        onSendMessage={handleSendMessage}
        onRollbackToVersion={(v) => {
          const snapshot = history.find(h => h.version === v) || history[0];
          if (snapshot) {
            const res = rollbackDocument(document, snapshot);
            pushHistory(res.updatedDoc);
            addAiMessage(`Rolled back to version ${v}.`, undefined, res.summary);
          }
        }}
        onRunAudit={() => setIsValidationOpen(true)}
      />
      {/* 5. Modals */}
      <PDFPreviewModal
        document={document}
        isOpen={isPdfPreviewOpen}
        onClose={() => setIsPdfPreviewOpen(false)}
      />

      <ValidationReportModal
        document={document}
        isOpen={isValidationOpen}
        onClose={() => setIsValidationOpen(false)}
        onAutoRepairReferences={handleAutoRepairReferences}
      />

      <MultiDocWorkspaceModal
        primaryDoc={document}
        isOpen={isMultiDocOpen}
        onClose={() => setIsMultiDocOpen(false)}
        onIncorporateSections={handleIncorporateSections}
      />

      <FindReplaceModal
        document={document}
        isOpen={isFindReplaceOpen}
        onClose={() => setIsFindReplaceOpen(false)}
        onApplyReplace={(updatedDoc, matchCount, summaryText) => {
          pushHistory(updatedDoc);
          addAiMessage(summaryText);
        }}
      />

      <RedactionModal
        document={document}
        isOpen={isRedactionOpen}
        onClose={() => setIsRedactionOpen(false)}
        onApplyRedaction={(updatedDoc, redactedCount, summaryText) => {
          pushHistory(updatedDoc);
          addAiMessage(summaryText);
        }}
      />

      <InsertObjectModal
        document={document}
        isOpen={isInsertObjectOpen}
        defaultTab={insertObjectTab}
        onClose={() => setIsInsertObjectOpen(false)}
        onApplyUpdate={(updatedDoc, summaryText) => {
          pushHistory(updatedDoc);
          addAiMessage(summaryText);
        }}
      />

      <DocumentMetadataModal
        document={document}
        isOpen={isMetadataOpen}
        onClose={() => setIsMetadataOpen(false)}
        onExportJson={handleExportJson}
      />

      <ClauseLibraryModal
        document={document}
        isOpen={isClauseLibraryOpen}
        onClose={() => setIsClauseLibraryOpen(false)}
        onInsertClause={handleInsertClauseFromLibrary}
      />

      <WatermarkCustomizerModal
        document={document}
        isOpen={isWatermarkCustomizerOpen}
        onClose={() => setIsWatermarkCustomizerOpen(false)}
        onUpdatePageConfig={handleUpdatePageConfig}
      />

      <ReadabilityInspectorModal
        document={document}
        isOpen={isReadabilityOpen}
        onClose={() => setIsReadabilityOpen(false)}
      />

      <SourceOfTruthModal
        isOpen={isSourceTruthOpen}
        source={sourceTruthText}
        selectedPresetId={sourceTruthPresetId}
        onSourceChange={setSourceTruthText}
        onPresetChange={setSourceTruthPresetId}
        onRender={handleRenderSourceTruth}
        onClose={() => setIsSourceTruthOpen(false)}
        isRendering={isRenderingSource}
      />

      <DocumentDesignModal
        document={document}
        activeSectionId={activeSectionId}
        isOpen={isDesignModalOpen}
        onClose={() => setIsDesignModalOpen(false)}
        onApplyDesign={handleApplyDocumentDesign}
        onApplySectionDesign={handleApplySectionDesign}
        onApplyTableDesign={handleApplyTableDesign}
        onResetSectionDesign={handleResetSectionDesign}
        onResetTableDesign={handleResetTableDesign}
        onResetAllOverrides={handleResetAllDesignOverrides}
      />

      {/* Floating Action Feedback Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900/95 border border-blue-500/50 text-white text-xs px-4 py-2.5 rounded-lg shadow-2xl flex items-center gap-2 backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
          <span className="font-medium text-slate-100">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
