import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Sparkles, 
  Bot, 
  User, 
  CheckCircle2, 
  Clock, 
  RotateCcw, 
  Paperclip, 
  FileText, 
  Zap, 
  Layers, 
  ShieldCheck,
  ChevronRight,
  RefreshCw,
  Sliders,
  ChevronDown,
  Info
} from 'lucide-react';
import { 
  DocumentModel, 
  AIPersona, 
  ExecutionPlanStep, 
  ExecutionResultSummary 
} from '../types/document';
import { PERSONA_LABELS } from './Navbar';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  plan?: ExecutionPlanStep[];
  summary?: ExecutionResultSummary;
  isProcessing?: boolean;
}

interface AIChatOrchestratorProps {
  document: DocumentModel;
  persona: AIPersona;
  messages: ChatMessage[];
  isOrchestrating: boolean;
  onSendMessage: (instruction: string) => void;
  onRollbackToVersion: (versionNumber: number) => void;
  onRunAudit: () => void;
}

const QUICK_PROMPTS = [
  'Merge Sections 2 and 3 into unified Intellectual Property section',
  'Reorganize document: definitions first, financial together, termination at end',
  'Apply Garamond 12pt with 16pt uppercase bold headings',
  'Split Section 2 into Ownership and Commercial Licensing',
  'Add Appendix B listing registered Copyrights and ISRC codes',
  'Undo last modification'
];

export const AIChatOrchestrator: React.FC<AIChatOrchestratorProps> = ({
  document,
  persona,
  messages,
  isOrchestrating,
  onSendMessage,
  onRollbackToVersion,
  onRunAudit
}) => {
  const [inputText, setInputText] = useState('');
  const [showQuickPrompts, setShowQuickPrompts] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOrchestrating]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isOrchestrating) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  return (
    <aside className="desktop-ai-panel w-96 bg-slate-900 border-l border-slate-800 flex flex-col h-full select-none shrink-0 text-slate-300">
      {/* Header with Active Persona */}
      <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-sm">
            {PERSONA_LABELS[persona].icon}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-200">
                {PERSONA_LABELS[persona].title}
              </span>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1 rounded">
                Orchestrator Active
              </span>
            </div>
            <p className="text-[10px] text-slate-500 truncate max-w-[200px]">
              {PERSONA_LABELS[persona].subtitle}
            </p>
          </div>
        </div>

        <button
          onClick={onRunAudit}
          title="Run Integrity Audit"
          aria-label="Run Integrity Audit"
          className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-emerald-400 transition-colors"
        >
          <ShieldCheck className="w-4 h-4" />
        </button>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4 text-xs">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            {/* Sender Label */}
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mb-1 px-1">
              {msg.sender === 'user' ? (
                <>
                  <span>You</span>
                  <User className="w-3 h-3 text-slate-400" />
                </>
              ) : (
                <>
                  <Bot className="w-3 h-3 text-blue-400" />
                  <span>AI Document Orchestrator</span>
                </>
              )}
              <span>•</span>
              <span>{msg.timestamp}</span>
            </div>

            {/* Bubble */}
            <div className={`p-3 rounded-lg max-w-[95%] leading-relaxed ${
              msg.sender === 'user' 
                ? 'bg-blue-600 text-white rounded-tr-none' 
                : 'bg-slate-800/90 text-slate-200 border border-slate-700/80 rounded-tl-none'
            }`}>
              <p className="whitespace-pre-wrap">{msg.text}</p>

              {/* Execution Plan View */}
              {msg.plan && msg.plan.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-slate-700/60 space-y-1.5">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-blue-400 flex items-center gap-1">
                    <Layers className="w-3 h-3" />
                    <span>Orchestrated Execution Pipeline</span>
                  </div>
                  {msg.plan.map((step) => (
                    <div key={step.id} className="flex items-center gap-2 text-[11px] text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{step.title}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Change Transparency Summary Card */}
              {msg.summary && (
                <div className="mt-3 pt-2.5 border-t border-slate-700/60 bg-slate-900/80 rounded p-2.5 border border-slate-700/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-white text-[11px] flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                      {msg.summary.operationTitle}
                    </span>
                    <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 px-1 py-0.5 rounded">
                      v{msg.summary.versionCreated}
                    </span>
                  </div>

                  <ul className="space-y-1 text-[11px] text-slate-300 mb-2.5">
                    {msg.summary.details.map((d, dIdx) => (
                      <li key={dIdx} className="flex items-start gap-1.5">
                        <span className="text-blue-400 shrink-0">•</span>
                        <span>{d}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Verifications Checklist */}
                  <div className="pt-2 border-t border-slate-800 space-y-1">
                    <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      Integrity Verifications
                    </div>
                    {msg.summary.verifications.map((v, vIdx) => (
                      <div key={vIdx} className="flex items-center justify-between text-[10px]">
                        <span className="text-slate-300">{v.name}</span>
                        <span className="text-emerald-400 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Passed</span>
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Immediate Rollback Button */}
                  <div className="mt-2.5 pt-2 border-t border-slate-800 flex justify-end">
                    <button
                      onClick={() => onRollbackToVersion(msg.summary!.versionCreated - 1)}
                      className="text-[10px] text-amber-400 hover:text-amber-300 flex items-center gap-1 hover:underline"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Rollback this change</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Processing Indicator */}
        {isOrchestrating && (
          <div className="flex items-center gap-2 p-2.5 bg-blue-950/30 border border-blue-500/30 rounded-lg text-blue-300 text-xs animate-pulse">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400" />
            <span>Analyzing document structure & executing operations...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="p-2 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center justify-between mb-1.5 px-1">
          <span className="text-[10px] font-semibold uppercase text-slate-500 tracking-wider">
            Document Directives
          </span>
          <button 
            onClick={() => setShowQuickPrompts(!showQuickPrompts)}
            className="text-[10px] text-slate-500 hover:text-slate-300"
          >
            {showQuickPrompts ? 'Hide' : 'Show'}
          </button>
        </div>

        {showQuickPrompts && (
          <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
            {QUICK_PROMPTS.map((prompt, pIdx) => (
              <button
                key={pIdx}
                onClick={() => onSendMessage(prompt)}
                disabled={isOrchestrating}
                className="text-[10px] bg-slate-800/80 hover:bg-blue-900/40 hover:border-blue-500/50 border border-slate-700/60 rounded px-2 py-1 text-slate-300 text-left transition-colors truncate max-w-full"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Input Composer */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-slate-800 bg-slate-950 flex flex-col gap-2">
        <div className="relative">
          <textarea
            rows={2}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder={`Instruct ${PERSONA_LABELS[persona].title}... (e.g. "Merge Sections 2 & 3", "Apply Garamond 12pt")`}
            className="w-full bg-slate-900 text-slate-200 placeholder-slate-500 text-xs rounded-lg p-2.5 pr-8 border border-slate-700/80 focus:border-blue-500 focus:outline-none resize-none"
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[10px] text-slate-500">
            Press <kbd className="font-mono bg-slate-800 px-1 py-0.5 rounded text-slate-400">Enter</kbd> to execute
          </span>
          <button
            type="submit"
            disabled={!inputText.trim() || isOrchestrating}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white px-3 py-1.5 rounded-md text-xs font-medium shadow-sm transition-colors"
          >
            <span>Execute</span>
            <Send className="w-3 h-3" />
          </button>
        </div>
      </form>
    </aside>
  );
};
