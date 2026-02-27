/**
 * @module
 * @mergeModuleWith <project>
 */

import { createLogger, type LogLevel } from "./log.js";
import {
  broadcastNodes,
  makeNodeId,
  nodeIdOrSW,
  whoToSendTo,
} from "./nodes.js";
import {
  _clientListeners,
  type Context,
  makeRequestId,
  pendingRequests,
  postMessage,
  postMessageSync,
} from "./messaging.js";
import { type PayloadCore } from "./payload.js";
import {
  Broadcaster,
  BroadcasterResultExtrasFailure,
  BroadcasterResultExtrasMixed,
  BroadcasterResultExtrasSuccess,
  ClientMethod,
  ClientMethodCallable,
  Hooks,
  Procedure,
  RequestCancelledError,
  WorkerConstructor,
  zProcedures,
  type ProceduresMap,
} from "./types.js";
import {
  findTransferables,
  extractFulfilleds,
  extractRejecteds,
  sizedArray,
} from "./utils.js";
import type { StandardSchemaV1 as Schema } from "./standardschema.js";

/**
 * The sw&rpc client instance, which provides {@link ClientMethod | methods to call procedures}.
 * Each property of the procedures map will be a method, that accepts an input, an optional onProgress callback and an optional request ID.
 * If you want to be able to cancel the request, you can set the request's ID yourself, and call `.abort(requestId, reason)` on the client instance to cancel it.
 */
export type SwarpcClient<Procedures extends ProceduresMap> = {
  [zProcedures]: Procedures;
  /**
   * Create a proxy that cancels any ongoing call with the given global key before running new calls.
   * Usage: `await swarpc.onceBy("global-key").myMethod(...)`
   */
  onceBy: (key: string) => {
    [F in keyof Procedures]: ClientMethodCallable<Procedures[F]>;
  };
  /**
   * Disconnects all event listeners created by the client, and:
   * - for Shared Workers: closes the port started by the client
   * - for Dedicated Workers: terminates the worker instance
   * - for Service Workers: does nothing (there is no connection to close)
   */
  destroy(): void;
} & {
  [F in keyof Procedures]: ClientMethod<Procedures[F]>;
};

/**
 * Names that can't be used as procedure names. Will fail at runtime, when starting the client.
 */
export const RESERVED_PROCEDURE_NAMES = ["onceBy", "destroy"] as const;

/**
 * Reusable empty function for default onProgress callback
 */
const emptyProgressCallback = () => {};

/**
 *
 * @param procedures procedures the client will be able to call, see {@link ProceduresMap}
 * @param options various options
 * @param options.worker The worker class, **not instantiated**, or a path to the source code. If not provided, the client will use the service worker. If a string is provided, it'll instantiate a regular `Worker`, not a `SharedWorker`.
 * Example: `"./worker.js"`
 * See {@link Worker} (used by both dedicated workers and service workers), {@link SharedWorker}, and
 * the different [worker types](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API#worker_types) that exist
 * @param options.hooks Hooks to run on messages received from the server. See {@link Hooks}
 * @param options.loglevel Maximum log level to use, defaults to "debug" (shows everything). "info" will not show debug messages, "warn" will only show warnings and errors, "error" will only show errors.
 * @param options.restartListener If true, will force the listener to restart even if it has already been started. You should probably leave this to false, unless you are testing and want to reset the client state.
 * @param options.localStorage Define a in-memory localStorage with the given key-value pairs. Allows code called on the server to access localStorage (even though SharedWorkers don't have access to the browser's real localStorage)
 * @param options.nodes the number of workers to use for the server, defaults to {@link navigator.hardwareConcurrency}.
 * @param options.nodeIds node IDs to use. If not provided, random IDs will be generated for each node.
 * @returns a sw&rpc client instance. Each property of the procedures map will be a method, that accepts an input and an optional onProgress callback, see {@link ClientMethod}
 *
 * An example of defining and using a client:
 * {@includeCode ../example/src/routes/+page.svelte}
 */
export function Client<Procedures extends ProceduresMap>(
  procedures: Procedures,
  {
    worker,
    nodes: nodeCount,
    loglevel = "debug",
    restartListener = false,
    hooks = {},
    localStorage = {},
    nodeIds = [],
  }: {
    worker?: WorkerConstructor | string;
    nodes?: number;
    hooks?: Hooks<Procedures>;
    loglevel?: LogLevel;
    restartListener?: boolean;
    localStorage?: Record<string, any>;
    nodeIds?: string[];
  } = {},
): SwarpcClient<Procedures> {
  const l = createLogger("client", loglevel);

  type AnyProcedure = Procedures[keyof Procedures & string];

  if (restartListener) _clientListeners.clear();

  nodeCount ??= navigator.hardwareConcurrency || 1;

  let nodes: undefined | Record<string, Worker | SharedWorker>;
  if (worker) {
    nodes = {};
    for (const [i] of Array.from({ length: nodeCount }).entries()) {
      const id = nodeIds[i] ?? makeNodeId();
      if (typeof worker === "string") {
        nodes[id] = new Worker(worker, { name: id });
      } else {
        nodes[id] = new worker({ name: id });
      }
    }

    l.info(
      null,
      `Started ${nodeCount} node${nodeCount > 1 ? "s" : ""}`,
      Object.keys(nodes),
    );
  }

  const instance = {
    // Store procedures on a symbol key, to avoid conflicts with procedure names
    [zProcedures]: procedures,
    destroy() {
      for (const [nodeId, listener] of _clientListeners.entries()) {
        l.debug(null, `Destroying listener for node ${nodeId}`);
        listener.disconnect();
        _clientListeners.delete(nodeId);
      }

      for (const [nodeId, node] of Object.entries(nodes ?? {})) {
        l.debug(null, `Terminating worker for node ${nodeId}`);
        if (node instanceof SharedWorker) {
          node.port.close();
        } else {
          node.terminate();
        }
      }
    },
  } as Partial<SwarpcClient<Procedures>>;

  /**
   * Helper to cancel requests based on several criterias
   */
  function cancelRequests(
    reason: string,
    criterias: {
      /** Only cancel requests for these node IDs */
      nodeIds?: string[];
      /** Only cancel requests for this function name */
      functionName?: string;
      /** Only cancel requests matching this concurrency key (must not be joined with functionName, this function takes care of that) */
      concurrencyKey?: string;
    },
  ) {
    const { nodeIds, functionName, concurrencyKey } = criterias;
    if (!nodeIds && !functionName && !concurrencyKey) {
      throw new Error(
        "At least one criteria must be provided to cancel requests",
      );
    }

    if (nodeIds?.length === 0) {
      console.warn(
        "[SWARPC Client] cancelRequests called with empty nodeIds array, no requests will be cancelled",
      );
      return;
    }

    const trackingKey = concurrencyKey
      ? functionName
        ? `${functionName}:${concurrencyKey}`
        : concurrencyKey
      : undefined;

    /** Apply a criteria if first argument is truthy, otherwise return true */
    const criteria = <T>(param: T, fn: (param: NonNullable<T>) => boolean) =>
      param ? fn(param!) : true;

    const toCancel = [...pendingRequests.entries()].filter(
      ([_, p]) =>
        criteria(nodeIds, (ns) => !p.nodeId || ns.includes(p.nodeId)) &&
        criteria(functionName, (fn) => p.functionName === fn) &&
        criteria(trackingKey, (key) => p.concurrencyKey === key),
    );

    for (const [requestId, { functionName }] of toCancel) {
      cancelRequest(requestId, reason, functionName);
    }
  }

  /**
   * Helper function to cancel a previous request by ID
   */
  function cancelRequest(
    requestId: string,
    reason: string,
    functionName: string,
  ) {
    const pending = pendingRequests.get(requestId);
    if (!pending) return;

    const nodeId = pending.nodeId;
    const l = createLogger("client", loglevel, nodeIdOrSW(nodeId), requestId);

    l.debug(requestId, `Cancelling ${functionName} with`, reason);

    // Reject the promise first
    pending.reject(new RequestCancelledError(reason));

    // Then send abort message to the server
    postMessageSync(l, nodeId ? nodes?.[nodeId] : undefined, {
      by: "sw&rpc",
      requestId,
      functionName,
      abort: { reason },
    });

    // Finally remove from pending requests
    pendingRequests.delete(requestId);
  }

  // Map to store _runProcedure functions for each method
  const runProcedureFunctions = new Map<
    string,
    ProcedureRunner<AnyProcedure>
  >();

  for (const functionName of Object.keys(procedures) as Array<
    keyof Procedures
  >) {
    if (typeof functionName !== "string") {
      throw new Error(
        `[SWARPC Client] Invalid function name, don't use symbols`,
      );
    }

    if (
      (RESERVED_PROCEDURE_NAMES as readonly string[]).includes(functionName)
    ) {
      throw new Error(
        `[SWARPC Client] Invalid function name: "${functionName}" is a reserved word and can't be used as a procedure name. Reserved names: ${RESERVED_PROCEDURE_NAMES}`,
      );
    }

    const send = async (
      node: Worker | SharedWorker | undefined,
      nodeId: string | undefined,
      requestId: string,
      msg: PayloadCore<Procedures, typeof functionName>,
      options?: StructuredSerializeOptions,
    ) => {
      const ctx: Context<Procedures> = {
        logger: l,
        node,
        nodeId,
        allNodeIDs: new Set(nodes ? Object.keys(nodes) : []),
        hooks,
        localStorage,
      };

      return postMessage(
        ctx,
        {
          ...msg,
          by: "sw&rpc",
          requestId,
          functionName,
        },
        options,
      );
    };

    // Set the method on the instance
    type ThisProcedure = Procedures[typeof functionName];

    const _runProcedure: ProcedureRunner<ThisProcedure> = async ({
      input,
      onProgress,
      requestId: explicitRequestId,
      nodeId,
      concurrencyKey,
    }) => {
      // Validate the input against the procedure's input schema
      const validation =
        procedures[functionName].input["~standard"].validate(input);
      if (validation instanceof Promise)
        throw new Error("Validations must not be async");
      if (validation.issues)
        throw new Error(`Invalid input: ${validation.issues}`);

      const requestId = explicitRequestId ?? makeRequestId();

      // Choose which node to use
      nodeId ??= whoToSendTo(nodes, pendingRequests);
      const node = nodes && nodeId ? nodes[nodeId] : undefined;

      const l = createLogger("client", loglevel, nodeIdOrSW(nodeId), requestId);

      return new Promise((resolve, reject) => {
        // Store promise handlers (as well as progress updates handler)
        // so the client listener can resolve/reject the promise (and react to progress updates)
        // when the server sends messages back
        pendingRequests.set(requestId, {
          nodeId,
          functionName,
          startedAt: performance.now(),
          concurrencyKey,
          resolve,
          onProgress: onProgress ?? emptyProgressCallback,
          reject,
        });

        const transfer =
          procedures[functionName].autotransfer === "always"
            ? findTransferables(input)
            : [];

        // Post the message to the server
        l.debug(`Requesting ${functionName} with`, input);
        return send(node, nodeId, requestId, { input }, { transfer })
          .then(() => {})
          .catch(reject);
      });
    };

    const _broadcastProcedure: ProcedureRunnerBroadcast<
      ThisProcedure
    > = async ({ input, onProgresses, nodesCountOrIDs, concurrencyKey }) => {
      const nodesToUse = broadcastNodes(
        nodes ? Object.keys(nodes) : undefined,
        nodesCountOrIDs,
      );

      const progresses = new Map<string, unknown>();

      function onProgress(nodeId: string | undefined) {
        if (!onProgresses) return (_: unknown) => {};

        return (progress: unknown) => {
          progresses.set(nodeIdOrSW(nodeId), progress);
          onProgresses(progresses);
        };
      }

      const settleds = await Promise.allSettled(
        nodesToUse.map(async (id) =>
          _runProcedure({
            input,
            onProgress: onProgress(id),
            nodeId: id,
            concurrencyKey,
          }),
        ),
      ).then((results) =>
        results.map((result, index) => ({
          ...result,
          node: nodeIdOrSW(nodesToUse[index]),
        })),
      );

      const _extras = {
        byNode: new Map(settleds.map(({ node, ...result }) => [node, result])),
        successes: sizedArray(extractFulfilleds(settleds).map((r) => r.value)),
        failures: sizedArray(extractRejecteds(settleds)),

        get failureSummary() {
          return this.failures
            ?.map(({ node, reason }) => `Node ${node}: ${reason}`)
            .join(";\n");
        },

        get ok() {
          return this.failures.length === 0;
        },

        get ko() {
          return this.successes.length === 0;
        },

        get status() {
          if (this.ok) return "fulfilled";
          if (this.ko) return "rejected";
          return "mixed";
        },
      } satisfies BroadcasterResultExtrasAny<ThisProcedure>;

      const extras = _extras as
        | BroadcasterResultExtrasFailure
        | BroadcasterResultExtrasSuccess<ThisProcedure>
        | BroadcasterResultExtrasMixed<ThisProcedure>;

      return Object.assign(settleds, extras);
    };

    // Store the _runProcedure function for use in global onceBy
    // TODO: set instance.onceBy[functionName] here instead of out of the loop, so we don't need that global map
    runProcedureFunctions.set(functionName, _runProcedure);

    // @ts-expect-error
    instance[functionName] = (input, onProgress) =>
      _runProcedure({ input, onProgress });
    // @ts-expect-error
    instance[functionName]!.broadcast = (input, onProgresses, nodes) =>
      _broadcastProcedure({ input, onProgresses, nodesCountOrIDs: nodes });

    instance[functionName]!.broadcast.orThrow = async (...args) =>
      handleBroadcastOrThrowResults(
        await instance[functionName]!.broadcast(...args),
      );

    // @ts-expect-error .orThrow added later
    instance[functionName]!.broadcast.once = async (
      input,
      onProgresses,
      nodesCountOrIDs,
    ) => {
      const nodesToUse = broadcastNodes(
        nodes ? Object.keys(nodes) : undefined,
        nodesCountOrIDs,
      );

      // Cancel any previous ongoing calls of this method on all nodes beforehand
      cancelRequests("Cancelled by .broadcast.once() call", {
        functionName,
        nodeIds: nodesToUse.filter((x): x is string => x !== undefined),
      });

      return _broadcastProcedure({
        input,
        onProgresses,
        nodesCountOrIDs: nodesToUse,
      });
    };

    instance[functionName]!.broadcast.once.orThrow = async (...args) =>
      handleBroadcastOrThrowResults(
        await instance[functionName]!.broadcast.once(...args),
      );

    // @ts-expect-error .orThrow added later
    instance[functionName]!.broadcast.onceBy = async (
      concurrencyKey,
      input,
      onProgresses,
      nodesCountOrIDs,
    ) => {
      const nodesToUse = broadcastNodes(
        nodes ? Object.keys(nodes) : undefined,
        nodesCountOrIDs,
      );

      // Cancel any previous ongoing calls of this method on all nodes beforehand
      cancelRequests("Cancelled by .broadcast.once() call", {
        concurrencyKey,
        functionName,
        nodeIds: nodesToUse.filter((x): x is string => x !== undefined),
      });

      return _broadcastProcedure({
        input,
        onProgresses,
        nodesCountOrIDs: nodesToUse,
        concurrencyKey,
      });
    };

    instance[functionName]!.broadcast.onceBy.orThrow = async (...args) =>
      handleBroadcastOrThrowResults(
        await instance[functionName]!.broadcast.onceBy(...args),
      );

    instance[functionName]!.cancelable = (input, onProgress) => {
      const requestId = makeRequestId();
      const nodeId = whoToSendTo(nodes, pendingRequests);

      return {
        request: _runProcedure({ input, onProgress, requestId, nodeId }),
        cancel(reason: string) {
          cancelRequest(requestId, reason, functionName);
        },
      };
    };

    instance[functionName]!.once = async (input, onProgress) => {
      // Cancel any previous ongoing call of this method
      cancelRequests("Cancelled by .once() call", { functionName });

      return await _runProcedure({ input, onProgress });
    };

    instance[functionName]!.onceBy = async (
      concurrencyKey,
      input,
      onProgress,
    ) => {
      // Cancel any previous ongoing call of this method with this key
      cancelRequests(`Cancelled by .onceBy("${concurrencyKey}") call`, {
        functionName,
        concurrencyKey,
      });

      return await _runProcedure({ input, onProgress, concurrencyKey });
    };
  }

  // Add global onceBy method
  // @ts-expect-error - Adding method to instance
  instance.onceBy = (globalKey: string) => {
    // Create a proxy object with methods for each procedure
    const proxy: Record<
      string,
      (input: unknown, onProgress?: any) => Promise<unknown>
    > = {};

    for (const functionName of Object.keys(procedures) as Array<
      keyof Procedures
    >) {
      if (typeof functionName !== "string") continue;

      proxy[functionName] = async (input: unknown, onProgress?: any) => {
        // Cancel any previous ongoing call with this global key
        cancelRequests(`Cancelled by global onceBy("${globalKey}") call`, {
          concurrencyKey: globalKey,
        });

        const requestId = makeRequestId();

        const _runProcedure = runProcedureFunctions.get(functionName);
        if (!_runProcedure) {
          throw new Error(`No procedure found for ${functionName}`);
        }

        return await _runProcedure({
          input,
          onProgress,
          requestId,
          concurrencyKey: globalKey,
        });
      };
    }

    return proxy;
  };

  return instance as SwarpcClient<Procedures>;
}

type ProcedureRunner<P extends Procedure<Schema, Schema, Schema>> = (arg0: {
  input: Schema.InferInput<P["input"]>;
  onProgress?: (progress: Schema.InferOutput<P["progress"]>) => void;
  requestId?: string;
  nodeId?: string;
  concurrencyKey?: string;
}) => ReturnType<ClientMethodCallable<P>>;

type ProcedureRunnerBroadcast<P extends Procedure<Schema, Schema, Schema>> =
  (arg0: {
    input: Schema.InferInput<P["input"]>;
    onProgresses?: (
      progresses: Map<string, Schema.InferOutput<P["progress"]>>,
    ) => void;
    nodesCountOrIDs?: number | Array<string | undefined>;
    concurrencyKey?: string;
  }) => ReturnType<Broadcaster<P>>;

function handleBroadcastOrThrowResults<
  P extends Procedure<Schema, Schema, Schema>,
>(
  results: Awaited<ReturnType<Broadcaster<P>>>,
): Awaited<ReturnType<Broadcaster<P>["orThrow"]>> {
  if (results.ok) {
    return results.successes;
  }

  throw new AggregateError(results.failures.map((f) => f.reason));
}

type BroadcasterResultExtrasAny<P extends Procedure<Schema, Schema, Schema>> = {
  [K in keyof BroadcasterResultExtrasMixed<P>]:
    | BroadcasterResultExtrasMixed<P>[K]
    | BroadcasterResultExtrasSuccess<P>[K]
    | BroadcasterResultExtrasFailure[K];
};
