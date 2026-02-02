import { jsPDF } from 'jspdf';

export interface BoardPart {
  label: string;
  width: number;
  height: number;
}

interface GroupedParts {
  [label: string]: BoardPart[];
}

export function exportPartsToPdf(parts: BoardPart[]): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;

  let y = margin;

  // Title
  doc.setFontSize(18);
  doc.text('部材リスト - Raised Bed', margin, y);
  y += 10;

  // Date
  doc.setFontSize(10);
  const date = new Date().toLocaleDateString('ja-JP');
  doc.text(`作成日: ${date}`, margin, y);
  y += 15;

  // Group parts by label
  const grouped: GroupedParts = {};
  for (const part of parts) {
    if (!grouped[part.label]) {
      grouped[part.label] = [];
    }
    grouped[part.label].push(part);
  }

  // Scale factor for drawing rectangles (mm in real -> mm in PDF)
  const maxPartWidth = Math.max(...parts.map((p) => p.width), 1);
  const rectMaxWidth = contentWidth * 0.6;
  const scale = rectMaxWidth / maxPartWidth;

  // Draw each group
  for (const [label, labelParts] of Object.entries(grouped)) {
    // Check if we need a new page
    if (y > 250) {
      doc.addPage();
      y = margin;
    }

    // Group header
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`${label} (${labelParts.length}個)`, margin, y);
    y += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    // Draw each part
    for (const part of labelParts) {
      // Check if we need a new page
      if (y > 270) {
        doc.addPage();
        y = margin;
      }

      const rectWidth = part.width * scale;
      const rectHeight = Math.max(part.height * scale, 3);

      // Draw rectangle
      doc.setDrawColor(180, 130, 70);
      doc.setFillColor(255, 236, 179);
      doc.rect(margin, y, rectWidth, rectHeight, 'FD');

      // Dimension text
      const dimText = `${part.width} × ${part.height} mm`;
      doc.setTextColor(100, 100, 100);
      doc.text(dimText, margin + rectWidth + 5, y + rectHeight / 2 + 1);

      y += rectHeight + 5;
    }

    y += 10;
  }

  // Summary
  if (y > 250) {
    doc.addPage();
    y = margin;
  }

  doc.setDrawColor(0);
  doc.setTextColor(0);
  doc.setFontSize(10);
  doc.text(`合計: ${parts.length} 個の部材`, margin, y);

  // Download
  doc.save('raised-bed-parts.pdf');
}
