import { type } from "arktype"

/**
 * @import { ProceduresMap, SwarpcClient, SwarpcServer } from './typings.js'
 */

/**
 * @template {ProceduresMap} Procedures
 * @param {Procedures} procedures
 * @returns {SwarpcServer<Procedures>}
 */
export function Server(procedures) {
  /** @type {SwarpcServer<Procedures>}  */
  // @ts-expect-error
  const instance = {
    procedures,
    implementations: {},
  }

  for (const functionName in procedures) {
    instance[functionName] = (
      /**
       * @type {ProcedureImplementation<ProceduresMap[typeof functionName]['input'], ProceduresMap[typeof functionName]['progress'], ProceduresMap[typeof functionName]['success']>}
       */
      implementation
    ) => {
      if (!instance.procedures[functionName]) {
        throw new Error(`No procedure found for function name: ${functionName}`)
      }

      instance.implementations[functionName] = implementation
    }
  }

  const PayloadSchema = type.or(
    ...Object.entries(procedures).map(([functionName, { input }]) => ({
      functionName: type(`"${functionName}"`),
      requestId: type("string"),
      input,
    }))
  )

  /**
   * Starts the message event handler. Needs to be called within the Service Worker context.
   * @param {Window} self
   */
  instance.start = (self) => {
    /**
     * @param {{functionName: string} & Partial<{ result: any; error: any; progress: any }>} data
     */
    const postMessage = async (data) => {
      await self.clients
        .matchAll({ includeUncontrolled: true })
        .then((clients) => {
          console.debug(`[SWARPC Server] Posting message to clients`, clients)
          clients.forEach((client) => client.postMessage(data))
        })
    }

    console.log("[SWARPC Server] Starting message listener on", self)

    self.addEventListener("message", async (event) => {
      const { functionName, requestId, input } = PayloadSchema.assert(
        event.data
      )
      console.log(
        `[SWARPC Server] ${requestId} Running ${functionName} with`,
        input
      )

      /**
       * @param {*} error
       */
      const postError = async (error) =>
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

      await implementation(input, async (progress) => {
        console.debug(`[SWARPC Server] ${requestId} Progress for ${functionName}:`, progress)
        await postMessage({ functionName, requestId, progress })
      })
        .catch(async (error) => {
          console.debug(`[SWARPC Server] ${requestId} Error in ${functionName}:`, error)
          await postError(error)
        })
        .then(async (result) => {
          console.debug(`[SWARPC Server] ${requestId} Result for ${functionName}:`, result)
          await postMessage({ functionName, requestId, result })
        })
    })
  }

  return instance
}

function generateRequestId() {
  return Math.random().toString(36).substring(2, 15)
}

/**
 * @type {Map<string, { reject: (err: Error) => void; onProgress: (progress: any) => void; resolve: (result: any) => void }>}
 */
const pendingRequests = new Map()

let _clientListenerStarted = false
async function startClientListener() {
  const sw = await navigator.serviceWorker.ready
  if (!sw.active) {
    throw new Error("[SWARPC Client] Service Worker is not active")
  }

  if (!navigator.serviceWorker.controller) {
    throw new Error(
      "[SWARPC Client] Service Worker is not controlling the page"
    )
  }

  if (_clientListenerStarted) return

  console.debug("[SWARPC Client] Registering message listener for client")
  window.addEventListener("message", (event) => {
    const { functionName, requestId, ...data } = event.data || {}
    if (!requestId) return
    const handlers = pendingRequests.get(requestId)
    if (!handlers) return

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

/**
 * @template {ProceduresMap} Procedures
 * @param {Procedures} procedures
 * @returns {SwarpcClient<Procedures>}
 */
export function Client(procedures) {
  /** @type {SwarpcClient<Procedures>} */
  // @ts-expect-error
  const instance = { procedures }

  for (const functionName of Object.keys(procedures)) {
    instance[functionName] = async (input, onProgress = () => {}) => {
      procedures[functionName].input.assert(input)
      await startClientListener()

      const sw = await navigator.serviceWorker.ready.then((r) => r.active)
      return new Promise((resolve, reject) => {
        if (!navigator.serviceWorker.controller)
          throw new Error(
            "[SWARPC Client] Service Worker is not controlling the page"
          )

        const requestId = generateRequestId()

        pendingRequests.set(requestId, { resolve, onProgress, reject })

        console.log(
          `[SWARPC Client] ${requestId} Requesting ${functionName} with`,
          input
        )
        sw.postMessage({ functionName, input, requestId })
      })
    }
  }

  return instance
}
