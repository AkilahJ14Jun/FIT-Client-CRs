# Graph Report - FIT Client CRs  (2026-10-22)

## Corpus Check
- 149 files · ~210,986 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 876 nodes · 1411 edges · 126 communities (90 shown, 36 thin omitted)
- Extraction: 87% EXTRACTED · 13% INFERRED · 0% AMBIGUOUS · INFERRED: 179 edges (avg confidence: 0.87)
- Token cost: 37,500 input · 6,600 output

## Community Hubs (Navigation)
- Form UI Components
- TypeORM Database Models
- TypeORM Database Models
- TypeORM Database Models
- Customer Receipt Preview
- NSSM Deployment & Service
- Button UI Elements
- TypeScript Configuration
- Stock Alert Banner
- Customer Receipt Preview
- Stock Alert Banner
- Tailwind CSS Configuration
- Tailwind CSS Configuration
- Tailwind CSS Configuration
- Tailwind CSS Configuration
- Tailwind CSS Configuration
- Tailwind CSS Configuration
- TypeScript Configuration
- Navigation & App Shell
- Authentication & Protected Routes
- Tamil Input Transliteration
- WhatsApp Receipt Sharing
- WhatsApp Receipt Sharing
- Dispatch Workflow & Logic
- Express Server & Middleware
- Box Entries PDF Exporter
- Package Json Name (26)
- Package Json Name (27)
- Package Json Name (28)
- TypeORM Database Models
- Userguide Contentcard Faqitem (30)
- Boxentry Boxentry Column (31)
- Customer Customer Column (32)
- Customerarea Customerarea Column (33)
- Inventorysource Inventorysource Column (34)
- Translationprovider Translationcontext Translationcontexttype (35)
- Mobileaccess Code Methodcard (36)
- Auditlog Auditlog Column (38)
- Authcontext Authcontext Authcontexttype (39)
- Apifetch Dashboardstats Getdashboardstats (40)
- Shareonwhatsapp Ps1 Activate (42)
- Shareonwhatsapp Ps1 Activate (44)
- Shareonwhatsapp Ps1 Activate (46)
- Appsettings Appsettings Column (47)
- Docker Compose Yml (48)
- Docker Compose Yml (49)
- Docker Compose Yml (51)
- Translations Bak Language (54)
- NSSM Deployment & Service
- Pdf Generatebillpdf Renderreceiptcontent (56)
- Tamil Input Transliteration
- WhatsApp Receipt Sharing
- Fit Architecture Html (59)
- Fit Architecture Visual (60)
- Express Server & Middleware
- Express Server & Middleware
- Postman Html Postman (63)
- Express Server & Middleware
- Admindata Isactive Togglefield (65)
- Vite Build Tooling
- Fit Architecture Visual (67)
- Fit Architecture Visual (68)
- Fit Architecture Visual (69)
- Fit Architecture Visual (70)
- Date Fns Date (71)
- File Saver File (72)
- Jspdf Jspdf (73)
- React React (74)
- React Dom React (75)
- Uuid Uuid (76)
- File Saver File (79)
- Jspdf Jspdf (80)
- Jspdf Autotable Jspdf (81)
- React React (82)
- React Dom React (83)
- Uuid Uuid (84)
- New Text Document (87)
- Date Fns Date (88)
- File Saver File (89)
- Jspdf Jspdf (90)
- Jspdf Autotable Jspdf (91)
- React React (92)
- React Dom React (93)

## God Nodes (most connected - your core abstractions)
1. `useTranslation()` - 33 edges
2. `WhatsAppSendModal()` - 27 edges
3. `ReceiptPreviewModal()` - 26 edges
4. `Write-Step()` - 25 edges
5. `Write-Step()` - 25 edges
6. `shareReceiptViaWhatsApp()` - 24 edges
7. `triggerWhatsAppAutomation()` - 22 edges
8. `downloadReceiptAsPDF()` - 20 edges
9. `Customer` - 19 edges
10. `downloadCustomerReceipt()` - 19 edges

## Surprising Connections (you probably didn't know these)
- `Vite Frontend Production Build & Static Hosting` --references--> `Write-Step()`  [INFERRED]
  DEPLOYMENT.md → FIT_Deploy_Backup/deploy-production.ps1
- `Production Deployment Runbook` --references--> `Write-Step()`  [INFERRED]
  DEPLOYMENT.md → FIT_Deploy_Backup/deploy-production.ps1
- `Process Supervision and Auto-Restart Policy` --references--> `Write-Step()`  [INFERRED]
  DEPLOYMENT - NSSM.md → FIT_Deploy_Backup/deploy-production.ps1
- `NSSM Background Service Manager` --references--> `Write-Step()`  [INFERRED]
  DEPLOYMENT - NSSM.md → FIT_Deploy_Backup/deploy-production.ps1
- `Service Logging and Environment Configuration` --references--> `Write-Step()`  [INFERRED]
  DEPLOYMENT - NSSM.md → FIT_Deploy_Backup/deploy-production.ps1

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **SKILL.md Concept Cluster** — agents_skills_customer_receipt_sharing_skill, agents_skills_customer_receipt_sharing_skill_receipt_pdf_generation, agents_skills_customer_receipt_sharing_skill_fitshare_protocol, agents_skills_customer_receipt_sharing_skill_whatsapp_automation_service [INFERRED 0.85]
- **SKILL.md Concept Cluster** — agents_skills_multi_language_transliteration_skill, agents_skills_multi_language_transliteration_skill_tamil_phonetic_transliteration, agents_skills_multi_language_transliteration_skill_input_field_interception [INFERRED 0.85]
- **SKILL.md Concept Cluster** — agents_skills_whatsapp_cloud_api_sharing_skill, agents_skills_whatsapp_cloud_api_sharing_skill_meta_whatsapp_cloud_api, agents_skills_whatsapp_cloud_api_sharing_skill_media_upload_pipeline, agents_skills_whatsapp_cloud_api_sharing_skill_cloud_api_rate_limiting [INFERRED 0.85]
- **SKILL.md Concept Cluster** — agents_skills_whatsapp_zero_api_sharing_skill, agents_skills_whatsapp_zero_api_sharing_skill_zero_api_whatsapp_automation, agents_skills_whatsapp_zero_api_sharing_skill_protocol_registration_script, agents_skills_whatsapp_zero_api_sharing_skill_win32_key_simulation [INFERRED 0.85]
- **DEPLOYMENT - NSSM.md Concept Cluster** — deployment_nssm, deployment_nssm_nssm_windows_service, deployment_nssm_auto_restart_daemon, deployment_nssm_production_service_environment [INFERRED 0.85]
- **DEPLOYMENT.md Concept Cluster** — deployment, deployment_deployment_workflow, deployment_server_environment_setup, deployment_client_build_hosting [INFERRED 0.85]
- **DEPLOYMENT - NSSM.md Concept Cluster** — fit_deploy_backup_deployment_nssm, fit_deploy_backup_deployment_nssm_nssm_windows_service, fit_deploy_backup_deployment_nssm_auto_restart_daemon, fit_deploy_backup_deployment_nssm_production_service_environment [INFERRED 0.85]
- **DEPLOYMENT.md Concept Cluster** — fit_deploy_backup_deployment, fit_deploy_backup_deployment_deployment_workflow, fit_deploy_backup_deployment_server_environment_setup, fit_deploy_backup_deployment_client_build_hosting [INFERRED 0.85]
- **README.md Concept Cluster** — fit_deploy_backup_readme, fit_deploy_backup_readme_fit_system_overview, fit_deploy_backup_readme_architecture_stack [INFERRED 0.85]
- **docker-compose.yml Concept Cluster** — fit_deploy_backup_docker_compose, fit_deploy_backup_docker_compose_docker_multi_container_orchestration, fit_deploy_backup_docker_compose_database_container, fit_deploy_backup_docker_compose_application_networking [INFERRED 0.85]
- **DEPLOYMENT - NSSM.md Concept Cluster** — fit_deploy_set_deployment_nssm, fit_deploy_set_deployment_nssm_nssm_windows_service, fit_deploy_set_deployment_nssm_auto_restart_daemon, fit_deploy_set_deployment_nssm_production_service_environment [INFERRED 0.85]
- **DEPLOYMENT.md Concept Cluster** — fit_deploy_set_deployment, fit_deploy_set_deployment_deployment_workflow, fit_deploy_set_deployment_server_environment_setup, fit_deploy_set_deployment_client_build_hosting [INFERRED 0.85]
- **README.md Concept Cluster** — fit_deploy_set_readme, fit_deploy_set_readme_fit_system_overview, fit_deploy_set_readme_architecture_stack [INFERRED 0.85]
- **docker-compose.yml Concept Cluster** — fit_deploy_set_docker_compose, fit_deploy_set_docker_compose_docker_multi_container_orchestration, fit_deploy_set_docker_compose_database_container, fit_deploy_set_docker_compose_application_networking [INFERRED 0.85]
- **README.md Concept Cluster** — readme, readme_fit_system_overview, readme_architecture_stack [INFERRED 0.85]
- **docker-compose.yml Concept Cluster** — docker_compose, docker_compose_docker_multi_container_orchestration, docker_compose_database_container, docker_compose_application_networking [INFERRED 0.85]
- **2026-05-19-dispatch-returns-fix.md Concept Cluster** — docs_superpowers_plans_2026_05_19_dispatch_returns_fix, docs_superpowers_plans_2026_05_19_dispatch_returns_fix_dispatch_returns_calculation, docs_superpowers_plans_2026_05_19_dispatch_returns_fix_inventory_reconciliation [INFERRED 0.85]
- **2026-05-19-dispatch-variety-input-fix.md Concept Cluster** — docs_superpowers_plans_2026_05_19_dispatch_variety_input_fix, docs_superpowers_plans_2026_05_19_dispatch_variety_input_fix_dispatch_variety_selection, docs_superpowers_plans_2026_05_19_dispatch_variety_input_fix_stock_variety_validation [INFERRED 0.85]
- **2026-05-19-dispatch-returns-fix-design.md Concept Cluster** — docs_superpowers_specs_2026_05_19_dispatch_returns_fix_design, docs_superpowers_specs_2026_05_19_dispatch_returns_fix_design_dispatch_returns_calculation, docs_superpowers_specs_2026_05_19_dispatch_returns_fix_design_inventory_reconciliation [INFERRED 0.85]
- **fit-architecture.html Concept Cluster** — fit_architecture, fit_architecture_system_architecture_overview, fit_architecture_component_interaction_model [INFERRED 0.85]
- **fit-architecture.visual-check.html Concept Cluster** — fit_architecture_visual_check, fit_architecture_visual_check_system_architecture_overview, fit_architecture_visual_check_component_interaction_model [INFERRED 0.85]
- **postman.html Concept Cluster** — postman, postman_api_test_collection, postman_endpoint_contracts [INFERRED 0.85]
- **postman.txt Concept Cluster** — postman, postman_api_test_collection, postman_endpoint_contracts [INFERRED 0.85]

## Communities (126 total, 36 thin omitted)

### Community 0 - "Form UI Components"
Cohesion: 0.08
Nodes (35): Badge(), BadgeProps, BadgeVariant, variantClass, Input(), InputProps, SelectOption, SelectProps (+27 more)

### Community 1 - "TypeORM Database Models"
Cohesion: 0.05
Nodes (39): dependencies, bcryptjs, cors, dotenv, express, mysql2, reflect-metadata, typeorm (+31 more)

### Community 2 - "TypeORM Database Models"
Cohesion: 0.05
Nodes (39): dependencies, bcryptjs, cors, dotenv, express, mysql2, reflect-metadata, typeorm (+31 more)

### Community 3 - "TypeORM Database Models"
Cohesion: 0.05
Nodes (39): dependencies, bcryptjs, cors, dotenv, express, mysql2, reflect-metadata, typeorm (+31 more)

### Community 4 - "Customer Receipt Preview"
Cohesion: 0.15
Nodes (26): Customer Receipt Visual Invoice Template, ENTRY_TYPE_META, Props, ReceiptPreviewModal(), ENTRY_TYPE_META, Props, Props, AppSettings (+18 more)

### Community 5 - "NSSM Deployment & Service"
Cohesion: 0.12
Nodes (20): Vite Frontend Production Build & Static Hosting, Production Deployment Runbook, Process Supervision and Auto-Restart Policy, NSSM Background Service Manager, Service Logging and Environment Configuration, Backend Node.js & Database Configuration, Write-Step(), Vite Frontend Production Build & Static Hosting (+12 more)

### Community 6 - "Button UI Elements"
Cohesion: 0.11
Nodes (23): Button(), ButtonProps, Size, sizeClasses, Variant, variantClasses, Card(), CardProps (+15 more)

### Community 7 - "TypeScript Configuration"
Cohesion: 0.07
Nodes (26): DOM, DOM.Iterable, ES2020, node, vite.config.ts, compilerOptions, allowImportingTsExtensions, baseUrl (+18 more)

### Community 8 - "Stock Alert Banner"
Cohesion: 0.12
Nodes (22): DEFAULT_STOCK, Props, StockAlertBanner(), AuditDB, AuditLog, BackupPayload, CustomerDB, DB_VERSION (+14 more)

### Community 9 - "Customer Receipt Preview"
Cohesion: 0.42
Nodes (15): Desktop Zero-API vs Cloud API Sharing Strategy, Custom 'fitshare://' URI Handler, PDF Receipt Generation Mechanism, WhatsApp Desktop Automation Pipeline, Usage Quotas and Webhook Verification, Direct Media Upload and Session Tracking, Meta WhatsApp Business Graph API, Custom Protocol Handler Registry Configuration (+7 more)

### Community 10 - "Stock Alert Banner"
Cohesion: 0.09
Nodes (22): apiFetch(), AppSettings, AreaDB, AuditDB, AuditLog, BackupDB, BackupPayload, BoxEntry (+14 more)

### Community 11 - "Tailwind CSS Configuration"
Cohesion: 0.12
Nodes (17): devDependencies, tailwindcss, @tailwindcss/vite, @types/node, @types/react, @types/react-dom, typescript, vite (+9 more)

### Community 12 - "Tailwind CSS Configuration"
Cohesion: 0.12
Nodes (17): devDependencies, tailwindcss, @tailwindcss/vite, @types/node, @types/react, @types/react-dom, typescript, vite (+9 more)

### Community 13 - "Tailwind CSS Configuration"
Cohesion: 0.12
Nodes (17): devDependencies, tailwindcss, @tailwindcss/vite, @types/node, @types/react, @types/react-dom, typescript, vite (+9 more)

### Community 14 - "Tailwind CSS Configuration"
Cohesion: 0.13
Nodes (15): dependencies, clsx, jspdf-autotable, lucide-react, pdfjs-dist, react-router-dom, tailwind-merge, @types/file-saver (+7 more)

### Community 15 - "Tailwind CSS Configuration"
Cohesion: 0.13
Nodes (15): dependencies, clsx, date-fns, lucide-react, pdfjs-dist, react-router-dom, tailwind-merge, @types/file-saver (+7 more)

### Community 16 - "Tailwind CSS Configuration"
Cohesion: 0.13
Nodes (15): dependencies, clsx, lucide-react, pdfjs-dist, react-router-dom, tailwind-merge, @types/file-saver, uuid (+7 more)

### Community 17 - "TypeScript Configuration"
Cohesion: 0.14
Nodes (13): compilerOptions, emitDecoratorMetadata, esModuleInterop, experimentalDecorators, forceConsistentCasingInFileNames, module, outDir, rootDir (+5 more)

### Community 18 - "Navigation & App Shell"
Cohesion: 0.20
Nodes (10): Layout(), titles, GROUP_KEYS, NAV_KEYS_BASE, Sidebar(), DEFAULT_SETTINGS, TopBar(), TopBarProps (+2 more)

### Community 19 - "Authentication & Protected Routes"
Cohesion: 0.26
Nodes (9): App(), ProtectedRoute(), FIT Application Branding & Login Asset, useAuth(), TranslationProvider(), GuardedAdminData(), Dashboard(), Login() (+1 more)

### Community 20 - "Tamil Input Transliteration"
Cohesion: 0.21
Nodes (12): applyValueNative(), CAN_START_TWO, CONSONANT_MAP, EmitResult, emitToken(), flushBuffer(), InputOrTextarea, KEYS2 (+4 more)

### Community 21 - "WhatsApp Receipt Sharing"
Cohesion: 0.28
Nodes (9): buildWhatsAppPayload(), downloadCustomerReceipt(), downloadReceiptAsPDF(), isMobileDevice(), receiptFilename(), shareMobile(), shareReceiptViaWhatsApp(), triggerWhatsAppAutomation() (+1 more)

### Community 22 - "WhatsApp Receipt Sharing"
Cohesion: 0.28
Nodes (9): buildWhatsAppPayload(), downloadCustomerReceipt(), downloadReceiptAsPDF(), isMobileDevice(), receiptFilename(), shareMobile(), shareReceiptViaWhatsApp(), triggerWhatsAppAutomation() (+1 more)

### Community 23 - "Dispatch Workflow & Logic"
Cohesion: 0.52
Nodes (9): Dispatch Returns Processing Logic, Inventory & Accounting Balance Reconciliation, Variety Input Field & Dropdown Resolution, Variety Stock Availability Validation, Dispatch Returns Processing Logic, Inventory & Accounting Balance Reconciliation, Dispatch(), DispatchFormState (+1 more)

### Community 24 - "Express Server & Middleware"
Cohesion: 0.20
Nodes (7): app, formatLogTimestamp(), frontendDist, getOrRefreshWhatsAppSession(), uploadReceiptToCloudStorage(), WhatsAppSession, writeWaFitLog()

### Community 25 - "Box Entries PDF Exporter"
Cohesion: 0.31
Nodes (10): getEntryAreaName(), applyPageFooters(), ColDef, COLUMNS, drawDataRow(), drawFooterRow(), drawTableHeader(), formatDate() (+2 more)

### Community 26 - "Package Json Name (26)"
Cohesion: 0.22
Nodes (8): name, private, scripts, build, dev, preview, type, version

### Community 27 - "Package Json Name (27)"
Cohesion: 0.22
Nodes (8): name, private, scripts, build, dev, preview, type, version

### Community 28 - "Package Json Name (28)"
Cohesion: 0.22
Nodes (8): name, private, scripts, build, dev, preview, type, version

### Community 29 - "TypeORM Database Models"
Cohesion: 0.25
Nodes (7): AppDataSource, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn, User

### Community 30 - "Userguide Contentcard Faqitem (30)"
Cohesion: 0.22
Nodes (3): GuideSection, InfoType, UserGuide()

### Community 31 - "Boxentry Boxentry Column (31)"
Cohesion: 0.29
Nodes (6): BoxEntry, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn

### Community 32 - "Customer Customer Column (32)"
Cohesion: 0.29
Nodes (6): Customer, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn

### Community 33 - "Customerarea Customerarea Column (33)"
Cohesion: 0.29
Nodes (6): CustomerArea, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn

### Community 34 - "Inventorysource Inventorysource Column (34)"
Cohesion: 0.29
Nodes (6): InventorySource, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn

### Community 35 - "Translationprovider Translationcontext Translationcontexttype (35)"
Cohesion: 0.43
Nodes (4): TranslationContext, TranslationContextType, Language, translations

### Community 36 - "Mobileaccess Code Methodcard (36)"
Cohesion: 0.29
Nodes (3): MethodCardProps, MobileAccess(), StepProps

### Community 38 - "Auditlog Auditlog Column (38)"
Cohesion: 0.33
Nodes (5): AuditLog, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn

### Community 39 - "Authcontext Authcontext Authcontexttype (39)"
Cohesion: 0.40
Nodes (5): AuthContext, AuthContextType, AuthProvider(), AuthUser, initialUser()

### Community 40 - "Apifetch Dashboardstats Getdashboardstats (40)"
Cohesion: 0.33
Nodes (5): apiFetch(), DashboardStats, getDashboardStats(), EMPTY_STATS, ENTRY_TYPE_BADGE

### Community 42 - "Shareonwhatsapp Ps1 Activate (42)"
Cohesion: 0.60
Nodes (3): Activate-WhatsApp(), Log-Msg(), Wait-For-File()

### Community 44 - "Shareonwhatsapp Ps1 Activate (44)"
Cohesion: 0.60
Nodes (3): Activate-WhatsApp(), Log-Msg(), Wait-For-File()

### Community 46 - "Shareonwhatsapp Ps1 Activate (46)"
Cohesion: 0.60
Nodes (3): Activate-WhatsApp(), Log-Msg(), Wait-For-File()

### Community 47 - "Appsettings Appsettings Column (47)"
Cohesion: 0.40
Nodes (4): AppSettings, Column, Entity, PrimaryGeneratedColumn

### Community 48 - "Docker Compose Yml (48)"
Cohesion: 0.50
Nodes (3): Docker Bridge Network & Port Mapping, Containerized Database Service, Docker Compose Stack

### Community 49 - "Docker Compose Yml (49)"
Cohesion: 0.50
Nodes (3): Docker Bridge Network & Port Mapping, Containerized Database Service, Docker Compose Stack

### Community 51 - "Docker Compose Yml (51)"
Cohesion: 0.50
Nodes (3): Docker Bridge Network & Port Mapping, Containerized Database Service, Docker Compose Stack

## Knowledge Gaps
- **320 isolated node(s):** `WhatsAppPayload`, `name`, `private`, `version`, `type` (+315 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **36 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useTranslation()` connect `Stock Alert Banner` to `Form UI Components`, `Translationprovider Translationcontext Translationcontexttype (35)`, `Customer Receipt Preview`, `Button UI Elements`, `Apifetch Dashboardstats Getdashboardstats (40)`, `Customer Receipt Preview`, `Navigation & App Shell`, `Authentication & Protected Routes`, `Tamil Input Transliteration`, `Dispatch Workflow & Logic`, `Userguide Contentcard Faqitem (30)`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **Why does `WhatsAppSendModal()` connect `Customer Receipt Preview` to `Stock Alert Banner`, `Customer Receipt Preview`?**
  _High betweenness centrality (0.008) - this node is a cross-community bridge._
- **Why does `Dispatch()` connect `Dispatch Workflow & Logic` to `Stock Alert Banner`, `Authentication & Protected Routes`, `Button UI Elements`?**
  _High betweenness centrality (0.008) - this node is a cross-community bridge._
- **Are the 17 inferred relationships involving `WhatsAppSendModal()` (e.g. with `customer-receipt-sharing/SKILL.md` and `Desktop Zero-API vs Cloud API Sharing Strategy`) actually correct?**
  _`WhatsAppSendModal()` has 17 INFERRED edges - model-reasoned connections that need verification._
- **Are the 17 inferred relationships involving `ReceiptPreviewModal()` (e.g. with `customer-receipt-sharing/SKILL.md` and `Desktop Zero-API vs Cloud API Sharing Strategy`) actually correct?**
  _`ReceiptPreviewModal()` has 17 INFERRED edges - model-reasoned connections that need verification._
- **Are the 24 inferred relationships involving `Write-Step()` (e.g. with `DEPLOYMENT.md` and `Vite Frontend Production Build & Static Hosting`) actually correct?**
  _`Write-Step()` has 24 INFERRED edges - model-reasoned connections that need verification._
- **Are the 24 inferred relationships involving `Write-Step()` (e.g. with `DEPLOYMENT.md` and `Vite Frontend Production Build & Static Hosting`) actually correct?**
  _`Write-Step()` has 24 INFERRED edges - model-reasoned connections that need verification._