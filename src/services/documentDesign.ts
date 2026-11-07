import type {
  BorderConfig,
  BorderSide,
  ColorFill,
  DesignColors,
  DocumentDesign,
  DocumentModel,
  BrandProfile,
  Section,
  SectionDesign,
  StyleConfig,
  TableBlock,
  TableDesign
} from '../types/document';

const FONT_FAMILIES: StyleConfig['fontFamily'][] = [
  'Times New Roman', 'Garamond', 'Inter', 'Helvetica', 'Georgia', 'Courier New'
];

const solid = (color: string, opacity = 1): ColorFill => ({ type: 'solid', color, opacity });

const BASE_DESIGN: DocumentDesign = {
  schemaVersion: 1,
  presetId: 'minimal-contemporary',
  name: 'Minimal Contemporary',
  colors: {
    primary: '#172033',
    secondary: '#475569',
    accent: '#2563eb',
    bodyText: '#334155',
    mutedText: '#64748b',
    headingText: '#172033',
    pageSurface: '#ffffff',
    sectionSurface: '#f8fafc',
    border: '#dbe3ee',
    tableHeaderSurface: '#eef2f7',
    tableHeaderText: '#172033',
    tableBodyText: '#334155',
    tableAlternateRowSurface: '#f8fafc'
  },
  typography: {
    bodyFontFamily: 'Inter',
    bodyFontSize: 10.5,
    bodyLineHeight: 1.45,
    paragraphSpacing: 9,
    headingFontFamily: 'Inter',
    heading1Size: 22,
    heading2Size: 14,
    heading3Size: 12,
    headingCase: 'none'
  },
  page: { background: solid('#ffffff') },
  sectionDefaults: {
    background: solid('#ffffff'),
    padding: 10,
    border: { style: 'none', color: '#dbe3ee', width: 0 }
  },
  tableDefaults: {
    headerBackground: solid('#eef2f7'),
    headerTextColor: '#172033',
    bodyBackground: solid('#ffffff'),
    bodyTextColor: '#334155',
    alternateRowBackground: solid('#f8fafc'),
    gridlineColor: '#dbe3ee',
    gridlineWidth: 0.25,
    captionColor: '#64748b'
  },
  pageFurniture: {
    headerTextColor: '#64748b',
    footerTextColor: '#64748b',
    dividerColor: '#dbe3ee',
    dividerWidth: 0.3
  }
};

function makePreset(
  presetId: string,
  name: string,
  colors: Partial<DesignColors>,
  typography: Partial<DocumentDesign['typography']>,
  pageBackground: ColorFill,
  sectionBackground: ColorFill,
  tableHeaderBackground: ColorFill
): DocumentDesign {
  const result = deepCloneDesign(BASE_DESIGN);
  result.presetId = presetId;
  result.name = name;
  result.colors = { ...result.colors, ...colors };
  result.typography = { ...result.typography, ...typography };
  result.page = { background: pageBackground };
  result.sectionDefaults.background = sectionBackground;
  result.tableDefaults.headerBackground = tableHeaderBackground;
  result.tableDefaults.headerTextColor = result.colors.tableHeaderText;
  result.tableDefaults.bodyTextColor = result.colors.tableBodyText;
  result.tableDefaults.alternateRowBackground = solid(result.colors.tableAlternateRowSurface);
  result.tableDefaults.gridlineColor = result.colors.border;
  result.pageFurniture.headerTextColor = result.colors.mutedText;
  result.pageFurniture.footerTextColor = result.colors.mutedText;
  result.pageFurniture.dividerColor = result.colors.border;
  return result;
}

export function deepCloneDesign<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export const DEFAULT_DOCUMENT_DESIGN: DocumentDesign = deepCloneDesign(BASE_DESIGN);

export const DOCUMENT_DESIGN_PRESETS: DocumentDesign[] = [
  makePreset('modern-corporate', 'Modern Corporate',
    { primary: '#12243a', secondary: '#465a70', accent: '#2563eb', bodyText: '#344256', mutedText: '#69788a', headingText: '#12243a', pageSurface: '#ffffff', sectionSurface: '#f3f6fa', border: '#d7e0eb', tableHeaderSurface: '#e8eef5', tableHeaderText: '#12243a', tableBodyText: '#344256', tableAlternateRowSurface: '#f5f8fb' },
    { bodyFontFamily: 'Inter', headingFontFamily: 'Inter', bodyFontSize: 10.5, heading1Size: 22, heading2Size: 14 },
    solid('#ffffff'), solid('#f8fafc'), solid('#e8eef5')),
  makePreset('luxury-executive', 'Luxury Executive',
    { primary: '#25211d', secondary: '#62594d', accent: '#b08a45', bodyText: '#403a33', mutedText: '#857a6c', headingText: '#25211d', pageSurface: '#fffdf8', sectionSurface: '#faf6ed', border: '#ded4c1', tableHeaderSurface: '#eee5d5', tableHeaderText: '#30291f', tableBodyText: '#403a33', tableAlternateRowSurface: '#faf7f0' },
    { bodyFontFamily: 'Garamond', headingFontFamily: 'Garamond', bodyFontSize: 11.5, heading1Size: 25, heading2Size: 15, headingCase: 'none' },
    solid('#fffdf8'), solid('#faf6ed'), solid('#eee5d5')),
  makePreset('creative-studio', 'Creative Studio',
    { primary: '#24152f', secondary: '#60406f', accent: '#d946a6', bodyText: '#342b3b', mutedText: '#776b80', headingText: '#24152f', pageSurface: '#ffffff', sectionSurface: '#fcf5fb', border: '#ead4e5', tableHeaderSurface: '#f4e5f0', tableHeaderText: '#24152f', tableBodyText: '#342b3b', tableAlternateRowSurface: '#fcf5fb' },
    { bodyFontFamily: 'Inter', headingFontFamily: 'Inter', bodyFontSize: 10.5, heading1Size: 25, heading2Size: 15 },
    solid('#ffffff'), solid('#fcf5fb'), solid('#f4e5f0')),
  makePreset('minimal-contemporary', 'Minimal Contemporary',
    { primary: '#172033', secondary: '#475569', accent: '#0f766e', bodyText: '#334155', mutedText: '#64748b', headingText: '#172033', pageSurface: '#ffffff', sectionSurface: '#f8fafc', border: '#dbe3ee', tableHeaderSurface: '#eef2f7', tableHeaderText: '#172033', tableBodyText: '#334155', tableAlternateRowSurface: '#f8fafc' },
    { bodyFontFamily: 'Inter', headingFontFamily: 'Inter', bodyFontSize: 10.5, heading1Size: 22, heading2Size: 14 },
    solid('#ffffff'), solid('#ffffff'), solid('#eef2f7')),
  makePreset('bold-editorial', 'Bold Editorial',
    { primary: '#191919', secondary: '#494949', accent: '#b42318', bodyText: '#303030', mutedText: '#777777', headingText: '#191919', pageSurface: '#fffefa', sectionSurface: '#faf7f2', border: '#ded8d0', tableHeaderSurface: '#eee8df', tableHeaderText: '#191919', tableBodyText: '#303030', tableAlternateRowSurface: '#faf7f2' },
    { bodyFontFamily: 'Georgia', headingFontFamily: 'Georgia', bodyFontSize: 11, heading1Size: 27, heading2Size: 16, headingCase: 'none' },
    solid('#fffefa'), solid('#faf7f2'), solid('#eee8df')),
  makePreset('technology-professional', 'Technology Professional',
    { primary: '#102336', secondary: '#3b586e', accent: '#0891b2', bodyText: '#2d4354', mutedText: '#60798a', headingText: '#102336', pageSurface: '#fdfefe', sectionSurface: '#f0f8fa', border: '#cbdde4', tableHeaderSurface: '#dceef2', tableHeaderText: '#102336', tableBodyText: '#2d4354', tableAlternateRowSurface: '#f3fafb' },
    { bodyFontFamily: 'Inter', headingFontFamily: 'Inter', bodyFontSize: 10.5, heading1Size: 23, heading2Size: 14 },
    solid('#fdfefe'), solid('#f0f8fa'), solid('#dceef2')),
  makePreset('contemporary-legal', 'Contemporary Legal',
    { primary: '#16243b', secondary: '#4a5568', accent: '#315d91', bodyText: '#303b4c', mutedText: '#687487', headingText: '#16243b', pageSurface: '#ffffff', sectionSurface: '#f7f9fc', border: '#d5dce7', tableHeaderSurface: '#e9eef5', tableHeaderText: '#16243b', tableBodyText: '#303b4c', tableAlternateRowSurface: '#f8fafc' },
    { bodyFontFamily: 'Times New Roman', headingFontFamily: 'Times New Roman', bodyFontSize: 11, heading1Size: 20, heading2Size: 14, headingCase: 'uppercase' },
    solid('#ffffff'), solid('#ffffff'), solid('#e9eef5')),
  makePreset('financial-report', 'Financial Report',
    { primary: '#17342d', secondary: '#4e665f', accent: '#16835d', bodyText: '#344640', mutedText: '#6c7d76', headingText: '#17342d', pageSurface: '#ffffff', sectionSurface: '#f3f8f5', border: '#d3e1d9', tableHeaderSurface: '#e1eee6', tableHeaderText: '#17342d', tableBodyText: '#344640', tableAlternateRowSurface: '#f3f8f5' },
    { bodyFontFamily: 'Garamond', headingFontFamily: 'Garamond', bodyFontSize: 11, heading1Size: 23, heading2Size: 15 },
    solid('#ffffff'), solid('#f3f8f5'), solid('#e1eee6'))
];

function isHexColor(value: unknown): value is string {
  return typeof value === 'string' && /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(value);
}

function validateColor(value: unknown, path: string): void {
  if (!isHexColor(value)) throw new Error(path + ' must be a 3- or 6-digit hexadecimal color.');
}

function validateFill(fill: unknown, path: string): asserts fill is ColorFill {
  if (!fill || typeof fill !== 'object') throw new Error(path + ' must be a fill object.');
  const value = fill as Record<string, unknown>;
  if (value.type === 'solid') {
    validateColor(value.color, path + '.color');
    if (value.opacity !== undefined && (typeof value.opacity !== 'number' || !Number.isFinite(value.opacity) || value.opacity < 0 || value.opacity > 1)) {
      throw new Error(path + '.opacity must be between 0 and 1.');
    }
    return;
  }
  if (value.type === 'linear-gradient') {
    if (typeof value.angle !== 'number' || !Number.isFinite(value.angle)) throw new Error(path + '.angle must be finite.');
    if (value.opacity !== undefined && (typeof value.opacity !== 'number' || !Number.isFinite(value.opacity) || value.opacity < 0 || value.opacity > 1)) {
      throw new Error(path + '.opacity must be between 0 and 1.');
    }
    if (!Array.isArray(value.stops) || value.stops.length < 2) throw new Error(path + ' must contain at least two gradient stops.');
    let priorPosition = -1;
    for (const [index, stop] of value.stops.entries()) {
      if (!stop || typeof stop !== 'object') throw new Error(path + '.stops[' + index + '] is invalid.');
      validateColor((stop as Record<string, unknown>).color, path + '.stops[' + index + '].color');
      const position = (stop as Record<string, unknown>).position;
      if (typeof position !== 'number' || !Number.isFinite(position) || position < 0 || position > 100 || position < priorPosition) {
        throw new Error(path + '.stops positions must be ordered values between 0 and 100.');
      }
      priorPosition = position;
    }
    return;
  }
  throw new Error(path + '.type must be solid or linear-gradient.');
}

function validateBorder(border: unknown, path: string): asserts border is BorderConfig {
  if (!border || typeof border !== 'object') throw new Error(path + ' must be a border object.');
  const value = border as Record<string, unknown>;
  if (!['none', 'solid', 'dashed', 'dotted', 'double'].includes(String(value.style))) throw new Error(path + '.style is unsupported.');
  validateColor(value.color, path + '.color');
  if (typeof value.width !== 'number' || !Number.isFinite(value.width) || value.width < 0 || value.width > 20) {
    throw new Error(path + '.width must be between 0 and 20.');
  }
  if (value.sides !== undefined && (!Array.isArray(value.sides) || value.sides.some(side => !['top', 'right', 'bottom', 'left'].includes(String(side))))) {
    throw new Error(path + '.sides contains an unsupported side.');
  }
}

export function validateSectionDesign(design: SectionDesign): void {
  if (!design || typeof design !== 'object') throw new Error('Section design must be an object.');
  if (design.background) validateFill(design.background, 'section.background');
  if (design.bodyTextColor) validateColor(design.bodyTextColor, 'section.bodyTextColor');
  if (design.headingColor) validateColor(design.headingColor, 'section.headingColor');
  if (design.border) validateBorder(design.border, 'section.border');
  if (design.padding !== undefined && (!Number.isFinite(design.padding) || design.padding < 0 || design.padding > 100)) {
    throw new Error('section.padding must be between 0 and 100.');
  }
}

export function validateTableDesign(design: TableDesign): void {
  if (!design || typeof design !== 'object') throw new Error('Table design must be an object.');
  if (design.headerBackground) validateFill(design.headerBackground, 'table.headerBackground');
  if (design.bodyBackground) validateFill(design.bodyBackground, 'table.bodyBackground');
  if (design.alternateRowBackground) validateFill(design.alternateRowBackground, 'table.alternateRowBackground');
  for (const key of ['headerTextColor', 'bodyTextColor', 'gridlineColor', 'captionColor'] as const) {
    if (design[key]) validateColor(design[key], 'table.' + key);
  }
  if (design.gridlineWidth !== undefined && (!Number.isFinite(design.gridlineWidth) || design.gridlineWidth < 0 || design.gridlineWidth > 10)) {
    throw new Error('table.gridlineWidth must be between 0 and 10.');
  }
}

export function validateDocumentDesign(design: DocumentDesign): void {
  if (!design || typeof design !== 'object') throw new Error('Document design must be an object.');
  if (design.schemaVersion !== 1) throw new Error('Unsupported document design schema version.');
  if (typeof design.presetId !== 'string' || !design.presetId.trim()) throw new Error('Document design presetId must be a non-empty string.');
  if (typeof design.name !== 'string' || !design.name.trim()) throw new Error('Document design name must be a non-empty string.');
  if (design.typography?.bodyBold !== undefined && typeof design.typography.bodyBold !== 'boolean') throw new Error('typography.bodyBold must be a boolean.');
  if (design.typography?.bodyItalic !== undefined && typeof design.typography.bodyItalic !== 'boolean') throw new Error('typography.bodyItalic must be a boolean.');
  for (const [key, value] of Object.entries(design.colors || {})) validateColor(value, 'colors.' + key);
  const requiredColors = ['primary', 'secondary', 'accent', 'bodyText', 'mutedText', 'headingText', 'pageSurface', 'sectionSurface', 'border', 'tableHeaderSurface', 'tableHeaderText', 'tableBodyText', 'tableAlternateRowSurface'];
  for (const key of requiredColors) {
    if (!(design.colors as unknown as Record<string, unknown>)?.[key]) throw new Error('Missing required semantic color token: ' + key);
  }
  validateFill(design.page?.background, 'page.background');
  if (design.page?.firstPageBackground) validateFill(design.page.firstPageBackground, 'page.firstPageBackground');
  if (design.sectionDefaults?.background) validateFill(design.sectionDefaults.background, 'sectionDefaults.background');
  validateBorder(design.sectionDefaults?.border, 'sectionDefaults.border');
  if (!Number.isFinite(design.sectionDefaults?.padding) || design.sectionDefaults.padding < 0 || design.sectionDefaults.padding > 100) throw new Error('sectionDefaults.padding must be between 0 and 100.');
  validateFill(design.tableDefaults?.headerBackground, 'tableDefaults.headerBackground');
  validateFill(design.tableDefaults?.bodyBackground, 'tableDefaults.bodyBackground');
  if (design.tableDefaults?.alternateRowBackground) validateFill(design.tableDefaults.alternateRowBackground, 'tableDefaults.alternateRowBackground');
  for (const [key, value] of Object.entries({
    headerTextColor: design.tableDefaults?.headerTextColor,
    bodyTextColor: design.tableDefaults?.bodyTextColor,
    gridlineColor: design.tableDefaults?.gridlineColor,
    captionColor: design.tableDefaults?.captionColor,
    headerTextColor2: design.pageFurniture?.headerTextColor,
    footerTextColor: design.pageFurniture?.footerTextColor,
    dividerColor: design.pageFurniture?.dividerColor
  })) validateColor(value, key);
  if (!Number.isFinite(design.tableDefaults?.gridlineWidth) || design.tableDefaults.gridlineWidth < 0 || design.tableDefaults.gridlineWidth > 10) throw new Error('tableDefaults.gridlineWidth must be between 0 and 10.');
  if (!Number.isFinite(design.pageFurniture?.dividerWidth) || design.pageFurniture.dividerWidth < 0 || design.pageFurniture.dividerWidth > 10) throw new Error('pageFurniture.dividerWidth must be between 0 and 10.');
  const typography = design.typography;
  if (!typography || !FONT_FAMILIES.includes(typography.bodyFontFamily) || !FONT_FAMILIES.includes(typography.headingFontFamily)) throw new Error('Typography uses an unsupported font family.');
  for (const [key, value] of Object.entries({
    bodyFontSize: typography.bodyFontSize,
    bodyLineHeight: typography.bodyLineHeight,
    paragraphSpacing: typography.paragraphSpacing,
    heading1Size: typography.heading1Size,
    heading2Size: typography.heading2Size,
    heading3Size: typography.heading3Size
  })) if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0 || value > 100) throw new Error('typography.' + key + ' must be a positive number no greater than 100.');
  if (!['uppercase', 'capitalize', 'none'].includes(typography.headingCase)) throw new Error('typography.headingCase is unsupported.');
}

function mergeDeep<T>(base: T, patch: unknown): T {
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) return patch === undefined ? deepCloneDesign(base) : patch as T;
  const source = base && typeof base === 'object' && !Array.isArray(base) ? base as Record<string, unknown> : {};
  const target = patch as Record<string, unknown>;
  const result: Record<string, unknown> = { ...source };
  for (const key of Object.keys(target)) {
    const current = source[key];
    const next = target[key];
    result[key] = next && typeof next === 'object' && !Array.isArray(next) && current && typeof current === 'object' && !Array.isArray(current)
      ? mergeDeep(current, next)
      : deepCloneDesign(next);
  }
  return result as T;
}

export function normalizeDocumentDesign<T extends DocumentModel>(doc: T, brandProfile?: BrandProfile): T {
  const current = doc.design;
  if (current && current.schemaVersion !== 1) throw new Error('This document uses an unsupported design schema version.');
  let design = current
    ? mergeDeep(DEFAULT_DOCUMENT_DESIGN, current)
    : deepCloneDesign(DEFAULT_DOCUMENT_DESIGN);
  if (!current) {
    design.colors.primary = doc.styles.primaryColor || brandProfile?.primaryColor || design.colors.primary;
    design.colors.secondary = brandProfile?.secondaryColor || design.colors.secondary;
    design.colors.accent = doc.styles.accentColor || brandProfile?.secondaryColor || design.colors.accent;
    design.colors.headingText = doc.styles.primaryColor || design.colors.headingText;
    design.colors.bodyText = doc.styles.primaryColor || design.colors.bodyText;
    design.typography.bodyFontFamily = doc.styles.fontFamily;
    design.typography.bodyFontSize = doc.styles.fontSize;
    design.typography.bodyLineHeight = doc.styles.lineHeight;
    design.typography.paragraphSpacing = doc.styles.paragraphSpacing;
    design.typography.headingFontFamily = doc.styles.headingFont;
    design.typography.heading1Size = doc.styles.heading1Size;
    design.typography.heading2Size = doc.styles.heading2Size;
    design.typography.heading3Size = doc.styles.heading3Size;
    design.typography.headingCase = doc.styles.headingCase;
  }
  validateDocumentDesign(design);
  const sections = (doc.sections || []).map(section => {
    if (section.design) validateSectionDesign(section.design);
    const tables = section.tables?.map(table => {
      if (table.design) validateTableDesign(table.design);
      return { ...table, design: table.design ? deepCloneDesign(table.design) : undefined };
    });
    return {
      ...section,
      design: section.design ? deepCloneDesign(section.design) : undefined,
      ...(tables ? { tables } : {})
    };
  });
  return { ...doc, design: deepCloneDesign(design), sections } as T;
}

export function resolveDocumentDesign(doc: DocumentModel): DocumentDesign {
  return deepCloneDesign(doc.design || DEFAULT_DOCUMENT_DESIGN);
}

export function resolveSectionDesign(doc: DocumentModel, section: Section): {
  background?: ColorFill;
  bodyTextColor: string;
  headingColor: string;
  border: BorderConfig;
  padding: number;
} {
  const design = resolveDocumentDesign(doc);
  return {
    background: section.design?.background || design.sectionDefaults.background,
    bodyTextColor: section.design?.bodyTextColor || design.colors.bodyText,
    headingColor: section.design?.headingColor || design.colors.headingText,
    border: section.design?.border || design.sectionDefaults.border,
    padding: section.design?.padding ?? design.sectionDefaults.padding
  };
}

export function resolveTableDesign(doc: DocumentModel, section: Section, table: TableBlock) {
  const design = resolveDocumentDesign(doc);
  const sectionStyle = resolveSectionDesign(doc, section);
  return {
    headerBackground: table.design?.headerBackground || design.tableDefaults.headerBackground,
    headerTextColor: table.design?.headerTextColor || section.design?.headingColor || design.tableDefaults.headerTextColor,
    bodyBackground: table.design?.bodyBackground || sectionStyle.background || design.tableDefaults.bodyBackground,
    bodyTextColor: table.design?.bodyTextColor || sectionStyle.bodyTextColor || design.tableDefaults.bodyTextColor,
    alternateRowBackground: table.design?.alternateRowBackground || design.tableDefaults.alternateRowBackground,
    gridlineColor: table.design?.gridlineColor || design.tableDefaults.gridlineColor,
    gridlineWidth: table.design?.gridlineWidth ?? design.tableDefaults.gridlineWidth,
    captionColor: table.design?.captionColor || design.tableDefaults.captionColor
  };
}

export function resolveCellFill(
  tableStyle: ReturnType<typeof resolveTableDesign>,
  cell: { bg?: string },
  rowIndex: number
): string | ColorFill {
  if (cell.bg) return cell.bg;
  if (rowIndex > 0 && tableStyle.alternateRowBackground) return tableStyle.alternateRowBackground;
  return tableStyle.bodyBackground;
}

export function applyDocumentPreset(doc: DocumentModel, presetId: string): DocumentModel {
  const preset = DOCUMENT_DESIGN_PRESETS.find(item => item.presetId === presetId);
  if (!preset) throw new Error('Unknown document design preset: ' + presetId);
  const normalized = normalizeDocumentDesign(doc);
  return {
    ...normalized,
    design: deepCloneDesign(preset),
    version: doc.version + 1,
    updatedAt: new Date().toISOString()
  };
}

export function clearDesignOverrides(doc: DocumentModel): DocumentModel {
  return {
    ...doc,
    sections: doc.sections.map(section => ({
      ...section,
      design: undefined,
      tables: section.tables?.map(table => ({
        ...table,
        design: undefined,
        headers: table.headers.map(cell => ({ ...cell, bg: undefined })),
        rows: table.rows.map(row => row.map(cell => ({ ...cell, bg: undefined })))
      }))
    })),
    version: doc.version + 1,
    updatedAt: new Date().toISOString()
  };
}

export function fillToCss(fill: ColorFill | undefined, fallback = 'transparent'): string {
  if (!fill) return fallback;
  if (fill.type === 'linear-gradient') {
    const opacity = fill.opacity ?? 1;
    const stops = fill.stops.map(stop => {
      const raw = stop.color.replace('#', '');
      const expanded = raw.length === 3 ? raw.split('').map(char => char + char).join('') : raw;
      const red = parseInt(expanded.slice(0, 2), 16);
      const green = parseInt(expanded.slice(2, 4), 16);
      const blue = parseInt(expanded.slice(4, 6), 16);
      const color = opacity >= 1
        ? stop.color
        : 'rgba(' + red + ', ' + green + ', ' + blue + ', ' + opacity + ')';
      return color + ' ' + stop.position + '%';
    }).join(', ');
    return 'linear-gradient(' + fill.angle + 'deg, ' + stops + ')';
  }
  if (fill.opacity === undefined || fill.opacity >= 1) return fill.color;
  const hex = fill.color.replace('#', '');
  const expanded = hex.length === 3 ? hex.split('').map(char => char + char).join('') : hex;
  const red = parseInt(expanded.slice(0, 2), 16);
  const green = parseInt(expanded.slice(2, 4), 16);
  const blue = parseInt(expanded.slice(4, 6), 16);
  return 'rgba(' + red + ', ' + green + ', ' + blue + ', ' + fill.opacity + ')';
}

export function borderToCss(border: BorderConfig, side?: BorderSide): string {
  if (side && border.sides?.length && !border.sides.includes(side)) return 'none';
  if (border.style === 'none' || border.width <= 0) return 'none';
  return border.width + 'px ' + border.style + ' ' + border.color;
}



export function syncLegacyStyleChanges(
  previous: DocumentModel,
  next: DocumentModel,
  brandProfile?: BrandProfile
): DocumentModel {
  const normalized = normalizeDocumentDesign(next, brandProfile);
  if (
    previous.id !== next.id ||
    JSON.stringify(previous.design) !== JSON.stringify(next.design)
  ) {
    return normalized;
  }

  const prior = previous.styles;
  const current = next.styles;
  const design = deepCloneDesign(normalized.design || DEFAULT_DOCUMENT_DESIGN);
  const typography = design.typography;
  const colors = design.colors;

  if (current.fontFamily !== prior.fontFamily) typography.bodyFontFamily = current.fontFamily;
  if (current.fontSize !== prior.fontSize) typography.bodyFontSize = current.fontSize;
  if (current.lineHeight !== prior.lineHeight) typography.bodyLineHeight = current.lineHeight;
  if (current.paragraphSpacing !== prior.paragraphSpacing) typography.paragraphSpacing = current.paragraphSpacing;
  if (current.headingFont !== prior.headingFont) typography.headingFontFamily = current.headingFont;
  if (current.heading1Size !== prior.heading1Size) typography.heading1Size = current.heading1Size;
  if (current.heading2Size !== prior.heading2Size) typography.heading2Size = current.heading2Size;
  if (current.heading3Size !== prior.heading3Size) typography.heading3Size = current.heading3Size;
  if (current.headingCase !== prior.headingCase) typography.headingCase = current.headingCase;

  if (current.primaryColor !== prior.primaryColor) {
    colors.primary = current.primaryColor;
    colors.headingText = current.primaryColor;
    colors.bodyText = current.primaryColor;
  }
  if (current.accentColor !== prior.accentColor) colors.accent = current.accentColor;
  if (current.textColor !== prior.textColor) colors.bodyText = current.textColor || current.primaryColor || '#334155';

  validateDocumentDesign(design);
  return { ...normalized, design };
}

export interface SavedDocumentTheme {
  id: string;
  name: string;
  design: DocumentDesign;
  updatedAt: string;
}

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;
const SAVED_THEMES_KEY = 'ai-pdf-studio.saved-themes.v1';

export function listSavedThemes(storage: StorageLike): SavedDocumentTheme[] {
  const raw = storage.getItem(SAVED_THEMES_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(item => {
      try {
        if (!item || typeof item !== 'object') return false;
        const theme = item as SavedDocumentTheme;
        if (typeof theme.id !== 'string' || typeof theme.name !== 'string') return false;
        validateDocumentDesign(theme.design);
        return typeof theme.updatedAt === 'string';
      } catch {
        return false;
      }
    }).map(theme => deepCloneDesign(theme as SavedDocumentTheme));
  } catch {
    return [];
  }
}

export function saveTheme(storage: StorageLike, theme: SavedDocumentTheme): SavedDocumentTheme[] {
  validateDocumentDesign(theme.design);
  const themes = listSavedThemes(storage).filter(item => item.id !== theme.id);
  themes.push(deepCloneDesign(theme));
  storage.setItem(SAVED_THEMES_KEY, JSON.stringify(themes));
  return themes;
}

export function renameTheme(storage: StorageLike, themeId: string, name: string): SavedDocumentTheme[] {
  const themes = listSavedThemes(storage);
  const target = themes.find(item => item.id === themeId);
  if (!target) throw new Error('Saved theme was not found.');
  target.name = name;
  target.updatedAt = new Date().toISOString();
  storage.setItem(SAVED_THEMES_KEY, JSON.stringify(themes));
  return themes;
}

export function deleteTheme(storage: StorageLike, themeId: string): SavedDocumentTheme[] {
  const themes = listSavedThemes(storage).filter(item => item.id !== themeId);
  storage.setItem(SAVED_THEMES_KEY, JSON.stringify(themes));
  return themes;
}

export function applySavedTheme(doc: DocumentModel, theme: SavedDocumentTheme): DocumentModel {
  validateDocumentDesign(theme.design);
  return {
    ...normalizeDocumentDesign(doc),
    design: deepCloneDesign(theme.design),
    version: doc.version + 1,
    updatedAt: new Date().toISOString()
  };
}
