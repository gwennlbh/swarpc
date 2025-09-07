class MockedWorkerGlobalScope {
  constructor() {}
}

const SharedWorkerGlobalScope =
  globalThis.SharedWorkerGlobalScope ?? MockedWorkerGlobalScope;

const DedicatedWorkerGlobalScope =
  globalThis.DedicatedWorkerGlobalScope ?? MockedWorkerGlobalScope;

const ServiceWorkerGlobalScope =
  globalThis.ServiceWorkerGlobalScope ?? MockedWorkerGlobalScope;

export function scopeIsShared(
  scope: WorkerGlobalScope,
  _scopeType?: "dedicated" | "shared" | "service",
): scope is SharedWorkerGlobalScope {
  return scope instanceof SharedWorkerGlobalScope || _scopeType === "shared";
}

export function scopeIsDedicated(
  scope: WorkerGlobalScope,
  _scopeType?: "dedicated" | "shared" | "service",
): scope is DedicatedWorkerGlobalScope {
  return (
    scope instanceof DedicatedWorkerGlobalScope || _scopeType === "dedicated"
  );
}

export function scopeIsService(
  scope: WorkerGlobalScope,
  _scopeType?: "dedicated" | "shared" | "service",
): scope is ServiceWorkerGlobalScope {
  return scope instanceof ServiceWorkerGlobalScope || _scopeType === "service";
}
