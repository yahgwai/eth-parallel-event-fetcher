#!/bin/bash

# Release script for ethereum-parallel-fetcher
# This script handles the publish step after standard-version

# Check if we're in publish mode
if [ "$1" == "publish" ]; then
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
    
    # Publish to npm
    echo "Publishing to npm..."
    npm publish
    
    echo "Release complete! Version $VERSION has been published."
else
    # Full release process
    VERSION_TYPE=${1:-patch}
    
    echo "Starting release process for $VERSION_TYPE version bump..."
    
    # 1. Check for uncommitted changes
    if [ -n "$(git status --porcelain)" ]; then
        echo "ERROR: Uncommitted changes found. Please commit or stash them first."
        git status --short
        exit 1
    fi
    
    # 2. Check if we're up to date with remote
    git fetch
    if [ $(git rev-list HEAD...origin/$(git branch --show-current) --count) -ne 0 ]; then
        echo "ERROR: Local branch is not up to date with remote. Please pull/push first."
        exit 1
    fi
    
    # 3. Clean previous builds
    echo "Cleaning..."
    npm run clean
    rm -f *.tgz  # Remove any npm pack files
    
    # 4. Run tests
    echo "Running tests..."
    npm test
    if [ $? -ne 0 ]; then
        echo "Tests failed. Aborting release."
        exit 1
    fi
    
    # 5. Build fresh
    echo "Building..."
    npm run build
    if [ $? -ne 0 ]; then
        echo "Build failed. Aborting release."
        exit 1
    fi
    
    # 6. Run standard-version to bump version, update changelog, and create commit/tag
    echo "Running standard-version..."
    if [ "$VERSION_TYPE" == "first" ]; then
        npm run release:first
    else
        npm run release:$VERSION_TYPE
    fi
    
    # The postrelease script will handle the rest (push, GitHub release, npm publish)
fi