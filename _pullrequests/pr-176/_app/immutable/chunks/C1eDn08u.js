//#region node_modules/swarpc/dist/polyfills.js
Map.groupBy ??= function groupBy(iterable, callbackfn) {
	const map = /* @__PURE__ */ new Map();
	let i = 0;
	for (const value of iterable) {
		const key = callbackfn(value, i++), list = map.get(key);
		list ? list.push(value) : map.set(key, [value]);
	}
	return map;
};
//#endregion
//#region node_modules/swarpc/dist/types.js
var zProcedures = Symbol("SWARPC procedures");
var RequestCancelledError = class extends Error {
	constructor(reason) {
		super(`Request was cancelled: ${reason}`);
		this.name = "RequestCancelledError";
	}
};
//#endregion
//#region node_modules/swarpc/dist/log.js
function createLogger(side, level = "debug", nid, rqid) {
	const lvls = LOG_LEVELS.slice(LOG_LEVELS.indexOf(level));
	if (rqid && nid) {
		const ids = {
			rqid,
			nid
		};
		return {
			debug: lvls.includes("debug") ? logger("debug", side, ids) : () => {},
			info: lvls.includes("info") ? logger("info", side, ids) : () => {},
			warn: lvls.includes("warn") ? logger("warn", side, ids) : () => {},
			error: lvls.includes("error") ? logger("error", side, ids) : () => {}
		};
	}
	return {
		debug: lvls.includes("debug") ? logger("debug", side, nid) : () => {},
		info: lvls.includes("info") ? logger("info", side, nid) : () => {},
		warn: lvls.includes("warn") ? logger("warn", side, nid) : () => {},
		error: lvls.includes("error") ? logger("error", side, nid) : () => {}
	};
}
var LOG_LEVELS = [
	"debug",
	"info",
	"warn",
	"error"
];
var PATCHABLE_LOG_METHODS = [
	"debug",
	"info",
	"warn",
	"error",
	"log"
];
function logger(method, side, ids) {
	if (ids === void 0 || typeof ids === "string") {
		const nid = ids ?? null;
		return (rqid, ...args) => log(method, side, {
			nid,
			rqid
		}, ...args);
	}
	return (...args) => log(method, side, ids, ...args);
}
var originalConsole = PATCHABLE_LOG_METHODS.reduce((result, method) => {
	result[method] = console[method];
	return result;
}, {});
function log(method, side, { rqid, nid }, ...args) {
	const prefix = [
		`[SWARPC ${side}]`,
		rqid ? `%c${rqid}%c` : "",
		nid ? `%c@ ${nid}%c` : ""
	].filter(Boolean).join(" ");
	const prefixStyles = [];
	if (rqid) prefixStyles.push("color: cyan", "color: inherit");
	if (nid) prefixStyles.push("color: hotpink", "color: inherit");
	return originalConsole[method](prefix, ...prefixStyles, ...args);
}
globalThis.SharedWorkerGlobalScope;
globalThis.DedicatedWorkerGlobalScope;
globalThis.ServiceWorkerGlobalScope;
//#endregion
//#region node_modules/swarpc/dist/nodes.js
function whoToSendTo(nodes, requests) {
	if (!nodes) return void 0;
	let chosen = Object.keys(nodes)[0];
	const requestsPerNode = Map.groupBy(requests.values(), (req) => req.nodeId);
	for (const node of Object.keys(nodes)) if (!requestsPerNode.has(node)) requestsPerNode.set(node, []);
	for (const [node, reqs] of requestsPerNode.entries()) {
		if (!node) continue;
		if (reqs.length < requestsPerNode.get(chosen).length) chosen = node;
	}
	console.debug("[SWARPC Load balancer] Choosing", chosen, "load map is", requestsPerNode);
	return chosen;
}
function makeNodeId() {
	return "N" + Math.random().toString(16).substring(2, 5).toUpperCase();
}
var serviceWorkerNodeId = "(SW)";
function nodeIdOrSW(id) {
	return id ?? serviceWorkerNodeId;
}
function broadcastNodes(nodes, target) {
	if (target && Array.isArray(target)) return target;
	let nodesToUse = [void 0];
	if (nodes) nodesToUse = [...nodes];
	if (typeof target === "number") nodesToUse = nodesToUse.slice(0, target);
	return nodesToUse;
}
//#endregion
//#region node_modules/swarpc/dist/messaging.js
var pendingRequests = /* @__PURE__ */ new Map();
var _clientListeners = /* @__PURE__ */ new Map();
async function postMessage(ctx, message, options) {
	await startClientListener(ctx);
	const { logger: l, node: worker } = ctx;
	if (!worker && !navigator.serviceWorker.controller) l.warn("", "Service Worker is not controlling the page");
	const w = worker instanceof SharedWorker ? worker.port : worker === void 0 ? await navigator.serviceWorker.ready.then((r) => r.active) : worker;
	if (!w) throw new Error("[SWARPC Client] No active service worker found");
	w.postMessage(message, options);
}
function postMessageSync(l, worker, message, options) {
	if (!worker && !navigator.serviceWorker.controller) l.warn("Service Worker is not controlling the page");
	const w = worker instanceof SharedWorker ? worker.port : worker === void 0 ? navigator.serviceWorker.controller : worker;
	if (!w) throw new Error("[SWARPC Client] No active service worker found");
	w.postMessage(message, options);
}
async function startClientListener(ctx) {
	if (_clientListeners.has(nodeIdOrSW(ctx.nodeId))) return;
	const { logger: l, node: worker } = ctx;
	if (!worker) {
		if (!(await navigator.serviceWorker.ready)?.active) throw new Error("[SWARPC Client] Service Worker is not active");
		if (!navigator.serviceWorker.controller) l.warn("", "Service Worker is not controlling the page");
	}
	const w = worker ?? navigator.serviceWorker;
	l.debug(null, "Starting client listener", {
		w,
		...ctx
	});
	const listener = (event) => {
		const eventData = event.data || {};
		if (eventData?.by !== "sw&rpc") return;
		const payload = eventData;
		if ("isInitializeRequest" in payload) {
			l.warn(null, "Ignoring unexpected #initialize from server", payload);
			return;
		}
		const { requestId, ...data } = payload;
		if (!requestId) throw new Error("[SWARPC Client] Message received without requestId");
		const handlers = pendingRequests.get(requestId);
		if (!handlers) throw new Error(`[SWARPC Client] ${requestId} has no active request handlers, cannot process ${JSON.stringify(data)}`);
		const duration = performance.now() - handlers.startedAt;
		if ("error" in data) {
			ctx.hooks.error?.({
				procedure: data.functionName,
				error: new Error(data.error.message),
				duration
			});
			handlers.reject(new Error(data.error.message));
			pendingRequests.delete(requestId);
		} else if ("progress" in data) {
			ctx.hooks.progress?.({
				procedure: data.functionName,
				data: data.progress,
				duration
			});
			handlers.onProgress(data.progress);
		} else if ("result" in data) {
			ctx.hooks.success?.({
				procedure: data.functionName,
				data: data.result,
				duration
			});
			handlers.resolve(data.result);
			pendingRequests.delete(requestId);
		}
	};
	if (w instanceof SharedWorker) {
		w.port.addEventListener("message", listener);
		w.port.start();
	} else w.addEventListener("message", listener);
	_clientListeners.set(nodeIdOrSW(ctx.nodeId), { disconnect() {
		if (w instanceof SharedWorker) w.port.removeEventListener("message", listener);
		else w.removeEventListener("message", listener);
	} });
	await postMessage(ctx, {
		by: "sw&rpc",
		functionName: "#initialize",
		isInitializeRequest: true,
		localStorageData: ctx.localStorage,
		nodeId: nodeIdOrSW(ctx.nodeId),
		allNodeIDs: ctx.allNodeIDs
	});
}
function makeRequestId() {
	return Math.random().toString(16).substring(2, 8).toUpperCase();
}
//#endregion
//#region node_modules/swarpc/dist/utils.js
var transferableClasses = [
	MessagePort,
	ReadableStream,
	WritableStream,
	TransformStream,
	ArrayBuffer
];
function findTransferables(value) {
	if (value === null || value === void 0) return [];
	if (typeof value === "object") {
		if (ArrayBuffer.isView(value) || value instanceof ArrayBuffer) return [value];
		if (transferableClasses.some((cls) => value instanceof cls)) return [value];
		if (Array.isArray(value)) return value.flatMap(findTransferables);
		return Object.values(value).flatMap(findTransferables);
	}
	return [];
}
function sizedArray(array) {
	if (array.length === 0) return [];
	return array;
}
function extractFulfilleds(settleds) {
	return settleds.filter((settled) => settled.status === "fulfilled");
}
function extractRejecteds(settleds) {
	return settleds.filter((settled) => settled.status === "rejected");
}
//#endregion
//#region node_modules/swarpc/dist/client.js
var RESERVED_PROCEDURE_NAMES = ["onceBy", "destroy"];
var emptyProgressCallback = () => {};
function Client(procedures, { worker, nodes: nodeCount, loglevel = "debug", restartListener = false, hooks = {}, localStorage = {}, nodeIds = [] } = {}) {
	const l = createLogger("client", loglevel);
	if (restartListener) _clientListeners.clear();
	nodeCount ??= navigator.hardwareConcurrency || 1;
	let nodes;
	if (worker) {
		nodes = {};
		for (const [i] of Array.from({ length: nodeCount }).entries()) {
			const id = nodeIds[i] ?? makeNodeId();
			if (typeof worker === "string") nodes[id] = new Worker(worker, { name: id });
			else nodes[id] = new worker({ name: id });
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
				if (node instanceof SharedWorker) node.port.close();
				else node.terminate();
			}
		}
	};
	function cancelRequests(reason, criterias) {
		const { nodeIds, functionName, concurrencyKey } = criterias;
		if (!nodeIds && !functionName && !concurrencyKey) throw new Error("At least one criteria must be provided to cancel requests");
		if (nodeIds?.length === 0) {
			console.warn("[SWARPC Client] cancelRequests called with empty nodeIds array, no requests will be cancelled");
			return;
		}
		const trackingKey = concurrencyKey ? functionName ? `${functionName}:${concurrencyKey}` : concurrencyKey : void 0;
		const criteria = (param, fn) => param ? fn(param) : true;
		const toCancel = [...pendingRequests.entries()].filter(([_, p]) => criteria(nodeIds, (ns) => !p.nodeId || ns.includes(p.nodeId)) && criteria(functionName, (fn) => p.functionName === fn) && criteria(trackingKey, (key) => p.concurrencyKey === key));
		for (const [requestId, { functionName }] of toCancel) cancelRequest(requestId, reason, functionName);
	}
	function cancelRequest(requestId, reason, functionName) {
		const pending = pendingRequests.get(requestId);
		if (!pending) return;
		const nodeId = pending.nodeId;
		const l = createLogger("client", loglevel, nodeIdOrSW(nodeId), requestId);
		l.debug(requestId, `Cancelling ${functionName} with`, reason);
		pending.reject(new RequestCancelledError(reason));
		postMessageSync(l, nodeId ? nodes?.[nodeId] : void 0, {
			by: "sw&rpc",
			requestId,
			functionName,
			abort: { reason }
		});
		pendingRequests.delete(requestId);
	}
	const runProcedureFunctions = /* @__PURE__ */ new Map();
	for (const functionName of Object.keys(procedures)) {
		if (typeof functionName !== "string") throw new Error(`[SWARPC Client] Invalid function name, don't use symbols`);
		if (RESERVED_PROCEDURE_NAMES.includes(functionName)) throw new Error(`[SWARPC Client] Invalid function name: "${functionName}" is a reserved word and can't be used as a procedure name. Reserved names: ${RESERVED_PROCEDURE_NAMES}`);
		const send = async (node, nodeId, requestId, msg, options) => {
			return postMessage({
				logger: l,
				node,
				nodeId,
				allNodeIDs: new Set(nodes ? Object.keys(nodes) : []),
				hooks,
				localStorage
			}, {
				...msg,
				by: "sw&rpc",
				requestId,
				functionName
			}, options);
		};
		const _runProcedure = async ({ input, onProgress, requestId: explicitRequestId, nodeId, concurrencyKey }) => {
			const validation = procedures[functionName].input["~standard"].validate(input);
			if (validation instanceof Promise) throw new Error("Validations must not be async");
			if (validation.issues) throw new Error(`Invalid input: ${validation.issues}`);
			const requestId = explicitRequestId ?? makeRequestId();
			nodeId ??= whoToSendTo(nodes, pendingRequests);
			const node = nodes && nodeId ? nodes[nodeId] : void 0;
			const l = createLogger("client", loglevel, nodeIdOrSW(nodeId), requestId);
			return new Promise((resolve, reject) => {
				pendingRequests.set(requestId, {
					nodeId,
					functionName,
					startedAt: performance.now(),
					concurrencyKey,
					resolve,
					onProgress: onProgress ?? emptyProgressCallback,
					reject
				});
				const transfer = procedures[functionName].autotransfer === "always" ? findTransferables(input) : [];
				l.debug(`Requesting ${functionName} with`, input);
				return send(node, nodeId, requestId, { input }, { transfer }).then(() => {}).catch(reject);
			});
		};
		const _broadcastProcedure = async ({ input, onProgresses, nodesCountOrIDs, concurrencyKey }) => {
			const nodesToUse = broadcastNodes(nodes ? Object.keys(nodes) : void 0, nodesCountOrIDs);
			const progresses = /* @__PURE__ */ new Map();
			function onProgress(nodeId) {
				if (!onProgresses) return (_) => {};
				return (progress) => {
					progresses.set(nodeIdOrSW(nodeId), progress);
					onProgresses(progresses);
				};
			}
			const settleds = await Promise.allSettled(nodesToUse.map(async (id) => _runProcedure({
				input,
				onProgress: onProgress(id),
				nodeId: id,
				concurrencyKey
			}))).then((results) => results.map((result, index) => ({
				...result,
				node: nodeIdOrSW(nodesToUse[index])
			})));
			const extras = {
				byNode: new Map(settleds.map(({ node, ...result }) => [node, result])),
				successes: sizedArray(extractFulfilleds(settleds).map((r) => r.value)),
				failures: sizedArray(extractRejecteds(settleds)),
				get failureSummary() {
					return this.failures?.map(({ node, reason }) => `Node ${node}: ${reason}`).join(";\n");
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
				}
			};
			return Object.assign(settleds, extras);
		};
		runProcedureFunctions.set(functionName, _runProcedure);
		instance[functionName] = (input, onProgress) => _runProcedure({
			input,
			onProgress
		});
		instance[functionName].broadcast = (input, onProgresses, nodes) => _broadcastProcedure({
			input,
			onProgresses,
			nodesCountOrIDs: nodes
		});
		instance[functionName].broadcast.orThrow = async (...args) => handleBroadcastOrThrowResults(await instance[functionName].broadcast(...args));
		instance[functionName].broadcast.once = async (input, onProgresses, nodesCountOrIDs) => {
			const nodesToUse = broadcastNodes(nodes ? Object.keys(nodes) : void 0, nodesCountOrIDs);
			cancelRequests("Cancelled by .broadcast.once() call", {
				functionName,
				nodeIds: nodesToUse.filter((x) => x !== void 0)
			});
			return _broadcastProcedure({
				input,
				onProgresses,
				nodesCountOrIDs: nodesToUse
			});
		};
		instance[functionName].broadcast.once.orThrow = async (...args) => handleBroadcastOrThrowResults(await instance[functionName].broadcast.once(...args));
		instance[functionName].broadcast.onceBy = async (concurrencyKey, input, onProgresses, nodesCountOrIDs) => {
			const nodesToUse = broadcastNodes(nodes ? Object.keys(nodes) : void 0, nodesCountOrIDs);
			cancelRequests("Cancelled by .broadcast.once() call", {
				concurrencyKey,
				functionName,
				nodeIds: nodesToUse.filter((x) => x !== void 0)
			});
			return _broadcastProcedure({
				input,
				onProgresses,
				nodesCountOrIDs: nodesToUse,
				concurrencyKey
			});
		};
		instance[functionName].broadcast.onceBy.orThrow = async (...args) => handleBroadcastOrThrowResults(await instance[functionName].broadcast.onceBy(...args));
		instance[functionName].cancelable = (input, onProgress) => {
			const requestId = makeRequestId();
			return {
				request: _runProcedure({
					input,
					onProgress,
					requestId,
					nodeId: whoToSendTo(nodes, pendingRequests)
				}),
				cancel(reason) {
					cancelRequest(requestId, reason, functionName);
				}
			};
		};
		instance[functionName].once = async (input, onProgress) => {
			cancelRequests("Cancelled by .once() call", { functionName });
			return await _runProcedure({
				input,
				onProgress
			});
		};
		instance[functionName].onceBy = async (concurrencyKey, input, onProgress) => {
			cancelRequests(`Cancelled by .onceBy("${concurrencyKey}") call`, {
				functionName,
				concurrencyKey
			});
			return await _runProcedure({
				input,
				onProgress,
				concurrencyKey
			});
		};
	}
	instance.onceBy = (globalKey) => {
		const proxy = {};
		for (const functionName of Object.keys(procedures)) {
			if (typeof functionName !== "string") continue;
			proxy[functionName] = async (input, onProgress) => {
				cancelRequests(`Cancelled by global onceBy("${globalKey}") call`, { concurrencyKey: globalKey });
				const requestId = makeRequestId();
				const _runProcedure = runProcedureFunctions.get(functionName);
				if (!_runProcedure) throw new Error(`No procedure found for ${functionName}`);
				return await _runProcedure({
					input,
					onProgress,
					requestId,
					concurrencyKey: globalKey
				});
			};
		}
		return proxy;
	};
	return instance;
}
function handleBroadcastOrThrowResults(results) {
	if (results.ok) return results.successes;
	throw new AggregateError(results.failures.map((f) => f.reason));
}
//#endregion
export { RequestCancelledError as n, Client as t };
