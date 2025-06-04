#!/bin/bash

# Publish script for ethereum-parallel-fetcher
# Called automatically after standard-version completes
# Handles: git push, GitHub release creation, npm publish

echo "Publishing release..."

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo "Error: There are uncommitted changes in the repository."
    echo "Please commit or stash all changes before releasing."
    git status --short
    exit 1
fi

# Check if we're on main branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" != "main" ]; then
    echo "Error: Releases must be done from the main branch."
    echo "Current branch: $CURRENT_BRANCH"
    exit 1
fi

# Get the new version
VERSION=$(node -p "require('./package.json').version")

# Extract the latest release notes from CHANGELOG.md
# Get content between the first version header and the next version header
NOTES=$(awk '/^### \['"$VERSION"'\]/ {flag=1; next} /^###? \[/ && flag {exit} flag' CHANGELOG.md)

# Push commits and tags
echo "Pushing to git..."
git push --follow-tags origin main

# Create GitHub release using the extracted notes
echo "Creating GitHub release for v$VERSION..."
echo "$NOTES" | gh release create "v$VERSION" \
    --title "v$VERSION" \
    --notes-file -

# Build before publishing
echo "Building..."
npm run build

# Publish to npm
echo "Publishing to npm..."
npm publish

echo "Release complete! Version $VERSION has been published."