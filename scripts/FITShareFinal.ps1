param([string]$Uri)
$LogFile = [System.IO.Path]::Combine((Split-Path $MyInvocation.MyCommand.Path), "automation_debug.log")
function Log-Msg($msg) { 
    $t = Get-Date -Format "HH:mm:ss"
    "[$t] $msg" | Out-File -FilePath $LogFile -Append 
    Write-Host "[$t] $msg"
}

Log-Msg "--- STARTING v13.0 (ZERO-API MODE) ---"

# --- SYSTEM SETUP ---
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
$Downloads = [System.IO.Path]::Combine($env:USERPROFILE, "Downloads")
$Reports = [System.IO.Path]::Combine($Downloads, "FIT Reports")

try {
    # --- 1. PARSING THE PROTOCOL ---
    $cleanUri = $Uri.Trim('"').TrimEnd('/')
    if ($cleanUri.ToLower().Contains("test")) { Log-Msg "TEST SUCCESS"; exit }
    
    $Phone = ""; $File = ""
    if ($cleanUri.Contains("?")) {
        $cleanUri.Split('?')[1].Split('&') | ForEach-Object {
            $parts = $_.Split('=')
            if ($parts.Count -eq 2) {
                if ($parts[0] -eq "phone") { $Phone = [System.Net.WebUtility]::UrlDecode($parts[1]) }
                if ($parts[0] -eq "file") { $File = [System.Net.WebUtility]::UrlDecode($parts[1]) }
            }
        }
    }
    if ($Phone -eq "" -or $File -eq "") { throw "Missing Data" }
    
    # Secure the file
    $Src = [System.IO.Path]::Combine($Downloads, $File); $Dst = [System.IO.Path]::Combine($Reports, $File)
    $fileFound = $false; for ($i=0; $i -lt 10; $i++) { if (Test-Path $Src) { $fileFound=$true; break }; Start-Sleep -Milliseconds 200 }
    if ($fileFound) { Move-Item $Src $Dst -Force; Log-Msg "File Ready." }

    # Set Sticky Clipboard
    $fileList = New-Object System.Collections.Specialized.StringCollection
    $fileList.Add($Dst)
    $dataObj = New-Object System.Windows.Forms.DataObject
    $dataObj.SetFileDropList($fileList)
    [System.Windows.Forms.Clipboard]::SetDataObject($dataObj, $true)

    # --- 2. WIN32 SETUP ---
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
        public static string lastLog = "";
        public static List<IntPtr> FindWindows(string title) {
            List<IntPtr> m = new List<IntPtr>();
            StringBuilder sb = new StringBuilder();
            EnumWindows(delegate (IntPtr h, IntPtr l) {
                StringBuilder b = new StringBuilder(512);
                GetWindowText(h, b, 512);
                string text = b.ToString();
                if (!string.IsNullOrEmpty(text)) {
                   if (text.ToLower().Contains("whatsapp") || text.ToLower().Contains("edge") || text.ToLower().Contains("chrome")) {
                       sb.AppendLine("DEBUG CANDIDATE: " + text);
                   }
                   if (text.ToLower().Contains(title.ToLower())) { m.Add(h); }
                }
                return true;
            }, IntPtr.Zero);
            lastLog = sb.ToString();
            return m;
        }
        [DllImport("user32.dll")] public static extern bool IsIconic(IntPtr hWnd);
        [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr hWnd);
    }
"@
    if (-not ([System.Management.Automation.PSTypeName]'Win32').Type) { Add-Type -TypeDefinition $Win32Code }

    # --- 3. ZERO-API DETECTION ---
    # Find any window containing "WhatsApp" anywhere in the title
    $waTab = [Win32]::FindWindows("WhatsApp")
    $log = [Win32]::lastLog
    if ($log) { Log-Msg "Detected Windows Tracked:`n$log" }
    Log-Msg "Found $($waTab.Count) window(s) containing 'WhatsApp'"
    
    if ($waTab.Count -eq 0) {
        Log-Msg "No WhatsApp tab found. Opening system default browser (https://web.whatsapp.com)..."
        # Opening the URL directly uses the system default browser
        Start-Process "https://web.whatsapp.com"
        # Since it's a completely fresh load, we need a long wait
        Log-Msg "WAITING FOR FULL LOAD (18s)..."
        Start-Sleep -Seconds 18
    } else {
        Log-Msg "Using existing WhatsApp window (Found $($waTab.Count) matches)."
    }

    # Find it again after potential launch or just use existing
    $waTab = [Win32]::FindWindows("WhatsApp")
    if ($waTab.Count -gt 0) {
        $target = $waTab[0]
        
        # SMART WINDOW FOCUS:
        # If it's minimized (Iconic), restore it (9 = SW_RESTORE)
        # If it's just in the background, SHOW it (5 = SW_SHOW)
        if ([Win32]::IsIconic($target)) {
            Log-Msg "Window is minimized, restoring..."
            [Win32]::ShowWindow($target, 9)
        } else {
            Log-Msg "Window is visible, bringing to foreground..."
            [Win32]::ShowWindow($target, 5) 
        }
        [Win32]::SetForegroundWindow($target)
        Start-Sleep -Milliseconds 600

        # --- 4. HUMAN-LIKE SEARCH & PASTE ---
        Log-Msg "Searching contact manually (Zero-API)..."
        # Focus Search Bar (Ctrl + Alt + /)
        [System.Windows.Forms.SendKeys]::SendWait("^%/") 
        Start-Sleep -Milliseconds 600
        
        # Type Phone & Switch Chat
        [System.Windows.Forms.SendKeys]::SendWait("$Phone{ENTER}")
        Start-Sleep -Milliseconds 800
        
        # Paste & Send
        Log-Msg "Pasting..."
        [System.Windows.Forms.SendKeys]::SendWait("^v") 
        Start-Sleep -Milliseconds 1500
        [System.Windows.Forms.SendKeys]::SendWait("{ENTER}")
    }

    Log-Msg "DONE (Zero-API)."
} catch {
    Log-Msg "ERROR: $_"
}
