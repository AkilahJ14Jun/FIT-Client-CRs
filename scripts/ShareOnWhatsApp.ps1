param([string]$Uri)
# Version: 4.2-Logged
$LogFile = [System.IO.Path]::Combine((Split-Path $MyInvocation.MyCommand.Path), "automation_debug.log")
function Log-Msg($msg) { 
    $t = Get-Date -Format "HH:mm:ss"
    "[$t] $msg" | Out-File -FilePath $LogFile -Append 
    Write-Host "[$t] $msg"
}

Log-Msg "--- STARTING AUTOMATION ---"
Log-Msg "Received Raw URI: $Uri"

# --- Configuration ---
$DownloadsFolder = [System.IO.Path]::Combine($env:USERPROFILE, "Downloads")
$ReportFolder = [System.IO.Path]::Combine($DownloadsFolder, "FIT Reports")
$WaitTimeSeconds = 3 

# --- Diagnostic Test ---
if ($Uri -match "fitshare://test") {
    Log-Msg "TEST SUCCESS"
    Write-Host "Automation script is RUNNING correctly!" -ForegroundColor Green
    exit
}

# --- Helper ---
Add-Type -AssemblyName System.Windows.Forms
$wshell = New-Object -ComObject WScript.Shell
function Send-Key($keys, $delay = 200) {
    [System.Windows.Forms.SendKeys]::SendWait($keys)
    Start-Sleep -Milliseconds $delay
}

# --- Parse ---
# Clean the URI to remove potential browser-added quotes
$cleanUri = $Uri.Trim('"')
Log-Msg "Cleaned URI: $cleanUri"

$Phone = ""; $File = ""
if ($cleanUri.Contains("?")) {
    $queryString = $cleanUri.Split('?')[1].TrimEnd('/')
    $queryString.Split('&') | ForEach-Object {
        $parts = $_.Split('=')
        if ($parts.Count -eq 2) {
            if ($parts[0] -eq "phone") { $Phone = [System.Net.WebUtility]::UrlDecode($parts[1]) }
            if ($parts[0] -eq "file") { $File = [System.Net.WebUtility]::UrlDecode($parts[1]) }
        }
    }
}

if ($Phone -eq "" -or $File -eq "") {
    Log-Msg "ERROR: Could not parse Phone or File from URI: $cleanUri"
    exit
}

Log-Msg "Parsed Phone: $Phone"
Log-Msg "Parsed File: $File"
# Rename to match following logic
$FileName = $File
# --- 1. Find & Move File ---
if (-not (Test-Path $ReportFolder)) {
    New-Item -ItemType Directory -Path $ReportFolder -Force | Out-Null
}
$SourcePath = [System.IO.Path]::Combine($DownloadsFolder, $FileName)
$DestPath = [System.IO.Path]::Combine($ReportFolder, $FileName)
Log-Msg "Searching for source file: $SourcePath"
if (Test-Path $SourcePath) {
    Move-Item -Path $SourcePath -Destination $DestPath -Force
    Log-Msg "File moved to: $DestPath"
} elseif (Test-Path $DestPath) {
    Log-Msg "File already in destination: $DestPath"
} else {
    Log-Msg "ERROR: File not found: $SourcePath"
    exit
}

# --- 2. Share ---
$encodedPhone = [System.Net.WebUtility]::UrlEncode($Phone)
$WhatsAppUrl = "https://web.whatsapp.com/send?phone=$encodedPhone"

# Robust Win32 Setup for Window Management
$Win32Code = @"
using System;
using System.Runtime.InteropServices;
using System.Collections.Generic;
using System.Text;
public class Win32 {
    [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
    [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
    [DllImport("user32.dll")] public static extern bool EnumWindows(EnumWindowsProc lpEnumFunc, IntPtr lParam);
    public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);
    [DllImport("user32.dll", CharSet = CharSet.Auto)] public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);
    [DllImport("user32.dll")] public static extern bool IsIconic(IntPtr hWnd);
    public static List<IntPtr> FindWindows(string titlePart) {
        List<IntPtr> found = new List<IntPtr>();
        EnumWindows(delegate (IntPtr h, IntPtr l) {
            StringBuilder b = new StringBuilder(512);
            GetWindowText(h, b, 512);
            string text = b.ToString();
            if (!string.IsNullOrEmpty(text) && text.ToLower().Contains(titlePart.ToLower())) {
                found.Add(h);
            }
            return true;
        }, IntPtr.Zero);
        return found;
    }
}
"@
if (-not ([System.Management.Automation.PSTypeName]'Win32').Type) { 
    Add-Type -TypeDefinition $Win32Code -ErrorAction SilentlyContinue 
}

function Activate-WhatsApp {
    Log-Msg "Searching for WhatsApp window..."
    for ($i = 0; $i -lt 25; $i++) {
        # Search for windows containing "WhatsApp" anywhere in the title
        $windows = [Win32]::FindWindows("WhatsApp") | Where-Object { 
            $t = (New-Object System.Text.StringBuilder(512)); 
            [Win32]::GetWindowText($_, $t, 512) | Out-Null; 
            $title = $t.ToString().ToLower();
            # Match WhatsApp but exclude search engine results and other common false positives
            ($title -match "whatsapp") -and (-not ($title -match "search|google|bing|yahoo|duckduckgo"))
        }

        if ($windows.Count -gt 0) {
            $hWnd = $windows[0]
            # SW_RESTORE (9) or SW_SHOW (5) before SetForegroundWindow is often more reliable
            [Win32]::ShowWindow($hWnd, 9) 
            Start-Sleep -Milliseconds 200
            [Win32]::ShowWindow($hWnd, 3) # SW_MAXIMIZE
            [Win32]::SetForegroundWindow($hWnd)
            Log-Msg "WhatsApp window found and activated."
            return $hWnd
        }
        
        # Only launch browser on the very first try if absolutely nothing found
        if ($i -eq 0) { 
            Log-Msg "Initial search failed. Launching browser/app..."
            Start-Process $WhatsAppUrl 
            Start-Sleep -Seconds 3 # Give it a moment to actually open the process
        }
        Start-Sleep -Seconds 1
        Log-Msg "Waiting for WhatsApp window to appear... ($($i+1)/25)"
    }
    return $null
}

$targetHWnd = Activate-WhatsApp
if (-not $targetHWnd) {
    Log-Msg "ERROR: Could not activate WhatsApp window after 25 seconds."
    exit
}

# --- 3. Share Sequence (Robust Mode) ---
Log-Msg "Preparing clipboard..."
try {
    # Ensure STA mode for clipboard (PowerShell 5.1 default, but safety first)
    $fileList = New-Object System.Collections.Specialized.StringCollection
    $fileList.Add($DestPath)
    $dataObj = New-Object System.Windows.Forms.DataObject
    $dataObj.SetFileDropList($fileList)
    [System.Windows.Forms.Clipboard]::Clear()
    Start-Sleep -Milliseconds 200
    [System.Windows.Forms.Clipboard]::SetDataObject($dataObj, $true)
    Log-Msg "File put on clipboard successfully."
} catch {
    Log-Msg "ERROR: Clipboard access failed: $_"
    exit
}

Log-Msg "Starting chat search & paste sequence..."
# Re-focus just in case we lost it during clipboard setup
[Win32]::SetForegroundWindow($targetHWnd)
Start-Sleep -Milliseconds 1000

# Step A: Focus & Clear the Search Bar
Send-Key "{ESC}" 
Start-Sleep -Milliseconds 500
Send-Key "^%/" # Ctrl+Alt+/ (WhatsApp Web Search)
Start-Sleep -Milliseconds 800
Send-Key "^a{BACKSPACE}" # Clear any existing search text
Start-Sleep -Milliseconds 300

# Step B: Type phone number and Enter to switch chat
$cleanPhone = $Phone.TrimStart('+')
$escapedPhone = $cleanPhone -replace '([\+\^%\~(){}\[\]])', '{$1}'
Log-Msg "Typing phone: $cleanPhone"
Send-Key "$escapedPhone"
Start-Sleep -Milliseconds 1500 # Wait for search results to filter
Send-Key "{ENTER}"
Log-Msg "Chat switch triggered."
Start-Sleep -Milliseconds 2500 # CRITICAL: Wait for chat window to LOAD and FOCUS input box!

# Final re-focus check before pasting
[Win32]::SetForegroundWindow($targetHWnd)
Start-Sleep -Milliseconds 200

# Step C: Paste the file (Ctrl+V)
Log-Msg "Pasting file..."
Send-Key "^v"
Start-Sleep -Milliseconds 3500 # Wait for attachment preview to appear (can be slow for PDFs)

# Step D: Send (Enter)
Log-Msg "Sending..."
Send-Key "{ENTER}"
Log-Msg "DONE (Multi-Stage)."

Start-Sleep -Seconds 2
