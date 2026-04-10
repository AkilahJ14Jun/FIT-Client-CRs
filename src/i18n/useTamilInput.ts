/**
 * useTamilInput.ts  —  src/i18n/useTamilInput.ts
 *
 * Tamil phonetic transliteration hook for FIT.
 *
 * ── What it does ─────────────────────────────────────────────────────────────
 * When the app language is set to Tamil ("ta"), every <Input> and <TextArea>
 * that uses this hook automatically converts Latin keystrokes into Tamil
 * Unicode characters in real time.
 *
 * Example keystroke sequences → Tamil output:
 *   k + a  → க     k + aa → கா    k + i  → கி    k + ii → கீ
 *   k + u  → கு    k + ai → கை    k + au → கௌ
 *   th + a → த     zh + a → ழ     sh + a → ஷ
 *   n + k + a → ந்க   (consonant cluster — virama inserted automatically)
 *   v + a + l + i → வலி
 *   m + ee + n → மேன்  (word-final consonant gets virama automatically)
 *
 * ── Transliteration scheme ───────────────────────────────────────────────────
 * Consonants (type the Latin key, then a vowel):
 *   k/g/c → க   s → ச   j → ஜ   t/d → ட   th → த   n → ந   N → ண
 *   p/b/f → ப   ph → ப  m → ம   y → ய   r → ர   R → ற   l → ல
 *   L → ள   v/w → வ  zh/z → ழ  sh → ஷ  h → ஹ   ng → ங   nj/ny → ஞ
 *   ch → ச   kh/gh → க   q/x → ஃ
 *
 * Vowels (standalone or attached after a consonant):
 *   a → அ / (inherent)   aa/A → ஆ/ா   i → இ/ி   ii/I → ஈ/ீ
 *   u → உ/ு              uu/U → ஊ/ூ   e → எ/ெ   ee/E → ஏ/ே
 *   o → ஒ/ொ              oo/O → ஓ/ோ   ai → ஐ/ை   au → ஔ/ௌ
 *
 * ── How it works ─────────────────────────────────────────────────────────────
 * A 1-character lookahead buffer accumulates keystrokes. Because all multi-char
 * tokens are exactly 2 characters long, the algorithm:
 *   1. Holds a char if it could start a 2-char token (e.g. 'a' could become 'aa').
 *   2. On the next char, tries the 2-char combination first.
 *   3. If the 2-char combo matches → emits it; otherwise emits the buffered char
 *      alone and re-processes the new char.
 *
 * A `lastBare` flag tracks whether the last emitted token was a consonant without
 * a vowel yet. This drives:
 *   • Attaching the correct vowel sign (மாத்திரை) to the preceding consonant.
 *   • Inserting VIRAMA (்) automatically between consecutive consonants.
 *   • Appending VIRAMA to a word-final bare consonant on navigation/blur.
 *
 * ── Integration ──────────────────────────────────────────────────────────────
 * This hook is already wired into src/components/ui/Input.tsx (Input + TextArea).
 * No changes are needed in individual pages or forms.
 *
 * ── Non-Tamil modes ──────────────────────────────────────────────────────────
 * When lang !== 'ta', the hook returns {} — zero performance impact.
 * number inputs and readOnly fields are also excluded.
 */

import { useRef, useCallback } from 'react';
import { useTranslation } from './TranslationProvider';

// ─── Vowel table ─────────────────────────────────────────────────────────────
// Value: [standalone vowel character, vowel sign attached after a consonant]
const VOWEL_MAP: Record<string, [string, string]> = {
  'aa': ['ஆ', 'ா'],  'A':  ['ஆ', 'ா'],
  'ii': ['ஈ', 'ீ'],  'I':  ['ஈ', 'ீ'],
  'uu': ['ஊ', 'ூ'],  'U':  ['ஊ', 'ூ'],
  'ee': ['ஏ', 'ே'],  'E':  ['ஏ', 'ே'],
  'oo': ['ஓ', 'ோ'],  'O':  ['ஓ', 'ோ'],
  'ai': ['ஐ', 'ை'],
  'au': ['ஔ', 'ௌ'],
  'a':  ['அ', ''],   // empty sign = consonant's inherent 'a' (no visible diacritic)
  'i':  ['இ', 'ி'],
  'u':  ['உ', 'ு'],
  'e':  ['எ', 'ெ'],
  'o':  ['ஒ', 'ொ'],
};

// ─── Consonant table ──────────────────────────────────────────────────────────
const CONSONANT_MAP: Record<string, string> = {
  // 2-char keys (must be checked before 1-char to avoid prefix clash)
  'nj': 'ஞ', 'ng': 'ங', 'zh': 'ழ', 'sh': 'ஷ', 'ny': 'ஞ',
  'ch': 'ச', 'th': 'த', 'ph': 'ப', 'kh': 'க', 'gh': 'க',
  // 1-char keys
  'k': 'க',  'g': 'க',  'c': 'க',  's': 'ச',  'j': 'ஜ',
  't': 'ட',  'd': 'ட',  'n': 'ந',  'N': 'ண',  'p': 'ப',
  'b': 'ப',  'm': 'ம',  'y': 'ய',  'r': 'ர',  'R': 'ற',
  'l': 'ல',  'L': 'ள',  'v': 'வ',  'w': 'வ',  'f': 'ப',
  'h': 'ஹ',  'q': 'ஃ',  'x': 'ஃ',  'z': 'ழ',
};

// All known 2-character token keys
const KEYS2 = new Set([
  'aa','ii','uu','ee','oo','ai','au',                         // 2-char vowels
  'nj','ng','zh','sh','ny','ch','th','ph','kh','gh',          // 2-char consonants
]);

const VIRAMA = '்'; // U+0BCD – Tamil virama (pulli ்)

// Characters that could be the first char of a 2-char token
const CAN_START_TWO = new Set<string>();
for (const k of KEYS2) CAN_START_TWO.add(k[0]);

// ─── Per-field mutable state ──────────────────────────────────────────────────
interface TranslitState {
  buf: string;       // 0 or 1 Latin char buffered (lookahead)
  lastBare: boolean; // true = last committed token was a vowel-less consonant
}

// ─── Token emitter ────────────────────────────────────────────────────────────
interface EmitResult {
  value: string;
  cursor: number;
  lastBare: boolean;
}

function emitToken(
  token: string,
  value: string,
  cursor: number,
  lastBare: boolean,
): EmitResult {
  const before = value.slice(0, cursor);
  const after  = value.slice(cursor);

  // ── Vowel ──────────────────────────────────────────────────────────────────
  if (VOWEL_MAP[token]) {
    const [standalone, sign] = VOWEL_MAP[token];
    if (lastBare) {
      if (sign === '') {
        // Inherent 'a' — the consonant glyph already encodes this; no extra char.
        return { value, cursor, lastBare: false };
      }
      return {
        value: before + sign + after,
        cursor: before.length + sign.length,
        lastBare: false,
      };
    }
    return {
      value: before + standalone + after,
      cursor: before.length + standalone.length,
      lastBare: false,
    };
  }

  // ── Consonant ──────────────────────────────────────────────────────────────
  if (CONSONANT_MAP[token]) {
    const tamil = CONSONANT_MAP[token];
    if (lastBare) {
      // Consonant cluster: previous bare consonant needs virama
      return {
        value: before + VIRAMA + tamil + after,
        cursor: before.length + VIRAMA.length + tamil.length,
        lastBare: true,
      };
    }
    return {
      value: before + tamil + after,
      cursor: before.length + tamil.length,
      lastBare: true,
    };
  }

  // ── Unknown — pass raw ─────────────────────────────────────────────────────
  return {
    value: before + token + after,
    cursor: cursor + token.length,
    lastBare: false,
  };
}

// ─── Buffer flush + virama finaliser ─────────────────────────────────────────
/**
 * Flush any buffered Latin char and append a word-final VIRAMA if the last
 * emitted token was a bare consonant.  Call before navigation keys or blur.
 */
function flushBuffer(
  value: string,
  cursor: number,
  state: TranslitState,
): { value: string; cursor: number } {
  if (state.buf) {
    const first = state.buf;
    state.buf = '';
    const r = emitToken(first, value, cursor, state.lastBare);
    state.lastBare = r.lastBare;
    value  = r.value;
    cursor = r.cursor;
  }
  if (state.lastBare) {
    value  = value.slice(0, cursor) + VIRAMA + value.slice(cursor);
    cursor += VIRAMA.length;
    state.lastBare = false;
  }
  return { value, cursor };
}

// ─── Core per-keystroke processing ───────────────────────────────────────────
/**
 * Processes one new Latin character.
 *
 * Returns:
 *   { value, cursor }  — apply this updated field value
 *   { wait: true }     — buffer accumulating; suppress the character for now
 *   null               — non-alpha; caller should insert it normally
 */
function processChar(
  value: string,
  cursor: number,
  newChar: string,
  state: TranslitState,
): { value: string; cursor: number } | { wait: true } | null {

  if (!/[a-zA-Z]/.test(newChar)) {
    // Flush pending buffer before non-alpha character
    if (state.buf) {
      const first = state.buf;
      state.buf = '';
      const r = emitToken(first, value, cursor, state.lastBare);
      state.lastBare = r.lastBare;
      value  = r.value;
      cursor = r.cursor;
    }
    state.lastBare = false;
    return null; // caller inserts newChar normally
  }

  // ── No buffered char ───────────────────────────────────────────────────────
  if (state.buf.length === 0) {
    if (CAN_START_TWO.has(newChar)) {
      state.buf = newChar;
      return { wait: true };
    }
    const r = emitToken(newChar, value, cursor, state.lastBare);
    state.lastBare = r.lastBare;
    return { value: r.value, cursor: r.cursor };
  }

  // ── One buffered char: try 2-char combo ────────────────────────────────────
  const two = state.buf + newChar;
  if (KEYS2.has(two)) {
    state.buf = '';
    const r = emitToken(two, value, cursor, state.lastBare);
    state.lastBare = r.lastBare;
    return { value: r.value, cursor: r.cursor };
  }

  // No 2-char match — emit the buffered char, then handle newChar fresh
  const first = state.buf;
  state.buf = '';
  const r1 = emitToken(first, value, cursor, state.lastBare);
  state.lastBare = r1.lastBare;
  value  = r1.value;
  cursor = r1.cursor;

  if (CAN_START_TWO.has(newChar)) {
    state.buf = newChar;
    return { wait: true };
  }
  const r2 = emitToken(newChar, value, cursor, state.lastBare);
  state.lastBare = r2.lastBare;
  return { value: r2.value, cursor: r2.cursor };
}

// ─── React hook ───────────────────────────────────────────────────────────────
type InputOrTextarea = HTMLInputElement | HTMLTextAreaElement;

function applyValueNative(el: InputOrTextarea, newValue: string, newCursor: number) {
  const proto = el instanceof HTMLTextAreaElement
    ? HTMLTextAreaElement.prototype
    : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
  if (!setter) return;
  setter.call(el, newValue);
  el.dispatchEvent(new Event('input', { bubbles: true }));
  requestAnimationFrame(() => {
    el.selectionStart = newCursor;
    el.selectionEnd   = newCursor;
  });
}

export function useTamilInput() {
  const { lang } = useTranslation();
  // Each field instance gets its own transliteration state via the ref
  const stateRef = useRef<TranslitState>({ buf: '', lastBare: false });

  const handleBeforeInput = useCallback(
    (e: React.FormEvent<InputOrTextarea>) => {
      if (lang !== 'ta') return;

      const input = e.currentTarget as HTMLInputElement;
      // Skip numeric and read-only fields
      if ((input as HTMLInputElement).type === 'number' || input.readOnly) return;

      const data = (e.nativeEvent as InputEvent).data ?? '';
      if (data.length !== 1) return;

      // Suppress the browser's default character insertion in all cases
      // (we will write the value ourselves via the native setter)
      e.preventDefault();

      const start = input.selectionStart ?? input.value.length;
      const end   = input.selectionEnd   ?? start;

      // Collapse any text selection before processing
      let currentValue = input.value;
      if (start !== end) {
        currentValue = currentValue.slice(0, start) + currentValue.slice(end);
      }

      const result = processChar(currentValue, start, data, stateRef.current);

      if (result === null) {
        // Non-alpha: insert as-is after flushed buffer
        const newVal = currentValue.slice(0, start) + data + currentValue.slice(start);
        applyValueNative(input, newVal, start + 1);
        return;
      }

      if ('wait' in result) {
        // Buffer accumulating — collapse any selection but don't insert yet
        if (start !== end) applyValueNative(input, currentValue, start);
        return;
      }

      applyValueNative(input, result.value, result.cursor);
    },
    [lang],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<InputOrTextarea>) => {
      if (lang !== 'ta') return;

      const NAV_KEYS = new Set([
        'Backspace','Delete','ArrowLeft','ArrowRight','ArrowUp','ArrowDown',
        'Enter','Escape','Tab','Home','End',
      ]);

      if (!NAV_KEYS.has(e.key)) return;

      const input = e.currentTarget;
      const cursor = input.selectionStart ?? input.value.length;
      const flushed = flushBuffer(input.value, cursor, stateRef.current);

      if (flushed.value !== input.value) {
        // There was a pending buffer/virama to flush before the nav key acts
        e.preventDefault();
        applyValueNative(input, flushed.value, flushed.cursor);
        // Re-fire the nav key on the updated value
        requestAnimationFrame(() => {
          input.dispatchEvent(
            new KeyboardEvent('keydown', { key: e.key, bubbles: true, cancelable: true }),
          );
        });
      }
      stateRef.current = { buf: '', lastBare: false };
    },
    [lang],
  );

  if (lang !== 'ta') return {};

  return {
    onBeforeInput: handleBeforeInput,
    onKeyDown: handleKeyDown,
  };
}
