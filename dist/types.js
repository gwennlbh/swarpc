/**
 * @module
 * @mergeModuleWith <project>
 */
import { type } from "arktype";
/**
 * @source
 */
export const PayloadHeaderSchema = type("<Name extends string>", {
    by: '"sw&rpc"',
    functionName: "Name",
    requestId: "string >= 1",
});
/**
 * @source
 */
export const PayloadCoreSchema = type("<I, P, S>", {
    "input?": "I",
    "progress?": "P",
    "result?": "S",
    "abort?": { reason: "string" },
    "error?": { message: "string" },
});
/**
 * @source
 */
export const PayloadSchema = type
    .scope({ PayloadCoreSchema, PayloadHeaderSchema })
    .type("<Name extends string, I, P, S>", [
    "PayloadHeaderSchema<Name>",
    "&",
    "PayloadCoreSchema<I, P, S>",
]);
/**
 * Symbol used as the key for the procedures map on the server instance
 * @internal
 * @source
 */
export const zImplementations = Symbol("SWARPC implementations");
/**
 * Symbol used as the key for the procedures map on instances
 * @internal
 * @source
 */
export const zProcedures = Symbol("SWARPC procedures");
