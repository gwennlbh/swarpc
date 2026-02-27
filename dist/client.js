import { createLogger } from "./log.js";
import { broadcastNodes, makeNodeId, nodeIdOrSW, whoToSendTo, } from "./nodes.js";
import { _clientListeners, makeRequestId, pendingRequests, postMessage, postMessageSync, } from "./messaging.js";
import { RequestCancelledError, zProcedures, } from "./types.js";
import { findTransferables, extractFulfilleds, extractRejecteds, sizedArray, } from "./utils.js";
export const RESERVED_PROCEDURE_NAMES = ["onceBy", "destroy"];
const emptyProgressCallback = () => { };
export function Client(procedures, { worker, nodes: nodeCount, loglevel = "debug", restartListener = false, hooks = {}, localStorage = {}, nodeIds = [], } = {}) {
    const l = createLogger("client", loglevel);
    if (restartListener)
        _clientListeners.clear();
    nodeCount ??= navigator.hardwareConcurrency || 1;
    let nodes;
    if (worker) {
        nodes = {};
        for (const [i] of Array.from({ length: nodeCount }).entries()) {
            const id = nodeIds[i] ?? makeNodeId();
            if (typeof worker === "string") {
                nodes[id] = new Worker(worker, { name: id });
            }
            else {
                nodes[id] = new worker({ name: id });
            }
        }
        l.info(null, `Started ${nodeCount} node${nodeCount > 1 ? "s" : ""}`, Object.keys(nodes));
    }
    const instance = {
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
                }
                else {
                    node.terminate();
                }
            }
        },
    };
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
        if (RESERVED_PROCEDURE_NAMES.includes(functionName)) {
            throw new Error(`[SWARPC Client] Invalid function name: "${functionName}" is a reserved word and can't be used as a procedure name. Reserved names: ${RESERVED_PROCEDURE_NAMES}`);
        }
        const send = async (node, nodeId, requestId, msg, options) => {
            const ctx = {
                logger: l,
                node,
                nodeId,
                allNodeIDs: new Set(nodes ? Object.keys(nodes) : []),
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
                    startedAt: performance.now(),
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
            const settleds = await Promise.allSettled(nodesToUse.map(async (id) => _runProcedure({
                input,
                onProgress: onProgress(id),
                nodeId: id,
                concurrencyKey,
            }))).then((results) => results.map((result, index) => ({
                ...result,
                node: nodeIdOrSW(nodesToUse[index]),
            })));
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
                    if (this.ok)
                        return "fulfilled";
                    if (this.ko)
                        return "rejected";
                    return "mixed";
                },
            };
            const extras = _extras;
            return Object.assign(settleds, extras);
        };
        runProcedureFunctions.set(functionName, _runProcedure);
        instance[functionName] = (input, onProgress) => _runProcedure({ input, onProgress });
        instance[functionName].broadcast = (input, onProgresses, nodes) => _broadcastProcedure({ input, onProgresses, nodesCountOrIDs: nodes });
        instance[functionName].broadcast.orThrow = async (...args) => handleBroadcastOrThrowResults(await instance[functionName].broadcast(...args));
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
        instance[functionName].broadcast.once.orThrow = async (...args) => handleBroadcastOrThrowResults(await instance[functionName].broadcast.once(...args));
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
        instance[functionName].broadcast.onceBy.orThrow = async (...args) => handleBroadcastOrThrowResults(await instance[functionName].broadcast.onceBy(...args));
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
function handleBroadcastOrThrowResults(results) {
    if (results.ok) {
        return results.successes;
    }
    throw new AggregateError(results.failures.map((f) => f.reason));
}
