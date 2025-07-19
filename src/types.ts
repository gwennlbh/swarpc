import type { Type } from "arktype"

/**
 * A procedure declaration
 */
export type Procedure<I extends Type, P extends Type, S extends Type> = {
  /**
   * ArkType type for the input (first argument) of the procedure, when calling it from the client.
   */
  input: I
  /**
   * ArkType type for the data as the first argument given to the `onProgress` callback
   * when calling the procedure from the client.
   */
  progress: P
  /**
   * ArkType type for the output (return value) of the procedure, when calling it from the client.
   */
  success: S
  /**
   * When should the procedure automatically add ArrayBuffers and other transferable objects
   * to the [transfer list](https://developer.mozilla.org/en-US/docs/Web/API/DedicatedWorkerGlobalScope/postMessage#transfer)
   * when sending messages, both from the client to the server and vice versa.
   *
   * Transferring objects can improve performance by avoiding copies of large objects,
   * but _moves_ them to the other context, meaning that they cannot be used in the original context after being sent.
   *
   * 'output-only' by default: only transferables sent from the server to the client will be transferred.
   */
  autotransfer?: "always" | "never" | "output-only"
}

/**
 * An implementation of a procedure
 */
export type ProcedureImplementation<
  I extends Type,
  P extends Type,
  S extends Type
> = (
  input: I["inferOut"],
  onProgress: (progress: P["inferIn"]) => void
) => Promise<S["inferIn"]>

/**
 * Declarations of procedures by name.
 */
export type ProceduresMap = Record<string, Procedure<Type, Type, Type>>

/**
 * Implementations of procedures by name
 */
export type ImplementationsMap<Procedures extends ProceduresMap> = {
  [F in keyof Procedures]: ProcedureImplementation<
    Procedures[F]["input"],
    Procedures[F]["progress"],
    Procedures[F]["success"]
  >
}

/**
 * Declaration of hooks to run on messages received from the server
 */
export type Hooks<Procedures extends ProceduresMap> = {
  /**
   * Called when a procedure call has been successful.
   */
  success?: <Procedure extends keyof ProceduresMap>(
    procedure: Procedure,
    data: Procedures[Procedure]["success"]["inferOut"]
  ) => void
  /**
   * Called when a procedure call has failed.
   */
  error?: <Procedure extends keyof ProceduresMap>(
    procedure: Procedure,
    error: Error
  ) => void
  /**
   * Called when a procedure call sends progress updates.
   */
  progress?: <Procedure extends keyof ProceduresMap>(
    procedure: Procedure,
    data: Procedures[Procedure]["progress"]["inferOut"]
  ) => void
}

export type PayloadHeader<
  PM extends ProceduresMap,
  Name extends keyof PM = keyof PM
> = {
  functionName: Name & string
  requestId: string
  autotransfer: PM[Name]["autotransfer"]
}

export type PayloadCore<
  PM extends ProceduresMap,
  Name extends keyof PM = keyof PM
> =
  | {
      input: PM[Name]["input"]["inferOut"]
    }
  | {
      progress: PM[Name]["progress"]["inferOut"]
    }
  | {
      result: PM[Name]["success"]["inferOut"]
    }
  | {
      error: { message: string }
    }

/**
 * The effective payload as sent by the server to the client
 */
export type Payload<
  PM extends ProceduresMap,
  Name extends keyof PM = keyof PM
> = PayloadHeader<PM, Name> & PayloadCore<PM, Name>

/**
 * A procedure's corresponding method on the client instance -- used to call the procedure
 */
export type ClientMethod<P extends Procedure<Type, Type, Type>> = (
  input: P["input"]["inferIn"],
  onProgress?: (progress: P["progress"]["inferOut"]) => void
) => Promise<P["success"]["inferOut"]>

/**
 * Symbol used as the key for the procedures map on the server instance
 */
export const zImplementations = Symbol("SWARPC implementations")
/**
 * Symbol used as the key for the procedures map on instances
 */
export const zProcedures = Symbol("SWARPC procedures")

/**
 * The sw&rpc client instance, which provides methods to call procedures
 */
export type SwarpcClient<Procedures extends ProceduresMap> = {
  [zProcedures]: Procedures
} & {
  [F in keyof Procedures]: ClientMethod<Procedures[F]>
}

/**
 * The sw&rpc server instance, which provides methods to register procedure implementations,
 * and listens for incoming messages that call those procedures
 */
export type SwarpcServer<Procedures extends ProceduresMap> = {
  [zProcedures]: Procedures
  [zImplementations]: ImplementationsMap<Procedures>
  start(self: Window): void
} & {
  [F in keyof Procedures]: (
    impl: ProcedureImplementation<
      Procedures[F]["input"],
      Procedures[F]["progress"],
      Procedures[F]["success"]
    >
  ) => void
}
