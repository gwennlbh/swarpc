import type { ProceduresMap } from "swarpc";
import { type } from "arktype";

export const procedures = {
  multiply: {
    input: type({ a: "number", b: "number" }),
    progress: type({ progress: "0 <= number <= 1", node: "string" }),
    success: type({ result: "number", node: "string" }),
  },
} as const satisfies ProceduresMap;
