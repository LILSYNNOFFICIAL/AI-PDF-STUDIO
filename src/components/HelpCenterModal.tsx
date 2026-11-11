import React, { useMemo, useState } from 'react';
import { BookOpen, FileText, PenTool, Search, Sparkles, X } from 'lucide-react';

interface HelpCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HELP_TOPICS = [
  { category: 'Getting started', title: 'Create your first document', body: 'Choose Templates to browse the catalog, or start with a blank document or an AI prompt. When you choose a standard template, enter the agreement type or document title, select a visual theme, then create the document. The LIL SYNN theme defaults music templates to Music Agreement; other templates retain their own editable title.' },
  { category: 'Getting started', title: 'Replace template placeholders', body: 'Search the document for bracketed values such as [PARTY A LEGAL NAME], [EFFECTIVE DATE], [TOTAL AMOUNT], and [GOVERNING LAW]. Replace each placeholder with the facts agreed by the parties. Remove schedules and fields that do not apply.' },
  { category: 'Editing', title: 'Edit any document wording', body: 'Click into the title, cover fields, cover author label and date, section headings, body text, or clause text and make your changes. Select text to copy, replace, or send it to an AI quick action. Use Undo and Redo if a change is not what you wanted.' },
  { category: 'Editing', title: 'Use right-click actions', body: 'Right-click a text selection, section, clause, image, table, signature block, or blank document canvas. The menu changes based on the target. The blank canvas menu includes document-level actions such as adding a section, inserting an image or signature/date block, changing page setup, and opening design controls.' },
  { category: 'AI assistant', title: 'Ask for outcomes, not command names', body: 'Describe what you want in ordinary language. Examples: “make the headings more professional”, “move payment after scope”, “remove the unused clause”, “add a date and signature area”, or “make this page landscape”. Include a section title or nearby wording when a target could be unclear.' },
  { category: 'AI assistant', title: 'Review AI changes', body: 'The assistant applies structured edits to the current document. Read the change summary, inspect the affected sections, and use Undo if the result is not right. Ask for a targeted correction rather than redoing unrelated parts.' },
  { category: 'Signatures', title: 'Insert a signature and date block', body: 'Select text containing labeled lines such as Date: ____, Name: _____, or Capacity: ____. Choose Insert Signature to populate editable fields. If you have not selected text, the tool starts with Date, Name, Extra field 1, Extra field 2, and Signature. Rename, add, edit, or remove fields before inserting.' },
  { category: 'Signatures', title: 'Choose a signature method', body: 'Use a printable blank line for signing on paper, a typed signature for a typed name, or the drawing pad for a drawn signature. Confirm the correct signatory, label, and date fields before insertion.' },
  { category: 'Design and PDF', title: 'Change the visual theme', body: 'Open Document Design to adjust the cover, page colors, typography, section headings, tables, signatures, headers, and footers. Themes change presentation, not the legal wording. Preview the PDF after major layout changes.' },
  { category: 'Design and PDF', title: 'Export and check your PDF', body: 'Open PDF Preview, inspect page breaks, table widths, signatures, images, and text clipping, then export or print. Run the quality audit to identify structural, formatting, pagination, or reference issues before sharing.' },
  { category: 'Import and export', title: 'Import and export documents', body: 'Use File to import supported text or structured document data and to export PDF, JSON, Markdown, or plain text. Keep a JSON export when you need a portable editable document snapshot.' },
  { category: 'Important', title: 'Legal review and document safety', body: 'Templates and AI-generated clauses are drafting aids, not legal advice. Check every name, amount, date, right, obligation, jurisdiction, notice address, and attachment. Have a qualified professional review high-stakes or jurisdiction-specific documents before signing.' }
];

export const HelpCenterModal: React.FC<HelpCenterModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const topics = useMemo(() => {
    const value = query.trim().toLowerCase();
    return HELP_TOPICS.filter(topic => !value || [topic.category, topic.title, topic.body].join(' ').toLowerCase().includes(value));
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/80 p-3 backdrop-blur-md" role="dialog" aria-modal="true" aria-labelledby="help-center-title" onKeyDown={event => { if (event.key === 'Escape') onClose(); }}>
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-700 bg-[#0b0f16] text-slate-100 shadow-2xl">
        <header className="flex items-center justify-between border-b border-slate-800 bg-[#101722] px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-400/25 bg-blue-500/10"><BookOpen className="h-5 w-5 text-blue-300" /></div>
            <div><h2 id="help-center-title" className="text-base font-semibold">AI PDF Studio Help Center</h2><p className="mt-0.5 text-[11px] text-slate-400">Simple, practical guides for creating and editing documents.</p></div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close help center" className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"><X className="h-4 w-4" /></button>
        </header>
        <div className="border-b border-slate-800 p-4">
          <div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search help topics..." aria-label="Search help topics" className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2.5 pl-9 pr-3 text-xs outline-none focus:border-blue-500" /></div>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3"><FileText className="mb-2 h-4 w-4 text-blue-300" /><div className="text-[11px] font-semibold">Create documents</div><p className="mt-1 text-[10px] text-slate-400">Templates, placeholders, imports and exports.</p></div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3"><Sparkles className="mb-2 h-4 w-4 text-amber-300" /><div className="text-[11px] font-semibold">Work with AI</div><p className="mt-1 text-[10px] text-slate-400">Describe changes in plain language.</p></div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3"><PenTool className="mb-2 h-4 w-4 text-emerald-300" /><div className="text-[11px] font-semibold">Sign and export</div><p className="mt-1 text-[10px] text-slate-400">Customize signature fields and check PDFs.</p></div>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
          {topics.length ? <div className="grid grid-cols-1 gap-3 md:grid-cols-2">{topics.map(topic => <article key={topic.title} className="rounded-xl border border-slate-800 bg-[#101722] p-4"><div className="mb-2 text-[9px] font-bold uppercase tracking-[0.16em] text-blue-300">{topic.category}</div><h3 className="text-xs font-semibold text-slate-100">{topic.title}</h3><p className="mt-2 text-[11px] leading-relaxed text-slate-400">{topic.body}</p></article>)}</div> : <div className="py-12 text-center text-xs text-slate-500">No help topics match that search.</div>}
        </div>
        <footer className="border-t border-slate-800 px-5 py-3 text-[10px] leading-relaxed text-slate-500">Tip: Right-click the document canvas or an individual object to discover actions. Always review the exported PDF and verify legal terms before signing.</footer>
      </div>
    </div>
  );
};
