import React from 'react';
import { cn } from '../../utils/cn';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, hint, className, id, ...props }) => {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '_');
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <input
        id={inputId}
        {...props}
        className={cn(
          'w-full rounded-lg border px-3 py-2 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all',
          error ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white hover:border-gray-400',
          props.disabled && 'bg-gray-100 cursor-not-allowed',
          className
        )}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
    </div>
  );
};

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const Select: React.FC<SelectProps> = ({ label, error, hint, options, placeholder, className, id, ...props }) => {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, '_');
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={selectId} className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <select
        id={selectId}
        {...props}
        className={cn(
          'w-full rounded-lg border px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white',
          error ? 'border-red-400' : 'border-gray-300 hover:border-gray-400',
          props.disabled && 'bg-gray-100 cursor-not-allowed',
          className
        )}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-600">{error}</p>}
      {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
    </div>
  );
};

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const TextArea: React.FC<TextAreaProps> = ({ label, error, className, id, ...props }) => {
  const taId = id || label?.toLowerCase().replace(/\s+/g, '_');
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={taId} className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <textarea
        id={taId}
        {...props}
        className={cn(
          'w-full rounded-lg border px-3 py-2 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-y',
          error ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white hover:border-gray-400',
          className
        )}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
};
