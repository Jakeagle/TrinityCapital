# Clean up TrinityCapital (Frontend) repository
# This script removes all unauthorized files and keeps only frontend-authorized files
# Handles conflicts from manual changes

$basePath = "c:\Users\New User\Documents\VScodeFiles\Trinity Capital Files\TrinCap Main app folder\Trinity Capital Prod Local"
$tempDir = "$basePath\temp_frontend_cleanup"

Write-Host "[INFO] Starting frontend repository cleanup..." -ForegroundColor Cyan
Write-Host "[INFO] Base path: $basePath" -ForegroundColor Cyan
Write-Host "[WARNING] This will handle conflicts by preferring local changes" -ForegroundColor Yellow

# Verify we have the necessary files locally
if (-not (Test-Path "$basePath\Frontend")) {
    Write-Host "[ERROR] Frontend folder not found in local repository" -ForegroundColor Red
    exit 1
}

Write-Host "[STEP 1] Created temporary workspace..." -ForegroundColor Yellow

# Create temporary directory
if (Test-Path $tempDir) {
    Remove-Item -Path $tempDir -Recurse -Force
}
New-Item -ItemType Directory -Path $tempDir | Out-Null

# Clone the frontend repository
cd $tempDir
Write-Host "[STEP 2] Cloning TrinityCapital (frontend) repository..." -ForegroundColor Yellow
git clone https://github.com/Jakeagle/TrinityCapital.git . 2>&1 | Out-Null

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Failed to clone repository" -ForegroundColor Red
    cd $basePath
    Remove-Item -Path $tempDir -Recurse -Force
    exit 1
}

Write-Host "[STEP 3] Cleaning unauthorized files..." -ForegroundColor Yellow

# Get all items except .git and Frontend
$itemsToRemove = Get-ChildItem -Force | Where-Object { $_.Name -ne ".git" -and $_.Name -ne "Frontend" }

foreach ($item in $itemsToRemove) {
    try {
        if ($item.PSIsContainer) {
            Remove-Item -Path $item.FullName -Recurse -Force
            Write-Host "  [DELETED] Directory: $($item.Name)" -ForegroundColor Gray
        } else {
            Remove-Item -Path $item.FullName -Force
            Write-Host "  [DELETED] File: $($item.Name)" -ForegroundColor Gray
        }
    }
    catch {
        Write-Host "  [WARN] Could not delete $($item.Name): $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

Write-Host "[STEP 4] Updating Frontend folder with local changes..." -ForegroundColor Yellow

# Remove existing Frontend folder if it exists
if (Test-Path "Frontend") {
    Remove-Item -Path "Frontend" -Recurse -Force
    Write-Host "  [REMOVED] Old Frontend folder" -ForegroundColor Gray
}

# Copy the local Frontend folder
Copy-Item -Path "$basePath\Frontend" -Destination . -Recurse -Force
Write-Host "  [COPIED] Frontend folder with all local changes" -ForegroundColor Green

# Copy frontend.gitignore if it exists
if (Test-Path "$basePath\frontend.gitignore") {
    Copy-Item -Path "$basePath\frontend.gitignore" -Destination . -Force
    Write-Host "  [COPIED] frontend.gitignore" -ForegroundColor Green
}

# Copy index.html if it exists
if (Test-Path "$basePath\index.html") {
    Copy-Item -Path "$basePath\index.html" -Destination . -Force
    Write-Host "  [COPIED] index.html" -ForegroundColor Green
}

Write-Host "[STEP 5] Staging and committing changes..." -ForegroundColor Yellow

# Stage all changes
git add -A

$stagedFiles = git diff --cached --name-only
if ($stagedFiles.Count -eq 0 -or [string]::IsNullOrWhiteSpace($stagedFiles)) {
    Write-Host "[INFO] No changes to commit" -ForegroundColor Cyan
} else {
    Write-Host "  [STAGED] Changes detected:" -ForegroundColor Gray
    $stagedFiles | ForEach-Object { 
        if (-not [string]::IsNullOrWhiteSpace($_)) {
            Write-Host "    - $_" -ForegroundColor Gray 
        }
    }
    
    Write-Host "[STEP 6] Committing changes..." -ForegroundColor Yellow
    git commit -m "CLEANUP: Remove unauthorized files - keep only frontend files and resolve conflicts"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  [COMMITTED] Changes committed successfully" -ForegroundColor Green
        
        Write-Host "[STEP 7] Pushing to TrinityCapital repository..." -ForegroundColor Yellow
        git push origin master
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  [PUSHED] Changes pushed to TrinityCapital" -ForegroundColor Green
        } else {
            Write-Host "  [ERROR] Failed to push changes - you may need to resolve conflicts manually" -ForegroundColor Red
            Write-Host "  [INFO] Temporary repo still at: $tempDir" -ForegroundColor Cyan
            exit 1
        }
    } else {
        Write-Host "  [ERROR] Commit failed" -ForegroundColor Red
        exit 1
    }
}

Write-Host "[STEP 8] Cleaning up temporary files..." -ForegroundColor Yellow
cd $basePath
Remove-Item -Path $tempDir -Recurse -Force

Write-Host "[SUCCESS] Frontend repository cleanup complete!" -ForegroundColor Green
Write-Host "[INFO] Repository now contains only authorized frontend files:" -ForegroundColor Cyan
Write-Host "  - Frontend/" -ForegroundColor Gray
Write-Host "  - index.html (if present)" -ForegroundColor Gray
Write-Host "  - frontend.gitignore (if present)" -ForegroundColor Gray
Write-Host "" -ForegroundColor Gray
Write-Host "[INFO] All server files, documentation, and development scripts have been removed." -ForegroundColor Cyan
