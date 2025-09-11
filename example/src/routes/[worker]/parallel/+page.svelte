<script lang="ts">
  const { data } = $props()
  const { swarpc } = $derived(data)

  let results: Array<{ result: number; node: string; progress: string }> =
    $state(
      Array.from({ length: 11 }, () => ({
        result: 0,
        node: "?",
        progress: "waiting",
      }))
    )
  let tableOf = $state(0)

  async function compute() {
    await Promise.all(
      results.map(async (_, i) => {
        const { result, node } = await swarpc.multiply(
          {
            a: i,
            b: tableOf,
          },
          ({ progress: p, node }) => {
            results[i].progress = Math.round(p * 100) + "%"
            results[i].node = node
          }
        )

        results[i].result = result
        results[i].node = node
      })
    )
  }
</script>

<input type="number" bind:value={tableOf} min="0" max="10" />
<button onclick={compute}>Compute</button>

<div id="result">
    {#each results as { result, node, progress }, i (i)}
      <p>
        <code>
          {tableOf} &middot; {i} = {result}
          <br />
          {progress} from {node}
        </code>
      </p>
    {/each}
</div>

<style>
  code {
    font-size: 2em;
  }
</style>
