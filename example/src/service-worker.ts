import { Server } from "swarpc";
import { procedures } from "./lib/procedures";

// 1. Give yourself a server instance
const swarpc = Server(procedures);

// 2. Implement your procedures
swarpc.multiply(async ({ a, b }, onProgress, { abortSignal, nodeId }) => {
  const updateProgress = (progress: number) =>
    onProgress({ progress, node: nodeId });

  abortSignal?.throwIfAborted();

  let result = 0;

  for (const i of Array.from({ length: b }).map((_, i) => i)) {
    result += a;
    updateProgress(i / b);
    await new Promise((r) => setTimeout(r, 500));
    abortSignal?.throwIfAborted();
  }

  updateProgress(1);

  return { result, node: nodeId };
});

// Start the server
swarpc.start();
