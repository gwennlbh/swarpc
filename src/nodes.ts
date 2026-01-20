import { PendingRequest } from "./client.js";
import { scopeIsDedicated, scopeIsShared } from "./scopes.js";

/**
 * @internal
 * Returns to which node to send the next request, given the state of the currently pending requests
 */
export function whoToSendTo(
  nodes: undefined | Record<string, unknown>,
  requests: Map<string, PendingRequest>,
): undefined | string {
  if (!nodes) return undefined;

  let chosen = Object.keys(nodes)[0];

  const requestsPerNode = Map.groupBy(requests.values(), (req) => req.nodeId);

  for (const node of Object.keys(nodes)) {
    if (!requestsPerNode.has(node)) requestsPerNode.set(node, []);
  }

  for (const [node, reqs] of requestsPerNode.entries()) {
    if (!node) continue;

    // Send to the least busy node
    if (reqs.length < requestsPerNode.get(chosen)!.length) chosen = node;
  }

  console.debug(
    "[SWARPC Load balancer] Choosing",
    chosen,
    "load map is",
    requestsPerNode,
  );

  return chosen;
}

/**
 * @internal
 */
export function nodeIdFromScope(
  scope: WorkerGlobalScope,
  _scopeType?: "dedicated" | "shared" | "service",
): string {
  if (scopeIsDedicated(scope, _scopeType) || scopeIsShared(scope, _scopeType)) {
    return scope.name;
  }

  return "(SW)";
}

/**
 * Generate a random request ID, used to identify nodes in the client
 * @internal
 */
export function makeNodeId(): string {
  return "N" + Math.random().toString(16).substring(2, 5).toUpperCase();
}

const serviceWorkerNodeId = "(SW)" as const; // Fixed ID for the service worker, as there's only one

/**
 * @internal
 */
export function nodeIdOrSW(
  id: string | undefined,
): string | typeof serviceWorkerNodeId {
  return id ?? serviceWorkerNodeId;
}

/**
 * Determines which nodes to send a broadcast request to
 * @internal
 *
 * Returns undefined as node ID if running in the service worker
 */
export function broadcastNodes(
  /** List of node IDs or undefined is running on the service worker */
  nodes: undefined | string[],
  /** Node IDs, or number of nodes to send the broadcast to. Leave undefined for all nodes */
  target: Array<string | undefined> | number | undefined,
): Array<string | undefined> {
  if (target && Array.isArray(target)) return target;
  let nodesToUse: Array<string | undefined> = [undefined];
  if (nodes) nodesToUse = [...nodes];
  if (typeof target === "number") nodesToUse = nodesToUse.slice(0, target);

  return nodesToUse;
}
