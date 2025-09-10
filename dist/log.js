/**
 * @module
 * @mergeModuleWith <project>
 */
export function createLogger(side, level = "debug", nid, rqid) {
    const lvls = LOG_LEVELS.slice(LOG_LEVELS.indexOf(level));
    if (rqid && nid) {
        const ids = { rqid, nid };
        return {
            debug: lvls.includes("debug") ? logger("debug", side, ids) : () => { },
            info: lvls.includes("info") ? logger("info", side, ids) : () => { },
            warn: lvls.includes("warn") ? logger("warn", side, ids) : () => { },
            error: lvls.includes("error") ? logger("error", side, ids) : () => { },
        };
    }
    return {
        debug: lvls.includes("debug") ? logger("debug", side, nid) : () => { },
        info: lvls.includes("info") ? logger("info", side, nid) : () => { },
        warn: lvls.includes("warn") ? logger("warn", side, nid) : () => { },
        error: lvls.includes("error") ? logger("error", side, nid) : () => { },
    };
}
/** @source */
const LOG_LEVELS = ["debug", "info", "warn", "error"];
function logger(severity, side, ids) {
    if (ids === undefined || typeof ids === "string") {
        const nid = ids ?? null;
        return (rqid, message, ...args) => log(severity, side, { nid, rqid }, message, ...args);
    }
    return (message, ...args) => log(severity, side, ids, message, ...args);
}
/**
 * Send log messages to the console, with a helpful prefix.
 * @param severity
 * @param side
 * @param ids request ID and node ID
 * @param message
 * @param args passed to console methods directly
 */
function log(severity, side, { rqid, nid }, message, ...args) {
    const prefix = [
        `[SWARPC ${side}]`,
        rqid ? `%c${rqid}%c` : "",
        nid ? `%c@ ${nid}%c` : "",
    ]
        .filter(Boolean)
        .join(" ");
    const prefixStyles = [];
    if (rqid)
        prefixStyles.push("color: cyan", "color: inherit");
    if (nid)
        prefixStyles.push("color: hotpink", "color: inherit");
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
