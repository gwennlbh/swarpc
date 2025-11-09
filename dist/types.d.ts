/**
 * @module
 * @mergeModuleWith <project>
 */
import type { StandardSchemaV1 as Schema } from "./standardschema.js";
/**
 * A procedure declaration
 */
export type Procedure<I extends Schema, P extends Schema, S extends Schema> = {
    /**
     * ArkType type for the input (first argument) of the procedure, when calling it from the client.
     */
    input: I;
    /**
     * ArkType type for the data as the first argument given to the `onProgress` callback
     * when calling the procedure from the client.
     */
    progress: P;
    /**
     * ArkType type for the output (return value) of the procedure, when calling it from the client.
     */
    success: S;
    /**
     * When should the procedure automatically add ArrayBuffers and other transferable objects
     * to the [transfer list](https://developer.mozilla.org/en-US/docs/Web/API/DedicatedWorkerGlobalScope/postMessage#transfer)
     * when sending messages, both from the client to the server and vice versa.
     *
     * Transferring objects can improve performance by avoiding copies of large objects,
     * but _moves_ them to the other context, meaning that they cannot be used in the original context after being sent.
     *
     * 'output-only' by default: only transferables sent from the server to the client will be transferred.
     */
    autotransfer?: "always" | "never" | "output-only";
};
/**
 * A promise that you can cancel by calling `.cancel(reason)` on it:
 *
 * ```js
 * const { request, cancel } = client.runProcedure.cancelable(input, onProgress)
 * setTimeout(() => cancel("Cancelled by user"), 1000)
 * const result = await request
 * ```
 */
export type CancelablePromise<T = unknown> = {
    request: Promise<T>;
    /**
     * Abort the request.
     * @param reason The reason for cancelling the request.
     */
    cancel: (reason: string) => void;
};
/**
 * An implementation of a procedure
 */
export type ProcedureImplementation<I extends Schema, P extends Schema, S extends Schema> = (
/**
 * Input data for the procedure
 */
input: Schema.InferInput<I>, 
/**
 * Callback to call with progress updates.
 */
onProgress: (progress: Schema.InferInput<P>) => void, 
/**
 * Additional tools useful when implementing the procedure.
 */
tools: {
    /**
     * AbortSignal that can be used to handle request cancellation -- see [Make cancellable requests](https://gwennlbh.github.io/swarpc/docs/#make-cancelable-requests)
     */
    abortSignal?: AbortSignal;
    /**
     * ID of the Node the request is being processed on.
     */
    nodeId: string;
}) => Promise<Schema.InferInput<S>>;
/**
 * Declarations of procedures by name.
 *
 * An example of declaring procedures:
 * {@includeCode ../example/src/lib/procedures.ts}
 */
export type ProceduresMap = Record<string, Procedure<Schema, Schema, Schema>>;
/**
 * Declaration of hooks to run on messages received from the server
 */
export type Hooks<Procedures extends ProceduresMap> = {
    /**
     * Called when a procedure call has been successful.
     */
    success?: <Procedure extends keyof ProceduresMap>(procedure: Procedure, data: Schema.InferOutput<Procedures[Procedure]["success"]>) => void;
    /**
     * Called when a procedure call has failed.
     */
    error?: <Procedure extends keyof ProceduresMap>(procedure: Procedure, error: Error) => void;
    /**
     * Called when a procedure call sends progress updates.
     */
    progress?: <Procedure extends keyof ProceduresMap>(procedure: Procedure, data: Schema.InferOutput<Procedures[Procedure]["progress"]>) => void;
};
export type PayloadCore<PM extends ProceduresMap, Name extends keyof PM = keyof PM> = {
    input: Schema.InferOutput<PM[Name]["input"]>;
} | {
    progress: Schema.InferOutput<PM[Name]["progress"]>;
} | {
    result: Schema.InferOutput<PM[Name]["success"]>;
} | {
    abort: {
        reason: string;
    };
} | {
    error: {
        message: string;
    };
};
/**
 * A procedure's corresponding method on the client instance -- used to call the procedure. If you want to be able to cancel the request, you can use the `cancelable` method instead of running the procedure directly.
 */
export type ClientMethod<P extends Procedure<Schema, Schema, Schema>> = ((input: Schema.InferInput<P["input"]>, onProgress?: (progress: Schema.InferOutput<P["progress"]>) => void) => Promise<Schema.InferOutput<P["success"]>>) & {
    /**
     * A method that returns a `CancelablePromise`. Cancel it by calling `.cancel(reason)` on it, and wait for the request to resolve by awaiting the `request` property on the returned object.
     */
    cancelable: (input: Schema.InferInput<P["input"]>, onProgress?: (progress: Schema.InferOutput<P["progress"]>) => void, requestId?: string) => CancelablePromise<Schema.InferOutput<P["success"]>>;
    /**
     * Send the request to specific nodes, or all nodes.
     * Returns an array of results, one for each node the request was sent to.
     * Each result is a {@link PromiseSettledResult}, with also an additional property, the node ID of the request
     */
    broadcast: (input: Schema.InferInput<P["input"]>, onProgress?: (
    /** Map of node IDs to their progress updates */
    progresses: Map<string, Schema.InferOutput<P["progress"]>>) => void, 
    /** Number of nodes to send the request to. Leave undefined to send to all nodes */
    nodes?: number) => Promise<Array<PromiseSettledResult<Schema.InferOutput<P["success"]>> & {
        node: string;
    }>>;
};
export type WorkerConstructor<T extends Worker | SharedWorker = Worker | SharedWorker> = {
    new (opts?: {
        name?: string;
    }): T;
};
