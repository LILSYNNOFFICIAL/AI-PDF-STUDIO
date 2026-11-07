import React, { useState, useRef, useEffect } from 'react';
import { 
  FileText, 
  FolderOpen, 
  Save, 
  Download, 
  Printer, 
  RotateCcw, 
  RotateCw, 
  Search, 
  ShieldAlert, 
  Table as TableIcon, 
  PieChart, 
  Image as ImageIcon, 
  PenTool, 
  Plus, 
  FilePlus, 
  Scissors, 
  Layers, 
  ShieldCheck, 
  Wrench, 
  Sparkles, 
  Eye, 
  ZoomIn, 
  ZoomOut, 
  Maximize2,
  ChevronDown,
  Check,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Sliders,
  Palette,
  FileCheck,
  Copy,
  FileCode,
  BookOpen,
  Droplets,
  BarChart3,
  CaseUpper
} from 'lucide-react';
import { DocumentModel, AIPersona, BrandProfile } from '../types/document';
import { SAMPLE_BRAND_PROFILES } from '../services/sampleDocuments';
import { PERSONA_LABELS } from './Navbar';

interface MenuBarProps {
  document: DocumentModel;
  onNewDocument: () => void;
  onNewBlankDocument: () => void;
  onOpenTemplate: (templateName: string) => void;
  onExportPdf: () => void;
  onPrint: () => void;
  onExportJson: () => void;
  onImportJson: () => void;
  onImportText: () => void;
  onOpenSourceTruth: () => void;
  onExportMarkdown: () => void;
  onExportPlainText: () => void;
  onCopyDocumentText: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onOpenFindReplace: () => void;
  onOpenRedaction: () => void;
  onOpenDesign: () => void;
  onAddSection: () => void;
  onOpenInsertTable: () => void;
  onOpenInsertChart: () => void;
  onOpenInsertImage: () => void;
  onOpenMetadata: () => void;
  onOpenClauseLibrary: () => void;
  onOpenWatermarkCustomizer: () => void;
  onOpenReadability: () => void;
  onTransformHeadingsCase: (headingCase: 'uppercase' | 'capitalize' | 'none') => void;
  onApplyFont: (fontFamily: any) => void;
  onApplyOrientation: (orientation: 'portrait' | 'landscape') => void;
  onOpenValidation: () => void;
  onOpenMultiDoc: () => void;
  onSelectPersona: (p: AIPersona) => void;
  persona: AIPersona;
  onSelectBrand: (b: BrandProfile) => void;
  brand: BrandProfile;
  toggleOutline: () => void;
  toggleAI: () => void;
  isOutlineVisible: boolean;
  isAIVisible: boolean;
  zoomLevel: number;
  setZoomLevel: (z: number | ((prev: number) => number)) => void;
}

export const MenuBar: React.FC<MenuBarProps> = ({
  document,
  onNewDocument,
  onNewBlankDocument,
  onOpenTemplate,
  onExportPdf,
  onPrint,
  onExportJson,
  onImportJson,
  onImportText,
  onOpenSourceTruth,
  onExportMarkdown,
  onExportPlainText,
  onCopyDocumentText,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onOpenFindReplace,
  onOpenRedaction,
  onOpenDesign,
  onAddSection,
  onOpenInsertTable,
  onOpenInsertChart,
  onOpenInsertImage,
  onOpenMetadata,
  onOpenClauseLibrary,
  onOpenWatermarkCustomizer,
  onOpenReadability,
  onTransformHeadingsCase,
  onApplyFont,
  onApplyOrientation,
  onOpenValidation,
  onOpenMultiDoc,
  onSelectPersona,
  persona,
  onSelectBrand,
  brand,
  toggleOutline,
  toggleAI,
  isOutlineVisible,
  isAIVisible,
  zoomLevel,
  setZoomLevel
}) => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const menuBarRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuBarRef.current && !menuBarRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
      }
    };
    window.addEventListener('mousedown', handleOutsideClick);
    return () => window.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleMenuClick = (menu: string) => {
    setActiveMenu(prev => prev === menu ? null : menu);
  };

  const handleMenuHover = (menu: string) => {
    if (activeMenu !== null) {
      setActiveMenu(menu);
    }
  };

  const executeAction = (action: () => void) => {
    action();
    setActiveMenu(null);
  };

  return (
    <div 
      ref={menuBarRef} 
      className="h-8 bg-slate-950 border-b border-slate-800 text-slate-300 text-xs flex items-center px-2 select-none z-40 shrink-0 font-sans"
    >
      <div className="flex items-center space-x-1">
        {/* FILE MENU */}
        <div className="relative">
          <button
            onClick={() => handleMenuClick('file')}
            onMouseEnter={() => handleMenuHover('file')}
            className={`px-2.5 py-1 rounded hover:bg-slate-800 hover:text-white transition-colors ${
              activeMenu === 'file' ? 'bg-slate-800 text-white' : ''
            }`}
          >
            File
          </button>
          {activeMenu === 'file' && (
            <div className="absolute left-0 top-full mt-1 w-56 max-h-[75vh] overflow-y-auto bg-slate-900 border border-slate-700/80 rounded-md shadow-2xl py-1 z-50 text-slate-200">
              <button 
                onClick={() => executeAction(onNewBlankDocument)}
                className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center justify-between"
              >
                <span className="flex items-center gap-2"><FileText className="w-3.5 h-3.5 text-emerald-400" /> New Blank Document</span>
                <span className="text-[10px] text-slate-400">Ctrl+Shift+N</span>
              </button>
              <button 
                onClick={() => executeAction(onNewDocument)}
                className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center justify-between"
              >
                <span className="flex items-center gap-2"><FilePlus className="w-3.5 h-3.5 text-blue-400" /> New from AI Prompt</span>
                <span className="text-[10px] text-slate-400">Ctrl+N</span>
              </button>
              
              <div className="border-t border-slate-800 my-1" />
              <button 
                onClick={() => executeAction(onExportPdf)}
                className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center justify-between"
              >
                <span className="flex items-center gap-2"><Download className="w-3.5 h-3.5 text-emerald-400" /> Export PDF</span>
                <span className="text-[10px] text-slate-400">Ctrl+E</span>
              </button>
              <button 
                onClick={() => executeAction(onPrint)}
                className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center justify-between"
              >
                <span className="flex items-center gap-2"><Printer className="w-3.5 h-3.5 text-indigo-400" /> Print Document</span>
                <span className="text-[10px] text-slate-400">Ctrl+P</span>
              </button>
              <button 
                onClick={() => executeAction(onExportJson)}
                className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center gap-2"
              >
                <Save className="w-3.5 h-3.5 text-amber-400" /> Export Model JSON
              </button>
              <button 
                onClick={() => executeAction(onExportMarkdown)}
                className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center gap-2"
              >
                <FileCode className="w-3.5 h-3.5 text-cyan-400" /> Export Markdown (.md)
              </button>
              <button 
                onClick={() => executeAction(onExportPlainText)}
                className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center gap-2"
              >
                <FileText className="w-3.5 h-3.5 text-slate-300" /> Export Plain Text (.txt)
              </button>
              <button 
                onClick={() => executeAction(onCopyDocumentText)}
                className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center gap-2"
              >
                <Copy className="w-3.5 h-3.5 text-emerald-400" /> Copy All Text to Clipboard
              </button>
              <button 
                onClick={() => executeAction(onImportJson)}
                className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center gap-2"
              >
                <FolderOpen className="w-3.5 h-3.5 text-blue-400" /> Import Model JSON
              </button>
              <button
                onClick={() => executeAction(onImportText)}
                className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center gap-2"
              >
                <FileText className="w-3.5 h-3.5 text-emerald-400" /> Import Full Text / Markdown
              </button>
              <div className="border-t border-slate-800 my-1" />
              <button 
                onClick={() => executeAction(onOpenMetadata)}
                className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center gap-2"
              >
                <FileText className="w-3.5 h-3.5 text-slate-400" /> Document Properties
              </button>
              <button
                onClick={() => executeAction(onOpenSourceTruth)}
                className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center gap-2"
              >
                <FileCheck className="w-3.5 h-3.5 text-cyan-300" /> Source of Truth / Render Document
              </button>
            </div>
          )}
        </div>

        {/* EDIT MENU */}
        <div className="relative">
          <button
            onClick={() => handleMenuClick('edit')}
            onMouseEnter={() => handleMenuHover('edit')}
            className={`px-2.5 py-1 rounded hover:bg-slate-800 hover:text-white transition-colors ${
              activeMenu === 'edit' ? 'bg-slate-800 text-white' : ''
            }`}
          >
            Edit
          </button>
          {activeMenu === 'edit' && (
            <div className="absolute left-0 top-full mt-1 w-52 bg-slate-900 border border-slate-700/80 rounded-md shadow-2xl py-1 z-50 text-slate-200">
              <button 
                onClick={() => executeAction(onUndo)}
                disabled={!canUndo}
                className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white disabled:opacity-40 flex items-center justify-between"
              >
                <span className="flex items-center gap-2"><RotateCcw className="w-3.5 h-3.5" /> Undo</span>
                <span className="text-[10px] text-slate-400">Ctrl+Z</span>
              </button>
              <button 
                onClick={() => executeAction(onRedo)}
                disabled={!canRedo}
                className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white disabled:opacity-40 flex items-center justify-between"
              >
                <span className="flex items-center gap-2"><RotateCw className="w-3.5 h-3.5" /> Redo</span>
                <span className="text-[10px] text-slate-400">Ctrl+Y</span>
              </button>

              <div className="border-t border-slate-800 my-1" />
              <button 
                onClick={() => executeAction(onOpenFindReplace)}
                className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center justify-between"
              >
                <span className="flex items-center gap-2"><Search className="w-3.5 h-3.5 text-blue-400" /> Find &amp; Replace</span>
                <span className="text-[10px] text-slate-400">Ctrl+F</span>
              </button>
              <button 
                onClick={() => executeAction(onOpenRedaction)}
                className="w-full text-left px-3 py-1.5 hover:bg-rose-600 hover:text-white flex items-center gap-2 text-rose-300"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" /> True Redaction Tool
              </button>
            </div>
          )}
        </div>

        {/* INSERT MENU */}
        <div className="relative">
          <button
            onClick={() => handleMenuClick('insert')}
            onMouseEnter={() => handleMenuHover('insert')}
            className={`px-2.5 py-1 rounded hover:bg-slate-800 hover:text-white transition-colors ${
              activeMenu === 'insert' ? 'bg-slate-800 text-white' : ''
            }`}
          >
            Insert
          </button>
          {activeMenu === 'insert' && (
            <div className="absolute left-0 top-full mt-1 w-56 bg-slate-900 border border-slate-700/80 rounded-md shadow-2xl py-1 z-50 text-slate-200">
              <button 
                onClick={() => executeAction(onAddSection)}
                className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center gap-2"
              >
                <Plus className="w-3.5 h-3.5 text-blue-400" /> New Section
              </button>
              <button 
                onClick={() => executeAction(onOpenInsertTable)}
                className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center gap-2"
              >
                <TableIcon className="w-3.5 h-3.5 text-emerald-400" /> Data Table
              </button>
              <button 
                onClick={() => executeAction(onOpenInsertChart)}
                className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center gap-2"
              >
                <PieChart className="w-3.5 h-3.5 text-amber-400" /> Visual Chart (Donut/Bar)
              </button>
              <button 
                onClick={() => executeAction(onOpenInsertImage)}
                className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center gap-2"
              >
                <ImageIcon className="w-3.5 h-3.5 text-purple-400" /> Image / Brand Artwork
              </button>

              <div className="border-t border-slate-800 my-1" />
              <button 
                onClick={() => executeAction(() => {
                  const newDoc = {
                    ...document,
                    sections: [
                      ...document.sections,
                      {
                        id: `sec_app_${Date.now()}`,
                        sectionNumber: '',
                        title: 'APPENDIX B: SCHEDULE OF INTELLECTUAL PROPERTY',
                        content: 'Detailed schedule of registered sound recordings and musical works.',
                        clauses: [
                          {
                            id: `cl_app_b_1`,
                            clauseNumber: 'B.1',
                            content: 'Master Recording metadata: Title, Artists, ISRC, Producer credits.',
                            orderIndex: 1
                          }
                        ],
                        orderIndex: document.sections.length + 1,
                        isAppendix: true,
                        forcePageBreakBefore: true
                      }
                    ]
                  };
                  onNewDocument();
                })}
                className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center gap-2"
              >
                <FileCheck className="w-3.5 h-3.5 text-indigo-400" /> Appendix / Exhibit
              </button>
            </div>
          )}
        </div>

        {/* FORMAT MENU */}
        <div className="relative">
          <button
            onClick={() => handleMenuClick('format')}
            onMouseEnter={() => handleMenuHover('format')}
            className={`px-2.5 py-1 rounded hover:bg-slate-800 hover:text-white transition-colors ${
              activeMenu === 'format' ? 'bg-slate-800 text-white' : ''
            }`}
          >
            Format
          </button>
          {activeMenu === 'format' && (
            <div className="absolute left-0 top-full mt-1 w-56 bg-slate-900 border border-slate-700/80 rounded-md shadow-2xl py-1 z-50 text-slate-200">
              <button
                onClick={() => executeAction(onOpenDesign)}
                className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center gap-2"
                title="Customize document themes, backgrounds, colors, sections and tables"
              >
                <Palette className="w-3.5 h-3.5 text-blue-300" /> Document Design
              </button>
              <div className="border-t border-slate-800 my-1" />
              <div className="px-3 py-1 text-[10px] font-semibold uppercase text-slate-500">Document Templates</div>
              <div className="border-t border-slate-800 my-1" />
              <div className="px-3 py-1 text-[10px] font-semibold uppercase text-slate-500">Music Industry Templates</div>
              <button 
                onClick={() => executeAction(() => onOpenTemplate('music'))}
                className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center gap-2"
              >
                <span>🎵</span> Music Collaboration Master (50/50 Split)
              </button>
              <button 
                onClick={() => executeAction(() => onOpenTemplate('beat_license'))}
                className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center gap-2"
              >
                <span>🎹</span> Exclusive Beat License &amp; Producer Royalty
              </button>
              <button 
                onClick={() => executeAction(() => onOpenTemplate('featured_artist'))}
                className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center gap-2"
              >
                <span>🎤</span> Featured Vocalist Performance &amp; Clearance
              </button>
              <button 
                onClick={() => executeAction(() => onOpenTemplate('sync_license'))}
                className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center gap-2"
              >
                <span>🎧</span> Sync Master &amp; Synchronization (Film/TV)
              </button>
              <button 
                onClick={() => executeAction(() => onOpenTemplate('label_360'))}
                className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center gap-2"
              >
                <span>💿</span> Record Label 360 &amp; Digital Distribution
              </button>

              <div className="border-t border-slate-800 my-1" />
              <div className="px-3 py-1 text-[10px] font-semibold uppercase text-slate-500">Commercial &amp; Venture Templates</div>
              <button 
                onClick={() => executeAction(() => onOpenTemplate('saas'))}
                className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center gap-2"
              >
                <span>💻</span> Enterprise SaaS Master Agreement (99.9% SLA)
              </button>
              <button 
                onClick={() => executeAction(() => onOpenTemplate('term_sheet'))}
                className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center gap-2"
              >
                <span>📊</span> Series A Preferred Stock Investment Term Sheet
              </button>


              <div className="border-t border-slate-800 my-1" />
              <div className="px-3 py-1 text-[10px] font-semibold uppercase text-slate-500">Font Families</div>
              {['Times New Roman', 'Garamond', 'Inter', 'Helvetica', 'Georgia', 'Courier New'].map((f) => (
                <button
                  key={f}
                  onClick={() => executeAction(() => onApplyFont(f))}
                  className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center justify-between"
                >
                  <span style={{ fontFamily: f }}>{f}</span>
                  {document.styles.fontFamily === f && <Check className="w-3 h-3 text-blue-400" />}
                </button>
              ))}

              <div className="border-t border-slate-800 my-1" />
              <div className="px-3 py-1 text-[10px] font-semibold uppercase text-slate-500">Page Orientation</div>
              <button
                onClick={() => executeAction(() => onApplyOrientation('portrait'))}
                className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center justify-between"
              >
                <span>Portrait (Vertical)</span>
                {document.pageConfig.orientation === 'portrait' && <Check className="w-3 h-3 text-blue-400" />}
              </button>
              <button
                onClick={() => executeAction(() => onApplyOrientation('landscape'))}
                className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center justify-between"
              >
                <span>Landscape (Horizontal)</span>
                {document.pageConfig.orientation === 'landscape' && <Check className="w-3 h-3 text-blue-400" />}
              </button>
            </div>
          )}
        </div>

        {/* TOOLS MENU */}
        <div className="relative">
          <button
            onClick={() => handleMenuClick('tools')}
            onMouseEnter={() => handleMenuHover('tools')}
            className={`px-2.5 py-1 rounded hover:bg-slate-800 hover:text-white transition-colors ${
              activeMenu === 'tools' ? 'bg-slate-800 text-white' : ''
            }`}
          >
            Tools
          </button>
          {activeMenu === 'tools' && (
            <div className="absolute left-0 top-full mt-1 w-64 bg-slate-900 border border-slate-700/80 rounded-md shadow-2xl py-1 z-50 text-slate-200">
              <button 
                onClick={() => executeAction(onOpenClauseLibrary)}
                className="w-full text-left px-3 py-1.5 hover:bg-emerald-600 hover:text-white flex items-center gap-2"
              >
                <BookOpen className="w-3.5 h-3.5 text-emerald-400" /> Clause Library &amp; Boilerplate Inserter
              </button>
              <button 
                onClick={() => executeAction(onOpenWatermarkCustomizer)}
                className="w-full text-left px-3 py-1.5 hover:bg-amber-600 hover:text-white flex items-center gap-2"
              >
                <Droplets className="w-3.5 h-3.5 text-amber-400" /> Watermark &amp; Margins Customizer
              </button>
              <button 
                onClick={() => executeAction(onOpenReadability)}
                className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center gap-2"
              >
                <BarChart3 className="w-3.5 h-3.5 text-blue-400" /> Reading Time &amp; Metrics Inspector
              </button>

              <div className="border-t border-slate-800 my-1" />
              <button 
                onClick={() => executeAction(() => onTransformHeadingsCase('uppercase'))}
                className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center gap-2"
              >
                <CaseUpper className="w-3.5 h-3.5 text-slate-300" /> Convert Headings to UPPERCASE
              </button>
              <button 
                onClick={() => executeAction(() => onTransformHeadingsCase('capitalize'))}
                className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center gap-2"
              >
                <Type className="w-3.5 h-3.5 text-slate-300" /> Convert Headings to Title Case
              </button>

              <div className="border-t border-slate-800 my-1" />
              <button 
                onClick={() => executeAction(onOpenValidation)}
                className="w-full text-left px-3 py-1.5 hover:bg-emerald-600 hover:text-white flex items-center gap-2"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> QA Integrity &amp; Quality Audit
              </button>
              <button 
                onClick={() => executeAction(onOpenMultiDoc)}
                className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center gap-2"
              >
                <Layers className="w-3.5 h-3.5 text-blue-400" /> Multi-Document Workspace
              </button>
              <button 
                onClick={() => executeAction(onOpenFindReplace)}
                className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center gap-2"
              >
                <Search className="w-3.5 h-3.5 text-amber-400" /> Global Terminology Search &amp; Replace
              </button>
              <button 
                onClick={() => executeAction(onOpenRedaction)}
                className="w-full text-left px-3 py-1.5 hover:bg-rose-600 hover:text-white flex items-center gap-2 text-rose-300"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" /> True Redaction &amp; Privacy Scrub
              </button>
            </div>
          )}
        </div>

        {/* VIEW MENU */}
        <div className="relative">
          <button
            onClick={() => handleMenuClick('view')}
            onMouseEnter={() => handleMenuHover('view')}
            className={`px-2.5 py-1 rounded hover:bg-slate-800 hover:text-white transition-colors ${
              activeMenu === 'view' ? 'bg-slate-800 text-white' : ''
            }`}
          >
            View
          </button>
          {activeMenu === 'view' && (
            <div className="absolute left-0 top-full mt-1 w-52 bg-slate-900 border border-slate-700/80 rounded-md shadow-2xl py-1 z-50 text-slate-200">
              <button 
                onClick={() => executeAction(toggleOutline)}
                className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center justify-between"
              >
                <span>Document Outline</span>
                {isOutlineVisible && <Check className="w-3 h-3 text-blue-400" />}
              </button>
              <button 
                onClick={() => executeAction(toggleAI)}
                className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center justify-between"
              >
                <span>AI Orchestrator Panel</span>
                {isAIVisible && <Check className="w-3 h-3 text-blue-400" />}
              </button>

              <div className="border-t border-slate-800 my-1" />
              <button 
                onClick={() => executeAction(() => setZoomLevel(prev => Math.min(150, prev + 10)))}
                className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center gap-2"
              >
                <ZoomIn className="w-3.5 h-3.5" /> Zoom In (+10%)
              </button>
              <button 
                onClick={() => executeAction(() => setZoomLevel(prev => Math.max(60, prev - 10)))}
                className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center gap-2"
              >
                <ZoomOut className="w-3.5 h-3.5" /> Zoom Out (-10%)
              </button>
              <button 
                onClick={() => executeAction(() => setZoomLevel(100))}
                className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center gap-2"
              >
                <Maximize2 className="w-3.5 h-3.5" /> Reset Zoom (100%)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right Word Count & Stats Indicator */}
      <div className="ml-auto flex items-center gap-3 text-[11px] text-slate-400 font-mono">
        <span>{document.sections.length} Sections</span>
        <span>•</span>
        <span>{document.sections.reduce((acc, s) => acc + (s.clauses?.length || 0), 0)} Clauses</span>
        <span>•</span>
        <span className="text-emerald-400 font-semibold">{document.styles.fontFamily}</span>
      </div>
    </div>
  );
};
