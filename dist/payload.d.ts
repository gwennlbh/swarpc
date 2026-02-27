import type { StandardSchemaV1 as Schema } from "./standardschema.js";
import type { ProceduresMap } from "./types.js";
export type PayloadCore<PM extends ProceduresMap, Name extends keyof PM = keyof PM> = {
    input: Schema.InferOutput<PM[Name]["input"]>;
} | {
    progress: Schema.InferOutput<PM[Name]["progress"]>;
} | {
    result: Schema.InferOutput<PM[Name]["success"]>;
} | {
    abort: {
        reason: string;
    };
} | {
    error: {
        message: string;
    };
};
