import fetchProgress from "fetch-progress";
import { Server } from "swarpc";
import { procedures } from "./lib/procedures";

// 1. Give yourself a server instance
const swarpc = Server(procedures);

// 2. Implement your procedures
swarpc.getClassmapping(async ({ ref, delay }, onProgress, tools) => {
  let aborted = false;
  tools.abortSignal?.addEventListener("abort", () => {
    aborted = true;
  });

  for (let i = 0; i < delay * 1e3; i += 100) {
    if (!aborted) {
      onProgress({ transferred: i, total: delay * 1e3 });
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  return fetch(
    `https://raw.githubusercontent.com/cigaleapp/models/${ref}/polymny-17k-classmapping.txt`,
    { signal: tools.abortSignal },
  )
    .then(fetchProgress({ onProgress }))
    .then((response) => response.text())
    .then((text) => text.split("\n"));
});

// Start the server
swarpc.start(self);
