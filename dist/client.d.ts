/**
 * @module
 * @mergeModuleWith <project>
 */
import { type LogLevel } from "./log.js";
import { ClientMethod, Hooks, WorkerConstructor, zProcedures, type ProceduresMap } from "./types.js";
import type { StandardSchemaV1 as Schema } from "./standardschema.js";
/**
 * The sw&rpc client instance, which provides {@link ClientMethod | methods to call procedures}.
 * Each property of the procedures map will be a method, that accepts an input, an optional onProgress callback and an optional request ID.
 * If you want to be able to cancel the request, you can set the request's ID yourself, and call `.abort(requestId, reason)` on the client instance to cancel it.
 */
export type SwarpcClient<Procedures extends ProceduresMap> = {
    [zProcedures]: Procedures;
    /**
     * Create a proxy that cancels any ongoing call with the given global key before running new calls.
     * Usage: `await swarpc.onceBy("global-key").myMethod(...)`
     */
    onceBy: <K extends keyof Procedures>(key: string) => {
        [F in K]: (input: Schema.InferInput<Procedures[F]["input"]>, onProgress?: (progress: Schema.InferOutput<Procedures[F]["progress"]>) => void) => Promise<Schema.InferOutput<Procedures[F]["success"]>>;
    };
} & {
    [F in keyof Procedures]: ClientMethod<Procedures[F]>;
};
/**
 *
 * @param procedures procedures the client will be able to call, see {@link ProceduresMap}
 * @param options various options
 * @param options.worker The worker class, **not instantiated**, or a path to the source code. If not provided, the client will use the service worker. If a string is provided, it'll instantiate a regular `Worker`, not a `SharedWorker`.
 * Example: `"./worker.js"`
 * See {@link Worker} (used by both dedicated workers and service workers), {@link SharedWorker}, and
 * the different [worker types](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API#worker_types) that exist
 * @param options.hooks Hooks to run on messages received from the server. See {@link Hooks}
 * @param options.loglevel Maximum log level to use, defaults to "debug" (shows everything). "info" will not show debug messages, "warn" will only show warnings and errors, "error" will only show errors.
 * @param options.restartListener If true, will force the listener to restart even if it has already been started. You should probably leave this to false, unless you are testing and want to reset the client state.
 * @param options.localStorage Define a in-memory localStorage with the given key-value pairs. Allows code called on the server to access localStorage (even though SharedWorkers don't have access to the browser's real localStorage)
 * @param options.nodes the number of workers to use for the server, defaults to {@link navigator.hardwareConcurrency}.
 * @returns a sw&rpc client instance. Each property of the procedures map will be a method, that accepts an input and an optional onProgress callback, see {@link ClientMethod}
 *
 * An example of defining and using a client:
 * {@includeCode ../example/src/routes/+page.svelte}
 */
export declare function Client<Procedures extends ProceduresMap>(procedures: Procedures, { worker, nodes: nodeCount, loglevel, restartListener, hooks, localStorage, }?: {
    worker?: WorkerConstructor | string;
    nodes?: number;
    hooks?: Hooks<Procedures>;
    loglevel?: LogLevel;
    restartListener?: boolean;
    localStorage?: Record<string, any>;
}): SwarpcClient<Procedures>;
