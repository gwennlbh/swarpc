<script lang="ts">
  import { onMount } from "svelte"
  import { Client, type CancelablePromise } from "swarpc"
  import { type } from "arktype"
  import { browser } from "$app/environment"
  import DedicatedWorkerScript from "$lib/dedicated-worker.ts?worker"
  import { sharedProcedures } from "$lib/shared-procedures"

  let swarpcClient = $state<ReturnType<typeof Client<typeof sharedProcedures>> | null>(null)
  let ready = $state(false)

  // State for multiple operations
  let operation1State = $state({ loading: false, progress: 0, result: "", cancel: null as CancelablePromise["cancel"] | null })
  let operation2State = $state({ loading: false, progress: 0, result: "", cancel: null as CancelablePromise["cancel"] | null })
  let operation3State = $state({ loading: false, progress: 0, result: [], cancel: null as CancelablePromise["cancel"] | null })

  // Input values
  let factorial1 = $state(8)
  let factorial2 = $state(12)
  let fibonacciTerms = $state(20)

  // Initialize client with dedicated worker
  onMount(async () => {
    if (browser) {
      try {
        // Create the swarpc client with dedicated worker configuration
        swarpcClient = Client(sharedProcedures, {
          worker: DedicatedWorkerScript,
          nodes: 4,
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

  const runFactorial1 = async () => {
    if (!swarpcClient) return
    
    const cancelable = swarpcClient.calculateFactorial.cancelable(
      { number: factorial1, delay: 150 },
      (p) => {
        operation1State.loading = true
        operation1State.progress = p.percentage
      }
    )

    operation1State.cancel = cancelable.cancel
    try {
      const result = await cancelable.request
      operation1State.result = `${factorial1}! = ${result.result}`
      operation1State.loading = false
    } catch (error) {
      console.error('Factorial 1 failed:', error)
      operation1State.loading = false
      operation1State.result = `Error: ${error.message}`
    }
  }

  const runFactorial2 = async () => {
    if (!swarpcClient) return
    
    const cancelable = swarpcClient.calculateFactorial.cancelable(
      { number: factorial2, delay: 100 },
      (p) => {
        operation2State.loading = true
        operation2State.progress = p.percentage
      }
    )

    operation2State.cancel = cancelable.cancel
    try {
      const result = await cancelable.request
      operation2State.result = `${factorial2}! = ${result.result}`
      operation2State.loading = false
    } catch (error) {
      console.error('Factorial 2 failed:', error)
      operation2State.loading = false
      operation2State.result = `Error: ${error.message}`
    }
  }

  const runFibonacci = async () => {
    if (!swarpcClient) return
    
    const cancelable = swarpcClient.calculateFibonacci.cancelable(
      { terms: fibonacciTerms, delay: 80 },
      (p) => {
        operation3State.loading = true
        operation3State.progress = p.percentage
      }
    )

    operation3State.cancel = cancelable.cancel
    try {
      const result = await cancelable.request
      operation3State.result = result.sequence
      operation3State.loading = false
    } catch (error) {
      console.error('Fibonacci failed:', error)
      operation3State.loading = false
      operation3State.result = [`Error: ${error.message}`]
    }
  }

  const runAllParallel = async () => {
    if (!swarpcClient) return
    
    // Run all operations in parallel to test parallelization
    await Promise.all([
      runFactorial1(),
      runFactorial2(),
      runFibonacci()
    ])
  }

  const cancelOperation = (opNumber: number) => {
    switch (opNumber) {
      case 1:
        operation1State.cancel?.("User cancelled")
        operation1State.loading = false
        operation1State.result = "Cancelled"
        break
      case 2:
        operation2State.cancel?.("User cancelled")
        operation2State.loading = false
        operation2State.result = "Cancelled"
        break
      case 3:
        operation3State.cancel?.("User cancelled")
        operation3State.loading = false
        operation3State.result = ["Cancelled"]
        break
    }
  }
</script>

<svelte:head>
  <title>swarpc Dedicated Worker Test Page</title>
</svelte:head>

<h1>Dedicated Worker Test Page</h1>
<p>This page tests dedicated worker functionality with parallelization and cancellation.</p>

{#if !ready}
  <p id="status">Loading...</p>
{:else}
  <p id="status">Loaded</p>
  <p>Dedicated worker client is ready!</p>
  
  {#if swarpcClient}
    <div class="operations">
      <section class="operation">
        <h2>Operation 1: Factorial</h2>
        <div class="inputs">
          <label>Number: <input type="number" bind:value={factorial1} min="1" max="20" data-testid="factorial1-input" /></label>
        </div>
        <button onclick={runFactorial1} disabled={operation1State.loading}>
          Calculate {factorial1}!
        </button>
        {#if operation1State.cancel}
          <button class="cancel-btn" onclick={() => cancelOperation(1)}>Cancel</button>
        {/if}
        {#if operation1State.loading}
          <div class="progress">
            <progress value={operation1State.progress} max="100"></progress>
            <span id="operation1-progress">{operation1State.progress.toFixed(1)}%</span>
          </div>
        {/if}
        {#if operation1State.result}
          <p class="result" id="operation1-result">{operation1State.result}</p>
        {/if}
      </section>

      <section class="operation">
        <h2>Operation 2: Another Factorial</h2>
        <div class="inputs">
          <label>Number: <input type="number" bind:value={factorial2} min="1" max="20" /></label>
        </div>
        <button onclick={runFactorial2} disabled={operation2State.loading}>
          Calculate {factorial2}!
        </button>
        {#if operation2State.cancel}
          <button class="cancel-btn" onclick={() => cancelOperation(2)}>Cancel</button>
        {/if}
        {#if operation2State.loading}
          <div class="progress">
            <progress value={operation2State.progress} max="100"></progress>
            <span>{operation2State.progress.toFixed(1)}%</span>
          </div>
        {/if}
        {#if operation2State.result}
          <p class="result" id="operation2-result">{operation2State.result}</p>
        {/if}
      </section>

      <section class="operation">
        <h2>Operation 3: Fibonacci</h2>
        <div class="inputs">
          <label>Terms: <input type="number" bind:value={fibonacciTerms} min="1" max="50" data-testid="fibonacci-input" /></label>
        </div>
        <button onclick={runFibonacci} disabled={operation3State.loading}>
          Generate {fibonacciTerms} Fibonacci Terms
        </button>
        {#if operation3State.cancel}
          <button class="cancel-btn" onclick={() => cancelOperation(3)}>Cancel</button>
        {/if}
        {#if operation3State.loading}
          <div class="progress">
            <progress value={operation3State.progress} max="100"></progress>
            <span>{operation3State.progress.toFixed(1)}%</span>
          </div>
        {/if}
        {#if operation3State.result.length > 0}
          <div class="result" id="operation3-result">
            <p>Fibonacci sequence: {operation3State.result.join(', ')}</p>
          </div>
        {/if}
      </section>
    </div>

    <div class="parallel-controls">
      <h2>Parallelization Test</h2>
      <button onclick={runAllParallel} id="run-parallel-btn">
        Run All Operations in Parallel
      </button>
      <p><small>This will run all three operations simultaneously to test dedicated worker parallelization.</small></p>
    </div>
  {/if}
{/if}

<style>
  .operations {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
    margin: 2rem 0;
  }

  .operation {
    border: 1px solid #ddd;
    padding: 1rem;
    border-radius: 8px;
    background: #f9f9f9;
  }

  .inputs {
    margin: 1rem 0;
  }

  .inputs label {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .inputs input {
    width: 80px;
  }

  .result {
    background: #e8f5e8;
    padding: 0.5rem;
    border-radius: 4px;
    margin-top: 1rem;
    font-family: monospace;
    word-break: break-all;
  }

  .cancel-btn {
    background: #ff4444;
    color: white;
    border: none;
    padding: 0.3rem 0.8rem;
    border-radius: 4px;
    margin-left: 0.5rem;
  }

  .progress {
    margin: 0.5rem 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .progress progress {
    flex: 1;
    height: 16px;
  }

  .parallel-controls {
    margin: 2rem 0;
    padding: 1rem;
    border: 2px solid #4CAF50;
    border-radius: 8px;
    background: #f0f8f0;
  }

  button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  button {
    margin: 0.2rem;
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 4px;
    background: #007bff;
    color: white;
    cursor: pointer;
  }

  button:hover:not(:disabled) {
    background: #0056b3;
  }
</style>