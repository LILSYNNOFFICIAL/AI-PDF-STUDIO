import React, { useState } from 'react';
import { X, Layers, ArrowRight, Check, Plus, GitMerge, FileText, Sparkles } from 'lucide-react';
import { DocumentModel, Section } from '../types/document';

interface MultiDocWorkspaceModalProps {
  primaryDoc: DocumentModel;
  isOpen: boolean;
  onClose: () => void;
  onIncorporateSections: (newSections: Section[]) => void;
}

const SAMPLE_SECONDARY_DOCS = [
  {
    id: 'doc_publishing_rider',
    title: 'Agreement B: International Publishing & Synchronization Rider',
    sections: [
      {
        id: 'sec_pub_1',
        sectionNumber: 'B.1',
        title: 'GLOBAL MECHANICAL ROYALTY COLLECTION',
        content: 'Designated publishing administrator shall collect worldwide mechanical royalties through direct affiliations with Harry Fox Agency (HFA), MCPS-PRS, SACEM, and GEMA.',
        clauses: [
          {
            id: 'cl_pub_1_1',
            clauseNumber: 'B.1.1',
            content: 'Administration fee shall not exceed 12.5% of gross global publishing revenues before disbursement.',
            orderIndex: 1
          }
        ],
        orderIndex: 1
      },
      {
        id: 'sec_pub_2',
        sectionNumber: 'B.2',
        title: 'NFT & IMMERSIVE AUDIO EXPLOITATION',
        content: 'Any cryptographic tokenization, spatial audio licensing, or virtual reality broadcast of the composition requires unanimous prior consent of both primary collaborators.',
        clauses: [
          {
            id: 'cl_pub_2_1',
            clauseNumber: 'B.2.1',
            content: 'Net revenues from Web3 or spatial media shall be allocated identically to master streaming splits (50/50).',
            orderIndex: 1
          }
        ],
        orderIndex: 2
      }
    ]
  }
];

export const MultiDocWorkspaceModal: React.FC<MultiDocWorkspaceModalProps> = ({
  primaryDoc,
  isOpen,
  onClose,
  onIncorporateSections
}) => {
  const [selectedSecDoc] = useState(SAMPLE_SECONDARY_DOCS[0]);
  const [selectedSectionIds, setSelectedSectionIds] = useState<string[]>(['sec_pub_1', 'sec_pub_2']);

  if (!isOpen) return null;

  const toggleSelect = (id: string) => {
    setSelectedSectionIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleIncorporate = () => {
    const sectionsToIncorporate: Section[] = selectedSecDoc.sections
      .filter(s => selectedSectionIds.includes(s.id))
      .map((s, idx) => ({
        id: `sec_incorp_${Date.now()}_${idx}`,
        sectionNumber: '',
        title: s.title,
        content: s.content,
        clauses: s.clauses.map(c => ({
          ...c,
          id: `cl_incorp_${Date.now()}_${c.id}`,
          sourceReference: `Imported from ${selectedSecDoc.title}`
        })),
        orderIndex: primaryDoc.sections.length + idx + 1,
        sourceReference: `Imported from ${selectedSecDoc.title}`
      }));

    onIncorporateSections(sectionsToIncorporate);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="h-14 px-4 border-b border-slate-800 flex items-center justify-between bg-slate-950 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-blue-500/20 text-blue-400 rounded-md">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-white">Multi-Document Intelligence &amp; Merging</h3>
              <p className="text-[11px] text-slate-400">
                Compare multiple agreements, extract unique provisions, and merge with source traceability
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Comparison Body */}
        <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Primary Document Column */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
                Primary Master Document
              </span>
              <span className="text-[10px] font-mono bg-blue-500/10 text-blue-300 px-1.5 py-0.5 rounded">
                Active
              </span>
            </div>
            <h4 className="font-bold text-sm text-slate-200 mb-1">{primaryDoc.title}</h4>
            <p className="text-xs text-slate-400 mb-3">{primaryDoc.sections.length} active sections</p>

            <div className="flex-1 space-y-1.5 overflow-y-auto max-h-60 pr-1">
              {primaryDoc.sections.map((s) => (
                <div key={s.id} className="p-2 bg-slate-900 border border-slate-800 rounded text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-500 text-[10px]">{s.sectionNumber}</span>
                    <span className="font-medium text-slate-300 truncate">{s.title}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Secondary Document Column */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                Secondary Source Document
              </span>
              <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-300 px-1.5 py-0.5 rounded">
                Unique Provisions
              </span>
            </div>
            <h4 className="font-bold text-sm text-slate-200 mb-1">{selectedSecDoc.title}</h4>
            <p className="text-xs text-slate-400 mb-3">Select provisions to incorporate:</p>

            <div className="flex-1 space-y-2 overflow-y-auto max-h-60 pr-1">
              {selectedSecDoc.sections.map((s) => {
                const isSelected = selectedSectionIds.includes(s.id);
                return (
                  <div 
                    key={s.id}
                    onClick={() => toggleSelect(s.id)}
                    className={`p-2.5 rounded border cursor-pointer transition-colors ${
                      isSelected 
                        ? 'bg-emerald-950/30 border-emerald-500/40' 
                        : 'bg-slate-900 border-slate-800 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-emerald-300">{s.title}</span>
                      <div className={`w-4 h-4 rounded flex items-center justify-center ${
                        isSelected ? 'bg-emerald-500 text-white' : 'border border-slate-700'
                      }`}>
                        {isSelected && <Check className="w-3 h-3" />}
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-300 line-clamp-2">{s.content}</p>
                    <div className="mt-1.5 text-[10px] text-slate-500 font-mono">
                      {s.clauses.length} clause(s) with source provenance
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="h-14 px-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <span>{selectedSectionIds.length} unique provisions ready to incorporate</span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleIncorporate}
              disabled={selectedSectionIds.length === 0}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white px-3.5 py-1.5 rounded font-medium shadow-sm"
            >
              <GitMerge className="w-3.5 h-3.5" />
              <span>Incorporate into Primary Document</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
