import type { Type } from "arktype";

export type Procedure<I extends Type, P extends Type, S extends Type> = {
  input: I;
  progress: P;
  success: S;
};

export type ProcedureImplementation<
  I extends Type,
  P extends Type,
  S extends Type
> = (
  input: I["inferOut"],
  onProgress: (progress: P["inferOut"]) => void
) => Promise<S["inferOut"]>;

export type ProceduresMap = Record<string, Procedure<Type, Type, Type>>;

export type ClientMethod<P extends Procedure<Type, Type, Type>> = (
  input: P["input"]["inferIn"],
  onProgress?: (progress: P["progress"]["inferOut"]) => void
) => Promise<P["success"]["inferOut"]>;

export type SwarpcClient<Procedures extends ProceduresMap> = {
  procedures: Procedures;
} & {
  [F in keyof Procedures]: ClientMethod<Procedures[F]>;
};

export type SwarpcServer<Procedures extends ProceduresMap> = {
  procedures: Procedures;
  implementations: {
    [F in keyof Procedures]: ProcedureImplementation<
      Procedures[F]["input"],
      Procedures[F]["progress"],
      Procedures[F]["success"]
    >;
  };
  start(self: Window): void;
} & {
  [F in keyof Procedures]: (
    impl: ProcedureImplementation<
      Procedures[F]["input"],
      Procedures[F]["progress"],
      Procedures[F]["success"]
    >
  ) => void;
};
