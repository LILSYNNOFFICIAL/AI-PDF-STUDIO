import React, { useEffect, useState } from 'react';
import {
  FileText, MessageSquare, ListTree, Wrench, Plus, Undo2, Redo2,
  FileDown, ShieldCheck, X, Search, Table2, Image, FileJson,
  FilePlus2, Scissors, BookOpen, Stamp, ClipboardCheck, Layers,
  Printer, ChevronDown, Sparkles
} from 'lucide-react';
import { DocumentModel, AIPersona, Section } from '../types/document';
import { VisualEditor } from './VisualEditor';
import { DocumentOutline } from './DocumentOutline';
import { AIChatOrchestrator, ChatMessage } from './AIChatOrchestrator';
import { PERSONA_LABELS } from './Navbar';

type MobileTab = 'editor' | 'ai' | 'outline' | 'tools';

interface MobileWorkspaceProps {
  document: DocumentModel;
  activeSectionId: string | null;
  persona: AIPersona;
  messages: ChatMessage[];
  isOrchestrating: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onUpdateTitle: (title: string) => void;
  onSelectPersona: (persona: AIPersona) => void;
  onUndo: () => void;
  onRedo: () => void;
  onOpenPdfPreview: () => void;
  onOpenValidation: () => void;
  onOpenMultiDoc: () => void;
  onNewDocument: () => void;
  onNewBlankDocument: () => void;
  onOpenTemplate: (name: string) => void;
  onExportJson: () => void;
  onImportJson: () => void;
  onExportMarkdown: () => void;
  onExportPlainText: () => void;
  onCopyDocumentText: () => void;
  onPrint: () => void;
  onFindReplace: () => void;
  onRedaction: () => void;
  onInsertTable: () => void;
  onInsertImage: () => void;
  onMetadata: () => void;
  onClauseLibrary: () => void;
  onWatermark: () => void;
  onReadability: () => void;
  onSelectSection: (id: string) => void;
  onUpdateSection: (section: Section) => void;
  onDeleteSection: (id: string) => void;
  onDuplicateSection: (id: string) => void;
  onQuickAIAction: (action: string, context: { sectionId?: string; text?: string }) => void;
  onMoveSection: (id: string, direction: 'up' | 'down') => void;
  onMergeWithNext: (id: string) => void;
  onSplitSection: (id: string) => void;
  onAddSection: () => void;
  onUpdateSignatures: (signatures: any) => void;
  onSendMessage: (instruction: string) => void;
  onRollbackToVersion: (version: number) => void;
  onRunAudit: () => void;
}

export const MobileWorkspace: React.FC<MobileWorkspaceProps> = (props) => {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches
  );
  const [activeTab, setActiveTab] = useState<MobileTab>('editor');

  useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)');
    const updateViewport = () => setIsMobile(media.matches);
    updateViewport();
    media.addEventListener('change', updateViewport);
    return () => media.removeEventListener('change', updateViewport);
  }, []);

  const selectTab = (tab: MobileTab) => setActiveTab(tab);

  if (!isMobile) return null;

  const tool = (label: string, icon: React.ReactNode, action: () => void) => (
    <button key={label} onClick={() => { action(); setActiveTab('editor'); }}
      className="mobile-tool-button">
      <span className="mobile-tool-icon">{icon}</span>
      <span>{label}</span>
    </button>
  );

  return (
    <section className="mobile-workspace" aria-label="AI PDF Studio mobile edition">
      <header className="mobile-topbar">
        <div className="mobile-brand">
          <div className="mobile-brand-icon"><FileText size={18} /></div>
          <div className="min-w-0">
            <div className="mobile-brand-name">AI PDF STUDIO <span>v{props.document.version}</span></div>
            <input aria-label="Document title" value={props.document.title}
              onChange={e => props.onUpdateTitle(e.target.value)} />
          </div>
        </div>
        <div className="mobile-top-actions">
          <button aria-label="Undo" disabled={!props.canUndo} onClick={props.onUndo}><Undo2 size={18}/></button>
          <button aria-label="Redo" disabled={!props.canRedo} onClick={props.onRedo}><Redo2 size={18}/></button>
          <button className="mobile-export" onClick={props.onOpenPdfPreview}><FileDown size={17}/><span>PDF</span></button>
        </div>
      </header>

      <div className="mobile-contextbar">
        <div className="mobile-doc-meta">
          <span className="mobile-status-dot" />
          <span>{props.document.sections.length} sections</span>
          <span>•</span>
          <span>{props.document.type.replace('_', ' ')}</span>
        </div>
        <label className="mobile-persona">
          <Sparkles size={13}/>
          <select value={props.persona} onChange={e => props.onSelectPersona(e.target.value as AIPersona)}
            aria-label="AI specialist">
            {Object.entries(PERSONA_LABELS).map(([key, value]) =>
              <option key={key} value={key}>{value.title}</option>)}
          </select>
          <ChevronDown size={13}/>
        </label>
      </div>

      <main className="mobile-content">
        {activeTab === 'editor' && (
          <div className="mobile-editor-panel">
            <div className="mobile-editor-actions">
              <button onClick={props.onAddSection}><Plus size={15}/> Section</button>
              <button onClick={props.onOpenPdfPreview}><FileDown size={15}/> Preview</button>
              <button onClick={props.onOpenValidation}><ShieldCheck size={15}/> Audit</button>
              <button onClick={() => selectTab('outline')}><ListTree size={15}/> Outline</button>
            </div>
            <VisualEditor document={props.document} activeSectionId={props.activeSectionId}
              onUpdateSection={props.onUpdateSection} onDeleteSection={props.onDeleteSection}
              onDuplicateSection={props.onDuplicateSection} onUpdateSignatures={props.onUpdateSignatures}
              onQuickAIAction={props.onQuickAIAction}/>
          </div>
        )}
        {activeTab === 'ai' && (
          <div className="mobile-ai-panel">
            <AIChatOrchestrator document={props.document} persona={props.persona}
              messages={props.messages} isOrchestrating={props.isOrchestrating}
              onSendMessage={props.onSendMessage} onRollbackToVersion={props.onRollbackToVersion}
              onRunAudit={props.onRunAudit}/>
          </div>
        )}
        {activeTab === 'outline' && (
          <div className="mobile-outline-panel">
            <DocumentOutline document={props.document} activeSectionId={props.activeSectionId}
              onSelectSection={id => { props.onSelectSection(id); setActiveTab('editor'); }}
              onMoveSection={props.onMoveSection} onDeleteSection={props.onDeleteSection}
              onDuplicateSection={props.onDuplicateSection} onMergeWithNext={props.onMergeWithNext}
              onSplitSection={props.onSplitSection} onAddSection={props.onAddSection}/>
          </div>
        )}
        {activeTab === 'tools' && (
          <div className="mobile-tools-panel">
            <div className="mobile-tools-heading">
              <div><span>WORKSPACE TOOLS</span><h2>Everything in reach.</h2></div>
              <button aria-label="Close tools" onClick={() => selectTab('editor')}><X size={19}/></button>
            </div>
            <div className="mobile-tools-grid">
              {tool('New document', <FilePlus2 size={20}/>, props.onNewDocument)}
              {tool('Blank document', <FileText size={20}/>, props.onNewBlankDocument)}
              {tool('Find & replace', <Search size={20}/>, props.onFindReplace)}
              {tool('Redact text', <Scissors size={20}/>, props.onRedaction)}
              {tool('Insert table', <Table2 size={20}/>, props.onInsertTable)}
              {tool('Insert image', <Image size={20}/>, props.onInsertImage)}
              {tool('Clause library', <BookOpen size={20}/>, props.onClauseLibrary)}
              {tool('Watermark', <Stamp size={20}/>, props.onWatermark)}
              {tool('Readability', <ClipboardCheck size={20}/>, props.onReadability)}
              {tool('Document metadata', <FileJson size={20}/>, props.onMetadata)}
              {tool('Multi-document', <Layers size={20}/>, props.onOpenMultiDoc)}
              {tool('Print', <Printer size={20}/>, props.onPrint)}
              {tool('Export JSON', <FileJson size={20}/>, props.onExportJson)}
              {tool('Import JSON', <FileDown size={20}/>, props.onImportJson)}
              {tool('Export Markdown', <FileText size={20}/>, props.onExportMarkdown)}
              {tool('Export text', <FileText size={20}/>, props.onExportPlainText)}
              {tool('Copy document', <FileText size={20}/>, props.onCopyDocumentText)}
            </div>
            <div className="mobile-template-row">
              <label htmlFor="mobile-template">Start from a template</label>
              <select id="mobile-template" defaultValue="" onChange={e => {
                if (e.target.value) props.onOpenTemplate(e.target.value);
                e.target.value = '';
              }}>
                <option value="" disabled>Choose a document template…</option>
                <option value="music_collab">Music Collaboration Agreement</option>
                <option value="beat_license">Beat License Agreement</option>
                <option value="featured_artist">Featured Artist Agreement</option>
                <option value="sync_license">Sync License Agreement</option>
                <option value="label_360">360 Distribution Agreement</option>
                <option value="saas">SaaS Master Services Agreement</option>
                <option value="term_sheet">Investment Term Sheet</option>
                <option value="blank">Blank document</option>
              </select>
            </div>
          </div>
        )}
      </main>

      <nav className="mobile-bottom-nav" aria-label="Mobile workspace navigation">
        <button className={activeTab === 'editor' ? 'active' : ''} onClick={() => selectTab('editor')}>
          <FileText size={19}/><span>Editor</span>
        </button>
        <button className={activeTab === 'outline' ? 'active' : ''} onClick={() => selectTab('outline')}>
          <ListTree size={19}/><span>Outline</span>
        </button>
        <button className={activeTab === 'ai' ? 'active' : ''} onClick={() => selectTab('ai')}>
          <MessageSquare size={19}/><span>AI Chat</span>
        </button>
        <button className={activeTab === 'tools' ? 'active' : ''} onClick={() => selectTab('tools')}>
          <Wrench size={19}/><span>Tools</span>
        </button>
      </nav>
    </section>
  );
};
