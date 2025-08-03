/**
 * @module
 * @mergeModuleWith <project>
 */
import { type Type } from "arktype";
import { RequestBoundLogger } from "./log.js";
/**
 * A procedure declaration
 */
export type Procedure<I extends Type, P extends Type, S extends Type> = {
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
export type ProcedureImplementation<I extends Type, P extends Type, S extends Type> = (
/**
 * Input data for the procedure
 */
input: I["inferOut"], 
/**
 * Callback to call with progress updates.
 */
onProgress: (progress: P["inferIn"]) => void, 
/**
 * Additional tools useful when implementing the procedure.
 */
tools: {
    /**
     * AbortSignal that can be used to handle request cancellation -- see [Make cancellable requests](https://gwennlbh.github.io/swarpc/docs/#make-cancelable-requests)
     */
    abortSignal?: AbortSignal;
    /**
     * Logger instance to use for logging messages related to this procedure call, using the same format as SWARPC's built-in logging.
     */
    logger: RequestBoundLogger;
}) => Promise<S["inferIn"]>;
/**
 * Declarations of procedures by name.
 *
 * An example of declaring procedures:
 * {@includeCode ../example/src/lib/procedures.ts}
 */
export type ProceduresMap = Record<string, Procedure<Type, Type, Type>>;
/**
 * Implementations of procedures by name
 */
export type ImplementationsMap<Procedures extends ProceduresMap> = {
    [F in keyof Procedures]: ProcedureImplementation<Procedures[F]["input"], Procedures[F]["progress"], Procedures[F]["success"]>;
};
/**
 * Declaration of hooks to run on messages received from the server
 */
export type Hooks<Procedures extends ProceduresMap> = {
    /**
     * Called when a procedure call has been successful.
     */
    success?: <Procedure extends keyof ProceduresMap>(procedure: Procedure, data: Procedures[Procedure]["success"]["inferOut"]) => void;
    /**
     * Called when a procedure call has failed.
     */
    error?: <Procedure extends keyof ProceduresMap>(procedure: Procedure, error: Error) => void;
    /**
     * Called when a procedure call sends progress updates.
     */
    progress?: <Procedure extends keyof ProceduresMap>(procedure: Procedure, data: Procedures[Procedure]["progress"]["inferOut"]) => void;
};
/**
 * @source
 */
export declare const PayloadHeaderSchema: import("arktype").Generic<[["Name", string]], {
    readonly by: "\"sw&rpc\"";
    readonly functionName: "Name";
    readonly requestId: "string >= 1";
}, {}, {}>;
export type PayloadHeader<PM extends ProceduresMap, Name extends keyof PM = keyof PM> = {
    by: "sw&rpc";
    functionName: Name & string;
    requestId: string;
};
/**
 * @source
 */
export declare const PayloadCoreSchema: import("arktype").Generic<[["I", unknown], ["P", unknown], ["S", unknown]], {
    readonly "input?": "I";
    readonly "progress?": "P";
    readonly "result?": "S";
    readonly "abort?": {
        readonly reason: "string";
    };
    readonly "error?": {
        readonly message: "string";
    };
}, {}, {}>;
export type PayloadCore<PM extends ProceduresMap, Name extends keyof PM = keyof PM> = {
    input: PM[Name]["input"]["inferOut"];
} | {
    progress: PM[Name]["progress"]["inferOut"];
} | {
    result: PM[Name]["success"]["inferOut"];
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
 * @source
 */
export declare const PayloadSchema: import("arktype").Generic<[["Name", string], ["I", unknown], ["P", unknown], ["S", unknown]], readonly ["PayloadHeaderSchema<Name>", "&", "PayloadCoreSchema<I, P, S>"], {
    PayloadCoreSchema: import("arktype/internal/scope.ts").bindGenericToScope<import("@ark/schema").GenericAst<[["I", unknown], ["P", unknown], ["S", unknown]], {
        readonly "input?": "I";
        readonly "progress?": "P";
        readonly "result?": "S";
        readonly "abort?": {
            readonly reason: "string";
        };
        readonly "error?": {
            readonly message: "string";
        };
    }, {}, {}>, {
        PayloadCoreSchema: import("@ark/schema").GenericAst<[["I", unknown], ["P", unknown], ["S", unknown]], {
            readonly "input?": "I";
            readonly "progress?": "P";
            readonly "result?": "S";
            readonly "abort?": {
                readonly reason: "string";
            };
            readonly "error?": {
                readonly message: "string";
            };
        }, {}, {}>;
        PayloadHeaderSchema: import("@ark/schema").GenericAst<[["Name", string]], {
            readonly by: "\"sw&rpc\"";
            readonly functionName: "Name";
            readonly requestId: "string >= 1";
        }, {}, {}>;
    } & {}>;
    PayloadHeaderSchema: import("arktype/internal/scope.ts").bindGenericToScope<import("@ark/schema").GenericAst<[["Name", string]], {
        readonly by: "\"sw&rpc\"";
        readonly functionName: "Name";
        readonly requestId: "string >= 1";
    }, {}, {}>, {
        PayloadCoreSchema: import("@ark/schema").GenericAst<[["I", unknown], ["P", unknown], ["S", unknown]], {
            readonly "input?": "I";
            readonly "progress?": "P";
            readonly "result?": "S";
            readonly "abort?": {
                readonly reason: "string";
            };
            readonly "error?": {
                readonly message: "string";
            };
        }, {}, {}>;
        PayloadHeaderSchema: import("@ark/schema").GenericAst<[["Name", string]], {
            readonly by: "\"sw&rpc\"";
            readonly functionName: "Name";
            readonly requestId: "string >= 1";
        }, {}, {}>;
    } & {}>;
}, {
    PayloadCoreSchema: import("arktype/internal/scope.ts").bindGenericToScope<import("@ark/schema").GenericAst<[["I", unknown], ["P", unknown], ["S", unknown]], {
        readonly "input?": "I";
        readonly "progress?": "P";
        readonly "result?": "S";
        readonly "abort?": {
            readonly reason: "string";
        };
        readonly "error?": {
            readonly message: "string";
        };
    }, {}, {}>, {
        PayloadCoreSchema: import("@ark/schema").GenericAst<[["I", unknown], ["P", unknown], ["S", unknown]], {
            readonly "input?": "I";
            readonly "progress?": "P";
            readonly "result?": "S";
            readonly "abort?": {
                readonly reason: "string";
            };
            readonly "error?": {
                readonly message: "string";
            };
        }, {}, {}>;
        PayloadHeaderSchema: import("@ark/schema").GenericAst<[["Name", string]], {
            readonly by: "\"sw&rpc\"";
            readonly functionName: "Name";
            readonly requestId: "string >= 1";
        }, {}, {}>;
    } & {}>;
    PayloadHeaderSchema: import("arktype/internal/scope.ts").bindGenericToScope<import("@ark/schema").GenericAst<[["Name", string]], {
        readonly by: "\"sw&rpc\"";
        readonly functionName: "Name";
        readonly requestId: "string >= 1";
    }, {}, {}>, {
        PayloadCoreSchema: import("@ark/schema").GenericAst<[["I", unknown], ["P", unknown], ["S", unknown]], {
            readonly "input?": "I";
            readonly "progress?": "P";
            readonly "result?": "S";
            readonly "abort?": {
                readonly reason: "string";
            };
            readonly "error?": {
                readonly message: "string";
            };
        }, {}, {}>;
        PayloadHeaderSchema: import("@ark/schema").GenericAst<[["Name", string]], {
            readonly by: "\"sw&rpc\"";
            readonly functionName: "Name";
            readonly requestId: "string >= 1";
        }, {}, {}>;
    } & {}>;
}>;
/**
 * The effective payload as sent by the server to the client
 */
export type Payload<PM extends ProceduresMap, Name extends keyof PM = keyof PM> = PayloadHeader<PM, Name> & PayloadCore<PM, Name>;
/**
 * A procedure's corresponding method on the client instance -- used to call the procedure. If you want to be able to cancel the request, you can use the `cancelable` method instead of running the procedure directly.
 */
export type ClientMethod<P extends Procedure<Type, Type, Type>> = ((input: P["input"]["inferIn"], onProgress?: (progress: P["progress"]["inferOut"]) => void) => Promise<P["success"]["inferOut"]>) & {
    /**
     * A method that returns a `CancelablePromise`. Cancel it by calling `.cancel(reason)` on it, and wait for the request to resolve by awaiting the `request` property on the returned object.
     */
    cancelable: (input: P["input"]["inferIn"], onProgress?: (progress: P["progress"]["inferOut"]) => void, requestId?: string) => CancelablePromise<P["success"]["inferOut"]>;
};
/**
 * Symbol used as the key for the procedures map on the server instance
 * @internal
 * @source
 */
export declare const zImplementations: unique symbol;
/**
 * Symbol used as the key for the procedures map on instances
 * @internal
 * @source
 */
export declare const zProcedures: unique symbol;
//# sourceMappingURL=types.d.ts.map