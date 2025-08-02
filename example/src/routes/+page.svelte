<script lang="ts">
  import { procedures } from "$lib/procedures"
  import { Client, type CancelablePromise } from "swarpc"

  // 1. Give yourself a client instance
  const swarpc = Client(procedures)

  // 2. Declare some state to hold info
  let results: typeof procedures.getClassmapping.success.inferOut = $state([])
  let progress = $state(0)
  let loading = $state(false)
  let cancel: undefined | CancelablePromise["cancel"] = $state()
</script>

<search>
  <button
    onclick={async () => {
      // 3. Call a method on the client instance
      const cancelable = swarpc.getClassmapping.cancelable(
        { ref: "main", delay: 2 },
        (p) => {
          loading = true
          progress = p.transferred / p.total
        }
      )

      // 4. Bind the cancel function to a variable, so you can cancel the request later
      cancel = cancelable.cancel
      // 5. Await the request to get the results
      results = await cancelable.request
      loading = false
    }}
  >
    Get classmapping
  </button>
</search>

<!-- 6. Give users a way to cancel the request -->
{#if cancel}
  <button
    onclick={async () => {
      await cancel("User cancelled")
      loading = false
    }}
  >
    Cancel
  </button>
{/if}

<!-- 7. Display your progress indicators -->
{#if progress > 0 && progress < 1}
  <progress value={progress} max="1">Loading…</progress>
{:else if loading}
  <p>Loading...</p>
{/if}

<!-- 8. Display your results! -->
<ul>
  {#each results as mapping (mapping)}
    <li>{mapping}</li>
  {/each}
</ul>
