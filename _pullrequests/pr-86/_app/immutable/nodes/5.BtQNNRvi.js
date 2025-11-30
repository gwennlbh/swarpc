import { f as from_html, a as append } from "../chunks/CGQvhKpT.js";
import { z as create_text, j as block, p as set_hydrate_node, k as hydrating, Y as get_first_child, m as hydrate_next, g as get, Z as derived_safe_equal, n as read_hydration_instruction, H as HYDRATION_START_ELSE, o as skip_nodes, q as set_hydrating, B as hydrate_node, _ as COMMENT_NODE, $ as HYDRATION_END, a0 as internal_set, v as current_batch, A as branch, D as should_defer_append, a1 as mutable_source, a2 as source, a3 as array_from, a4 as is_array, a5 as EACH_INDEX_REACTIVE, w as resume_effect, y as pause_effect, a6 as EACH_ITEM_REACTIVE, a7 as EACH_ITEM_IMMUTABLE, a8 as INERT, a9 as get_next_sibling, aa as pause_children, ab as run_out_transitions, ac as clear_text_content, x as destroy_effect, ad as proxy, f as first_child, s as sibling, i as user_derived, e as state, d as set, h as child, r as reset, t as template_effect } from "../chunks/DgNWappd.js";
import { d as delegate, s as set_text } from "../chunks/Bfr5JZrY.js";
import { r as remove_input_defaults } from "../chunks/D_IraKEt.js";
import { b as bind_value } from "../chunks/0MTF6xQg.js";
function index(_, i) {
  return i;
}
function pause_effects(state2, to_destroy, controlled_anchor) {
  var transitions = [];
  var length = to_destroy.length;
  for (var i = 0; i < length; i++) {
    pause_children(to_destroy[i].e, transitions, true);
  }
  run_out_transitions(transitions, () => {
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
      link(state2, to_destroy[0].prev, to_destroy[length - 1].next);
    }
    for (var i2 = 0; i2 < length; i2++) {
      var item = to_destroy[i2];
      if (!fast_path) {
        state2.items.delete(item.k);
        link(state2, item.prev, item.next);
      }
      destroy_effect(item.e, !fast_path);
    }
    if (state2.first === to_destroy[0]) {
      state2.first = to_destroy[0].prev;
    }
  });
}
function each(node, flags, get_collection, get_key, render_fn, fallback_fn = null) {
  var anchor = node;
  var items = /* @__PURE__ */ new Map();
  var first = null;
  {
    var parent_node = (
      /** @type {Element} */
      node
    );
    anchor = hydrating ? set_hydrate_node(
      /** @type {Comment | Text} */
      get_first_child(parent_node)
    ) : parent_node.appendChild(create_text());
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
    reconcile(state2, array, anchor, flags, get_key);
    if (fallback !== null) {
      if (array.length === 0) {
        if (fallback.fragment) {
          anchor.before(fallback.fragment);
          fallback.fragment = null;
        } else {
          resume_effect(fallback.effect);
        }
        effect.first = fallback.effect;
      } else {
        pause_effect(fallback.effect, () => {
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
    var prev = null;
    var defer = should_defer_append();
    for (var i = 0; i < length; i += 1) {
      if (hydrating && hydrate_node.nodeType === COMMENT_NODE && /** @type {Comment} */
      hydrate_node.data === HYDRATION_END) {
        anchor = /** @type {Comment} */
        hydrate_node;
        mismatch = true;
        set_hydrating(false);
      }
      var value = array[i];
      var key = get_key(value, i);
      var item = first_run ? null : items.get(key);
      if (item) {
        {
          internal_set(item.v, value);
        }
        {
          item.i = i;
        }
        if (defer) {
          batch.skipped_effects.delete(item.e);
        }
      } else {
        item = create_item(
          first_run ? anchor : null,
          prev,
          value,
          key,
          i,
          render_fn,
          flags,
          get_collection
        );
        if (first_run) {
          item.o = true;
          if (prev === null) {
            first = item;
          } else {
            prev.next = item;
          }
          prev = item;
        }
        items.set(key, item);
      }
      keys.add(key);
    }
    if (length === 0 && fallback_fn && !fallback) {
      if (first_run) {
        fallback = {
          fragment: null,
          effect: branch(() => fallback_fn(anchor))
        };
      } else {
        var fragment = document.createDocumentFragment();
        var target = create_text();
        fragment.append(target);
        fallback = {
          fragment,
          effect: branch(() => fallback_fn(target))
        };
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
  var state2 = { effect, items, first };
  first_run = false;
  if (hydrating) {
    anchor = hydrate_node;
  }
}
function reconcile(state2, array, anchor, flags, get_key) {
  var length = array.length;
  var items = state2.items;
  var current = state2.first;
  var seen;
  var prev = null;
  var matched = [];
  var stashed = [];
  var value;
  var key;
  var item;
  var i;
  for (i = 0; i < length; i += 1) {
    value = array[i];
    key = get_key(value, i);
    item = /** @type {EachItem} */
    items.get(key);
    state2.first ??= item;
    if (!item.o) {
      item.o = true;
      var next = prev ? prev.next : current;
      link(state2, prev, item);
      link(state2, item, next);
      move(item, next, anchor);
      prev = item;
      matched = [];
      stashed = [];
      current = prev.next;
      continue;
    }
    if ((item.e.f & INERT) !== 0) {
      resume_effect(item.e);
    }
    if (item !== current) {
      if (seen !== void 0 && seen.has(item)) {
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
          seen.delete(item);
          move(item, current, anchor);
          link(state2, item.prev, item.next);
          link(state2, item, prev === null ? state2.first : prev.next);
          link(state2, prev, item);
          prev = item;
        }
        continue;
      }
      matched = [];
      stashed = [];
      while (current !== null && current.k !== key) {
        if ((current.e.f & INERT) === 0) {
          (seen ??= /* @__PURE__ */ new Set()).add(current);
        }
        stashed.push(current);
        current = current.next;
      }
      if (current === null) {
        continue;
      }
      item = current;
    }
    matched.push(item);
    prev = item;
    current = item.next;
  }
  let has_offscreen_items = items.size > length;
  if (current !== null || seen !== void 0) {
    var to_destroy = seen === void 0 ? [] : array_from(seen);
    while (current !== null) {
      if ((current.e.f & INERT) === 0) {
        to_destroy.push(current);
      }
      current = current.next;
    }
    var destroy_length = to_destroy.length;
    has_offscreen_items = items.size - destroy_length > length;
    if (destroy_length > 0) {
      var controlled_anchor = length === 0 ? anchor : null;
      pause_effects(state2, to_destroy, controlled_anchor);
    }
  }
  if (has_offscreen_items) {
    for (const item2 of items.values()) {
      if (!item2.o) {
        link(state2, prev, item2);
        prev = item2;
      }
    }
  }
  state2.effect.last = prev && prev.e;
}
function create_item(anchor, prev, value, key, index2, render_fn, flags, get_collection) {
  var reactive = (flags & EACH_ITEM_REACTIVE) !== 0;
  var mutable = (flags & EACH_ITEM_IMMUTABLE) === 0;
  var v = reactive ? mutable ? mutable_source(value, false, false) : source(value) : value;
  var i = (flags & EACH_INDEX_REACTIVE) === 0 ? index2 : source(index2);
  var item = {
    i,
    v,
    k: key,
    a: null,
    // @ts-expect-error
    e: null,
    o: false,
    prev,
    next: null
  };
  try {
    if (anchor === null) {
      var fragment = document.createDocumentFragment();
      fragment.append(anchor = create_text());
    }
    item.e = branch(() => render_fn(
      /** @type {Node} */
      anchor,
      v,
      i,
      get_collection
    ));
    if (prev !== null) {
      prev.next = item;
    }
    return item;
  } finally {
  }
}
function move(item, next, anchor) {
  var end = item.next ? (
    /** @type {TemplateNode} */
    item.next.e.nodes_start
  ) : anchor;
  var dest = next ? (
    /** @type {TemplateNode} */
    next.e.nodes_start
  ) : anchor;
  var node = (
    /** @type {TemplateNode} */
    item.e.nodes_start
  );
  while (node !== null && node !== end) {
    var next_node = (
      /** @type {TemplateNode} */
      get_next_sibling(node)
    );
    dest.before(node);
    node = next_node;
  }
}
function link(state2, prev, next) {
  if (prev === null) {
    state2.first = next;
    state2.effect.first = next && next.e;
  } else {
    if (prev.e.next) {
      prev.e.next.prev = null;
    }
    prev.next = next;
    prev.e.next = next && next.e;
  }
  if (next !== null) {
    if (next.e.prev) {
      next.e.prev.next = null;
    }
    next.prev = prev;
    next.e.prev = prev && prev.e;
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
