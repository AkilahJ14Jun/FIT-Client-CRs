import React, { useState, useMemo, useEffect } from 'react';
import {
  BarChart3, FileDown, Filter, Users, Calendar, Package,
  TrendingUp, ArrowRight
} from 'lucide-react';
import { EntryDB, CustomerDB } from '../db/database';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useTranslation } from '../i18n/TranslationProvider';

type ReportType = 'customer_date_range' | 'all_customers_date_range' | 'customer_single_date';

const TODAY = new Date().toISOString().split('T')[0];
const MONTH_START = startOfMonth(new Date()).toISOString().split('T')[0];
const MONTH_END = endOfMonth(new Date()).toISOString().split('T')[0];

const ENTRY_TYPE_BADGE: Record<string, 'blue' | 'green' | 'yellow' | 'orange' | 'purple' | 'gray'> = {
  dispatch: 'blue', return: 'green', opening_balance: 'yellow', balance_forward: 'orange', external_source: 'purple',
};

export const Reports: React.FC = () => {
  const { t } = useTranslation();
  const [customers, setCustomers] = useState<import('../db/database').Customer[]>([]);
  useEffect(() => { CustomerDB.getAll().then(setCustomers); }, []);
  const [reportType, setReportType] = useState<ReportType>('all_customers_date_range');
  const [customerId, setCustomerId] = useState('');
  const [fromDate, setFromDate] = useState(MONTH_START);
  const [toDate, setToDate] = useState(MONTH_END);
  const [singleDate, setSingleDate] = useState(TODAY);
  const [results, setResults] = useState<import('../db/database').BoxEntry[] | null>(null);

  const customerOpts = customers.map((c) => ({ value: c.id, label: `${c.customerName} – ${c.shopName}` }));

  const runReport = async () => {
    let data: import('../db/database').BoxEntry[] = [];
    if (reportType === 'all_customers_date_range') {
      data = await EntryDB.getByDateRange(fromDate, toDate);
    } else if (reportType === 'customer_date_range') {
      if (!customerId) return;
      data = await EntryDB.getByCustomerAndDateRange(customerId, fromDate, toDate);
    } else if (reportType === 'customer_single_date') {
      if (!customerId) return;
      data = await EntryDB.getByCustomerAndDateRange(customerId, singleDate, singleDate);
    }
    setResults(data);
  };

  const summary = useMemo(() => {
    if (!results) return null;
    const totalSent = results.reduce((s, e) => s + e.totalBoxesSent, 0);
    const totalReturned = results.reduce((s, e) => s + e.boxesReturned, 0);
    const totalBalance = results.reduce((s, e) => s + e.balanceBoxes, 0);
    const byCustomer: Record<string, { name: string; shop: string; sent: number; returned: number; balance: number }> = {};
    results.forEach((e) => {
      if (!byCustomer[e.customerId]) {
        byCustomer[e.customerId] = { name: e.customerName || '', shop: e.shopName || '', sent: 0, returned: 0, balance: 0 };
      }
      byCustomer[e.customerId].sent += e.totalBoxesSent;
      byCustomer[e.customerId].returned += e.boxesReturned;
      byCustomer[e.customerId].balance += e.balanceBoxes;
    });
    return { totalSent, totalReturned, totalBalance, byCustomer };
  }, [results]);

  const exportPDF = () => {
    if (!results || !summary) return;
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

    doc.setFillColor(13, 71, 161);
    doc.rect(0, 0, 297, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('FIT – Fish Inventory Tracking', 148, 9, { align: 'center' });
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Box Movement Report', 148, 16, { align: 'center' });

    doc.setTextColor(30, 30, 30);
    doc.setFontSize(9);
    let y = 26;

    const reportLabel =
      reportType === 'all_customers_date_range'
        ? `All Customers | ${format(new Date(fromDate), 'dd MMM yyyy')} – ${format(new Date(toDate), 'dd MMM yyyy')}`
        : reportType === 'customer_date_range'
        ? `${customers.find((c) => c.id === customerId)?.customerName} | ${format(new Date(fromDate), 'dd MMM yyyy')} – ${format(new Date(toDate), 'dd MMM yyyy')}`
        : `${customers.find((c) => c.id === customerId)?.customerName} | ${format(new Date(singleDate), 'dd MMM yyyy')}`;

    doc.text(`Report: ${reportLabel}`, 10, y);
    doc.text(`Generated: ${format(new Date(), 'dd MMM yyyy HH:mm')}`, 240, y);
    y += 5;
    doc.text(`Total Sent: ${summary.totalSent}  |  Total Returned: ${summary.totalReturned}  |  Balance: ${summary.totalBalance}`, 10, y);
    y += 4;

    autoTable(doc, {
      startY: y + 2,
      head: [['Date', 'Bill No', 'Customer', 'Shop', 'Type', 'Total Sent', 'Curr Qty', 'Returned', 'Balance', 'Driver', 'Vehicle', 'Description']],
      body: results.map((e) => [
        format(new Date(e.entryDate), 'dd MMM yyyy'),
        e.billNumber,
        e.customerName || '',
        e.shopName || '',
        e.entryType.replace(/_/g, ' '),
        e.totalBoxesSent,
        e.currentQuantity,
        e.boxesReturned,
        e.balanceBoxes,
        e.driverName || '',
        e.vehicleNumber || '',
        e.description || '',
      ]),
      headStyles: { fillColor: [13, 71, 161], textColor: 255, fontSize: 7 },
      bodyStyles: { fontSize: 7 },
      alternateRowStyles: { fillColor: [245, 248, 255] },
      margin: { left: 8, right: 8 },
    });

    const custRows = Object.values(summary.byCustomer);
    if (custRows.length > 0) {
      const finalY = (doc as any).lastAutoTable.finalY + 6;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('Summary by Customer', 10, finalY);
      autoTable(doc, {
        startY: finalY + 3,
        head: [['Customer', 'Shop', 'Total Sent', 'Total Returned', 'Balance']],
        body: custRows.map((r) => [r.name, r.shop, r.sent, r.returned, r.balance]),
        headStyles: { fillColor: [22, 101, 52], textColor: 255, fontSize: 8 },
        bodyStyles: { fontSize: 8 },
        margin: { left: 8, right: 8 },
      });
    }

    const fname = `FIT_Report_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`;
    doc.save(fname);
  };

  return (
    <div className="space-y-6">
      {/* Filter panel */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
        <div className="flex items-center gap-2 text-gray-700 font-semibold">
          <Filter size={18} className="text-blue-700" />
          {t('reports.title')}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Select
            label={t('reports.reportType')}
            value={reportType}
            onChange={(e) => { setReportType(e.target.value as ReportType); setResults(null); }}
            options={[
              { value: 'all_customers_date_range', label: t('reports.allCustDate') },
              { value: 'customer_date_range', label: t('reports.oneCustDate') },
              { value: 'customer_single_date', label: t('reports.oneCustSingle') },
            ]}
          />

          {(reportType === 'customer_date_range' || reportType === 'customer_single_date') && (
            <Select
              label={t('reports.customer')}
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              options={customerOpts}
              placeholder="— Select Customer —"
            />
          )}

          {(reportType === 'all_customers_date_range' || reportType === 'customer_date_range') && (
            <>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">{t('reports.fromDate')}</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">{t('reports.toDate')}</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
            </>
          )}

          {reportType === 'customer_single_date' && (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">{t('reports.date')}</label>
              <input
                type="date"
                value={singleDate}
                onChange={(e) => setSingleDate(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>
          )}
        </div>

        {/* Quick date range presets */}
        {(reportType === 'all_customers_date_range' || reportType === 'customer_date_range') && (
          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-gray-500 self-center">{t('reports.quick')}</span>
            {[
              { label: t('reports.today'), f: TODAY, t: TODAY },
              { label: t('reports.last7'), f: subDays(new Date(), 6).toISOString().split('T')[0], t: TODAY },
              { label: t('reports.last30'), f: subDays(new Date(), 29).toISOString().split('T')[0], t: TODAY },
              { label: t('reports.thisMonth'), f: MONTH_START, t: MONTH_END },
            ].map(({ label, f, t: tt }) => (
              <button
                key={label}
                onClick={() => { setFromDate(f); setToDate(tt); }}
                className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 bg-gray-50 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors"
              >
                {label}
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-3">
          <Button icon={<BarChart3 size={16} />} onClick={runReport}>
            {t('reports.run')}
          </Button>
          {results && results.length > 0 && (
            <Button variant="secondary" icon={<FileDown size={16} />} onClick={exportPDF}>
              {t('reports.export')}
            </Button>
          )}
        </div>
      </div>

      {/* Results */}
      {results !== null && (
        <>
          {/* Summary cards */}
          {summary && (
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: t('reports.totalSent'), value: summary.totalSent, color: 'bg-blue-900 text-white', icon: <Package size={24} /> },
                { label: t('reports.totalReturn'), value: summary.totalReturned, color: 'bg-emerald-700 text-white', icon: <ArrowRight size={24} /> },
                { label: t('entries.colBalance'), value: summary.totalBalance, color: 'bg-amber-600 text-white', icon: <TrendingUp size={24} /> },
              ].map(({ label, value, color, icon }) => (
                <div key={label} className={`rounded-2xl p-5 shadow-md ${color}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm opacity-85">{label}</p>
                      <p className="text-3xl font-bold mt-1">{value}</p>
                    </div>
                    <div className="opacity-70">{icon}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Customer summary */}
          {summary && Object.keys(summary.byCustomer).length > 1 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  <Users size={16} className="text-blue-700" /> {t('reports.summaryCust')}
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                      <th className="text-left px-6 py-3">{t('entries.colCustomer')}</th>
                      <th className="text-left px-6 py-3">{t('reports.shop')}</th>
                      <th className="text-right px-6 py-3">{t('reports.totalSent')}</th>
                      <th className="text-right px-6 py-3">{t('entries.colReturned')}</th>
                      <th className="text-right px-6 py-3">{t('entries.colBalance')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {Object.values(summary.byCustomer).map((r, i) => (
                      <tr key={i} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-3 font-medium text-gray-800">{r.name}</td>
                        <td className="px-6 py-3 text-gray-500">{r.shop}</td>
                        <td className="px-6 py-3 text-right font-bold text-gray-800">{r.sent}</td>
                        <td className="px-6 py-3 text-right text-emerald-700 font-medium">{r.returned}</td>
                        <td className="px-6 py-3 text-right font-bold text-amber-700">{r.balance}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Detailed entries */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <Calendar size={16} className="text-blue-700" />
                {t('reports.detailed')}
                <span className="text-xs text-gray-400 font-normal">({results.length} {t('reports.records')})</span>
              </h3>
            </div>
            <div className="overflow-x-auto">
              {results.length === 0 ? (
                <div className="py-12 text-center">
                  <BarChart3 size={36} className="mx-auto text-gray-200 mb-3" />
                  <p className="text-gray-400 text-sm">{t('reports.noRecords')}</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                      <th className="text-left px-4 py-3">{t('entries.colDate')}</th>
                      <th className="text-left px-4 py-3">{t('entries.colBill')}</th>
                      <th className="text-left px-4 py-3">{t('entries.colCustomer')}</th>
                      <th className="text-left px-4 py-3">{t('entries.colType')}</th>
                      <th className="text-right px-4 py-3">{t('reports.totalSent')}</th>
                      <th className="text-right px-4 py-3">{t('entries.colThisEntry')}</th>
                      <th className="text-right px-4 py-3">{t('entries.colReturned')}</th>
                      <th className="text-right px-4 py-3">{t('entries.colBalance')}</th>
                      <th className="text-left px-4 py-3">{t('entries.colDriver')}</th>
                      <th className="text-left px-4 py-3">{t('dispatch.description')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {results.map((e) => (
                      <tr key={e.id} className="hover:bg-blue-50/30 transition-colors">
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap text-xs">
                          {format(new Date(e.entryDate), 'dd MMM yyyy')}
                        </td>
                        <td className="px-4 py-3 font-semibold text-blue-800">{e.billNumber}</td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-800">{e.customerName}</div>
                          <div className="text-xs text-gray-400">{e.shopName}</div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={ENTRY_TYPE_BADGE[e.entryType] || 'gray'}>
                            {e.entryType.replace(/_/g, ' ')}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-gray-800">{e.totalBoxesSent}</td>
                        <td className="px-4 py-3 text-right text-gray-600">{e.currentQuantity}</td>
                        <td className="px-4 py-3 text-right text-emerald-700">{e.boxesReturned}</td>
                        <td className="px-4 py-3 text-right font-bold text-amber-700">{e.balanceBoxes}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{e.driverName || '—'}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs max-w-[180px] truncate">{e.description || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50 font-bold text-sm border-t-2 border-gray-200">
                      <td colSpan={4} className="px-4 py-3 text-gray-600">{t('reports.totals')}</td>
                      <td className="px-4 py-3 text-right text-gray-800">{summary?.totalSent}</td>
                      <td className="px-4 py-3 text-right text-gray-600">
                        {results.reduce((s, e) => s + e.currentQuantity, 0)}
                      </td>
                      <td className="px-4 py-3 text-right text-emerald-700">{summary?.totalReturned}</td>
                      <td className="px-4 py-3 text-right text-amber-700">{summary?.totalBalance}</td>
                      <td colSpan={2} />
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
