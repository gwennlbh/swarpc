import { type } from "arktype";
import type { ProceduresMap } from "../src/index.js";

export const procedures = {
  echo: {
    input: type({ value: "string" }),
    progress: type("undefined"),
    success: type("string"),
  },
  add: {
    input: type({ a: "number", b: "number" }),
    progress: type("undefined"),
    success: type("number"),
  },
  divide: {
    input: type({ a: "number", b: "number" }),
    progress: type({ percent: ["number", "=>", Math.floor] }),
    success: type("number"),
  },
  sleep: {
    input: type({ ms: "number" }),
    progress: type("undefined"),
    success: type("undefined"),
  },
} as const satisfies ProceduresMap;
