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
const PATCHABLE_LOG_METHODS = [
    "debug",
    "info",
    "warn",
    "error",
    "log",
];
function logger(method, side, ids) {
    if (ids === undefined || typeof ids === "string") {
        const nid = ids ?? null;
        return (rqid, ...args) => log(method, side, { nid, rqid }, ...args);
    }
    return (...args) => log(method, side, ids, ...args);
}
const originalConsole = PATCHABLE_LOG_METHODS.reduce((result, method) => {
    result[method] = console[method];
    return result;
}, {});
/**
 * Send log messages to the console, with a helpful prefix.
 * @param method
 * @param side
 * @param ids request ID and node ID
 * @param args passed to console methods directly
 */
function log(method, side, { rqid, nid }, ...args) {
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
    return originalConsole[method](prefix, ...prefixStyles, ...args);
}
/**
 *
 * @param scope
 */
export function injectIntoConsoleGlobal(scope, nodeId, requestId) {
    for (const method of PATCHABLE_LOG_METHODS) {
        scope.self.console[method] = (...args) => logger(method, "server", nodeId)(requestId, ...args);
    }
}
