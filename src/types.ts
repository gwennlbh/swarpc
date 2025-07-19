import type { Type } from "arktype"

/**
 * A procedure declaration
 */
export type Procedure<I extends Type, P extends Type, S extends Type> = {
  input: I
  progress: P
  success: S
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
 * Declarations of procedures by name
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
