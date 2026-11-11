import React, { useEffect, useState } from 'react';
import {
  FileText, MessageSquare, ListTree, Wrench, Plus, Undo2, Redo2,
  FileDown, ShieldCheck, X, Search, Table2, Image, FileJson,
  FilePlus2, Scissors, BookOpen, Stamp, ClipboardCheck, Layers,
  Printer, ChevronDown, Sparkles, Palette, PenTool
} from 'lucide-react';
import { DocumentModel, AIPersona, Section } from '../types/document';
import { VisualEditor } from './VisualEditor';
import { FormattingRibbon } from './FormattingRibbon';
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
  onUpdateDocument: (updatedDocument: DocumentModel) => void;
  onSelectPersona: (persona: AIPersona) => void;
  onUndo: () => void;
  onRedo: () => void;
  onOpenPdfPreview: () => void;
  onOpenDesign: () => void;
  onOpenHelp: () => void;
  onOpenSourceTruth: () => void;
  onUpdateStyles: (styles: Partial<DocumentModel['styles']>) => void;
  onUpdatePageConfig: (config: Partial<DocumentModel['pageConfig']>) => void;
  onAddClause: () => void;
  onInsertChart: () => void;
  onOpenValidation: () => void;
  onOpenMultiDoc: () => void;
  onNewDocument: () => void;
  onNewBlankDocument: () => void;
  onOpenTemplate: (name: string) => void;
  onOpenTemplateGallery: () => void;
  onExportJson: () => void;
  onImportJson: () => void;
  onImportText: () => void;
  onExportMarkdown: () => void;
  onExportPlainText: () => void;
  onCopyDocumentText: () => void;
  onPrint: () => void;
  onFindReplace: () => void;
  onRedaction: () => void;
  onInsertTable: () => void;
  onInsertImage: () => void;
  onInsertSignature: () => void;
  onAddAppendix: () => void;
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

export interface MobileToolAction {
  label: string;
  icon: React.ReactNode;
  action: () => void;
}

export function getMobileToolActions(props: MobileWorkspaceProps): MobileToolAction[] {
  return [
    { label: 'Help center', icon: <BookOpen size={20}/>, action: props.onOpenHelp },
    { label: 'Source of Truth / Render', icon: <FileText size={20}/>, action: props.onOpenSourceTruth },
    { label: 'Document design', icon: <Palette size={20}/>, action: props.onOpenDesign },
    { label: 'Template gallery', icon: <FileText size={20}/>, action: props.onOpenTemplateGallery },
    { label: 'New document', icon: <FilePlus2 size={20}/>, action: props.onNewDocument },
    { label: 'Blank document', icon: <FileText size={20}/>, action: props.onNewBlankDocument },
    { label: 'Find & replace', icon: <Search size={20}/>, action: props.onFindReplace },
    { label: 'Redact text', icon: <Scissors size={20}/>, action: props.onRedaction },
    { label: 'Insert table', icon: <Table2 size={20}/>, action: props.onInsertTable },
    { label: 'Insert image', icon: <Image size={20}/>, action: props.onInsertImage },
    { label: 'Insert chart', icon: <Layers size={20}/>, action: props.onInsertChart },
    { label: 'Insert signature', icon: <PenTool size={20}/>, action: props.onInsertSignature },
    { label: 'Add appendix / exhibit', icon: <FilePlus2 size={20}/>, action: props.onAddAppendix },
    { label: 'Clause library', icon: <BookOpen size={20}/>, action: props.onClauseLibrary },
    { label: 'Watermark', icon: <Stamp size={20}/>, action: props.onWatermark },
    { label: 'Readability', icon: <ClipboardCheck size={20}/>, action: props.onReadability },
    { label: 'Document metadata', icon: <FileJson size={20}/>, action: props.onMetadata },
    { label: 'Multi-document', icon: <Layers size={20}/>, action: props.onOpenMultiDoc },
    { label: 'Print', icon: <Printer size={20}/>, action: props.onPrint },
    { label: 'Export JSON', icon: <FileJson size={20}/>, action: props.onExportJson },
    { label: 'Import JSON', icon: <FileDown size={20}/>, action: props.onImportJson },
    { label: 'Import text / Markdown', icon: <FileText size={20}/>, action: props.onImportText },
    { label: 'Export Markdown', icon: <FileText size={20}/>, action: props.onExportMarkdown },
    { label: 'Export text', icon: <FileText size={20}/>, action: props.onExportPlainText },
    { label: 'Copy document', icon: <FileText size={20}/>, action: props.onCopyDocumentText }
  ];
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
            <div className="mobile-ribbon">
              <FormattingRibbon document={props.document}
                onUpdateStyles={props.onUpdateStyles} onUpdatePageConfig={props.onUpdatePageConfig}
                canUndo={props.canUndo} canRedo={props.canRedo} onUndo={props.onUndo} onRedo={props.onRedo}
                onOpenFindReplace={props.onFindReplace} onOpenRedaction={props.onRedaction}
                onOpenInsertTable={props.onInsertTable} onOpenInsertChart={props.onInsertChart}
                onOpenInsertImage={props.onInsertImage} onAddClause={props.onAddClause}
                onAddSection={props.onAddSection} onOpenMetadata={props.onMetadata}
                onOpenClauseLibrary={props.onClauseLibrary} onOpenWatermarkCustomizer={props.onWatermark}
                onOpenReadability={props.onReadability}/>
            </div>
            <VisualEditor document={props.document} activeSectionId={props.activeSectionId}
              onUpdateSection={props.onUpdateSection} onDeleteSection={props.onDeleteSection}
              onDuplicateSection={props.onDuplicateSection} onUpdateSignatures={props.onUpdateSignatures}
              onUpdateDocument={props.onUpdateDocument} onQuickAIAction={props.onQuickAIAction}/>
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
              {getMobileToolActions(props).map(({ label, icon, action }) => tool(label, icon, action))}
            </div>
            <div className="mobile-template-row">
              <label htmlFor="mobile-template">Legacy starter templates</label>
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
