/**
 * @module
 * @mergeModuleWith <project>
 */

import {
  createLogger,
  RequestBoundLogger,
  type Logger,
  type LogLevel,
} from "./log.js";
import { makeNodeId, nodeIdOrSW, whoToSendTo } from "./nodes.js";
import {
  ClientMethod,
  Hooks,
  Payload,
  PayloadCore,
  WorkerConstructor,
  zProcedures,
  type ProceduresMap,
} from "./types.js";
import { findTransferables } from "./utils.js";

/**
 * The sw&rpc client instance, which provides {@link ClientMethod | methods to call procedures}.
 * Each property of the procedures map will be a method, that accepts an input, an optional onProgress callback and an optional request ID.
 * If you want to be able to cancel the request, you can set the request's ID yourself, and call `.abort(requestId, reason)` on the client instance to cancel it.
 */
export type SwarpcClient<Procedures extends ProceduresMap> = {
  [zProcedures]: Procedures;
} & {
  [F in keyof Procedures]: ClientMethod<Procedures[F]>;
};

/**
 * Context for passing around data useful for requests
 */
type Context<Procedures extends ProceduresMap> = {
  /** A logger, bound to the client */
  logger: Logger;
  /** The node to use */
  node: Worker | SharedWorker | undefined;
  /** The ID of the node to use */
  nodeId: string | undefined;
  /** Hooks defined by the client */
  hooks: Hooks<Procedures>;
  /** Local storage data defined by the client for the faux local storage */
  localStorage: Record<string, any>;
};

/**
 * Pending requests are stored in a map, where the key is the request ID.
 * Each request has a set of handlers: resolve, reject, and onProgress.
 * This allows having a single listener for the client, and having multiple in-flight calls to the same procedure.
 */
const pendingRequests = new Map<string, PendingRequest>();
/** @internal */
export type PendingRequest = {
  /** ID of the node the request was sent to. udefined if running on a service worker */
  nodeId?: string;
  functionName: string;
  reject: (err: Error) => void;
  onProgress: (progress: any) => void;
  resolve: (result: any) => void;
};

// Have we started the client listener?
let _clientListenerStarted: Set<string> = new Set();

/** @internal */
export type ClientOptions = Parameters<typeof Client>[1];

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
  }: {
    worker?: WorkerConstructor | string;
    nodes?: number;
    hooks?: Hooks<Procedures>;
    loglevel?: LogLevel;
    restartListener?: boolean;
    localStorage?: Record<string, any>;
  } = {},
): SwarpcClient<Procedures> {
  const l = createLogger("client", loglevel);

  if (restartListener) _clientListenerStarted.clear();

  // Store procedures on a symbol key, to avoid conflicts with procedure names
  const instance = { [zProcedures]: procedures } as Partial<
    SwarpcClient<Procedures>
  >;

  nodeCount ??= navigator.hardwareConcurrency || 1;

  let nodes: undefined | Record<string, Worker | SharedWorker>;
  if (worker) {
    nodes = {};
    for (const _ of Array.from({ length: nodeCount })) {
      const id = makeNodeId();
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

  for (const functionName of Object.keys(procedures) as Array<
    keyof Procedures
  >) {
    if (typeof functionName !== "string") {
      throw new Error(
        `[SWARPC Client] Invalid function name, don't use symbols`,
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
    const _runProcedure = async (
      input: unknown,
      onProgress: (progress: unknown) => void | Promise<void> = () => {},
      reqid?: string,
      nodeId?: string,
    ) => {
      // Validate the input against the procedure's input schema
      const validation =
        procedures[functionName].input["~standard"].validate(input);
      if (validation instanceof Promise)
        throw new Error("Validations must not be async");
      if (validation.issues)
        throw new Error(`Invalid input: ${validation.issues}`);

      const requestId = reqid ?? makeRequestId();

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
          resolve,
          onProgress,
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

    // @ts-expect-error
    instance[functionName] = _runProcedure;
    instance[functionName]!.broadcast = async (
      input,
      onProgresses,
      nodesCount,
    ) => {
      let nodesToUse: Array<string | undefined> = [undefined];
      if (nodes) nodesToUse = Object.keys(nodes);
      if (nodesCount) nodesToUse = nodesToUse.slice(0, nodesCount);

      const progresses = new Map<string, unknown>();

      function onProgress(nodeId: string | undefined) {
        if (!onProgresses) return (_: unknown) => {};

        return (progress: unknown) => {
          progresses.set(nodeIdOrSW(nodeId), progress);
          onProgresses(progresses);
        };
      }

      const results = await Promise.allSettled(
        nodesToUse.map(async (id) =>
          _runProcedure(input, onProgress(id), undefined, id),
        ),
      );

      return results.map((r, i) => ({ ...r, node: nodeIdOrSW(nodesToUse[i]) }));
    };
    instance[functionName]!.cancelable = (input, onProgress) => {
      const requestId = makeRequestId();
      const nodeId = whoToSendTo(nodes, pendingRequests);

      const l = createLogger("client", loglevel, nodeIdOrSW(nodeId), requestId);

      return {
        request: _runProcedure(input, onProgress, requestId, nodeId),
        cancel(reason: string) {
          if (!pendingRequests.has(requestId)) {
            l.warn(
              requestId,
              `Cannot cancel ${functionName} request, it has already been resolved or rejected`,
            );
            return;
          }

          l.debug(requestId, `Cancelling ${functionName} with`, reason);
          postMessageSync(l, nodeId ? nodes?.[nodeId] : undefined, {
            by: "sw&rpc",
            requestId,
            functionName,
            abort: { reason },
          });
          pendingRequests.delete(requestId);
        },
      };
    };
  }

  return instance as SwarpcClient<Procedures>;
}

/**
 * Warms up the client by starting the listener and getting the worker, then posts a message to the worker.
 * @returns the worker to use
 */
async function postMessage<Procedures extends ProceduresMap>(
  ctx: Context<Procedures>,
  message: Payload<Procedures>,
  options?: StructuredSerializeOptions,
) {
  await startClientListener(ctx);

  const { logger: l, node: worker } = ctx;

  if (!worker && !navigator.serviceWorker.controller)
    l.warn("", "Service Worker is not controlling the page");

  // If no worker is provided, we use the service worker
  const w =
    worker instanceof SharedWorker
      ? worker.port
      : worker === undefined
        ? await navigator.serviceWorker.ready.then((r) => r.active)
        : worker;

  if (!w) {
    throw new Error("[SWARPC Client] No active service worker found");
  }

  w.postMessage(message, options);
}

/**
 * A quicker version of postMessage that does not try to start the client listener, await the service worker, etc.
 * esp. useful for abort logic that needs to not be... put behind everything else on the event loop.
 * @param l
 * @param worker
 * @param message
 * @param options
 */
function postMessageSync<Procedures extends ProceduresMap>(
  l: RequestBoundLogger,
  worker: Worker | SharedWorker | undefined,
  message: Payload<Procedures>,
  options?: StructuredSerializeOptions,
): void {
  if (!worker && !navigator.serviceWorker.controller)
    l.warn("Service Worker is not controlling the page");

  // If no worker is provided, we use the service worker
  const w =
    worker instanceof SharedWorker
      ? worker.port
      : worker === undefined
        ? navigator.serviceWorker.controller
        : worker;

  if (!w) {
    throw new Error("[SWARPC Client] No active service worker found");
  }

  w.postMessage(message, options);
}

/**
 * Starts the client listener, which listens for messages from the sw&rpc server.
 * @param ctx.worker if provided, the client will use this worker to listen for messages, instead of using the service worker
 * @returns
 */
async function startClientListener<Procedures extends ProceduresMap>(
  ctx: Context<Procedures>,
) {
  if (_clientListenerStarted.has(nodeIdOrSW(ctx.nodeId))) return;

  const { logger: l, node: worker } = ctx;

  // Get service worker registration if no worker is provided
  if (!worker) {
    const sw = await navigator.serviceWorker.ready;
    if (!sw?.active) {
      throw new Error("[SWARPC Client] Service Worker is not active");
    }

    if (!navigator.serviceWorker.controller) {
      l.warn("", "Service Worker is not controlling the page");
    }
  }

  const w = worker ?? navigator.serviceWorker;

  // Start listening for messages
  l.debug(null, "Starting client listener", { w, ...ctx });
  const listener = (event: Event): void => {
    // Get the data from the event
    const eventData = (event as MessageEvent).data || {};

    // Ignore other messages that aren't for us
    if (eventData?.by !== "sw&rpc") return;

    // We don't use a schema here, we trust the server to send valid data
    const payload = eventData as Payload<Procedures>;

    // Ignore #initialize request, it's client->server only
    if ("isInitializeRequest" in payload) {
      l.warn(null, "Ignoring unexpected #initialize from server", payload);
      return;
    }

    const { requestId, ...data } = payload;

    // Sanity check in case we somehow receive a message without requestId
    if (!requestId) {
      throw new Error("[SWARPC Client] Message received without requestId");
    }

    // Get the associated pending request handlers
    const handlers = pendingRequests.get(requestId);
    if (!handlers) {
      throw new Error(
        `[SWARPC Client] ${requestId} has no active request handlers, cannot process ${JSON.stringify(data)}`,
      );
    }

    // React to the data received: call hook, call handler,
    // and remove the request from pendingRequests (unless it's a progress update)
    if ("error" in data) {
      ctx.hooks.error?.(data.functionName, new Error(data.error.message));
      handlers.reject(new Error(data.error.message));
      pendingRequests.delete(requestId);
    } else if ("progress" in data) {
      ctx.hooks.progress?.(data.functionName, data.progress);
      handlers.onProgress(data.progress);
    } else if ("result" in data) {
      ctx.hooks.success?.(data.functionName, data.result);
      handlers.resolve(data.result);
      pendingRequests.delete(requestId);
    }
  };

  if (w instanceof SharedWorker) {
    w.port.addEventListener("message", listener);
    w.port.start();
  } else {
    w.addEventListener("message", listener);
  }

  _clientListenerStarted.add(nodeIdOrSW(ctx.nodeId));

  // Recursive terminal case is ensured by calling this *after* _clientListenerStarted is set to true: startClientListener() will therefore not be called in postMessage() again.
  await postMessage(ctx, {
    by: "sw&rpc",
    functionName: "#initialize",
    isInitializeRequest: true,
    localStorageData: ctx.localStorage,
    nodeId: nodeIdOrSW(ctx.nodeId),
  });
}

/**
 * Generate a random request ID, used to identify requests between client and server.
 * @source
 * @returns a 6-character hexadecimal string
 */
function makeRequestId(): string {
  return Math.random().toString(16).substring(2, 8).toUpperCase();
}
