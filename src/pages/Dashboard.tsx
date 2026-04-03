import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Package, Users, Database, TrendingUp, ArrowRight,
  Truck, RotateCcw, BarChart3, Calendar
} from 'lucide-react';
import { FishLogo } from '../components/ui/FishLogo';
import { getDashboardStats, type DashboardStats } from '../db/database';
import { Badge } from '../components/ui/Badge';
import { StockAlertBanner } from '../components/ui/StockAlertBanner';
import { format } from 'date-fns';
import { useTranslation } from '../i18n/TranslationProvider';

const ENTRY_TYPE_BADGE: Record<string, 'blue' | 'green' | 'yellow' | 'orange' | 'purple'> = {
  dispatch: 'blue',
  return: 'green',
  opening_balance: 'yellow',
  balance_forward: 'orange',
  external_source: 'purple',
};

const EMPTY_STATS: DashboardStats = {
  totalCustomers: 0, totalSources: 0, totalEntries: 0,
  totalBoxesSent: 0, totalBoxesReturned: 0, totalBalanceBoxes: 0,
  stockLevel: { openingStock: 0, currentStock: 0, totalDispatched: 0, totalReturned: 0, percentRemaining: 100, shouldAlert: false },
  todaySent: 0, todayReturned: 0, todayBalance: 0, todayEntries: 0,
  yesterdaySent: 0, yesterdayReturned: 0, yesterdayBalance: 0,
  mtdSent: 0, mtdReturned: 0, mtdBalance: 0,
  topCustomers: [], recentEntries: [], monthlyTotals: [],
};

export const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState<DashboardStats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const todayLabel = format(new Date(), 'EEEE, dd MMM yyyy');

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getDashboardStats();
      setStats(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const handleAlertRefresh = useCallback(() => { reload(); }, [reload]);

  return (
    <div className="space-y-6">

      {/* ── TODAY'S DATE BANNER ── */}
      <div className="flex items-center gap-2 px-1">
        <Calendar size={15} className="text-blue-700" />
        <span className="text-sm font-semibold text-blue-800">
          {t('dash.today')} — {todayLabel}
        </span>
        <span className="ml-2 px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-bold">
          {loading ? '…' : stats.todayEntries} {stats.todayEntries === 1 ? t('dash.entry') : t('dash.entries')} {t('dash.entriesToday')}
        </span>
      </div>

      {/* ── TODAY'S KPI CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-gradient-to-br from-blue-900 to-blue-700 text-white p-5 shadow-md relative overflow-hidden">
          <div className="absolute top-2 right-3 text-[10px] font-bold opacity-60 uppercase tracking-widest">{t('dash.today')}</div>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs opacity-80 mb-1">{t('dash.boxesSent')}</p>
              <p className="text-4xl font-extrabold">{loading ? '…' : stats.todaySent}</p>
              <p className="text-xs opacity-60 mt-1">{t('dispatch.todayDesc')}</p>
            </div>
            <div className="opacity-20 mt-1"><Package size={40} /></div>
          </div>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-emerald-700 to-emerald-500 text-white p-5 shadow-md relative overflow-hidden">
          <div className="absolute top-2 right-3 text-[10px] font-bold opacity-60 uppercase tracking-widest">{t('dash.today')}</div>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs opacity-80 mb-1">{t('dash.boxesReturned')}</p>
              <p className="text-4xl font-extrabold">{loading ? '…' : stats.todayReturned}</p>
              <p className="text-xs opacity-60 mt-1">{t('return.todayDesc')}</p>
            </div>
            <div className="opacity-20 mt-1"><RotateCcw size={40} /></div>
          </div>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-amber-600 to-amber-500 text-white p-5 shadow-md relative overflow-hidden">
          <div className="absolute top-2 right-3 text-[10px] font-bold opacity-60 uppercase tracking-widest">{t('dash.today')}</div>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs opacity-80 mb-1">{t('dash.balanceBoxes')}</p>
              <p className="text-4xl font-extrabold">{loading ? '…' : stats.todayBalance}</p>
              <p className="text-xs opacity-60 mt-1">{t('balance.pendingDesc')}</p>
            </div>
            <div className="opacity-20 mt-1"><TrendingUp size={40} /></div>
          </div>
        </div>
      </div>

      {/* ── YESTERDAY COMPARISON ── */}
      <div className="flex items-center gap-2 px-1">
        <Calendar size={15} className="text-gray-500" />
        <span className="text-sm font-semibold text-gray-600">
          {t('dash.yesterday')}
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-gray-100 text-gray-700 p-4 shadow-sm">
          <p className="text-xs opacity-70 mb-1">{t('dash.boxesSent')}</p>
          <p className="text-3xl font-extrabold">{loading ? '…' : stats.yesterdaySent}</p>
        </div>
        <div className="rounded-2xl bg-gray-100 text-gray-700 p-4 shadow-sm">
          <p className="text-xs opacity-70 mb-1">{t('dash.boxesReturned')}</p>
          <p className="text-3xl font-extrabold">{loading ? '…' : stats.yesterdayReturned}</p>
        </div>
        <div className="rounded-2xl bg-gray-100 text-gray-700 p-4 shadow-sm">
          <p className="text-xs opacity-70 mb-1">{t('dash.balanceBoxes')}</p>
          <p className="text-3xl font-extrabold">{loading ? '…' : stats.yesterdayBalance}</p>
        </div>
      </div>

      {/* ── STOCK ALERT BANNER ── */}
      <StockAlertBanner onRefresh={handleAlertRefresh} />

      {/* ── TODAY ZERO-STATE NOTICE ── */}
      {!loading && stats.todayEntries === 0 && (
        <div className="rounded-xl border border-blue-100 bg-blue-50 px-5 py-4 flex items-center gap-3">
          <Truck size={18} className="text-blue-500 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-blue-800">{t('dash.noEntries')}</p>
            <p className="text-xs text-blue-600 mt-0.5">
              {t('dash.noEntriesDesc')}{' '}
              <Link to="/dispatch" className="underline font-medium">{t('dash.createDispatch')}</Link>
            </p>
          </div>
        </div>
      )}

      {/* ── QUICK LINKS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { to: '/customers', label: t('dash.customers'), count: stats.totalCustomers, icon: Users, color: 'text-blue-700 bg-blue-50' },
          { to: '/sources', label: t('dash.invSources'), count: stats.totalSources, icon: Database, color: 'text-emerald-700 bg-emerald-50' },
          { to: '/entries', label: t('dash.allEntries'), count: stats.totalEntries, icon: Package, color: 'text-purple-700 bg-purple-50' },
        ].map(({ to, label, count, icon: Icon, color }) => (
          <Link key={to} to={to} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow group">
            <div className="flex items-center gap-3">
              <div className={`rounded-xl p-2.5 ${color}`}><Icon size={20} /></div>
              <div>
                <p className="text-xs text-gray-500">{label}</p>
                <p className="text-xl font-bold text-gray-800">{loading ? '–' : count}</p>
              </div>
            </div>
            <ArrowRight size={16} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
          </Link>
        ))}
        <Link to="/dispatch" className="rounded-2xl bg-gradient-to-br from-blue-800 to-blue-600 text-white p-4 flex items-center justify-between shadow-md hover:shadow-lg transition-shadow group">
          <div>
            <p className="text-xs opacity-75">{t('dash.quickAction')}</p>
            <p className="text-sm font-bold mt-0.5">{t('dash.newDispatch')}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors"><Truck size={18} /></div>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {stats.topCustomers.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
              <BarChart3 size={16} className="text-blue-700" />
              <h3 className="font-semibold text-gray-800 text-sm">{t('dash.topCustomers')}</h3>
            </div>
            <div className="divide-y divide-gray-50">
              {stats.topCustomers.map((c, i) => (
                <div key={c.name} className="px-5 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 text-xs font-bold flex items-center justify-center">{i + 1}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{c.name}</p>
                      <p className="text-xs text-gray-400">{c.shop}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-800">{c.sent}</p>
                    <p className="text-xs text-amber-600">{t('dash.balance')}: {c.balance}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {stats.monthlyTotals.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
              <Calendar size={16} className="text-blue-700" />
              <h3 className="font-semibold text-gray-800 text-sm">{t('dash.monthlyTrend')}</h3>
            </div>
            <div className="p-4 space-y-3">
              {stats.monthlyTotals.map(({ month, sent, returned }) => {
                const maxVal = Math.max(...stats.monthlyTotals.map((m) => m.sent), 1);
                const pct = Math.round((sent / maxVal) * 100);
                return (
                  <div key={month}>
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span className="font-medium">{format(new Date(month + '-01'), 'MMM yyyy')}</span>
                      <span>{t('dash.sent')}: <strong>{sent}</strong> / {t('dash.returned')}: <strong>{returned}</strong></span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-blue-700 to-blue-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── RECENT ENTRIES TABLE ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2"><FishLogo size={22} /> {t('dash.recentEntries')}</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {t('dash.highlightedToday')}{' '}
              <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-200 inline-block" /></span>
            </p>
          </div>
          <Link to="/entries" className="text-xs text-blue-700 hover:text-blue-900 font-medium flex items-center gap-1">{t('dash.viewAll')} <ArrowRight size={13} /></Link>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-16 text-center text-gray-400 text-sm">{t('dash.loadingEntries')}</div>
          ) : stats.recentEntries.length === 0 ? (
            <div className="py-16 text-center">
              <Package size={36} className="mx-auto text-gray-200 mb-3" />
              <p className="text-gray-400 text-sm">{t('dash.noEntriesYet')}</p>
              <Link to="/dispatch" className="mt-3 inline-flex items-center gap-1 text-sm text-blue-700 font-medium hover:underline">{t('dash.newDispatch')} <ArrowRight size={13} /></Link>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                  <th className="text-left px-5 py-3">{t('entries.colDate')}</th>
                  <th className="text-left px-5 py-3">{t('entries.colBill')}</th>
                  <th className="text-left px-5 py-3">{t('entries.colCustomer')}</th>
                  <th className="text-left px-5 py-3">{t('entries.colType')}</th>
                  <th className="text-right px-5 py-3">{t('entries.colTotal')}</th>
                  <th className="text-right px-5 py-3">{t('entries.colReturned')}</th>
                  <th className="text-right px-5 py-3">{t('entries.colBalance')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {stats.recentEntries.map((e) => {
                  const isToday = e.entryDate === new Date().toISOString().split('T')[0];
                  return (
                    <tr key={e.id} className={`transition-colors ${isToday ? 'bg-blue-50/60 hover:bg-blue-100/60' : 'hover:bg-gray-50/60'}`}>
                      <td className="px-5 py-3 text-xs whitespace-nowrap">
                        {isToday ? (
                          <span className="inline-flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" /><span className="font-semibold text-blue-700">{t('dash.today')}</span></span>
                        ) : (
                          <span className="text-gray-500">{format(new Date(e.entryDate), 'dd MMM yyyy')}</span>
                        )}
                      </td>
                      <td className="px-5 py-3 font-semibold text-blue-800">{e.billNumber}</td>
                      <td className="px-5 py-3"><p className="font-medium text-gray-800">{e.customerName}</p><p className="text-xs text-gray-400">{e.shopName}</p></td>
                      <td className="px-5 py-3"><Badge variant={ENTRY_TYPE_BADGE[e.entryType] || 'blue'}>{e.entryType.replace(/_/g, ' ')}</Badge></td>
                      <td className="px-5 py-3 text-right font-bold text-gray-800">{e.totalBoxesSent}</td>
                      <td className="px-5 py-3 text-right font-bold text-emerald-700">{e.boxesReturned}</td>
                      <td className={`px-5 py-3 text-right font-bold ${e.balanceBoxes > 0 ? 'text-amber-700' : 'text-gray-400'}`}>{e.balanceBoxes}</td>
                    </tr>
                  );
                })}
              </tbody>
              {stats.todayEntries > 0 && (
                <tfoot>
                  <tr className="bg-blue-900 text-white text-xs font-bold">
                    <td colSpan={4} className="px-5 py-2.5 text-left">{t('dash.todayTotal')} ({stats.todayEntries} {stats.todayEntries === 1 ? t('dash.entry') : t('dash.entries')})</td>
                    <td className="px-5 py-2.5 text-right">{stats.todaySent}</td>
                    <td className="px-5 py-2.5 text-right text-emerald-300">{stats.todayReturned}</td>
                    <td className="px-5 py-2.5 text-right text-amber-300">{stats.todayBalance}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
