/**
 * @module
 * @mergeModuleWith <project>
 */
export function createLogger(side, level = "debug", rqid) {
    const lvls = LOG_LEVELS.slice(LOG_LEVELS.indexOf(level));
    if (rqid) {
        return {
            debug: lvls.includes("debug") ? logger("debug", side, rqid) : () => { },
            info: lvls.includes("info") ? logger("info", side, rqid) : () => { },
            warn: lvls.includes("warn") ? logger("warn", side, rqid) : () => { },
            error: lvls.includes("error") ? logger("error", side, rqid) : () => { },
        };
    }
    return {
        debug: lvls.includes("debug") ? logger("debug", side) : () => { },
        info: lvls.includes("info") ? logger("info", side) : () => { },
        warn: lvls.includes("warn") ? logger("warn", side) : () => { },
        error: lvls.includes("error") ? logger("error", side) : () => { },
    };
}
/** @source */
const LOG_LEVELS = ["debug", "info", "warn", "error"];
function logger(severity, side, rqid) {
    if (rqid === undefined) {
        return (rqid, message, ...args) => log(severity, side, rqid, message, ...args);
    }
    return (message, ...args) => log(severity, side, rqid, message, ...args);
}
/**
 * Send log messages to the console, with a helpful prefix.
 * @param severity
 * @param side
 * @param rqid request ID
 * @param message
 * @param args passed to console methods directly
 */
function log(severity, side, rqid, message, ...args) {
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
