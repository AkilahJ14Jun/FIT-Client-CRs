# FIT (Fish Inventory Tracking) — Windows Production Deployment Guide

> **Last updated:** 13 April 2026 · **Stack:** React + Vite · Express.js + TypeORM · MySQL 8.0 (Docker) · Windows

---

## Quick Deploy (Automated)

For a one-command deployment, use the automated script. It handles Steps 2–9 below automatically. 

> [!TIP]
> **If you are using the `FIT_Release_Set` folder**, the script is already included in the root. Simply copy the folder content to `E:\FIT` and run the command below.

Open PowerShell **as Administrator** from the project root:

```powershell
.\deploy-production.ps1 -InstallRoot "E:\FIT"
```

**Optional flags:**

| Flag | Purpose |
|------|---------|
| `-InstallRoot "E:\FIT"` | Install to a custom directory (default: `E:\FIT`) |
| `-NginxRoot "E:\nginx"` | Custom Nginx location (default: `E:\nginx`) |
| `-UseNSSM` | Use NSSM (Windows Services) instead of PM2 — for headless servers only |
| `-SkipWhatsApp` | Skip WhatsApp `fitshare://` protocol registration |
| `-SkipFirewall` | Skip Windows Firewall rule creation |
| `-Force` | Overwrite existing files at `-InstallRoot` |

> After the script finishes, jump to [Step 10: Verify the Deployment](#step-10-verify-the-deployment) to confirm everything is working.

---

## Prerequisites

- **Node.js** 20+ (LTS) — <https://nodejs.org/> — select "Add to PATH" during install
- **Git** — <https://git-scm.com/download/win>
- **Docker Desktop for Windows** — <https://www.docker.com/products/docker-desktop/>
- **PM2** (process manager) — installed via npm, no download needed (see Step 3)
- **Nginx** *(optional)* — <https://nginx.org/en/download.html> — only needed if you want port 80/443 or advanced reverse proxy features
- **NSSM** *(optional, for headless servers)* — <https://nssm.cc/download> — only needed if running as a Windows Service without a logged-in user

All commands below use **PowerShell** (run as Administrator where noted).

---

## Step 1: Install Prerequisites

### 1.1 Install Node.js

1. Download the LTS installer from <https://nodejs.org/>
2. Run the installer, accepting all defaults
3. Open a new PowerShell window and verify:

```powershell
node --version    # Should show v20.x.x
npm --version
```

### 1.2 Install Git for Windows

1. Download the installer from <https://git-scm.com/download/win>
2. Run the installer, accepting all defaults
3. Verify:

```powershell
git --version
```

### 1.3 Install Docker Desktop for Windows

1. Download Docker Desktop from <https://www.docker.com/products/docker-desktop/>
2. Run the installer
3. Launch Docker Desktop and sign in (or skip)
4. Wait for the status bar to show "Docker Desktop is running"
5. Verify:

```powershell
docker --version
docker compose version
```

> **Note:** If you get a WSL2 / Hyper-V prompt, enable WSL2 (recommended). You may need to reboot.

### 1.4 Download Nginx for Windows

1. Download the stable Windows zip from <https://nginx.org/en/download.html>
2. Extract the zip to `E:\nginx` (or your preferred location)
3. You will configure this later in Step 4

> **Skip this step** if you're doing a simple single-machine deployment. The Express backend can serve the frontend directly on port 3001 — no Nginx needed.

### 1.5 Install PM2 (Process Manager)

PM2 is the recommended way to run the backend in production on single-machine deployments (e.g., a shop PC). Install it globally:

```powershell
npm install -g pm2 pm2-windows-startup
```

Verify:

```powershell
pm2 --version
```

### 1.6 Download NSSM (Optional — headless servers only)

> **When to use NSSM instead of PM2:** If the production machine runs without anyone logged in (e.g., a dedicated server in a rack, remote desktop only), you need NSSM to register the backend as a true Windows Service. For a single-machine setup where a user is always logged in, PM2 is simpler and sufficient.

1. Download NSSM from <https://nssm.cc/download>
2. Extract the zip
3. Copy the executable matching your architecture (e.g., `win64\nssm.exe`) to a path location, such as `C:\Windows\System32\`, or note the full path for later use

---

## Step 2: Deploy the Application

### 2.1 Prepare the Application Files

**Option A: Using the Release Bundle (Recommended)**
1. Copy the `FIT_Release_Final` folder to the production PC.
2. Place the contents in `E:\FIT`.
3. Open PowerShell as Administrator in `E:\FIT`.

**Option B: Cloning from Source**
```powershell
mkdir E:\FIT -Force
cd E:\FIT
git clone <your-repo-url> .
```

If you're deploying from a local copy instead of a remote repo, simply copy the project folder contents to `E:\FIT`.

### 2.2 Start MySQL with Docker

```powershell
cd E:\FIT
docker compose up -d
```

This starts MySQL on host port **3308** (container port 3306). Verify:

```powershell
docker ps
# Should show: fit_mysql_db  mysql:8.0  Up  ...  0.0.0.0:3308->3306/tcp
```

> **Important:** MySQL data is persisted in a Docker named volume (`fit_mysql_data_v2`), so data survives container restarts and rebuilds.

> [!NOTE]
> **If using the Release Bundle**: Step 2.3 and 2.4 are handled automatically by `deploy-production.ps1`. The script will detect the pre-built artifacts and skip the compilation/build phase.

### 2.3 Build & Configure the Backend

```powershell
cd E:\FIT\server
```

The existing `.env` file already contains the correct defaults. If you changed credentials in `docker-compose.yml`, update `.env` to match:

```env
NODE_ENV=production
DB_HOST=localhost
DB_PORT=3308
DB_USER=fit_user
DB_PASSWORD=fit_password
DB_NAME=fit_db
```

Install dependencies and compile TypeScript:

```powershell
npm install
npx tsc
```

This produces JavaScript output in `server/dist/`.

> **Production note:** `synchronize: true` in `data-source.ts` means TypeORM will auto-create/update tables on first run. After the initial setup with all tables created correctly, consider setting `synchronize: false` and using migrations to prevent unintended schema changes.

### 2.4 Build the Frontend

```powershell
cd E:\FIT
npm install
npm run build
```

The output will be in `E:\FIT\dist\`. The Express backend will automatically detect and serve these files in production. If you're also using Nginx, it can serve them instead (see Step 4).

> **Important:** The `dist/` folder must be at `E:\FIT\dist\` (sibling of the `server/` folder) for the backend to find it automatically.

---

## Step 3: Run the Backend in Production

Choose **one** of the two options below based on your deployment scenario:

| Scenario | Recommended | Why |
|----------|-------------|-----|
| **Single-machine** (shop PC, someone always logged in) | **Option A: PM2** | No extra downloads, simple commands, built-in log management |
| **Headless server** (no user logged in, remote-only) | **Option B: NSSM** | Runs as a true Windows Service, survives logouts |

### Option A: PM2 (Recommended for single-machine)

#### 3A.1 Create logs directory

```powershell
mkdir E:\FIT\server\logs -Force
```

#### 3A.2 Start the backend with PM2

```powershell
cd E:\FIT\server
pm2 start dist/index.js --name fit-backend
```

#### 3A.3 Save the process list and enable auto-start

```powershell
pm2 save
pm2-startup install    # Registers PM2 to auto-start on boot
```

> `pm2-startup install` creates a scheduled task so PM2 and all saved processes start automatically when Windows boots and the user logs in.

#### 3A.4 Verify the backend is running

```powershell
pm2 status
```

You should see `fit-backend` with status `online`. Then verify the API:

```powershell
Invoke-RestMethod -Uri http://localhost:3001/api/settings
```

You should see a JSON settings response.

#### 3A.5 Useful PM2 commands

```powershell
pm2 status                     # Show all processes
pm2 restart fit-backend        # Restart the backend
pm2 stop fit-backend           # Stop the backend
pm2 logs fit-backend           # View live logs (Ctrl+C to exit)
pm2 logs fit-backend --lines 50  # View last 50 log lines
pm2 delete fit-backend         # Remove from PM2 process list
pm2 monit                      # Real-time monitoring dashboard
```

---

### Option B: NSSM (For headless servers)

> Use this option if the machine needs to run the backend **without any user logged in** (e.g., a dedicated server accessed only via Remote Desktop).

#### 3B.1 Create logs directory

```powershell
mkdir E:\FIT\server\logs -Force
```

#### 3B.2 Install the service

Open PowerShell **as Administrator**, then run:

```powershell
nssm install fit-backend
```

In the NSSM GUI dialog that opens, fill in:

| Tab | Field | Value |
|-----|-------|-------|
| **Application** | Path | `C:\Program Files\nodejs\node.exe` (adjust if installed elsewhere) |
| **Application** | Startup directory | `E:\FIT\server` |
| **Application** | Arguments | `dist\index.js` |
| **Details** | Display name | `FIT Backend API` |
| **Details** | Description | `FIT Application Express.js Backend Server` |
| **Log on** | This account | `NT AUTHORITY\NetworkService` (or your user account) |
| **I/O** | Output (stdout) | `E:\FIT\server\logs\stdout.log` |
| **I/O** | Error (stderr) | `E:\FIT\server\logs\stderr.log` |

Click **Install service**.

#### 3B.3 Start and verify the service

```powershell
nssm start fit-backend
nssm status fit-backend
```

Verify the API is responding:

```powershell
Invoke-RestMethod -Uri http://localhost:3001/api/settings
```

You should see a JSON settings response.

#### 3B.4 Useful NSSM commands

```powershell
nssm stop fit-backend          # Stop the service
nssm restart fit-backend       # Restart the service
nssm remove fit-backend confirm # Remove the service
```

---

## Step 4: Configure Nginx (Optional)

The Express backend already serves the frontend directly on port **3001**. Nginx is **only needed** if you want:
- Port 80/443 (so users don't type `:3001`)
- SSL/HTTPS termination
- Gzip compression and static asset caching at the proxy level
- Future load balancing

> **For most single-machine deployments, skip this step entirely.** Users can access the app at `http://<server-ip>:3001`.

### If you choose NOT to use Nginx

No action needed — the backend already serves both the API and frontend. After Step 3, the app is accessible at:

```
http://localhost:3001          (on the server itself)
http://<server-ip>:3001        (from other machines on the LAN)
```

Skip ahead to [Step 5: Register WhatsApp Automation](#step-5-register-whatsapp-automation-zero-api-sharing).

---

### If you choose to use Nginx

#### 4.1 Create the Nginx config

Open the file `E:\nginx\conf\nginx.conf` in a text editor (run as Administrator) and replace its contents with:

```nginx
worker_processes  1;

events {
    worker_connections  1024;
}

http {
    include       mime.types;
    default_type  application/octet-stream;
    sendfile      on;
    keepalive_timeout  65;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    server {
        listen       80;
        server_name  localhost;  # Change to your domain if using one

        # Proxy everything to Express (which serves both API + frontend)
        location / {
            proxy_pass          http://localhost:3001;
            proxy_http_version  1.1;
            proxy_set_header    Host $host;
            proxy_set_header    X-Real-IP $remote_addr;
            proxy_set_header    X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header    X-Forwarded-Proto $scheme;
        }

        # Enable gzip compression
        gzip on;
        gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
        gzip_min_length 256;
    }
}
```

> **Note:** Use forward slashes (`/`) in the `root` path, not backslashes, even on Windows.

#### 4.2 Test and start Nginx

```powershell
cd E:\nginx
.\nginx.exe -t
```

You should see `test is successful`. Start Nginx:

```powershell
.\nginx.exe
```

> Nginx on Windows runs in the foreground by default. To keep it running, choose one:
>
> **PM2 (recommended for single-machine):**
>
> ```powershell
> pm2 start E:\nginx\nginx.exe --name fit-nginx
> pm2 save
> ```
>
> **NSSM (for headless servers):**
>
> ```powershell
> nssm install fit-nginx E:\nginx\nginx.exe
> nssm set fit-nginx AppDirectory E:\nginx
> nssm set fit-nginx DisplayName "FIT Nginx Reverse Proxy"
> nssm set fit-nginx Start SERVICE_AUTO_START
> nssm start fit-nginx
> ```

#### 4.3 Useful Nginx commands (Windows)

```powershell
cd E:\nginx
.\nginx.exe -s reload   # Reload config
.\nginx.exe -s stop     # Stop Nginx
```

---

## Step 5: Register WhatsApp Automation (Zero-API Sharing)

This step enables the app to send PDF receipts via WhatsApp Web with no API cost. It works by registering a custom URL protocol (`fitshare://`) in the Windows Registry. When a user clicks a WhatsApp-share link, Windows launches a PowerShell script that handles file movement and safe browser interaction.

### 5.1 Choosing the right script

The application includes multiple handlers, but **`ShareOnWhatsApp.ps1`** is the current production standard.

| Script | Recommendation | Feature |
|--------|----------------|---------|
| `ShareOnWhatsApp.ps1` | **Recommended** | **Zero-API v2**: Uses `Ctrl+Alt+/` search and **Clipboard-Paste** (`Ctrl+V`) for 100% reliability. Includes Win32 window activation and auto-maximization. |
| `FITShareFinal.ps1` | **Legacy** | Basic `Tab`-based navigation. Less reliable if the WhatsApp UI layout changes. |

### 5.2 Update script paths in `RegisterProtocol.ps1`

Open `E:\FIT\scripts\RegisterProtocol.ps1` and verify the script path matches your installation:

```powershell
$ScriptPath = "E:\FIT\scripts\ShareOnWhatsApp.ps1"
```

### 5.3 Run `RegisterProtocol.ps1` as Administrator

Open PowerShell **as Administrator** and run:

```powershell
Set-Location E:\FIT\scripts
.\RegisterProtocol.ps1
```

This will:
1. Register `fitshare://` in the Windows Registry.
2. Apply browser policies for **Chrome and Edge** to allow the protocol to open without the "Open this app?" prompt.
3. Set the handler to run `ShareOnWhatsApp.ps1` in a hidden PowerShell window.

### 5.4 Verify the protocol

Navigate to `fitshare://test` in your browser. A hidden PowerShell window will briefly run, and `scripts/automation_debug.log` should show "TEST SUCCESS".

### 5.5 How it works (The 5-Second Flow)

1. User clicks **"Launch Automated Share"** in the FIT app.
2. The PDF is saved to `~/Downloads/FIT Reports`.
3. The script finds/focuses the WhatsApp Web window and **Forces it to Maximize**.
4. **Targeting**: The script uses Win32 API to find the real WhatsApp tab and ignores unrelated search results.
5. **Searching**: It uses the `Ctrl+Alt+/` shortcut to focus the search bar and types the customer's phone number.
6. **Pasting**: It copies the PDF to the clipboard and uses `Ctrl+V` to paste it into the chat.
7. **Sending**: It hits `Enter` twice to confirm and send the attachment.

> [!IMPORTANT]
> **Hands-Off Policy**: During the ~8-second automation sequence, the user should NOT move the mouse or switch windows, as this may interfere with the simulated keystrokes. 

> [!NOTE]
> **Clipboard Use**: The script briefly uses the system clipboard to copy the file. If you were copying text at that exact moment, it may be overwritten by the PDF file link.

---

## Step 6: Secure with HTTPS (Optional but Recommended)

### Option A: Self-Signed Certificate (intranet / testing)

```powershell
openssl req -x509 -nodes -days 365 -newkey rsa:2048 `
  -keyout E:\nginx\conf\server.key `
  -out E:\nginx\conf\server.crt
```

Then update `nginx.conf` to add an HTTPS server block:

```nginx
server {
    listen       443 ssl;
    server_name  localhost;

    ssl_certificate     E:/nginx/conf/server.crt;
    ssl_certificate_key E:/nginx/conf/server.key;


    location / {
        root   E:/FIT/dist;
        index  index.html;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass          http://localhost:3001;
        proxy_http_version  1.1;
        proxy_set_header    Host $host;
        proxy_set_header    X-Real-IP $remote_addr;
        proxy_set_header    X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header    X-Forwarded-Proto $scheme;
    }
}

# Redirect HTTP to HTTPS
server {
    listen       80;
    server_name  localhost;
    return 301   https://$host$request_uri;
}
```

### Option B: Let's Encrypt (public domain)

Use **Win-ACME** (<https://www.win-acme.com/>) to get a free Let's Encrypt certificate on Windows. Download it, run `wacs.exe`, and follow the prompts to issue a certificate. Then point Nginx to the generated `.pem` files.

---

## Step 7: Windows Firewall Configuration

### 7.1 Allow the application through the firewall

Open PowerShell **as Administrator**:

**Without Nginx** (app on port 3001):

```powershell
New-NetFirewallRule -DisplayName "FIT Backend (HTTP)" -Direction Inbound -Protocol TCP -LocalPort 3001 -Action Allow
```

**With Nginx** (app on port 80/443):

```powershell
New-NetFirewallRule -DisplayName "FIT Nginx (HTTP)" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow
New-NetFirewallRule -DisplayName "FIT Nginx (HTTPS)" -Direction Inbound -Protocol TCP -LocalPort 443 -Action Allow
```

### 7.2 Allow through Windows Defender Firewall GUI (alternative)

1. Open **Windows Defender Firewall with Advanced Security**
2. Click **Inbound Rules** > **New Rule**
3. Select **Port**, click Next
4. Select **TCP**, enter the port(s): `3001` (without Nginx) or `80, 443` (with Nginx)
5. Select **Allow the connection**, click Next
6. Check all profiles (Domain, Private, Public), click Next
7. Name it `FIT Application`, click Finish

### 7.3 Do NOT expose MySQL externally

Ensure port **3308** is NOT open in the Windows Firewall. It should only be accessible from localhost. Verify it is not exposed publicly by running:

```powershell
netstat -ano | findstr 3308
```

It should only show `127.0.0.1:3308` or `0.0.0.0:3308` — the latter means any local app can access it (which is fine), but it should not be routed from the outside by your router/firewall.

---

## Step 8: Auto-Start on Boot

Ensure all services start automatically when Windows restarts:

### Docker MySQL

Docker Desktop auto-starts containers that were running before shutdown. If not, create a startup script:

```powershell
# C:\FIT\start-mysql.ps1
Set-Location E:\FIT
docker compose up -d
```

Register it as a scheduled task:

```powershell
$action = New-ScheduledTaskAction -Execute "docker" -Argument "compose up -d" -WorkingDirectory "E:\FIT"
$trigger = New-ScheduledTaskTrigger -AtStartup
Register-ScheduledTask -TaskName "FIT-MySQL" -Action $action -Trigger $trigger -RunLevel Highest
```

### Backend & Nginx

**If using PM2 (Option A):**

PM2 handles auto-start via the `pm2-startup install` command from Step 3A.3. Verify it's configured:

```powershell
pm2 save       # Ensures current process list is saved
pm2 startup    # Verify startup hook is registered
```

**If using NSSM (Option B):**

NSSM services (`fit-backend`, `fit-nginx`) auto-start on boot automatically since they are registered with `SERVICE_AUTO_START`. No additional configuration needed.

---

## Step 9: Backup & Restore

### Automated Backups

Use the included `backup-restore.ps1` script to manage database backups:

```powershell
# Create a backup (saved to E:\FIT\backups\)
.\backup-restore.ps1 -Action backup

# List available backups
.\backup-restore.ps1 -Action list

# Restore from a specific backup
.\backup-restore.ps1 -Action restore -BackupFile "E:\FIT\backups\fit_db_2026-04-11_083000.sql"
```

### Scheduled Daily Backups

Register a Windows Scheduled Task for daily automated backups:

```powershell
$action  = New-ScheduledTaskAction `
    -Execute "powershell.exe" `
    -Argument "-ExecutionPolicy Bypass -File E:\FIT\backup-restore.ps1 -Action backup" `
    -WorkingDirectory "E:\FIT"
$trigger = New-ScheduledTaskTrigger -Daily -At "02:00AM"
Register-ScheduledTask -TaskName "FIT-DailyBackup" -Action $action -Trigger $trigger -RunLevel Highest
```

The script automatically keeps the latest **30 backups** and cleans up older ones.

### Manual Backup (without script)

```powershell
docker exec fit_mysql_db mysqldump -uroot -proot --single-transaction fit_db > E:\FIT\backups\manual_backup.sql
```

### Manual Restore (without script)

```powershell
Get-Content E:\FIT\backups\manual_backup.sql -Raw | docker exec -i fit_mysql_db mysql -uroot -proot fit_db
# Restart the backend after restore:
pm2 restart fit-backend        # if using PM2
# OR
nssm restart fit-backend       # if using NSSM
```

---

## Step 10: Verify the Deployment

1. **Frontend:** Open a browser and go to:
   - Without Nginx: `http://localhost:3001` (or `http://<server-ip>:3001` from another machine)
   - With Nginx: `http://localhost` (or `http://<server-ip>`)
2. **API:** Run in PowerShell:

   ```powershell
   # Without Nginx:
   Invoke-RestMethod -Uri http://localhost:3001/api/settings
   # With Nginx:
   Invoke-RestMethod -Uri http://localhost/api/settings
   ```

3. **Login:** Use default credentials:
   - **System Admin**: username: `System Admin`, password: `Clasic@104`
   - **Admin**: username: `Admin`, password: `AS@traders`

> **Critical:** Change these default passwords on first login from the Settings page!

---

## Quick Reference

| Component | Port | Management (PM2) | Management (NSSM) |
|-----------|------|-------------------|--------------------|
| MySQL (Docker) | 3308 (host) / 3306 (container) | `docker ps` / `docker logs fit_mysql_db` | same |
| Backend + Frontend | 3001 (Production) | `pm2 status` / `pm2 logs fit-backend` | `nssm status fit-backend` |
| Nginx *(optional)* | 80 / 443 | `E:\nginx\nginx.exe -s reload` | same |

### Common Tasks (PM2)

```powershell
# Restart backend (also restarts frontend serving)
pm2 restart fit-backend

# View backend logs (last 50 lines)
pm2 logs fit-backend --lines 50

# Live monitoring dashboard
pm2 monit

# Rebuild & redeploy frontend (no Nginx)
cd E:\FIT; npm run build; pm2 restart fit-backend

# Rebuild & redeploy frontend (with Nginx)
cd E:\FIT; npm run build; cd E:\nginx; .\nginx.exe -s reload

# Check all services
pm2 status
docker ps

# Update deployment (pull new code)
cd E:\FIT
git pull
npm install; npm run build                         # Frontend
cd server; npm install; npx tsc; cd ..             # Backend
pm2 restart fit-backend

# Database backup
.\backup-restore.ps1 -Action backup
```

### Common Tasks (NSSM)

```powershell
# Restart backend (also restarts frontend serving)
nssm restart fit-backend

# View backend logs (last 50 lines)
Get-Content E:\FIT\server\logs\stderr.log -Tail 50

# Check all services
nssm status fit-backend
docker ps

# Update deployment (pull new code)
cd E:\FIT
git pull
npm install; npm run build                         # Frontend
cd server; npm install; npx tsc; cd ..             # Backend
nssm restart fit-backend
```

---

## Troubleshooting

### Backend won't start

**If using PM2:**

```powershell
# Check PM2 status and logs
pm2 status
pm2 logs fit-backend --lines 100

# If the process is errored, delete and re-add
pm2 delete fit-backend
cd E:\FIT\server
pm2 start dist/index.js --name fit-backend
pm2 save
```

**If using NSSM:**

```powershell
# Check error logs
Get-Content E:\FIT\server\logs\stderr.log -Tail 100
nssm status fit-backend
```

**Common causes (both):**

```powershell
# 1. MySQL not running → docker compose up -d
# 2. Port 3001 already in use → netstat -ano | findstr 3001
# 3. TypeScript not compiled → cd E:\FIT\server && npx tsc
# 4. Missing .env → verify E:\FIT\server\.env exists with correct DB credentials
# 5. IPv6 Conflict → If "localhost" fails to connect, try using "127.0.0.1" in .env (Windows sometimes maps localhost to ::1)
```

### Frontend shows blank page or 404

```powershell
# Verify dist/ folder exists and is non-empty
dir E:\FIT\dist

# Rebuild if needed
cd E:\FIT; npm run build

# Restart backend (it re-detects the dist/ folder on startup)
pm2 restart fit-backend        # if using PM2
nssm restart fit-backend       # if using NSSM

# If using Nginx, also reload it
cd C:\nginx; .\nginx.exe -s reload
```

### MySQL connection refused

```powershell
# Check if container is running
docker ps -a | findstr fit_mysql

# Restart the container
docker compose -f C:\FIT\docker-compose.yml up -d

# Check container logs
docker logs fit_mysql_db --tail 50

# Test connection directly
docker exec fit_mysql_db mysql -ufit_user -pfit_password -e "SELECT 1"
```

### WhatsApp sharing not working

```powershell
# 1. Verify protocol is registered
Get-ItemProperty "HKCU:\Software\Classes\fitshare\shell\open\command"

# 2. Test the protocol manually
Start-Process "fitshare://test"

# 3. Re-register the protocol (run as Admin)
cd C:\FIT\scripts && .\RegisterProtocol.ps1

# 4. Ensure WhatsApp Web is logged in and the browser (Edge/Chrome) is open
```

### Note on Ports (Dev vs Prod)

- **Development**: Frontend is on `:5173` (Vite dev server), Backend is on `:3001`.
- **Production**: Both Frontend and Backend are served on port **`:3001`** by the Express server. The Vite dev server is not used in production.

### Port conflicts

```powershell
# Find what's using a specific port
netstat -ano | findstr :80
netstat -ano | findstr :3001
netstat -ano | findstr :3308

# Kill a process by PID
Stop-Process -Id <PID> -Force
```

---

## Deployment Checklist

**Core (required):**

- [ ] Node.js 20+ installed and in PATH
- [ ] Docker Desktop for Windows installed and running
- [ ] PM2 installed globally (`npm install -g pm2 pm2-windows-startup`)
- [ ] Project cloned/copied to `C:\FIT`
- [ ] MySQL container running (`docker compose up -d`)
- [ ] Backend `.env` verified with correct DB credentials and `NODE_ENV=production`
- [ ] Backend installed and compiled (`cd server && npm install && npx tsc`)
- [ ] Frontend built (`npm run build`) — output in `C:\FIT\dist\`
- [ ] Backend running via PM2 (`pm2 start dist/index.js --name fit-backend`) or NSSM
- [ ] PM2 process saved and auto-start configured (`pm2 save && pm2-startup install`)
- [ ] App accessible at `http://localhost:3001`
- [ ] Windows Firewall rule added for port 3001
- [ ] MySQL port NOT exposed to the internet
- [ ] Default admin passwords changed
- [ ] Auto-start on boot configured (Scheduled Task for MySQL, PM2/NSSM for backend)
- [ ] Daily backup scheduled (`FIT-DailyBackup` task)
- [ ] Tested frontend, API, and login from a browser
- [ ] Backup strategy verified (run `.\backup-restore.ps1 -Action backup` and confirm)

**Optional:**

- [ ] *(If headless server)* NSSM downloaded and accessible
- [ ] *(If using Nginx)* Nginx for Windows extracted and configured
- [ ] *(If using Nginx)* Firewall rules for ports 80, 443 instead of 3001
- [ ] *(If WhatsApp sharing)* Protocol registered (`RegisterProtocol.ps1` as Administrator)
- [ ] *(If WhatsApp sharing)* `fitshare://test` URL confirmed working
- [ ] *(If WhatsApp sharing)* Tested PDF sharing from the app
- [ ] *(If HTTPS needed)* SSL configured (self-signed or Let's Encrypt via Win-ACME)
