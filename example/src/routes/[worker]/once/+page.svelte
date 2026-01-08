<script lang="ts">
  const { data } = $props()
  const { swarpc } = $derived(data)

  let a = $state(0)
  let b = $state(0)
  let result1 = $state(0)
  let result2 = $state(0)
  let result3 = $state(0)
  let progress1 = $state(0)
  let progress2 = $state(0)
  let progress3 = $state(0)
  let loading1 = $state(false)
  let loading2 = $state(false)
  let loading3 = $state(false)
</script>

<div>
  <h2>Once Mode Tests</h2>
  
  <section id="test-once">
    <h3>Test 1: .once() - cancels previous call of same method</h3>
    <input type="number" bind:value={a} />
    *
    <input type="number" bind:value={b} />
    =
    <button
      onclick={async () => {
        loading1 = true
        progress1 = 0
        try {
          const r = await swarpc.multiply.once(
            { a, b },
            ({ progress: p }) => {
              progress1 = p
            }
          )
          result1 = r.result
        } catch (e) {
          result1 = -999 // Error sentinel
        } finally {
          loading1 = false
        }
      }}
    >
      {#if loading1}
        loading... {Math.round(progress1 * 100)}%
      {:else if result1}
        {result1}
      {:else}
        compute
      {/if}
    </button>
  </section>

  <section id="test-onceby-key">
    <h3>Test 2: .onceBy(key) - cancels previous call with same key</h3>
    <input type="number" bind:value={a} />
    *
    <input type="number" bind:value={b} />
    =
    <button
      onclick={async () => {
        loading2 = true
        progress2 = 0
        try {
          const r = await swarpc.multiply.onceBy(
            "foo",
            { a, b },
            ({ progress: p }) => {
              progress2 = p
            }
          )
          result2 = r.result
        } catch (e) {
          result2 = -999 // Error sentinel
        } finally {
          loading2 = false
        }
      }}
    >
      {#if loading2}
        loading... {Math.round(progress2 * 100)}%
      {:else if result2}
        {result2}
      {:else}
        compute
      {/if}
    </button>
  </section>

  <section id="test-global-onceby">
    <h3>Test 3: global onceBy - cancels any call with same global key</h3>
    <input type="number" bind:value={a} />
    *
    <input type="number" bind:value={b} />
    =
    <button
      onclick={async () => {
        loading3 = true
        progress3 = 0
        try {
          const r = await swarpc.onceBy("global-key").multiply(
            { a, b },
            ({ progress: p }) => {
              progress3 = p
            }
          )
          result3 = r.result
        } catch (e) {
          result3 = -999 // Error sentinel
        } finally {
          loading3 = false
        }
      }}
    >
      {#if loading3}
        loading... {Math.round(progress3 * 100)}%
      {:else if result3}
        {result3}
      {:else}
        compute
      {/if}
    </button>
  </section>
</div>

<style>
  section {
    margin: 20px 0;
    padding: 10px;
    border: 1px solid #ccc;
  }
</style>
