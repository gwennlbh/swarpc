import { type ProceduresMap, type SwarpcClient, type SwarpcServer } from "./types.js";
export type { ProceduresMap, SwarpcClient, SwarpcServer } from "./types.js";
export declare function Server<Procedures extends ProceduresMap>(procedures: Procedures, { worker }?: {
    worker?: Worker;
}): SwarpcServer<Procedures>;
export declare function Client<Procedures extends ProceduresMap>(procedures: Procedures, { worker }?: {
    worker?: Worker;
}): SwarpcClient<Procedures>;
//# sourceMappingURL=swarpc.d.ts.map