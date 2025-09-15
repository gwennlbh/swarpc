import { type } from "arktype";
import { createLogger, injectIntoConsoleGlobal } from "./log.js";
import {
  PayloadHeaderSchema,
  PayloadInitializeSchema,
  PayloadSchema,
  zImplementations,
  zProcedures
} from "./types.js";
import { findTransferables } from "./utils.js";
import { FauxLocalStorage } from "./localstorage.js";
import { scopeIsDedicated, scopeIsShared, scopeIsService } from "./scopes.js";
import { nodeIdFromScope } from "./nodes.js";
const abortControllers = new Map;
const abortedRequests = new Set;
export function Server(procedures, {
  loglevel = "debug",
  scope,
  _scopeType
} = {}) {
  scope ??= self;
  const nodeId = nodeIdFromScope(scope, _scopeType);
  const l = createLogger("server", loglevel, nodeId);
  const instance = {
    [zProcedures]: procedures,
    [zImplementations]: {},
    start: async () => {}
  };
  for (const functionName in procedures) {
    instance[functionName] = (implementation) => {
      if (!instance[zProcedures][functionName]) {
        throw new Error(`No procedure found for function name: ${functionName}`);
      }
      instance[zImplementations][functionName] = (input, onProgress, tools) => {
        tools.abortSignal?.throwIfAborted();
        return new Promise((resolve, reject) => {
          tools.abortSignal?.addEventListener("abort", () => {
            let { requestId, reason } = tools.abortSignal.reason;
            l.debug(requestId, `Aborted ${functionName} request: ${reason}`);
            reject({ aborted: reason });
          });
          implementation(input, onProgress, tools).then(resolve).catch(reject);
        });
      };
    };
  }
  instance.start = async () => {
    const port = await new Promise((resolve) => {
      if (!scopeIsShared(scope, _scopeType))
        return resolve(undefined);
      l.debug(null, "Awaiting shared worker connection...");
      scope.addEventListener("connect", ({ ports: [port] }) => {
        l.debug(null, "Shared worker connected with port", port);
        resolve(port);
      });
    });
    const postMessage = async (autotransfer, data) => {
      const transfer = autotransfer ? [] : findTransferables(data);
      if (port) {
        port.postMessage(data, { transfer });
      } else if (scopeIsDedicated(scope, _scopeType)) {
        scope.postMessage(data, { transfer });
      } else if (scopeIsService(scope, _scopeType)) {
        await scope.clients.matchAll().then((clients) => {
          clients.forEach((client) => client.postMessage(data, { transfer }));
        });
      }
    };
    const listener = async (event) => {
      if (PayloadInitializeSchema.allows(event.data)) {
        const { localStorageData, nodeId } = event.data;
        l.debug(null, "Setting up faux localStorage", localStorageData);
        new FauxLocalStorage(localStorageData).register(scope);
        injectIntoConsoleGlobal(scope, nodeId);
        return;
      }
      const { requestId, functionName } = PayloadHeaderSchema(type.enumerated(...Object.keys(procedures))).assert(event.data);
      l.debug(requestId, `Received request for ${functionName}`, event.data);
      const { autotransfer = "output-only", ...schemas } = instance[zProcedures][functionName];
      const postMsg = async (data) => {
        if (abortedRequests.has(requestId))
          return;
        await postMessage(autotransfer !== "never", {
          by: "sw&rpc",
          functionName,
          requestId,
          ...data
        });
      };
      const postError = async (error) => postMsg({
        error: {
          message: "message" in error ? error.message : String(error)
        }
      });
      const implementation = instance[zImplementations][functionName];
      if (!implementation) {
        await postError("No implementation found");
        return;
      }
      const payload = PayloadSchema(type(`"${functionName}"`), schemas.input, schemas.progress, schemas.success).assert(event.data);
      if ("isInitializeRequest" in payload)
        throw "Unreachable: #initialize request payload should've been handled already";
      if (payload.abort) {
        const controller = abortControllers.get(requestId);
        if (!controller)
          await postError("No abort controller found for request");
        controller?.abort(payload.abort.reason);
        return;
      }
      abortControllers.set(requestId, new AbortController);
      if (!payload.input) {
        await postError("No input provided");
        return;
      }
      try {
        const result = await implementation(payload.input, async (progress) => {
          await postMsg({ progress });
        }, {
          nodeId,
          abortSignal: abortControllers.get(requestId)?.signal,
          logger: createLogger("server", loglevel, nodeId, requestId)
        });
        l.debug(requestId, `Result for ${functionName}`, result);
        await postMsg({ result });
      } catch (error) {
        if ("aborted" in error) {
          l.debug(requestId, `Received abort error for ${functionName}`, error.aborted);
          abortedRequests.add(requestId);
          abortControllers.delete(requestId);
          return;
        }
        l.info(requestId, `Error in ${functionName}`, error);
        await postError(error);
      } finally {
        abortedRequests.delete(requestId);
      }
    };
    if (scopeIsShared(scope, _scopeType)) {
      if (!port)
        throw new Error("SharedWorker port not initialized");
      l.info(null, "Listening for shared worker messages on port", port);
      port.addEventListener("message", listener);
      port.start();
    } else if (scopeIsDedicated(scope, _scopeType)) {
      scope.addEventListener("message", listener);
    } else if (scopeIsService(scope, _scopeType)) {
      scope.addEventListener("message", listener);
    } else {
      throw new Error(`Unsupported worker scope ${scope}`);
    }
  };
  return instance;
}
