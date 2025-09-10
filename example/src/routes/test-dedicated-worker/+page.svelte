<script lang="ts">
  import { onMount } from "svelte"
  import { Client, type CancelablePromise } from "swarpc"
  import { type } from "arktype"
  import { browser } from "$app/environment"

  // Expose swarpc and arktype globally for testing
  onMount(() => {
    if (browser) {
      // @ts-ignore
      window.swarpc = { Client }
      // @ts-ignore
      window.arktype = { type }
    }
  })
</script>

<svelte:head>
  <title>swarpc Dedicated Worker Test Page</title>
</svelte:head>

<h1>Dedicated Worker Test Page</h1>
<p>This page is used for testing dedicated worker functionality with swarpc.</p>
<p id="status">Loaded</p>