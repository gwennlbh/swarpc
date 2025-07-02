import type { ProceduresMap } from "swarpc"
import { type } from "arktype"

export const procedures = {
  getClassmapping: {
    input: type({
      ref: "string = 'main'",
    }),
    progress: type({ transferred: "number", total: "number" }),
    success: type("string[]"),
  },
} as const satisfies ProceduresMap
