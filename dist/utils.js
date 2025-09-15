const transferableClasses = [
  MessagePort,
  ReadableStream,
  WritableStream,
  TransformStream,
  ArrayBuffer
];
export function findTransferables(value) {
  if (value === null || value === undefined) {
    return [];
  }
  if (typeof value === "object") {
    if (ArrayBuffer.isView(value) || value instanceof ArrayBuffer) {
      return [value];
    }
    if (transferableClasses.some((cls) => value instanceof cls)) {
      return [value];
    }
    if (Array.isArray(value)) {
      return value.flatMap(findTransferables);
    }
    return Object.values(value).flatMap(findTransferables);
  }
  return [];
}
