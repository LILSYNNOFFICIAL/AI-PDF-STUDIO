import React, { useState } from 'react';
import { 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  AlignJustify,
  Type,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Plus,
  Table as TableIcon,
  PieChart,
  Image as ImageIcon,
  PenTool,
  Search,
  ShieldAlert,
  RotateCcw,
  RotateCw,
  Palette,
  Highlighter,
  Sliders,
  FileText,
  FileCheck,
  ChevronDown,
  Eraser,
  CaseUpper,
  BookOpen,
  BarChart3
} from 'lucide-react';
import { DocumentModel, Alignment } from '../types/document';

interface FormattingRibbonProps {
  document: DocumentModel;
  onUpdateStyles: (styles: Partial<DocumentModel['styles']>) => void;
  onUpdatePageConfig: (pageConfig: Partial<DocumentModel['pageConfig']>) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onOpenFindReplace: () => void;
  onOpenRedaction: () => void;
  onOpenInsertTable: () => void;
  onOpenInsertChart: () => void;
  onOpenInsertImage: () => void;
  onAddClause: () => void;
  onAddSection: () => void;
  onOpenMetadata: () => void;
  onOpenClauseLibrary?: () => void;
  onOpenWatermarkCustomizer?: () => void;
  onOpenReadability?: () => void;
}

export const FormattingRibbon: React.FC<FormattingRibbonProps> = ({
  document,
  onUpdateStyles,
  onUpdatePageConfig,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onOpenFindReplace,
  onOpenRedaction,
  onOpenInsertTable,
  onOpenInsertChart,
  onOpenInsertImage,
  onAddClause,
  onAddSection,
  onOpenMetadata,
  onOpenClauseLibrary,
  onOpenWatermarkCustomizer,
  onOpenReadability
}) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [showHeadingMenu, setShowHeadingMenu] = useState(false);

  const fontOptions: Array<DocumentModel['styles']['fontFamily']> = [
    'Times New Roman',
    'Garamond',
    'Inter',
    'Helvetica',
    'Georgia',
    'Courier New'
  ];

  const currentStyles = document.styles;
  const isBold = !!currentStyles.isBold;
  const isItalic = !!currentStyles.isItalic;
  const isUnderline = !!currentStyles.isUnderline;
  const isStrikethrough = !!currentStyles.isStrikethrough;
  const alignment = currentStyles.alignment || 'left';
  const fontSize = currentStyles.fontSize || 11;

  const handleFontSizeChange = (delta: number) => {
    const newSize = Math.max(8, Math.min(28, fontSize + delta));
    onUpdateStyles({ fontSize: newSize });
  };

  const handleAlign = (align: Alignment) => {
    onUpdateStyles({ alignment: align });
  };

  const colorPalette = [
    { name: 'Default Dark', value: '#0f172a' },
    { name: 'Navy Blue', value: '#1e3a8a' },
    { name: 'Crimson Red', value: '#991b1b' },
    { name: 'Forest Green', value: '#166534' },
    { name: 'Charcoal', value: '#334155' },
    { name: 'Purple', value: '#6b21a8' }
  ];

  const highlightPalette = [
    { name: 'None', value: 'transparent' },
    { name: 'Yellow', value: '#fef08a' },
    { name: 'Green', value: '#bbf7d0' },
    { name: 'Cyan', value: '#a5f3fc' },
    { name: 'Pink', value: '#fbcfe8' },
    { name: 'Orange', value: '#fed7aa' }
  ];

  return (
    <div className="bg-slate-900 border-b border-slate-800 text-slate-200 px-3 py-1.5 flex flex-wrap items-center gap-2 select-none text-xs z-30 shadow-md">
      {/* 1. History Controls */}
      <div className="flex items-center space-x-0.5 border-r border-slate-800 pr-2">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
          className="p-1.5 rounded hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent text-slate-300 hover:text-white transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo (Ctrl+Y)"
          className="p-1.5 rounded hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent text-slate-300 hover:text-white transition-colors"
        >
          <RotateCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 2. Heading / Style Selector */}
      <div className="relative border-r border-slate-800 pr-2">
        <button
          onClick={() => setShowHeadingMenu(prev => !prev)}
          className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-800 text-slate-200 text-xs border border-slate-700/60"
        >
          <Type className="w-3.5 h-3.5 text-blue-400" />
          <span>Styles</span>
          <ChevronDown className="w-3 h-3 text-slate-400" />
        </button>
        {showHeadingMenu && (
          <div className="absolute top-full left-0 mt-1 w-44 bg-slate-900 border border-slate-700 rounded-md shadow-2xl py-1 z-50 text-slate-200">
            <button
              onClick={() => {
                onUpdateStyles({ fontSize: 11, isBold: false });
                setShowHeadingMenu(false);
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center gap-2"
            >
              <Type className="w-3.5 h-3.5" />
              <span>Normal Body</span>
            </button>
            <button
              onClick={() => {
                onUpdateStyles({ heading1Size: 18, headingCase: 'uppercase' });
                setShowHeadingMenu(false);
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center gap-2 font-bold"
            >
              <Heading1 className="w-3.5 h-3.5 text-blue-400" />
              <span>Heading 1 (18pt)</span>
            </button>
            <button
              onClick={() => {
                onUpdateStyles({ heading2Size: 14 });
                setShowHeadingMenu(false);
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center gap-2 font-semibold"
            >
              <Heading2 className="w-3.5 h-3.5 text-blue-400" />
              <span>Heading 2 (14pt)</span>
            </button>
            <button
              onClick={() => {
                onUpdateStyles({ heading3Size: 12 });
                setShowHeadingMenu(false);
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center gap-2 font-medium"
            >
              <Heading3 className="w-3.5 h-3.5 text-blue-400" />
              <span>Heading 3 (12pt)</span>
            </button>
          </div>
        )}
      </div>

      {/* 3. Font Family Selector */}
      <div className="flex items-center border-r border-slate-800 pr-2">
        <select
          value={currentStyles.fontFamily}
          onChange={(e) => onUpdateStyles({ fontFamily: e.target.value as any })}
          className="bg-slate-800/90 text-slate-200 text-xs rounded border border-slate-700/80 px-2 py-1 focus:outline-none focus:border-blue-500 cursor-pointer"
        >
          {fontOptions.map(font => (
            <option key={font} value={font} className="bg-slate-900 text-slate-200">
              {font}
            </option>
          ))}
        </select>
      </div>

      {/* 4. Font Size Controls */}
      <div className="flex items-center space-x-1 border-r border-slate-800 pr-2">
        <button
          onClick={() => handleFontSizeChange(-1)}
          title="Decrease Font Size"
          className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-800 text-slate-300 font-bold hover:text-white"
        >
          -
        </button>
        <span className="w-7 text-center font-mono font-semibold text-xs text-blue-400">
          {fontSize}
        </span>
        <button
          onClick={() => handleFontSizeChange(1)}
          title="Increase Font Size"
          className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-800 text-slate-300 font-bold hover:text-white"
        >
          +
        </button>
      </div>

      {/* 5. Inline Formatting: Bold, Italic, Underline, Strikethrough */}
      <div className="flex items-center space-x-0.5 border-r border-slate-800 pr-2">
        <button
          onClick={() => onUpdateStyles({ isBold: !isBold })}
          title="Bold (Ctrl+B)"
          className={`p-1.5 rounded transition-colors ${
            isBold ? 'bg-blue-600 text-white font-bold' : 'hover:bg-slate-800 text-slate-300'
          }`}
        >
          <Bold className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onUpdateStyles({ isItalic: !isItalic })}
          title="Italic (Ctrl+I)"
          className={`p-1.5 rounded transition-colors ${
            isItalic ? 'bg-blue-600 text-white italic' : 'hover:bg-slate-800 text-slate-300'
          }`}
        >
          <Italic className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onUpdateStyles({ isUnderline: !isUnderline })}
          title="Underline (Ctrl+U)"
          className={`p-1.5 rounded transition-colors ${
            isUnderline ? 'bg-blue-600 text-white underline' : 'hover:bg-slate-800 text-slate-300'
          }`}
        >
          <Underline className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onUpdateStyles({ isStrikethrough: !isStrikethrough })}
          title="Strikethrough"
          className={`p-1.5 rounded transition-colors ${
            isStrikethrough ? 'bg-blue-600 text-white line-through' : 'hover:bg-slate-800 text-slate-300'
          }`}
        >
          <Strikethrough className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => {
            const nextCase: 'uppercase' | 'capitalize' | 'none' = 
              currentStyles.headingCase === 'uppercase' ? 'capitalize' : 
              currentStyles.headingCase === 'capitalize' ? 'none' : 'uppercase';
            onUpdateStyles({ headingCase: nextCase });
          }}
          title={`Heading Case: ${currentStyles.headingCase || 'uppercase'}`}
          className={`p-1.5 rounded transition-colors ${
            currentStyles.headingCase === 'uppercase' ? 'bg-blue-900/60 text-blue-300' : 'hover:bg-slate-800 text-slate-300'
          }`}
        >
          <CaseUpper className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => {
            onUpdateStyles({
              isBold: false,
              isItalic: false,
              isUnderline: false,
              isStrikethrough: false,
              textColor: undefined,
              highlightColor: undefined
            });
          }}
          title="Clear Inline Formatting"
          className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <Eraser className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 6. Text & Highlight Colors */}
      <div className="flex items-center space-x-1 border-r border-slate-800 pr-2 relative">
        {/* Text Color Picker */}
        <div className="relative">
          <button
            onClick={() => {
              setShowColorPicker(prev => !prev);
              setShowHighlightPicker(false);
            }}
            title="Text Color"
            className="p-1.5 rounded hover:bg-slate-800 flex items-center gap-1 text-slate-300"
          >
            <Palette className="w-3.5 h-3.5 text-blue-400" />
            <span 
              className="w-2.5 h-2.5 rounded-full border border-slate-600 inline-block" 
              style={{ backgroundColor: currentStyles.textColor || '#0f172a' }}
            />
          </button>
          {showColorPicker && (
            <div className="absolute top-full left-0 mt-1 p-2 bg-slate-900 border border-slate-700 rounded-md shadow-2xl flex gap-1.5 z-50">
              {colorPalette.map(c => (
                <button
                  key={c.value}
                  onClick={() => {
                    onUpdateStyles({ textColor: c.value });
                    setShowColorPicker(false);
                  }}
                  title={c.name}
                  className="w-5 h-5 rounded-full border border-slate-600 hover:scale-110 transition-transform"
                  style={{ backgroundColor: c.value }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Highlight Color Picker */}
        <div className="relative">
          <button
            onClick={() => {
              setShowHighlightPicker(prev => !prev);
              setShowColorPicker(false);
            }}
            title="Text Highlight Color"
            className="p-1.5 rounded hover:bg-slate-800 flex items-center gap-1 text-slate-300"
          >
            <Highlighter className="w-3.5 h-3.5 text-amber-400" />
            <span 
              className="w-2.5 h-2.5 rounded-sm border border-slate-600 inline-block" 
              style={{ backgroundColor: currentStyles.highlightColor || 'transparent' }}
            />
          </button>
          {showHighlightPicker && (
            <div className="absolute top-full left-0 mt-1 p-2 bg-slate-900 border border-slate-700 rounded-md shadow-2xl flex gap-1.5 z-50">
              {highlightPalette.map(c => (
                <button
                  key={c.value}
                  onClick={() => {
                    onUpdateStyles({ highlightColor: c.value === 'transparent' ? undefined : c.value });
                    setShowHighlightPicker(false);
                  }}
                  title={c.name}
                  className="w-5 h-5 rounded-sm border border-slate-600 hover:scale-110 transition-transform"
                  style={{ backgroundColor: c.value === 'transparent' ? '#334155' : c.value }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 7. Alignment Buttons */}
      <div className="flex items-center space-x-0.5 border-r border-slate-800 pr-2">
        <button
          onClick={() => handleAlign('left')}
          title="Align Left"
          className={`p-1.5 rounded transition-colors ${
            alignment === 'left' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 text-slate-300'
          }`}
        >
          <AlignLeft className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => handleAlign('center')}
          title="Align Center"
          className={`p-1.5 rounded transition-colors ${
            alignment === 'center' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 text-slate-300'
          }`}
        >
          <AlignCenter className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => handleAlign('right')}
          title="Align Right"
          className={`p-1.5 rounded transition-colors ${
            alignment === 'right' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 text-slate-300'
          }`}
        >
          <AlignRight className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => handleAlign('justify')}
          title="Justify"
          className={`p-1.5 rounded transition-colors ${
            alignment === 'justify' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 text-slate-300'
          }`}
        >
          <AlignJustify className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 8. Line Spacing */}
      <div className="flex items-center border-r border-slate-800 pr-2">
        <select
          value={currentStyles.lineHeight || 1.5}
          onChange={(e) => onUpdateStyles({ lineHeight: parseFloat(e.target.value) })}
          title="Line Spacing"
          className="bg-slate-800/90 text-slate-200 text-xs rounded border border-slate-700/80 px-2 py-1 focus:outline-none focus:border-blue-500 cursor-pointer"
        >
          <option value="1.0">1.0 Single</option>
          <option value="1.15">1.15 Normal</option>
          <option value="1.5">1.5 Legal</option>
          <option value="2.0">2.0 Double</option>
        </select>
      </div>

      {/* 9. Insert Tools */}
      <div className="flex items-center space-x-1 border-r border-slate-800 pr-2">
        <button
          onClick={onAddClause}
          title="Insert New Clause"
          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white flex items-center gap-1"
        >
          <Plus className="w-3 h-3 text-emerald-400" />
          <span>Clause</span>
        </button>
        <button
          onClick={onOpenInsertTable}
          title="Insert Data Table"
          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white flex items-center gap-1"
        >
          <TableIcon className="w-3 h-3 text-emerald-400" />
          <span>Table</span>
        </button>
        <button
          onClick={onOpenInsertChart}
          title="Insert Chart Visual"
          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white flex items-center gap-1"
        >
          <PieChart className="w-3 h-3 text-amber-400" />
          <span>Chart</span>
        </button>
        <button
          onClick={onOpenInsertImage}
          title="Insert Brand Artwork / Image"
          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white flex items-center gap-1"
        >
          <ImageIcon className="w-3 h-3 text-purple-400" />
          <span>Image</span>
        </button>
        {onOpenClauseLibrary && (
          <button
            onClick={onOpenClauseLibrary}
            title="Browse & Insert Standard Legal & Music Clauses"
            className="px-2 py-1 rounded bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-800/60 text-emerald-300 hover:text-white flex items-center gap-1 font-medium"
          >
            <BookOpen className="w-3 h-3 text-emerald-400" />
            <span>Clause Library</span>
          </button>
        )}
      </div>

      {/* 10. Document Search & Redaction Quick Triggers */}
      <div className="flex items-center space-x-1 border-r border-slate-800 pr-2">
        <button
          onClick={onOpenFindReplace}
          title="Find & Replace (Ctrl+F)"
          className="px-2 py-1 rounded bg-blue-950/60 hover:bg-blue-900 border border-blue-800/60 text-blue-300 hover:text-white flex items-center gap-1"
        >
          <Search className="w-3 h-3 text-blue-400" />
          <span>Find &amp; Replace</span>
        </button>
        <button
          onClick={onOpenRedaction}
          title="True Redaction Engine"
          className="px-2 py-1 rounded bg-rose-950/60 hover:bg-rose-900 border border-rose-800/60 text-rose-300 hover:text-white flex items-center gap-1"
        >
          <ShieldAlert className="w-3 h-3 text-rose-400" />
          <span>Redact</span>
        </button>
      </div>

      {/* 11. Watermark & Layout Toggle */}
      <div className="flex items-center space-x-1">
        <button
          onClick={() => {
            if (onOpenWatermarkCustomizer) {
              onOpenWatermarkCustomizer();
            } else {
              const currentWatermark = document.pageConfig.watermarkText;
              const nextWatermark = !currentWatermark 
                ? 'CONFIDENTIAL' 
                : currentWatermark === 'CONFIDENTIAL' 
                ? 'DRAFT' 
                : undefined;
              onUpdatePageConfig({ watermarkText: nextWatermark });
            }
          }}
          title="Customize Document Watermark"
          className={`px-2 py-1 rounded text-xs border transition-colors ${
            document.pageConfig.watermarkText
              ? 'bg-amber-950/60 border-amber-800/80 text-amber-300'
              : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
          }`}
        >
          Watermark: {document.pageConfig.watermarkText || 'None'}
        </button>

        <button
          onClick={() => {
            const nextOrientation = document.pageConfig.orientation === 'portrait' ? 'landscape' : 'portrait';
            onUpdatePageConfig({ orientation: nextOrientation });
          }}
          title="Toggle Portrait / Landscape"
          className="px-2 py-1 rounded text-xs bg-slate-800/60 border border-slate-700/60 text-slate-300 hover:text-white"
        >
          {document.pageConfig.orientation === 'portrait' ? '📄 Portrait' : '📃 Landscape'}
        </button>

        {onOpenReadability && (
          <button
            onClick={onOpenReadability}
            title="Reading Budget & Metrics"
            className="p-1.5 rounded hover:bg-slate-800 text-blue-400 hover:text-white"
          >
            <BarChart3 className="w-3.5 h-3.5" />
          </button>
        )}

        <button
          onClick={onOpenMetadata}
          title="Document Properties"
          className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
        >
          <Sliders className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
