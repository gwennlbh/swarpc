import { type } from "arktype"
/**
 * @import { Type } from 'arktype';
 */

/**
 * @template {Type} I
 * @template {Type} P
 * @template {Type} S
 * @typedef {Object} Procedure
 * @property {I} input
 * @property {P} progress
 * @property {S} success
 */

/**
 * @template {Type} I
 * @template {Type} P
 * @template {Type} S
 * @typedef {(input: I['inferOut'], onProgress: (progress: P['inferOut']) => void) => Promise<NoInfer<S>['inferOut'] | NoInfer<S>['inferOut']>} ProcedureImplementation
 */

/**
 * @typedef {Record<string, Procedure<Type, Type, Type>>} ProceduresMap
 */

/**
 * @template {ProceduresMap} Procedures
 * @typedef {{ procedures: Procedures, implementations: {[F in keyof Procedures]: ProcedureImplementation<Procedures[F]['input'], Procedures[F]['progress'], Procedures[F]['success']> }, start: (self: Window) => void  } & { [F in keyof Procedures]: (impl: NoInfer<ProcedureImplementation<Procedures[F]['input'], Procedures[F]['progress'], Procedures[F]['success'] >>) => void }} SwarpServer
 */

/**
 * @template {ProceduresMap} Procedures
 * @param {Procedures} procedures
 * @returns {SwarpServer<Procedures>}
 */
export function Server(procedures) {
  /** @type {SwarpServer<Procedures>}  */
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

      await implementation(input, async (progress) =>
        postMessage({ functionName, progress })
      )
        .catch(async (error) => postError(error))
        .then(async (result) => postMessage({ functionName, result }))
    })
  }

  return instance
}

/**
 * @template {Procedure<Type, Type, Type>} P
 * @typedef {(input: P['input']['inferOut'], onProgress?: (progress: P['progress']['inferOut']) => void) => Promise<P['success']['inferOut']>} ClientMethod
 */

/**
 * @template {ProceduresMap} Procedures
 * @typedef {{ procedures: Procedures } & { [F in keyof Procedures]: ClientMethod<Procedures[F]> }} SwarpClient
 */

/**
 * @template {ProceduresMap} Procedures
 * @param {Procedures} procedures
 * @returns {SwarpClient<Procedures>}
 */
export function Client(procedures) {
  /** @type {SwarpClient<Procedures>} */
  // @ts-expect-error
  const instance = { procedures }

  for (const functionName of Object.keys(procedures)) {
    instance[functionName] = async (input, onProgress = () => {}) => {
      procedures[functionName].input.assert(input)
      console.log("[SWARPC Client] Calling", functionName, "with", input)
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
      })
    }
  }

  return instance
}
