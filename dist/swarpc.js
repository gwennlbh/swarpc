import { type } from "arktype";
import { zImplementations, zProcedures, } from "./types.js";
export function Server(procedures, { worker } = {}) {
    const instance = {
        [zProcedures]: procedures,
        [zImplementations]: {},
        start: (self) => { },
    };
    for (const functionName in procedures) {
        instance[functionName] = ((implementation) => {
            if (!instance[zProcedures][functionName]) {
                throw new Error(`No procedure found for function name: ${functionName}`);
            }
            instance[zImplementations][functionName] = implementation;
        });
    }
    const PayloadSchema = type.or(...Object.entries(procedures).map(([functionName, { input }]) => ({
        functionName: type(`"${functionName}"`),
        requestId: type("string >= 1"),
        input,
    })));
    instance.start = (self) => {
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
        self.addEventListener("message", async (event) => {
            const { functionName, requestId, input } = PayloadSchema.assert(event.data);
            l.server.debug(requestId, `Received request for ${functionName}`, input);
            const postError = async (error) => postMessage({
                functionName,
                requestId,
                error: {
                    message: "message" in error ? error.message : String(error),
                },
            });
            const implementation = instance[zImplementations][functionName];
            if (!implementation) {
                await postError("No implementation found");
                return;
            }
            await implementation(input, async (progress) => {
                l.server.debug(requestId, `Progress for ${functionName}`, progress);
                await postMessage({ functionName, requestId, progress });
            })
                .catch(async (error) => {
                l.server.error(requestId, `Error in ${functionName}`, error);
                await postError(error);
            })
                .then(async (result) => {
                l.server.debug(requestId, `Result for ${functionName}`, result);
                await postMessage({ functionName, requestId, result });
            });
        });
    };
    return instance;
}
function generateRequestId() {
    return Math.random().toString(16).substring(2, 8).toUpperCase();
}
const pendingRequests = new Map();
let _clientListenerStarted = false;
async function startClientListener(worker) {
    if (_clientListenerStarted)
        return;
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
    l.client.debug("", "Starting client listener on", w);
    w.addEventListener("message", (event) => {
        const { functionName, requestId, ...data } = event.data || {};
        if (!requestId) {
            throw new Error("[SWARPC Client] Message received without requestId");
        }
        const handlers = pendingRequests.get(requestId);
        if (!handlers) {
            throw new Error(`[SWARPC Client] ${requestId} has no active request handlers`);
        }
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
export function Client(procedures, { worker } = {}) {
    const instance = { [zProcedures]: procedures };
    for (const functionName of Object.keys(procedures)) {
        if (typeof functionName !== "string") {
            throw new Error(`[SWARPC Client] Invalid function name, don't use symbols`);
        }
        // @ts-expect-error
        instance[functionName] = (async (input, onProgress = () => { }) => {
            procedures[functionName].input.assert(input);
            await startClientListener(worker);
            const w = worker ?? (await navigator.serviceWorker.ready.then((r) => r.active));
            if (!w) {
                throw new Error("[SWARPC Client] No active service worker found");
            }
            return new Promise((resolve, reject) => {
                if (!worker && !navigator.serviceWorker.controller)
                    l.client.warn("", "Service Worker is not controlling the page");
                const requestId = generateRequestId();
                pendingRequests.set(requestId, { resolve, onProgress, reject });
                l.client.debug(requestId, `Requesting ${functionName} with`, input);
                w.postMessage({ functionName, input, requestId });
            });
        });
    }
    return instance;
}
const l = {
    server: {
        debug: (rqid, message, ...args) => log("debug", "server", rqid, message, ...args),
        info: (rqid, message, ...args) => log("info", "server", rqid, message, ...args),
        warn: (rqid, message, ...args) => log("warn", "server", rqid, message, ...args),
        error: (rqid, message, ...args) => log("error", "server", rqid, message, ...args),
    },
    client: {
        debug: (rqid, message, ...args) => log("debug", "client", rqid, message, ...args),
        info: (rqid, message, ...args) => log("info", "client", rqid, message, ...args),
        warn: (rqid, message, ...args) => log("warn", "client", rqid, message, ...args),
        error: (rqid, message, ...args) => log("error", "client", rqid, message, ...args),
    },
};
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
