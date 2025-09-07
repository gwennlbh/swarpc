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
): Logger;
export function createLogger(
  side: "server" | "client",
  level: LogLevel,
  rqid: string,
): RequestBoundLogger;
export function createLogger(
  side: "server" | "client",
  level: LogLevel = "debug",
  rqid?: string,
) {
  const lvls = LOG_LEVELS.slice(LOG_LEVELS.indexOf(level));

  if (rqid) {
    return {
      debug: lvls.includes("debug") ? logger("debug", side, rqid) : () => {},
      info: lvls.includes("info") ? logger("info", side, rqid) : () => {},
      warn: lvls.includes("warn") ? logger("warn", side, rqid) : () => {},
      error: lvls.includes("error") ? logger("error", side, rqid) : () => {},
    } as RequestBoundLogger;
  }

  return {
    debug: lvls.includes("debug") ? logger("debug", side) : () => {},
    info: lvls.includes("info") ? logger("info", side) : () => {},
    warn: lvls.includes("warn") ? logger("warn", side) : () => {},
    error: lvls.includes("error") ? logger("error", side) : () => {},
  };
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

/**
 * Creates partially-applied logging functions given the first 2 or 3 args
 * @param severity
 * @param side
 * @param rqid request ID, or null to not bind it
 * @returns
 */
function logger(
  severity: LogLevel,
  side: "server" | "client",
  rqid: string,
): (message: string, ...args: any[]) => void;
function logger(
  severity: LogLevel,
  side: "server" | "client",
): (rqid: string | null, message: string, ...args: any[]) => void;
function logger(severity: LogLevel, side: "server" | "client", rqid?: string) {
  if (rqid === undefined) {
    return (rqid: string | null, message: string, ...args: any[]) =>
      log(severity, side, rqid, message, ...args);
  }

  return (message: string, ...args: any[]) =>
    log(severity, side, rqid, message, ...args);
}

/**
 * Send log messages to the console, with a helpful prefix.
 * @param severity
 * @param side
 * @param rqid request ID
 * @param message
 * @param args passed to console methods directly
 */
function log(
  severity: "debug" | "info" | "warn" | "error",
  side: "server" | "client",
  rqid: string | null,
  message: string,
  ...args: any[]
) {
  const prefix =
    "[" +
    ["SWARPC", side, rqid ? `%c${rqid}%c` : ""].filter(Boolean).join(" ") +
    "]";

  const prefixStyles = rqid ? ["color: cyan;", "color: inherit;"] : [];

  if (severity === "debug") {
    console.debug(prefix, ...prefixStyles, message, ...args);
  } else if (severity === "info") {
    console.info(prefix, ...prefixStyles, message, ...args);
  } else if (severity === "warn") {
    console.warn(prefix, ...prefixStyles, message, ...args);
  } else if (severity === "error") {
    console.error(prefix, ...prefixStyles, message, ...args);
  }
}
