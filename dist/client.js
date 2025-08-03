/**
 * @module
 * @mergeModuleWith <project>
 */
import { createLogger } from "./log.js";
import { zProcedures, } from "./types.js";
import { findTransferables } from "./utils.js";
/**
 * Pending requests are stored in a map, where the key is the request ID.
 * Each request has a set of handlers: resolve, reject, and onProgress.
 * This allows having a single listener for the client, and having multiple in-flight calls to the same procedure.
 */
const pendingRequests = new Map();
// Have we started the client listener?
let _clientListenerStarted = false;
/**
 *
 * @param procedures procedures the client will be able to call, see {@link ProceduresMap}
 * @param options various options
 * @param options.worker if provided, the client will use this worker to post messages.
 * @param options.hooks hooks to run on messages received from the server
 * @param options.restartListener if true, will force the listener to restart even if it has already been started
 * @returns a sw&rpc client instance. Each property of the procedures map will be a method, that accepts an input and an optional onProgress callback, see {@link ClientMethod}
 *
 * An example of defining and using a client:
 * {@includeCode ../example/src/routes/+page.svelte}
 */
export function Client(procedures, { worker, loglevel = "debug", restartListener = false, hooks = {}, } = {}) {
    const l = createLogger("client", loglevel);
    if (restartListener)
        _clientListenerStarted = false;
    // Store procedures on a symbol key, to avoid conflicts with procedure names
    const instance = { [zProcedures]: procedures };
    for (const functionName of Object.keys(procedures)) {
        if (typeof functionName !== "string") {
            throw new Error(`[SWARPC Client] Invalid function name, don't use symbols`);
        }
        const send = async (requestId, msg, options) => {
            return postMessage(l, worker, hooks, {
                ...msg,
                by: "sw&rpc",
                requestId,
                functionName,
            }, options);
        };
        // Set the method on the instance
        const _runProcedure = async (input, onProgress = () => { }, reqid) => {
            // Validate the input against the procedure's input schema
            procedures[functionName].input.assert(input);
            const requestId = reqid ?? makeRequestId();
            return new Promise((resolve, reject) => {
                // Store promise handlers (as well as progress updates handler)
                // so the client listener can resolve/reject the promise (and react to progress updates)
                // when the server sends messages back
                pendingRequests.set(requestId, {
                    functionName,
                    resolve,
                    onProgress,
                    reject,
                });
                const transfer = procedures[functionName].autotransfer === "always"
                    ? findTransferables(input)
                    : [];
                // Post the message to the server
                l.debug(requestId, `Requesting ${functionName} with`, input);
                send(requestId, { input }, { transfer })
                    .then(() => { })
                    .catch(reject);
            });
        };
        // @ts-expect-error
        instance[functionName] = _runProcedure;
        instance[functionName].cancelable = (input, onProgress) => {
            const requestId = makeRequestId();
            return {
                request: _runProcedure(input, onProgress, requestId),
                async cancel(reason) {
                    if (!pendingRequests.has(requestId)) {
                        l.warn(requestId, `Cannot cancel ${functionName} request, it has already been resolved or rejected`);
                        return;
                    }
                    l.debug(requestId, `Cancelling ${functionName} with`, reason);
                    await send(requestId, { abort: { reason } });
                    pendingRequests.delete(requestId);
                },
            };
        };
    }
    return instance;
}
/**
 * Warms up the client by starting the listener and getting the worker, then posts a message to the worker.
 * @returns the worker to use
 */
async function postMessage(l, worker, hooks, message, options) {
    await startClientListener(l, worker, hooks);
    if (!worker && !navigator.serviceWorker.controller)
        l.warn("", "Service Worker is not controlling the page");
    // If no worker is provided, we use the service worker
    const w = worker ?? (await navigator.serviceWorker.ready.then((r) => r.active));
    if (!w) {
        throw new Error("[SWARPC Client] No active service worker found");
    }
    w.postMessage(message, options);
}
/**
 * Starts the client listener, which listens for messages from the sw&rpc server.
 * @param worker if provided, the client will use this worker to listen for messages, instead of using the service worker
 * @param force if true, will force the listener to restart even if it has already been started
 * @returns
 */
export async function startClientListener(l, worker, hooks = {}) {
    if (_clientListenerStarted)
        return;
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
    l.debug(null, "Starting client listener", { worker, w, hooks });
    w.addEventListener("message", (event) => {
        // Get the data from the event
        const eventData = event.data || {};
        // Ignore other messages that aren't for us
        if (eventData?.by !== "sw&rpc")
            return;
        // We don't use a arktype schema here, we trust the server to send valid data
        const { requestId, ...data } = eventData;
        // Sanity check in case we somehow receive a message without requestId
        if (!requestId) {
            throw new Error("[SWARPC Client] Message received without requestId");
        }
        // Get the associated pending request handlers
        const handlers = pendingRequests.get(requestId);
        if (!handlers) {
            throw new Error(`[SWARPC Client] ${requestId} has no active request handlers, cannot process ${JSON.stringify(data)}`);
        }
        // React to the data received: call hook, call handler,
        // and remove the request from pendingRequests (unless it's a progress update)
        if ("error" in data) {
            hooks.error?.(data.functionName, new Error(data.error.message));
            handlers.reject(new Error(data.error.message));
            pendingRequests.delete(requestId);
        }
        else if ("progress" in data) {
            hooks.progress?.(data.functionName, data.progress);
            handlers.onProgress(data.progress);
        }
        else if ("result" in data) {
            hooks.success?.(data.functionName, data.result);
            handlers.resolve(data.result);
            pendingRequests.delete(requestId);
        }
    });
    _clientListenerStarted = true;
}
/**
 * Generate a random request ID, used to identify requests between client and server.
 * @source
 * @returns a 6-character hexadecimal string
 */
export function makeRequestId() {
    return Math.random().toString(16).substring(2, 8).toUpperCase();
}
