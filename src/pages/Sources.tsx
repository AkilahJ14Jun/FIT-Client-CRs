import React, { useState, useCallback, useEffect } from 'react';
import { Database, Plus, Pencil, Trash2, Phone, MapPin, User, Search, CheckCircle, XCircle } from 'lucide-react';
import { SourceDB, type InventorySource } from '../db/database';
import { Button } from '../components/ui/Button';
import { Input, TextArea } from '../components/ui/Input';
import { Modal, ConfirmModal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { useTranslation } from '../i18n/TranslationProvider';

type FormState = {
  sourceName: string;
  contactPerson: string;
  mobile: string;
  address: string;
  notes: string;
  isActive: boolean;
};

const EMPTY: FormState = {
  sourceName: '', contactPerson: '', mobile: '', address: '', notes: '', isActive: true,
};

export const Sources: React.FC = () => {
  const { t } = useTranslation();
  const [sources, setSources] = useState<InventorySource[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<InventorySource | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<InventorySource | null>(null);
  const [form, setForm] = useState<FormState>({ ...EMPTY });
  const [errors, setErrors] = useState<Partial<FormState>>({});

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await SourceDB.getAll();
      setSources(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const filtered = sources.filter(
    (s) =>
      s.sourceName.toLowerCase().includes(search.toLowerCase()) ||
      s.contactPerson.toLowerCase().includes(search.toLowerCase()) ||
      s.mobile.includes(search)
  );

  const validate = () => {
    const e: Partial<FormState> = {};
    if (!form.sourceName.trim()) e.sourceName = 'Source name is required';
    if (!form.contactPerson.trim()) e.contactPerson = 'Contact person is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const openCreate = () => { setForm({ ...EMPTY }); setEditing(null); setErrors({}); setShowForm(true); };
  const openEdit = (s: InventorySource) => {
    setForm({
      sourceName: s.sourceName,
      contactPerson: s.contactPerson,
      mobile: s.mobile,
      address: s.address,
      notes: s.notes,
      isActive: s.isActive,
    });
    setEditing(s); setErrors({}); setShowForm(true);
  };

  const handleSave = async () => {
    if (!validate()) return;
    if (editing) await SourceDB.update(editing.id, form);
    else await SourceDB.create(form);
    await refresh();
    setShowForm(false);
  };

  const handleDelete = async () => {
    if (deleteTarget) { await SourceDB.delete(deleteTarget.id); await refresh(); }
  };

  const toggleActive = async (s: InventorySource) => {
    await SourceDB.update(s.id, { isActive: !s.isActive });
    await refresh();
  };

  const activeCount = sources.filter((s) => s.isActive).length;

  return (
    <div className="space-y-5">
      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: t('src.totalSources'), value: sources.length, color: 'bg-emerald-50 text-emerald-800' },
          { label: t('cust.active'), value: activeCount, color: 'bg-blue-50 text-blue-800' },
          { label: t('cust.inactive'), value: sources.length - activeCount, color: 'bg-gray-50 text-gray-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className={`rounded-xl px-4 py-3 ${color} flex items-center gap-3`}>
            <span className="text-2xl font-bold">{value}</span>
            <span className="text-xs font-medium opacity-75">{label}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('src.search')}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
          />
        </div>
        <Button icon={<Plus size={16} />} onClick={openCreate}>
          {t('src.add')}
        </Button>
      </div>

      {loading ? (
        <div className="py-16 text-center text-gray-400 text-sm">{t('src.loading')}</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-16 text-center">
          <Database size={40} className="mx-auto text-gray-200 mb-3" />
          <p className="text-gray-400 text-sm">{search ? t('src.noMatch') : t('src.none')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((s) => (
            <div key={s.id} className={`bg-white rounded-2xl border shadow-sm p-5 flex flex-col gap-3 hover:shadow-md transition-shadow ${!s.isActive ? 'border-gray-200 opacity-60' : 'border-gray-100'}`}>
              <div className="flex items-start justify-between gap-2">
                <div className={`rounded-xl p-2 ${s.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                  <Database size={18} />
                </div>
                <div className="flex gap-1 ml-auto items-center">
                  <button onClick={() => toggleActive(s)} title={s.isActive ? t('cust.deactivate') : t('cust.activate')}
                    className={`p-1.5 rounded-lg transition-colors ${s.isActive ? 'text-emerald-600 hover:bg-emerald-50' : 'text-gray-400 hover:bg-gray-50'}`}>
                    {s.isActive ? <CheckCircle size={14} /> : <XCircle size={14} />}
                  </button>
                  <button onClick={() => openEdit(s)} className="p-2 rounded-lg text-gray-400 hover:text-blue-700 hover:bg-blue-50 transition-colors"><Pencil size={15} /></button>
                  <button onClick={() => setDeleteTarget(s)} className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"><Trash2 size={15} /></button>
                </div>
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-sm">{s.sourceName}</p>
                <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1"><User size={11} /> {s.contactPerson}</p>
              </div>
              <div className="space-y-1.5 text-xs text-gray-500">
                {s.mobile && (<p className="flex items-center gap-1.5"><Phone size={11} className="text-gray-400" /><a href={`tel:${s.mobile}`} className="hover:text-blue-600">{s.mobile}</a></p>)}
                {s.address && (<p className="flex items-center gap-1.5"><MapPin size={11} className="text-gray-400" /><span className="truncate">{s.address}</span></p>)}
                {s.notes && (<p className="italic text-gray-400 truncate">{s.notes}</p>)}
              </div>
              <div className="pt-1 border-t border-gray-50 flex items-center justify-between">
                <Badge variant={s.isActive ? 'green' : 'gray'}>{s.isActive ? t('cust.active') : t('cust.inactive')}</Badge>
                <span className="text-xs text-gray-300">ID: {s.id.slice(0, 8)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editing ? t('src.editTitle') : t('src.addTitle')}
        footer={<div className="flex gap-3 justify-end"><Button variant="secondary" onClick={() => setShowForm(false)}>{t('dispatch.cancel')}</Button><Button onClick={handleSave}>{editing ? t('cust.saveChanges') : t('src.add')}</Button></div>}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label={t('src.srcName')} value={form.sourceName} onChange={(e) => setForm((f) => ({ ...f, sourceName: e.target.value }))} error={errors.sourceName} placeholder={t('src.placeholderName')} />
            <Input label={t('src.contact')} value={form.contactPerson} onChange={(e) => setForm((f) => ({ ...f, contactPerson: e.target.value }))} error={errors.contactPerson} placeholder={t('src.placeholderContact')} />
            <Input label={t('cust.mobile')} value={form.mobile} onChange={(e) => setForm((f) => ({ ...f, mobile: e.target.value }))} placeholder={t('src.placeholderMobile')} type="tel" />
          </div>
          <TextArea label={t('cust.address')} value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} placeholder={t('src.placeholderAddr')} rows={2} />
          <TextArea label={t('src.notes')} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder={t('src.placeholderNotes')} rows={2} />
          {editing && (
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} className="rounded accent-blue-700" />
              {t('src.activeCheck')}
            </label>
          )}
        </div>
      </Modal>

      <ConfirmModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title={t('src.deleteTitle')} message={`${t('src.deleteMsg')} "${deleteTarget?.sourceName}"? ${t('cust.cantUndo')}`} />
    </div>
  );
};
