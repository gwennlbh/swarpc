export const zImplementations = Symbol("SWARPC implementations");
export const zProcedures = Symbol("SWARPC procedures");
export class RequestCancelledError extends Error {
    constructor(reason) {
        super(`Request was cancelled: ${reason}`);
        this.name = "RequestCancelledError";
    }
}
