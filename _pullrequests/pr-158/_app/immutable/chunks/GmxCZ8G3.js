import { S as user_effect, Q as component_context, Y as legacy_mode_flag, C as untrack } from "./D9tyZ3BP.js";
function lifecycle_outside_component(name) {
  {
    throw new Error(`https://svelte.dev/e/lifecycle_outside_component`);
  }
}
function onMount(fn) {
  if (component_context === null) {
    lifecycle_outside_component();
  }
  if (legacy_mode_flag && component_context.l !== null) {
    init_update_callbacks(component_context).m.push(fn);
  } else {
    user_effect(() => {
      const cleanup = untrack(fn);
      if (typeof cleanup === "function") return (
        /** @type {() => void} */
        cleanup
      );
    });
  }
}
function init_update_callbacks(context) {
  var l = (
    /** @type {ComponentContextLegacy} */
    context.l
  );
  return l.u ??= { a: [], b: [], m: [] };
}
export {
  onMount as o
};
