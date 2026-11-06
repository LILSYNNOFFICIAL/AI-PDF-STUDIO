import React from 'react';
import { Clock, X, BarChart3, BookOpen, AlertCircle, CheckCircle2, FileText, Compass } from 'lucide-react';
import { DocumentModel } from '../types/document';

interface ReadabilityInspectorModalProps {
  document: DocumentModel;
  isOpen: boolean;
  onClose: () => void;
}

export const ReadabilityInspectorModal: React.FC<ReadabilityInspectorModalProps> = ({
  document,
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  // Extract all document text
  let fullText = document.title + '\n';
  let totalClausesCount = 0;
  const sectionMetrics: { title: string; num: string; words: number }[] = [];

  document.sections.forEach(s => {
    let secText = s.title + ' ' + (s.content || '');
    s.clauses?.forEach(c => {
      totalClausesCount++;
      secText += ' ' + (c.heading || '') + ' ' + c.content;
    });
    fullText += ' ' + secText;
    const sWords = secText.trim().split(/\s+/).filter(Boolean).length;
    sectionMetrics.push({
      title: s.title,
      num: s.sectionNumber,
      words: sWords
    });
  });

  const words = fullText.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const characterCount = fullText.length;
  const sentences = fullText.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const sentenceCount = sentences.length || 1;

  const avgWordsPerSentence = Math.round((wordCount / sentenceCount) * 10) / 10;
  
  // Reading time at standard 200 WPM & Legal Review time at 140 WPM
  const generalReadingMinutes = Math.max(1, Math.round(wordCount / 200));
  const legalReviewMinutes = Math.max(1, Math.round(wordCount / 140));
  const spokenMinutes = Math.max(1, Math.round(wordCount / 130));

  // Estimated printed pages (typical legal agreement ~400 words per page with formatting)
  const estimatedPages = Math.max(1, Math.ceil(wordCount / 400));

  // Longest section
  const longestSection = [...sectionMetrics].sort((a, b) => b.words - a.words)[0];
  const shortestSection = [...sectionMetrics].sort((a, b) => a.words - b.words)[0];

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-xl shadow-2xl text-slate-100 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-semibold tracking-wide">Document Metrics &amp; Reading Budget</h2>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          {/* Quantitative Tiles */}
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-500 block text-[10px] uppercase">Words</span>
              <span className="text-base font-bold text-white font-mono">{wordCount.toLocaleString()}</span>
            </div>
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-500 block text-[10px] uppercase">Characters</span>
              <span className="text-base font-bold text-blue-400 font-mono">{characterCount.toLocaleString()}</span>
            </div>
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-500 block text-[10px] uppercase">Sentences</span>
              <span className="text-base font-bold text-emerald-400 font-mono">{sentenceCount}</span>
            </div>
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-500 block text-[10px] uppercase">Est. Pages</span>
              <span className="text-base font-bold text-amber-400 font-mono">{estimatedPages}</span>
            </div>
          </div>

          {/* Time & Readability Estimates */}
          <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                Legal Review Time (140 wpm):
              </span>
              <span className="font-semibold text-slate-200 font-mono">~{legalReviewMinutes} minutes</span>
            </div>

            <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
              <span className="text-slate-400 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                Casual Reading Time (200 wpm):
              </span>
              <span className="font-semibold text-slate-200 font-mono">~{generalReadingMinutes} minutes</span>
            </div>

            <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-purple-400" />
                Spoken Recitation / Presentation (130 wpm):
              </span>
              <span className="font-semibold text-slate-200 font-mono">~{spokenMinutes} minutes</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">Average Sentence Length:</span>
              <span className="font-semibold text-slate-200 font-mono">{avgWordsPerSentence} words/sentence</span>
            </div>
          </div>

          {/* Structural Balance */}
          <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-2">
            <span className="text-slate-400 font-semibold block text-[11px] uppercase tracking-wider">
              Section Density &amp; Hierarchy
            </span>
            {longestSection && (
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400 truncate max-w-[280px]">
                  Longest: <strong className="text-slate-200">{longestSection.num} {longestSection.title}</strong>
                </span>
                <span className="text-amber-400 font-mono font-semibold">{longestSection.words} words</span>
              </div>
            )}
            {shortestSection && (
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400 truncate max-w-[280px]">
                  Shortest: <strong className="text-slate-200">{shortestSection.num} {shortestSection.title}</strong>
                </span>
                <span className="text-blue-400 font-mono font-semibold">{shortestSection.words} words</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-end text-xs">
          <button 
            onClick={onClose}
            className="px-4 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
