import { PendingRequest } from "./client.js";
import { scopeIsDedicated, scopeIsShared } from "./scopes.js";

/**
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
 * @source
 */
export function makeNodeId(): string {
  return "N" + Math.random().toString(16).substring(2, 5).toUpperCase();
}
