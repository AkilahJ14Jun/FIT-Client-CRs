# Register the fitshare:// protocol handler for WhatsApp automation
# RUN AS ADMINISTRATOR

$ProtocolName = "fitshare"
$PowerShellPath = "C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe"
$ScriptPath = "g:\bobby\GitHub\FIT OpBal Fix - Copy\scripts\FITShareFinal.ps1"

# The command needs to be VERY robust to handle the full URI string with special characters
# We use -WindowStyle Hidden to prevent the PowerShell console from flashing
$Command = "`"$PowerShellPath`" -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$ScriptPath`" `"%1`""

Write-Host "Registering protocol: $ProtocolName"
Write-Host "Target Script: $ScriptPath"

try {
    # Create the Registry Structure
    $RegPath = "HKCU:\Software\Classes\$ProtocolName"
    if (Test-Path $RegPath) { Remove-Item $RegPath -Recurse -Force }
    
    New-Item $RegPath -Force | Out-Null
    Set-ItemProperty $RegPath "(Default)" "URL:FIT WhatsApp Protocol"
    Set-ItemProperty $RegPath "URL Protocol" ""
    
    $ShellPath = New-Item "$RegPath\shell\open\command" -Force
    Set-ItemProperty $ShellPath.PSPath "(Default)" $Command
    
    # --- ADD BROWSER POLICIES TO AVOID PROMPT ---
    # This allows fitshare:// to open without the "Open this app?" confirmation click
    $policyValue = '[{"allowed_origins": ["*"], "protocol": "fitshare"}]'
    
    # 1. Edge
    $EdgePolicyPath = "HKLM:\SOFTWARE\Policies\Microsoft\Edge"
    if (!(Test-Path $EdgePolicyPath)) { New-Item $EdgePolicyPath -Force | Out-Null }
    Set-ItemProperty $EdgePolicyPath "AutoLaunchProtocolsFromOrigins" $policyValue -Force
    
    # 2. Chrome
    $ChromePolicyPath = "HKLM:\SOFTWARE\Policies\Google\Chrome"
    if (!(Test-Path $ChromePolicyPath)) { New-Item $ChromePolicyPath -Force | Out-Null }
    Set-ItemProperty $ChromePolicyPath "AutoLaunchProtocolsFromOrigins" $policyValue -Force

    Write-Host "SUCCESS: Protocol Registered and Browser Policies Applied!" -ForegroundColor Green
    Write-Host "New Command: $Command"
} catch {
    Write-Host "ERROR: Failed to register protocol. Try running as Administrator." -ForegroundColor Red
    Write-Error $_
}

Start-Sleep -Seconds 5
