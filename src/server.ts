/**
 * @module
 * @mergeModuleWith <project>
 */

/// <reference lib="webworker" />
import { createLogger, injectIntoConsoleGlobal, type LogLevel } from "./log.js";
import {
  ImplementationsMap,
  isPayloadHeader,
  isPayloadInitialize,
  Payload,
  PayloadCore,
  ProcedureImplementation,
  RequestCancelledError,
  validatePayloadCore,
  zImplementations,
  zProcedures,
  type ProceduresMap,
} from "./types.js";
import { findTransferables } from "./utils.js";
import { FauxLocalStorage } from "./localstorage.js";
import { scopeIsDedicated, scopeIsShared, scopeIsService } from "./scopes.js";
import { nodeIdFromScope } from "./nodes.js";

/**
 * The sw&rpc server instance, which provides methods to register {@link ProcedureImplementation | procedure implementations},
 * and listens for incoming messages that call those procedures
 */
export type SwarpcServer<Procedures extends ProceduresMap> = {
  [zProcedures]: Procedures;
  [zImplementations]: ImplementationsMap<Procedures>;
  start(): Promise<void>;
} & {
  [F in keyof Procedures]: (
    impl: ProcedureImplementation<
      Procedures[F]["input"],
      Procedures[F]["progress"],
      Procedures[F]["success"]
    >,
  ) => void;
};

const abortControllers = new Map<string, AbortController>();
const abortedRequests = new Set<string>();

/**
 * Creates a sw&rpc server instance.
 * @param procedures procedures the server will implement, see {@link ProceduresMap}
 * @param options various options
 * @param options.scope The worker scope to use, defaults to the `self` of the file where Server() is called.
 * @param options.loglevel Maximum log level to use, defaults to "debug" (shows everything). "info" will not show debug messages, "warn" will only show warnings and errors, "error" will only show errors.
 * @param options._scopeType Don't touch, this is used in testing environments because the mock is subpar. Manually overrides worker scope type detection.
 * @returns a SwarpcServer instance. Each property of the procedures map will be a method, that accepts a function implementing the procedure (see {@link ProcedureImplementation}). There is also .start(), to be called after implementing all procedures.
 *
 * An example of defining a server:
 * {@includeCode ../example/src/service-worker.ts}
 */
export function Server<Procedures extends ProceduresMap>(
  procedures: Procedures,
  {
    loglevel = "debug",
    scope,
    _scopeType,
  }: {
    scope?: WorkerGlobalScope;
    loglevel?: LogLevel;
    _scopeType?: "dedicated" | "shared" | "service";
  } = {},
): SwarpcServer<Procedures> {
  // If scope is not provided, use the global scope
  // This function is meant to be used in a worker, so `self` is a WorkerGlobalScope
  scope ??= self as WorkerGlobalScope;

  // Service workers don't have a name, but it's fine anyways cuz we don't have multiple nodes when running with a SW
  const nodeId = nodeIdFromScope(scope, _scopeType);

  let allNodeIDs = new Set<string>();

  const l = createLogger("server", loglevel, nodeId);

  // Initialize the instance.
  // Procedures and implementations are stored on properties with symbol keys,
  // to avoid any conflicts with procedure names, and also discourage direct access to them.
  const instance = {
    [zProcedures]: procedures,
    [zImplementations]: {} as ImplementationsMap<Procedures>,
    start: async () => {},
  } as SwarpcServer<Procedures>;

  // Set all implementation-setter methods
  for (const functionName in procedures) {
    instance[functionName] = ((implementation) => {
      if (!instance[zProcedures][functionName]) {
        throw new Error(
          `No procedure found for function name: ${functionName}`,
        );
      }
      instance[zImplementations][functionName] = (input, onProgress, tools) => {
        tools.abortSignal?.throwIfAborted();
        return new Promise((resolve, reject) => {
          tools.abortSignal?.addEventListener("abort", () => {
            let { requestId, reason } = tools.abortSignal!.reason;
            l.debug(requestId, `Aborted ${functionName} request: ${reason}`);
            reject({ aborted: reason });
          });

          implementation(input, onProgress, tools).then(resolve).catch(reject);
        });
      };
    }) as SwarpcServer<Procedures>[typeof functionName];
  }

  instance.start = async () => {
    const port = await new Promise<MessagePort | undefined>((resolve) => {
      if (!scopeIsShared(scope, _scopeType)) return resolve(undefined);
      l.debug(null, "Awaiting shared worker connection...");
      scope.addEventListener("connect", ({ ports: [port] }) => {
        l.debug(null, "Shared worker connected with port", port);
        resolve(port);
      });
    });

    // Used to post messages back to the client
    const postMessage = async (
      autotransfer: boolean,
      data: Payload<Procedures>,
    ) => {
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

    const listener = async (
      event: MessageEvent<any> | ExtendableMessageEvent,
    ): Promise<void> => {
      if (isPayloadInitialize(event.data)) {
        const { localStorageData, nodeId } = event.data;
        l.debug(null, "Setting up faux localStorage", localStorageData);
        new FauxLocalStorage(localStorageData).register(scope);
        injectIntoConsoleGlobal(scope, nodeId, null);
        event.data.allNodeIDs.forEach((id) => allNodeIDs.add(id));
        return;
      }

      if (!isPayloadHeader(procedures, event.data)) {
        l.error(null, "Received payload with invalid header", event.data);
        return;
      }

      // Decode the payload
      const { requestId, functionName } = event.data;

      l.debug(requestId, `Received request for ${functionName}`, event.data);

      // Get autotransfer preference from the procedure definition
      const { autotransfer = "output-only", ...schemas } =
        instance[zProcedures][functionName];

      // Shorthand function with functionName, requestId, etc. set
      const postMsg = async (
        data: PayloadCore<Procedures, typeof functionName>,
      ) => {
        if (abortedRequests.has(requestId)) return;
        await postMessage(autotransfer !== "never", {
          by: "sw&rpc",
          functionName,
          requestId,
          ...data,
        });
      };

      // Prepare a function to post errors back to the client
      const postError = async (error: any) =>
        postMsg({
          error: {
            message: "message" in error ? error.message : String(error),
          },
        });

      // Retrieve the implementation for the requested function
      const implementation = instance[zImplementations][functionName];
      if (!implementation) {
        await postError("No implementation found");
        return;
      }

      // Define payload schema for incoming messages
      const payload = validatePayloadCore(schemas, event.data);

      if ("isInitializeRequest" in payload)
        throw "Unreachable: #initialize request payload should've been handled already";

      // Handle abortion requests (pro-choice ftw!!)
      if ("abort" in payload) {
        const controller = abortControllers.get(requestId);

        if (!controller)
          await postError("No abort controller found for request");

        controller?.abort(new RequestCancelledError(payload.abort.reason));
        return;
      }

      // Set up the abort controller for this request
      abortControllers.set(requestId, new AbortController());

      if (!("input" in payload)) {
        await postError("No input provided");
        return;
      }

      try {
        injectIntoConsoleGlobal(scope, nodeId, requestId);

        // Call the implementation with the input and a progress callback
        const result = await implementation(
          payload.input,
          async (progress: any) => {
            // l.debug(requestId, `Progress for ${functionName}`, progress);
            await postMsg({ progress });
          },
          {
            nodeId,
            nodes: allNodeIDs,
            abortSignal: abortControllers.get(requestId)?.signal,
          },
        );

        // Send results
        l.debug(requestId, `Result for ${functionName}`, result);
        await postMsg({ result });
      } catch (error: any) {
        // Send errors
        // Handle errors caused by abortions
        if ("aborted" in error) {
          l.debug(
            requestId,
            `Received abort error for ${functionName}`,
            error.aborted,
          );
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

    // Listen for messages from the client
    if (scopeIsShared(scope, _scopeType)) {
      if (!port) throw new Error("SharedWorker port not initialized");
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
