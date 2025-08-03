/**
 * @module
 * @mergeModuleWith <project>
 */
import { type LogLevel } from "./log.js";
import { ImplementationsMap, ProcedureImplementation, zImplementations, zProcedures, type ProceduresMap } from "./types.js";
/**
 * The sw&rpc server instance, which provides methods to register {@link ProcedureImplementation | procedure implementations},
 * and listens for incoming messages that call those procedures
 */
export type SwarpcServer<Procedures extends ProceduresMap> = {
    [zProcedures]: Procedures;
    [zImplementations]: ImplementationsMap<Procedures>;
    start(self: Window | Worker): void;
} & {
    [F in keyof Procedures]: (impl: ProcedureImplementation<Procedures[F]["input"], Procedures[F]["progress"], Procedures[F]["success"]>) => void;
};
/**
 * Creates a sw&rpc server instance.
 * @param procedures procedures the server will implement, see {@link ProceduresMap}
 * @param options various options
 * @param options.worker if provided, the server will use this worker to post messages, instead of sending it to all clients
 * @returns a SwarpcServer instance. Each property of the procedures map will be a method, that accepts a function implementing the procedure (see {@link ProcedureImplementation}). There is also .start(), to be called after implementing all procedures.
 *
 * An example of defining a server:
 * {@includeCode ../example/src/service-worker.ts}
 */
export declare function Server<Procedures extends ProceduresMap>(procedures: Procedures, { worker, loglevel }?: {
    worker?: Worker;
    loglevel?: LogLevel;
}): SwarpcServer<Procedures>;
//# sourceMappingURL=server.d.ts.map