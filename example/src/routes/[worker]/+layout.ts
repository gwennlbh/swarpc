import { procedures } from "$lib/procedures";
import SharedWorker from "$lib/../service-worker?sharedworker";
import Worker from "$lib/../service-worker?worker";
import { error } from "@sveltejs/kit";
import { Client } from "swarpc";

export const ssr = false;

export async function load({ params, url: { searchParams } }) {
  const nodesCount = Number.parseInt(searchParams.get("nodes") ?? "1");

  switch (params.worker) {
    case "shared":
      return {
        swarpc: Client(procedures, {
          worker: SharedWorker,
          nodes: nodesCount,
        }),
      };

    case "dedicated":
      return {
        swarpc: Client(procedures, {
          worker: Worker,
          nodes: nodesCount,
        }),
      };

    case "service":
      if ("serviceWorker" in navigator) {
        addEventListener("load", function () {
          navigator.serviceWorker.register("./src/service-worker.ts");
        });
      }
      return {
        swarpc: Client(procedures),
      };
  }

  error(400, "Invalid worker type");
}
