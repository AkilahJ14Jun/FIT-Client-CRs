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
  alternateMobile?: string;
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
  stockThreshold: number;
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
  stockAlertThresholdCount: number;
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
  stockAlertThresholdCount: 50,
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
    } catch (err) {
      console.error('Failed to reset sent count for customer', id, err);
      return null;
    }
  },
  async resetAllSentCounts(): Promise<boolean> {
    try {
      await apiFetch('/customers/reset-all-sent-counts', { method: 'POST' });
      return true;
    } catch (err) {
      console.error('Failed to reset all sent counts:', err);
      return false;
    }
  },
  async deleteAllEntries(): Promise<{ success: boolean; deletedCount?: number }> {
    return apiFetch('/entries/delete-all', { method: 'POST' });
  },
  /** Calculates cumulative balance and variety-level totals for a customer.
   *  Optionally excludes a specific bill (useful for 'Already Sent' calculation in Edit mode).
   */
  async getHistorySummary(customerId: string, excludeBillNumber?: string): Promise<{
    cumulativeBalance: number;
    varietyTotals: Record<string, number>;
  }> {
    const allEntries = await apiFetch<BoxEntry[]>('/entries');
    const customerEntries = allEntries
      .filter(e => e.customerId === customerId && e.billNumber !== excludeBillNumber)
      .sort((a, b) => a.entryDate.localeCompare(b.entryDate));

    let cumulativeBalance = 0;
    const varietyTotals: Record<string, number> = {};

    for (const e of customerEntries) {
      if (e.entryType === 'dispatch' || e.entryType === 'opening_balance') {
        const todaySent = e.currentQuantity || 0;
        cumulativeBalance += todaySent;

        if (e.openingStockSources) {
          for (const s of e.openingStockSources) {
            varietyTotals[s.sourceId] = (varietyTotals[s.sourceId] || 0) + s.quantity;
          }
        } else if (e.isExternalSource && e.sourceId) {
          // Legacy single-variety dispatch
          varietyTotals[e.sourceId] = (varietyTotals[e.sourceId] || 0) + (e.externalBoxCount || 0);
        }
      } else if (e.entryType === 'return') {
        const returned = e.boxesReturned || 0;
        cumulativeBalance -= returned;
        
        // If variety-specific returns are supported
        if (e.openingStockSources) {
          for (const s of e.openingStockSources) {
            varietyTotals[s.sourceId] = (varietyTotals[s.sourceId] || 0) - s.quantity;
          }
        } else {
          // Simple return: proportionally deduct from variety totals if possible?
          // For now, we assume simple return reduces general balance.
          // In a truly variety-centric system, returns should specify varieties.
        }
      }
    }

    return { cumulativeBalance, varietyTotals };
  }
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
  async create(data: Omit<InventorySource, 'id' | 'createdAt' | 'updatedAt' | 'isActive' | 'stockThreshold'>): Promise<InventorySource> {
    return apiFetch<InventorySource>('/sources', {
      method: 'POST',
      body: JSON.stringify({ ...data, stockThreshold: 0 }),
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
  /** Returns the LIVE stock position by taking the latest opening_balance entry
   *  and adjusting each component (company + per-source) for all subsequent
   *  dispatch and return entries. Shows ALL active inventory sources in the system.
   */
  async getLiveStockPosition(): Promise<{
    entry: BoxEntry | null;
    liveCompanyQty: number;
    liveSources: Array<{ sourceId: string; sourceName: string; quantity: number }>;
    liveTotal: number;
  }> {
    const all = await this.getAll();
    // Find the most recent stock position entry
    const obEntries = all
      .filter((e) => e.entryType === 'opening_balance')
      .sort((a, b) => b.entryDate.localeCompare(a.entryDate));
    const ob = obEntries[0] ?? null;
    const obSources = ob?.openingStockSources ?? [];

    // Sum own-inventory dispatches and returns (non-external)
    const ownDispatched = all
      .filter((e) => e.entryType === 'dispatch' && !e.isExternalSource)
      .reduce((s, e) => s + (e.currentQuantity || 0), 0);
    const ownReturned = all
      .filter((e) => e.entryType === 'return')
      .reduce((s, e) => s + (e.boxesReturned || 0), 0);

    const liveCompanyQty = Math.max(0, (ob?.companyOwnQuantity ?? 0) - ownDispatched + ownReturned);

    // Get all active sources to ensure ALL are shown in summary
    const allSources = await SourceDB.getAll();
    const liveSources: Array<{ sourceId: string; sourceName: string; quantity: number }> = [];

    // Calculate deductions for each variety
    const seenSourceIds = new Set<string>();
    for (const src of obSources) {
      // Find all dispatches and returns that affected this specific variety
      const srcNetDispatched = all.reduce((net, e) => {
        if (e.entryType === 'opening_balance') return net; // Skip other OBs
        
        // Check for specific variety in openingStockSources (multi-row mode)
        const rowQty = e.openingStockSources?.find(ss => ss.sourceId === src.sourceId)?.quantity || 0;
        
        // Handle legacy single-variety field
        const legacyQty = (e.isExternalSource && e.sourceId === src.sourceId) ? (e.externalBoxCount || 0) : 0;
        
        const change = Math.max(rowQty, legacyQty);
        
        if (e.entryType === 'dispatch') return net + change;
        if (e.entryType === 'return')   return net - change; // Currently returns are assumed company-owned, but handling variety returns if present
        return net;
      }, 0);

      liveSources.push({
        sourceId: src.sourceId,
        sourceName: src.sourceName,
        quantity: Math.max(0, src.quantity - srcNetDispatched),
      });
      seenSourceIds.add(src.sourceId);
    }

    // Append any active sources NOT in the stock position
    for (const src of allSources) {
      if (!src.isActive || seenSourceIds.has(src.id)) continue;
      const srcNetDispatched = all.reduce((net, e) => {
        if (e.entryType === 'opening_balance') return net;
        const rowQty = e.openingStockSources?.find(ss => ss.sourceId === src.id)?.quantity || 0;
        const legacyQty = (e.isExternalSource && e.sourceId === src.id) ? (e.externalBoxCount || 0) : 0;
        const change = Math.max(rowQty, legacyQty);
        
        if (e.entryType === 'dispatch') return net + change;
        if (e.entryType === 'return')   return net - change;
        return net;
      }, 0);

      liveSources.push({
        sourceId: src.id,
        sourceName: src.sourceName,
        quantity: Math.max(0, -srcNetDispatched),
      });
    }

    const liveTotal = liveCompanyQty + liveSources.reduce((s, r) => s + r.quantity, 0);
    return { entry: ob, liveCompanyQty, liveSources, liveTotal };
  },

  /** CR6: After a dispatch or return is saved, find the latest stock position
   *  entry and update its companyOwnQuantity and openingStockSources quantities.
   *  - Dispatch (own):     companyOwnQuantity -= currentQuantity
   *  - Dispatch (external): source[sourceId].quantity -= externalBoxCount
   *  - Return:             companyOwnQuantity += boxesReturned
   */
  async updateStockPositionAfterEntry(savedEntry: BoxEntry): Promise<void> {
    const all = await this.getAll();
    const obEntries = all
      .filter((e) => e.entryType === 'opening_balance' && /^\d+$/.test(e.billNumber))
      .sort((a, b) => b.entryDate.localeCompare(a.entryDate));
    const ob = obEntries[0];
    if (!ob) return; // No stock position to update

    let newCompanyQty = ob.companyOwnQuantity ?? 0;
    let newSources    = (ob.openingStockSources ?? []).map((s) => ({ ...s }));

    if (savedEntry.entryType === 'dispatch') {
      // 1. Deduct all variety quantities from their respective entries in newSources
      if (savedEntry.openingStockSources && savedEntry.openingStockSources.length > 0) {
        for (const dispatchSrc of savedEntry.openingStockSources) {
          newSources = newSources.map((s) =>
            s.sourceId === dispatchSrc.sourceId
              ? { ...s, quantity: Math.max(0, s.quantity - dispatchSrc.quantity) }
              : s
          );
        }
      } else if (savedEntry.isExternalSource && savedEntry.sourceId) {
        // Fallback for legacy single-variety dispatches
        newSources = newSources.map((s) =>
          s.sourceId === savedEntry.sourceId
            ? { ...s, quantity: Math.max(0, s.quantity - (savedEntry.externalBoxCount ?? 0)) }
            : s
        );
      } else {
        // Deduct from company own inventory
        newCompanyQty = Math.max(0, newCompanyQty - (savedEntry.currentQuantity ?? 0));
      }
    } else if (savedEntry.entryType === 'return') {
      // Support for variety-specific returns if present in openingStockSources
      if (savedEntry.openingStockSources && savedEntry.openingStockSources.length > 0) {
        for (const returnSrc of savedEntry.openingStockSources) {
          newSources = newSources.map((s) =>
            s.sourceId === returnSrc.sourceId
              ? { ...s, quantity: s.quantity + returnSrc.quantity }
              : s
          );
        }
      } else {
        // Default: returns replenish company own inventory
        newCompanyQty = newCompanyQty + (savedEntry.boxesReturned ?? 0);
      }
    }

    const newTotal = newCompanyQty + newSources.reduce((s, r) => s + r.quantity, 0);
    await this.update(ob.id, {
      companyOwnQuantity:  newCompanyQty,
      openingStockSources: newSources,
      currentQuantity:     newTotal,
      balanceBoxes:        newTotal,
    });
  },

  async nextBillNumber(entryType?: string): Promise<string> {
    const [settings, entries] = await Promise.all([SettingsDB.get(), this.getAll()]);
    const prefix = settings.billPrefix || 'BILL';
    const nums = entries
      .map((e) => {
        // Extract numeric portion from any format: '000001', 'BILL-000001', 'BILL-001'
        const m = e.billNumber.match(/(\d+)$/);
        return m ? parseInt(m[1], 10) : 0;
      })
      .filter(Boolean);
    const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
    const sixDigit = String(next).padStart(6, '0');
    // Stock Position entries: plain 6-digit number (no prefix)
    // Dispatch / Return entries: prefix-6digit (e.g. BILL-000001)
    if (entryType === 'opening_balance') {
      return sixDigit;
    }
    return `${prefix}-${sixDigit}`;
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
    lowVarieties: string[];
    shouldAlert: boolean;
  }> {
    const [settings, entries, sources] = await Promise.all([
      SettingsDB.get(),
      EntryDB.getAll(),
      SourceDB.getAll()
    ]);
    
    // Global Stock
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
    
    // Variety Specific Stock
    const lowVarieties: string[] = [];
    const activeSources = sources.filter(v => v.isActive !== false);
    
    for (const source of activeSources) {
      if (!source.stockThreshold || source.stockThreshold <= 0) continue;
      
      const sOpening = entries
        .filter(e => e.entryType === 'opening_balance' && e.openingStockSources?.some(ss => ss.sourceId === source.id))
        .reduce((sum, e) => {
          const matched = e.openingStockSources?.find(ss => ss.sourceId === source.id);
          return sum + (matched?.quantity || 0);
        }, 0);
        
      const sDispatched = entries
        .filter(e => e.entryType === 'dispatch' && e.sourceId === source.id)
        .reduce((sum, e) => sum + (e.externalBoxCount || 0), 0);
        
      const sCurrent = sOpening - sDispatched;
      if (sCurrent < source.stockThreshold) {
        lowVarieties.push(source.sourceName);
      }
    }
    
    const dismissed = await this.isDismissed();
    const globalCountThreshold = settings.stockAlertThresholdCount ?? 50;
    
    // Alert if:
    // 1. Global stock is below global count threshold
    // 2. OR Any variety is below its specific threshold
    const shouldGlobalAlert = currentStock < globalCountThreshold;
    const shouldVarietyAlert = lowVarieties.length > 0;
    
    const shouldAlert =
      settings.stockAlertEnabled &&
      openingStock > 0 &&
      (shouldGlobalAlert || shouldVarietyAlert) &&
      !dismissed;
      
    return { 
      openingStock, 
      currentStock, 
      totalDispatched, 
      totalReturned, 
      percentRemaining, 
      lowVarieties,
      shouldAlert 
    };
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
  areas: CustomerArea[];
  sources: InventorySource[];
  entries: BoxEntry[];
  settings: AppSettings;
}

export const BackupDB = {
  async export(): Promise<BackupPayload> {
    const [customers, areas, sources, entries, settings] = await Promise.all([
      CustomerDB.getAll(),
      AreaDB.getAll(),
      SourceDB.getAll(),
      EntryDB.getAll(),
      SettingsDB.get(),
    ]);
    return {
      version: DB_VERSION,
      exportedAt: new Date().toISOString(),
      customers,
      areas,
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

// ─── System DB ────────────────────────────────────────────────────────────────

export const SystemDB = {
  async clearAll(): Promise<{ success: boolean; message: string }> {
    return apiFetch('/system/clear-all', { method: 'POST' });
  },
  async importData(payload: BackupPayload): Promise<{ success: boolean; message: string }> {
    return apiFetch('/system/import', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};
