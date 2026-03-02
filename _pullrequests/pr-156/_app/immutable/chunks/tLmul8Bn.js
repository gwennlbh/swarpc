import { B as tick, b1 as settled } from "./D9tyZ3BP.js";
import { a as parse_route_id, e as exec, c as create_updated_store, H as HISTORY_INDEX, N as NAVIGATION_INDEX, d as resolve_url, i as is_external_url, b as base, s as scroll_state, p as page, w as writable, n as navigating, f as find_anchor, g as get_link_info, h as get_router_options, j as strip_hash, S as STATES_KEY, P as PAGE_URL_KEY, k as notifiable_store, l as decode_params, m as make_trackable, o as normalize_path, q as origin, t as PRELOAD_PRIORITIES, u as decode_pathname, v as SNAPSHOT_KEY, x as subsequent_fetch, y as initial_fetch, z as SCROLL_KEY, A as update } from "./QtDJq_-M.js";
import { H as HttpError, S as SvelteKitError, R as Redirect } from "./kMd03mTr.js";
import "./BqB-gMnm.js";
function parse({ nodes, server_loads, dictionary, matchers }) {
  const layouts_with_server_load = new Set(server_loads);
  return Object.entries(dictionary).map(([id, [leaf, layouts, errors]]) => {
    const { pattern, params } = parse_route_id(id);
    const route = {
      id,
      /** @param {string} path */
      exec: (path) => {
        const match = pattern.exec(path);
        if (match) return exec(match, params, matchers);
      },
      errors: [1, ...errors || []].map((n) => nodes[n]),
      layouts: [0, ...layouts || []].map(create_layout_loader),
      leaf: create_leaf_loader(leaf)
    };
    route.errors.length = route.layouts.length = Math.max(
      route.errors.length,
      route.layouts.length
    );
    return route;
  });
  function create_leaf_loader(id) {
    const uses_server_data = id < 0;
    if (uses_server_data) id = ~id;
    return [uses_server_data, nodes[id]];
  }
  function create_layout_loader(id) {
    return id === void 0 ? id : [layouts_with_server_load.has(id), nodes[id]];
  }
}
// @__NO_SIDE_EFFECTS__
function get(key, parse2 = JSON.parse) {
  try {
    return parse2(sessionStorage[key]);
  } catch {
  }
}
function set(key, value, stringify = JSON.stringify) {
  const data = stringify(value);
  try {
    sessionStorage[key] = data;
  } catch {
  }
}
function compact(arr) {
  return arr.filter(
    /** @returns {val is NonNullable<T>} */
    (val) => val != null
  );
}
function get_status(error) {
  return error instanceof HttpError || error instanceof SvelteKitError ? error.status : 500;
}
function get_message(error) {
  return error instanceof SvelteKitError ? error.text : "Internal Error";
}
const noop_span = {
  spanContext() {
    return noop_span_context;
  },
  setAttribute() {
    return this;
  },
  setAttributes() {
    return this;
  },
  addEvent() {
    return this;
  },
  setStatus() {
    return this;
  },
  updateName() {
    return this;
  },
  end() {
    return this;
  },
  isRecording() {
    return false;
  },
  recordException() {
    return this;
  },
  addLink() {
    return this;
  },
  addLinks() {
    return this;
  }
};
const noop_span_context = {
  traceId: "",
  spanId: "",
  traceFlags: 0
};
const ICON_REL_ATTRIBUTES = /* @__PURE__ */ new Set(["icon", "shortcut icon", "apple-touch-icon"]);
const scroll_positions = /* @__PURE__ */ get(SCROLL_KEY) ?? {};
const snapshots = /* @__PURE__ */ get(SNAPSHOT_KEY) ?? {};
const stores = {
  url: /* @__PURE__ */ notifiable_store({}),
  page: /* @__PURE__ */ notifiable_store({}),
  navigating: /* @__PURE__ */ writable(
    /** @type {import('@sveltejs/kit').Navigation | null} */
    null
  ),
  updated: /* @__PURE__ */ create_updated_store()
};
function update_scroll_positions(index) {
  scroll_positions[index] = scroll_state();
}
function clear_onward_history(current_history_index2, current_navigation_index2) {
  let i = current_history_index2 + 1;
  while (scroll_positions[i]) {
    delete scroll_positions[i];
    i += 1;
  }
  i = current_navigation_index2 + 1;
  while (snapshots[i]) {
    delete snapshots[i];
    i += 1;
  }
}
function native_navigation(url, replace = false) {
  if (replace) {
    location.replace(url.href);
  } else {
    location.href = url.href;
  }
  return new Promise(() => {
  });
}
async function update_service_worker() {
  if ("serviceWorker" in navigator) {
    const registration = await navigator.serviceWorker.getRegistration(base || "/");
    if (registration) {
      await registration.update();
    }
  }
}
function noop() {
}
let routes;
let default_layout_loader;
let default_error_loader;
let container;
let target;
let app;
const invalidated = [];
const components = [];
let load_cache = null;
function discard_load_cache() {
  void load_cache?.fork?.then((f) => f?.discard());
  load_cache = null;
}
const reroute_cache = /* @__PURE__ */ new Map();
const before_navigate_callbacks = /* @__PURE__ */ new Set();
const on_navigate_callbacks = /* @__PURE__ */ new Set();
const after_navigate_callbacks = /* @__PURE__ */ new Set();
let current = {
  branch: [],
  error: null,
  // @ts-ignore - we need the initial value to be null
  url: null
};
let hydrated = false;
let started = false;
let autoscroll = true;
let is_navigating = false;
let hash_navigating = false;
let has_navigated = false;
let force_invalidation = false;
let root;
let current_history_index;
let current_navigation_index;
let token;
const preload_tokens = /* @__PURE__ */ new Set();
const query_map = /* @__PURE__ */ new Map();
async function start(_app, _target, hydrate) {
  if (globalThis.__sveltekit_m2gjp8?.data) {
    globalThis.__sveltekit_m2gjp8.data;
  }
  if (document.URL !== location.href) {
    location.href = location.href;
  }
  app = _app;
  await _app.hooks.init?.();
  routes = parse(_app);
  container = document.documentElement;
  target = _target;
  default_layout_loader = _app.nodes[0];
  default_error_loader = _app.nodes[1];
  void default_layout_loader();
  void default_error_loader();
  current_history_index = history.state?.[HISTORY_INDEX];
  current_navigation_index = history.state?.[NAVIGATION_INDEX];
  if (!current_history_index) {
    current_history_index = current_navigation_index = Date.now();
    history.replaceState(
      {
        ...history.state,
        [HISTORY_INDEX]: current_history_index,
        [NAVIGATION_INDEX]: current_navigation_index
      },
      ""
    );
  }
  const scroll = scroll_positions[current_history_index];
  function restore_scroll() {
    if (scroll) {
      history.scrollRestoration = "manual";
      scrollTo(scroll.x, scroll.y);
    }
  }
  if (hydrate) {
    restore_scroll();
    await _hydrate(target, hydrate);
  } else {
    await navigate({
      type: "enter",
      url: resolve_url(app.hash ? decode_hash(new URL(location.href)) : location.href),
      replace_state: true
    });
    restore_scroll();
  }
  _start_router();
}
function reset_invalidation() {
  invalidated.length = 0;
  force_invalidation = false;
}
function capture_snapshot(index) {
  if (components.some((c) => c?.snapshot)) {
    snapshots[index] = components.map((c) => c?.snapshot?.capture());
  }
}
function restore_snapshot(index) {
  snapshots[index]?.forEach((value, i) => {
    components[i]?.snapshot?.restore(value);
  });
}
function persist_state() {
  update_scroll_positions(current_history_index);
  set(SCROLL_KEY, scroll_positions);
  capture_snapshot(current_navigation_index);
  set(SNAPSHOT_KEY, snapshots);
}
async function _goto(url, options, redirect_count, nav_token) {
  let query_keys;
  if (options.invalidateAll) {
    discard_load_cache();
  }
  await navigate({
    type: "goto",
    url: resolve_url(url),
    keepfocus: options.keepFocus,
    noscroll: options.noScroll,
    replace_state: options.replaceState,
    state: options.state,
    redirect_count,
    nav_token,
    accept: () => {
      if (options.invalidateAll) {
        force_invalidation = true;
        query_keys = [...query_map.keys()];
      }
      if (options.invalidate) {
        options.invalidate.forEach(push_invalidated);
      }
    }
  });
  if (options.invalidateAll) {
    void tick().then(tick).then(() => {
      query_map.forEach(({ resource }, key) => {
        if (query_keys?.includes(key)) {
          resource.refresh?.();
        }
      });
    });
  }
}
async function _preload_data(intent) {
  if (intent.id !== load_cache?.id) {
    discard_load_cache();
    const preload = {};
    preload_tokens.add(preload);
    load_cache = {
      id: intent.id,
      token: preload,
      promise: load_route({ ...intent, preload }).then((result) => {
        preload_tokens.delete(preload);
        if (result.type === "loaded" && result.state.error) {
          discard_load_cache();
        }
        return result;
      }),
      fork: null
    };
  }
  return load_cache.promise;
}
async function _preload_code(url) {
  const route = (await get_navigation_intent(url, false))?.route;
  if (route) {
    await Promise.all(
      /** @type {[has_server_load: boolean, node_loader: import('types').CSRPageNodeLoader][]} */
      [...route.layouts, route.leaf].filter(Boolean).map((load) => load[1]())
    );
  }
}
async function initialize(result, target2, hydrate) {
  current = result.state;
  const style = document.querySelector("style[data-sveltekit]");
  if (style) style.remove();
  Object.assign(
    page,
    /** @type {import('@sveltejs/kit').Page} */
    result.props.page
  );
  root = new app.root({
    target: target2,
    props: { ...result.props, stores, components },
    hydrate,
    // @ts-ignore Svelte 5 specific: asynchronously instantiate the component, i.e. don't call flushSync
    sync: false
  });
  void await Promise.resolve();
  restore_snapshot(current_navigation_index);
  if (hydrate) {
    const navigation = {
      from: null,
      to: {
        params: current.params,
        route: { id: current.route?.id ?? null },
        url: new URL(location.href),
        scroll: scroll_positions[current_history_index] ?? scroll_state()
      },
      willUnload: false,
      type: "enter",
      complete: Promise.resolve()
    };
    after_navigate_callbacks.forEach((fn) => fn(navigation));
  }
  started = true;
}
function get_navigation_result_from_branch({ url, params, branch, status, error, route, form }) {
  let slash = "never";
  if (base && (url.pathname === base || url.pathname === base + "/")) {
    slash = "always";
  } else {
    for (const node of branch) {
      if (node?.slash !== void 0) slash = node.slash;
    }
  }
  url.pathname = normalize_path(url.pathname, slash);
  url.search = url.search;
  const result = {
    type: "loaded",
    state: {
      url,
      params,
      branch,
      error,
      route
    },
    props: {
      // @ts-ignore Somehow it's getting SvelteComponent and SvelteComponentDev mixed up
      constructors: compact(branch).map((branch_node) => branch_node.node.component),
      page: clone_page(page)
    }
  };
  if (form !== void 0) {
    result.props.form = form;
  }
  let data = {};
  let data_changed = !page;
  let p = 0;
  for (let i = 0; i < Math.max(branch.length, current.branch.length); i += 1) {
    const node = branch[i];
    const prev = current.branch[i];
    if (node?.data !== prev?.data) data_changed = true;
    if (!node) continue;
    data = { ...data, ...node.data };
    if (data_changed) {
      result.props[`data_${p}`] = data;
    }
    p += 1;
  }
  const page_changed = !current.url || url.href !== current.url.href || current.error !== error || form !== void 0 && form !== page.form || data_changed;
  if (page_changed) {
    result.props.page = {
      error,
      params,
      route: {
        id: route?.id ?? null
      },
      state: {},
      status,
      url: new URL(url),
      form: form ?? null,
      // The whole page store is updated, but this way the object reference stays the same
      data: data_changed ? data : page.data
    };
  }
  return result;
}
async function load_node({ loader, parent, url, params, route, server_data_node }) {
  let data = null;
  let is_tracking = true;
  const uses = {
    dependencies: /* @__PURE__ */ new Set(),
    params: /* @__PURE__ */ new Set(),
    parent: false,
    route: false,
    url: false,
    search_params: /* @__PURE__ */ new Set()
  };
  const node = await loader();
  if (node.universal?.load) {
    let depends = function(...deps) {
      for (const dep of deps) {
        const { href } = new URL(dep, url);
        uses.dependencies.add(href);
      }
    };
    const load_input = {
      tracing: { enabled: false, root: noop_span, current: noop_span },
      route: new Proxy(route, {
        get: (target2, key) => {
          if (is_tracking) {
            uses.route = true;
          }
          return target2[
            /** @type {'id'} */
            key
          ];
        }
      }),
      params: new Proxy(params, {
        get: (target2, key) => {
          if (is_tracking) {
            uses.params.add(
              /** @type {string} */
              key
            );
          }
          return target2[
            /** @type {string} */
            key
          ];
        }
      }),
      data: server_data_node?.data ?? null,
      url: make_trackable(
        url,
        () => {
          if (is_tracking) {
            uses.url = true;
          }
        },
        (param) => {
          if (is_tracking) {
            uses.search_params.add(param);
          }
        },
        app.hash
      ),
      async fetch(resource, init) {
        if (resource instanceof Request) {
          init = {
            // the request body must be consumed in memory until browsers
            // implement streaming request bodies and/or the body getter
            body: resource.method === "GET" || resource.method === "HEAD" ? void 0 : await resource.blob(),
            cache: resource.cache,
            credentials: resource.credentials,
            // the server sets headers to `undefined` if there are no headers but
            // the client defaults to an empty Headers object in the Request object.
            // To keep the two values in sync, we explicitly set the headers to `undefined`.
            // Also, not sure why, but sometimes 0 is evaluated as truthy so we need to
            // explicitly compare the headers length to a number here
            headers: [...resource.headers].length > 0 ? resource?.headers : void 0,
            integrity: resource.integrity,
            keepalive: resource.keepalive,
            method: resource.method,
            mode: resource.mode,
            redirect: resource.redirect,
            referrer: resource.referrer,
            referrerPolicy: resource.referrerPolicy,
            signal: resource.signal,
            ...init
          };
        }
        const { resolved, promise } = resolve_fetch_url(resource, init, url);
        if (is_tracking) {
          depends(resolved.href);
        }
        return promise;
      },
      setHeaders: () => {
      },
      // noop
      depends,
      parent() {
        if (is_tracking) {
          uses.parent = true;
        }
        return parent();
      },
      untrack(fn) {
        is_tracking = false;
        try {
          return fn();
        } finally {
          is_tracking = true;
        }
      }
    };
    {
      data = await node.universal.load.call(null, load_input) ?? null;
    }
  }
  return {
    node,
    loader,
    server: server_data_node,
    universal: node.universal?.load ? { type: "data", data, uses } : null,
    data: data ?? server_data_node?.data ?? null,
    slash: node.universal?.trailingSlash ?? server_data_node?.slash
  };
}
function resolve_fetch_url(input, init, url) {
  let requested = input instanceof Request ? input.url : input;
  const resolved = new URL(requested, url);
  if (resolved.origin === url.origin) {
    requested = resolved.href.slice(url.origin.length);
  }
  const promise = started ? subsequent_fetch(requested, resolved.href, init) : initial_fetch(requested, init);
  return { resolved, promise };
}
function has_changed(parent_changed, route_changed, url_changed, search_params_changed, uses, params) {
  if (force_invalidation) return true;
  if (!uses) return false;
  if (uses.parent && parent_changed) return true;
  if (uses.route && route_changed) return true;
  if (uses.url && url_changed) return true;
  for (const tracked_params of uses.search_params) {
    if (search_params_changed.has(tracked_params)) return true;
  }
  for (const param of uses.params) {
    if (params[param] !== current.params[param]) return true;
  }
  for (const href of uses.dependencies) {
    if (invalidated.some((fn) => fn(new URL(href)))) return true;
  }
  return false;
}
function create_data_node(node, previous) {
  if (node?.type === "data") return node;
  if (node?.type === "skip") return previous ?? null;
  return null;
}
function diff_search_params(old_url, new_url) {
  if (!old_url) return new Set(new_url.searchParams.keys());
  const changed = /* @__PURE__ */ new Set([...old_url.searchParams.keys(), ...new_url.searchParams.keys()]);
  for (const key of changed) {
    const old_values = old_url.searchParams.getAll(key);
    const new_values = new_url.searchParams.getAll(key);
    if (old_values.every((value) => new_values.includes(value)) && new_values.every((value) => old_values.includes(value))) {
      changed.delete(key);
    }
  }
  return changed;
}
function preload_error({ error, url, route, params }) {
  return {
    type: "loaded",
    state: {
      error,
      url,
      route,
      params,
      branch: []
    },
    props: {
      page: clone_page(page),
      constructors: []
    }
  };
}
async function load_route({ id, invalidating, url, params, route, preload }) {
  if (load_cache?.id === id) {
    preload_tokens.delete(load_cache.token);
    return load_cache.promise;
  }
  const { errors, layouts, leaf } = route;
  const loaders = [...layouts, leaf];
  errors.forEach((loader) => loader?.().catch(() => {
  }));
  loaders.forEach((loader) => loader?.[1]().catch(() => {
  }));
  const url_changed = current.url ? id !== get_page_key(current.url) : false;
  const route_changed = current.route ? route.id !== current.route.id : false;
  const search_params_changed = diff_search_params(current.url, url);
  let parent_changed = false;
  const branch_promises = loaders.map(async (loader, i) => {
    if (!loader) return;
    const previous = current.branch[i];
    const valid = loader[1] === previous?.loader && !has_changed(
      parent_changed,
      route_changed,
      url_changed,
      search_params_changed,
      previous.universal?.uses,
      params
    );
    if (valid) return previous;
    parent_changed = true;
    return load_node({
      loader: loader[1],
      url,
      params,
      route,
      parent: async () => {
        const data = {};
        for (let j = 0; j < i; j += 1) {
          Object.assign(data, (await branch_promises[j])?.data);
        }
        return data;
      },
      server_data_node: create_data_node(
        // server_data_node is undefined if it wasn't reloaded from the server;
        // and if current loader uses server data, we want to reuse previous data.
        loader[0] ? { type: "skip" } : null,
        loader[0] ? previous?.server : void 0
      )
    });
  });
  for (const p of branch_promises) p.catch(() => {
  });
  const branch = [];
  for (let i = 0; i < loaders.length; i += 1) {
    if (loaders[i]) {
      try {
        branch.push(await branch_promises[i]);
      } catch (err) {
        if (err instanceof Redirect) {
          return {
            type: "redirect",
            location: err.location
          };
        }
        if (preload_tokens.has(preload)) {
          return preload_error({
            error: await handle_error(err, { params, url, route: { id: route.id } }),
            url,
            params,
            route
          });
        }
        let status = get_status(err);
        let error;
        if (err instanceof HttpError) {
          error = err.body;
        } else {
          const updated = await stores.updated.check();
          if (updated) {
            await update_service_worker();
            return await native_navigation(url);
          }
          error = await handle_error(err, { params, url, route: { id: route.id } });
        }
        const error_load = await load_nearest_error_page(i, branch, errors);
        if (error_load) {
          return get_navigation_result_from_branch({
            url,
            params,
            branch: branch.slice(0, error_load.idx).concat(error_load.node),
            status,
            error,
            route
          });
        } else {
          return await server_fallback(url, { id: route.id }, error, status);
        }
      }
    } else {
      branch.push(void 0);
    }
  }
  return get_navigation_result_from_branch({
    url,
    params,
    branch,
    status: 200,
    error: null,
    route,
    // Reset `form` on navigation, but not invalidation
    form: invalidating ? void 0 : null
  });
}
async function load_nearest_error_page(i, branch, errors) {
  while (i--) {
    if (errors[i]) {
      let j = i;
      while (!branch[j]) j -= 1;
      try {
        return {
          idx: j + 1,
          node: {
            node: await /** @type {import('types').CSRPageNodeLoader } */
            errors[i](),
            loader: (
              /** @type {import('types').CSRPageNodeLoader } */
              errors[i]
            ),
            data: {},
            server: null,
            universal: null
          }
        };
      } catch {
        continue;
      }
    }
  }
}
async function load_root_error_page({ status, error, url, route }) {
  const params = {};
  let server_data_node = null;
  try {
    const root_layout = await load_node({
      loader: default_layout_loader,
      url,
      params,
      route,
      parent: () => Promise.resolve({}),
      server_data_node: create_data_node(server_data_node)
    });
    const root_error = {
      node: await default_error_loader(),
      loader: default_error_loader,
      universal: null,
      server: null,
      data: null
    };
    return get_navigation_result_from_branch({
      url,
      params,
      branch: [root_layout, root_error],
      status,
      error,
      route: null
    });
  } catch (error2) {
    if (error2 instanceof Redirect) {
      return _goto(new URL(error2.location, location.href), {}, 0);
    }
    throw error2;
  }
}
async function get_rerouted_url(url) {
  const href = url.href;
  if (reroute_cache.has(href)) {
    return reroute_cache.get(href);
  }
  let rerouted;
  try {
    const promise = (async () => {
      let rerouted2 = await app.hooks.reroute({
        url: new URL(url),
        fetch: async (input, init) => {
          return resolve_fetch_url(input, init, url).promise;
        }
      }) ?? url;
      if (typeof rerouted2 === "string") {
        const tmp = new URL(url);
        if (app.hash) {
          tmp.hash = rerouted2;
        } else {
          tmp.pathname = rerouted2;
        }
        rerouted2 = tmp;
      }
      return rerouted2;
    })();
    reroute_cache.set(href, promise);
    rerouted = await promise;
  } catch (e) {
    reroute_cache.delete(href);
    return;
  }
  return rerouted;
}
async function get_navigation_intent(url, invalidating) {
  if (!url) return;
  if (is_external_url(url, base, app.hash)) return;
  {
    const rerouted = await get_rerouted_url(url);
    if (!rerouted) return;
    const path = get_url_path(rerouted);
    for (const route of routes) {
      const params = route.exec(path);
      if (params) {
        return {
          id: get_page_key(url),
          invalidating,
          route,
          params: decode_params(params),
          url
        };
      }
    }
  }
}
function get_url_path(url) {
  return decode_pathname(
    app.hash ? url.hash.replace(/^#/, "").replace(/[?#].+/, "") : url.pathname.slice(base.length)
  ) || "/";
}
function get_page_key(url) {
  return (app.hash ? url.hash.replace(/^#/, "") : url.pathname) + url.search;
}
function _before_navigate({ url, type, intent, delta, event, scroll }) {
  let should_block = false;
  const nav = create_navigation(current, intent, url, type, scroll ?? null);
  if (delta !== void 0) {
    nav.navigation.delta = delta;
  }
  if (event !== void 0) {
    nav.navigation.event = event;
  }
  const cancellable = {
    ...nav.navigation,
    cancel: () => {
      should_block = true;
      nav.reject(new Error("navigation cancelled"));
    }
  };
  if (!is_navigating) {
    before_navigate_callbacks.forEach((fn) => fn(cancellable));
  }
  return should_block ? null : nav;
}
async function navigate({
  type,
  url,
  popped,
  keepfocus,
  noscroll,
  replace_state,
  state = {},
  redirect_count = 0,
  nav_token = {},
  accept = noop,
  block = noop,
  event
}) {
  const prev_token = token;
  token = nav_token;
  const intent = await get_navigation_intent(url, false);
  const nav = type === "enter" ? create_navigation(current, intent, url, type) : _before_navigate({
    url,
    type,
    delta: popped?.delta,
    intent,
    scroll: popped?.scroll,
    // @ts-ignore
    event
  });
  if (!nav) {
    block();
    if (token === nav_token) token = prev_token;
    return;
  }
  const previous_history_index = current_history_index;
  const previous_navigation_index = current_navigation_index;
  accept();
  is_navigating = true;
  if (started && nav.navigation.type !== "enter") {
    stores.navigating.set(navigating.current = nav.navigation);
  }
  let navigation_result = intent && await load_route(intent);
  if (!navigation_result) {
    if (is_external_url(url, base, app.hash)) {
      {
        return await native_navigation(url, replace_state);
      }
    } else {
      navigation_result = await server_fallback(
        url,
        { id: null },
        await handle_error(new SvelteKitError(404, "Not Found", `Not found: ${url.pathname}`), {
          url,
          params: {},
          route: { id: null }
        }),
        404,
        replace_state
      );
    }
  }
  url = intent?.url || url;
  if (token !== nav_token) {
    nav.reject(new Error("navigation aborted"));
    return false;
  }
  if (navigation_result.type === "redirect") {
    if (redirect_count < 20) {
      await navigate({
        type,
        url: new URL(navigation_result.location, url),
        popped,
        keepfocus,
        noscroll,
        replace_state,
        state,
        redirect_count: redirect_count + 1,
        nav_token
      });
      nav.fulfil(void 0);
      return;
    }
    navigation_result = await load_root_error_page({
      status: 500,
      error: await handle_error(new Error("Redirect loop"), {
        url,
        params: {},
        route: { id: null }
      }),
      url,
      route: { id: null }
    });
  } else if (
    /** @type {number} */
    navigation_result.props.page.status >= 400
  ) {
    const updated = await stores.updated.check();
    if (updated) {
      await update_service_worker();
      await native_navigation(url, replace_state);
    }
  }
  reset_invalidation();
  update_scroll_positions(previous_history_index);
  capture_snapshot(previous_navigation_index);
  if (navigation_result.props.page.url.pathname !== url.pathname) {
    url.pathname = navigation_result.props.page.url.pathname;
  }
  state = popped ? popped.state : state;
  if (!popped) {
    const change = replace_state ? 0 : 1;
    const entry = {
      [HISTORY_INDEX]: current_history_index += change,
      [NAVIGATION_INDEX]: current_navigation_index += change,
      [STATES_KEY]: state
    };
    const fn = replace_state ? history.replaceState : history.pushState;
    fn.call(history, entry, "", url);
    if (!replace_state) {
      clear_onward_history(current_history_index, current_navigation_index);
    }
  }
  const load_cache_fork = intent && load_cache?.id === intent.id ? load_cache.fork : null;
  load_cache = null;
  navigation_result.props.page.state = state;
  let commit_promise;
  if (started) {
    const after_navigate = (await Promise.all(
      // eslint-disable-next-line @typescript-eslint/await-thenable -- we need to await because they can be asynchronous
      Array.from(
        on_navigate_callbacks,
        (fn) => fn(
          /** @type {import('@sveltejs/kit').OnNavigate} */
          nav.navigation
        )
      )
    )).filter(
      /** @returns {value is () => void} */
      (value) => typeof value === "function"
    );
    if (after_navigate.length > 0) {
      let cleanup = function() {
        after_navigate.forEach((fn) => {
          after_navigate_callbacks.delete(fn);
        });
      };
      after_navigate.push(cleanup);
      after_navigate.forEach((fn) => {
        after_navigate_callbacks.add(fn);
      });
    }
    current = navigation_result.state;
    if (navigation_result.props.page) {
      navigation_result.props.page.url = url;
    }
    const fork = load_cache_fork && await load_cache_fork;
    if (fork) {
      commit_promise = fork.commit();
    } else {
      root.$set(navigation_result.props);
      update(navigation_result.props.page);
      commit_promise = settled?.();
    }
    has_navigated = true;
  } else {
    await initialize(navigation_result, target, false);
  }
  const { activeElement } = document;
  await commit_promise;
  await tick();
  await tick();
  let deep_linked = null;
  if (autoscroll) {
    const scroll = popped ? popped.scroll : noscroll ? scroll_state() : null;
    if (scroll) {
      scrollTo(scroll.x, scroll.y);
    } else if (deep_linked = url.hash && document.getElementById(get_id(url))) {
      deep_linked.scrollIntoView();
    } else {
      scrollTo(0, 0);
    }
  }
  const changed_focus = (
    // reset focus only if any manual focus management didn't override it
    document.activeElement !== activeElement && // also refocus when activeElement is body already because the
    // focus event might not have been fired on it yet
    document.activeElement !== document.body
  );
  if (!keepfocus && !changed_focus) {
    reset_focus(url, !deep_linked);
  }
  autoscroll = true;
  if (navigation_result.props.page) {
    Object.assign(page, navigation_result.props.page);
  }
  is_navigating = false;
  if (type === "popstate") {
    restore_snapshot(current_navigation_index);
  }
  nav.fulfil(void 0);
  if (nav.navigation.to) {
    nav.navigation.to.scroll = scroll_state();
  }
  after_navigate_callbacks.forEach(
    (fn) => fn(
      /** @type {import('@sveltejs/kit').AfterNavigate} */
      nav.navigation
    )
  );
  stores.navigating.set(navigating.current = null);
}
async function server_fallback(url, route, error, status, replace_state) {
  if (url.origin === origin && url.pathname === location.pathname && !hydrated) {
    return await load_root_error_page({
      status,
      error,
      url,
      route
    });
  }
  return await native_navigation(url, replace_state);
}
function setup_preload() {
  let mousemove_timeout;
  let current_a = { element: void 0, href: void 0 };
  let current_priority;
  container.addEventListener("mousemove", (event) => {
    const target2 = (
      /** @type {Element} */
      event.target
    );
    clearTimeout(mousemove_timeout);
    mousemove_timeout = setTimeout(() => {
      void preload(target2, PRELOAD_PRIORITIES.hover);
    }, 20);
  });
  function tap(event) {
    if (event.defaultPrevented) return;
    void preload(
      /** @type {Element} */
      event.composedPath()[0],
      PRELOAD_PRIORITIES.tap
    );
  }
  container.addEventListener("mousedown", tap);
  container.addEventListener("touchstart", tap, { passive: true });
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          void _preload_code(new URL(
            /** @type {HTMLAnchorElement} */
            entry.target.href
          ));
          observer.unobserve(entry.target);
        }
      }
    },
    { threshold: 0 }
  );
  async function preload(element, priority) {
    const a = find_anchor(element, container);
    const interacted = a === current_a.element && a?.href === current_a.href && priority >= current_priority;
    if (!a || interacted) return;
    const { url, external, download } = get_link_info(a, base, app.hash);
    if (external || download) return;
    const options = get_router_options(a);
    const same_url = url && get_page_key(current.url) === get_page_key(url);
    if (options.reload || same_url) return;
    if (priority <= options.preload_data) {
      current_a = { element: a, href: a.href };
      current_priority = PRELOAD_PRIORITIES.tap;
      const intent = await get_navigation_intent(url, false);
      if (!intent) return;
      {
        void _preload_data(intent);
      }
    } else if (priority <= options.preload_code) {
      current_a = { element: a, href: a.href };
      current_priority = priority;
      void _preload_code(
        /** @type {URL} */
        url
      );
    }
  }
  function after_navigate() {
    observer.disconnect();
    for (const a of container.querySelectorAll("a")) {
      const { url, external, download } = get_link_info(a, base, app.hash);
      if (external || download) continue;
      const options = get_router_options(a);
      if (options.reload) continue;
      if (options.preload_code === PRELOAD_PRIORITIES.viewport) {
        observer.observe(a);
      }
      if (options.preload_code === PRELOAD_PRIORITIES.eager) {
        void _preload_code(
          /** @type {URL} */
          url
        );
      }
    }
  }
  after_navigate_callbacks.add(after_navigate);
  after_navigate();
}
function handle_error(error, event) {
  if (error instanceof HttpError) {
    return error.body;
  }
  const status = get_status(error);
  const message = get_message(error);
  return app.hooks.handleError({ error, event, status, message }) ?? /** @type {any} */
  { message };
}
function push_invalidated(resource) {
  if (typeof resource === "function") {
    invalidated.push(resource);
  } else {
    const { href } = new URL(resource, location.href);
    invalidated.push((url) => url.href === href);
  }
}
function _start_router() {
  history.scrollRestoration = "manual";
  addEventListener("beforeunload", (e) => {
    let should_block = false;
    persist_state();
    if (!is_navigating) {
      const nav = create_navigation(current, void 0, null, "leave");
      const navigation = {
        ...nav.navigation,
        cancel: () => {
          should_block = true;
          nav.reject(new Error("navigation cancelled"));
        }
      };
      before_navigate_callbacks.forEach((fn) => fn(navigation));
    }
    if (should_block) {
      e.preventDefault();
      e.returnValue = "";
    } else {
      history.scrollRestoration = "auto";
    }
  });
  addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      persist_state();
    }
  });
  if (!navigator.connection?.saveData) {
    setup_preload();
  }
  container.addEventListener("click", async (event) => {
    if (event.button || event.which !== 1) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (event.defaultPrevented) return;
    const a = find_anchor(
      /** @type {Element} */
      event.composedPath()[0],
      container
    );
    if (!a) return;
    const { url, external, target: target2, download } = get_link_info(a, base, app.hash);
    if (!url) return;
    if (target2 === "_parent" || target2 === "_top") {
      if (window.parent !== window) return;
    } else if (target2 && target2 !== "_self") {
      return;
    }
    const options = get_router_options(a);
    const is_svg_a_element = a instanceof SVGAElement;
    if (!is_svg_a_element && url.protocol !== location.protocol && !(url.protocol === "https:" || url.protocol === "http:"))
      return;
    if (download) return;
    const [nonhash, hash] = (app.hash ? url.hash.replace(/^#/, "") : url.href).split("#");
    const same_pathname = nonhash === strip_hash(location);
    if (external || options.reload && (!same_pathname || !hash)) {
      if (_before_navigate({ url, type: "link", event })) {
        is_navigating = true;
      } else {
        event.preventDefault();
      }
      return;
    }
    if (hash !== void 0 && same_pathname) {
      const [, current_hash] = current.url.href.split("#");
      if (current_hash === hash) {
        event.preventDefault();
        if (hash === "" || hash === "top" && a.ownerDocument.getElementById("top") === null) {
          scrollTo({ top: 0 });
        } else {
          const element = a.ownerDocument.getElementById(decodeURIComponent(hash));
          if (element) {
            element.scrollIntoView();
            element.focus();
          }
        }
        return;
      }
      hash_navigating = true;
      update_scroll_positions(current_history_index);
      update_url(url);
      if (!options.replace_state) return;
      hash_navigating = false;
    }
    event.preventDefault();
    await new Promise((fulfil) => {
      requestAnimationFrame(() => {
        setTimeout(fulfil, 0);
      });
      setTimeout(fulfil, 100);
    });
    await navigate({
      type: "link",
      url,
      keepfocus: options.keepfocus,
      noscroll: options.noscroll,
      replace_state: options.replace_state ?? url.href === location.href,
      event
    });
  });
  container.addEventListener("submit", (event) => {
    if (event.defaultPrevented) return;
    const form = (
      /** @type {HTMLFormElement} */
      HTMLFormElement.prototype.cloneNode.call(event.target)
    );
    const submitter = (
      /** @type {HTMLButtonElement | HTMLInputElement | null} */
      event.submitter
    );
    const target2 = submitter?.formTarget || form.target;
    if (target2 === "_blank") return;
    const method = submitter?.formMethod || form.method;
    if (method !== "get") return;
    const url = new URL(
      submitter?.hasAttribute("formaction") && submitter?.formAction || form.action
    );
    if (is_external_url(url, base, false)) return;
    const event_form = (
      /** @type {HTMLFormElement} */
      event.target
    );
    const options = get_router_options(event_form);
    if (options.reload) return;
    event.preventDefault();
    event.stopPropagation();
    const data = new FormData(event_form, submitter);
    url.search = new URLSearchParams(data).toString();
    void navigate({
      type: "form",
      url,
      keepfocus: options.keepfocus,
      noscroll: options.noscroll,
      replace_state: options.replace_state ?? url.href === location.href,
      event
    });
  });
  addEventListener("popstate", async (event) => {
    if (resetting_focus) return;
    if (event.state?.[HISTORY_INDEX]) {
      const history_index = event.state[HISTORY_INDEX];
      token = {};
      if (history_index === current_history_index) return;
      const scroll = scroll_positions[history_index];
      const state = event.state[STATES_KEY] ?? {};
      const url = new URL(event.state[PAGE_URL_KEY] ?? location.href);
      const navigation_index = event.state[NAVIGATION_INDEX];
      const is_hash_change = current.url ? strip_hash(location) === strip_hash(current.url) : false;
      const shallow = navigation_index === current_navigation_index && (has_navigated || is_hash_change);
      if (shallow) {
        if (state !== page.state) {
          page.state = state;
        }
        update_url(url);
        scroll_positions[current_history_index] = scroll_state();
        if (scroll) scrollTo(scroll.x, scroll.y);
        current_history_index = history_index;
        return;
      }
      const delta = history_index - current_history_index;
      await navigate({
        type: "popstate",
        url,
        popped: {
          state,
          scroll,
          delta
        },
        accept: () => {
          current_history_index = history_index;
          current_navigation_index = navigation_index;
        },
        block: () => {
          history.go(-delta);
        },
        nav_token: token,
        event
      });
    } else {
      if (!hash_navigating) {
        const url = new URL(location.href);
        update_url(url);
        if (app.hash) {
          location.reload();
        }
      }
    }
  });
  addEventListener("hashchange", () => {
    if (hash_navigating) {
      hash_navigating = false;
      history.replaceState(
        {
          ...history.state,
          [HISTORY_INDEX]: ++current_history_index,
          [NAVIGATION_INDEX]: current_navigation_index
        },
        "",
        location.href
      );
    }
  });
  for (const link of document.querySelectorAll("link")) {
    if (ICON_REL_ATTRIBUTES.has(link.rel)) {
      link.href = link.href;
    }
  }
  addEventListener("pageshow", (event) => {
    if (event.persisted) {
      stores.navigating.set(navigating.current = null);
    }
  });
  function update_url(url) {
    current.url = page.url = url;
    stores.page.set(clone_page(page));
    stores.page.notify();
  }
}
async function _hydrate(target2, { status = 200, error, node_ids, params, route, server_route, data: server_data_nodes, form }) {
  hydrated = true;
  const url = new URL(location.href);
  let parsed_route;
  {
    {
      ({ params = {}, route = { id: null } } = await get_navigation_intent(url, false) || {});
    }
    parsed_route = routes.find(({ id }) => id === route.id);
  }
  let result;
  let hydrate = true;
  try {
    const branch_promises = node_ids.map(async (n, i) => {
      const server_data_node = server_data_nodes[i];
      if (server_data_node?.uses) {
        server_data_node.uses = deserialize_uses(server_data_node.uses);
      }
      return load_node({
        loader: app.nodes[n],
        url,
        params,
        route,
        parent: async () => {
          const data = {};
          for (let j = 0; j < i; j += 1) {
            Object.assign(data, (await branch_promises[j]).data);
          }
          return data;
        },
        server_data_node: create_data_node(server_data_node)
      });
    });
    const branch = await Promise.all(branch_promises);
    if (parsed_route) {
      const layouts = parsed_route.layouts;
      for (let i = 0; i < layouts.length; i++) {
        if (!layouts[i]) {
          branch.splice(i, 0, void 0);
        }
      }
    }
    result = get_navigation_result_from_branch({
      url,
      params,
      branch,
      status,
      error,
      form,
      route: parsed_route ?? null
    });
  } catch (error2) {
    if (error2 instanceof Redirect) {
      await native_navigation(new URL(error2.location, location.href));
      return;
    }
    result = await load_root_error_page({
      status: get_status(error2),
      error: await handle_error(error2, { url, params, route }),
      url,
      route
    });
    target2.textContent = "";
    hydrate = false;
  }
  if (result.props.page) {
    result.props.page.state = {};
  }
  await initialize(result, target2, hydrate);
}
function deserialize_uses(uses) {
  return {
    dependencies: new Set(uses?.dependencies ?? []),
    params: new Set(uses?.params ?? []),
    parent: !!uses?.parent,
    route: !!uses?.route,
    url: !!uses?.url,
    search_params: new Set(uses?.search_params ?? [])
  };
}
let resetting_focus = false;
function reset_focus(url, scroll = true) {
  const autofocus = document.querySelector("[autofocus]");
  if (autofocus) {
    autofocus.focus();
  } else {
    const id = get_id(url);
    if (id && document.getElementById(id)) {
      const { x, y } = scroll_state();
      setTimeout(() => {
        const history_state = history.state;
        resetting_focus = true;
        location.replace(new URL(`#${id}`, location.href));
        history.replaceState(history_state, "", url);
        if (scroll) scrollTo(x, y);
        resetting_focus = false;
      });
    } else {
      const root2 = document.body;
      const tabindex = root2.getAttribute("tabindex");
      root2.tabIndex = -1;
      root2.focus({ preventScroll: true, focusVisible: false });
      if (tabindex !== null) {
        root2.setAttribute("tabindex", tabindex);
      } else {
        root2.removeAttribute("tabindex");
      }
    }
    const selection = getSelection();
    if (selection && selection.type !== "None") {
      const ranges = [];
      for (let i = 0; i < selection.rangeCount; i += 1) {
        ranges.push(selection.getRangeAt(i));
      }
      setTimeout(() => {
        if (selection.rangeCount !== ranges.length) return;
        for (let i = 0; i < selection.rangeCount; i += 1) {
          const a = ranges[i];
          const b = selection.getRangeAt(i);
          if (a.commonAncestorContainer !== b.commonAncestorContainer || a.startContainer !== b.startContainer || a.endContainer !== b.endContainer || a.startOffset !== b.startOffset || a.endOffset !== b.endOffset) {
            return;
          }
        }
        selection.removeAllRanges();
      });
    }
  }
}
function create_navigation(current2, intent, url, type, target_scroll = null) {
  let fulfil;
  let reject;
  const complete = new Promise((f, r) => {
    fulfil = f;
    reject = r;
  });
  complete.catch(() => {
  });
  const navigation = (
    /** @type {any} */
    {
      from: {
        params: current2.params,
        route: { id: current2.route?.id ?? null },
        url: current2.url,
        scroll: scroll_state()
      },
      to: url && {
        params: intent?.params ?? null,
        route: { id: intent?.route?.id ?? null },
        url,
        scroll: target_scroll
      },
      willUnload: !intent,
      type,
      complete
    }
  );
  return {
    navigation,
    // @ts-expect-error
    fulfil,
    // @ts-expect-error
    reject
  };
}
function clone_page(page2) {
  return {
    data: page2.data,
    error: page2.error,
    form: page2.form,
    params: page2.params,
    route: page2.route,
    state: page2.state,
    status: page2.status,
    url: page2.url
  };
}
function decode_hash(url) {
  const new_url = new URL(url);
  new_url.hash = decodeURIComponent(url.hash);
  return new_url;
}
function get_id(url) {
  let id;
  if (app.hash) {
    const [, , second] = url.hash.split("#", 3);
    id = second ?? "";
  } else {
    id = url.hash.slice(1);
  }
  return decodeURIComponent(id);
}
export {
  start as a,
  stores as s
};
