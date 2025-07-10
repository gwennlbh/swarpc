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
        .matchAll()
        .then((clients) =>
          clients.forEach((client) => client.postMessage(data))
        )
    }

    console.log("[SWARPC Server] Starting message listener on", self)

    self.addEventListener("message", async (event) => {
      const { functionName, input } = PayloadSchema.assert(event.data)
      console.log("[SWARPC Server] Running", functionName, "with", input)

      /**
       * @param {*} error
       */
      const postError = async (error) =>
        postMessage({
          functionName,
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
        console.debug(`[SWARPC Server] Progress for ${functionName}:`, progress)
        await postMessage({ functionName, progress })
      })
        .catch(async (error) => {
          console.debug(`[SWARPC Server] Error in ${functionName}:`, error)
          await postError(error)
        })
        .then(async (result) => {
          console.debug(`[SWARPC Server] Result for ${functionName}:`, result)
          await postMessage({ functionName, result })
        })
    })
  }

  return instance
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
      navigator.serviceWorker.controller?.postMessage({ functionName, input })
      return new Promise((resolve, reject) => {
        navigator.serviceWorker.addEventListener("message", (event) => {
          const { functionName: fn, ...data } = event.data

          if (fn !== functionName) return

          if ("error" in data) {
            reject(new Error(data.error.message))
          } else if ("progress" in data) {
            onProgress(data.progress)
          } else if ("result" in data) {
            resolve(data.result)
          }
        })

        navigator.serviceWorker.ready.then((registration) => {
          console.log("[SWARPC Client] Requesting", functionName, "with", input)
          registration.active.postMessage({ functionName, input })
        })
      })
    }
  }

  return instance
}
