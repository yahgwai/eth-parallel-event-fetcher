#!/bin/sh
# Setup script to configure Git to use custom hooks

echo "Setting up Git hooks..."

# Configure Git to use .githooks directory
git config core.hooksPath .githooks

echo "Git hooks configured successfully!"
echo "Hooks location: .githooks/"
echo ""
echo "Available hooks:"
echo "  - pre-commit: Runs linting and formatting checks"
echo "  - pre-push: Runs tests and build"
echo ""
echo "To disable hooks temporarily, use: git config core.hooksPath .git/hooks"
echo "To re-enable hooks, run this script again"