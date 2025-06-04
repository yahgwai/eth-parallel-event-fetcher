# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [1.2.6](https://github.com/yahgwai/eth-parallel-event-fetcher/compare/v1.2.5...v1.2.6) (2025-06-04)


### Bug Fixes

* add security-events permission to CodeQL workflow ([da5caee](https://github.com/yahgwai/eth-parallel-event-fetcher/commit/da5caee3c73e34e1dbbeeef7fdcce6368396c297))

### [1.2.5](https://github.com/yahgwai/eth-parallel-event-fetcher/compare/v1.2.4...v1.2.5) (2025-06-04)

### Documentation

* consolidate changelog into single 1.2.4 release ([ed7e53b](https://github.com/yahgwai/eth-parallel-event-fetcher/commit/ed7e53bbbe8589a6dbce3f4e9956b0ebaf8a97a2))

## [1.2.4](https://github.com/yahgwai/eth-parallel-event-fetcher) (2025-06-04)

### ⚠ BREAKING CHANGES

* Package renamed from ethereum-parallel-fetcher to eth-parallel-event-fetcher
* Minimum Node.js version is now 14.0.0
* remove processor pattern from event fetcher API

### Features

* initial release of ethereum-parallel-fetcher
* parallel event fetching with configurable concurrency
* automatic retry logic with exponential backoff
* progress tracking and callbacks
* TypeScript support
* environment variable configuration
* remove processor pattern from fetchEvents API ([7ed993f](https://github.com/yahgwai/eth-parallel-event-fetcher/commit/7ed993f))
* rename package to eth-parallel-event-fetcher ([3f3ce7d](https://github.com/yahgwai/eth-parallel-event-fetcher/commit/3f3ce7d1aa0ecbbf3394d9d062b38424bd61d16a))

### Bug Fixes

* fix CI test hanging issue caused by O(n²) complexity in event processor ([36316ea](https://github.com/yahgwai/eth-parallel-event-fetcher/commit/36316ea))
* enable all previously skipped tests ([9131538](https://github.com/yahgwai/eth-parallel-event-fetcher/commit/9131538))
* remove forceExit flag from Jest tests ([c2de378](https://github.com/yahgwai/eth-parallel-event-fetcher/commit/c2de37854f64559496642e75005050564f825c48))
* ensure publish script runs after standard-version ([28ca3c8](https://github.com/yahgwai/eth-parallel-event-fetcher/commit/28ca3c82a691f04f7dba2843e92bc20fee1d770e))
* correct CI workflow name in release trigger ([567e1b6](https://github.com/yahgwai/eth-parallel-event-fetcher/commit/567e1b61c2a04095f78cb079f78c5771adc87f50))
* correct workflow names and add build step for CodeQL ([8e9eab6](https://github.com/yahgwai/eth-parallel-event-fetcher/commit/8e9eab6c694087e80b44776b619378c07fc4fab3))
* remove unused ts-expect-error directive in test setup ([ad75a6e](https://github.com/yahgwai/eth-parallel-event-fetcher/commit/ad75a6ebdbc5b1b90007d8146d67783c0d9470a7))
* correct repository URLs to match actual GitHub repo name ([6b2e761](https://github.com/yahgwai/eth-parallel-event-fetcher/commit/6b2e761322e95d6f43efdaa5abe3778f7e75e6be))
* prepare for initial release of renamed package ([72f1770](https://github.com/yahgwai/eth-parallel-event-fetcher/commit/72f177054ca63a267283a9b7ca1ff8c7058be86c))
* correct CodeQL initialization order in security workflow ([a51def5](https://github.com/yahgwai/eth-parallel-event-fetcher/commit/a51def5983a61cb6cfbbafc25e8c50366ae3e64e))
* correct changelog extraction regex for release notes ([cf51660](https://github.com/yahgwai/eth-parallel-event-fetcher/commit/cf516600c737cf695edd5c504fac6b38e1562fa7))
* improve changelog extraction to handle all header levels ([4735058](https://github.com/yahgwai/eth-parallel-event-fetcher/commit/4735058))

### Build System

* add comprehensive CI/CD and code quality infrastructure ([29780ab](https://github.com/yahgwai/eth-parallel-event-fetcher/commit/29780abfc62b8c340025fa693de1a01c3c79ad99))
* adopt conventional commits and standard-version ([9efb288](https://github.com/yahgwai/eth-parallel-event-fetcher/commit/9efb2882c96c33e4441aa12c7e879258341bc6bf))
* add pre-release checks to prevent releases with uncommitted changes ([650db4e](https://github.com/yahgwai/eth-parallel-event-fetcher/commit/650db4effa22facf21ee34e4676e52737549fcb2))

### Code Refactoring

* clean up codebase after processor removal ([251b269](https://github.com/yahgwai/eth-parallel-event-fetcher/commit/251b269))
* rename release.sh to publish.sh for clarity ([ae673f8](https://github.com/yahgwai/eth-parallel-event-fetcher/commit/ae673f8de8b8309c487fc0ed1b32187d31a8e3ae))

### Continuous Integration

* automate releases on push to main ([dd6065f](https://github.com/yahgwai/eth-parallel-event-fetcher/commit/dd6065f02e6b79891d492b7af70f0474ab3dc86d))
* improve CI/CD workflow architecture ([b4e4854](https://github.com/yahgwai/eth-parallel-event-fetcher/commit/b4e48549039218585e5cbec338afbb5eab822ad2))
* use release token for pushing to protected main branch ([3164d4e](https://github.com/yahgwai/eth-parallel-event-fetcher/commit/3164d4e8fae510fccec1878529e682c7528454b3))

### Tests

* verify pre-commit hooks work correctly ([f32023c](https://github.com/yahgwai/eth-parallel-event-fetcher/commit/f32023cb4d0c7277e32f44edac7e08ffe38de373))
