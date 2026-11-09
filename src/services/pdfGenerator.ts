import { jsPDF } from 'jspdf';
import { ColorFill, BorderConfig, DocumentModel, Section, TableBlock, TableCell } from '../types/document';
import {
  resolveDocumentDesign,
  resolveSectionDesign,
  resolveTableDesign,
  resolveCellFill
} from './documentDesign';

/**
 * PDF renderer with line-level pagination and measured table rows.
 * Text is wrapped before drawing and each line is placed only after checking
 * the remaining page height, preventing long paragraphs from being clipped.
 */
export function generatePdfDocument(doc: DocumentModel): jsPDF {
  const isLandscape = doc.pageConfig.orientation === 'landscape';
  const format = doc.pageConfig.pageSize === 'LETTER'
    ? 'letter'
    : doc.pageConfig.pageSize === 'LEGAL'
      ? 'legal'
      : 'a4';

  const pdf = new jsPDF({ orientation: isLandscape ? 'landscape' : 'portrait', unit: 'mm', format });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margins = doc.pageConfig.margins || { top: 20, bottom: 20, left: 20, right: 20 };
  const contentWidth = pageWidth - margins.left - margins.right;
  const bottomLimit = pageHeight - margins.bottom - 10;
  let cursorY = margins.top;
  const design = resolveDocumentDesign(doc);

  const fontMap: Record<string, string> = {
    'Times New Roman': 'times',
    Garamond: 'times',
    Inter: 'helvetica',
    Helvetica: 'helvetica',
    Georgia: 'times',
    'Courier New': 'courier'
  };
  const primaryFont = fontMap[design.typography.bodyFontFamily] || fontMap[doc.styles.fontFamily] || 'times';
  const headingFont = fontMap[design.typography.headingFontFamily] || fontMap[doc.styles.headingFont] || 'times';
  const applyHeadingCase = (value: string): string => {
    if (design.typography.headingCase === 'uppercase') return value.toUpperCase();
    if (design.typography.headingCase === 'capitalize') return value.toLowerCase().replace(/\b\p{L}/gu, character => character.toUpperCase());
    return value;
  };

  const colorToRgb = (color: string): [number, number, number] => {
    const raw = color.replace('#', '');
    const expanded = raw.length === 3 ? raw.split('').map(char => char + char).join('') : raw;
    return [
      Number.parseInt(expanded.slice(0, 2), 16),
      Number.parseInt(expanded.slice(2, 4), 16),
      Number.parseInt(expanded.slice(4, 6), 16)
    ];
  };

  const interpolate = (a: [number, number, number], b: [number, number, number], amount: number): [number, number, number] =>
    [0, 1, 2].map(index => Math.round(a[index] + (b[index] - a[index]) * amount)) as [number, number, number];

  const colorAt = (fill: Extract<ColorFill, { type: 'linear-gradient' }>, position: number, stops: typeof fill.stops): [number, number, number] => {
    if (position <= stops[0].position) return colorToRgb(stops[0].color);
    if (position >= stops[stops.length - 1].position) return colorToRgb(stops[stops.length - 1].color);
    for (let index = 0; index < stops.length - 1; index++) {
      const left = stops[index];
      const right = stops[index + 1];
      if (position >= left.position && position <= right.position) {
        const span = Math.max(0.0001, right.position - left.position);
        return interpolate(colorToRgb(left.color), colorToRgb(right.color), (position - left.position) / span);
      }
    }
    return colorToRgb(stops[stops.length - 1].color);
  };

  const applyOpacity = (opacity: number | undefined) => {
    const api = pdf as any;
    if (opacity === undefined || opacity >= 1 || !api.GState || !api.setGState) return () => undefined;
    try {
      api.setGState(new api.GState({ opacity: Math.max(0, Math.min(1, opacity)) }));
      return () => {
        try { api.setGState(new api.GState({ opacity: 1 })); } catch { /* optional PDF transparency support */ }
      };
    } catch {
      return () => undefined;
    }
  };

  const drawColorFill = (fill: ColorFill | undefined, x: number, y: number, width: number, height: number, detail = 24) => {
    if (!fill || width <= 0 || height <= 0) return;
    const opacity = fill.opacity;
    const restoreOpacity = applyOpacity(opacity);
    if (fill.type === 'solid') {
      pdf.setFillColor(...colorToRgb(fill.color));
      pdf.rect(x, y, width, height, 'F');
      restoreOpacity();
      return;
    }

    // A small vector color mesh keeps PDF text selectable and avoids rasterizing the page.
    const sortedStops = [...fill.stops].sort((a, b) => a.position - b.position);
    const radians = ((fill.angle % 360) * Math.PI) / 180;
    const dx = Math.cos(radians);
    const dy = Math.sin(radians);
    const corners = [[0, 0], [1, 0], [0, 1], [1, 1]];
    const projections = corners.map(([cx, cy]) => cx * dx + cy * dy);
    const minimum = Math.min(...projections);
    const maximum = Math.max(...projections);
    const span = Math.max(0.0001, maximum - minimum);
    const columns = detail;
    const rows = detail;
    for (let row = 0; row < rows; row++) {
      for (let column = 0; column < columns; column++) {
        const nx = (column + 0.5) / columns;
        const ny = (row + 0.5) / rows;
        const position = ((nx * dx + ny * dy - minimum) / span) * 100;
        pdf.setFillColor(...colorAt(fill, position, sortedStops));
        pdf.rect(
          x + (column * width) / columns,
          y + (row * height) / rows,
          width / columns + 0.06,
          height / rows + 0.06,
          'F'
        );
      }
    }
    restoreOpacity();
  };

  const drawBorder = (x: number, y: number, width: number, height: number, border: BorderConfig | undefined) => {
    if (!border || border.style === 'none' || border.width <= 0) return;
    const sides = border.sides?.length ? new Set(border.sides) : new Set(['top', 'right', 'bottom', 'left']);
    pdf.setDrawColor(...colorToRgb(border.color));
    pdf.setLineWidth(border.width * 0.264583);
    const api = pdf as any;
    if (border.style === 'dashed' && api.setLineDashPattern) api.setLineDashPattern([2, 1], 0);
    else if (border.style === 'dotted' && api.setLineDashPattern) api.setLineDashPattern([0.4, 1.2], 0);
    if (sides.has('top')) pdf.line(x, y, x + width, y);
    if (sides.has('right')) pdf.line(x + width, y, x + width, y + height);
    if (sides.has('bottom')) pdf.line(x, y + height, x + width, y + height);
    if (sides.has('left')) pdf.line(x, y, x, y + height);
    if (border.style === 'double') {
      const inset = Math.max(0.5, border.width * 0.35);
      pdf.setLineWidth(Math.max(0.15, border.width * 0.12));
      if (sides.has('top')) pdf.line(x + inset, y + inset, x + width - inset, y + inset);
      if (sides.has('right')) pdf.line(x + width - inset, y + inset, x + width - inset, y + height - inset);
      if (sides.has('bottom')) pdf.line(x + inset, y + height - inset, x + width - inset, y + height - inset);
      if (sides.has('left')) pdf.line(x + inset, y + inset, x + inset, y + height - inset);
    }
    if (api.setLineDashPattern) api.setLineDashPattern([], 0);
  };

  const drawPageBackground = (pageNumber: number) => {
    const fill = pageNumber === 1 && design.page.firstPageBackground
      ? design.page.firstPageBackground
      : design.page.background;
    drawColorFill(fill, 0, 0, pageWidth, pageHeight, 12);
  };

  const drawImageBlocks = (images: NonNullable<DocumentModel['pageHeaderImages']>, maxHeight: number, gap = 3, verticalAlign: 'top' | 'center' = 'center') => {
    if (!Number.isFinite(maxHeight) || maxHeight <= 0) return 0;
    const validImages = images.filter(image => typeof image.url === 'string' && image.url.startsWith('data:image/'));
    if (!validImages.length) return 0;
    const slotWidth = (contentWidth - gap * (validImages.length - 1)) / validImages.length;
    if (slotWidth <= 0) return 0;
    let rowHeight = 0;
    validImages.forEach((image, index) => {
      try {
        const properties = pdf.getImageProperties(image.url);
        const imageWidth = Number(properties.width);
        const imageHeight = Number(properties.height);
        if (!Number.isFinite(imageWidth) || !Number.isFinite(imageHeight) || imageWidth <= 0 || imageHeight <= 0) {
          throw new Error('Image dimensions must be finite positive numbers.');
        }
        const ratio = imageWidth / imageHeight;
        const savedWidth = Number(image.widthPercent ?? 80);
        const widthPercent = Number.isFinite(savedWidth) ? Math.max(10, Math.min(100, savedWidth)) : 80;
        const requestedWidth = slotWidth * widthPercent / 100;
        const width = Math.min(requestedWidth, maxHeight * ratio);
        const height = width / ratio;
        const slotX = margins.left + index * (slotWidth + gap);
        const alignment = image.alignment === 'left' ? 'left' : image.alignment === 'right' ? 'right' : 'center';
        const x = alignment === 'left' ? slotX : alignment === 'right' ? slotX + slotWidth - width : slotX + (slotWidth - width) / 2;
        const y = cursorY + (verticalAlign === 'center' ? (maxHeight - height) / 2 : 0);
        const format = /image\/(jpeg|jpg)/i.test(image.url.slice(0, 40)) ? 'JPEG' : 'PNG';
        pdf.addImage(image.url, format, x, y, width, height);
        rowHeight = Math.max(rowHeight, height);
      } catch (error) {
        console.warn('Skipping unsupported document image:', image.altText || image.id, error);
      }
    });
    return rowHeight;
  };

  const drawPageHeaderImages = () => {
    const images = doc.pageHeaderImages || [];
    if (!doc.imageHeaderRequested || !images.length) return;
    // Reserve room for the document title, metadata, divider and first section heading.
    // Tall images are scaled proportionally to the remaining page area instead of overflowing.
    const headerContentReserve = 42;
    const maxHeight = bottomLimit - cursorY - headerContentReserve;
    if (maxHeight <= 0) return;
    const drawnHeight = drawImageBlocks(images, maxHeight, 3, 'top');
    if (drawnHeight > 0) cursorY += drawnHeight + 4;
  };

  const addPage = () => {
    pdf.addPage();
    cursorY = margins.top;
    drawPageBackground(pdf.getNumberOfPages());
  };

  drawPageBackground(1);
  drawPageHeaderImages();

  const ensureSpace = (height: number) => {
    if (cursorY + height > bottomLimit) addPage();
  };

  const setTextStyle = (
    font: string,
    style: 'normal' | 'bold' | 'italic' = 'normal',
    size = 10.5,
    color: [number, number, number] = colorToRgb(design.colors.bodyText)
  ) => {
    pdf.setFont(font, style);
    pdf.setFontSize(size);
    pdf.setTextColor(...color);
  };

  const drawWrappedText = (
    text: string,
    x: number,
    width: number,
    options: {
      font?: string;
      style?: 'normal' | 'bold' | 'italic';
      size?: number;
      color?: [number, number, number];
      lineHeight?: number;
      after?: number;
      align?: 'left' | 'center' | 'right' | 'justify';
      background?: ColorFill;
      border?: BorderConfig;
      padding?: number;
      minHeight?: number;
      verticalAlign?: 'top' | 'middle' | 'bottom';
    } = {}
  ) => {
    const size = options.size ?? design.typography.bodyFontSize ?? 10.5;
    const lineHeight = options.lineHeight ?? Math.max(4.2, size * 0.43);
    const padding = options.padding ?? 0;
    setTextStyle(options.font || primaryFont, options.style || 'normal', size, options.color);
    const lines = pdf.splitTextToSize(String(text ?? ''), Math.max(8, width)) as string[];
    const align = options.align || design.typography.textAlignment || 'left';
    // jsPDF positions text using its baseline. Give boxed text a separate
    // ascender-safe top inset so glyphs never touch or cross the top border.
    const hasBox = Boolean(options.background || options.border);
    const baselineClearance = hasBox ? Math.max(2.2, size * 0.352778 * 0.78) : 0;
    const topInset = padding + baselineClearance;
    let lineIndex = 0;
    while (lineIndex < lines.length) {
      let linesAvailable = Math.floor((bottomLimit - cursorY - topInset - padding) / lineHeight);
      if (linesAvailable < 1) {
        addPage();
        linesAvailable = Math.floor((bottomLimit - cursorY - padding * 2) / lineHeight);
      }
      const segmentCount = Math.max(1, Math.min(lines.length - lineIndex, linesAvailable));
      const textHeight = segmentCount * lineHeight + topInset + padding;
      const isFinalSegment = lineIndex + segmentCount >= lines.length;
      const minHeight = isFinalSegment && lineIndex === 0 ? (options.minHeight ?? 0) : 0;
      const segmentHeight = Math.max(textHeight, minHeight);
      const boxTop = cursorY - topInset;
      if (options.background) drawColorFill(options.background, x - padding, boxTop, width + padding * 2, segmentHeight, 8);
      if (options.border) drawBorder(x - padding, boxTop, width + padding * 2, segmentHeight, options.border);
      const extraHeight = Math.max(0, segmentHeight - textHeight);
      const verticalOffset = options.verticalAlign === 'middle' ? extraHeight / 2 : options.verticalAlign === 'bottom' ? extraHeight : 0;
      cursorY += verticalOffset;
      for (let offset = 0; offset < segmentCount; offset++) {
        const line = lines[lineIndex + offset];
        const textX = align === 'center' ? x + width / 2 : align === 'right' ? x + width : x;
        pdf.text(line, textX, cursorY, { align });
        cursorY += lineHeight;
      }
      cursorY = boxTop + segmentHeight + padding;
      lineIndex += segmentCount;
    }
    cursorY += options.after ?? 2;
  };

  const drawTable = (table: TableBlock, section: Section) => {
    const tableStyle = resolveTableDesign(doc, section, table);
    const colCount = Math.max(1, table.headers.length, ...table.rows.map(row => row.length));
    const colWidths = table.columnWidths?.length === colCount
      ? table.columnWidths.map(value => contentWidth * value / 100)
      : Array.from({ length: colCount }, () => contentWidth / colCount);
    const colOffsets = colWidths.map((_, index) =>
      colWidths.slice(0, index).reduce((sum, value) => sum + value, 0)
    );
    const cellPadding = 2;
    const tableFontSize = 8.5;
    const tableLineHeight = 4;
    const headerFontSize = 9;
    const headerLineHeight = 4.2;

    const wrapCells = (cells: TableCell[], size: number, boldDefault: boolean) =>
      Array.from({ length: colCount }, (_, index) => {
        const cell = cells[index] || { id: `empty-${index}`, content: '' };
        setTextStyle(primaryFont, cell.bold === true || boldDefault ? 'bold' : 'normal', size);
        return pdf.splitTextToSize(cell.content || '', Math.max(8, colWidths[index] - cellPadding * 2)) as string[];
      });

    const drawHeader = () => {
      const headerCells = table.headers;
      const lines = wrapCells(headerCells, headerFontSize, true);
      const maxLines = Math.max(1, ...lines.map(cell => cell.length));
      const height = maxLines * headerLineHeight + cellPadding * 2;
      ensureSpace(height);
      drawColorFill(tableStyle.headerBackground, margins.left, cursorY, contentWidth, height, 10);
      for (let index = 0; index < colCount; index++) {
        const headerCell = headerCells[index];
        if (headerCell?.bg) drawColorFill({ type: 'solid', color: headerCell.bg }, margins.left + colOffsets[index], cursorY, colWidths[index], height, 6);
      }
      pdf.setDrawColor(...colorToRgb(tableStyle.gridlineColor));
      pdf.setLineWidth(tableStyle.gridlineWidth * 0.264583);
      pdf.rect(margins.left, cursorY, contentWidth, height, 'S');
      for (let index = 1; index < colCount; index++) {
        pdf.line(margins.left + colOffsets[index], cursorY, margins.left + colOffsets[index], cursorY + height);
      }
      for (let index = 0; index < colCount; index++) {
        const headerCell = headerCells[index];
        setTextStyle(primaryFont, 'bold', headerFontSize, colorToRgb(headerCell?.isHeader === false ? tableStyle.bodyTextColor : tableStyle.headerTextColor));
        lines[index].forEach((line, lineIndex) => {
          pdf.text(line, margins.left + colOffsets[index] + cellPadding, cursorY + cellPadding + 3.2 + lineIndex * headerLineHeight);
        });
      }
      cursorY += height;
    };

    if (table.title) {
      drawWrappedText(table.title, margins.left, contentWidth, {
        font: headingFont, style: 'bold', size: 10.5, color: colorToRgb(design.colors.headingText), lineHeight: 4.8, after: 2
      });
    }
    if (table.caption) {
      drawWrappedText(table.caption, margins.left, contentWidth, {
        font: primaryFont, style: 'italic', size: 8.5, color: colorToRgb(tableStyle.captionColor), lineHeight: 4, after: 2
      });
    }

    drawHeader();

    for (const [rowIndex, row] of table.rows.entries()) {
      const cellLines = wrapCells(row, tableFontSize, false);
      const rowLineCount = Math.max(1, ...cellLines.map(cell => cell.length));
      let lineOffset = 0;

      while (lineOffset < rowLineCount) {
        const availableHeight = bottomLimit - cursorY - cellPadding * 2;
        const linesAvailable = Math.floor(availableHeight / tableLineHeight);
        if (linesAvailable < 1) {
          addPage();
          drawHeader();
          continue;
        }

        const segmentLines = Math.min(rowLineCount - lineOffset, linesAvailable);
        const segmentHeight = segmentLines * tableLineHeight + cellPadding * 2;
        for (let index = 0; index < colCount; index++) {
          const cell = row[index];
          const rowCell = cell || { id: 'empty-' + index, content: '' };
          const cellFill = resolveCellFill(tableStyle, rowCell, rowIndex);
          drawColorFill(typeof cellFill === 'string' ? { type: 'solid', color: cellFill } : cellFill,
            margins.left + colOffsets[index], cursorY, colWidths[index], segmentHeight, 6);
        }

        pdf.setDrawColor(...colorToRgb(tableStyle.gridlineColor));
        pdf.setLineWidth(tableStyle.gridlineWidth * 0.264583);
        pdf.rect(margins.left, cursorY, contentWidth, segmentHeight, 'S');
        for (let index = 1; index < colCount; index++) {
          pdf.line(margins.left + colOffsets[index], cursorY, margins.left + colOffsets[index], cursorY + segmentHeight);
        }

        for (let index = 0; index < colCount; index++) {
          const cell = row[index];
          setTextStyle(primaryFont, cell?.bold ? 'bold' : 'normal', tableFontSize, colorToRgb(tableStyle.bodyTextColor));
          const visibleLines = cellLines[index].slice(lineOffset, lineOffset + segmentLines);
          visibleLines.forEach((line, lineIndex) => {
            pdf.text(line, margins.left + colOffsets[index] + cellPadding, cursorY + cellPadding + 3.1 + lineIndex * tableLineHeight);
          });
        }

        cursorY += segmentHeight;
        lineOffset += segmentLines;
        if (lineOffset < rowLineCount) {
          addPage();
          drawHeader();
        }
      }
    }
    cursorY += 5;
  };

  // Document title and metadata
  const title = applyHeadingCase(doc.title);
  drawWrappedText(title, margins.left, contentWidth, {
    font: headingFont, style: 'bold', size: design.typography.heading1Size || doc.styles.heading1Size || 18,
    color: colorToRgb(design.colors.headingText), lineHeight: 8, after: 2, align: 'center'
  });

  drawWrappedText(
    `Version ${doc.version} | Last Updated: ${new Date(doc.updatedAt).toLocaleDateString()} | Author: ${doc.author}`,
    margins.left, contentWidth,
    { font: primaryFont, style: 'italic', size: 9, color: colorToRgb(design.colors.mutedText), lineHeight: 4.5, after: 2, align: 'center' }
  );

  ensureSpace(5);
  pdf.setDrawColor(...colorToRgb(design.pageFurniture.dividerColor));
  pdf.setLineWidth(design.pageFurniture.dividerWidth * 0.264583);
  pdf.line(margins.left, cursorY, pageWidth - margins.right, cursorY);
  cursorY += 8;

  // Document sections
  for (const section of doc.sections) {
    const sectionStyle = resolveSectionDesign(doc, section);
    const sectionPadding = sectionStyle.padding * 0.264583;
    const sectionX = margins.left + sectionPadding;
    const sectionWidth = Math.max(8, contentWidth - sectionPadding * 2);
    if (section.forcePageBreakBefore) addPage();
    else ensureSpace(12);

    drawWrappedText(applyHeadingCase(`${section.sectionNumber} ${section.title}`), sectionX, sectionWidth, {
      font: headingFont, style: 'bold', size: design.typography.heading2Size || doc.styles.heading2Size || 13,
      color: colorToRgb(sectionStyle.headingColor), lineHeight: 6, after: 2,
      background: sectionStyle.background, border: sectionStyle.border, padding: sectionPadding,
      align: design.typography.textAlignment || 'left', minHeight: (design.typography.contentBoxMinHeight || 0) * 0.264583,
      verticalAlign: design.typography.verticalAlignment || 'top'
    });

    const drawSectionBody = (bodyText: string) => {
      if (!bodyText) return;
      drawWrappedText(bodyText, sectionX, sectionWidth, {
        font: primaryFont, size: design.typography.bodyFontSize || doc.styles.fontSize || 10.5,
        color: colorToRgb(sectionStyle.bodyTextColor),
        lineHeight: (design.typography.bodyFontSize || doc.styles.fontSize || 10.5) * design.typography.bodyLineHeight * 0.352778,
        after: design.typography.paragraphSpacing * 0.264583,
        background: sectionStyle.background, border: sectionStyle.border, padding: sectionPadding,
        align: design.typography.textAlignment || 'left', minHeight: (design.typography.contentBoxMinHeight || 0) * 0.264583,
        verticalAlign: design.typography.verticalAlignment || 'top'
      });
    };
    const drawSectionImages = () => {
      if (!section.images?.length) return;
      const imageHeight = 100;
      const drawnHeight = drawImageBlocks(section.images, imageHeight, 4);
      if (drawnHeight > 0) {
        cursorY += drawnHeight + 2;
        section.images.forEach(image => {
          if (image.caption?.trim()) drawWrappedText(image.caption, margins.left, contentWidth, {
            font: primaryFont, style: 'italic', size: 8.5,
            color: colorToRgb(design.colors.mutedText), align: image.alignment || 'center',
            lineHeight: 4, after: 1
          });
        });
      }
    };
    if (section.content) {
      const marker = section.imageMarkerPosition;
      if (typeof marker === 'number') {
        drawSectionBody(section.content.slice(0, marker));
        drawSectionImages();
        drawSectionBody(section.content.slice(marker));
      } else {
        drawSectionBody(section.content);
      }
    } else if (typeof section.imageMarkerPosition === 'number') {
      drawSectionImages();
    }

    if (section.scrollableContent) {
      const panelTextColor = section.design?.scrollableTextColor || sectionStyle.bodyTextColor;
      const panelBorderColor = section.design?.scrollableBorderColor || sectionStyle.border.color;
      drawWrappedText(section.scrollableContent, sectionX, sectionWidth, {
        font: primaryFont, size: design.typography.bodyFontSize || doc.styles.fontSize || 10.5,
        color: colorToRgb(panelTextColor),
        lineHeight: (design.typography.bodyFontSize || doc.styles.fontSize || 10.5) * design.typography.bodyLineHeight * 0.352778,
        after: design.typography.paragraphSpacing * 0.264583,
        background: section.design?.scrollableBackgroundColor
          ? { type: 'solid', color: section.design.scrollableBackgroundColor, opacity: 1 }
          : sectionStyle.background,
        border: section.design?.scrollableBorderColor
          ? { ...sectionStyle.border, color: panelBorderColor }
          : sectionStyle.border,
        padding: sectionPadding,
        align: design.typography.textAlignment || 'left', minHeight: (design.typography.contentBoxMinHeight || 0) * 0.264583,
        verticalAlign: design.typography.verticalAlignment || 'top'
      });
    }

    for (const clause of section.clauses || []) {
      const heading = clause.heading ? `${clause.heading}: ` : '';
      drawWrappedText(`${clause.clauseNumber}  ${heading}${clause.content}`, sectionX + 4, Math.max(8, sectionWidth - 4), {
        font: primaryFont, size: design.typography.bodyFontSize || doc.styles.fontSize || 10.5,
        color: colorToRgb(sectionStyle.bodyTextColor),
        lineHeight: (design.typography.bodyFontSize || doc.styles.fontSize || 10.5) * design.typography.bodyLineHeight * 0.352778,
        after: design.typography.paragraphSpacing * 0.264583,
        background: sectionStyle.background, border: sectionStyle.border, padding: sectionPadding,
        align: design.typography.textAlignment || 'left', minHeight: (design.typography.contentBoxMinHeight || 0) * 0.264583,
        verticalAlign: design.typography.verticalAlignment || 'top'
      });
    }

    for (const table of section.tables || []) drawTable(table, section);
    if (typeof section.imageMarkerPosition !== 'number' && section.images?.length) drawSectionImages();
    cursorY += 3;
  }

  // Signatures
  if (doc.signatures?.parties.length) {
    if (doc.signatures.onDedicatedPage) addPage();
    else ensureSpace(55);

    drawWrappedText(doc.signatures.title || 'SIGNATURES & EXECUTION', margins.left, contentWidth, {
      font: headingFont, style: 'bold', size: 14, color: colorToRgb(design.colors.headingText), lineHeight: 7, after: 2
    });
    drawWrappedText(
      doc.signatures.executionText || 'IN WITNESS WHEREOF, the Parties have executed this Agreement as of the date written below.',
      margins.left, contentWidth,
      { font: primaryFont, style: 'italic', size: 9.5, color: colorToRgb(design.colors.mutedText), lineHeight: 4.5, after: 5 }
    );

    const parties = doc.signatures.parties;
    const sideBySide = doc.signatures.layout === 'side_by_side' && parties.length === 2;
    if (sideBySide) {
      ensureSpace(50);
      const startY = cursorY;
      const blockWidth = (contentWidth - 10) / 2;
      parties.forEach((party, index) => {
        const blockX = margins.left + index * (blockWidth + 10);
        pdf.setFont(primaryFont, 'bold');
        pdf.setFontSize(10);
        pdf.setTextColor(...colorToRgb(design.colors.headingText));
        pdf.text(party.role, blockX, startY);
        pdf.setDrawColor(...colorToRgb(design.colors.primary));
        pdf.setLineWidth(0.5);
        pdf.line(blockX, startY + 14, blockX + blockWidth - 10, startY + 14);
        pdf.setFont('courier', 'italic');
        pdf.setFontSize(10);
        pdf.setTextColor(...colorToRgb(design.colors.accent));
        pdf.text(party.signaturePlaceholder || `/s/ ${party.name}`, blockX + 5, startY + 12);
        pdf.setFont(primaryFont, 'normal');
        pdf.setFontSize(9);
        pdf.setTextColor(...colorToRgb(design.colors.bodyText));
        pdf.text(`By: ${party.name}`, blockX, startY + 20);
        if (party.title) pdf.text(`Title: ${party.title}`, blockX, startY + 25);
        if (party.company) pdf.text(`Company: ${party.company}`, blockX, startY + 30);
        if (party.date) pdf.text(`Date: ${party.date}`, blockX, startY + 35);
        if (party.hasWitness && party.witnessName) pdf.text(`Witness: ${party.witnessName}`, blockX, startY + 40);
      });
      cursorY = startY + 48;
    } else {
      for (const party of parties) {
        ensureSpace(48);
        drawWrappedText(party.role, margins.left, contentWidth, {
          font: primaryFont, style: 'bold', size: 10, color: colorToRgb(design.colors.headingText), lineHeight: 4.5, after: 1
        });
        pdf.setDrawColor(...colorToRgb(design.colors.primary));
        pdf.line(margins.left, cursorY + 3, pageWidth - margins.right, cursorY + 3);
        drawWrappedText(party.signaturePlaceholder || `/s/ ${party.name}`, margins.left + 5, contentWidth - 10, {
          font: 'courier', style: 'italic', size: 10, color: colorToRgb(design.colors.accent), lineHeight: 4.5, after: 1
        });
        drawWrappedText(`By: ${party.name}`, margins.left, contentWidth, { font: primaryFont, size: 9, color: colorToRgb(design.colors.bodyText), lineHeight: 4, after: 0 });
        if (party.title) drawWrappedText(`Title: ${party.title}`, margins.left, contentWidth, { font: primaryFont, size: 9, color: colorToRgb(design.colors.bodyText), lineHeight: 4, after: 0 });
        if (party.company) drawWrappedText(`Company: ${party.company}`, margins.left, contentWidth, { font: primaryFont, size: 9, color: colorToRgb(design.colors.bodyText), lineHeight: 4, after: 0 });
        if (party.date) drawWrappedText(`Date: ${party.date}`, margins.left, contentWidth, { font: primaryFont, size: 9, color: colorToRgb(design.colors.bodyText), lineHeight: 4, after: 0 });
        if (party.hasWitness && party.witnessName) drawWrappedText(`Witness: ${party.witnessName}`, margins.left, contentWidth, { font: primaryFont, size: 9, color: colorToRgb(design.colors.bodyText), lineHeight: 4, after: 2 });
        cursorY += 5;
      }
    }
  }

  // Stamp page furniture after all content has been paginated.
  const totalPages = pdf.internal.pages.length - 1;
  for (let page = 1; page <= totalPages; page++) {
    pdf.setPage(page);
    if (doc.pageConfig.watermarkText) {
      pdf.setFont(primaryFont, 'bold');
      pdf.setFontSize(45);
      pdf.setTextColor(226, 232, 240);
      pdf.text(doc.pageConfig.watermarkText, pageWidth / 2, pageHeight / 2, { align: 'center', angle: 45 });
    }
    if (doc.pageConfig.headerText) {
      pdf.setFont(primaryFont, 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(...colorToRgb(design.pageFurniture.headerTextColor));
      pdf.text(doc.pageConfig.headerText, margins.left, 12);
      pdf.setDrawColor(...colorToRgb(design.pageFurniture.dividerColor));
      pdf.setLineWidth(design.pageFurniture.dividerWidth * 0.264583);
      pdf.line(margins.left, 14, pageWidth - margins.right, 14);
    }
    pdf.setFont(primaryFont, 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(...colorToRgb(design.pageFurniture.footerTextColor));
    if (doc.pageConfig.footerText) pdf.text(doc.pageConfig.footerText, margins.left, pageHeight - 10);
    if (doc.pageConfig.showPageNumbers) {
      const pageNum = doc.pageConfig.pageNumberFormat === 'PAGE_X'
        ? `Page ${page}`
        : doc.pageConfig.pageNumberFormat === 'DASH_X_DASH'
          ? `- ${page} -`
          : `Page ${page} of ${totalPages}`;
      pdf.text(pageNum, pageWidth - margins.right, pageHeight - 10, { align: 'right' });
    }
  }

  return pdf;
}

export function downloadPdf(doc: DocumentModel, filename?: string) {
  const pdf = generatePdfDocument(doc);
  const cleanName = (filename || doc.title || 'document').replace(/[^a-z0-9_-]/gi, '_');
  pdf.save(`${cleanName}.pdf`);
}

export function generatePdfBlobUrl(doc: DocumentModel): string {
  const pdf = generatePdfDocument(doc);
  return URL.createObjectURL(pdf.output('blob'));
}
