import { type } from "arktype";
import { zImplementations, zProcedures, } from "./types.js";
/**
 * Creates a sw&rpc server instance.
 * @param procedures procedures the server will implement
 * @param param1 various options
 * @param param1.worker if provided, the server will use this worker to post messages, instead of sending it to all clients
 * @returns a SwarpcServer instance. Each property of the procedures map will be a method, that accepts a function implementing the procedure. There is also .start(), to be called after implementing all procedures.
 */
export function Server(procedures, { worker } = {}) {
    // Initialize the instance.
    // Procedures and implementations are stored on properties with symbol keys,
    // to avoid any conflicts with procedure names, and also discourage direct access to them.
    const instance = {
        [zProcedures]: procedures,
        [zImplementations]: {},
        start: (self) => { },
    };
    // Set all implementation-setter methods
    for (const functionName in procedures) {
        instance[functionName] = ((implementation) => {
            if (!instance[zProcedures][functionName]) {
                throw new Error(`No procedure found for function name: ${functionName}`);
            }
            instance[zImplementations][functionName] = implementation;
        });
    }
    // Define payload schema for incoming messages
    const PayloadSchema = type.or(...Object.entries(procedures).map(([functionName, { input }]) => ({
        functionName: type(`"${functionName}"`),
        requestId: type("string >= 1"),
        input,
    })));
    instance.start = (self) => {
        // Used to post messages back to the client
        const postMessage = async (data) => {
            if (worker) {
                self.postMessage(data);
            }
            else {
                await self.clients.matchAll().then((clients) => {
                    clients.forEach((client) => client.postMessage(data));
                });
            }
        };
        // Listen for messages from the client
        self.addEventListener("message", async (event) => {
            // Decode the payload
            const { functionName, requestId, input } = PayloadSchema.assert(event.data);
            l.server.debug(requestId, `Received request for ${functionName}`, input);
            // Prepare a function to post errors back to the client
            const postError = async (error) => postMessage({
                functionName,
                requestId,
                error: {
                    message: "message" in error ? error.message : String(error),
                },
            });
            // Retrieve the implementation for the requested function
            const implementation = instance[zImplementations][functionName];
            if (!implementation) {
                await postError("No implementation found");
                return;
            }
            // Call the implementation with the input and a progress callback
            await implementation(input, async (progress) => {
                l.server.debug(requestId, `Progress for ${functionName}`, progress);
                await postMessage({ functionName, requestId, progress });
            })
                // Send errors
                .catch(async (error) => {
                l.server.error(requestId, `Error in ${functionName}`, error);
                await postError(error);
            })
                // Send results
                .then(async (result) => {
                l.server.debug(requestId, `Result for ${functionName}`, result);
                await postMessage({ functionName, requestId, result });
            });
        });
    };
    return instance;
}
/**
 * Generate a random request ID, used to identify requests between client and server.
 * @returns a 6-character hexadecimal string
 */
function generateRequestId() {
    return Math.random().toString(16).substring(2, 8).toUpperCase();
}
/**
 * Pending requests are stored in a map, where the key is the request ID.
 * Each request has a set of handlers: resolve, reject, and onProgress.
 * This allows having a single listener for the client, and having multiple in-flight calls to the same procedure.
 */
const pendingRequests = new Map();
// Have we started the client listener?
let _clientListenerStarted = false;
/**
 * Starts the client listener, which listens for messages from the sw&rpc server.
 * @param worker if provided, the client will use this worker to listen for messages, instead of using the service worker
 * @returns
 */
async function startClientListener(worker) {
    if (_clientListenerStarted)
        return;
    // Get service worker registration if no worker is provided
    if (!worker) {
        const sw = await navigator.serviceWorker.ready;
        if (!sw?.active) {
            throw new Error("[SWARPC Client] Service Worker is not active");
        }
        if (!navigator.serviceWorker.controller) {
            l.client.warn("", "Service Worker is not controlling the page");
        }
    }
    const w = worker ?? navigator.serviceWorker;
    // Start listening for messages
    l.client.debug("", "Starting client listener on", w);
    w.addEventListener("message", (event) => {
        // Get the data from the event
        // We don't use a arktype schema here, we trust the server to send valid data
        const { functionName, requestId, ...data } = event.data || {};
        // Sanity check in case we somehow receive a message without requestId
        if (!requestId) {
            throw new Error("[SWARPC Client] Message received without requestId");
        }
        // Get the associated pending request handlers
        const handlers = pendingRequests.get(requestId);
        if (!handlers) {
            throw new Error(`[SWARPC Client] ${requestId} has no active request handlers`);
        }
        // React to the data received
        // Unless it's a progress update, the request is finished, thus we can remove it from the pending requests
        if ("error" in data) {
            handlers.reject(new Error(data.error.message));
            pendingRequests.delete(requestId);
        }
        else if ("progress" in data) {
            handlers.onProgress(data.progress);
        }
        else if ("result" in data) {
            handlers.resolve(data.result);
            pendingRequests.delete(requestId);
        }
    });
    _clientListenerStarted = true;
}
/**
 *
 * @param procedures procedures the client will be able to call
 * @param param1 various options
 * @param param1.worker if provided, the client will use this worker to post messages.
 * @returns a sw&rpc client instance. Each property of the procedures map will be a method, that accepts an input and an optional onProgress callback.
 */
export function Client(procedures, { worker } = {}) {
    // Store procedures on a symbol key, to avoid conflicts with procedure names
    const instance = { [zProcedures]: procedures };
    for (const functionName of Object.keys(procedures)) {
        if (typeof functionName !== "string") {
            throw new Error(`[SWARPC Client] Invalid function name, don't use symbols`);
        }
        // Set the method on the instance
        // @ts-expect-error
        instance[functionName] = (async (input, onProgress = () => { }) => {
            // Validate the input against the procedure's input schema
            procedures[functionName].input.assert(input);
            // Ensure that we're listening for messages from the server
            await startClientListener(worker);
            // If no worker is provided, we use the service worker
            const w = worker ?? (await navigator.serviceWorker.ready.then((r) => r.active));
            if (!w) {
                throw new Error("[SWARPC Client] No active service worker found");
            }
            return new Promise((resolve, reject) => {
                if (!worker && !navigator.serviceWorker.controller)
                    l.client.warn("", "Service Worker is not controlling the page");
                const requestId = generateRequestId();
                // Store promise handlers (as well as progress updates handler)
                // so the client listener can resolve/reject the promise (and react to progress updates)
                // when the server sends messages back
                pendingRequests.set(requestId, { resolve, onProgress, reject });
                // Post the message to the server
                l.client.debug(requestId, `Requesting ${functionName} with`, input);
                w.postMessage({ functionName, input, requestId });
            });
        });
    }
    return instance;
}
/**
 * Convenience shortcuts for logging.
 */
const l = {
    server: {
        debug: logger("debug", "server"),
        info: logger("info", "server"),
        warn: logger("warn", "server"),
        error: logger("error", "server"),
    },
    client: {
        debug: logger("debug", "client"),
        info: logger("info", "client"),
        warn: logger("warn", "client"),
        error: logger("error", "client"),
    },
};
/**
 * Creates partially-applied logging functions given the first 2 args
 * @param severity
 * @param side
 * @returns
 */
function logger(severity, side) {
    return (rqid, message, ...args) => log(severity, side, rqid, message, ...args);
}
/**
 * Send log messages to the console, with a helpful prefix.
 * @param severity
 * @param side
 * @param rqid request ID
 * @param message
 * @param args passed to console methods directly
 */
function log(severity, side, rqid, message, ...args) {
    const prefix = "[" +
        ["SWARPC", side, rqid ? `%c${rqid}%c` : ""].filter(Boolean).join(" ") +
        "]";
    const prefixStyles = rqid ? ["color: cyan;", "color: inherit;"] : [];
    if (severity === "debug") {
        console.debug(prefix, ...prefixStyles, message, ...args);
    }
    else if (severity === "info") {
        console.info(prefix, ...prefixStyles, message, ...args);
    }
    else if (severity === "warn") {
        console.warn(prefix, ...prefixStyles, message, ...args);
    }
    else if (severity === "error") {
        console.error(prefix, ...prefixStyles, message, ...args);
    }
}
