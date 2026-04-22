import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

const titles: Record<string, { title: string; subtitle: string }> = {
  '/': { title: 'Dashboard', subtitle: 'Overview of your fish box operations' },
  '/customers': { title: 'Customer Master', subtitle: 'Manage your customer records' },
  '/sources': { title: 'Fish Varieties', subtitle: 'Manage types and varieties of fish' },
  '/entries': { title: 'Box Entries', subtitle: 'All dispatch and return records' },
  '/dispatch': { title: 'New Dispatch Entry', subtitle: 'Record box dispatches and returns' },
  '/reports': { title: 'Reports & Analytics', subtitle: 'Box movement and customer reports' },
  '/settings': { title: 'Settings', subtitle: 'Company info, backup and system settings' },
  '/architecture': { title: 'System Architecture', subtitle: 'Technical reference for developers' },
  '/guide': { title: 'User Guide', subtitle: 'Step-by-step guide for all features' },
  '/mobile': { title: 'Mobile Access Guide', subtitle: 'How to use FIT on your phone or tablet' },
};

export const Layout: React.FC = () => {
  const location = useLocation();
  const page = titles[location.pathname] ?? { title: 'FIT', subtitle: '' };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopBar title={page.title} subtitle={page.subtitle} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
