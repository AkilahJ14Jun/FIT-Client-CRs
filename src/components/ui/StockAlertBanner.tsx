// StockAlertBanner — Flashing stock refill alert shown on Dashboard

import React, { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, BellOff, RefreshCw, Settings, X } from 'lucide-react';
import { StockAlertDB, SettingsDB } from '../../db/database';
import { useTranslation } from '../../i18n/TranslationProvider';

interface Props {
  onRefresh: () => void;
}

const DEFAULT_STOCK = { openingStock: 0, currentStock: 0, totalDispatched: 0, totalReturned: 0, percentRemaining: 100, lowVarieties: [] as string[], shouldAlert: false };

export const StockAlertBanner: React.FC<Props> = ({ onRefresh }) => {
  const { t } = useTranslation();
  const [stockLevel, setStockLevel]   = useState(DEFAULT_STOCK);
  const [threshold,  setThreshold]    = useState(30);
  const [flash,      setFlash]        = useState(true);

  const reload = useCallback(async () => {
    const sl = await StockAlertDB.getStockLevel();
    setStockLevel(sl);
  }, []);

  useEffect(() => { reload(); }, [reload]);

  // Re-compute every 30 seconds
  useEffect(() => {
    const interval = setInterval(reload, 30_000);
    return () => clearInterval(interval);
  }, [reload]);

  // Flash toggle
  useEffect(() => {
    if (!stockLevel.shouldAlert) return;
    const t = setInterval(() => setFlash((f) => !f), 800);
    return () => clearInterval(t);
  }, [stockLevel.shouldAlert]);

  const handleDismissToday = useCallback(async () => {
    await StockAlertDB.dismissUntilTomorrow();
    await reload();
    onRefresh();
  }, [onRefresh, reload]);

  const handleDismissPermanently = useCallback(async () => {
    await StockAlertDB.dismissPermanently();
    await reload();
    onRefresh();
  }, [onRefresh, reload]);

  if (!stockLevel.shouldAlert) return null;

  const { openingStock, currentStock, lowVarieties } = stockLevel;
  const isCritical = currentStock <= 10;
  const isLow      = currentStock <= 30;

  const bgClass    = isCritical ? 'bg-red-600'    : isLow ? 'bg-orange-500'  : 'bg-amber-500';
  const flashBg    = isCritical ? 'bg-red-700'    : isLow ? 'bg-orange-600'  : 'bg-amber-600';
  const borderClass = isCritical ? 'border-red-400' : isLow ? 'border-orange-400' : 'border-amber-400';

  return (
    <>
      <style>{`
        @keyframes fit-stock-pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.85; transform: scale(1.01); } }
        @keyframes fit-stock-shake { 0%, 100% { transform: translateX(0); } 20% { transform: translateX(-4px); } 40% { transform: translateX(4px); } 60% { transform: translateX(-3px); } 80% { transform: translateX(3px); } }
        .fit-alert-pulse { animation: fit-stock-pulse 1.6s ease-in-out infinite; }
        .fit-flash-dot { animation: fit-stock-pulse 0.8s ease-in-out infinite; }
      `}</style>

      <div className={`fit-alert-pulse relative rounded-2xl border-2 ${borderClass} ${flash ? bgClass : flashBg} text-white shadow-2xl overflow-hidden`} role="alert" aria-live="assertive">
        <div className={`h-1.5 w-full ${flash ? flashBg : bgClass} transition-colors duration-300`} />
        <div className="px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`fit-flash-dot flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${isCritical ? 'bg-red-800/60' : isLow ? 'bg-orange-700/60' : 'bg-amber-700/60'}`}>
                <AlertTriangle size={22} className="text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="fit-flash-dot inline-block w-2.5 h-2.5 rounded-full bg-white" />
                  <h3 className="text-base font-extrabold tracking-wide uppercase">
                    {isCritical ? t('alert.critical') : isLow ? t('alert.low') : t('alert.refill')}
                  </h3>
                </div>
                <p className="text-sm opacity-90 mt-0.5">
                  {lowVarieties.length > 0 ? (
                    <>The following varieties are low: <strong className="text-white font-extrabold">{lowVarieties.join(', ')}</strong></>
                  ) : (
                    <>Current global stock is <strong className="text-white font-extrabold text-lg">{currentStock}</strong> boxes</>
                  )}
                </p>
              </div>
            </div>
            <button onClick={handleDismissToday} className="flex-shrink-0 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors" title="Dismiss until tomorrow">
              <X size={16} className="text-white" />
            </button>
          </div>

          <div className="mt-4">
            <div className="flex justify-between text-xs opacity-80 mb-1.5">
              <span>{t('alert.level')}: <strong>{currentStock}</strong> boxes remaining</span>
            </div>
            <div className="h-3 bg-white/20 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-700 ${isCritical ? 'bg-red-200' : isLow ? 'bg-orange-200' : 'bg-white'}`} style={{ width: `${Math.min(100, (currentStock/openingStock)*100)}%` }} />
            </div>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-3">
            {[{ label: t('alert.openingStock'), value: openingStock }, { label: t('alert.dispatched'), value: stockLevel.totalDispatched }, { label: t('alert.returned'), value: stockLevel.totalReturned }].map(({ label, value }) => (
              <div key={label} className="bg-white/15 rounded-xl px-3 py-2 text-center">
                <p className="text-[10px] opacity-75 uppercase tracking-wide">{label}</p>
                <p className="text-xl font-extrabold">{value}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <a href="#/dispatch" className="flex items-center gap-1.5 bg-white text-gray-900 hover:bg-gray-100 px-4 py-2 rounded-xl text-sm font-bold transition-colors shadow"><RefreshCw size={14} />{t('alert.recordRefill')}</a>
            <button onClick={handleDismissToday} className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"><BellOff size={14} />{t('alert.dismissToday')}</button>
            <button onClick={handleDismissPermanently} className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"><X size={14} />{t('alert.turnOff')}</button>
            <a href="#/settings" className="flex items-center gap-1.5 text-white/70 hover:text-white text-xs px-2 py-2 transition-colors ml-auto" title={t('alert.configure')}><Settings size={13} />{t('alert.configure')}</a>
          </div>

          <p className="text-[10px] opacity-50 mt-3">Stock alert thresholds are now managed in Settings.</p>
        </div>
      </div>
    </>
  );
};
