/**
 * Universal Document Object Model for AI PDF Studio
 */

export type DocumentType = 
  | 'legal_agreement'
  | 'music_agreement'
  | 'business_proposal'
  | 'financial_report'
  | 'technical_spec'
  | 'general';

export type Alignment = 'left' | 'center' | 'right' | 'justify';

export type BorderStyle = 'none' | 'solid' | 'dashed' | 'dotted' | 'double';
export type BorderSide = 'top' | 'right' | 'bottom' | 'left';

export interface GradientStop {
  color: string;
  position: number;
}

export type ColorFill =
  | { type: 'solid'; color: string; opacity?: number }
  | { type: 'linear-gradient'; angle: number; stops: GradientStop[] };

export interface BorderConfig {
  style: BorderStyle;
  color: string;
  width: number;
  sides?: BorderSide[];
}

export interface DesignColors {
  primary: string;
  secondary: string;
  accent: string;
  bodyText: string;
  mutedText: string;
  headingText: string;
  pageSurface: string;
  sectionSurface: string;
  border: string;
  tableHeaderSurface: string;
  tableHeaderText: string;
  tableBodyText: string;
  tableAlternateRowSurface: string;
}

export interface DesignTypography {
  bodyFontFamily: StyleConfig['fontFamily'];
  bodyFontSize: number;
  bodyLineHeight: number;
  paragraphSpacing: number;
  headingFontFamily: StyleConfig['headingFont'];
  heading1Size: number;
  heading2Size: number;
  heading3Size: number;
  headingCase: StyleConfig['headingCase'];
  bodyBold?: boolean;
  bodyItalic?: boolean;
}

export interface DesignTableDefaults {
  headerBackground: ColorFill;
  headerTextColor: string;
  bodyBackground: ColorFill;
  bodyTextColor: string;
  alternateRowBackground?: ColorFill;
  gridlineColor: string;
  gridlineWidth: number;
  captionColor: string;
}

export interface DocumentDesign {
  schemaVersion: 1;
  presetId: string;
  name: string;
  colors: DesignColors;
  typography: DesignTypography;
  page: {
    background: ColorFill;
    firstPageBackground?: ColorFill;
  };
  sectionDefaults: {
    background?: ColorFill;
    padding: number;
    border: BorderConfig;
  };
  tableDefaults: DesignTableDefaults;
  pageFurniture: {
    headerTextColor: string;
    footerTextColor: string;
    dividerColor: string;
    dividerWidth: number;
  };
}

export interface SectionDesign {
  background?: ColorFill;
  bodyTextColor?: string;
  headingColor?: string;
  border?: BorderConfig;
  padding?: number;
}

export interface TableDesign {
  headerBackground?: ColorFill;
  headerTextColor?: string;
  bodyBackground?: ColorFill;
  bodyTextColor?: string;
  alternateRowBackground?: ColorFill;
  gridlineColor?: string;
  gridlineWidth?: number;
  captionColor?: string;
}

export interface StyleConfig {
  fontFamily: 'Times New Roman' | 'Garamond' | 'Inter' | 'Helvetica' | 'Georgia' | 'Courier New';
  fontSize: number; // in pt (e.g. 11)
  lineHeight: number; // e.g. 1.5
  paragraphSpacing: number; // e.g. 12
  primaryColor: string; // e.g. #0f172a
  accentColor: string; // e.g. #2563eb
  headingFont: 'Times New Roman' | 'Garamond' | 'Inter' | 'Helvetica' | 'Georgia' | 'Courier New';
  heading1Size: number; // e.g. 18
  heading2Size: number; // e.g. 14
  heading3Size: number; // e.g. 12
  headingCase: 'uppercase' | 'capitalize' | 'none';
  alignment: Alignment;
  isBold?: boolean;
  isItalic?: boolean;
  isUnderline?: boolean;
  isStrikethrough?: boolean;
  textColor?: string;
  highlightColor?: string;
}

export interface PageConfig {
  pageSize: 'A4' | 'LETTER' | 'LEGAL';
  orientation: 'portrait' | 'landscape';
  margins: {
    top: number; // in mm
    bottom: number;
    left: number;
    right: number;
  };
  headerText: string;
  footerText: string;
  showPageNumbers: boolean;
  pageNumberFormat: 'PAGE_X_OF_Y' | 'PAGE_X' | 'DASH_X_DASH';
  firstPageDifferent: boolean;
  watermarkText?: string;
  watermarkOpacity?: number;
}

export interface BrandProfile {
  id: string;
  name: string;
  companyName: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: 'Times New Roman' | 'Garamond' | 'Inter' | 'Helvetica' | 'Georgia' | 'Courier New';
  headerNote?: string;
  footerDisclaimer?: string;
}

export interface TableCell {
  id: string;
  content: string;
  isHeader?: boolean;
  align?: Alignment;
  bold?: boolean;
  bg?: string;
}

export interface TableBlock {
  id: string;
  design?: TableDesign;
  title?: string;
  caption?: string;
  headers: TableCell[];
  rows: TableCell[][];
  columnWidths?: number[]; // percentages
}

export interface ChartBlock {
  id: string;
  title: string;
  chartType: 'bar' | 'pie' | 'line' | 'donut';
  labels: string[];
  values: number[];
  seriesName?: string;
  unit?: string;
}

export interface ImageBlock {
  id: string;
  url: string;
  caption?: string;
  altText?: string;
  widthPercent?: number;
  alignment: Alignment;
}

export interface SignatureParty {
  id: string;
  role: string; // e.g. "PRODUCER", "ARTIST", "COMPANY REPRESENTATIVE"
  name: string;
  title?: string;
  company?: string;
  date?: string;
  signaturePlaceholder?: string;
  hasWitness?: boolean;
  witnessName?: string;
  signed?: boolean;
}

export interface SignatureBlock {
  id: string;
  title?: string;
  parties: SignatureParty[];
  layout?: 'side_by_side' | 'stacked';
  onDedicatedPage?: boolean;
}

export interface Clause {
  id: string;
  clauseNumber: string; // e.g. "4.1" or "(a)"
  heading?: string;
  content: string;
  orderIndex: number;
  sourceReference?: string;
  isRedacted?: boolean;
}

export interface Section {
  id: string;
  design?: SectionDesign;
  sectionNumber: string; // e.g. "1.0", "SECTION 4"
  title: string;
  content?: string;
  clauses: Clause[];
  tables?: TableBlock[];
  charts?: ChartBlock[];
  images?: ImageBlock[];
  orderIndex: number;
  isAppendix?: boolean;
  appendixCode?: string; // e.g. "APPENDIX A"
  forcePageBreakBefore?: boolean;
  sourceReference?: string;
}

export interface DocumentDependency {
  id: string;
  sourceSectionId: string;
  targetSectionId: string;
  referenceText: string; // e.g. "as set forth in Section 4"
  isValid: boolean;
}

export interface DefinedTerm {
  id: string;
  term: string;
  definition: string;
  occurrencesCount?: number;
}

export interface RedactionRecord {
  id: string;
  targetTerm: string;
  replacementText: string;
  instancesCount: number;
  timestamp: string;
}

export interface DocumentModel {
  id: string;
  title: string;
  type: DocumentType;
  version: number;
  createdAt: string;
  updatedAt: string;
  author: string;
  brandProfileId?: string;
  styles: StyleConfig;
  design?: DocumentDesign;
  pageConfig: PageConfig;
  sections: Section[];
  signatures?: SignatureBlock;
  definitions?: DefinedTerm[];
  dependencies?: DocumentDependency[];
  redactions?: RedactionRecord[];
  changeSummary?: string;
}

export interface ExecutionPlanStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
}

export interface ExecutionPlan {
  id: string;
  instruction: string;
  steps: ExecutionPlanStep[];
  autoApprove?: boolean;
}

export interface ExecutionResultSummary {
  operationTitle: string;
  details: string[];
  verifications: {
    name: string;
    passed: boolean;
    notes?: string;
  }[];
  timestamp: string;
  versionCreated: number;
}

export interface VersionSnapshot {
  versionNumber: number;
  timestamp: string;
  summary: string;
  document: DocumentModel;
}

export interface QualityFinding {
  severity: 'high' | 'medium' | 'low' | 'passed';
  category: string;
  title: string;
  description: string;
  suggestedFix?: string;
  affectedSectionId?: string;
}

export interface QualityReport {
  overallScore: number; // 0-100
  integrityScore: number;
  structureScore: number;
  formattingScore: number;
  paginationScore: number;
  referencesScore: number;
  findings: QualityFinding[];
  generatedAt: string;
}

export type AIPersona = 
  | 'auto_architect'
  | 'structural_architect'
  | 'legal_specialist'
  | 'music_specialist'
  | 'financial_specialist'
  | 'document_designer'
  | 'quality_auditor';
