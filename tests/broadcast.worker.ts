import { Server } from "../src/index.js";
import { procedures } from "./broadcast.procedures.js";

declare const self: DedicatedWorkerGlobalScope;

const server = Server(procedures, {
  scope: self,
  _scopeType: "dedicated",
  loglevel: "warn",
});

server.failOnSomeNodes(async (ratio, _, { nodeId, nodes }) => {
  const cutoff = Math.floor(ratio * nodes.size);
  const i = Array.from(nodes).toSorted().indexOf(nodeId);

  if (i < cutoff) {
    throw new Error(`Node ${nodeId} failing as part of failOnSomeNodes`);
  }

  return `Node #${i} succeeded`;
});

await server.start();
