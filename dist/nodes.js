import { scopeIsDedicated, scopeIsShared } from "./scopes.js";
export function whoToSendTo(nodes, requests) {
    if (!nodes)
        return undefined;
    let chosen = Object.keys(nodes)[0];
    const requestsPerNode = Map.groupBy(requests.values(), (req) => req.nodeId);
    for (const node of Object.keys(nodes)) {
        if (!requestsPerNode.has(node))
            requestsPerNode.set(node, []);
    }
    for (const [node, reqs] of requestsPerNode.entries()) {
        if (!node)
            continue;
        if (reqs.length < requestsPerNode.get(chosen).length)
            chosen = node;
    }
    console.debug("[SWARPC Load balancer] Choosing", chosen, "load map is", requestsPerNode);
    return chosen;
}
export function nodeIdFromScope(scope, _scopeType) {
    if (scopeIsDedicated(scope, _scopeType) || scopeIsShared(scope, _scopeType)) {
        return scope.name;
    }
    return "(SW)";
}
export function makeNodeId() {
    return "N" + Math.random().toString(16).substring(2, 5).toUpperCase();
}
const serviceWorkerNodeId = "(SW)";
export function nodeIdOrSW(id) {
    return id ?? serviceWorkerNodeId;
}
export function broadcastNodes(nodes, target) {
    if (target && Array.isArray(target))
        return target;
    let nodesToUse = [undefined];
    if (nodes)
        nodesToUse = [...nodes];
    if (typeof target === "number")
        nodesToUse = nodesToUse.slice(0, target);
    return nodesToUse;
}
