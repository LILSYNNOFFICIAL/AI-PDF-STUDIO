import React, { useState } from 'react';
import { 
  ChevronRight, 
  ChevronDown, 
  FileText, 
  Table as TableIcon, 
  PieChart, 
  ArrowUp, 
  ArrowDown, 
  Trash2, 
  Copy, 
  GitMerge, 
  Scissors, 
  Plus, 
  Search,
  PenTool
} from 'lucide-react';
import { DocumentModel, Section } from '../types/document';

interface DocumentOutlineProps {
  document: DocumentModel;
  activeSectionId: string | null;
  onSelectSection: (sectionId: string) => void;
  onMoveSection: (sectionId: string, direction: 'up' | 'down') => void;
  onDeleteSection: (sectionId: string) => void;
  onDuplicateSection: (sectionId: string) => void;
  onMergeWithNext: (sectionId: string) => void;
  onSplitSection: (sectionId: string) => void;
  onAddSection: () => void;
}

export const DocumentOutline: React.FC<DocumentOutlineProps> = ({
  document,
  activeSectionId,
  onSelectSection,
  onMoveSection,
  onDeleteSection,
  onDuplicateSection,
  onMergeWithNext,
  onSplitSection,
  onAddSection
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'sec_1': true,
    'sec_2': true,
    'sec_4': true
  });

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredSections = document.sections.filter(s => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return s.title.toLowerCase().includes(q) || 
           s.sectionNumber.toLowerCase().includes(q) ||
           s.clauses.some(c => c.content.toLowerCase().includes(q));
  });

  return (
    <aside className="desktop-outline-panel w-72 bg-slate-900 border-r border-slate-800 flex flex-col h-full select-none shrink-0 text-slate-300">
      {/* Header */}
      <div className="p-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-200">
            Document Outline
          </span>
        </div>
        <span className="text-[11px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono">
          {document.sections.length} sec
        </span>
      </div>

      {/* Search Input */}
      <div className="p-2.5 border-b border-slate-800">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Filter sections & clauses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 text-xs rounded-md pl-8 pr-3 py-1.5 text-slate-200 placeholder-slate-500 border border-slate-800 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Sections List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filteredSections.map((section, idx) => {
          const isActive = activeSectionId === section.id;
          const isExpanded = !!expandedSections[section.id];
          const hasTables = section.tables && section.tables.length > 0;
          const hasCharts = section.charts && section.charts.length > 0;
          const isAppendix = section.isAppendix || section.sectionNumber.includes('APPENDIX');

          return (
            <div 
              key={section.id} 
              className={`rounded-md transition-colors ${
                isActive ? 'bg-blue-900/30 border border-blue-600/40' : 'hover:bg-slate-800/60 border border-transparent'
              }`}
            >
              <div 
                onClick={() => onSelectSection(section.id)}
                className="flex items-center justify-between p-2 cursor-pointer group"
              >
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  <button
                    onClick={(e) => toggleExpand(section.id, e)}
                    className="p-0.5 text-slate-500 hover:text-slate-300"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <span className={`text-[11px] font-mono font-semibold shrink-0 ${
                    isAppendix ? 'text-purple-400' : 'text-blue-400'
                  }`}>
                    {section.sectionNumber}
                  </span>

                  <span className="text-xs font-medium text-slate-200 truncate">
                    {section.title}
                  </span>
                </div>

                {/* Badges & Reorder Controls */}
                <div className="flex items-center gap-1 shrink-0 ml-1">
                  {hasTables && (
                    <span title="Contains Data Table" className="text-emerald-400">
                      <TableIcon className="w-3 h-3" />
                    </span>
                  )}
                  {hasCharts && (
                    <span title="Contains Visual Chart" className="text-amber-400">
                      <PieChart className="w-3 h-3" />
                    </span>
                  )}

                  <div className="opacity-0 group-hover:opacity-100 flex items-center transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); onMoveSection(section.id, 'up'); }}
                      disabled={idx === 0}
                      title="Move Up"
                      className="p-1 hover:text-white disabled:opacity-20 text-slate-400"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onMoveSection(section.id, 'down'); }}
                      disabled={idx === document.sections.length - 1}
                      title="Move Down"
                      className="p-1 hover:text-white disabled:opacity-20 text-slate-400"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDuplicateSection(section.id); }}
                      title="Duplicate Section"
                      className="p-1 hover:text-blue-300 text-slate-400"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onMergeWithNext(section.id); }}
                      title="Merge With Next Section"
                      className="p-1 hover:text-blue-400 text-slate-400"
                    >
                      <GitMerge className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onSplitSection(section.id); }}
                      title="Split Section"
                      className="p-1 hover:text-amber-400 text-slate-400"
                    >
                      <Scissors className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        if (document.sections.length <= 1) {
                          alert('Document must contain at least one section.');
                          return;
                        }
                        onDeleteSection(section.id); 
                      }}
                      title="Delete Section"
                      className="p-1 hover:text-rose-400 text-rose-500/70 hover:bg-rose-950/40 rounded transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Collapsible Clauses sub-tree */}
              {isExpanded && section.clauses && section.clauses.length > 0 && (
                <div className="pl-6 pr-2 pb-2 space-y-1">
                  {section.clauses.map((clause) => (
                    <div 
                      key={clause.id}
                      className="text-[11px] text-slate-400 hover:text-slate-200 flex items-baseline gap-1.5 py-0.5 truncate cursor-pointer"
                      onClick={() => onSelectSection(section.id)}
                    >
                      <span className="font-mono text-[10px] text-slate-500 shrink-0">
                        {clause.clauseNumber}
                      </span>
                      <span className="truncate">
                        {clause.heading ? `${clause.heading}: ` : ''}{clause.content}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Execution / Signatures entry */}
        {document.signatures && (
          <div 
            onClick={() => onSelectSection('section_signatures')}
            className={`p-2 rounded-md flex items-center justify-between cursor-pointer transition-colors ${
              activeSectionId === 'section_signatures' ? 'bg-blue-900/30 border border-blue-600/40' : 'hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-2">
              <PenTool className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs font-medium text-slate-200">Signatures & Execution</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">
              {document.signatures.parties.length} parties
            </span>
          </div>
        )}
      </div>

      {/* Add Section Action Button */}
      <div className="p-2 border-t border-slate-800">
        <button
          onClick={onAddSection}
          className="w-full flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700/80 text-slate-200 py-1.5 px-3 rounded-md text-xs font-medium transition-colors"
        >
          <Plus className="w-3.5 h-3.5 text-blue-400" />
          <span>Add New Section</span>
        </button>
      </div>
    </aside>
  );
};
