<script lang="ts">
  import { onMount } from "svelte"
  import { sharedProcedures } from "$lib/shared-procedures"
  import { Client, type CancelablePromise } from "swarpc"
  import { browser } from "$app/environment"

  // 1. Give yourself a client instance (only in browser)
  let swarpc = $state<ReturnType<typeof Client<typeof sharedProcedures>>>()
  let swReady = $state(false)

  // 2. Declare some state to hold info
  let factorialResult = $state<string>("")
  let sumSquaresResult = $state<number | null>(null)
  let fibonacciResult = $state<string[]>([])
  let progress = $state(0)
  let loading = $state(false)
  let currentOperation = $state<string>("")
  let cancel: undefined | CancelablePromise["cancel"] = $state()

  // Input values
  let factorialNumber = $state(10)
  let factorialDelay = $state(100)
  let sumSquaresCount = $state(20)
  let sumSquaresDelay = $state(50)
  let fibonacciTerms = $state(15)
  let fibonacciDelay = $state(75)

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
        swarpc = Client(sharedProcedures)
        swReady = true
        console.log('swarpc initialized successfully')
      } catch (error) {
        console.error('Service worker registration or swarpc initialization failed:', error)
        // Set ready to true anyway so we can see the error in the UI
        swReady = true
      }
    }
  })

  const callFactorial = async () => {
    if (!swarpc) return
    
    currentOperation = "factorial"
    loading = true
    progress = 0
    const cancelable = swarpc.calculateFactorial.cancelable(
      { number: factorialNumber, delay: factorialDelay },
      (p) => {
        progress = p.percentage
      }
    )

    cancel = cancelable.cancel
    try {
      const result = await cancelable.request
      factorialResult = result.result
      loading = false
      currentOperation = ""
    } catch (error) {
      console.error('Factorial calculation failed:', error)
      loading = false
      currentOperation = ""
    }
  }

  const callSumSquares = async () => {
    if (!swarpc) return
    
    currentOperation = "sumSquares"
    loading = true
    progress = 0
    const cancelable = swarpc.calculateSumOfSquares.cancelable(
      { count: sumSquaresCount, delay: sumSquaresDelay },
      (p) => {
        progress = p.percentage
      }
    )

    cancel = cancelable.cancel
    try {
      const result = await cancelable.request
      sumSquaresResult = result.result
      loading = false
      currentOperation = ""
    } catch (error) {
      console.error('Sum of squares calculation failed:', error)
      loading = false
      currentOperation = ""
    }
  }

  const callFibonacci = async () => {
    if (!swarpc) return
    
    currentOperation = "fibonacci"
    loading = true
    progress = 0
    const cancelable = swarpc.calculateFibonacci.cancelable(
      { terms: fibonacciTerms, delay: fibonacciDelay },
      (p) => {
        progress = p.percentage
      }
    )

    cancel = cancelable.cancel
    try {
      const result = await cancelable.request
      fibonacciResult = result.sequence
      loading = false
      currentOperation = ""
    } catch (error) {
      console.error('Fibonacci calculation failed:', error)
      loading = false
      currentOperation = ""
    }
  }
</script>

<svelte:head>
  <title>swarpc Example App</title>
</svelte:head>

<h1>swarpc Service Worker Math Operations</h1>

{#if !swReady}
  <p>Initializing swarpc...</p>
{:else if !swarpc}
  <p>Error: swarpc failed to initialize. Check console for details.</p>
{:else}
  <div class="operations">
    <section class="operation">
      <h2>Factorial Calculation</h2>
      <div class="inputs">
        <label>Number: <input type="number" bind:value={factorialNumber} min="0" max="20" /></label>
        <label>Delay (ms): <input type="number" bind:value={factorialDelay} min="0" max="1000" /></label>
      </div>
      <button onclick={callFactorial} disabled={loading}>
        Calculate {factorialNumber}!
      </button>
      {#if factorialResult}
        <p class="result">Result: {factorialResult}</p>
      {/if}
    </section>

    <section class="operation">
      <h2>Sum of Squares</h2>
      <div class="inputs">
        <label>Count: <input type="number" bind:value={sumSquaresCount} min="1" max="1000" /></label>
        <label>Delay (ms): <input type="number" bind:value={sumSquaresDelay} min="0" max="1000" /></label>
      </div>
      <button onclick={callSumSquares} disabled={loading}>
        Calculate 1² + 2² + ... + {sumSquaresCount}²
      </button>
      {#if sumSquaresResult !== null}
        <p class="result">Result: {sumSquaresResult}</p>
      {/if}
    </section>

    <section class="operation">
      <h2>Fibonacci Sequence</h2>
      <div class="inputs">
        <label>Terms: <input type="number" bind:value={fibonacciTerms} min="1" max="100" /></label>
        <label>Delay (ms): <input type="number" bind:value={fibonacciDelay} min="0" max="1000" /></label>
      </div>
      <button onclick={callFibonacci} disabled={loading}>
        Generate {fibonacciTerms} Fibonacci Terms
      </button>
      {#if fibonacciResult.length > 0}
        <div class="result">
          <p>Sequence: {fibonacciResult.join(', ')}</p>
        </div>
      {/if}
    </section>
  </div>
{/if}

<!-- Cancel button and progress indicators -->
{#if cancel}
  <button
    class="cancel-btn"
    onclick={async () => {
      cancel?.("User cancelled")
      loading = false
      currentOperation = ""
    }}
  >
    Cancel {currentOperation}
  </button>
{/if}

{#if progress > 0 && progress < 100 && loading}
  <div class="progress">
    <progress value={progress} max="100">Loading…</progress>
    <p>{progress.toFixed(1)}% complete</p>
  </div>
{:else if loading}
  <p>Loading...</p>
{/if}

<style>
  .operations {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
    margin: 2rem 0;
  }

  .operation {
    border: 1px solid #ccc;
    padding: 1rem;
    border-radius: 8px;
  }

  .inputs {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
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
    background: #f0f8ff;
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
    padding: 0.5rem 1rem;
    border-radius: 4px;
    margin: 1rem 0;
  }

  .progress {
    margin: 1rem 0;
  }

  progress {
    width: 100%;
    height: 20px;
  }

  button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
</style>
