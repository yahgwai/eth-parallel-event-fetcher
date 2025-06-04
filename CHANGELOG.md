# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [1.1.4](https://github.com/yahgwai/eth-parallel-event-fetcher/compare/v1.1.3...v1.1.4) (2025-06-04)

### Bug Fixes

- remove forceExit flag from Jest tests ([c2de378](https://github.com/yahgwai/eth-parallel-event-fetcher/commit/c2de37854f64559496642e75005050564f825c48))

### [1.1.3](https://github.com/yahgwai/eth-parallel-event-fetcher/compare/v1.1.2...v1.1.3) (2025-06-04)

### Bug Fixes

- ensure publish script runs after standard-version ([28ca3c8](https://github.com/yahgwai/eth-parallel-event-fetcher/commit/28ca3c82a691f04f7dba2843e92bc20fee1d770e))

### [1.1.2](https://github.com/yahgwai/eth-parallel-event-fetcher/compare/v1.1.1...v1.1.2) (2025-06-04)

### Code Refactoring

- rename release.sh to publish.sh for clarity ([ae673f8](https://github.com/yahgwai/eth-parallel-event-fetcher/commit/ae673f8de8b8309c487fc0ed1b32187d31a8e3ae))

### [1.1.1](https://github.com/yahgwai/eth-parallel-event-fetcher/compare/v1.1.0...v1.1.1) (2025-06-04)

### Build System

- adopt conventional commits and standard-version ([9efb288](https://github.com/yahgwai/eth-parallel-event-fetcher/commit/9efb2882c96c33e4441aa12c7e879258341bc6bf))

## [1.1.0](https://github.com/yahgwai/eth-parallel-event-fetcher/compare/v1.0.1...v1.1.0) (2025-06-04)

### ⚠ BREAKING CHANGES

- remove processor pattern from event fetcher API

### Features

- remove processor pattern from fetchEvents API ([7ed993f](https://github.com/yahgwai/eth-parallel-event-fetcher/commit/7ed993f))

### Code Refactoring

- clean up codebase after processor removal ([251b269](https://github.com/yahgwai/eth-parallel-event-fetcher/commit/251b269))

## [1.0.1](https://github.com/yahgwai/eth-parallel-event-fetcher/compare/v1.0.0...v1.0.1) (2025-06-04)

### Bug Fixes

- fix CI test hanging issue caused by O(n²) complexity in event processor ([36316ea](https://github.com/yahgwai/eth-parallel-event-fetcher/commit/36316ea))
- enable all previously skipped tests ([9131538](https://github.com/yahgwai/eth-parallel-event-fetcher/commit/9131538))

## 1.0.0 (2025-06-04)

### Features

- initial release of ethereum-parallel-fetcher
- parallel event fetching with configurable concurrency
- automatic retry logic with exponential backoff
- progress tracking and callbacks
- TypeScript support
- environment variable configuration
