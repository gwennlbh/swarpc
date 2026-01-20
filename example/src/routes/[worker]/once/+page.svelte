<script lang="ts">
  import { RequestCancelledError } from "swarpc"

  const { data } = $props()
  const { swarpc } = $derived(data)

  let a = $state(0)
  let b = $state(0)

  let progresses = $state([[0], [0], [0]])
  let loadingStates = $state([false, false, false])
  let results = $state<Array<number | null>>([null, null, null])

  let broadcast = $state(false)

  const proc = $derived(broadcast ? swarpc.multiply.broadcast : swarpc.multiply)

  type Computation = (
    input: Parameters<typeof proc.once>[0],
    onProgress: (
      p: Parameters<NonNullable<Parameters<typeof proc.once>[1]>>[0],
    ) => void,
  ) => ReturnType<typeof proc.once>

  async function compute(index: 0 | 1 | 2, computation: Computation) {
    let cancelled = false
    loadingStates[index] = true
    progresses[index] = [0]
    try {
      const r = await computation({ a, b }, (ps) => {
        if (ps instanceof Map) {
          progresses[index] = [...ps.values()].map((p) => p.progress)
        } else {
          progresses[index] = [ps.progress]
        }
      })

      if ("result" in r) {
        results[index] = r.result
      } else {
        if (r.some((p) => p.status === "rejected")) {
          cancelled = (r as PromiseRejectedResult[]).every(
            (p) => p.reason instanceof RequestCancelledError,
          )
          if (!cancelled) results[index] = -999 // Error sentinel
        } else {
          const answers = (
            r as PromiseFulfilledResult<{ result: number }>[]
          ).map((p) => p.value.result)

          results[index] = answers.reduce((a, b) => a + b, 0) / answers.length
        }
      }
    } catch (e) {
      if (e instanceof RequestCancelledError) {
        // nothing
        cancelled = true
        return
      } else {
        results[index] = -999 // Error sentinel
      }
    } finally {
      if (!cancelled) loadingStates[index] = false
    }
  }
</script>

<div>
  <h2>Once Mode Tests</h2>

  <label> <input type="checkbox" bind:checked={broadcast} /> Broadcast </label>

  <section id="test-once">
    <h3>Test 1: .once() - cancels previous call of same method</h3>
    <input type="number" bind:value={a} />
    *
    <input type="number" bind:value={b} />
    =
    {@render computeButton(0, proc.once)}
  </section>

  <section id="test-onceby-key">
    <h3>Test 2: .onceBy(key) - cancels previous call with same key</h3>
    <input type="number" bind:value={a} />
    *
    <input type="number" bind:value={b} />
    =
    {@render computeButton(1, (...args) => proc.onceBy("custom-key", ...args))}
  </section>

  <section id="test-global-onceby">
    <h3>Test 3: global onceBy - cancels any call with same global key</h3>
    <input type="number" bind:value={a} />
    *
    <input type="number" bind:value={b} />
    =
    {@render computeButton(2, (...args) =>
      swarpc.onceBy("global-key").multiply(...args),
    )}
  </section>
</div>

{#snippet computeButton(index: 0 | 1 | 2, computation: Computation)}
  <button
    onclick={async () => {
      await compute(index, computation)
    }}
  >
    {#if loadingStates[index]}
      loading... {progresses[index]
        .map((p) => (p * 100).toFixed(0) + "%")
        .join(", ")}
    {:else if results[index] !== null}
      {results[index]}
    {:else}
      compute
    {/if}
  </button>
{/snippet}

<style>
  section {
    margin: 20px 0;
    padding: 10px;
    border: 1px solid #ccc;
  }
</style>
