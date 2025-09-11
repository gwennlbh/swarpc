<script lang="ts">
  import type { CancelablePromise } from "swarpc"

  const { data } = $props()
  const { swarpc } = $derived(data)

  let a = $state(0)
  let b = $state(0)
  let result = $state(0)
  let progress = $state(0)
  let loading = $state(false)
  let cancel: undefined | CancelablePromise["cancel"] = $state()
</script>

<search>
  <input type="number" bind:value={a} />
  *
  <input type="number" bind:value={b} />
  =
  <button
    onclick={async () => {
      // 1. Call a method on the client instance
      const cancelable = swarpc.multiply.cancelable(
        { a, b },
        ({ progress: p }) => {
          loading = true
          progress = p
        }
      )

      // 2. Bind the cancel function to a variable, so you can cancel the request later
      cancel = cancelable.cancel

      // 3. Await the request to get the results
      result = await cancelable.request.then((r) => r.result)
      loading = false
      cancel = undefined
    }}
  >
    {#if loading}
      loading... {Math.round(progress * 100)}%
    {:else if result}
      {result}
    {:else}
      compute
    {/if}
  </button>
</search>

<!-- 6. Give users a way to cancel the request -->
{#if cancel}
  <button
    onclick={async () => {
      cancel?.("User cancelled")
      loading = false
    }}
  >
    Cancel
  </button>
{/if}
