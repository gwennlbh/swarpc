export function createLogger(side, level = "debug") {
    const enabledLevels = LOG_LEVELS.slice(LOG_LEVELS.indexOf(level));
    return {
        debug: enabledLevels.includes("debug") ? logger("debug", side) : () => { },
        info: enabledLevels.includes("info") ? logger("info", side) : () => { },
        warn: enabledLevels.includes("warn") ? logger("warn", side) : () => { },
        error: enabledLevels.includes("error") ? logger("error", side) : () => { },
    };
}
const LOG_LEVELS = ["debug", "info", "warn", "error"];
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
