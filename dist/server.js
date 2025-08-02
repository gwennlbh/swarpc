import { type } from "arktype";
import { l } from "./log.js";
import { zImplementations, zProcedures, } from "./types.js";
import { findTransferables } from "./utils.js";
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
            const transfer = data.autotransfer === "never" ? [] : findTransferables(data);
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
            const { functionName, requestId, input } = PayloadSchema.assert(event.data);
            l.server.debug(requestId, `Received request for ${functionName}`, input);
            // Get autotransfer preference from the procedure definition
            const { autotransfer = "output-only" } = instance[zProcedures][functionName];
            // Shorthand function with functionName, requestId, etc. set
            const postMsg = async (data) => postMessage({
                by: "sw&rpc",
                functionName,
                requestId,
                autotransfer,
                ...data,
            });
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
            // Call the implementation with the input and a progress callback
            await implementation(input, async (progress) => {
                l.server.debug(requestId, `Progress for ${functionName}`, progress);
                await postMsg({ progress });
            })
                // Send errors
                .catch(async (error) => {
                l.server.error(requestId, `Error in ${functionName}`, error);
                await postError(error);
            })
                // Send results
                .then(async (result) => {
                l.server.debug(requestId, `Result for ${functionName}`, result);
                await postMsg({ result });
            });
        });
    };
    return instance;
}
