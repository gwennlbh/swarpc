// Dedicated worker implementation for swarpc testing
import { Server } from "swarpc";
import { type } from "arktype";

// Define simple test procedures with proper arktype schemas
const procedures = {
  // Simple computation that can be cancelled
  heavyComputation: {
    input: type({ iterations: "number" }),
    progress: type({ completed: "number", total: "number" }),
    success: type({ result: "string" }),
  },
  // Quick response test
  echo: {
    input: type({ message: "string" }),
    progress: type({}),
    success: type({ echo: "string" }),
  },
};

// Create server instance
const swarpc = Server(procedures);

// Implement procedures
swarpc.heavyComputation(async ({ iterations }, onProgress, tools) => {
  let aborted = false;
  tools.abortSignal?.addEventListener("abort", () => {
    aborted = true;
  });

  for (let i = 0; i < iterations && !aborted; i++) {
    onProgress({ completed: i + 1, total: iterations });
    // Simulate work
    await new Promise((resolve) => setTimeout(resolve, 10));
  }

  if (aborted) {
    throw new Error("Computation was cancelled");
  }

  return { result: `Completed ${iterations} iterations` };
});

swarpc.echo(async ({ message }) => {
  return { echo: `Echo: ${message}` };
});

// Start the server
swarpc.start(self);
