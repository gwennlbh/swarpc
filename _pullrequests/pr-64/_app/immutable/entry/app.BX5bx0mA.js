const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["../nodes/0.BBgqo_WL.js","../chunks/Cz47pBZ4.js","../chunks/CKOwlSI2.js","../chunks/DxO9wToY.js","../chunks/BymjBzi3.js","../nodes/1.CgM6jQT7.js","../chunks/Du0hMIwk.js","../chunks/CZk5GCzL.js","../chunks/BG7_EK-E.js","../chunks/DPtVLaQi.js","../chunks/BSsBU_Uh.js","../chunks/Bx3O76uu.js","../nodes/2.CKIKocYg.js","../nodes/3.qrtEGWd1.js","../chunks/BJfIL4s5.js","../nodes/4.hf3u82om.js","../chunks/DMqOXJiS.js","../chunks/BPWPmzJ1.js","../nodes/5.DMbCDWVk.js","../assets/5.3kMZvOdl.css"])))=>i.map(i=>d[i]);
import { v as hydrating, w as hydrate_next, r as block, E as EFFECT_TRANSPARENT, V as create_text, A as branch, W as current_batch, Y as should_defer_append, D as hydrate_node, _ as pause_effect, aS as effect, a0 as render_effect, e as untrack, a5 as queue_micro_task, aT as STATE_SYMBOL, aU as get_descriptor, aV as props_invalid_value, aW as PROPS_IS_UPDATED, K as get, ae as derived, ag as derived_safe_equal, aw as proxy, M as set, aX as is_destroying_effect, av as active_effect, aY as DESTROYED, aZ as PROPS_IS_BINDABLE, d as legacy_mode_flag, a_ as PROPS_IS_RUNES, a$ as PROPS_IS_IMMUTABLE, b0 as PROPS_IS_LAZY_INITIAL, b1 as LEGACY_PROPS, h as flushSync, aL as define_property, ak as mutable_source, a8 as push, aa as user_pre_effect, u as user_effect, I as state, t as tick, G as from_html, p as first_child, J as sibling, q as append, a9 as pop, o as comment, L as child, N as reset, H as user_derived, O as text, P as template_effect } from "../chunks/DxO9wToY.js";
import { h as hydrate, m as mount, u as unmount, s as set_text } from "../chunks/CZk5GCzL.js";
import "../chunks/CKOwlSI2.js";
import { o as onMount } from "../chunks/DPtVLaQi.js";
import { i as if_block } from "../chunks/DMqOXJiS.js";
function component(node, get_component, render_fn) {
  if (hydrating) {
    hydrate_next();
  }
  var anchor = node;
  var component2;
  var effect2;
  var offscreen_fragment = null;
  var pending_effect = null;
  function commit() {
    if (effect2) {
      pause_effect(effect2);
      effect2 = null;
    }
    if (offscreen_fragment) {
      offscreen_fragment.lastChild.remove();
      anchor.before(offscreen_fragment);
      offscreen_fragment = null;
    }
    effect2 = pending_effect;
    pending_effect = null;
  }
  block(() => {
    if (component2 === (component2 = get_component())) return;
    var defer = should_defer_append();
    if (component2) {
      var target = anchor;
      if (defer) {
        offscreen_fragment = document.createDocumentFragment();
        offscreen_fragment.append(target = create_text());
        if (effect2) {
          current_batch.skipped_effects.add(effect2);
        }
      }
      pending_effect = branch(() => render_fn(target, component2));
    }
    if (defer) {
      current_batch.add_callback(commit);
    } else {
      commit();
    }
  }, EFFECT_TRANSPARENT);
  if (hydrating) {
    anchor = hydrate_node;
  }
}
function is_bound_this(bound_value, element_or_component) {
  return bound_value === element_or_component || bound_value?.[STATE_SYMBOL] === element_or_component;
}
function bind_this(element_or_component = {}, update, get_value, get_parts) {
  effect(() => {
    var old_parts;
    var parts;
    render_effect(() => {
      old_parts = parts;
      parts = [];
      untrack(() => {
        if (element_or_component !== get_value(...parts)) {
          update(element_or_component, ...parts);
          if (old_parts && is_bound_this(get_value(...old_parts), element_or_component)) {
            update(null, ...old_parts);
          }
        }
      });
    });
    return () => {
      queue_micro_task(() => {
        if (parts && is_bound_this(get_value(...parts), element_or_component)) {
          update(null, ...parts);
        }
      });
    };
  });
  return element_or_component;
}
let is_store_binding = false;
function capture_store_binding(fn) {
  var previous_is_store_binding = is_store_binding;
  try {
    is_store_binding = false;
    return [fn(), is_store_binding];
  } finally {
    is_store_binding = previous_is_store_binding;
  }
}
function prop(props, key, flags, fallback) {
  var runes = !legacy_mode_flag || (flags & PROPS_IS_RUNES) !== 0;
  var bindable = (flags & PROPS_IS_BINDABLE) !== 0;
  var lazy = (flags & PROPS_IS_LAZY_INITIAL) !== 0;
  var fallback_value = (
    /** @type {V} */
    fallback
  );
  var fallback_dirty = true;
  var get_fallback = () => {
    if (fallback_dirty) {
      fallback_dirty = false;
      fallback_value = lazy ? untrack(
        /** @type {() => V} */
        fallback
      ) : (
        /** @type {V} */
        fallback
      );
    }
    return fallback_value;
  };
  var setter;
  if (bindable) {
    var is_entry_props = STATE_SYMBOL in props || LEGACY_PROPS in props;
    setter = get_descriptor(props, key)?.set ?? (is_entry_props && key in props ? (v) => props[key] = v : void 0);
  }
  var initial_value;
  var is_store_sub = false;
  if (bindable) {
    [initial_value, is_store_sub] = capture_store_binding(() => (
      /** @type {V} */
      props[key]
    ));
  } else {
    initial_value = /** @type {V} */
    props[key];
  }
  if (initial_value === void 0 && fallback !== void 0) {
    initial_value = get_fallback();
    if (setter) {
      if (runes) props_invalid_value();
      setter(initial_value);
    }
  }
  var getter;
  if (runes) {
    getter = () => {
      var value = (
        /** @type {V} */
        props[key]
      );
      if (value === void 0) return get_fallback();
      fallback_dirty = true;
      return value;
    };
  } else {
    getter = () => {
      var value = (
        /** @type {V} */
        props[key]
      );
      if (value !== void 0) {
        fallback_value = /** @type {V} */
        void 0;
      }
      return value === void 0 ? fallback_value : value;
    };
  }
  if (runes && (flags & PROPS_IS_UPDATED) === 0) {
    return getter;
  }
  if (setter) {
    var legacy_parent = props.$$legacy;
    return (
      /** @type {() => V} */
      function(value, mutation) {
        if (arguments.length > 0) {
          if (!runes || !mutation || legacy_parent || is_store_sub) {
            setter(mutation ? getter() : value);
          }
          return value;
        }
        return getter();
      }
    );
  }
  var overridden = false;
  var d = ((flags & PROPS_IS_IMMUTABLE) !== 0 ? derived : derived_safe_equal)(() => {
    overridden = false;
    return getter();
  });
  if (bindable) get(d);
  var parent_effect = (
    /** @type {Effect} */
    active_effect
  );
  return (
    /** @type {() => V} */
    function(value, mutation) {
      if (arguments.length > 0) {
        const new_value = mutation ? get(d) : runes && bindable ? proxy(value) : value;
        set(d, new_value);
        overridden = true;
        if (fallback_value !== void 0) {
          fallback_value = new_value;
        }
        return value;
      }
      if (is_destroying_effect && overridden || (parent_effect.f & DESTROYED) !== 0) {
        return d.v;
      }
      return get(d);
    }
  );
}
function asClassComponent(component2) {
  return class extends Svelte4Component {
    /** @param {any} options */
    constructor(options) {
      super({
        component: component2,
        ...options
      });
    }
  };
}
class Svelte4Component {
  /** @type {any} */
  #events;
  /** @type {Record<string, any>} */
  #instance;
  /**
   * @param {ComponentConstructorOptions & {
   *  component: any;
   * }} options
   */
  constructor(options) {
    var sources = /* @__PURE__ */ new Map();
    var add_source = (key, value) => {
      var s = mutable_source(value, false, false);
      sources.set(key, s);
      return s;
    };
    const props = new Proxy(
      { ...options.props || {}, $$events: {} },
      {
        get(target, prop2) {
          return get(sources.get(prop2) ?? add_source(prop2, Reflect.get(target, prop2)));
        },
        has(target, prop2) {
          if (prop2 === LEGACY_PROPS) return true;
          get(sources.get(prop2) ?? add_source(prop2, Reflect.get(target, prop2)));
          return Reflect.has(target, prop2);
        },
        set(target, prop2, value) {
          set(sources.get(prop2) ?? add_source(prop2, value), value);
          return Reflect.set(target, prop2, value);
        }
      }
    );
    this.#instance = (options.hydrate ? hydrate : mount)(options.component, {
      target: options.target,
      anchor: options.anchor,
      props,
      context: options.context,
      intro: options.intro ?? false,
      recover: options.recover
    });
    if (!options?.props?.$$host || options.sync === false) {
      flushSync();
    }
    this.#events = props.$$events;
    for (const key of Object.keys(this.#instance)) {
      if (key === "$set" || key === "$destroy" || key === "$on") continue;
      define_property(this, key, {
        get() {
          return this.#instance[key];
        },
        /** @param {any} value */
        set(value) {
          this.#instance[key] = value;
        },
        enumerable: true
      });
    }
    this.#instance.$set = /** @param {Record<string, any>} next */
    (next) => {
      Object.assign(props, next);
    };
    this.#instance.$destroy = () => {
      unmount(this.#instance);
    };
  }
  /** @param {Record<string, any>} props */
  $set(props) {
    this.#instance.$set(props);
  }
  /**
   * @param {string} event
   * @param {(...args: any[]) => any} callback
   * @returns {any}
   */
  $on(event, callback) {
    this.#events[event] = this.#events[event] || [];
    const cb = (...args) => callback.call(this, ...args);
    this.#events[event].push(cb);
    return () => {
      this.#events[event] = this.#events[event].filter(
        /** @param {any} fn */
        (fn) => fn !== cb
      );
    };
  }
  $destroy() {
    this.#instance.$destroy();
  }
}
const scriptRel = "modulepreload";
const assetsURL = function(dep, importerUrl) {
  return new URL(dep, importerUrl).href;
};
const seen = {};
const __vitePreload = function preload(baseModule, deps, importerUrl) {
  let promise = Promise.resolve();
  if (deps && deps.length > 0) {
    let allSettled = function(promises$2) {
      return Promise.all(promises$2.map((p) => Promise.resolve(p).then((value$1) => ({
        status: "fulfilled",
        value: value$1
      }), (reason) => ({
        status: "rejected",
        reason
      }))));
    };
    const links = document.getElementsByTagName("link");
    const cspNonceMeta = document.querySelector("meta[property=csp-nonce]");
    const cspNonce = cspNonceMeta?.nonce || cspNonceMeta?.getAttribute("nonce");
    promise = allSettled(deps.map((dep) => {
      dep = assetsURL(dep, importerUrl);
      if (dep in seen) return;
      seen[dep] = true;
      const isCss = dep.endsWith(".css");
      const cssSelector = isCss ? '[rel="stylesheet"]' : "";
      if (!!importerUrl) for (let i$1 = links.length - 1; i$1 >= 0; i$1--) {
        const link$1 = links[i$1];
        if (link$1.href === dep && (!isCss || link$1.rel === "stylesheet")) return;
      }
      else if (document.querySelector(`link[href="${dep}"]${cssSelector}`)) return;
      const link = document.createElement("link");
      link.rel = isCss ? "stylesheet" : scriptRel;
      if (!isCss) link.as = "script";
      link.crossOrigin = "";
      link.href = dep;
      if (cspNonce) link.setAttribute("nonce", cspNonce);
      document.head.appendChild(link);
      if (isCss) return new Promise((res, rej) => {
        link.addEventListener("load", res);
        link.addEventListener("error", () => rej(/* @__PURE__ */ new Error(`Unable to preload CSS for ${dep}`)));
      });
    }));
  }
  function handlePreloadError(err$2) {
    const e$1 = new Event("vite:preloadError", { cancelable: true });
    e$1.payload = err$2;
    window.dispatchEvent(e$1);
    if (!e$1.defaultPrevented) throw err$2;
  }
  return promise.then((res) => {
    for (const item of res || []) {
      if (item.status !== "rejected") continue;
      handlePreloadError(item.reason);
    }
    return baseModule().catch(handlePreloadError);
  });
};
const matchers = {};
var root_7 = from_html(`<div id="svelte-announcer" aria-live="assertive" aria-atomic="true" style="position: absolute; left: 0; top: 0; clip: rect(0 0 0 0); clip-path: inset(50%); overflow: hidden; white-space: nowrap; width: 1px; height: 1px"><!></div>`);
var root$1 = from_html(`<!> <!>`, 1);
function Root($$anchor, $$props) {
  push($$props, true);
  let components = prop($$props, "components", 23, () => []), data_0 = prop($$props, "data_0", 3, null), data_1 = prop($$props, "data_1", 3, null), data_2 = prop($$props, "data_2", 3, null);
  {
    user_pre_effect(() => $$props.stores.page.set($$props.page));
  }
  user_effect(() => {
    $$props.stores;
    $$props.page;
    $$props.constructors;
    components();
    $$props.form;
    data_0();
    data_1();
    data_2();
    $$props.stores.page.notify();
  });
  let mounted = state(false);
  let navigated = state(false);
  let title = state(null);
  onMount(() => {
    const unsubscribe = $$props.stores.page.subscribe(() => {
      if (get(mounted)) {
        set(navigated, true);
        tick().then(() => {
          set(title, document.title || "untitled page", true);
        });
      }
    });
    set(mounted, true);
    return unsubscribe;
  });
  const Pyramid_2 = user_derived(() => $$props.constructors[2]);
  var fragment = root$1();
  var node = first_child(fragment);
  {
    var consequent_1 = ($$anchor2) => {
      const Pyramid_0 = user_derived(() => $$props.constructors[0]);
      var fragment_1 = comment();
      var node_1 = first_child(fragment_1);
      component(node_1, () => get(Pyramid_0), ($$anchor3, Pyramid_0_1) => {
        bind_this(
          Pyramid_0_1($$anchor3, {
            get data() {
              return data_0();
            },
            get form() {
              return $$props.form;
            },
            get params() {
              return $$props.page.params;
            },
            children: ($$anchor4, $$slotProps) => {
              var fragment_2 = comment();
              var node_2 = first_child(fragment_2);
              {
                var consequent = ($$anchor5) => {
                  const Pyramid_1 = user_derived(() => $$props.constructors[1]);
                  var fragment_3 = comment();
                  var node_3 = first_child(fragment_3);
                  component(node_3, () => get(Pyramid_1), ($$anchor6, Pyramid_1_1) => {
                    bind_this(
                      Pyramid_1_1($$anchor6, {
                        get data() {
                          return data_1();
                        },
                        get form() {
                          return $$props.form;
                        },
                        get params() {
                          return $$props.page.params;
                        },
                        children: ($$anchor7, $$slotProps2) => {
                          var fragment_4 = comment();
                          var node_4 = first_child(fragment_4);
                          component(node_4, () => get(Pyramid_2), ($$anchor8, Pyramid_2_1) => {
                            bind_this(
                              Pyramid_2_1($$anchor8, {
                                get data() {
                                  return data_2();
                                },
                                get form() {
                                  return $$props.form;
                                },
                                get params() {
                                  return $$props.page.params;
                                }
                              }),
                              ($$value) => components()[2] = $$value,
                              () => components()?.[2]
                            );
                          });
                          append($$anchor7, fragment_4);
                        },
                        $$slots: { default: true }
                      }),
                      ($$value) => components()[1] = $$value,
                      () => components()?.[1]
                    );
                  });
                  append($$anchor5, fragment_3);
                };
                var alternate = ($$anchor5) => {
                  const Pyramid_1 = user_derived(() => $$props.constructors[1]);
                  var fragment_5 = comment();
                  var node_5 = first_child(fragment_5);
                  component(node_5, () => get(Pyramid_1), ($$anchor6, Pyramid_1_2) => {
                    bind_this(
                      Pyramid_1_2($$anchor6, {
                        get data() {
                          return data_1();
                        },
                        get form() {
                          return $$props.form;
                        },
                        get params() {
                          return $$props.page.params;
                        }
                      }),
                      ($$value) => components()[1] = $$value,
                      () => components()?.[1]
                    );
                  });
                  append($$anchor5, fragment_5);
                };
                if_block(node_2, ($$render) => {
                  if ($$props.constructors[2]) $$render(consequent);
                  else $$render(alternate, false);
                });
              }
              append($$anchor4, fragment_2);
            },
            $$slots: { default: true }
          }),
          ($$value) => components()[0] = $$value,
          () => components()?.[0]
        );
      });
      append($$anchor2, fragment_1);
    };
    var alternate_1 = ($$anchor2) => {
      const Pyramid_0 = user_derived(() => $$props.constructors[0]);
      var fragment_6 = comment();
      var node_6 = first_child(fragment_6);
      component(node_6, () => get(Pyramid_0), ($$anchor3, Pyramid_0_2) => {
        bind_this(
          Pyramid_0_2($$anchor3, {
            get data() {
              return data_0();
            },
            get form() {
              return $$props.form;
            },
            get params() {
              return $$props.page.params;
            }
          }),
          ($$value) => components()[0] = $$value,
          () => components()?.[0]
        );
      });
      append($$anchor2, fragment_6);
    };
    if_block(node, ($$render) => {
      if ($$props.constructors[1]) $$render(consequent_1);
      else $$render(alternate_1, false);
    });
  }
  var node_7 = sibling(node, 2);
  {
    var consequent_3 = ($$anchor2) => {
      var div = root_7();
      var node_8 = child(div);
      {
        var consequent_2 = ($$anchor3) => {
          var text$1 = text();
          template_effect(() => set_text(text$1, get(title)));
          append($$anchor3, text$1);
        };
        if_block(node_8, ($$render) => {
          if (get(navigated)) $$render(consequent_2);
        });
      }
      reset(div);
      append($$anchor2, div);
    };
    if_block(node_7, ($$render) => {
      if (get(mounted)) $$render(consequent_3);
    });
  }
  append($$anchor, fragment);
  pop();
}
const root = asClassComponent(Root);
const nodes = [
  () => __vitePreload(() => import("../nodes/0.BBgqo_WL.js"), true ? __vite__mapDeps([0,1,2,3,4]) : void 0, import.meta.url),
  () => __vitePreload(() => import("../nodes/1.CgM6jQT7.js"), true ? __vite__mapDeps([5,2,6,3,7,8,9,4,10,11]) : void 0, import.meta.url),
  () => __vitePreload(() => import("../nodes/2.CKIKocYg.js"), true ? __vite__mapDeps([12,10,1,2,3,4]) : void 0, import.meta.url),
  () => __vitePreload(() => import("../nodes/3.qrtEGWd1.js"), true ? __vite__mapDeps([13,2,6,3,14,11]) : void 0, import.meta.url),
  () => __vitePreload(() => import("../nodes/4.hf3u82om.js"), true ? __vite__mapDeps([15,2,3,7,16,14,17]) : void 0, import.meta.url),
  () => __vitePreload(() => import("../nodes/5.DMbCDWVk.js"), true ? __vite__mapDeps([18,2,3,7,14,17,19]) : void 0, import.meta.url)
];
const server_loads = [];
const dictionary = {
  "/": [3],
  "/[worker]": [4, [2]],
  "/[worker]/parallel": [5, [2]]
};
const hooks = {
  handleError: ({ error }) => {
    console.error(error);
  },
  reroute: () => {
  },
  transport: {}
};
const decoders = Object.fromEntries(Object.entries(hooks.transport).map(([k, v]) => [k, v.decode]));
const hash = false;
const decode = (type, value) => decoders[type](value);
export {
  decode,
  decoders,
  dictionary,
  hash,
  hooks,
  matchers,
  nodes,
  root,
  server_loads
};
