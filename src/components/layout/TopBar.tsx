import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { LogOut } from 'lucide-react';
import { SettingsDB, type AppSettings } from '../../db/database';
import { FishLogo } from '../ui/FishLogo';
import { useAuth } from '../../auth/AuthContext';

interface TopBarProps {
  title: string;
  subtitle?: string;
}

const DEFAULT_SETTINGS = { companyName: 'FIT v3.0', traderName: '' } as Partial<AppSettings>;

export const TopBar: React.FC<TopBarProps> = ({ title, subtitle }) => {
  const { user, logout } = useAuth();
  const [settings, setSettings] = useState<Partial<AppSettings>>(DEFAULT_SETTINGS);

  useEffect(() => {
    SettingsDB.get().then(setSettings).catch(() => {});
  }, []);

  return (
    <header className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-3">
        <div className="md:hidden w-8" /> {/* spacer for mobile menu icon */}
        <div className="flex items-center gap-2">
          <FishLogo size={28} />
          <div>
            <h1 className="text-base font-semibold text-gray-800">{title}</h1>
            {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right hidden sm:block">
          <p className="text-xs text-gray-500">{format(new Date(), 'EEEE, dd MMMM yyyy')}</p>
          <p className="text-xs font-medium text-blue-800">{settings.companyName || 'FIT v3.0'}</p>
        </div>
        {user && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600 font-medium hidden sm:block">{user.displayName}</span>
            <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-semibold">
              {user.isSystemAdmin ? 'Admin' : user.isAdmin ? 'Manager' : 'User'}
            </span>
          </div>
        )}
        <div className="w-8 h-8 rounded-full bg-blue-900 text-white flex items-center justify-center text-xs font-bold shrink-0">
          {(settings.traderName || settings.companyName || 'FIT').charAt(0).toUpperCase()}
        </div>
        {user && (
          <button
            onClick={logout}
            className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg px-2 py-1.5 transition-colors"
            title="Log out"
          >
            <LogOut size={14} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        )}
      </div>
    </header>
  );
};
