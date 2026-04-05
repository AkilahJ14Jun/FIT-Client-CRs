import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Pencil, Trash2, RotateCcw, Search, X,
  Users, Database, Package, MapPin, Settings as SettingsIcon,
  AlertTriangle
} from 'lucide-react';
import {
  CustomerDB, SourceDB, AreaDB, EntryDB, SettingsDB,
  type Customer, type InventorySource, type CustomerArea, type BoxEntry, type AppSettings,
} from '../db/database';
import { useAuth } from '../auth/AuthContext';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { ConfirmModal } from '../components/ui/Modal';
import { format } from 'date-fns';

type TabId = 'customers' | 'areas' | 'sources' | 'entries' | 'settings';

interface TabDef { id: TabId; label: string; icon: React.ReactNode }

const TAB_ITEMS: Record<TabId, { singular: string; plural: string }> = {
  customers: { singular: 'Customer', plural: 'Customers' },
  areas: { singular: 'Customer Area', plural: 'Areas' },
  sources: { singular: 'Inventory Source', plural: 'Sources' },
  entries: { singular: 'Box Entry', plural: 'Entries' },
  settings: { singular: 'Setting', plural: 'Settings' },
};

const ENTRY_TYPE_LABEL: Record<string, string> = {
  opening_balance: 'Stock Position', dispatch: 'Dispatch', return: 'Return',
};

const ENTRY_TYPE_BADGE: Record<string, 'blue' | 'yellow' | 'green' | 'orange' | 'purple' | 'gray'> = {
  dispatch: 'blue', return: 'green', opening_balance: 'yellow',
};

export const AdminData: React.FC = () => {
  const [tab, setTab] = useState<TabId>('customers');
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // Data collections
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [areas, setAreas] = useState<CustomerArea[]>([]);
  const [sources, setSources] = useState<InventorySource[]>([]);
  const [entries, setEntries] = useState<BoxEntry[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, string | number | boolean>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [c, a, s, e, st] = await Promise.all([
        CustomerDB.getAll(), AreaDB.getAll(), SourceDB.getAll(), EntryDB.getAll(), SettingsDB.get(),
      ]);
      setCustomers(c); setAreas(a); setSources(s); setEntries(e); setSettings(st);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const TABS: TabDef[] = [
    { id: 'customers', label: 'Customers', icon: <Users size={15} /> },
    { id: 'areas', label: 'Areas', icon: <MapPin size={15} /> },
    { id: 'sources', label: 'Sources', icon: <Database size={15} /> },
    { id: 'entries', label: 'Entries', icon: <Package size={15} /> },
    { id: 'settings', label: 'Settings', icon: <SettingsIcon size={15} /> },
  ];

  const itemsCount = {
    customers: customers.length, areas: areas.length,
    sources: sources.length, entries: entries.length, settings: settings ? 1 : 0,
  };

  // ── Row deletion ──
  const handleDelete = async (id: string) => {
    try {
      if (tab === 'customers') await CustomerDB.delete(id);
      else if (tab === 'areas') await AreaDB.delete(id);
      else if (tab === 'sources') await SourceDB.delete(id);
      else if (tab === 'entries') await EntryDB.delete(id);
      showToast(`${TAB_ITEMS[tab].singular} deleted`);
      setDeleteTarget(null);
      await loadData();
    } catch {
      showToast('Delete failed');
    }
  };

  // ── Open create / edit form ──
  const openForm = (item?: Record<string, unknown>) => {
    if (item && item.id) {
      setEditingId(item.id as string);
      const r: Record<string, string | number | boolean> = {};
      for (const [k, v] of Object.entries(item)) {
        r[k] = v === null ? '' : v as string | number | boolean;
      }
      setForm(r);
    } else {
      setEditingId(null);
      setForm({});
    }
    setFormErrors({});
    setShowForm(true);
  };

  const closeForm = () => { setShowForm(false); setEditingId(null); setForm({}); setFormErrors({}); };

  const setF = (key: string, value: string | number | boolean) => { setForm(p => ({ ...p, [key]: value })); };
  const fv = (key: string): string => String(form[key] ?? '');

  // ── Form submission ──
  const handleSubmit = async () => {
    setFormErrors({});
    const errors: Record<string, string> = {};

    if (tab === 'customers') {
      if (!form.customerName) errors.customerName = 'Required';
      if (!form.mobile) errors.mobile = 'Required';
    } else if (tab === 'areas') {
      if (!form.areaName) errors.areaName = 'Required';
    } else if (tab === 'sources') {
      if (!form.sourceName) errors.sourceName = 'Required';
    } else if (tab === 'entries') {
      if (!form.billNumber) errors.billNumber = 'Required';
      if (!form.entryDate) errors.entryDate = 'Required';
      if (!form.customerId) errors.customerId = 'Required';
    }

    if (Object.keys(errors).length > 0) { setFormErrors(errors); return; }

    try {
      if (tab === 'customers') {
        const payload: any = {
          customerName: form.customerName as string, shopName: fv('shopName'),
          address: fv('address'), mobile: form.mobile as string, email: fv('email'), notes: fv('notes'),
          areaId: fv('areaId') || undefined, totalSentCount: Number(form.totalSentCount) || 0,
          isActive: (form.isActive as boolean) !== false,
        };
        if (editingId) { await CustomerDB.update(editingId, payload); }
        else { await CustomerDB.create(payload); }
      } else if (tab === 'areas') {
        const payload = {
          areaName: form.areaName as string, notes: fv('notes'),
          isActive: (form.isActive as boolean) !== false,
        };
        if (editingId) { await AreaDB.update(editingId, payload); }
        else { await AreaDB.create(payload); }
      } else if (tab === 'sources') {
        const payload = {
          sourceName: form.sourceName as string, contactPerson: fv('contactPerson'),
          mobile: fv('mobile'), address: fv('address'), notes: fv('notes'),
          isActive: (form.isActive as boolean) !== false,
        };
        if (editingId) { await SourceDB.update(editingId, payload); }
        else { await SourceDB.create(payload); }
      } else if (tab === 'entries') {
        const cust = customers.find(c => c.id === form.customerId);
        const entryType = fv('entryType') || 'dispatch';
        const payload = {
          billNumber: form.billNumber as string, entryDate: fv('entryDate'),
          customerId: form.customerId as string, customerName: cust?.customerName || '',
          shopName: cust?.shopName || '', description: fv('description'), entryType: entryType as BoxEntry['entryType'],
          totalBoxesSent: Number(form.totalBoxesSent) || 0, currentQuantity: Number(form.currentQuantity) || 0,
          boxesReturned: Number(form.boxesReturned) || 0,
          balanceBoxes: Math.max(0, Number(form.totalBoxesSent || 0) + Number(form.currentQuantity || 0) - Number(form.boxesReturned || 0)),
          driverName: fv('driverName'), vehicleNumber: fv('vehicleNumber'),
          isExternalSource: !!form.isExternalSource, sourceId: fv('sourceId') || undefined,
          sourceName: undefined, externalBoxCount: 0, companyOwnQuantity: 0,
        };
        if (editingId) { await EntryDB.update(editingId, payload); }
        else { await EntryDB.create(payload); }
      }
      showToast(`${TAB_ITEMS[tab].singular} ${editingId ? 'updated' : 'created'} successfully`);
      closeForm();
      await loadData();
    } catch (err) {
      showToast(`Failed: ${(err as Error).message}`);
    }
  };

  // ── Settings update ──
  const handleSaveSettings = async () => {
    if (!settings) return;
    await SettingsDB.save(settings);
    showToast('Settings saved');
  };

  // ── Filtered lists ──
  const filteredData = (): unknown[] => {
    const q = search.toLowerCase();
    const raw = tab === 'customers' ? customers : tab === 'areas' ? areas : tab === 'sources' ? sources : tab === 'entries' ? entries : [];
    if (!q) return raw;
    if (tab === 'customers') return customers.filter(c => c.customerName.toLowerCase().includes(q) || (c.shopName || '').toLowerCase().includes(q) || (c.mobile || '').includes(q));
    if (tab === 'areas') return areas.filter(a => a.areaName.toLowerCase().includes(q));
    if (tab === 'sources') return sources.filter(s => s.sourceName.toLowerCase().includes(q));
    if (tab === 'entries') return entries.filter(e => e.billNumber.toLowerCase().includes(q) || (e.customerName || '').toLowerCase().includes(q) || e.entryType.includes(q));
    return [];
  };

  // ── Toggle helper ──
  function isActive(val: boolean | undefined) { return val !== false; }
  function ToggleField({ value, onChange }: { value: boolean; onChange: () => void }) {
    return (
      <label className="flex items-center gap-3 cursor-pointer select-none pt-5">
        <div onClick={onChange} className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${value ? 'bg-emerald-500' : 'bg-gray-300'}`}>
          <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${value ? 'translate-x-6' : 'translate-x-0'}`} />
        </div>
        <span className="text-sm font-medium text-gray-700">Active</span>
      </label>
    );
  }

  // ── Form fields per tab ──
  const renderFormFields = () => {
    if (tab === 'customers') {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input label="Customer Name" value={fv('customerName')} onChange={e => setF('customerName', e.target.value)} placeholder="Name" error={formErrors.customerName} />
          <Input label="Shop Name" value={fv('shopName')} onChange={e => setF('shopName', e.target.value)} placeholder="Shop" />
          <Input label="Mobile" value={fv('mobile')} onChange={e => setF('mobile', e.target.value)} placeholder="Phone" error={formErrors.mobile} />
          <Input label="Email" value={fv('email')} onChange={e => setF('email', e.target.value)} placeholder="Email" />
          <Input label="Address" value={fv('address')} onChange={e => setF('address', e.target.value)} placeholder="Address" />
          <Input label="Total Sent Count" type="number" min="0" value={String(Number(form.totalSentCount) || 0)} onChange={e => setF('totalSentCount', e.target.value)} placeholder="0" />
          <Select label="Area" value={fv('areaId')} onChange={e => setF('areaId', e.target.value)} options={areas.filter(a => a.isActive !== false).map(a => ({ value: a.id, label: a.areaName }))} placeholder="— None —" />
          <Input label="Notes" value={fv('notes')} onChange={e => setF('notes', e.target.value)} placeholder="Notes" />
          <ToggleField value={isActive(form.isActive as boolean)} onChange={() => setF('isActive', !form.isActive)} />
        </div>
      );
    }
    if (tab === 'areas') {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input label="Area Name" value={fv('areaName')} onChange={e => setF('areaName', e.target.value)} placeholder="Area name" error={formErrors.areaName} />
          <Input label="Notes" value={fv('notes')} onChange={e => setF('notes', e.target.value)} placeholder="Notes" />
          <ToggleField value={isActive(form.isActive as boolean)} onChange={() => setF('isActive', !form.isActive)} />
        </div>
      );
    }
    if (tab === 'sources') {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input label="Source Name" value={fv('sourceName')} onChange={e => setF('sourceName', e.target.value)} placeholder="Source name" error={formErrors.sourceName} />
          <Input label="Contact Person" value={fv('contactPerson')} onChange={e => setF('contactPerson', e.target.value)} placeholder="Name" />
          <Input label="Mobile" value={fv('mobile')} onChange={e => setF('mobile', e.target.value)} placeholder="Phone" />
          <Input label="Address" value={fv('address')} onChange={e => setF('address', e.target.value)} placeholder="Address" />
          <Input label="Notes" value={fv('notes')} onChange={e => setF('notes', e.target.value)} placeholder="Notes" />
          <ToggleField value={isActive(form.isActive as boolean)} onChange={() => setF('isActive', !form.isActive)} />
        </div>
      );
    }
    if (tab === 'entries') {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input label="Bill Number" value={fv('billNumber')} onChange={e => setF('billNumber', e.target.value)} placeholder="BILL-000001" error={formErrors.billNumber} />
          <Input label="Date" type="date" value={fv('entryDate')} onChange={e => setF('entryDate', e.target.value)} error={formErrors.entryDate} />
          <Select label="Entry Type" value={fv('entryType')} onChange={e => setF('entryType', e.target.value)} options={[{ value: 'dispatch', label: 'Dispatch' }, { value: 'return', label: 'Return' }, { value: 'opening_balance', label: 'Stock Position' }]} />
          <Select label="Customer" value={fv('customerId')} onChange={e => setF('customerId', e.target.value)} options={customers.map(c => ({ value: c.id, label: `${c.customerName} — ${c.shopName}` }))} placeholder="— Select —" error={formErrors.customerId} />
          <Input label="Description" value={fv('description')} onChange={e => setF('description', e.target.value)} placeholder="Notes" />
          <Input label="Total Boxes Sent" type="number" min="0" value={String(Number(form.totalBoxesSent) || 0)} onChange={e => setF('totalBoxesSent', e.target.value)} placeholder="0" />
          <Input label="Current Quantity" type="number" min="0" value={String(Number(form.currentQuantity) || 0)} onChange={e => setF('currentQuantity', e.target.value)} placeholder="0" />
          <Input label="Boxes Returned" type="number" min="0" value={String(Number(form.boxesReturned) || 0)} onChange={e => setF('boxesReturned', e.target.value)} placeholder="0" />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Balance Boxes</label>
            <input readOnly value={String(Math.max(0, Number(form.totalBoxesSent || 0) + Number(form.currentQuantity || 0) - Number(form.boxesReturned || 0)))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-gray-50" />
          </div>
          <Input label="Driver Name" value={fv('driverName')} onChange={e => setF('driverName', e.target.value)} placeholder="Driver" />
          <Input label="Vehicle Number" value={fv('vehicleNumber')} onChange={e => setF('vehicleNumber', e.target.value)} placeholder="TN-01-AB-1234" />
          <label className="flex items-center gap-3 pt-5 cursor-pointer select-none">
            <input type="checkbox" checked={!!form.isExternalSource} onChange={e => setF('isExternalSource', e.target.checked)} className="w-4 h-4 accent-blue-700" />
            <span className="text-sm font-medium text-gray-700">External Source</span>
          </label>
        </div>
      );
    }
    return null;
  };

  // ── Table rendering ──
  const renderTable = () => {
    const data = filteredData();
    const cols: string[] = tab === 'customers'
      ? ['ID', 'Customer', 'Mobile', 'Address', 'Sent', 'Status', 'Actions']
      : tab === 'areas'
      ? ['ID', 'Area Name', 'Notes', 'Status', 'Actions']
      : tab === 'sources'
      ? ['ID', 'Source', 'Contact', 'Mobile', 'Address', 'Status', 'Actions']
      : tab === 'entries'
      ? ['ID', 'Bill#', 'Date', 'Customer', 'Type', 'Total', 'Ret.', 'Bal.', 'Actions']
      : [];
    const rightCols = new Set(['Sent', 'Total', 'Ret.', 'Bal.']);

    if (tab === 'customers') return (
      <table className="w-full text-sm"><thead><tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
        {cols.map(h => <th key={h} className={`px-4 py-3 ${rightCols.has(h) ? 'text-right' : 'text-left'}`}>{h}</th>)}
      </tr></thead><tbody className="divide-y divide-gray-50">
        {(data as Customer[]).length === 0 ? <tr><td colSpan={99} className="py-10 text-center text-gray-400">No customers</td></tr>
          : (data as Customer[]).map(c => (
            <tr key={c.id} className="hover:bg-blue-50/30 transition-colors">
              <td className="px-4 py-3 font-mono text-xs">{c.id.slice(0, 8)}</td>
              <td className="px-4 py-3"><div className="font-medium text-gray-800">{c.customerName}</div><div className="text-xs text-gray-400">{c.shopName}</div></td>
              <td className="px-4 py-3 text-gray-600 text-xs">{c.mobile}</td>
              <td className="px-4 py-3 text-gray-600 text-xs">{c.address}</td>
              <td className="px-4 py-3 text-center">{c.totalSentCount}</td>
              <td className="px-4 py-3"><Badge variant={c.isActive ? 'green' : 'orange'}>{c.isActive ? 'Active' : 'Inactive'}</Badge></td>
              <td className="px-4 py-3"><div className="flex gap-1">
                <button onClick={() => openForm(c as any)} title="Edit" className="p-1.5 rounded-lg text-blue-400 hover:text-blue-700 hover:bg-blue-50"><Pencil size={14} /></button>
                <button onClick={() => setDeleteTarget(c.id)} title="Delete" className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50"><Trash2 size={14} /></button>
              </div></td>
            </tr>
          ))}
      </tbody></table>
    );
    if (tab === 'areas') return (
      <table className="w-full text-sm"><thead><tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
        {cols.map(h => <th key={h} className={`px-4 py-3 ${rightCols.has(h) ? 'text-right' : 'text-left'}`}>{h}</th>)}
      </tr></thead><tbody className="divide-y divide-gray-50">
        {(data as CustomerArea[]).length === 0 ? <tr><td colSpan={99} className="py-10 text-center text-gray-400">No areas</td></tr>
          : (data as CustomerArea[]).map(a => (
            <tr key={a.id} className="hover:bg-blue-50/30 transition-colors">
              <td className="px-4 py-3 font-mono text-xs">{a.id.slice(0, 8)}</td>
              <td className="px-4 py-3 font-medium text-gray-800">{a.areaName}</td>
              <td className="px-4 py-3 text-gray-500 text-xs">{a.notes}</td>
              <td className="px-4 py-3"><Badge variant={a.isActive ? 'green' : 'orange'}>{a.isActive ? 'Active' : 'Inactive'}</Badge></td>
              <td className="px-4 py-3"><div className="flex gap-1">
                <button onClick={() => openForm(a as any)} title="Edit" className="p-1.5 rounded-lg text-blue-400 hover:text-blue-700 hover:bg-blue-50"><Pencil size={14} /></button>
                <button onClick={() => setDeleteTarget(a.id)} title="Delete" className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50"><Trash2 size={14} /></button>
              </div></td>
            </tr>
          ))}
      </tbody></table>
    );
    if (tab === 'sources') return (
      <table className="w-full text-sm"><thead><tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
        {cols.map(h => <th key={h} className={`px-4 py-3 ${rightCols.has(h) ? 'text-right' : 'text-left'}`}>{h}</th>)}
      </tr></thead><tbody className="divide-y divide-gray-50">
        {(data as InventorySource[]).length === 0 ? <tr><td colSpan={99} className="py-10 text-center text-gray-400">No sources</td></tr>
          : (data as InventorySource[]).map(s => (
            <tr key={s.id} className="hover:bg-blue-50/30 transition-colors">
              <td className="px-4 py-3 font-mono text-xs">{s.id.slice(0, 8)}</td>
              <td className="px-4 py-3 font-medium text-gray-800">{s.sourceName}</td>
              <td className="px-4 py-3 text-gray-600 text-xs">{s.contactPerson}</td>
              <td className="px-4 py-3 text-gray-600 text-xs">{s.mobile}</td>
              <td className="px-4 py-3 text-gray-500 text-xs">{s.address}</td>
              <td className="px-4 py-3"><Badge variant={s.isActive ? 'green' : 'orange'}>{s.isActive ? 'Active' : 'Inactive'}</Badge></td>
              <td className="px-4 py-3"><div className="flex gap-1">
                <button onClick={() => openForm(s as any)} title="Edit" className="p-1.5 rounded-lg text-blue-400 hover:text-blue-700 hover:bg-blue-50"><Pencil size={14} /></button>
                <button onClick={() => setDeleteTarget(s.id)} title="Delete" className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50"><Trash2 size={14} /></button>
              </div></td>
            </tr>
          ))}
      </tbody></table>
    );
    if (tab === 'entries') return (
      <table className="w-full text-sm"><thead><tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
        {cols.map(h => <th key={h} className={`px-4 py-3 ${rightCols.has(h) ? 'text-right' : 'text-left'}`}>{h}</th>)}
      </tr></thead><tbody className="divide-y divide-gray-50">
        {(data as BoxEntry[]).length === 0 ? <tr><td colSpan={99} className="py-10 text-center text-gray-400">No entries</td></tr>
          : (data as BoxEntry[]).map(e => (
            <tr key={e.id} className="hover:bg-blue-50/30 transition-colors">
              <td className="px-4 py-3 font-mono text-xs">{e.id.slice(0, 8)}</td>
              <td className="px-4 py-3 font-semibold text-blue-800 text-xs whitespace-nowrap">{e.billNumber}</td>
              <td className="px-4 py-3 text-gray-600 text-xs whitespace-nowrap">{format(new Date(e.entryDate), 'dd MMM yyyy')}</td>
              <td className="px-4 py-3"><div className="font-medium">{e.customerName}</div><div className="text-xs text-gray-400">{e.shopName}</div></td>
              <td className="px-4 py-3"><Badge variant={ENTRY_TYPE_BADGE[e.entryType] || 'gray'}>{ENTRY_TYPE_LABEL[e.entryType] || e.entryType}</Badge></td>
              <td className="px-4 py-3 text-right font-medium">{e.totalBoxesSent + e.currentQuantity}</td>
              <td className="px-4 py-3 text-right text-emerald-700">{e.boxesReturned}</td>
              <td className="px-4 py-3 text-right font-bold">{e.balanceBoxes}</td>
              <td className="px-4 py-3 text-left"><div className="flex gap-1">
                <button onClick={() => openForm(e as any)} title="Edit" className="p-1.5 rounded-lg text-blue-400 hover:text-blue-700 hover:bg-blue-50"><Pencil size={14} /></button>
                <button onClick={() => setDeleteTarget(e.id)} title="Delete" className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50"><Trash2 size={14} /></button>
              </div></td>
            </tr>
          ))}
      </tbody></table>
    );
    return null;
  };

  // ── Settings tab ──
  const renderSettingsTab = () => {
    if (!settings) return <div className="py-16 text-center text-gray-400">Loading settings...</div>;
    const fields: { key: keyof AppSettings; label: string }[] = [
      { key: 'companyName', label: 'Company Name' }, { key: 'companyAddress', label: 'Address' },
      { key: 'companyPhone', label: 'Phone' }, { key: 'companyEmail', label: 'Email' },
      { key: 'traderName', label: 'Trader Name' }, { key: 'gstNumber', label: 'GST Number' },
      { key: 'billPrefix', label: 'Bill Prefix' },
    ];
    return (
      <div className="space-y-4 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {fields.map(f => (
            <Input key={f.key} label={f.label} value={String(settings[f.key] || '')} onChange={e => setSettings(prev => prev ? { ...prev, [f.key]: e.target.value } as AppSettings : null)} />
          ))}
        </div>
        <Button onClick={handleSaveSettings}>Save Settings</Button>
      </div>
    );
  };

  return (
    <div className="space-y-5">

      {toast && (
        <div className="fixed top-5 right-5 z-50 px-5 py-3.5 rounded-xl shadow-xl text-white text-sm font-medium bg-emerald-600">{toast}</div>
      )}

      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-full sm:w-fit">
        {TABS.map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); setSearch(''); setShowForm(false); setDeleteTarget(null); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.id ? 'bg-white text-blue-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>
            {t.icon}<span className="hidden sm:inline">{t.label}</span>
            <span className="text-[10px] bg-gray-200 text-gray-500 px-1.5 rounded-full">{itemsCount[t.id]}</span>
          </button>
        ))}
      </div>

      {/* Form Modal */}
      {showForm && tab !== 'settings' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={closeForm}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-xl max-h-[85vh] overflow-y-auto mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                {editingId ? `Edit ${TAB_ITEMS[tab].singular}` : `Create ${TAB_ITEMS[tab].singular}`}
              </h3>
              <button onClick={closeForm} className="p-1 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
            </div>
            {renderFormFields()}
            <div className="flex gap-3 mt-5 pt-3 border-t border-gray-100">
              <Button onClick={handleSubmit}>{editingId ? 'Update' : 'Create'}</Button>
              <Button variant="secondary" onClick={closeForm}>Cancel</Button>
            </div>
          </div>
        </div>
      )}

      {/* Data table / settings */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-4 flex-wrap">
          {tab !== 'settings' && (
            <div className="relative flex-1 max-w-xs">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder={`Search ${TAB_ITEMS[tab].plural.toLowerCase()}...`}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm" />
            </div>
          )}
          <div className="ml-auto flex gap-2">
            {tab !== 'settings' && (
              <Button icon={<Plus size={14} />} size="sm" onClick={() => openForm()}>
                New {TAB_ITEMS[tab].singular}
              </Button>
            )}
            <Button variant="secondary" icon={<RotateCcw size={13} />} size="sm" onClick={loadData}>Refresh</Button>
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-gray-400 text-sm">Loading...</div>
        ) : tab === 'settings' ? (
          renderSettingsTab()
        ) : renderTable()}
      </div>

      <ConfirmModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={() => deleteTarget && handleDelete(deleteTarget)}
        title={`Delete ${TAB_ITEMS[tab].singular}?`} message={`Are you sure you want to delete this ${TAB_ITEMS[tab].singular.toLowerCase()}? This action cannot be undone.`} confirmLabel="Delete" variant="danger" />
    </div>
  );
};

const GuardedAdminData: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && user.isSystemAdmin !== true) {
      navigate('/settings', { replace: true });
    }
  }, [user, navigate]);

  if (!user || user.isSystemAdmin !== true) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertTriangle size={48} className="text-red-300 mb-4" />
        <h2 className="text-lg font-semibold text-gray-800">Access Denied</h2>
        <p className="text-sm text-gray-500 mt-1">Only System Admin can access this page.</p>
      </div>
    );
  }

  return <AdminData />;
};

export default GuardedAdminData;
