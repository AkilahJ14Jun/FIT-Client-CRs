+-----------------------------+
|    FRONTEND (React)         |
| - React 19 + TypeScript     |
| - Vite build tool           |
| - Tailwind CSS v4           |
| - React Router v7           |
| - Components:               |
|   - Layout (Sidebar/TopBar) |
|   - UI Elements (Buttons, Modals) |
|   - Pages (Customers, Sources, etc.) |
| - Data Flow:                 |
|   - Calls /api endpoint      |
|   - Real-time updates        |
+-----------------------------+

+-----------------------------+
|    BACKEND (Express.js)     |
| - REST API endpoints        |
| - TypeORM ORM               |
| - MySQL database            |
| - Audit logging             |
| - Bill number generator     |
| - Authentication (Basic)    |
| - PowerShell integrations    |
+-----------------------------+

+-----------------------------+
|    DATABASE (MySQL)         |
| - Docker container          |
| - Tables:                    |
|   - customer                 |
|   - box_entry                |
|   - inventory_source         |
|   - audit_log                |
|   - app_settings             |
|   - user                     |
| - Connection details:        |
|   - Host: localhost:3308     |
|   - DB: fit_db               |
|   - Users: fit_user/fit_password|
+-----------------------------+

+-----------------------------+
|    EXTERNAL SERVICES        |
| - WhatsApp sharing (Windows) |
| - OS-level protocol handler  |
| - PowerShell scripts         |
| - Zero-API cost sharing      |
+-----------------------------+

+-----------------------------+
|   DEPLOYMENT ARCHITECTURE   |
| - Single-Machine Deployment |
| - Node/Express (Port 3001)  |
|   serves UI + REST API      |
| - Optional: Nginx Proxy     |
|   (Port 80/443) -> 3001     |
| - WhatsApp: fitshare://     |
|   -> Local PowerShell       |
+-----------------------------+

```mermaid
graph TD
    Client[Browser / Client] -->|HTTP :3001| Server[Express Backend]
    Server -->|Static Files| Frontend[React UI]
    Server -->|TypeORM| Database[(MySQL Docker)]
    Frontend -->|fitshare://| Protocol[OS Protocol Handler]
    Protocol -->|PS Script| WhatsApp[WhatsApp Web]
```