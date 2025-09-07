export declare class FauxLocalStorage {
    data: Record<string, any>;
    keysOrder: string[];
    constructor(data: Record<string, any>);
    setItem(key: string, value: string): void;
    getItem(key: string): any;
    hasItem(key: string): boolean;
    removeItem(key: string): void;
    clear(): void;
    key(index: number): string;
    get length(): number;
    register(subject: WorkerGlobalScope | SharedWorkerGlobalScope): void;
}
//# sourceMappingURL=localstorage.d.ts.map