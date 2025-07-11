import type { ProceduresMap, SwarpcClient, SwarpcServer } from "./types";
export declare function Server<Procedures extends ProceduresMap>(procedures: Procedures, { worker }?: {
    worker?: Worker;
}): SwarpcServer<Procedures>;
export declare function Client<Procedures extends ProceduresMap>(procedures: Procedures, { worker }?: {
    worker?: Worker;
}): SwarpcClient<Procedures>;
//# sourceMappingURL=swarpc.d.ts.map