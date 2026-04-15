/**
 * FIT – Customer Receipt Generator
 *
 * Receipt layout follows the AS Bros / MC & SONS FISH COMPANY format:
 *  • Company name + address in a bordered header box (centred)
 *  • Customer Name, Bill No, Bill Date on the left (no ID field)
 *  • Full-width box table (no right logistics column):
 *      Previous Balance Box  — balances before today's dispatch
 *      Today's Fish Box      — currentQuantity sent today
 *      Total Box             — Today's Fish Box + Previous Balance Box
 *      Empty Box             — left blank
 *      Total Balance Box     — same as Total Box
 *  • Footer notes below table:
 *      NOTE : OWN INVENTORY-{n}
 *             WITHOUT BOX-{Source} {qty}   (one line per external source)
 *  • Contact line + "For <company>" right-aligned
 *  • Dashed footer: "Developed By" left, "Time" right
 *
 * ── WHATSAPP SHARING ──────────────────────────────────────────────────────────
 * Desktop → fitshare:// Windows automation
 * Mobile  → wa.me deep-link (opens WhatsApp app directly)
 */

import type { BoxEntry, Customer, AppSettings } from '../db/database';
import { SettingsDB } from '../db/database';
import { format } from 'date-fns';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WhatsAppPayload {
  phone: string;
  webUrl: string;
  waMe: string;
  messageText: string;
  pdfFilename: string;
}

// ─── Device detection ─────────────────────────────────────────────────────────

export function isMobileDevice(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function esc(s: string | null | undefined): string {
  if (!s) return '';
  return s
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function entryTypeLabel(type: string): string {
  const map: Record<string, string> = {
    dispatch: 'BOX DISPATCH', return: 'BOX RETURN',
    opening_balance: 'OPENING BALANCE', balance_forward: 'BALANCE FORWARD',
    external_source: 'EXTERNAL SOURCE',
  };
  return map[type] ?? type.replace(/_/g, ' ').toUpperCase();
}

/** Suggested PDF filename for a given entry */
export function receiptFilename(entry: BoxEntry): string {
  const safe = (entry.billNumber || entry.id).replace(/[^a-zA-Z0-9_-]/g, '_');
  return `Receipt_${safe}_${entry.entryDate.replace(/-/g, '')}.pdf`;
}

// ─── JSPDF RECEIPT — AS BROS FORMAT ──────────────────────────────────────────

export async function downloadReceiptAsPDF(entry: BoxEntry, customer: Customer): Promise<void> {
  const settings = await SettingsDB.get();

  const companyName    = settings.companyName    || 'MC & SONS FISH COMPANY';
  const companyAddress = settings.companyAddress || '';
  const companyPhone   = settings.companyPhone   || '';
  const traderName     = settings.traderName     || companyName;

  const billDate  = format(new Date(entry.entryDate), 'dd-MM-yyyy');
  const printedAt = format(new Date(), 'hh:mm:ss a');

  // ── Box calculations ──────────────────────────────────────────────────────
  // previousBalanceBox: boxes already with the customer before this dispatch
  const previousBalanceBox = entry.totalBoxesSent - entry.boxesReturned;
  const todayFishBox       = entry.currentQuantity;               // dispatched today
  const totalBox           = todayFishBox + previousBalanceBox;   // Today + Previous
  // emptyBox left blank on the receipt (shown as empty cell)
  const totalBalanceBox    = totalBox;                            // equals Total Box

  // ── External sources for footer notes ─────────────────────────────────────
  const externalSources: Array<{ name: string; qty: number }> = [];
  if (entry.openingStockSources && entry.openingStockSources.length > 0) {
    for (const src of entry.openingStockSources) {
      externalSources.push({ name: src.sourceName, qty: src.quantity });
    }
  } else if (entry.isExternalSource && entry.sourceName) {
    externalSources.push({ name: entry.sourceName, qty: entry.externalBoxCount ?? 0 });
  }
  const ownQty = entry.companyOwnQuantity ?? entry.currentQuantity;

  // ── jsPDF setup ───────────────────────────────────────────────────────────
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const PW  = 210;
  const ML  = 14;
  const MR  = 14;
  const CW  = PW - ML - MR;  // 182 mm
  let   y   = 10;

  // ─── HEADER — bordered company box ───────────────────────────────────────
  // Measure how many lines the address needs
  const addrLines = companyAddress
    ? doc.setFontSize(8.5).splitTextToSize(companyAddress, CW - 10) as string[]
    : [];
  const headerH = 14 + (addrLines.length > 0 ? addrLines.length * 5 + 2 : 0);

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(1.0);
  doc.rect(ML, y, CW, headerH);

  // Company name — large bold centred
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.setTextColor(0, 0, 0);
  doc.text(companyName, PW / 2, y + 9, { align: 'center' });

  // Address lines
  if (addrLines.length > 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    addrLines.forEach((line: string, i: number) => {
      doc.text(line, PW / 2, y + 14 + i * 5, { align: 'center' });
    });
  }

  y += headerH + 6;

  // ─── THIN DIVIDER ─────────────────────────────────────────────────────────
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.line(ML, y, PW - MR, y);
  y += 5;

  // ─── BILL INFO — Name | Bill No | Bill Date (left-aligned) ───────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(0, 0, 0);
  doc.text(`Name :  ${customer.customerName || '—'}`,  ML, y);
  doc.text(`Bill No  :  ${entry.billNumber || '—'}`,    ML, y + 6);
  doc.text(`Bill Date :  ${billDate}`,                  ML, y + 12);
  y += 20;

  // ─── MAIN TABLE — full width, no right logistics column ──────────────────
  const tableRows: [string, string][] = [
    ['Previous Balance Box', String(previousBalanceBox)],
    ["Today's Fish Box",     String(todayFishBox)],
    ['Total Box',            String(totalBox)],
    ['Empty Box',            ''],               // left blank
    ['Total Balance Box',    String(totalBalanceBox)],
  ];

  autoTable(doc, {
    startY: y,
    margin: { left: ML, right: MR },
    head: [],
    body: tableRows,
    theme: 'grid',
    styles: {
      fontSize: 10,
      cellPadding: { top: 3.5, bottom: 3.5, left: 5, right: 5 },
      textColor: [0, 0, 0],
      lineColor: [0, 0, 0],
      lineWidth: 0.35,
      font: 'helvetica',
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 120 },
      1: { halign: 'center', fontStyle: 'bold', cellWidth: CW - 120 },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.row.index === 4) {
        data.cell.styles.fontSize = 10.5;
      }
    },
  });

  y = (doc as any).lastAutoTable.finalY + 5;

  // ─── NOTES — below the table ──────────────────────────────────────────────
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(0, 0, 0);

  doc.text(`NOTE :  OWN INVENTORY-${ownQty}`, ML, y);
  y += 5;

  for (const src of externalSources) {
    doc.text(`           WITHOUT BOX-${src.name.toUpperCase()} ${src.qty}`, ML, y);
    y += 5;
  }

  y += 4;

  // ─── CONTACT + "FOR" LINE ─────────────────────────────────────────────────
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);

  const contactText = companyPhone
    ? `Box Maintainer's Contact No : ${companyPhone}`
    : `Box Maintainer's Contact No`;

  // Underline the contact line (as in the reference)
  const contactW = doc.getTextWidth(contactText);
  doc.text(contactText, ML, y);
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.line(ML, y + 1, ML + contactW, y + 1);

  doc.setFont('helvetica', 'bold');
  doc.text(`For ${traderName}`, PW - MR, y, { align: 'right' });

  // ─── FOOTER — dashed line + "Developed By" / "Time" ──────────────────────
  const pageH   = 297;
  const footerY = pageH - 12;

  doc.setLineDashPattern([2, 2], 0);
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.line(ML, footerY, PW - MR, footerY);
  doc.setLineDashPattern([], 0);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(60, 60, 60);
  doc.text(`Developed By : ${companyName}`, ML, footerY + 5);
  doc.text(`Time : ${printedAt}`, PW - MR, footerY + 5, { align: 'right' });

  // ─── Download ─────────────────────────────────────────────────────────────
  try {
    const blob = doc.output('blob');
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = receiptFilename(entry);
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
  } catch (err) {
    console.error('PDF Download failed:', err);
  }
}

// ─── IFRAME PRINT FALLBACK (kept for backward compatibility) ──────────────────

export async function downloadCustomerReceipt(entry: BoxEntry, customer: Customer): Promise<void> {
  return downloadReceiptAsPDF(entry, customer);
}

// ─── WHATSAPP PAYLOAD BUILDER ─────────────────────────────────────────────────

export function buildWhatsAppPayload(entry: BoxEntry, customer: Customer): WhatsAppPayload {
  const billDate           = format(new Date(entry.entryDate), 'dd-MM-yyyy');
  const previousBalanceBox = entry.totalBoxesSent - entry.boxesReturned;
  const todayFishBox       = entry.currentQuantity;
  const totalBox           = todayFishBox + previousBalanceBox;
  const totalBalanceBox    = totalBox;
  const ownQty             = entry.companyOwnQuantity ?? entry.currentQuantity;

  const externalSources: Array<{ name: string; qty: number }> = [];
  if (entry.openingStockSources && entry.openingStockSources.length > 0) {
    for (const src of entry.openingStockSources) externalSources.push({ name: src.sourceName, qty: src.quantity });
  } else if (entry.isExternalSource && entry.sourceName) {
    externalSources.push({ name: entry.sourceName, qty: entry.externalBoxCount ?? 0 });
  }

  const noteLines = [`OWN INVENTORY-${ownQty}`, ...externalSources.map(s => `WITHOUT BOX-${s.name.toUpperCase()} ${s.qty}`)];

  const lines = [
    `🐟 *FIT – Fish Inventory Tracking*`, ``,
    `🧾 *Bill No:* ${entry.billNumber}   📅 *Date:* ${billDate}`,
    `👤 *Name:* ${customer.customerName}`,
    `🏪 *Shop:* ${customer.shopName || '—'}`, ``,
    `━━━━━━━━━━━━━━━━━━━━━━━`,
    `📦 Previous Balance Box  :  *${previousBalanceBox}*`,
    `📤 Today's Fish Box       :  *${todayFishBox}*`,
    `📊 Total Box              :  *${totalBox}*`,
    `⚖️  Total Balance Box     :  *${totalBalanceBox}*`,
    `━━━━━━━━━━━━━━━━━━━━━━━`, ``,
    `NOTE :  ${noteLines.join('\n           ')}`, ``,
    totalBalanceBox === 0
      ? `✅ All boxes returned. Thank you!`
      : `⚠️ *${totalBalanceBox} box${totalBalanceBox !== 1 ? 'es' : ''} pending return.*`,
    ``, `_Thank you for your business!_`,
  ];

  const messageText = lines.join('\n');
  const rawPhone    = (customer.mobile || '').replace(/\D/g, '');
  const e164Digits  = rawPhone.length >= 11 ? rawPhone : rawPhone ? `91${rawPhone}` : '';
  const phonePlus   = e164Digits ? `+${e164Digits}` : '';
  const encoded     = encodeURIComponent(messageText);

  const waMe   = e164Digits ? `https://wa.me/${e164Digits}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
  const webUrl = e164Digits ? `https://web.whatsapp.com/send?phone=${e164Digits}&text=${encoded}` : `https://web.whatsapp.com/send?text=${encoded}`;

  return { phone: phonePlus, webUrl, waMe, messageText, pdfFilename: receiptFilename(entry) };
}

// ─── SHARING FUNCTIONS (all kept for backward compatibility) ──────────────────

export function openWhatsAppWeb(payload: WhatsAppPayload): void {
  window.open(payload.waMe, '_blank');
}

export function triggerWhatsAppAutomation(payload: WhatsAppPayload, entry: BoxEntry, customer: Customer): void {
  downloadReceiptAsPDF(entry, customer);
  const url = payload.webUrl;
  setTimeout(() => { window.location.href = url; }, 800);
}

export async function shareMobile(entry: BoxEntry, customer: Customer): Promise<void> {
  await downloadReceiptAsPDF(entry, customer);
  const payload = buildWhatsAppPayload(entry, customer);
  setTimeout(() => { window.location.href = payload.waMe; }, 600);
}

export async function shareReceiptViaWhatsApp(entry: BoxEntry, customer: Customer): Promise<void> {
  if (isMobileDevice()) {
    await shareMobile(entry, customer);
  } else {
    const payload = buildWhatsAppPayload(entry, customer);
    triggerWhatsAppAutomation(payload, entry, customer);
  }
}
