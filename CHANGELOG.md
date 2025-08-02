# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

## [Unreleased]

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

[Unreleased]: https://github.com/gwennlbh/swarpc/compare/v0.6.1...HEAD
[0.6.1]: https://github.com/gwennlbh/swarpc/compare/v0.6.0...v0.6.1
[0.6.0]: https://github.com/gwennlbh/swarpc/compare/v0.5.0...v0.6.0
