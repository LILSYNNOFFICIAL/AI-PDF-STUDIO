import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Clock3, FileText, Heart, Search, Sparkles, Star, X } from 'lucide-react';
import {
  DOCUMENT_TEMPLATE_CATALOG,
  TEMPLATE_CATEGORIES,
  LIL_SYNN_TEMPLATE_ID,
  TEMPLATE_CATEGORY_COUNTS,
  getTemplateById,
  getTemplateAgreementDefaults,
  loadTemplateGalleryPreferences,
  recordTemplateRecent,
  saveTemplateGalleryPreferences,
  searchTemplates,
  type TemplateCategory
} from '../services/templateCatalog';
import { DOCUMENT_DESIGN_PRESETS, fillToCss } from '../services/documentDesign';
import { getTemplateArtworkPath } from '../services/templateArtwork';

interface TemplateGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTemplate: (templateId: string, themeId: string, agreementType: string) => void;
}

type GalleryView = 'all' | 'favorites' | 'recent';
type CategoryFilter = 'All Categories' | TemplateCategory;

function getSafeStorage(): Storage | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
}

export const TemplateGalleryModal: React.FC<TemplateGalleryModalProps> = ({
  isOpen,
  onClose,
  onCreateTemplate
}) => {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<CategoryFilter>('All Categories');
  const [view, setView] = useState<GalleryView>('all');
  const [selectedTemplateId, setSelectedTemplateId] = useState('recording-artist-agreement');
  const [selectedThemeId, setSelectedThemeId] = useState('midnight-executive');
  const [agreementType, setAgreementType] = useState('');
  const [agreementTypeTouched, setAgreementTypeTouched] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setPreferencesLoaded(false);
      return;
    }
    const storage = getSafeStorage();
    const saved = storage
      ? loadTemplateGalleryPreferences(storage)
      : { favorites: [], recents: [] };
    setFavoriteIds(saved.favorites);
    setRecentIds(saved.recents);
    setSelectedTemplateId(saved.recents[0] || 'recording-artist-agreement');
    setPreferencesLoaded(true);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !preferencesLoaded) return;
    const storage = getSafeStorage();
    if (storage) saveTemplateGalleryPreferences(storage, { favorites: favoriteIds, recents: recentIds });
  }, [isOpen, preferencesLoaded, favoriteIds, recentIds]);

  const availableTemplates = useMemo(() => {
    let matches = searchTemplates(query, category === 'All Categories' ? undefined : category);
    if (view === 'favorites') matches = matches.filter(template => favoriteIds.includes(template.id));
    if (view === 'recent') {
      matches = matches
        .filter(template => recentIds.includes(template.id))
        .sort((left, right) => recentIds.indexOf(left.id) - recentIds.indexOf(right.id));
    }
    return matches;
  }, [query, category, view, favoriteIds, recentIds]);

  const selectedTemplate = availableTemplates.find(template => template.id === selectedTemplateId)
    || availableTemplates[0]
    || null;
  const selectedTheme = DOCUMENT_DESIGN_PRESETS.find(preset => preset.presetId === selectedThemeId)
    || DOCUMENT_DESIGN_PRESETS[0];

  useEffect(() => {
    setAgreementType(getTemplateAgreementDefaults(selectedTemplate).agreementType);
    setAgreementTypeTouched(false);
    if (selectedTemplate?.id === LIL_SYNN_TEMPLATE_ID) setSelectedThemeId('lil-synn');
  }, [selectedTemplate?.id]);

  const toggleFavorite = (templateId: string) => {
    setFavoriteIds(current => current.includes(templateId)
      ? current.filter(id => id !== templateId)
      : [templateId, ...current]);
  };

  const selectCategory = (next: CategoryFilter) => {
    setCategory(next);
    setView('all');
  };

  const createSelectedTemplate = () => {
    if (!selectedTemplate) return;
    const next = recordTemplateRecent({ favorites: favoriteIds, recents: recentIds }, selectedTemplate.id);
    setRecentIds(next.recents);
    const storage = getSafeStorage();
    if (storage) saveTemplateGalleryPreferences(storage, next);
    onCreateTemplate(selectedTemplate.id, selectedThemeId, agreementType.trim() || getTemplateAgreementDefaults(selectedTemplate).agreementType);
  };

  const closeOnEscape = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="template-gallery-title"
      onKeyDown={closeOnEscape}
      className="fixed inset-0 z-[85] flex items-center justify-center bg-black/80 p-2 backdrop-blur-md sm:p-4"
    >
      <div className="flex max-h-[96vh] w-full max-w-[1500px] flex-col overflow-hidden rounded-2xl border border-slate-700 bg-[#0b0f16] text-slate-100 shadow-[0_24px_100px_rgba(0,0,0,0.65)]">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 bg-[#0e131c] px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10">
              <FileText className="h-5 w-5 text-amber-300" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 id="template-gallery-title" className="text-base font-semibold tracking-tight">Professional Template Gallery</h2>
                <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-200">100 new templates</span>
              </div>
              <p className="mt-0.5 text-[11px] text-slate-500">Choose the document structure first. Choose its visual theme separately.</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close template gallery" className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="grid min-h-0 flex-1 grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px]">
          <main className="flex min-h-0 flex-col border-b border-slate-800 xl:border-b-0 xl:border-r">
            <div className="space-y-3 border-b border-slate-800 bg-[#0d121b] p-4">
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative min-w-[220px] flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    autoFocus
                    value={query}
                    onChange={event => setQuery(event.target.value)}
                    placeholder="Search agreements, services, leases, licenses..."
                    aria-label="Search document templates"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2.5 pl-9 pr-3 text-xs text-slate-100 outline-none transition-colors placeholder:text-slate-600 focus:border-amber-500/60"
                  />
                </div>
                <div className="flex rounded-xl border border-slate-700 bg-slate-950 p-1">
                  {([
                    ['all', 'All'],
                    ['favorites', 'Favorites'],
                    ['recent', 'Recent']
                  ] as Array<[GalleryView, string]>).map(([value, label]) => (
                    <button
                      key={value}
                      onClick={() => setView(value)}
                      className={'rounded-lg px-3 py-1.5 text-[10px] transition-colors ' + (view === value ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-200')}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => selectCategory('All Categories')}
                  className={'rounded-full border px-3 py-1.5 text-[10px] transition-colors ' + (category === 'All Categories' ? 'border-amber-400/60 bg-amber-400/10 text-amber-100' : 'border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200')}
                >
                  All templates <span className="ml-1 opacity-60">{DOCUMENT_TEMPLATE_CATALOG.length}</span>
                </button>
                {TEMPLATE_CATEGORIES.map(item => (
                  <button
                    key={item}
                    onClick={() => selectCategory(item)}
                    className={'rounded-full border px-3 py-1.5 text-[10px] transition-colors ' + (category === item ? 'border-amber-400/60 bg-amber-400/10 text-amber-100' : 'border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200')}
                  >
                    {item} <span className="ml-1 opacity-50">{TEMPLATE_CATEGORY_COUNTS[item]}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
                  {availableTemplates.length} {availableTemplates.length === 1 ? 'template' : 'templates'}
                  {view === 'favorites' ? ' • Favorites' : view === 'recent' ? ' • Recently used' : ''}
                </p>
                <span className="text-[10px] text-slate-600">Select a card to inspect its contents</span>
              </div>

              {availableTemplates.length ? (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-3">
                  {availableTemplates.map(template => {
                    const previewTheme = DOCUMENT_DESIGN_PRESETS.find(preset => preset.presetId === selectedThemeId) || selectedTheme;
                    const isSelected = selectedTemplate?.id === template.id;
                    const isFavorite = favoriteIds.includes(template.id);
                      return (
                        <article
                          key={template.id}
                          className={'group relative overflow-hidden rounded-xl border p-3 text-left transition-all ' + (isSelected ? 'border-amber-400/70 bg-amber-400/[0.06] shadow-lg shadow-amber-950/20' : 'border-slate-800 bg-[#101722] hover:border-slate-600 hover:bg-[#141d2a]')}
                        >
                          <button
                            type="button"
                            onClick={() => setSelectedTemplateId(template.id)}
                            aria-pressed={isSelected}
                            className="w-full text-left outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                          >
                            <div className="relative mb-3 flex h-[118px] items-center justify-center overflow-hidden rounded-lg border p-2" style={{ background: fillToCss(previewTheme.coverPage.background), borderColor: previewTheme.coverPage.borderColor }}>
                              <img src={getTemplateArtworkPath(template.category, (import.meta as any).env?.BASE_URL || '/')} alt="" aria-hidden="true" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-90" />
                              <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/15 to-black/30" />
                              <div className="relative z-10 flex h-full w-full max-w-[180px] flex-col items-center justify-center border px-3 text-center backdrop-blur-[1px]" style={{ borderColor: previewTheme.coverPage.showFrame ? previewTheme.coverPage.borderColor : 'transparent' }}>
                                <span className="text-[6px] font-semibold tracking-[0.2em]" style={{ color: previewTheme.coverPage.detailColor }}>{previewTheme.coverPage.eyebrow}</span>
                                <span className="mt-2 line-clamp-2 text-[11px] font-semibold leading-tight" style={{ color: previewTheme.coverPage.titleColor, fontFamily: previewTheme.typography.headingFontFamily }}>{template.title}</span>
                                {previewTheme.coverPage.showOrnamentalRule && <span className="mt-2 h-px w-8" style={{ background: previewTheme.coverPage.borderColor }} />}
                                <div className="mt-auto flex gap-1 pb-1">
                                  {[previewTheme.colors.primary, previewTheme.colors.secondary, previewTheme.colors.accent, previewTheme.colors.border].map((color, index) => <span key={index} className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />)}
                                </div>
                              </div>
                              <span className="absolute bottom-2 right-2 rounded bg-black/50 px-1.5 py-1 text-[7px] uppercase tracking-wider text-white/70">{previewTheme.name}</span>
                            </div>
                            <div className="min-w-0 pr-8">
                              <span className="mb-1 block text-[9px] font-semibold uppercase tracking-[0.12em] text-amber-300/80">{template.category}</span>
                              <span className="block text-xs font-semibold leading-snug text-slate-100">{template.title}</span>
                            </div>
                            <p className="mt-2 line-clamp-2 text-[10px] leading-relaxed text-slate-500">{template.description}</p>
                            {isSelected && <span className="mt-3 inline-flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider text-amber-200">Selected <ArrowRight className="h-3 w-3" /></span>}
                          </button>
                          <button
                            type="button"
                            aria-label={(isFavorite ? 'Remove ' : 'Add ') + template.title + (isFavorite ? ' from favorites' : ' to favorites')}
                            onClick={() => toggleFavorite(template.id)}
                            className={'absolute right-3 top-3 rounded-lg border border-slate-700/60 bg-slate-950/80 p-1.5 transition-colors ' + (isFavorite ? 'text-rose-300 hover:bg-rose-500/10' : 'text-slate-500 hover:bg-slate-700 hover:text-rose-300')}
                          >
                            <Heart className="h-3.5 w-3.5" fill={isFavorite ? 'currentColor' : 'none'} />
                          </button>
                        </article>
                      );
                  })}
                </div>
              ) : (
                <div className="flex min-h-[250px] flex-col items-center justify-center text-center">
                  <Search className="mb-3 h-7 w-7 text-slate-700" />
                  <p className="text-sm font-medium text-slate-300">No templates found</p>
                  <p className="mt-1 max-w-xs text-[11px] text-slate-600">Try a different search term, clear a filter or browse another category.</p>
                  <button onClick={() => { setQuery(''); setCategory('All Categories'); setView('all'); }} className="mt-4 rounded-lg border border-slate-700 px-3 py-2 text-[10px] text-slate-300 hover:bg-slate-800">Clear filters</button>
                </div>
              )}
            </div>
          </main>

          <aside className="flex min-h-0 flex-col bg-[#0d121b]">
            {selectedTemplate ? (
              <>
                <div className="min-h-0 flex-1 overflow-y-auto p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wider text-amber-200">Template details</span>
                    <button onClick={() => toggleFavorite(selectedTemplate.id)} className={'rounded-lg p-2 ' + (favoriteIds.includes(selectedTemplate.id) ? 'text-rose-300' : 'text-slate-500 hover:text-rose-300')} aria-label="Toggle template favorite">
                      <Heart className="h-4 w-4" fill={favoriteIds.includes(selectedTemplate.id) ? 'currentColor' : 'none'} />
                    </button>
                  </div>
                  <h3 className="text-lg font-semibold leading-snug text-white">{selectedTemplate.title}</h3>
                  <p className="mt-2 text-[11px] leading-relaxed text-slate-400">{selectedTemplate.description}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {selectedTemplate.tags.map(tag => <span key={tag} className="rounded-full border border-slate-800 bg-slate-950 px-2 py-1 text-[9px] text-slate-500">{tag}</span>)}
                  </div>

                  <div className="mt-6">
                    <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400"><FileText className="h-3.5 w-3.5" /> Included document structure</div>
                    <ol className="space-y-2">
                      {selectedTemplate.sectionTitles.map((title, index) => (
                        <li key={title} className="flex items-start gap-2 rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2">
                          <span className="mt-0.5 font-mono text-[9px] text-amber-300/70">{String(index + 1).padStart(2, '0')}</span>
                          <span className="text-[10px] leading-relaxed text-slate-300">{title}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  <div className="mt-5 rounded-xl border border-slate-800 bg-slate-950/70 p-3">
                    <div className="mb-2 text-[9px] font-semibold uppercase tracking-wider text-slate-500">Template focus</div>
                    <p className="text-[10px] leading-relaxed text-slate-400">{selectedTemplate.focus}</p>
                    <div className="mb-2 mt-4 text-[9px] font-semibold uppercase tracking-wider text-slate-500">Primary deliverables</div>
                    <p className="text-[10px] leading-relaxed text-slate-400">{selectedTemplate.deliverable}</p>
                  </div>
                </div>

                <div className="border-t border-slate-800 p-4">
                  <label className="mb-2 block text-[10px] font-semibold uppercase tracking-wider text-slate-400" htmlFor="agreement-type-input">Agreement type / document title</label>
                  <input id="agreement-type-input" type="text" value={agreementType} onChange={event => { setAgreementTypeTouched(true); setAgreementType(event.target.value); }} placeholder="Enter any agreement type or document title" className="mb-3 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-xs text-slate-100 outline-none focus:border-amber-500/60" />
                  <label className="mb-2 block text-[10px] font-semibold uppercase tracking-wider text-slate-400">Choose a visual theme</label>
                  <select value={selectedThemeId} onChange={event => {
                    const nextThemeId = event.target.value;
                    setSelectedThemeId(nextThemeId);
                    // Visual themes never change the agreement type or document classification.
                  }} className="mb-3 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-xs text-slate-100 outline-none focus:border-amber-500/60">
                    {DOCUMENT_DESIGN_PRESETS.map(preset => <option key={preset.presetId} value={preset.presetId}>{preset.presetId === 'lil-synn' ? 'LIL SYNN • Branded Theme' : preset.name}</option>)}
                  </select>
                  <div className="mb-3 flex items-center gap-2">
                    {[selectedTheme.colors.primary, selectedTheme.colors.secondary, selectedTheme.colors.accent, selectedTheme.colors.border].map((color,index) => <span key={index} className="h-4 flex-1 rounded" style={{ background: color }} />)}
                    <span className="text-[9px] text-slate-500">{selectedTheme.name}</span>
                  </div>
                  <button onClick={createSelectedTemplate} className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 text-xs font-bold text-slate-950 shadow-lg shadow-amber-950/20 transition-colors hover:bg-amber-400">
                    <Sparkles className="h-4 w-4" /> Create document <ArrowRight className="h-4 w-4" />
                  </button>
                  <p className="mt-2 text-center text-[9px] leading-relaxed text-slate-600">Creates a fresh editable document with this theme. It does not replace the current document until selected.</p>
                </div>
              </>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
                <Star className="mb-3 h-7 w-7 text-slate-700" />
                <p className="text-sm text-slate-300">Choose a template</p>
                <p className="mt-1 text-[10px] text-slate-600">Select a template card to inspect its structure and choose a theme.</p>
              </div>
            )}
          </aside>
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-800 bg-[#0e131c] px-5 py-3">
          <div className="flex items-center gap-2 text-[9px] text-slate-500">
            <Clock3 className="h-3.5 w-3.5" />
            <span>{recentIds.length} recently used</span>
            <span className="text-slate-700">•</span>
            <span>{favoriteIds.length} favorites</span>
          </div>
          <p className="max-w-xl text-right text-[9px] leading-relaxed text-slate-600">Templates are editable starting points. Review jurisdiction-specific rules, business facts and negotiated terms before signing.</p>
        </footer>
      </div>
    </div>
  );
};

