import { nodeIdOrSW } from "./nodes.js";
export const pendingRequests = new Map();
export let _clientListeners = new Map();
export async function postMessage(ctx, message, options) {
    await startClientListener(ctx);
    const { logger: l, node: worker } = ctx;
    if (!worker && !navigator.serviceWorker.controller)
        l.warn("", "Service Worker is not controlling the page");
    const w = worker instanceof SharedWorker
        ? worker.port
        : worker === undefined
            ? await navigator.serviceWorker.ready.then((r) => r.active)
            : worker;
    if (!w) {
        throw new Error("[SWARPC Client] No active service worker found");
    }
    w.postMessage(message, options);
}
export function postMessageSync(l, worker, message, options) {
    if (!worker && !navigator.serviceWorker.controller)
        l.warn("Service Worker is not controlling the page");
    const w = worker instanceof SharedWorker
        ? worker.port
        : worker === undefined
            ? navigator.serviceWorker.controller
            : worker;
    if (!w) {
        throw new Error("[SWARPC Client] No active service worker found");
    }
    w.postMessage(message, options);
}
async function startClientListener(ctx) {
    if (_clientListeners.has(nodeIdOrSW(ctx.nodeId)))
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
        const duration = performance.now() - handlers.startedAt;
        if ("error" in data) {
            ctx.hooks.error?.({
                procedure: data.functionName,
                error: new Error(data.error.message),
                duration,
            });
            handlers.reject(new Error(data.error.message));
            pendingRequests.delete(requestId);
        }
        else if ("progress" in data) {
            ctx.hooks.progress?.({
                procedure: data.functionName,
                data: data.progress,
                duration,
            });
            handlers.onProgress(data.progress);
        }
        else if ("result" in data) {
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
    }
    else {
        w.addEventListener("message", listener);
    }
    _clientListeners.set(nodeIdOrSW(ctx.nodeId), {
        disconnect() {
            if (w instanceof SharedWorker) {
                w.port.removeEventListener("message", listener);
            }
            else {
                w.removeEventListener("message", listener);
            }
        },
    });
    await postMessage(ctx, {
        by: "sw&rpc",
        functionName: "#initialize",
        isInitializeRequest: true,
        localStorageData: ctx.localStorage,
        nodeId: nodeIdOrSW(ctx.nodeId),
        allNodeIDs: ctx.allNodeIDs,
    });
}
export function makeRequestId() {
    return Math.random().toString(16).substring(2, 8).toUpperCase();
}
