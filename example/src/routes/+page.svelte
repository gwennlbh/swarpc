<script lang="ts">
  import { onMount } from "svelte"
  import { procedures } from "$lib/procedures"
  import { Client, type CancelablePromise } from "swarpc"
  import { browser } from "$app/environment"

  // 1. Give yourself a client instance (only in browser)
  let swarpc = $state<ReturnType<typeof Client<typeof procedures>>>()
  let swReady = $state(false)

  // 2. Declare some state to hold info
  let results: typeof procedures.getClassmapping.success.inferOut = $state([])
  let progress = $state(0)
  let loading = $state(false)
  let cancel: undefined | CancelablePromise["cancel"] = $state()

  // Initialize the client only when we're in the browser
  onMount(async () => {
    if (browser && 'serviceWorker' in navigator) {
      // Wait for service worker to be ready
      try {
        console.log('Attempting to register and initialize service worker...')
        // Register service worker if not already registered
        const registration = await navigator.serviceWorker.register('/service-worker.js')
        
        // Wait for it to be active and controlling
        await new Promise<void>((resolve) => {
          if (navigator.serviceWorker.controller) {
            resolve()
          } else {
            navigator.serviceWorker.addEventListener('controllerchange', () => {
              if (navigator.serviceWorker.controller) {
                resolve()
              }
            })
            // If no controller after registration, reload the page
            if (!navigator.serviceWorker.controller) {
              console.log('No service worker controller, reloading page...')
              window.location.reload()
              return
            }
          }
        })
        
        console.log('Service worker ready, initializing swarpc client...')
        swarpc = Client(procedures)
        swReady = true
        console.log('swarpc initialized successfully')
      } catch (error) {
        console.error('Service worker registration or swarpc initialization failed:', error)
        // Set ready to true anyway so we can see the error in the UI
        swReady = true
      }
    }
  })
</script>

{#if !swReady}
  <p>Initializing swarpc...</p>
{:else if !swarpc}
  <p>Error: swarpc failed to initialize. Check console for details.</p>
{:else}
  <search>
    <button
      onclick={async () => {
        // Make sure swarpc is initialized
        if (!swarpc) return
        
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
{/if}

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
