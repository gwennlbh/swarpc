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
    const { cancel } = client.cancellable.cancelable("test", progress);
    await new Promise((resolve) => setTimeout(resolve, 2));
    await cancel("test cancellation");
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
      `[TraversalError: address.houseno must be a number (was a string)]`,
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
