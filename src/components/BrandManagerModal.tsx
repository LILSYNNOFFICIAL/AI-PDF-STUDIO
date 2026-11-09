import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Building2, Check, Download, ImagePlus, Plus, Save, Trash2, Upload, X } from 'lucide-react';
import type { BrandProfile, StyleConfig } from '../types/document';
import { createBrandProfileId } from '../services/brandProfiles';

type FontFamily = StyleConfig['fontFamily'];

interface BrandManagerModalProps {
  isOpen: boolean;
  profiles: BrandProfile[];
  activeBrandId: string;
  onClose: () => void;
  onSave: (profiles: BrandProfile[]) => void;
  onApply: (profile: BrandProfile) => void;
}

const FONTS: FontFamily[] = ['Inter', 'Helvetica', 'Georgia', 'Garamond', 'Times New Roman', 'Courier New'];
const EMPTY_PROFILE = (): BrandProfile => ({
  id: createBrandProfileId(),
  name: 'New Brand',
  companyName: '',
  primaryColor: '#172033',
  secondaryColor: '#2563eb',
  fontFamily: 'Inter'
});

export const BrandManagerModal: React.FC<BrandManagerModalProps> = ({
  isOpen, profiles, activeBrandId, onClose, onSave, onApply
}) => {
  const [draft, setDraft] = useState<BrandProfile>(EMPTY_PROFILE);
  const [selectedId, setSelectedId] = useState(activeBrandId);
  const [isNew, setIsNew] = useState(false);
  const [message, setMessage] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const selected = profiles.find(profile => profile.id === activeBrandId) || profiles[0] || EMPTY_PROFILE();
    setDraft({ ...selected });
    setSelectedId(selected.id);
    setIsNew(false);
    setMessage('');
  }, [isOpen, activeBrandId]);

  const selectedProfile = useMemo(
    () => profiles.find(profile => profile.id === selectedId),
    [profiles, selectedId]
  );

  if (!isOpen) return null;

  const update = (patch: Partial<BrandProfile>) => setDraft(current => ({ ...current, ...patch }));
  const selectProfile = (id: string) => {
    const profile = profiles.find(item => item.id === id);
    if (!profile) return;
    setSelectedId(id);
    setDraft({ ...profile });
    setIsNew(false);
    setMessage('');
  };
  const saveDraft = () => {
    if (!draft.name.trim() || !draft.companyName.trim()) {
      setMessage('Brand name and company name are required.');
      return;
    }
    if (!/^#[0-9a-f]{6}$/i.test(draft.primaryColor) || !/^#[0-9a-f]{6}$/i.test(draft.secondaryColor)) {
      setMessage('Use valid six-digit HEX colors.');
      return;
    }
    const next = isNew
      ? [...profiles, { ...draft, name: draft.name.trim(), companyName: draft.companyName.trim() }]
      : profiles.map(profile => profile.id === draft.id
        ? { ...draft, name: draft.name.trim(), companyName: draft.companyName.trim() }
        : profile);
    onSave(next);
    setSelectedId(draft.id);
    setIsNew(false);
    setMessage('Brand profile saved.');
  };
  const applyDraft = () => {
    if (!draft.name.trim() || !draft.companyName.trim()) {
      setMessage('Brand name and company name are required.');
      return;
    }
    if (!/^#[0-9a-f]{6}$/i.test(draft.primaryColor) || !/^#[0-9a-f]{6}$/i.test(draft.secondaryColor)) {
      setMessage('Use valid six-digit HEX colors.');
      return;
    }
    const normalizedDraft = { ...draft, name: draft.name.trim(), companyName: draft.companyName.trim() };
    const next = isNew
      ? [...profiles, normalizedDraft]
      : profiles.map(profile => profile.id === draft.id ? normalizedDraft : profile);
    onSave(next);
    onApply(normalizedDraft);
    onClose();
  };
  const startNew = () => {
    const next = EMPTY_PROFILE();
    setDraft(next);
    setSelectedId(next.id);
    setIsNew(true);
    setMessage('New profile. Add its details and save.');
  };
  const deleteDraft = () => {
    if (profiles.length <= 1) {
      setMessage('Keep at least one saved brand profile.');
      return;
    }
    if (isNew) {
      selectProfile(profiles[0]?.id || '');
      return;
    }
    if (!window.confirm('Delete this brand profile? This cannot be undone.')) return;
    const next = profiles.filter(profile => profile.id !== draft.id);
    onSave(next);
    const fallback = next[0];
    if (fallback) selectProfile(fallback.id);
    else startNew();
    setMessage('Brand profile deleted.');
  };
  const importProfiles = async (file?: File) => {
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      const imported = Array.isArray(parsed) ? parsed : [parsed];
      const valid = imported.filter((item: any) => item && typeof item.name === 'string'
        && typeof item.companyName === 'string' && typeof item.primaryColor === 'string'
        && typeof item.secondaryColor === 'string' && typeof item.fontFamily === 'string');
      if (!valid.length) throw new Error('No valid brand profiles found.');
      const normalized = valid.map((item: BrandProfile) => ({ ...item, id: createBrandProfileId() }));
      onSave([...profiles, ...normalized]);
      setMessage('Imported ' + normalized.length + ' brand profile(s).');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not import that file.');
    }
  };
  const exportProfiles = () => {
    const blob = new Blob([JSON.stringify(profiles, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = window.document.createElement('a');
    anchor.href = url;
    anchor.download = 'ai-pdf-studio-brands.json';
    anchor.click();
    URL.revokeObjectURL(url);
  };
  const handleLogo = (file?: File) => {
    if (!file) return;
    if (!['image/png', 'image/jpeg'].includes(file.type)) {
      setMessage('Choose a PNG or JPG image for the logo.');
      return;
    }
    if (file.size > 1_500_000) {
      setMessage('Logo files must be 1.5 MB or smaller to fit browser storage. Resize the image and try again.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') update({ logoUrl: reader.result });
    };
    reader.onerror = () => setMessage('Could not read that logo file.');
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="brand-manager-title">
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-700 bg-[#0b111c] shadow-2xl">
        <header className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-indigo-400/20 bg-indigo-400/10 p-2 text-indigo-300"><Building2 className="h-5 w-5" /></div>
            <div><h2 id="brand-manager-title" className="text-base font-semibold text-white">Brand Manager</h2><p className="text-xs text-slate-400">Create reusable identities for every document.</p></div>
          </div>
          <button onClick={onClose} aria-label="Close Brand Manager" className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"><X className="h-4 w-4" /></button>
        </header>

        <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[250px_minmax(0,1fr)]">
          <aside className="flex min-h-0 flex-col border-b border-slate-800 bg-slate-950/50 p-3 md:border-b-0 md:border-r">
            <button onClick={startNew} className="mb-3 flex items-center justify-center gap-2 rounded-lg border border-indigo-400/40 bg-indigo-500/10 px-3 py-2.5 text-xs font-semibold text-indigo-200 hover:bg-indigo-500/20"><Plus className="h-4 w-4" /> Create brand</button>
            <div className="min-h-0 space-y-1 overflow-y-auto">
              {profiles.map(profile => (
                <button key={profile.id} onClick={() => selectProfile(profile.id)} className={'flex w-full items-center gap-2 rounded-lg border px-2.5 py-2 text-left ' + (selectedId === profile.id ? 'border-indigo-400/40 bg-indigo-500/10' : 'border-transparent hover:bg-slate-800/70')}>
                  {profile.logoUrl ? <img src={profile.logoUrl} alt="" className="h-8 w-8 rounded bg-white object-contain p-1" /> : <span className="flex h-8 w-8 items-center justify-center rounded bg-slate-800 text-[10px] font-bold text-slate-300">{profile.name.slice(0, 2).toUpperCase()}</span>}
                  <span className="min-w-0 flex-1"><span className="block truncate text-xs font-medium text-slate-100">{profile.name}</span><span className="block truncate text-[10px] text-slate-500">{profile.companyName}</span></span>
                  {activeBrandId === profile.id && <Check className="h-3.5 w-3.5 text-emerald-400" />}
                </button>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-800 pt-3">
              <button onClick={exportProfiles} className="flex items-center justify-center gap-1 rounded-lg border border-slate-700 px-2 py-2 text-[10px] text-slate-300 hover:bg-slate-800"><Download className="h-3 w-3" /> Export</button>
              <label className="flex cursor-pointer items-center justify-center gap-1 rounded-lg border border-slate-700 px-2 py-2 text-[10px] text-slate-300 hover:bg-slate-800"><Upload className="h-3 w-3" /> Import<input type="file" accept="application/json,.json" className="hidden" onChange={event => { void importProfiles(event.target.files?.[0]); event.currentTarget.value = ''; }} /></label>
            </div>
          </aside>

          <main className="min-h-0 overflow-y-auto p-5">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div><p className="text-[10px] uppercase tracking-[0.18em] text-indigo-300">{isNew ? 'New identity' : 'Brand identity'}</p><h3 className="mt-1 text-lg font-semibold text-white">{draft.name || 'Untitled brand'}</h3></div>
              <div className="flex gap-2">
                {!isNew && <button onClick={deleteDraft} className="flex items-center gap-1.5 rounded-lg border border-rose-500/30 px-3 py-2 text-xs text-rose-300 hover:bg-rose-500/10"><Trash2 className="h-3.5 w-3.5" /> Delete</button>}
                <button onClick={saveDraft} className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-500"><Save className="h-3.5 w-3.5" /> Save profile</button>
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="space-y-1 text-xs text-slate-300"><span>Brand name</span><input value={draft.name} onChange={event => update({ name: event.target.value })} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-400" /></label>
                  <label className="space-y-1 text-xs text-slate-300"><span>Company / legal name</span><input value={draft.companyName} onChange={event => update({ companyName: event.target.value })} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-400" /></label>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                  <div className="mb-3 flex items-center justify-between"><div><p className="text-xs font-semibold text-white">Logo</p><p className="text-[10px] text-slate-500">PNG or JPG. Maximum 1.5 MB.</p></div><button onClick={() => fileRef.current?.click()} className="flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-200 hover:bg-slate-800"><ImagePlus className="h-3.5 w-3.5" /> Upload logo</button></div>
                  <input ref={fileRef} type="file" accept="image/png,image/jpeg" className="hidden" onChange={event => { handleLogo(event.target.files?.[0]); event.currentTarget.value = ''; }} />
                  {draft.logoUrl ? <div className="flex items-center gap-4"><div className="flex h-24 w-48 items-center justify-center rounded-lg border border-slate-700 bg-white p-3"><img src={draft.logoUrl} alt={draft.name + ' logo preview'} className="max-h-full max-w-full object-contain" /></div><button onClick={() => update({ logoUrl: undefined })} className="text-xs text-rose-300 hover:text-rose-200">Remove logo</button></div> : <button onClick={() => fileRef.current?.click()} className="flex h-20 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-slate-700 text-xs text-slate-500 hover:border-indigo-400/60 hover:text-indigo-200"><ImagePlus className="h-4 w-4" /> Add a logo instead of a placeholder</button>}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="space-y-1 text-xs text-slate-300"><span>Primary brand color</span><span className="flex gap-2"><input type="color" value={draft.primaryColor} onChange={event => update({ primaryColor: event.target.value })} className="h-10 w-12 rounded border border-slate-700 bg-slate-900 p-1" /><input value={draft.primaryColor} onChange={event => update({ primaryColor: event.target.value })} className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-mono text-white" /></span></label>
                  <label className="space-y-1 text-xs text-slate-300"><span>Secondary / accent color</span><span className="flex gap-2"><input type="color" value={draft.secondaryColor} onChange={event => update({ secondaryColor: event.target.value })} className="h-10 w-12 rounded border border-slate-700 bg-slate-900 p-1" /><input value={draft.secondaryColor} onChange={event => update({ secondaryColor: event.target.value })} className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-mono text-white" /></span></label>
                  <label className="space-y-1 text-xs text-slate-300"><span>Brand typography</span><select value={draft.fontFamily} onChange={event => update({ fontFamily: event.target.value as FontFamily })} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-xs text-white">{FONTS.map(font => <option key={font}>{font}</option>)}</select></label>
                  <label className="space-y-1 text-xs text-slate-300"><span>Header text</span><input value={draft.headerNote || ''} onChange={event => update({ headerNote: event.target.value })} placeholder="Optional running header" className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-xs text-white" /></label>
                  <label className="space-y-1 text-xs text-slate-300 sm:col-span-2"><span>Footer / legal disclaimer</span><textarea rows={2} value={draft.footerDisclaimer || ''} onChange={event => update({ footerDisclaimer: event.target.value })} placeholder="Optional footer text" className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-xs text-white" /></label>
                </div>
              </div>
              <aside className="space-y-3">
                <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Live identity preview</p>
                <div className="overflow-hidden rounded-xl border border-slate-700 bg-white text-slate-900 shadow-xl">
                  <div className="h-2" style={{ background: draft.primaryColor }} />
                  <div className="p-4">
                    {draft.logoUrl ? <img src={draft.logoUrl} alt="" className="mb-4 max-h-12 max-w-36 object-contain" /> : <div className="mb-4 text-[10px] font-bold tracking-[0.2em]" style={{ color: draft.secondaryColor }}>{draft.name.toUpperCase() || 'BRAND NAME'}</div>}
                    <div className="text-lg font-semibold" style={{ fontFamily: draft.fontFamily }}>{draft.companyName || 'Company name'}</div>
                    <div className="mt-2 h-px" style={{ background: draft.secondaryColor }} />
                    <p className="mt-3 text-[9px] leading-relaxed text-slate-500">Document identity preview. Applied profiles provide editable branding and typography to the active document.</p>
                    <p className="mt-8 border-t border-slate-200 pt-2 text-[8px] text-slate-500">{draft.footerDisclaimer || 'Footer disclaimer'}</p>
                  </div>
                </div>
                <button disabled={!selectedProfile && !isNew} onClick={applyDraft} className="flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/20 disabled:opacity-40"><Check className="h-4 w-4" /> Apply to document</button>
              </aside>
            </div>
            {message && <p role="status" className="mt-4 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-300">{message}</p>}
          </main>
        </div>
        <footer className="flex justify-end border-t border-slate-800 px-5 py-3"><button onClick={onClose} className="rounded-lg border border-slate-700 px-4 py-2 text-xs text-slate-300 hover:bg-slate-800">Close</button></footer>
      </div>
    </div>
  );
};
