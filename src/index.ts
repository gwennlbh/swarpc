/**
 * @module
 * @mergeModuleWith <project>
 */

import "./polyfills.js";
export {
  type ProceduresMap,
  type CancelablePromise,
  RequestCancelledError,
} from "./types.js";

export { Client, RESERVED_PROCEDURE_NAMES } from "./client.js";
export type { SwarpcClient } from "./client.js";

export { Server } from "./server.js";
export type { SwarpcServer } from "./server.js";
