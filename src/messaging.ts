import { type Logger, type RequestBoundLogger } from "./log.js";
import { nodeIdOrSW } from "./nodes.js";
import { type Payload } from "./payload.js";
import {
  type Hooks,
  type PendingRequest,
  type ProceduresMap,
} from "./types.js";

/**
 * Context for passing around data useful for requests
 */
export type Context<Procedures extends ProceduresMap> = {
  /** A logger, bound to the client */
  logger: Logger;
  /** The node to use */
  node: Worker | SharedWorker | undefined;
  /** The ID of the node to use */
  nodeId: string | undefined;
  /** Set of all available nodes' IDs */
  allNodeIDs: Set<string>;
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
export const pendingRequests = new Map<string, PendingRequest>();

// Map of node IDs to listener handles
// Used to check if a listener has already been started for a given node ID
// also used to stop listeners when destroying the client
export let _clientListeners: Map<string, { disconnect: () => void }> =
  new Map();

/**
 * Warms up the client by starting the listener and getting the worker, then posts a message to the worker.
 */
export async function postMessage<Procedures extends ProceduresMap>(
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
 */
export function postMessageSync<Procedures extends ProceduresMap>(
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
  if (_clientListeners.has(nodeIdOrSW(ctx.nodeId))) return;

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

    const duration = performance.now() - handlers.startedAt;

    // React to the data received: call hook, call handler,
    // and remove the request from pendingRequests (unless it's a progress update)
    if ("error" in data) {
      ctx.hooks.error?.({
        procedure: data.functionName,
        error: new Error(data.error.message),
        duration,
      });
      handlers.reject(new Error(data.error.message));
      pendingRequests.delete(requestId);
    } else if ("progress" in data) {
      ctx.hooks.progress?.({
        procedure: data.functionName,
        data: data.progress,
        duration,
      });
      handlers.onProgress(data.progress);
    } else if ("result" in data) {
      ctx.hooks.success?.({
        procedure: data.functionName,
        data: data.result,
        duration,
      });
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

  _clientListeners.set(nodeIdOrSW(ctx.nodeId), {
    disconnect() {
      if (w instanceof SharedWorker) {
        w.port.removeEventListener("message", listener);
      } else {
        w.removeEventListener("message", listener);
      }
    },
  });

  // Recursive terminal case is ensured by calling this *after* _clientListenerStarted is set to true: startClientListener() will therefore not be called in postMessage() again.
  await postMessage(ctx, {
    by: "sw&rpc",
    functionName: "#initialize",
    isInitializeRequest: true,
    localStorageData: ctx.localStorage,
    nodeId: nodeIdOrSW(ctx.nodeId),
    allNodeIDs: ctx.allNodeIDs,
  });
}

/**
 * Generate a random request ID, used to identify requests between client and server.
 * @source
 * @returns a 6-character hexadecimal string
 */
export function makeRequestId(): string {
  return Math.random().toString(16).substring(2, 8).toUpperCase();
}
