# Reorganize Trinity Capital project structure
$basePath = "c:\Users\New User\Documents\VScodeFiles\Trinity Capital Files\TrinCap Main app folder\Trinity Capital Prod Local"
Set-Location $basePath

# Move server JavaScript files
$serverFiles = @("server.js", "schedulerManager.js", "catchupScheduler.js", "githubWebhookHandler.js", "sampleDataManager.js", "timer_server_endpoints.js", "updated_sdsm_endpoint.js", "quickTimeManager.js")

Write-Host "Moving server files..." -ForegroundColor Cyan
foreach ($file in $serverFiles) {
    if (Test-Path $file) {
        Move-Item -Path $file -Destination "server\" -Force
        Write-Host "[MOVED] $file"
    }
}

# Move documentation files to appropriate folders
Write-Host "`nMoving documentation files..." -ForegroundColor Cyan

# Quick Time related docs
$quickTimeDocs = @("QUICKTIME_ARCHITECTURE.md", "QUICKTIME_FLOW_DIAGRAM.md", "QUICKTIME_QUICK_REFERENCE.md", "QUICKTIME_SUMMARY.md", "QUICKTIME_TESTING_GUIDE.md", "QUICKTIME_VISUAL_SUMMARY.md", "QUICK_REFERENCE_LESSON_CLEANUP.md", "QUICK_TIME_MODE_DOCUMENTATION.md", "QUICK_TIME_MODE_QUICK_START.md")
foreach ($doc in $quickTimeDocs) {
    if (Test-Path $doc) {
        Move-Item -Path $doc -Destination "documents\quick-time\" -Force
        Write-Host "[MOVED] $doc to quick-time"
    }
}

# Sample System docs
$sampleDocs = @("README_SAMPLE_SYSTEM.md", "SAMPLE_SYSTEM_DEPLOYMENT_CHECKLIST.md", "SAMPLE_SYSTEM_DIAGRAMS.md", "SAMPLE_SYSTEM_DOCUMENTATION.md", "SAMPLE_SYSTEM_IMPLEMENTATION_SUMMARY.md", "SAMPLE_SYSTEM_QUICK_GUIDE.md")
foreach ($doc in $sampleDocs) {
    if (Test-Path $doc) {
        Move-Item -Path $doc -Destination "documents\sample-system\" -Force
        Write-Host "[MOVED] $doc to sample-system"
    }
}

# Lesson System docs
$lessonDocs = @("LESSON_CLEANUP_IMPLEMENTATION.md", "LESSON_STRUCTURE_FIX_LOG.md", "LESSON_SYSTEM_FIX.md")
foreach ($doc in $lessonDocs) {
    if (Test-Path $doc) {
        Move-Item -Path $doc -Destination "documents\lesson-system\" -Force
        Write-Host "[MOVED] $doc to lesson-system"
    }
}

# Fix/Bug logs
$fixDocs = @("BUG_FIXES_SUMMARY.md", "CRITICAL_FIX_EXPLANATION.md", "ILGE_FIX_SUMMARY.md")
foreach ($doc in $fixDocs) {
    if (Test-Path $doc) {
        Move-Item -Path $doc -Destination "documents\fix-logs\" -Force
        Write-Host "[MOVED] $doc to fix-logs"
    }
}

# Debugging/Development guides
$debugDocs = @("DEBUGGING_GUIDE.md", "bug_fix_workflow.md")
foreach ($doc in $debugDocs) {
    if (Test-Path $doc) {
        Move-Item -Path $doc -Destination "documents\debugging\" -Force
        Write-Host "[MOVED] $doc to debugging"
    }
}

# Architecture/Setup docs
$archDocs = @("DOCUMENTATION_INDEX.md", "BUTTON_FLOW_REFERENCE.md", "CLEANUP_MOVED_TO_LOGIN.md", "IMPLEMENTATION_CHECKLIST.md", "PROGRESS.md", "SYSTEM_COMPLETE.md")
foreach ($doc in $archDocs) {
    if (Test-Path $doc) {
        Move-Item -Path $doc -Destination "documents\architecture\" -Force
        Write-Host "[MOVED] $doc to architecture"
    }
}

Write-Host "`n[COMPLETE] Reorganization complete!" -ForegroundColor Green
