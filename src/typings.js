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
 * @template {Procedure<Type, Type, Type>} P
 * @typedef {(input: P['input']['inferIn'], onProgress?: (progress: P['progress']['inferOut']) => void) => Promise<P['success']['inferOut']>} ClientMethod
 */

/**
 * @template {ProceduresMap} Procedures
 * @typedef {{ procedures: Procedures } & { [F in keyof Procedures]: ClientMethod<Procedures[F]> }} SwarpcClient
 */

/**
 * @template {ProceduresMap} Procedures
 * @typedef {{ procedures: Procedures, implementations: {[F in keyof Procedures]: ProcedureImplementation<Procedures[F]['input'], Procedures[F]['progress'], Procedures[F]['success']> }, start: (self: Window) => void  } & { [F in keyof Procedures]: (impl: NoInfer<ProcedureImplementation<Procedures[F]['input'], Procedures[F]['progress'], Procedures[F]['success'] >>) => void }} SwarpcServer
 */

// Required, otherwise nothing can be imported from this file
export {}
