import { type Logger, type RequestBoundLogger } from "./log.js";
import { type Payload } from "./payload.js";
import { type Hooks, type PendingRequest, type ProceduresMap } from "./types.js";
/**
 * Context for passing around data useful for requests
 */
export type Context<Procedures extends ProceduresMap> = {
    /** A logger, bound to the client */
    logger: Logger;
    /** The node to use */
    node: Worker | SharedWorker | undefined;
    /** The ID of the node to use */
    nodeId: string | undefined;
    /** Set of all available nodes' IDs */
    allNodeIDs: Set<string>;
    /** Hooks defined by the client */
    hooks: Hooks<Procedures>;
    /** Local storage data defined by the client for the faux local storage */
    localStorage: Record<string, any>;
};
/**
 * Pending requests are stored in a map, where the key is the request ID.
 * Each request has a set of handlers: resolve, reject, and onProgress.
 * This allows having a single listener for the client, and having multiple in-flight calls to the same procedure.
 */
export declare const pendingRequests: Map<string, PendingRequest>;
export declare let _clientListeners: Map<string, {
    disconnect: () => void;
}>;
/**
 * Warms up the client by starting the listener and getting the worker, then posts a message to the worker.
 */
export declare function postMessage<Procedures extends ProceduresMap>(ctx: Context<Procedures>, message: Payload<Procedures>, options?: StructuredSerializeOptions): Promise<void>;
/**
 * A quicker version of postMessage that does not try to start the client listener, await the service worker, etc.
 * esp. useful for abort logic that needs to not be... put behind everything else on the event loop.
 */
export declare function postMessageSync<Procedures extends ProceduresMap>(l: RequestBoundLogger, worker: Worker | SharedWorker | undefined, message: Payload<Procedures>, options?: StructuredSerializeOptions): void;
/**
 * Generate a random request ID, used to identify requests between client and server.
 * @source
 * @returns a 6-character hexadecimal string
 */
export declare function makeRequestId(): string;
