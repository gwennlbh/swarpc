import type { ProceduresMap } from "swarpc";
import { type } from "arktype";

export const procedures = {
  getClassmapping: {
    input: type({
      ref: "string = 'main'",
      delay: type("number")
        .describe("Delay in seconds before starting the request")
        .default(0),
    }),
    progress: type({ transferred: "number", total: "number" }),
    success: type("string[]"),
  },
} as const satisfies ProceduresMap;
