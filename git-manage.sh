#!/bin/bash

# Trinity Capital Git Management Script
# This script helps manage the two-repository setup for Trinity Capital

echo "🚀 Trinity Capital Git Management"
echo "================================="

# Check if we're in the right directory
if [ ! -f "server.js" ]; then
    echo "❌ Error: Please run this script from the Trinity Capital root directory"
    exit 1
fi

# Function to show current status
show_status() {
    echo ""
    echo "📊 Current Git Status:"
    echo "----------------------"
    git status --short
    echo ""
    echo "🔗 Git Remotes:"
    git remote -v
    echo ""
}

# Function to commit and push server files
push_server() {
    echo "🔧 Pushing Server Files to TCStudentServer..."
    
    # Copy current .gitignore to backup
    if [ -f ".gitignore" ]; then
        cp .gitignore .gitignore.backup
    fi
    
    # Use server-specific .gitignore
    cp server.gitignore .gitignore
    
    # Add server files (excluding Frontend)
    git add .
    git add server.js package.json package-lock.json public/
    git add *.js *.md *.json *.html
    git add -A
    
    # Remove Frontend from staging if it was added
    git reset HEAD Frontend/ 2>/dev/null || true
    
    echo "📝 Enter commit message for server changes:"
    read -r commit_message
    
    git commit -m "SERVER: $commit_message"
    
    # Push to server repo
    git push server master
    
    # Restore original .gitignore
    if [ -f ".gitignore.backup" ]; then
        mv .gitignore.backup .gitignore
    fi
    
    echo "✅ Server files pushed to TCStudentServer"
}

# Function to commit and push frontend files
push_frontend() {
    echo "🎨 Pushing Frontend Files to TrinityCapital..."
    
    # Copy current .gitignore to backup
    if [ -f ".gitignore" ]; then
        cp .gitignore .gitignore.backup
    fi
    
    # Use frontend-specific .gitignore
    cp frontend.gitignore .gitignore
    
    # Add only Frontend files
    git add Frontend/
    
    echo "📝 Enter commit message for frontend changes:"
    read -r commit_message
    
    git commit -m "FRONTEND: $commit_message"
    
    # Push to main repo (TrinityCapital)
    git push origin master
    
    # Restore original .gitignore
    if [ -f ".gitignore.backup" ]; then
        mv .gitignore.backup .gitignore
    fi
    
    echo "✅ Frontend files pushed to TrinityCapital"
}

# Function to push to both repositories
push_both() {
    echo "🔄 Pushing to both repositories..."
    push_server
    echo ""
    push_frontend
    echo ""
    echo "🎉 Successfully pushed to both repositories!"
}

# Function to pull from both repositories
pull_both() {
    echo "⬇️ Pulling from both repositories..."
    
    echo "Pulling from TCStudentServer..."
    git pull server master
    
    echo "Pulling from TrinityCapital..."
    git pull origin master
    
    echo "✅ Successfully pulled from both repositories!"
}

# Main menu
case "$1" in
    "status")
        show_status
        ;;
    "server")
        push_server
        ;;
    "frontend")
        push_frontend
        ;;
    "both"|"all")
        push_both
        ;;
    "pull")
        pull_both
        ;;
    "setup")
        echo "🔧 Setting up Git remotes..."
        git remote add server https://github.com/Jakeagle/TCStudentServer.git 2>/dev/null || echo "Server remote already exists"
        echo "✅ Git setup complete!"
        show_status
        ;;
    *)
        echo "Usage: $0 {status|server|frontend|both|pull|setup}"
        echo ""
        echo "Commands:"
        echo "  status    - Show current git status"
        echo "  server    - Commit and push server files to TCStudentServer"
        echo "  frontend  - Commit and push frontend files to TrinityCapital"
        echo "  both      - Push to both repositories"
        echo "  pull      - Pull from both repositories"
        echo "  setup     - Setup git remotes"
        echo ""
        echo "Examples:"
        echo "  ./git-manage.sh status"
        echo "  ./git-manage.sh server"
        echo "  ./git-manage.sh both"
        ;;
esac
