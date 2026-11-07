import { jsPDF } from 'jspdf';
import { DocumentModel, TableBlock, TableCell } from '../types/document';

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

  const fontMap: Record<string, string> = {
    'Times New Roman': 'times',
    Garamond: 'times',
    Inter: 'helvetica',
    Helvetica: 'helvetica',
    Georgia: 'times',
    'Courier New': 'courier'
  };
  const primaryFont = fontMap[doc.styles.fontFamily] || 'times';
  const headingFont = fontMap[doc.styles.headingFont] || 'times';

  const addPage = () => {
    pdf.addPage();
    cursorY = margins.top;
  };

  const ensureSpace = (height: number) => {
    if (cursorY + height > bottomLimit) addPage();
  };

  const setTextStyle = (
    font: string,
    style: 'normal' | 'bold' | 'italic' = 'normal',
    size = 10.5,
    color: [number, number, number] = [30, 41, 59]
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
    } = {}
  ) => {
    const size = options.size ?? 10.5;
    const lineHeight = options.lineHeight ?? Math.max(4.2, size * 0.43);
    setTextStyle(options.font || primaryFont, options.style || 'normal', size, options.color);
    const lines = pdf.splitTextToSize(String(text ?? ''), width) as string[];
    for (const line of lines) {
      ensureSpace(lineHeight);
      pdf.text(line, x, cursorY, options.align ? { align: options.align } : undefined);
      cursorY += lineHeight;
    }
    cursorY += options.after ?? 2;
  };

  const drawTable = (table: TableBlock) => {
    const colCount = Math.max(1, table.headers.length);
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
      pdf.setFillColor(241, 245, 249);
      pdf.setDrawColor(203, 213, 225);
      pdf.rect(margins.left, cursorY, contentWidth, height, 'FD');
      for (let index = 0; index < colCount; index++) {
        if (index > 0) pdf.line(margins.left + colOffsets[index], cursorY, margins.left + colOffsets[index], cursorY + height);
        setTextStyle(primaryFont, 'bold', headerFontSize, [15, 23, 42]);
        lines[index].forEach((line, lineIndex) => {
          pdf.text(line, margins.left + colOffsets[index] + cellPadding, cursorY + cellPadding + 3.2 + lineIndex * headerLineHeight);
        });
      }
      cursorY += height;
    };

    if (table.title) {
      drawWrappedText(table.title, margins.left, contentWidth, {
        font: headingFont, style: 'bold', size: 10.5, color: [15, 23, 42], lineHeight: 4.8, after: 2
      });
    }
    if (table.caption) {
      drawWrappedText(table.caption, margins.left, contentWidth, {
        font: primaryFont, style: 'italic', size: 8.5, color: [100, 116, 139], lineHeight: 4, after: 2
      });
    }

    drawHeader();

    for (const row of table.rows) {
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
        pdf.setDrawColor(203, 213, 225);
        pdf.rect(margins.left, cursorY, contentWidth, segmentHeight, 'S');

        for (let index = 0; index < colCount; index++) {
          if (index > 0) pdf.line(margins.left + colOffsets[index], cursorY, margins.left + colOffsets[index], cursorY + segmentHeight);
          const cell = row[index];
          setTextStyle(primaryFont, cell?.bold ? 'bold' : 'normal', tableFontSize, [51, 65, 85]);
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
  const title = doc.styles.headingCase === 'uppercase' ? doc.title.toUpperCase() : doc.title;
  drawWrappedText(title, margins.left, contentWidth, {
    font: headingFont, style: 'bold', size: doc.styles.heading1Size || 18,
    color: [15, 23, 42], lineHeight: 8, after: 2, align: 'center'
  });

  drawWrappedText(
    `Version ${doc.version} | Last Updated: ${new Date(doc.updatedAt).toLocaleDateString()} | Author: ${doc.author}`,
    margins.left, contentWidth,
    { font: primaryFont, style: 'italic', size: 9, color: [100, 116, 139], lineHeight: 4.5, after: 2, align: 'center' }
  );

  ensureSpace(5);
  pdf.setDrawColor(203, 213, 225);
  pdf.setLineWidth(0.5);
  pdf.line(margins.left, cursorY, pageWidth - margins.right, cursorY);
  cursorY += 8;

  // Document sections
  for (const section of doc.sections) {
    if (section.forcePageBreakBefore) addPage();
    else ensureSpace(12);

    drawWrappedText(`${section.sectionNumber} ${section.title.toUpperCase()}`, margins.left, contentWidth, {
      font: headingFont, style: 'bold', size: doc.styles.heading2Size || 13,
      color: [30, 58, 138], lineHeight: 6, after: 2
    });

    if (section.content) {
      drawWrappedText(section.content, margins.left, contentWidth, {
        font: primaryFont, size: doc.styles.fontSize || 10.5,
        color: [51, 65, 85], lineHeight: 5, after: 3
      });
    }

    for (const clause of section.clauses || []) {
      const heading = clause.heading ? `${clause.heading}: ` : '';
      drawWrappedText(`${clause.clauseNumber}  ${heading}${clause.content}`, margins.left + 4, contentWidth - 4, {
        font: primaryFont, size: doc.styles.fontSize || 10.5,
        color: [30, 41, 59], lineHeight: 5, after: 2
      });
    }

    for (const table of section.tables || []) drawTable(table);
    cursorY += 3;
  }

  // Signatures
  if (doc.signatures?.parties.length) {
    if (doc.signatures.onDedicatedPage) addPage();
    else ensureSpace(55);

    drawWrappedText(doc.signatures.title || 'SIGNATURES & EXECUTION', margins.left, contentWidth, {
      font: headingFont, style: 'bold', size: 14, color: [15, 23, 42], lineHeight: 7, after: 2
    });
    drawWrappedText(
      'IN WITNESS WHEREOF, the Parties have executed this Agreement as of the date written below.',
      margins.left, contentWidth,
      { font: primaryFont, style: 'italic', size: 9.5, color: [100, 116, 139], lineHeight: 4.5, after: 5 }
    );

    for (const party of doc.signatures.parties) {
      ensureSpace(48);
      drawWrappedText(party.role, margins.left, contentWidth, {
        font: primaryFont, style: 'bold', size: 10, color: [15, 23, 42], lineHeight: 4.5, after: 1
      });
      pdf.setDrawColor(71, 85, 105);
      pdf.line(margins.left, cursorY + 3, pageWidth - margins.right, cursorY + 3);
      drawWrappedText(party.signaturePlaceholder || `/s/ ${party.name}`, margins.left + 5, contentWidth - 10, {
        font: 'courier', style: 'italic', size: 10, color: [30, 58, 138], lineHeight: 4.5, after: 1
      });
      drawWrappedText(`By: ${party.name}`, margins.left, contentWidth, { font: primaryFont, size: 9, lineHeight: 4, after: 0 });
      if (party.title) drawWrappedText(`Title: ${party.title}`, margins.left, contentWidth, { font: primaryFont, size: 9, lineHeight: 4, after: 0 });
      if (party.company) drawWrappedText(`Company: ${party.company}`, margins.left, contentWidth, { font: primaryFont, size: 9, lineHeight: 4, after: 0 });
      if (party.date) drawWrappedText(`Date: ${party.date}`, margins.left, contentWidth, { font: primaryFont, size: 9, lineHeight: 4, after: 0 });
      if (party.hasWitness && party.witnessName) drawWrappedText(`Witness: ${party.witnessName}`, margins.left, contentWidth, { font: primaryFont, size: 9, lineHeight: 4, after: 2 });
      cursorY += 5;
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
      pdf.setTextColor(148, 163, 184);
      pdf.text(doc.pageConfig.headerText, margins.left, 12);
      pdf.setDrawColor(226, 232, 240);
      pdf.line(margins.left, 14, pageWidth - margins.right, 14);
    }
    pdf.setFont(primaryFont, 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(148, 163, 184);
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
