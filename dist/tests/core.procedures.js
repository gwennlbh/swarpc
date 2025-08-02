import { type } from "arktype";
export const procedures = {
    hello: {
        input: type("string"),
        progress: type("undefined"),
        success: type("string"),
    },
    helloWithProgress: {
        input: type("string"),
        progress: type({
            current: "number",
            total: "number",
        }),
        success: type("string"),
    },
    cancellable: {
        input: type("string"),
        progress: type({
            current: "number",
            total: "number",
        }),
        success: type("string"),
    },
    complexData: {
        input: type({
            name: "string",
            age: "number",
            custom: "string.json.parse",
            hobbies: type("string[]").default(() => []),
            address: type([
                {
                    "houseno?": "number",
                    street: "string",
                    city: "string",
                    zip: "string",
                },
                "=>",
                (address) => `${address.houseno ? address.houseno + " " : ""}${address.street}, ${address.city} ${address.zip}`,
            ]),
        }),
        progress: type({
            message: "string",
            percent: "number",
        }),
        success: type({
            message: "string",
        }),
    },
};
