export function createLogger(
  side: "server" | "client",
  level: LogLevel = "debug"
) {
  const enabledLevels = LOG_LEVELS.slice(LOG_LEVELS.indexOf(level))

  return {
    debug: enabledLevels.includes("debug") ? logger("debug", side) : () => {},
    info: enabledLevels.includes("info") ? logger("info", side) : () => {},
    warn: enabledLevels.includes("warn") ? logger("warn", side) : () => {},
    error: enabledLevels.includes("error") ? logger("error", side) : () => {},
  }
}

export type Logger = ReturnType<typeof createLogger>

const LOG_LEVELS = ["debug", "info", "warn", "error"] as const
export type LogLevel = (typeof LOG_LEVELS)[number]

/**
 * Creates partially-applied logging functions given the first 2 args
 * @param severity
 * @param side
 * @returns
 */
function logger(severity: LogLevel, side: "server" | "client") {
  return (rqid: string | null, message: string, ...args: any[]) =>
    log(severity, side, rqid, message, ...args)
}

/**
 * Send log messages to the console, with a helpful prefix.
 * @param severity
 * @param side
 * @param rqid request ID
 * @param message
 * @param args passed to console methods directly
 */
export function log(
  severity: "debug" | "info" | "warn" | "error",
  side: "server" | "client",
  rqid: string | null,
  message: string,
  ...args: any[]
) {
  const prefix =
    "[" +
    ["SWARPC", side, rqid ? `%c${rqid}%c` : ""].filter(Boolean).join(" ") +
    "]"

  const prefixStyles = rqid ? ["color: cyan;", "color: inherit;"] : []

  if (severity === "debug") {
    console.debug(prefix, ...prefixStyles, message, ...args)
  } else if (severity === "info") {
    console.info(prefix, ...prefixStyles, message, ...args)
  } else if (severity === "warn") {
    console.warn(prefix, ...prefixStyles, message, ...args)
  } else if (severity === "error") {
    console.error(prefix, ...prefixStyles, message, ...args)
  }
}
