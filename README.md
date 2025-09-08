<div align=center>
<h1>
  <img src="./logo.svg" alt="sw&rpc" />
</h1>

RPC for Service Workers -- move that heavy computation off of your UI thread!

</div>
 
* * *

## Features

- Fully typesafe
- Cancelable requests
- Parallelization with multiple worker instances
- Automatic [transfer](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Transferable_objects) of transferable values from- and to- worker code
- A way to polyfill a pre-filled `localStorage` to be accessed within the worker code
- Supports [Service workers](https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorker), [Shared workers](https://developer.mozilla.org/en-US/docs/Web/API/SharedWorker) and [Dedicated workers](https://developer.mozilla.org/en-US/docs/Web/API/Worker)

## Installation

```bash
npm add swarpc arktype
```

### Bleeding edge

If you want to use the latest commit instead of a published version, you can, either by using the Git URL:

```bash
npm add git+https://github.com/gwennlbh/swarpc.git
```

Or by straight up cloning the repository and pointing to the local directory (very useful to hack on sw&rpc while testing out your changes on a more substantial project):

```bash
mkdir -p vendored
git clone https://github.com/gwennlbh/swarpc.git vendored/swarpc
npm add file:vendored/swarpc
```

This works thanks to the fact that `dist/` is published on the repository (and kept up to date with a CI workflow).

## Usage

### 1. Declare your procedures in a shared file

```typescript
import type { ProceduresMap } from "swarpc";
import { type } from "arktype";

export const procedures = {
  searchIMDb: {
    // Input for the procedure
    input: type({ query: "string", "pageSize?": "number" }),
    // Function to be called whenever you can update progress while the procedure is running -- long computations are a first-class concern here. Examples include using the fetch-progress NPM package.
    progress: type({ transferred: "number", total: "number" }),
    // Output of a successful procedure call
    success: type({
      id: "string",
      primary_title: "string",
      genres: "string[]",
    }).array(),
  },
} as const satisfies ProceduresMap;
```

### 2. Register your procedures in the service worker

In your service worker file:

```javascript
import fetchProgress from "fetch-progress"
import { Server } from "swarpc"
import { procedures } from "./procedures.js"

// 1. Give yourself a server instance
const swarpc = Server(procedures)

// 2. Implement your procedures
swarpc.searchIMDb(async ({ query, pageSize = 10 }, onProgress) => {
  const queryParams = new URLSearchParams({
    page_size: pageSize.toString(),
    query,
  })

  return fetch(`https://rest.imdbapi.dev/v2/search/titles?${queryParams}`)
    .then(fetchProgress({ onProgress }))
    .then((response) => response.json())
    .then(({ titles } => titles)
})

// ...

// 3. Start the event listener
swarpc.start(self)
```

### 3. Call your procedures from the client

Here's a Svelte example!

```svelte
<script>
    import { Client } from "swarpc"
    import { procedures } from "./procedures.js"

    const swarpc = Client(procedures)

    let query = $state("")
    let results = $state([])
    let progress = $state(0)
</script>

<search>
    <input type="text" bind:value={query} placeholder="Search IMDb" />
    <button onclick={async () => {
        results = await swarpc.searchIMDb({ query }, (p) => {
            progress = p.transferred / p.total
        })
    }}>
        Search
    </button>
</search>

{#if progress > 0 && progress < 1}
    <progress value={progress} max="1" />
{/if}

<ul>
    {#each results as { id, primary_title, genres } (id)}
        <li>{primary_title} - {genres.join(", ")}</li>
    {/each}
</ul>
```

### Configure parallelism

By default, when a `worker` is passed to the `Client`'s options, the client will automatically spin up `navigator.hardwareConcurrency` worker instances and distribute requests among them. You can customize this behavior by setting the `Client:options.nodes` option to control the number of worker instances.

When `Client:options.worker` is not set, the client will use the Service worker (and thus only a single instance).

### Make cancelable requests

#### Implementation

To make your procedures meaningfully cancelable, you have to make use of the [`AbortSignal`](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal) API. This is passed as a third argument when implementing your procedures:

```js
server.searchIMDb(async ({ query }, onProgress, abort) => {
  // If you're doing heavy computation without fetch:
  let aborted = false
  abort?.addEventListener("abort", () => {
    aborted = true
  })

  // Use `aborted` to check if the request was canceled within your hot loop
  for (...) {
    /* here */ if (aborted) return
    ...
  }

  // When using fetch:
  await fetch(..., { signal: abort })
})
```

#### Call sites

Instead of calling `await client.myProcedure()` directly, call `client.myProcedure.cancelable()`. You'll get back an object with

- `async cancel(reason)`: a function to cancel the request
- `request`: a Promise that resolves to the result of the procedure call. `await` it to wait for the request to finish.

Example:

```js
// Normal call:
const result = await swarpc.searchIMDb({ query });

// Cancelable call:
const { request, cancel } = swarpc.searchIMDb.cancelable({ query });
setTimeout(() => cancel().then(() => console.warn("Took too long!!")), 5_000);
await request;
```

### Polyfill a `localStorage` for the Server to access

You might call third-party code that accesses on `localStorage` from within your procedures.

Some workers don't have access to the browser's `localStorage`, so you'll get an error.

You can work around this by specifying to swarpc localStorage items to define on the Server, and it'll create a polyfilled `localStorage` with your data.

An example use case is using Paraglide, a i18n library, with [the `localStorage` strategy](https://inlang.com/m/gerre34r/library-inlang-paraglideJs/strategy#localstorage):

```js
// In the client
import { getLocale } from "./paraglide/runtime.js";

const swarpc = Client(procedures, {
  localStorage: {
    PARAGLIDE_LOCALE: getLocale(),
  },
});

await swarpc.myProcedure(1, 0);

// In the server
import { m } from "./paraglide/runtime.js";
const swarpc = Server(procedures);

swarpc.myProcedure(async (a, b) => {
  if (b === 0) throw new Error(m.cannot_divide_by_zero());
  return a / b;
});
```
