#!/bin/bash

# Setup Git and Push to GitHub
# Run this script to initialize git and push to the repository

cd /Users/parthjindal/Parth_Projects/support-ops-platform

# Initialize git if not already initialized
if [ ! -d .git ]; then
    git init
    echo "Git repository initialized"
fi

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: SupportOps Platform foundation

- Monorepo structure with npm workspaces
- Shared package with TypeScript types and Zod schemas
- Ticket service foundation with Mongoose models
- Comprehensive README with architecture decisions
- Implementation guide for remaining work"

# Add remote
git remote add origin https://github.com/ff-asce/support-ops-platform.git

# Push to main branch
git branch -M main
git push -u origin main

echo "✅ Code pushed to GitHub successfully!"

# Made with Bob
