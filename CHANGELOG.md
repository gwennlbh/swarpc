# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

## [Unreleased]

## [0.9.0] - 2025-08-03

### Added

- [`Client:options.restartListener`](https://gwennlbh.github.io/swarpc/docs/functions/Client.html), mostly for testing purposes

### Fixed

- A undefined-valued result message was sent after a thrown implementation error, resulting in a internal 'No pending request handlers' error

## [0.8.0] - 2025-08-03

### Added

- A way to log things using the same info and format as swarpc itself inside a procedure implementation: see [`ProcedureImplementation:tools.logger`](https://gwennlbh.github.io/swarpc/docs/types/ProcedureImplementation.html#:~:text=Make%20cancellable%20requests-,logger,-:%20RequestBoundLogger)

## [0.7.1] - 2025-08-02

### Fixed

- "Invalid entry point" error when trying to import Swarpc

## [0.7.0] - 2025-08-02

### Added

- [Cancellable requests](https://gwennlbh.github.io/swarpc/docs/#make-cancelable-requests)
- [Configurable log levels](http://gwennlbh.github.io/swarpc/docs/functions/index.Client.html#:~:text=from%20the%20server-,Optionalloglevel,-?:%20%22debug%22%20%7C)

### Fixed

- Type of [`Server#start`](<https://gwennlbh.github.io/swarpc/docs/types/types.SwarpcServer.html#:~:text=%22%5BzProcedures%5D%22:%20Procedures;-,start,-(self:%20Window):%20void;>)'s `self` parameter now correctly accepts both `Window` and `Worker` contexts.

## [0.6.1] - 2025-07-19

### Fixed

- build problems when using Vite

## [0.6.0] - 2025-07-19

### Added

- client-side hooks

### Changed

- messages not intended for swarpc are ignored by the server

## 0.5.0 - 2025-07-19

### Added

- support for transferable objects via a new [`autotransfer` property on procedure declarations](https://gwennlbh.github.io/swarpc/docs/types/types.Procedure.html#autotransfer)

[Unreleased]: https://github.com/gwennlbh/swarpc/compare/v0.9.0...HEAD
[0.9.0]: https://github.com/gwennlbh/swarpc/compare/v0.8.0...v0.9.0
[0.8.0]: https://github.com/gwennlbh/swarpc/compare/v0.7.1...v0.8.0
[0.7.1]: https://github.com/gwennlbh/swarpc/compare/v0.7.0...v0.7.1
[0.7.0]: https://github.com/gwennlbh/swarpc/compare/v0.6.1...v0.7.0
[0.6.1]: https://github.com/gwennlbh/swarpc/compare/v0.6.0...v0.6.1
[0.6.0]: https://github.com/gwennlbh/swarpc/compare/v0.5.0...v0.6.0
