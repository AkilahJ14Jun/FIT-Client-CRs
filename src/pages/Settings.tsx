import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Save, Download, Upload, Trash2, RotateCcw,
  Shield, Building2, FileText, AlertTriangle, CheckCircle, Clock,
  Bell, BellOff, Globe, Users, UserPlus, Key, UserMinus
} from 'lucide-react';
import { SettingsDB, BackupDB, AuditDB, StockAlertDB, CustomerDB, type AppSettings, type AuditLog, type Customer } from '../db/database';
import { useTranslation } from '../i18n/TranslationProvider';
import { useAuth } from '../auth/AuthContext';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { ConfirmModal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { format } from 'date-fns';

type Tab = 'company' | 'stock' | 'users' | 'backup' | 'audit' | 'sentCount';

interface AppUser {
  id: string;
  username: string;
  displayName: string;
  isAdmin: boolean;
  isSystemAdmin: boolean;
  isActive: boolean;
  createdAt: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  companyName: 'FIT – Fish Inventory Tracking', companyAddress: '', companyPhone: '',
  companyEmail: '', traderName: '', gstNumber: '', billPrefix: 'BILL', currency: 'INR',
  dateFormat: 'dd MMM yyyy', autoBackup: true, theme: 'light',
  stockAlertEnabled: true, stockAlertThreshold: 30, language: 'en',
};

const DEFAULT_STOCK = { openingStock: 0, currentStock: 0, totalDispatched: 0, totalReturned: 0, percentRemaining: 100, shouldAlert: false };

export const Settings: React.FC = () => {
  const { t, lang, setLang } = useTranslation();
  const { user } = useAuth();
  const canManageUsers = user?.isAdmin === true || user?.isSystemAdmin === true;
  const [tab, setTab] = useState<Tab>('company');
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);
  const [importResult, setImportResult] = useState<{ success: boolean; message: string } | null>(null);
  const [clearConfirm, setClearConfirm] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [stockLevel, setStockLevel] = useState(DEFAULT_STOCK);
  const [alertDismissed, setAlertDismissed] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [sentCountCustomers, setSentCountCustomers] = useState<Customer[]>([]);
  const [selectedResetCustomer, setSelectedResetCustomer] = useState('');
  const [sentCountResetDone, setSentCountResetDone] = useState(false);
  const [sentCountResetError, setSentCountResetError] = useState('');
  const [deleteAllConfirm, setDeleteAllConfirm] = useState(false);
  const [deleteAllDone, setDeleteAllDone] = useState(false);
  const [deleteAllError, setDeleteAllError] = useState('');
  const [deletingAll, setDeletingAll] = useState(false);

  // User management state
  const [appUsers, setAppUsers] = useState<AppUser[]>([]);
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [userForm, setUserForm] = useState({ username: '', password: '', displayName: '', isAdmin: false, isActive: true });
  const [userFormError, setUserFormError] = useState('');
  const [userFormSuccess, setUserFormSuccess] = useState('');

  const reloadAll = useCallback(async () => {
    const [s, sl, dismissed, al, custs] = await Promise.all([
      SettingsDB.get(),
      StockAlertDB.getStockLevel(),
      StockAlertDB.isDismissed(),
      AuditDB.getAll(),
      CustomerDB.getAll(),
    ]);
    setSettings(s);
    setStockLevel(sl);
    setAlertDismissed(dismissed);
    setAuditLogs(al);
    setSentCountCustomers(custs);
  }, []);

  const loadUsers = useCallback(async () => {
    if (!canManageUsers) return;
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      setAppUsers(data);
    } catch { /* ignore */ }
  }, [canManageUsers]);

  useEffect(() => { reloadAll(); loadUsers(); }, [reloadAll, loadUsers]);

  const handleSave = async () => {
    await SettingsDB.save(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleExport = async () => {
    await BackupDB.exportJSON();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const json = ev.target?.result as string;
      try {
        const data = JSON.parse(json);
        // Import each entity
        if (data.customers) {
          for (const c of data.customers) { await fetch(`/api/customers/${c.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(c) }).catch(() => fetch('/api/customers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(c) })); }
        }
        if (data.sources) {
          for (const s of data.sources) { await fetch(`/api/sources/${s.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(s) }).catch(() => fetch('/api/sources', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(s) })); }
        }
        if (data.entries) {
          for (const entry of data.entries) { await fetch(`/api/entries/${entry.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(entry) }).catch(() => fetch('/api/entries', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(entry) })); }
        }
        if (data.settings) { await SettingsDB.save(data.settings); }
        setImportResult({ success: true, message: t('settings.importSuccess') });
        await reloadAll();
      } catch (err) {
        setImportResult({ success: false, message: `${t('settings.importFail')} ${(err as Error).message}` });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleClearAll = () => {
    // For MySQL backend, we'd need a special clear endpoint. For now reload.
    window.location.reload();
  };

  const handleReEnableAlert = async () => {
    await StockAlertDB.enable();
    await reloadAll();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleDismissAlert = async () => {
    await StockAlertDB.dismissUntilTomorrow();
    await reloadAll();
  };

  const refreshAuditLogs = async () => {
    const al = await AuditDB.getAll();
    setAuditLogs(al);
  };

  const handleResetCustomerSentCount = async () => {
    if (!selectedResetCustomer) { setSentCountResetError('Please select a customer'); return; }
    const result = await CustomerDB.resetSentCount(selectedResetCustomer);
    if (result) {
      setSentCountResetDone(true);
      setSentCountResetError('');
      setSentCountCustomers(prev => prev.map(c =>
        c.id === selectedResetCustomer ? { ...c, totalSentCount: 0 } : c
      ));
      setTimeout(() => setSentCountResetDone(false), 3000);
    } else {
      setSentCountResetError(t('settings.resetFail'));
    }
  };

  const handleResetAllSentCounts = async () => {
    const result = await CustomerDB.resetAllSentCounts();
    if (result) {
      setSentCountResetDone(true);
      setSentCountResetError('');
      setSentCountCustomers(prev => prev.map(c => ({ ...c, totalSentCount: 0 })));
      setTimeout(() => setSentCountResetDone(false), 3000);
    } else {
      setSentCountResetError(t('settings.failedReset'));
    }
  };

  const handleDeleteAllEntries = async () => {
    setDeletingAll(true);
    setDeleteAllError('');
    setDeleteAllDone(false);
    try {
      const result = await CustomerDB.deleteAllEntries();
      if (result.success) {
        setDeleteAllDone(true);
        setSentCountCustomers(prev => prev.map(c => ({ ...c, totalSentCount: 0 })));
        setTimeout(() => setDeleteAllDone(false), 4000);
      } else {
        setDeleteAllError('Failed to delete entries');
      }
    } catch (err) {
      setDeleteAllError(`Failed to delete entries: ${(err as Error).message}`);
    } finally {
      setDeletingAll(false);
    }
  };

  // ── User Management handlers ──
  const resetUserForm = () => {
    setUserForm({ username: '', password: '', displayName: '', isAdmin: false, isActive: true });
    setUserFormError('');
    setEditingUserId(null);
    setShowUserForm(false);
  };

  const openCreateUser = () => {
    setUserForm({ username: '', password: '', displayName: '', isAdmin: false, isActive: true });
    setUserFormError('');
    setUserFormSuccess('');
    setEditingUserId(null);
    setShowUserForm(true);
  };

  const openEditUser = (u: AppUser) => {
    setUserForm({ username: u.username, password: '', displayName: u.displayName, isAdmin: u.isAdmin, isActive: u.isActive });
    setUserFormError('');
    setUserFormSuccess('');
    setEditingUserId(u.id);
    setShowUserForm(true);
  };

  const handleUserSubmit = async () => {
    setUserFormError('');
    setUserFormSuccess('');
    if (!userForm.username.trim() || (!userForm.password && !editingUserId)) {
      setUserFormError('Please fill username and password');
      return;
    }
    const isAdminUser = user?.isSystemAdmin === true;
    try {
      if (editingUserId) {
        const body: Record<string, unknown> = { displayName: userForm.displayName, isActive: userForm.isActive };
        if (userForm.password) body.password = userForm.password;
        if (isAdminUser) body.isAdmin = userForm.isAdmin;
        const res = await fetch(`/api/users/${editingUserId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) { setUserFormError(data.error || 'Failed to update'); return; }
        setUserFormSuccess('User updated successfully');
      } else {
        const body: Record<string, unknown> = { username: userForm.username, password: userForm.password, displayName: userForm.displayName, isActive: userForm.isActive };
        if (isAdminUser) body.isAdmin = userForm.isAdmin;
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) { setUserFormError(data.error || 'Failed to create'); return; }
        setUserFormSuccess('User created successfully');
      }
      resetUserForm();
      await loadUsers();
    } catch {
      setUserFormError('Network error');
    }
  };

  const handleDeactivateUser = async (id: string) => {
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: false }),
      });
      if (res.ok) await loadUsers();
    } catch { /* ignore */ }
  };

  const handleReactivateUser = async (id: string) => {
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: true }),
      });
      if (res.ok) await loadUsers();
    } catch { /* ignore */ }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) { setUserFormError(data.error || 'Failed to delete'); return; }
      await loadUsers();
    } catch { /* ignore */ }
  };

  const ALL_TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'company', label: t('settings.companyTab'), icon: <Building2 size={16} /> },
    { id: 'stock',   label: t('settings.stockTab'),      icon: <Bell size={16} />      },
    { id: 'users',   label: t('settings.usersTab'),      icon: <Users size={16} />     },
    { id: 'backup',  label: t('settings.backupTab'),     icon: <Download size={16} />  },
    { id: 'audit',   label: t('settings.auditTab'),      icon: <Shield size={16} />    },
    { id: 'sentCount', label: t('settings.sentTab'), icon: <RotateCcw size={16} /> },
  ];

  const TABS = ALL_TABS.filter(
    (t) => (t.id !== 'backup' && t.id !== 'users' && t.id !== 'sentCount') ||
           (t.id === 'backup' && user?.isSystemAdmin === true) ||
           (t.id === 'users' && canManageUsers) ||
           (t.id === 'sentCount' && user?.isSystemAdmin === true)
  );

  // Redirect away from restricted tabs if user loses access
  useEffect(() => {
    if (tab === 'backup' && user?.isSystemAdmin !== true) setTab('company');
  }, [tab, user]);

  useEffect(() => {
    if (tab === 'users' && !canManageUsers) setTab('company');
  }, [tab, canManageUsers]);

  useEffect(() => {
    if (tab === 'sentCount' && user?.isSystemAdmin !== true) setTab('company');
  }, [tab, user]);

  const actionBadge: Record<string, 'blue' | 'green' | 'orange'> = {
    CREATE: 'green', UPDATE: 'blue', DELETE: 'orange',
  };

  return (
    <div className="space-y-5">
      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-full sm:w-fit">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.id ? 'bg-white text-blue-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>
            {t.icon}<span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* ── Company Settings ── */}
      {tab === 'company' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
          {/* Language Selector */}
          <div className="bg-blue-50 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 rounded-lg p-2 text-blue-700"><Globe size={18} /></div>
              <div><h3 className="font-semibold text-gray-800">{t('settings.lang')}</h3><p className="text-xs text-gray-500">{t('settings.langSubtitle')}</p></div>
            </div>
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value as 'en' | 'ta' | 'hi')}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="en">English</option>
              <option value="ta">தமிழ்</option>
              <option value="hi">हिन्दी</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-blue-50 rounded-xl p-2 text-blue-800"><Building2 size={20} /></div>
            <div><h2 className="font-semibold text-gray-800">{t('settings.companyInfo')}</h2><p className="text-xs text-gray-500">{t('settings.companySubtitle')}</p></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label={t('settings.companyName')} value={settings.companyName} onChange={(e) => setSettings((s) => ({ ...s, companyName: e.target.value }))} placeholder={t('settings.companyName')} />
            <Input label={t('settings.traderName')} value={settings.traderName || ''} onChange={(e) => setSettings((s) => ({ ...s, traderName: e.target.value }))} placeholder={t('settings.traderName')} />
            <Input label={t('settings.phone')} value={settings.companyPhone} onChange={(e) => setSettings((s) => ({ ...s, companyPhone: e.target.value }))} placeholder={t('settings.phone')} type="tel" />
            <Input label={t('settings.email')} value={settings.companyEmail || ''} onChange={(e) => setSettings((s) => ({ ...s, companyEmail: e.target.value }))} placeholder="business@email.com" type="email" />
            <Input label={t('settings.gst')} value={settings.gstNumber || ''} onChange={(e) => setSettings((s) => ({ ...s, gstNumber: e.target.value }))} placeholder={t('settings.gst')} />
            <Input label={t('settings.billPrefix')} value={settings.billPrefix} onChange={(e) => setSettings((s) => ({ ...s, billPrefix: e.target.value }))} placeholder="BILL" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">{t('settings.businessAddr')}</label>
            <textarea value={settings.companyAddress} onChange={(e) => setSettings((s) => ({ ...s, companyAddress: e.target.value }))} rows={3} placeholder={t('settings.businessAddr')}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white resize-none" />
          </div>
          <div className="flex items-center gap-4">
            <Button icon={<Save size={16} />} onClick={handleSave}>{t('settings.save')}</Button>
            {saved && (<span className="flex items-center gap-1.5 text-sm text-emerald-700"><CheckCircle size={16} /> {t('settings.saved')}</span>)}
          </div>
        </div>
      )}

      {/* ── Stock Alert Settings ── */}
      {tab === 'stock' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className={`rounded-xl p-2 ${settings.stockAlertEnabled ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-400'}`}>
                {settings.stockAlertEnabled ? <Bell size={20} /> : <BellOff size={20} />}
              </div>
              <div><h3 className="font-semibold text-gray-800">{t('settings.stockEnabled')}</h3><p className="text-xs text-gray-500">{t('settings.stockSub')}</p></div>
            </div>
            <label className="flex items-center gap-3 cursor-pointer select-none mb-6">
              <div onClick={() => setSettings((s) => ({ ...s, stockAlertEnabled: !s.stockAlertEnabled }))}
                className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${settings.stockAlertEnabled ? 'bg-amber-500' : 'bg-gray-300'}`}>
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${settings.stockAlertEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
              </div>
              <span className="text-sm font-medium text-gray-700">{settings.stockAlertEnabled ? t('settings.alertOn') : t('settings.alertOff')}</span>
            </label>
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">{t('settings.alertThreshold')} — <span className="text-amber-600 font-bold">{settings.stockAlertThreshold ?? 30}%</span></label>
              <p className="text-xs text-gray-500">{t('settings.thresholdDesc')}</p>
              <input type="range" min={5} max={80} step={5} value={settings.stockAlertThreshold ?? 30}
                onChange={(e) => setSettings((s) => ({ ...s, stockAlertThreshold: parseInt(e.target.value) }))}
                className="w-full accent-amber-500" disabled={!settings.stockAlertEnabled} />
              <div className="flex justify-between text-[10px] text-gray-400"><span>5% (Critical only)</span><span>30% (Recommended)</span><span>80% (Early warning)</span></div>
              <div className="mt-3 h-4 bg-gray-100 rounded-full overflow-hidden relative">
                <div className="h-full bg-gradient-to-r from-red-500 via-amber-400 to-emerald-400 rounded-full" style={{ width: '100%' }} />
                <div className="absolute top-0 h-full w-0.5 bg-gray-800" style={{ left: `${settings.stockAlertThreshold ?? 30}%` }} />
                <div className="absolute -top-6 text-[9px] text-gray-600 font-bold -translate-x-1/2" style={{ left: `${settings.stockAlertThreshold ?? 30}%` }}>▼ {t('settings.alertThreshold')} {settings.stockAlertThreshold ?? 30}%</div>
              </div>
            </div>
            <div className="mt-6 flex items-center gap-3 flex-wrap">
              <Button icon={<Save size={16} />} onClick={handleSave}>{t('settings.saveAlert')}</Button>
              {saved && (<span className="flex items-center gap-1.5 text-sm text-emerald-700"><CheckCircle size={16} /> {t('settings.saved')}</span>)}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-blue-50 rounded-xl p-2 text-blue-700"><Bell size={20} /></div>
              <div><h3 className="font-semibold text-gray-800">{t('settings.currentStock')}</h3><p className="text-xs text-gray-500">{t('settings.stockLive')}</p></div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {[
                { label: t('settings.openStock'),   value: stockLevel.openingStock,    color: 'text-blue-700' },
                { label: t('settings.totalDispatched'), value: stockLevel.totalDispatched, color: 'text-amber-700' },
                { label: t('settings.totalReturned'),  value: stockLevel.totalReturned,   color: 'text-emerald-700' },
                { label: t('settings.currentStock'),   value: stockLevel.currentStock,    color: 'text-gray-800' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-gray-50 rounded-xl px-4 py-3 text-center">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">{label}</p>
                  <p className={`text-2xl font-extrabold ${color}`}>{value}</p>
                </div>
              ))}
            </div>
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1"><span>{t('settings.stockLevel')}</span><span className="font-bold">{stockLevel.percentRemaining}{t('settings.remaining')}</span></div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${stockLevel.percentRemaining <= 10 ? 'bg-red-500' : stockLevel.percentRemaining <= 20 ? 'bg-orange-500' : stockLevel.percentRemaining <= (settings.stockAlertThreshold ?? 30) ? 'bg-amber-500' : 'bg-emerald-500'}`}
                  style={{ width: `${Math.max(2, stockLevel.percentRemaining)}%` }} />
              </div>
            </div>
            <div className="mt-4 flex gap-2 flex-wrap">
              {alertDismissed && (<button onClick={handleReEnableAlert} className="flex items-center gap-1.5 bg-amber-100 hover:bg-amber-200 text-amber-800 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"><Bell size={13} /> {t('settings.reEnable')}</button>)}
              {!alertDismissed && settings.stockAlertEnabled && stockLevel.openingStock > 0 && (
                <button onClick={handleDismissAlert} className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"><BellOff size={13} /> {t('settings.dismissUntil')}</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Backup & Restore ── */}
      {tab === 'backup' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4"><div className="bg-blue-50 rounded-xl p-2 text-blue-800"><Download size={20} /></div><div><h3 className="font-semibold text-gray-800">{t('settings.exportBackup')}</h3><p className="text-xs text-gray-500">{t('settings.exportSub')}</p></div></div>
            <p className="text-sm text-gray-600 mb-4">{t('settings.exportDesc')}</p>
            {settings.lastBackup && (<p className="text-xs text-gray-400 mb-3">{t('settings.lastBackup')} {format(new Date(settings.lastBackup), 'dd MMM yyyy, HH:mm')}</p>)}
            <Button icon={<Download size={16} />} onClick={handleExport}>{t('settings.download')}</Button>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4"><div className="bg-emerald-50 rounded-xl p-2 text-emerald-700"><Upload size={20} /></div><div><h3 className="font-semibold text-gray-800">{t('settings.restore')}</h3><p className="text-xs text-gray-500">{t('settings.restoreSub')}</p></div></div>
            <p className="text-sm text-gray-600 mb-4">{t('settings.exportDesc')}</p>
            {importResult && (
              <div className={`mb-4 p-3 rounded-lg text-sm flex items-center gap-2 ${importResult.success ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700'}`}>
                {importResult.success ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                {importResult.message}
              </div>
            )}
            <input ref={fileRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
            <Button variant="secondary" icon={<Upload size={16} />} onClick={() => fileRef.current?.click()}>{t('settings.chooseFile')}</Button>
          </div>

          <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4"><div className="bg-red-50 rounded-xl p-2 text-red-700"><Trash2 size={20} /></div><div><h3 className="font-semibold text-red-700">{t('settings.danger')}</h3><p className="text-xs text-gray-500">{t('settings.dangerSub')}</p></div></div>
            <p className="text-sm text-gray-600 mb-4">{t('settings.clearWarn')} <strong className="text-red-600">{t('settings.exportBefore')}</strong></p>
            <Button variant="danger" icon={<AlertTriangle size={16} />} onClick={() => setClearConfirm(true)}>{t('settings.clearAll')}</Button>
          </div>

          <ConfirmModal open={clearConfirm} onClose={() => setClearConfirm(false)} onConfirm={handleClearAll}
            title={t('settings.clearTitle')} message={t('settings.clearMsg')}
            confirmLabel={t('settings.clearConfirm')} variant="danger" />
        </div>
      )}

      {/* ── Audit Log ── */}
      {tab === 'audit' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2"><Shield size={16} className="text-blue-700" /><h3 className="font-semibold text-gray-800">{t('settings.auditLog')}</h3><span className="text-xs text-gray-400">({auditLogs.length} {t('settings.entries_count')})</span></div>
            <Button size="sm" variant="secondary" icon={<RotateCcw size={13} />} onClick={refreshAuditLogs}>{t('settings.refresh')}</Button>
          </div>
          {auditLogs.length === 0 ? (
            <div className="py-16 text-center"><FileText size={36} className="mx-auto text-gray-200 mb-3" /><p className="text-gray-400 text-sm">{t('settings.noAudit')}</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider"><th className="text-left px-4 py-3">{t('settings.colTime')}</th><th className="text-left px-4 py-3">{t('settings.colAction')}</th><th className="text-left px-4 py-3">{t('settings.colEntity')}</th><th className="text-left px-4 py-3">{t('settings.colSummary')}</th></tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap"><div className="flex items-center gap-1"><Clock size={11} />{format(new Date(log.timestamp), 'dd MMM yyyy HH:mm')}</div></td>
                      <td className="px-4 py-3"><Badge variant={actionBadge[log.action] || 'gray'}>{log.action}</Badge></td>
                      <td className="px-4 py-3 text-gray-500 text-xs font-medium">{log.entity}</td>
                      <td className="px-4 py-3 text-gray-700 text-xs">{log.summary}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Users Management (Admin & above) ── */}
      {tab === 'users' && canManageUsers && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-50 rounded-xl p-2 text-blue-800"><Users size={20} /></div>
              <div>
                <h3 className="font-semibold text-gray-800">{t('settings.userMgmt')}</h3>
                <p className="text-xs text-gray-500">{t('settings.userMgmtSub')}</p>
              </div>
            </div>
            <Button icon={<UserPlus size={14} />} onClick={openCreateUser}>
              {t('settings.createUser')}
            </Button>
          </div>

          {userFormSuccess && (
            <div className="p-3 rounded-lg text-sm bg-emerald-50 text-emerald-800 flex items-center gap-2">
              <CheckCircle size={16} /> {userFormSuccess}
            </div>
          )}
          {userFormError && (
            <div className="p-3 rounded-lg text-sm bg-red-50 text-red-700 flex items-center gap-2">
              <AlertTriangle size={16} /> {userFormError}
            </div>
          )}

          {/* User Form Modal */}
          {showUserForm && (
            <div className="border border-gray-200 rounded-xl p-5 space-y-4 bg-gray-50">
              <h4 className="font-semibold text-gray-800">
                {editingUserId ? t('settings.editUser') : t('settings.createUser')}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label={t('auth.username')}
                  value={userForm.username}
                  onChange={e => setUserForm(f => ({ ...f, username: e.target.value }))}
                  placeholder="username"
                  disabled={!!editingUserId}
                />
                <Input
                  label={t('auth.password')}
                  value={userForm.password}
                  onChange={e => setUserForm(f => ({ ...f, password: e.target.value }))}
                  placeholder={editingUserId ? 'Leave blank to keep current' : 'Password'}
                  type="password"
                />
                <Input
                  label="Display Name"
                  value={userForm.displayName}
                  onChange={e => setUserForm(f => ({ ...f, displayName: e.target.value }))}
                  placeholder="Display Name"
                />
                {user?.isSystemAdmin && (
                  <label className="flex items-center gap-3 cursor-pointer select-none pt-5">
                    <div onClick={() => setUserForm(f => ({ ...f, isAdmin: !f.isAdmin }))}
                      className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${userForm.isAdmin ? 'bg-blue-500' : 'bg-gray-300'}`}>
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${userForm.isAdmin ? 'translate-x-6' : 'translate-x-0'}`} />
                    </div>
                    <span className="text-sm font-medium text-gray-700">Can manage users</span>
                  </label>
                )}
                <label className="flex items-center gap-3 cursor-pointer select-none pt-5">
                  <div onClick={() => setUserForm(f => ({ ...f, isActive: !f.isActive }))}
                    className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${userForm.isActive ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${userForm.isActive ? 'translate-x-6' : 'translate-x-0'}`} />
                  </div>
                  <span className="text-sm font-medium text-gray-700">{t('settings.userActive')}</span>
                </label>
              </div>
              <div className="flex gap-3">
                <Button icon={<Save size={14} />} onClick={handleUserSubmit}>
                  {editingUserId ? t('settings.save') : t('settings.createUser')}
                </Button>
                <Button variant="secondary" onClick={resetUserForm}>{t('settings.cancel')}</Button>
              </div>
            </div>
          )}

          {/* User List */}
          {appUsers.length === 0 ? (
            <div className="py-10 text-center text-gray-400 text-sm">{t('settings.noUsers')}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                    <th className="text-left px-4 py-3">Username</th>
                    <th className="text-left px-4 py-3">Name</th>
                    <th className="text-left px-4 py-3">Role</th>
                    <th className="text-left px-4 py-3">Status</th>
                    <th className="text-left px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {appUsers.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs">{u.username}</td>
                      <td className="px-4 py-3 text-gray-700">{u.displayName}</td>
                      <td className="px-4 py-3">
                        <Badge variant={u.isSystemAdmin ? 'green' : u.isAdmin ? 'blue' : 'gray'}>
                          {u.isSystemAdmin ? 'System Admin' : u.isAdmin ? 'Admin' : 'User'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={u.isActive ? 'green' : 'orange'}>
                          {u.isActive ? 'Active' : 'Deactivated'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs space-x-1">
                        <button onClick={() => openEditUser(u)}
                          className="text-blue-600 hover:text-blue-800 px-1"><Key size={14} /></button>
                        {u.isActive && !u.isSystemAdmin && !(u.username === 'Admin' && user?.username !== 'System Admin') && (
                          <button onClick={() => handleDeactivateUser(u.id)}
                            className="text-orange-500 hover:text-orange-700 px-1"><UserMinus size={14} /></button>
                        )}
                        {!u.isActive && !u.isSystemAdmin && (
                          <button onClick={() => handleReactivateUser(u.id)}
                            className="text-emerald-600 hover:text-emerald-800 px-1"><UserPlus size={14} /></button>
                        )}
                        {!u.isSystemAdmin && !(u.username === 'Admin') && (
                          <button onClick={() => handleDeleteUser(u.id)}
                            className="text-red-500 hover:text-red-700 px-1"><Trash2 size={14} /></button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Sent Count Reset ── */}
      {tab === 'sentCount' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-blue-50 rounded-xl p-2 text-blue-800"><RotateCcw size={20} /></div>
              <div>
                <h3 className="font-semibold text-gray-800">{t('settings.resetSent')}</h3>
                <p className="text-xs text-gray-500">{t('settings.resetSentSub')}</p>
              </div>
            </div>

            {sentCountResetDone && (
              <div className="mb-4 p-3 rounded-lg text-sm bg-emerald-50 text-emerald-800 flex items-center gap-2">
                <CheckCircle size={16} /> {t('settings.resetSuccess')}
              </div>
            )}
            {sentCountResetError && (
              <div className="mb-4 p-3 rounded-lg text-sm bg-red-50 text-red-700 flex items-center gap-2">
                <AlertTriangle size={16} /> {sentCountResetError}
              </div>
            )}

            {/* Reset for single customer */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">{t('settings.resetSingle')}</h4>
              <div className="flex gap-3 items-end flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <Select
                    label={t('sidebar.customers')}
                    value={selectedResetCustomer}
                    onChange={(e) => { setSelectedResetCustomer(e.target.value); setSentCountResetError(''); }}
                    options={sentCountCustomers.map(c => ({
                      value: c.id,
                      label: `${c.customerName} - ${c.shopName} (sent: ${c.totalSentCount ?? 0})`,
                    }))}
                    placeholder={t('sidebar.customers')}
                  />
                </div>
                <Button
                  variant="secondary"
                  icon={<RotateCcw size={14} />}
                  onClick={handleResetCustomerSentCount}
                  disabled={!selectedResetCustomer}
                >
                  {t('settings.resetSelected')}
                </Button>
              </div>
            </div>

            {/* Reset for all */}
            <div className="pt-4 border-t border-gray-100">
              <h4 className="text-sm font-semibold text-red-700 mb-2">{t('settings.resetAll')}</h4>
              <p className="text-xs text-gray-500 mb-3">
                {t('settings.resetAllDesc')} {sentCountCustomers.length} {t('settings.entries_count')}.
              </p>
              <Button
                variant="danger"
                icon={<AlertTriangle size={14} />}
                onClick={handleResetAllSentCounts}
                disabled={sentCountCustomers.length === 0}
              >
                {t('settings.resetAllBtn')}
              </Button>
            </div>

            {/* Delete ALL entries for fresh setup */}
            <div className="pt-6 border-t border-gray-100 mt-4">
              <h4 className="text-sm font-semibold text-red-800 mb-2">Fresh Business Setup</h4>
              <p className="text-xs text-gray-500 mb-3">
                Delete all dispatch, return, and stock position entries. Reset all customer sent counts to 0.
                Only customers, areas, and sources will be preserved.
              </p>
              {deleteAllDone && (
                <div className="mb-4 p-3 rounded-lg text-sm bg-emerald-50 text-emerald-800 flex items-center gap-2">
                  <CheckCircle size={16} /> All entries deleted successfully. You can now start fresh.
                </div>
              )}
              {deleteAllError && (
                <div className="mb-4 p-3 rounded-lg text-sm bg-red-50 text-red-700 flex items-center gap-2">
                  <AlertTriangle size={16} /> {deleteAllError}
                </div>
              )}
              <Button
                variant="danger"
                icon={<Trash2 size={14} />}
                onClick={() => setDeleteAllConfirm(true)}
                disabled={deletingAll}
              >
                {deletingAll ? 'Deleting...' : 'Clear All Entries & Reset Sent Counts'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal open={deleteAllConfirm} onClose={() => setDeleteAllConfirm(false)} onConfirm={handleDeleteAllEntries}
        title="Delete All Entries?" message="This will permanently delete all dispatch, return, and stock position entries. It will also reset all customer sent counts to 0. Customers, areas, and sources will NOT be affected. This action cannot be undone." confirmLabel="Yes, Delete All Entries" variant="danger" />
    </div>
  );
};
