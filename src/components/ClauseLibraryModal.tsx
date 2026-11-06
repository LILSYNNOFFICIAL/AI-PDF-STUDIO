import React, { useState } from 'react';
import { 
  BookOpen, 
  X, 
  Plus, 
  Check, 
  Search, 
  Sparkles, 
  Music, 
  ShieldCheck, 
  Scale, 
  FileText,
  DollarSign
} from 'lucide-react';
import { DocumentModel, Clause } from '../types/document';

interface ClauseLibraryModalProps {
  document: DocumentModel;
  isOpen: boolean;
  onClose: () => void;
  onInsertClause: (targetSectionId: string, clauseHeading: string, clauseContent: string) => void;
}

interface PresetClause {
  id: string;
  category: 'music' | 'legal' | 'financial' | 'general';
  heading: string;
  content: string;
  summary: string;
}

const PRESET_CLAUSES: PresetClause[] = [
  // Music Industry Clauses
  {
    id: 'cl_music_producer_points',
    category: 'music',
    heading: 'Producer Royalty Points & Recoupment',
    summary: 'Standard 4.0 producer streaming points with quarterly accounting',
    content: 'Producer shall receive four (4) retail producer points (equivalent to twenty percent (20.0%) of Artist Net Receipts derived from digital streaming, permanent downloads, and physical phonorecord sales), payable on a quarterly accounting schedule following the recoupment of approved recording costs.'
  },
  {
    id: 'cl_music_sample_warranty',
    category: 'music',
    heading: 'Sample Clearance & Non-Infringement Warranty',
    summary: 'Warranty that all audio stems are original or fully cleared',
    content: 'Each Party expressly warrants and covenants that all musical contributions, vocal stems, melodies, audio samples, and lyrical works provided are 100% original, do not incorporate uncleared third-party sound recordings, and do not infringe upon any statutory copyright or moral right.'
  },
  {
    id: 'cl_music_billing_credit',
    category: 'music',
    heading: 'Artist Billing, Placement & Digital Metadata',
    summary: 'Mandatory billing format on Spotify, Apple Music, and liner notes',
    content: 'Collaborator shall receive prominent featured artist billing on all releases across digital service providers, social platforms, and liner notes in the exact format: "[Primary Artist] feat. [Collaborator]", and shall be accurately credited in primary ISRC and metadata registries.'
  },
  {
    id: 'cl_music_stems_delivery',
    category: 'music',
    heading: 'Master Delivery Technical Specifications',
    summary: '24-bit 96kHz uncompressed WAV deliverables including stems',
    content: 'Deliverables shall comprise: (a) Full uncompressed stereo master audio (24-bit / 96kHz WAV); (b) Instrumental mix; (c) Acapella mix; and (d) Consolidated multitrack audio stem package with all processing tracks consolidated from zero timecode.'
  },
  {
    id: 'cl_music_nil_license',
    category: 'music',
    heading: 'Name, Image & Likeness (NIL) Promotional License',
    summary: 'Limited promotional license for single marketing & artwork',
    content: 'Collaborator hereby grants the non-exclusive, worldwide right to utilize Collaborator professional name, approved photographic likeness, and biographical resume solely in connection with the advertising, commercialization, and promotion of the Master Recording.'
  },
  {
    id: 'cl_music_blackout_window',
    category: 'music',
    heading: 'Commercial Release Blackout Window',
    summary: '30-day non-compete release window surrounding single rollout',
    content: 'To preserve commercial momentum and algorithmic playlist impact, Collaborator agrees not to release or authorize the release of any competing vocal feature or solo single for a period of thirty (30) days prior to and following the scheduled commercial release date.'
  },

  // Legal & Enforceability Boilerplate
  {
    id: 'cl_legal_severability',
    category: 'legal',
    heading: 'Severability & Blue-Penciling',
    summary: 'Preserves validity of remaining terms if any provision is struck',
    content: 'If any provision of this Agreement is held to be invalid, illegal, or unenforceable by an arbitrator or court of competent jurisdiction, such provision shall be severed or modified to the minimum extent necessary, and the remaining provisions shall continue in full legal force and effect.'
  },
  {
    id: 'cl_legal_force_majeure',
    category: 'legal',
    heading: 'Force Majeure & Suspension of Performance',
    summary: 'Excuses delay caused by acts of God, strikes, or utility collapse',
    content: 'Neither Party shall be liable for failure or delay in performing obligations hereunder if such failure arises out of acts of God, civil commotion, pandemic, labor strike, utility blackout, or government embargo beyond reasonable control, provided notice is rendered within ten (10) days.'
  },
  {
    id: 'cl_legal_entire_agreement',
    category: 'legal',
    heading: 'Entire Agreement & Full Integration',
    summary: 'Supersedes all prior discussions, drafts, and oral representations',
    content: 'This Agreement, together with all schedules and exhibits attached hereto, constitutes the entire agreement between the Parties concerning the subject matter hereof and supersedes all prior oral or written negotiations, representations, warranties, and understandings.'
  },
  {
    id: 'cl_legal_governing_law_ca',
    category: 'legal',
    heading: 'Governing Law & JAMS Arbitration (California)',
    summary: 'State of California jurisdiction with binding Los Angeles JAMS arbitration',
    content: 'This Agreement shall be governed by and construed under the laws of the State of California. Any controversy or claim arising out of or relating to this Agreement shall be resolved through final and binding arbitration administered by JAMS in Los Angeles, California before a single specialized entertainment arbitrator.'
  },
  {
    id: 'cl_legal_confidentiality',
    category: 'legal',
    heading: 'Confidentiality of Unreleased Works & Terms',
    summary: 'Three-year non-disclosure of unreleased tracks and financial splits',
    content: 'Each Party covenants to maintain the strict confidentiality of all unreleased sound recordings, musical stems, financial splits, and strategic rollout timelines. Neither Party shall distribute rough demo files or disclose economic terms to third parties without prior written consent.'
  },
  {
    id: 'cl_legal_indemnification',
    category: 'legal',
    heading: 'Mutual Indemnification & Defense Covenants',
    summary: 'Hold harmless protection against third-party claims and attorney fees',
    content: 'Each Party agrees to indemnify, defend, and hold harmless the other Party, its affiliates, licensees, and assigns from and against any and all claims, liabilities, damages, and reasonable attorney fees arising out of any material breach of representations or warranties made in this Agreement.'
  },

  // Financial & Audit
  {
    id: 'cl_fin_audit_rights',
    category: 'financial',
    heading: 'Accounting Statements & Annual Books Inspection',
    summary: 'Quarterly statement cadence with annual CPA audit rights',
    content: 'Accounting statements detailing gross receipts, statutory deductions, and net allocations shall be rendered quarterly within forty-five (45) days of quarter end. Either Party may, upon thirty (30) days written notice, cause an independent certified public accountant to inspect financial records once per calendar year.'
  },
  {
    id: 'cl_fin_late_interest',
    category: 'financial',
    heading: 'Late Disbursements & Statutory Interest',
    summary: '1.5% monthly statutory interest on overdue disbursements',
    content: 'Any undisputed royalty payment not disbursed within fifteen (15) calendar days following the due date shall accrue interest at the rate of one and one-half percent (1.5%) per month or the maximum statutory rate permitted by applicable law.'
  }
];

export const ClauseLibraryModal: React.FC<ClauseLibraryModalProps> = ({
  document,
  isOpen,
  onClose,
  onInsertClause
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'music' | 'legal' | 'financial'>('all');
  const [searchFilter, setSearchFilter] = useState('');
  const [targetSectionId, setTargetSectionId] = useState<string>(document.sections[0]?.id || '');
  const [insertedId, setInsertedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredClauses = PRESET_CLAUSES.filter(c => {
    const matchesCat = selectedCategory === 'all' || c.category === selectedCategory;
    const matchesSearch = !searchFilter || 
      c.heading.toLowerCase().includes(searchFilter.toLowerCase()) ||
      c.content.toLowerCase().includes(searchFilter.toLowerCase()) ||
      c.summary.toLowerCase().includes(searchFilter.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleInsert = (clause: PresetClause) => {
    const target = targetSectionId || document.sections[0]?.id;
    if (!target) return;
    onInsertClause(target, clause.heading, clause.content);
    setInsertedId(clause.id);
    setTimeout(() => setInsertedId(null), 1800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-3xl rounded-xl shadow-2xl text-slate-100 overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-400" />
            <div>
              <h2 className="text-sm font-semibold tracking-wide">Professional Legal Clause Library</h2>
              <p className="text-[11px] text-slate-400">Pre-vetted music industry covenants, entertainment terms, and standard boilerplate</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Toolbar: Category tabs, Target section dropdown & Search */}
        <div className="p-3 bg-slate-950/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Category Tabs */}
          <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                selectedCategory === 'all' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Clauses ({PRESET_CLAUSES.length})
            </button>
            <button
              onClick={() => setSelectedCategory('music')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1 ${
                selectedCategory === 'music' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Music className="w-3 h-3 text-emerald-400" /> Music &amp; Audio
            </button>
            <button
              onClick={() => setSelectedCategory('legal')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1 ${
                selectedCategory === 'legal' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Scale className="w-3 h-3 text-indigo-400" /> Legal Boilerplate
            </button>
            <button
              onClick={() => setSelectedCategory('financial')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1 ${
                selectedCategory === 'financial' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <DollarSign className="w-3 h-3 text-amber-400" /> Financial &amp; Audit
            </button>
          </div>

          {/* Target Section Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 text-[11px]">Insert into:</span>
            <select
              value={targetSectionId}
              onChange={(e) => setTargetSectionId(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded px-2 py-1 focus:outline-none focus:border-blue-500 max-w-[200px] truncate"
            >
              {document.sections.map(s => (
                <option key={s.id} value={s.id}>
                  {s.sectionNumber} {s.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search bar */}
        <div className="px-4 py-2 border-b border-slate-800 bg-slate-900/60">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search clause text, headings, or keywords..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full bg-slate-950 text-xs rounded-md pl-8 pr-3 py-1.5 text-slate-200 placeholder-slate-500 border border-slate-800 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Clause List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredClauses.map((clause) => {
            const isInserted = insertedId === clause.id;
            return (
              <div 
                key={clause.id}
                className="p-3.5 rounded-lg border border-slate-800 bg-slate-950/70 hover:border-slate-700 transition-all flex flex-col justify-between gap-2.5 group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-semibold text-xs text-slate-200 group-hover:text-blue-300 transition-colors">
                      {clause.heading}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono capitalize">
                      {clause.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 italic mb-2">
                    {clause.summary}
                  </p>
                  <p className="text-xs text-slate-300 bg-slate-900/80 p-2.5 rounded border border-slate-800/80 leading-relaxed font-serif">
                    {clause.content}
                  </p>
                </div>

                <div className="flex items-center justify-end">
                  <button
                    onClick={() => handleInsert(clause)}
                    disabled={isInserted}
                    className={`px-3 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition-colors ${
                      isInserted 
                        ? 'bg-emerald-600 text-white' 
                        : 'bg-blue-600 hover:bg-blue-500 text-white'
                    }`}
                  >
                    {isInserted ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Clause Inserted!</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>Insert into Selected Section</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>{filteredClauses.length} clauses available</span>
          <button 
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
