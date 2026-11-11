import React, { useEffect, useMemo, useState } from 'react';
import { Check, Palette, Save, Trash2, X, Copy, Download, Upload } from 'lucide-react';
import type {
  ColorFill,
  BorderSide,
  DocumentDesign,
  DocumentModel,
  PageConfig,
  SectionDesign,
  TableDesign
} from '../types/document';
import {
  DEFAULT_DOCUMENT_DESIGN,
  DOCUMENT_DESIGN_PRESETS,
  deepCloneDesign,
  listSavedThemes,
  renameTheme,
  saveTheme,
  deleteTheme,
  contrastRatio,
  normalizeDocumentDesign,
  fillToCss,
  serializeDocumentTheme,
  parseDocumentTheme,
  duplicateSavedTheme,
  filterDocumentDesignPresets,
  getDocumentDesignPresetCategory,
  type SavedDocumentTheme
} from '../services/documentDesign';

interface DocumentDesignModalProps {
  document: DocumentModel;
  activeSectionId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onApplyDesign: (design: DocumentDesign, pageConfig?: Partial<PageConfig>) => void;
  onApplySectionDesign: (sectionId: string, design: SectionDesign) => void;
  onApplyTableDesign: (sectionId: string, tableId: string, design: TableDesign) => void;
  onResetSectionDesign: (sectionId: string) => void;
  onResetTableDesign: (sectionId: string, tableId: string) => void;
  onResetAllOverrides: () => void;
}

type TabId = 'presets' | 'cover' | 'page' | 'layout' | 'typography' | 'section' | 'table' | 'signatures' | 'saved';

function clampByte(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function rgbToHex(red: number, green: number, blue: number): string {
  return '#' + [red, green, blue].map(value => clampByte(value).toString(16).padStart(2, '0')).join('');
}

function parseColorInput(input: string): string | null {
  const value = input.trim();
  const hex = value.match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    const raw = hex[1].length === 3 ? hex[1].split('').map(char => char + char).join('') : hex[1];
    return '#' + raw.toLowerCase();
  }
  const rgb = value.match(/^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*[\d.]+)?\s*\)$/i);
  if (rgb) {
    const channels = [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])];
    if (channels.some(channel => channel < 0 || channel > 255)) return null;
    return rgbToHex(channels[0], channels[1], channels[2]);
  }
  const hsl = value.match(/^hsla?\(\s*(-?[\d.]+)(?:deg)?\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%(?:\s*,\s*[\d.]+)?\s*\)$/i);
  if (hsl) {
    const saturationValue = Number(hsl[2]);
    const lightnessValue = Number(hsl[3]);
    if (saturationValue < 0 || saturationValue > 100 || lightnessValue < 0 || lightnessValue > 100) return null;
    const hue = ((Number(hsl[1]) % 360) + 360) % 360 / 360;
    const saturation = saturationValue / 100;
    const lightness = lightnessValue / 100;
    const channel = (n: number) => {
      const k = (n + hue * 12) % 12;
      const a = saturation * Math.min(lightness, 1 - lightness);
      return lightness - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    };
    return rgbToHex(channel(0) * 255, channel(8) * 255, channel(4) * 255);
  }
  return null;
}

const ColorControl: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
}> = ({ label, value, onChange }) => {
  const [input, setInput] = useState(value);
  const [invalid, setInvalid] = useState(false);

  useEffect(() => setInput(value), [value]);

  const commit = () => {
    const parsed = parseColorInput(input);
    if (!parsed) {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    setInput(parsed);
    onChange(parsed);
  };

  return (
    <label className="flex flex-col gap-1 text-[11px] text-slate-300">
      <span>{label}</span>
      <span className="flex items-center gap-2">
        <input
          type="color"
          value={parseColorInput(value) || '#ffffff'}
          onChange={event => {
            setInput(event.target.value);
            setInvalid(false);
            onChange(event.target.value);
          }}
          className="h-8 w-10 cursor-pointer rounded border border-slate-600 bg-slate-800 p-0.5"
          aria-label={label + ' color picker'}
        />
        <input
          value={input}
          onChange={event => setInput(event.target.value)}
          onBlur={commit}
          onKeyDown={event => { if (event.key === 'Enter') commit(); }}
          placeholder="#112233, rgb(), or hsl()"
          className={'min-w-0 flex-1 rounded border bg-slate-950 px-2 py-1.5 font-mono text-[11px] text-slate-100 outline-none ' + (invalid ? 'border-rose-500' : 'border-slate-700 focus:border-blue-500')}
          aria-invalid={invalid}
        />
      </span>
      {invalid && <span className="text-[10px] text-rose-400">Enter a valid HEX, RGB, or HSL color.</span>}
    </label>
  );
};


function minimumContrastForFill(
  foreground: string,
  fill: ColorFill | undefined,
  fallback: string
): number {
  if (!fill) return contrastRatio(foreground, fallback);
  const colors = fill.type === 'linear-gradient'
    ? fill.stops.map(stop => stop.color)
    : [fill.color];
  return Math.min(...colors.map(color => contrastRatio(foreground, color)));
}

const ColorFillControl: React.FC<{
  label: string;
  value?: ColorFill;
  fallback: string;
  onChange: (value: ColorFill) => void;
}> = ({ label, value, fallback, onChange }) => {
  const fill: ColorFill = value || { type: 'solid', color: fallback, opacity: 1 };
  const isGradient = fill.type === 'linear-gradient';
  const gradient = isGradient ? fill : null;
  const stops = gradient?.stops || [
    { color: fill.type === 'solid' ? fill.color : fallback, position: 0 },
    { color: fill.type === 'solid' ? fill.color : fallback, position: 100 }
  ];
  const opacity = fill.opacity ?? 1;

  const setGradientStop = (index: number, color: string) => {
    const nextStops = [...stops];
    nextStops[index] = { ...nextStops[index], color };
    onChange({
      type: 'linear-gradient',
      angle: gradient?.angle ?? 135,
      stops: nextStops,
      opacity
    });
  };

  return (
    <div className="space-y-2 rounded-lg border border-slate-800 bg-slate-950/50 p-3">
      <label className="block text-[11px] text-slate-300">
        {label} fill type
        <select
          value={isGradient ? 'gradient' : 'solid'}
          onChange={event => {
            if (event.target.value === 'gradient') {
              const base = fillColor(fill, fallback);
              onChange({
                type: 'linear-gradient',
                angle: 135,
                stops: [{ color: base, position: 0 }, { color: '#e2e8f0', position: 100 }],
                opacity
              });
            } else {
              onChange({ type: 'solid', color: fillColor(fill, fallback), opacity });
            }
          }}
          className="mt-1 block w-full rounded border border-slate-700 bg-slate-900 px-2 py-1.5 text-slate-100"
        >
          <option value="solid">Solid color</option>
          <option value="gradient">Linear gradient</option>
        </select>
      </label>

      {isGradient ? (
        <>
          <ColorControl label="Gradient start" value={stops[0]?.color || fallback} onChange={color => setGradientStop(0, color)} />
          <ColorControl label="Gradient end" value={stops[1]?.color || '#e2e8f0'} onChange={color => setGradientStop(1, color)} />
          <label className="block text-[11px] text-slate-300">
            Gradient angle
            <input
              type="number"
              min="-360"
              max="360"
              value={gradient?.angle ?? 135}
              onChange={event => onChange({
                type: 'linear-gradient',
                angle: Number(event.target.value),
                stops,
                opacity
              })}
              className="ml-2 w-24 rounded border border-slate-700 bg-slate-900 px-2 py-1.5 text-slate-100"
            />
          </label>
        </>
      ) : (
        <ColorControl
          label={label + ' color'}
          value={fill.type === 'solid' ? fill.color : fallback}
          onChange={color => onChange({ type: 'solid', color, opacity })}
        />
      )}

      <label className="block text-[11px] text-slate-300">
        Transparency ({Math.round((1 - opacity) * 100)}%)
        <input
          type="range"
          min="0"
          max="100"
          value={Math.round(opacity * 100)}
          onChange={event => onChange({ ...fill, opacity: Number(event.target.value) / 100 })}
          className="mt-1 w-full accent-blue-500"
        />
      </label>
    </div>
  );
};

function fillColor(fill: ColorFill | undefined, fallback: string): string {
  if (!fill) return fallback;
  return fill.type === 'solid' ? fill.color : (fill.stops[0]?.color || fallback);
}

function setNestedDesign<T extends keyof DocumentDesign>(
  design: DocumentDesign,
  key: T,
  update: Partial<DocumentDesign[T]>
): DocumentDesign {
  return {
    ...design,
    [key]: { ...(design[key] as object), ...update }
  } as DocumentDesign;
}

export const DocumentDesignModal: React.FC<DocumentDesignModalProps> = ({
  document,
  activeSectionId,
  isOpen,
  onClose,
  onApplyDesign,
  onApplySectionDesign,
  onApplyTableDesign,
  onResetSectionDesign,
  onResetTableDesign,
  onResetAllOverrides
}) => {
  const [tab, setTab] = useState<TabId>('presets');
  const [design, setDesign] = useState<DocumentDesign>(DEFAULT_DOCUMENT_DESIGN);
  const [pageConfigDraft, setPageConfigDraft] = useState<PageConfig>(document.pageConfig);
  const [sectionId, setSectionId] = useState<string>('');
  const [sectionDraft, setSectionDraft] = useState<SectionDesign>({});
  const [tableId, setTableId] = useState<string>('');
  const [tableDraft, setTableDraft] = useState<TableDesign>({});
  const [savedThemes, setSavedThemes] = useState<SavedDocumentTheme[]>([]);
  const [themeName, setThemeName] = useState('');
  const [storageMessage, setStorageMessage] = useState('');
  const [presetQuery, setPresetQuery] = useState('');
  const [presetCategory, setPresetCategory] = useState('All');

  const presetCategoryLabel = (presetId: string) => { const preset = DOCUMENT_DESIGN_PRESETS.find(item => item.presetId === presetId); return preset ? getDocumentDesignPresetCategory(preset) + ' collection' : 'Custom collection'; };

  const selectedSection = useMemo(
    () => document.sections.find(section => section.id === sectionId) || document.sections[0],
    [document.sections, sectionId]
  );
  const tables = selectedSection?.tables || [];
  const selectedTable = tables.find(table => table.id === tableId) || tables[0];
  const contrastWarnings = [
    minimumContrastForFill(design.colors.bodyText, design.page.background, design.colors.pageSurface) < 4.5
      ? 'Body text may be difficult to read against the page background.'
      : '',
    minimumContrastForFill(design.colors.headingText, design.page.background, design.colors.pageSurface) < 3
      ? 'Headings may have insufficient contrast against the page background.'
      : '',
    minimumContrastForFill(design.colors.bodyText, design.sectionDefaults.background, design.colors.sectionSurface) < 4.5
      ? 'Default section body text may have insufficient contrast against its background.'
      : '',
    minimumContrastForFill(design.tableDefaults.bodyTextColor, design.tableDefaults.bodyBackground, design.colors.pageSurface) < 4.5
      ? 'Table body text may have insufficient contrast against its background.'
      : '',
    minimumContrastForFill(design.tableDefaults.headerTextColor, design.tableDefaults.headerBackground, design.colors.tableHeaderSurface) < 4.5
      ? 'Table header text may have insufficient contrast against its background.'
      : ''
  ].filter(Boolean);

  useEffect(() => {
    if (!isOpen) return;
    const normalized = normalizeDocumentDesign(document);
    setDesign(deepCloneDesign(normalized.design || DEFAULT_DOCUMENT_DESIGN));
    setPageConfigDraft(deepCloneDesign(document.pageConfig));
    const nextSectionId = activeSectionId && document.sections.some(section => section.id === activeSectionId)
      ? activeSectionId
      : (document.sections[0]?.id || '');
    setSectionId(nextSectionId);
    const nextSection = document.sections.find(section => section.id === nextSectionId);
    setSectionDraft(deepCloneDesign(nextSection?.design || {}));
    setTableId(nextSection?.tables?.[0]?.id || '');
    setTableDraft(deepCloneDesign(nextSection?.tables?.[0]?.design || {}));
    try {
      setSavedThemes(listSavedThemes(window.localStorage));
      setStorageMessage('');
    } catch {
      setSavedThemes([]);
      setStorageMessage('Saved themes are unavailable in this browser session.');
    }
  }, [document, activeSectionId, isOpen]);

  useEffect(() => {
    if (!selectedSection) return;
    setSectionDraft(deepCloneDesign(selectedSection.design || {}));
    setTableId(selectedSection.tables?.[0]?.id || '');
    setTableDraft(deepCloneDesign(selectedSection.tables?.[0]?.design || {}));
  }, [sectionId]);

  useEffect(() => {
    setTableDraft(deepCloneDesign(selectedTable?.design || {}));
  }, [tableId]);

  if (!isOpen) return null;

  const updateColor = (key: keyof DocumentDesign['colors'], value: string) => {
    setDesign(current => {
      const next: DocumentDesign = {
        ...current,
        colors: { ...current.colors, [key]: value }
      };
      const solidFill: ColorFill = { type: 'solid', color: value, opacity: 1 };

      if (key === 'pageSurface') {
        next.page = { ...next.page, background: solidFill };
        next.tableDefaults = { ...next.tableDefaults, bodyBackground: solidFill };
      }
      if (key === 'sectionSurface') {
        next.sectionDefaults = { ...next.sectionDefaults, background: solidFill };
      }
      if (key === 'border') {
        next.sectionDefaults = {
          ...next.sectionDefaults,
          border: { ...next.sectionDefaults.border, color: value }
        };
        next.tableDefaults = { ...next.tableDefaults, gridlineColor: value };
        next.pageFurniture = { ...next.pageFurniture, dividerColor: value };
      }
      if (key === 'tableHeaderSurface') {
        next.tableDefaults = { ...next.tableDefaults, headerBackground: solidFill };
      }
      if (key === 'tableHeaderText') {
        next.tableDefaults = { ...next.tableDefaults, headerTextColor: value };
      }
      if (key === 'tableBodyText') {
        next.tableDefaults = { ...next.tableDefaults, bodyTextColor: value };
      }
      if (key === 'tableAlternateRowSurface') {
        next.tableDefaults = { ...next.tableDefaults, alternateRowBackground: solidFill };
      }
      return next;
    });
  };

  const updateTypography = (key: keyof DocumentDesign['typography'], value: string | number) => {
    setDesign(current => ({
      ...current,
      typography: { ...current.typography, [key]: value }
    }));
  };

  const updatePageFill = (fill: ColorFill) => {
    setDesign(current => ({
      ...current,
      page: { ...current.page, background: fill },
      colors: {
        ...current.colors,
        pageSurface: fill.type === 'solid' ? fill.color : (fill.stops[0]?.color || current.colors.pageSurface)
      }
    }));
  };

  const updateCover = (patch: Partial<DocumentDesign['coverPage']>) => {
    setDesign(current => ({ ...current, coverPage: { ...current.coverPage, ...patch } }));
  };

  const updateLayout = (patch: Partial<DocumentDesign['layoutDefaults']>) => {
    setDesign(current => ({ ...current, layoutDefaults: { ...current.layoutDefaults, ...patch } }));
  };

  const updatePageConfigDraft = (patch: Partial<PageConfig>) => {
    setPageConfigDraft(current => ({
      ...current,
      ...patch,
      margins: { ...current.margins, ...(patch.margins || {}) }
    }));
  };

  const duplicateThemeCopy = (theme: SavedDocumentTheme) => {
    const suggestedName = theme.name + ' Copy';
    const name = window.prompt('Name the duplicated theme', suggestedName);
    if (!name?.trim()) return;
    try {
      setSavedThemes(duplicateSavedTheme(window.localStorage, theme.id, name.trim()));
      setStorageMessage('Theme duplicated.');
    } catch (error) {
      setStorageMessage(error instanceof Error ? error.message : 'The theme could not be duplicated.');
    }
  };

  const exportThemeJson = () => {
    try {
      const blob = new Blob([serializeDocumentTheme(design)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = window.document.createElement('a');
      anchor.href = url;
      anchor.download = (design.name || 'document-theme').toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.json';
      anchor.click();
      URL.revokeObjectURL(url);
      setStorageMessage('Theme JSON exported.');
    } catch (error) {
      setStorageMessage(error instanceof Error ? error.message : 'The theme could not be exported.');
    }
  };

  const importThemeJson = async (file?: File) => {
    if (!file) return;
    try {
      const parsed = parseDocumentTheme(await file.text());
      setDesign(parsed);
      setThemeName(parsed.name + ' Imported');
      setTab('cover');
      setStorageMessage('Theme imported into the local preview. Apply document design to use it.');
    } catch (error) {
      setStorageMessage(error instanceof Error ? error.message : 'The selected file is not a valid design theme.');
    }
  };

  const applySavedTheme = (theme: SavedDocumentTheme) => {
    setDesign(deepCloneDesign(theme.design));
    setTab('page');
  };

  const persistSavedTheme = () => {
    const name = themeName.trim();
    if (!name) {
      setStorageMessage('Enter a name before saving this theme.');
      return;
    }
    try {
      const theme: SavedDocumentTheme = {
        id: 'theme-' + Date.now().toString(36),
        name,
        design: deepCloneDesign(design),
        updatedAt: new Date().toISOString()
      };
      setSavedThemes(saveTheme(window.localStorage, theme));
      setThemeName('');
      setStorageMessage('Theme saved in this browser.');
    } catch {
      setStorageMessage('The theme could not be saved in browser storage.');
    }
  };

  const handleRenameTheme = (theme: SavedDocumentTheme) => {
    const name = window.prompt('Rename saved theme', theme.name);
    if (!name?.trim()) return;
    try {
      setSavedThemes(renameTheme(window.localStorage, theme.id, name.trim()));
      setStorageMessage('Theme renamed.');
    } catch {
      setStorageMessage('The theme could not be renamed.');
    }
  };

  const handleDeleteTheme = (themeId: string) => {
    try {
      setSavedThemes(deleteTheme(window.localStorage, themeId));
      setStorageMessage('Theme deleted.');
    } catch {
      setStorageMessage('The theme could not be deleted.');
    }
  };

  const tabs: Array<{ id: TabId; label: string }> = [
    { id: 'presets', label: 'Themes' },
    { id: 'cover', label: 'Cover' },
    { id: 'page', label: 'Page & Colors' },
    { id: 'layout', label: 'Layout' },
    { id: 'typography', label: 'Typography' },
    { id: 'section', label: 'Sections' },
    { id: 'table', label: 'Tables' },
    { id: 'signatures', label: 'Signatures' },
    { id: 'saved', label: 'Saved & Export' }
  ];

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-7xl flex-col overflow-hidden rounded-xl border border-slate-700 bg-slate-900 text-slate-100 shadow-2xl">
        <header className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-5 py-3">
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-blue-400" />
            <div>
              <h2 className="text-sm font-semibold">Document Design Studio</h2>
              <p className="text-[10px] text-slate-500">Customize the document without changing its wording or structure.</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close design studio" className="rounded p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"><X className="h-4 w-4" /></button>
        </header>

        <nav className="flex flex-wrap gap-1 border-b border-slate-800 bg-slate-950/50 px-4 py-2">
          {tabs.map(item => (
            <button key={item.id} onClick={() => setTab(item.id)} className={'rounded px-3 py-1.5 text-xs ' + (tab === item.id ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100')}>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {contrastWarnings.length > 0 && (
            <div role="status" className="mb-4 rounded-lg border border-amber-700/60 bg-amber-950/30 px-3 py-2">
              <p className="mb-1 text-[11px] font-semibold text-amber-300">Readability warning</p>
              <ul className="list-disc space-y-0.5 pl-4 text-[10px] text-amber-200/90">
                {contrastWarnings.map(warning => <li key={warning}>{warning}</li>)}
              </ul>
              <p className="mt-1 text-[10px] text-amber-300/70">These are advisory checks. Your selected colors will not be changed automatically.</p>
            </div>
          )}
          <section aria-label="Live document design preview" className="mb-5 grid gap-3 xl:grid-cols-2">
            <div className="rounded-xl border border-slate-700 bg-slate-950/70 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Live cover preview</span>
                <span className="text-[10px] text-slate-500">{design.coverPage.enabled ? 'Cover enabled' : 'Cover disabled'}</span>
              </div>
              <div className="flex min-h-[178px] items-center justify-center rounded-lg p-3" style={{ background: fillToCss(design.coverPage.background) }}>
                <div className="flex min-h-[150px] w-full max-w-[210px] flex-col items-center justify-center border px-3 py-4 text-center" style={{ borderColor: design.coverPage.showFrame ? design.coverPage.borderColor : 'transparent' }}>
                  {design.coverPage.enabled ? (
                    <>
                      <span className="text-[7px] font-semibold tracking-[0.2em]" style={{ color: design.coverPage.detailColor }}>{design.coverPage.eyebrow.toUpperCase()}</span>
                      <span className="mt-3 line-clamp-3 text-[15px] font-semibold leading-tight" style={{ color: design.coverPage.titleColor, fontFamily: design.typography.headingFontFamily }}>{document.title}</span>
                      {design.coverPage.brandLine.trim() && <span className="mt-3 line-clamp-2 text-[6px] font-semibold tracking-[0.12em]" style={{ color: design.coverPage.detailColor }}>{design.coverPage.brandLine}</span>}
                      <span className="mt-3 h-px w-8" style={{ background: design.coverPage.borderColor }} />
                    </>
                  ) : (
                    <span className="text-[10px] font-medium" style={{ color: design.coverPage.titleColor }}>No separate cover page</span>
                  )}
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-slate-700 bg-slate-950/70 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Interior page preview</span>
                <span className="text-[10px] text-slate-500">{pageConfigDraft.pageSize} • {pageConfigDraft.orientation}</span>
              </div>
              <div className="rounded-lg border p-4" style={{ background: fillToCss(design.page.background), borderColor: design.colors.border }}>
                <div className="mb-3 flex items-center justify-between border-b pb-2 text-[7px] font-semibold uppercase tracking-wider" style={{ color: design.pageFurniture.headerTextColor, borderColor: design.layoutDefaults.headerRule ? design.pageFurniture.dividerColor : 'transparent' }}>
                  <span>{pageConfigDraft.headerText || 'DOCUMENT HEADER'}</span><span>{pageConfigDraft.headerRightText ?? 'CONFIDENTIAL'}</span>
                </div>
                <div
                  className={'mb-2 flex items-center gap-2 rounded-sm px-2 py-1.5 ' + (
                    design.layoutDefaults.sectionHeadingStyle === 'numbered-card' ? 'border'
                      : design.layoutDefaults.sectionHeadingStyle === 'side-rule' ? 'pl-3'
                        : design.layoutDefaults.sectionHeadingStyle === 'double-rule' ? 'py-2' : ''
                  )}
                  style={{
                    background: design.layoutDefaults.sectionHeadingStyle === 'banner'
                      ? design.colors.primary
                      : design.layoutDefaults.sectionHeadingStyle === 'numbered-card'
                        ? design.colors.sectionSurface
                        : 'transparent',
                    borderColor: design.colors.border,
                    borderBottom: ['editorial-rule', 'double-rule'].includes(design.layoutDefaults.sectionHeadingStyle) ? '1px solid ' + design.colors.accent : undefined,
                    borderTop: design.layoutDefaults.sectionHeadingStyle === 'double-rule' ? '1px solid ' + design.colors.accent : undefined,
                    borderLeft: ['numbered-card', 'side-rule'].includes(design.layoutDefaults.sectionHeadingStyle) ? '3px solid ' + design.colors.accent : undefined
                  }}
                >
                  <span className="font-mono text-[8px] font-bold" style={{ color: design.colors.accent }}>1.0</span>
                  <span className="text-[12px] font-semibold" style={{ color: design.layoutDefaults.sectionHeadingStyle === 'banner' ? '#ffffff' : design.colors.headingText, fontFamily: design.typography.headingFontFamily }}>{document.sections[0]?.title || 'SECTION HEADING'}</span>
                </div>
                <div className="mb-1 text-[8px] font-semibold" style={{ color: design.colors.accent, fontFamily: design.typography.headingFontFamily }}>1.1  Key provision heading</div>
                <div className="space-y-1.5">
                  <div className="h-1.5 w-full rounded" style={{ background: design.colors.bodyText, opacity: 0.65 }} />
                  <div className="h-1.5 w-[94%] rounded" style={{ background: design.colors.bodyText, opacity: 0.55 }} />
                  <div className="h-1.5 w-[82%] rounded" style={{ background: design.colors.bodyText, opacity: 0.45 }} />
                </div>
                <div className="mt-4 overflow-hidden rounded border" style={{ borderColor: design.tableDefaults.gridlineColor }}>
                  <div className="grid grid-cols-3" style={{ background: fillToCss(design.tableDefaults.headerBackground) }}>
                    {['ITEM', 'DETAIL', 'VALUE'].map(label => <span key={label} className="px-1.5 py-1 text-[6px] font-bold" style={{ color: design.tableDefaults.headerTextColor }}>{label}</span>)}
                  </div>
                  <div className="grid grid-cols-3 border-t" style={{ background: fillToCss(design.tableDefaults.bodyBackground), borderColor: design.tableDefaults.gridlineColor }}>
                    {[0, 1, 2].map(index => <span key={index} className="px-1.5 py-2 text-[6px]" style={{ color: design.tableDefaults.bodyTextColor }}>Details</span>)}
                  </div>
                  <div className="grid grid-cols-3 border-t" style={{ background: fillToCss(design.tableDefaults.alternateRowBackground), borderColor: design.tableDefaults.gridlineColor }}>
                    {[0, 1, 2].map(index => <span key={index} className="px-1.5 py-2 text-[6px]" style={{ color: design.tableDefaults.bodyTextColor }}>Details</span>)}
                  </div>
                </div>
                <div className="mt-3 flex justify-between border-t pt-2 text-[7px]" style={{ color: design.pageFurniture.footerTextColor, borderColor: design.layoutDefaults.footerRule ? design.pageFurniture.dividerColor : 'transparent' }}>
                  <span>{pageConfigDraft.footerText || 'DOCUMENT FOOTER'}</span><span>Page 1</span>
                </div>
              </div>
            </div>
          </section>

          {tab === 'presets' && (
            <div className="space-y-5">
              <div className="flex flex-col gap-3 rounded-2xl border border-slate-700/80 bg-slate-950/70 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-100">Find your document style</p>
                  <p className="mt-1 text-[11px] text-slate-400">Explore {DOCUMENT_DESIGN_PRESETS.length} complete visual systems. Each preview shows cover design, page typography, and table styling.</p>
                </div>
                <label className="w-full sm:max-w-xs">
                  <span className="sr-only">Search visual themes</span>
                  <input value={presetQuery} onChange={event => setPresetQuery(event.target.value)} placeholder="Search themes..." className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-xs text-slate-100 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
                </label>
              </div>
              <div className="flex flex-wrap gap-2">
                {['All', 'Business', 'Editorial', 'Creative', 'Legal', 'Technology', 'Finance', 'Minimal', 'Dark'].map(category => (
                  <button key={category} onClick={() => setPresetCategory(category)} aria-pressed={presetCategory === category} className={'rounded-full border px-3 py-1.5 text-[10px] font-semibold transition ' + (presetCategory === category ? 'border-blue-400 bg-blue-500/15 text-blue-200' : 'border-slate-700 bg-slate-900/70 text-slate-400 hover:border-slate-500 hover:text-slate-200')}>{category}</button>
                ))}
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filterDocumentDesignPresets(DOCUMENT_DESIGN_PRESETS, presetQuery, presetCategory).map(preset => {
                  const selected = design.presetId === preset.presetId;
                  const pageBg = preset.colors.pageSurface;
                  const heading = preset.colors.headingText;
                  const body = preset.colors.bodyText;
                  const accent = preset.colors.accent;
                  return (
                    <button key={preset.presetId} onClick={() => setDesign(deepCloneDesign(preset))} aria-pressed={selected} className={'group overflow-hidden rounded-2xl border text-left transition duration-200 hover:-translate-y-1 hover:shadow-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ' + (selected ? 'border-blue-400 bg-blue-950/20 shadow-lg shadow-blue-950/20' : 'border-slate-700/80 bg-slate-950/70 hover:border-slate-500')}>
                      <div className="grid grid-cols-[0.82fr_1fr] gap-2 bg-slate-900/80 p-3">
                        <div className="relative flex aspect-[3/4] min-h-[142px] flex-col items-center justify-center overflow-hidden rounded-lg border px-2 py-3 text-center shadow-lg" style={{ background: fillToCss(preset.coverPage.background), borderColor: preset.coverPage.borderColor }}>
                          {preset.coverPage.showFrame && <div className="pointer-events-none absolute inset-2 border opacity-70" style={{ borderColor: preset.coverPage.borderColor }} />}
                          <span className="relative text-[5px] font-bold tracking-[0.18em]" style={{ color: preset.coverPage.detailColor }}>{preset.coverPage.eyebrow || 'DOCUMENT SERIES'}</span>
                          <span className="relative mt-3 line-clamp-3 text-[11px] font-bold leading-tight" style={{ color: preset.coverPage.titleColor, fontFamily: preset.typography.headingFontFamily }}>{document.title || 'Document Title'}</span>
                          {preset.coverPage.showOrnamentalRule && <span className="relative mt-3 h-[2px] w-8" style={{ background: preset.coverPage.borderColor }} />}
                          <span className="relative mt-auto text-[5px] tracking-wider" style={{ color: preset.coverPage.detailColor }}>{preset.name.toUpperCase()}</span>
                        </div>
                        <div className="flex aspect-[3/4] min-h-[142px] flex-col rounded-lg border p-2.5 shadow-lg" style={{ background: pageBg, borderColor: preset.colors.border }}>
                          <div className="border-b pb-2" style={{ borderColor: preset.layoutDefaults.headerRule ? preset.colors.border : 'transparent' }}>
                            <div className="h-1 w-8 rounded-full" style={{ background: accent }} />
                            <div className="mt-2 text-[9px] font-bold leading-tight" style={{ color: heading, fontFamily: preset.typography.headingFontFamily }}>01. Overview</div>
                            <div className="mt-1 h-1 w-10/12 rounded-full" style={{ background: body, opacity: 0.55 }} />
                          </div>
                          <div className="mt-2 space-y-1.5">
                            <div className="h-1 w-full rounded-full" style={{ background: body, opacity: 0.42 }} />
                            <div className="h-1 w-11/12 rounded-full" style={{ background: body, opacity: 0.3 }} />
                            <div className="h-1 w-9/12 rounded-full" style={{ background: body, opacity: 0.3 }} />
                          </div>
                          <div className="mt-3 overflow-hidden rounded-sm border" style={{ borderColor: preset.colors.border }}>
                            <div className="h-3" style={{ background: fillToCss(preset.tableDefaults.headerBackground) }} />
                            <div className="grid grid-cols-2 gap-1 p-1" style={{ background: fillToCss(preset.tableDefaults.bodyBackground) }}>
                              {[0,1,2,3].map(i => <span key={i} className="h-1 rounded-full" style={{ background: preset.tableDefaults.bodyTextColor, opacity: i % 2 ? 0.35 : 0.55 }} />)}
                            </div>
                          </div>
                          <div className="mt-auto flex items-center justify-between border-t pt-2" style={{ borderColor: preset.colors.border }}>
                            <span className="h-1 w-8 rounded-full" style={{ background: preset.colors.mutedText, opacity: 0.7 }} />
                            <span className="text-[6px]" style={{ color: preset.colors.mutedText }}>01 / 08</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-start justify-between gap-2 px-3 pb-3 pt-2.5">
                        <div className="min-w-0">
                          <span className="block text-xs font-semibold text-slate-100">{preset.name}</span>
                          <span className="mt-1 block text-[10px] text-slate-400">{preset.coverPage.enabled ? 'Cover + interior system' : 'Interior design system'}</span>
                          <span className="mt-2 inline-flex rounded-full px-2 py-1 text-[9px] font-semibold" style={{ color: accent, backgroundColor: accent + '18' }}>{presetCategoryLabel(preset.presetId)}</span>
                        </div>
                        <span className={'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs ' + (selected ? 'border-blue-400 bg-blue-500 text-white' : 'border-slate-700 text-transparent group-hover:border-slate-500')}>✓</span>
                      </div>
                    </button>
                  );
                })}
              </div>
              {filterDocumentDesignPresets(DOCUMENT_DESIGN_PRESETS, presetQuery, presetCategory).length === 0 && <div className="rounded-xl border border-dashed border-slate-700 py-12 text-center text-xs text-slate-400">No visual themes match that search. Try another name or category.</div>}
            </div>
          )}

          {tab === 'cover' && (
            <div className="grid gap-5 xl:grid-cols-2">
              <section className="space-y-3 rounded-xl border border-slate-700 bg-slate-950/50 p-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-300">Cover page</h3>
                <label className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-[11px] text-slate-200">
                  <input type="checkbox" checked={design.coverPage.enabled} onChange={event => updateCover({ enabled: event.target.checked })} className="accent-blue-500" />
                  Use a dedicated, professionally designed cover page
                </label>
                <label className="block text-[11px] text-slate-300">Cover style
                  <select value={design.coverPage.style} onChange={event => updateCover({ style: event.target.value as DocumentDesign['coverPage']['style'] })} className="mt-1 block w-full rounded border border-slate-700 bg-slate-900 px-2 py-2 text-slate-100">
                    <option value="midnight-executive">Midnight Executive</option>
                    <option value="art-deco">Art Deco</option>
                    <option value="dark-luxury">Dark Luxury</option>
                    <option value="editorial">Editorial</option>
                    <option value="minimal">Minimal</option>
                  </select>
                </label>
                <label className="block text-[11px] text-slate-300">Eyebrow / upper label
                  <input value={design.coverPage.eyebrow} onChange={event => updateCover({ eyebrow: event.target.value })} className="mt-1 block w-full rounded border border-slate-700 bg-slate-900 px-2 py-2 text-slate-100" placeholder="AGREEMENT • PRIVATE & CONFIDENTIAL" />
                </label>
                <label className="block text-[11px] text-slate-300">Brand line / subtitle
                  <input value={design.coverPage.brandLine} onChange={event => updateCover({ brandLine: event.target.value })} className="mt-1 block w-full rounded border border-slate-700 bg-slate-900 px-2 py-2 text-slate-100" placeholder="COMPANY • DIVISION • DOCUMENT SERIES" />
                </label>
              </section>
              <section className="space-y-3 rounded-xl border border-slate-700 bg-slate-950/50 p-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-300">Cover palette & frame</h3>
                <ColorFillControl label="Cover background" value={design.coverPage.background} fallback="#0b0d12" onChange={background => updateCover({ background })} />
                <ColorControl label="Cover title" value={design.coverPage.titleColor} onChange={titleColor => updateCover({ titleColor })} />
                <ColorControl label="Cover details" value={design.coverPage.detailColor} onChange={detailColor => updateCover({ detailColor })} />
                <ColorControl label="Cover frame / accent" value={design.coverPage.borderColor} onChange={borderColor => updateCover({ borderColor })} />
              </section>
              <section className="col-span-full grid gap-3 rounded-xl border border-slate-700 bg-slate-950/50 p-4 sm:grid-cols-3">
                <h3 className="col-span-full text-xs font-semibold uppercase tracking-wide text-slate-300">Decorative elements</h3>
                {([
                  ['showFrame', 'Decorative frame'],
                  ['showLogoPlaceholder', 'Show brand logo'],
                  ['showOrnamentalRule', 'Ornamental divider']
                ] as Array<[keyof DocumentDesign['coverPage'], string]>).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2 text-[11px] text-slate-300">
                    <input type="checkbox" checked={Boolean(design.coverPage[key])} onChange={event => updateCover({ [key]: event.target.checked } as Partial<DocumentDesign['coverPage']>)} className="accent-blue-500" />
                    {label}
                  </label>
                ))}
              </section>
              <section className="col-span-full rounded-xl border border-slate-700 p-4" style={{ background: fillToCss(design.coverPage.background) }}>
                <div className="mx-auto flex min-h-[230px] max-w-2xl flex-col items-center justify-between border px-8 py-8 text-center" style={{ borderColor: design.coverPage.showFrame ? design.coverPage.borderColor : 'transparent', color: design.coverPage.titleColor }}>
                  <span className="text-[10px] font-semibold tracking-[0.3em]" style={{ color: design.coverPage.detailColor }}>{design.coverPage.eyebrow.toUpperCase() || 'DOCUMENT'}</span>
                  {design.coverPage.showLogoPlaceholder && <div className="flex h-10 min-w-10 max-w-28 items-center justify-center rounded border px-2" style={{ borderColor: design.coverPage.borderColor }}>{document.brandLogoUrl ? <img src={document.brandLogoUrl} alt={document.brandName ? document.brandName + ' logo' : 'Brand logo'} className="max-h-8 max-w-24 object-contain" /> : <span className="text-[6px] font-semibold tracking-wider">{document.brandName || 'ADD LOGO'}</span>}</div>}
                  <div>
                    <h3 className="text-2xl font-semibold" style={{ fontFamily: design.typography.headingFontFamily }}>{document.title}</h3>
                    {design.coverPage.brandLine && <p className="mt-3 text-[10px] tracking-[0.18em]" style={{ color: design.coverPage.detailColor }}>{design.coverPage.brandLine}</p>}
                  </div>
                  <span className="h-px w-20" style={{ background: design.coverPage.borderColor }} />
                  <span className="text-[10px]" style={{ color: design.coverPage.detailColor }}>{document.author}</span>
                </div>
              </section>
            </div>
          )}

          {tab === 'page' && (
            <div className="grid gap-6 md:grid-cols-2">
              <section className="col-span-full rounded-xl border border-slate-700 bg-slate-950/50 p-4">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-300">Paper size & print layout</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-[11px] text-slate-300">Page size
                    <select value={pageConfigDraft.pageSize} onChange={event => updatePageConfigDraft({ pageSize: event.target.value as PageConfig['pageSize'] })} className="mt-1 block w-full rounded border border-slate-700 bg-slate-900 px-2 py-2 text-slate-100"><option value="LETTER">US Letter</option><option value="LEGAL">US Legal</option><option value="A4">A4</option></select>
                  </label>
                  <label className="block text-[11px] text-slate-300">Orientation
                    <select value={pageConfigDraft.orientation} onChange={event => updatePageConfigDraft({ orientation: event.target.value as PageConfig['orientation'] })} className="mt-1 block w-full rounded border border-slate-700 bg-slate-900 px-2 py-2 text-slate-100"><option value="portrait">Portrait</option><option value="landscape">Landscape</option></select>
                  </label>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-4">
                  {(['top', 'bottom', 'left', 'right'] as const).map(side => (
                    <label key={side} className="block text-[11px] capitalize text-slate-300">{side} margin (mm)
                      <input type="number" min="0" max="60" step="0.5" value={pageConfigDraft.margins[side]} onChange={event => updatePageConfigDraft({ margins: { [side]: Number(event.target.value) } as PageConfig['margins'] })} className="mt-1 block w-full rounded border border-slate-700 bg-slate-900 px-2 py-2 text-slate-100" />
                    </label>
                  ))}
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <label className="block text-[11px] text-slate-300">Running header text
                    <input value={pageConfigDraft.headerText} onChange={event => updatePageConfigDraft({ headerText: event.target.value })} className="mt-1 block w-full rounded border border-slate-700 bg-slate-900 px-2 py-2 text-slate-100" placeholder="COMPANY • AGREEMENT NAME" />
                  </label>
                  <label className="block text-[11px] text-slate-300">Running header right text
                    <input value={pageConfigDraft.headerRightText ?? 'CONFIDENTIAL'} onChange={event => updatePageConfigDraft({ headerRightText: event.target.value })} className="mt-1 block w-full rounded border border-slate-700 bg-slate-900 px-2 py-2 text-slate-100" placeholder="CONFIDENTIAL" />
                  </label>
                  <label className="block text-[11px] text-slate-300">Running footer text
                    <input value={pageConfigDraft.footerText} onChange={event => updatePageConfigDraft({ footerText: event.target.value })} className="mt-1 block w-full rounded border border-slate-700 bg-slate-900 px-2 py-2 text-slate-100" placeholder="CONFIDENTIAL • DOCUMENT VERSION" />
                  </label>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-4">
                  <label className="flex items-center gap-2 text-[11px] text-slate-300"><input type="checkbox" checked={pageConfigDraft.showPageNumbers} onChange={event => updatePageConfigDraft({ showPageNumbers: event.target.checked })} className="accent-blue-500" /> Page numbers</label>
                  <label className="flex items-center gap-2 text-[11px] text-slate-300"><input type="checkbox" checked={pageConfigDraft.firstPageDifferent} onChange={event => updatePageConfigDraft({ firstPageDifferent: event.target.checked })} className="accent-blue-500" /> Different first page furniture</label>
                  <label className="flex items-center gap-2 text-[11px] text-slate-300">Number format
                    <select value={pageConfigDraft.pageNumberFormat} onChange={event => updatePageConfigDraft({ pageNumberFormat: event.target.value as PageConfig['pageNumberFormat'] })} className="rounded border border-slate-700 bg-slate-900 px-2 py-1.5 text-slate-100"><option value="PAGE_X_OF_Y">Page X of Y</option><option value="PAGE_X">Page X</option><option value="DASH_X_DASH">- X -</option></select>
                  </label>
                </div>
              </section>
              <section className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Page Background</h3>
                <ColorFillControl
                  label="All page backgrounds"
                  value={design.page.background}
                  fallback="#ffffff"
                  onChange={updatePageFill}
                />
                <label className="block text-[11px] text-slate-300">
                  Use a different first-page background
                  <input type="checkbox" checked={!!design.page.firstPageBackground} onChange={event => setDesign(current => ({
                    ...current,
                    page: { ...current.page, firstPageBackground: event.target.checked ? current.page.background : undefined }
                  }))} className="ml-2 accent-blue-500" />
                </label>
                {design.page.firstPageBackground && (
                  <ColorFillControl
                    label="First page background"
                    value={design.page.firstPageBackground}
                    fallback="#ffffff"
                    onChange={fill => setDesign(current => ({ ...current, page: { ...current.page, firstPageBackground: fill } }))}
                  />
                )}
              </section>
              <section className="grid content-start gap-3 sm:grid-cols-2">
                <h3 className="col-span-full text-xs font-semibold uppercase tracking-wide text-slate-400">Document Palette</h3>
                {([
                  ['primary', 'Primary'], ['secondary', 'Secondary'], ['accent', 'Accent'],
                  ['bodyText', 'Body text'], ['mutedText', 'Muted text'], ['headingText', 'Headings'],
                  ['pageSurface', 'Page surface token'], ['sectionSurface', 'Section surface'],
                  ['border', 'Borders'], ['tableHeaderSurface', 'Table header'],
                  ['tableHeaderText', 'Table header text'], ['tableBodyText', 'Table body text'],
                  ['tableAlternateRowSurface', 'Alternate table row']
                ] as Array<[keyof DocumentDesign['colors'], string]>).map(([key, label]) => (
                  <ColorControl key={key} label={label} value={design.colors[key]} onChange={value => updateColor(key, value)} />
                ))}
              </section>
            </div>
          )}

          {tab === 'layout' && (
            <div className="grid gap-5 md:grid-cols-2">
              <section className="space-y-3 rounded-xl border border-slate-700 bg-slate-950/50 p-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-300">Document rhythm</h3>
                <label className="block text-[11px] text-slate-300">Section heading style
                  <select value={design.layoutDefaults.sectionHeadingStyle} onChange={event => updateLayout({ sectionHeadingStyle: event.target.value as DocumentDesign['layoutDefaults']['sectionHeadingStyle'] })} className="mt-1 block w-full rounded border border-slate-700 bg-slate-900 px-2 py-2 text-slate-100">
                    <option value="editorial-rule">Editorial rule</option>
                    <option value="numbered-card">Numbered card</option>
                    <option value="side-rule">Side accent rule</option>
                    <option value="double-rule">Double rule</option>
                    <option value="minimal">Minimal</option>
                    <option value="banner">Full-width banner</option>
                  </select>
                </label>
                <label className="block text-[11px] text-slate-300">Space between sections (px)
                  <input type="number" min="0" max="100" value={design.layoutDefaults.sectionSpacing} onChange={event => updateLayout({ sectionSpacing: Number(event.target.value) })} className="mt-1 block w-full rounded border border-slate-700 bg-slate-900 px-2 py-2 text-slate-100" />
                </label>
                <label className="block text-[11px] text-slate-300">Section padding (px)
                  <input type="number" min="0" max="60" value={design.layoutDefaults.sectionPadding} onChange={event => updateLayout({ sectionPadding: Number(event.target.value) })} className="mt-1 block w-full rounded border border-slate-700 bg-slate-900 px-2 py-2 text-slate-100" />
                </label>
                <label className="block text-[11px] text-slate-300">Paragraph first-line indent (px)
                  <input type="number" min="0" max="30" value={design.layoutDefaults.paragraphIndent} onChange={event => updateLayout({ paragraphIndent: Number(event.target.value) })} className="mt-1 block w-full rounded border border-slate-700 bg-slate-900 px-2 py-2 text-slate-100" />
                </label>
              </section>
              <section className="space-y-3 rounded-xl border border-slate-700 bg-slate-950/50 p-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-300">Page furniture</h3>
                <label className="flex items-center gap-2 text-[11px] text-slate-300"><input type="checkbox" checked={design.layoutDefaults.headerRule} onChange={event => updateLayout({ headerRule: event.target.checked })} className="accent-blue-500" /> Show running header rule</label>
                <label className="flex items-center gap-2 text-[11px] text-slate-300"><input type="checkbox" checked={design.layoutDefaults.footerRule} onChange={event => updateLayout({ footerRule: event.target.checked })} className="accent-blue-500" /> Show running footer rule</label>
                <p className="text-[10px] leading-relaxed text-slate-500">These settings apply to the live editor and PDF renderer. Section and page spacing use the same saved design values.</p>
              </section>
              <section className="col-span-full rounded-xl border border-slate-700 bg-slate-950/50 p-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-300">Heading style preview</h3>
                <div className={'mt-3 flex items-center gap-3 ' + (
                  design.layoutDefaults.sectionHeadingStyle === 'banner' ? 'rounded px-3 py-3'
                    : design.layoutDefaults.sectionHeadingStyle === 'numbered-card' ? 'rounded border p-2'
                      : design.layoutDefaults.sectionHeadingStyle === 'side-rule' ? 'pl-3 py-1'
                        : design.layoutDefaults.sectionHeadingStyle === 'double-rule' ? 'py-2'
                          : 'pb-2'
                )} style={{
                  background: design.layoutDefaults.sectionHeadingStyle === 'banner' ? design.colors.primary : design.layoutDefaults.sectionHeadingStyle === 'numbered-card' ? design.colors.sectionSurface : 'transparent',
                  borderBottom: ['editorial-rule', 'double-rule'].includes(design.layoutDefaults.sectionHeadingStyle) ? '1px solid ' + design.colors.accent : 'none',
                  borderTop: design.layoutDefaults.sectionHeadingStyle === 'double-rule' ? '1px solid ' + design.colors.accent : 'none',
                  borderLeft: ['numbered-card', 'side-rule'].includes(design.layoutDefaults.sectionHeadingStyle) ? '3px solid ' + design.colors.accent : 'none',
                  borderColor: design.layoutDefaults.sectionHeadingStyle === 'numbered-card' ? design.colors.border : design.colors.accent
                }}>
                  <span className="rounded px-2 py-1 font-mono text-xs font-bold" style={{ color: design.colors.accent, background: design.layoutDefaults.sectionHeadingStyle === 'numbered-card' ? design.colors.sectionSurface : 'transparent' }}>1.0</span>
                  <span className="text-lg font-semibold" style={{ color: design.layoutDefaults.sectionHeadingStyle === 'banner' ? '#ffffff' : design.colors.headingText, fontFamily: design.typography.headingFontFamily }}>Professional Section Heading</span>
                </div>
              </section>
            </div>
          )}

          {tab === 'typography' && (
            <div className="grid gap-5 md:grid-cols-2">
              <section className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Body Typography</h3>
                <label className="block text-[11px] text-slate-300">Body font<select value={design.typography.bodyFontFamily} onChange={event => updateTypography('bodyFontFamily', event.target.value)} className="mt-1 block w-full rounded border border-slate-700 bg-slate-950 px-2 py-2 text-slate-100">{['Times New Roman','Garamond','Inter','Helvetica','Georgia','Courier New'].map(font => <option key={font}>{font}</option>)}</select></label>
                <label className="block text-[11px] text-slate-300">Body size (pt)<input type="number" min="8" max="28" step="0.5" value={design.typography.bodyFontSize} onChange={event => updateTypography('bodyFontSize', Number(event.target.value))} className="mt-1 block w-full rounded border border-slate-700 bg-slate-950 px-2 py-2 text-slate-100" /></label>
                <label className="block text-[11px] text-slate-300">Line height<input type="number" min="1" max="3" step="0.05" value={design.typography.bodyLineHeight} onChange={event => updateTypography('bodyLineHeight', Number(event.target.value))} className="mt-1 block w-full rounded border border-slate-700 bg-slate-950 px-2 py-2 text-slate-100" /></label>
                <label className="block text-[11px] text-slate-300">Paragraph spacing<input type="number" min="0" max="30" value={design.typography.paragraphSpacing} onChange={event => updateTypography('paragraphSpacing', Number(event.target.value))} className="mt-1 block w-full rounded border border-slate-700 bg-slate-950 px-2 py-2 text-slate-100" /></label>
              </section>
              <section className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Text Alignment & Placement</h3>
                <label className="block text-[11px] text-slate-300">Horizontal alignment<select value={design.typography.textAlignment || 'left'} onChange={event => updateTypography('textAlignment' as keyof DocumentDesign['typography'], event.target.value)} className="mt-1 block w-full rounded border border-slate-700 bg-slate-950 px-2 py-2 text-slate-100"><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option><option value="justify">Justified</option></select></label>
                <label className="block text-[11px] text-slate-300">Vertical alignment<select value={design.typography.verticalAlignment || 'top'} onChange={event => updateTypography('verticalAlignment' as keyof DocumentDesign['typography'], event.target.value)} className="mt-1 block w-full rounded border border-slate-700 bg-slate-950 px-2 py-2 text-slate-100"><option value="top">Top</option><option value="middle">Middle</option><option value="bottom">Bottom</option></select></label>
                <label className="block text-[11px] text-slate-300">Section box minimum height (px)<input type="number" min="0" max="1200" step="20" value={design.typography.contentBoxMinHeight || 0} onChange={event => updateTypography('contentBoxMinHeight' as keyof DocumentDesign['typography'], Number(event.target.value))} className="mt-1 block w-full rounded border border-slate-700 bg-slate-950 px-2 py-2 text-slate-100" /></label>
                <p className="text-[10px] text-slate-500">Vertical placement takes effect when a section box has extra height. Leave minimum height at 0 to let each section fit its content.</p>
              </section>
              <section className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Headings</h3>
                <label className="block text-[11px] text-slate-300">Heading font<select value={design.typography.headingFontFamily} onChange={event => updateTypography('headingFontFamily', event.target.value)} className="mt-1 block w-full rounded border border-slate-700 bg-slate-950 px-2 py-2 text-slate-100">{['Times New Roman','Garamond','Inter','Helvetica','Georgia','Courier New'].map(font => <option key={font}>{font}</option>)}</select></label>
                {(['heading1Size','heading2Size','heading3Size'] as const).map((key, index) => <label key={key} className="block text-[11px] text-slate-300">Heading {index + 1} size (pt)<input type="number" min="8" max="48" value={design.typography[key]} onChange={event => updateTypography(key, Number(event.target.value))} className="mt-1 block w-full rounded border border-slate-700 bg-slate-950 px-2 py-2 text-slate-100" /></label>)}
                <label className="block text-[11px] text-slate-300">Heading case<select value={design.typography.headingCase} onChange={event => updateTypography('headingCase', event.target.value)} className="mt-1 block w-full rounded border border-slate-700 bg-slate-950 px-2 py-2 text-slate-100"><option value="none">As written</option><option value="capitalize">Capitalize</option><option value="uppercase">Uppercase</option></select></label>
              </section>
              <section className="col-span-full grid gap-3 md:grid-cols-2">
                <h3 className="col-span-full text-xs font-semibold uppercase tracking-wide text-slate-400">Page Furniture</h3>
                <ColorControl label="Header text" value={design.pageFurniture.headerTextColor} onChange={color => setDesign(current => ({ ...current, pageFurniture: { ...current.pageFurniture, headerTextColor: color } }))} />
                <ColorControl label="Footer text" value={design.pageFurniture.footerTextColor} onChange={color => setDesign(current => ({ ...current, pageFurniture: { ...current.pageFurniture, footerTextColor: color } }))} />
                <ColorControl label="Header/footer divider" value={design.pageFurniture.dividerColor} onChange={color => setDesign(current => ({ ...current, pageFurniture: { ...current.pageFurniture, dividerColor: color } }))} />
                <label className="block text-[11px] text-slate-300">Divider width<input type="number" min="0" max="10" step="0.1" value={design.pageFurniture.dividerWidth} onChange={event => setDesign(current => ({ ...current, pageFurniture: { ...current.pageFurniture, dividerWidth: Number(event.target.value) } }))} className="mt-1 block w-full rounded border border-slate-700 bg-slate-950 px-2 py-2 text-slate-100" /></label>
              </section>
            </div>
          )}

          {tab === 'section' && (
            <div className="grid gap-5 md:grid-cols-2">
              <section className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Section Target</h3>
                <select value={sectionId} onChange={event => setSectionId(event.target.value)} className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-2 text-xs text-slate-100">
                  {document.sections.map(section => <option key={section.id} value={section.id}>{section.sectionNumber} {section.title}</option>)}
                </select>
                <ColorFillControl label="Section background" value={sectionDraft.background} fallback={design.colors.sectionSurface} onChange={fill => setSectionDraft(current => ({ ...current, background: fill }))} />
                <ColorControl label="Section heading color" value={sectionDraft.headingColor || design.colors.headingText} onChange={color => setSectionDraft(current => ({ ...current, headingColor: color }))} />
                <ColorControl label="Section body text" value={sectionDraft.bodyTextColor || design.colors.bodyText} onChange={color => setSectionDraft(current => ({ ...current, bodyTextColor: color }))} />
                <div className="space-y-3 rounded-lg border border-slate-700 bg-slate-950/50 p-3">
                  <div>
                    <h4 className="text-[11px] font-semibold uppercase tracking-wide text-slate-300">Contained Reference Material</h4>
                    <p className="mt-1 text-[10px] text-slate-500">Colorize the independently scrollable [[...]] panel in this section.</p>
                  </div>
                  <ColorControl label="Panel background" value={sectionDraft.scrollableBackgroundColor || design.colors.pageSurface} onChange={color => setSectionDraft(current => ({ ...current, scrollableBackgroundColor: color }))} />
                  <ColorControl label="Panel text" value={sectionDraft.scrollableTextColor || design.colors.bodyText} onChange={color => setSectionDraft(current => ({ ...current, scrollableTextColor: color }))} />
                  <ColorControl label="Panel border" value={sectionDraft.scrollableBorderColor || design.colors.border} onChange={color => setSectionDraft(current => ({ ...current, scrollableBorderColor: color }))} />
                  <ColorControl label="Panel label" value={sectionDraft.scrollableLabelColor || design.colors.mutedText} onChange={color => setSectionDraft(current => ({ ...current, scrollableLabelColor: color }))} />
                </div>
              </section>
              <section className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Section Border & Spacing</h3>
                <ColorControl label="Border color" value={sectionDraft.border?.color || design.colors.border} onChange={color => setSectionDraft(current => ({ ...current, border: { style: current.border?.style || 'solid', color, width: current.border?.width ?? 1, sides: current.border?.sides } }))} />
                <label className="block text-[11px] text-slate-300">Border style<select value={sectionDraft.border?.style || 'none'} onChange={event => setSectionDraft(current => ({ ...current, border: { style: event.target.value as any, color: current.border?.color || design.colors.border, width: current.border?.width ?? 1, sides: current.border?.sides } }))} className="mt-1 block w-full rounded border border-slate-700 bg-slate-950 px-2 py-2 text-slate-100"><option value="none">None</option><option value="solid">Solid</option><option value="dashed">Dashed</option><option value="dotted">Dotted</option><option value="double">Double</option></select></label>
                <label className="block text-[11px] text-slate-300">Border width<input type="number" min="0" max="20" step="0.5" value={sectionDraft.border?.width ?? 1} onChange={event => setSectionDraft(current => ({ ...current, border: { style: current.border?.style || 'solid', color: current.border?.color || design.colors.border, width: Number(event.target.value), sides: current.border?.sides } }))} className="mt-1 block w-full rounded border border-slate-700 bg-slate-950 px-2 py-2 text-slate-100" /></label>
                <div className="space-y-1">
                  <span className="block text-[11px] text-slate-300">Border sides</span>
                  <div className="flex flex-wrap gap-3">
                    {(['top', 'right', 'bottom', 'left'] as const).map(side => (
                      <label key={side} className="flex items-center gap-1 text-[10px] capitalize text-slate-400">
                        <input
                          type="checkbox"
                          checked={sectionDraft.border?.sides ? sectionDraft.border.sides.includes(side) : true}
                          onChange={event => setSectionDraft(current => {
                            const allSides: BorderSide[] = ['top', 'right', 'bottom', 'left'];
                            const nextSides = new Set<BorderSide>(current.border?.sides || allSides);
                            if (event.target.checked) nextSides.add(side);
                            else nextSides.delete(side);
                            return {
                              ...current,
                              border: {
                                style: current.border?.style || 'solid',
                                color: current.border?.color || design.colors.border,
                                width: current.border?.width ?? 1,
                                sides: allSides.every(item => nextSides.has(item)) ? undefined : Array.from(nextSides)
                              }
                            };
                          })}
                          className="accent-blue-500"
                        />
                        {side}
                      </label>
                    ))}
                  </div>
                </div>
                <label className="block text-[11px] text-slate-300">Section padding<input type="number" min="0" max="100" value={sectionDraft.padding ?? design.sectionDefaults.padding} onChange={event => setSectionDraft(current => ({ ...current, padding: Number(event.target.value) }))} className="mt-1 block w-full rounded border border-slate-700 bg-slate-950 px-2 py-2 text-slate-100" /></label>
              </section>
              <div className="col-span-full flex flex-wrap gap-2">
                <button onClick={() => selectedSection && onApplySectionDesign(selectedSection.id, sectionDraft)} disabled={!selectedSection} className="rounded bg-blue-600 px-3 py-2 text-xs font-semibold hover:bg-blue-500 disabled:opacity-40">Apply to this section</button>
                <button onClick={() => selectedSection && onResetSectionDesign(selectedSection.id)} disabled={!selectedSection} className="rounded border border-slate-700 px-3 py-2 text-xs hover:bg-slate-800 disabled:opacity-40">Reset section override</button>
                <button onClick={onResetAllOverrides} className="rounded border border-rose-800 px-3 py-2 text-xs text-rose-300 hover:bg-rose-950/40">Reset all local overrides</button>
              </div>
            </div>
          )}

          {tab === 'table' && (
            <div className="grid gap-5 md:grid-cols-2">
              <section className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Table Target</h3>
                <label className="block text-[11px] text-slate-300">
                  Section
                  <select value={sectionId} onChange={event => setSectionId(event.target.value)} className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-2 py-2 text-xs text-slate-100">
                    {document.sections.map(section => <option key={section.id} value={section.id}>{section.sectionNumber} {section.title}</option>)}
                  </select>
                </label>
                <label className="block text-[11px] text-slate-300">
                  Table
                  <select value={tableId} onChange={event => setTableId(event.target.value)} className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-2 py-2 text-xs text-slate-100">
                    {tables.map(table => <option key={table.id} value={table.id}>{table.title || 'Untitled table'}</option>)}
                  </select>
                </label>
                {selectedTable && <p className="text-[10px] text-slate-500">{selectedSection?.title}</p>}
                <ColorFillControl label="Table header background" value={tableDraft.headerBackground} fallback={design.colors.tableHeaderSurface} onChange={fill => setTableDraft(current => ({ ...current, headerBackground: fill }))} />
                <ColorFillControl label="Table body background" value={tableDraft.bodyBackground} fallback={design.colors.pageSurface} onChange={fill => setTableDraft(current => ({ ...current, bodyBackground: fill }))} />
                <ColorControl label="Table header text" value={tableDraft.headerTextColor || design.colors.tableHeaderText} onChange={color => setTableDraft(current => ({ ...current, headerTextColor: color }))} />
                <ColorControl label="Table body text" value={tableDraft.bodyTextColor || design.colors.tableBodyText} onChange={color => setTableDraft(current => ({ ...current, bodyTextColor: color }))} />
              </section>
              <section className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Rows & Grid</h3>
                <ColorFillControl label="Alternate row background" value={tableDraft.alternateRowBackground} fallback={design.colors.tableAlternateRowSurface} onChange={fill => setTableDraft(current => ({ ...current, alternateRowBackground: fill }))} />
                <ColorControl label="Gridline color" value={tableDraft.gridlineColor || design.colors.border} onChange={color => setTableDraft(current => ({ ...current, gridlineColor: color }))} />
                <ColorControl label="Caption color" value={tableDraft.captionColor || design.colors.mutedText} onChange={color => setTableDraft(current => ({ ...current, captionColor: color }))} />
                <label className="block text-[11px] text-slate-300">Gridline width<input type="number" min="0" max="10" step="0.1" value={tableDraft.gridlineWidth ?? design.tableDefaults.gridlineWidth} onChange={event => setTableDraft(current => ({ ...current, gridlineWidth: Number(event.target.value) }))} className="mt-1 block w-full rounded border border-slate-700 bg-slate-950 px-2 py-2 text-slate-100" /></label>
              </section>
              <div className="col-span-full flex gap-2">
                <button onClick={() => selectedSection && selectedTable && onApplyTableDesign(selectedSection.id, selectedTable.id, tableDraft)} disabled={!selectedSection || !selectedTable} className="rounded bg-blue-600 px-3 py-2 text-xs font-semibold hover:bg-blue-500 disabled:opacity-40">Apply to this table</button>
                <button onClick={() => selectedSection && selectedTable && onResetTableDesign(selectedSection.id, selectedTable.id)} disabled={!selectedSection || !selectedTable} className="rounded border border-slate-700 px-3 py-2 text-xs hover:bg-slate-800 disabled:opacity-40">Reset table override</button>
              </div>
            </div>
          )}

          {tab === 'signatures' && (
            <div className="grid gap-5 md:grid-cols-2">
              <section className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Signature Block Appearance</h3>
                <ColorFillControl
                  label="Block background"
                  value={design.signatureDefaults.background}
                  fallback="#f8fafc"
                  onChange={background => setDesign(current => ({
                    ...current,
                    signatureDefaults: { ...current.signatureDefaults, background }
                  }))}
                />
                <ColorControl
                  label="Field text"
                  value={design.signatureDefaults.textColor}
                  onChange={textColor => setDesign(current => ({
                    ...current,
                    signatureDefaults: { ...current.signatureDefaults, textColor }
                  }))}
                />
                <ColorControl
                  label="Field labels"
                  value={design.signatureDefaults.labelColor}
                  onChange={labelColor => setDesign(current => ({
                    ...current,
                    signatureDefaults: { ...current.signatureDefaults, labelColor }
                  }))}
                />
              </section>
              <section className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Border & Spacing</h3>
                <ColorControl
                  label="Border color"
                  value={design.signatureDefaults.border.color}
                  onChange={color => setDesign(current => ({
                    ...current,
                    signatureDefaults: { ...current.signatureDefaults, border: { ...current.signatureDefaults.border, color } }
                  }))}
                />
                <label className="block text-[11px] text-slate-300">Border style
                  <select
                    value={design.signatureDefaults.border.style}
                    onChange={event => setDesign(current => ({
                      ...current,
                      signatureDefaults: { ...current.signatureDefaults, border: { ...current.signatureDefaults.border, style: event.target.value as any } }
                    }))}
                    className="mt-1 block w-full rounded border border-slate-700 bg-slate-950 px-2 py-2 text-slate-100"
                  >
                    <option value="none">None</option><option value="solid">Solid</option><option value="dashed">Dashed</option><option value="dotted">Dotted</option><option value="double">Double</option>
                  </select>
                </label>
                <label className="block text-[11px] text-slate-300">Border width (pt)
                  <input type="number" min="0" max="10" step="0.25" value={design.signatureDefaults.border.width} onChange={event => setDesign(current => ({
                    ...current,
                    signatureDefaults: { ...current.signatureDefaults, border: { ...current.signatureDefaults.border, width: Number(event.target.value) } }
                  }))} className="mt-1 block w-full rounded border border-slate-700 bg-slate-950 px-2 py-2 text-slate-100" />
                </label>
                <label className="block text-[11px] text-slate-300">Inner padding (px)
                  <input type="number" min="0" max="60" value={design.signatureDefaults.padding} onChange={event => setDesign(current => ({
                    ...current,
                    signatureDefaults: { ...current.signatureDefaults, padding: Number(event.target.value) }
                  }))} className="mt-1 block w-full rounded border border-slate-700 bg-slate-950 px-2 py-2 text-slate-100" />
                </label>
              </section>
              <section className="col-span-full rounded-lg border p-4" style={{ background: fillToCss(design.signatureDefaults.background), borderColor: design.signatureDefaults.border.color, borderWidth: design.signatureDefaults.border.width, borderStyle: design.signatureDefaults.border.style === 'none' ? 'none' : design.signatureDefaults.border.style, padding: design.signatureDefaults.padding }}>
                <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: design.signatureDefaults.labelColor }}>Signature block preview</div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 text-xs" style={{ color: design.signatureDefaults.textColor }}>
                  <div><span className="block text-[10px] uppercase" style={{ color: design.signatureDefaults.labelColor }}>Legal name</span>Jarred Gainer</div>
                  <div><span className="block text-[10px] uppercase" style={{ color: design.signatureDefaults.labelColor }}>Artist name</span>LIL SYNN</div>
                  <div><span className="block text-[10px] uppercase" style={{ color: design.signatureDefaults.labelColor }}>Label</span>SYNTIENT RECORDS</div>
                  <div><span className="block text-[10px] uppercase" style={{ color: design.signatureDefaults.labelColor }}>Date</span>______________________</div>
                  <div className="sm:col-span-2"><span className="block text-[10px] uppercase" style={{ color: design.signatureDefaults.labelColor }}>Signature</span><div className="mt-5 border-b" style={{ borderColor: design.signatureDefaults.textColor }} /></div>
                </div>
              </section>
            </div>
          )}

          {tab === 'saved' && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2 rounded-lg border border-slate-700 bg-slate-950 p-3">
                <button onClick={exportThemeJson} className="flex items-center gap-1.5 rounded border border-slate-700 px-3 py-2 text-xs text-slate-200 hover:bg-slate-800"><Download className="h-3.5 w-3.5" /> Export theme JSON</button>
                <label className="flex cursor-pointer items-center gap-1.5 rounded border border-slate-700 px-3 py-2 text-xs text-slate-200 hover:bg-slate-800">
                  <Upload className="h-3.5 w-3.5" /> Import theme JSON
                  <input type="file" accept="application/json,.json" className="hidden" onChange={event => { void importThemeJson(event.target.files?.[0]); event.currentTarget.value = ''; }} />
                </label>
              </div>
              <div className="flex flex-wrap items-end gap-2 rounded-lg border border-slate-700 bg-slate-950 p-3">
                <label className="min-w-52 flex-1 text-[11px] text-slate-300">Theme name<input value={themeName} onChange={event => setThemeName(event.target.value)} placeholder="My custom theme" className="mt-1 block w-full rounded border border-slate-700 bg-slate-900 px-2 py-2 text-slate-100" /></label>
                <button onClick={persistSavedTheme} className="flex items-center gap-1.5 rounded bg-blue-600 px-3 py-2 text-xs font-semibold hover:bg-blue-500"><Save className="h-3.5 w-3.5" /> Save current theme</button>
              </div>
              {storageMessage && <p role="status" className="text-[11px] text-slate-400">{storageMessage}</p>}
              <div className="space-y-2">
                {savedThemes.map(theme => (
                  <div key={theme.id} className="flex flex-wrap items-center gap-3 rounded border border-slate-700 bg-slate-950 p-3">
                    <button onClick={() => applySavedTheme(theme)} className="min-w-0 flex-1 text-left"><span className="block text-xs font-medium">{theme.name}</span><span className="text-[10px] text-slate-500">Updated {new Date(theme.updatedAt).toLocaleDateString()}</span></button>
                    <button onClick={() => duplicateThemeCopy(theme)} className="flex items-center gap-1 rounded border border-slate-700 px-2 py-1 text-[10px] hover:bg-slate-800"><Copy className="h-3 w-3" /> Duplicate</button>
                     <button onClick={() => handleRenameTheme(theme)} className="rounded border border-slate-700 px-2 py-1 text-[10px] hover:bg-slate-800">Rename</button>
                    <button onClick={() => handleDeleteTheme(theme.id)} aria-label={'Delete ' + theme.name} className="rounded p-1.5 text-rose-400 hover:bg-rose-950/40"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                ))}
                {savedThemes.length === 0 && <p className="py-8 text-center text-xs text-slate-500">No saved themes yet.</p>}
              </div>
            </div>
          )}
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-800 bg-slate-950 px-5 py-3">
          <span className="text-[10px] text-slate-500">Active design: {design.name}</span>
          <div className="flex gap-2">
            <button onClick={() => { setDesign(deepCloneDesign(normalizeDocumentDesign(document).design || DEFAULT_DOCUMENT_DESIGN)); setPageConfigDraft(deepCloneDesign(document.pageConfig)); }} className="rounded border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800">Discard local edits</button>
            <button onClick={() => { onApplyDesign(deepCloneDesign(design), deepCloneDesign(pageConfigDraft)); onClose(); }} className="flex items-center gap-1.5 rounded bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500"><Check className="h-3.5 w-3.5" /> Apply design &amp; page layout</button>
          </div>
        </footer>
      </div>
    </div>
  );
};
