import React from 'react';

interface FishLogoProps {
  size?: number;
  className?: string;
}

export const FishLogo: React.FC<FishLogoProps> = ({ size = 56, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 120 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* ── Outer glow ring ─────────────────────────────────── */}
    <circle cx="60" cy="60" r="58" fill="url(#bgGrad)" opacity="0.18" />
    <circle cx="60" cy="60" r="52" fill="url(#bgGrad)" opacity="0.22" />

    {/* ── Tail fin (left, forked) ──────────────────────────── */}
    <path
      d="M14 42 C6 36, 2 28, 8 22 C14 16, 20 24, 24 32 C26 28, 28 18, 36 16 C42 14, 40 26, 36 34 Z"
      fill="url(#tailGrad)"
      opacity="0.95"
    />
    {/* Tail highlight */}
    <path
      d="M16 40 C10 35, 7 29, 11 24"
      stroke="rgba(255,255,255,0.4)"
      strokeWidth="1.5"
      strokeLinecap="round"
      fill="none"
    />
    <path
      d="M26 30 C28 22, 32 18, 36 17"
      stroke="rgba(255,255,255,0.3)"
      strokeWidth="1.2"
      strokeLinecap="round"
      fill="none"
    />

    {/* ── Main body ───────────────────────────────────────── */}
    <ellipse cx="67" cy="60" rx="40" ry="26" fill="url(#bodyGrad)" />

    {/* ── Belly sheen ─────────────────────────────────────── */}
    <ellipse cx="67" cy="68" rx="32" ry="12" fill="url(#bellyGrad)" opacity="0.55" />

    {/* ── Dorsal fin (top) ────────────────────────────────── */}
    <path
      d="M52 35 C56 22, 66 18, 76 22 C80 24, 80 30, 76 34"
      fill="url(#finGrad)"
      opacity="0.9"
    />
    <path
      d="M54 34 C58 24, 67 20, 75 24"
      stroke="rgba(255,255,255,0.35)"
      strokeWidth="1"
      fill="none"
    />
    {/* Dorsal fin rays */}
    {[58, 63, 68, 73].map((x, i) => (
      <line
        key={i}
        x1={x}
        y1={34}
        x2={x - 1 + i}
        y2={22 + i * 2}
        stroke="rgba(255,255,255,0.25)"
        strokeWidth="1"
      />
    ))}

    {/* ── Pectoral fin (side) ─────────────────────────────── */}
    <path
      d="M62 62 C58 70, 54 76, 50 74 C46 72, 50 64, 56 60 Z"
      fill="url(#pectoralGrad)"
      opacity="0.85"
    />

    {/* ── Anal fin (bottom) ───────────────────────────────── */}
    <path
      d="M68 84 C64 92, 72 96, 78 90 C80 87, 76 82, 72 82 Z"
      fill="url(#finGrad)"
      opacity="0.75"
    />

    {/* ── Scale pattern ───────────────────────────────────── */}
    {/* Row 1 */}
    <ellipse cx="60" cy="52" rx="5.5" ry="3.5" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="1" />
    <ellipse cx="71" cy="52" rx="5.5" ry="3.5" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="1" />
    <ellipse cx="82" cy="52" rx="5.5" ry="3.5" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="1" />
    {/* Row 2 */}
    <ellipse cx="55" cy="60" rx="5.5" ry="3.5" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
    <ellipse cx="66" cy="60" rx="5.5" ry="3.5" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
    <ellipse cx="77" cy="60" rx="5.5" ry="3.5" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
    <ellipse cx="88" cy="60" rx="4.5" ry="3" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
    {/* Row 3 */}
    <ellipse cx="60" cy="68" rx="5.5" ry="3.5" fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="1" />
    <ellipse cx="71" cy="68" rx="5.5" ry="3.5" fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="1" />
    <ellipse cx="82" cy="68" rx="5" ry="3" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />

    {/* ── Lateral line ────────────────────────────────────── */}
    <path
      d="M40 60 Q60 56 95 60"
      stroke="rgba(255,255,255,0.3)"
      strokeWidth="1.2"
      strokeDasharray="3 3"
      fill="none"
    />

    {/* ── Head shine ──────────────────────────────────────── */}
    <ellipse cx="100" cy="52" rx="9" ry="13" fill="url(#headGrad)" />

    {/* ── Eye ─────────────────────────────────────────────── */}
    <circle cx="100" cy="54" r="7" fill="#1a1a2e" />
    <circle cx="100" cy="54" r="5.5" fill="#0f3460" />
    <circle cx="100" cy="54" r="3.5" fill="#16213e" />
    {/* Iris shimmer */}
    <circle cx="100" cy="54" r="3.5" fill="url(#irisGrad)" opacity="0.6" />
    {/* Eye highlight */}
    <circle cx="102" cy="52" r="1.8" fill="white" opacity="0.9" />
    <circle cx="98.5" cy="56" r="0.8" fill="white" opacity="0.4" />

    {/* ── Mouth ───────────────────────────────────────────── */}
    <path
      d="M107 62 Q112 65 108 68"
      stroke="rgba(255,255,255,0.5)"
      strokeWidth="1.5"
      strokeLinecap="round"
      fill="none"
    />

    {/* ── Top body highlight (sheen) ──────────────────────── */}
    <ellipse cx="72" cy="48" rx="24" ry="7" fill="url(#sheenGrad)" opacity="0.35" />

    {/* ── Water droplets / bubbles ────────────────────────── */}
    <circle cx="28" cy="22" r="3" fill="url(#bubbleGrad)" opacity="0.6" />
    <circle cx="22" cy="14" r="2" fill="url(#bubbleGrad)" opacity="0.4" />
    <circle cx="34" cy="12" r="1.5" fill="url(#bubbleGrad)" opacity="0.35" />

    {/* ── Sparkle stars ───────────────────────────────────── */}
    {/* Star 1 */}
    <g transform="translate(30,85)">
      <line x1="0" y1="-5" x2="0" y2="5" stroke="rgba(147,210,255,0.7)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="-5" y1="0" x2="5" y2="0" stroke="rgba(147,210,255,0.7)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="-3.5" y1="-3.5" x2="3.5" y2="3.5" stroke="rgba(147,210,255,0.4)" strokeWidth="1" strokeLinecap="round" />
      <line x1="3.5" y1="-3.5" x2="-3.5" y2="3.5" stroke="rgba(147,210,255,0.4)" strokeWidth="1" strokeLinecap="round" />
    </g>
    {/* Star 2 */}
    <g transform="translate(108,30)">
      <line x1="0" y1="-4" x2="0" y2="4" stroke="rgba(255,220,100,0.7)" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="-4" y1="0" x2="4" y2="0" stroke="rgba(255,220,100,0.7)" strokeWidth="1.2" strokeLinecap="round" />
    </g>
    {/* Star 3 */}
    <g transform="translate(18,52)">
      <line x1="0" y1="-3" x2="0" y2="3" stroke="rgba(147,210,255,0.5)" strokeWidth="1" strokeLinecap="round" />
      <line x1="-3" y1="0" x2="3" y2="0" stroke="rgba(147,210,255,0.5)" strokeWidth="1" strokeLinecap="round" />
    </g>

    {/* ── Gradient definitions ─────────────────────────────── */}
    <defs>
      {/* Background glow */}
      <radialGradient id="bgGrad" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#38bdf8" />
        <stop offset="100%" stopColor="#0ea5e9" />
      </radialGradient>

      {/* Body gradient — deep ocean blue to teal */}
      <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#0ea5e9" />
        <stop offset="35%" stopColor="#0284c7" />
        <stop offset="70%" stopColor="#0369a1" />
        <stop offset="100%" stopColor="#075985" />
      </linearGradient>

      {/* Belly highlight */}
      <linearGradient id="bellyGrad" x1="50%" y1="0%" x2="50%" y2="100%">
        <stop offset="0%" stopColor="#e0f2fe" />
        <stop offset="100%" stopColor="#7dd3fc" stopOpacity="0" />
      </linearGradient>

      {/* Tail gradient */}
      <linearGradient id="tailGrad" x1="100%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#0ea5e9" />
        <stop offset="50%" stopColor="#0369a1" />
        <stop offset="100%" stopColor="#1e40af" />
      </linearGradient>

      {/* Fin gradient */}
      <linearGradient id="finGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#38bdf8" />
        <stop offset="100%" stopColor="#0369a1" />
      </linearGradient>

      {/* Pectoral fin */}
      <linearGradient id="pectoralGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#7dd3fc" />
        <stop offset="100%" stopColor="#0284c7" />
      </linearGradient>

      {/* Head gradient */}
      <linearGradient id="headGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#0284c7" />
        <stop offset="100%" stopColor="#1e3a8a" />
      </linearGradient>

      {/* Eye iris */}
      <radialGradient id="irisGrad" cx="40%" cy="40%" r="60%">
        <stop offset="0%" stopColor="#38bdf8" />
        <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
      </radialGradient>

      {/* Top sheen */}
      <linearGradient id="sheenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="white" />
        <stop offset="100%" stopColor="white" stopOpacity="0" />
      </linearGradient>

      {/* Bubble gradient */}
      <radialGradient id="bubbleGrad" cx="35%" cy="35%" r="65%">
        <stop offset="0%" stopColor="#e0f2fe" />
        <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.3" />
      </radialGradient>
    </defs>
  </svg>
);
