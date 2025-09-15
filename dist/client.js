import {
  createLogger
} from "./log.js";
import { makeNodeId, nodeIdOrSW, whoToSendTo } from "./nodes.js";
import {
  zProcedures
} from "./types.js";
import { findTransferables } from "./utils.js";
const pendingRequests = new Map;
let _clientListenerStarted = new Set;
export function Client(procedures, {
  worker,
  nodes: nodeCount,
  loglevel = "debug",
  restartListener = false,
  hooks = {},
  localStorage = {}
} = {}) {
  const l = createLogger("client", loglevel);
  if (restartListener)
    _clientListenerStarted.clear();
  const instance = { [zProcedures]: procedures };
  nodeCount ??= navigator.hardwareConcurrency || 1;
  let nodes;
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
    l.info(null, `Started ${nodeCount} node${nodeCount > 1 ? "s" : ""}`, Object.keys(nodes));
  }
  for (const functionName of Object.keys(procedures)) {
    if (typeof functionName !== "string") {
      throw new Error(`[SWARPC Client] Invalid function name, don't use symbols`);
    }
    const send = async (node, nodeId, requestId, msg, options) => {
      const ctx = {
        logger: l,
        node,
        nodeId,
        hooks,
        localStorage
      };
      return postMessage(ctx, {
        ...msg,
        by: "sw&rpc",
        requestId,
        functionName
      }, options);
    };
    const _runProcedure = async (input, onProgress = () => {}, reqid, nodeId) => {
      procedures[functionName].input.assert(input);
      const requestId = reqid ?? makeRequestId();
      nodeId ??= whoToSendTo(nodes, pendingRequests);
      const node = nodes && nodeId ? nodes[nodeId] : undefined;
      const l = createLogger("client", loglevel, nodeIdOrSW(nodeId), requestId);
      return new Promise((resolve, reject) => {
        pendingRequests.set(requestId, {
          nodeId,
          functionName,
          resolve,
          onProgress,
          reject
        });
        const transfer = procedures[functionName].autotransfer === "always" ? findTransferables(input) : [];
        l.debug(`Requesting ${functionName} with`, input);
        return send(node, nodeId, requestId, { input }, { transfer }).then(() => {}).catch(reject);
      });
    };
    instance[functionName] = _runProcedure;
    instance[functionName].broadcast = async (input, onProgresses, nodesCount) => {
      let nodesToUse = [undefined];
      if (nodes)
        nodesToUse = Object.keys(nodes);
      if (nodesCount)
        nodesToUse = nodesToUse.slice(0, nodesCount);
      const progresses = new Map;
      function onProgress(nodeId) {
        if (!onProgresses)
          return (_) => {};
        return (progress) => {
          progresses.set(nodeIdOrSW(nodeId), progress);
          onProgresses(progresses);
        };
      }
      const results = await Promise.allSettled(nodesToUse.map(async (id) => _runProcedure(input, onProgress(id), undefined, id)));
      return results.map((r, i) => ({ ...r, node: nodeIdOrSW(nodesToUse[i]) }));
    };
    instance[functionName].cancelable = (input, onProgress) => {
      const requestId = makeRequestId();
      const nodeId = whoToSendTo(nodes, pendingRequests);
      const l = createLogger("client", loglevel, nodeIdOrSW(nodeId), requestId);
      return {
        request: _runProcedure(input, onProgress, requestId, nodeId),
        cancel(reason) {
          if (!pendingRequests.has(requestId)) {
            l.warn(requestId, `Cannot cancel ${functionName} request, it has already been resolved or rejected`);
            return;
          }
          l.debug(requestId, `Cancelling ${functionName} with`, reason);
          postMessageSync(l, nodeId ? nodes?.[nodeId] : undefined, {
            by: "sw&rpc",
            requestId,
            functionName,
            abort: { reason }
          });
          pendingRequests.delete(requestId);
        }
      };
    };
  }
  return instance;
}
async function postMessage(ctx, message, options) {
  await startClientListener(ctx);
  const { logger: l, node: worker } = ctx;
  if (!worker && !navigator.serviceWorker.controller)
    l.warn("", "Service Worker is not controlling the page");
  const w = worker instanceof SharedWorker ? worker.port : worker === undefined ? await navigator.serviceWorker.ready.then((r) => r.active) : worker;
  if (!w) {
    throw new Error("[SWARPC Client] No active service worker found");
  }
  w.postMessage(message, options);
}
export function postMessageSync(l, worker, message, options) {
  if (!worker && !navigator.serviceWorker.controller)
    l.warn("Service Worker is not controlling the page");
  const w = worker instanceof SharedWorker ? worker.port : worker === undefined ? navigator.serviceWorker.controller : worker;
  if (!w) {
    throw new Error("[SWARPC Client] No active service worker found");
  }
  w.postMessage(message, options);
}
export async function startClientListener(ctx) {
  if (_clientListenerStarted.has(nodeIdOrSW(ctx.nodeId)))
    return;
  const { logger: l, node: worker } = ctx;
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
  l.debug(null, "Starting client listener", { w, ...ctx });
  const listener = (event) => {
    const eventData = event.data || {};
    if (eventData?.by !== "sw&rpc")
      return;
    const payload = eventData;
    if ("isInitializeRequest" in payload) {
      l.warn(null, "Ignoring unexpected #initialize from server", payload);
      return;
    }
    const { requestId, ...data } = payload;
    if (!requestId) {
      throw new Error("[SWARPC Client] Message received without requestId");
    }
    const handlers = pendingRequests.get(requestId);
    if (!handlers) {
      throw new Error(`[SWARPC Client] ${requestId} has no active request handlers, cannot process ${JSON.stringify(data)}`);
    }
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
  await postMessage(ctx, {
    by: "sw&rpc",
    functionName: "#initialize",
    isInitializeRequest: true,
    localStorageData: ctx.localStorage,
    nodeId: nodeIdOrSW(ctx.nodeId)
  });
}
export function makeRequestId() {
  return Math.random().toString(16).substring(2, 8).toUpperCase();
}
