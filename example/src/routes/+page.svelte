<script lang="ts">
  import { Client } from "swarpc"
  import { procedures } from "$lib/procedures"

  const swarpc = Client(procedures)

  let query = $state("")
  let results: typeof procedures.getClassmapping.success.inferOut = $state([])
  let progress = $state(0)
  let loading = $state(false)
</script>

<search>
  <button
    onclick={async () => {
      results = await swarpc.getClassmapping({ ref: "main" }, (p) => {
        loading = true
        progress = p.transferred / p.total
      })
      loading = false
    }}
  >
    Get classmapping
  </button>
</search>

{#if progress > 0 && progress < 1}
  <progress value={progress} max="1">Loading…</progress>
{:else if loading}
  <p>Loading...</p>
{/if}

<ul>
  {#each results as mapping (mapping)}
    <li>{mapping}</li>
  {/each}
</ul>
