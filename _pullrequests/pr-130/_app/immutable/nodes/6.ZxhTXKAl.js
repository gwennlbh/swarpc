import { f as from_html, a as append } from "../chunks/C0HXDC1_.js";
import { q as create_text, d as block, k as set_hydrate_node, h as hydrating, _ as get_first_child, e as hydrate_next, g as get, $ as derived_safe_equal, i as read_hydration_instruction, H as HYDRATION_START_ELSE, j as skip_nodes, l as set_hydrating, w as hydrate_node, a0 as COMMENT_NODE, a1 as HYDRATION_END, a2 as internal_set, m as current_batch, a3 as EFFECT_OFFSCREEN, v as branch, y as should_defer_append, a4 as source, a5 as mutable_source, a6 as array_from, a7 as is_array, a8 as EACH_ITEM_REACTIVE, a9 as EACH_ITEM_IMMUTABLE, aa as EACH_INDEX_REACTIVE, n as resume_effect, p as pause_effect, ab as INERT, ac as get_next_sibling, ad as clear_text_content, o as destroy_effect, X as proxy, f as first_child, s as sibling, u as user_derived, b as state, a as set, r as reset, c as child, t as template_effect } from "../chunks/BFXKF0xu.js";
import { d as delegate, s as set_text } from "../chunks/CgQ5ueZ0.js";
import { r as remove_input_defaults } from "../chunks/BYbgBxfu.js";
import { b as bind_value } from "../chunks/BwsxoeCI.js";
function index(_, i) {
  return i;
}
function pause_effects(state2, to_destroy, controlled_anchor) {
  var transitions = [];
  var length = to_destroy.length;
  var group;
  var remaining = to_destroy.length;
  for (var i = 0; i < length; i++) {
    let effect = to_destroy[i];
    pause_effect(
      effect,
      () => {
        if (group) {
          group.pending.delete(effect);
          group.done.add(effect);
          if (group.pending.size === 0) {
            var groups = (
              /** @type {Set<EachOutroGroup>} */
              state2.outrogroups
            );
            destroy_effects(array_from(group.done));
            groups.delete(group);
            if (groups.size === 0) {
              state2.outrogroups = null;
            }
          }
        } else {
          remaining -= 1;
        }
      },
      false
    );
  }
  if (remaining === 0) {
    var fast_path = transitions.length === 0 && controlled_anchor !== null;
    if (fast_path) {
      var anchor = (
        /** @type {Element} */
        controlled_anchor
      );
      var parent_node = (
        /** @type {Element} */
        anchor.parentNode
      );
      clear_text_content(parent_node);
      parent_node.append(anchor);
      state2.items.clear();
    }
    destroy_effects(to_destroy, !fast_path);
  } else {
    group = {
      pending: new Set(to_destroy),
      done: /* @__PURE__ */ new Set()
    };
    (state2.outrogroups ??= /* @__PURE__ */ new Set()).add(group);
  }
}
function destroy_effects(to_destroy, remove_dom = true) {
  for (var i = 0; i < to_destroy.length; i++) {
    destroy_effect(to_destroy[i], remove_dom);
  }
}
var offscreen_anchor;
function each(node, flags, get_collection, get_key, render_fn, fallback_fn = null) {
  var anchor = node;
  var items = /* @__PURE__ */ new Map();
  {
    var parent_node = (
      /** @type {Element} */
      node
    );
    anchor = hydrating ? set_hydrate_node(get_first_child(parent_node)) : parent_node.appendChild(create_text());
  }
  if (hydrating) {
    hydrate_next();
  }
  var fallback = null;
  var each_array = derived_safe_equal(() => {
    var collection = get_collection();
    return is_array(collection) ? collection : collection == null ? [] : array_from(collection);
  });
  var array;
  var first_run = true;
  function commit() {
    state2.fallback = fallback;
    reconcile(state2, array, anchor, flags, get_key);
    if (fallback !== null) {
      if (array.length === 0) {
        if ((fallback.f & EFFECT_OFFSCREEN) === 0) {
          resume_effect(fallback);
        } else {
          fallback.f ^= EFFECT_OFFSCREEN;
          move(fallback, null, anchor);
        }
      } else {
        pause_effect(fallback, () => {
          fallback = null;
        });
      }
    }
  }
  var effect = block(() => {
    array = /** @type {V[]} */
    get(each_array);
    var length = array.length;
    let mismatch = false;
    if (hydrating) {
      var is_else = read_hydration_instruction(anchor) === HYDRATION_START_ELSE;
      if (is_else !== (length === 0)) {
        anchor = skip_nodes();
        set_hydrate_node(anchor);
        set_hydrating(false);
        mismatch = true;
      }
    }
    var keys = /* @__PURE__ */ new Set();
    var batch = (
      /** @type {Batch} */
      current_batch
    );
    var defer = should_defer_append();
    for (var index2 = 0; index2 < length; index2 += 1) {
      if (hydrating && hydrate_node.nodeType === COMMENT_NODE && /** @type {Comment} */
      hydrate_node.data === HYDRATION_END) {
        anchor = /** @type {Comment} */
        hydrate_node;
        mismatch = true;
        set_hydrating(false);
      }
      var value = array[index2];
      var key = get_key(value, index2);
      var item = first_run ? null : items.get(key);
      if (item) {
        if (item.v) internal_set(item.v, value);
        if (item.i) internal_set(item.i, index2);
        if (defer) {
          batch.skipped_effects.delete(item.e);
        }
      } else {
        item = create_item(
          items,
          first_run ? anchor : offscreen_anchor ??= create_text(),
          value,
          key,
          index2,
          render_fn,
          flags,
          get_collection
        );
        if (!first_run) {
          item.e.f |= EFFECT_OFFSCREEN;
        }
        items.set(key, item);
      }
      keys.add(key);
    }
    if (length === 0 && fallback_fn && !fallback) {
      if (first_run) {
        fallback = branch(() => fallback_fn(anchor));
      } else {
        fallback = branch(() => fallback_fn(offscreen_anchor ??= create_text()));
        fallback.f |= EFFECT_OFFSCREEN;
      }
    }
    if (hydrating && length > 0) {
      set_hydrate_node(skip_nodes());
    }
    if (!first_run) {
      if (defer) {
        for (const [key2, item2] of items) {
          if (!keys.has(key2)) {
            batch.skipped_effects.add(item2.e);
          }
        }
        batch.oncommit(commit);
        batch.ondiscard(() => {
        });
      } else {
        commit();
      }
    }
    if (mismatch) {
      set_hydrating(true);
    }
    get(each_array);
  });
  var state2 = { effect, items, outrogroups: null, fallback };
  first_run = false;
  if (hydrating) {
    anchor = hydrate_node;
  }
}
function reconcile(state2, array, anchor, flags, get_key) {
  var length = array.length;
  var items = state2.items;
  var current = state2.effect.first;
  var seen;
  var prev = null;
  var matched = [];
  var stashed = [];
  var value;
  var key;
  var effect;
  var i;
  for (i = 0; i < length; i += 1) {
    value = array[i];
    key = get_key(value, i);
    effect = /** @type {EachItem} */
    items.get(key).e;
    if (state2.outrogroups !== null) {
      for (const group of state2.outrogroups) {
        group.pending.delete(effect);
        group.done.delete(effect);
      }
    }
    if ((effect.f & EFFECT_OFFSCREEN) !== 0) {
      effect.f ^= EFFECT_OFFSCREEN;
      if (effect === current) {
        move(effect, null, anchor);
      } else {
        var next = prev ? prev.next : current;
        if (effect === state2.effect.last) {
          state2.effect.last = effect.prev;
        }
        if (effect.prev) effect.prev.next = effect.next;
        if (effect.next) effect.next.prev = effect.prev;
        link(state2, prev, effect);
        link(state2, effect, next);
        move(effect, next, anchor);
        prev = effect;
        matched = [];
        stashed = [];
        current = prev.next;
        continue;
      }
    }
    if ((effect.f & INERT) !== 0) {
      resume_effect(effect);
    }
    if (effect !== current) {
      if (seen !== void 0 && seen.has(effect)) {
        if (matched.length < stashed.length) {
          var start = stashed[0];
          var j;
          prev = start.prev;
          var a = matched[0];
          var b = matched[matched.length - 1];
          for (j = 0; j < matched.length; j += 1) {
            move(matched[j], start, anchor);
          }
          for (j = 0; j < stashed.length; j += 1) {
            seen.delete(stashed[j]);
          }
          link(state2, a.prev, b.next);
          link(state2, prev, a);
          link(state2, b, start);
          current = start;
          prev = b;
          i -= 1;
          matched = [];
          stashed = [];
        } else {
          seen.delete(effect);
          move(effect, current, anchor);
          link(state2, effect.prev, effect.next);
          link(state2, effect, prev === null ? state2.effect.first : prev.next);
          link(state2, prev, effect);
          prev = effect;
        }
        continue;
      }
      matched = [];
      stashed = [];
      while (current !== null && current !== effect) {
        (seen ??= /* @__PURE__ */ new Set()).add(current);
        stashed.push(current);
        current = current.next;
      }
      if (current === null) {
        continue;
      }
    }
    if ((effect.f & EFFECT_OFFSCREEN) === 0) {
      matched.push(effect);
    }
    prev = effect;
    current = effect.next;
  }
  if (state2.outrogroups !== null) {
    for (const group of state2.outrogroups) {
      if (group.pending.size === 0) {
        destroy_effects(array_from(group.done));
        state2.outrogroups?.delete(group);
      }
    }
    if (state2.outrogroups.size === 0) {
      state2.outrogroups = null;
    }
  }
  if (current !== null || seen !== void 0) {
    var to_destroy = [];
    if (seen !== void 0) {
      for (effect of seen) {
        if ((effect.f & INERT) === 0) {
          to_destroy.push(effect);
        }
      }
    }
    while (current !== null) {
      if ((current.f & INERT) === 0 && current !== state2.fallback) {
        to_destroy.push(current);
      }
      current = current.next;
    }
    var destroy_length = to_destroy.length;
    if (destroy_length > 0) {
      var controlled_anchor = length === 0 ? anchor : null;
      pause_effects(state2, to_destroy, controlled_anchor);
    }
  }
}
function create_item(items, anchor, value, key, index2, render_fn, flags, get_collection) {
  var v = (flags & EACH_ITEM_REACTIVE) !== 0 ? (flags & EACH_ITEM_IMMUTABLE) === 0 ? mutable_source(value, false, false) : source(value) : null;
  var i = (flags & EACH_INDEX_REACTIVE) !== 0 ? source(index2) : null;
  return {
    v,
    i,
    e: branch(() => {
      render_fn(anchor, v ?? value, i ?? index2, get_collection);
      return () => {
        items.delete(key);
      };
    })
  };
}
function move(effect, next, anchor) {
  if (!effect.nodes) return;
  var node = effect.nodes.start;
  var end = effect.nodes.end;
  var dest = next && (next.f & EFFECT_OFFSCREEN) === 0 ? (
    /** @type {EffectNodes} */
    next.nodes.start
  ) : anchor;
  while (node !== null) {
    var next_node = (
      /** @type {TemplateNode} */
      get_next_sibling(node)
    );
    dest.before(node);
    if (node === end) {
      return;
    }
    node = next_node;
  }
}
function link(state2, prev, next) {
  if (prev === null) {
    state2.effect.first = next;
  } else {
    prev.next = next;
  }
  if (next === null) {
    state2.effect.last = prev;
  } else {
    next.prev = prev;
  }
}
var root_1 = from_html(`<p><code class="svelte-qrjmsr"> <br/> </code></p>`);
var root = from_html(`<input type="number" min="0" max="10"/> <button>Compute</button> <div id="result"></div>`, 1);
function _page($$anchor, $$props) {
  const swarpc = user_derived(() => $$props.data.swarpc);
  let results = proxy(Array.from({ length: 11 }, () => ({ result: 0, node: "?", progress: "waiting" })));
  let tableOf = state(0);
  async function compute() {
    await Promise.all(results.map(async (_, i) => {
      const { result, node } = await get(swarpc).multiply({ a: i, b: get(tableOf) }, ({ progress: p, node: node2 }) => {
        results[i].progress = Math.round(p * 100) + "%";
        results[i].node = node2;
      });
      results[i].result = result;
      results[i].node = node;
    }));
  }
  var fragment = root();
  var input = first_child(fragment);
  remove_input_defaults(input);
  var button = sibling(input, 2);
  button.__click = compute;
  var div = sibling(button, 2);
  each(div, 21, () => results, index, ($$anchor2, $$item, i) => {
    let result = () => get($$item).result;
    let node = () => get($$item).node;
    let progress = () => get($$item).progress;
    var p_1 = root_1();
    var code = child(p_1);
    var text = child(code);
    var text_1 = sibling(text, 2);
    reset(code);
    reset(p_1);
    template_effect(() => {
      set_text(text, `${get(tableOf) ?? ""} · ${i} = ${result() ?? ""} `);
      set_text(text_1, ` ${progress() ?? ""} from ${node() ?? ""}`);
    });
    append($$anchor2, p_1);
  });
  reset(div);
  bind_value(input, () => get(tableOf), ($$value) => set(tableOf, $$value));
  append($$anchor, fragment);
}
delegate(["click"]);
export {
  _page as component
};
