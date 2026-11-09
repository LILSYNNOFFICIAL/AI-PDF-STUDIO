import type { BrandProfile } from '../types/document';
import { SAMPLE_BRAND_PROFILES } from './sampleDocuments';

const STORAGE_KEY = 'ai-pdf-studio.brand-profiles.v1';

function isBrandProfile(value: unknown): value is BrandProfile {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<BrandProfile>;
  return typeof item.id === 'string'
    && typeof item.name === 'string'
    && typeof item.companyName === 'string'
    && typeof item.primaryColor === 'string'
    && typeof item.secondaryColor === 'string'
    && typeof item.fontFamily === 'string';
}

export function loadBrandProfiles(): BrandProfile[] {
  const defaults = SAMPLE_BRAND_PROFILES.map(profile => ({ ...profile }));
  if (typeof window === 'undefined') return defaults;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return defaults;
    const saved = parsed.filter(isBrandProfile);
    return saved.length || parsed.length === 0 ? saved.map(profile => ({ ...profile })) : defaults;
  } catch {
    return defaults;
  }
}

export function saveBrandProfiles(profiles: BrandProfile[]): { ok: boolean; error?: string } {
  if (typeof window === 'undefined') return { ok: false, error: 'Brand storage is unavailable.' };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
    return { ok: true };
  } catch {
    return { ok: false, error: 'Could not save brand profiles. The browser storage limit may have been reached. Try a smaller logo.' };
  }
}

export function createBrandProfileId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? 'brand_' + crypto.randomUUID()
    : 'brand_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
