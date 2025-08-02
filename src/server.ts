import { type } from "arktype"
import { l } from "./log.js"
import {
  ImplementationsMap,
  Payload,
  PayloadCore,
  PayloadSchema,
  zImplementations,
  zProcedures,
  type ProceduresMap,
  type SwarpcServer,
} from "./types.js"
import { findTransferables } from "./utils.js"

export type { SwarpcServer } from "./types.js"

const abortControllers = new Map<string, AbortController>()

/**
 * Creates a sw&rpc server instance.
 * @param procedures procedures the server will implement
 * @param options various options
 * @param options.worker if provided, the server will use this worker to post messages, instead of sending it to all clients
 * @returns a SwarpcServer instance. Each property of the procedures map will be a method, that accepts a function implementing the procedure. There is also .start(), to be called after implementing all procedures.
 */
export function Server<Procedures extends ProceduresMap>(
  procedures: Procedures,
  { worker }: { worker?: Worker } = {}
): SwarpcServer<Procedures> {
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
            l.server.debug(null, `Aborted ${functionName} request`)
            reject(abortSignal?.reason)
          })

          implementation(input, onProgress, abortSignal)
            .then(resolve)
            .catch(reject)
        })
      }
    }) as SwarpcServer<Procedures>[typeof functionName]
  }

  // Define payload schema for incoming messages
  const Payload = type.or(
    ...Object.entries(procedures).map(([functionName, schemas]) =>
      PayloadSchema(
        type(`"${functionName}"`),
        schemas.input,
        schemas.progress,
        schemas.success
      ).exclude(
        type.or(
          { error: "unknown" },
          { result: "unknown" },
          { progress: "unknown" }
        )
      )
    )
  )

  instance.start = (self: Window) => {
    // Used to post messages back to the client
    const postMessage = async (data: Payload<Procedures>) => {
      const transfer =
        data.autotransfer === "never" ? [] : findTransferables(data)

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
      const {
        requestId,
        functionName,
        by: _,
        ...data
      } = Payload.assert(event.data)

      l.server.debug(requestId, `Received request for ${data}`, data)

      // Get autotransfer preference from the procedure definition
      const { autotransfer = "output-only" } =
        instance[zProcedures][functionName]

      // Shorthand function with functionName, requestId, etc. set
      const postMsg = async (
        data: PayloadCore<Procedures, typeof functionName>
      ) =>
        postMessage({
          by: "sw&rpc",
          functionName,
          requestId,
          autotransfer,
          ...data,
        })

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

      // Handle abortion requests (pro-choice ftw!!)
      if ("abort" in data) {
        const controller = abortControllers.get(requestId)

        if (!controller)
          await postError("No abort controller found for request")

        controller?.abort(data.abort.reason)
        return
      }

      // Set up the abort controller for this request
      abortControllers.set(requestId, new AbortController())

      // Call the implementation with the input and a progress callback
      await implementation(
        data.input,
        async (progress: any) => {
          l.server.debug(requestId, `Progress for ${functionName}`, progress)
          await postMsg({ progress })
        },
        abortControllers.get(requestId)?.signal
      )
        // Send errors
        .catch(async (error: any) => {
          l.server.error(requestId, `Error in ${functionName}`, error)
          await postError(error)
        })
        // Send results
        .then(async (result: any) => {
          l.server.debug(requestId, `Result for ${functionName}`, result)
          await postMsg({ result })
        })
    })
  }

  return instance
}
