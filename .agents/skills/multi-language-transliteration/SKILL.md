---
name: multi-language-transliteration
description: Phonetic transliteration system (Tamil) for real-time Latin-to-Native character conversion in input fields.
---

# Multi-Language & Transliteration Skill

This skill provides a complete system for internationalization (i18n) and real-time phonetic transliteration. It allows the application to support multiple display languages (English, Tamil, Hindi) and enables users to type in Tamil using a standard Latin keyboard.

## 🏗️ Core Architecture

The system consists of two main parts:
1.  **Translation System**: A dictionary-based i18n system for UI text.
2.  **Transliteration Engine**: A phonetic input hook for native character conversion.

### 1. Translation System
- **Dictionary**: Located at `src/i18n/translations.ts`. It contains a massive record of keys mapped to English, Tamil, and Hindi values.
- **Provider**: `TranslationProvider.tsx` manages the current active language (`lang`) and provides a `t()` function to components.
- **Usage**:
  ```tsx
  const { t } = useTranslation();
  return <h1>{t('sidebar.dashboard')}</h1>;
  ```

### 2. Transliteration Flow (Tamil)
- **Keystroke Detection**: Hooks into `onBeforeInput` to capture characters before they are rendered.
2.  **Lookahead Buffer**: Uses a 1-character buffer to handle 2-character tokens (e.g., `a` + `a` → `ஆ`).
3.  **Stateful Mapping**: Tracks if the last character was a "bare" consonant to decide whether to attach a vowel sign or insert a Virama (்).
4.  **Native Injection**: Uses a native setter to update the element value and trigger React's synthetic events, ensuring compatibility with controlled components.

---

## 📘 Transliteration Scheme (Tamil)

### Consonants
Type the Latin key, then a vowel:
- **1-char**: `k/g/c` → க, `s` → ச, `j` → ஜ, `t/d` → ட, `n` → ந, `p/b/f` → ப, `m` → ம, `y` → ய, `r` → ர, `l` → ல, `v/w` → வ, `h` → ஹ
- **2-char**: `th` → த, `sh` → ஷ, `zh/z` → ழ, `ng` → ங, `nj/ny` → ஞ, `ch` → ச

### Vowels
- **Standalone**: `a` → அ, `aa/A` → ஆ, `i` → இ, `ii/I` → ஈ, `u` → உ, `uu/U` → ஊ, `e` → எ, `ee/E` → ஏ, `o` → ஒ, `oo/O` → ஓ, `ai` → ஐ, `au` → ஔ
- **Vowel Signs**: When following a consonant, these convert to markers (e.g., `k + aa` → `கா`).

### Special Rules
- **Virama (்)**: Automatically inserted between consecutive consonants (e.g., `n + k` → `ந்க`) and at the end of words on blur or navigation.

---

## 🛠️ Implementation Details

### Hook: `useTamilInput`
Located at: `src/i18n/useTamilInput.ts`

### Integration: `Input.tsx`
Located at: `src/components/ui/Input.tsx`

---

## 📘 Multi-Language Support

The app supports English (`en`), Tamil (`ta`), and Hindi (`hi`).
- **Default**: English.
- **Switching**: Users can change the language in **Settings → Company Settings**. This updates the `TranslationProvider` state.
- **Transliteration Trigger**: Transliteration is only active when `lang === 'ta'`.

---

## 📑 Usage Guidelines for LLMs

When modifying UI text or adding new forms:
1.  **Use Translation Keys**: Never hardcode text. Add a key to `translations.ts` and use the `t()` function.
2.  **Do Not Manually Transliterate**: The `Input` component handles it automatically if the language is set to Tamil.
3.  **Controlled Components**: The hook uses `applyValueNative`, so it works perfectly with `useState` and `react-hook-form`.
4.  **Bypass**: Transliteration is disabled for `type="number"` and `readOnly` fields.

---

## ⚙️ Maintenance
To add support for more languages:
1.  Define a new `VOWEL_MAP` and `CONSONANT_MAP` for the target language.
2.  Update the `processChar` logic if the language has tokens longer than 2 characters.
3.  Update the `useTamilInput` hook to switch maps based on the current `lang`.
