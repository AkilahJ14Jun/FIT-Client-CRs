// ─── Box Entries List PDF Generator ──────────────────────────────────────────
// Uses ONLY native jsPDF primitives — no jspdf-autotable dependency.

import { jsPDF } from 'jspdf';
import type { BoxEntry } from '../db/database';
import { getEntryAreaName } from '../db/database';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yy = String(d.getFullYear()).slice(-2);
  return `${dd}-${mm}-${yy}`;
}

function formatEntryType(type: string): string {
  switch (type) {
    case 'opening_balance': return 'Opening Stock';
    case 'dispatch': return 'Dispatch';
    case 'return': return 'Return';
    default: return type;
  }
}

// ─── Column definitions ───────────────────────────────────────────────────────
interface ColDef {
  header: string;
  width: number;
  align: 'left' | 'center' | 'right';
}

const COLUMNS: ColDef[] = [
  { header: 'Sl.',        width: 12,  align: 'center' },
  { header: 'Bill No.',   width: 28,  align: 'center' },
  { header: 'Date',       width: 22,  align: 'center' },
  { header: 'Customer',   width: 40,  align: 'left' },
  { header: 'Shop',       width: 32,  align: 'left' },
  { header: 'Area',       width: 26,  align: 'center' },
  { header: 'Type',       width: 28,  align: 'center' },
  { header: 'Sent',       width: 16,  align: 'center' },
  { header: 'Curr Qty',   width: 20,  align: 'center' },
  { header: 'Balance',    width: 20,  align: 'center' },
  { header: 'Driver',     width: 22,  align: 'center' },
  { header: 'Vehicle No', width: 28,  align: 'center' },
];

const FONT_SIZE_BODY = 7.5;
const FONT_SIZE_HEADER = 7.5;
const ROW_HEIGHT = 7;
const HEADER_HEIGHT = 9;

// ─── Drawing helpers ──────────────────────────────────────────────────────────

function drawTableHeader(
  doc: jsPDF,
  x: number,
  y: number,
  tableWidth: number,
) {
  // Background
  doc.setFillColor(30, 64, 175);
  doc.rect(x, y, tableWidth, HEADER_HEIGHT, 'F');

  // Text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(FONT_SIZE_HEADER);
  doc.setTextColor(255, 255, 255);

  let cx = x;
  for (const col of COLUMNS) {
    const tx = col.align === 'center' ? cx + col.width / 2
      : col.align === 'right' ? cx + col.width - 2
      : cx + 2;
    doc.text(col.header, tx, y + HEADER_HEIGHT / 2 + 1.8, { align: col.align });
    cx += col.width;
  }

  // Border
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.15);
  doc.rect(x, y, tableWidth, HEADER_HEIGHT);
  // Vertical lines
  cx = x;
  for (let i = 0; i < COLUMNS.length; i++) {
    cx += COLUMNS[i].width;
    if (i < COLUMNS.length - 1) {
      doc.line(cx, y, cx, y + HEADER_HEIGHT);
    }
  }
}

function drawDataRow(
  doc: jsPDF,
  x: number,
  y: number,
  entry: BoxEntry,
  sl: number,
  isEven: boolean,
  tableWidth: number,
) {
  const isReturn = entry.entryType === 'return';

  // Background
  if (!isReturn && isEven) {
    doc.setFillColor(248, 250, 252);
    doc.rect(x, y, tableWidth, ROW_HEIGHT, 'F');
  } else if (isReturn) {
    doc.setFillColor(255, 245, 245);
    doc.rect(x, y, tableWidth, ROW_HEIGHT, 'F');
  }

  // Border
  doc.setDrawColor(210, 210, 210);
  doc.setLineWidth(0.1);
  doc.rect(x, y, tableWidth, ROW_HEIGHT);

  // Text colour
  if (isReturn) {
    doc.setTextColor(180, 40, 40);
  } else {
    doc.setTextColor(30, 30, 30);
  }

  // Cell data
  const values = [
    String(sl),
    entry.billNumber,
    formatDate(entry.entryDate),
    entry.customerName || '—',
    entry.shopName || '—',
    getEntryAreaName(entry),
    formatEntryType(entry.entryType),
    String(entry.totalBoxesSent),
    String(entry.currentQuantity),
    String(entry.balanceBoxes),
    entry.driverName || '—',
    entry.vehicleNumber || '—',
  ];

  doc.setFontSize(FONT_SIZE_BODY);

  let cx = x;
  for (let i = 0; i < COLUMNS.length; i++) {
    const col = COLUMNS[i];
    const tx = col.align === 'center' ? cx + col.width / 2
      : col.align === 'right' ? cx + col.width - 2
      : cx + 2;

    if (i === 9) {
      doc.setFont('helvetica', 'bold'); // Balance column bold
    } else {
      doc.setFont('helvetica', 'normal');
    }

    doc.text(values[i], tx, y + ROW_HEIGHT / 2 + 1.8, { align: col.align });

    // Vertical divider
    cx += col.width;
    if (i < COLUMNS.length - 1) {
      doc.line(cx, y, cx, y + ROW_HEIGHT);
    }
  }

  doc.setTextColor(0, 0, 0);
}

function drawFooterRow(
  doc: jsPDF,
  x: number,
  y: number,
  totalSent: number,
  totalCurrQty: number,
  totalBalance: number,
  tableWidth: number,
) {
  // Background
  doc.setFillColor(230, 235, 245);
  doc.rect(x, y, tableWidth, ROW_HEIGHT, 'F');

  // Border
  doc.setDrawColor(160, 170, 190);
  doc.setLineWidth(0.2);
  doc.rect(x, y, tableWidth, ROW_HEIGHT);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(FONT_SIZE_BODY);
  doc.setTextColor(30, 30, 30);

  const totalsText = ['', '', '', '', '', '', '',
    String(totalSent),
    String(totalCurrQty),
    String(totalBalance),
    '', ''];

  let cx = x;
  for (let i = 0; i < COLUMNS.length; i++) {
    const col = COLUMNS[i];
    if (i === 4) {
      doc.text('TOTALS', cx + col.width - 2, y + ROW_HEIGHT / 2 + 1.8, { align: 'right' });
    } else if (i >= 7 && i <= 9) {
      doc.text(totalsText[i], cx + col.width / 2, y + ROW_HEIGHT / 2 + 1.8, { align: 'center' });
    }
    cx += col.width;
    if (i < COLUMNS.length - 1) {
      doc.line(cx, y, cx, y + ROW_HEIGHT);
    }
  }

  doc.setTextColor(0, 0, 0);
}

// ─── Page footer (applied after all pages drawn) ──────────────────────────────

function applyPageFooters(
  doc: jsPDF,
  pageCount: number,
  margin: number,
  pageWidth: number,
  now: Date,
  companyName: string,
) {
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const pageH = doc.internal.pageSize.getHeight();

    // Solid border line
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
    doc.line(margin, pageH - 14, pageWidth - margin, pageH - 14);

    // Developer & time
    doc.setFontSize(7);
    doc.setTextColor(130, 130, 130);
    doc.setFont('helvetica', 'normal');
    doc.text(`Developed by: ${companyName}`, margin, pageH - 9);
    doc.text(
      `Time: ${now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`,
      pageWidth - margin, pageH - 9,
      { align: 'right' },
    );
    doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageH - 9, { align: 'center' });
    doc.setTextColor(0, 0, 0);
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Generates the Box Entries PDF document and returns it as a Blob.
 * No download is triggered — the caller decides how to present it.
 */
export function generateBoxEntriesAsPDF(
  entries: BoxEntry[],
  filterLabel?: string,
  companyName: string = 'FIT',
  companyAddress: string = '',
  companyPhone: string = '',
): { doc: jsPDF; blob: Blob; filename: string } {
  const settings = { companyName, companyAddress, companyPhone };

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;
  const tableWidth = COLUMNS.reduce((s, c) => s + c.width, 0);
  const tableX = margin + (pageWidth - margin * 2 - tableWidth) / 2;

  const now = new Date();
  let y = 14;

  // ── Company Header ──
  doc.setLineWidth(0.6);
  doc.rect(margin, y - 6, pageWidth - margin * 2, 22);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(settings.companyName, pageWidth / 2, y + 2, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(settings.companyAddress, pageWidth / 2, y + 8, { align: 'center' });
  doc.text(`Phone: ${settings.companyPhone}`, pageWidth / 2, y + 12, { align: 'center' });

  y += 22;

  // ── Report Title ──
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('BOX ENTRIES REPORT', pageWidth / 2, y + 4, { align: 'center' });

  const generatedStr = `Generated: ${now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} at ${now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(generatedStr, pageWidth / 2, y + 9, { align: 'center' });

  if (filterLabel) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Filter: ${filterLabel}`, margin, y + 9);
  }

  doc.text(`Total Entries: ${entries.length}`, pageWidth - margin, y + 9, { align: 'right' });

  y += 14;

  // ── Summary strip ──
  const totalSent = entries.reduce((s, e) => s + e.totalBoxesSent, 0);
  const totalBalance = entries.reduce((s, e) => s + e.balanceBoxes, 0);
  const totalCurrQty = entries.reduce((s, e) => s + e.currentQuantity, 0);
  const dispatchCount = entries.filter(e => e.entryType === 'dispatch').length;
  const returnCount = entries.filter(e => e.entryType === 'return').length;
  const openingCount = entries.filter(e => e.entryType === 'opening_balance').length;

  const stripH = 12;
  const cellW = (pageWidth - margin * 2 - 20) / 5;
  doc.setFillColor(240, 245, 255);
  doc.rect(margin, y, pageWidth - margin * 2, stripH, 'F');
  doc.setDrawColor(180, 195, 220);
  doc.rect(margin, y, pageWidth - margin * 2, stripH);

  doc.setFontSize(7.5);
  const summaries: { label: string; value: string | number; x: number }[] = [
    { label: 'Total Boxes Sent', value: totalSent, x: margin + cellW / 2 },
    { label: 'Total Balance', value: totalBalance, x: margin + cellW + cellW / 2 + 4 },
    { label: 'Dispatch', value: dispatchCount, x: margin + cellW * 2 + cellW / 2 + 8 },
    { label: 'Returns', value: returnCount, x: margin + cellW * 3 + cellW / 2 + 12 },
    { label: 'Opening Stock', value: openingCount, x: margin + cellW * 4 + cellW / 2 + 16 },
  ];

  summaries.forEach(s => {
    doc.setFont('helvetica', 'normal');
    doc.text(String(s.label), s.x, y + 5, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.text(String(s.value), s.x, y + 10, { align: 'center' });
  });

  y += stripH + 5;

  // ── Table Header ──
  const maxTableY = pageHeight - 20; // leave room for footer

  if (y + HEADER_HEIGHT > maxTableY) {
    doc.addPage();
    y = 14;
  }

  drawTableHeader(doc, tableX, y, tableWidth);
  y += HEADER_HEIGHT;

  // ── Table Rows ──
  for (let i = 0; i < entries.length; i++) {
    // Check if we need a new page
    if (y + ROW_HEIGHT > maxTableY) {
      doc.addPage();
      y = 14;
      drawTableHeader(doc, tableX, y, tableWidth);
      y += HEADER_HEIGHT;
    }

    drawDataRow(doc, tableX, y, entries[i], i + 1, i % 2 === 0, tableWidth);
    y += ROW_HEIGHT;
  }

  // ── Footer Row (totals) ──
  if (y + ROW_HEIGHT > maxTableY) {
    doc.addPage();
    y = 14;
    drawTableHeader(doc, tableX, y, tableWidth);
    y += HEADER_HEIGHT;
  }

  drawFooterRow(doc, tableX, y, totalSent, totalCurrQty, totalBalance, tableWidth);

  // ── Page footers on every page ──
  const pageCount = doc.getNumberOfPages();
  applyPageFooters(doc, pageCount, margin, pageWidth, now, settings.companyName);

  // ── Return the document and blob ──
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const filename = `BoxEntries_Report_${dateStr}.pdf`;
  const blob = doc.output('blob');

  console.log(`[PDF] Generated ${pageCount} page(s), ${blob.size} bytes for ${entries.length} entries`);

  return { doc, blob, filename };
}
