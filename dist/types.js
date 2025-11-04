/**
 * @module
 * @mergeModuleWith <project>
 */
import { ArkErrors, type } from "arktype";
export const PayloadInitializeSchema = type({
    by: '"sw&rpc"',
    functionName: '"#initialize"',
    isInitializeRequest: "true",
    localStorageData: "Record<string, unknown>",
    nodeId: "string",
});
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
const AbortOrError = type.or({ abort: { reason: "string" } }, { error: { message: "string" } });
/**
 * @source
 */
export function validatePayloadCore(procedure, payload) {
    if (typeof payload !== "object")
        throw new Error("payload is not an object");
    if (payload === null)
        throw new Error("payload is null");
    if ("input" in payload) {
        const input = procedure.input["~standard"].validate(payload.input);
        if ("value" in input)
            return { input: input.value };
    }
    if ("progress" in payload) {
        const progress = procedure.progress["~standard"].validate(payload.progress);
        if ("value" in progress)
            return { progress: progress.value };
    }
    if ("result" in payload) {
        const result = procedure.success["~standard"].validate(payload.result);
        if ("value" in result)
            return { result: result.value };
    }
    const abortOrError = AbortOrError(payload);
    if (!(abortOrError instanceof ArkErrors)) {
        return abortOrError;
    }
    throw new Error("invalid payload");
}
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
