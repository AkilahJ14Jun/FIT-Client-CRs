import React, { useState, useCallback, useEffect } from 'react';
import { Users, Plus, Pencil, Trash2, Phone, MapPin, Store, Search, Mail, FileText, CheckCircle, XCircle } from 'lucide-react';
import { CustomerDB, AreaDB, type Customer, type CustomerArea } from '../db/database';
import { Button } from '../components/ui/Button';
import { Input, TextArea } from '../components/ui/Input';
import { Modal, ConfirmModal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { useTranslation } from '../i18n/TranslationProvider';

type FormState = {
  customerName: string;
  shopName: string;
  address: string;
  mobile: string;
  alternateMobile: string;
  email: string;
  notes: string;
  areaId: string;
  isActive: boolean;
};

const EMPTY: FormState = {
  customerName: '', shopName: '', address: '', mobile: '', alternateMobile: '', email: '', notes: '', areaId: '', isActive: true,
};

export const Customers: React.FC = () => {
  const { t } = useTranslation();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [areas, setAreas] = useState<CustomerArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [form, setForm] = useState<FormState>({ ...EMPTY });
  const [errors, setErrors] = useState<Partial<FormState>>({});

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [data, a] = await Promise.all([CustomerDB.getAll(), AreaDB.getAll()]);
      setCustomers(data);
      setAreas(a);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const filtered = customers.filter(
    (c) =>
      c.customerName.toLowerCase().includes(search.toLowerCase()) ||
      c.shopName.toLowerCase().includes(search.toLowerCase()) ||
      c.mobile.includes(search) ||
      (c.alternateMobile || '').includes(search) ||
      (c.email || '').toLowerCase().includes(search.toLowerCase())
  );

  const validate = () => {
    const e: Partial<FormState> = {};
    if (!form.customerName.trim()) e.customerName = 'Customer name is required';
    if (!form.shopName.trim()) e.shopName = 'Shop name is required';
    if (!form.mobile.trim()) e.mobile = 'Mobile number is required';
    else if (!/^\d{10,15}$/.test(form.mobile.replace(/\s/g, ''))) e.mobile = 'Enter a valid mobile number';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const openCreate = () => { setForm({ ...EMPTY }); setEditing(null); setErrors({}); setShowForm(true); };
  const openEdit = (c: Customer) => {
    setForm({
      customerName: c.customerName,
      shopName: c.shopName,
      address: c.address,
      mobile: c.mobile,
      alternateMobile: c.alternateMobile || '',
      email: c.email || '',
      notes: c.notes || '',
      areaId: c.areaId || '',
      isActive: c.isActive,
    });
    setEditing(c); setErrors({}); setShowForm(true);
  };

  const handleSave = async () => {
    if (!validate()) return;
    if (editing) {
      await CustomerDB.update(editing.id, form);
    } else {
      await CustomerDB.create({ ...form, totalSentCount: 0 });
    }
    await refresh();
    setShowForm(false);
  };

  const handleDelete = async () => {
    if (deleteTarget) { await CustomerDB.delete(deleteTarget.id); await refresh(); }
  };

  const toggleActive = async (c: Customer) => {
    await CustomerDB.update(c.id, { isActive: !c.isActive });
    await refresh();
  };

  const activeCount = customers.filter((c) => c.isActive).length;

  return (
    <div className="space-y-5">
      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: t('cust.totalCustomers'), value: customers.length, color: 'bg-blue-50 text-blue-800' },
          { label: t('cust.active'), value: activeCount, color: 'bg-emerald-50 text-emerald-800' },
          { label: t('cust.inactive'), value: customers.length - activeCount, color: 'bg-gray-50 text-gray-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className={`rounded-xl px-4 py-3 ${color} flex items-center gap-3`}>
            <span className="text-2xl font-bold">{value}</span>
            <span className="text-xs font-medium opacity-75">{label}</span>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('cust.search')}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
          />
        </div>
        <Button icon={<Plus size={16} />} onClick={openCreate}>
          {t('cust.add')}
        </Button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="py-16 text-center text-gray-400 text-sm">{t('cust.loading')}</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-16 text-center">
          <Users size={40} className="mx-auto text-gray-200 mb-3" />
          <p className="text-gray-400 text-sm">{search ? t('cust.noMatch') : t('cust.none')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <div key={c.id} className={`bg-white rounded-2xl border shadow-sm p-5 flex flex-col gap-3 hover:shadow-md transition-shadow ${!c.isActive ? 'border-gray-200 opacity-60' : 'border-gray-100'}`}>
              <div className="flex items-start justify-between gap-2">
                <div className={`rounded-xl p-2 ${c.isActive ? 'bg-blue-50 text-blue-800' : 'bg-gray-100 text-gray-500'}`}>
                  <Users size={18} />
                </div>
                <div className="flex gap-1 ml-auto items-center">
                  <button
                    onClick={() => toggleActive(c)}
                    title={c.isActive ? t('cust.deactivate') : t('cust.activate')}
                    className={`p-1.5 rounded-lg transition-colors ${c.isActive ? 'text-emerald-600 hover:bg-emerald-50' : 'text-gray-400 hover:bg-gray-50'}`}
                  >
                    {c.isActive ? <CheckCircle size={14} /> : <XCircle size={14} />}
                  </button>
                  <button onClick={() => openEdit(c)} className="p-2 rounded-lg text-gray-400 hover:text-blue-700 hover:bg-blue-50 transition-colors">
                    <Pencil size={15} />
                  </button>
                  <button onClick={() => setDeleteTarget(c)} className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-sm">{c.customerName}</p>
                <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                  <Store size={11} /> {c.shopName}
                </p>
                {c.areaId && areas.find((a) => a.id === c.areaId) && (
                  <p className="text-xs text-indigo-500 mt-0.5 flex items-center gap-1">
                    <MapPin size={11} /> {areas.find((a) => a.id === c.areaId)!.areaName}
                  </p>
                )}
              </div>
              <div className="space-y-1.5 text-xs text-gray-500">
                {c.mobile && (
                  <p className="flex items-center gap-1.5">
                    <Phone size={11} className="text-gray-400" />
                    <span className="text-gray-400 text-[10px]">Primary:</span>
                    <a href={`tel:${c.mobile}`} className="hover:text-blue-600">{c.mobile}</a>
                  </p>
                )}
                {c.alternateMobile && (
                  <p className="flex items-center gap-1.5">
                    <Phone size={11} className="text-gray-400" />
                    <span className="text-gray-400 text-[10px]">Alt:</span>
                    <a href={`tel:${c.alternateMobile}`} className="hover:text-blue-600">{c.alternateMobile}</a>
                  </p>
                )}
                {c.email && (
                  <p className="flex items-center gap-1.5">
                    <Mail size={11} className="text-gray-400" />
                    <span className="truncate">{c.email}</span>
                  </p>
                )}
                {c.address && (
                  <p className="flex items-center gap-1.5">
                    <MapPin size={11} className="text-gray-400" />
                    <span className="truncate">{c.address}</span>
                  </p>
                )}
                {c.notes && (
                  <p className="flex items-center gap-1.5 italic">
                    <FileText size={11} className="text-gray-400" />
                    <span className="truncate">{c.notes}</span>
                  </p>
                )}
              </div>
              <div className="pt-1 border-t border-gray-50 flex items-center justify-between">
                <Badge variant={c.isActive ? 'green' : 'gray'}>{c.isActive ? t('cust.active') : t('cust.inactive')}</Badge>
                <span className="text-xs text-gray-300">ID: {c.id.slice(0, 8)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editing ? t('cust.editFormTitle') : t('cust.addFormTitle')}
        footer={
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setShowForm(false)}>{t('dispatch.cancel')}</Button>
            <Button onClick={handleSave}>{editing ? t('cust.saveChanges') : t('cust.add')}</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={t('cust.custName')}
              value={form.customerName}
              onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))}
              error={errors.customerName}
              placeholder={t('cust.placeholderName')}
            />
            <Input
              label={t('cust.shopName')}
              value={form.shopName}
              onChange={(e) => setForm((f) => ({ ...f, shopName: e.target.value }))}
              error={errors.shopName}
              placeholder={t('cust.placeholderShop')}
            />
            <Input
              label={t('cust.mobile')}
              value={form.mobile}
              onChange={(e) => setForm((f) => ({ ...f, mobile: e.target.value }))}
              error={errors.mobile}
              placeholder={t('cust.placeholderMobile')}
              type="tel"
            />
            <Input
              label="Alternate Mobile"
              value={form.alternateMobile}
              onChange={(e) => setForm((f) => ({ ...f, alternateMobile: e.target.value }))}
              placeholder="Alternate mobile number"
              type="tel"
            />
            <Input
              label={t('cust.email')}
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              error={errors.email}
              placeholder={t('cust.placeholderEmail')}
              type="email"
            />
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">{t('cust.area')}</label>
              <select
                value={form.areaId}
                onChange={(e) => setForm((f) => ({ ...f, areaId: e.target.value }))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">{t('cust.noArea')}</option>
                {areas.filter((a) => a.isActive !== false).map((a) => (
                  <option key={a.id} value={a.id}>{a.areaName}</option>
                ))}
              </select>
            </div>
          </div>
          <TextArea
            label={t('cust.address')}
            value={form.address}
            onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
            placeholder={t('cust.placeholderAddr')}
            rows={2}
          />
          <TextArea
            label={t('cust.notes')}
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            placeholder={t('cust.placeholderNotes')}
            rows={2}
          />
          {editing && (
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                className="rounded accent-blue-700"
              />
              {t('cust.activeCheck')}
            </label>
          )}
        </div>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={t('cust.deleteTitle')}
        message={`${t('cust.deleteMsg')} "${deleteTarget?.customerName}"? ${t('cust.cantUndo')}`}
      />
    </div>
  );
};
