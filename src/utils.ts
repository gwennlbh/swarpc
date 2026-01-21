type Constructor<T> = new (...args: any[]) => T;

// TODO: keep it in sync with web standards, how?
const transferableClasses: Constructor<Transferable>[] = [
  MessagePort,
  ReadableStream,
  WritableStream,
  TransformStream,
  ArrayBuffer,
];

/** @internal */
export function findTransferables(value: any): Transferable[] {
  if (value === null || value === undefined) {
    return [];
  }

  if (typeof value === "object") {
    if (ArrayBuffer.isView(value) || value instanceof ArrayBuffer) {
      return [value];
    }

    if (transferableClasses.some((cls) => value instanceof cls)) {
      return [value as Transferable];
    }

    if (Array.isArray(value)) {
      return value.flatMap(findTransferables);
    }

    return Object.values(value).flatMap(findTransferables);
  }

  return [];
}

/**
 * @internal
 */
export type ArrayOneOrMore<T> = [T, ...T[]];

/**
 * @internal
 */
export function sizedArray<T>(array: T[]): [] | ArrayOneOrMore<T> {
  if (array.length === 0) {
    return [];
  }
  return array as ArrayOneOrMore<T>;
}

/** @internal */
export function extractFulfilleds<T, D>(
  settleds: Array<PromiseSettledResult<T> & D>,
): Array<PromiseFulfilledResult<T> & D> {
  return settleds.filter(
    (settled): settled is PromiseFulfilledResult<T> & D =>
      settled.status === "fulfilled",
  );
}

/** @internal */
export function extractRejecteds<T, D>(
  settleds: Array<PromiseSettledResult<T> & D>,
): Array<PromiseRejectedResult & D> {
  return settleds.filter(
    (settled): settled is PromiseRejectedResult & D =>
      settled.status === "rejected",
  );
}
