import type { StandardSchemaV1 as Schema } from "./standardschema.js";
import type { ProceduresMap } from "./types.js";

/** @internal */
export type PayloadInitialize = {
  by: "sw&rpc";
  functionName: "#initialize";
  isInitializeRequest: true;
  localStorageData: Record<string, unknown>;
  nodeId: string;
  allNodeIDs: Set<string>;
};

/** @internal */
export function isPayloadInitialize(
  payload: unknown,
): payload is PayloadInitialize {
  if (typeof payload !== "object") return false;
  if (payload === null) return false;

  if (!("by" in payload)) return false;
  if (!("nodeId" in payload)) return false;
  if (!("functionName" in payload)) return false;
  if (!("localStorageData" in payload)) return false;
  if (!("isInitializeRequest" in payload)) return false;
  if (!("allNodeIDs" in payload)) return false;

  if (payload.by !== "sw&rpc") return false;
  if (payload.functionName !== "#initialize") return false;
  if (payload.isInitializeRequest !== true) return false;
  if (typeof payload.nodeId !== "string") return false;
  if (typeof payload.localStorageData !== "object") return false;
  if (payload.localStorageData === null) return false;

  return true;
}

/**
 * @internal
 */
export type PayloadHeader<
  PM extends ProceduresMap,
  Name extends keyof PM = keyof PM,
> = {
  by: "sw&rpc";
  functionName: Name & string;
  requestId: string;
};

/** @internal */
export function isPayloadHeader<PM extends ProceduresMap>(
  procedures: PM,
  payload: unknown,
): payload is PayloadHeader<PM> {
  if (typeof payload !== "object") return false;
  if (payload === null) return false;

  if (!("by" in payload)) return false;
  if (!("requestId" in payload)) return false;
  if (!("functionName" in payload)) return false;

  if (payload.by !== "sw&rpc") return false;
  if (typeof payload.requestId !== "string") return false;
  if (typeof payload.functionName !== "string") return false;
  if (!Object.keys(procedures).includes(payload.functionName)) return false;

  return true;
}

export type PayloadCore<
  PM extends ProceduresMap,
  Name extends keyof PM = keyof PM,
> =
  | {
      input: Schema.InferOutput<PM[Name]["input"]>;
    }
  | {
      progress: Schema.InferOutput<PM[Name]["progress"]>;
    }
  | {
      result: Schema.InferOutput<PM[Name]["success"]>;
    }
  | {
      abort: { reason: string };
    }
  | {
      error: { message: string };
    };

/**
 * @internal
 */
export function validatePayloadCore<
  PM extends ProceduresMap,
  Name extends keyof PM,
>(procedure: PM[Name], payload: unknown): PayloadCore<PM, keyof PM> {
  if (typeof payload !== "object") throw new Error("payload is not an object");
  if (payload === null) throw new Error("payload is null");

  if ("input" in payload) {
    const input = procedure.input["~standard"].validate(payload.input);
    if ("value" in input) return { input: input.value };
  }

  if ("progress" in payload) {
    const progress = procedure.progress["~standard"].validate(payload.progress);
    if ("value" in progress) return { progress: progress.value };
  }

  if ("result" in payload) {
    const result = procedure.success["~standard"].validate(payload.result);
    if ("value" in result) return { result: result.value };
  }

  if (
    "abort" in payload &&
    typeof payload.abort === "object" &&
    payload.abort !== null &&
    "reason" in payload.abort &&
    typeof payload.abort.reason === "string"
  ) {
    return { abort: { reason: payload.abort.reason } };
  }

  if (
    "error" in payload &&
    typeof payload.error === "object" &&
    payload.error !== null &&
    "message" in payload.error &&
    typeof payload.error.message === "string"
  ) {
    return { error: { message: payload.error.message } };
  }

  throw new Error("invalid payload");
}

/**
 * The effective payload as sent by the server to the client
 * @internal
 */
export type Payload<
  PM extends ProceduresMap,
  Name extends keyof PM = keyof PM,
> = (PayloadHeader<PM, Name> & PayloadCore<PM, Name>) | PayloadInitialize;
