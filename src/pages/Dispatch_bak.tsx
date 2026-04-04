// FIT – Box Dispatch / Return / Opening Balance Entry Form

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Save, ArrowLeft, User, ExternalLink, Plus, Trash2, Package, Building2, Layers } from 'lucide-react';
import { useTranslation } from '../i18n/TranslationProvider';
import {
  CustomerDB, SourceDB, EntryDB,
  type BoxEntry, type Customer, type OpeningStockSource,
} from '../db/database';
import { Button }                  from '../components/ui/Button';
import { Input, Select, TextArea } from '../components/ui/Input';
import { Card }                    from '../components/ui/Card';
import { ReceiptPreviewModal }     from '../components/ui/ReceiptPreviewModal';
import { downloadReceiptAsPDF }   from '../utils/customerReceipt';

// ── Entry Types ───────────────────────────────────────────────────────────────
const ENTRY_TYPES = [
  { value: 'opening_balance', label: 'Opening Balance' },
  { value: 'dispatch',        label: 'Dispatch'        },
  { value: 'return',          label: 'Return'          },
];

// ── Form State for Dispatch / Return ─────────────────────────────────────────
interface DispatchFormState {
  billNumber:       string;
  entryDate:        string;
  customerId:       string;
  description:      string;
  entryType:        string;
  totalBoxesSent:   string;
  currentQuantity:  string;
  boxesReturned:    string;
  driverName:       string;
  vehicleNumber:    string;
  isExternalSource: boolean;
  sourceId:         string;
  externalBoxCount: string;
}

// ── Opening Balance Source Row ────────────────────────────────────────────────
interface OBSourceRow {
  id:       string;   // local key only
  sourceId: string;
  quantity: string;
}

// ── Opening Balance Form State ────────────────────────────────────────────────
interface OBFormState {
  billNumber:          string;
  entryDate:           string;
  description:         string;
  companyOwnQuantity:  string;
  sourceRows:          OBSourceRow[];
}

const TODAY = new Date().toISOString().split('T')[0];



function newSourceRow(): OBSourceRow {
  return { id: crypto.randomUUID(), sourceId: '', quantity: '' };
}

// ─────────────────────────────────────────────────────────────────────────────
export const Dispatch: React.FC = () => {
  const { t } = useTranslation();
  const navigate       = useNavigate();
  const [searchParams] = useSearchParams();
  const editId         = searchParams.get('edit');

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sources,   setSources]   = useState<import('../db/database').InventorySource[]>([]);

  useEffect(() => {
    Promise.all([CustomerDB.getAll(), SourceDB.getAll()]).then(([c, s]) => {
      setCustomers(c);
      setSources(s);
    });
  }, []);

  // Which entry type is selected — drive the entire form layout
  const [entryType, setEntryType] = useState<string>('opening_balance');

  // ── Dispatch / Return form ────────────────────────────────────────────────
  const [form, setForm] = useState<DispatchFormState>({
    billNumber:       'BILL-001',
    entryDate:        TODAY,
    customerId:       '',
    description:      '',
    entryType:        'opening_balance',
    totalBoxesSent:   '0',
    currentQuantity:  '',
    boxesReturned:    '0',
    driverName:       '',
    vehicleNumber:    '',
    isExternalSource: false,
    sourceId:         '',
    externalBoxCount: '',
  });
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof DispatchFormState, string>>>({});

  // ── Opening Balance form ──────────────────────────────────────────────────
  const [ob, setOb] = useState<OBFormState>({
    billNumber:         'BILL-001',
    entryDate:          TODAY,
    description:        '',
    companyOwnQuantity: '',
    sourceRows:         [],
  });
  const [obErrors, setObErrors] = useState<Partial<Record<string, string>>>({});

  // ── Load next bill number async ──────────────────────────────────────────
  useEffect(() => {
    if (editId) return; // don't overwrite when editing
    EntryDB.nextBillNumber().then((bill) => {
      setForm((f) => ({ ...f, billNumber: bill }));
      setOb((o) => ({ ...o, billNumber: bill }));
    });
  }, [editId]);

  // ── Receipt preview ───────────────────────────────────────────────────────
  const [saving,          setSaving]          = useState(false);
  const [receiptOpen,     setReceiptOpen]     = useState(false);
  const [receiptEntry,    setReceiptEntry]    = useState<BoxEntry | null>(null);
  const [receiptCustomer, setReceiptCustomer] = useState<Customer | null>(null);

  const isOB     = entryType === 'opening_balance';
  const isReturn = entryType === 'return';

  // ── Load existing entry for edit ──────────────────────────────────────────
  useEffect(() => {
    if (!editId) return;
    EntryDB.getById(editId).then((entry) => {
      if (!entry) return;
      setEntryType(entry.entryType);
      if (entry.entryType === 'opening_balance') {
        setOb({
          billNumber:         entry.billNumber,
          entryDate:          entry.entryDate,
          description:        entry.description,
          companyOwnQuantity: String(entry.companyOwnQuantity ?? entry.currentQuantity),
          sourceRows: (entry.openingStockSources ?? []).map((s) => ({
            id: crypto.randomUUID(), sourceId: s.sourceId, quantity: String(s.quantity),
          })),
        });
      } else {
        setForm({
          billNumber: entry.billNumber, entryDate: entry.entryDate,
          customerId: entry.customerId, description: entry.description,
          entryType: entry.entryType, totalBoxesSent: String(entry.totalBoxesSent),
          currentQuantity: String(entry.currentQuantity), boxesReturned: String(entry.boxesReturned),
          driverName: entry.driverName, vehicleNumber: entry.vehicleNumber,
          isExternalSource: entry.isExternalSource, sourceId: entry.sourceId || '',
          externalBoxCount: String(entry.externalBoxCount ?? ''),
        });
      }
    });
  }, [editId]);

  // ── Auto-populate totalBoxesSent when customer is selected ─────────────────
  const selectedCustomer = customers.find(c => c.id === form.customerId);
  const cumulativeSent = selectedCustomer?.totalSentCount ?? 0;

  // ── Balance Boxes (Dispatch / Return) ─────────────────────────────────────
  const balanceBoxes = useMemo(() => {
    const total     = cumulativeSent;
    const current   = parseInt(form.currentQuantity) || 0;
    const returned  = parseInt(form.boxesReturned)   || 0;
    const extBoxes  = form.isExternalSource ? (parseInt(form.externalBoxCount) || 0) : 0;
    return Math.max(0, total + current + extBoxes - returned);
  }, [cumulativeSent, form.currentQuantity, form.boxesReturned, form.isExternalSource, form.externalBoxCount]);

  // ── Opening Balance computed totals ───────────────────────────────────────
  const obCompanyQty = parseInt(ob.companyOwnQuantity) || 0;
  const obSourceRows = ob.sourceRows;
  const obSourceTotal = obSourceRows.reduce((s, r) => s + (parseInt(r.quantity) || 0), 0);
  const obGrandTotal  = obCompanyQty + obSourceTotal;

  // ── Helpers ───────────────────────────────────────────────────────────────
  const setF = (key: keyof DispatchFormState, value: string | boolean) =>
    setForm((p) => ({ ...p, [key]: value }));

  const setObField = (key: keyof Omit<OBFormState, 'sourceRows'>, value: string) =>
    setOb((p) => ({ ...p, [key]: value }));

  const addSourceRow = () =>
    setOb((p) => ({ ...p, sourceRows: [...p.sourceRows, newSourceRow()] }));

  const removeSourceRow = (id: string) =>
    setOb((p) => ({ ...p, sourceRows: p.sourceRows.filter((r) => r.id !== id) }));

  const updateSourceRow = (id: string, field: 'sourceId' | 'quantity', value: string) =>
    setOb((p) => ({
      ...p,
      sourceRows: p.sourceRows.map((r) => r.id === id ? { ...r, [field]: value } : r),
    }));

  // ── Validate Dispatch / Return ────────────────────────────────────────────
  const validateDispatch = (): boolean => {
    const e: Partial<Record<keyof DispatchFormState, string>> = {};
    if (!form.billNumber.trim()) e.billNumber  = 'Bill number is required';
    if (!form.entryDate)         e.entryDate   = 'Date is required';
    if (!form.customerId)        e.customerId  = 'Customer is required';
    if (isReturn) {
      if (!form.boxesReturned || parseInt(form.boxesReturned) <= 0)
        e.boxesReturned = 'Enter number of boxes returned (must be > 0)';
    } else {
      if (!form.currentQuantity || parseInt(form.currentQuantity) <= 0)
        e.currentQuantity = 'Quantity sent is required (must be > 0)';
    }
    if (parseInt(form.boxesReturned) < 0) e.boxesReturned = 'Cannot be negative';
    if (form.isExternalSource && !form.sourceId) e.sourceId = 'Source is required';
    setFormErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Validate Opening Balance ──────────────────────────────────────────────
  const validateOB = (): boolean => {
    const e: Record<string, string> = {};
    if (!ob.billNumber.trim()) e.billNumber = 'Bill number is required';
    if (!ob.entryDate)         e.entryDate  = 'Date is required';
    if (obGrandTotal <= 0)
      e.companyOwnQuantity = 'Total stock must be greater than 0';
    ob.sourceRows.forEach((r, i) => {
      if (!r.sourceId)                           e[`src_${i}_source`]   = 'Select a source';
      if (!r.quantity || parseInt(r.quantity) <= 0) e[`src_${i}_qty`]  = 'Enter quantity > 0';
    });
    setObErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = () => {
    if (isOB) handleSaveOB();
    else      handleSaveDispatch();
  };

  const handleSaveOB = async () => {
    if (!validateOB()) return;
    setSaving(true);
    try {
      const resolvedSources: OpeningStockSource[] = ob.sourceRows
        .map((r) => {
          const src = sources.find((s) => s.id === r.sourceId);
          return { sourceId: r.sourceId, sourceName: src?.sourceName ?? 'Unknown Source', quantity: parseInt(r.quantity) || 0 };
        })
        .filter((s) => s.quantity > 0);

      const payload: Omit<BoxEntry, 'id' | 'createdAt' | 'updatedAt'> = {
        billNumber: ob.billNumber.trim(), entryDate: ob.entryDate,
        customerId: '', customerName: undefined, shopName: undefined,
        description: ob.description.trim() || 'Opening Stock Balance',
        entryType: 'opening_balance', totalBoxesSent: 0,
        currentQuantity: obGrandTotal, boxesReturned: 0, balanceBoxes: obGrandTotal,
        driverName: '', vehicleNumber: '', isExternalSource: false,
        companyOwnQuantity: obCompanyQty, openingStockSources: resolvedSources,
      };

      const saved = editId
        ? await EntryDB.update(editId, payload) as BoxEntry
        : await EntryDB.create(payload);

      console.info('[FIT] Opening Balance saved:', saved?.id);
      navigate('/entries');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDispatch = async () => {
    if (!validateDispatch()) return;
    setSaving(true);
    try {
      const customer = customers.find((c) => c.id === form.customerId);
      const source   = form.sourceId ? sources.find((s) => s.id === form.sourceId) : undefined;

      const numCurrentQty = parseInt(form.currentQuantity) || 0;
      const numReturned   = parseInt(form.boxesReturned)   || 0;
      const numTotalSent  = cumulativeSent;
      const numExtBoxes   = form.isExternalSource ? (parseInt(form.externalBoxCount) || 0) : 0;
      const computedBal   = Math.max(0, numTotalSent + numCurrentQty + numExtBoxes - numReturned);

      const payload: Omit<BoxEntry, 'id' | 'createdAt' | 'updatedAt'> = {
        billNumber: form.billNumber.trim(), entryDate: form.entryDate,
        customerId: form.customerId, customerName: customer?.customerName, shopName: customer?.shopName,
        description: form.description.trim(), entryType: form.entryType as BoxEntry['entryType'],
        totalBoxesSent: numTotalSent, currentQuantity: numCurrentQty,
        boxesReturned: numReturned, balanceBoxes: computedBal,
        driverName: form.driverName.trim(), vehicleNumber: form.vehicleNumber.trim(),
        isExternalSource: form.isExternalSource,
        sourceId:         form.isExternalSource ? form.sourceId      : undefined,
        sourceName:       form.isExternalSource ? source?.sourceName  : undefined,
        externalBoxCount: form.isExternalSource ? parseInt(form.externalBoxCount) || 0 : undefined,
      };

      const savedEntry = editId
        ? await EntryDB.update(editId, payload) as BoxEntry
        : await EntryDB.create(payload);

      // Persist the updated sent count to the backend
      if (customer && savedEntry && !editId) {
        const newCount = (customer.totalSentCount ?? 0) + numCurrentQty;
        await CustomerDB.update(customer.id, { totalSentCount: newCount });
        // Update local state so the UI reflects the change immediately
        setCustomers(prev => prev.map(c =>
          c.id === customer.id ? { ...c, totalSentCount: newCount } : c
        ));
      }

      if (customer && savedEntry) {
        downloadReceiptAsPDF(savedEntry, customer);
        setTimeout(() => { setReceiptEntry(savedEntry); setReceiptCustomer(customer); setReceiptOpen(true); }, 150);
      } else {
        navigate('/entries');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleReceiptClose = () => {
    setReceiptOpen(false);
    navigate('/entries');
  };

  const customerOpts = customers.map((c) => ({ value: c.id, label: `${c.customerName} – ${c.shopName}` }));
  const sourceOpts   = sources.map((s)   => ({ value: s.id, label: s.sourceName }));

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="max-w-3xl mx-auto space-y-5">

        {/* Page header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" icon={<ArrowLeft size={16} />} onClick={() => navigate(-1)}>
            {t('dispatch.back')}
          </Button>
          <h2 className="text-base font-semibold text-gray-700">
            {editId ? t('dispatch.title_edit') : t('dispatch.title_new')}
          </h2>
        </div>

        {/* ── Entry Type Selector ─────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3">
          {ENTRY_TYPES.map((entry) => (
            <button
              key={entry.value}
              onClick={() => {
                setEntryType(entry.value);
                setForm((p) => ({ ...p, entryType: entry.value }));
              }}
              className={`flex flex-col items-center justify-center gap-1.5 py-4 px-3 rounded-xl border-2 font-semibold text-sm transition-all ${
                entryType === entry.value
                  ? entry.value === 'opening_balance'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-md'
                    : entry.value === 'dispatch'
                    ? 'border-blue-500 bg-blue-50 text-blue-800 shadow-md'
                    : 'border-amber-500 bg-amber-50 text-amber-800 shadow-md'
                  : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              <span className="text-2xl">
                {entry.value === 'opening_balance' ? '🏁' : entry.value === 'dispatch' ? '📦' : '↩️'}
              </span>
              <span>{entry.value === 'opening_balance' ? t('dispatch.openingBal') : entry.value === 'dispatch' ? t('dispatch.dispatch') : t('dispatch.return')}</span>
            </button>
          ))}
        </div>

        {/* ════════════════════════════════════════════════════════════════
            OPENING BALANCE FORM
        ════════════════════════════════════════════════════════════════ */}
        {isOB && (
          <>
            {/* Info Banner */}
            <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-800">
              <span className="text-lg mt-0.5">🏁</span>
              <div>
                <p className="font-semibold">{t('dispatch.obBannerTitle')}</p>
                <p className="text-xs mt-0.5 text-emerald-700">
                  {t('dispatch.obBannerDesc')}
                </p>
              </div>
            </div>

            {/* Bill Info */}
            <Card title={t('dispatch.entryInfo')} subtitle={t('dispatch.entryInfoSub')}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label={t('dispatch.billNumber')}
                  value={ob.billNumber}
                  onChange={(e) => setObField('billNumber', e.target.value)}
                  error={obErrors.billNumber}
                  placeholder="e.g. OB-001"
                />
                <Input
                  label={t('dispatch.date')}
                  type="date"
                  value={ob.entryDate}
                  onChange={(e) => setObField('entryDate', e.target.value)}
                  error={obErrors.entryDate}
                />
              </div>
              <div className="mt-4">
                <TextArea
                  label={t('dispatch.description')}
                  value={ob.description}
                  onChange={(e) => setObField('description', e.target.value)}
                  placeholder="e.g. Opening stock for January 2025 – post-holiday restocking"
                  rows={2}
                />
              </div>
            </Card>

            {/* Company Own Stock */}
            <Card
              title={t('dispatch.companyStock')}
              subtitle={t('dispatch.companyStockSub')}
            >
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex-shrink-0">
                  <Building2 size={22} />
                </div>
                <div className="flex-1">
                  <Input
                    label={t('dispatch.companyQty')}
                    type="number"
                    min="0"
                    value={ob.companyOwnQuantity}
                    onChange={(e) => setObField('companyOwnQuantity', e.target.value)}
                    error={obErrors.companyOwnQuantity}
                    placeholder="0"
                    hint={t('dispatch.companyQtyHint')}
                  />
                </div>
              </div>
            </Card>

            {/* Other Sources */}
            <Card
              title={t('dispatch.otherSources')}
              subtitle={t('dispatch.otherSourcesSub')}
            >
              {ob.sourceRows.length === 0 && (
                <div className="text-center py-6 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-xl mb-4">
                  <Package size={28} className="mx-auto mb-2 opacity-40" />
                  <p>{t('dispatch.noSources')}</p>
                  <p className="text-xs mt-1">{t('dispatch.noSourcesSub')}</p>
                </div>
              )}

              {ob.sourceRows.map((row, idx) => {
                const src = sources.find((s) => s.id === row.sourceId);
                return (
                  <div
                    key={row.id}
                    className="flex items-start gap-3 mb-3 p-3 bg-gray-50 rounded-xl border border-gray-200"
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex-shrink-0 mt-1 text-xs font-bold">
                      {idx + 1}
                    </div>
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <Select
                          label={t('dispatch.invSource')}
                          value={row.sourceId}
                          onChange={(e) => updateSourceRow(row.id, 'sourceId', e.target.value)}
                          options={sourceOpts}
                          placeholder="— Select Source —"
                          error={obErrors[`src_${idx}_source`]}
                        />
                        {src && (
                          <p className="text-xs text-gray-500 mt-1">📞 {src.mobile} · {src.contactPerson}</p>
                        )}
                      </div>
                      <Input
                        label={t('dispatch.companyQty').replace(' *', '')}
                        type="number"
                        min="1"
                        value={row.quantity}
                        onChange={(e) => updateSourceRow(row.id, 'quantity', e.target.value)}
                        placeholder="0"
                        error={obErrors[`src_${idx}_qty`]}
                        hint={t('dispatch.extBoxHint')}
                      />
                    </div>
                    <button
                      onClick={() => removeSourceRow(row.id)}
                      className="flex-shrink-0 mt-6 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove this source"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })}

              <Button
                variant="secondary"
                size="sm"
                icon={<Plus size={15} />}
                onClick={addSourceRow}
              >
                {t('dispatch.addSource')}
              </Button>
            </Card>

            {/* ── Stock Summary Table ────────────────────────────────────── */}
            <Card
              title={t('dispatch.stockSummary')}
              subtitle={t('dispatch.stockSummarySub')}
            >
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-800 text-white">
                      <th className="text-left px-4 py-3 font-semibold">Source</th>
                      <th className="text-left px-4 py-3 font-semibold">Type</th>
                      <th className="text-right px-4 py-3 font-semibold">Quantity (Boxes)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Company row */}
                    <tr className="border-b border-gray-100 bg-blue-50">
                      <td className="px-4 py-3 font-semibold text-blue-900 flex items-center gap-2">
                        <Building2 size={14} className="text-blue-600" />
                        {t('dispatch.companyStock')}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {t('dispatch.companyOwned')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-blue-900 text-base">
                        {obCompanyQty}
                      </td>
                    </tr>

                    {/* Source rows */}
                    {ob.sourceRows.map((row, idx) => {
                      const src = sources.find((s) => s.id === row.sourceId);
                      const qty = parseInt(row.quantity) || 0;
                      return (
                        <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-4 py-3 text-gray-700 flex items-center gap-2">
                            <Layers size={14} className="text-indigo-500" />
                            {src ? src.sourceName : <span className="text-gray-400 italic">Source {idx + 1} (not selected)</span>}
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                              {t('dispatch.externalSrc')}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-gray-800">
                            {qty}
                          </td>
                        </tr>
                      );
                    })}

                    {/* No sources placeholder */}
                    {ob.sourceRows.length === 0 && (
                      <tr className="border-b border-gray-100">
                        <td colSpan={3} className="px-4 py-3 text-center text-gray-400 text-xs italic">
                          {t('dispatch.noExtSources')}
                        </td>
                      </tr>
                    )}
                  </tbody>

                  {/* Totals footer */}
                  <tfoot>
                    {/* Company subtotal */}
                    <tr className="bg-blue-100 border-t border-blue-200">
                      <td colSpan={2} className="px-4 py-2 font-semibold text-blue-900 text-xs uppercase tracking-wide">
                        {t('dispatch.companyTotal')}
                      </td>
                      <td className="px-4 py-2 text-right font-bold text-blue-900">
                        {obCompanyQty}
                      </td>
                    </tr>
                    {/* Source subtotal */}
                    {ob.sourceRows.length > 0 && (
                      <tr className="bg-indigo-100 border-t border-indigo-200">
                        <td colSpan={2} className="px-4 py-2 font-semibold text-indigo-900 text-xs uppercase tracking-wide">
                          {t('dispatch.extTotal')}
                        </td>
                        <td className="px-4 py-2 text-right font-bold text-indigo-900">
                          {obSourceTotal}
                        </td>
                      </tr>
                    )}
                    {/* Grand total */}
                    <tr className="bg-emerald-600 text-white">
                      <td colSpan={2} className="px-4 py-3 font-extrabold text-sm uppercase tracking-wider">
                        🏁 Grand Total Opening Stock
                      </td>
                      <td className="px-4 py-3 text-right font-extrabold text-xl">
                        {obGrandTotal}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {obGrandTotal === 0 && (
                <p className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  ⚠ Enter at least one quantity above to set the opening stock.
                </p>
              )}
            </Card>

            {/* ── Opening Balance Save Button ──────────────────────────── */}
            <div className="flex justify-end gap-3 pb-6">
              <Button variant="secondary" onClick={() => navigate(-1)}>{t('dispatch.cancel')}</Button>
              <Button
                icon={<Save size={16} />}
                onClick={handleSave}
                size="lg"
                disabled={saving || obGrandTotal === 0}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {saving ? t('dispatch.saving') : editId ? t('dispatch.updateOB') : t('dispatch.saveOB')}
              </Button>
            </div>
          </>
        )}

        {/* ════════════════════════════════════════════════════════════════
            DISPATCH / RETURN FORM
        ════════════════════════════════════════════════════════════════ */}
        {!isOB && (
          <>
            {/* ── Bill Information ──────────────────────────────────────── */}
            <Card title={t('dispatch.billInfo')} subtitle={t('dispatch.billSubtitle')}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label={t('dispatch.billNumber')}
                  value={form.billNumber}
                  onChange={(e) => setF('billNumber', e.target.value)}
                  error={formErrors.billNumber}
                  placeholder="e.g. BILL-001"
                />
                <Input
                  label={t('dispatch.date')}
                  type="date"
                  value={form.entryDate}
                  onChange={(e) => setF('entryDate', e.target.value)}
                  error={formErrors.entryDate}
                />
              </div>
            </Card>

            {/* ── Customer ──────────────────────────────────────────────── */}
            <Card title={t('dispatch.customerDetails')} subtitle={t('dispatch.customerSubtitle')}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Select
                    label={t('dispatch.customerSel')}
                    value={form.customerId}
                    onChange={(e) => setF('customerId', e.target.value)}
                    options={customerOpts}
                    placeholder="— Select Customer —"
                    error={formErrors.customerId}
                  />
                </div>
                {form.customerId && (() => {
                  const c = customers.find((x) => x.id === form.customerId);
                  return c ? (
                    <div className="sm:col-span-2 bg-blue-50 rounded-xl px-4 py-3 text-sm text-blue-800 flex gap-6 flex-wrap">
                      <span className="flex items-center gap-1"><User size={13} /> {c.customerName}</span>
                      <span>{c.shopName}</span>
                      <span>📞 {c.mobile}</span>
                    </div>
                  ) : null;
                })()}
              </div>
            </Card>

            {/* ── Box Movement ──────────────────────────────────────────── */}
            <Card
              title={t('dispatch.boxMovement')}
              subtitle={
                isReturn
                  ? `${t('dispatch.return')}${' — '}${t('dispatch.balanceFormula')}`
                  : `${t('dispatch.dispatch')}${' — '}${t('dispatch.balanceFormula')}`
              }
            >
              <div className="mb-4 flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 text-xs text-blue-800 font-medium">
                <span>📐</span>
                <span>
                  {t('dispatch.balanceFormula')}
                  <span className="ml-2 text-blue-600">
                    = {cumulativeSent} + {parseInt(form.currentQuantity) || 0} − {parseInt(form.boxesReturned) || 0}
                    {' '}= <strong className="text-blue-900">{balanceBoxes}</strong>
                  </span>
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">{t('dispatch.totalAlreadySent')}</label>
                  <div className="flex items-center justify-center h-[38px] px-3 rounded-lg border-2 font-extrabold text-lg border-blue-300 bg-blue-50 text-blue-800">
                    {cumulativeSent}
                  </div>
                  <p className="text-xs text-gray-500 text-center">
                    {form.customerId ? t('dispatch.cumulativeDesc') : t('dispatch.selectCustomer')}
                  </p>
                  <input type="hidden" value={cumulativeSent} />
                </div>
                <Input
                  label={isReturn ? t('dispatch.currentQtyReturn') : t('dispatch.currentQtySent')}
                  type="number"
                  min={isReturn ? '0' : '1'}
                  value={form.currentQuantity}
                  onChange={(e) => setF('currentQuantity', e.target.value)}
                  error={formErrors.currentQuantity}
                  placeholder="0"
                  hint={isReturn ? t('dispatch.returnHint') : t('dispatch.currentQtySentHint')}
                />
                <Input
                  label={isReturn ? t('dispatch.boxesReturnedReq') : t('dispatch.boxesReturned')}
                  type="number"
                  min="0"
                  value={form.boxesReturned}
                  onChange={(e) => setF('boxesReturned', e.target.value)}
                  error={formErrors.boxesReturned}
                  placeholder="0"
                  hint={isReturn ? t('dispatch.returnedReqHint') : t('dispatch.returnedHint')}
                />
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">{t('dispatch.balanceBoxes')}</label>
                  <div className={`flex items-center justify-center h-[38px] px-3 rounded-lg border-2 font-extrabold text-lg ${
                    balanceBoxes > 0
                      ? 'border-amber-400 bg-amber-50 text-amber-800'
                      : 'border-green-400 bg-green-50 text-green-700'
                  }`}>
                    {balanceBoxes}
                  </div>
                  <p className="text-xs text-gray-500 text-center">
                    {balanceBoxes === 0 ? `✅ ${t('dispatch.allReturned')}` : `⚠ ${balanceBoxes} ${t('dispatch.outstanding')}`}
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <TextArea
                  label={t('dispatch.description')}
                  value={form.description}
                  onChange={(e) => setF('description', e.target.value)}
                  placeholder={
                    isReturn
                      ? t('dispatch.descReturn')
                      : t('dispatch.descDispatch')
                  }
                  rows={2}
                />
              </div>
            </Card>

            {/* ── Logistics ─────────────────────────────────────────────── */}
            <Card title={t('dispatch.logistics')} subtitle={t('dispatch.logisticsSub')}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label={t('dispatch.driverName')}
                  value={form.driverName}
                  onChange={(e) => setF('driverName', e.target.value)}
                  placeholder={t('dispatch.driverName')}
                />
                <Input
                  label={t('dispatch.vehicleNumber')}
                  value={form.vehicleNumber}
                  onChange={(e) => setF('vehicleNumber', e.target.value)}
                  placeholder="e.g. TN-01-AB-1234"
                />
              </div>
            </Card>

            {/* ── External Source ───────────────────────────────────────── */}
            <Card title={t('dispatch.externalSource')} subtitle={t('dispatch.externalSub')}>
              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={form.isExternalSource}
                    onChange={(e) => setF('isExternalSource', e.target.checked)}
                    className="w-4 h-4 accent-blue-700"
                  />
                  <span className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                    <ExternalLink size={14} />
                    {t('dispatch.externalCheckbox')}
                  </span>
                </label>
                {form.isExternalSource && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <Select
                      label={t('dispatch.invSource')}
                      value={form.sourceId}
                      onChange={(e) => setF('sourceId', e.target.value)}
                      options={sourceOpts}
                      placeholder="— Select Source —"
                      error={formErrors.sourceId}
                    />
                    <Input
                      label={t('dispatch.extBoxCount')}
                      type="number"
                      min="0"
                      value={form.externalBoxCount}
                      onChange={(e) => setF('externalBoxCount', e.target.value)}
                      placeholder={t('dispatch.extBoxHint')}
                    />
                  </div>
                )}
              </div>
            </Card>

            {/* ── Info notice ───────────────────────────────────────────── */}
            <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-800">
              <span className="text-lg">📋</span>
              <p dangerouslySetInnerHTML={{ __html: t('dispatch.receiptNotice') }} />
            </div>

            {/* ── Actions ───────────────────────────────────────────────── */}
            <div className="flex justify-end gap-3 pb-6">
              <Button variant="secondary" onClick={() => navigate(-1)}>{t('dispatch.cancel')}</Button>
              <Button
                icon={<Save size={16} />}
                onClick={handleSave}
                size="lg"
                disabled={saving}
              >
                {saving ? t('dispatch.saving') : editId ? t('dispatch.saveChanges') : t('dispatch.save')}
              </Button>
            </div>
          </>
        )}
      </div>

      {/* ── Customer Receipt Preview Modal ─────────────────────────────────── */}
      <ReceiptPreviewModal
        open={receiptOpen}
        entry={receiptEntry}
        customer={receiptCustomer}
        onClose={handleReceiptClose}
      />
    </>
  );
};
