type Constructor<T> = new (...args: any[]) => T;

// TODO: keep it in sync with web standards, how?
const transferableClasses: Constructor<Transferable>[] = [
  MessagePort,
  ReadableStream,
  WritableStream,
  TransformStream,
  ArrayBuffer,
];

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
