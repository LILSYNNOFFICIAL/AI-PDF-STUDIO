import { jsPDF } from 'jspdf';
import { DocumentModel } from '../types/document';

/**
 * High-fidelity PDF Generation Engine using jsPDF
 */
export function generatePdfDocument(doc: DocumentModel): jsPDF {
  const isLandscape = doc.pageConfig.orientation === 'landscape';
  const format = doc.pageConfig.pageSize === 'LETTER' ? 'letter' : 'a4';
  
  const pdf = new jsPDF({
    orientation: isLandscape ? 'landscape' : 'portrait',
    unit: 'mm',
    format: format
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margins = doc.pageConfig.margins || { top: 20, bottom: 20, left: 20, right: 20 };
  const contentWidth = pageWidth - margins.left - margins.right;

  let cursorY = margins.top;

  const fontMap: Record<string, string> = {
    'Times New Roman': 'times',
    'Garamond': 'times',
    'Inter': 'helvetica',
    'Helvetica': 'helvetica',
    'Georgia': 'times',
    'Courier New': 'courier'
  };

  const primaryFont = fontMap[doc.styles.fontFamily] || 'times';
  const headingFont = fontMap[doc.styles.headingFont] || 'times';

  const checkPageOverflow = (neededHeight: number) => {
    if (cursorY + neededHeight > pageHeight - margins.bottom - 10) {
      pdf.addPage();
      cursorY = margins.top;
      return true;
    }
    return false;
  };

  // Document Title Header
  pdf.setFont(headingFont, 'bold');
  pdf.setFontSize(doc.styles.heading1Size || 18);
  pdf.setTextColor(15, 23, 42); // slate-900

  const titleLines = pdf.splitTextToSize(
    doc.styles.headingCase === 'uppercase' ? doc.title.toUpperCase() : doc.title, 
    contentWidth
  );
  pdf.text(titleLines, pageWidth / 2, cursorY, { align: 'center' });
  cursorY += titleLines.length * 8 + 4;

  // Metadata subheader line
  pdf.setFont(primaryFont, 'italic');
  pdf.setFontSize(9);
  pdf.setTextColor(100, 116, 139); // slate-500
  pdf.text(
    `Version ${doc.version} | Last Updated: ${new Date(doc.updatedAt).toLocaleDateString()} | Author: ${doc.author}`, 
    pageWidth / 2, 
    cursorY, 
    { align: 'center' }
  );
  cursorY += 8;

  // Horizontal divider
  pdf.setDrawColor(203, 213, 225); // slate-300
  pdf.setLineWidth(0.5);
  pdf.line(margins.left, cursorY, pageWidth - margins.right, cursorY);
  cursorY += 10;

  // Render Sections
  doc.sections.forEach((section) => {
    if (section.forcePageBreakBefore) {
      pdf.addPage();
      cursorY = margins.top;
    } else {
      checkPageOverflow(25);
    }

    // Section Header
    pdf.setFont(headingFont, 'bold');
    pdf.setFontSize(doc.styles.heading2Size || 13);
    pdf.setTextColor(30, 58, 138); // blue-900

    const sectionTitleText = `${section.sectionNumber} ${section.title.toUpperCase()}`;
    const sectionTitleLines = pdf.splitTextToSize(sectionTitleText, contentWidth);
    pdf.text(sectionTitleLines, margins.left, cursorY);
    cursorY += sectionTitleLines.length * 6 + 4;

    // Section introductory content
    if (section.content) {
      pdf.setFont(primaryFont, 'normal');
      pdf.setFontSize(doc.styles.fontSize || 10.5);
      pdf.setTextColor(51, 65, 85); // slate-700
      const contentLines = pdf.splitTextToSize(section.content, contentWidth);
      checkPageOverflow(contentLines.length * 5 + 3);
      pdf.text(contentLines, margins.left, cursorY);
      cursorY += contentLines.length * 5 + 4;
    }

    // Clauses
    if (section.clauses && section.clauses.length > 0) {
      section.clauses.forEach((clause) => {
        const clauseHeading = clause.heading ? `${clause.heading}: ` : '';
        const fullClauseText = `${clause.clauseNumber}  ${clauseHeading}${clause.content}`;
        
        pdf.setFont(primaryFont, 'normal');
        pdf.setFontSize(doc.styles.fontSize || 10.5);
        pdf.setTextColor(30, 41, 59);

        const clauseLines = pdf.splitTextToSize(fullClauseText, contentWidth - 4);
        checkPageOverflow(clauseLines.length * 5 + 4);

        pdf.text(clauseLines, margins.left + 4, cursorY);
        cursorY += clauseLines.length * 5 + 3;
      });
      cursorY += 3;
    }

    // Tables
    if (section.tables && section.tables.length > 0) {
      section.tables.forEach((table) => {
        checkPageOverflow(40);
        
        if (table.title) {
          pdf.setFont(headingFont, 'bold');
          pdf.setFontSize(10.5);
          pdf.setTextColor(15, 23, 42);
          pdf.text(table.title, margins.left, cursorY);
          cursorY += 6;
        }

        const colCount = table.headers.length || 1;
        const colWidth = contentWidth / colCount;
        const rowHeight = 7.5;

        // Header Row
        pdf.setFillColor(241, 245, 249); // slate-100
        pdf.rect(margins.left, cursorY, contentWidth, rowHeight, 'F');
        pdf.setDrawColor(203, 213, 225);
        pdf.rect(margins.left, cursorY, contentWidth, rowHeight, 'S');

        pdf.setFont(primaryFont, 'bold');
        pdf.setFontSize(9);
        pdf.setTextColor(15, 23, 42);

        table.headers.forEach((h, cIdx) => {
          const cellX = margins.left + cIdx * colWidth;
          pdf.text(h.content, cellX + 2, cursorY + 5);
          if (cIdx > 0) {
            pdf.line(cellX, cursorY, cellX, cursorY + rowHeight);
          }
        });
        cursorY += rowHeight;

        // Table Rows
        table.rows.forEach((row) => {
          checkPageOverflow(rowHeight + 2);
          pdf.setFont(primaryFont, 'normal');
          pdf.setFontSize(8.5);
          pdf.setTextColor(51, 65, 85);
          pdf.rect(margins.left, cursorY, contentWidth, rowHeight, 'S');

          row.forEach((cell, cIdx) => {
            const cellX = margins.left + cIdx * colWidth;
            if (cell.bold) pdf.setFont(primaryFont, 'bold');
            else pdf.setFont(primaryFont, 'normal');
            
            pdf.text(cell.content, cellX + 2, cursorY + 5);
            if (cIdx > 0) {
              pdf.line(cellX, cursorY, cellX, cursorY + rowHeight);
            }
          });
          cursorY += rowHeight;
        });

        cursorY += 6;
      });
    }

    cursorY += 4;
  });

  // Signatures Block
  if (doc.signatures && doc.signatures.parties.length > 0) {
    if (doc.signatures.onDedicatedPage) {
      pdf.addPage();
      cursorY = margins.top + 10;
    } else {
      checkPageOverflow(60);
      cursorY += 10;
    }

    pdf.setFont(headingFont, 'bold');
    pdf.setFontSize(14);
    pdf.setTextColor(15, 23, 42);
    pdf.text(doc.signatures.title || 'SIGNATURES & EXECUTION', margins.left, cursorY);
    cursorY += 8;

    pdf.setFont(primaryFont, 'italic');
    pdf.setFontSize(9.5);
    pdf.setTextColor(100, 116, 139);
    pdf.text('IN WITNESS WHEREOF, the Parties have executed this Agreement as of the date written below.', margins.left, cursorY);
    cursorY += 12;

    const parties = doc.signatures.parties;
    const isSideBySide = doc.signatures.layout === 'side_by_side' && parties.length === 2;
    const blockWidth = isSideBySide ? (contentWidth - 10) / 2 : contentWidth;

    parties.forEach((party, idx) => {
      const blockX = isSideBySide && idx === 1 ? margins.left + blockWidth + 10 : margins.left;
      const initialY = isSideBySide && idx === 1 ? cursorY - 35 : cursorY;

      pdf.setFont(primaryFont, 'bold');
      pdf.setFontSize(10);
      pdf.setTextColor(15, 23, 42);
      pdf.text(party.role, blockX, initialY);

      // Signature line
      pdf.setDrawColor(71, 85, 105);
      pdf.setLineWidth(0.5);
      pdf.line(blockX, initialY + 14, blockX + blockWidth - 10, initialY + 14);

      // Signature placeholder text
      pdf.setFont('courier', 'italic');
      pdf.setFontSize(11);
      pdf.setTextColor(30, 58, 138);
      pdf.text(party.signaturePlaceholder || `/s/ ${party.name}`, blockX + 5, initialY + 12);

      // Party Details
      pdf.setFont(primaryFont, 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(51, 65, 85);
      pdf.text(`By: ${party.name}`, blockX, initialY + 19);
      if (party.title) pdf.text(`Title: ${party.title}`, blockX, initialY + 24);
      if (party.company) pdf.text(`Company: ${party.company}`, blockX, initialY + 29);
      if (party.date) pdf.text(`Date: ${party.date}`, blockX, initialY + 34);

      if (party.hasWitness && party.witnessName) {
        pdf.text(`Witness: ${party.witnessName}`, blockX, initialY + 39);
      }

      if (!isSideBySide || idx === 1) {
        cursorY = initialY + 45;
      }
    });
  }

  // Stamp Headers, Footers, Page Numbers, Watermarks across all pages
  const totalPages = pdf.internal.pages.length - 1; // jsPDF 1-indexed

  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);

    // Watermark
    if (doc.pageConfig.watermarkText) {
      pdf.setFont(primaryFont, 'bold');
      pdf.setFontSize(45);
      pdf.setTextColor(226, 232, 240); // very faint slate
      pdf.text(
        doc.pageConfig.watermarkText, 
        pageWidth / 2, 
        pageHeight / 2, 
        { align: 'center', angle: 45 }
      );
    }

    // Header
    if (doc.pageConfig.headerText) {
      pdf.setFont(primaryFont, 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(148, 163, 184); // slate-400
      pdf.text(doc.pageConfig.headerText, margins.left, 12);
      pdf.setDrawColor(226, 232, 240);
      pdf.line(margins.left, 14, pageWidth - margins.right, 14);
    }

    // Footer
    pdf.setFont(primaryFont, 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(148, 163, 184);
    
    if (doc.pageConfig.footerText) {
      pdf.text(doc.pageConfig.footerText, margins.left, pageHeight - 10);
    }

    if (doc.pageConfig.showPageNumbers) {
      const pageNumStr = `Page ${i} of ${totalPages}`;
      pdf.text(pageNumStr, pageWidth - margins.right, pageHeight - 10, { align: 'right' });
    }
  }

  return pdf;
}

/**
 * Downloads the PDF directly to client browser
 */
export function downloadPdf(doc: DocumentModel, filename?: string) {
  const pdf = generatePdfDocument(doc);
  const cleanName = (filename || doc.title || 'document').replace(/[^a-z0-9_-]/gi, '_');
  pdf.save(`${cleanName}.pdf`);
}

/**
 * Generates a Blob URL to display in an iframe or preview
 */
export function generatePdfBlobUrl(doc: DocumentModel): string {
  const pdf = generatePdfDocument(doc);
  const blob = pdf.output('blob');
  return URL.createObjectURL(blob);
}
