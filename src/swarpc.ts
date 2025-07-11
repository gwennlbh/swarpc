import { type } from "arktype"
import type {
  ProceduresMap,
  SwarpcClient,
  SwarpcServer,
  ProcedureImplementation,
} from "./types"

export function Server<Procedures extends ProceduresMap>(
  procedures: Procedures,
  { worker }: { worker?: Worker } = {}
): SwarpcServer<Procedures> {
  const instance = {
    procedures,
    implementations: {} as SwarpcServer<Procedures>["implementations"],
    start: () => {},
  } as SwarpcServer<Procedures>

  for (const functionName in procedures) {
    instance[functionName] = ((implementation) => {
      if (!instance.procedures[functionName]) {
        throw new Error(`No procedure found for function name: ${functionName}`)
      }
      instance.implementations[functionName] = implementation as any
    }) as SwarpcServer<Procedures>[typeof functionName]
  }

  const PayloadSchema = type.or(
    ...Object.entries(procedures).map(([functionName, { input }]) => ({
      functionName: type(`"${functionName}"`),
      requestId: type("string >= 1"),
      input,
    }))
  )

  instance.start = (self: Window) => {
    const postMessage = async (
      data: { functionName: string; requestId: string } & Partial<{
        result: any
        error: any
        progress: any
      }>
    ) => {
      if (worker) {
        self.postMessage(data)
      } else {
        await (self as any).clients.matchAll().then((clients: any[]) => {
          clients.forEach((client) => client.postMessage(data))
        })
      }
    }

    self.addEventListener("message", async (event: MessageEvent) => {
      const { functionName, requestId, input } = PayloadSchema.assert(
        event.data
      )
      const postError = async (error: any) =>
        postMessage({
          functionName,
          requestId,
          error: {
            message: "message" in error ? error.message : String(error),
          },
        })

      const implementation = instance.implementations[functionName]
      if (!implementation) {
        await postError("No implementation found")
        return
      }

      await implementation(input, async (progress: any) => {
        await postMessage({ functionName, requestId, progress })
      })
        .catch(async (error: any) => {
          await postError(error)
        })
        .then(async (result: any) => {
          await postMessage({ functionName, requestId, result })
        })
    })
  }

  return instance
}

function generateRequestId(): string {
  return Math.random().toString(36).substring(2, 15)
}

type PendingRequest = {
  reject: (err: Error) => void
  onProgress: (progress: any) => void
  resolve: (result: any) => void
}

const pendingRequests = new Map<string, PendingRequest>()

let _clientListenerStarted = false
async function startClientListener(worker?: Worker) {
  if (_clientListenerStarted) return

  if (!worker) {
    const sw = await navigator.serviceWorker.ready
    if (!sw?.active) {
      throw new Error("[SWARPC Client] Service Worker is not active")
    }

    if (!navigator.serviceWorker.controller) {
      console.warn("[SWARPC Client] Service Worker is not controlling the page")
    }
  }

  const w = worker ?? navigator.serviceWorker
  w.addEventListener("message", (event: MessageEvent) => {
    const { functionName, requestId, ...data } = event.data || {}
    if (!requestId) {
      throw new Error("[SWARPC Client] Message received without requestId")
    }
    const handlers = pendingRequests.get(requestId)
    if (!handlers) {
      throw new Error(
        `[SWARPC Client] ${requestId} has no active request handlers`
      )
    }

    if ("error" in data) {
      handlers.reject(new Error(data.error.message))
      pendingRequests.delete(requestId)
    } else if ("progress" in data) {
      handlers.onProgress(data.progress)
    } else if ("result" in data) {
      handlers.resolve(data.result)
      pendingRequests.delete(requestId)
    }
  })

  _clientListenerStarted = true
}

export function Client<Procedures extends ProceduresMap>(
  procedures: Procedures,
  { worker }: { worker?: Worker } = {}
): SwarpcClient<Procedures> {
  const instance = { procedures } as Partial<SwarpcClient<Procedures>>

  for (const functionName of Object.keys(procedures) as Array<
    keyof Procedures
  >) {
    instance[functionName] = (async (input, onProgress = () => {}) => {
      procedures[functionName].input.assert(input)
      await startClientListener(worker)

      const w =
        worker ?? (await navigator.serviceWorker.ready.then((r) => r.active))

      if (!w) {
        throw new Error("[SWARPC Client] No active service worker found")
      }

      return new Promise((resolve, reject) => {
        if (!worker && !navigator.serviceWorker.controller)
          console.warn(
            "[SWARPC Client] Service Worker is not controlling the page"
          )

        const requestId = generateRequestId()

        pendingRequests.set(requestId, { resolve, onProgress, reject })

        w.postMessage({ functionName, input, requestId })
      })
    }) as SwarpcClient<Procedures>[typeof functionName]
  }

  return instance as SwarpcClient<Procedures>
}
