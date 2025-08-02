<script lang="ts">
  import { Client, type CancelablePromise } from "swarpc"
  import { procedures } from "$lib/procedures"

  const swarpc = Client(procedures)

  let query = $state("")
  let results: typeof procedures.getClassmapping.success.inferOut = $state([])
  let progress = $state(0)
  let loading = $state(false)
  let _cancel: CancelablePromise<typeof results>["cancel"] | undefined =
    $state()

  async function cancel(reason: string) {
    if (!_cancel) return
    await _cancel(reason)
    loading = false
  }
</script>

<search>
  <button
    onclick={async () => {
      const { request, cancel } = swarpc.getClassmapping.cancelable(
        { ref: "main", delay: 2 },
        (p) => {
          loading = true
          progress = p.transferred / p.total
        }
      )

      _cancel = cancel
      results = await request

      loading = false
    }}
  >
    Get classmapping
  </button>
</search>

{#if _cancel}
  <button onclick={async () => cancel("User cancelled")}>Cancel</button>
{/if}

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
