# FIT (Fish Inventory Tracking) - Windows Production Deployment Guide

## Prerequisites

- **Node.js** 20+ (LTS) — <https://nodejs.org/> — select "Add to PATH" during install
- **Git** — <https://git-scm.com/download/win>
- **Docker Desktop for Windows** — <https://www.docker.com/products/docker-desktop/>
- **NSSM** (Non-Sucking Service Manager) — <https://nssm.cc/download> — to run backend as a Windows Service
- **Nginx** — <https://nginx.org/en/download.html> — download the Windows zip (stable version)

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
2. Extract the zip to `C:\nginx` (or your preferred location)
3. You will configure this later in Step 5

### 1.5 Download NSSM

1. Download NSSM from <https://nssm.cc/download>
2. Extract the zip
3. Copy the executable matching your architecture (e.g., `win64\nssm.exe`) to a path location, such as `C:\Windows\System32\`, or note the full path for later use

---

## Step 2: Deploy the Application

### 2.1 Create project directory and clone the repository

```powershell
mkdir C:\FIT -Force
cd C:\FIT
git clone <your-repo-url> .
```

If you're deploying from a local copy instead of a remote repo, simply copy the project folder contents to `C:\FIT`.

### 2.2 Start MySQL with Docker

```powershell
cd C:\FIT
docker compose up -d
```

This starts MySQL on host port **3308** (container port 3306). Verify:

```powershell
docker ps
# Should show: fit_mysql_db  mysql:8.0  Up  ...  0.0.0.0:3308->3306/tcp
```

> **Important:** MySQL data is persisted in a Docker named volume (`fit_mysql_data_v2`), so data survives container restarts and rebuilds.

### 2.3 Build & Configure the Backend

```powershell
cd C:\FIT\server
```

The existing `.env` file already contains the correct defaults. If you changed credentials in `docker-compose.yml`, update `.env` to match:

```env
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

> `synchronize: true` in `data-source.ts` means TypeORM will auto-create tables on first run. For production, set `synchronize: false` after the initial setup and use migrations instead.

### 2.4 Build the Frontend

```powershell
cd C:\FIT
npm install
npm run build
```

The output will be in `C:\FIT\dist\`. This is a static site ready to be served by Nginx.

---

## Step 3: Run the Backend as a Windows Service (NSSM)

Running the backend as a Windows Service ensures it auto-starts on boot and survives logouts.

### 3.1 Install the service

Open PowerShell **as Administrator**, then run:

```powershell
nssm install fit-backend
```

In the NSSM GUI dialog that opens, fill in:

| Tab | Field | Value |
|-----|-------|-------|
| **Application** | Path | `C:\Program Files\nodejs\node.exe` (adjust if installed elsewhere) |
| **Application** | Startup directory | `C:\FIT\server` |
| **Application** | Arguments | `dist\index.js` |
| **Details** | Display name | `FIT Backend API` |
| **Details** | Description | `FIT Application Express.js Backend Server` |
| **Log on** | This account | `NT AUTHORITY\NetworkService` (or your user account) |
| **I/O** | Output (stdout) | `C:\FIT\server\logs\stdout.log` |
| **I/O** | Error (stderr) | `C:\FIT\server\logs\stderr.log` |

Click **Install service**.

### 3.2 Create logs directory

```powershell
mkdir C:\FIT\server\logs -Force
```

### 3.3 Start and verify the service

```powershell
nssm start fit-backend
nssm status fit-backend
```

Verify the API is responding:

```powershell
Invoke-RestMethod -Uri http://localhost:3001/api/settings
```

You should see a JSON settings response.

### 3.4 Useful NSSM commands

```powershell
nssm stop fit-backend          # Stop the service
nssm restart fit-backend       # Restart the service
nssm remove fit-backend confirm # Remove the service
```

---

## Step 4: Configure Nginx as Reverse Proxy

### 4.1 Create the Nginx config

Open the file `C:\nginx\conf\nginx.conf` in a text editor (run as Administrator) and replace its contents with:

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

    server {
        listen       80;
        server_name  localhost;  # Change to your domain if using one

        # Frontend static files
        location / {
            root   C:/FIT/dist;
            index  index.html;
            try_files $uri $uri/ /index.html;
        }

        # Proxy API requests to backend
        location /api {
            proxy_pass          http://localhost:3001;
            proxy_http_version  1.1;
            proxy_set_header    Host $host;
            proxy_set_header    X-Real-IP $remote_addr;
            proxy_set_header    X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header    X-Forwarded-Proto $scheme;
        }

        # Enable gzip compression
        gzip on;
        gzip_types text/plain text/css application/json application/javascript text/xml;
        gzip_min_length 256;
    }
}
```

> **Note:** Use forward slashes (`/`) in the `root` path, not backslashes, even on Windows.

### 4.2 Test and start Nginx

```powershell
cd C:\nginx
.\nginx.exe -t
```

You should see `test is successful`. Start Nginx:

```powershell
.\nginx.exe
```

> Nginx on Windows runs in the foreground by default. To keep it running, either:
> - Leave the terminal window open, or
> - Register it as a Windows Service using NSSM (see Step 3 pattern):
>
> ```powershell
> nssm install fit-nginx C:\nginx\nginx.exe
> nssm start fit-nginx
> ```

### 4.3 Useful Nginx commands (Windows)

```powershell
cd C:\nginx
.\nginx.exe -s reload   # Reload config
.\nginx.exe -s stop     # Stop Nginx
```

---

## Step 5: Register WhatsApp Automation (Zero-API Sharing)

This step enables the app to send PDF receipts via WhatsApp Web with no API cost. It works by registering a custom URL protocol (`fitshare://`) in the Windows Registry so that when a user clicks a WhatsApp-share link in the app, Windows automatically launches a PowerShell script that handles file movement and WhatsApp Web interaction.

### Scripts Overview

| Script | Purpose | When to Run | Privilege |
|--------|---------|-------------|-----------|
| `RegisterProtocol.ps1` | Writes the `fitshare://` URL handler to the Windows Registry and sets Edge/Chrome auto-launch policies | **Once during deployment** | **Administrator** |
| `FITShareFinal.ps1` | The handler itself — moves downloaded PDFs to `~/Downloads/FIT Reports/` and automates WhatsApp Web | Never run manually — invoked by Windows whenever a `fitshare://` link is clicked | Standard user |
| `ShareOnWhatsApp.ps1` | Alternative handler with smarter Win32 window detection and clipboard-based paste. Replace `FITShareFinal.ps1` if you want improved reliability | Never run manually — same as above | Standard user |
| `debug_windows.ps1` | One-off debugging tool that dumps visible window titles. Not required for production. | If you need to debug why a window isn't found | Standard user |

### 5.1 Update script paths in `RegisterProtocol.ps1`

Open `C:\FIT\scripts\RegisterProtocol.ps1` and update these two paths to match your installation:

```powershell
$ScriptPath = "C:\FIT\scripts\FITShareFinal.ps1"    # or FITShareFinal.ps1's actual path
```

> If you prefer the more advanced handler (`ShareOnWhatsApp.ps1`), copy it over `FITShareFinal.ps1` or point `$ScriptPath` to it.

### 5.2 Run `RegisterProtocol.ps1` as Administrator

Open PowerShell **as Administrator** and run:

```powershell
Set-Location C:\FIT\scripts
.\RegisterProtocol.ps1
```

This will:
1. Register `fitshare://` under `HKCU:\Software\Classes\fitshare` so Windows knows which program to launch
2. Write browser policies under `HKLM:\SOFTWARE\Policies\Microsoft\Edge` and `HKLM:\SOFTWARE\Policies\Google\Chrome` to auto-launch the protocol without prompting "Open this app?"
3. The handler command is: `"C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe" -ExecutionPolicy Bypass -WindowStyle Hidden -File "C:\FIT\scripts\FITShareFinal.ps1" "%1"`

### 5.3 Verify the protocol

Open a browser and navigate to:

```
fitshare://test
```

A hidden PowerShell window will briefly run and you should see console output confirming the script executed. If you get a "do you want to open external application?" prompt, click "Allow". If it opens successfully, the protocol is registered correctly.

### 5.4 How it works at runtime

1. User clicks "Share on WhatsApp" in the FIT app
2. Browser navigates to a `fitshare://send?phone=...&file=...` URL
3. Windows detects the protocol and launches `FITShareFinal.ps1` (hidden)
4. The script:
   - Finds the PDF in the user's `Downloads` folder
   - Moves it to `~/Downloads/FIT Reports/`
   - Opens WhatsApp Web (or focuses an existing tab)
   - Searches for the contact by phone number
   - Attaches the PDF and sends it
5. **The user must have WhatsApp Web already logged in** in their default browser for this to work

---

## Step 6: Secure with HTTPS (Optional but Recommended)

### Option A: Self-Signed Certificate (intranet / testing)

```powershell
openssl req -x509 -nodes -days 365 -newkey rsa:2048 `
  -keyout C:\nginx\conf\server.key `
  -out C:\nginx\conf\server.crt
```

Then update `nginx.conf` to add an HTTPS server block:

```nginx
server {
    listen       443 ssl;
    server_name  localhost;

    ssl_certificate     C:/nginx/conf/server.crt;
    ssl_certificate_key C:/nginx/conf/server.key;

    location / {
        root   C:/FIT/dist;
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

### 7.1 Allow Nginx through the firewall

Open PowerShell **as Administrator**:

```powershell
New-NetFirewallRule -DisplayName "FIT Nginx (HTTP)" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow
New-NetFirewallRule -DisplayName "FIT Nginx (HTTPS)" -Direction Inbound -Protocol TCP -LocalPort 443 -Action Allow
```

### 7.2 Allow Nginx through Windows Defender Firewall GUI (alternative)

1. Open **Windows Defender Firewall with Advanced Security**
2. Click **Inbound Rules** > **New Rule**
3. Select **Port**, click Next
4. Select **TCP**, enter `80, 443` under Specific local ports
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

## Step 8: Verify the Deployment

1. **Frontend:** Open a browser and go to `http://localhost` (or `http://<server-ip>` if accessing from another machine on the network)
2. **API:** Run in PowerShell:

   ```powershell
   Invoke-RestMethod -Uri http://localhost/api/settings
   ```

3. **Login:** Use default credentials:
   - **System Admin**: username: `System Admin`, password: `Clasic@104`
   - **Admin**: username: `Admin`, password: `AS@traders`

> **Critical:** Change these default passwords on first login from the Settings page!

---

## Step 9: Auto-Start on Boot

Ensure all services start automatically when Windows restarts:

### Docker MySQL

Docker Desktop auto-starts containers that were running before shutdown. If not, create a startup script:

```powershell
# C:\FIT\start-mysql.ps1
Set-Location C:\FIT
docker compose up -d
```

Register it as a scheduled task:

```powershell
$action = New-ScheduledTaskAction -Execute "docker" -Argument "compose up -d" -WorkingDirectory "C:\FIT"
$trigger = New-ScheduledTaskTrigger -AtStartup
Register-ScheduledTask -TaskName "FIT-MySQL" -Action $action -Trigger $trigger -RunLevel Highest
```

### Backend & Nginx

If you installed them as NSSM services (`fit-backend`, `fit-nginx`), they will auto-start on boot automatically. If you're running Nginx manually, register it with NSSM as shown in Step 4.

---

## Quick Reference

| Component | Port | Management |
|-----------|------|------------|
| MySQL (Docker) | 3308 (host) / 3306 (container) | `docker ps` / `docker logs fit_mysql_db` |
| Backend API | 3001 | `services.msc` > FIT Backend API / `nssm status fit-backend` |
| Nginx (Frontend) | 80 / 443 | `C:\nginx\nginx.exe -s reload` |

### Common Tasks

```powershell
# Restart backend service
nssm restart fit-backend

# View backend logs
Get-Content C:\FIT\server\logs\stderr.log -Tail 50

# Rebuild frontend
cd C:\FIT && npm run build && cd C:\nginx && .\nginx.exe -s reload

# Check all services
Get-Service -Name fit-backend, fit-nginx  # if NSSM services
docker ps                                  # MySQL

# Update deployment (pull new code)
cd C:\FIT
git pull
npm run build
npx tsc --project server\tsconfig.json
nssm restart fit-backend
cd C:\nginx; .\nginx.exe -s reload
```

---

## Deployment Checklist

- [ ] Node.js 20+ installed and in PATH
- [ ] Docker Desktop for Windows installed and running
- [ ] NSSM downloaded and accessible
- [ ] Nginx for Windows extracted to `C:\nginx`
- [ ] Project cloned/copied to `C:\FIT`
- [ ] MySQL container running (`docker compose up -d`)
- [ ] Backend `.env` verified with correct DB credentials
- [ ] Backend installed and compiled (`cd server && npm install && npx tsc`)
- [ ] Backend running as Windows Service via NSSM (`nssm start fit-backend`)
- [ ] Frontend built (`npm run build`)
- [ ] Nginx configured and running (serving `dist/`, proxying `/api`)
- [ ] WhatsApp protocol registered (`RegisterProtocol.ps1` run as Administrator)
- [ ] `fitshare://test` URL confirmed working
- [ ] HTTPS configured (self-signed or Let's Encrypt via Win-ACME)
- [ ] Windows Firewall rules added — ports 80, 443 only
- [ ] MySQL port NOT exposed to the internet
- [ ] Default admin passwords changed
- [ ] Auto-start on boot configured (Scheduled Task for MySQL, NSSM for backend + Nginx)
- [ ] Tested frontend, API, and login from a browser
- [ ] Tested WhatsApp PDF sharing from the app
- [ ] Backup strategy in place
