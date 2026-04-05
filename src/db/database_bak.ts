// FIT – Fish Inventory Tracking v3.0
// Persistence: MySQL via REST API backend (replaces localStorage)
// All methods are async and return Promises.

export const DB_VERSION = '3.0.0';

// ─── Core Types (unchanged – shared with backend entities) ────────────────────

export interface CustomerArea {
  id: string;
  areaName: string;
  notes: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  customerName: string;
  shopName: string;
  address: string;
  mobile: string;
  email?: string;
  notes?: string;
  areaId?: string;
  totalSentCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InventorySource {
  id: string;
  sourceName: string;
  contactPerson: string;
  mobile: string;
  address: string;
  notes: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type EntryType = 'opening_balance' | 'dispatch' | 'return';

export interface OpeningStockSource {
  sourceId: string;
  sourceName: string;
  quantity: number;
}

export interface BoxEntry {
  id: string;
  billNumber: string;
  entryDate: string;
  customerId: string;
  customerName?: string;
  shopName?: string;
  description: string;
  entryType: EntryType;
  totalBoxesSent: number;
  currentQuantity: number;
  boxesReturned: number;
  balanceBoxes: number;
  driverName: string;
  vehicleNumber: string;
  isExternalSource: boolean;
  sourceId?: string;
  sourceName?: string;
  externalBoxCount?: number;
  companyOwnQuantity?: number;
  openingStockSources?: OpeningStockSource[];
  createdAt: string;
  updatedAt: string;
}

export interface AppSettings {
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail?: string;
  traderName?: string;
  gstNumber?: string;
  billPrefix: string;
  currency: string;
  dateFormat: string;
  autoBackup: boolean;
  lastBackup?: string;
  theme: 'light' | 'dark';
  stockAlertEnabled: boolean;
  stockAlertThreshold: number;
  stockAlertDismissedUntil?: string;
  language: 'en' | 'ta' | 'hi';
}

export interface AuditLog {
  id: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  entity: string;
  entityId: string;
  summary: string;
  timestamp: string;
}

// ─── Default settings (used as fallback) ──────────────────────────────────────

const DEFAULT_SETTINGS: AppSettings = {
  companyName: 'FIT – Fish Inventory Tracking',
  companyAddress: '',
  companyPhone: '',
  companyEmail: '',
  traderName: '',
  gstNumber: '',
  billPrefix: 'BILL',
  currency: 'INR',
  dateFormat: 'dd MMM yyyy',
  autoBackup: true,
  theme: 'light',
  stockAlertEnabled: true,
  stockAlertThreshold: 30,
  language: 'en',
};

// ─── API helper ────────────────────────────────────────────────────────────────

const API = '/api';

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `API error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ─── Settings DB ──────────────────────────────────────────────────────────────

export const SettingsDB = {
  async get(): Promise<AppSettings> {
    try {
      return await apiFetch<AppSettings>('/settings');
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  },
  async save(data: Partial<AppSettings>): Promise<AppSettings> {
    return apiFetch<AppSettings>('/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  async reset(): Promise<AppSettings> {
    return apiFetch<AppSettings>('/settings', {
      method: 'PUT',
      body: JSON.stringify(DEFAULT_SETTINGS),
    });
  },
};

// ─── Customer DB ──────────────────────────────────────────────────────────────

export const CustomerDB = {
  async getAll(): Promise<Customer[]> {
    return apiFetch<Customer[]>('/customers');
  },
  async getActive(): Promise<Customer[]> {
    const all = await this.getAll();
    return all.filter((c) => c.isActive !== false);
  },
  async getById(id: string): Promise<Customer | undefined> {
    try {
      return await apiFetch<Customer>(`/customers/${id}`);
    } catch {
      return undefined;
    }
  },
  async create(data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'isActive'>): Promise<Customer> {
    return apiFetch<Customer>('/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  async update(id: string, data: Partial<Omit<Customer, 'id' | 'createdAt'>>): Promise<Customer | null> {
    try {
      return await apiFetch<Customer>(`/customers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    } catch {
      return null;
    }
  },
  async delete(id: string): Promise<boolean> {
    try {
      await apiFetch(`/customers/${id}`, { method: 'DELETE' });
      return true;
    } catch {
      return false;
    }
  },
  async count(): Promise<number> {
    const all = await this.getAll();
    return all.length;
  },
  async resetSentCount(id: string): Promise<Customer | null> {
    try {
      return await apiFetch<Customer>(`/customers/${id}/reset-sent-count`, { method: 'POST' });
    } catch { return null; }
  },
  async resetAllSentCounts(): Promise<boolean> {
    try {
      await apiFetch('/customers/reset-all-sent-counts', { method: 'POST' });
      return true;
    } catch { return false; }
  },
};

// ─── Source DB ────────────────────────────────────────────────────────────────

export const SourceDB = {
  async getAll(): Promise<InventorySource[]> {
    return apiFetch<InventorySource[]>('/sources');
  },
  async getActive(): Promise<InventorySource[]> {
    const all = await this.getAll();
    return all.filter((s) => s.isActive !== false);
  },
  async getById(id: string): Promise<InventorySource | undefined> {
    try {
      return await apiFetch<InventorySource>(`/sources/${id}`);
    } catch {
      return undefined;
    }
  },
  async create(data: Omit<InventorySource, 'id' | 'createdAt' | 'updatedAt' | 'isActive'>): Promise<InventorySource> {
    return apiFetch<InventorySource>('/sources', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  async update(id: string, data: Partial<Omit<InventorySource, 'id' | 'createdAt'>>): Promise<InventorySource | null> {
    try {
      return await apiFetch<InventorySource>(`/sources/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    } catch {
      return null;
    }
  },
  async delete(id: string): Promise<boolean> {
    try {
      await apiFetch(`/sources/${id}`, { method: 'DELETE' });
      return true;
    } catch {
      return false;
    }
  },
  async count(): Promise<number> {
    const all = await this.getAll();
    return all.length;
  },
};

// ─── Customer Area DB ────────────────────────────────────────────────────────

export const AreaDB = {
  async getAll(): Promise<CustomerArea[]> {
    return apiFetch<CustomerArea[]>('/customer-areas');
  },
  async getById(id: string): Promise<CustomerArea | undefined> {
    try { return await apiFetch<CustomerArea>(`/customer-areas/${id}`); }
    catch { return undefined; }
  },
  async create(data: Omit<CustomerArea, 'id' | 'createdAt' | 'updatedAt' | 'isActive'>): Promise<CustomerArea> {
    return apiFetch<CustomerArea>('/customer-areas', {
      method: 'POST', body: JSON.stringify(data),
    });
  },
  async update(id: string, data: Partial<Omit<CustomerArea, 'id' | 'createdAt'>>): Promise<CustomerArea | null> {
    try {
      return await apiFetch<CustomerArea>(`/customer-areas/${id}`, {
        method: 'PUT', body: JSON.stringify(data),
      });
    } catch { return null; }
  },
  async delete(id: string): Promise<boolean> {
    try { await apiFetch(`/customer-areas/${id}`, { method: 'DELETE' }); return true; }
    catch { return false; }
  },
};

// ─── Entry DB ─────────────────────────────────────────────────────────────────

export const EntryDB = {
  async getAll(): Promise<BoxEntry[]> {
    return apiFetch<BoxEntry[]>('/entries');
  },
  async getById(id: string): Promise<BoxEntry | undefined> {
    try {
      return await apiFetch<BoxEntry>(`/entries/${id}`);
    } catch {
      return undefined;
    }
  },
  async getByCustomer(customerId: string): Promise<BoxEntry[]> {
    const all = await this.getAll();
    return all.filter((e) => e.customerId === customerId);
  },
  async getByDateRange(from: string, to: string): Promise<BoxEntry[]> {
    const all = await this.getAll();
    return all.filter((e) => e.entryDate >= from && e.entryDate <= to);
  },
  async getByCustomerAndDateRange(customerId: string, from: string, to: string): Promise<BoxEntry[]> {
    const all = await this.getAll();
    return all.filter(
      (e) => e.customerId === customerId && e.entryDate >= from && e.entryDate <= to
    );
  },
  async getToday(): Promise<BoxEntry[]> {
    const today = new Date().toISOString().split('T')[0];
    return this.getByDateRange(today, today);
  },
  async getYesterday(): Promise<BoxEntry[]> {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const yesterday = d.toISOString().split('T')[0];
    return this.getByDateRange(yesterday, yesterday);
  },
  async create(data: Omit<BoxEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<BoxEntry> {
    return apiFetch<BoxEntry>('/entries', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  async update(id: string, data: Partial<Omit<BoxEntry, 'id' | 'createdAt'>>): Promise<BoxEntry | null> {
    try {
      return await apiFetch<BoxEntry>(`/entries/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    } catch {
      return null;
    }
  },
  async delete(id: string): Promise<boolean> {
    try {
      await apiFetch(`/entries/${id}`, { method: 'DELETE' });
      return true;
    } catch {
      return false;
    }
  },
  async count(): Promise<number> {
    const all = await this.getAll();
    return all.length;
  },
  async nextBillNumber(): Promise<string> {
    const entries = await this.getAll();
    const nums = entries
      .map((e) => {
        // Support both legacy 'PREFIX-NNNN' and new pure 6-digit formats
        const m6 = e.billNumber.match(/^(\d{6})$/);
        if (m6) return parseInt(m6[1], 10);
        const mPfx = e.billNumber.match(/-(\d+)$/);
        return mPfx ? parseInt(mPfx[1], 10) : 0;
      })
      .filter(Boolean);
    const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
    return String(next).padStart(6, '0');
  },
};

// ─── Stock Alert DB ───────────────────────────────────────────────────────────

export const StockAlertDB = {
  async isDismissed(): Promise<boolean> {
    const settings = await SettingsDB.get();
    if (!settings.stockAlertDismissedUntil) return false;
    const now = new Date().toISOString().split('T')[0];
    return settings.stockAlertDismissedUntil > now;
  },
  async dismissUntilTomorrow(): Promise<void> {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    await SettingsDB.save({ stockAlertDismissedUntil: tomorrow.toISOString().split('T')[0] });
  },
  async dismissPermanently(): Promise<void> {
    await SettingsDB.save({ stockAlertEnabled: false });
  },
  async enable(): Promise<void> {
    await SettingsDB.save({ stockAlertEnabled: true, stockAlertDismissedUntil: undefined });
  },
  async getStockLevel(): Promise<{
    openingStock: number;
    currentStock: number;
    totalDispatched: number;
    totalReturned: number;
    percentRemaining: number;
    shouldAlert: boolean;
  }> {
    const [settings, entries] = await Promise.all([SettingsDB.get(), EntryDB.getAll()]);
    const openingStock = entries
      .filter((e) => e.entryType === 'opening_balance')
      .reduce((s, e) => s + (e.currentQuantity || 0), 0);
    const totalDispatched = entries
      .filter((e) => e.entryType === 'dispatch')
      .reduce((s, e) => s + e.currentQuantity, 0);
    const totalReturned = entries
      .filter((e) => e.entryType === 'return')
      .reduce((s, e) => s + e.boxesReturned, 0);
    const currentStock = Math.max(0, openingStock - totalDispatched + totalReturned);
    const percentRemaining = openingStock > 0
      ? Math.round((currentStock / openingStock) * 100)
      : 100;
    const threshold = settings.stockAlertThreshold ?? 30;
    const dismissed = await this.isDismissed();
    const shouldAlert =
      settings.stockAlertEnabled &&
      openingStock > 0 &&
      percentRemaining <= threshold &&
      !dismissed;
    return { openingStock, currentStock, totalDispatched, totalReturned, percentRemaining, shouldAlert };
  },
};

// ─── Dashboard Stats ──────────────────────────────────────────────────────────

export interface DashboardStats {
  totalCustomers: number;
  totalSources: number;
  totalEntries: number;
  totalBoxesSent: number;
  totalBoxesReturned: number;
  totalBalanceBoxes: number;
  stockLevel: Awaited<ReturnType<typeof StockAlertDB.getStockLevel>>;
  todaySent: number;
  todayReturned: number;
  todayBalance: number;
  todayEntries: number;
  yesterdaySent: number;
  yesterdayReturned: number;
  yesterdayBalance: number;
  mtdSent: number;
  mtdReturned: number;
  mtdBalance: number;
  topCustomers: { name: string; shop: string; sent: number; balance: number }[];
  recentEntries: BoxEntry[];
  monthlyTotals: { month: string; sent: number; returned: number }[];
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const [entries, customers, sourcesAll, stockLevel] = await Promise.all([
    EntryDB.getAll(),
    CustomerDB.getAll(),
    SourceDB.getAll(),
    StockAlertDB.getStockLevel(),
  ]);
  const today = new Date().toISOString().split('T')[0];
  const todayEntries = entries.filter((e) => e.entryDate === today);

  const d = new Date();
  d.setDate(d.getDate() - 1);
  const yesterday = d.toISOString().split('T')[0];
  const yesterdayEntries = entries.filter((e) => e.entryDate === yesterday);
  const monthStart = today.slice(0, 8) + '01';
  const monthEntries = entries.filter((e) => e.entryDate >= monthStart && e.entryDate <= today);

  const totalBoxesSent     = entries.reduce((s, e) => s + e.totalBoxesSent + e.currentQuantity, 0);
  const totalBoxesReturned = entries.reduce((s, e) => s + e.boxesReturned, 0);
  const totalBalanceBoxes  = entries.reduce((s, e) => s + e.balanceBoxes, 0);

  const customerMap: Record<string, { name: string; shop: string; sent: number; balance: number }> = {};
  entries.forEach((e) => {
    if (!customerMap[e.customerId]) {
      customerMap[e.customerId] = { name: e.customerName || '', shop: e.shopName || '', sent: 0, balance: 0 };
    }
    customerMap[e.customerId].sent    += (e.totalBoxesSent + e.currentQuantity);
    customerMap[e.customerId].balance += e.balanceBoxes;
  });
  const topCustomers = Object.values(customerMap).sort((a, b) => b.sent - a.sent).slice(0, 5);

  const monthlyMap: Record<string, { sent: number; returned: number }> = {};
  entries.forEach((e) => {
    const month = e.entryDate.slice(0, 7);
    if (!monthlyMap[month]) monthlyMap[month] = { sent: 0, returned: 0 };
    monthlyMap[month].sent     += (e.totalBoxesSent + e.currentQuantity);
    monthlyMap[month].returned += e.boxesReturned;
  });
  const monthlyTotals = Object.entries(monthlyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, v]) => ({ month, ...v }));

  const todaySent     = todayEntries.reduce((s, e) => s + e.totalBoxesSent + e.currentQuantity, 0);
  const todayReturned = todayEntries.reduce((s, e) => s + e.boxesReturned, 0);
  const todayBalance  = todayEntries.reduce((s, e) => s + e.balanceBoxes, 0);

  const yesterdaySent     = yesterdayEntries.reduce((s, e) => s + e.totalBoxesSent + e.currentQuantity, 0);
  const yesterdayReturned = yesterdayEntries.reduce((s, e) => s + e.boxesReturned, 0);
  const yesterdayBalance  = yesterdayEntries.reduce((s, e) => s + e.balanceBoxes, 0);

  const mtdSent     = monthEntries.reduce((s, e) => s + e.totalBoxesSent + e.currentQuantity, 0);
  const mtdReturned = monthEntries.reduce((s, e) => s + e.boxesReturned, 0);
  const mtdBalance  = monthEntries.reduce((s, e) => s + e.balanceBoxes, 0);

  return {
    totalCustomers: customers.length,
    totalSources: sourcesAll.length,
    totalEntries: entries.length,
    totalBoxesSent,
    totalBoxesReturned,
    totalBalanceBoxes,
    stockLevel,
    todaySent,
    todayReturned,
    todayBalance,
    todayEntries: todayEntries.length,
    yesterdaySent,
    yesterdayReturned,
    yesterdayBalance,
    mtdSent,
    mtdReturned,
    mtdBalance,
    topCustomers,
    recentEntries: entries.slice(0, 10),
    monthlyTotals,
  };
}

// ─── Audit DB (read-only from frontend) ──────────────────────────────────────

export const AuditDB = {
  async getAll(): Promise<AuditLog[]> {
    try {
      return await apiFetch<AuditLog[]>('/audit');
    } catch {
      return [];
    }
  },
};

// ─── Backup DB ────────────────────────────────────────────────────────────────

export interface BackupPayload {
  version: string;
  exportedAt: string;
  customers: Customer[];
  sources: InventorySource[];
  entries: BoxEntry[];
  settings: AppSettings;
}

export const BackupDB = {
  async export(): Promise<BackupPayload> {
    const [customers, sources, entries, settings] = await Promise.all([
      CustomerDB.getAll(),
      SourceDB.getAll(),
      EntryDB.getAll(),
      SettingsDB.get(),
    ]);
    return {
      version: DB_VERSION,
      exportedAt: new Date().toISOString(),
      customers,
      sources,
      entries,
      settings,
    };
  },
  async exportJSON(): Promise<void> {
    const payload = await this.export();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FIT_Backup_${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    await SettingsDB.save({ lastBackup: new Date().toISOString() });
  },
};
