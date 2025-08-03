/**
 * @module
 * @mergeModuleWith <project>
 */
import { type Logger, type LogLevel } from "./log.js";
import { ClientMethod, Hooks, zProcedures, type ProceduresMap } from "./types.js";
/**
 * The sw&rpc client instance, which provides {@link ClientMethod | methods to call procedures}.
 * Each property of the procedures map will be a method, that accepts an input, an optional onProgress callback and an optional request ID.
 * If you want to be able to cancel the request, you can set the request's ID yourself, and call `.abort(requestId, reason)` on the client instance to cancel it.
 */
export type SwarpcClient<Procedures extends ProceduresMap> = {
    [zProcedures]: Procedures;
} & {
    [F in keyof Procedures]: ClientMethod<Procedures[F]>;
};
/**
 *
 * @param procedures procedures the client will be able to call, see {@link ProceduresMap}
 * @param options various options
 * @param options.worker if provided, the client will use this worker to post messages.
 * @param options.hooks hooks to run on messages received from the server
 * @param options.restartListener if true, will force the listener to restart even if it has already been started
 * @returns a sw&rpc client instance. Each property of the procedures map will be a method, that accepts an input and an optional onProgress callback, see {@link ClientMethod}
 *
 * An example of defining and using a client:
 * {@includeCode ../example/src/routes/+page.svelte}
 */
export declare function Client<Procedures extends ProceduresMap>(procedures: Procedures, { worker, loglevel, restartListener, hooks, }?: {
    worker?: Worker;
    hooks?: Hooks<Procedures>;
    loglevel?: LogLevel;
    restartListener?: boolean;
}): SwarpcClient<Procedures>;
/**
 * Starts the client listener, which listens for messages from the sw&rpc server.
 * @param worker if provided, the client will use this worker to listen for messages, instead of using the service worker
 * @param force if true, will force the listener to restart even if it has already been started
 * @returns
 */
export declare function startClientListener<Procedures extends ProceduresMap>(l: Logger, worker?: Worker, hooks?: Hooks<Procedures>): Promise<void>;
/**
 * Generate a random request ID, used to identify requests between client and server.
 * @source
 * @returns a 6-character hexadecimal string
 */
export declare function makeRequestId(): string;
//# sourceMappingURL=client.d.ts.map