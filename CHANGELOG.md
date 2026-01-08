# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

## [Unreleased]

## [0.18.0] - 2026-01-08

### Added

- "Once mode": a way to call methods that auto-cancel previous ongoing calls to the same method. See [the documentation](https://swarpc.js.org/#call-in-once-mode) for more details.

## [0.17.2] - 2025-12-12

### Fixed

- Previous release did not contain the newly built files, this one does.

## [0.17.1] - 2025-12-12

### Fixed

- Hook arguments' type unions were not correctly discriminated. The behavior documented in the 0.17.0 changelog entry is now correctly implemented.

## [0.17.0] - 2025-12-12

### Changed

- **BREAKING:** Hooks now receive a single object argument instead of two positional arguments. This greatly helps with type narrowing if you check for the procedure name.

  Before:

  ```ts
  Client(procedures, {
    hooks: {
      success(procedure, data) {
        if (procedure === "getUser") {
          // `data` is not narrowed down to the type returned by `getUser` :(
        }
      },
    },
  });
  ```

  After:

  ```ts
  Client(procedures, {
    hooks: {
      success({ procedure, data }) {
        if (procedure === "getUser") {
          // `data` is now correctly narrowed down to the type returned by `getUser` :)
        }
      },
    },
  });
  ```

  To update, simply change your hook implementations to use a single object argument and destructure (or not) the properties you need from it.

## [0.16.1] - 2025-11-12

### Fixed

- Type of procedure implementations' input argument was incorrectly specified as `Schema.InferInput<InputSchema>`, it is now <code>Schema.Infer<strong>Output</strong>&lt;InputSchema&gt;</code>, as the server receives the transformed input object.

  For example, if you had the following procedure declaration:

  ```ts
  export const procedures = {
    ...
    foo: {
      input: type('string.date.parse').
      ...
    }
  }
  ```

  Before, the implementation would show this type

  ```ts
  server.foo((input, onProgress) => {
    //        ^?: string
    ...
  })
  ```

  It now correctly shows

  ```ts
  server.foo((input, onProgress) => {
    //        ^?: Date
    ...
  })
  ```

## [0.16.0] - 2025-11-09

### Changed

- The package is now _much_ smaller, clocking in at around 3kB (minified + gzipped) instead of 44 kB ! This is thanks to the removal of internal APIs' type definitions, source maps, and the only runtime dependency, arktype (type-checking code is now hand-written, there wasn't a lot of it anyway).

### Removed

- **BREAKING:** The `logger` options in the third argument of procedure implementations has been removed. Just use `console.log` instead:

  ```diff
  - server.myProcedure(async (args, onProgress, { logger }) => {
  + server.myProcedure(async (args, onProgress) => {
  -   logger.info("Doing something")
  +   console.log("Doing something")
  });
  ```

- Functions and types for internal things have been removed from the public API. The only remaining API surface is the one documented in the README (`Server`, `Client` and their related types).

## [0.15.1] - 2025-11-04

### Fixed

- Console logs called from within procedures' implementations had their message weirdly colored. The logs are now correctly prefixed with node & request IDs

## [0.15.0] - 2025-11-04

### Added

- Support for any [Standard Schema](https://standardschema.dev)-compliant validation library, instead of just ArkType

## [0.14.0] - 2025-09-13

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

- [`Client:options.restartListener`](https://swarpc.js.org/functions/Client.html), mostly for testing purposes

### Fixed

- A undefined-valued result message was sent after a thrown implementation error, resulting in a internal 'No pending request handlers' error

## [0.8.0] - 2025-08-03

### Added

- A way to log things using the same info and format as swarpc itself inside a procedure implementation: see [`ProcedureImplementation:tools.logger`](https://swarpc.js.org/types/ProcedureImplementation.html#:~:text=Make%20cancellable%20requests-,logger,-:%20RequestBoundLogger)

## [0.7.1] - 2025-08-02

### Fixed

- "Invalid entry point" error when trying to import Swarpc

## [0.7.0] - 2025-08-02

### Added

- [Cancellable requests](https://swarpc.js.org/#make-cancelable-requests)
- [Configurable log levels](http://swarpc.js.org/functions/index.Client.html#:~:text=from%20the%20server-,Optionalloglevel,-?:%20%22debug%22%20%7C)

### Fixed

- Type of [`Server#start`](<https://swarpc.js.org/types/types.SwarpcServer.html#:~:text=%22%5BzProcedures%5D%22:%20Procedures;-,start,-(self:%20Window):%20void;>)'s `self` parameter now correctly accepts both `Window` and `Worker` contexts.

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

- support for transferable objects via a new [`autotransfer` property on procedure declarations](https://swarpc.js.org/types/types.Procedure.html#autotransfer)

[Unreleased]: https://github.com/gwennlbh/swarpc/compare/v0.18.0...HEAD
[0.18.0]: https://github.com/gwennlbh/swarpc/compare/v0.17.2...v0.18.0
[0.17.2]: https://github.com/gwennlbh/swarpc/compare/v0.17.1...v0.17.2
[0.17.1]: https://github.com/gwennlbh/swarpc/compare/v0.17.0...v0.17.1
[0.17.0]: https://github.com/gwennlbh/swarpc/compare/v0.16.1...v0.17.0
[0.16.1]: https://github.com/gwennlbh/swarpc/compare/v0.16.0...v0.16.1
[0.16.0]: https://github.com/gwennlbh/swarpc/compare/v0.15.1...v0.16.0
[0.15.1]: https://github.com/gwennlbh/swarpc/compare/v0.15.0...v0.15.1
[0.15.0]: https://github.com/gwennlbh/swarpc/compare/v0.14.0...v0.15.0
[0.14.0]: https://github.com/gwennlbh/swarpc/compare/v0.13.0...v0.14.0
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
