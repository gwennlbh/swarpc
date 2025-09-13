# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

## [Unreleased]

### Changed

- **BREAKING:** `Client#(method name).broadcast:onProgress` now receives a _map_ of `nodeId` to progress values, which makes aggregating individual nodes' progress data into a single coherent progress value easier:

  ```ts
  import { sum } from "./utils";

  await client.thing.broadcast(67, (ps) =>
    console.log((sum(ps.values()) / ps.size) * 100 + "% done"),
  );
  ```

## [0.13.0] - 2025-09-13

### Added

- Procedure implementations now have access to `nodeId`, the ID of the node executing the request, in the `tools` argument.

## [0.12.0] - 2025-09-10

### Added

- A new option, `Client:option.nodes`, to control the number of nodes (worker instances) to spin up
- A way to broadcast requests to multiple (or all) nodes at once with `Client#(method name).broadcast`

### Changed

- **BREAKING:** `Client:options.worker` is now either a string (path to the worker's source code) or a class, not an instance
- **BREAKING:** When `Client:options.worker` is set, the Client now launches by default `navigator.hardwareConcurrency` nodes (worker instances) and dispatches requests to them in a balanced way.

## [0.11.0] - 2025-09-07

### Added

- `Client:options.localStorage` to define a `Server`-accessible polyfilled `localStorage` with data (See #32)

## [0.10.0] - 2025-08-03

### Changed

- **BREAKING:** `Server#start` is now asynchronous, but does not take an argument anymore.
- sw&rpc now handles [Shared Workers](https://developer.mozilla.org/en-US/docs/Web/API/SharedWorker) correctly

### Fixed

- `Server:options.worker` is correctly typed

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

[Unreleased]: https://github.com/gwennlbh/swarpc/compare/v0.13.0...HEAD
[0.13.0]: https://github.com/gwennlbh/swarpc/compare/v0.12.0...v0.13.0
[0.12.0]: https://github.com/gwennlbh/swarpc/compare/v0.11.0...v0.12.0
[0.11.0]: https://github.com/gwennlbh/swarpc/compare/v0.10.0...v0.11.0
[0.10.0]: https://github.com/gwennlbh/swarpc/compare/v0.9.0...v0.10.0
[0.9.0]: https://github.com/gwennlbh/swarpc/compare/v0.8.0...v0.9.0
[0.8.0]: https://github.com/gwennlbh/swarpc/compare/v0.7.1...v0.8.0
[0.7.1]: https://github.com/gwennlbh/swarpc/compare/v0.7.0...v0.7.1
[0.7.0]: https://github.com/gwennlbh/swarpc/compare/v0.6.1...v0.7.0
[0.6.1]: https://github.com/gwennlbh/swarpc/compare/v0.6.0...v0.6.1
[0.6.0]: https://github.com/gwennlbh/swarpc/compare/v0.5.0...v0.6.0
