import React from 'react';
import { cn } from '../../utils/cn';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ children, className, title, subtitle, actions }) => (
  <div className={cn('bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden', className)}>
    {(title || actions) && (
      <div className="flex items-start justify-between px-6 py-4 border-b border-gray-100">
        <div>
          {title && <h2 className="text-base font-semibold text-gray-800">{title}</h2>}
          {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    )}
    <div className="p-6">{children}</div>
  </div>
);

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  sub?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, icon, color, sub }) => (
  <div className={cn('rounded-2xl p-5 text-white shadow-md', color)}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium opacity-85">{label}</p>
        <p className="text-3xl font-bold mt-1">{value}</p>
        {sub && <p className="text-xs opacity-75 mt-1">{sub}</p>}
      </div>
      <div className="opacity-80">{icon}</div>
    </div>
  </div>
);
