import { Server } from "../src/index.js";
import { procedures } from "./core.procedures.js";

declare const self: DedicatedWorkerGlobalScope;

const server = Server(procedures, {
  scope: self,
  _scopeType: "dedicated",
  loglevel: "warn",
});

server.hello(async (input) => {
  return `Hello ${input}`;
});

server.helloWithProgress(async (input, onProgress) => {
  for (let i = 0; i < 10; i++) {
    onProgress({ current: i, total: 10 });
  }
  return `Hello with progress ${input}`;
});

server.cancellable(async (input, onProgress, { abortSignal }) => {
  abortSignal?.throwIfAborted();

  const total = typeof input === "number" ? input : 10;

  for (let i = 0; i < total; i++) {
    abortSignal?.throwIfAborted();
    onProgress({ current: i, total });
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  return `Cancellable hello ${input}`;
});

server.complexData(async (input, onProgress) => {
  onProgress({ message: "Processing data", percent: 50 });
  return { message: `Processed data for ${input.name}`, addr: input.address };
});

server.accessLocalStorage(async (key) => {
  return {
    value: localStorage.getItem(key),
    allKeys: new Array({ length: localStorage.length }).map(
      (_, i) => localStorage.key(i)!,
    ),
  };
});

await server.start();
