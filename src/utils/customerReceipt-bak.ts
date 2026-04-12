/**
 * FIT – Customer Receipt Generator
 *
 * ── PDF GENERATION ────────────────────────────────────────────────────────────
 * Uses a hidden <iframe> injected into the CURRENT page so it is NEVER blocked
 * by popup-blockers.  The iframe's contentWindow.print() fires the browser's
 * native Print dialog where the user selects "Save as PDF".
 *
 * ── WHATSAPP SHARING ──────────────────────────────────────────────────────────
 * Mirrors PyWhatKit exactly:
 *   Python:  web.open(f"https://web.whatsapp.com/send?phone={phone}&text={msg}")
 *   JS:      window.open(`https://web.whatsapp.com/send?phone=${phone}&text=${msg}`)
 *
 * WhatsApp's URL scheme does NOT support attaching local files automatically.
 * The correct workflow (same as PyWhatKit) is:
 *   1. Save the receipt PDF to local disk (print → Save as PDF)
 *   2. Open WhatsApp Web pre-filled with the phone number & a pre-written message
 *   3. User clicks the paperclip icon in WhatsApp Web and attaches the saved PDF
 *
 * The WhatsAppSendModal in this app guides the user through these 3 steps.
 */

import type { BoxEntry, Customer, AppSettings } from '../db/database';
import { SettingsDB } from '../db/database';
import { format } from 'date-fns';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WhatsAppPayload {
  /** Phone number cleaned to digits only (no spaces / dashes / +) */
  phone: string;
  /** Pre-encoded WhatsApp Web URL (web.whatsapp.com/send?phone=…&text=…) */
  webUrl: string;
  /** Human-readable message text (for display in the guided modal) */
  messageText: string;
  /** Suggested filename for the PDF so the user knows what to look for */
  pdfFilename: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function esc(s: string | null | undefined): string {
  if (!s) return '';
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function entryTypeLabel(type: string): string {
  const map: Record<string, string> = {
    dispatch:        'BOX DISPATCH',
    return:          'BOX RETURN',
    opening_balance: 'OPENING BALANCE',
    balance_forward: 'BALANCE FORWARD',
    external_source: 'EXTERNAL SOURCE',
  };
  return map[type] ?? type.replace(/_/g, ' ').toUpperCase();
}

function entryTypeBg(type: string): string {
  switch (type) {
    case 'dispatch':        return '#004d99';
    case 'return':          return '#14803c';
    case 'opening_balance': return '#92600a';
    case 'balance_forward': return '#6b21a8';
    case 'external_source': return '#b91c1c';
    default:                return '#374151';
  }
}

/** Suggested PDF filename for a given entry */
export function receiptFilename(entry: BoxEntry): string {
  const safe = (entry.billNumber || entry.id).replace(/[^a-zA-Z0-9_-]/g, '_');
  const dateStr = entry.entryDate.replace(/-/g, '');
  return `Receipt_${safe}_${dateStr}.pdf`;
}

// ─── HTML Builder ─────────────────────────────────────────────────────────────

function buildReceiptHTML(
  entry: BoxEntry,
  customer: Customer,
  settings: AppSettings
): string {
  const metaDate    = format(new Date(entry.entryDate), 'dd MMM yyyy');
  const printedAt   = format(new Date(), 'dd MMM yyyy  HH:mm');
  const extBoxes    = entry.isExternalSource ? (entry.externalBoxCount ?? 0) : 0;
  const totalBoxes  = entry.totalBoxesSent + entry.currentQuantity + extBoxes;
  const balance     = totalBoxes - entry.boxesReturned;
  const allReturned = balance === 0;
  const typeBg      = entryTypeBg(entry.entryType);
  const typeLabel   = entryTypeLabel(entry.entryType);

  const companyName    = esc(settings.companyName    || 'FIT – Fish Inventory Tracking');
  const companyAddress = esc(settings.companyAddress || '');
  const companyPhone   = esc(settings.companyPhone   || '');
  const companyEmail   = esc(settings.companyEmail   || '');
  const gstNumber      = esc(settings.gstNumber      || '');

  const subParts: string[] = [];
  if (companyAddress) subParts.push(companyAddress);
  if (companyPhone)   subParts.push(`Ph: ${companyPhone}`);
  if (gstNumber)      subParts.push(`GST: ${gstNumber}`);
  const subLine = subParts.join('&nbsp;&nbsp;|&nbsp;&nbsp;');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Customer Receipt – ${esc(entry.billNumber)}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 12px;
      color: #1e1e28;
      background: #fff;
      padding: 0;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .page-wrapper { background: #fff; padding: 0; }

    .page {
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      padding: 0;
      background: #fff;
    }

    /* ── HEADER ── */
    .header {
      background: #004d99;
      color: #fff;
      text-align: center;
      padding: 14px 16px 10px;
    }
    .header h1 { font-size: 20px; font-weight: 700; letter-spacing: 0.5px; margin-bottom: 4px; }
    .header .sub   { font-size: 9px; opacity: 0.88; margin-bottom: 2px; }
    .header .email { font-size: 9px; opacity: 0.75; }

    /* ── TYPE BANNER ── */
    .type-banner {
      background: ${typeBg};
      color: #fff;
      text-align: center;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 1px;
      padding: 7px 0;
    }

    /* ── META ROW ── */
    .meta-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #e0edff;
      padding: 6px 14px;
      font-size: 9px;
      font-weight: 700;
      color: #003777;
    }

    /* ── BODY ── */
    .body { padding: 10px 14px; }

    /* ── SECTION HEADER ── */
    .section-hdr {
      background: #003773;
      color: #fff;
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 0.5px;
      padding: 5px 10px;
      border-radius: 4px 4px 0 0;
      margin-top: 10px;
    }

    /* ── CARD ── */
    .card {
      border: 1px solid #b4c8e6;
      border-top: none;
      border-radius: 0 0 4px 4px;
      padding: 10px 12px;
      background: #fcfeff;
    }

    /* ── GRID ── */
    .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 16px; }

    .field-label { font-size: 8px; color: #6b7280; margin-bottom: 1px; }
    .field-value { font-size: 11px; font-weight: 600; color: #111827; }

    /* ── TABLE ── */
    table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 0; }
    thead tr { background: #003773; color: #fff; }
    thead th {
      padding: 7px 10px;
      text-align: left;
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 0.3px;
    }
    thead th.right { text-align: right; }
    tbody tr:nth-child(even) { background: #f0f6ff; }
    tbody tr:nth-child(odd)  { background: #fff; }
    tbody td { padding: 6px 10px; border-bottom: 1px solid #dde8f5; }
    tbody td.right { text-align: right; font-weight: 600; }
    tbody td.label { font-size: 10px; color: #374151; }

    .row-total           { background: #dbeafe !important; font-weight: 700; color: #1e40af; }
    .row-return          { background: #dcfce7 !important; font-weight: 700; color: #14532d; }
    .row-balance-pending { background: #fef3c7 !important; font-weight: 700; color: #92400e; }
    .row-balance-clear   { background: #dcfce7 !important; font-weight: 700; color: #14532d; }

    /* ── STATUS BANNER ── */
    .status-banner {
      text-align: center;
      padding: 8px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 700;
      margin-top: 10px;
    }
    .status-ok      { background: #dcfce7; color: #14532d; border: 1px solid #86efac; }
    .status-pending { background: #fef3c7; color: #92400e; border: 1px solid #fcd34d; }

    /* ── NOTES ── */
    .notes-box {
      background: #fffbeb;
      border: 1px solid #fcd34d;
      border-radius: 4px;
      padding: 8px 12px;
      font-size: 10px;
      color: #374151;
      margin-top: 10px;
    }
    .notes-label { font-size: 8px; font-weight: 700; color: #92400e; margin-bottom: 3px; }

    /* ── SIGNATURE ROW ── */
    .sig-row {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 16px;
      margin-top: 18px;
      padding: 0 4px;
    }
    .sig-box {
      text-align: center;
      border-top: 1.5px solid #374151;
      padding-top: 4px;
      font-size: 9px;
      color: #374151;
    }

    /* ── FOOTER ── */
    .footer {
      background: #003773;
      color: #c7d8f5;
      font-size: 8px;
      text-align: center;
      padding: 6px;
      margin-top: 14px;
    }

    /* ── PRINT STYLES ── */
    @media print {
      @page { size: A4; margin: 0; }
      body  { margin: 0; padding: 0; }
      .page { width: 100%; min-height: 100vh; }
      .no-print { display: none !important; }
    }

    /* ── SCREEN ONLY (print button bar) ── */
    .print-btn-bar {
      text-align: center;
      padding: 14px 16px;
      background: #f0f6ff;
      border-bottom: 1px solid #dde8f5;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
      flex-wrap: wrap;
    }
    .print-btn {
      display: inline-block;
      background: #004d99;
      color: #fff;
      border: none;
      padding: 10px 28px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      letter-spacing: 0.5px;
    }
    .print-btn:hover { background: #003777; }
    .print-hint { font-size: 11px; color: #555; }
    @media print { .print-btn-bar { display: none !important; } }
  </style>
</head>
<body>

  <!-- Print button bar — visible on screen, hidden when printing -->
  <div class="print-btn-bar no-print">
    <button class="print-btn" onclick="window.print()">
      🖨️ &nbsp; Print / Save as PDF
    </button>
    <span class="print-hint">
      In the print dialog → set <strong>Destination</strong> to <strong>"Save as PDF"</strong> → click <strong>Save</strong>
    </span>
  </div>

  <div class="page-wrapper">
  <div class="page">

    <!-- HEADER -->
    <div class="header">
      <h1>${companyName}</h1>
      ${subLine  ? `<div class="sub">${subLine}</div>`     : ''}
      ${companyEmail ? `<div class="email">${companyEmail}</div>` : ''}
    </div>

    <!-- TYPE BANNER -->
    <div class="type-banner">${typeLabel}</div>

    <!-- META ROW -->
    <div class="meta-row">
      <span>Bill No: ${esc(entry.billNumber)}</span>
      <span>Date: ${metaDate}</span>
      <span>Printed: ${esc(printedAt)}</span>
    </div>

    <div class="body">

      <!-- CUSTOMER DETAILS -->
      <div class="section-hdr">CUSTOMER DETAILS</div>
      <div class="card">
        <div class="grid2">
          <div>
            <div class="field-label">Customer Name</div>
            <div class="field-value">${esc(customer.customerName)}</div>
          </div>
          <div>
            <div class="field-label">Shop / Business Name</div>
            <div class="field-value">${esc(customer.shopName) || '—'}</div>
          </div>
          <div>
            <div class="field-label">Mobile</div>
            <div class="field-value">${esc(customer.mobile) || '—'}</div>
          </div>
          <div>
            <div class="field-label">Address</div>
            <div class="field-value">${esc(customer.address) || '—'}</div>
          </div>
        </div>
      </div>

      <!-- BOX MOVEMENT SUMMARY -->
      <div class="section-hdr">BOX MOVEMENT SUMMARY</div>
      <div class="card" style="padding:0;">
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th class="right">Boxes</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="label">📦 Boxes Already Sent (Before This Entry)</td>
              <td class="right">${entry.totalBoxesSent}</td>
            </tr>
            <tr>
              <td class="label">➕ Current Quantity Sent — Own Inventory (This Entry)</td>
              <td class="right">${entry.currentQuantity}</td>
            </tr>
            ${entry.isExternalSource ? `
            <tr>
              <td class="label">🔗 External Source — ${esc(entry.sourceName || '—')}</td>
              <td class="right">${entry.externalBoxCount ?? 0}</td>
            </tr>` : ''}
            <tr class="row-total">
              <td class="label"><strong>📊 TOTAL BOXES</strong>
                <span style="font-size:8px;font-weight:400;color:#3b5bb5;">
                  &nbsp;(Already Sent + Own + External)
                </span>
              </td>
              <td class="right"><strong>${totalBoxes}</strong></td>
            </tr>
            <tr class="row-return">
              <td class="label">↩️ Boxes Returned by Customer</td>
              <td class="right">${entry.boxesReturned}</td>
            </tr>
            <tr class="${allReturned ? 'row-balance-clear' : 'row-balance-pending'}">
              <td class="label"><strong>⚖️ Balance Boxes Pending Return</strong></td>
              <td class="right"><strong>${balance}</strong></td>
            </tr>
          </tbody>
        </table>
      </div>

      ${entry.isExternalSource && entry.sourceName ? `
      <!-- EXTERNAL SOURCE -->
      <div class="section-hdr">EXTERNAL SOURCE DETAILS</div>
      <div class="card">
        <div class="grid2">
          <div>
            <div class="field-label">Source Name</div>
            <div class="field-value">${esc(entry.sourceName)}</div>
          </div>
          <div>
            <div class="field-label">External Box Count</div>
            <div class="field-value">${entry.externalBoxCount ?? 0}</div>
          </div>
        </div>
      </div>
      ` : ''}

      ${entry.driverName || entry.vehicleNumber ? `
      <!-- LOGISTICS -->
      <div class="section-hdr">LOGISTICS</div>
      <div class="card">
        <div class="grid2">
          ${entry.driverName    ? `<div><div class="field-label">Driver Name</div><div class="field-value">${esc(entry.driverName)}</div></div>` : ''}
          ${entry.vehicleNumber ? `<div><div class="field-label">Vehicle Number</div><div class="field-value">${esc(entry.vehicleNumber)}</div></div>` : ''}
        </div>
      </div>
      ` : ''}

      ${entry.description ? `
      <!-- NOTES -->
      <div class="notes-box">
        <div class="notes-label">📝 NOTES / DESCRIPTION</div>
        <div>${esc(entry.description)}</div>
      </div>
      ` : ''}

      <!-- STATUS BANNER -->
      <div class="status-banner ${allReturned ? 'status-ok' : 'status-pending'}">
        ${allReturned
          ? '&#10003; All boxes have been returned. Thank you!'
          : `Total ${balance} box${balance !== 1 ? 'es' : ''} pending return`}
      </div>

      <!-- SIGNATURE -->
      <div class="sig-row">
        <div class="sig-box">Receiver's Signature</div>
        <div class="sig-box">Driver's Signature</div>
        <div class="sig-box">Authorised By</div>
      </div>

    </div><!-- /body -->

    <!-- FOOTER -->
    <div class="footer">
      ${companyName} &nbsp;|&nbsp; Receipt No: ${esc(entry.billNumber)} &nbsp;|&nbsp; Generated: ${esc(printedAt)}
    </div>

  </div><!-- /page -->
  </div><!-- /page-wrapper -->

</body>
</html>`;
}

// ─── IFRAME PRINT ENGINE ──────────────────────────────────────────────────────

/**
 * Generates a Customer Receipt and opens the browser's native Print dialog
 * via a hidden <iframe> injected into the current document.
 *
 * WHY IFRAME (not window.open / blob URL / FileSaver):
 *  • window.open()    → blocked by popup blockers in most contexts
 *  • Blob / FileSaver → blocked when app is served from file:// or data: origin
 *                       (vite-plugin-singlefile produces a single index.html)
 *  • Hidden iframe    → same-document, never blocked, works everywhere
 *
 * The user selects "Save as PDF" in the browser's native print dialog.
 */
export async function downloadCustomerReceipt(entry: BoxEntry, customer: Customer): Promise<void> {
  const settings = await SettingsDB.get();
  const html     = buildReceiptHTML(entry, customer, settings);

  // Remove any leftover iframe from a previous call
  const OLD_ID   = 'fit-receipt-iframe';
  const existing = document.getElementById(OLD_ID);
  if (existing) existing.remove();

  // Create an invisible iframe
  const iframe = document.createElement('iframe');
  iframe.id    = OLD_ID;
  iframe.style.cssText = [
    'position:fixed',
    'top:0',
    'left:0',
    'width:1px',
    'height:1px',
    'border:none',
    'opacity:0',
    'pointer-events:none',
    'z-index:-9999',
  ].join(';');

  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument ?? iframe.contentWindow?.document;

  if (!iframeDoc) {
    // Absolute last resort — navigate current window to data URI
    window.location.href =
      'data:text/html;charset=utf-8,' + encodeURIComponent(html);
    return;
  }

  iframeDoc.open();
  iframeDoc.write(html);
  iframeDoc.close();

  const doPrint = () => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch {
      // Iframe print blocked → fallback: open a new window with the receipt
      // (last resort only — this CAN be blocked by aggressive popup blockers)
      const win = window.open('', '_blank');
      if (win) {
        win.document.write(html);
        win.document.close();
        win.focus();
        setTimeout(() => win.print(), 500);
      }
    } finally {
      // Keep the iframe alive while user interacts with the print dialog,
      // then clean it up
      setTimeout(() => {
        try { iframe.remove(); } catch { /* ignore */ }
      }, 90_000); // 90 seconds
    }
  };

  // Give the iframe time to render before printing
  if (iframe.contentDocument?.readyState === 'complete') {
    setTimeout(doPrint, 400);
  } else {
    iframe.onload = () => setTimeout(doPrint, 400);
    setTimeout(doPrint, 900); // safety fallback
  }
}

// ─── JSPDF DIRECT DOWNLOAD ────────────────────────────────────────────────────

/**
 * Generates a Customer Receipt as a real PDF file and downloads it directly
 * to the user's device — NO print dialog, NO popup window.
 *
 * HOW IT WORKS (the only approach that is never blocked):
 *  1. Build the full receipt layout using jsPDF drawing primitives
 *  2. Call doc.output('datauristring') → returns a base64 data URI SYNCHRONOUSLY
 *  3. Create a hidden <a download> element, set its href to the data URI,
 *     call .click() — all SYNCHRONOUSLY inside the same user-gesture tick
 *
 * WHY NOT blob / FileSaver / window.open:
 *  • URL.createObjectURL(blob) → blocked on file:// and data: origins
 *  • FileSaver.saveAs()        → uses createObjectURL internally → same block
 *  • window.open()             → blocked by popup blockers in single-file context
 *  • doc.save()                → uses FileSaver internally → same block
 *
 * This approach never leaves the current document and is never blocked.
 */
export async function downloadReceiptAsPDF(entry: BoxEntry, customer: Customer): Promise<void> {
  const settings     = await SettingsDB.get();
  const metaDate     = format(new Date(entry.entryDate), 'dd MMM yyyy');
  const printedAt    = format(new Date(), 'dd MMM yyyy HH:mm');
  const extBoxes     = entry.isExternalSource ? (entry.externalBoxCount ?? 0) : 0;
  const totalBoxes   = entry.totalBoxesSent + entry.currentQuantity + extBoxes;
  const balance      = totalBoxes - entry.boxesReturned;
  const allReturned  = balance === 0;

  const companyName    = settings.companyName    || 'FIT – Fish Inventory Tracking';
  const companyAddress = settings.companyAddress || '';
  const companyPhone   = settings.companyPhone   || '';
  const companyEmail   = settings.companyEmail   || '';
  const gstNumber      = settings.gstNumber      || '';

  const typeLabel = entryTypeLabel(entry.entryType);
  const typeBgHex = entryTypeBg(entry.entryType);

  // ── Helpers ────────────────────────────────────────────────────────────────
  // Convert hex colour to [r, g, b]
  const hexToRgb = (hex: string): [number, number, number] => {
    const h = hex.replace('#', '');
    return [
      parseInt(h.substring(0, 2), 16),
      parseInt(h.substring(2, 4), 16),
      parseInt(h.substring(4, 6), 16),
    ];
  };

  const doc  = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const PW   = 210; // page width mm
  const ML   = 14;  // margin left
  const MR   = 14;  // margin right
  const CW   = PW - ML - MR; // content width
  let   y    = 0;

  // ── Company Header Band ────────────────────────────────────────────────────
  doc.setFillColor(0, 77, 153);
  doc.rect(0, 0, PW, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(companyName, PW / 2, 10, { align: 'center' });

  const subParts: string[] = [];
  if (companyAddress) subParts.push(companyAddress);
  if (companyPhone)   subParts.push(`Ph: ${companyPhone}`);
  if (gstNumber)      subParts.push(`GST: ${gstNumber}`);
  if (subParts.length) {
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(subParts.join('   |   '), PW / 2, 17, { align: 'center' });
  }
  if (companyEmail) {
    doc.setFontSize(7);
    doc.text(companyEmail, PW / 2, 22, { align: 'center' });
  }
  y = 28;

  // ── Entry Type Banner ──────────────────────────────────────────────────────
  const [tbR, tbG, tbB] = hexToRgb(typeBgHex);
  doc.setFillColor(tbR, tbG, tbB);
  doc.rect(0, y, PW, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(typeLabel, PW / 2, y + 6.5, { align: 'center' });
  y += 10;

  // ── Meta Row ──────────────────────────────────────────────────────────────
  doc.setFillColor(224, 237, 255);
  doc.rect(0, y, PW, 9, 'F');
  doc.setTextColor(0, 55, 119);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text(`Bill No: ${entry.billNumber || '—'}`, ML, y + 6);
  doc.text(`Date: ${metaDate}`, PW / 2, y + 6, { align: 'center' });
  doc.text(`Printed: ${printedAt}`, PW - MR, y + 6, { align: 'right' });
  y += 9;

  // ── Section Header helper ──────────────────────────────────────────────────
  const sectionHdr = (title: string) => {
    doc.setFillColor(0, 55, 115);
    doc.roundedRect(ML, y + 3, CW, 8, 1, 1, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.text(title, ML + 4, y + 8.5);
    y += 11;
  };

  // ── Customer Details ───────────────────────────────────────────────────────
  sectionHdr('CUSTOMER DETAILS');
  autoTable(doc, {
    startY: y,
    margin: { left: ML, right: MR },
    theme: 'plain',
    styles: { fontSize: 9, cellPadding: 2.5, textColor: [17, 24, 39] },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 40, textColor: [107, 114, 128], fontSize: 7.5 },
      1: { cellWidth: CW / 2 - 20 },
      2: { fontStyle: 'bold', cellWidth: 40, textColor: [107, 114, 128], fontSize: 7.5 },
      3: { cellWidth: CW / 2 - 20 },
    },
    body: [
      ['Customer Name', customer.customerName || '—',
       'Shop / Business', customer.shopName || '—'],
      ['Mobile', customer.mobile || '—',
       'Address', customer.address || '—'],
    ],
    didDrawPage: () => {},
  });
  y = (doc as any).lastAutoTable.finalY + 3;

  // ── Box Movement Summary ───────────────────────────────────────────────────
  sectionHdr('BOX MOVEMENT SUMMARY');
  autoTable(doc, {
    startY: y,
    margin: { left: ML, right: MR },
    head: [['Description', 'Boxes']],
    body: [
      ['Boxes Already Sent (Before This Entry)', String(entry.totalBoxesSent)],
      ['Current Qty Sent — Own Inventory (This Entry)', String(entry.currentQuantity)],
      ...(entry.isExternalSource
        ? [['External Source — ' + entry.sourceName, String(entry.externalBoxCount ?? 0)]]
        : []),
      ['TOTAL BOXES  (Already Sent + Own + External)', String(totalBoxes)],
      ['Boxes Returned by Customer', String(entry.boxesReturned)],
      ['Balance Boxes Pending Return', String(balance)],
    ],
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: {
      fillColor: [0, 55, 115], textColor: [255, 255, 255],
      fontStyle: 'bold', fontSize: 8,
    },
    columnStyles: {
      0: { cellWidth: CW - 25 },
      1: { cellWidth: 25, halign: 'right', fontStyle: 'bold' },
    },
    didParseCell: (data) => {
      if (data.section === 'body') {
        const hasExt = entry.isExternalSource;
        const r = data.row.index;
        const totalIdx    = hasExt ? 3 : 2;
        const returnedIdx = hasExt ? 4 : 3;
        const balanceIdx  = hasExt ? 5 : 4;
        if (r === totalIdx) { // TOTAL row — blue
          data.cell.styles.fillColor  = [219, 234, 254];
          data.cell.styles.textColor  = [30,  64,  175];
          data.cell.styles.fontStyle  = 'bold';
        } else if (r === returnedIdx) { // Returned — green
          data.cell.styles.fillColor = [220, 252, 231];
          data.cell.styles.textColor = [20,  83,  45];
          data.cell.styles.fontStyle = 'bold';
        } else if (r === balanceIdx) { // Balance
          data.cell.styles.fillColor = allReturned ? [220, 252, 231] : [254, 243, 199];
          data.cell.styles.textColor = allReturned ? [20, 83, 45]    : [146, 64,  14];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
  });
  y = (doc as any).lastAutoTable.finalY + 3;

  // ── External Source (if applicable) ───────────────────────────────────────
  if (entry.isExternalSource && entry.sourceName) {
    sectionHdr('EXTERNAL SOURCE DETAILS');
    autoTable(doc, {
      startY: y,
      margin: { left: ML, right: MR },
      theme: 'plain',
      styles: { fontSize: 9, cellPadding: 2.5 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 50, textColor: [107, 114, 128], fontSize: 7.5 },
      },
      body: [
        ['Source Name', entry.sourceName || '—',
         'External Box Count', String(entry.externalBoxCount ?? 0)],
      ],
    });
    y = (doc as any).lastAutoTable.finalY + 3;
  }

  // ── Logistics (if applicable) ──────────────────────────────────────────────
  if (entry.driverName || entry.vehicleNumber) {
    sectionHdr('LOGISTICS');
    autoTable(doc, {
      startY: y,
      margin: { left: ML, right: MR },
      theme: 'plain',
      styles: { fontSize: 9, cellPadding: 2.5 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 50, textColor: [107, 114, 128], fontSize: 7.5 },
      },
      body: [
        ['Driver Name', entry.driverName || '—',
         'Vehicle Number', entry.vehicleNumber || '—'],
      ],
    });
    y = (doc as any).lastAutoTable.finalY + 3;
  }

  // ── Notes / Description ────────────────────────────────────────────────────
  if (entry.description) {
    doc.setFillColor(255, 251, 235);
    doc.setDrawColor(252, 211, 77);
    doc.roundedRect(ML, y + 2, CW, 14, 2, 2, 'FD');
    doc.setTextColor(146, 64, 14);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('NOTES / DESCRIPTION', ML + 4, y + 7);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(55, 65, 81);
    doc.text(entry.description, ML + 4, y + 12, { maxWidth: CW - 8 });
    y += 18;
  }

  // ── Status Banner ──────────────────────────────────────────────────────────
  y += 3;
  if (allReturned) {
    doc.setFillColor(220, 252, 231);
    doc.setDrawColor(134, 239, 172);
  } else {
    doc.setFillColor(254, 243, 199);
    doc.setDrawColor(252, 211, 77);
  }
  doc.roundedRect(ML, y, CW, 10, 2, 2, 'FD');
  doc.setTextColor(allReturned ? 20 : 146, allReturned ? 83 : 64, allReturned ? 45 : 14);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  const statusText = allReturned
    ? 'All boxes have been returned. Thank you!'
    : `Total ${balance} box${balance !== 1 ? 'es' : ''} pending return`;
  doc.text(statusText, PW / 2, y + 6.5, { align: 'center' });
  y += 14;

  // ── Signature Row ──────────────────────────────────────────────────────────
  y += 10;
  const sigW  = (CW - 16) / 3;
  const sigs  = ['Receiver\'s Signature', 'Driver\'s Signature', 'Authorised By'];
  sigs.forEach((label, i) => {
    const sx = ML + i * (sigW + 8);
    doc.setDrawColor(55, 65, 81);
    doc.setLineWidth(0.4);
    doc.line(sx, y, sx + sigW, y);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(55, 65, 81);
    doc.text(label, sx + sigW / 2, y + 5, { align: 'center' });
  });
  y += 12;

  // ── Footer Band ────────────────────────────────────────────────────────────
  const pageH = 297;
  doc.setFillColor(0, 55, 115);
  doc.rect(0, pageH - 10, PW, 10, 'F');
  doc.setTextColor(199, 216, 245);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `${companyName}  |  Receipt No: ${entry.billNumber || '—'}  |  Generated: ${printedAt}`,
    PW / 2,
    pageH - 4,
    { align: 'center' },
  );

  // ── Download — SYNCHRONOUS data URI approach ───────────────────────────────
  // doc.output('datauristring') returns a base64 PDF data URI SYNCHRONOUSLY.
  // Setting it as an <a href download> and clicking in the same call-stack
  // tick preserves the user gesture — browsers NEVER block this.
  // --- Download (Robust Blob Method) ---
  try {
    const filename = receiptFilename(entry);
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  } catch (err) {
    console.error('PDF Download failed:', err);
  }
}

// ─── WHATSAPP SHARE PAYLOAD BUILDER ──────────────────────────────────────────

/**
 * Builds a WhatsAppPayload that mirrors what PyWhatKit does:
 *
 *   Python: web.open(f"https://web.whatsapp.com/send?phone={phone}&text={msg}")
 *   JS:     window.open(`https://web.whatsapp.com/send?phone=${phone}&text=${msg}`)
 *
 * Returns the payload WITHOUT opening any window — the caller (WhatsAppSendModal)
 * decides when to open it so the user follows the guided 3-step flow first.
 *
 * IMPORTANT – WhatsApp URL scheme limitation:
 *   Neither wa.me nor web.whatsapp.com/send supports attaching local files via URL.
 *   The PDF must be saved locally first, then attached manually in WhatsApp Web
 *   using the paperclip / attachment icon.  This is the same limitation that
 *   PyWhatKit has — it also cannot attach local files automatically.
 */
export function buildWhatsAppPayload(
  entry: BoxEntry,
  customer: Customer
): WhatsAppPayload {
  const settings    = { companyName: 'FIT – Fish Inventory Tracking', companyAddress: '', companyPhone: '', companyEmail: '', traderName: '', gstNumber: '', billPrefix: 'BILL', currency: 'INR', dateFormat: 'dd MMM yyyy', autoBackup: true, theme: 'light', stockAlertEnabled: true, stockAlertThreshold: 30, language: 'en' as const };
  const metaDate    = format(new Date(entry.entryDate), 'dd MMM yyyy');
  const extBoxes    = entry.isExternalSource ? (entry.externalBoxCount ?? 0) : 0;
  const totalBoxes  = entry.totalBoxesSent + entry.currentQuantity + extBoxes;
  const balance     = totalBoxes - entry.boxesReturned;
  const companyName = settings.companyName || 'FIT – Fish Inventory Tracking';
  const companyPhone = settings.companyPhone || '';

  const lines = [
    `🐟 *${companyName}*`,
    ``,
    `📋 *CUSTOMER RECEIPT*`,
    `━━━━━━━━━━━━━━━━━━━━━━━`,
    `🧾 *Receipt No:* ${entry.billNumber}`,
    `📅 *Date:* ${metaDate}`,
    `📌 *Type:* ${entryTypeLabel(entry.entryType)}`,
    ``,
    `👤 *Customer:* ${customer.customerName}`,
    `🏪 *Shop:* ${customer.shopName || '—'}`,
    `📞 *Mobile:* ${customer.mobile || '—'}`,
    ``,
    `📦 *BOX MOVEMENT SUMMARY*`,
    `━━━━━━━━━━━━━━━━━━━━━━━`,
    `📤 Boxes Already Sent (Before):     *${entry.totalBoxesSent}*`,
    `➕ Current Qty — Own Inventory:    *${entry.currentQuantity}*`,
    ...(entry.isExternalSource
      ? [`🔗 External Source (${entry.sourceName}): *${entry.externalBoxCount ?? 0}*`]
      : []),
    `📊 TOTAL BOXES:                 *${totalBoxes}*`,
    `↩️  Boxes Returned:             *${entry.boxesReturned}*`,
    `⚖️  Balance Pending Return:     *${balance}*`,
    ``,
    ...(entry.driverName    ? [`🚛 Driver: ${entry.driverName}`]                      : []),
    ...(entry.vehicleNumber ? [`🚗 Vehicle: ${entry.vehicleNumber}`]                   : []),
    ...(entry.isExternalSource && entry.sourceName
      ? [`🔗 External Source: ${entry.sourceName} (${entry.externalBoxCount ?? 0} boxes)`]
      : []),
    ...(entry.description   ? [`📝 Notes: ${entry.description}`]                      : []),
    ``,
    balance === 0
      ? `✅ All boxes returned. Thank you!`
      : `⚠️ *${balance} box${balance !== 1 ? 'es' : ''} pending return.*`,
    ``,
    `_Thank you for your business!_`,
    ...(companyPhone ? [`📞 ${companyPhone}`] : []),
  ].filter((l) => l !== undefined) as string[];

  const messageText = lines.join('\n');
  const rawPhone    = (customer.mobile || '').replace(/\D/g, '');

  // Mirror PyWhatKit exactly:
  //   web.open(f"https://web.whatsapp.com/send?phone={phone_no}&text={parsedMessage}")
  // We use web.whatsapp.com (WhatsApp Web) as the primary channel so the PDF
  // can be attached via the paperclip icon after the page opens.
  // We also include a wa.me fallback for mobile devices.
  const encoded  = encodeURIComponent(messageText);
  // Ensure the phone number starts with +91 (or + followed by digits)
  const phonePlus = rawPhone.startsWith('91') ? `+${rawPhone}` : `+91${rawPhone}`;

  const webUrl   = rawPhone
    ? `https://web.whatsapp.com/send?phone=${phonePlus.replace('+', '')}&text=${encoded}`
    : `https://web.whatsapp.com/send?text=${encoded}`;

  return {
    phone:       phonePlus,
    webUrl,
    messageText,
    pdfFilename: receiptFilename(entry),
  };
}

/**
 * Directly opens WhatsApp with the customer's number and receipt message
 * pre-filled — no intermediate steps, no modals.
 *
 * Strategy (most-reliable first):
 *  1. wa.me deep-link  → opens WhatsApp app on mobile, WhatsApp Web on desktop
 *  2. web.whatsapp.com → fallback for desktop browsers where wa.me is blocked
 *
 * Mirrors PyWhatKit:
 *   web.open(f"https://web.whatsapp.com/send?phone={phone_no}&text={parsedMessage}")
 */
export function openWhatsAppWeb(payload: WhatsAppPayload): void {
  const encoded  = encodeURIComponent(payload.messageText);

  // Primary: wa.me — universally supported on all devices & browsers
  const waMe = payload.phone.startsWith('+')
    ? `https://wa.me/${payload.phone.substring(1)}?text=${encoded}`
    : `https://wa.me/${payload.phone}?text=${encoded}`;

  // Use window.location.href so it is NEVER blocked by popup blockers
  window.open(waMe, '_blank');
}

/**
 * Triggers the local PowerShell automation via a custom protocol handler (fitshare:).
 * This handles moving the file to 'FIT reports' and automatically attaching it.
 *
 * NOTE: We now CALL downloadReceiptAsPDF FIRST to ensure the file exists.
 */
export function triggerWhatsAppAutomation(
  payload: WhatsAppPayload,
  entry: BoxEntry,
  customer: Customer
): void {
  // 1. GENERATE AND DOWNLOAD PDF FIRST
  downloadReceiptAsPDF(entry, customer);

  // 2. TRIGGER AUTOMATION
  const protocolUrl = `fitshare://send?phone=${encodeURIComponent(payload.phone)}&file=${encodeURIComponent(payload.pdfFilename)}`;
  window.location.assign(protocolUrl);
}

/**
 * One-call convenience function: build payload and open WhatsApp immediately.
 * Now updated to use the automated PowerShell-based sharing.
 */
export function shareReceiptViaWhatsApp(entry: BoxEntry, customer: Customer): void {
  const payload = buildWhatsAppPayload(entry, customer);
  
  // Try the automated PowerShell approach first
  triggerWhatsAppAutomation(payload, entry, customer);
}
