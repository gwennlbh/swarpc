import { o as onMount } from "./Day5Ov8X.js";
import { _ as noop, b0 as safe_not_equal, a as state, g as get, b as set } from "./BfvVvcMy.js";
import { b as base64_decode } from "./BqB-gMnm.js";
const subscriber_queue = [];
function writable(value, start = noop) {
  let stop = null;
  const subscribers = /* @__PURE__ */ new Set();
  function set2(new_value) {
    if (safe_not_equal(value, new_value)) {
      value = new_value;
      if (stop) {
        const run_queue = !subscriber_queue.length;
        for (const subscriber of subscribers) {
          subscriber[1]();
          subscriber_queue.push(subscriber, value);
        }
        if (run_queue) {
          for (let i = 0; i < subscriber_queue.length; i += 2) {
            subscriber_queue[i][0](subscriber_queue[i + 1]);
          }
          subscriber_queue.length = 0;
        }
      }
    }
  }
  function update2(fn) {
    set2(fn(
      /** @type {T} */
      value
    ));
  }
  function subscribe(run, invalidate = noop) {
    const subscriber = [run, invalidate];
    subscribers.add(subscriber);
    if (subscribers.size === 1) {
      stop = start(set2, update2) || noop;
    }
    run(
      /** @type {T} */
      value
    );
    return () => {
      subscribers.delete(subscriber);
      if (subscribers.size === 0 && stop) {
        stop();
        stop = null;
      }
    };
  }
  return { set: set2, update: update2, subscribe };
}
new URL("sveltekit-internal://");
function normalize_path(path, trailing_slash) {
  if (path === "/" || trailing_slash === "ignore") return path;
  if (trailing_slash === "never") {
    return path.endsWith("/") ? path.slice(0, -1) : path;
  } else if (trailing_slash === "always" && !path.endsWith("/")) {
    return path + "/";
  }
  return path;
}
function decode_pathname(pathname) {
  return pathname.split("%25").map(decodeURI).join("%25");
}
function decode_params(params) {
  for (const key in params) {
    params[key] = decodeURIComponent(params[key]);
  }
  return params;
}
function strip_hash({ href }) {
  return href.split("#")[0];
}
function make_trackable(url, callback, search_params_callback, allow_hash = false) {
  const tracked = new URL(url);
  Object.defineProperty(tracked, "searchParams", {
    value: new Proxy(tracked.searchParams, {
      get(obj, key) {
        if (key === "get" || key === "getAll" || key === "has") {
          return (param, ...rest) => {
            search_params_callback(param);
            return obj[key](param, ...rest);
          };
        }
        callback();
        const value = Reflect.get(obj, key);
        return typeof value === "function" ? value.bind(obj) : value;
      }
    }),
    enumerable: true,
    configurable: true
  });
  const tracked_url_properties = ["href", "pathname", "search", "toString", "toJSON"];
  if (allow_hash) tracked_url_properties.push("hash");
  for (const property of tracked_url_properties) {
    Object.defineProperty(tracked, property, {
      get() {
        callback();
        return url[property];
      },
      enumerable: true,
      configurable: true
    });
  }
  return tracked;
}
function hash(...values) {
  let hash2 = 5381;
  for (const value of values) {
    if (typeof value === "string") {
      let i = value.length;
      while (i) hash2 = hash2 * 33 ^ value.charCodeAt(--i);
    } else if (ArrayBuffer.isView(value)) {
      const buffer = new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
      let i = buffer.length;
      while (i) hash2 = hash2 * 33 ^ buffer[--i];
    } else {
      throw new TypeError("value must be a string or TypedArray");
    }
  }
  return (hash2 >>> 0).toString(36);
}
const native_fetch = window.fetch;
{
  window.fetch = (input, init) => {
    const method = input instanceof Request ? input.method : init?.method || "GET";
    if (method !== "GET") {
      cache.delete(build_selector(input));
    }
    return native_fetch(input, init);
  };
}
const cache = /* @__PURE__ */ new Map();
function initial_fetch(resource, opts) {
  const selector = build_selector(resource, opts);
  const script = document.querySelector(selector);
  if (script?.textContent) {
    script.remove();
    let { body, ...init } = JSON.parse(script.textContent);
    const ttl = script.getAttribute("data-ttl");
    if (ttl) cache.set(selector, { body, init, ttl: 1e3 * Number(ttl) });
    const b64 = script.getAttribute("data-b64");
    if (b64 !== null) {
      body = base64_decode(body);
    }
    return Promise.resolve(new Response(body, init));
  }
  return window.fetch(resource, opts);
}
function subsequent_fetch(resource, resolved, opts) {
  if (cache.size > 0) {
    const selector = build_selector(resource, opts);
    const cached = cache.get(selector);
    if (cached) {
      if (performance.now() < cached.ttl && ["default", "force-cache", "only-if-cached", void 0].includes(opts?.cache)) {
        return new Response(cached.body, cached.init);
      }
      cache.delete(selector);
    }
  }
  return window.fetch(resolved, opts);
}
function build_selector(resource, opts) {
  const url = JSON.stringify(resource instanceof Request ? resource.url : resource);
  let selector = `script[data-sveltekit-fetched][data-url=${url}]`;
  if (opts?.headers || opts?.body) {
    const values = [];
    if (opts.headers) {
      values.push([...new Headers(opts.headers)].join(","));
    }
    if (opts.body && (typeof opts.body === "string" || ArrayBuffer.isView(opts.body))) {
      values.push(opts.body);
    }
    selector += `[data-hash="${hash(...values)}"]`;
  }
  return selector;
}
const param_pattern = /^(\[)?(\.\.\.)?(\w+)(?:=(\w+))?(\])?$/;
function parse_route_id(id) {
  const params = [];
  const pattern = id === "/" ? /^\/$/ : new RegExp(
    `^${get_route_segments(id).map((segment) => {
      const rest_match = /^\[\.\.\.(\w+)(?:=(\w+))?\]$/.exec(segment);
      if (rest_match) {
        params.push({
          name: rest_match[1],
          matcher: rest_match[2],
          optional: false,
          rest: true,
          chained: true
        });
        return "(?:/([^]*))?";
      }
      const optional_match = /^\[\[(\w+)(?:=(\w+))?\]\]$/.exec(segment);
      if (optional_match) {
        params.push({
          name: optional_match[1],
          matcher: optional_match[2],
          optional: true,
          rest: false,
          chained: true
        });
        return "(?:/([^/]+))?";
      }
      if (!segment) {
        return;
      }
      const parts = segment.split(/\[(.+?)\](?!\])/);
      const result = parts.map((content, i) => {
        if (i % 2) {
          if (content.startsWith("x+")) {
            return escape(String.fromCharCode(parseInt(content.slice(2), 16)));
          }
          if (content.startsWith("u+")) {
            return escape(
              String.fromCharCode(
                ...content.slice(2).split("-").map((code) => parseInt(code, 16))
              )
            );
          }
          const match = (
            /** @type {RegExpExecArray} */
            param_pattern.exec(content)
          );
          const [, is_optional, is_rest, name, matcher] = match;
          params.push({
            name,
            matcher,
            optional: !!is_optional,
            rest: !!is_rest,
            chained: is_rest ? i === 1 && parts[0] === "" : false
          });
          return is_rest ? "([^]*?)" : is_optional ? "([^/]*)?" : "([^/]+?)";
        }
        return escape(content);
      }).join("");
      return "/" + result;
    }).join("")}/?$`
  );
  return { pattern, params };
}
function affects_path(segment) {
  return segment !== "" && !/^\([^)]+\)$/.test(segment);
}
function get_route_segments(route) {
  return route.slice(1).split("/").filter(affects_path);
}
function exec(match, params, matchers) {
  const result = {};
  const values = match.slice(1);
  const values_needing_match = values.filter((value) => value !== void 0);
  let buffered = 0;
  for (let i = 0; i < params.length; i += 1) {
    const param = params[i];
    let value = values[i - buffered];
    if (param.chained && param.rest && buffered) {
      value = values.slice(i - buffered, i + 1).filter((s) => s).join("/");
      buffered = 0;
    }
    if (value === void 0) {
      if (param.rest) {
        value = "";
      } else {
        continue;
      }
    }
    if (!param.matcher || matchers[param.matcher](value)) {
      result[param.name] = value;
      const next_param = params[i + 1];
      const next_value = values[i + 1];
      if (next_param && !next_param.rest && next_param.optional && next_value && param.chained) {
        buffered = 0;
      }
      if (!next_param && !next_value && Object.keys(result).length === values_needing_match.length) {
        buffered = 0;
      }
      continue;
    }
    if (param.optional && param.chained) {
      buffered++;
      continue;
    }
    return;
  }
  if (buffered) return;
  return result;
}
function escape(str) {
  return str.normalize().replace(/[[\]]/g, "\\$&").replace(/%/g, "%25").replace(/\//g, "%2[Ff]").replace(/\?/g, "%3[Ff]").replace(/#/g, "%23").replace(/[.*+?^${}()|\\]/g, "\\$&");
}
const basic_param_pattern = /\[(\[)?(\.\.\.)?(\w+?)(?:=(\w+))?\]\]?/g;
function resolve_route(id, params) {
  const segments = get_route_segments(id);
  const has_id_trailing_slash = id != "/" && id.endsWith("/");
  return "/" + segments.map(
    (segment) => segment.replace(basic_param_pattern, (_, optional, rest, name) => {
      const param_value = params[name];
      if (!param_value) {
        if (optional) return "";
        if (rest && param_value !== void 0) return "";
        throw new Error(`Missing parameter '${name}' in route ${id}`);
      }
      if (param_value.startsWith("/") || param_value.endsWith("/"))
        throw new Error(
          `Parameter '${name}' in route ${id} cannot start or end with a slash -- this would cause an invalid route like foo//bar`
        );
      return param_value;
    })
  ).filter(Boolean).join("/") + (has_id_trailing_slash ? "/" : "");
}
const base = globalThis.__sveltekit_1dficc9?.base ?? "/cigale/_pullrequests/pr-159";
const assets = globalThis.__sveltekit_1dficc9?.assets ?? base ?? "";
const version = "1772417717297";
const SNAPSHOT_KEY = "sveltekit:snapshot";
const SCROLL_KEY = "sveltekit:scroll";
const STATES_KEY = "sveltekit:states";
const PAGE_URL_KEY = "sveltekit:pageurl";
const HISTORY_INDEX = "sveltekit:history";
const NAVIGATION_INDEX = "sveltekit:navigation";
const PRELOAD_PRIORITIES = (
  /** @type {const} */
  {
    tap: 1,
    hover: 2,
    viewport: 3,
    eager: 4,
    off: -1,
    false: -1
  }
);
const origin = location.origin;
function resolve_url(url) {
  if (url instanceof URL) return url;
  let baseURI = document.baseURI;
  if (!baseURI) {
    const baseTags = document.getElementsByTagName("base");
    baseURI = baseTags.length ? baseTags[0].href : document.URL;
  }
  return new URL(url, baseURI);
}
function scroll_state() {
  return {
    x: pageXOffset,
    y: pageYOffset
  };
}
function link_option(element, name) {
  const value = (
    /** @type {ValidLinkOptions<T> | null} */
    element.getAttribute(`data-sveltekit-${name}`)
  );
  return value;
}
const levels = {
  ...PRELOAD_PRIORITIES,
  "": PRELOAD_PRIORITIES.hover
};
function parent_element(element) {
  let parent = element.assignedSlot ?? element.parentNode;
  if (parent?.nodeType === 11) parent = parent.host;
  return (
    /** @type {Element} */
    parent
  );
}
function find_anchor(element, target) {
  while (element && element !== target) {
    if (element.nodeName.toUpperCase() === "A" && element.hasAttribute("href")) {
      return (
        /** @type {HTMLAnchorElement | SVGAElement} */
        element
      );
    }
    element = /** @type {Element} */
    parent_element(element);
  }
}
function get_link_info(a, base2, uses_hash_router) {
  let url;
  try {
    url = new URL(a instanceof SVGAElement ? a.href.baseVal : a.href, document.baseURI);
    if (uses_hash_router && url.hash.match(/^#[^/]/)) {
      const route = location.hash.split("#")[1] || "/";
      url.hash = `#${route}${url.hash}`;
    }
  } catch {
  }
  const target = a instanceof SVGAElement ? a.target.baseVal : a.target;
  const external = !url || !!target || is_external_url(url, base2, uses_hash_router) || (a.getAttribute("rel") || "").split(/\s+/).includes("external");
  const download = url?.origin === origin && a.hasAttribute("download");
  return { url, external, target, download };
}
function get_router_options(element) {
  let keepfocus = null;
  let noscroll = null;
  let preload_code = null;
  let preload_data = null;
  let reload = null;
  let replace_state = null;
  let el = element;
  while (el && el !== document.documentElement) {
    if (preload_code === null) preload_code = link_option(el, "preload-code");
    if (preload_data === null) preload_data = link_option(el, "preload-data");
    if (keepfocus === null) keepfocus = link_option(el, "keepfocus");
    if (noscroll === null) noscroll = link_option(el, "noscroll");
    if (reload === null) reload = link_option(el, "reload");
    if (replace_state === null) replace_state = link_option(el, "replacestate");
    el = /** @type {Element} */
    parent_element(el);
  }
  function get_option_state(value) {
    switch (value) {
      case "":
      case "true":
        return true;
      case "off":
      case "false":
        return false;
      default:
        return void 0;
    }
  }
  return {
    preload_code: levels[preload_code ?? "off"],
    preload_data: levels[preload_data ?? "off"],
    keepfocus: get_option_state(keepfocus),
    noscroll: get_option_state(noscroll),
    reload: get_option_state(reload),
    replace_state: get_option_state(replace_state)
  };
}
function notifiable_store(value) {
  const store = writable(value);
  let ready = true;
  function notify() {
    ready = true;
    store.update((val) => val);
  }
  function set2(new_value) {
    ready = false;
    store.set(new_value);
  }
  function subscribe(run) {
    let old_value;
    return store.subscribe((new_value) => {
      if (old_value === void 0 || ready && new_value !== old_value) {
        run(old_value = new_value);
      }
    });
  }
  return { notify, set: set2, subscribe };
}
const updated_listener = {
  v: () => {
  }
};
function create_updated_store() {
  const { set: set2, subscribe } = writable(false);
  let timeout;
  async function check() {
    clearTimeout(timeout);
    try {
      const res = await fetch(`${assets}/${"_app/version.json"}`, {
        headers: {
          pragma: "no-cache",
          "cache-control": "no-cache"
        }
      });
      if (!res.ok) {
        return false;
      }
      const data = await res.json();
      const updated2 = data.version !== version;
      if (updated2) {
        set2(true);
        updated_listener.v();
        clearTimeout(timeout);
      }
      return updated2;
    } catch {
      return false;
    }
  }
  return {
    subscribe,
    check
  };
}
function is_external_url(url, base2, hash_routing) {
  if (url.origin !== origin || !url.pathname.startsWith(base2)) {
    return true;
  }
  if (hash_routing) {
    return url.pathname !== location.pathname;
  }
  return false;
}
function load_css(deps) {
  return;
}
const valid_layout_exports = /* @__PURE__ */ new Set([
  "load",
  "prerender",
  "csr",
  "ssr",
  "trailingSlash",
  "config"
]);
/* @__PURE__ */ new Set([...valid_layout_exports, "entries"]);
const valid_layout_server_exports = /* @__PURE__ */ new Set([...valid_layout_exports]);
/* @__PURE__ */ new Set([...valid_layout_server_exports, "actions", "entries"]);
let page;
let navigating;
let updated;
const is_legacy = onMount.toString().includes("$$") || /function \w+\(\) \{\}/.test(onMount.toString());
if (is_legacy) {
  page = {
    data: {},
    form: null,
    error: null,
    params: {},
    route: { id: null },
    state: {},
    status: -1,
    url: new URL("https://example.com")
  };
  navigating = { current: null };
  updated = { current: false };
} else {
  page = new class Page {
    #data = state({});
    get data() {
      return get(this.#data);
    }
    set data(value) {
      set(this.#data, value);
    }
    #form = state(null);
    get form() {
      return get(this.#form);
    }
    set form(value) {
      set(this.#form, value);
    }
    #error = state(null);
    get error() {
      return get(this.#error);
    }
    set error(value) {
      set(this.#error, value);
    }
    #params = state({});
    get params() {
      return get(this.#params);
    }
    set params(value) {
      set(this.#params, value);
    }
    #route = state({ id: null });
    get route() {
      return get(this.#route);
    }
    set route(value) {
      set(this.#route, value);
    }
    #state = state({});
    get state() {
      return get(this.#state);
    }
    set state(value) {
      set(this.#state, value);
    }
    #status = state(-1);
    get status() {
      return get(this.#status);
    }
    set status(value) {
      set(this.#status, value);
    }
    #url = state(new URL("https://example.com"));
    get url() {
      return get(this.#url);
    }
    set url(value) {
      set(this.#url, value);
    }
  }();
  navigating = new class Navigating {
    #current = state(null);
    get current() {
      return get(this.#current);
    }
    set current(value) {
      set(this.#current, value);
    }
  }();
  updated = new class Updated {
    #current = state(false);
    get current() {
      return get(this.#current);
    }
    set current(value) {
      set(this.#current, value);
    }
  }();
  updated_listener.v = () => updated.current = true;
}
function update(new_page) {
  Object.assign(page, new_page);
}
export {
  update as A,
  load_css as B,
  HISTORY_INDEX as H,
  NAVIGATION_INDEX as N,
  PAGE_URL_KEY as P,
  STATES_KEY as S,
  parse_route_id as a,
  base as b,
  create_updated_store as c,
  resolve_url as d,
  exec as e,
  find_anchor as f,
  get_link_info as g,
  get_router_options as h,
  is_external_url as i,
  strip_hash as j,
  notifiable_store as k,
  decode_params as l,
  make_trackable as m,
  navigating as n,
  normalize_path as o,
  page as p,
  origin as q,
  resolve_route as r,
  scroll_state as s,
  PRELOAD_PRIORITIES as t,
  decode_pathname as u,
  SNAPSHOT_KEY as v,
  writable as w,
  subsequent_fetch as x,
  initial_fetch as y,
  SCROLL_KEY as z
};
