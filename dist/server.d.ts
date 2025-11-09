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
    start(): Promise<void>;
} & {
    [F in keyof Procedures]: (impl: ProcedureImplementation<Procedures[F]["input"], Procedures[F]["progress"], Procedures[F]["success"]>) => void;
};
/**
 * Creates a sw&rpc server instance.
 * @param procedures procedures the server will implement, see {@link ProceduresMap}
 * @param options various options
 * @param options.scope The worker scope to use, defaults to the `self` of the file where Server() is called.
 * @param options.loglevel Maximum log level to use, defaults to "debug" (shows everything). "info" will not show debug messages, "warn" will only show warnings and errors, "error" will only show errors.
 * @param options._scopeType Don't touch, this is used in testing environments because the mock is subpar. Manually overrides worker scope type detection.
 * @returns a SwarpcServer instance. Each property of the procedures map will be a method, that accepts a function implementing the procedure (see {@link ProcedureImplementation}). There is also .start(), to be called after implementing all procedures.
 *
 * An example of defining a server:
 * {@includeCode ../example/src/service-worker.ts}
 */
export declare function Server<Procedures extends ProceduresMap>(procedures: Procedures, { loglevel, scope, _scopeType, }?: {
    scope?: WorkerGlobalScope;
    loglevel?: LogLevel;
    _scopeType?: "dedicated" | "shared" | "service";
}): SwarpcServer<Procedures>;
