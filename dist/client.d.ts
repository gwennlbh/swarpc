/**
 * @module
 * @mergeModuleWith <project>
 */
import { type Logger, type LogLevel } from "./log.js";
import { ClientMethod, Hooks, Payload, zProcedures, type ProceduresMap } from "./types.js";
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
 * Context for passing around data useful for requests
 */
type Context<Procedures extends ProceduresMap> = {
    /** A logger, bound to the client */
    logger: Logger;
    /** The worker instance to use */
    worker: Worker | SharedWorker | undefined;
    /** Hooks defined by the client */
    hooks: Hooks<Procedures>;
    /** Local storage data defined by the client for the faux local storage */
    localStorage: Record<string, any>;
};
/**
 *
 * @param procedures procedures the client will be able to call, see {@link ProceduresMap}
 * @param options various options
 * @param options.worker The instantiated worker object. If not provided, the client will use the service worker.
 * Example: `new Worker("./worker.js")`
 * See {@link Worker} (used by both dedicated workers and service workers), {@link SharedWorker}, and
 * the different [worker types](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API#worker_types) that exist
 * @param options.hooks Hooks to run on messages received from the server. See {@link Hooks}
 * @param options.loglevel Maximum log level to use, defaults to "debug" (shows everything). "info" will not show debug messages, "warn" will only show warnings and errors, "error" will only show errors.
 * @param options.restartListener If true, will force the listener to restart even if it has already been started. You should probably leave this to false, unless you are testing and want to reset the client state.
 * @param options.localStorage Define a in-memory localStorage with the given key-value pairs. Allows code called on the server to access localStorage (even though SharedWorkers don't have access to the browser's real localStorage)
 * @returns a sw&rpc client instance. Each property of the procedures map will be a method, that accepts an input and an optional onProgress callback, see {@link ClientMethod}
 *
 * An example of defining and using a client:
 * {@includeCode ../example/src/routes/+page.svelte}
 */
export declare function Client<Procedures extends ProceduresMap>(procedures: Procedures, { worker, loglevel, restartListener, hooks, localStorage, }?: {
    worker?: Worker | SharedWorker;
    hooks?: Hooks<Procedures>;
    loglevel?: LogLevel;
    restartListener?: boolean;
    localStorage?: Record<string, any>;
}): SwarpcClient<Procedures>;
/**
 * A quicker version of postMessage that does not try to start the client listener, await the service worker, etc.
 * esp. useful for abort logic that needs to not be... put behind everything else on the event loop.
 * @param l
 * @param worker
 * @param message
 * @param options
 */
export declare function postMessageSync<Procedures extends ProceduresMap>(l: Logger, worker: Worker | SharedWorker | undefined, message: Payload<Procedures>, options?: StructuredSerializeOptions): void;
/**
 * Starts the client listener, which listens for messages from the sw&rpc server.
 * @param ctx.worker if provided, the client will use this worker to listen for messages, instead of using the service worker
 * @returns
 */
export declare function startClientListener<Procedures extends ProceduresMap>(ctx: Context<Procedures>): Promise<void>;
/**
 * Generate a random request ID, used to identify requests between client and server.
 * @source
 * @returns a 6-character hexadecimal string
 */
export declare function makeRequestId(): string;
export {};
//# sourceMappingURL=client.d.ts.map