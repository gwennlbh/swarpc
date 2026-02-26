import "@vitest/web-worker";
import { describe, expect, test, vi } from "vitest";
import { Client } from "../src/index.js";
import { procedures } from "./hooks.procedures.js";
// @ts-expect-error
// oxlint-disable-next-line import/default
import Worker from "./hooks.worker.ts?worker";

// Run tests serially because we only have one worker at a time
describe("Client hooks", { sequential: true }, async () => {
  test("success hook is called on successful procedure", async () => {
    const success = vi.fn();
    const client = Client(procedures, {
      worker: Worker,
      nodes: 1,
      hooks: { success },
      loglevel: "warn",
      restartListener: true,
    });
    await client.echo({ value: "test" });
    await client.add({ a: 1, b: 2 });
    await client.divide({ a: 6, b: 2 });
    expect(success).toHaveBeenCalledTimes(3);
    expect(success.mock.calls).toStrictEqual([
      [{ procedure: "echo", data: "test" }],
      [{ procedure: "add", data: 3 }],
      [{ procedure: "divide", data: 3 }],
    ]);
  });

  test("error hook is called on procedure error (runtime error)", async () => {
    const error = vi.fn();
    const client = Client(procedures, {
      worker: Worker,
      nodes: 1,
      hooks: { error },
      loglevel: "debug",
      restartListener: true,
    });
    await expect(client.divide({ a: 1, b: 0 })).rejects.toThrow(
      "Division by zero",
    );
    expect(error).toHaveBeenCalledTimes(1);
    expect(error.mock.calls).toStrictEqual([
      [{ procedure: "divide", error: expect.any(Error) }],
    ]);
    expect(error.mock.calls[0][0].error.message).toBe("Division by zero");
  });

  test("progress hook is called on progress update", async () => {
    const progress = vi.fn();
    const client = Client(procedures, {
      worker: Worker,
      nodes: 1,
      hooks: { progress },
      loglevel: "warn",
      restartListener: true,
    });
    await client.divide({ a: 9, b: 3 });
    expect(progress).toHaveBeenCalledTimes(3);
    expect(progress.mock.calls).toStrictEqual([
      [{ procedure: "divide", data: { percent: 33.33333333333333 } }],
      [{ procedure: "divide", data: { percent: 66.66666666666666 } }],
      [{ procedure: "divide", data: { percent: 100 } }],
    ]);
  });

  test("hooks contain call duration in milliseconds", async () => {
    const success = vi.fn();
    const client = Client(procedures, {
      worker: Worker,
      nodes: 1,
      hooks: { success },
      loglevel: "warn",
      restartListener: true,
    });
    await client.sleep({ ms: 100 });
    expect(success).toHaveBeenCalledTimes(1);
    expect(success).toHaveBeenCalledExactlyOnceWith({
      procedure: "sleep",
      data: undefined,
      duration: expect.any(Number),
    });
    console.debug("Duration:", success.mock.calls[0][0].duration);
    expect(success.mock.calls[0][0].duration).toBeGreaterThanOrEqual(100);
  });
});
