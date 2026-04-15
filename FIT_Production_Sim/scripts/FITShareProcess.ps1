param([string]$Uri)
# Version: 5.2 (Forced Override Version)
Write-Host "--- FIT Automation (FORCED VERSION 5.2) ---" -ForegroundColor Cyan
Write-Host "Received: $Uri"

$DownloadsFolder = [System.IO.Path]::Combine($env:USERPROFILE, "Downloads")
$ReportFolder = [System.IO.Path]::Combine($DownloadsFolder, "FIT Reports")
$WaitTimeSeconds = 3 

# --- Diagnostic/Test Mode ---
if ($Uri -match "fitshare://test") {
    Write-Host "`n✅ SUCCESS: The FORCED automation script is RUNNING!" -ForegroundColor Green
    Write-Host "Reports Folder: $ReportFolder"
    Read-Host "`nPress Enter to exit this test"
    exit
}

# --- Core Logic ---
Add-Type -AssemblyName System.Windows.Forms
$wshell = New-Object -ComObject WScript.Shell

if ($Uri -match "fitshare://send\?phone=(?<phone>[^&]+)&file=(?<file>.+)") {
    $Phone = [System.Net.WebUtility]::UrlDecode($Matches['phone'])
    $FileName = [System.Net.WebUtility]::UrlDecode($Matches['file'])
} else {
    Write-Host "❌ Error: Invalid Link Format." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit
}

if (-not (Test-Path $ReportFolder)) { New-Item -ItemType Directory -Path $ReportFolder -Force | Out-Null }
$SourcePath = [System.IO.Path]::Combine($DownloadsFolder, $FileName)
$DestPath = [System.IO.Path]::Combine($ReportFolder, $FileName)

Write-Host "🔍 Locating PDF: $FileName..."
if (Test-Path $SourcePath) {
    Move-Item -Path $SourcePath -Destination $DestPath -Force
    Write-Host "✅ Moved file to Reports folder."
} elseif (Test-Path $DestPath) {
    Write-Host "ℹ️ File already in Reports folder."
} else {
    Write-Host "❌ Error: Could not find the PDF in your Downloads." -ForegroundColor Red
    Read-Host "Please check your Downloads folder and press Enter"
    exit
}

Write-Host "🚀 Opening WhatsApp Web..."
$WhatsAppUrl = "https://web.whatsapp.com/send?phone=$Phone"
Start-Process "explorer.exe" $WhatsAppUrl
Start-Sleep -Seconds $WaitTimeSeconds

Write-Host "⚙️ Focusing & Typing..."
if ($wshell.AppActivate("WhatsApp")) {
    Start-Sleep -Milliseconds 500
}

function Send-Key($keys, $delay = 200) {
    [System.Windows.Forms.SendKeys]::SendWait($keys)
    Start-Sleep -Milliseconds $delay
}

Send-Key "+{TAB}"
Send-Key "{ENTER}"
Start-Sleep -Milliseconds 500
Send-Key "{DOWN}"
Send-Key "{ENTER}"
Start-Sleep -Milliseconds 1200 
Send-Key $DestPath
Send-Key "{ENTER}"
Start-Sleep -Milliseconds 1200 
Send-Key "{ENTER}"

Write-Host "`n🏁 DONE! WhatsApp share is complete." -ForegroundColor Green
Start-Sleep -Seconds 2
