import { type LogLevel } from "./log.js";
import { Hooks, type ProceduresMap, type SwarpcClient } from "./types.js";
export type { SwarpcClient } from "./types.js";
/**
 *
 * @param procedures procedures the client will be able to call
 * @param options various options
 * @param options.worker if provided, the client will use this worker to post messages.
 * @param options.hooks hooks to run on messages received from the server
 * @returns a sw&rpc client instance. Each property of the procedures map will be a method, that accepts an input and an optional onProgress callback.
 */
export declare function Client<Procedures extends ProceduresMap>(procedures: Procedures, { worker, loglevel, hooks, }?: {
    worker?: Worker;
    hooks?: Hooks<Procedures>;
    loglevel?: LogLevel;
}): SwarpcClient<Procedures>;
/**
 * Generate a random request ID, used to identify requests between client and server.
 * @returns a 6-character hexadecimal string
 */
export declare function makeRequestId(): string;
//# sourceMappingURL=client.d.ts.map