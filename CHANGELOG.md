# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [1.2.1](https://github.com/yahgwai/eth-parallel-event-fetcher/compare/v1.2.0...v1.2.1) (2025-06-04)

### Bug Fixes

- correct CI workflow name in release trigger ([567e1b6](https://github.com/yahgwai/eth-parallel-event-fetcher/commit/567e1b61c2a04095f78cb079f78c5771adc87f50))
- correct workflow names and add build step for CodeQL ([8e9eab6](https://github.com/yahgwai/eth-parallel-event-fetcher/commit/8e9eab6c694087e80b44776b619378c07fc4fab3))
- remove unused ts-expect-error directive in test setup ([ad75a6e](https://github.com/yahgwai/eth-parallel-event-fetcher/commit/ad75a6ebdbc5b1b90007d8146d67783c0d9470a7))

### Build System

- add pre-release checks to prevent releases with uncommitted changes ([650db4e](https://github.com/yahgwai/eth-parallel-event-fetcher/commit/650db4effa22facf21ee34e4676e52737549fcb2))

### Continuous Integration

- automate releases on push to main ([dd6065f](https://github.com/yahgwai/eth-parallel-event-fetcher/commit/dd6065f02e6b79891d492b7af70f0474ab3dc86d))
- improve CI/CD workflow architecture ([b4e4854](https://github.com/yahgwai/eth-parallel-event-fetcher/commit/b4e48549039218585e5cbec338afbb5eab822ad2))

## [1.2.0](https://github.com/yahgwai/eth-parallel-event-fetcher/compare/v1.1.4...v1.2.0) (2025-06-04)

### ⚠ BREAKING CHANGES

- Minimum Node.js version is now 14.0.0

### Build System

- add comprehensive CI/CD and code quality infrastructure ([29780ab](https://github.com/yahgwai/eth-parallel-event-fetcher/commit/29780abfc62b8c340025fa693de1a01c3c79ad99))

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
