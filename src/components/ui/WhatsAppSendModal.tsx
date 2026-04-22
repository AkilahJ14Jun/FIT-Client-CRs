// FIT – WhatsApp Send Modal
// 3-step guided flow mirroring PyWhatKit's approach:
//   Step 1 → Download the receipt as a PDF directly to the Downloads folder
//   Step 2 → Open WhatsApp Web with the customer's number & message pre-filled
//   Step 3 → Attach the downloaded PDF using WhatsApp Web's paperclip icon and Send

import React, { useEffect, useState } from 'react';
import {
  X,
  MessageCircle,
  Phone,
  User,
  FileText,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import type { BoxEntry, Customer } from '../../db/database';
import {
  triggerWhatsAppAutomation,
  buildWhatsAppPayload,
  receiptFilename,
  type WhatsAppPayload,
} from '../../utils/customerReceipt';
import { useTranslation } from '../../i18n/TranslationProvider';

interface Props {
  open:     boolean;
  entry:    BoxEntry | null;
  customer: Customer | null;
  onClose:  () => void;
}

export const WhatsAppSendModal: React.FC<Props> = ({
  open, entry, customer, onClose,
}) => {
  const { t } = useTranslation();
  const [payload, setPayload] = useState<WhatsAppPayload | null>(null);
  const [altPhone, setAltPhone] = useState<string>('');
  const [launching, setLaunching] = useState(false);

  // Reset state whenever a new entry/customer arrives
  useEffect(() => {
    if (open && entry && customer) {
      buildWhatsAppPayload(entry, customer).then(p => {
        setPayload(p);
        setAltPhone(p.phone || '');
      });
    }
  }, [open, entry?.id, customer?.id]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open || !entry || !customer || !payload) return null;

  const hasPhone = !!altPhone?.trim();
  const filename = receiptFilename(entry);

  const handleLaunchAutomation = () => {
    if (launching) return;
    setLaunching(true);

    const finalPayload = { ...payload, phone: altPhone };
    triggerWhatsAppAutomation(finalPayload, entry, customer);

    // Reset after some time to allow potential retry but prevent rapid clicks
    setTimeout(() => setLaunching(false), 5000);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="bg-gradient-to-r from-green-700 to-emerald-600 px-5 py-4 flex items-center gap-3">
          <div className="shrink-0 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <MessageCircle size={22} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-base leading-tight">
              Send Receipt via WhatsApp
            </p>
            <p className="text-green-100 text-xs mt-0.5">
              Follow all 3 steps to share the PDF with the customer
            </p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 text-white/70 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* ── Body ────────────────────────────────────────────────────────── */}
        <div className="px-5 py-6 space-y-5">

          {/* Status Icon */}
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-green-50 border-2 border-green-200 flex items-center justify-center animate-pulse">
              <MessageCircle size={32} className="text-green-600" />
            </div>
          </div>

          <div className="text-center space-y-2">
            <h3 className="text-lg font-bold text-gray-800">Ready for Automated Sharing</h3>
            <p className="text-sm text-gray-600">
              This will launch a PowerShell script to automatically attach the PDF and send it via WhatsApp Web.
            </p>
          </div>

          {/* Summary Card */}
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500 flex items-center gap-1.5"><User size={14} /> Customer</span>
              <span className="font-semibold text-gray-800">{customer.customerName}</span>
            </div>
            <div className="flex justify-between items-start text-sm">
              <span className="text-gray-500 mt-1 flex items-center gap-1.5"><Phone size={14} /> Target No.</span>
              <div className="flex flex-col items-end gap-2">
                <input
                  type="text"
                  value={altPhone}
                  onChange={(e) => setAltPhone(e.target.value)}
                  placeholder="e.g. +919876543210"
                  className="text-right font-semibold text-green-700 bg-transparent border-b border-green-300 focus:outline-none focus:border-green-600 w-40"
                />
                
                {payload && payload.altPhone && (
                  <div className="flex gap-1 bg-gray-200/50 p-1 rounded-lg border border-gray-200">
                    <button
                      type="button"
                      onClick={() => setAltPhone(payload.phone)}
                      className={`text-[10px] px-2.5 py-1 rounded-md transition-all uppercase tracking-wider font-bold ${
                        altPhone === payload.phone 
                        ? 'bg-white text-blue-700 shadow-sm'
                        : 'text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      Primary
                    </button>
                    <button
                      type="button"
                      onClick={() => setAltPhone(payload.altPhone || '')}
                      className={`text-[10px] px-2.5 py-1 rounded-md transition-all uppercase tracking-wider font-bold ${
                        altPhone === payload.altPhone 
                        ? 'bg-white text-blue-700 shadow-sm'
                        : 'text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      Alternate
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-between items-center text-sm border-t border-gray-200 pt-3">
              <span className="text-gray-500 flex items-center gap-1.5"><FileText size={14} /> PDF File</span>
              <span className="text-xs font-mono text-blue-700 bg-white px-2 py-1 rounded border border-gray-200 truncate max-w-[200px]">
                {filename}
              </span>
            </div>
          </div>

          {!hasPhone && (
            <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2.5">
              <AlertTriangle size={15} className="text-red-500 shrink-0 mt-0.5" />
              <p className="text-xs text-red-700">
                Error: Customer has no mobile number. Sharing is not possible.
              </p>
            </div>
          )}

          {/* Action Button */}
          <button
            onClick={handleLaunchAutomation}
            disabled={!hasPhone || launching}
            className={`w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl text-base font-bold transition-all shadow-md
              ${(!hasPhone || launching)
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200 shadow-none'
                : 'bg-green-600 hover:bg-green-700 text-white hover:scale-[1.02] active:scale-[0.98]'
              }`}
          >
            <ExternalLink size={20} />
            {launching ? t('entries.launching') : 'Launch Automated Share'}
          </button>

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
            <div className="shrink-0 text-blue-500 mt-0.5">ℹ️</div>
            <div className="text-[11px] text-blue-800 leading-relaxed font-medium">
              <strong>Instructions:</strong> After clicking launch, a browser window will open.
              <br/><br/>
              1. 🛑 <strong>DO NOT</strong> move your mouse or switch tabs.
              <br/>
              2. ⏳ <strong>WAIT</strong> for about 15 seconds.
              <br/>
              3. The script will automatically attach the file from <code>Downloads/FIT reports</code> and send it.
            </div>
          </div>
        </div>

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        <div className="px-5 py-3.5 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-3">
          <p className="text-xs text-gray-500">
            💡 WhatsApp Web requires you to be logged in at{' '}
            <span className="font-medium text-gray-700">web.whatsapp.com</span>
          </p>
          <button
            onClick={onClose}
            className="shrink-0 px-4 py-2 rounded-lg bg-white border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
