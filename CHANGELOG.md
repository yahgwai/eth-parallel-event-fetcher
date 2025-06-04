# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [1.2.3](https://github.com/yahgwai/eth-parallel-event-fetcher/compare/v0.1.0...v1.2.3) (2025-06-04)

### Bug Fixes

- correct changelog extraction regex for release notes ([cf51660](https://github.com/yahgwai/eth-parallel-event-fetcher/commit/cf516600c737cf695edd5c504fac6b38e1562fa7))

### Tests

- verify pre-commit hooks work correctly ([f32023c](https://github.com/yahgwai/eth-parallel-event-fetcher/commit/f32023cb4d0c7277e32f44edac7e08ffe38de373))

## [0.1.0](https://github.com/yahgwai/eth-parallel-event-fetcher/compare/v1.2.1...v0.1.0) (2025-06-04)

### ⚠ BREAKING CHANGES

- Package renamed from ethereum-parallel-fetcher to eth-parallel-event-fetcher

* Rename npm package to match GitHub repository name
* Revert to using GITHUB_TOKEN in release workflow

### Features

- rename package to eth-parallel-event-fetcher ([3f3ce7d](https://github.com/yahgwai/eth-parallel-event-fetcher/commit/3f3ce7d1aa0ecbbf3394d9d062b38424bd61d16a))

### Bug Fixes

- correct CodeQL initialization order in security workflow ([a51def5](https://github.com/yahgwai/eth-parallel-event-fetcher/commit/a51def5983a61cb6cfbbafc25e8c50366ae3e64e))
- correct repository URLs to match actual GitHub repo name ([6b2e761](https://github.com/yahgwai/eth-parallel-event-fetcher/commit/6b2e761322e95d6f43efdaa5abe3778f7e75e6be))
- prepare for initial release of renamed package ([72f1770](https://github.com/yahgwai/eth-parallel-event-fetcher/commit/72f177054ca63a267283a9b7ca1ff8c7058be86c))

### Continuous Integration

- use release token for pushing to protected main branch ([3164d4e](https://github.com/yahgwai/eth-parallel-event-fetcher/commit/3164d4e8fae510fccec1878529e682c7528454b3))

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
