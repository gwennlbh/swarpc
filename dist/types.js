export function isPayloadInitialize(payload) {
    if (typeof payload !== "object")
        return false;
    if (payload === null)
        return false;
    if (!("by" in payload))
        return false;
    if (!("nodeId" in payload))
        return false;
    if (!("functionName" in payload))
        return false;
    if (!("localStorageData" in payload))
        return false;
    if (!("isInitializeRequest" in payload))
        return false;
    if (!("allNodeIDs" in payload))
        return false;
    if (payload.by !== "sw&rpc")
        return false;
    if (payload.functionName !== "#initialize")
        return false;
    if (payload.isInitializeRequest !== true)
        return false;
    if (typeof payload.nodeId !== "string")
        return false;
    if (typeof payload.localStorageData !== "object")
        return false;
    if (payload.localStorageData === null)
        return false;
    return true;
}
export function isPayloadHeader(procedures, payload) {
    if (typeof payload !== "object")
        return false;
    if (payload === null)
        return false;
    if (!("by" in payload))
        return false;
    if (!("requestId" in payload))
        return false;
    if (!("functionName" in payload))
        return false;
    if (payload.by !== "sw&rpc")
        return false;
    if (typeof payload.requestId !== "string")
        return false;
    if (typeof payload.functionName !== "string")
        return false;
    if (!Object.keys(procedures).includes(payload.functionName))
        return false;
    return true;
}
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
    if ("abort" in payload &&
        typeof payload.abort === "object" &&
        payload.abort !== null &&
        "reason" in payload.abort &&
        typeof payload.abort.reason === "string") {
        return { abort: { reason: payload.abort.reason } };
    }
    if ("error" in payload &&
        typeof payload.error === "object" &&
        payload.error !== null &&
        "message" in payload.error &&
        typeof payload.error.message === "string") {
        return { error: { message: payload.error.message } };
    }
    throw new Error("invalid payload");
}
export const zImplementations = Symbol("SWARPC implementations");
export const zProcedures = Symbol("SWARPC procedures");
export class RequestCancelledError extends Error {
    constructor(reason) {
        super(`Request was cancelled: ${reason}`);
        this.name = "RequestCancelledError";
    }
}
