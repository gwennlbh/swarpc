import "@vitest/web-worker";
import { afterAll, describe, expect, test } from "vitest";
import { Client } from "../src/index.js";
import { procedures } from "./broadcast.procedures.js";
// @ts-ignore
// oxlint-disable-next-line import/default
import Worker from "./broadcast.worker.js?worker";

const client = Client(procedures, {
  worker: Worker,
  nodes: 10,
  loglevel: "warn",
  nodeIds: range(10).map((i) => `node-${i}`),
});

afterAll(() => {
  console.info("Destroying broadcast client");
  client.destroy();
});

describe(".orThrow()", () => {
  test("If one node fails", async () => {
    await expect(
      client.failOnSomeNodes.broadcast.orThrow(1 / 10),
    ).rejects.toThrowErrorMatchingInlineSnapshot(`[AggregateError]`);
  });

  test("If more nodes fail", async () => {
    await expect(
      client.failOnSomeNodes.broadcast.orThrow(1 / 2),
    ).rejects.toThrowErrorMatchingInlineSnapshot(`[AggregateError]`);
  });

  test("If no nodes fail", async () => {
    const results = await client.failOnSomeNodes.broadcast.orThrow(0);
    expect.soft(results.length).toBe(10);
    range(10).forEach((i) =>
      expect.soft(results).toContain(`Node #${i} succeeded`),
    );
  });
});

describe("extra properties", () => {
  test("status=mixed", async () => {
    const result = await client.failOnSomeNodes.broadcast(5 / 10);

    expect(result.byNode).toMatchInlineSnapshot(`
      Map {
        "node-0" => {
          "reason": [Error: Node node-0 failing as part of failOnSomeNodes],
          "status": "rejected",
        },
        "node-1" => {
          "reason": [Error: Node node-1 failing as part of failOnSomeNodes],
          "status": "rejected",
        },
        "node-2" => {
          "reason": [Error: Node node-2 failing as part of failOnSomeNodes],
          "status": "rejected",
        },
        "node-3" => {
          "reason": [Error: Node node-3 failing as part of failOnSomeNodes],
          "status": "rejected",
        },
        "node-4" => {
          "reason": [Error: Node node-4 failing as part of failOnSomeNodes],
          "status": "rejected",
        },
        "node-5" => {
          "status": "fulfilled",
          "value": "Node #5 succeeded",
        },
        "node-6" => {
          "status": "fulfilled",
          "value": "Node #6 succeeded",
        },
        "node-7" => {
          "status": "fulfilled",
          "value": "Node #7 succeeded",
        },
        "node-8" => {
          "status": "fulfilled",
          "value": "Node #8 succeeded",
        },
        "node-9" => {
          "status": "fulfilled",
          "value": "Node #9 succeeded",
        },
      }
    `);
    expect(result.failureSummary).toMatchInlineSnapshot(`
      "Node node-0: Error: Node node-0 failing as part of failOnSomeNodes;
      Node node-1: Error: Node node-1 failing as part of failOnSomeNodes;
      Node node-2: Error: Node node-2 failing as part of failOnSomeNodes;
      Node node-3: Error: Node node-3 failing as part of failOnSomeNodes;
      Node node-4: Error: Node node-4 failing as part of failOnSomeNodes"
    `);
    expect(result.failures).toMatchInlineSnapshot(`
      [
        {
          "node": "node-0",
          "reason": [Error: Node node-0 failing as part of failOnSomeNodes],
          "status": "rejected",
        },
        {
          "node": "node-1",
          "reason": [Error: Node node-1 failing as part of failOnSomeNodes],
          "status": "rejected",
        },
        {
          "node": "node-2",
          "reason": [Error: Node node-2 failing as part of failOnSomeNodes],
          "status": "rejected",
        },
        {
          "node": "node-3",
          "reason": [Error: Node node-3 failing as part of failOnSomeNodes],
          "status": "rejected",
        },
        {
          "node": "node-4",
          "reason": [Error: Node node-4 failing as part of failOnSomeNodes],
          "status": "rejected",
        },
      ]
    `);
    expect(result.successes).toMatchInlineSnapshot(`
      [
        "Node #5 succeeded",
        "Node #6 succeeded",
        "Node #7 succeeded",
        "Node #8 succeeded",
        "Node #9 succeeded",
      ]
    `);
    expect(result.ok).toBe(false);
    expect(result.ko).toBe(false);
    expect(result.status).toBe("mixed");
  });

  test("status=fulfilled", async () => {
    const result = await client.failOnSomeNodes.broadcast(0);

    expect(result.byNode).toMatchInlineSnapshot(`
      Map {
        "node-0" => {
          "status": "fulfilled",
          "value": "Node #0 succeeded",
        },
        "node-1" => {
          "status": "fulfilled",
          "value": "Node #1 succeeded",
        },
        "node-2" => {
          "status": "fulfilled",
          "value": "Node #2 succeeded",
        },
        "node-3" => {
          "status": "fulfilled",
          "value": "Node #3 succeeded",
        },
        "node-4" => {
          "status": "fulfilled",
          "value": "Node #4 succeeded",
        },
        "node-5" => {
          "status": "fulfilled",
          "value": "Node #5 succeeded",
        },
        "node-6" => {
          "status": "fulfilled",
          "value": "Node #6 succeeded",
        },
        "node-7" => {
          "status": "fulfilled",
          "value": "Node #7 succeeded",
        },
        "node-8" => {
          "status": "fulfilled",
          "value": "Node #8 succeeded",
        },
        "node-9" => {
          "status": "fulfilled",
          "value": "Node #9 succeeded",
        },
      }
    `);
    expect(result.failureSummary).toMatchInlineSnapshot(`""`);
    expect(result.failures).toMatchInlineSnapshot(`[]`);
    expect(result.successes).toMatchInlineSnapshot(`
      [
        "Node #0 succeeded",
        "Node #1 succeeded",
        "Node #2 succeeded",
        "Node #3 succeeded",
        "Node #4 succeeded",
        "Node #5 succeeded",
        "Node #6 succeeded",
        "Node #7 succeeded",
        "Node #8 succeeded",
        "Node #9 succeeded",
      ]
    `);
    expect(result.ok).toBe(true);
    expect(result.ko).toBe(false);
    expect(result.status).toBe("fulfilled");
  });

  test("status=rejected", async () => {
    const result = await client.failOnSomeNodes.broadcast(1);

    expect(result.byNode).toMatchInlineSnapshot(`
      Map {
        "node-0" => {
          "reason": [Error: Node node-0 failing as part of failOnSomeNodes],
          "status": "rejected",
        },
        "node-1" => {
          "reason": [Error: Node node-1 failing as part of failOnSomeNodes],
          "status": "rejected",
        },
        "node-2" => {
          "reason": [Error: Node node-2 failing as part of failOnSomeNodes],
          "status": "rejected",
        },
        "node-3" => {
          "reason": [Error: Node node-3 failing as part of failOnSomeNodes],
          "status": "rejected",
        },
        "node-4" => {
          "reason": [Error: Node node-4 failing as part of failOnSomeNodes],
          "status": "rejected",
        },
        "node-5" => {
          "reason": [Error: Node node-5 failing as part of failOnSomeNodes],
          "status": "rejected",
        },
        "node-6" => {
          "reason": [Error: Node node-6 failing as part of failOnSomeNodes],
          "status": "rejected",
        },
        "node-7" => {
          "reason": [Error: Node node-7 failing as part of failOnSomeNodes],
          "status": "rejected",
        },
        "node-8" => {
          "reason": [Error: Node node-8 failing as part of failOnSomeNodes],
          "status": "rejected",
        },
        "node-9" => {
          "reason": [Error: Node node-9 failing as part of failOnSomeNodes],
          "status": "rejected",
        },
      }
    `);
    expect(result.failureSummary).toMatchInlineSnapshot(`
      "Node node-0: Error: Node node-0 failing as part of failOnSomeNodes;
      Node node-1: Error: Node node-1 failing as part of failOnSomeNodes;
      Node node-2: Error: Node node-2 failing as part of failOnSomeNodes;
      Node node-3: Error: Node node-3 failing as part of failOnSomeNodes;
      Node node-4: Error: Node node-4 failing as part of failOnSomeNodes;
      Node node-5: Error: Node node-5 failing as part of failOnSomeNodes;
      Node node-6: Error: Node node-6 failing as part of failOnSomeNodes;
      Node node-7: Error: Node node-7 failing as part of failOnSomeNodes;
      Node node-8: Error: Node node-8 failing as part of failOnSomeNodes;
      Node node-9: Error: Node node-9 failing as part of failOnSomeNodes"
    `);
    expect(result.failures).toMatchInlineSnapshot(`
      [
        {
          "node": "node-0",
          "reason": [Error: Node node-0 failing as part of failOnSomeNodes],
          "status": "rejected",
        },
        {
          "node": "node-1",
          "reason": [Error: Node node-1 failing as part of failOnSomeNodes],
          "status": "rejected",
        },
        {
          "node": "node-2",
          "reason": [Error: Node node-2 failing as part of failOnSomeNodes],
          "status": "rejected",
        },
        {
          "node": "node-3",
          "reason": [Error: Node node-3 failing as part of failOnSomeNodes],
          "status": "rejected",
        },
        {
          "node": "node-4",
          "reason": [Error: Node node-4 failing as part of failOnSomeNodes],
          "status": "rejected",
        },
        {
          "node": "node-5",
          "reason": [Error: Node node-5 failing as part of failOnSomeNodes],
          "status": "rejected",
        },
        {
          "node": "node-6",
          "reason": [Error: Node node-6 failing as part of failOnSomeNodes],
          "status": "rejected",
        },
        {
          "node": "node-7",
          "reason": [Error: Node node-7 failing as part of failOnSomeNodes],
          "status": "rejected",
        },
        {
          "node": "node-8",
          "reason": [Error: Node node-8 failing as part of failOnSomeNodes],
          "status": "rejected",
        },
        {
          "node": "node-9",
          "reason": [Error: Node node-9 failing as part of failOnSomeNodes],
          "status": "rejected",
        },
      ]
    `);
    expect(result.successes).toMatchInlineSnapshot(`[]`);
    expect(result.ok).toBe(false);
    expect(result.ko).toBe(true);
    expect(result.status).toBe("rejected");
  });
});

function range(fromOrCount: number, to?: number): number[] {
  const from = to === undefined ? 0 : fromOrCount;
  const count = to === undefined ? fromOrCount : to - from;

  return Array.from({ length: count }).map((_, i) => from + i);
}
