$ErrorActionPreference = "Stop"

Write-Host "Building Frontend..."
npm run build

Write-Host "Building Backend..."
cd server
npm run build
cd ..

Write-Host "Creating deployment folder..."
$deployDir = "deploy"
if (Test-Path $deployDir) {
    Remove-Item -Recurse -Force $deployDir
}
New-Item -ItemType Directory -Path $deployDir | Out-Null
New-Item -ItemType Directory -Path "$deployDir\server" | Out-Null

Write-Host "Copying files to deployment folder..."
# Copy frontend dist
Copy-Item -Recurse -Force "dist" "$deployDir\dist"

# Copy backend dist
Copy-Item -Recurse -Force "server\dist" "$deployDir\server\dist"

# Copy backend package.json for npm install in production
Copy-Item -Force "server\package.json" "$deployDir\server\package.json"

# Create an optional start script for the user
$startScriptContent = @"
@echo off
echo Installing production dependencies...
cd server
call npm install --omit=dev
echo Starting the server...
call npm run serve
pause
"@

Set-Content -Path "$deployDir\start-production.bat" -Value $startScriptContent

Write-Host "Creating deploy.zip..."
$zipPath = "deploy.zip"
if (Test-Path $zipPath) {
    Remove-Item -Force $zipPath
}
Compress-Archive -Path "$deployDir\*" -DestinationPath $zipPath

Write-Host "Done! You can take 'deploy.zip' and extract it directly over 'E:\Fit' on the production server."
Write-Host "No source code is included, only the compiled artifacts."
