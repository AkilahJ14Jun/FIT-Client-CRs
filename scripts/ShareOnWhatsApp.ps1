param([string]$Uri)
# Version: 4.1-Simple
Write-Host "--- FIT Automation Start ---" -ForegroundColor Cyan
Write-Host "Received: $Uri"
# --- Configuration ---
$DownloadsFolder = [System.IO.Path]::Combine($env:USERPROFILE, "Downloads")
$ReportFolder = [System.IO.Path]::Combine($DownloadsFolder, "FIT Reports")
$WaitTimeSeconds = 3 
# --- Diagnostic Test ---
if ($Uri -match "fitshare://test") {
    Write-Host "`n✅ Automation script is RUNNING correctly!" -ForegroundColor Green
    Write-Host "Reports Folder: $ReportFolder"
    Read-Host "Press Enter to exit"
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
if ($Uri -match "fitshare://send\?phone=(?<phone>[^&]+)&file=(?<file>.+)") {
    $Phone = [System.Net.WebUtility]::UrlDecode($Matches['phone'])
    $FileName = [System.Net.WebUtility]::UrlDecode($Matches['file'])
} else {
    Write-Host "❌ Error: Invalid URI format." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit
}
# --- 1. Find & Move File ---
if (-not (Test-Path $ReportFolder)) {
    New-Item -ItemType Directory -Path $ReportFolder -Force | Out-Null
}
$SourcePath = [System.IO.Path]::Combine($DownloadsFolder, $FileName)
$DestPath = [System.IO.Path]::Combine($ReportFolder, $FileName)
Write-Host "🔍 Searching for $FileName..."
if (Test-Path $SourcePath) {
    Move-Item -Path $SourcePath -Destination $DestPath -Force
    Write-Host "✅ Moved to Reports folder."
} elseif (Test-Path $DestPath) {
    Write-Host "ℹ️ File already in Reports folder."
} else {
    Write-Host "❌ Error: File not found in Downloads." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit
}
# --- 2. Share ---
$WhatsAppUrl = "https://web.whatsapp.com/send?phone=$Phone"
Start-Process "explorer.exe" $WhatsAppUrl
Start-Sleep -Seconds $WaitTimeSeconds
if ($wshell.AppActivate("WhatsApp")) {
    Write-Host "⚙️ Typing..."
} else {
    Write-Host "⚠️ Please click on WhatsApp window!"
    Start-Sleep -Seconds 2
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
Write-Host "🏁 Done!"
Start-Sleep -Seconds 2
