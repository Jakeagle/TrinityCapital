# Clean up TCStudentServer repository
# This script removes all unauthorized files and keeps only server-authorized files

$basePath = "c:\Users\New User\Documents\VScodeFiles\Trinity Capital Files\TrinCap Main app folder\Trinity Capital Prod Local"
$tempDir = "$basePath\temp_server_cleanup"

# Verify we have the necessary files locally
$requiredFiles = @("server\server.js", "package.json", "package-lock.json")
foreach ($file in $requiredFiles) {
    if (-not (Test-Path "$basePath\$file")) {
        Write-Host "[ERROR] Missing required file: $file" -ForegroundColor Red
        exit 1
    }
}

Write-Host "[INFO] Starting server repository cleanup..." -ForegroundColor Cyan
Write-Host "[INFO] Base path: $basePath" -ForegroundColor Cyan

# Create temporary directory
if (Test-Path $tempDir) {
    Remove-Item -Path $tempDir -Recurse -Force
}
New-Item -ItemType Directory -Path $tempDir | Out-Null
Write-Host "[STEP 1] Created temporary workspace at: $tempDir" -ForegroundColor Yellow

# Clone the server repository
cd $tempDir
Write-Host "[STEP 2] Cloning TCStudentServer repository..." -ForegroundColor Yellow
git clone https://github.com/Jakeagle/TCStudentServer.git . 2>&1 | Out-Null

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Failed to clone repository" -ForegroundColor Red
    cd $basePath
    Remove-Item -Path $tempDir -Recurse -Force
    exit 1
}

Write-Host "[STEP 3] Cleaning unauthorized files..." -ForegroundColor Yellow

# Get all items except .git
$itemsToRemove = Get-ChildItem -Force | Where-Object { $_.Name -ne ".git" }

foreach ($item in $itemsToRemove) {
    if ($item.PSIsContainer) {
        Remove-Item -Path $item.FullName -Recurse -Force
        Write-Host "  [DELETED] Directory: $($item.Name)" -ForegroundColor Gray
    } else {
        Remove-Item -Path $item.FullName -Force
        Write-Host "  [DELETED] File: $($item.Name)" -ForegroundColor Gray
    }
}

Write-Host "[STEP 4] Copying authorized server files..." -ForegroundColor Yellow

# Copy all server JS files
Copy-Item -Path "$basePath\server\*.js" -Destination . -Force
Write-Host "  [COPIED] All server JS files" -ForegroundColor Green

# Copy package files
Copy-Item -Path "$basePath\package.json" -Destination . -Force
Copy-Item -Path "$basePath\package-lock.json" -Destination . -Force
Write-Host "  [COPIED] package.json and package-lock.json" -ForegroundColor Green

# Copy public folder
if (Test-Path "$basePath\public") {
    Copy-Item -Path "$basePath\public" -Destination . -Recurse -Force
    Write-Host "  [COPIED] public folder" -ForegroundColor Green
}

# Copy server.gitignore
if (Test-Path "$basePath\server.gitignore") {
    Copy-Item -Path "$basePath\server.gitignore" -Destination . -Force
    Write-Host "  [COPIED] server.gitignore" -ForegroundColor Green
}

Write-Host "[STEP 5] Committing and pushing changes..." -ForegroundColor Yellow

# Stage all changes
git add -A
$stagedFiles = git diff --cached --name-only
if ($stagedFiles.Count -eq 0) {
    Write-Host "[INFO] No changes to commit" -ForegroundColor Cyan
} else {
    Write-Host "  [STAGED] Files to commit:" -ForegroundColor Gray
    $stagedFiles | ForEach-Object { Write-Host "    - $_" -ForegroundColor Gray }
    
    git commit -m "CLEANUP: Remove unauthorized files - keep only server files"
    Write-Host "  [COMMITTED] Changes committed" -ForegroundColor Green
    
    git push origin master
    Write-Host "  [PUSHED] Changes pushed to TCStudentServer" -ForegroundColor Green
}

Write-Host "[STEP 6] Cleaning up temporary files..." -ForegroundColor Yellow
cd $basePath
Remove-Item -Path $tempDir -Recurse -Force

Write-Host "[SUCCESS] Server repository cleanup complete!" -ForegroundColor Green
Write-Host "[INFO] Repository now contains only authorized server files:" -ForegroundColor Cyan
Write-Host "  - All JavaScript files from server/" -ForegroundColor Gray
Write-Host "  - package.json" -ForegroundColor Gray
Write-Host "  - package-lock.json" -ForegroundColor Gray
Write-Host "  - public/" -ForegroundColor Gray
Write-Host "  - server.gitignore" -ForegroundColor Gray
