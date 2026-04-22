// FIT – Receipt Preview Modal
// Shown immediately after a Dispatch / Return entry is saved.
//
// On DESKTOP: "Automated Share via WhatsApp" opens the 3-step WhatsAppSendModal
//             which guides the user through the fitshare:// automation flow.
//
// On MOBILE:  "Share via WhatsApp" directly downloads the PDF and opens the
//             WhatsApp app via wa.me — no guided modal needed since the Windows
//             automation is not available on mobile.

import React, { useEffect, useState } from 'react';
import {
  X,
  Download,
  MessageCircle,
  CheckCircle2,
  Package,
  Calendar,
  User,
  Hash,
  ArrowDownLeft,
  ArrowUpRight,
  Scale,
  Truck,
  FileText,
  Smartphone,
} from 'lucide-react';
import type { BoxEntry, Customer } from '../../db/database';
import {
  downloadReceiptAsPDF,
  isMobileDevice,
  shareMobile,
} from '../../utils/customerReceipt';
import { WhatsAppSendModal } from './WhatsAppSendModal';
import { format } from 'date-fns';

interface Props {
  open:     boolean;
  entry:    BoxEntry | null;
  customer: Customer | null;
  onClose:  () => void;
}

const ENTRY_TYPE_META: Record<string, { label: string; colour: string; bg: string }> = {
  dispatch:        { label: 'BOX DISPATCH',   colour: 'text-blue-800',   bg: 'bg-blue-100'   },
  return:          { label: 'BOX RETURN',      colour: 'text-green-800',  bg: 'bg-green-100'  },
  opening_balance: { label: 'STOCK POSITION', colour: 'text-yellow-800', bg: 'bg-yellow-100' },
  balance_forward: { label: 'BALANCE FORWARD', colour: 'text-purple-800', bg: 'bg-purple-100' },
  external_source: { label: 'EXTERNAL SOURCE', colour: 'text-red-800',    bg: 'bg-red-100'    },
};

export const ReceiptPreviewModal: React.FC<Props> = ({
  open, entry, customer, onClose,
}) => {
  const [printed,     setPrinted]     = useState(false);
  const [showWAModal, setShowWAModal] = useState(false);
  const [sharing,     setSharing]     = useState(false);

  const isMobile = isMobileDevice();

  // Reset state whenever a new entry arrives
  useEffect(() => {
    if (open) { setPrinted(false); setShowWAModal(false); setSharing(false); }
  }, [open, entry?.id]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open || !entry || !customer) return null;

  const meta = ENTRY_TYPE_META[entry.entryType] ?? {
    label: entry.entryType, colour: 'text-gray-700', bg: 'bg-gray-100',
  };
  const date = format(new Date(entry.entryDate), 'dd MMM yyyy');
  const totalBoxes = entry.totalBoxesSent + entry.currentQuantity;

  const handlePrint = () => {
    downloadReceiptAsPDF(entry, customer);
    setPrinted(true);
  };

  /**
   * WhatsApp button click handler.
   *
   * MOBILE:   Calls shareMobile() — downloads PDF then opens WhatsApp app via wa.me.
   *           No modal needed; the Windows automation doesn't exist on mobile.
   *
   * DESKTOP:  Opens the existing 3-step WhatsAppSendModal (fitshare:// automation).
   */
  const handleWhatsApp = async () => {
    if (isMobile) {
      setSharing(true);
      try {
        await shareMobile(entry, customer);
      } finally {
        // Keep the button disabled briefly while the redirect fires
        setTimeout(() => setSharing(false), 2500);
      }
    } else {
      setShowWAModal(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden">

        {/* ── Top success header ─────────────────────────────────── */}
        <div className="bg-gradient-to-r from-blue-900 to-blue-700 px-6 py-5 flex items-start gap-4">
          <div className="shrink-0 w-11 h-11 rounded-full bg-white/20 flex items-center justify-center">
            <CheckCircle2 size={24} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-base leading-tight">
              Entry Saved Successfully
            </p>
            <p className="text-blue-200 text-sm mt-0.5">
              Customer receipt is ready — PDF downloaded & share via WhatsApp
            </p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 text-white/70 hover:text-white transition-colors mt-0.5"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* ── Scrollable body ────────────────────────────────────── */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">

          {/* Entry type pill */}
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${meta.bg} ${meta.colour}`}>
              {meta.label}
            </span>
            <span className="text-xs text-gray-400">Bill No:</span>
            <span className="text-xs font-semibold text-blue-800">{entry.billNumber}</span>
          </div>

          {/* Mobile-specific info banner */}
          {isMobile && (
            <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
              <Smartphone size={16} className="shrink-0 mt-0.5 text-green-600" />
              <div>
                <p className="text-sm font-semibold text-green-800">Mobile WhatsApp Sharing</p>
                <p className="text-xs text-green-700 mt-0.5">
                  Tap <strong>Share via WhatsApp</strong> below. The PDF will download to your
                  device first, then WhatsApp will open with the message ready.
                  Attach the saved PDF using the 📎 icon in the chat.
                </p>
              </div>
            </div>
          )}

          {/* Customer card */}
          <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4 space-y-2">
            <p className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <User size={12} /> Customer Details
            </p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
              <div>
                <p className="text-xs text-gray-500">Customer Name</p>
                <p className="font-semibold text-gray-800">{customer.customerName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Shop Name</p>
                <p className="font-semibold text-gray-800">{customer.shopName || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Mobile</p>
                <div className="space-y-0.5">
                  <p className="font-medium text-gray-700">{customer.mobile || '—'}</p>
                  {customer.alternateMobile && (
                    <p className="text-[10px] text-gray-400">Alt: {customer.alternateMobile}</p>
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500">Date</p>
                <p className="font-medium text-gray-700 flex items-center gap-1">
                  <Calendar size={11} className="text-blue-500" /> {date}
                </p>
              </div>
            </div>
          </div>

          {/* Box movement summary */}
          <div className="rounded-xl border border-gray-100 overflow-hidden">
            <div className="bg-blue-900 px-4 py-2 flex items-center gap-2">
              <Package size={13} className="text-blue-200" />
              <p className="text-xs font-bold text-white uppercase tracking-wide">
                Box Movement Summary
              </p>
            </div>

            <div className="bg-blue-50 px-4 py-1.5 text-xs text-blue-700 font-medium border-b border-blue-100">
              📐 Total = Already Sent + Current Qty &nbsp;|&nbsp; Balance = Total − Returned
            </div>

            <div className="divide-y divide-gray-50">
              <div className="flex items-center justify-between px-4 py-2.5 bg-white">
                <span className="flex items-center gap-2 text-sm text-gray-600">
                  <Hash size={13} className="text-gray-400" />
                  Boxes Already Sent (Before This Entry)
                </span>
                <span className="text-sm text-gray-700 font-semibold">{entry.totalBoxesSent}</span>
              </div>

              <div className="flex items-center justify-between px-4 py-2.5 bg-white">
                <span className="flex items-center gap-2 text-sm text-gray-600">
                  <ArrowUpRight size={13} className="text-blue-500" />
                  Current Qty Sent (This Entry)
                </span>
                <span className="text-sm text-blue-700 font-semibold">{entry.currentQuantity}</span>
              </div>

              <div className="flex items-center justify-between px-4 py-3 bg-blue-900">
                <span className="flex items-center gap-2 text-sm text-blue-100 font-bold">
                  <Package size={13} className="text-blue-300" />
                  TOTAL BOXES (Already Sent + This Entry)
                </span>
                <span className="text-lg font-extrabold text-white">{totalBoxes}</span>
              </div>

              <div className="flex items-center justify-between px-4 py-2.5 bg-white">
                <span className="flex items-center gap-2 text-sm text-gray-600">
                  <ArrowDownLeft size={13} className="text-green-500" />
                  Boxes Returned by Customer
                </span>
                <span className="text-sm text-green-700 font-semibold">{entry.boxesReturned}</span>
              </div>

              <div className={`flex items-center justify-between px-4 py-3 ${
                entry.balanceBoxes > 0 ? 'bg-amber-50' : 'bg-green-50'
              }`}>
                <span className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Scale size={13} className={entry.balanceBoxes > 0 ? 'text-amber-500' : 'text-green-500'} />
                  Balance Boxes (Pending Return)
                </span>
                <span className={`text-lg font-extrabold ${
                  entry.balanceBoxes > 0 ? 'text-amber-700' : 'text-green-700'
                }`}>
                  {entry.balanceBoxes}
                </span>
              </div>
            </div>
          </div>

          {/* External source */}
          {entry.isExternalSource && entry.sourceName && (
            <div className="rounded-xl border border-red-100 bg-red-50/50 px-4 py-3 text-sm">
              <p className="text-xs font-bold text-red-700 uppercase tracking-wide mb-1.5">
                External Source
              </p>
              <div className="flex justify-between">
                <span className="text-gray-600">Source Name:</span>
                <span className="font-semibold text-red-800">{entry.sourceName}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-gray-600">Boxes from Source:</span>
                <span className="font-semibold text-red-800">{entry.externalBoxCount ?? 0}</span>
              </div>
            </div>
          )}

          {/* Logistics */}
          {(entry.driverName || entry.vehicleNumber) && (
            <div className="rounded-xl border border-gray-100 bg-gray-50/60 px-4 py-3 text-sm">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                <Truck size={11} /> Logistics
              </p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                {entry.driverName    && <><span className="text-gray-500">Driver</span><span className="font-medium text-gray-800">{entry.driverName}</span></>}
                {entry.vehicleNumber && <><span className="text-gray-500">Vehicle</span><span className="font-medium text-gray-800">{entry.vehicleNumber}</span></>}
              </div>
            </div>
          )}

          {/* Description */}
          {entry.description && (
            <div className="rounded-xl border border-amber-100 bg-amber-50/60 px-4 py-3 text-sm">
              <p className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                <FileText size={11} /> Notes
              </p>
              <p className="text-gray-700">{entry.description}</p>
            </div>
          )}

          {/* Balance status banner */}
          <div className={`rounded-xl px-4 py-3 flex items-center gap-3 ${
            entry.balanceBoxes === 0
              ? 'bg-green-50 border border-green-200'
              : 'bg-amber-50 border border-amber-200'
          }`}>
            {entry.balanceBoxes === 0 ? (
              <>
                <CheckCircle2 size={18} className="text-green-600 shrink-0" />
                <p className="text-green-800 text-sm font-medium">
                  All boxes have been returned. No outstanding balance.
                </p>
              </>
            ) : (
              <>
                <Scale size={18} className="text-amber-600 shrink-0" />
                <p className="text-amber-800 text-sm font-medium">
                  {entry.balanceBoxes} box{entry.balanceBoxes !== 1 ? 'es' : ''} pending
                  return from {customer.customerName}.
                </p>
              </>
            )}
          </div>
        </div>

        {/* ── Footer action buttons ──────────────────────────────── */}
        <div className="border-t border-gray-100 px-6 py-4 bg-gray-50 space-y-3">

          <div className="flex flex-col sm:flex-row gap-3">

            {/* Download PDF — same on all devices */}
            <button
              onClick={handlePrint}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm ${
                printed
                  ? 'bg-green-100 text-green-800 border border-green-300'
                  : 'bg-blue-900 text-white hover:bg-blue-800'
              }`}
            >
              {printed
                ? <><CheckCircle2 size={16} /> Receipt Downloaded ✓</>
                : <><Download size={16} /> Download Receipt PDF</>
              }
            </button>

            {/* WhatsApp — label and behaviour adapts to device */}
            <button
              onClick={handleWhatsApp}
              disabled={sharing}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm bg-green-600 text-white hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {sharing ? (
                <>
                  <MessageCircle size={16} className="animate-pulse" />
                  Opening WhatsApp…
                </>
              ) : isMobile ? (
                <>
                  <MessageCircle size={16} />
                  Share via WhatsApp
                </>
              ) : (
                <>
                  <MessageCircle size={16} />
                  Automated Share via WhatsApp
                </>
              )}
            </button>
          </div>

          {/* No-phone warning */}
          {!customer.mobile?.trim() && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-center">
              ⚠️ No mobile number saved for this customer — WhatsApp sharing requires a phone number.
              <br />Please update the customer record first.
            </p>
          )}

          {/* Close */}
          <button
            onClick={onClose}
            className="w-full px-5 py-2 rounded-xl text-sm font-medium border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      {/* 3-step WhatsApp guided modal — desktop only */}
      <WhatsAppSendModal
        open={showWAModal}
        entry={entry}
        customer={customer}
        onClose={() => setShowWAModal(false)}
      />
    </div>
  );
};
