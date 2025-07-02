<div align=center>
<h1>
  <img src="./logo.svg" alt="sw&rpc" />
</h1>

RPC for Service Workers -- move that heavy computation off of your UI thread!

</div>
 
* * *

## Installation

```bash
npm add swarpc arktype
```

## Usage

### 1. Declare your procedures in a shared file

```typescript
import type { ProceduresMap } from "swarpc"
import { type } from "arktype"

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
} as const satisfies ProceduresMap
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
