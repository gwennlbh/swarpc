import { createLogger, } from "./log.js";
import { broadcastNodes, makeNodeId, nodeIdOrSW, whoToSendTo, } from "./nodes.js";
import { RequestCancelledError, zProcedures, } from "./types.js";
import { findTransferables } from "./utils.js";
const pendingRequests = new Map();
const emptyProgressCallback = () => { };
let _clientListenerStarted = new Set();
export function Client(procedures, { worker, nodes: nodeCount, loglevel = "debug", restartListener = false, hooks = {}, localStorage = {}, } = {}) {
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
            }
            else {
                nodes[id] = new worker({ name: id });
            }
        }
        l.info(null, `Started ${nodeCount} node${nodeCount > 1 ? "s" : ""}`, Object.keys(nodes));
    }
    function cancelRequests(reason, criterias) {
        const { nodeIds, functionName, concurrencyKey } = criterias;
        if (!nodeIds && !functionName && !concurrencyKey) {
            throw new Error("At least one criteria must be provided to cancel requests");
        }
        if (nodeIds?.length === 0) {
            console.warn("[SWARPC Client] cancelRequests called with empty nodeIds array, no requests will be cancelled");
            return;
        }
        const trackingKey = concurrencyKey
            ? functionName
                ? `${functionName}:${concurrencyKey}`
                : concurrencyKey
            : undefined;
        const criteria = (param, fn) => param ? fn(param) : true;
        const toCancel = [...pendingRequests.entries()].filter(([_, p]) => criteria(nodeIds, (ns) => !p.nodeId || ns.includes(p.nodeId)) &&
            criteria(functionName, (fn) => p.functionName === fn) &&
            criteria(trackingKey, (key) => p.concurrencyKey === key));
        for (const [requestId, { functionName }] of toCancel) {
            cancelRequest(requestId, reason, functionName);
        }
    }
    function cancelRequest(requestId, reason, functionName) {
        const pending = pendingRequests.get(requestId);
        if (!pending)
            return;
        const nodeId = pending.nodeId;
        const l = createLogger("client", loglevel, nodeIdOrSW(nodeId), requestId);
        l.debug(requestId, `Cancelling ${functionName} with`, reason);
        pending.reject(new RequestCancelledError(reason));
        postMessageSync(l, nodeId ? nodes?.[nodeId] : undefined, {
            by: "sw&rpc",
            requestId,
            functionName,
            abort: { reason },
        });
        pendingRequests.delete(requestId);
    }
    const runProcedureFunctions = new Map();
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
                localStorage,
            };
            return postMessage(ctx, {
                ...msg,
                by: "sw&rpc",
                requestId,
                functionName,
            }, options);
        };
        const _runProcedure = async ({ input, onProgress, requestId: explicitRequestId, nodeId, concurrencyKey, }) => {
            const validation = procedures[functionName].input["~standard"].validate(input);
            if (validation instanceof Promise)
                throw new Error("Validations must not be async");
            if (validation.issues)
                throw new Error(`Invalid input: ${validation.issues}`);
            const requestId = explicitRequestId ?? makeRequestId();
            nodeId ??= whoToSendTo(nodes, pendingRequests);
            const node = nodes && nodeId ? nodes[nodeId] : undefined;
            const l = createLogger("client", loglevel, nodeIdOrSW(nodeId), requestId);
            return new Promise((resolve, reject) => {
                pendingRequests.set(requestId, {
                    nodeId,
                    functionName,
                    concurrencyKey,
                    resolve,
                    onProgress: onProgress ?? emptyProgressCallback,
                    reject,
                });
                const transfer = procedures[functionName].autotransfer === "always"
                    ? findTransferables(input)
                    : [];
                l.debug(`Requesting ${functionName} with`, input);
                return send(node, nodeId, requestId, { input }, { transfer })
                    .then(() => { })
                    .catch(reject);
            });
        };
        const _broadcastProcedure = async ({ input, onProgresses, nodesCountOrIDs, concurrencyKey }) => {
            const nodesToUse = broadcastNodes(nodes ? Object.keys(nodes) : undefined, nodesCountOrIDs);
            const progresses = new Map();
            function onProgress(nodeId) {
                if (!onProgresses)
                    return (_) => { };
                return (progress) => {
                    progresses.set(nodeIdOrSW(nodeId), progress);
                    onProgresses(progresses);
                };
            }
            const results = await Promise.allSettled(nodesToUse.map(async (id) => _runProcedure({
                input,
                onProgress: onProgress(id),
                nodeId: id,
                concurrencyKey,
            })));
            return results.map((r, i) => ({ ...r, node: nodeIdOrSW(nodesToUse[i]) }));
        };
        runProcedureFunctions.set(functionName, _runProcedure);
        instance[functionName] = (input, onProgress) => _runProcedure({ input, onProgress });
        instance[functionName].broadcast = (input, onProgresses, nodes) => _broadcastProcedure({ input, onProgresses, nodesCountOrIDs: nodes });
        instance[functionName].broadcast.once = async (input, onProgresses, nodesCountOrIDs) => {
            const nodesToUse = broadcastNodes(nodes ? Object.keys(nodes) : undefined, nodesCountOrIDs);
            cancelRequests("Cancelled by .broadcast.once() call", {
                functionName,
                nodeIds: nodesToUse.filter((x) => x !== undefined),
            });
            return _broadcastProcedure({
                input,
                onProgresses,
                nodesCountOrIDs: nodesToUse,
            });
        };
        instance[functionName].broadcast.onceBy = async (concurrencyKey, input, onProgresses, nodesCountOrIDs) => {
            const nodesToUse = broadcastNodes(nodes ? Object.keys(nodes) : undefined, nodesCountOrIDs);
            cancelRequests("Cancelled by .broadcast.once() call", {
                concurrencyKey,
                functionName,
                nodeIds: nodesToUse.filter((x) => x !== undefined),
            });
            return _broadcastProcedure({
                input,
                onProgresses,
                nodesCountOrIDs: nodesToUse,
                concurrencyKey,
            });
        };
        instance[functionName].cancelable = (input, onProgress) => {
            const requestId = makeRequestId();
            const nodeId = whoToSendTo(nodes, pendingRequests);
            return {
                request: _runProcedure({ input, onProgress, requestId, nodeId }),
                cancel(reason) {
                    cancelRequest(requestId, reason, functionName);
                },
            };
        };
        instance[functionName].once = async (input, onProgress) => {
            cancelRequests("Cancelled by .once() call", { functionName });
            return await _runProcedure({ input, onProgress });
        };
        instance[functionName].onceBy = async (concurrencyKey, input, onProgress) => {
            cancelRequests(`Cancelled by .onceBy("${concurrencyKey}") call`, {
                functionName,
                concurrencyKey,
            });
            return await _runProcedure({ input, onProgress, concurrencyKey });
        };
    }
    instance.onceBy = (globalKey) => {
        const proxy = {};
        for (const functionName of Object.keys(procedures)) {
            if (typeof functionName !== "string")
                continue;
            proxy[functionName] = async (input, onProgress) => {
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
    return instance;
}
async function postMessage(ctx, message, options) {
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
function postMessageSync(l, worker, message, options) {
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
            ctx.hooks.error?.({
                procedure: data.functionName,
                error: new Error(data.error.message),
            });
            handlers.reject(new Error(data.error.message));
            pendingRequests.delete(requestId);
        }
        else if ("progress" in data) {
            ctx.hooks.progress?.({
                procedure: data.functionName,
                data: data.progress,
            });
            handlers.onProgress(data.progress);
        }
        else if ("result" in data) {
            ctx.hooks.success?.({
                procedure: data.functionName,
                data: data.result,
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
    _clientListenerStarted.add(nodeIdOrSW(ctx.nodeId));
    await postMessage(ctx, {
        by: "sw&rpc",
        functionName: "#initialize",
        isInitializeRequest: true,
        localStorageData: ctx.localStorage,
        nodeId: nodeIdOrSW(ctx.nodeId),
    });
}
function makeRequestId() {
    return Math.random().toString(16).substring(2, 8).toUpperCase();
}
