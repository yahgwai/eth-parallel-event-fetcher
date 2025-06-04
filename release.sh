#!/bin/bash

# Release script for ethereum-parallel-fetcher
# Usage: ./release.sh [patch|minor|major]

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

# 6. Version bump (creates commit and tag)
echo "Bumping version..."
npm version $VERSION_TYPE

# 7. Push commits and tags
echo "Pushing to git..."
git push
git push --tags

# 8. Get the new version
VERSION=$(node -p "require('./package.json').version")

# 9. Create GitHub release
echo "Creating GitHub release for v$VERSION..."
gh release create "v$VERSION" \
    --title "v$VERSION" \
    --generate-notes

# 10. Publish to npm
echo "Publishing to npm..."
npm publish

echo "Release complete! Version $VERSION has been published."