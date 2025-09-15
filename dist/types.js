import { type } from "arktype";
export const PayloadInitializeSchema = type({
  by: '"sw&rpc"',
  functionName: '"#initialize"',
  isInitializeRequest: "true",
  localStorageData: "Record<string, unknown>",
  nodeId: "string"
});
export const PayloadHeaderSchema = type("<Name extends string>", {
  by: '"sw&rpc"',
  functionName: "Name",
  requestId: "string >= 1"
});
export const PayloadCoreSchema = type("<I, P, S>", {
  "input?": "I",
  "progress?": "P",
  "result?": "S",
  "abort?": { reason: "string" },
  "error?": { message: "string" }
});
export const PayloadSchema = type.scope({ PayloadCoreSchema, PayloadHeaderSchema, PayloadInitializeSchema }).type("<Name extends string, I, P, S>", [
  ["PayloadHeaderSchema<Name>", "&", "PayloadCoreSchema<I, P, S>"],
  "|",
  "PayloadInitializeSchema"
]);
export const zImplementations = Symbol("SWARPC implementations");
export const zProcedures = Symbol("SWARPC procedures");
