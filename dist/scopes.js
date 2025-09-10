class MockedWorkerGlobalScope {
    constructor() { }
}
const SharedWorkerGlobalScope = globalThis.SharedWorkerGlobalScope ?? MockedWorkerGlobalScope;
const DedicatedWorkerGlobalScope = globalThis.DedicatedWorkerGlobalScope ?? MockedWorkerGlobalScope;
const ServiceWorkerGlobalScope = globalThis.ServiceWorkerGlobalScope ?? MockedWorkerGlobalScope;
export function scopeIsShared(scope, _scopeType) {
    return scope instanceof SharedWorkerGlobalScope || _scopeType === "shared";
}
export function scopeIsDedicated(scope, _scopeType) {
    return (scope instanceof DedicatedWorkerGlobalScope || _scopeType === "dedicated");
}
export function scopeIsService(scope, _scopeType) {
    return scope instanceof ServiceWorkerGlobalScope || _scopeType === "service";
}
