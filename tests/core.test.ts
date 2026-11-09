import "@vitest/web-worker";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { Client } from "../src/index.js";
import { procedures } from "./core.procedures.js";
// @ts-ignore
// oxlint-disable-next-line import/default
import Worker from "./core.worker.js?worker";

const client = Client(procedures, {
  worker: Worker,
  nodes: 1,
  loglevel: "warn",
  localStorage: {
    a: 67,
    anotherKey: 1312,
  },
});

test("Simple exchange", async () => {
  const answer = await client.hello("world");
  expect(answer).toBe("Hello world");
});

test("Progress info", async () => {
  const callback = vi.fn();
  const answer = await client.helloWithProgress("world", callback);
  expect(answer).toBe("Hello with progress world");
  expect(callback.mock.calls).toStrictEqual([
    [{ current: 0, total: 10 }],
    [{ current: 1, total: 10 }],
    [{ current: 2, total: 10 }],
    [{ current: 3, total: 10 }],
    [{ current: 4, total: 10 }],
    [{ current: 5, total: 10 }],
    [{ current: 6, total: 10 }],
    [{ current: 7, total: 10 }],
    [{ current: 8, total: 10 }],
    [{ current: 9, total: 10 }],
  ]);
});

describe("Cancellable procedure", () => {
  const progress = vi.fn();

  beforeEach(() => {
    progress.mockReset();
  });

  test("Can be cancelled", async () => {
    const { cancel, request } = client.cancellable.cancelable("test", progress);
    await new Promise((resolve) => setTimeout(resolve, 2));
    cancel("test cancellation reason here");
    expect(request).rejects.toThrowErrorMatchingInlineSnapshot(
      `[RequestCancelledError: Request was cancelled: test cancellation reason here]`,
    );
    expect(progress.mock.calls.length).toBeLessThan(10);
  });

  test("Can be completed", async () => {
    const { request } = client.cancellable.cancelable("test", progress);
    const answer = await request;
    expect(answer).toBe("Cancellable hello test");
    expect(progress.mock.calls.length).toBe(10);
  });

  test("Can be run normally", async () => {
    const answer = await client.cancellable("test", progress);
    expect(answer).toBe("Cancellable hello test");
    expect(progress.mock.calls.length).toBe(10);
  });
});

describe("Once mode", () => {
  const progress = vi.fn();

  beforeEach(() => {
    progress.mockReset();
  });

  test(".once() cancels previous call of same method", async () => {
    // Start first call
    const promise1 = client.cancellable.once("first", progress);
    await new Promise((resolve) => setTimeout(resolve, 2));

    // Start second call - should cancel the first one
    const promise2 = client.cancellable.once("second", progress);

    // First promise should be rejected/cancelled, second should complete
    await expect(promise1).rejects.toThrow("Cancelled by .once() call");
    const result2 = await promise2;
    expect(result2).toBe("Cancellable hello second");
  });

  test(".onceBy(key) cancels previous call with same key", async () => {
    // Start first call with key "foo"
    const promise1 = client.cancellable.onceBy("foo", "first", progress);
    await new Promise((resolve) => setTimeout(resolve, 2));

    // Start second call with same key - should cancel the first one
    const promise2 = client.cancellable.onceBy("foo", "second");

    // First promise should be rejected/cancelled, second should complete
    expect(progress.mock.calls.length).toBeLessThan(10);
    const result2 = await promise2;
    expect(result2).toBe("Cancellable hello second");
  });

  test(".onceBy(key) allows concurrent calls with different keys", async () => {
    // Start two calls with different keys
    const promise1 = client.cancellable.onceBy("key1", "first", progress);
    const promise2 = client.cancellable.onceBy("key2", "second", progress);

    // Both should complete successfully
    const [result1, result2] = await Promise.all([promise1, promise2]);
    expect(result1).toBe("Cancellable hello first");
    expect(result2).toBe("Cancellable hello second");
  });

  test("global onceBy cancels previous call with same global key", async () => {
    // Start first call with global key
    const promise1 = client.onceBy("global").cancellable("first", progress);
    await new Promise((resolve) => setTimeout(resolve, 2));

    // Start second call on a different method but same global key
    const promise2 = client.onceBy("global").hello("second");

    // First promise should be rejected/cancelled, second should complete
    await expect(promise1).rejects.toThrow(
      'Cancelled by global onceBy("global") call',
    );
    const result2 = await promise2;
    expect(result2).toBe("Hello second");
  });

  test("global onceBy allows concurrent calls with different keys", async () => {
    // Start two calls with different global keys
    const promise1 = client.onceBy("global1").cancellable("first", progress);
    const promise2 = client.onceBy("global2").cancellable("second", progress);

    // Both should complete successfully
    const [result1, result2] = await Promise.all([promise1, promise2]);
    expect(result1).toBe("Cancellable hello first");
    expect(result2).toBe("Cancellable hello second");
  });
});

describe("Client destroy", () => {
  test("Destroying a client doesn't leave stale pending requests", async () => {
    // Create client A with 1 node
    const clientA = Client(procedures, {
      worker: Worker,
      nodes: 1,
      loglevel: "warn",
      nodeIds: ["A1"],
    });

    // Start a long-running request on client A (~100ms with string input)
    // Catch the rejection to avoid unhandled promise rejection when client A is destroyed
    clientA.cancellable("test").catch(() => {});

    // Wait for the request to be in-flight
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Destroy client A (in old code, this leaves stale pending requests
    // keyed by the dead node ID "A1" in the module-level map)
    clientA.destroy();

    // Create client B with 1 node
    const clientB = Client(procedures, {
      worker: Worker,
      nodes: 1,
      loglevel: "warn",
      nodeIds: ["B1"],
    });

    // Start 2 concurrent requests on client B (so the live node "B1"
    // has 2 in-flight requests, more than the stale count of 1 for "A1")
    const requestB1 = clientB.cancellable("test");
    const requestB2 = clientB.cancellable("test");

    // Wait for the requests to be in-flight
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Start a 3rd request on client B.
    // In old code, whoToSendTo would pick "A1" (dead node, stale count 1 < live count 2),
    // causing the request to be sent to a non-existent node and hang.
    // In new code, whoToSendTo picks "B1" (no stale entries), so the request completes.
    const requestB3 = clientB.cancellable("test");

    // All 3 requests should complete successfully
    const [resultB1, resultB2, resultB3] = await Promise.all([
      requestB1,
      requestB2,
      requestB3,
    ]);

    expect(resultB1).toBe("Cancellable hello test");
    expect(resultB2).toBe("Cancellable hello test");
    expect(resultB3).toBe("Cancellable hello test");

    // Clean up
    clientB.destroy();
  });
});

describe("Complex data", () => {
  test("Processes complex data", async () => {
    const response = await client.complexData({
      name: "test",
      custom: '{"key": "value"}',
      address: {
        street: "Main St",
        city: "Testville",
        zip: "12345",
        houseno: 42,
      },
      age: 30,
    });

    expect(response).toEqual({
      message: "Processed data for test",
      addr: "42 Main St, Testville 12345",
    });
  });

  test("Handles missing optional fields", async () => {
    const response = await client.complexData({
      name: "test",
      custom: '{"key": "value"}',
      address: {
        street: "Main St",
        city: "Testville",
        zip: "12345",
      },
      age: 30,
    });
    expect(response).toEqual({
      message: "Processed data for test",
      addr: "Main St, Testville 12345",
    });
  });

  test("Errors on invalid data", async () => {
    await expect(
      client.complexData({
        name: "test",
        custom: '{"key": "value"}',
        address: {
          street: "Main St",
          city: "Testville",
          zip: "12345",
          // @ts-expect-error
          houseno: "not-a-number", // Invalid type
        },
        age: 30,
      }),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `[Error: Invalid input: address.houseno must be a number (was a string)]`,
    );
  });
});

describe.todo("faux localStorage", () => {
  test("Can access localStorage", async () => {
    const { value } = await client.accessLocalStorage("a");
    expect(value).toBe(67);
  });

  test("Can access another key", async () => {
    const { value } = await client.accessLocalStorage("anotherKey");
    expect(value).toBe(1312);
  });

  test("Returns null for missing keys", async () => {
    const { value } = await client.accessLocalStorage("missingKey");
    expect(value).toBeNull();
  });

  test("Has all expected keys", async () => {
    const { allKeys } = await client.accessLocalStorage("feur");
    expect(new Set(allKeys)).toEqual(new Set(["a", "anotherKey"]));
  });
});
