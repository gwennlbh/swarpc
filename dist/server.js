/**
 * @module
 * @mergeModuleWith <project>
 */
import { type } from "arktype";
import { createLogger } from "./log.js";
import { PayloadHeaderSchema, PayloadSchema, zImplementations, zProcedures, } from "./types.js";
import { findTransferables } from "./utils.js";
const abortControllers = new Map();
const abortedRequests = new Set();
/**
 * Creates a sw&rpc server instance.
 * @param procedures procedures the server will implement
 * @param options various options
 * @param options.worker if provided, the server will use this worker to post messages, instead of sending it to all clients
 * @returns a SwarpcServer instance. Each property of the procedures map will be a method, that accepts a function implementing the procedure. There is also .start(), to be called after implementing all procedures.
 */
export function Server(procedures, { worker, loglevel = "debug" } = {}) {
    const l = createLogger("server", loglevel);
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
            instance[zImplementations][functionName] = (input, onProgress, abortSignal) => {
                abortSignal?.throwIfAborted();
                return new Promise((resolve, reject) => {
                    abortSignal?.addEventListener("abort", () => {
                        let { requestId, reason } = abortSignal?.reason;
                        l.debug(requestId, `Aborted ${functionName} request: ${reason}`);
                        reject({ aborted: reason });
                    });
                    implementation(input, onProgress, abortSignal)
                        .then(resolve)
                        .catch(reject);
                });
            };
        });
    }
    instance.start = (self) => {
        // Used to post messages back to the client
        const postMessage = async (autotransfer, data) => {
            const transfer = autotransfer ? [] : findTransferables(data);
            if (worker) {
                self.postMessage(data, { transfer });
            }
            else {
                await self.clients.matchAll().then((clients) => {
                    clients.forEach((client) => client.postMessage(data, { transfer }));
                });
            }
        };
        // Listen for messages from the client
        self.addEventListener("message", async (event) => {
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
            // Call the implementation with the input and a progress callback
            await implementation(payload.input, async (progress) => {
                l.debug(requestId, `Progress for ${functionName}`, progress);
                await postMsg({ progress });
            }, abortControllers.get(requestId)?.signal)
                // Send errors
                .catch(async (error) => {
                // Handle errors caused by abortions
                if ("aborted" in error) {
                    l.debug(requestId, `Received abort error for ${functionName}`, error.aborted);
                    abortedRequests.add(requestId);
                    abortControllers.delete(requestId);
                    return;
                }
                l.error(requestId, `Error in ${functionName}`, error);
                await postError(error);
            })
                // Send results
                .then(async (result) => {
                l.debug(requestId, `Result for ${functionName}`, result);
                await postMsg({ result });
            })
                .finally(() => {
                abortedRequests.delete(requestId);
            });
        });
    };
    return instance;
}
