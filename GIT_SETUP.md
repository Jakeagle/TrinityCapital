# Trinity Capital - Git Repository Management

This project uses a **two-repository system** to separate server-side and frontend code:

## 📁 Repository Structure

- **🔧 TCStudentServer** (`https://github.com/Jakeagle/TCStudentServer`)
  - Server files (`server.js`, `package.json`, etc.)
  - Public folder
  - Database scripts and utilities
  - Configuration files

- **🎨 TrinityCapital** (`https://github.com/Jakeagle/TrinityCapital`) 
  - Frontend folder (HTML, CSS, JavaScript)
  - Student-facing interface
  - Client-side components

## 🚀 Quick Start Commands

### Windows (Recommended)
```bash
# Check current status
git-manage.bat status

# Push server changes only
git-manage.bat server

# Push frontend changes only  
git-manage.bat frontend

# Push to both repositories
git-manage.bat both

# Pull from both repositories
git-manage.bat pull
```

### Linux/Mac
```bash
# Make executable (first time only)
chmod +x git-manage.sh

# Check current status
./git-manage.sh status

# Push server changes only
./git-manage.sh server

# Push frontend changes only
./git-manage.sh frontend  

# Push to both repositories
./git-manage.sh both

# Pull from both repositories
./git-manage.sh pull
```

## 📋 Workflow Examples

### 1. Made server-side changes (database, API, etc.)
```bash
git-manage.bat server
# Enter commit message when prompted
```

### 2. Made frontend changes (UI, styles, client JS)
```bash
git-manage.bat frontend  
# Enter commit message when prompted
```

### 3. Made changes to both server and frontend
```bash
git-manage.bat both
# Enter commit message for server changes
# Enter commit message for frontend changes
```

### 4. Want to sync with latest changes
```bash
git-manage.bat pull
```

## 🔧 Manual Git Commands (Advanced)

If you prefer manual control:

### Server Repository Commands
```bash
# Add server remote (one-time setup)
git remote add server https://github.com/Jakeagle/TCStudentServer.git

# Push server files
cp server.gitignore .gitignore
git add . --exclude=Frontend/
git commit -m "SERVER: Your commit message"
git push server master
```

### Frontend Repository Commands  
```bash
# Push frontend files
cp frontend.gitignore .gitignore
git add Frontend/
git commit -m "FRONTEND: Your commit message"  
git push origin master
```

## ⚙️ Setup (One-time)

If you're setting up on a new machine:

```bash
# Clone the main repo
git clone https://github.com/Jakeagle/TrinityCapital.git
cd "Trinity Capital Prod Local"

# Add server remote
git remote add server https://github.com/Jakeagle/TCStudentServer.git

# Verify setup
git remote -v
```

## 🛠️ Files Created for Git Management

- `git-manage.bat` - Windows script for managing both repos
- `git-manage.sh` - Linux/Mac script for managing both repos  
- `server.gitignore` - .gitignore template for server repo
- `frontend.gitignore` - .gitignore template for frontend repo
- `GIT_SETUP.md` - This documentation

## 🚨 Important Notes

1. **Never manually edit .gitignore** - The scripts handle this automatically
2. **Always use the management scripts** - They prevent conflicts between repos
3. **Commit frequently** - Smaller commits are easier to track across two repos
4. **Test locally first** - Make sure changes work before pushing

## 🐛 Troubleshooting

### "Permission denied" on scripts
```bash
# Windows: Run as administrator
# Linux/Mac: chmod +x git-manage.sh
```

### "Remote already exists" error
```bash
# Remove and re-add the remote
git remote remove server
git remote add server https://github.com/Jakeagle/TCStudentServer.git
```

### Changes appear in wrong repository
```bash
# Check which files were committed
git log --name-only -1

# If needed, reset and use correct script
git reset HEAD~1
git-manage.bat [server|frontend]
```

---

**Need help?** Contact the development team or check the Trinity Capital documentation.
