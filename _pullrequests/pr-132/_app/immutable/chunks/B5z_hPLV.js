Map.groupBy ??= function groupBy(iterable, callbackfn) {
  const map = /* @__PURE__ */ new Map();
  let i = 0;
  for (const value of iterable) {
    const key = callbackfn(value, i++), list = map.get(key);
    list ? list.push(value) : map.set(key, [value]);
  }
  return map;
};
const zProcedures = /* @__PURE__ */ Symbol("SWARPC procedures");
class RequestCancelledError extends Error {
  constructor(reason) {
    super(`Request was cancelled: ${reason}`);
    this.name = "RequestCancelledError";
  }
}
function createLogger(side, level = "debug", nid, rqid) {
  const lvls = LOG_LEVELS.slice(LOG_LEVELS.indexOf(level));
  if (rqid && nid) {
    const ids = { rqid, nid };
    return {
      debug: lvls.includes("debug") ? logger("debug", side, ids) : () => {
      },
      info: lvls.includes("info") ? logger("info", side, ids) : () => {
      },
      warn: lvls.includes("warn") ? logger("warn", side, ids) : () => {
      },
      error: lvls.includes("error") ? logger("error", side, ids) : () => {
      }
    };
  }
  return {
    debug: lvls.includes("debug") ? logger("debug", side, nid) : () => {
    },
    info: lvls.includes("info") ? logger("info", side, nid) : () => {
    },
    warn: lvls.includes("warn") ? logger("warn", side, nid) : () => {
    },
    error: lvls.includes("error") ? logger("error", side, nid) : () => {
    }
  };
}
const LOG_LEVELS = ["debug", "info", "warn", "error"];
const PATCHABLE_LOG_METHODS = [
  "debug",
  "info",
  "warn",
  "error",
  "log"
];
function logger(method, side, ids) {
  if (ids === void 0 || typeof ids === "string") {
    const nid = ids ?? null;
    return (rqid, ...args) => log(method, side, { nid, rqid }, ...args);
  }
  return (...args) => log(method, side, ids, ...args);
}
const originalConsole = PATCHABLE_LOG_METHODS.reduce((result, method) => {
  result[method] = console[method];
  return result;
}, {});
function log(method, side, { rqid, nid }, ...args) {
  const prefix = [
    `[SWARPC ${side}]`,
    rqid ? `%c${rqid}%c` : "",
    nid ? `%c@ ${nid}%c` : ""
  ].filter(Boolean).join(" ");
  const prefixStyles = [];
  if (rqid)
    prefixStyles.push("color: cyan", "color: inherit");
  if (nid)
    prefixStyles.push("color: hotpink", "color: inherit");
  return originalConsole[method](prefix, ...prefixStyles, ...args);
}
const transferableClasses = [
  MessagePort,
  ReadableStream,
  WritableStream,
  TransformStream,
  ArrayBuffer
];
function findTransferables(value) {
  if (value === null || value === void 0) {
    return [];
  }
  if (typeof value === "object") {
    if (ArrayBuffer.isView(value) || value instanceof ArrayBuffer) {
      return [value];
    }
    if (transferableClasses.some((cls) => value instanceof cls)) {
      return [value];
    }
    if (Array.isArray(value)) {
      return value.flatMap(findTransferables);
    }
    return Object.values(value).flatMap(findTransferables);
  }
  return [];
}
function sizedArray(array) {
  if (array.length === 0) {
    return [];
  }
  return array;
}
function extractFulfilleds(settleds) {
  return settleds.filter((settled) => settled.status === "fulfilled");
}
function extractRejecteds(settleds) {
  return settleds.filter((settled) => settled.status === "rejected");
}
export {
  RequestCancelledError as R,
  extractFulfilleds as a,
  createLogger as c,
  extractRejecteds as e,
  findTransferables as f,
  sizedArray as s,
  zProcedures as z
};
