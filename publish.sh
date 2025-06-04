#!/bin/bash

# Publish script for ethereum-parallel-fetcher
# Called automatically after standard-version completes
# Handles: git push, GitHub release creation, npm publish

echo "Publishing release..."

# Get the new version
VERSION=$(node -p "require('./package.json').version")

# Extract the latest release notes from CHANGELOG.md
# Get content between the first version header and the next version header
NOTES=$(awk '/^## \[/{if(p)exit;p=1;next} p' CHANGELOG.md)

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