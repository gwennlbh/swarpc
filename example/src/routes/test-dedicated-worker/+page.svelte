<script lang="ts">
  import { onMount } from "svelte"
  import { Client, type CancelablePromise } from "swarpc"
  import { type } from "arktype"
  import { browser } from "$app/environment"
  import DedicatedWorkerScript from "$lib/dedicated-worker.ts?worker"

  let swarpcClient = $state<ReturnType<typeof Client<typeof procedures>> | null>(null)
  let ready = $state(false)

  // Define simple procedures for dedicated worker
  const procedures = {
    echo: {
      input: type({ message: "string" }),
      progress: type({}),
      success: type({ echo: "string" }),
    },
    heavyComputation: {
      input: type({ iterations: "number" }),
      progress: type({ completed: "number", total: "number" }),
      success: type({ result: "string" }),
    },
  } as const

  // Initialize client with dedicated worker
  onMount(async () => {
    if (browser) {
      try {
        // Create the swarpc client with dedicated worker configuration
        swarpcClient = Client(procedures, {
          worker: DedicatedWorkerScript,
        })
        ready = true
        console.log('Dedicated worker client initialized')
      } catch (error) {
        console.error('Failed to initialize dedicated worker client:', error)
      }

      // Expose swarpc and arktype globally for testing
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

{#if !ready}
  <p id="status">Loading...</p>
{:else}
  <p id="status">Loaded</p>
  <p>Dedicated worker client is ready!</p>
  
  {#if swarpcClient}
    <button onclick={async () => {
      try {
        const result = await swarpcClient.echo({ message: "Hello from dedicated worker!" })
        console.log('Echo result:', result)
      } catch (error) {
        console.error('Echo failed:', error)
      }
    }}>
      Test Echo
    </button>
  {/if}
{/if}