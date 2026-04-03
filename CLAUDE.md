# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**FIT (Fish Inventory Tracking)** — A full-stack app for tracking fish box inventory across customers and sources. Tracks opening balances, dispatches, returns, and generating reports/receipts.

## Architecture

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS v4
- **Backend**: Express.js + TypeScript + TypeORM + MySQL 8.0
- **Database**: MySQL via Docker Compose (port 3308 → 3306)
- **Routing**: React Router v7 (HashRouter)
- **PDF**: jsPDF + jspdf-autotable for receipt generation
- **Path alias**: `@` resolves to `src/`

### Frontend Structure (`src/`)

- `App.tsx` — Routes: `/`, `/customers`, `/sources`, `/entries`, `/dispatch`, `/reports`, `/settings`, `/architecture`, `/guide`, `/mobile`
- `db/database.ts` — Client-side data layer: Types (Customer, InventorySource, BoxEntry, AppSettings, AuditLog) + API fetch helpers (CustomerDB, SourceDB, EntryDB, SettingsDB, StockAlertDB, AuditDB, BackupDB) + `getDashboardStats()`
- `components/layout/` — Layout, Sidebar, TopBar
- `components/ui/` — Reusable UI (Button, Input, Card, Modal, Badge, ReceiptPreviewModal, WhatsAppSendModal, StockAlertBanner, FishLogo)
- `pages/` — Dashboard, Customers, Sources, Entries, Dispatch, Reports, Settings, Architecture, UserGuide, MobileAccess
- `utils/` — `cn.ts` (tailwind-merge), `pdf.ts` (PDF generation), `customerReceipt.ts`

### Backend Structure (`server/`)

- `server/src/index.ts` — Express server on port 3001, REST API for all entities + audit logging
- `server/src/data-source.ts` — TypeORM DataSource configuration
- `server/src/entity/` — TypeORM entities: Customer, InventorySource, BoxEntry, AppSettings, AuditLog
- API routes: `/api/settings`, `/api/customers`, `/api/sources`, `/api/entries`, `/api/audit`

## Development Commands

### Frontend (root directory)

```bash
npm install        # Install frontend dependencies
npm run dev        # Start Vite dev server (proxies /api to localhost:3001)
npm run build      # Production build
npm run preview    # Preview production build
```

### Backend (`server/` directory)

```bash
cd server
npm install        # Install backend dependencies
npm run dev        # Start backend with nodemon (hot reload)
npm run start      # Start backend (production)
npm run build      # TypeScript compilation
```

### Database (Docker)

```bash
docker-compose up -d       # Start MySQL container (port 3308)
docker-compose down        # Stop MySQL container
# MySQL credentials: root/root, database: fit_db, user: fit_user/fit_password
```

### Scripts (`scripts/`)

PowerShell scripts for sharing/automation: `FITShareFinal.ps1`, `FITShareProcess.ps1`, `RegisterProtocol.ps1`, `ShareOnWhatsApp.ps1`

## WhatsApp Zero-API Sharing

A skill at `.agents/skills/whatsapp-zero-api-sharing/` enables sending receipts via WhatsApp using OS-level protocol handlers (no WhatsApp API costs). See its SKILL.md for details.

## Key Technical Notes

- Frontend communicates with backend via `/api` proxy (Vite → `localhost:3001`)
- All data types are defined in `src/db/database.ts` (shared contract between frontend and backend entities)
- `BoxEntry` is the core inventory record with `entryType`: `'opening_balance' | 'dispatch' | 'return'`
- Stock alert system calculates remaining stock percentage vs opening balance
- Uses `date-fns` for date formatting, `lucide-react` for icons
- PDF receipts generated via `src/utils/pdf.ts` and `src/utils/customerReceipt.ts`
