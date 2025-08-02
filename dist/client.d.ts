import { Hooks, type ProceduresMap, type SwarpcClient } from "./types.js";
export type { ProceduresMap, SwarpcClient } from "./types.js";
/**
 *
 * @param procedures procedures the client will be able to call
 * @param param1 various options
 * @param param1.worker if provided, the client will use this worker to post messages.
 * @param param1.hooks hooks to run on messages received from the server
 * @returns a sw&rpc client instance. Each property of the procedures map will be a method, that accepts an input and an optional onProgress callback.
 */
export declare function Client<Procedures extends ProceduresMap>(procedures: Procedures, { worker, hooks }?: {
    worker?: Worker;
    hooks?: Hooks<Procedures>;
}): SwarpcClient<Procedures>;
//# sourceMappingURL=client.d.ts.map