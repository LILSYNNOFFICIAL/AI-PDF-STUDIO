import React, { useEffect, useMemo, useState } from 'react';
import { Check, Palette, Save, Trash2, X } from 'lucide-react';
import type {
  ColorFill,
  BorderSide,
  DocumentDesign,
  DocumentModel,
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
  normalizeDocumentDesign,
  type SavedDocumentTheme
} from '../services/documentDesign';

interface DocumentDesignModalProps {
  document: DocumentModel;
  activeSectionId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onApplyDesign: (design: DocumentDesign) => void;
  onApplySectionDesign: (sectionId: string, design: SectionDesign) => void;
  onApplyTableDesign: (sectionId: string, tableId: string, design: TableDesign) => void;
  onResetSectionDesign: (sectionId: string) => void;
  onResetTableDesign: (sectionId: string, tableId: string) => void;
  onResetAllOverrides: () => void;
}

type TabId = 'presets' | 'page' | 'typography' | 'section' | 'table' | 'saved';

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
  const [sectionId, setSectionId] = useState<string>('');
  const [sectionDraft, setSectionDraft] = useState<SectionDesign>({});
  const [tableId, setTableId] = useState<string>('');
  const [tableDraft, setTableDraft] = useState<TableDesign>({});
  const [savedThemes, setSavedThemes] = useState<SavedDocumentTheme[]>([]);
  const [themeName, setThemeName] = useState('');
  const [storageMessage, setStorageMessage] = useState('');

  const selectedSection = useMemo(
    () => document.sections.find(section => section.id === sectionId) || document.sections[0],
    [document.sections, sectionId]
  );
  const tables = selectedSection?.tables || [];
  const selectedTable = tables.find(table => table.id === tableId) || tables[0];

  useEffect(() => {
    if (!isOpen) return;
    const normalized = normalizeDocumentDesign(document);
    setDesign(deepCloneDesign(normalized.design || DEFAULT_DOCUMENT_DESIGN));
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
    { id: 'presets', label: 'Templates' },
    { id: 'page', label: 'Colors & Pages' },
    { id: 'typography', label: 'Typography' },
    { id: 'section', label: 'Sections' },
    { id: 'table', label: 'Tables' },
    { id: 'saved', label: 'My Themes' }
  ];

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-slate-700 bg-slate-900 text-slate-100 shadow-2xl">
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
          {tab === 'presets' && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {DOCUMENT_DESIGN_PRESETS.map(preset => (
                <button key={preset.presetId} onClick={() => setDesign(deepCloneDesign(preset))} className={'rounded-lg border p-3 text-left transition-colors ' + (design.presetId === preset.presetId ? 'border-blue-500 bg-blue-950/30' : 'border-slate-700 bg-slate-950 hover:border-slate-500')}>
                  <div className="mb-3 flex h-16 overflow-hidden rounded border border-slate-700" style={{ background: fillColor(preset.page.background, '#ffffff') }}>
                    <div className="flex w-full flex-col gap-2 p-2">
                      <div className="h-2 w-2/3 rounded" style={{ background: preset.colors.headingText }} />
                      <div className="h-1.5 w-full rounded" style={{ background: preset.colors.border }} />
                      <div className="h-1.5 w-4/5 rounded" style={{ background: preset.colors.accent }} />
                      <div className="mt-auto flex gap-1">{[preset.colors.primary, preset.colors.secondary, preset.colors.accent].map(color => <span key={color} className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />)}</div>
                    </div>
                  </div>
                  <span className="block text-xs font-semibold">{preset.name}</span>
                  <span className="mt-1 block text-[10px] text-slate-500">Select preset</span>
                </button>
              ))}
            </div>
          )}

          {tab === 'page' && (
            <div className="grid gap-6 md:grid-cols-2">
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

          {tab === 'saved' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-end gap-2 rounded-lg border border-slate-700 bg-slate-950 p-3">
                <label className="min-w-52 flex-1 text-[11px] text-slate-300">Theme name<input value={themeName} onChange={event => setThemeName(event.target.value)} placeholder="My custom theme" className="mt-1 block w-full rounded border border-slate-700 bg-slate-900 px-2 py-2 text-slate-100" /></label>
                <button onClick={persistSavedTheme} className="flex items-center gap-1.5 rounded bg-blue-600 px-3 py-2 text-xs font-semibold hover:bg-blue-500"><Save className="h-3.5 w-3.5" /> Save current theme</button>
              </div>
              {storageMessage && <p role="status" className="text-[11px] text-slate-400">{storageMessage}</p>}
              <div className="space-y-2">
                {savedThemes.map(theme => (
                  <div key={theme.id} className="flex flex-wrap items-center gap-3 rounded border border-slate-700 bg-slate-950 p-3">
                    <button onClick={() => applySavedTheme(theme)} className="min-w-0 flex-1 text-left"><span className="block text-xs font-medium">{theme.name}</span><span className="text-[10px] text-slate-500">Updated {new Date(theme.updatedAt).toLocaleDateString()}</span></button>
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
            <button onClick={() => setDesign(deepCloneDesign(normalizeDocumentDesign(document).design || DEFAULT_DOCUMENT_DESIGN))} className="rounded border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800">Discard local edits</button>
            <button onClick={() => { onApplyDesign(deepCloneDesign(design)); onClose(); }} className="flex items-center gap-1.5 rounded bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500"><Check className="h-3.5 w-3.5" /> Apply document design</button>
          </div>
        </footer>
      </div>
    </div>
  );
};
