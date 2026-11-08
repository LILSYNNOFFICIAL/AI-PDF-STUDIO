import React, { useState } from 'react';
import { 
  Sparkles, 
  Plus, 
  Trash2, 
  Table as TableIcon, 
  PenTool, 
  ZoomIn, 
  ZoomOut, 
  Check, 
  Edit3,
  GitMerge,
  Split,
  Calculator,
  PieChart,
  Copy,
  FilePlus,
  ArrowDownCircle
} from 'lucide-react';
import { DocumentModel, Section, Clause, TableBlock, ChartBlock, SignatureParty } from '../types/document';
import {
  resolveDocumentDesign,
  resolveSectionDesign,
  resolveTableDesign,
  resolveCellFill,
  fillToCss,
  borderToCss
} from '../services/documentDesign';

interface VisualEditorProps {
  document: DocumentModel;
  activeSectionId: string | null;
  onUpdateSection: (updatedSection: Section) => void;
  onDeleteSection: (sectionId: string) => void;
  onDuplicateSection: (sectionId: string) => void;
  onUpdateSignatures: (signatures: any) => void;
  onQuickAIAction: (actionType: string, targetContext: { sectionId?: string; text?: string }) => void;
}

export const VisualEditor: React.FC<VisualEditorProps> = ({
  document,
  activeSectionId,
  onUpdateSection,
  onDeleteSection,
  onDuplicateSection,
  onUpdateSignatures,
  onQuickAIAction
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [selectedTableCell, setSelectedTableCell] = useState<{
    sectionId: string;
    tableId: string;
    rowIndex: number;
    columnIndex: number;
  } | null>(null);
  const documentDesign = resolveDocumentDesign(document);

  // Elongation & Section Extension helpers
  const handleExtendSectionText = (section: Section) => {
    const current = section.content || '';
    const newParagraph = '\n\nThe Parties further mutually covenant that all deliverables, intellectual property assignments, and payment obligations set forth under this Section shall be strictly performed in accordance with statutory guidelines and industry best practices.';
    onUpdateSection({
      ...section,
      content: current ? `${current}${newParagraph}` : newParagraph.trim()
    });
  };

  const handleTogglePageBreak = (section: Section) => {
    onUpdateSection({
      ...section,
      forcePageBreakBefore: !section.forcePageBreakBefore
    });
  };

  const fontFamilies: Record<string, string> = {
    'Times New Roman': 'font-serif',
    'Garamond': 'font-serif',
    'Inter': 'font-sans',
    'Helvetica': 'font-sans',
    'Georgia': 'font-serif',
    'Courier New': 'font-mono'
  };

  const currentFontClass = fontFamilies[document.styles.fontFamily] || 'font-serif';

  // Table manipulation helpers
  const handleAddRow = (section: Section, tableIndex: number) => {
    if (!section.tables || !section.tables[tableIndex]) return;
    const table = section.tables[tableIndex];
    const newRow = table.headers.map((_, i) => ({
      id: `cell_${Date.now()}_${i}`,
      content: 'New Value',
      bold: false
    }));
    const updatedTables = [...section.tables];
    updatedTables[tableIndex] = { ...table, rows: [...table.rows, newRow] };
    onUpdateSection({ ...section, tables: updatedTables });
  };

  const handleAddColumn = (section: Section, tableIndex: number) => {
    if (!section.tables || !section.tables[tableIndex]) return;
    const table = section.tables[tableIndex];
    const colNum = table.headers.length + 1;
    const newHeader = {
      id: `th_${Date.now()}`,
      content: `Col ${colNum}`,
      width: 'auto'
    };
    const updatedRows = table.rows.map((row, rIdx) => [
      ...row,
      { id: `cell_${Date.now()}_${rIdx}`, content: '—', bold: false }
    ]);
    const updatedTables = [...section.tables];
    updatedTables[tableIndex] = {
      ...table,
      headers: [...table.headers, newHeader],
      rows: updatedRows
    };
    onUpdateSection({ ...section, tables: updatedTables });
  };

  const handleDeleteRow = (section: Section, tableIndex: number, rowIndex: number) => {
    if (!section.tables || !section.tables[tableIndex]) return;
    const table = section.tables[tableIndex];
    if (table.rows.length <= 1) return;
    const updatedRows = table.rows.filter((_, idx) => idx !== rowIndex);
    const updatedTables = [...section.tables];
    updatedTables[tableIndex] = { ...table, rows: updatedRows };
    onUpdateSection({ ...section, tables: updatedTables });
  };

  const handleDeleteTable = (section: Section, tableIndex: number) => {
    if (!section.tables) return;
    const updatedTables = section.tables.filter((_, idx) => idx !== tableIndex);
    onUpdateSection({ ...section, tables: updatedTables });
  };

  const handleUpdateCellBackground = (
    section: Section,
    tableIndex: number,
    rowIndex: number,
    columnIndex: number,
    color?: string
  ) => {
    if (!section.tables?.[tableIndex]) return;
    const updatedTables = [...section.tables];
    const table = updatedTables[tableIndex];
    if (rowIndex < 0) {
      const headers = [...table.headers];
      if (!headers[columnIndex]) return;
      headers[columnIndex] = { ...headers[columnIndex], bg: color };
      updatedTables[tableIndex] = { ...table, headers };
    } else {
      const rows = table.rows.map(row => [...row]);
      if (!rows[rowIndex]?.[columnIndex]) return;
      rows[rowIndex][columnIndex] = { ...rows[rowIndex][columnIndex], bg: color };
      updatedTables[tableIndex] = { ...table, rows };
    }
    onUpdateSection({ ...section, tables: updatedTables });
  };

  const colorForPicker = (value: string): string => {
    if (/^#[0-9a-f]{6}$/i.test(value)) return value;
    if (/^#[0-9a-f]{3}$/i.test(value)) return '#' + value.slice(1).split('').map(char => char + char).join('');
    return '#ffffff';
  };

  // Clause manipulation helpers
  const handleAddClauseToSection = (section: Section) => {
    const numPrefix = section.sectionNumber ? section.sectionNumber.replace('.0', '') : '1';
    const count = section.clauses?.length || 0;
    const newClause: Clause = {
      id: `cl_${Date.now()}`,
      clauseNumber: `${numPrefix}.${count + 1}`,
      heading: 'Standard Undertaking',
      content: 'The Parties acknowledge and agree to comply with all operational obligations set forth under this provision.',
      orderIndex: count + 1
    };
    onUpdateSection({ ...section, clauses: [...(section.clauses || []), newClause] });
  };

  const handleDeleteClause = (section: Section, clauseId: string) => {
    const updatedClauses = (section.clauses || []).filter(c => c.id !== clauseId);
    onUpdateSection({ ...section, clauses: updatedClauses });
  };

  // Signatures manipulation helper
  const handleUpdateParty = (partyIndex: number, field: keyof SignatureParty, value: string) => {
    if (!document.signatures) return;
    const updatedParties = [...document.signatures.parties];
    updatedParties[partyIndex] = {
      ...updatedParties[partyIndex],
      [field]: value
    };
    onUpdateSignatures({
      ...document.signatures,
      parties: updatedParties
    });
  };

  return (
    <div className="flex-1 bg-slate-950 overflow-y-auto flex flex-col items-center p-4 sm:p-8 relative">
      {/* Floating Viewport & Zoom Bar */}
      <div className="fixed bottom-6 left-80 z-20 bg-slate-900/90 backdrop-blur-md border border-slate-800 text-slate-300 rounded-lg px-3 py-1.5 shadow-xl flex items-center gap-2 text-xs">
        <button 
          onClick={() => setZoomLevel(prev => Math.max(70, prev - 10))}
          title="Zoom Out"
          className="hover:text-white"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <span className="font-mono w-10 text-center">{zoomLevel}%</span>
        <button 
          onClick={() => setZoomLevel(prev => Math.min(150, prev + 10))}
          title="Zoom In"
          className="hover:text-white"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <div className="h-3 w-px bg-slate-700 mx-1" />
        <span className="text-slate-400">
          {document.pageConfig.orientation.toUpperCase()} • {document.pageConfig.pageSize}
        </span>
      </div>

      {/* Sheet Simulation Container */}
      <div 
        style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
        className="transition-transform duration-150 ease-out"
      >
        <main 
          role="main"
          aria-label="Document Canvas"
          className={`w-[820px] min-h-[1050px] text-slate-900 shadow-2xl rounded-sm p-12 sm:p-16 border border-slate-200 relative mb-12 ${currentFontClass}`}
          style={{
            paddingTop: `${document.pageConfig.margins.top * 1.5}px`,
            paddingBottom: `${document.pageConfig.margins.bottom * 1.5}px`,
            paddingLeft: `${document.pageConfig.margins.left * 1.5}px`,
            paddingRight: `${document.pageConfig.margins.right * 1.5}px`,
            background: fillToCss(documentDesign.page.firstPageBackground || documentDesign.page.background),
            color: documentDesign.colors.bodyText,
            fontFamily: documentDesign.typography.bodyFontFamily,
            fontSize: `${documentDesign.typography.bodyFontSize}pt`,
            lineHeight: documentDesign.typography.bodyLineHeight
          }}
        >
          {/* Running Header */}
          {document.pageConfig.headerText && (
            <div
              className="pb-2 mb-8 flex items-center justify-between text-[11px] font-sans tracking-wider uppercase"
              style={{ color: documentDesign.pageFurniture.headerTextColor, borderBottom: `${documentDesign.pageFurniture.dividerWidth}px solid ${documentDesign.pageFurniture.dividerColor}` }}
            >
              <span>{document.pageConfig.headerText}</span>
              <span>CONFIDENTIAL</span>
            </div>
          )}

          {/* Watermark Overlay */}
          {document.pageConfig.watermarkText && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5 rotate-[-35deg] font-bold text-7xl select-none text-slate-800">
              {document.pageConfig.watermarkText}
            </div>
          )}

          {/* Document Title Header */}
          <div className="text-center pb-8 mb-8" style={{ borderBottom: `${Math.max(1, documentDesign.pageFurniture.dividerWidth * 2)}px solid ${documentDesign.pageFurniture.dividerColor}` }}>
            <h1 
              style={{
                fontSize: `${documentDesign.typography.heading1Size || document.styles.heading1Size || 18}pt`,
                fontFamily: documentDesign.typography.headingFontFamily,
                color: documentDesign.colors.headingText,
                textTransform: documentDesign.typography.headingCase === 'uppercase'
                  ? 'uppercase'
                  : documentDesign.typography.headingCase === 'capitalize' ? 'capitalize' : 'none'
              }}
              className="font-bold tracking-tight mb-2"
            >
              {documentDesign.typography.headingCase === 'uppercase'
                ? document.title.toUpperCase()
                : documentDesign.typography.headingCase === 'capitalize'
                  ? document.title.toLowerCase().replace(/\b\p{L}/gu, character => character.toUpperCase())
                  : document.title}
            </h1>
            <div className="text-xs font-sans flex items-center justify-center gap-3" style={{ color: documentDesign.colors.mutedText }}>
              <span>Version {document.version}</span>
              <span>•</span>
              <span>Document Type: {document.type.replace('_', ' ').toUpperCase()}</span>
              <span>•</span>
              <span>Date: {new Date(document.updatedAt).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Sections List */}
          <div className="space-y-8">
            {document.sections.map((section) => {
              const isActive = activeSectionId === section.id;
              const isAppendix = section.isAppendix || section.sectionNumber.includes('APPENDIX');
              const sectionStyle = resolveSectionDesign(document, section);

              return (
                <section 
                  key={section.id} 
                  id={section.id}
                  className={`relative group rounded-md p-3 transition-all ${
                    isActive ? 'ring-2 ring-blue-500/50' : 'hover:bg-slate-50/50'
                  } ${section.forcePageBreakBefore ? 'pt-8' : ''}`}
                  style={{
                    background: fillToCss(sectionStyle.background),
                    color: sectionStyle.bodyTextColor,
                    border: 'none',
                    borderTop: section.forcePageBreakBefore ? '2px dashed ' + documentDesign.colors.border : borderToCss(sectionStyle.border, 'top'),
                    borderRight: borderToCss(sectionStyle.border, 'right'),
                    borderBottom: borderToCss(sectionStyle.border, 'bottom'),
                    borderLeft: borderToCss(sectionStyle.border, 'left'),
                    padding: `${sectionStyle.padding}px`,
                    textAlign: documentDesign.typography.textAlignment || document.styles.alignment || 'left',
                    display: (documentDesign.typography.contentBoxMinHeight || 0) > 0 ? 'flex' : undefined,
                    flexDirection: (documentDesign.typography.contentBoxMinHeight || 0) > 0 ? 'column' : undefined,
                    justifyContent: (documentDesign.typography.contentBoxMinHeight || 0) > 0
                      ? ({ top: 'flex-start', middle: 'center', bottom: 'flex-end' } as const)[documentDesign.typography.verticalAlignment || 'top']
                      : undefined,
                    minHeight: (documentDesign.typography.contentBoxMinHeight || 0) > 0 ? `${documentDesign.typography.contentBoxMinHeight}px` : undefined,
                    boxSizing: 'border-box'
                  }}
                >
                  {/* Floating Contextual AI Bar on Section */}
                  <div className="absolute -top-3 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white rounded-md px-2 py-1 flex items-center gap-1.5 shadow-lg z-10 text-[11px] font-sans">
                    <button
                      onClick={() => onQuickAIAction('rewrite', { sectionId: section.id, text: section.title })}
                      className="hover:text-blue-300 flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3 text-blue-400" />
                      <span>AI Rewrite</span>
                    </button>
                    <div className="w-px h-3 bg-slate-700" />
                    <button
                      onClick={() => handleExtendSectionText(section)}
                      className="hover:text-emerald-300 flex items-center gap-0.5"
                      title="Elongate section with additional legal covenants"
                    >
                      <Plus className="w-3 h-3 text-emerald-400" />
                      <span>Extend Text</span>
                    </button>
                    <div className="w-px h-3 bg-slate-700" />
                    <button
                      onClick={() => onDuplicateSection(section.id)}
                      className="hover:text-cyan-300 flex items-center gap-0.5"
                      title="Duplicate this entire section"
                    >
                      <Copy className="w-3 h-3 text-cyan-400" />
                      <span>Duplicate</span>
                    </button>
                    <div className="w-px h-3 bg-slate-700" />
                    <button
                      onClick={() => handleTogglePageBreak(section)}
                      className={`hover:text-purple-300 ${section.forcePageBreakBefore ? 'text-purple-400 font-semibold' : 'text-slate-300'}`}
                      title="Toggle dedicated page break before this section"
                    >
                      {section.forcePageBreakBefore ? 'Break: ON' : 'Page Break'}
                    </button>
                    <div className="w-px h-3 bg-slate-700" />
                    <button
                      onClick={() => onQuickAIAction('split', { sectionId: section.id })}
                      className="hover:text-amber-300"
                    >
                      Split
                    </button>
                    <div className="w-px h-3 bg-slate-700" />
                    <button
                      onClick={() => onDeleteSection(section.id)}
                      className="hover:text-rose-400 text-rose-300"
                      title="Delete this section"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Section Heading */}
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="font-bold font-mono text-xs" style={{ color: sectionStyle.headingColor }}>
                      {section.sectionNumber}
                    </span>
                    <input 
                      type="text" 
                      value={section.title}
                      onChange={(e) => onUpdateSection({ ...section, title: e.target.value })}
                      aria-label="Section Title"
                      style={{ fontSize: `${documentDesign.typography.heading2Size || document.styles.heading2Size || 13}pt`, color: sectionStyle.headingColor, fontFamily: documentDesign.typography.headingFontFamily }}
                      className="font-bold flex-1 bg-transparent hover:bg-slate-100/50 focus:bg-white rounded px-1.5 py-0.5 border border-transparent focus:border-blue-400 focus:outline-none"
                    />
                  </div>

                  {/* Section Content Intro & Multi-line Elongation Area */}
                  <div className="mb-3">
                    <textarea 
                      rows={Math.max(2, (section.content || '').split('\n').length + 1)}
                      value={section.content || ''}
                      placeholder="Add introductory text, recitals, or general section covenants here (click or drag to expand)..."
                      onChange={(e) => onUpdateSection({ ...section, content: e.target.value })}
                      aria-label="Section Content"
                      style={{ 
                        fontSize: `${documentDesign.typography.bodyFontSize || document.styles.fontSize || 11}pt`,
                        lineHeight: documentDesign.typography.bodyLineHeight || document.styles.lineHeight || 1.5,
                        textAlign: documentDesign.typography.textAlignment || document.styles.alignment || 'left',
                        color: sectionStyle.bodyTextColor,
                        backgroundColor: document.styles.highlightColor || 'transparent',
                        fontFamily: documentDesign.typography.bodyFontFamily
                      }}
                      className="w-full bg-transparent hover:bg-slate-100/50 focus:bg-white rounded p-1.5 border border-transparent focus:border-blue-300 focus:outline-none resize-y placeholder:italic placeholder:text-slate-400"
                    />
                  </div>

                  {/* Bracket-delimited source material stays inside its parent section and scrolls independently. */}
                  {section.scrollableContent !== undefined && (
                    <div
                      className="mb-4 rounded-md border p-2"
                      style={{
                        backgroundColor: section.design?.scrollableBackgroundColor || documentDesign.colors.pageSurface,
                        borderColor: section.design?.scrollableBorderColor || documentDesign.colors.border
                      }}
                    >
                      <div className="mb-1.5 flex items-center justify-between font-sans text-[10px] font-semibold uppercase tracking-wider">
                        <label htmlFor={"scrollable-content-" + section.id} style={{ color: section.design?.scrollableLabelColor || documentDesign.colors.mutedText }}>Contained reference material</label>
                        <span style={{ color: section.design?.scrollableLabelColor || documentDesign.colors.mutedText }}>Scroll to view all content</span>
                      </div>
                      <textarea
                        id={"scrollable-content-" + section.id}
                        rows={12}
                        value={section.scrollableContent}
                        onChange={(e) => onUpdateSection({ ...section, scrollableContent: e.target.value })}
                        aria-label="Scrollable section content"
                        style={{
                          backgroundColor: section.design?.scrollableBackgroundColor || documentDesign.colors.pageSurface,
                          color: section.design?.scrollableTextColor || documentDesign.colors.bodyText,
                          borderColor: section.design?.scrollableBorderColor || documentDesign.colors.border,
                          caretColor: section.design?.scrollableTextColor || documentDesign.colors.bodyText
                        }}
                        className="block h-72 max-h-[420px] min-h-40 w-full resize-y overflow-y-auto rounded border p-3 text-sm leading-relaxed shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </div>
                  )}

                  {/* Section Clauses */}
                  {section.clauses && section.clauses.length > 0 && (
                    <div className="space-y-3 pl-3 border-l-2 border-slate-200 ml-1">
                      {section.clauses.map((clause, cIdx) => (
                        <div key={clause.id} className="relative group/clause flex items-baseline gap-2">
                          <span className="font-mono text-xs font-semibold text-slate-500 shrink-0 select-none">
                            {clause.clauseNumber}
                          </span>
                          <div 
                            className="flex-1"
                            style={{ textAlign: document.styles.alignment || 'left' }}
                          >
                            {clause.heading && (
                              <span 
                                contentEditable
                                suppressContentEditableWarning
                                onBlur={(e) => {
                                  const updated = [...section.clauses];
                                  updated[cIdx] = { ...clause, heading: e.currentTarget.textContent || '' };
                                  onUpdateSection({ ...section, clauses: updated });
                                }}
                                className="font-semibold mr-1.5 outline-none hover:bg-slate-100 focus:bg-white rounded px-0.5"
                                style={{ color: sectionStyle.headingColor, fontFamily: documentDesign.typography.headingFontFamily }}
                              >
                                {clause.heading}:
                              </span>
                            )}
                            <span 
                              contentEditable
                              suppressContentEditableWarning
                              onBlur={(e) => {
                                const updated = [...section.clauses];
                                updated[cIdx] = { ...clause, content: e.currentTarget.textContent || '' };
                                onUpdateSection({ ...section, clauses: updated });
                              }}
                              style={{ 
                                fontSize: `${documentDesign.typography.bodyFontSize || document.styles.fontSize || 11}pt`,
                                lineHeight: documentDesign.typography.bodyLineHeight || document.styles.lineHeight || 1.5,
                                fontWeight: document.styles.isBold ? 'bold' : 'normal',
                                fontStyle: document.styles.isItalic ? 'italic' : 'normal',
                                textDecoration: [
                                  document.styles.isUnderline ? 'underline' : '',
                                  document.styles.isStrikethrough ? 'line-through' : ''
                                ].filter(Boolean).join(' ') || 'none',
                                color: sectionStyle.bodyTextColor,
                                textAlign: documentDesign.typography.textAlignment || document.styles.alignment || 'left',
                                backgroundColor: document.styles.highlightColor || 'transparent',
                                fontFamily: documentDesign.typography.bodyFontFamily
                              }}
                              className="outline-none hover:bg-slate-100/60 focus:bg-white rounded px-1 transition-colors"
                            >
                              {clause.content}
                            </span>
                          </div>
                          
                          {/* Clause delete button on hover */}
                          <button
                            onClick={() => handleDeleteClause(section, clause.id)}
                            title="Delete this clause"
                            className="opacity-0 group-hover/clause:opacity-100 p-1 rounded hover:bg-rose-100 text-rose-500 transition-opacity shrink-0"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Section Elongation & Extension Actions Bar */}
                  <div className="mt-3 pl-4 flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => handleAddClauseToSection(section)}
                      className="text-[11px] text-blue-600 hover:text-blue-800 font-sans font-medium flex items-center gap-1 opacity-80 hover:opacity-100 transition-opacity bg-blue-50/60 hover:bg-blue-100/80 px-2 py-0.5 rounded"
                      title="Add a new numbered clause to this section"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Clause</span>
                    </button>

                    <button
                      onClick={() => handleExtendSectionText(section)}
                      className="text-[11px] text-emerald-700 hover:text-emerald-900 font-sans font-medium flex items-center gap-1 opacity-80 hover:opacity-100 transition-opacity bg-emerald-50/60 hover:bg-emerald-100/80 px-2 py-0.5 rounded"
                      title="Append additional legal text paragraph"
                    >
                      <ArrowDownCircle className="w-3 h-3" />
                      <span>Elongate / Add Paragraph</span>
                    </button>

                    <button
                      onClick={() => handleTogglePageBreak(section)}
                      className={`text-[11px] font-sans font-medium flex items-center gap-1 px-2 py-0.5 rounded transition-colors ${
                        section.forcePageBreakBefore
                          ? 'bg-purple-100 text-purple-800'
                          : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                      }`}
                      title="Force page break before this section in PDF output"
                    >
                      <span>{section.forcePageBreakBefore ? '📄 Page Break Active' : '+ Page Break Before'}</span>
                    </button>
                  </div>

                  {/* Tables Block with In-Canvas Editing */}
                  {section.tables && section.tables.map((table, tIdx) => {
                    const tableStyle = resolveTableDesign(document, section, table);
                    return (
                    <div key={table.id} className="mt-4 rounded-md shadow-xs overflow-hidden" style={{ border: `1px solid ${tableStyle.gridlineColor}`, background: fillToCss(tableStyle.bodyBackground) }}>
                      {/* Table Header Bar with Actions */}
                      <div className="px-3 py-1.5 flex items-center justify-between" style={{ background: fillToCss(tableStyle.headerBackground), borderBottom: `${tableStyle.gridlineWidth}px solid ${tableStyle.gridlineColor}` }}>
                        <div className="flex items-center gap-2">
                          <TableIcon className="w-3.5 h-3.5 text-blue-600" />
                          <input
                            type="text"
                            value={table.title || ''}
                            placeholder="Table Title"
                            onChange={(e) => {
                              const updatedTables = [...(section.tables || [])];
                              updatedTables[tIdx] = { ...table, title: e.target.value };
                              onUpdateSection({ ...section, tables: updatedTables });
                            }}
                            className="font-bold text-xs bg-transparent border-none outline-none focus:bg-white px-1 rounded"
                            style={{ color: tableStyle.headerTextColor }}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleAddColumn(section, tIdx)}
                            className="text-[11px] text-blue-600 hover:text-blue-800 font-sans font-medium flex items-center gap-0.5 px-1.5 py-0.5 rounded hover:bg-blue-50"
                            title="Add Column"
                          >
                            <Plus className="w-3 h-3" /> Col
                          </button>
                          <button
                            onClick={() => handleAddRow(section, tIdx)}
                            className="text-[11px] text-emerald-600 hover:text-emerald-800 font-sans font-medium flex items-center gap-0.5 px-1.5 py-0.5 rounded hover:bg-emerald-50"
                            title="Add Row"
                          >
                            <Plus className="w-3 h-3" /> Row
                          </button>
                          <button
                            onClick={() => handleDeleteTable(section, tIdx)}
                            className="text-[11px] text-rose-500 hover:text-rose-700 p-1 rounded hover:bg-rose-50"
                            title="Delete Table"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {selectedTableCell?.sectionId === section.id && selectedTableCell.tableId === table.id && (() => {
                        const cell = selectedTableCell.rowIndex < 0
                          ? table.headers[selectedTableCell.columnIndex]
                          : table.rows[selectedTableCell.rowIndex]?.[selectedTableCell.columnIndex];
                        const inherited = selectedTableCell.rowIndex < 0
                          ? tableStyle.headerBackground
                          : resolveCellFill(tableStyle, cell || {}, selectedTableCell.rowIndex);
                        const inheritedColor = typeof inherited === 'string'
                          ? inherited
                          : inherited.type === 'solid'
                            ? inherited.color
                            : (inherited.stops[0]?.color || '#ffffff');
                        return (
                          <div className="flex flex-wrap items-center gap-2 border-b px-3 py-2 text-[10px]" style={{ background: documentDesign.colors.sectionSurface, borderColor: documentDesign.colors.border }}>
                            <span className="font-semibold" style={{ color: documentDesign.colors.headingText }}>
                              {selectedTableCell.rowIndex < 0 ? 'Header cell' : 'Table cell'} background
                            </span>
                            <input
                              type="color"
                              aria-label="Selected table cell background"
                              value={colorForPicker(cell?.bg || inheritedColor)}
                              onChange={event => handleUpdateCellBackground(section, tIdx, selectedTableCell.rowIndex, selectedTableCell.columnIndex, event.target.value)}
                              className="h-6 w-8 cursor-pointer rounded border bg-transparent p-0"
                            />
                            <span className="font-mono" style={{ color: documentDesign.colors.mutedText }}>
                              {cell?.bg || 'Inherited'}
                            </span>
                            <button
                              type="button"
                              disabled={!cell?.bg}
                              onClick={() => handleUpdateCellBackground(section, tIdx, selectedTableCell.rowIndex, selectedTableCell.columnIndex, undefined)}
                              className="rounded border px-2 py-1 disabled:opacity-40"
                              style={{ borderColor: documentDesign.colors.border, color: documentDesign.colors.bodyText }}
                            >
                              Clear cell override
                            </button>
                          </div>
                        );
                      })()}

                      {/* Render Table Grid */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr style={{ background: fillToCss(tableStyle.headerBackground), borderBottom: `${tableStyle.gridlineWidth}px solid ${tableStyle.gridlineColor}` }}>
                              {table.headers.map((h, hIdx) => (
                                <th
                                  key={h.id}
                                  onClick={() => setSelectedTableCell({ sectionId: section.id, tableId: table.id, rowIndex: -1, columnIndex: hIdx })}
                                  className="p-2 font-bold border-r last:border-none"
                                  style={{ color: tableStyle.headerTextColor, borderColor: tableStyle.gridlineColor, background: h.bg || fillToCss(tableStyle.headerBackground) }}
                                >
                                  <input
                                    type="text"
                                    value={h.content}
                                    onChange={(e) => {
                                      const updatedHeaders = [...table.headers];
                                      updatedHeaders[hIdx] = { ...h, content: e.target.value };
                                      const updatedTables = [...(section.tables || [])];
                                      updatedTables[tIdx] = { ...table, headers: updatedHeaders };
                                      onUpdateSection({ ...section, tables: updatedTables });
                                    }}
                                    className="w-full bg-transparent border-none outline-none font-bold focus:bg-white"
                                    style={{ color: tableStyle.headerTextColor }}
                                  />
                                </th>
                              ))}
                              <th className="w-8 p-1 text-center font-normal" style={{ background: fillToCss(tableStyle.headerBackground), color: tableStyle.headerTextColor }}></th>
                            </tr>
                          </thead>
                          <tbody>
                            {table.rows.map((row, rIdx) => (
                              <tr key={rIdx} className="border-b last:border-none hover:bg-blue-50/20 group/row" style={{ borderColor: tableStyle.gridlineColor }}>
                                {row.map((cell, cIdx) => (
                                  <td 
                                    key={cell.id}
                                    onClick={() => setSelectedTableCell({ sectionId: section.id, tableId: table.id, rowIndex: rIdx, columnIndex: cIdx })}
                                    contentEditable
                                    suppressContentEditableWarning
                                    onBlur={(e) => {
                                      const updatedRows = [...table.rows];
                                      updatedRows[rIdx][cIdx] = { ...cell, content: e.currentTarget.textContent || '' };
                                      const updatedTables = [...(section.tables || [])];
                                      updatedTables[tIdx] = { ...table, rows: updatedRows };
                                      onUpdateSection({ ...section, tables: updatedTables });
                                    }}
                                    className={`p-2 border-r last:border-none focus:bg-white outline-none ${
                                      cell.bold ? 'font-semibold' : ''
                                    } ${cell.align === 'right' ? 'text-right' : ''}`}
                                    style={{
                                      color: tableStyle.bodyTextColor,
                                      background: (() => { const fill = resolveCellFill(tableStyle, cell, rIdx); return typeof fill === 'string' ? fill : fillToCss(fill); })(),
                                      borderColor: tableStyle.gridlineColor
                                    }}
                                  >
                                    {cell.content}
                                  </td>
                                ))}
                                <td className="p-1 text-center">
                                  <button
                                    onClick={() => handleDeleteRow(section, tIdx, rIdx)}
                                    title="Delete row"
                                    className="opacity-0 group-hover/row:opacity-100 text-slate-400 hover:text-rose-600 transition-opacity"
                                  >
                                    <Trash2 className="w-3 h-3 inline" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ); })}

                  {/* Chart Visual Block */}
                  {section.charts && section.charts.map((chart) => (
                    <div key={chart.id} className="mt-4 p-4 rounded-lg flex flex-col items-center" style={{ background: documentDesign.colors.sectionSurface, border: `1px solid ${documentDesign.colors.border}` }}>
                      <div className="text-xs font-bold mb-3 flex items-center gap-1.5" style={{ color: documentDesign.colors.headingText }}>
                        <PieChart className="w-4 h-4" style={{ color: documentDesign.colors.accent }} />
                        <span>{chart.title}</span>
                      </div>
                      
                      {/* SVG Donut / Bar Chart Representation */}
                      <div className="flex items-center justify-center gap-8 w-full max-w-md">
                        <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 36 36">
                          <path
                            strokeWidth="5"
                            stroke="currentColor"
                            style={{ color: documentDesign.colors.border }}
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                          <path
                            strokeDasharray="50, 100"
                            strokeWidth="5"
                            strokeLinecap="round"
                            stroke="currentColor"
                            style={{ color: documentDesign.colors.accent }}
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                        </svg>

                        <div className="space-y-2 text-xs">
                          {chart.labels.map((lbl, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <span className="w-3 h-3 rounded-full" style={{ background: [documentDesign.colors.accent, documentDesign.colors.secondary, documentDesign.colors.primary, documentDesign.colors.border][idx % 4] }} />
                              <span className="font-medium" style={{ color: documentDesign.colors.bodyText }}>{lbl}:</span>
                              <span className="font-bold" style={{ color: documentDesign.colors.headingText }}>{chart.values[idx]}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Images / Brand Artwork Block */}
                  {section.images && section.images.map((img) => (
                    <div key={img.id} className="mt-4 flex flex-col items-center">
                      <img 
                        src={img.url} 
                        alt={img.altText || 'Document Artwork'} 
                        className="rounded shadow-sm max-h-60 object-contain"
                        style={{ width: `${img.widthPercent || 80}%`, border: `1px solid ${documentDesign.colors.border}` }}
                      />
                      {img.caption && (
                        <p className="text-[11px] italic mt-1.5 text-center font-sans" style={{ color: documentDesign.colors.mutedText }}>
                          {img.caption}
                        </p>
                      )}
                    </div>
                  ))}
                </section>
              );
            })}
          </div>

          {/* Execution & Signatures Section with Inline Editing */}
          {document.signatures && (
            <div 
              id="section_signatures" 
              className={`mt-12 pt-8 ${
                document.signatures.onDedicatedPage ? 'page-break-before pt-16' : ''
              }`}
              style={{ borderTop: `2px solid ${documentDesign.pageFurniture.dividerColor}` }}
            >
              <div className="text-center mb-6">
                <h2 className="font-bold text-sm tracking-wider uppercase" style={{ color: documentDesign.colors.headingText }}>
                  {document.signatures.title || 'SIGNATURES & EXECUTION'}
                </h2>
                <p className="text-xs italic mt-1" style={{ color: documentDesign.colors.mutedText }}>
                  IN WITNESS WHEREOF, the Parties have executed this Agreement by their duly authorized representatives.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mt-6">
                {document.signatures.parties.map((party: SignatureParty, idx: number) => (
                  <div key={party.id} className="rounded p-4" style={{ border: `1px solid ${documentDesign.colors.border}`, background: documentDesign.colors.sectionSurface }}>
                    <input
                      type="text"
                      value={party.role}
                      onChange={(e) => handleUpdateParty(idx, 'role', e.target.value)}
                      className="text-[11px] font-bold block mb-3 uppercase tracking-wide bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 outline-none w-full"
                      style={{ color: documentDesign.colors.headingText }}
                    />

                    {/* Signature Line */}
                    <div className="pb-1 mb-2 h-10 flex items-end" style={{ borderBottom: `1px solid ${documentDesign.colors.primary}` }}>
                      <span className="font-mono italic text-sm" style={{ color: documentDesign.colors.accent }}>
                        {party.signaturePlaceholder || `/s/ ${party.name}`}
                      </span>
                    </div>

                    <div className="text-xs space-y-1.5" style={{ color: documentDesign.colors.bodyText }}>
                      <div className="flex items-center gap-1.5">
                        <strong className="shrink-0" style={{ color: documentDesign.colors.headingText }}>By:</strong>
                        <input
                          type="text"
                          value={party.name}
                          onChange={(e) => handleUpdateParty(idx, 'name', e.target.value)}
                          className="bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 outline-none flex-1 px-1 rounded"
                          style={{ color: documentDesign.colors.bodyText }}
                        />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <strong className="shrink-0" style={{ color: documentDesign.colors.headingText }}>Title:</strong>
                        <input
                          type="text"
                          value={party.title || ''}
                          onChange={(e) => handleUpdateParty(idx, 'title', e.target.value)}
                          className="bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 outline-none flex-1 px-1 rounded"
                          style={{ color: documentDesign.colors.bodyText }}
                        />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <strong className="shrink-0" style={{ color: documentDesign.colors.headingText }}>Company:</strong>
                        <input
                          type="text"
                          value={party.company || ''}
                          onChange={(e) => handleUpdateParty(idx, 'company', e.target.value)}
                          className="bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 outline-none flex-1 px-1 rounded"
                          style={{ color: documentDesign.colors.bodyText }}
                        />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <strong className="shrink-0" style={{ color: documentDesign.colors.headingText }}>Date:</strong>
                        <input
                          type="text"
                          value={party.date || ''}
                          onChange={(e) => handleUpdateParty(idx, 'date', e.target.value)}
                          className="bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 outline-none flex-1 px-1 rounded"
                          style={{ color: documentDesign.colors.bodyText }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Running Footer */}
          <div className="mt-16 pt-4 border-t flex items-center justify-between text-[11px] font-sans" style={{ color: documentDesign.pageFurniture.footerTextColor, borderColor: documentDesign.pageFurniture.dividerColor, borderTopWidth: `${documentDesign.pageFurniture.dividerWidth}px` }}>
            <span>{document.pageConfig.footerText || 'CONFIDENTIAL & PROPRIETARY'}</span>
            <span>Page 1 of 1</span>
          </div>
        </main>
      </div>
    </div>
  );
};
