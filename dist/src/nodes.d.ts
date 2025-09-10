import { PendingRequest } from "./client.js";
/**
 * Returns to which node to send the next request, given the state of the currently pending requests
 */
export declare function whoToSendTo(nodes: undefined | Record<string, unknown>, requests: Map<string, PendingRequest>): undefined | string;
export declare function nodeIdFromScope(scope: WorkerGlobalScope, _scopeType?: "dedicated" | "shared" | "service"): string;
/**
 * Generate a random request ID, used to identify nodes in the client
 * @source
 */
export declare function makeNodeId(): string;
//# sourceMappingURL=nodes.d.ts.map