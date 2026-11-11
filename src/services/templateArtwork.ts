import type { TemplateCategory } from './templateCatalog';

const ARTWORK_BY_CATEGORY: Record<TemplateCategory, string> = {
  'Music & Entertainment': 'music-entertainment.svg',
  'Business & Commercial': 'business-commercial.svg',
  'Real Estate & Rentals': 'real-estate.svg',
  'Creative & Freelance': 'creative-freelance.svg',
  'Employment & HR': 'employment-hr.svg',
  'Corporate & Legal': 'corporate-legal.svg',
  'Finance & Investment': 'finance-investment.svg',
  'Technology & Data': 'technology-data.svg',
  'Marketing & Partnerships': 'marketing-partnerships.svg',
  'Personal & General': 'personal-general.svg'
};

/** Returns an application-base-aware path to an original, locally bundled cover illustration. */
export function getTemplateArtworkPath(category: TemplateCategory, baseUrl = '/'): string {
  const base = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
  return base + 'assets/templates/' + ARTWORK_BY_CATEGORY[category];
}

export function getLilSynnArtworkPath(baseUrl = '/'): string {
  const base = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
  return base + 'assets/templates/lil-synn.svg';
}
