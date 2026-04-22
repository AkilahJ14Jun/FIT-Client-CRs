import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { SettingsDB, type BoxEntry, type Customer } from '../db/database';

export async function generateEntriesPDF(
  entries: BoxEntry[],
  customers: Customer[],
  cumulativeData: Record<string, { totalSent: number, totalReturned: number, balance: number }>,
  title: string = 'Entries List'
): Promise<jsPDF> {
  const settings = await SettingsDB.get();
  const companyName = settings.companyName || 'FIT - Fish Inventory Tracking';
  const printedAt = format(new Date(), 'dd-MM-yyyy hh:mm a');

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  
  // Header
  doc.setFontSize(18);
  doc.setTextColor(40);
  doc.text(companyName, 14, 15);
  
  doc.setFontSize(12);
  doc.setTextColor(100);
  doc.text(title, 14, 22);
  
  doc.setFontSize(8);
  doc.text(`Printed at: ${printedAt}`, 297 - 14, 22, { align: 'right' });

  // Table Data
  const tableData = entries.map((e) => {
    const cust = customers.find(c => c.id === e.customerId);
    return [
      format(new Date(e.entryDate), 'dd-MM-yyyy'),
      e.billNumber,
      cust?.customerName || e.customerName || 'Unknown',
      e.entryType === 'opening_balance' ? 'Stock Position' : e.entryType.replace(/_/g, ' '),
      cumulativeData[e.id]?.totalSent ?? 0,
      cumulativeData[e.id]?.totalReturned ?? 0,
      cumulativeData[e.id]?.balance ?? 0
    ];
  });

  autoTable(doc, {
    startY: 30,
    head: [['Date', 'Bill No', 'Customer', 'Type', 'Total Boxes', 'Returned', 'Balance']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185], textColor: 255, fontSize: 10 },
    styles: { fontSize: 9, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 30 },
      2: { cellWidth: 'auto' },
      4: { halign: 'right', fontStyle: 'bold' },
      5: { halign: 'right' },
      6: { halign: 'right', fontStyle: 'bold' },
    },
  });

  return doc;
}

export async function downloadEntriesPDF(
  entries: BoxEntry[], 
  customers: Customer[],
  cumulativeData: Record<string, { totalSent: number, totalReturned: number, balance: number }>
): Promise<void> {
  const doc = await generateEntriesPDF(entries, customers, cumulativeData, 'Box Entries Report');
  const filename = `Entries_Report_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`;
  
  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  
  setTimeout(() => {
    if (document.body.contains(a)) document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 2500);
}

export async function printEntries(
  entries: BoxEntry[], 
  customers: Customer[],
  cumulativeData: Record<string, { totalSent: number, totalReturned: number, balance: number }>
): Promise<void> {
  const doc = await generateEntriesPDF(entries, customers, cumulativeData, 'Box Entries Report');
  doc.autoPrint();
  window.open(doc.output('bloburl'), '_blank');
}
