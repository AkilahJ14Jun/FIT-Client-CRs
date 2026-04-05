// FIT – Box Entries List
// Persistence: MySQL via REST API backend

import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Search, Pencil, Trash2, FileDown, MessageCircle,
  ChevronDown, ChevronUp, Filter, Package, Receipt,
} from 'lucide-react';
import { EntryDB, CustomerDB, AreaDB, type BoxEntry, type Customer, type CustomerArea } from '../db/database';
import { Button }                from '../components/ui/Button';
import { Badge }                 from '../components/ui/Badge';
import { ConfirmModal }          from '../components/ui/Modal';
import { ReceiptPreviewModal }   from '../components/ui/ReceiptPreviewModal';
import { WhatsAppSendModal }     from '../components/ui/WhatsAppSendModal';
import { downloadReceiptAsPDF } from '../utils/customerReceipt';
import { format }                from 'date-fns';
import { useTranslation } from '../i18n/TranslationProvider';

const ENTRY_TYPE_BADGE: Record<string, 'blue' | 'green' | 'yellow' | 'orange' | 'purple' | 'gray'> = {
  dispatch:        'blue',
  return:          'green',
  opening_balance: 'yellow',
  balance_forward: 'orange',
  external_source: 'purple',
};

export const Entries: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [entries,        setEntries]        = useState<BoxEntry[]>([]);
  const [customers,      setCustomers]      = useState<Customer[]>([]);
  const [areas,          setAreas]          = useState<CustomerArea[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [search,         setSearch]         = useState('');
  const [filterType,     setFilterType]     = useState('');
  const [filterCustomer, setFilterCustomer] = useState('');
  const [filterArea,     setFilterArea]     = useState('');
  const [sortField,      setSortField]      = useState<'entryDate' | 'billNumber' | 'totalBoxesSent'>('entryDate');
  const [sortDir,        setSortDir]        = useState<'asc' | 'desc'>('desc');
  const [deleteTarget,   setDeleteTarget]   = useState<BoxEntry | null>(null);
  const [showFilters,    setShowFilters]    = useState(false);

  const [receiptOpen,     setReceiptOpen]     = useState(false);
  const [receiptEntry,    setReceiptEntry]    = useState<BoxEntry | null>(null);
  const [receiptCustomer, setReceiptCustomer] = useState<Customer | null>(null);

  const [waOpen,     setWaOpen]     = useState(false);
  const [waEntry,    setWaEntry]    = useState<BoxEntry | null>(null);
  const [waCustomer, setWaCustomer] = useState<Customer | null>(null);

  const [downloadDoneId, setDownloadDoneId] = useState<string | null>(null);
  const [toast,          setToast]          = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [e, c, a] = await Promise.all([EntryDB.getAll(), CustomerDB.getAll(), AreaDB.getAll()]);
      setEntries(e);
      setCustomers(c);
      setAreas(a);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const resolveCustomer = (e: BoxEntry): Customer => {
    const live = customers.find((c) => c.id === e.customerId);
    if (live) return live;
    return {
      id: e.customerId, customerName: e.customerName || 'Unknown Customer',
      shopName: e.shopName || '', address: '', mobile: '', email: '', notes: '',
      totalSentCount: 0,
      isActive: true, createdAt: e.createdAt, updatedAt: e.updatedAt,
    };
  };

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortField(field); setSortDir('desc'); }
  };

  const SortIcon = ({ field }: { field: typeof sortField }) =>
    sortField === field ? (sortDir === 'asc' ? <ChevronUp size={13} /> : <ChevronDown size={13} />) : null;

  const filtered = entries
    .filter((e) => {
      const q = search.toLowerCase();
      const matchSearch = !q || e.billNumber.toLowerCase().includes(q) ||
        (e.customerName || '').toLowerCase().includes(q) ||
        (e.driverName || '').toLowerCase().includes(q) ||
        (e.description || '').toLowerCase().includes(q);
      const matchType     = !filterType     || e.entryType  === filterType;
      const matchCustomer = !filterCustomer || e.customerId === filterCustomer;
      const matchArea = !filterArea || (() => {
        const cust = customers.find((c) => c.id === e.customerId);
        return cust?.areaId === filterArea;
      })();
      return matchSearch && matchType && matchCustomer && matchArea;
    })
    .sort((a, b) => {
      let cmp = 0;
      if      (sortField === 'entryDate')      cmp = a.entryDate.localeCompare(b.entryDate);
      else if (sortField === 'billNumber')     cmp = a.billNumber.localeCompare(b.billNumber);
      else if (sortField === 'totalBoxesSent') cmp = (a.totalBoxesSent + a.currentQuantity) - (b.totalBoxesSent + b.currentQuantity);
      return sortDir === 'asc' ? cmp : -cmp;
    });

  const handleDelete = async () => {
    if (deleteTarget) { await EntryDB.delete(deleteTarget.id); await refresh(); }
  };

  const handleDirectDownload = (e: BoxEntry) => {
    try {
      const customer = resolveCustomer(e);
      downloadReceiptAsPDF(e, customer);
      setDownloadDoneId(e.id);
      showToast(`${t('entries.pdfSuccess')} ${e.billNumber} ${t('entries.downloaded')}`, 'success');
      setTimeout(() => setDownloadDoneId(null), 4000);
    } catch (err) {
      console.error('Receipt PDF download failed:', err);
      showToast(`${t('entries.pdfFail')} ${(err as Error).message}`, 'error');
    }
  };

  const handlePreviewReceipt = (e: BoxEntry) => {
    setReceiptEntry(e); setReceiptCustomer(resolveCustomer(e)); setReceiptOpen(true);
  };

  const handleWhatsApp = (e: BoxEntry) => {
    setWaEntry(e); setWaCustomer(resolveCustomer(e)); setWaOpen(true);
  };

  return (
    <div className="space-y-5">

      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-xl text-white text-sm font-medium transition-all duration-300 animate-fade-in ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
          {toast.type === 'success'
            ? <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            : <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>}
          {toast.msg}
        </div>
      )}

      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2 flex-1 min-w-0">
          <div className="relative flex-1 max-w-xs">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('entries.search')}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm" />
          </div>
          <Button variant="secondary" size="md" icon={<Filter size={15} />} onClick={() => setShowFilters((v) => !v)}>{t('entries.filters')}</Button>
        </div>
        <Button icon={<Plus size={16} />} onClick={() => navigate('/dispatch')}>{t('entries.new')}</Button>
      </div>

      {showFilters && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-wrap gap-4">
          <select value={filterArea} onChange={(e) => setFilterArea(e.target.value)}
            className="text-sm rounded-lg border border-gray-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">{t('entries.allAreas')}</option>
            {areas.filter((a) => a.isActive !== false).map((a) => (
              <option key={a.id} value={a.id}>{a.areaName}</option>
            ))}
          </select>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
            className="text-sm rounded-lg border border-gray-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">{t('entries.allTypes')}</option>
            <option value="dispatch">{t('dispatch.dispatch')}</option>
            <option value="return">{t('dispatch.return')}</option>
          </select>
          <select value={filterCustomer} onChange={(e) => setFilterCustomer(e.target.value)}
            className="text-sm rounded-lg border border-gray-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">{t('entries.allCustomers')}</option>
            {customers.map((c) => (<option key={c.id} value={c.id}>{c.customerName}</option>))}
          </select>
          <button onClick={() => { setFilterType(''); setFilterCustomer(''); setFilterArea(''); setSearch(''); }}
            className="text-sm text-red-600 hover:text-red-800 font-medium">{t('entries.clear')}</button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-4 px-1 text-xs text-gray-500">
        <span className="font-semibold text-gray-600 uppercase tracking-wide">{t('entries.actionIcons')}</span>
        <span className="flex items-center gap-1.5"><span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-blue-50 text-blue-700"><Receipt size={13} /></span>{t('entries.previewReceipt')}</span>
        <span className="flex items-center gap-1.5"><span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-emerald-50 text-emerald-700"><FileDown size={13} /></span>{t('entries.downloadPDF')}</span>
        <span className="flex items-center gap-1.5"><span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-green-50 text-green-600"><MessageCircle size={13} /></span>{t('entries.shareWhatsApp')}</span>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <p className="text-sm text-gray-500">{t('entries.showing')} <span className="font-semibold text-gray-800">{filtered.length}</span> {t('entries.of')} {entries.length} {t('entries.entries')}</p>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-16 text-center text-gray-400 text-sm">{t('entries.loading')}</div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <Package size={40} className="mx-auto text-gray-200 mb-3" />
              <p className="text-gray-400 text-sm">{t('entries.noFound')}</p>
              <button onClick={() => navigate('/dispatch')} className="mt-3 text-sm text-blue-600 hover:underline">{t('entries.createFirst')}</button>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                  <th className="text-left px-4 py-3 cursor-pointer select-none hover:text-gray-700" onClick={() => handleSort('entryDate')}><span className="flex items-center gap-1">{t('entries.colDate')} <SortIcon field="entryDate" /></span></th>
                  <th className="text-left px-4 py-3 cursor-pointer select-none hover:text-gray-700" onClick={() => handleSort('billNumber')}><span className="flex items-center gap-1">{t('entries.colBill')} <SortIcon field="billNumber" /></span></th>
                  <th className="text-left px-4 py-3">{t('entries.colCustomer')}</th>
                  <th className="text-left px-4 py-3">{t('entries.colType')}</th>
                  <th className="text-right px-4 py-3">{t('entries.colTotal')}</th>
                  <th className="text-right px-4 py-3" title="Boxes already sent before this entry">{t('entries.colAlreadySent')}</th>
                  <th className="text-right px-4 py-3" title="Boxes sent in this specific entry">{t('entries.colThisEntry')}</th>
                  <th className="text-right px-4 py-3">{t('entries.colReturned')}</th>
                  <th className="text-right px-4 py-3">{t('entries.colBalance')}</th>
                  <th className="text-left px-4 py-3">{t('entries.colDriver')}</th>
                  <th className="text-left px-4 py-3">{t('entries.colVehicle')}</th>
                  <th className="text-center px-4 py-3 min-w-[140px]">{t('entries.colActions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((e) => {
                  const isDone = downloadDoneId === e.id;
                  return (
                    <tr key={e.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap text-xs">{format(new Date(e.entryDate), 'dd MMM yyyy')}</td>
                      <td className="px-4 py-3 font-semibold text-blue-800 whitespace-nowrap">{e.billNumber}</td>
                      <td className="px-4 py-3"><div className="font-medium text-gray-800 whitespace-nowrap">{e.customerName}</div><div className="text-xs text-gray-400">{e.shopName}</div></td>
                      <td className="px-4 py-3">
                        <Badge variant={ENTRY_TYPE_BADGE[e.entryType] || 'gray'}>{e.entryType.replace(/_/g, ' ')}</Badge>
                        {e.isExternalSource && (<div className="text-xs text-purple-600 mt-0.5">via {e.sourceName}</div>)}
                      </td>
                      <td className="px-4 py-3 text-right"><span className="font-extrabold text-blue-900 text-base">{e.totalBoxesSent + e.currentQuantity}</span></td>
                      <td className="px-4 py-3 text-right text-gray-500 text-xs">{e.totalBoxesSent}</td>
                      <td className="px-4 py-3 text-right text-gray-700 font-medium">{e.currentQuantity}</td>
                      <td className="px-4 py-3 text-right text-emerald-700 font-medium">{e.boxesReturned}</td>
                      <td className="px-4 py-3 text-right"><span className={`font-bold ${e.balanceBoxes > 0 ? 'text-amber-700' : 'text-green-600'}`}>{e.balanceBoxes}</span></td>
                      <td className="px-4 py-3 text-gray-600 text-xs whitespace-nowrap">{e.driverName || '—'}</td>
                      <td className="px-4 py-3 text-gray-600 text-xs whitespace-nowrap">{e.vehicleNumber || '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => navigate(`/dispatch?edit=${e.id}`)} title="Edit entry" className="p-1.5 rounded-lg text-gray-400 hover:text-blue-700 hover:bg-blue-50 transition-colors"><Pencil size={14} /></button>
                          <button onClick={() => handlePreviewReceipt(e)} title="Preview Customer Receipt" className="p-1.5 rounded-lg text-blue-400 hover:text-blue-800 hover:bg-blue-50 transition-colors"><Receipt size={14} /></button>
                          <button onClick={() => handleDirectDownload(e)} title="Print Customer Receipt as PDF"
                            className={`p-1.5 rounded-lg transition-colors ${isDone ? 'text-emerald-600 bg-emerald-50' : 'text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50'}`}>
                            {isDone ? <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg> : <FileDown size={14} />}
                          </button>
                          <button onClick={() => handleWhatsApp(e)} title="Send Receipt via WhatsApp" className="p-1.5 rounded-lg transition-colors text-green-500 hover:text-green-700 hover:bg-green-50"><MessageCircle size={14} /></button>
                          <button onClick={() => setDeleteTarget(e)} title="Delete entry" className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <ConfirmModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title={t('entries.deleteTitle')} message={`${t('entries.deleteMsg')} "${deleteTarget?.billNumber}"? ${t('entries.cantUndo')}`} confirmLabel={t('entries.delete')} variant="danger" />

      <ReceiptPreviewModal open={receiptOpen} entry={receiptEntry} customer={receiptCustomer} onClose={() => setReceiptOpen(false)} />

      <WhatsAppSendModal open={waOpen} entry={waEntry} customer={waCustomer} onClose={() => setWaOpen(false)} />
    </div>
  );
};
