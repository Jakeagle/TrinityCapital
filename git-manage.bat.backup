@echo off
REM Trinity Capital Git Management Script for Windows
REM This script helps manage the two-repository setup for Trinity Capital

echo 🚀 Trinity Capital Git Management
echo =================================

REM Check if we're in the right directory
if not exist "server.js" (
    echo ❌ Error: Please run this script from the Trinity Capital root directory
    exit /b 1
)

if "%1"=="status" goto :show_status
if "%1"=="server" goto :push_server
if "%1"=="frontend" goto :push_frontend
if "%1"=="both" goto :push_both
if "%1"=="all" goto :push_both
if "%1"=="pull" goto :pull_both
if "%1"=="setup" goto :setup
goto :usage

:show_status
echo.
echo 📊 Current Git Status:
echo ----------------------
git status --short
echo.
echo 🔗 Git Remotes:
git remote -v
echo.
goto :end

:push_server
echo 🔧 Pushing Server Files to TCStudentServer...

REM Backup current .gitignore
if exist ".gitignore" copy ".gitignore" ".gitignore.backup" >nul

REM Use server-specific .gitignore
copy "server.gitignore" ".gitignore" >nul

REM Add server files (excluding Frontend)
git add .
git add server.js package.json package-lock.json public/
git add *.js *.md *.json *.html

REM Remove Frontend from staging if it was added
git reset HEAD Frontend/ 2>nul

set /p commit_message="📝 Enter commit message for server changes: "

git commit -m "SERVER: %commit_message%"

REM Push to server repo
git push server master

REM Restore original .gitignore
if exist ".gitignore.backup" move ".gitignore.backup" ".gitignore" >nul

echo ✅ Server files pushed to TCStudentServer
goto :end

:push_frontend
echo 🎨 Pushing Frontend Files to TrinityCapital...

REM Backup current .gitignore
if exist ".gitignore" copy ".gitignore" ".gitignore.backup" >nul

REM Use frontend-specific .gitignore
copy "frontend.gitignore" ".gitignore" >nul

REM Add only Frontend files
git add Frontend/

set /p commit_message="📝 Enter commit message for frontend changes: "

git commit -m "FRONTEND: %commit_message%"

REM Push to main repo (TrinityCapital)
git push origin master

REM Restore original .gitignore
if exist ".gitignore.backup" move ".gitignore.backup" ".gitignore" >nul

echo ✅ Frontend files pushed to TrinityCapital
goto :end

:push_both
echo 🔄 Pushing to both repositories...
call :push_server
echo.
call :push_frontend
echo.
echo 🎉 Successfully pushed to both repositories!
goto :end

:pull_both
echo ⬇️ Pulling from both repositories...

echo Pulling from TCStudentServer...
git pull server master

echo Pulling from TrinityCapital...
git pull origin master

echo ✅ Successfully pulled from both repositories!
goto :end

:setup
echo 🔧 Setting up Git remotes...
git remote add server https://github.com/Jakeagle/TCStudentServer.git 2>nul
if errorlevel 1 echo Server remote already exists
echo ✅ Git setup complete!
call :show_status
goto :end

:usage
echo Usage: %0 {status^|server^|frontend^|both^|pull^|setup}
echo.
echo Commands:
echo   status    - Show current git status
echo   server    - Commit and push server files to TCStudentServer
echo   frontend  - Commit and push frontend files to TrinityCapital
echo   both      - Push to both repositories
echo   pull      - Pull from both repositories
echo   setup     - Setup git remotes
echo.
echo Examples:
echo   %0 status
echo   %0 server
echo   %0 both
goto :end

:end
