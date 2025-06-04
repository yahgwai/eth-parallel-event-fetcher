# Contributing

## Commit Message Guidelines

This project uses [Conventional Commits](https://www.conventionalcommits.org/) for automated versioning and changelog generation.

### Commit Message Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types

- **feat**: A new feature (triggers minor version bump)
- **fix**: A bug fix (triggers patch version bump)
- **docs**: Documentation only changes
- **style**: Changes that do not affect the meaning of the code
- **refactor**: A code change that neither fixes a bug nor adds a feature
- **perf**: A code change that improves performance
- **test**: Adding missing tests or correcting existing tests
- **build**: Changes that affect the build system or external dependencies
- **ci**: Changes to CI configuration files and scripts
- **chore**: Other changes that don't modify src or test files

### Breaking Changes

For breaking changes, add `BREAKING CHANGE:` in the commit body or footer:

```
feat: remove processor pattern from API

BREAKING CHANGE: fetchEvents() no longer accepts a processor parameter
```

This will trigger a major version bump.

### Examples

```bash
# Feature
git commit -m "feat: add support for custom retry strategies"

# Bug fix
git commit -m "fix: handle empty event arrays correctly"

# Breaking change
git commit -m "feat: simplify event fetcher API

BREAKING CHANGE: removed processor parameter from fetchEvents method"

# Documentation
git commit -m "docs: update examples for new API"
```

## Release Process

1. Ensure all changes are committed using conventional commits
2. Run the release command:
   ```bash
   npm run release        # auto-detect version bump from commits
   npm run release:patch  # force patch release
   npm run release:minor  # force minor release
   npm run release:major  # force major release
   ```
3. The script will:
   - Run tests
   - Build the project
   - Update version in package.json
   - Generate/update CHANGELOG.md
   - Create a commit and tag
   - Push to GitHub
   - Create GitHub release with proper notes
   - Publish to npm