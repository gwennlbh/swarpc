import { Server } from "../src/index.js";
import { procedures } from "./hooks.procedures.js";

declare const self: DedicatedWorkerGlobalScope;

const server = Server(procedures, {
  scope: self,
  _scopeType: "dedicated",
  loglevel: "warn",
});
server.echo(async ({ value }) => value);
server.add(async ({ a, b }) => a + b);
server.sleep(async ({ ms }) => {
  await new Promise((r) => setTimeout(r, ms));
});
server.divide(async ({ a, b }, onProgress) => {
  for (let i = 1; i <= 3; i++) {
    await new Promise((r) => setTimeout(r, 5));
    onProgress({ percent: (i / 3) * 100 });
  }
  if (b === 0) throw new Error("Division by zero");
  return a / b;
});

await server.start();
