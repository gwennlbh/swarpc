/**
 * @module 
 * @mergeModuleWith <project>
 */

import { type } from "arktype"
import { createLogger, type LogLevel } from "./log.js"
import {
  ImplementationsMap,
  Payload,
  PayloadCore,
  PayloadHeaderSchema,
  PayloadSchema,
  ProcedureImplementation,
  zImplementations,
  zProcedures,
  type ProceduresMap,
} from "./types.js"
import { findTransferables } from "./utils.js"

/**
 * The sw&rpc server instance, which provides methods to register procedure implementations,
 * and listens for incoming messages that call those procedures
 */
export type SwarpcServer<Procedures extends ProceduresMap> = {
  [zProcedures]: Procedures
  [zImplementations]: ImplementationsMap<Procedures>
  start(self: Window | Worker): void
} & {
  [F in keyof Procedures]: (
    impl: ProcedureImplementation<
      Procedures[F]["input"],
      Procedures[F]["progress"],
      Procedures[F]["success"]
    >
  ) => void
}

const abortControllers = new Map<string, AbortController>()
const abortedRequests = new Set<string>()

/**
 * Creates a sw&rpc server instance.
 * @param procedures procedures the server will implement
 * @param options various options
 * @param options.worker if provided, the server will use this worker to post messages, instead of sending it to all clients
 * @returns a SwarpcServer instance. Each property of the procedures map will be a method, that accepts a function implementing the procedure. There is also .start(), to be called after implementing all procedures.
 */
export function Server<Procedures extends ProceduresMap>(
  procedures: Procedures,
  { worker, loglevel = "debug" }: { worker?: Worker; loglevel?: LogLevel } = {}
): SwarpcServer<Procedures> {
  const l = createLogger("server", loglevel)

  // Initialize the instance.
  // Procedures and implementations are stored on properties with symbol keys,
  // to avoid any conflicts with procedure names, and also discourage direct access to them.
  const instance = {
    [zProcedures]: procedures,
    [zImplementations]: {} as ImplementationsMap<Procedures>,
    start: (self: Window) => {},
  } as SwarpcServer<Procedures>

  // Set all implementation-setter methods
  for (const functionName in procedures) {
    instance[functionName] = ((implementation) => {
      if (!instance[zProcedures][functionName]) {
        throw new Error(`No procedure found for function name: ${functionName}`)
      }
      instance[zImplementations][functionName] = (
        input,
        onProgress,
        abortSignal
      ) => {
        abortSignal?.throwIfAborted()
        return new Promise((resolve, reject) => {
          abortSignal?.addEventListener("abort", () => {
            let { requestId, reason } = abortSignal?.reason
            l.debug(requestId, `Aborted ${functionName} request: ${reason}`)
            reject({ aborted: reason })
          })

          implementation(input, onProgress, abortSignal)
            .then(resolve)
            .catch(reject)
        })
      }
    }) as SwarpcServer<Procedures>[typeof functionName]
  }

  instance.start = (self: Window) => {
    // Used to post messages back to the client
    const postMessage = async (
      autotransfer: boolean,
      data: Payload<Procedures>
    ) => {
      const transfer = autotransfer ? [] : findTransferables(data)

      if (worker) {
        self.postMessage(data, { transfer })
      } else {
        await (self as any).clients.matchAll().then((clients: any[]) => {
          clients.forEach((client) => client.postMessage(data, { transfer }))
        })
      }
    }

    // Listen for messages from the client
    self.addEventListener("message", async (event: MessageEvent) => {
      // Decode the payload
      const { requestId, functionName } = PayloadHeaderSchema(
        type.enumerated(...Object.keys(procedures))
      ).assert(event.data)

      l.debug(requestId, `Received request for ${functionName}`, event.data)

      // Get autotransfer preference from the procedure definition
      const { autotransfer = "output-only", ...schemas } =
        instance[zProcedures][functionName]

      // Shorthand function with functionName, requestId, etc. set
      const postMsg = async (
        data: PayloadCore<Procedures, typeof functionName>
      ) => {
        if (abortedRequests.has(requestId)) return
        await postMessage(autotransfer !== "never", {
          by: "sw&rpc",
          functionName,
          requestId,
          ...data,
        })
      }

      // Prepare a function to post errors back to the client
      const postError = async (error: any) =>
        postMsg({
          error: {
            message: "message" in error ? error.message : String(error),
          },
        })

      // Retrieve the implementation for the requested function
      const implementation = instance[zImplementations][functionName]
      if (!implementation) {
        await postError("No implementation found")
        return
      }

      // Define payload schema for incoming messages
      const payload = PayloadSchema(
        type(`"${functionName}"`),
        schemas.input,
        schemas.progress,
        schemas.success
      ).assert(event.data)

      // Handle abortion requests (pro-choice ftw!!)
      if (payload.abort) {
        const controller = abortControllers.get(requestId)

        if (!controller)
          await postError("No abort controller found for request")

        controller?.abort(payload.abort.reason)
        return
      }

      // Set up the abort controller for this request
      abortControllers.set(requestId, new AbortController())

      if (!payload.input) {
        await postError("No input provided")
        return
      }

      // Call the implementation with the input and a progress callback
      await implementation(
        payload.input,
        async (progress: any) => {
          l.debug(requestId, `Progress for ${functionName}`, progress)
          await postMsg({ progress })
        },
        abortControllers.get(requestId)?.signal
      )
        // Send errors
        .catch(async (error: any) => {
          // Handle errors caused by abortions
          if ("aborted" in error) {
            l.debug(
              requestId,
              `Received abort error for ${functionName}`,
              error.aborted
            )
            abortedRequests.add(requestId)
            abortControllers.delete(requestId)
            return
          }

          l.error(requestId, `Error in ${functionName}`, error)
          await postError(error)
        })
        // Send results
        .then(async (result: any) => {
          l.debug(requestId, `Result for ${functionName}`, result)
          await postMsg({ result })
        })
        .finally(() => {
          abortedRequests.delete(requestId)
        })
    })
  }

  return instance
}
