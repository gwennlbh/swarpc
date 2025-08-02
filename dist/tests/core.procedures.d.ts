export declare const procedures: {
    readonly hello: {
        readonly input: import("arktype/internal/methods/string.ts").StringType<string, {}>;
        readonly progress: import("arktype").BaseType<undefined, {}>;
        readonly success: import("arktype/internal/methods/string.ts").StringType<string, {}>;
    };
    readonly helloWithProgress: {
        readonly input: import("arktype/internal/methods/string.ts").StringType<string, {}>;
        readonly progress: import("arktype/internal/methods/object.ts").ObjectType<{
            current: number;
            total: number;
        }, {}>;
        readonly success: import("arktype/internal/methods/string.ts").StringType<string, {}>;
    };
    readonly cancellable: {
        readonly input: import("arktype/internal/methods/string.ts").StringType<string, {}>;
        readonly progress: import("arktype/internal/methods/object.ts").ObjectType<{
            current: number;
            total: number;
        }, {}>;
        readonly success: import("arktype/internal/methods/string.ts").StringType<string, {}>;
    };
    readonly complexData: {
        readonly input: import("arktype/internal/methods/object.ts").ObjectType<{
            name: string;
            age: number;
            custom: (In: string) => import("arktype/internal/attributes.ts").To<import("@ark/util").Json>;
            hobbies: import("arktype/internal/attributes.ts").Default<string[], never[]>;
            address: (In: {
                street: string;
                city: string;
                zip: string;
                houseno?: number | undefined;
            }) => import("arktype").Out<string>;
        }, {}>;
        readonly progress: import("arktype/internal/methods/object.ts").ObjectType<{
            message: string;
            percent: number;
        }, {}>;
        readonly success: import("arktype/internal/methods/object.ts").ObjectType<{
            message: string;
        }, {}>;
    };
};
//# sourceMappingURL=core.procedures.d.ts.map