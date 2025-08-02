/**
 * Convenience shortcuts for logging.
 */
export const l = {
    server: {
        debug: logger("debug", "server"),
        info: logger("info", "server"),
        warn: logger("warn", "server"),
        error: logger("error", "server"),
    },
    client: {
        debug: logger("debug", "client"),
        info: logger("info", "client"),
        warn: logger("warn", "client"),
        error: logger("error", "client"),
    },
};
/**
 * Creates partially-applied logging functions given the first 2 args
 * @param severity
 * @param side
 * @returns
 */
function logger(severity, side) {
    return (rqid, message, ...args) => log(severity, side, rqid, message, ...args);
}
/**
 * Send log messages to the console, with a helpful prefix.
 * @param severity
 * @param side
 * @param rqid request ID
 * @param message
 * @param args passed to console methods directly
 */
export function log(severity, side, rqid, message, ...args) {
    const prefix = "[" +
        ["SWARPC", side, rqid ? `%c${rqid}%c` : ""].filter(Boolean).join(" ") +
        "]";
    const prefixStyles = rqid ? ["color: cyan;", "color: inherit;"] : [];
    if (severity === "debug") {
        console.debug(prefix, ...prefixStyles, message, ...args);
    }
    else if (severity === "info") {
        console.info(prefix, ...prefixStyles, message, ...args);
    }
    else if (severity === "warn") {
        console.warn(prefix, ...prefixStyles, message, ...args);
    }
    else if (severity === "error") {
        console.error(prefix, ...prefixStyles, message, ...args);
    }
}
