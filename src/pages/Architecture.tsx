import React, { useState } from 'react';
import {
  Server, Database, Globe, Smartphone, Shield, Package,
  ArrowDown, CheckCircle, Monitor, Wifi, Lock, Zap,
  FileText, Users, BarChart3, Settings, ChevronDown, ChevronUp
} from 'lucide-react';

type Section = 'overview' | 'modules' | 'data' | 'security' | 'deployment';

export const Architecture: React.FC = () => {
  const [activeSection, setActiveSection] = useState<Section>('overview');

  const SECTIONS: { id: Section; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'System Overview', icon: <Globe size={16} /> },
    { id: 'modules', label: 'Application Modules', icon: <Package size={16} /> },
    { id: 'data', label: 'Data Architecture', icon: <Database size={16} /> },
    { id: 'security', label: 'Security & Access', icon: <Shield size={16} /> },
    { id: 'deployment', label: 'Deployment Guide', icon: <Server size={16} /> },
  ];

  return (
    <div className="space-y-5">
      {/* Tab bar */}
      <div className="flex flex-wrap gap-1 bg-gray-100 rounded-xl p-1">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              activeSection === s.id
                ? 'bg-white text-blue-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            {s.icon}
            <span>{s.label}</span>
          </button>
        ))}
      </div>

      {/* ── System Overview ── */}
      {activeSection === 'overview' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">
              <Globe size={20} className="text-blue-700" /> FIT – System Architecture Overview
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              FIT (Fish Inventory Tracking) is a single-page progressive web application (PWA) built with 
              React 19 + Vite 7 + Tailwind CSS 4. It operates entirely in the browser using localStorage for 
              data persistence, requiring zero backend infrastructure for the current release.
            </p>

            {/* Architecture diagram */}
            <div className="bg-gradient-to-br from-blue-950 to-blue-900 rounded-2xl p-6 text-white">
              <h3 className="text-center text-sm font-semibold mb-6 text-blue-200 uppercase tracking-widest">
                FIT v2.0 — Architecture Diagram
              </h3>

              {/* User Layer */}
              <div className="flex justify-center gap-4 mb-4">
                {[
                  { icon: <Monitor size={20} />, label: 'Desktop Browser' },
                  { icon: <Smartphone size={20} />, label: 'Mobile Browser' },
                  { icon: <Smartphone size={20} />, label: 'Tablet' },
                ].map(({ icon, label }) => (
                  <div key={label} className="flex flex-col items-center gap-1">
                    <div className="bg-white/10 rounded-xl p-3">{icon}</div>
                    <span className="text-xs text-blue-300">{label}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-center mb-1">
                <ArrowDown size={18} className="text-blue-400" />
              </div>
              <div className="text-center text-xs text-blue-300 mb-3">HTTPS / Static Hosting</div>
              <div className="flex justify-center mb-1">
                <ArrowDown size={18} className="text-blue-400" />
              </div>

              {/* Frontend Layer */}
              <div className="bg-white/10 rounded-xl p-4 mb-4 border border-white/20">
                <p className="text-xs text-blue-300 uppercase tracking-widest mb-3 text-center">Frontend Application Layer</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { label: 'React 19', sub: 'UI Framework' },
                    { label: 'Vite 7', sub: 'Build Tool' },
                    { label: 'TailwindCSS 4', sub: 'Styling' },
                    { label: 'React Router 7', sub: 'Navigation' },
                  ].map(({ label, sub }) => (
                    <div key={label} className="bg-white/10 rounded-lg p-2 text-center">
                      <p className="text-xs font-semibold">{label}</p>
                      <p className="text-xs text-blue-300">{sub}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Module Layer */}
              <div className="bg-white/10 rounded-xl p-4 mb-4 border border-white/20">
                <p className="text-xs text-blue-300 uppercase tracking-widest mb-3 text-center">Application Modules</p>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {['Dashboard', 'Customers', 'Sources', 'Box Entries', 'Reports', 'Settings'].map((m) => (
                    <div key={m} className="bg-cyan-500/20 rounded-lg p-2 text-center">
                      <p className="text-xs">{m}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Data Layer */}
              <div className="bg-white/10 rounded-xl p-4 border border-white/20">
                <p className="text-xs text-blue-300 uppercase tracking-widest mb-3 text-center">Data & Utility Layer</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { label: 'localStorage', sub: 'Data Store' },
                    { label: 'jsPDF', sub: 'PDF Generation' },
                    { label: 'date-fns', sub: 'Date Utils' },
                    { label: 'Audit Log', sub: 'Change Tracking' },
                  ].map(({ label, sub }) => (
                    <div key={label} className="bg-emerald-500/20 rounded-lg p-2 text-center">
                      <p className="text-xs font-semibold">{label}</p>
                      <p className="text-xs text-blue-300">{sub}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Key characteristics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: <Wifi size={20} />, title: 'Works Offline', desc: 'All data is stored locally. No internet needed after initial load.', color: 'bg-emerald-50 text-emerald-700' },
              { icon: <Zap size={20} />, title: 'Instant Performance', desc: 'No API calls. All operations complete in milliseconds.', color: 'bg-yellow-50 text-yellow-700' },
              { icon: <Lock size={20} />, title: 'Data Privacy', desc: 'Data never leaves the device. Complete privacy by design.', color: 'bg-blue-50 text-blue-800' },
              { icon: <Smartphone size={20} />, title: 'Mobile Responsive', desc: 'Fully usable on mobile phones and tablets.', color: 'bg-purple-50 text-purple-700' },
              { icon: <Package size={20} />, title: 'Modular Design', desc: 'Each page is an independent module. Easy to extend.', color: 'bg-orange-50 text-orange-700' },
              { icon: <Shield size={20} />, title: 'Audit Trail', desc: 'Every create, update and delete is logged with timestamps.', color: 'bg-red-50 text-red-700' },
            ].map(({ icon, title, desc, color }) => (
              <div key={title} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className={`inline-flex rounded-xl p-2 mb-3 ${color}`}>{icon}</div>
                <h4 className="font-semibold text-gray-800 text-sm mb-1">{title}</h4>
                <p className="text-xs text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Application Modules ── */}
      {activeSection === 'modules' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Package size={20} className="text-blue-700" /> Application Modules
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              FIT is built with a strict modular architecture. Each module (page) is fully self-contained 
              with its own state, validation, and UI. Adding or removing a module requires changes to only 
              3 files: the module itself, the router, and the sidebar navigation.
            </p>
            <div className="space-y-4">
              {[
                {
                  icon: <BarChart3 size={20} />,
                  name: 'Dashboard Module',
                  path: 'src/pages/Dashboard.tsx',
                  color: 'bg-blue-50 text-blue-800',
                  desc: 'Real-time KPI cards, recent entries table, top customers, monthly trend analysis. Aggregates data from all other modules.',
                  features: ['Total boxes sent/returned/balance', 'Today\'s dispatch summary', 'Top 5 customers by volume', 'Recent 10 entries'],
                },
                {
                  icon: <Users size={20} />,
                  name: 'Customer Master Module',
                  path: 'src/pages/Customers.tsx',
                  color: 'bg-purple-50 text-purple-700',
                  desc: 'Full CRUD for customer master. Supports search, active/inactive toggle, and all contact details.',
                  features: ['Add / Edit / Delete customers', 'Search by name, shop, mobile, email', 'Active / Inactive status toggle', 'Full contact info (phone, email, address)'],
                },
                {
                  icon: <Database size={20} />,
                  name: 'Inventory Source Module',
                  path: 'src/pages/Sources.tsx',
                  color: 'bg-emerald-50 text-emerald-700',
                  desc: 'Manages all box supply sources including fishing harbours and third-party suppliers.',
                  features: ['Add / Edit / Delete sources', 'Contact person & mobile', 'Active / Inactive toggle', 'Used as dropdown in Box Entry'],
                },
                {
                  icon: <Package size={20} />,
                  name: 'Box Entry / Dispatch Module',
                  path: 'src/pages/Dispatch.tsx + Entries.tsx',
                  color: 'bg-orange-50 text-orange-700',
                  desc: 'Core business module. Captures all box movements including dispatch, returns, opening balances, and external source boxes.',
                  features: ['5 entry types (dispatch, return, opening, forward, external)', 'Auto-calculated balance boxes', 'External source with source master lookup', 'Edit existing entries', 'PDF bill generation + WhatsApp share'],
                },
                {
                  icon: <BarChart3 size={20} />,
                  name: 'Reports Module',
                  path: 'src/pages/Reports.tsx',
                  color: 'bg-yellow-50 text-yellow-700',
                  desc: 'Multi-mode reporting with PDF export. Supports date range and single-date filtering.',
                  features: ['All customers – date range', 'One customer – date range', 'One customer – single date', 'PDF export with summary table', 'Quick date presets (Today, 7D, 30D, Month)'],
                },
                {
                  icon: <Settings size={20} />,
                  name: 'Settings Module',
                  path: 'src/pages/Settings.tsx',
                  color: 'bg-gray-50 text-gray-700',
                  desc: 'Company configuration, data backup/restore, and full audit trail viewing.',
                  features: ['Company name, address, GST, prefix', 'JSON backup export', 'Backup import with merge', 'Audit log with action/entity/timestamp'],
                },
              ].map(({ icon, name, path, color, desc, features }) => (
                <div key={name} className="border border-gray-100 rounded-xl p-5">
                  <div className="flex items-start gap-4">
                    <div className={`rounded-xl p-2 shrink-0 ${color}`}>{icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-800">{name}</h3>
                        <code className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg">{path}</code>
                      </div>
                      <p className="text-sm text-gray-600 mt-1 mb-3">{desc}</p>
                      <div className="flex flex-wrap gap-2">
                        {features.map((f) => (
                          <span key={f} className="flex items-center gap-1 text-xs bg-gray-50 text-gray-600 px-2 py-1 rounded-lg">
                            <CheckCircle size={11} className="text-emerald-500 shrink-0" /> {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Data Architecture ── */}
      {activeSection === 'data' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">
              <Database size={20} className="text-blue-700" /> Data Architecture
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              Data is stored in browser localStorage as versioned JSON. Each collection has its own key. 
              The schema is designed to be forward-compatible with a future SQLite / PostgreSQL backend.
            </p>

            {/* Storage Keys */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-800 mb-3 text-sm">localStorage Collections</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-blue-900 text-white text-xs">
                      <th className="text-left px-4 py-2 rounded-tl-lg">Key</th>
                      <th className="text-left px-4 py-2">Entity</th>
                      <th className="text-left px-4 py-2 rounded-tr-lg">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {[
                      { key: 'fit_customers_v2', entity: 'Customer[]', desc: 'Customer master — name, shop, mobile, email, address' },
                      { key: 'fit_inventory_sources_v2', entity: 'InventorySource[]', desc: 'Box supply sources — harbour, contact, mobile' },
                      { key: 'fit_box_entries_v2', entity: 'BoxEntry[]', desc: 'All box movements — dispatch, return, balance, external' },
                      { key: 'fit_app_settings_v2', entity: 'AppSettings', desc: 'Company info, bill prefix, backup config' },
                      { key: 'fit_audit_log_v2', entity: 'AuditLog[]', desc: 'Change tracking — action, entity, summary, timestamp' },
                    ].map(({ key, entity, desc }) => (
                      <tr key={key} className="hover:bg-gray-50">
                        <td className="px-4 py-2"><code className="text-xs bg-blue-50 text-blue-800 px-2 py-0.5 rounded">{key}</code></td>
                        <td className="px-4 py-2 text-xs text-emerald-700 font-mono">{entity}</td>
                        <td className="px-4 py-2 text-xs text-gray-600">{desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Schemas */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800 text-sm">Data Schemas</h3>
              {[
                {
                  name: 'BoxEntry (Core Entity)',
                  color: 'border-blue-200 bg-blue-50/30',
                  fields: [
                    { field: 'id', type: 'UUID', desc: 'Unique identifier (auto-generated)' },
                    { field: 'billNumber', type: 'string', desc: 'Auto-sequenced bill number (BILL-0001)' },
                    { field: 'entryDate', type: 'YYYY-MM-DD', desc: 'Date of dispatch / entry' },
                    { field: 'customerId', type: 'UUID ref', desc: 'Foreign key → Customer.id' },
                    { field: 'entryType', type: 'enum', desc: 'dispatch | return | opening_balance | balance_forward | external_source' },
                    { field: 'totalBoxesSent', type: 'number', desc: 'Cumulative boxes sent to customer' },
                    { field: 'currentQuantity', type: 'number', desc: 'Boxes dispatched in this entry' },
                    { field: 'boxesReturned', type: 'number', desc: 'Boxes returned from customer' },
                    { field: 'balanceBoxes', type: 'number', desc: 'Auto-calc: totalBoxesSent − boxesReturned' },
                    { field: 'driverName', type: 'string', desc: 'Delivery driver name' },
                    { field: 'vehicleNumber', type: 'string', desc: 'Vehicle registration number' },
                    { field: 'isExternalSource', type: 'boolean', desc: 'Flag for third-party source boxes' },
                    { field: 'sourceId', type: 'UUID ref?', desc: 'Optional FK → InventorySource.id' },
                    { field: 'externalBoxCount', type: 'number?', desc: 'Count of external source boxes' },
                  ],
                },
                {
                  name: 'Customer',
                  color: 'border-purple-200 bg-purple-50/30',
                  fields: [
                    { field: 'id', type: 'UUID', desc: 'Unique identifier' },
                    { field: 'customerName', type: 'string', desc: 'Owner / trader name' },
                    { field: 'shopName', type: 'string', desc: 'Business / shop name' },
                    { field: 'mobile', type: 'string', desc: '10–15 digit mobile number' },
                    { field: 'email', type: 'string?', desc: 'Optional email address' },
                    { field: 'address', type: 'string', desc: 'Full postal address' },
                    { field: 'isActive', type: 'boolean', desc: 'Soft delete / deactivation flag' },
                    { field: 'notes', type: 'string?', desc: 'Free-text notes' },
                  ],
                },
              ].map(({ name, color, fields }) => (
                <div key={name} className={`border rounded-xl p-4 ${color}`}>
                  <h4 className="font-semibold text-gray-800 text-sm mb-3">{name}</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-gray-500 uppercase tracking-wider">
                          <th className="text-left pb-2 pr-4">Field</th>
                          <th className="text-left pb-2 pr-4">Type</th>
                          <th className="text-left pb-2">Description</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/50">
                        {fields.map(({ field, type, desc }) => (
                          <tr key={field}>
                            <td className="py-1.5 pr-4 font-mono text-blue-800 font-semibold">{field}</td>
                            <td className="py-1.5 pr-4 text-emerald-700 font-mono">{type}</td>
                            <td className="py-1.5 text-gray-600">{desc}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Security ── */}
      {activeSection === 'security' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Shield size={20} className="text-blue-700" /> Security & Access Control
            </h2>
            <div className="space-y-4">
              {[
                {
                  title: 'Data Isolation',
                  icon: <Lock size={18} />,
                  color: 'bg-blue-50 text-blue-800',
                  items: [
                    'All data stored in browser localStorage — never transmitted to any server',
                    'Data is isolated per browser origin (domain + protocol)',
                    'Each device/browser maintains its own independent data store',
                    'Backup/Restore allows controlled data transfer between devices',
                  ],
                },
                {
                  title: 'Audit Trail',
                  icon: <Shield size={18} />,
                  color: 'bg-emerald-50 text-emerald-700',
                  items: [
                    'Every CREATE, UPDATE, DELETE action is recorded in the audit log',
                    'Audit entries include entity type, ID, summary text, and ISO timestamp',
                    'Last 500 audit entries are retained automatically',
                    'Audit log is visible in Settings → Audit Log tab',
                  ],
                },
                {
                  title: 'Production Deployment Security',
                  icon: <Globe size={18} />,
                  color: 'bg-orange-50 text-orange-700',
                  items: [
                    'Serve via HTTPS only — configure SSL certificate on your host',
                    'Add HTTP security headers: X-Frame-Options, CSP, HSTS',
                    'The app is a static site — no server-side code to exploit',
                    'WhatsApp sharing uses wa.me deep links (no API key required)',
                  ],
                },
                {
                  title: 'Backup & Recovery',
                  icon: <Database size={18} />,
                  color: 'bg-purple-50 text-purple-700',
                  items: [
                    'Export JSON backup from Settings → Backup & Restore daily',
                    'Store backups in Google Drive / OneDrive for off-device safety',
                    'Import backup to restore or migrate to a new device/browser',
                    'Backup merge is non-destructive — existing records are preserved',
                  ],
                },
              ].map(({ title, icon, color, items }) => (
                <div key={title} className="border border-gray-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`rounded-lg p-1.5 ${color}`}>{icon}</div>
                    <h3 className="font-semibold text-gray-800 text-sm">{title}</h3>
                  </div>
                  <ul className="space-y-1.5">
                    {items.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-xs text-gray-600">
                        <CheckCircle size={13} className="text-emerald-500 mt-0.5 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Deployment Guide ── */}
      {activeSection === 'deployment' && <DeploymentGuide />}
    </div>
  );
};

const DeploymentGuide: React.FC = () => {
  const [openStep, setOpenStep] = useState<number | null>(0);

  const steps = [
    {
      title: 'Step 1 — Prerequisites',
      icon: <Package size={18} />,
      content: (
        <div className="space-y-3 text-sm text-gray-700">
          <p>Ensure the following are installed on your build machine:</p>
          <div className="space-y-2">
            {[
              { tool: 'Node.js', version: '≥ 18.x', check: 'node --version', install: 'Download from nodejs.org' },
              { tool: 'npm', version: '≥ 9.x', check: 'npm --version', install: 'Bundled with Node.js' },
              { tool: 'Git', version: 'any', check: 'git --version', install: 'Download from git-scm.com' },
            ].map(({ tool, version, check, install }) => (
              <div key={tool} className="bg-gray-50 rounded-lg p-3 flex flex-wrap gap-4">
                <div>
                  <span className="font-semibold text-gray-800">{tool}</span>
                  <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">{version}</span>
                </div>
                <div className="text-xs text-gray-500">
                  Verify: <code className="bg-white px-1 rounded">{check}</code>
                </div>
                <div className="text-xs text-gray-500">Install: {install}</div>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      title: 'Step 2 — Clone & Install',
      icon: <FileText size={18} />,
      content: (
        <div className="space-y-3">
          <p className="text-sm text-gray-700">Get the source code and install dependencies:</p>
          <pre className="bg-gray-900 text-green-400 rounded-xl p-4 text-xs overflow-x-auto">{`# 1. Clone the repository
git clone https://github.com/your-org/FIT.git
cd FIT

# 2. Install all dependencies
npm install

# 3. Verify dev server works (optional)
npm run dev
# → App opens at http://localhost:5173`}</pre>
        </div>
      ),
    },
    {
      title: 'Step 3 — Build for Production',
      icon: <Zap size={18} />,
      content: (
        <div className="space-y-3">
          <p className="text-sm text-gray-700">Create the optimised production build:</p>
          <pre className="bg-gray-900 text-green-400 rounded-xl p-4 text-xs overflow-x-auto">{`# Build the app
npm run build

# Output is in the /dist folder:
# dist/
# ├── index.html        ← Main HTML entry
# ├── assets/
# │   ├── index-[hash].js   ← All JS (bundled)
# │   └── index-[hash].css  ← All CSS (bundled)

# Preview the production build locally
npm run preview
# → http://localhost:4173`}</pre>
          <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-800">
            <strong>Note:</strong> The build output in <code>/dist</code> is a completely static site. 
            It can be hosted on any static file server, CDN, or cloud storage.
          </div>
        </div>
      ),
    },
    {
      title: 'Step 4A — Deploy to Netlify (Recommended)',
      icon: <Globe size={18} />,
      content: (
        <div className="space-y-3">
          <p className="text-sm text-gray-700">Netlify provides free hosting with automatic HTTPS:</p>
          <div className="space-y-2">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs font-semibold text-gray-700 mb-1">Option A — Netlify CLI (Recommended)</p>
              <pre className="bg-gray-900 text-green-400 rounded p-3 text-xs overflow-x-auto">{`npm install -g netlify-cli
netlify login
netlify init
netlify deploy --prod --dir=dist`}</pre>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs font-semibold text-gray-700 mb-1">Option B — Drag & Drop</p>
              <p className="text-xs text-gray-600">
                1. Go to <strong>app.netlify.com</strong> → Sites → Add new site<br />
                2. Drag the <code>/dist</code> folder into the deploy area<br />
                3. Your site is live with a free <code>.netlify.app</code> domain
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs font-semibold text-gray-700 mb-1">SPA Redirect Config (REQUIRED)</p>
              <p className="text-xs text-gray-600 mb-2">Create <code>public/_redirects</code> file with:</p>
              <pre className="bg-gray-900 text-green-400 rounded p-2 text-xs">/*  /index.html  200</pre>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Step 4B — Deploy to NGINX (Self-hosted)',
      icon: <Server size={18} />,
      content: (
        <div className="space-y-3">
          <p className="text-sm text-gray-700">For on-premise / local network deployment:</p>
          <pre className="bg-gray-900 text-green-400 rounded-xl p-4 text-xs overflow-x-auto">{`# 1. Install NGINX on Ubuntu/Debian
sudo apt update && sudo apt install nginx -y

# 2. Copy dist to web root
sudo mkdir -p /var/www/fit
sudo cp -r dist/* /var/www/fit/

# 3. Configure NGINX
sudo nano /etc/nginx/sites-available/fit`}</pre>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs font-semibold text-gray-700 mb-2">NGINX Site Config</p>
            <pre className="bg-gray-900 text-green-400 rounded p-3 text-xs overflow-x-auto">{`server {
    listen 80;
    server_name your-domain.com;
    root /var/www/fit;
    index index.html;

    # SPA fallback — REQUIRED for React Router
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header Referrer-Policy strict-origin-when-cross-origin;

    # Cache static assets
    location ~* \\.(js|css|png|jpg|svg|ico)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}`}</pre>
          </div>
          <pre className="bg-gray-900 text-green-400 rounded-xl p-4 text-xs overflow-x-auto">{`# 4. Enable the site
sudo ln -s /etc/nginx/sites-available/fit /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# 5. (Optional) Add HTTPS with Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com`}</pre>
        </div>
      ),
    },
    {
      title: 'Step 5 — Verify & Go Live',
      icon: <CheckCircle size={18} />,
      content: (
        <div className="space-y-3">
          <p className="text-sm text-gray-700">Final verification checklist before going live:</p>
          <div className="space-y-2">
            {[
              'Visit the deployed URL — app loads correctly',
              'Navigate to all 6 sections (Dashboard, Customers, Sources, Entries, Reports, Settings)',
              'Add a test customer and verify it persists after page refresh',
              'Create a box entry and generate a PDF bill',
              'Export a JSON backup from Settings → Backup & Restore',
              'Test on mobile browser (Chrome / Safari) for responsive layout',
              'Verify HTTPS is active (padlock icon in browser)',
              'Share the URL with your team and confirm access',
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-gray-600 bg-gray-50 rounded-lg p-2">
                <span className="bg-blue-900 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0 font-bold">{i + 1}</span>
                {item}
              </div>
            ))}
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h2 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">
        <Server size={20} className="text-blue-700" /> Step-by-Step Deployment Guide
      </h2>
      <p className="text-sm text-gray-600 mb-6">
        For technical team. Follow these steps to deploy FIT to any static hosting platform.
      </p>
      <div className="space-y-3">
        {steps.map((step, i) => (
          <div key={i} className="border border-gray-100 rounded-xl overflow-hidden">
            <button
              onClick={() => setOpenStep(openStep === i ? null : i)}
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-blue-50 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="bg-blue-900 text-white rounded-lg p-1.5">{step.icon}</div>
                <span className="font-semibold text-gray-800 text-sm">{step.title}</span>
              </div>
              {openStep === i ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
            </button>
            {openStep === i && (
              <div className="px-4 py-4 border-t border-gray-100">
                {step.content}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
