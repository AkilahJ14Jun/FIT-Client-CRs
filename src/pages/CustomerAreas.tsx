import React, { useState, useCallback, useEffect } from 'react';
import { MapPin, Plus, Pencil, Trash2, CheckCircle, XCircle, Search } from 'lucide-react';
import { AreaDB, type CustomerArea } from '../db/database';
import { Button } from '../components/ui/Button';
import { Input, TextArea } from '../components/ui/Input';
import { Modal, ConfirmModal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { useTranslation } from '../i18n/TranslationProvider';

type FormState = {
  areaName: string;
  notes: string;
  isActive: boolean;
};

const EMPTY: FormState = {
  areaName: '', notes: '', isActive: true,
};

export const CustomerAreas: React.FC = () => {
  const { t } = useTranslation();
  const [areas, setAreas] = useState<CustomerArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<CustomerArea | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CustomerArea | null>(null);
  const [form, setForm] = useState<FormState>({ ...EMPTY });

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await AreaDB.getAll();
      setAreas(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const filtered = areas.filter(
    (a) => a.areaName.toLowerCase().includes(search.toLowerCase()) ||
      (a.notes || '').toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => { setForm({ ...EMPTY }); setEditing(null); setShowForm(true); };
  const openEdit = (a: CustomerArea) => {
    setForm({ areaName: a.areaName, notes: a.notes || '', isActive: a.isActive });
    setEditing(a); setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.areaName.trim()) return;
    if (editing) {
      await AreaDB.update(editing.id, form);
    } else {
      await AreaDB.create({ areaName: form.areaName.trim(), notes: form.notes });
    }
    await refresh();
    setShowForm(false);
  };

  const handleDelete = async () => {
    if (deleteTarget) { await AreaDB.delete(deleteTarget.id); await refresh(); }
  };

  const toggleActive = async (a: CustomerArea) => {
    await AreaDB.update(a.id, { isActive: !a.isActive });
    await refresh();
  };

  const activeCount = areas.filter((a) => a.isActive).length;

  return (
    <div className="space-y-5">
      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: t('areas.totalAreas'), value: areas.length, color: 'bg-indigo-50 text-indigo-800' },
          { label: t('areas.active'), value: activeCount, color: 'bg-emerald-50 text-emerald-800' },
          { label: t('areas.inactive'), value: areas.length - activeCount, color: 'bg-gray-50 text-gray-600' },
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
            placeholder={t('areas.search')}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
          />
        </div>
        <Button icon={<Plus size={16} />} onClick={openCreate}>
          {t('areas.add')}
        </Button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="py-16 text-center text-gray-400 text-sm">{t('areas.loading')}</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-16 text-center">
          <MapPin size={40} className="mx-auto text-gray-200 mb-3" />
          <p className="text-gray-400 text-sm">{search ? t('areas.noMatch') : t('areas.none')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((a) => (
            <div key={a.id} className={`bg-white rounded-2xl border shadow-sm p-5 flex flex-col gap-3 hover:shadow-md transition-shadow ${!a.isActive ? 'border-gray-200 opacity-60' : 'border-gray-100'}`}>
              <div className="flex items-start justify-between gap-2">
                <div className={`rounded-xl p-2 ${a.isActive ? 'bg-indigo-50 text-indigo-800' : 'bg-gray-100 text-gray-500'}`}>
                  <MapPin size={18} />
                </div>
                <div className="flex gap-1 ml-auto items-center">
                  <button
                    onClick={() => toggleActive(a)}
                    title={a.isActive ? t('areas.deactivate') : t('areas.activate')}
                    className={`p-1.5 rounded-lg transition-colors ${a.isActive ? 'text-emerald-600 hover:bg-emerald-50' : 'text-gray-400 hover:bg-gray-50'}`}
                  >
                    {a.isActive ? <CheckCircle size={14} /> : <XCircle size={14} />}
                  </button>
                  <button onClick={() => openEdit(a)} className="p-2 rounded-lg text-gray-400 hover:text-blue-700 hover:bg-blue-50 transition-colors">
                    <Pencil size={15} />
                  </button>
                  <button onClick={() => setDeleteTarget(a)} className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-sm">{a.areaName}</p>
                {a.notes && (
                  <p className="text-xs text-gray-500 mt-0.5">{a.notes}</p>
                )}
              </div>
              <div className="pt-1 border-t border-gray-50 flex items-center justify-between">
                <Badge variant={a.isActive ? 'green' : 'gray'}>{a.isActive ? t('areas.active') : t('areas.inactive')}</Badge>
                <span className="text-xs text-gray-300">ID: {a.id.slice(0, 8)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editing ? t('areas.editTitle') : t('areas.addTitle')}
        footer={
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setShowForm(false)}>{t('dispatch.cancel')}</Button>
            <Button onClick={handleSave}>{editing ? t('areas.saveChanges') : t('areas.add')}</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label={t('areas.areaName')}
            value={form.areaName}
            onChange={(e) => setForm((f) => ({ ...f, areaName: e.target.value }))}
            placeholder={t('areas.placeholderAreaName')}
          />
          <TextArea
            label={t('areas.notes')}
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            placeholder={t('areas.placeholderNotes')}
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
              {t('areas.activeCheck')}
            </label>
          )}
        </div>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={t('areas.deleteTitle')}
        message={`${t('areas.deleteMsg')} "${deleteTarget?.areaName}"? ${t('areas.cantUndo')}`}
      />
    </div>
  );
};
