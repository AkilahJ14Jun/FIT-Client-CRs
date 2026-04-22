// FIT – Box Dispatch / Return / Opening Balance Entry Form

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Save, ArrowLeft, User, ExternalLink, Building2, Layers, Plus, Trash2 } from 'lucide-react';
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
  { value: 'opening_balance', label: 'Stock Position' },
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
  externalSourceRows: DispatchSourceRow[];
}

interface DispatchSourceRow {
  id:       string;
  sourceId: string;
  boxCount: string;
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




// ─────────────────────────────────────────────────────────────────────────────
function newSourceRow(): OBSourceRow {
  return { id: crypto.randomUUID(), sourceId: '', quantity: '' };
}

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
    isExternalSource: true,
    externalSourceRows: [{ id: crypto.randomUUID(), sourceId: '', boxCount: '' }],
  });
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof DispatchFormState, string>>>({});
  const [varietyStock, setVarietyStock] = useState<Record<string, number>>({});

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
  // Fetch fresh bill number whenever entry type changes (or on first load)
  useEffect(() => {
    if (editId) return;
    // Dispatch/Return get prefix; Stock Position gets plain 6-digit
    EntryDB.nextBillNumber(entryType).then((bill) => {
      if (entryType === 'opening_balance') {
        setOb((o) => ({ ...o, billNumber: bill }));
      } else {
        setForm((f) => ({ ...f, billNumber: bill }));
      }
    });
  }, [editId, entryType]);

  const loadVarietyStock = useCallback(async () => {
    const live = await EntryDB.getLiveStockPosition();
    const stockMap: Record<string, number> = {};
    live.liveSources.forEach(s => {
      stockMap[s.sourceId] = s.quantity;
    });
    setVarietyStock(stockMap);
  }, []);

  useEffect(() => {
    loadVarietyStock();
  }, [loadVarietyStock]);

  // ── Load live stock position when switching to Stock Position for new entries ──
  useEffect(() => {
    if (editId) return;
    if (entryType !== 'opening_balance') return;
    EntryDB.getLiveStockPosition().then((live) => {
      if (!live.entry) return; // No stock position exists yet
      setOb((o) => {
        // Only pre-fill if the form is currently empty (user just switched tabs)
        const hasValues = o.companyOwnQuantity !== '' || o.sourceRows.length > 0;
        if (hasValues) return o;
        return {
          ...o,
          companyOwnQuantity: String(live.liveCompanyQty),
          sourceRows: live.liveSources.map((s) => ({
            id: crypto.randomUUID(), sourceId: s.sourceId, quantity: String(s.quantity),
          })),
        };
      });
    });
  }, [editId, entryType]);

  // ── Receipt preview ───────────────────────────────────────────────────────
  const [saving,          setSaving]          = useState(false);
  const [receiptOpen,     setReceiptOpen]     = useState(false);
  const [receiptEntry,    setReceiptEntry]    = useState<BoxEntry | null>(null);
  const [receiptCustomer, setReceiptCustomer] = useState<Customer | null>(null);

  // ── Live stock position (overall status, independent of form values) ──
  const [liveStock, setLiveStock] = useState<{
    liveCompanyQty: number;
    liveSources: Array<{ sourceId: string; sourceName: string; quantity: number }>;
    liveTotal: number;
  } | null>(null);

  const isOB     = entryType === 'opening_balance';
  const isReturn = entryType === 'return';

  // ── Fetch overall live stock whenever Stock Position is selected ────
  useEffect(() => {
    if (entryType !== 'opening_balance') return;
    EntryDB.getLiveStockPosition().then((live) => {
      setLiveStock(live.entry ? {
        liveCompanyQty: live.liveCompanyQty,
        liveSources: live.liveSources,
        liveTotal: live.liveTotal,
      } : null);
    });
  }, [entryType]);

  // ── Load existing entry for edit ──────────────────────────────────────────
  useEffect(() => {
    if (!editId) return;
    EntryDB.getById(editId).then(async (entry) => {
      if (!entry) return;
      setEntryType(entry.entryType);
      if (entry.entryType === 'opening_balance') {
        // CR5: Always load LIVE stock counts (original minus all dispatches/returns since)
        const live = await EntryDB.getLiveStockPosition();
        setOb({
          billNumber:         entry.billNumber,
          entryDate:          entry.entryDate,
          description:        entry.description,
          companyOwnQuantity: String(live.liveCompanyQty),
          sourceRows: live.liveSources.map((s) => ({
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
          isExternalSource: entry.isExternalSource,
          externalSourceRows: (entry.openingStockSources && entry.openingStockSources.length > 0)
            ? entry.openingStockSources.map((s) => ({
                id: crypto.randomUUID(),
                sourceId: s.sourceId,
                boxCount: String(s.quantity),
              }))
            : (entry.isExternalSource && entry.sourceId ? [{
                id: crypto.randomUUID(),
                sourceId: entry.sourceId,
                boxCount: String(entry.externalBoxCount ?? ''),
              }] : []),
        });
      }
    });
  }, [editId]);

  const [historicalSummary, setHistoricalSummary] = useState<{
    cumulativeBalance: number;
    varietyTotals: Record<string, number>;
  }>({ cumulativeBalance: 0, varietyTotals: {} });

  // ── Auto-populate totalBoxesSent when customer is selected ─────────────────
  const selectedCustomer = customers.find(c => c.id === form.customerId);
  const [tempInitialTotal, setTempInitialTotal] = useState<string>('0');

  useEffect(() => {
    if (form.customerId) {
      CustomerDB.getHistorySummary(form.customerId, editId ? form.billNumber : undefined).then(summary => {
        setHistoricalSummary(summary);
        setTempInitialTotal(String(summary.cumulativeBalance));
      });
    } else {
      setHistoricalSummary({ cumulativeBalance: 0, varietyTotals: {} });
      setTempInitialTotal('0');
    }
  }, [form.customerId, editId, form.billNumber]);

  const cumulativeSent = parseInt(tempInitialTotal) || 0;

  // ── Balance Boxes (Dispatch / Return) ─────────────────────────────────────
  const balanceBoxes = useMemo(() => {
    // Calculate effective current quantity from variety rows
    const varietyTotal = form.externalSourceRows.reduce((s, r) => s + (parseInt(r.boxCount) || 0), 0);
    
    // Total balance = (History Sent) + (Current Dispatched) - (Returned Today)
    const totalSent = cumulativeSent + varietyTotal;
    const returned = parseInt(form.boxesReturned) || 0;
    
    return Math.max(0, totalSent - returned);
  }, [cumulativeSent, form.boxesReturned, form.externalSourceRows]);

  // ── Opening Balance computed totals ───────────────────────────────────────
  const obSourceRows = ob.sourceRows;
  const obSourceTotal = obSourceRows.reduce((s, r) => s + (parseInt(r.quantity) || 0), 0);
  const obCompanyQty = obSourceTotal; // Calculated from varieties
  const obGrandTotal  = obCompanyQty;

  // ── Helpers ───────────────────────────────────────────────────────────────
  const setF = (key: keyof DispatchFormState, value: string | boolean) =>
    setForm((p) => ({ ...p, [key]: value }));

  const setObField = (key: keyof Omit<OBFormState, 'sourceRows'>, value: string) =>
    setOb((p) => ({ ...p, [key]: value }));

  const addSourceRow = () =>
    setOb((p) => ({ ...p, sourceRows: [...p.sourceRows, newSourceRow()] }));

  const updateSourceRow = (id: string, field: 'sourceId' | 'quantity', value: string) =>
    setOb((p) => ({
      ...p,
      sourceRows: p.sourceRows.map((r) => r.id === id ? { ...r, [field]: value } : r),
    }));

  const removeSourceRow = (id: string) =>
    setOb((p) => ({ ...p, sourceRows: p.sourceRows.filter((r) => r.id !== id) }));

  // ── Validate Dispatch / Return ────────────────────────────────────────────
  const validateDispatch = (): boolean => {
    const e: Partial<Record<keyof DispatchFormState, string>> = {};
    if (!form.entryDate)         e.entryDate   = 'Date is required';
    if (!form.customerId)        e.customerId  = 'Customer is required';
    
    // Auto-calculate currentQuantity for validation
    const calculatedOwnQty = form.externalSourceRows.reduce((s, r) => s + (parseInt(r.boxCount) || 0), 0);
    
    if (isReturn) {
      if (!form.boxesReturned || parseInt(form.boxesReturned) <= 0)
        e.boxesReturned = 'Enter number of boxes returned (must be > 0)';
    } else {
      if (calculatedOwnQty <= 0)
        e.currentQuantity = 'Quantity sent is required (must be > 0)';
    }
    if (parseInt(form.boxesReturned) < 0) e.boxesReturned = 'Cannot be negative';
    if (form.isExternalSource || true) { // Variety details are now preferred
      form.externalSourceRows.forEach((r, i) => {
        if (!r.sourceId)                       e[`ext_src_${i}_id`]   = 'Select a variety';
        if (!r.boxCount || parseInt(r.boxCount) <= 0) e[`ext_src_${i}_count`] = 'Enter quantity > 0';
      });
    }
    setFormErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Validate Opening Balance ──────────────────────────────────────────────
  const validateOB = (): boolean => {
    const e: Record<string, string> = {};
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

      const extSourceRows = form.externalSourceRows.map((r) => {
            const src = sources.find((s) => s.id === r.sourceId);
            return { sourceId: r.sourceId, sourceName: src?.sourceName ?? 'Unknown', quantity: parseInt(r.boxCount) || 0 };
          }).filter((s) => s.quantity > 0);
      
      const calculatedOwnQty = extSourceRows.reduce((s, r) => s + r.quantity, 0);
      const numCurrentQty = calculatedOwnQty;
      const numReturned   = parseInt(form.boxesReturned)   || 0;
      const numTotalSent  = cumulativeSent;
      const computedBal   = Math.max(0, numTotalSent + numCurrentQty - numReturned);

      const payload: Omit<BoxEntry, 'id' | 'createdAt' | 'updatedAt'> = {
        billNumber: form.billNumber.trim(), entryDate: form.entryDate,
        customerId: form.customerId, customerName: customer?.customerName, shopName: customer?.shopName,
        description: form.description.trim(), entryType: form.entryType as BoxEntry['entryType'],
        totalBoxesSent: numTotalSent, currentQuantity: numCurrentQty,
        boxesReturned: numReturned, balanceBoxes: computedBal,
        driverName: form.driverName.trim(), vehicleNumber: form.vehicleNumber.trim(),
        isExternalSource: true, // Always treating as variety-based now
        openingStockSources: extSourceRows.length > 0 ? extSourceRows : undefined,
      };

      const savedEntry = editId
        ? await EntryDB.update(editId, payload) as BoxEntry
        : await EntryDB.create(payload);

      // CR6: Update stock position entry to reflect this dispatch/return
      if (savedEntry) {
        await EntryDB.updateStockPositionAfterEntry(savedEntry);
      }

      // Persist the updated sent count to the backend
      if (customer && savedEntry && !editId) {
        // CR6/CR FIX: Update the customer's LIVE balance (Sent - Returned)
        const newCount = Math.max(0, cumulativeSent + numCurrentQty - numReturned);
        await CustomerDB.update(customer.id, { totalSentCount: newCount });
        // Update local state
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
                  onChange={() => {}}
                  readOnly
                  className="bg-gray-50 cursor-not-allowed"
                  hint={t('dispatch.billAutoHint')}
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

            {/* Company Own Stock card removed as variety detail is the sole source of truth */}

            {/* External Sources */}
            <Card
              title={t('dispatch.otherSources')}
              subtitle={t('dispatch.otherSourcesSub')}
            >
              {ob.sourceRows.length > 0 && (
                <>
                  <div className="flex flex-row items-center gap-3 py-2 mb-2 border-b border-gray-200">
                    <span className="flex-1 text-xs font-semibold text-gray-500 uppercase tracking-wide font-mono text-gray-400"># {t('src.srcName')}</span>
                    <span className="w-32 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right translate-x-5">{t('dispatch.extBoxCount')}</span>
                    <span className="w-9"></span>
                  </div>
                  {ob.sourceRows.map((row) => {
                    const isNewRow = row.sourceId === '';
                    const availableSources = sources.filter(
                      (s) => s.id === row.sourceId || !ob.sourceRows.some((r) => r.sourceId === s.id),
                    );
                    const src = sources.find((s) => s.id === row.sourceId);
                    const displayName = src?.sourceName ?? (isNewRow ? '' : 'Unknown');
                    return (
                      <div key={row.id} className="flex flex-row items-center gap-3 py-2.5 border-b border-gray-100 last:border-b-0">
                        <div className="flex-1 min-w-0">
                          {isNewRow ? (
                            <select
                              value={row.sourceId}
                              onChange={(e) => updateSourceRow(row.id, 'sourceId', e.target.value)}
                              className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">— {t('dispatch.addSource')} —</option>
                              {availableSources.map((s) => (
                                <option key={s.id} value={s.id}>{s.sourceName}</option>
                              ))}
                            </select>
                          ) : (
                            <span className="text-sm text-gray-700 font-medium truncate block">{displayName}</span>
                          )}
                        </div>
                        <input
                          type="text"
                          value={row.quantity}
                          onKeyDown={(e) => {
                            if (['e', 'E', '.', '-', '+'].includes(e.key)) e.preventDefault();
                          }}
                          onChange={(e) => updateSourceRow(row.id, 'quantity', e.target.value.replace(/[^0-9]/g, ''))}
                          className="w-32 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-right font-bold text-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-indigo-50/30"
                          placeholder="0"
                        />
                        <button
                          type="button"
                          onClick={() => removeSourceRow(row.id)}
                          tabIndex={-1}
                          className="w-9 h-9 flex items-center justify-center text-red-300 hover:text-red-500 hover:bg-red-50 rounded-lg flex-shrink-0 focus:outline-none transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    );
                  })}
                </>
              )}

              <Button variant="secondary" size="sm" icon={<Plus size={15} />} onClick={addSourceRow} className="mt-3">
                {t('dispatch.addSource')}
              </Button>
            </Card>

            {/* ── Overall Stock Status ────────────────────────────────────── */}
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
                      <th className="text-right px-4 py-3 font-semibold">Remaining (Boxes)</th>
                    </tr>
                  </thead>
                  <tbody>

                    {/* Source rows from form */}
                    {ob.sourceRows.length > 0 ? ob.sourceRows.map((row) => {
                      const src = sources.find((s) => s.id === row.sourceId);
                      const displayName = src?.sourceName ?? 'Unknown';
                      const rowQty = parseInt(row.quantity) || 0;
                      return (
                        <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-4 py-3 text-gray-700 flex items-center gap-2">
                            <Layers size={14} className="text-indigo-500" />
                            {displayName}
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                              {t('dispatch.externalSrc')}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-gray-800">
                            {rowQty}
                          </td>
                        </tr>
                      );
                    }) : (
                      <tr className="border-b border-gray-100">
                        <td colSpan={3} className="px-4 py-3 text-center text-gray-400 text-xs italic">
                          {t('dispatch.noExtSources')}
                        </td>
                      </tr>
                    )}
                  </tbody>

                  {/* Totals footer */}
                  <tfoot>
                    {/* Grand total */}
                    <tr className="bg-emerald-600 text-white">
                      <td colSpan={2} className="px-4 py-3 font-extrabold text-sm uppercase tracking-wider">
                        Overall Stock Position
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
                  onChange={() => {}}
                  readOnly
                  className="bg-gray-50 cursor-not-allowed"
                  hint={t('dispatch.billAutoHintPrefixed')}
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
                      <div className="flex gap-4">
                        <span>📞 {c.mobile}</span>
                        {c.alternateMobile && (
                          <span className="text-blue-600 opacity-80">📱 Alt: {c.alternateMobile}</span>
                        )}
                      </div>
                    </div>
                  ) : null;
                })()}
              </div>
            </Card>

            {/* ── Box Movement ──────────────────────────────────────────── */}
            <Card
              title={t('dispatch.boxMovement')}
              subtitle={isReturn ? t('dispatch.return') : t('dispatch.dispatch')}
            >


              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">{t('dispatch.totalAlreadySent')}</label>
                  <input
                    type="number"
                    min="0"
                    value={tempInitialTotal}
                    onKeyDown={(e) => {
                      if (['e', 'E', '.', '-', '+'].includes(e.key)) e.preventDefault();
                    }}
                    readOnly={true}
                    className="flex items-center justify-center h-[38px] px-3 rounded-lg border-2 font-extrabold text-lg transition-all border-blue-300 bg-blue-50 text-blue-800 cursor-not-allowed opacity-80"
                  />
                  <p className="text-xs text-gray-500 text-center">
                    {isReturn && cumulativeSent === 0 
                      ? "Empty balance: cannot return boxes"
                      : (selectedCustomer?.totalSentCount ?? 0) === 0 
                        ? "First-time entry: you can set the initial total"
                        : t('dispatch.cumulativeDesc')}
                  </p>
                </div>
                {/* Removing own inventory qty as requested */}
                  <Input
                    label={isReturn ? t('dispatch.boxesReturnedReq') : t('dispatch.boxesReturned')}
                    type="number"
                    min="0"
                    value={form.boxesReturned}
                    onKeyDown={(e) => {
                      if (['e', 'E', '.', '-', '+'].includes(e.key)) e.preventDefault();
                    }}
                    onChange={(e) => setF('boxesReturned', e.target.value.replace(/[^0-9]/g, ''))}
                    readOnly={cumulativeSent === 0}
                    className={cumulativeSent === 0 ? 'bg-gray-50 opacity-80' : ''}
                    error={formErrors.boxesReturned}
                    placeholder="0"
                    hint={cumulativeSent === 0 ? "No boxes were ever sent to this customer" : (isReturn ? t('dispatch.returnedReqHint') : t('dispatch.returnedHint'))}
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

            {/* ── External Source (Dispatch only, not Return) ─────────── */}
            {!isReturn && (
              <Card title={t('dispatch.externalSource')} subtitle={t('dispatch.externalSub')}>
                <div className="space-y-4">
                  <div className="space-y-2">
                      {form.externalSourceRows.length > 0 && (
                        <>
                          <div className="flex flex-row items-center gap-3 py-2 mb-2 border-b border-gray-200">
                            <span className="flex-1 text-xs font-semibold text-gray-500 uppercase tracking-wide font-mono text-gray-400"># {t('src.srcName')}</span>
                            <span className="w-32 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right translate-x-5">{t('dispatch.extBoxCount')}</span>
                            <span className="w-9"></span>
                          </div>

                          {/* Historical Varieties (Read-Only) */}
                          {Object.entries(historicalSummary.varietyTotals)
                            .filter(([_, count]) => count > 0)
                            .map(([srcId, count]) => {
                              const s = sources.find(src => src.id === srcId);
                              return (
                                <div key={`hist-${srcId}`} className="flex flex-row items-center gap-3 py-1.5 opacity-80 bg-blue-50/30 rounded-lg px-2 mb-1 border border-blue-100/50">
                                  <span className="flex-1 text-sm text-blue-700/70 font-medium">
                                    {s?.sourceName || 'Unknown'} <span className="text-[10px] uppercase font-bold ml-2 opacity-60">({t('entries.colAlreadySent')})</span>
                                  </span>
                                  <span className="w-32 text-sm font-black text-blue-800 text-right pr-2">{count}</span>
                                  <div className="w-9 flex justify-center">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-300"></div>
                                  </div>
                                </div>
                              );
                            })
                          }

                          {/* Divider if there is history */}
                          {Object.values(historicalSummary.varietyTotals).some(c => c > 0) && (
                            <div className="my-4 border-t border-dashed border-gray-200"></div>
                          )}
                          {form.externalSourceRows.map((row, idx) => {
                            const isNewRow = row.sourceId === '';
                            // CR FIX: Filter out zero stock items only for Dispatch mode
                            const availableSources = sources.filter(
                              (s) => {
                                const isAlreadyUsed = form.externalSourceRows.some((r, i) => i !== idx && r.sourceId === s.id);
                                if (isAlreadyUsed) return false;
                                if (entryType === 'dispatch') {
                                  return (varietyStock[s.id] || 0) > 0;
                                }
                                return true;
                              }
                            );
                            const src = sources.find((s) => s.id === row.sourceId);
                            const displayName = src?.sourceName ?? (isNewRow ? '' : 'Unknown');
                            const stock = varietyStock[row.sourceId] || 0;
                            const threshold = src?.stockThreshold || 0;
                            const isLow = stock <= threshold;
                            
                            return (
                            <div key={row.id} className="py-1 border-b border-gray-100 last:border-b-0">
                              <div className="flex flex-row items-center gap-3 py-2">
                                <div className="flex-1 min-w-0">
                                  {isNewRow ? (
                                      <select
                                        value={row.sourceId}
                                        onChange={(e) => {
                                          const rows = [...form.externalSourceRows];
                                          rows[idx] = { ...row, sourceId: e.target.value, boxCount: '0' };
                                          setForm(p => ({ ...p, externalSourceRows: rows }));
                                        }}
                                        className={`w-full rounded-lg border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                          formErrors[`ext_src_${idx}_id`] ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                      >
                                        <option value="">— {t('dispatch.invSource').replace('*', '').trim()} —</option>
                                        {availableSources.map((s) => (
                                          <option key={s.id} value={s.id}>{s.sourceName}</option>
                                        ))}
                                      </select>
                                  ) : (
                                    <span className="text-sm text-gray-700 font-medium truncate block">{displayName}</span>
                                  )}
                                </div>
                                <input
                                  type="text"
                                  value={row.boxCount}
                                  disabled={!row.sourceId}
                                  onKeyDown={(e) => {
                                    if (['e', 'E', '.', '-', '+'].includes(e.key)) e.preventDefault();
                                  }}
                                  onChange={(e) => {
                                    const val = e.target.value.replace(/[^0-9]/g, '');
                                    const numVal = parseInt(val) || 0;
                                    const finalVal = numVal > stock ? stock.toString() : val;
                                    const rows = [...form.externalSourceRows];
                                    rows[idx] = { ...row, boxCount: finalVal };
                                    setForm(p => ({ ...p, externalSourceRows: rows }));
                                  }}
                                  className={`w-32 rounded-lg border px-3 py-1.5 text-sm text-right font-bold text-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                    !row.sourceId ? 'bg-gray-50 cursor-not-allowed' : 'bg-indigo-50/30'
                                  } ${formErrors[`ext_src_${idx}_count`] ? 'border-red-500' : 'border-gray-300'}`}
                                  placeholder="0"
                                />
                                {form.externalSourceRows.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setForm(p => ({
                                        ...p,
                                        externalSourceRows: p.externalSourceRows.filter((r) => r.id !== row.id),
                                      }))
                                    }
                                    tabIndex={-1}
                                    className="w-9 h-9 flex items-center justify-center text-red-300 hover:text-red-500 hover:bg-red-50 rounded-lg flex-shrink-0 focus:outline-none transition-colors"
                                    title="Remove"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                )}
                              </div>
                              {row.sourceId && (
                                <div className="flex justify-between px-1">
                                  <div className="text-[10px] text-gray-400">
                                    {isLow && stock > 0 && <span className="text-amber-500 font-semibold italic">Low Stock Alert!</span>}
                                  </div>
                                  <div className={`text-xs font-bold ${isLow ? 'animate-blink-red' : 'text-emerald-600'}`}>
                                    Available: {stock} boxes
                                  </div>
                                </div>
                              )}
                            </div>
                            );
                          })}
                          {form.externalSourceRows.reduce((s, r) => s + (parseInt(r.boxCount) || 0), 0) > 0 && (
                            <div className="text-right text-sm text-gray-600 font-medium">
                              {t('dispatch.currentQtySent')}: <span className="text-indigo-700 font-semibold">{form.externalSourceRows.reduce((s, r) => s + (parseInt(r.boxCount) || 0), 0)}</span>
                            </div>
                          )}
                        </>
                      )}
                      <Button variant="secondary" size="sm" icon={<Plus size={15} />} onClick={() =>
                        setForm(p => ({
                          ...p,
                          externalSourceRows: [...p.externalSourceRows, {
                            id: crypto.randomUUID(),
                            sourceId: '',
                            boxCount: '',
                          }],
                        }))
                      } className="mt-3">
                        {t('dispatch.addSource')}
                      </Button>
                    </div>
                </div>
              </Card>
            )}

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
