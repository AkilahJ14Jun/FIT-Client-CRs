// FIT – PDF Bill Generator v2.0
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { BoxEntry, Customer } from '../db/database';
import { SettingsDB } from '../db/database';
import { format } from 'date-fns';

export async function generateBillPDF(entry: BoxEntry, customer: Customer): Promise<jsPDF> {
  const settings = await SettingsDB.get();
  // A4 size: 210mm x 297mm
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // Render the receipt twice on the same A4 page
  // First receipt at the top
  renderReceiptContent(doc, 10, entry, customer, settings);

  // Separation line/gap
  doc.setDrawColor(200, 200, 200);
  doc.setLineDashPattern([2, 2], 0);
  doc.line(0, 148.5, 210, 148.5); // Middle of A4
  doc.setLineDashPattern([], 0);

  // Second receipt at the bottom
  renderReceiptContent(doc, 158.5, entry, customer, settings);

  return doc;
}

function renderReceiptContent(doc: jsPDF, startY: number, entry: BoxEntry, customer: Customer, settings: any) {
  const pageWidth = 210;
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2);

  // ─── Header ───────────────────────────────────────────────────────────────
  doc.setFillColor(13, 71, 161);
  doc.rect(0, startY - 10, pageWidth, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(settings.companyName || 'FIT – Fish Inventory Tracking', pageWidth / 2, startY, { align: 'center' });
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  if (settings.companyAddress) {
    doc.text(settings.companyAddress, pageWidth / 2, startY + 6, { align: 'center' });
  }

  // Mobile numbers in header
  doc.setFontSize(8);
  // Phone 1 on Left
  if (settings.companyPhone) {
    doc.text(`Ph: ${settings.companyPhone}`, margin, startY + 12);
  }
  // Phone 2 & 3 on Right (stacked)
  if (settings.companyPhone2 || settings.companyPhone3) {
    let phoneY = startY + 12;
    if (settings.companyPhone2) {
      doc.text(`Ph: ${settings.companyPhone2}`, pageWidth - margin, phoneY, { align: 'right' });
      phoneY += 4;
    }
    if (settings.companyPhone3) {
      doc.text(`Ph: ${settings.companyPhone3}`, pageWidth - margin, phoneY, { align: 'right' });
    }
  }

  // GST if present
  if (settings.gstNumber) {
    doc.text(`GST: ${settings.gstNumber}`, pageWidth / 2, startY + 12, { align: 'center' });
  }

  // ─── Title bar ────────────────────────────────────────────────────────────
  let y = startY + 18;
  doc.setFillColor(230, 239, 255);
  doc.rect(0, y, pageWidth, 8, 'F');
  doc.setTextColor(13, 71, 161);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('BOX DISPATCH BILL', pageWidth / 2, y + 5.5, { align: 'center' });

  // ─── Customer and Bill Meta (Parallel Layout) ─────────────────────────────
  y += 15;
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(9);

  // Left Side: Customer Info
  doc.setFont('helvetica', 'bold');
  doc.text(customer.customerName, margin, y);
  doc.setFont('helvetica', 'normal');
  doc.text(customer.mobile, margin, y + 5);

  // Right Side: Bill Info
  doc.setFont('helvetica', 'bold');
  doc.text(`Bill No: ${entry.billNumber}`, pageWidth - margin, y, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.text(`Date: ${format(new Date(entry.entryDate), 'dd MMM yyyy')}`, pageWidth - margin, y + 5, { align: 'right' });

  // ─── Table ────────────────────────────────────────────────────────────────
  y += 12;
  autoTable(doc, {
    startY: y,
    head: [['Description', 'Value']],
    body: [
      ['Entry Type', entry.entryType.replace(/_/g, ' ').toUpperCase()],
      ['Total Boxes Sent (Cumulative)', String(entry.totalBoxesSent)],
      ['Current Qty Dispatched', String(entry.currentQuantity)],
      ...(entry.isExternalSource
        ? [
            ['External Source', entry.sourceName || ''],
            ['External Box Count', String(entry.externalBoxCount ?? 0)],
          ]
        : []),
      ['Boxes Returned', String(entry.boxesReturned)],
      ['Balance Boxes', String(entry.balanceBoxes)],
      ['Vehicle/Driver', `${entry.vehicleNumber || '—'} / ${entry.driverName || '—'}`],
    ],
    headStyles: { fillColor: [13, 71, 161], textColor: 255, fontSize: 8.5, fontStyle: 'bold' },
    bodyStyles: { fontSize: 8 },
    alternateRowStyles: { fillColor: [245, 248, 255] },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: contentWidth / 2, fillColor: [240, 245, 255] },
      1: { cellWidth: contentWidth / 2 },
    },
    margin: { left: margin, right: margin },
  });

  // ─── Footer ───────────────────────────────────────────────────────────────
  const finalY = (doc as any).lastAutoTable.finalY + 8;
  doc.setFontSize(7.5);
  doc.setTextColor(100, 100, 100);
  doc.text('Receiver Signature: ________________________', margin, finalY);
  doc.text('Authorised by: ________________________', pageWidth - margin, finalY, { align: 'right' });

  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  doc.text(
    `Generated by FIT – Fish Inventory Tracking System  |  ${format(new Date(), 'dd MMM yyyy HH:mm')}`,
    pageWidth / 2,
    finalY + 8,
    { align: 'center' }
  );
}

export function shareBillViaWhatsApp(entry: BoxEntry, customer: Customer): void {
  const msg = [
    `🐟 *FIT – Fish Inventory Tracking*`,
    ``,
    `📋 *Bill No:* ${entry.billNumber}`,
    `📅 *Date:* ${format(new Date(entry.entryDate), 'dd MMM yyyy')}`,
    ``,
    `👤 *Customer:* ${customer.customerName}`,
    `🏪 *Shop:* ${customer.shopName}`,
    ``,
    `📦 *Total Boxes Sent:* ${entry.totalBoxesSent}`,
    `📥 *Boxes Returned:* ${entry.boxesReturned}`,
    `⚖️ *Balance Boxes:* ${entry.balanceBoxes}`,
    ``,
    entry.driverName ? `🚛 *Driver:* ${entry.driverName}` : '',
    entry.vehicleNumber ? `🚗 *Vehicle:* ${entry.vehicleNumber}` : '',
    ``,
    entry.description ? `📝 *Note:* ${entry.description}` : '',
    ``,
    `_Thank you for your business!_`,
  ]
    .filter((line) => line !== undefined)
    .join('\n');

  const phone = customer.mobile.replace(/\D/g, '');
  const encoded = encodeURIComponent(msg);
  const url = phone
    ? `https://wa.me/91${phone}?text=${encoded}`
    : `https://wa.me/?text=${encoded}`;
  window.open(url, '_blank');
}
