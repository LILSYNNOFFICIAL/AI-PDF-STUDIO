import React, { useState } from 'react';
import { Sliders, X, Check, Droplets, Layout, Eye } from 'lucide-react';
import { DocumentModel, PageConfig } from '../types/document';

interface WatermarkCustomizerModalProps {
  document: DocumentModel;
  isOpen: boolean;
  onClose: () => void;
  onUpdatePageConfig: (pageConfig: Partial<PageConfig>) => void;
}

export const WatermarkCustomizerModal: React.FC<WatermarkCustomizerModalProps> = ({
  document,
  isOpen,
  onClose,
  onUpdatePageConfig
}) => {
  const [watermarkText, setWatermarkText] = useState(document.pageConfig.watermarkText || '');
  const [watermarkOpacity, setWatermarkOpacity] = useState(document.pageConfig.watermarkOpacity || 0.05);
  const [selectedMargin, setSelectedMargin] = useState<string>(() => {
    const top = document.pageConfig.margins.top;
    if (top <= 20) return 'compact';
    if (top >= 30) return 'wide';
    return 'normal';
  });

  if (!isOpen) return null;

  const presets = [
    'CONFIDENTIAL',
    'DRAFT',
    'ATTORNEY-CLIENT PRIVILEGED',
    'PRE-RELEASE MASTER',
    'DO NOT DISTRIBUTE',
    'FOR REVIEW ONLY'
  ];

  const handleApply = () => {
    let margins = document.pageConfig.margins;
    if (selectedMargin === 'compact') {
      margins = { top: 19.05, bottom: 19.05, left: 19.05, right: 19.05 };
    } else if (selectedMargin === 'wide') {
      margins = { top: 31.75, bottom: 31.75, left: 31.75, right: 31.75 };
    } else if (selectedMargin === 'normal') {
      margins = { top: 25.4, bottom: 25.4, left: 25.4, right: 25.4 };
    }

    onUpdatePageConfig({
      watermarkText: watermarkText.trim() ? watermarkText.trim() : undefined,
      watermarkOpacity,
      margins
    });
    onClose();
  };

  const handleClearWatermark = () => {
    setWatermarkText('');
    onUpdatePageConfig({ watermarkText: undefined });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-xl shadow-2xl text-slate-100 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-2">
            <Droplets className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-semibold tracking-wide">Watermark &amp; Page Margins</h2>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs">
          {/* Watermark Text Input */}
          <div>
            <label className="block text-slate-300 font-medium mb-1.5">Watermark Text</label>
            <input
              type="text"
              placeholder="e.g. CONFIDENTIAL, DRAFT, STRICTLY PRIVATE"
              value={watermarkText}
              onChange={(e) => setWatermarkText(e.target.value.toUpperCase())}
              className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-slate-200 font-bold tracking-wider placeholder-slate-600 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Quick Presets */}
          <div>
            <span className="text-[11px] text-slate-400 block mb-1.5">Quick Presets:</span>
            <div className="flex flex-wrap gap-1.5">
              {presets.map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setWatermarkText(p)}
                  className={`text-[10px] px-2 py-1 rounded border transition-colors ${
                    watermarkText === p 
                      ? 'bg-amber-600 border-amber-500 text-white font-semibold' 
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Opacity Slider */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-slate-300 font-medium">Watermark Opacity</label>
              <span className="text-amber-400 font-mono">{Math.round(watermarkOpacity * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.02"
              max="0.25"
              step="0.01"
              value={watermarkOpacity}
              onChange={(e) => setWatermarkOpacity(parseFloat(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
              <span>Subtle (2%)</span>
              <span>Medium (10%)</span>
              <span>High Contrast (25%)</span>
            </div>
          </div>

          {/* Page Margins Preset */}
          <div className="pt-2 border-t border-slate-800">
            <label className="block text-slate-300 font-medium mb-1.5">Page Margins Preset</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSelectedMargin('compact')}
                className={`p-2 rounded-lg border text-left transition-all ${
                  selectedMargin === 'compact'
                    ? 'border-blue-500 bg-blue-950/40 text-blue-200'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-semibold text-[11px]">Compact</div>
                <div className="text-[10px] text-slate-500">0.75" (19mm)</div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMargin('normal')}
                className={`p-2 rounded-lg border text-left transition-all ${
                  selectedMargin === 'normal'
                    ? 'border-blue-500 bg-blue-950/40 text-blue-200'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-semibold text-[11px]">Standard</div>
                <div className="text-[10px] text-slate-500">1.0" (25.4mm)</div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMargin('wide')}
                className={`p-2 rounded-lg border text-left transition-all ${
                  selectedMargin === 'wide'
                    ? 'border-blue-500 bg-blue-950/40 text-blue-200'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-semibold text-[11px]">Wide</div>
                <div className="text-[10px] text-slate-500">1.25" (31.7mm)</div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs">
          <button
            onClick={handleClearWatermark}
            className="text-rose-400 hover:text-rose-300 transition-colors"
          >
            Remove Watermark
          </button>
          <div className="flex items-center gap-2">
            <button 
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleApply}
              className="px-4 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors"
            >
              Apply Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
