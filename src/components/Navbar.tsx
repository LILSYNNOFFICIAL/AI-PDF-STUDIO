import React from 'react';
import { 
  FileText, 
  Download, 
  CheckCircle, 
  Sparkles, 
  History, 
  RotateCcw, 
  RotateCw, 
  Layers, 
  Palette, 
  ShieldAlert,
  ChevronDown,
  Plus,
  Sun,
  Moon,
  Monitor
} from 'lucide-react';
import { DocumentModel, AIPersona, BrandProfile } from '../types/document';

interface NavbarProps {
  appTheme: 'studio' | 'midnight' | 'graphite';
  onAppThemeChange: (theme: 'studio' | 'midnight' | 'graphite') => void;
  document: DocumentModel;
  onUpdateTitle: (newTitle: string) => void;
  persona: AIPersona;
  onSelectPersona: (persona: AIPersona) => void;
  brand: BrandProfile;
  brandProfiles: BrandProfile[];
  onSelectBrand: (brand: BrandProfile) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onOpenPdfPreview: () => void;
  onOpenValidation: () => void;
  onOpenMultiDoc: () => void;
  onOpenBrandModal: () => void;
  onNewDocument: () => void;
}

export const PERSONA_LABELS: Record<AIPersona, { title: string; subtitle: string; icon: string }> = {
  auto_architect: { title: 'Auto Architect', subtitle: 'Adaptive document specialist', icon: '⚡' },
  structural_architect: { title: 'Structural Architect', subtitle: 'Sections, hierarchy & reorg', icon: '🏛️' },
  legal_specialist: { title: 'Legal Specialist', subtitle: 'Agreements, clauses & terms', icon: '⚖️' },
  music_specialist: { title: 'Music Industry Specialist', subtitle: 'Master rights & royalty splits', icon: '🎵' },
  financial_specialist: { title: 'Financial Specialist', subtitle: 'Tables, rates & calculations', icon: '📊' },
  document_designer: { title: 'Document Designer', subtitle: 'Typography & layout aesthetics', icon: '🎨' },
  quality_auditor: { title: 'Quality Auditor', subtitle: 'Integrity & compliance checks', icon: '🛡️' }
};

export const Navbar: React.FC<NavbarProps> = ({
  appTheme,
  onAppThemeChange,
  document,
  onUpdateTitle,
  persona,
  onSelectPersona,
  brand,
  brandProfiles,
  onSelectBrand,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onOpenPdfPreview,
  onOpenValidation,
  onOpenMultiDoc,
  onOpenBrandModal,
  onNewDocument
}) => {
  return (
    <header className="h-14 bg-slate-900 border-b border-slate-800 text-slate-100 flex items-center justify-between px-4 select-none shrink-0 z-30">
      {/* Left branding & document title */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-bold text-white shadow-md shadow-blue-500/20">
            <FileText className="w-4 h-4 text-white" />
          </div>
          <div className="hidden sm:block">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-sm tracking-wide text-white">AI PDF STUDIO</span>
              <span className="text-[10px] font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30 px-1.5 py-0.2 rounded">
                v{document.version}
              </span>
            </div>
          </div>
        </div>

        <div className="h-4 w-px bg-slate-800 hidden sm:block" />

        {/* Editable Title */}
        <input 
          type="text" 
          value={document.title} 
          onChange={(e) => onUpdateTitle(e.target.value)}
          aria-label="Document Title"
          className="bg-transparent hover:bg-slate-800/60 focus:bg-slate-800 text-slate-200 text-xs sm:text-sm font-medium rounded px-2 py-1 max-w-[200px] md:max-w-[340px] truncate border border-transparent focus:border-blue-500 focus:outline-none transition-colors"
        />
      </div>

      {/* Middle Controls: Persona & Brand */}
      <div className="hidden lg:flex items-center gap-2">
        {/* Persona Selector */}
        <div className="relative group">
          <label htmlFor="persona-select" className="sr-only">AI Specialist Persona</label>
          <div className="flex items-center gap-1.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-md px-2.5 py-1 text-xs cursor-pointer transition-colors">
            <span>{PERSONA_LABELS[persona].icon}</span>
            <select
              id="persona-select"
              aria-label="Select AI Persona"
              value={persona}
              onChange={(e) => onSelectPersona(e.target.value as AIPersona)}
              className="bg-transparent text-slate-200 cursor-pointer focus:outline-none appearance-none pr-4 font-medium"
            >
              {Object.entries(PERSONA_LABELS).map(([key, val]) => (
                <option key={key} value={key} className="bg-slate-900 text-slate-200">
                  {val.title}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 pointer-events-none" />
          </div>
        </div>

        {/* Brand Profile Selector */}
        <div className="relative group">
          <label htmlFor="brand-select" className="sr-only">Brand Preset</label>
          <div className="flex items-center gap-1.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-md px-2.5 py-1 text-xs cursor-pointer transition-colors">
            <Palette className="w-3.5 h-3.5 text-indigo-400" />
            <select
              id="brand-select"
              aria-label="Select Brand Profile"
              value={brand.id}
              onChange={(e) => {
                const found = brandProfiles.find(b => b.id === e.target.value);
                if (found) onSelectBrand(found);
              }}
              className="bg-transparent text-slate-200 cursor-pointer focus:outline-none appearance-none pr-4 font-medium"
            >
              {brandProfiles.map((b) => (
                <option key={b.id} value={b.id} className="bg-slate-900 text-slate-200">
                  {b.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 pointer-events-none" />
          </div>
        </div>
        <button onClick={onOpenBrandModal} title="Create, edit and manage saved brand identities" className="rounded-md border border-indigo-400/30 bg-indigo-500/10 px-2.5 py-1.5 text-[11px] font-medium text-indigo-200 transition-colors hover:bg-indigo-500/20">Manage brands</button>
      </div>

      {/* Right Action Buttons */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        <label className="app-theme-control" title="Change the application appearance">
          {appTheme === 'studio' ? <Sun className="h-3.5 w-3.5" /> : appTheme === 'midnight' ? <Moon className="h-3.5 w-3.5" /> : <Monitor className="h-3.5 w-3.5" />}
          <span className="sr-only">Application theme</span>
          <select aria-label="Application theme" value={appTheme} onChange={event => onAppThemeChange(event.target.value as 'studio' | 'midnight' | 'graphite')}>
            <option value="studio">Studio Light</option>
            <option value="midnight">Midnight</option>
            <option value="graphite">Graphite</option>
          </select>
        </label>
        {/* Undo / Redo */}
        <div className="flex items-center bg-slate-800/60 border border-slate-700/60 rounded-md p-0.5">
          <button 
            onClick={onUndo} 
            disabled={!canUndo}
            title="Undo Last Operation"
            aria-label="Undo"
            className="p-1.5 rounded text-slate-300 hover:text-white hover:bg-slate-700/50 disabled:opacity-40 disabled:hover:bg-transparent"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={onRedo} 
            disabled={!canRedo}
            title="Redo Operation"
            aria-label="Redo"
            className="p-1.5 rounded text-slate-300 hover:text-white hover:bg-slate-700/50 disabled:opacity-40 disabled:hover:bg-transparent"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Multi-Doc Workspace */}
        <button
          onClick={onOpenMultiDoc}
          title="Multi-Document Merger & Provision Extractor"
          className="hidden md:flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-200 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors"
        >
          <Layers className="w-3.5 h-3.5 text-blue-400" />
          <span>Multi-Doc</span>
        </button>

        {/* QA Validation Report */}
        <button
          onClick={onOpenValidation}
          title="Document Quality & Integrity Audit"
          className="flex items-center gap-1.5 bg-emerald-950/40 hover:bg-emerald-900/40 border border-emerald-700/50 text-emerald-300 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors"
        >
          <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline">QA Audit</span>
        </button>

        {/* PDF Export & Preview */}
        <button
          onClick={onOpenPdfPreview}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-md text-xs font-medium shadow-sm shadow-blue-500/30 transition-all hover:scale-[1.02]"
        >
          <Download className="w-3.5 h-3.5" />
          <span>PDF Preview</span>
        </button>

        {/* New Document Button */}
        <button
          onClick={onNewDocument}
          title="Create New Blank / Template Document"
          aria-label="New Document"
          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md border border-slate-700"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
