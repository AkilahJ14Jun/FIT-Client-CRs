<#
.SYNOPSIS
    FIT Database Backup & Restore Script

.DESCRIPTION
    Creates timestamped MySQL backups using Docker exec.
    Can also restore from a backup file.

.EXAMPLE
    # Backup
    .\backup-restore.ps1 -Action backup

    # Restore from specific backup
    .\backup-restore.ps1 -Action restore -BackupFile "C:\FIT\backups\fit_db_2026-04-11_083000.sql"

    # List available backups
    .\backup-restore.ps1 -Action list
#>

param(
    [ValidateSet("backup", "restore", "list")]
    [string]$Action = "backup",

    [string]$BackupDir = "C:\FIT\backups",
    [string]$BackupFile,
    [string]$ContainerName = "fit_mysql_db",
    [string]$DbName = "fit_db",
    [string]$DbUser = "root",
    [string]$DbPass = "root"
)

$ErrorActionPreference = "Stop"

# Ensure backup directory exists
New-Item $BackupDir -ItemType Directory -Force | Out-Null

switch ($Action) {
    "backup" {
        $timestamp = Get-Date -Format "yyyy-MM-dd_HHmmss"
        $outFile   = Join-Path $BackupDir "fit_db_$timestamp.sql"

        Write-Host "Backing up '$DbName' from container '$ContainerName' ..." -ForegroundColor Cyan
        docker exec $ContainerName mysqldump -u$DbUser -p$DbPass --single-transaction --routines --triggers $DbName > $outFile 2>$null

        if ($LASTEXITCODE -eq 0 -and (Test-Path $outFile) -and (Get-Item $outFile).Length -gt 100) {
            $sizeMB = [math]::Round((Get-Item $outFile).Length / 1MB, 2)
            Write-Host "✓ Backup saved: $outFile ($sizeMB MB)" -ForegroundColor Green
        } else {
            Write-Host "✗ Backup may have failed — check Docker and MySQL status" -ForegroundColor Red
        }

        # Cleanup: keep last 30 backups
        $backups = Get-ChildItem $BackupDir -Filter "fit_db_*.sql" | Sort-Object LastWriteTime -Descending
        if ($backups.Count -gt 30) {
            $backups | Select-Object -Skip 30 | Remove-Item -Force
            Write-Host "  Cleaned up old backups (kept latest 30)" -ForegroundColor DarkGray
        }
    }

    "restore" {
        if (-not $BackupFile) {
            Write-Host "ERROR: Specify -BackupFile path" -ForegroundColor Red
            exit 1
        }
        if (-not (Test-Path $BackupFile)) {
            Write-Host "ERROR: Backup file not found: $BackupFile" -ForegroundColor Red
            exit 1
        }

        Write-Host "⚠ WARNING: This will OVERWRITE the current '$DbName' database!" -ForegroundColor Yellow
        $confirm = Read-Host "Type 'yes' to continue"
        if ($confirm -ne "yes") {
            Write-Host "Restore cancelled." -ForegroundColor DarkGray
            exit 0
        }

        Write-Host "Restoring from $BackupFile ..." -ForegroundColor Cyan
        Get-Content $BackupFile -Raw | docker exec -i $ContainerName mysql -u$DbUser -p$DbPass $DbName 2>$null

        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ Database restored successfully" -ForegroundColor Green
            Write-Host "  Restart the backend service: nssm restart fit-backend" -ForegroundColor DarkGray
        } else {
            Write-Host "✗ Restore failed — check the backup file and MySQL status" -ForegroundColor Red
        }
    }

    "list" {
        $backups = Get-ChildItem $BackupDir -Filter "fit_db_*.sql" -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending
        if ($backups.Count -eq 0) {
            Write-Host "No backups found in $BackupDir" -ForegroundColor Yellow
        } else {
            Write-Host "Available backups in $BackupDir`:" -ForegroundColor Cyan
            Write-Host ""
            $backups | ForEach-Object {
                $sizeMB = [math]::Round($_.Length / 1MB, 2)
                Write-Host "  $($_.LastWriteTime.ToString('yyyy-MM-dd HH:mm:ss'))  |  $sizeMB MB  |  $($_.Name)" -ForegroundColor White
            }
            Write-Host "`n  Total: $($backups.Count) backup(s)" -ForegroundColor DarkGray
        }
    }
}
