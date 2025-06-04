# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [1.1.0](https://github.com/yahgwai/eth-parallel-event-fetcher/compare/v1.0.1...v1.1.0) (2025-06-04)

### ⚠ BREAKING CHANGES

* remove processor pattern from event fetcher API

### Features

* remove processor pattern from fetchEvents API ([7ed993f](https://github.com/yahgwai/eth-parallel-event-fetcher/commit/7ed993f))

### Code Refactoring

* clean up codebase after processor removal ([251b269](https://github.com/yahgwai/eth-parallel-event-fetcher/commit/251b269))

## [1.0.1](https://github.com/yahgwai/eth-parallel-event-fetcher/compare/v1.0.0...v1.0.1) (2025-06-04)

### Bug Fixes

* fix CI test hanging issue caused by O(n²) complexity in event processor ([36316ea](https://github.com/yahgwai/eth-parallel-event-fetcher/commit/36316ea))
* enable all previously skipped tests ([9131538](https://github.com/yahgwai/eth-parallel-event-fetcher/commit/9131538))

## 1.0.0 (2025-06-04)

### Features

* initial release of ethereum-parallel-fetcher
* parallel event fetching with configurable concurrency
* automatic retry logic with exponential backoff
* progress tracking and callbacks
* TypeScript support
* environment variable configuration