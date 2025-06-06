# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## 2.0.0 (2025-06-06)


### ⚠ BREAKING CHANGES

* Package renamed from ethereum-parallel-fetcher to eth-parallel-event-fetcher

- Rename npm package to match GitHub repository name
- Revert to using GITHUB_TOKEN in release workflow
* Minimum Node.js version is now 14.0.0
* fetchEvents() no longer accepts a processor parameter.
Events are returned directly, allowing users to process them after fetching.

- Remove processor parameter from fetchEvents()
- Return raw events instead of processed events
- Simplify API from 3 type parameters to 2
- Update all tests and documentation

### Features

* rename package to eth-parallel-event-fetcher ([d3685d9](https://github.com/yahgwai/eth-parallel-event-fetcher/commit/d3685d9db4feb09c0048cc6053fb66afd9f0f572))


### Bug Fixes

* add security-events permission to CodeQL workflow ([37265d1](https://github.com/yahgwai/eth-parallel-event-fetcher/commit/37265d164422dd3db47c4fc4b1bcf0c910d70f5f))
* configure git to use RELEASE_TOKEN for pushing to bypass branch protection ([6e6b49e](https://github.com/yahgwai/eth-parallel-event-fetcher/commit/6e6b49eb4d62136c41be23fa16866b3cce5bc659))
* correct changelog extraction regex for release notes ([81d4cc3](https://github.com/yahgwai/eth-parallel-event-fetcher/commit/81d4cc3c08cee97af2316ca48079bdd9f31e27c1))
* correct CI workflow name in release trigger ([16e3616](https://github.com/yahgwai/eth-parallel-event-fetcher/commit/16e36167b1597f14937ec996f87e451c68c2e1b1))
* correct CodeQL initialization order in security workflow ([e5d65df](https://github.com/yahgwai/eth-parallel-event-fetcher/commit/e5d65df4e8216e646b7c236ea980c4fbefded542))
* correct repository URLs to match actual GitHub repo name ([0d616ea](https://github.com/yahgwai/eth-parallel-event-fetcher/commit/0d616ea14cbf126ab605bb2a1895f48b3ed09932))
* correct workflow names and add build step for CodeQL ([8016362](https://github.com/yahgwai/eth-parallel-event-fetcher/commit/8016362717cc25d282dd8713a2d2d4635ca61a16))
* ensure publish script runs after standard-version ([3325ece](https://github.com/yahgwai/eth-parallel-event-fetcher/commit/3325ece12a4113798c54c7f6c301db93f116318f))
* improve changelog extraction to handle all header levels ([bd19d5c](https://github.com/yahgwai/eth-parallel-event-fetcher/commit/bd19d5cd86b6378e674365581557920767cee6ce))
* prepare for initial release of renamed package ([d4d9325](https://github.com/yahgwai/eth-parallel-event-fetcher/commit/d4d9325931e9f30f21848768d63ea2365860f1a0))
* remove forceExit flag from Jest tests ([a0451b6](https://github.com/yahgwai/eth-parallel-event-fetcher/commit/a0451b64fd4ce85e04cb2199d23a1372a859f81f))
* remove unused ts-expect-error directive in test setup ([174201d](https://github.com/yahgwai/eth-parallel-event-fetcher/commit/174201d9b2f3e3539d2b89ce7adafb41ecbe4427))
* skip git hooks setup in CI environments ([58f6408](https://github.com/yahgwai/eth-parallel-event-fetcher/commit/58f64084b64baa268f801564ececfd362c6225be))
* skip release workflow for dependabot commits ([2058543](https://github.com/yahgwai/eth-parallel-event-fetcher/commit/2058543b1781e0fb8022c658407747da37c896c5))
* use GitHub App token instead of PAT for release workflow ([32b1606](https://github.com/yahgwai/eth-parallel-event-fetcher/commit/32b1606a357cd4ae0d41858934180930e437a264))


* Remove processor pattern from event fetcher API ([ec2dcb5](https://github.com/yahgwai/eth-parallel-event-fetcher/commit/ec2dcb55fd55aa363c5d59185c4a6a7610c5db97))


### Build System

* add comprehensive CI/CD and code quality infrastructure ([af46611](https://github.com/yahgwai/eth-parallel-event-fetcher/commit/af46611d30f851e6300aed5561a48e51b04f89b2))
* add pre-release checks to prevent releases with uncommitted changes ([fd57448](https://github.com/yahgwai/eth-parallel-event-fetcher/commit/fd57448e2f8f4d2da6750e21ccd3be69875a76e9))
* adopt conventional commits and standard-version ([8f252db](https://github.com/yahgwai/eth-parallel-event-fetcher/commit/8f252db328ae4a19e51c821f155cab7530dbda78))


### Tests

* verify pre-commit hooks work correctly ([a95f814](https://github.com/yahgwai/eth-parallel-event-fetcher/commit/a95f81464a27fb269e8c3f200563762781753919))


### Code Refactoring

* remove unused ProgressTracker utility ([2e60e06](https://github.com/yahgwai/eth-parallel-event-fetcher/commit/2e60e0655bb00cf18f1cb5c83f917834f6250cce))
* rename release.sh to publish.sh for clarity ([2170e84](https://github.com/yahgwai/eth-parallel-event-fetcher/commit/2170e84fe4bbb77c7f0cd30f44eb3e6a25e3055e))


### Styles

* fix formatting in tests/utils.test.ts ([a372df9](https://github.com/yahgwai/eth-parallel-event-fetcher/commit/a372df90cff46c86d3c98bf2869792c57078c473))


### Documentation

* consolidate changelog into single 1.2.4 release ([a7d1ce8](https://github.com/yahgwai/eth-parallel-event-fetcher/commit/a7d1ce884c1fa59b6e744eb2da1983601abce9ed))
* fix broken repository and package links in README ([1c7cdac](https://github.com/yahgwai/eth-parallel-event-fetcher/commit/1c7cdac8399aeb10b98c79eaa69416ce0a6a01ad))


### Chores

* disable dependabot auto-rebase to prevent retry loops ([59a53f2](https://github.com/yahgwai/eth-parallel-event-fetcher/commit/59a53f200ccb4f1f83340f82636abd7a2ae6a7dc))
* **release:** 0.1.0 ([009b5b5](https://github.com/yahgwai/eth-parallel-event-fetcher/commit/009b5b532f68786fdd47ea8f878600d138dbfe11))
* **release:** 1.1.1 ([8c10268](https://github.com/yahgwai/eth-parallel-event-fetcher/commit/8c10268789de8c9246713494120b9addfd8eab37))
* **release:** 1.1.2 ([152ee01](https://github.com/yahgwai/eth-parallel-event-fetcher/commit/152ee0196644a1c4062877fa7ea3f50439416357))
* **release:** 1.1.3 ([4165b68](https://github.com/yahgwai/eth-parallel-event-fetcher/commit/4165b68f26b04cc9f12ddd83bf6a2a78614acf90))
* **release:** 1.1.4 ([f1b8757](https://github.com/yahgwai/eth-parallel-event-fetcher/commit/f1b87579c766777e4d1921c50c84ebc2789376b6))
* **release:** 1.2.0 ([4b72f1d](https://github.com/yahgwai/eth-parallel-event-fetcher/commit/4b72f1d9c5c70c8b81b225fbf8c51bd48724524f))
* **release:** 1.2.1 ([617d935](https://github.com/yahgwai/eth-parallel-event-fetcher/commit/617d935f82d0f0b661f0b8eb83f988cca741692c))
* **release:** 1.2.10 ([25902bb](https://github.com/yahgwai/eth-parallel-event-fetcher/commit/25902bba13a82842ff58f9b2ab596eb0fcefbcf2))
* **release:** 1.2.11 ([56d0b84](https://github.com/yahgwai/eth-parallel-event-fetcher/commit/56d0b846e7085880f82ca2b6b3937cdd7f7f06ac))
* **release:** 1.2.12 ([85f77ff](https://github.com/yahgwai/eth-parallel-event-fetcher/commit/85f77ff9e38345f4d34b05f894db91b748291dec))
* **release:** 1.2.3 ([e39fb47](https://github.com/yahgwai/eth-parallel-event-fetcher/commit/e39fb4761ff89b110901b30ac027ecf9fb3cc00e))
* **release:** 1.2.4 ([98af495](https://github.com/yahgwai/eth-parallel-event-fetcher/commit/98af495011417b089351e19622641c90847a25d2))
* **release:** 1.2.5 ([46caf00](https://github.com/yahgwai/eth-parallel-event-fetcher/commit/46caf00971035977599baa86d133dac4419cc866))
* **release:** 1.2.6 ([65314bf](https://github.com/yahgwai/eth-parallel-event-fetcher/commit/65314bf3de4bf4ebe4873b8ff9686c16db2d841d))
* **release:** 1.2.7 ([7b58708](https://github.com/yahgwai/eth-parallel-event-fetcher/commit/7b58708556b03b6ad8cba3a8d8b5e5a5ef1edf40))
* **release:** 1.2.8 ([001683b](https://github.com/yahgwai/eth-parallel-event-fetcher/commit/001683b660eebfc11086215f02e745efaddcf95c))
* **release:** 1.2.9 ([2bfd72b](https://github.com/yahgwai/eth-parallel-event-fetcher/commit/2bfd72b53b2523788094254e446d213708e77ea5))
* **release:** 2.0.0 ([eb68c73](https://github.com/yahgwai/eth-parallel-event-fetcher/commit/eb68c73672432cf669d3625d86f392abcf3fecec))
* remove Dependabot configuration and add Git hooks ([4c7e8e4](https://github.com/yahgwai/eth-parallel-event-fetcher/commit/4c7e8e42249ddfe023edebd69e95ff349779a1c6))
* reset the version number and added a convential commits format message ([35ef072](https://github.com/yahgwai/eth-parallel-event-fetcher/commit/35ef072e4ae50f9182ead478a945187b387bd203))
* standardize changelog bullet points to asterisks ([2ee9339](https://github.com/yahgwai/eth-parallel-event-fetcher/commit/2ee93399585de37321be6d61e7528457c4609f47))


### Continuous Integration

* automate releases on push to main ([0a97605](https://github.com/yahgwai/eth-parallel-event-fetcher/commit/0a9760544050b69a9e40ee9fb21993d3a081ed89))
* improve CI/CD workflow architecture ([4fa80a4](https://github.com/yahgwai/eth-parallel-event-fetcher/commit/4fa80a461dddeeab181e9a7bc61356ff6bded2ac))
* use release token for pushing to protected main branch ([2b9341c](https://github.com/yahgwai/eth-parallel-event-fetcher/commit/2b9341c0a8bcb72f8485c4ace9b041765760ef67))
* use RELEASE_TOKEN for workflow checkout ([#11](https://github.com/yahgwai/eth-parallel-event-fetcher/issues/11)) ([63a1ec3](https://github.com/yahgwai/eth-parallel-event-fetcher/commit/63a1ec3d6c23f56ff59502e5125cb0f6e24739b0))

### [1.2.12](https://github.com/yahgwai/eth-parallel-event-fetcher/compare/v1.2.11...v1.2.12) (2025-06-05)


### Documentation

* fix broken repository and package links in README ([c781850](https://github.com/yahgwai/eth-parallel-event-fetcher/commit/c7818503bcb42ad8987b0a600866fc7e8afed201))

### [1.2.11](https://github.com/yahgwai/eth-parallel-event-fetcher/compare/v1.2.10...v1.2.11) (2025-06-05)


### Bug Fixes

* skip git hooks setup in CI environments ([f77ea0b](https://github.com/yahgwai/eth-parallel-event-fetcher/commit/f77ea0b2359288d52341abe3e65a79f87ebea69f))


### Chores

* remove Dependabot configuration and add Git hooks ([34b626e](https://github.com/yahgwai/eth-parallel-event-fetcher/commit/34b626e5ed3c24a151da49e0277d700c9787fab2))

### [1.2.10](https://github.com/yahgwai/eth-parallel-event-fetcher/compare/v1.2.9...v1.2.10) (2025-06-05)


### Code Refactoring

* remove unused ProgressTracker utility ([3b5211a](https://github.com/yahgwai/eth-parallel-event-fetcher/commit/3b5211aaf94f2fc8b26ed1c92c3b2c3cd7b96a8c))


### Styles

* fix formatting in tests/utils.test.ts ([e4ef02a](https://github.com/yahgwai/eth-parallel-event-fetcher/commit/e4ef02a21ad7cc2580979a8e47ab6cc2249b2167))

### [1.2.9](https://github.com/yahgwai/eth-parallel-event-fetcher/compare/v1.2.8...v1.2.9) (2025-06-04)


### Chores

* disable dependabot auto-rebase to prevent retry loops ([39807de](https://github.com/yahgwai/eth-parallel-event-fetcher/commit/39807dec9865e3ffdd5689e6b8ec6b8635991765))

### [1.2.8](https://github.com/yahgwai/eth-parallel-event-fetcher/compare/v1.2.7...v1.2.8) (2025-06-04)


### Bug Fixes

* skip release workflow for dependabot commits ([2468dbf](https://github.com/yahgwai/eth-parallel-event-fetcher/commit/2468dbf2236b269ad14af227bbafb65504f9208c))

### [1.2.7](https://github.com/yahgwai/eth-parallel-event-fetcher/compare/v1.2.6...v1.2.7) (2025-06-04)


### Chores

* standardize changelog bullet points to asterisks ([5e8ee66](https://github.com/yahgwai/eth-parallel-event-fetcher/commit/5e8ee66b0fe947e0d370a9c17f32bd2c66229c66))

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
