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
  signatureDefaults: {
    background: solid('#f8fafc'),
    textColor: '#334155',
    labelColor: '#64748b',
    border: { style: 'solid', color: '#dbe3ee', width: 0.5 },
    padding: 12
  },
  coverPage: {
    enabled: false,
    style: 'modern-graphic',
    background: solid('#0b0d12'),
    titleColor: '#f8fafc',
    detailColor: '#94a3b8',
    borderColor: '#b08a45',
    eyebrow: 'AGREEMENT',
    brandLine: '',
    showFrame: true,
    showLogoPlaceholder: false,
    showOrnamentalRule: true
  },
  layoutDefaults: {
    sectionHeadingStyle: 'editorial-rule',
    sectionSpacing: 22,
    headerRule: true,
    footerRule: true,
    paragraphIndent: 0,
    sectionPadding: 12
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
  result.tableDefaults.bodyBackground = solid(result.colors.pageSurface);
  result.tableDefaults.alternateRowBackground = solid(result.colors.tableAlternateRowSurface);
  result.tableDefaults.gridlineColor = result.colors.border;

  const headingTreatmentByPreset: Record<string, DocumentDesign['layoutDefaults']['sectionHeadingStyle']> = {
    'modern-corporate': 'side-rule',
    'luxury-executive': 'double-rule',
    'creative-studio': 'banner',
    'minimal-contemporary': 'minimal',
    'bold-editorial': 'editorial-rule',
    'technology-professional': 'numbered-card',
    'contemporary-legal': 'side-rule',
    'financial-report': 'banner',
    'midnight-executive': 'editorial-rule',
    'art-deco': 'numbered-card',
    'dark-luxury': 'numbered-card',
    'bauhaus-modern': 'banner',
    'glassmorphism': 'side-rule',
    'modern-legal': 'minimal',
    'editorial-luxe': 'double-rule',
    'corporate-graphite': 'side-rule',
    'japandi-neutral': 'minimal',
    'lil-synn': 'editorial-rule'
  };
  const headingTreatment = headingTreatmentByPreset[presetId] || 'editorial-rule';
  const sectionSpacingByStyle = { minimal: 17, 'side-rule': 20, 'numbered-card': 22, 'editorial-rule': 24, 'double-rule': 26, banner: 18 } as const;
  const sectionPaddingByStyle = { minimal: 5, 'side-rule': 8, 'numbered-card': 12, 'editorial-rule': 12, 'double-rule': 14, banner: 8 } as const;
  if (presetId !== 'lil-synn') result.sectionDefaults.padding = sectionPaddingByStyle[headingTreatment];
  const gridlineWidthByStyle = { minimal: 0.25, 'side-rule': 0.35, 'numbered-card': 0.55, 'editorial-rule': 0.4, 'double-rule': 0.65, banner: 0.45 } as const;
  result.tableDefaults.gridlineWidth = gridlineWidthByStyle[headingTreatment];
  result.layoutDefaults = {
    ...result.layoutDefaults,
    sectionHeadingStyle: headingTreatment,
    sectionSpacing: sectionSpacingByStyle[headingTreatment],
    sectionPadding: sectionPaddingByStyle[headingTreatment],
    paragraphIndent: ['luxury-executive', 'contemporary-legal', 'modern-legal', 'art-deco', 'editorial-luxe'].includes(presetId) ? 2.5 : 0,
    headerRule: headingTreatment !== 'minimal',
    footerRule: true
  };
  result.coverPage = {
    ...result.coverPage,
    enabled: true,
    style: presetId === 'art-deco' ? 'art-deco'
      : presetId === 'dark-luxury' ? 'dark-luxury'
        : presetId === 'minimal-contemporary' || presetId === 'modern-legal' ? 'minimal'
          : presetId === 'bold-editorial' || presetId === 'editorial-luxe' ? 'editorial'
            : 'modern-graphic',
    background: solid('#0b0d12'),
    titleColor: '#f8fafc',
    detailColor: '#cbd5e1',
    borderColor: result.colors.accent,
    eyebrow: 'AGREEMENT',
    brandLine: '',
    showFrame: true,
    showLogoPlaceholder: false,
    showOrnamentalRule: true
  };
  result.pageFurniture.headerTextColor = result.colors.mutedText;
  result.pageFurniture.footerTextColor = result.colors.mutedText;
  result.pageFurniture.dividerColor = result.colors.border;
  result.pageFurniture.dividerWidth = headingTreatment === 'double-rule' ? 0.65 : headingTreatment === 'numbered-card' ? 0.5 : headingTreatment === 'minimal' ? 0.25 : 0.4;
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

DOCUMENT_DESIGN_PRESETS.push(makePreset(
  'lil-synn',
  'LIL SYNN',
  {
    primary: '#f5f5f5', secondary: '#d1d5db', accent: '#ff4fa3',
    bodyText: '#f5f5f5', mutedText: '#c5c5c5', headingText: '#ff4fa3',
    pageSurface: '#050505', sectionSurface: '#080808', border: '#d99a32',
    tableHeaderSurface: '#111111', tableHeaderText: '#ff4fa3',
    tableBodyText: '#f5f5f5', tableAlternateRowSurface: '#151515'
  },
  { bodyFontFamily: 'Inter', headingFontFamily: 'Inter', bodyFontSize: 10.5, heading1Size: 25, heading2Size: 15, heading3Size: 12, headingCase: 'none', textAlignment: 'left', verticalAlignment: 'top', contentBoxMinHeight: 0 },
  solid('#050505'), solid('#080808'), solid('#111111')
));
const lilSynnPreset = DOCUMENT_DESIGN_PRESETS[DOCUMENT_DESIGN_PRESETS.length - 1];
lilSynnPreset.tableDefaults.bodyBackground = solid('#050505');
lilSynnPreset.sectionDefaults.border = { style: 'solid', color: '#d99a32', width: 1.2 };
lilSynnPreset.sectionDefaults.padding = 12;
lilSynnPreset.tableDefaults.gridlineColor = '#d99a32';
lilSynnPreset.tableDefaults.gridlineWidth = 0.8;
lilSynnPreset.pageFurniture.headerTextColor = '#ff4fa3';
lilSynnPreset.pageFurniture.footerTextColor = '#c5c5c5';
lilSynnPreset.pageFurniture.dividerColor = '#d99a32';
lilSynnPreset.pageFurniture.dividerWidth = 0.8;
lilSynnPreset.coverPage = {
  enabled: true,
  style: 'modern-graphic',
  background: solid('#050505'),
  titleColor: '#ff4fa3',
  detailColor: '#c5c5c5',
  borderColor: '#d99a32',
  eyebrow: 'LIL SYNN • SYNTIENT RECORDS',
  brandLine: 'MUSIC • CREATIVE • INTELLECTUAL PROPERTY',
  showFrame: true,
  showLogoPlaceholder: true,
  showOrnamentalRule: true
};
lilSynnPreset.layoutDefaults = {
  sectionHeadingStyle: 'editorial-rule',
  sectionSpacing: 28,
  headerRule: true,
  footerRule: true,
  paragraphIndent: 0,
  sectionPadding: 16
};
lilSynnPreset.signatureDefaults = {
  background: solid('#080808'),
  textColor: '#f5f5f5',
  labelColor: '#c5c5c5',
  border: { style: 'solid', color: '#d99a32', width: 0.8 },
  padding: 14
};

DOCUMENT_DESIGN_PRESETS.push(
  makePreset('midnight-executive', 'Midnight Executive',
    { primary: '#1c2634', secondary: '#5c6877', accent: '#b08a45', bodyText: '#303b49', mutedText: '#687586', headingText: '#172232', pageSurface: '#fffdf8', sectionSurface: '#f7f5ef', border: '#d9cfbd', tableHeaderSurface: '#ece6da', tableHeaderText: '#172232', tableBodyText: '#303b49', tableAlternateRowSurface: '#f8f6f0' },
    { bodyFontFamily: 'Inter', headingFontFamily: 'Garamond', bodyFontSize: 10.7, heading1Size: 27, heading2Size: 15, heading3Size: 12, headingCase: 'none' },
    solid('#fffdf8'), solid('#ffffff'), solid('#ece6da')),
  makePreset('art-deco', 'Art Deco',
    { primary: '#1c1a17', secondary: '#756447', accent: '#c39b4b', bodyText: '#38332a', mutedText: '#7c715e', headingText: '#241f18', pageSurface: '#fbf8f1', sectionSurface: '#f7f1e4', border: '#d4bf8d', tableHeaderSurface: '#e8ddc2', tableHeaderText: '#241f18', tableBodyText: '#38332a', tableAlternateRowSurface: '#f8f4eb' },
    { bodyFontFamily: 'Garamond', headingFontFamily: 'Garamond', bodyFontSize: 11.2, heading1Size: 28, heading2Size: 16, heading3Size: 12, headingCase: 'uppercase' },
    solid('#fbf8f1'), solid('#fffdf8'), solid('#e8ddc2')),
  makePreset('dark-luxury', 'Dark Luxury',
    { primary: '#f4eee2', secondary: '#c6b58d', accent: '#d2ad63', bodyText: '#e8e1d5', mutedText: '#b5a88e', headingText: '#f4d998', pageSurface: '#151515', sectionSurface: '#1b1b1b', border: '#8d7449', tableHeaderSurface: '#29251d', tableHeaderText: '#f4d998', tableBodyText: '#e8e1d5', tableAlternateRowSurface: '#202020' },
    { bodyFontFamily: 'Inter', headingFontFamily: 'Garamond', bodyFontSize: 10.7, heading1Size: 28, heading2Size: 15, heading3Size: 12 },
    solid('#151515'), solid('#1b1b1b'), solid('#29251d')),
  makePreset('bauhaus-modern', 'Bauhaus Modern',
    { primary: '#1d2630', secondary: '#3f607a', accent: '#c44935', bodyText: '#303943', mutedText: '#69727b', headingText: '#171e27', pageSurface: '#f8f5ed', sectionSurface: '#ffffff', border: '#d8d2c7', tableHeaderSurface: '#e8e1d5', tableHeaderText: '#171e27', tableBodyText: '#303943', tableAlternateRowSurface: '#f4f0e7' },
    { bodyFontFamily: 'Inter', headingFontFamily: 'Helvetica', bodyFontSize: 10.7, heading1Size: 26, heading2Size: 15, heading3Size: 12 },
    solid('#f8f5ed'), solid('#ffffff'), solid('#e8e1d5')),
  makePreset('glassmorphism', 'Glassmorphism',
    { primary: '#192b43', secondary: '#56718d', accent: '#4f83b8', bodyText: '#304157', mutedText: '#71839a', headingText: '#192b43', pageSurface: '#f3f7fb', sectionSurface: '#f9fbfe', border: '#c9d8e8', tableHeaderSurface: '#e2ebf5', tableHeaderText: '#192b43', tableBodyText: '#304157', tableAlternateRowSurface: '#edf3f9' },
    { bodyFontFamily: 'Inter', headingFontFamily: 'Inter', bodyFontSize: 10.5, heading1Size: 25, heading2Size: 15, heading3Size: 12 },
    solid('#f3f7fb'), solid('#f9fbfe'), solid('#e2ebf5')),
  makePreset('modern-legal', 'Modern Legal',
    { primary: '#172941', secondary: '#52677e', accent: '#366b9b', bodyText: '#354354', mutedText: '#758395', headingText: '#172941', pageSurface: '#ffffff', sectionSurface: '#f5f8fb', border: '#d3dce6', tableHeaderSurface: '#e8eef5', tableHeaderText: '#172941', tableBodyText: '#354354', tableAlternateRowSurface: '#f7f9fc' },
    { bodyFontFamily: 'Times New Roman', headingFontFamily: 'Inter', bodyFontSize: 11, heading1Size: 24, heading2Size: 14, heading3Size: 12, headingCase: 'none' },
    solid('#ffffff'), solid('#f7f9fc'), solid('#e8eef5')),
  makePreset('editorial-luxe', 'Editorial Luxe',
    { primary: '#28201f', secondary: '#78635f', accent: '#a85d4b', bodyText: '#3a3331', mutedText: '#8a7b76', headingText: '#28201f', pageSurface: '#fcf9f6', sectionSurface: '#f7f0eb', border: '#e2d4cb', tableHeaderSurface: '#eee1d8', tableHeaderText: '#28201f', tableBodyText: '#3a3331', tableAlternateRowSurface: '#faf4ef' },
    { bodyFontFamily: 'Georgia', headingFontFamily: 'Georgia', bodyFontSize: 11.1, heading1Size: 28, heading2Size: 16, heading3Size: 12, headingCase: 'none' },
    solid('#fcf9f6'), solid('#f7f0eb'), solid('#eee1d8')),
  makePreset('corporate-graphite', 'Corporate Graphite',
    { primary: '#202a35', secondary: '#596879', accent: '#3974a6', bodyText: '#35414d', mutedText: '#788695', headingText: '#202a35', pageSurface: '#ffffff', sectionSurface: '#f3f6f8', border: '#d4dce3', tableHeaderSurface: '#e5ebf0', tableHeaderText: '#202a35', tableBodyText: '#35414d', tableAlternateRowSurface: '#f6f8fa' },
    { bodyFontFamily: 'Inter', headingFontFamily: 'Inter', bodyFontSize: 10.5, heading1Size: 24, heading2Size: 14, heading3Size: 12 },
    solid('#ffffff'), solid('#f3f6f8'), solid('#e5ebf0')),
  makePreset('japandi-neutral', 'Japandi Neutral',
    { primary: '#28342e', secondary: '#748176', accent: '#7d8c6b', bodyText: '#3e4840', mutedText: '#858d82', headingText: '#28342e', pageSurface: '#f8f7f2', sectionSurface: '#f0efe8', border: '#d9d9cd', tableHeaderSurface: '#e9e8df', tableHeaderText: '#28342e', tableBodyText: '#3e4840', tableAlternateRowSurface: '#f3f2eb' },
    { bodyFontFamily: 'Garamond', headingFontFamily: 'Garamond', bodyFontSize: 11.2, heading1Size: 26, heading2Size: 15, heading3Size: 12, headingCase: 'none' },
    solid('#f8f7f2'), solid('#f0efe8'), solid('#e9e8df'))
);

const midnightPreset = DOCUMENT_DESIGN_PRESETS.find(preset => preset.presetId === 'midnight-executive')!;
midnightPreset.coverPage = {
  enabled: true, style: 'modern-graphic', background: solid('#0b0d12'),
  titleColor: '#f8f4ea', detailColor: '#c7b58e', borderColor: '#b08a45',
  eyebrow: 'AGREEMENT', brandLine: '', showFrame: true, showLogoPlaceholder: false, showOrnamentalRule: true
};
const artDecoPreset = DOCUMENT_DESIGN_PRESETS.find(preset => preset.presetId === 'art-deco')!;
artDecoPreset.coverPage = {
  enabled: true, style: 'art-deco', background: solid('#111111'),
  titleColor: '#e5c77d', detailColor: '#cdbb91', borderColor: '#c39b4b',
  eyebrow: 'ART DECO EDITION', brandLine: '', showFrame: true, showLogoPlaceholder: true, showOrnamentalRule: true
};
const darkLuxuryPreset = DOCUMENT_DESIGN_PRESETS.find(preset => preset.presetId === 'dark-luxury')!;
darkLuxuryPreset.coverPage = {
  enabled: true, style: 'dark-luxury', background: solid('#101010'),
  titleColor: '#f4d998', detailColor: '#c6b58d', borderColor: '#d2ad63',
  eyebrow: 'PRIVATE • CONFIDENTIAL', brandLine: '', showFrame: true, showLogoPlaceholder: false, showOrnamentalRule: true
};
const bauhausPreset = DOCUMENT_DESIGN_PRESETS.find(preset => preset.presetId === 'bauhaus-modern')!;
bauhausPreset.coverPage = {
  enabled: true, style: 'editorial', background: solid('#f8f5ed'),
  titleColor: '#171e27', detailColor: '#3f607a', borderColor: '#c44935',
  eyebrow: 'PROFESSIONAL DOCUMENT', brandLine: '', showFrame: false, showLogoPlaceholder: false, showOrnamentalRule: true
};
const glassPreset = DOCUMENT_DESIGN_PRESETS.find(preset => preset.presetId === 'glassmorphism')!;
glassPreset.coverPage = {
  enabled: true, style: 'midnight-executive',
  background: { type: 'linear-gradient', angle: 135, stops: [{ color: '#182b46', position: 0 }, { color: '#304b67', position: 100 }] },
  titleColor: '#f8fbff', detailColor: '#c9d8e8', borderColor: '#83a9cb',
  eyebrow: 'CONTEMPORARY EDITION', brandLine: '', showFrame: true, showLogoPlaceholder: false, showOrnamentalRule: true
};
const modernLegalPreset = DOCUMENT_DESIGN_PRESETS.find(preset => preset.presetId === 'modern-legal')!;
modernLegalPreset.coverPage = {
  enabled: true, style: 'minimal', background: solid('#172941'),
  titleColor: '#ffffff', detailColor: '#c9d6e3', borderColor: '#7594b3',
  eyebrow: 'LEGAL DOCUMENT', brandLine: '', showFrame: true, showLogoPlaceholder: true, showOrnamentalRule: false
};
const editorialPreset = DOCUMENT_DESIGN_PRESETS.find(preset => preset.presetId === 'editorial-luxe')!;
editorialPreset.coverPage = {
  enabled: true, style: 'editorial', background: solid('#28201f'),
  titleColor: '#fcf1e9', detailColor: '#d6beb3', borderColor: '#a85d4b',
  eyebrow: 'EDITORIAL COLLECTION', brandLine: '', showFrame: false, showLogoPlaceholder: false, showOrnamentalRule: true
};
const corporatePreset = DOCUMENT_DESIGN_PRESETS.find(preset => preset.presetId === 'corporate-graphite')!;
corporatePreset.coverPage = {
  enabled: true, style: 'midnight-executive', background: solid('#202a35'),
  titleColor: '#ffffff', detailColor: '#cbd5df', borderColor: '#7f9bb4',
  eyebrow: 'CORPORATE • CONFIDENTIAL', brandLine: '', showFrame: true, showLogoPlaceholder: true, showOrnamentalRule: true
};
const japandiPreset = DOCUMENT_DESIGN_PRESETS.find(preset => preset.presetId === 'japandi-neutral')!;
japandiPreset.coverPage = {
  enabled: true, style: 'minimal', background: solid('#28342e'),
  titleColor: '#f8f7f2', detailColor: '#d1d4c5', borderColor: '#9aa58d',
  eyebrow: 'STUDIO COLLECTION', brandLine: '', showFrame: false, showLogoPlaceholder: false, showOrnamentalRule: true
};


// Give every built-in preset a cover treatment that belongs to its own palette.
// The generic dark cover is retained only as a migration/default fallback.
const INTENTIONAL_COVER_SYSTEMS: Record<string, Partial<DocumentDesign['coverPage']>> = {
  'modern-corporate': {
    style: 'modern-graphic',
    background: solid('#12243a'),
    titleColor: '#ffffff',
    detailColor: '#dbe6f1',
    borderColor: '#6d91b8',
    eyebrow: 'CORPORATE PROFILE',
    brandLine: 'STRATEGY • OPERATIONS • PERFORMANCE',
    showFrame: true,
    showLogoPlaceholder: true,
    showOrnamentalRule: true
  },
  'luxury-executive': {
    style: 'dark-luxury',
    background: solid('#25211d'),
    titleColor: '#f5ead8',
    detailColor: '#c9b99e',
    borderColor: '#b08a45',
    eyebrow: 'EXECUTIVE EDITION',
    brandLine: 'PRIVATE • REFINED • CONFIDENTIAL',
    showFrame: true,
    showLogoPlaceholder: false,
    showOrnamentalRule: true
  },
  'creative-studio': {
    style: 'editorial',
    background: solid('#fcf5fb'),
    titleColor: '#24152f',
    detailColor: '#776b80',
    borderColor: '#d946a6',
    eyebrow: 'CREATIVE STUDIO',
    brandLine: 'IDEAS • DESIGN • CULTURE',
    showFrame: false,
    showLogoPlaceholder: true,
    showOrnamentalRule: true
  },
  'minimal-contemporary': {
    style: 'minimal',
    background: solid('#ffffff'),
    titleColor: '#172033',
    detailColor: '#64748b',
    borderColor: '#0f766e',
    eyebrow: 'DOCUMENT SERIES',
    brandLine: '',
    showFrame: false,
    showLogoPlaceholder: false,
    showOrnamentalRule: true
  },
  'bold-editorial': {
    style: 'editorial',
    background: solid('#fffefa'),
    titleColor: '#191919',
    detailColor: '#777777',
    borderColor: '#b42318',
    eyebrow: 'THE EDITION',
    brandLine: 'PERSPECTIVE • ANALYSIS • INSIGHT',
    showFrame: false,
    showLogoPlaceholder: false,
    showOrnamentalRule: true
  },
  'technology-professional': {
    style: 'midnight-executive',
    background: solid('#102336'),
    titleColor: '#f4fbff',
    detailColor: '#b8dce6',
    borderColor: '#0891b2',
    eyebrow: 'TECHNOLOGY BRIEF',
    brandLine: 'SYSTEMS • SECURITY • INNOVATION',
    showFrame: true,
    showLogoPlaceholder: true,
    showOrnamentalRule: true
  },
  'contemporary-legal': {
    style: 'minimal',
    background: solid('#16243b'),
    titleColor: '#ffffff',
    detailColor: '#cbd5e1',
    borderColor: '#315d91',
    eyebrow: 'LEGAL DOCUMENT',
    brandLine: 'FORMAL • PRECISE • PROFESSIONAL',
    showFrame: true,
    showLogoPlaceholder: true,
    showOrnamentalRule: false
  },
  'financial-report': {
    style: 'modern-graphic',
    background: solid('#17342d'),
    titleColor: '#ffffff',
    detailColor: '#c8e0d3',
    borderColor: '#54a982',
    eyebrow: 'FINANCIAL REPORT',
    brandLine: 'PERFORMANCE • FORECAST • ANALYSIS',
    showFrame: true,
    showLogoPlaceholder: true,
    showOrnamentalRule: true
  }
};

for (const preset of DOCUMENT_DESIGN_PRESETS) {
  const coverSystem = INTENTIONAL_COVER_SYSTEMS[preset.presetId];
  if (coverSystem) Object.assign(preset.coverPage, coverSystem);
}

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


export function getSectionHeadingBorderStyles(
  style: DocumentDesign['layoutDefaults']['sectionHeadingStyle'],
  accent: string,
  border: string
): { borderTop: string; borderBottom: string; borderLeft: string; borderColor: string } {
  const isDoubleRule = style === 'double-rule';
  return {
    borderTop: isDoubleRule ? `3px double ${accent}` : 'none',
    borderBottom: style === 'editorial-rule' ? `1px solid ${accent}` : isDoubleRule ? `3px double ${accent}` : 'none',
    borderLeft: style === 'numbered-card' || style === 'side-rule' ? `3px solid ${accent}` : 'none',
    borderColor: style === 'numbered-card' ? border : accent
  };
}

export function validateDocumentDesign(design: DocumentDesign): void {
  if (!design || typeof design !== 'object') throw new Error('Document design must be an object.');
  if (design.schemaVersion !== 1) throw new Error('Unsupported document design schema version.');
  if (typeof design.presetId !== 'string' || !design.presetId.trim()) throw new Error('Document design presetId must be a non-empty string.');
  if (typeof design.name !== 'string' || !design.name.trim()) throw new Error('Document design name must be a non-empty string.');
  if (design.typography?.bodyBold !== undefined && typeof design.typography.bodyBold !== 'boolean') throw new Error('typography.bodyBold must be a boolean.');
  if (design.typography?.bodyItalic !== undefined && typeof design.typography.bodyItalic !== 'boolean') throw new Error('typography.bodyItalic must be a boolean.');
  if (design.typography?.textAlignment !== undefined && !['left', 'center', 'right', 'justify'].includes(design.typography.textAlignment)) throw new Error('typography.textAlignment is unsupported.');
  if (design.typography?.verticalAlignment !== undefined && !['top', 'middle', 'bottom'].includes(design.typography.verticalAlignment)) throw new Error('typography.verticalAlignment is unsupported.');
  if (design.typography?.contentBoxMinHeight !== undefined && (!Number.isFinite(design.typography.contentBoxMinHeight) || design.typography.contentBoxMinHeight < 0 || design.typography.contentBoxMinHeight > 1200)) throw new Error('typography.contentBoxMinHeight must be between 0 and 1200 pixels.');
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
  validateFill(design.signatureDefaults?.background, 'signatureDefaults.background');
  validateColor(design.signatureDefaults?.textColor, 'signatureDefaults.textColor');
  validateColor(design.signatureDefaults?.labelColor, 'signatureDefaults.labelColor');
  validateBorder(design.signatureDefaults?.border, 'signatureDefaults.border');
  if (!Number.isFinite(design.signatureDefaults?.padding) || design.signatureDefaults.padding < 0 || design.signatureDefaults.padding > 60) throw new Error('signatureDefaults.padding must be between 0 and 60.');
  const cover = design.coverPage;
  if (!cover || typeof cover !== 'object') throw new Error('coverPage must be an object.');
  if (typeof cover.enabled !== 'boolean') throw new Error('coverPage.enabled must be a boolean.');
  if (!['midnight-executive', 'modern-graphic', 'art-deco', 'dark-luxury', 'editorial', 'minimal'].includes(cover.style)) throw new Error('coverPage.style is unsupported.');
  validateFill(cover.background, 'coverPage.background');
  validateColor(cover.titleColor, 'coverPage.titleColor');
  validateColor(cover.detailColor, 'coverPage.detailColor');
  validateColor(cover.borderColor, 'coverPage.borderColor');
  for (const key of ['eyebrow', 'brandLine'] as const) if (typeof cover[key] !== 'string') throw new Error('coverPage.' + key + ' must be a string.');
  for (const key of ['showFrame', 'showLogoPlaceholder', 'showOrnamentalRule'] as const) if (typeof cover[key] !== 'boolean') throw new Error('coverPage.' + key + ' must be a boolean.');
  const layout = design.layoutDefaults;
  if (!layout || typeof layout !== 'object') throw new Error('layoutDefaults must be an object.');
  if (!['editorial-rule', 'numbered-card', 'minimal', 'banner', 'side-rule', 'double-rule'].includes(layout.sectionHeadingStyle)) throw new Error('layoutDefaults.sectionHeadingStyle is unsupported.');
  for (const [key, value, maximum] of [
    ['sectionSpacing', layout.sectionSpacing, 100],
    ['paragraphIndent', layout.paragraphIndent, 30],
    ['sectionPadding', layout.sectionPadding, 60]
  ] as Array<[string, number, number]>) {
    if (!Number.isFinite(value) || value < 0 || value > maximum) throw new Error('layoutDefaults.' + key + ' must be between 0 and ' + maximum + '.');
  }
  if (typeof layout.headerRule !== 'boolean' || typeof layout.footerRule !== 'boolean') throw new Error('layoutDefaults headerRule and footerRule must be booleans.');
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

export function serializeDocumentTheme(design: DocumentDesign): string {
  validateDocumentDesign(design);
  return JSON.stringify(deepCloneDesign(design), null, 2);
}

export function parseDocumentTheme(source: string): DocumentDesign {
  let parsed: unknown;
  try {
    parsed = JSON.parse(source) as unknown;
  } catch {
    throw new Error('Theme file must contain valid JSON.');
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Theme file must contain a document design object.');
  }
  const candidate = 'design' in parsed ? (parsed as { design?: unknown }).design : parsed;
  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) {
    throw new Error('Theme JSON does not contain a document design.');
  }
  validateDocumentDesign(candidate as DocumentDesign);
  return deepCloneDesign(candidate as DocumentDesign);
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
  // Merge newly introduced design controls into older saved documents without discarding their custom palette.
  return mergeDeep(DEFAULT_DOCUMENT_DESIGN, doc.design || {});
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
    padding: section.design?.padding ?? design.layoutDefaults.sectionPadding ?? design.sectionDefaults.padding
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

export function contrastRatio(foreground: string, background: string): number {
  const luminance = (hex: string): number => {
    validateColor(hex, 'contrast color');
    const raw = hex.replace('#', '');
    const expanded = raw.length === 3 ? raw.split('').map(char => char + char).join('') : raw;
    const channels = [0, 2, 4].map(offset => parseInt(expanded.slice(offset, offset + 2), 16) / 255)
      .map(channel => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2);
    return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
  };
  const first = luminance(foreground);
  const second = luminance(background);
  const lighter = Math.max(first, second);
  const darker = Math.min(first, second);
  return (lighter + 0.05) / (darker + 0.05);
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
  if (previous.id !== next.id) return normalized;

  // When a document theme changes, keep legacy toolbar controls in sync with
  // the authoritative design tokens. This prevents the ribbon from displaying
  // stale font, size, and color values after applying a preset or AI design.
  if (JSON.stringify(previous.design) !== JSON.stringify(next.design)) {
    const active = normalized.design || DEFAULT_DOCUMENT_DESIGN;
    return {
      ...normalized,
      styles: {
        ...next.styles,
        fontFamily: active.typography.bodyFontFamily,
        fontSize: active.typography.bodyFontSize,
        lineHeight: active.typography.bodyLineHeight,
        paragraphSpacing: active.typography.paragraphSpacing,
        headingFont: active.typography.headingFontFamily,
        heading1Size: active.typography.heading1Size,
        heading2Size: active.typography.heading2Size,
        heading3Size: active.typography.heading3Size,
        headingCase: active.typography.headingCase,
        primaryColor: active.colors.primary,
        accentColor: active.colors.accent,
        textColor: active.colors.bodyText
      }
    };
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

export function duplicateSavedTheme(storage: StorageLike, sourceThemeId: string, newName: string): SavedDocumentTheme[] {
  const name = newName.trim();
  if (!name) throw new Error('A name is required for the duplicated theme.');
  const themes = listSavedThemes(storage);
  const source = themes.find(theme => theme.id === sourceThemeId);
  if (!source) throw new Error('Saved theme was not found.');

  let id = '';
  do {
    id = 'theme-copy-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
  } while (themes.some(theme => theme.id === id));

  return saveTheme(storage, {
    id,
    name,
    design: deepCloneDesign(source.design),
    updatedAt: new Date().toISOString()
  });
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


export type DocumentDesignPresetCategory =
  | 'Business' | 'Editorial' | 'Creative' | 'Legal'
  | 'Technology' | 'Finance' | 'Minimal' | 'Dark';

export function getDocumentDesignPresetCategory(preset: DocumentDesign): DocumentDesignPresetCategory {
  const id = preset.presetId;
  if (id === 'lil-synn' || id === 'dark-luxury' || id === 'midnight-executive') return 'Dark';
  if (id === 'art-deco' || id === 'bold-editorial' || id === 'editorial-luxe' || id === 'bauhaus-modern') return 'Editorial';
  if (id === 'creative-studio') return 'Creative';
  if (id === 'modern-legal' || id === 'contemporary-legal') return 'Legal';
  if (id === 'technology-professional' || id === 'glassmorphism') return 'Technology';
  if (id === 'financial-report') return 'Finance';
  if (id === 'minimal-contemporary' || id === 'japandi-neutral') return 'Minimal';
  return 'Business';
}

export function filterDocumentDesignPresets(presets: DocumentDesign[], query = '', category = 'All'): DocumentDesign[] {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  return presets.filter(preset => {
    const matchesCategory = category === 'All' || getDocumentDesignPresetCategory(preset) === category;
    const matchesQuery = !normalizedQuery || [preset.name, preset.presetId, getDocumentDesignPresetCategory(preset)].join(' ').toLocaleLowerCase().includes(normalizedQuery);
    return matchesCategory && matchesQuery;
  });
}
