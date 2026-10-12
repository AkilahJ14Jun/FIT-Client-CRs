# Graph Report - FIT Client CRs  (2026-10-10)

## Corpus Check
- 144 files · ~195,145 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 705 nodes · 1114 edges · 79 communities (75 shown, 4 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Receipt Preview Modal
- Backend Dependencies (1)
- Backend Dependencies (2)
- Backend Dependencies (3)
- Build Tools and Tailwind Config
- Build Tools and Tailwind Config
- TypeScript Configuration
- Build Tools and Tailwind Config
- Build Tools and Tailwind Config
- Database Backup Layer
- Client Database Layer
- Form Input Components
- TypeScript Configuration
- Navigation and Layout
- Application Routing and Entry
- UI Card and Modal Components
- Tamil Transliteration Engine
- Customer Receipt PDF Export
- Customer Receipt PDF Export
- Server Express Backend
- Client Database Layer
- Box Entries PDF Generation
- Client Database Layer
- User Component
- Client Database Layer
- UserGuide Component
- Client Database Layer
- Localization and i18n
- Box Entries Management
- Customer Management UI
- Customer Management UI
- InventorySource Component
- Button Component
- Dispatch_bak Component
- MobileAccess Component
- AuditLog Component
- Authentication and Session
- WhatsApp Sharing Automation
- WhatsApp Sharing Automation
- WhatsApp Sharing Automation
- AppSettings Component
- translations_bak Component
- WhatsApp Sharing Integration
- Admin Data Management
- Build Tools and Tailwind Config

## God Nodes (most connected - your core abstractions)
1. `useTranslation()` - 33 edges
2. `downloadReceiptAsPDF()` - 20 edges
3. `Customer` - 19 edges
4. `compilerOptions` - 19 edges
5. `BoxEntry` - 18 edges
6. `SettingsDB` - 14 edges
7. `useAuth()` - 13 edges
8. `cn()` - 13 edges
9. `Button()` - 12 edges
10. `compilerOptions` - 11 edges

## Surprising Connections (you probably didn't know these)
- `ProtectedRoute()` --calls--> `useAuth()`  [EXTRACTED]
  src/App.tsx → src/auth/AuthContext.tsx
- `Sidebar()` --calls--> `useAuth()`  [EXTRACTED]
  src/components/layout/Sidebar.tsx → src/auth/AuthContext.tsx
- `TopBar()` --calls--> `useAuth()`  [EXTRACTED]
  src/components/layout/TopBar.tsx → src/auth/AuthContext.tsx
- `Sidebar()` --calls--> `useTranslation()`  [EXTRACTED]
  src/components/layout/Sidebar.tsx → src/i18n/TranslationProvider.tsx
- `Sidebar()` --calls--> `cn()`  [EXTRACTED]
  src/components/layout/Sidebar.tsx → src/utils/cn.ts

## Import Cycles
- None detected.

## Communities (79 total, 4 thin omitted)

### Community 0 - "Receipt Preview Modal"
Cohesion: 0.13
Nodes (36): ENTRY_TYPE_META, Props, ReceiptPreviewModal(), ENTRY_TYPE_META, Props, ReceiptPreviewModal(), Props, WhatsAppSendModal() (+28 more)

### Community 1 - "Backend Dependencies (1)"
Cohesion: 0.05
Nodes (39): dependencies, bcryptjs, cors, dotenv, express, mysql2, reflect-metadata, typeorm (+31 more)

### Community 2 - "Backend Dependencies (2)"
Cohesion: 0.05
Nodes (39): dependencies, bcryptjs, cors, dotenv, express, mysql2, reflect-metadata, typeorm (+31 more)

### Community 3 - "Backend Dependencies (3)"
Cohesion: 0.05
Nodes (39): dependencies, bcryptjs, cors, dotenv, express, mysql2, reflect-metadata, typeorm (+31 more)

### Community 4 - "Build Tools and Tailwind Config"
Cohesion: 0.07
Nodes (27): dependencies, clsx, date-fns, file-saver, jspdf, jspdf-autotable, lucide-react, pdfjs-dist (+19 more)

### Community 5 - "Build Tools and Tailwind Config"
Cohesion: 0.07
Nodes (27): dependencies, clsx, date-fns, file-saver, jspdf, jspdf-autotable, lucide-react, pdfjs-dist (+19 more)

### Community 6 - "TypeScript Configuration"
Cohesion: 0.07
Nodes (26): DOM, DOM.Iterable, ES2020, node, vite.config.ts, compilerOptions, allowImportingTsExtensions, baseUrl (+18 more)

### Community 7 - "Build Tools and Tailwind Config"
Cohesion: 0.08
Nodes (25): devDependencies, tailwindcss, @tailwindcss/vite, @types/node, @types/react, @types/react-dom, typescript, vite (+17 more)

### Community 8 - "Build Tools and Tailwind Config"
Cohesion: 0.08
Nodes (25): devDependencies, tailwindcss, @tailwindcss/vite, @types/node, @types/react, @types/react-dom, typescript, vite (+17 more)

### Community 9 - "Database Backup Layer"
Cohesion: 0.09
Nodes (22): apiFetch(), AppSettings, AreaDB, AuditDB, AuditLog, BackupDB, BackupPayload, BoxEntry (+14 more)

### Community 10 - "Client Database Layer"
Cohesion: 0.14
Nodes (17): AuditDB, AuditLog, BackupDB, BackupPayload, DB_VERSION, DEFAULT_SETTINGS, EntryType, InventorySource (+9 more)

### Community 11 - "Form Input Components"
Cohesion: 0.15
Nodes (13): Input(), InputProps, Select(), SelectOption, SelectProps, TextArea(), TextAreaProps, CustomerAreas() (+5 more)

### Community 12 - "TypeScript Configuration"
Cohesion: 0.14
Nodes (13): compilerOptions, emitDecoratorMetadata, esModuleInterop, experimentalDecorators, forceConsistentCasingInFileNames, module, outDir, rootDir (+5 more)

### Community 13 - "Navigation and Layout"
Cohesion: 0.20
Nodes (10): Layout(), titles, GROUP_KEYS, NAV_KEYS_BASE, Sidebar(), DEFAULT_SETTINGS, TopBar(), TopBarProps (+2 more)

### Community 14 - "Application Routing and Entry"
Cohesion: 0.26
Nodes (8): App(), ProtectedRoute(), useAuth(), GuardedAdminData(), Architecture(), Section, Login(), Settings()

### Community 15 - "UI Card and Modal Components"
Cohesion: 0.23
Nodes (10): Card(), CardProps, StatCard(), StatCardProps, ConfirmModal(), ConfirmModalProps, Modal(), ModalProps (+2 more)

### Community 16 - "Tamil Transliteration Engine"
Cohesion: 0.21
Nodes (12): applyValueNative(), CAN_START_TWO, CONSONANT_MAP, EmitResult, emitToken(), flushBuffer(), InputOrTextarea, KEYS2 (+4 more)

### Community 17 - "Customer Receipt PDF Export"
Cohesion: 0.28
Nodes (9): buildWhatsAppPayload(), downloadCustomerReceipt(), downloadReceiptAsPDF(), isMobileDevice(), receiptFilename(), shareMobile(), shareReceiptViaWhatsApp(), triggerWhatsAppAutomation() (+1 more)

### Community 18 - "Customer Receipt PDF Export"
Cohesion: 0.28
Nodes (9): buildWhatsAppPayload(), downloadCustomerReceipt(), downloadReceiptAsPDF(), isMobileDevice(), receiptFilename(), shareMobile(), shareReceiptViaWhatsApp(), triggerWhatsAppAutomation() (+1 more)

### Community 19 - "Server Express Backend"
Cohesion: 0.20
Nodes (7): app, formatLogTimestamp(), frontendDist, getOrRefreshWhatsAppSession(), uploadReceiptToCloudStorage(), WhatsAppSession, writeWaFitLog()

### Community 20 - "Client Database Layer"
Cohesion: 0.24
Nodes (10): DEFAULT_STOCK, Props, StockAlertBanner(), apiFetch(), DashboardStats, getDashboardStats(), useTranslation(), Dashboard() (+2 more)

### Community 21 - "Box Entries PDF Generation"
Cohesion: 0.31
Nodes (10): getEntryAreaName(), applyPageFooters(), ColDef, COLUMNS, drawDataRow(), drawFooterRow(), drawTableHeader(), formatDate() (+2 more)

### Community 22 - "Client Database Layer"
Cohesion: 0.22
Nodes (8): Badge(), BadgeProps, BadgeVariant, variantClass, CustomerDB, ENTRY_TYPE_BADGE, Reports(), ReportType

### Community 23 - "User Component"
Cohesion: 0.25
Nodes (7): AppDataSource, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn, User

### Community 24 - "Client Database Layer"
Cohesion: 0.25
Nodes (8): OpeningStockSource, Dispatch(), DispatchFormState, DispatchSourceRow, ENTRY_TYPES, newSourceRow(), OBFormState, OBSourceRow

### Community 25 - "UserGuide Component"
Cohesion: 0.22
Nodes (3): GuideSection, InfoType, UserGuide()

### Community 26 - "Client Database Layer"
Cohesion: 0.25
Nodes (7): AppSettings, SystemDB, ENTRY_TYPE_BADGE, ENTRY_TYPE_LABEL, TAB_ITEMS, TabDef, TabId

### Community 27 - "Localization and i18n"
Cohesion: 0.36
Nodes (5): TranslationContext, TranslationContextType, TranslationProvider(), Language, translations

### Community 28 - "Box Entries Management"
Cohesion: 0.29
Nodes (6): BoxEntry, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn

### Community 29 - "Customer Management UI"
Cohesion: 0.29
Nodes (6): Customer, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn

### Community 30 - "Customer Management UI"
Cohesion: 0.29
Nodes (6): CustomerArea, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn

### Community 31 - "InventorySource Component"
Cohesion: 0.29
Nodes (6): InventorySource, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn

### Community 32 - "Button Component"
Cohesion: 0.29
Nodes (6): Button(), ButtonProps, Size, sizeClasses, Variant, variantClasses

### Community 33 - "Dispatch_bak Component"
Cohesion: 0.33
Nodes (6): Dispatch(), DispatchFormState, ENTRY_TYPES, newSourceRow(), OBFormState, OBSourceRow

### Community 34 - "MobileAccess Component"
Cohesion: 0.29
Nodes (3): MethodCardProps, MobileAccess(), StepProps

### Community 37 - "AuditLog Component"
Cohesion: 0.33
Nodes (5): AuditLog, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn

### Community 38 - "Authentication and Session"
Cohesion: 0.40
Nodes (5): AuthContext, AuthContextType, AuthProvider(), AuthUser, initialUser()

### Community 40 - "WhatsApp Sharing Automation"
Cohesion: 0.60
Nodes (3): Activate-WhatsApp(), Log-Msg(), Wait-For-File()

### Community 42 - "WhatsApp Sharing Automation"
Cohesion: 0.60
Nodes (3): Activate-WhatsApp(), Log-Msg(), Wait-For-File()

### Community 43 - "WhatsApp Sharing Automation"
Cohesion: 0.60
Nodes (3): Activate-WhatsApp(), Log-Msg(), Wait-For-File()

### Community 44 - "AppSettings Component"
Cohesion: 0.40
Nodes (4): AppSettings, Column, Entity, PrimaryGeneratedColumn

## Knowledge Gaps
- **264 isolated node(s):** `WhatsAppPayload`, `name`, `version`, `description`, `main` (+259 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useTranslation()` connect `Client Database Layer` to `Receipt Preview Modal`, `Dispatch_bak Component`, `Client Database Layer`, `Form Input Components`, `Navigation and Layout`, `Application Routing and Entry`, `Tamil Transliteration Engine`, `Client Database Layer`, `Client Database Layer`, `UserGuide Component`, `Localization and i18n`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **Why does `BoxEntry` connect `Receipt Preview Modal` to `Dispatch_bak Component`, `Client Database Layer`, `Customer Receipt PDF Export`, `Customer Receipt PDF Export`, `Box Entries PDF Generation`, `Client Database Layer`, `Client Database Layer`?**
  _High betweenness centrality (0.009) - this node is a cross-community bridge._
- **Why does `Customer` connect `Receipt Preview Modal` to `Dispatch_bak Component`, `Client Database Layer`, `Form Input Components`, `Customer Receipt PDF Export`, `Customer Receipt PDF Export`, `Client Database Layer`, `Client Database Layer`?**
  _High betweenness centrality (0.009) - this node is a cross-community bridge._
- **What connects `WhatsAppPayload`, `name`, `version` to the rest of the system?**
  _264 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Receipt Preview Modal` be split into smaller, more focused modules?**
  _Cohesion score 0.13297872340425532 - nodes in this community are weakly interconnected._
- **Should `Backend Dependencies (1)` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._
- **Should `Backend Dependencies (2)` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._