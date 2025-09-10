/**
 * @module
 * @mergeModuleWith <project>
 */

/**
 * @ignore
 */
export function createLogger(
  side: "server" | "client",
  level: LogLevel,
  nid?: string,
): Logger;
export function createLogger(
  side: "server" | "client",
  level: LogLevel,
  nid: string,
  rqid: string,
): RequestBoundLogger;
export function createLogger(
  side: "server" | "client",
  level: LogLevel = "debug",
  nid?: string,
  rqid?: string,
) {
  const lvls = LOG_LEVELS.slice(LOG_LEVELS.indexOf(level));

  if (rqid && nid) {
    const ids = { rqid, nid };
    return {
      debug: lvls.includes("debug") ? logger("debug", side, ids) : () => {},
      info: lvls.includes("info") ? logger("info", side, ids) : () => {},
      warn: lvls.includes("warn") ? logger("warn", side, ids) : () => {},
      error: lvls.includes("error") ? logger("error", side, ids) : () => {},
    } as RequestBoundLogger;
  }

  return {
    debug: lvls.includes("debug") ? logger("debug", side, nid) : () => {},
    info: lvls.includes("info") ? logger("info", side, nid) : () => {},
    warn: lvls.includes("warn") ? logger("warn", side, nid) : () => {},
    error: lvls.includes("error") ? logger("error", side, nid) : () => {},
  } as Logger;
}

/**
 * @ignore
 */
export type Logger = {
  debug: (rqid: string | null, message: string, ...args: any[]) => void;
  info: (rqid: string | null, message: string, ...args: any[]) => void;
  warn: (rqid: string | null, message: string, ...args: any[]) => void;
  error: (rqid: string | null, message: string, ...args: any[]) => void;
};

export type RequestBoundLogger = {
  debug: (message: string, ...args: any[]) => void;
  info: (message: string, ...args: any[]) => void;
  warn: (message: string, ...args: any[]) => void;
  error: (message: string, ...args: any[]) => void;
};

/** @source */
const LOG_LEVELS = ["debug", "info", "warn", "error"] as const;

export type LogLevel = (typeof LOG_LEVELS)[number];

const PATCHABLE_LOG_METHODS = [
  "debug",
  "info",
  "warn",
  "error",
  "log",
] as const;
type LogMethod = (typeof PATCHABLE_LOG_METHODS)[number];

/**
 * Creates partially-applied logging functions given the first 2 or 3 args
 * @param method
 * @param side
 * @param ids request ID, {reqid, nodeId}, or null to not bind it
 * @returns
 */
function logger(
  method: LogMethod,
  side: "server" | "client",
  ids: { rqid: string; nid: string },
): (...args: any[]) => void;
function logger(
  method: LogMethod,
  side: "server" | "client",
  nid?: string,
): (rqid: string | null, ...args: any[]) => void;
function logger(
  method: LogMethod,
  side: "server" | "client",
  ids?: string | { rqid: string; nid: string },
) {
  if (ids === undefined || typeof ids === "string") {
    const nid = ids ?? null;
    return (rqid: string | null, ...args: any[]) =>
      log(method, side, { nid, rqid }, ...args);
  }

  return (...args: any[]) => log(method, side, ids, ...args);
}

const originalConsole = PATCHABLE_LOG_METHODS.reduce(
  (result, method) => {
    result[method] = console[method];
    return result;
  },
  {} as Pick<typeof console, LogMethod>,
);

/**
 * Send log messages to the console, with a helpful prefix.
 * @param method
 * @param side
 * @param ids request ID and node ID
 * @param args passed to console methods directly
 */
function log(
  method: LogMethod,
  side: "server" | "client",
  { rqid, nid }: { rqid: string | null; nid: string | null },
  ...args: any[]
) {
  const prefix = [
    `[SWARPC ${side}]`,
    rqid ? `%c${rqid}%c` : "",
    nid ? `%c@ ${nid}%c` : "",
  ]
    .filter(Boolean)
    .join(" ");

  const prefixStyles = [] as string[];
  if (rqid) prefixStyles.push("color: cyan", "color: inherit");
  if (nid) prefixStyles.push("color: hotpink", "color: inherit");

  return originalConsole[method](prefix, ...prefixStyles, ...args);
}

/**
 *
 * @param scope
 */
export function injectIntoConsoleGlobal(
  scope: WorkerGlobalScope | SharedWorkerGlobalScope,
  nodeId: string,
) {
  for (const method of PATCHABLE_LOG_METHODS) {
    scope.self.console[method] = logger(method, "server", nodeId);
  }
}
