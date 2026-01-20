/**
 * @module
 * @mergeModuleWith <project>
 */

import type { StandardSchemaV1 as Schema } from "./standardschema.js";
import { ArrayOneOrMore } from "./utils.js";

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
export type ProcedureImplementation<
  I extends Schema,
  P extends Schema,
  S extends Schema,
> = (
  /**
   * Input data for the procedure
   */
  input: Schema.InferOutput<I>,
  /**
   * Callback to call with progress updates.
   */
  onProgress: (progress: Schema.InferInput<P>) => void,
  /**
   * Additional tools useful when implementing the procedure.
   */
  tools: {
    /**
     * AbortSignal that can be used to handle request cancellation -- see [Make cancellable requests](https://swarpc.js.org/#make-cancelable-requests)
     */
    abortSignal?: AbortSignal;
    /**
     * ID of the Node the request is being processed on.
     */
    nodeId: string;
    /**
     * IDs of all available Nodes.
     */
    nodes: Set<string>;
  },
) => Promise<Schema.InferInput<S>>;

/**
 * Declarations of procedures by name.
 *
 * An example of declaring procedures:
 * {@includeCode ../example/src/lib/procedures.ts}
 */
export type ProceduresMap = Record<string, Procedure<Schema, Schema, Schema>>;

/**
 * Implementations of procedures by name
 * @internal
 */
export type ImplementationsMap<Procedures extends ProceduresMap> = {
  [F in keyof Procedures]: ProcedureImplementation<
    Procedures[F]["input"],
    Procedures[F]["progress"],
    Procedures[F]["success"]
  >;
};

type ProcedureNameAndData<
  Procedures extends ProceduresMap,
  Key extends "progress" | "success",
> = {
  [K in keyof Procedures]: {
    procedure: K;
    data: Schema.InferOutput<Procedures[K][Key]>;
  };
}[keyof Procedures];

/**
 * Declaration of hooks to run on messages received from the server
 */
export type Hooks<Procedures extends ProceduresMap> = {
  /**
   * Called when a procedure call has been successful.
   */
  success?: (arg: ProcedureNameAndData<Procedures, "success">) => void;
  /**
   * Called when a procedure call has failed.
   */
  error?: (arg: { procedure: keyof Procedures; error: Error }) => void;
  /**
   * Called when a procedure call sends progress updates.
   */
  progress?: (arg: ProcedureNameAndData<Procedures, "progress">) => void;
};

/** @internal */
export type PayloadInitialize = {
  by: "sw&rpc";
  functionName: "#initialize";
  isInitializeRequest: true;
  localStorageData: Record<string, unknown>;
  nodeId: string;
  allNodeIDs: Set<string>;
};

/** @internal */
export function isPayloadInitialize(
  payload: unknown,
): payload is PayloadInitialize {
  if (typeof payload !== "object") return false;
  if (payload === null) return false;

  if (!("by" in payload)) return false;
  if (!("nodeId" in payload)) return false;
  if (!("functionName" in payload)) return false;
  if (!("localStorageData" in payload)) return false;
  if (!("isInitializeRequest" in payload)) return false;
  if (!("allNodeIDs" in payload)) return false;

  if (payload.by !== "sw&rpc") return false;
  if (payload.functionName !== "#initialize") return false;
  if (payload.isInitializeRequest !== true) return false;
  if (typeof payload.nodeId !== "string") return false;
  if (typeof payload.localStorageData !== "object") return false;
  if (payload.localStorageData === null) return false;

  return true;
}

/**
 * @internal
 */
export type PayloadHeader<
  PM extends ProceduresMap,
  Name extends keyof PM = keyof PM,
> = {
  by: "sw&rpc";
  functionName: Name & string;
  requestId: string;
};

/** @internal */
export function isPayloadHeader<PM extends ProceduresMap>(
  procedures: PM,
  payload: unknown,
): payload is PayloadHeader<PM> {
  if (typeof payload !== "object") return false;
  if (payload === null) return false;

  if (!("by" in payload)) return false;
  if (!("requestId" in payload)) return false;
  if (!("functionName" in payload)) return false;

  if (payload.by !== "sw&rpc") return false;
  if (typeof payload.requestId !== "string") return false;
  if (typeof payload.functionName !== "string") return false;
  if (!Object.keys(procedures).includes(payload.functionName)) return false;

  return true;
}

export type PayloadCore<
  PM extends ProceduresMap,
  Name extends keyof PM = keyof PM,
> =
  | {
      input: Schema.InferOutput<PM[Name]["input"]>;
    }
  | {
      progress: Schema.InferOutput<PM[Name]["progress"]>;
    }
  | {
      result: Schema.InferOutput<PM[Name]["success"]>;
    }
  | {
      abort: { reason: string };
    }
  | {
      error: { message: string };
    };

/**
 * @internal
 */
export function validatePayloadCore<
  PM extends ProceduresMap,
  Name extends keyof PM,
>(procedure: PM[Name], payload: unknown): PayloadCore<PM, keyof PM> {
  if (typeof payload !== "object") throw new Error("payload is not an object");
  if (payload === null) throw new Error("payload is null");

  if ("input" in payload) {
    const input = procedure.input["~standard"].validate(payload.input);
    if ("value" in input) return { input: input.value };
  }

  if ("progress" in payload) {
    const progress = procedure.progress["~standard"].validate(payload.progress);
    if ("value" in progress) return { progress: progress.value };
  }

  if ("result" in payload) {
    const result = procedure.success["~standard"].validate(payload.result);
    if ("value" in result) return { result: result.value };
  }

  if (
    "abort" in payload &&
    typeof payload.abort === "object" &&
    payload.abort !== null &&
    "reason" in payload.abort &&
    typeof payload.abort.reason === "string"
  ) {
    return { abort: { reason: payload.abort.reason } };
  }

  if (
    "error" in payload &&
    typeof payload.error === "object" &&
    payload.error !== null &&
    "message" in payload.error &&
    typeof payload.error.message === "string"
  ) {
    return { error: { message: payload.error.message } };
  }

  throw new Error("invalid payload");
}

/**
 * The effective payload as sent by the server to the client
 * @internal
 */
export type Payload<
  PM extends ProceduresMap,
  Name extends keyof PM = keyof PM,
> = (PayloadHeader<PM, Name> & PayloadCore<PM, Name>) | PayloadInitialize;

/**
 * The callable function signature for a client method
 */
export type ClientMethodCallable<P extends Procedure<Schema, Schema, Schema>> =
  (
    input: Schema.InferInput<P["input"]>,
    onProgress?: (progress: Schema.InferOutput<P["progress"]>) => void,
  ) => Promise<Schema.InferOutput<P["success"]>>;

/**
 * A procedure that broadcasts its request to multiple nodes.
 * The return value is an array of results, along with extra properties:
 * see {@link BroadcasterResultExtrasMixed}, {@link BroadcasterResultExtrasSuccess} and {@link BroadcasterResultExtrasFailure}
 */
export type Broadcaster<P extends Procedure<Schema, Schema, Schema>> = {
  /**
   * Returns an array of result values for each node.
   * @throws {AggregateError} with every failing node's error
   */
  orThrow: (
    input: Schema.InferInput<P["input"]>,
    onProgress?: (
      /** Map of node IDs to their progress updates */
      progresses: Map<string, Schema.InferOutput<P["progress"]>>,
    ) => void,
    /** Node IDs or number of nodes to send the request to. Leave undefined to send to all nodes. When sending a list of node IDs, "undefined" is interpreted as "run on the service worker" */
    nodes?: number | Array<string | undefined>,
  ) => Promise<Array<Schema.InferOutput<P["success"]>>>;
} & ((
  input: Schema.InferInput<P["input"]>,
  onProgress?: (
    /** Map of node IDs to their progress updates */
    progresses: Map<string, Schema.InferOutput<P["progress"]>>,
  ) => void,
  /** Node IDs or number of nodes to send the request to. Leave undefined to send to all nodes. When sending a list of node IDs, "undefined" is interpreted as "run on the service worker" */
  nodes?: number | Array<string | undefined>,
) => Promise<
  Array<
    PromiseSettledResult<Schema.InferOutput<P["success"]>> & {
      node: string;
    }
  > &
    (
      | BroadcasterResultExtrasMixed<P>
      | BroadcasterResultExtrasSuccess<P>
      | BroadcasterResultExtrasFailure
    )
>);

/**
 * Extra properties on the result of a broadcaster call, when some nodes succeeded and some failed
 */
export type BroadcasterResultExtrasMixed<
  P extends Procedure<Schema, Schema, Schema>,
> = {
  /** Undefined if no failures */
  failures: ArrayOneOrMore<PromiseRejectedResult & { node: string }>;
  /** Formatted error string, undefined if no failures */
  failureSummary: string;
  /** True if only failures */
  ko: false;
  /** True if no failures */
  ok: false;
  /** "mixed" if some failed and some succeeded, "fulfilled" if all succeeded and "rejected" if everything failed */
  status: "mixed";
  /** All values of successful calls */
  successes: ArrayOneOrMore<Schema.InferOutput<P["success"]>>;
  /** Map of node ID to its result or failure */
  byNode: Map<string, PromiseSettledResult<Schema.InferOutput<P["success"]>>>;
};

/**
 * Extra properties on the result of a broadcaster call, when all nodes succeeded
 */
export type BroadcasterResultExtrasSuccess<
  P extends Procedure<Schema, Schema, Schema>,
> = {
  failures: [];
  failureSummary: undefined;
  ko: false;
  ok: true;
  status: "fulfilled";
  successes: ArrayOneOrMore<Schema.InferOutput<P["success"]>>;
  byNode: Map<string, PromiseFulfilledResult<Schema.InferOutput<P["success"]>>>;
};

/**
 * Extra properties on the result of a broadcaster call, when all nodes failed
 */
export type BroadcasterResultExtrasFailure = {
  failures: ArrayOneOrMore<PromiseRejectedResult & { node: string }>;
  failureSummary: string;
  ko: true;
  ok: false;
  status: "rejected";
  successes: [];
  byNode: Map<string, PromiseRejectedResult>;
};

type ClientMethodExtraCallables<P extends Procedure<Schema, Schema, Schema>> = {
  /**
   * A method that returns a `CancelablePromise`. Cancel it by calling `.cancel(reason)` on it, and wait for the request to resolve by awaiting the `request` property on the returned object.
   */
  cancelable: (
    input: Schema.InferInput<P["input"]>,
    onProgress?: (progress: Schema.InferOutput<P["progress"]>) => void,
    requestId?: string,
  ) => CancelablePromise<Schema.InferOutput<P["success"]>>;
  /**
   * Send the request to specific nodes, or all nodes.
   * Returns an array of results, one for each node the request was sent to.
   * Each result is a {@link PromiseSettledResult}, with also an additional property, the node ID of the request
   * The results array also has extra properties for convenience, see {@link BroadcasterResultExtrasMixed}, {@link BroadcasterResultExtrasSuccess} and {@link BroadcasterResultExtrasFailure}
   */
  broadcast: Broadcaster<P> & {
    /**
     * Send the request to specific nodes, or all nodes.
     * Cancels any previous ongoing calls of this procedure on the nodes beforehand.
     * Returns an array of results, one for each node the request was sent to.
     * Each result is a {@link PromiseSettledResult}, with also an additional property, the node ID of the request. The results array also has extra properties for convenience, see {@link BroadcasterResultExtrasMixed}, {@link BroadcasterResultExtrasSuccess} and {@link BroadcasterResultExtrasFailure}
     */
    once: Broadcaster<P>;
    /**
     * Send the request to specific nodes, or all nodes.
     * Cancels any previous ongoing calls of this procedure on the nodes beforehand that were also run with the specified concurrency key (first argument). See .onceBy for more details.
     * Returns an array of results, one for each node the request was sent to.
     * Each result is a {@link PromiseSettledResult}, with also an additional property, the node ID of the request. The results array also has extra properties for convenience, see {@link BroadcasterResultExtrasMixed}, {@link BroadcasterResultExtrasSuccess} and {@link BroadcasterResultExtrasFailure}
     */
    onceBy: ((
      key: string,
      ...args: Parameters<Broadcaster<P>>
    ) => ReturnType<Broadcaster<P>>) & {
      /**
       * Returns an array of result values for each node.
       * Throws if any node failed.
       * @throws {AggregateError} with every failing node's error
       */
      orThrow: (
        key: string,
        ...args: Parameters<Broadcaster<P>>
      ) => Promise<Array<Schema.InferOutput<P["success"]>>>;
    };
  };
  /**
   * Call the procedure, cancelling any previous ongoing call of this procedure beforehand.
   */
  once: (
    input: Schema.InferInput<P["input"]>,
    onProgress?: (progress: Schema.InferOutput<P["progress"]>) => void,
  ) => Promise<Schema.InferOutput<P["success"]>>;
  /**
   * Call the procedure with a concurrency key, cancelling any previous ongoing call of this procedure with the same key beforehand.
   */
  onceBy: (
    key: string,
    input: Schema.InferInput<P["input"]>,
    onProgress?: (progress: Schema.InferOutput<P["progress"]>) => void,
  ) => Promise<Schema.InferOutput<P["success"]>>;
};

/**
 * A procedure's corresponding method on the client instance -- used to call the procedure. If you want to be able to cancel the request, you can use the `cancelable` method instead of running the procedure directly.
 */
export type ClientMethod<P extends Procedure<Schema, Schema, Schema>> =
  ClientMethodCallable<P> & ClientMethodExtraCallables<P>;

export const zImplementations = Symbol("SWARPC implementations");

/**
 * Symbol used as the key for the procedures map on instances
 * @internal
 */
export const zProcedures = Symbol("SWARPC procedures");

export type WorkerConstructor<
  T extends Worker | SharedWorker = Worker | SharedWorker,
> = {
  new (opts?: { name?: string }): T;
};

/**
 * A cancelable request was cancelled (either via .cancelable's .cancel() or via a .once / .onceBy call)
 */
export class RequestCancelledError extends Error {
  constructor(reason: string) {
    super(`Request was cancelled: ${reason}`);
    this.name = "RequestCancelledError";
  }
}
