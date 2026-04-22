# FIT — Fish Inventory Tracking

A full-stack inventory management application for tracking fish box distribution across customers and fish varieties. Manages stock positions, dispatches, returns, receipt generation, and multi-language reporting.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [Repository Structure](#3-repository-structure)
4. [Core Domain Model](#4-core-domain-model)
5. [Frontend Architecture](#5-frontend-architecture)
6. [Backend Architecture](#6-backend-architecture)
7. [Database Schema](#7-database-schema)
8. [API Reference](#8-api-reference)
9. [Authentication](#9-authentication)
10. [Internationalisation (i18n)](#10-internationalisation-i18n)
11. [PDF & Receipt Generation](#11-pdf--receipt-generation)
12. [WhatsApp Zero-API Sharing](#12-whatsapp-zero-api-sharing)
13. [Development Setup](#13-development-setup)
14. [Production Deployment (Windows)](#14-production-deployment-windows)
15. [Environment Variables](#15-environment-variables)
16. [Key Business Logic](#16-key-business-logic)
17. [Change Log / Recent CRs](#17-change-log--recent-crs)

---

## 1. Project Overview

FIT tracks fish box inventory for a trading business. Boxes are dispatched to customers and returned over time. The app records every movement as a **BoxEntry** (one of three types: `stock_position`, `dispatch`, or `return`) and computes a live balance per customer.

**Key capabilities:**
- Set an initial stock position per variety (company-owned + external suppliers)
- Record dispatches to named customers with bill numbers, driver, and vehicle info
- Record returns from customers
- Auto-generate and download a PDF customer receipt on every save
- Share receipts via WhatsApp (no API cost — OS-level protocol handler)
- Multi-language UI: English, Tamil (தமிழ்), Hindi (हिन्दी)
- Role-based access: System Admin and Admin roles
- Stock alert banner when remaining stock falls below a configurable threshold
- Audit log for every create / update / delete action
- Exportable reports

---

## 2. Technology Stack

| Layer | Technology | Version |
|---|---|---|
| Frontend framework | React | 19 |
| Language | TypeScript | 5.x |
| Build tool | Vite | Latest |
| Styling | Tailwind CSS | v4 (via `@tailwindcss/vite`) |
| Routing | React Router | v7 (HashRouter) |
| Icons | lucide-react | Latest |
| PDF generation | jsPDF + jspdf-autotable | Latest |
| Backend framework | Express.js | Latest |
| ORM | TypeORM | Latest |
| Database | MySQL | 8.0 |
| Database container | Docker / Docker Compose | — |
| Auth hashing | bcryptjs | Latest |
| Path alias | `@` → `src/` | Configured in `vite.config.ts` |

---

## 3. Repository Structure

```
/
├── src/                          # Frontend source
│   ├── App.tsx                   # Root router + auth guard
│   ├── main.tsx                  # Vite entry point
│   ├── index.css                 # Global styles
│   ├── auth/
│   │   └── AuthContext.tsx       # JWT-like auth context (login, logout, isAuthenticated)
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Layout.tsx        # Shell: sidebar + topbar + <Outlet>
│   │   │   ├── Sidebar.tsx       # Navigation links
│   │   │   └── TopBar.tsx        # Header bar, language switcher, user info
│   │   └── ui/
│   │       ├── Button.tsx
│   │       ├── Input.tsx         # Also exports Select, TextArea
│   │       ├── Card.tsx
│   │       ├── Modal.tsx
│   │       ├── Badge.tsx
│   │       ├── FishLogo.tsx
│   │       ├── ReceiptPreviewModal.tsx
│   │       ├── StockAlertBanner.tsx
│   │       └── WhatsAppSendModal.tsx
│   ├── db/
│   │   └── database.ts           # All TypeScript types + API fetch helpers (CustomerDB, EntryDB, etc.)
│   ├── i18n/
│   │   ├── TranslationProvider.tsx  # React context; reads language from AppSettings
│   │   └── translations.ts          # All UI strings: English, Tamil, Hindi
│   ├── pages/
│   │   ├── Dashboard.tsx         # KPI cards + recent entries
│   │   ├── Customers.tsx         # Customer CRUD + area assignment
│   │   ├── CustomerAreas.tsx     # Area/zone management
│   │   ├── Sources.tsx           # Fish variety CRUD
│   │   ├── Entries.tsx           # Full entry list with filters
│   │   ├── Dispatch.tsx          # ★ Core form: Stock Position / Dispatch / Return
│   │   ├── Reports.tsx           # Date-range reports + export
│   │   ├── Settings.tsx          # App settings, user management, stock alert config
│   │   ├── Architecture.tsx      # Live architecture diagram (internal docs)
│   │   ├── UserGuide.tsx         # Embedded user guide
│   │   ├── Login.tsx             # Login form
│   │   └── MobileAccess.tsx      # QR / mobile access info
│   └── utils/
│       ├── cn.ts                 # tailwind-merge helper
│       ├── pdf.ts                # Low-level PDF generation (jsPDF)
│       └── customerReceipt.ts    # High-level receipt builder + download trigger
│
├── server/                       # Backend source
│   ├── src/
│   │   ├── index.ts              # Express app, all route handlers, audit logging
│   │   ├── data-source.ts        # TypeORM DataSource configuration
│   │   └── entity/
│   │       ├── Customer.ts
│   │       ├── CustomerArea.ts
│   │       ├── InventorySource.ts
│   │       ├── BoxEntry.ts       # Core inventory record entity
│   │       ├── AppSettings.ts
│   │       ├── AuditLog.ts
│   │       └── User.ts
│   ├── package.json
│   └── tsconfig.json
│
├── .agents/
│   └── skills/
│       └── whatsapp-zero-api-sharing/
│           ├── SKILL.md          # Agentic instructions for WhatsApp sharing skill
│           └── examples/
│               └── FrontendUsage.ts
│
├── scripts/                      # Windows PowerShell automation
│   ├── RegisterProtocol.ps1      # Run once as Admin — registers fitshare:// URL handler
│   ├── FITShareFinal.ps1         # WhatsApp share handler (invoked by OS)
│   ├── ShareOnWhatsApp.ps1       # Alternative, more robust share handler
│   ├── FITShareProcess.ps1       # Process management helper
│   ├── ShareAutomation.ps1       # Automation orchestrator
│   └── debug_windows.ps1         # Debug helper — dumps visible window titles
│
├── dist/                         # Frontend build output (generated, not committed)
├── docker-compose.yml            # MySQL 8.0 container definition
├── vite.config.ts                # Vite config: React plugin, Tailwind plugin, /api proxy
├── package.json                  # Frontend dependencies
├── tsconfig.json                 # Frontend TypeScript config
├── CLAUDE.md                     # Agentic tool guidance (brief)
├── DEPLOYMENT.md                 # Full Windows deployment walkthrough
└── README.md                     # This file
```

---

## 4. Core Domain Model

All types are defined in `src/db/database.ts` and mirrored as TypeORM entities in `server/src/entity/`.

### BoxEntry (the central record)

```typescript
interface BoxEntry {
  id: string;                          // UUID
  billNumber: string;                  // e.g. "BILL-042"
  entryDate: string;                   // ISO date "YYYY-MM-DD"
  customerId: string;                  // FK → Customer.id (empty for stock_position)
  customerName?: string;               // Denormalised snapshot
  shopName?: string;                   // Denormalised snapshot
  description: string;
  entryType: 'opening_balance' | 'dispatch' | 'return';  // 'opening_balance' = Stock Position
  totalBoxesSent: number;              // Cumulative sent count at time of entry
  currentQuantity: number;             // Boxes sent THIS transaction (0 for return)
  boxesReturned: number;               // Boxes returned THIS transaction
  balanceBoxes: number;                // Computed: totalAlreadySent + currentQty - returned
  driverName: string;
  vehicleNumber: string;
  isExternalSource: boolean;           // True if boxes sourced from a supplier
  sourceId?: string;                   // FK → InventorySource.id
  sourceName?: string;                 // Denormalised snapshot
  externalBoxCount?: number;           // Boxes from external source this transaction
  companyOwnQuantity?: number;         // Used for stock_position entries only
  openingStockSources?: OpeningStockSource[];  // Multi-source breakdown for stock_position
  createdAt: string;
  updatedAt: string;
}
```

### entryType Semantics

| `entryType` value | Display label | Purpose |
|---|---|---|
| `opening_balance` | **Stock Position** | Sets initial total stock across company + external sources. Not tied to a customer. |
| `dispatch` | **Dispatch** | Records boxes sent to a customer. Increments `Customer.totalSentCount`. |
| `return` | **Return** | Records boxes returned by a customer. |

> **Note for agents:** The value stored in the database remains `'opening_balance'` for backwards compatibility. The UI label was renamed to **"Stock Position"** in the current CR. Do not change the string value in code — only the display labels and translations.

### Balance Formula

```
balanceBoxes = totalAlreadySent + currentQuantity - boxesReturned
```

> **Important:** In the current implementation, `currentQuantity` for a Dispatch entry is the sum of all boxes from selected fish varieties. For a Return entry, `currentQuantity` is 0 and only `boxesReturned` is recorded.


This is recomputed on every save in `Dispatch.tsx → handleSaveDispatch()`.

### Other Entities

| Entity | Key fields | Notes |
|---|---|---|
| `Customer` | `customerName`, `shopName`, `mobile`, `areaId`, `totalSentCount` | `totalSentCount` is incremented on each dispatch and reset via `/api/customers/:id/reset-sent-count` |
| `CustomerArea` | `areaName` | Optional grouping for customers (zones/regions) |
| `InventorySource` | `sourceName`, `contactPerson`, `mobile` | Fish Varieties (suppliers) referenced in dispatches and stock position entries |
| `AppSettings` | `language`, `stockAlertThreshold`, `billPrefix`, `companyName`, … | Singleton row — only one row ever exists |
| `AuditLog` | `action`, `entity`, `entityId`, `summary`, `timestamp` | Append-only; written server-side on every CUD operation |
| `User` | `username`, `passwordHash`, `isSystemAdmin`, `isAdmin` | bcrypt-hashed passwords; two built-in users seeded on first run |

---

## 5. Frontend Architecture

### Routing (`src/App.tsx`)

Uses `HashRouter` (URLs like `http://host/#/customers`) to support deployment behind Nginx `try_files` without server-side route handling.

```
/login            → Login (public)
/                 → Dashboard (protected)
/customers        → Customers
/customer-areas   → CustomerAreas
/sources          → Sources
/entries          → Entries (full ledger)
/dispatch         → Dispatch (★ main data-entry form)
/reports          → Reports
/settings         → Settings + User Management
/architecture     → Architecture diagram
/guide            → User Guide
/mobile           → Mobile Access / QR
```

All routes except `/login` are wrapped in `<ProtectedRoute>`, which redirects to `/login` when `AuthContext.isAuthenticated` is false.

### Data Layer (`src/db/database.ts`)

There is **no local state database**. All data is fetched from the backend REST API via the `apiFetch()` helper, which prefixes every path with `/api`.

Exported namespaces:

| Namespace | Methods |
|---|---|
| `CustomerDB` | `getAll()`, `getById()`, `create()`, `update()`, `delete()`, `resetSentCount()`, `resetAllSentCounts()` |
| `SourceDB` | `getAll()`, `getById()`, `create()`, `update()`, `delete()` |
| `EntryDB` | `getAll()`, `getById()`, `create()`, `update()`, `delete()`, `nextBillNumber()` |
| `SettingsDB` | `get()`, `update()` |
| `StockAlertDB` | `getStatus()`, `dismiss()` |
| `AuditDB` | `getAll()` |
| `BackupDB` | `export()`, `import()` |
| `getDashboardStats()` | Aggregates totals: customers, entries, balance boxes, alert status |

### The Dispatch Page (`src/pages/Dispatch.tsx`)

This is the most complex page and the primary data-entry point.

**Three modes** — selected via a tab at the top:

1. **Stock Position** (`opening_balance`) — Sets initial stock. Shows company-owned quantity input + dynamic rows for external sources. No customer selection.
2. **Dispatch** — Records outgoing boxes. Shows customer selector, current quantity, boxes returned, driver/vehicle fields, and the optional External Source card.
3. **Return** — Records returning boxes. Shows customer selector and boxes returned field only. The **Current Qty** input and the **External Source** card are **hidden** on this tab by design.

**Form state:**
- `DispatchFormState` — used for Dispatch and Return tabs
- `OBFormState` — used for Stock Position tab (separate state object `ob`)

**On save:**
- Stock Position: calls `EntryDB.create()` with `entryType: 'opening_balance'`
- Dispatch/Return: calls `EntryDB.create()` or `EntryDB.update()`, then increments `Customer.totalSentCount` via `CustomerDB.update()`, then triggers PDF download and receipt preview modal

### i18n (`src/i18n/`)

`TranslationProvider` reads `AppSettings.language` on mount and exposes a `t(key)` hook. All UI strings are in `translations.ts` using the pattern:

```typescript
t('key.name', 'English text', 'Tamil text', 'Hindi text')
```

Language can be switched live from the Settings page.

---

## 6. Backend Architecture

Single-file Express server at `server/src/index.ts`. Connects to MySQL via TypeORM with `synchronize: true` (auto-creates/alters tables on startup — acceptable for this deployment scale).

**Port:** `3001`

**CORS:** Enabled for all origins (suitable for LAN deployment; restrict in production if needed).

**Audit logging:** Every POST, PUT, and DELETE handler calls `logAudit(action, entity, entityId, summary)` which writes an `AuditLog` row.

**Bill number generation:** `GET /api/entries/next-bill-number` queries the latest entry and increments the numeric suffix, respecting the `billPrefix` from `AppSettings`.

---

## 7. Database Schema

Auto-managed by TypeORM (`synchronize: true`). Tables correspond directly to entities:

| Table | Entity file |
|---|---|
| `customer` | `entity/Customer.ts` |
| `customer_area` | `entity/CustomerArea.ts` |
| `inventory_source` | `entity/InventorySource.ts` |
| `box_entry` | `entity/BoxEntry.ts` |
| `app_settings` | `entity/AppSettings.ts` |
| `audit_log` | `entity/AuditLog.ts` |
| `user` | `entity/User.ts` |

**Connection details (default / Docker):**

| Parameter | Value |
|---|---|
| Host | `localhost` |
| Port | `3308` (host) → `3306` (container) |
| Database | `fit_db` |
| User | `fit_user` |
| Password | `fit_password` |
| Root password | `root` |

Data is persisted in a named Docker volume: `fit_mysql_data_v2`.

---

## 8. API Reference

All endpoints are prefixed `/api`. The frontend Vite dev server proxies `/api` to `http://localhost:3001`.

### Settings

| Method | Path | Description |
|---|---|---|
| GET | `/api/settings` | Get singleton app settings |
| PUT | `/api/settings` | Update app settings |

### Customers

| Method | Path | Description |
|---|---|---|
| GET | `/api/customers` | List all customers (ordered by name) |
| GET | `/api/customers/:id` | Get single customer |
| POST | `/api/customers` | Create customer |
| PUT | `/api/customers/:id` | Update customer |
| DELETE | `/api/customers/:id` | Delete customer |
| POST | `/api/customers/:id/reset-sent-count` | Reset `totalSentCount` to 0 |
| POST | `/api/customers/reset-all-sent-counts` | Reset all customers' sent counts |

### Inventory Sources

| Method | Path | Description |
|---|---|---|
| GET | `/api/sources` | List all sources |
| GET | `/api/sources/:id` | Get single source |
| POST | `/api/sources` | Create source |
| PUT | `/api/sources/:id` | Update source |
| DELETE | `/api/sources/:id` | Delete source |

### Box Entries

| Method | Path | Description |
|---|---|---|
| GET | `/api/entries` | List all entries (ordered by date desc) |
| GET | `/api/entries/:id` | Get single entry |
| GET | `/api/entries/next-bill-number` | Generate next bill number |
| POST | `/api/entries` | Create entry |
| PUT | `/api/entries/:id` | Update entry |
| DELETE | `/api/entries/:id` | Delete entry |

### Customer Areas

| Method | Path | Description |
|---|---|---|
| GET | `/api/customer-areas` | List all areas |
| GET | `/api/customer-areas/:id` | Get single area |
| POST | `/api/customer-areas` | Create area |
| PUT | `/api/customer-areas/:id` | Update area |
| DELETE | `/api/customer-areas/:id` | Delete area |

### Audit Log

| Method | Path | Description |
|---|---|---|
| GET | `/api/audit` | List all audit log entries (ordered by timestamp desc) |

### Authentication

| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/login` | Login with `{ username, password }` → returns `{ user, token }` |
| GET | `/api/auth/me` | Verify token, returns current user |

### Users

| Method | Path | Description |
|---|---|---|
| GET | `/api/users` | List all users |
| POST | `/api/users` | Create user (hashes password with bcrypt) |
| PUT | `/api/users/:id` | Update user |
| DELETE | `/api/users/:id` | Delete user |

---

## 9. Authentication

- Login via `POST /api/auth/login` with `username` + `password`
- Password stored as bcrypt hash in `User.passwordHash`
- On success, the server returns a `token` (simple base64 encoded user ID — not a full JWT; stateless verification done by re-fetching user from DB on `GET /api/auth/me`)
- `AuthContext` stores the token in memory and re-validates on mount
- `ProtectedRoute` redirects to `/login` if not authenticated

**Default credentials (change immediately after first deploy):**

| Role | Username | Password |
|---|---|---|
| System Admin | `System Admin` | `Clasic@104` |
| Admin | `Admin` | `AS@traders` |

---

## 10. Internationalisation (i18n)

**File:** `src/i18n/translations.ts`

All strings follow this pattern:
```typescript
'key.name': t('English', 'Tamil', 'Hindi'),
```

The `t()` helper in `TranslationProvider.tsx` picks the string at index `[0, 1, 2]` based on `AppSettings.language` (`'en'`, `'ta'`, `'hi'`).

**Adding a new string:**
1. Add an entry in `translations.ts` with all three language variants
2. Use `t('your.key')` in the component via the `useTranslation()` hook

**"Stock Position" translations:**

| Key | English | Tamil | Hindi |
|---|---|---|---|
| `dispatch.openingBal` | Stock Position | சரக்கு நிலை | स्टॉक स्थिति |
| `dispatch.saveOB` | Save Stock Position | சரக்கு நிலை சேமி | स्टॉक स्थिति सेव करें |
| `dispatch.updateOB` | Update Stock Position | சரக்கு நிலை புதுப்பி | स்टॉக स्थिति अपडेट करें |
| `dispatch.obBannerTitle` | Stock Position Entry | சரக்கு நிலை பதிவு | स्टॉक स्थिति प्रविष्टि |
| `dispatch.entryInfoSub` | Bill number and date for this stock position | இந்த சரக்கு நிலைக்கான பில் எண் மற்றும் தேதி | इस स्टॉक स्थिति के लिए बिल नंबर और तिथि |
| `guide.entries.type.opening` | Stock Position | சரக்கு நிலை | स्टॉक स्थिति |

> **Agent note:** The internal `entryType` database value remains `'opening_balance'`. Only the user-facing labels changed.

---

## 11. PDF & Receipt Generation

**Files:** `src/utils/pdf.ts`, `src/utils/customerReceipt.ts`

- After every successful Dispatch or Return save, `downloadReceiptAsPDF(entry, customer)` is called automatically
- It builds a formatted receipt using `jsPDF` + `jspdf-autotable` with company letterhead (from `AppSettings`), bill details, box movement summary, and balance
- The file is triggered as a browser download (`<a download>` click)
- Simultaneously, `ReceiptPreviewModal` opens to show an in-app preview
- From the preview modal, users can also trigger WhatsApp sharing

---

## 12. WhatsApp Zero-API Sharing

Receipts can be sent via WhatsApp Web at zero API cost using a Windows custom URL protocol (`fitshare://`).

**How it works:**
1. User clicks "Share on WhatsApp" in `WhatsAppSendModal`
2. Browser navigates to `fitshare://send?phone=...&file=...`
3. Windows resolves `fitshare://` to a hidden PowerShell process (registered by `RegisterProtocol.ps1`)
4. `FITShareFinal.ps1` (or `ShareOnWhatsApp.ps1`) finds the PDF in Downloads, opens WhatsApp Web, locates the contact, attaches the file, and sends it

**Setup (one-time, on each Windows deployment machine):**
```powershell
# Run as Administrator
Set-Location C:\FIT\scripts
.\RegisterProtocol.ps1
```

**Prerequisite:** WhatsApp Web must be already logged in on the default browser.

**Skill documentation:** `.agents/skills/whatsapp-zero-api-sharing/SKILL.md` — read this for agentic implementation details.

---

## 13. Development Setup

### Prerequisites

- Node.js 20+
- Docker Desktop
- Git

### 1. Start the database

```bash
docker compose up -d
# MySQL available on localhost:3308
```

### 2. Start the backend

```bash
cd server
npm install
npm run dev        # nodemon + ts-node, hot reload, port 3001
```

### 3. Start the frontend

```bash
# from root
npm install
npm run dev        # Vite dev server, port 5173; /api proxied to localhost:3001
```

Open `http://localhost:5173`

### Available Scripts

| Location | Command | Action |
|---|---|---|
| Root | `npm run dev` | Vite dev server |
| Root | `npm run build` | Production frontend build → `dist/` |
| Root | `npm run preview` | Serve production build locally |
| `server/` | `npm run dev` | Backend with hot reload |
| `server/` | `npm run build` | Compile TypeScript → `server/dist/` |
| `server/` | `npm run start` | Run compiled backend |

---

## 14. Production Deployment (Windows)

The target production environment is a **Windows PC on a local network**, serving the LAN. Full step-by-step instructions are in [`DEPLOYMENT.md`](./DEPLOYMENT.md). Summary:

| Step | Action |
|---|---|
| 1 | Install Node.js 20+, Docker Desktop, NSSM, Nginx for Windows |
| 2 | Clone repo to `C:\FIT`; run `docker compose up -d` |
| 3 | `cd server && npm install && npx tsc` |
| 4 | `cd C:\FIT && npm install && npm run build` |
| 5 | Register backend as Windows Service: `nssm install fit-backend` |
| 6 | Configure Nginx to serve `dist/` and proxy `/api` to port 3001 |
| 7 | Register WhatsApp protocol: `.\RegisterProtocol.ps1` (as Admin) |
| 8 | Open firewall ports 80 and 443 only |

**Quick service reference:**

| Component | Port | Management command |
|---|---|---|
| MySQL (Docker) | 3308 | `docker ps` / `docker logs fit_mysql_db` |
| Backend API | 3001 | `nssm restart fit-backend` |
| Nginx | 80 / 443 | `C:\nginx\nginx.exe -s reload` |

---

## 15. Environment Variables

Backend reads from `server/.env`:

```env
DB_HOST=localhost
DB_PORT=3308
DB_USER=fit_user
DB_PASSWORD=fit_password
DB_NAME=fit_db
```

All values have hardcoded defaults matching the Docker Compose config, so the app works without an `.env` file in development.

---

## 16. Key Business Logic

### Stock Balance Calculation

```
balanceBoxes = totalAlreadySent + currentQuantity - boxesReturned
```

- `totalAlreadySent` = `Customer.totalSentCount` at the moment of the entry (snapshot)
- `currentQuantity` = boxes sent in THIS transaction (sum of variety counts)
- `boxesReturned` = boxes returned in THIS transaction

The result is stored as `BoxEntry.balanceBoxes` and displayed in the UI.

### Stock Position Entry

A `stock_position` entry (internal value: `opening_balance`) is not linked to a customer. It records:
- `companyOwnQuantity`: boxes owned directly by the business
- `openingStockSources`: JSON array of `{ sourceId, sourceName, quantity }` from external suppliers
- `currentQuantity` = `companyOwnQuantity + sum(openingStockSources[].quantity)` (grand total)

### Customer Sent Count

`Customer.totalSentCount` is a denormalised running total of all boxes ever dispatched to that customer. It is:
- Incremented by `currentQuantity` on each new Dispatch entry (`handleSaveDispatch`)
- **Not** decremented on Return (returns are tracked separately via `boxesReturned`)
- Resettable via Settings → Reset Sent Count

### Bill Number Auto-Increment

`EntryDB.nextBillNumber()` calls `GET /api/entries/next-bill-number`. The backend reads the latest entry's bill number, extracts the numeric suffix, increments it, and prepends the `billPrefix` from `AppSettings` (default: `"BILL"`).

### Stock Alert

`StockAlertDB.getStatus()` compares remaining stock against `AppSettings.stockAlertThreshold` (percentage). When stock falls below threshold, `StockAlertBanner` renders at the top of the app. Users can dismiss it until a configurable date.

---

## 17. Change Log / Recent CRs

### CR: Return Tab — Remove Fields + Rename Opening Balance

**Files changed:** `src/pages/Dispatch.tsx`, `src/i18n/translations.ts`

**Changes:**

1. **`Dispatch.tsx` — Hide "Current Qty" on Return tab**
   The `currentQuantity` Input is now rendered only when `!isReturn`. On the Return tab, only `boxesReturned` is shown. The Box Movement grid adjusts from 4 columns (`sm:grid-cols-4`) to 3 columns (`sm:grid-cols-3`) on Return.

2. **`Dispatch.tsx` — Hide "External Source" card on Return tab**
   The entire External Source card (checkbox + source selector + box count input) is wrapped in `{!isReturn && (...)}`. External sourcing is not applicable to returns.

3. **`Dispatch.tsx` + `translations.ts` — "Opening Balance" renamed to "Stock Position"**
   - Tab label: `{ value: 'opening_balance', label: 'Stock Position' }`
   - All translation keys updated in English, Tamil, and Hindi
   - Internal `entryType` database value (`'opening_balance'`) is **unchanged**

**Translation mappings after rename:**

| Key | English | Tamil | Hindi |
|---|---|---|---|
| `dispatch.openingBal` | Stock Position | சரக்கு நிலை | स्टॉक स्थिति |
| `dispatch.saveOB` | Save Stock Position | சரக்கு நிலை சேமி | स्टॉक स्थिति सेव करें |
| `dispatch.updateOB` | Update Stock Position | சரக்கு நிலை புதுப்பி | स्टॉक स्थिति अपडेट करें |
| `dispatch.obBannerTitle` | Stock Position Entry | சரக்கு நிலை பதிவு | स्टॉक स्थिति प्रविष्टि |
| `dispatch.entryInfoSub` | Bill number and date for this stock position | இந்த சரக்கு நிலைக்கான பில் எண் மற்றும் தேதி | इस स्टॉक स्थिति के लिए बिल नंबर और तिथि |
| `guide.entries.type.opening` | Stock Position | சரக்கு நிலை | स्टॉக स्थिति |
| `guide.entries.type.openingDesc` | Starting balance when… | …சரக்கு நிலை… | …स्टॉक स्थिति… |
