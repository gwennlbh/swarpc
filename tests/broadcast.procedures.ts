import { type, regex } from "arktype";
import { ProceduresMap } from "../src/index.js";

export const procedures = {
  failOnSomeNodes: {
    input: type("number"),
    progress: type("undefined"),
    success: type(regex("^Node #\\d+ succeeded$")),
  },
} as const satisfies ProceduresMap;
