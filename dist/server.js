/**
 * @module
 * @mergeModuleWith <project>
 */
/// <reference lib="webworker" />
import { type } from "arktype";
import { createLogger } from "./log.js";
import { PayloadHeaderSchema, PayloadSchema, zImplementations, zProcedures, } from "./types.js";
import { findTransferables } from "./utils.js";
class MockedWorkerGlobalScope {
    constructor() { }
}
const SharedWorkerGlobalScope = globalThis.SharedWorkerGlobalScope ?? MockedWorkerGlobalScope;
const DedicatedWorkerGlobalScope = globalThis.DedicatedWorkerGlobalScope ?? MockedWorkerGlobalScope;
const ServiceWorkerGlobalScope = globalThis.ServiceWorkerGlobalScope ?? MockedWorkerGlobalScope;
const abortControllers = new Map();
const abortedRequests = new Set();
/**
 * Creates a sw&rpc server instance.
 * @param procedures procedures the server will implement, see {@link ProceduresMap}
 * @param options various options
 * @param options.scope The worker scope to use, defaults to the `self` of the file where Server() is called.
 * @param options.loglevel Maximum log level to use, defaults to "debug" (shows everything). "info" will not show debug messages, "warn" will only show warnings and errors, "error" will only show errors.
 * @param options._scopeType @internal Don't touch, this is used in testing environments because the mock is subpar. Manually overrides worker scope type detection.
 * @returns a SwarpcServer instance. Each property of the procedures map will be a method, that accepts a function implementing the procedure (see {@link ProcedureImplementation}). There is also .start(), to be called after implementing all procedures.
 *
 * An example of defining a server:
 * {@includeCode ../example/src/service-worker.ts}
 */
export function Server(procedures, { loglevel = "debug", scope, _scopeType, } = {}) {
    const l = createLogger("server", loglevel);
    // If scope is not provided, use the global scope
    // This function is meant to be used in a worker, so `self` is a WorkerGlobalScope
    scope ??= self;
    function scopeIsShared(scope) {
        return scope instanceof SharedWorkerGlobalScope || _scopeType === "shared";
    }
    function scopeIsDedicated(scope) {
        return (scope instanceof DedicatedWorkerGlobalScope || _scopeType === "dedicated");
    }
    function scopeIsService(scope) {
        return scope instanceof ServiceWorkerGlobalScope || _scopeType === "service";
    }
    // Initialize the instance.
    // Procedures and implementations are stored on properties with symbol keys,
    // to avoid any conflicts with procedure names, and also discourage direct access to them.
    const instance = {
        [zProcedures]: procedures,
        [zImplementations]: {},
        start: async () => { },
    };
    // Set all implementation-setter methods
    for (const functionName in procedures) {
        instance[functionName] = ((implementation) => {
            if (!instance[zProcedures][functionName]) {
                throw new Error(`No procedure found for function name: ${functionName}`);
            }
            instance[zImplementations][functionName] = (input, onProgress, tools) => {
                tools.abortSignal?.throwIfAborted();
                return new Promise((resolve, reject) => {
                    tools.abortSignal?.addEventListener("abort", () => {
                        let { requestId, reason } = tools.abortSignal?.reason;
                        l.debug(requestId, `Aborted ${functionName} request: ${reason}`);
                        reject({ aborted: reason });
                    });
                    implementation(input, onProgress, tools).then(resolve).catch(reject);
                });
            };
        });
    }
    instance.start = async () => {
        const port = await new Promise((resolve) => {
            if (!scopeIsShared(scope))
                return resolve(undefined);
            l.debug(null, "Awaiting shared worker connection...");
            scope.addEventListener("connect", ({ ports: [port] }) => {
                l.debug(null, "Shared worker connected with port", port);
                resolve(port);
            });
        });
        // Used to post messages back to the client
        const postMessage = async (autotransfer, data) => {
            const transfer = autotransfer ? [] : findTransferables(data);
            if (port) {
                port.postMessage(data, { transfer });
            }
            else if (scopeIsDedicated(scope)) {
                scope.postMessage(data, { transfer });
            }
            else if (scopeIsService(scope)) {
                await scope.clients.matchAll().then((clients) => {
                    clients.forEach((client) => client.postMessage(data, { transfer }));
                });
            }
        };
        const listener = async (event) => {
            // Decode the payload
            const { requestId, functionName } = PayloadHeaderSchema(type.enumerated(...Object.keys(procedures))).assert(event.data);
            l.debug(requestId, `Received request for ${functionName}`, event.data);
            // Get autotransfer preference from the procedure definition
            const { autotransfer = "output-only", ...schemas } = instance[zProcedures][functionName];
            // Shorthand function with functionName, requestId, etc. set
            const postMsg = async (data) => {
                if (abortedRequests.has(requestId))
                    return;
                await postMessage(autotransfer !== "never", {
                    by: "sw&rpc",
                    functionName,
                    requestId,
                    ...data,
                });
            };
            // Prepare a function to post errors back to the client
            const postError = async (error) => postMsg({
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
            // Define payload schema for incoming messages
            const payload = PayloadSchema(type(`"${functionName}"`), schemas.input, schemas.progress, schemas.success).assert(event.data);
            // Handle abortion requests (pro-choice ftw!!)
            if (payload.abort) {
                const controller = abortControllers.get(requestId);
                if (!controller)
                    await postError("No abort controller found for request");
                controller?.abort(payload.abort.reason);
                return;
            }
            // Set up the abort controller for this request
            abortControllers.set(requestId, new AbortController());
            if (!payload.input) {
                await postError("No input provided");
                return;
            }
            try {
                // Call the implementation with the input and a progress callback
                const result = await implementation(payload.input, async (progress) => {
                    l.debug(requestId, `Progress for ${functionName}`, progress);
                    await postMsg({ progress });
                }, {
                    abortSignal: abortControllers.get(requestId)?.signal,
                    logger: createLogger("server", loglevel, requestId),
                });
                // Send results
                l.debug(requestId, `Result for ${functionName}`, result);
                await postMsg({ result });
            }
            catch (error) {
                // Send errors
                // Handle errors caused by abortions
                if ("aborted" in error) {
                    l.debug(requestId, `Received abort error for ${functionName}`, error.aborted);
                    abortedRequests.add(requestId);
                    abortControllers.delete(requestId);
                    return;
                }
                l.info(requestId, `Error in ${functionName}`, error);
                await postError(error);
            }
            finally {
                abortedRequests.delete(requestId);
            }
        };
        // Listen for messages from the client
        if (scopeIsShared(scope)) {
            if (!port)
                throw new Error("SharedWorker port not initialized");
            console.log("Listening for shared worker messages on port", port);
            port.addEventListener("message", listener);
            port.start();
        }
        else if (scopeIsDedicated(scope)) {
            scope.addEventListener("message", listener);
        }
        else if (scopeIsService(scope)) {
            scope.addEventListener("message", listener);
        }
        else {
            throw new Error(`Unsupported worker scope ${scope}`);
        }
    };
    return instance;
}
