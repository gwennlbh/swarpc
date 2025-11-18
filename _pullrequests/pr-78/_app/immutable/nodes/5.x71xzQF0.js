import { f as from_html, a as append } from "../chunks/D8EFpo4R.js";
import { q as create_text, d as block, k as set_hydrate_node, h as hydrating, X as get_first_child, e as hydrate_next, g as get, Y as derived_safe_equal, i as read_hydration_instruction, H as HYDRATION_START_ELSE, j as skip_nodes, l as set_hydrating, w as hydrate_node, Z as COMMENT_NODE, _ as HYDRATION_END, $ as internal_set, m as current_batch, v as branch, y as should_defer_append, a0 as mutable_source, a1 as source, a2 as array_from, a3 as is_array, a4 as EACH_INDEX_REACTIVE, n as resume_effect, p as pause_effect, a5 as EACH_ITEM_REACTIVE, a6 as EACH_ITEM_IMMUTABLE, a7 as INERT, a8 as get_next_sibling, a9 as pause_children, aa as run_out_transitions, ab as clear_text_content, o as destroy_effect, ac as proxy, f as first_child, s as sibling, u as user_derived, b as state, a as set, c as child, r as reset, t as template_effect } from "../chunks/CeNyfUoB.js";
import { d as delegate, s as set_text } from "../chunks/wvWGqTDQ.js";
import { r as remove_input_defaults } from "../chunks/Dmz2I9dT.js";
import { b as bind_value } from "../chunks/BIBDKWwV.js";
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
  var state2 = { items: /* @__PURE__ */ new Map(), first: null };
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
    reconcile(each_effect, array, state2, anchor, flags, get_key);
    if (fallback !== null) {
      if (array.length === 0) {
        if (fallback.fragment) {
          anchor.before(fallback.fragment);
          fallback.fragment = null;
        } else {
          resume_effect(fallback.effect);
        }
        each_effect.first = fallback.effect;
      } else {
        pause_effect(fallback.effect, () => {
          fallback = null;
        });
      }
    }
  }
  var each_effect = block(() => {
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
      var item = first_run ? null : state2.items.get(key);
      if (item) {
        {
          internal_set(item.v, value);
        }
        {
          item.i = i;
        }
        batch.skipped_effects.delete(item.e);
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
            state2.first = item;
          } else {
            prev.next = item;
          }
          prev = item;
        }
        state2.items.set(key, item);
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
    for (const [key2, item2] of state2.items) {
      if (!keys.has(key2)) {
        batch.skipped_effects.add(item2.e);
      }
    }
    if (!first_run) {
      if (defer) {
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
  first_run = false;
  if (hydrating) {
    anchor = hydrate_node;
  }
}
function reconcile(each_effect, array, state2, anchor, flags, get_key) {
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
  if (current !== null || seen !== void 0) {
    var to_destroy = seen === void 0 ? [] : array_from(seen);
    while (current !== null) {
      if ((current.e.f & INERT) === 0) {
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
  each_effect.first = state2.first && state2.first.e;
  each_effect.last = prev && prev.e;
  if (prev) {
    prev.e.next = null;
  }
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
    item.e.prev = prev && prev.e;
    if (prev !== null) {
      prev.next = item;
      prev.e.next = item.e;
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
  } else {
    prev.next = next;
    prev.e.next = next && next.e;
  }
  if (next !== null) {
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
