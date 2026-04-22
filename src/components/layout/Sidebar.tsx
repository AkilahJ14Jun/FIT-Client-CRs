import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, Package, ClipboardList,
  BarChart3, ChevronLeft, ChevronRight, Database, Menu, X,
  Settings, BookOpen, Layers, Smartphone, MapPin, ShieldCheck
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { FishLogo } from '../ui/FishLogo';
import { useTranslation } from '../../i18n/TranslationProvider';
import { useAuth } from '../../auth/AuthContext';

const NAV_KEYS_BASE = [
  { to: '/', labelKey: 'sidebar.dashboard', icon: LayoutDashboard, group: 'main' },
  { to: '/customers', labelKey: 'sidebar.customers', icon: Users, group: 'main' },
  { to: '/customer-areas', labelKey: 'sidebar.customerAreas', icon: MapPin, group: 'main' },
  { to: '/sources', labelKey: 'sidebar.sources', icon: Database, group: 'main' },
  { to: '/entries', labelKey: 'sidebar.entries', icon: Package, group: 'main' },
  { to: '/dispatch', labelKey: 'sidebar.dispatch', icon: ClipboardList, group: 'main' },
  { to: '/reports', labelKey: 'sidebar.reports', icon: BarChart3, group: 'main' },
  { to: '/settings', labelKey: 'sidebar.settings', icon: Settings, group: 'system' },
  { to: '/admin-data', labelKey: 'sidebar.adminData', icon: ShieldCheck, group: 'system', adminOnly: true },
  { to: '/architecture', labelKey: 'sidebar.architecture', icon: Layers, group: 'docs', adminOnly: true },
  { to: '/guide', labelKey: 'sidebar.guide', icon: BookOpen, group: 'docs', adminOnly: true },
  { to: '/mobile', labelKey: 'sidebar.mobileAccess', icon: Smartphone, group: 'docs', hidden: true },
];

const GROUP_KEYS = [
  { id: 'main', labelKey: 'group.application' },
  { id: 'system', labelKey: 'group.system' },
  { id: 'docs', labelKey: 'group.documentation' },
];

export const Sidebar: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isSystemAdmin = user?.isSystemAdmin === true;
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = NAV_KEYS_BASE.filter(n => !n.adminOnly || isSystemAdmin);

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 bg-blue-900 text-white p-2 rounded-xl shadow-lg"
        onClick={() => setMobileOpen((v) => !v)}
        aria-label="Toggle menu"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/40" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed md:relative top-0 left-0 h-full z-40 flex flex-col bg-gradient-to-b from-blue-950 to-blue-900 text-white transition-all duration-300 shadow-2xl',
          collapsed ? 'w-16' : 'w-64',
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className={cn(
          'flex items-center gap-3 px-3 py-4 border-b border-white/10',
          collapsed ? 'justify-center px-2' : 'px-4'
        )}>
          <div className={cn(
            'shrink-0 rounded-2xl flex items-center justify-center',
            'bg-gradient-to-br from-white/20 to-white/5',
            'shadow-lg shadow-black/30 ring-1 ring-white/10',
            collapsed ? 'p-1' : 'p-1.5'
          )}>
            <FishLogo size={collapsed ? 36 : 52} />
          </div>

          {!collapsed && (
            <div className="min-w-0">
              <p className="font-extrabold text-xl leading-none tracking-widest text-white drop-shadow">
                FIT
              </p>
              <p className="text-[10px] leading-tight font-semibold tracking-wide mt-1 whitespace-nowrap flex items-center gap-0">
                <span className="text-amber-400 font-extrabold text-[12px]">F</span>
                <span className="text-cyan-300">ish&nbsp;</span>
                <span className="text-amber-400 font-extrabold text-[12px]">I</span>
                <span className="text-cyan-300">nventory&nbsp;</span>
                <span className="text-amber-400 font-extrabold text-[12px]">T</span>
                <span className="text-cyan-300">racking</span>
              </p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {GROUP_KEYS.map((group) => {
            const items = navItems.filter((n) => n.group === group.id && !n.hidden);
            if (!items.length) return null;
            return (
              <div key={group.id} className="mb-2">
                {!collapsed && (
                  <p className="px-4 py-1 text-xs text-blue-400 uppercase tracking-widest font-semibold">
                    {t(group.labelKey)}
                  </p>
                )}
                {items.map(({ to, labelKey, icon: Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={to === '/'}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 px-4 py-2.5 mx-2 rounded-xl text-sm font-medium transition-all',
                        collapsed && 'justify-center',
                        isActive
                          ? 'bg-white/15 text-white shadow-inner'
                          : 'text-blue-200 hover:bg-white/10 hover:text-white'
                      )
                    }
                  >
                    <Icon size={18} className="shrink-0" />
                    {!collapsed && <span>{t(labelKey)}</span>}
                  </NavLink>
                ))}
              </div>
            );
          })}
        </nav>

        {/* Version badge */}
        {!collapsed && (
          <div className="px-4 py-3 border-t border-white/10">
            <p className="text-xs text-blue-400 text-center">{t('sidebar.version')}</p>
          </div>
        )}

        {/* Collapse toggle */}
        <button
          className="hidden md:flex items-center justify-center py-3 border-t border-white/10 hover:bg-white/10 transition-colors text-blue-300 hover:text-white"
          onClick={() => setCollapsed((v) => !v)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </aside>
    </>
  );
};
