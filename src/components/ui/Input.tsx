/**
 * src/components/ui/Input.tsx
 *
 * Shared form-field components: Input, Select, TextArea.
 *
 * Tamil transliteration is integrated here so every field in the entire
 * application automatically converts Latin keystrokes to Tamil Unicode
 * when the app language is set to Tamil.  No per-page changes are needed.
 */

import React from 'react';
import { useTamilInput } from '../../i18n/useTamilInput';

// ─── Types ────────────────────────────────────────────────────────────────────

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: SelectOption[];
  placeholder?: string;
}

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

// ─── Shared label/hint/error wrapper ─────────────────────────────────────────

function FieldWrapper({
  label,
  error,
  hint,
  children,
}: {
  label?: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium text-gray-700">{label}</label>
      )}
      {children}
      {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
      {error         && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

// ─── Input ────────────────────────────────────────────────────────────────────

export const Input: React.FC<InputProps> = ({
  label,
  error,
  hint,
  className = '',
  onKeyDown,
  onBeforeInput,
  ...props
}) => {
  const tamil = useTamilInput();

  // Merge Tamil handlers with any caller-supplied handlers
  const mergedKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    (tamil.onKeyDown as React.KeyboardEventHandler<HTMLInputElement> | undefined)?.(e);
    onKeyDown?.(e);
  };

  const mergedBeforeInput: React.FormEventHandler<HTMLInputElement> = (e) => {
    (tamil.onBeforeInput as React.FormEventHandler<HTMLInputElement> | undefined)?.(e);
    onBeforeInput?.(e);
  };

  return (
    <FieldWrapper label={label} error={error} hint={hint}>
      <input
        {...props}
        onKeyDown={mergedKeyDown}
        onBeforeInput={mergedBeforeInput}
        className={`rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white transition-colors ${
          error ? 'border-red-400 focus:ring-red-400' : 'border-gray-300'
        } ${
          props.readOnly ? 'bg-gray-50 cursor-not-allowed text-gray-500' : ''
        } ${className}`}
      />
    </FieldWrapper>
  );
};

// ─── Select ───────────────────────────────────────────────────────────────────
// Select fields show a dropdown — no keyboard transliteration needed.

export const Select: React.FC<SelectProps> = ({
  label,
  error,
  hint,
  options,
  placeholder,
  className = '',
  ...props
}) => (
  <FieldWrapper label={label} error={error} hint={hint}>
    <select
      {...props}
      className={`rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white transition-colors ${
        error ? 'border-red-400 focus:ring-red-400' : 'border-gray-300'
      } ${className}`}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  </FieldWrapper>
);

// ─── TextArea ─────────────────────────────────────────────────────────────────

export const TextArea: React.FC<TextAreaProps> = ({
  label,
  error,
  hint,
  className = '',
  onKeyDown,
  onBeforeInput,
  ...props
}) => {
  const tamil = useTamilInput();

  const mergedKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
    (tamil.onKeyDown as React.KeyboardEventHandler<HTMLTextAreaElement> | undefined)?.(e);
    onKeyDown?.(e);
  };

  const mergedBeforeInput: React.FormEventHandler<HTMLTextAreaElement> = (e) => {
    (tamil.onBeforeInput as React.FormEventHandler<HTMLTextAreaElement> | undefined)?.(e);
    onBeforeInput?.(e);
  };

  return (
    <FieldWrapper label={label} error={error} hint={hint}>
      <textarea
        {...props}
        onKeyDown={mergedKeyDown}
        onBeforeInput={mergedBeforeInput}
        className={`rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white resize-none transition-colors ${
          error ? 'border-red-400 focus:ring-red-400' : 'border-gray-300'
        } ${className}`}
      />
    </FieldWrapper>
  );
};
