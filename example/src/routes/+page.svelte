<script lang="ts">
    import {resolve} from '$app/paths'
</script>
<nav>
  <p>Single-node tests</p>
  <ul>
    <li><a href={resolve('/[worker]/', {worker: "service"})}>Using a service worker</a></li>
    <li><a href={resolve('/[worker]/', {worker: "dedicated"})}>Using a dedicated worker</a></li>
    <li><a href={resolve('/[worker]/', {worker: "shared"})}>Using a shared worker</a></li>
  </ul>
  <p>Multi-node tests</p>
  <ul>
    <li><a href="{resolve('/[worker]/parallel/', {worker: "service"})}?nodes=10">Using a service worker</a></li>
    <li><a href="{resolve('/[worker]/parallel/', {worker: "dedicated"})}?nodes=10">Using a dedicated worker</a></li>
    <li><a href="{resolve('/[worker]/parallel/', {worker: "shared"})}?nodes=10">Using a shared worker</a></li>
  </ul>
</nav>
