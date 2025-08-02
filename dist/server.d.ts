import { type ProceduresMap, type SwarpcServer } from "./types.js";
export type { ProceduresMap, SwarpcClient } from "./types.js";
/**
 * Creates a sw&rpc server instance.
 * @param procedures procedures the server will implement
 * @param param1 various options
 * @param param1.worker if provided, the server will use this worker to post messages, instead of sending it to all clients
 * @returns a SwarpcServer instance. Each property of the procedures map will be a method, that accepts a function implementing the procedure. There is also .start(), to be called after implementing all procedures.
 */
export declare function Server<Procedures extends ProceduresMap>(procedures: Procedures, { worker }?: {
    worker?: Worker;
}): SwarpcServer<Procedures>;
//# sourceMappingURL=server.d.ts.map