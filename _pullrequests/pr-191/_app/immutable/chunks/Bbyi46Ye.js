import { C as get$1, F as state, L as writable, P as set$1, T as tick$1, n as onMount$1, t as index_client_exports, w as settled } from "./BPdam01F.js";
import { i as SvelteKitError, n as HttpError, r as Redirect, t as base64_decode } from "./BB6gmSoS.js";
new URL("sveltekit-internal://");
/**
* @param {string} path
* @param {import('types').TrailingSlash} trailing_slash
*/
function normalize_path(path, trailing_slash) {
	if (path === "/" || trailing_slash === "ignore") return path;
	if (trailing_slash === "never") return path.endsWith("/") ? path.slice(0, -1) : path;
	else if (trailing_slash === "always" && !path.endsWith("/")) return path + "/";
	return path;
}
/**
* Decode pathname excluding %25 to prevent further double decoding of params
* @param {string} pathname
*/
function decode_pathname(pathname) {
	return pathname.split("%25").map(decodeURI).join("%25");
}
/** @param {Record<string, string>} params */
function decode_params(params) {
	for (const key in params) params[key] = decodeURIComponent(params[key]);
	return params;
}
/**
* Returns everything up to the first `#` in a URL
* @param {{href: string}} url_like
*/
function strip_hash({ href }) {
	return href.split("#")[0];
}
/**
* @param {URL} url
* @param {() => void} callback
* @param {(search_param: string) => void} search_params_callback
* @param {boolean} [allow_hash]
*/
function make_trackable(url, callback, search_params_callback, allow_hash = false) {
	const tracked = new URL(url);
	Object.defineProperty(tracked, "searchParams", {
		value: new Proxy(tracked.searchParams, { get(obj, key) {
			if (key === "get" || key === "getAll" || key === "has") return (param, ...rest) => {
				search_params_callback(param);
				return obj[key](param, ...rest);
			};
			callback();
			const value = Reflect.get(obj, key);
			return typeof value === "function" ? value.bind(obj) : value;
		} }),
		enumerable: true,
		configurable: true
	});
	/**
	* URL properties that could change during the lifetime of the page,
	* which excludes things like `origin`
	*/
	const tracked_url_properties = [
		"href",
		"pathname",
		"search",
		"toString",
		"toJSON"
	];
	if (allow_hash) tracked_url_properties.push("hash");
	for (const property of tracked_url_properties) Object.defineProperty(tracked, property, {
		get() {
			callback();
			return url[property];
		},
		enumerable: true,
		configurable: true
	});
	return tracked;
}
//#endregion
//#region node_modules/@sveltejs/kit/src/utils/functions.js
function noop() {}
//#endregion
//#region node_modules/@sveltejs/kit/src/utils/hash.js
/**
* Hash using djb2
* @param {import('types').StrictBody[]} values
*/
function hash(...values) {
	let hash = 5381;
	for (const value of values) if (typeof value === "string") {
		let i = value.length;
		while (i) hash = hash * 33 ^ value.charCodeAt(--i);
	} else if (ArrayBuffer.isView(value)) {
		const buffer = new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
		let i = buffer.length;
		while (i) hash = hash * 33 ^ buffer[--i];
	} else throw new TypeError("value must be a string or TypedArray");
	return (hash >>> 0).toString(36);
}
/** @type {typeof fetch} */
var native_fetch = window.fetch;
window.fetch = (input, init) => {
	if ((input instanceof Request ? input.method : init?.method || "GET") !== "GET") cache.delete(build_selector(input));
	return native_fetch(input, init);
};
var cache = /* @__PURE__ */ new Map();
/**
* Should be called on the initial run of load functions that hydrate the page.
* Saves any requests with cache-control max-age to the cache.
* @param {URL | string} resource
* @param {RequestInit} [opts]
*/
function initial_fetch(resource, opts) {
	const selector = build_selector(resource, opts);
	const script = document.querySelector(selector);
	if (script?.textContent) {
		script.remove();
		let { body, ...init } = JSON.parse(script.textContent);
		const ttl = script.getAttribute("data-ttl");
		if (ttl) cache.set(selector, {
			body,
			init,
			ttl: 1e3 * Number(ttl)
		});
		if (script.getAttribute("data-b64") !== null) body = base64_decode(body);
		return Promise.resolve(new Response(body, init));
	}
	return window.fetch(resource, opts);
}
/**
* Tries to get the response from the cache, if max-age allows it, else does a fetch.
* @param {URL | string} resource
* @param {string} resolved
* @param {RequestInit} [opts]
*/
function subsequent_fetch(resource, resolved, opts) {
	if (cache.size > 0) {
		const selector = build_selector(resource, opts);
		const cached = cache.get(selector);
		if (cached) {
			if (performance.now() < cached.ttl && [
				"default",
				"force-cache",
				"only-if-cached",
				void 0
			].includes(opts?.cache)) return new Response(cached.body, cached.init);
			cache.delete(selector);
		}
	}
	return window.fetch(resolved, opts);
}
/**
* Build the cache key for a given request
* @param {URL | RequestInfo} resource
* @param {RequestInit} [opts]
*/
function build_selector(resource, opts) {
	let selector = `script[data-sveltekit-fetched][data-url=${JSON.stringify(resource instanceof Request ? resource.url : resource)}]`;
	if (opts?.headers || opts?.body) {
		/** @type {import('types').StrictBody[]} */
		const values = [];
		if (opts.headers) values.push([...new Headers(opts.headers)].join(","));
		if (opts.body && (typeof opts.body === "string" || ArrayBuffer.isView(opts.body))) values.push(opts.body);
		selector += `[data-hash="${hash(...values)}"]`;
	}
	return selector;
}
//#endregion
//#region node_modules/@sveltejs/kit/src/utils/routing.js
var param_pattern = /^(\[)?(\.\.\.)?(\w+)(?:=(\w+))?(\])?$/;
/**
* Creates the regex pattern, extracts parameter names, and generates types for a route
* @param {string} id
*/
function parse_route_id(id) {
	/** @type {import('types').RouteParam[]} */
	const params = [];
	return {
		pattern: id === "/" ? /^\/$/ : new RegExp(`^${get_route_segments(id).map((segment) => {
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
			if (!segment) return;
			const parts = segment.split(/\[(.+?)\](?!\])/);
			return "/" + parts.map((content, i) => {
				if (i % 2) {
					if (content.startsWith("x+")) return escape(String.fromCharCode(parseInt(content.slice(2), 16)));
					if (content.startsWith("u+")) return escape(String.fromCharCode(...content.slice(2).split("-").map((code) => parseInt(code, 16))));
					const [, is_optional, is_rest, name, matcher] = param_pattern.exec(content);
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
		}).join("")}/?$`),
		params
	};
}
/**
* Returns `false` for `(group)` segments
* @param {string} segment
*/
function affects_path(segment) {
	return segment !== "" && !/^\([^)]+\)$/.test(segment);
}
/**
* Splits a route id into its segments, removing segments that
* don't affect the path (i.e. groups). The root route is represented by `/`
* and will be returned as `['']`.
* @param {string} route
* @returns string[]
*/
function get_route_segments(route) {
	return route.slice(1).split("/").filter(affects_path);
}
/**
* @param {RegExpMatchArray} match
* @param {import('types').RouteParam[]} params
* @param {Record<string, import('@sveltejs/kit').ParamMatcher>} matchers
*/
function exec(match, params, matchers) {
	/** @type {Record<string, string>} */
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
		if (value === void 0) if (param.rest) value = "";
		else continue;
		if (!param.matcher || matchers[param.matcher](value)) {
			result[param.name] = value;
			const next_param = params[i + 1];
			const next_value = values[i + 1];
			if (next_param && !next_param.rest && next_param.optional && next_value && param.chained) buffered = 0;
			if (!next_param && !next_value && Object.keys(result).length === values_needing_match.length) buffered = 0;
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
/** @param {string} str */
function escape(str) {
	return str.normalize().replace(/[[\]]/g, "\\$&").replace(/%/g, "%25").replace(/\//g, "%2[Ff]").replace(/\?/g, "%3[Ff]").replace(/#/g, "%23").replace(/[.*+?^${}()|\\]/g, "\\$&");
}
var basic_param_pattern = /\[(\[)?(\.\.\.)?(\w+?)(?:=(\w+))?\]\]?/g;
/**
* Populate a route ID with params to resolve a pathname.
* @example
* ```js
* resolveRoute(
*   `/blog/[slug]/[...somethingElse]`,
*   {
*     slug: 'hello-world',
*     somethingElse: 'something/else'
*   }
* ); // `/blog/hello-world/something/else`
* ```
* @param {string} id
* @param {Record<string, string | undefined>} params
* @returns {string}
*/
function resolve_route(id, params) {
	const segments = get_route_segments(id);
	const has_id_trailing_slash = id != "/" && id.endsWith("/");
	return "/" + segments.map((segment) => segment.replace(basic_param_pattern, (_, optional, rest, name) => {
		const param_value = params[name];
		if (!param_value) {
			if (optional) return "";
			if (rest && param_value !== void 0) return "";
			throw new Error(`Missing parameter '${name}' in route ${id}`);
		}
		if (param_value.startsWith("/") || param_value.endsWith("/")) throw new Error(`Parameter '${name}' in route ${id} cannot start or end with a slash -- this would cause an invalid route like foo//bar`);
		return param_value;
	})).filter(Boolean).join("/") + (has_id_trailing_slash ? "/" : "");
}
//#endregion
//#region node_modules/@sveltejs/kit/src/runtime/client/parse.js
/**
* @param {import('./types.js').SvelteKitApp} app
* @returns {import('types').CSRRoute[]}
*/
function parse({ nodes, server_loads, dictionary, matchers }) {
	const layouts_with_server_load = new Set(server_loads);
	return Object.entries(dictionary).map(([id, [leaf, layouts, errors]]) => {
		const { pattern, params } = parse_route_id(id);
		/** @type {import('types').CSRRoute} */
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
		route.errors.length = route.layouts.length = Math.max(route.errors.length, route.layouts.length);
		return route;
	});
	/**
	* @param {number} id
	* @returns {[boolean, import('types').CSRPageNodeLoader]}
	*/
	function create_leaf_loader(id) {
		const uses_server_data = id < 0;
		if (uses_server_data) id = ~id;
		return [uses_server_data, nodes[id]];
	}
	/**
	* @param {number | undefined} id
	* @returns {[boolean, import('types').CSRPageNodeLoader] | undefined}
	*/
	function create_layout_loader(id) {
		return id === void 0 ? id : [layouts_with_server_load.has(id), nodes[id]];
	}
}
//#endregion
//#region node_modules/@sveltejs/kit/src/runtime/client/session-storage.js
/**
* Read a value from `sessionStorage`
* @param {string} key
* @param {(value: string) => any} parse
*/
/* @__NO_SIDE_EFFECTS__ */
function get(key, parse = JSON.parse) {
	try {
		return parse(sessionStorage[key]);
	} catch {}
}
/**
* Write a value to `sessionStorage`
* @param {string} key
* @param {any} value
* @param {(value: any) => string} stringify
*/
function set(key, value, stringify = JSON.stringify) {
	const data = stringify(value);
	try {
		sessionStorage[key] = data;
	} catch {}
}
//#endregion
//#region node_modules/@sveltejs/kit/src/runtime/app/paths/internal/client.js
var base = globalThis.__sveltekit_1p987zt?.base ?? "/cigale/_pullrequests/pr-191";
var assets = globalThis.__sveltekit_1p987zt?.assets ?? base ?? "";
//#endregion
//#region node_modules/@sveltejs/kit/src/runtime/app/paths/client.js
/** @import { Asset, RouteId, RouteIdWithSearchOrHash, Pathname, PathnameWithSearchOrHash, ResolvedPathname } from '$app/types' */
/** @import { ResolveArgs } from './types.js' */
var pathname_prefix = "";
/**
* Resolve a pathname by prefixing it with the base path, if any, or resolve a route ID by populating dynamic segments with parameters.
*
* During server rendering, the base path is relative and depends on the page currently being rendered.
*
* @example
* ```js
* import { resolve } from '$app/paths';
*
* // using a pathname
* const resolved = resolve(`/blog/hello-world`);
*
* // using a route ID plus parameters
* const resolved = resolve('/blog/[slug]', {
* 	slug: 'hello-world'
* });
* ```
* @since 2.26
*
* @template {RouteIdWithSearchOrHash | PathnameWithSearchOrHash} T
* @param {ResolveArgs<T>} args
* @returns {ResolvedPathname}
*/
function resolve(...args) {
	if (!args[0].startsWith("/")) throw new Error(`Cannot use \`resolve(...)\` with a non-absolute pathname or route ID (got "${args[0]}"). \`resolve\` is only for internal pathnames and route IDs; external URLs should be used directly.`);
	return base + pathname_prefix + resolve_route(args[0], args[1]);
}
//#endregion
//#region \0virtual:__sveltekit/environment
var version = "1777294051670";
//#endregion
//#region node_modules/@sveltejs/kit/src/runtime/client/constants.js
var SNAPSHOT_KEY = "sveltekit:snapshot";
var SCROLL_KEY = "sveltekit:scroll";
var STATES_KEY = "sveltekit:states";
var HISTORY_INDEX = "sveltekit:history";
var NAVIGATION_INDEX = "sveltekit:navigation";
var PRELOAD_PRIORITIES = {
	tap: 1,
	hover: 2,
	viewport: 3,
	eager: 4,
	off: -1,
	false: -1
};
//#endregion
//#region node_modules/@sveltejs/kit/src/runtime/client/utils.js
var origin = location.origin;
/** @param {string | URL} url */
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
/**
* @template {LinkOptionName} T
* @typedef {typeof valid_link_options[T][number]} ValidLinkOptions
*/
/**
* @template {LinkOptionName} T
* @param {Element} element
* @param {T} name
*/
function link_option(element, name) {
	return element.getAttribute(`data-sveltekit-${name}`);
}
var levels = {
	...PRELOAD_PRIORITIES,
	"": PRELOAD_PRIORITIES.hover
};
/**
* @param {Element} element
* @returns {Element | null}
*/
function parent_element(element) {
	let parent = element.assignedSlot ?? element.parentNode;
	if (parent?.nodeType === 11) parent = parent.host;
	return parent;
}
/**
* @param {Element} element
* @param {Element} target
*/
function find_anchor(element, target) {
	while (element && element !== target) {
		if (element.nodeName.toUpperCase() === "A" && element.hasAttribute("href")) return element;
		element = parent_element(element);
	}
}
/**
* @param {HTMLAnchorElement | SVGAElement} a
* @param {string} base
* @param {boolean} uses_hash_router
*/
function get_link_info(a, base, uses_hash_router) {
	/** @type {URL | undefined} */
	let url;
	try {
		url = new URL(a instanceof SVGAElement ? a.href.baseVal : a.href, document.baseURI);
		if (uses_hash_router && url.hash.match(/^#[^/]/)) {
			const route = location.hash.split("#")[1] || "/";
			url.hash = `#${route}${url.hash}`;
		}
	} catch {}
	const target = a instanceof SVGAElement ? a.target.baseVal : a.target;
	const external = !url || !!target || is_external_url(url, base, uses_hash_router) || (a.getAttribute("rel") || "").split(/\s+/).includes("external");
	const download = url?.origin === origin && a.hasAttribute("download");
	return {
		url,
		external,
		target,
		download
	};
}
/**
* @param {HTMLFormElement | HTMLAnchorElement | SVGAElement} element
*/
function get_router_options(element) {
	/** @type {ValidLinkOptions<'keepfocus'> | null} */
	let keepfocus = null;
	/** @type {ValidLinkOptions<'noscroll'> | null} */
	let noscroll = null;
	/** @type {ValidLinkOptions<'preload-code'> | null} */
	let preload_code = null;
	/** @type {ValidLinkOptions<'preload-data'> | null} */
	let preload_data = null;
	/** @type {ValidLinkOptions<'reload'> | null} */
	let reload = null;
	/** @type {ValidLinkOptions<'replacestate'> | null} */
	let replace_state = null;
	/** @type {Element} */
	let el = element;
	while (el && el !== document.documentElement) {
		if (preload_code === null) preload_code = link_option(el, "preload-code");
		if (preload_data === null) preload_data = link_option(el, "preload-data");
		if (keepfocus === null) keepfocus = link_option(el, "keepfocus");
		if (noscroll === null) noscroll = link_option(el, "noscroll");
		if (reload === null) reload = link_option(el, "reload");
		if (replace_state === null) replace_state = link_option(el, "replacestate");
		el = parent_element(el);
	}
	/** @param {string | null} value */
	function get_option_state(value) {
		switch (value) {
			case "":
			case "true": return true;
			case "off":
			case "false": return false;
			default: return;
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
/** @param {any} value */
function notifiable_store(value) {
	const store = writable(value);
	let ready = true;
	function notify() {
		ready = true;
		store.update((val) => val);
	}
	/** @param {any} new_value */
	function set(new_value) {
		ready = false;
		store.set(new_value);
	}
	/** @param {(value: any) => void} run */
	function subscribe(run) {
		/** @type {any} */
		let old_value;
		return store.subscribe((new_value) => {
			if (old_value === void 0 || ready && new_value !== old_value) run(old_value = new_value);
		});
	}
	return {
		notify,
		set,
		subscribe
	};
}
var updated_listener = { v: noop };
function create_updated_store() {
	const { set, subscribe } = writable(false);
	/** @type {NodeJS.Timeout} */
	let timeout;
	/** @type {() => Promise<boolean>} */
	async function check() {
		clearTimeout(timeout);
		try {
			const res = await fetch(`${assets}/_app/version.json`, { headers: {
				pragma: "no-cache",
				"cache-control": "no-cache"
			} });
			if (!res.ok) return false;
			const updated = (await res.json()).version !== version;
			if (updated) {
				set(true);
				updated_listener.v();
				clearTimeout(timeout);
			}
			return updated;
		} catch {
			return false;
		}
	}
	return {
		subscribe,
		check
	};
}
/**
* Is external if
* - origin different
* - path doesn't start with base
* - uses hash router and pathname is more than base
* @param {URL} url
* @param {string} base
* @param {boolean} hash_routing
*/
function is_external_url(url, base, hash_routing) {
	if (url.origin !== origin || !url.pathname.startsWith(base)) return true;
	if (hash_routing) return url.pathname !== location.pathname;
	return false;
}
/**
* Used for server-side resolution, to replicate Vite's CSS loading behaviour in production.
*
* Closely modelled after https://github.com/vitejs/vite/blob/3dd12f4724130fdf8ba44c6d3252ebdff407fd47/packages/vite/src/node/plugins/importAnalysisBuild.ts#L214
* (which ideally we could just use directly, but it's not exported)
* @param {string[]} deps
*/
function load_css(deps) {}
//#endregion
//#region node_modules/@sveltejs/kit/src/utils/exports.js
/**
* @param {Set<string>} expected
*/
function validator(expected) {
	/**
	* @param {any} module
	* @param {string} [file]
	*/
	function validate(module, file) {
		if (!module) return;
		for (const key in module) {
			if (key[0] === "_" || expected.has(key)) continue;
			const values = [...expected.values()];
			const hint = hint_for_supported_files(key, file?.slice(file.lastIndexOf("."))) ?? `valid exports are ${values.join(", ")}, or anything with a '_' prefix`;
			throw new Error(`Invalid export '${key}'${file ? ` in ${file}` : ""} (${hint})`);
		}
	}
	return validate;
}
/**
* @param {string} key
* @param {string} ext
* @returns {string | void}
*/
function hint_for_supported_files(key, ext = ".js") {
	const supported_files = [];
	if (valid_layout_exports.has(key)) supported_files.push(`+layout${ext}`);
	if (valid_page_exports.has(key)) supported_files.push(`+page${ext}`);
	if (valid_layout_server_exports.has(key)) supported_files.push(`+layout.server${ext}`);
	if (valid_page_server_exports.has(key)) supported_files.push(`+page.server${ext}`);
	if (valid_server_exports.has(key)) supported_files.push(`+server${ext}`);
	if (supported_files.length > 0) return `'${key}' is a valid export in ${supported_files.slice(0, -1).join(", ")}${supported_files.length > 1 ? " or " : ""}${supported_files.at(-1)}`;
}
var valid_layout_exports = new Set([
	"load",
	"prerender",
	"csr",
	"ssr",
	"trailingSlash",
	"config"
]);
var valid_page_exports = new Set([...valid_layout_exports, "entries"]);
var valid_layout_server_exports = new Set([...valid_layout_exports]);
var valid_page_server_exports = new Set([
	...valid_layout_server_exports,
	"actions",
	"entries"
]);
var valid_server_exports = new Set([
	"GET",
	"POST",
	"PATCH",
	"PUT",
	"DELETE",
	"OPTIONS",
	"HEAD",
	"fallback",
	"prerender",
	"trailingSlash",
	"config",
	"entries"
]);
validator(valid_layout_exports);
validator(valid_page_exports);
validator(valid_layout_server_exports);
validator(valid_page_server_exports);
validator(valid_server_exports);
//#endregion
//#region node_modules/@sveltejs/kit/src/utils/array.js
/**
* Removes nullish values from an array.
*
* @template T
* @param {Array<T>} arr
*/
function compact(arr) {
	return arr.filter(
		/** @returns {val is NonNullable<T>} */
		(val) => val != null
	);
}
//#endregion
//#region node_modules/@sveltejs/kit/src/utils/error.js
/**
* @param {unknown} error
*/
function get_status(error) {
	return error instanceof HttpError || error instanceof SvelteKitError ? error.status : 500;
}
/**
* @param {unknown} error
*/
function get_message(error) {
	return error instanceof SvelteKitError ? error.text : "Internal Error";
}
//#endregion
//#region node_modules/@sveltejs/kit/src/runtime/client/state.svelte.js
var page;
var navigating;
var updated;
var is_legacy = onMount$1.toString().includes("$$") || /function \w+\(\) \{\}/.test(onMount$1.toString());
var placeholder_url = "a:";
if (is_legacy) {
	page = {
		data: {},
		form: null,
		error: null,
		params: {},
		route: { id: null },
		state: {},
		status: -1,
		url: new URL(placeholder_url)
	};
	navigating = { current: null };
	updated = { current: false };
} else {
	page = new class Page {
		#data = state({});
		get data() {
			return get$1(this.#data);
		}
		set data(value) {
			set$1(this.#data, value);
		}
		#form = state(null);
		get form() {
			return get$1(this.#form);
		}
		set form(value) {
			set$1(this.#form, value);
		}
		#error = state(null);
		get error() {
			return get$1(this.#error);
		}
		set error(value) {
			set$1(this.#error, value);
		}
		#params = state({});
		get params() {
			return get$1(this.#params);
		}
		set params(value) {
			set$1(this.#params, value);
		}
		#route = state({ id: null });
		get route() {
			return get$1(this.#route);
		}
		set route(value) {
			set$1(this.#route, value);
		}
		#state = state({});
		get state() {
			return get$1(this.#state);
		}
		set state(value) {
			set$1(this.#state, value);
		}
		#status = state(-1);
		get status() {
			return get$1(this.#status);
		}
		set status(value) {
			set$1(this.#status, value);
		}
		#url = state(new URL(placeholder_url));
		get url() {
			return get$1(this.#url);
		}
		set url(value) {
			set$1(this.#url, value);
		}
	}();
	navigating = new class Navigating {
		#current = state(null);
		get current() {
			return get$1(this.#current);
		}
		set current(value) {
			set$1(this.#current, value);
		}
	}();
	updated = new class Updated {
		#current = state(false);
		get current() {
			return get$1(this.#current);
		}
		set current(value) {
			set$1(this.#current, value);
		}
	}();
	updated_listener.v = () => updated.current = true;
}
function update(new_page) {
	Object.assign(page, new_page);
}
//#endregion
//#region node_modules/@sveltejs/kit/src/runtime/telemetry/noop.js
/**
* @type {Span}
*/
var noop_span = {
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
/**
* @type {SpanContext}
*/
var noop_span_context = {
	traceId: "",
	spanId: "",
	traceFlags: 0
};
//#endregion
//#region node_modules/@sveltejs/kit/src/runtime/client/client.js
/** @import { RemoteQueryCacheEntry } from './remote-functions/query.svelte.js' */
var { onMount, tick } = index_client_exports;
var ICON_REL_ATTRIBUTES = new Set([
	"icon",
	"shortcut icon",
	"apple-touch-icon"
]);
/**
* Set via transformError, reset and read at the end of navigate.
* Necessary because a navigation might succeed loading but during rendering
* an error occurs, at which point the navigation result needs to be overridden with the error result.
* TODO this is all very hacky, rethink for SvelteKit 3 where we can assume Svelte 5 and do an overhaul of client.js
* @type {{ error: App.Error, status: number } | null}
*/
var rendering_error = null;
/**
* history index -> { x, y }
* @type {Record<number, { x: number; y: number }>}
*/
var scroll_positions = /* @__PURE__ */ get("sveltekit:scroll") ?? {};
/**
* navigation index -> any
* @type {Record<string, any[]>}
*/
var snapshots = /* @__PURE__ */ get("sveltekit:snapshot") ?? {};
var stores = {
	url: /* @__PURE__ */ notifiable_store({}),
	page: /* @__PURE__ */ notifiable_store({}),
	navigating: /* @__PURE__ */ writable(null),
	updated: /* @__PURE__ */ create_updated_store()
};
/** @param {number} index */
function update_scroll_positions(index) {
	scroll_positions[index] = scroll_state();
}
/**
* @param {number} current_history_index
* @param {number} current_navigation_index
*/
function clear_onward_history(current_history_index, current_navigation_index) {
	let i = current_history_index + 1;
	while (scroll_positions[i]) {
		delete scroll_positions[i];
		i += 1;
	}
	i = current_navigation_index + 1;
	while (snapshots[i]) {
		delete snapshots[i];
		i += 1;
	}
}
/**
* Loads `href` the old-fashioned way, with a full page reload.
* Returns a `Promise` that never resolves (to prevent any
* subsequent work, e.g. history manipulation, from happening)
* @param {URL} url
* @param {boolean} [replace] If `true`, will replace the current `history` entry rather than creating a new one with `pushState`
*/
function native_navigation(url, replace = false) {
	if (replace) location.replace(url.href);
	else location.href = url.href;
	return new Promise(noop);
}
/**
* Checks whether a service worker is registered, and if it is,
* tries to update it.
*/
async function update_service_worker() {
	if ("serviceWorker" in navigator) {
		const registration = await navigator.serviceWorker.getRegistration(base || "/");
		if (registration) await registration.update();
	}
}
/** @type {import('types').CSRRoute[]} All routes of the app. Only available when kit.router.resolution=client */
var routes;
/** @type {import('types').CSRPageNodeLoader} */
var default_layout_loader;
/** @type {import('types').CSRPageNodeLoader} */
var default_error_loader;
/** @type {HTMLElement} */
var container;
/** @type {HTMLElement} */
var target;
/** @type {import('./types.js').SvelteKitApp} */
var app;
/** @type {Array<((url: URL) => boolean)>} */
var invalidated = [];
/**
* An array of the `+layout.svelte` and `+page.svelte` component instances
* that currently live on the page — used for capturing and restoring snapshots.
* It's updated/manipulated through `bind:this` in `Root.svelte`.
* @type {import('svelte').SvelteComponent[]}
*/
var components = [];
/** @type {{id: string, token: {}, promise: Promise<import('./types.js').NavigationResult>, fork: Promise<import('svelte').Fork | null> | null} | null} */
var load_cache = null;
function discard_load_cache() {
	load_cache?.fork?.then((f) => f?.discard());
	load_cache = null;
}
/**
* @type {Map<string, Promise<URL>>}
* Cache for client-side rerouting, since it could contain async calls which we want to
* avoid running multiple times which would slow down navigations (e.g. else preloading
* wouldn't help because on navigation it would be called again). Since `reroute` should be
* a pure function (i.e. always return the same) value it's safe to cache across navigations.
* The server reroute calls don't need to be cached because they are called using `import(...)`
* which is cached per the JS spec.
*/
var reroute_cache = /* @__PURE__ */ new Map();
/**
* Note on before_navigate_callbacks, on_navigate_callbacks and after_navigate_callbacks:
* do not re-assign as some closures keep references to these Sets
*/
/** @type {Set<(navigation: import('@sveltejs/kit').BeforeNavigate) => void>} */
var before_navigate_callbacks = /* @__PURE__ */ new Set();
/** @type {Set<(navigation: import('@sveltejs/kit').OnNavigate) => import('types').MaybePromise<(() => void) | void>>} */
var on_navigate_callbacks = /* @__PURE__ */ new Set();
/** @type {Set<(navigation: import('@sveltejs/kit').AfterNavigate) => void>} */
var after_navigate_callbacks = /* @__PURE__ */ new Set();
/** @type {import('./types.js').NavigationState & { nav: import('@sveltejs/kit').NavigationEvent }} */
var current = {
	branch: [],
	error: null,
	url: null,
	nav: null
};
/** this being true means we SSR'd */
var hydrated = false;
var started = false;
var autoscroll = true;
var is_navigating = false;
var hash_navigating = false;
/** True as soon as there happened one client-side navigation (excluding the SvelteKit-initialized initial one when in SPA mode) */
var has_navigated = false;
var force_invalidation = false;
/** @type {import('svelte').SvelteComponent} */
var root;
/** @type {number} keeping track of the history index in order to prevent popstate navigation events if needed */
var current_history_index;
/** @type {number} */
var current_navigation_index;
/** @type {{}} */
var token;
/**
* A set of tokens which are associated to current preloads.
* If a preload becomes a real navigation, it's removed from the set.
* If a preload token is in the set and the preload errors, the error
* handling logic (for example reloading) is skipped.
*/
var preload_tokens = /* @__PURE__ */ new Set();
/**
* @type {Map<string, Map<string, RemoteQueryCacheEntry<any>>>}
* A map of query id -> payload -> query internals for all active queries.
*/
var query_map = /* @__PURE__ */ new Map();
/**
* @param {import('./types.js').SvelteKitApp} _app
* @param {HTMLElement} _target
* @param {Parameters<typeof _hydrate>[1]} [hydrate]
*/
async function start(_app, _target, hydrate) {
	if (globalThis.__sveltekit_1p987zt) {
		globalThis.__sveltekit_1p987zt.query;
		globalThis.__sveltekit_1p987zt.prerender;
	}
	if (document.URL !== location.href) location.href = location.href;
	app = _app;
	await _app.hooks.init?.();
	routes = parse(_app);
	container = document.documentElement;
	target = _target;
	default_layout_loader = _app.nodes[0];
	default_error_loader = _app.nodes[1];
	default_layout_loader();
	default_error_loader();
	current_history_index = history.state?.[HISTORY_INDEX];
	current_navigation_index = history.state?.[NAVIGATION_INDEX];
	if (!current_history_index) {
		current_history_index = current_navigation_index = Date.now();
		history.replaceState({
			...history.state,
			[HISTORY_INDEX]: current_history_index,
			[NAVIGATION_INDEX]: current_navigation_index
		}, "");
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
/** @param {number} index */
function capture_snapshot(index) {
	if (components.some((c) => c?.snapshot)) snapshots[index] = components.map((c) => c?.snapshot?.capture());
}
/** @param {number} index */
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
/**
* @param {string | URL} url
* @param {{ replaceState?: boolean; noScroll?: boolean; keepFocus?: boolean; invalidateAll?: boolean; invalidate?: Array<string | URL | ((url: URL) => boolean)>; state?: Record<string, any> }} options
* @param {number} redirect_count
* @param {{}} [nav_token]
*/
async function _goto(url, options, redirect_count, nav_token) {
	/** @type {string[]} */
	let query_keys;
	if (options.invalidateAll) discard_load_cache();
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
				query_keys = [];
				query_map.forEach((entries, id) => {
					for (const payload of entries.keys()) query_keys.push(id + "/" + payload);
				});
			}
			if (options.invalidate) options.invalidate.forEach(push_invalidated);
		}
	});
	if (options.invalidateAll) tick$1().then(tick$1).then(() => {
		query_map.forEach((entries, id) => {
			entries.forEach(({ resource }, payload) => {
				if (query_keys?.includes(id + "/" + payload)) resource.refresh?.();
			});
		});
	});
}
/** @param {import('./types.js').NavigationIntent} intent */
async function _preload_data(intent) {
	if (intent.id !== load_cache?.id) {
		discard_load_cache();
		const preload = {};
		preload_tokens.add(preload);
		load_cache = {
			id: intent.id,
			token: preload,
			promise: load_route({
				...intent,
				preload
			}).then((result) => {
				preload_tokens.delete(preload);
				if (result.type === "loaded" && result.state.error) discard_load_cache();
				return result;
			}),
			fork: null
		};
	}
	return load_cache.promise;
}
/**
* @param {URL} url
* @returns {Promise<void>}
*/
async function _preload_code(url) {
	const route = (await get_navigation_intent(url, false))?.route;
	if (route) await Promise.all(
		/** @type {[has_server_load: boolean, node_loader: import('types').CSRPageNodeLoader][]} */
		[...route.layouts, route.leaf].filter(Boolean).map((load) => load[1]())
	);
}
/**
* @param {import('./types.js').NavigationFinished} result
* @param {HTMLElement} target
* @param {boolean} hydrate
*/
async function initialize(result, target, hydrate) {
	/** @type {import('@sveltejs/kit').NavigationEvent} */
	const nav = {
		params: current.params,
		route: { id: current.route?.id ?? null },
		url: new URL(location.href)
	};
	current = {
		...result.state,
		nav
	};
	const style = document.querySelector("style[data-sveltekit]");
	if (style) style.remove();
	Object.assign(page, result.props.page);
	root = new app.root({
		target,
		props: {
			...result.props,
			stores,
			components
		},
		hydrate,
		sync: false,
		transformError: void 0
	});
	await Promise.resolve();
	restore_snapshot(current_navigation_index);
	if (hydrate) {
		/** @type {import('@sveltejs/kit').AfterNavigate} */
		const navigation = {
			from: null,
			to: {
				...nav,
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
/**
*
* @param {{
*   url: URL;
*   params: Record<string, string>;
*   branch: Array<import('./types.js').BranchNode | undefined>;
*   errors?: Array<import('types').CSRPageNodeLoader | undefined>;
*   status: number;
*   error: App.Error | null;
*   route: import('types').CSRRoute | null;
*   form?: Record<string, any> | null;
* }} opts
*/
async function get_navigation_result_from_branch({ url, params, branch, errors, status, error, route, form }) {
	/** @type {import('types').TrailingSlash} */
	let slash = "never";
	if (base && (url.pathname === base || url.pathname === base + "/")) slash = "always";
	else for (const node of branch) if (node?.slash !== void 0) slash = node.slash;
	url.pathname = normalize_path(url.pathname, slash);
	url.search = url.search;
	/** @type {import('./types.js').NavigationFinished} */
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
			constructors: compact(branch).map((branch_node) => branch_node.node.component),
			page: clone_page(page)
		}
	};
	if (form !== void 0) result.props.form = form;
	let data = {};
	let data_changed = !page;
	let p = 0;
	for (let i = 0; i < Math.max(branch.length, current.branch.length); i += 1) {
		const node = branch[i];
		const prev = current.branch[i];
		if (node?.data !== prev?.data) data_changed = true;
		if (!node) continue;
		data = {
			...data,
			...node.data
		};
		if (data_changed) result.props[`data_${p}`] = data;
		p += 1;
	}
	if (!current.url || url.href !== current.url.href || current.error !== error || form !== void 0 && form !== page.form || data_changed) result.props.page = {
		error,
		params,
		route: { id: route?.id ?? null },
		state: {},
		status,
		url: new URL(url),
		form: form ?? null,
		data: data_changed ? data : page.data
	};
	return result;
}
/**
* Call the universal load function of the given node, if it exists.
*
* @param {{
*   loader: import('types').CSRPageNodeLoader;
* 	 parent: () => Promise<Record<string, any>>;
*   url: URL;
*   params: Record<string, string>;
*   route: { id: string | null };
* 	 server_data_node: import('./types.js').DataNode | null;
* }} options
* @returns {Promise<import('./types.js').BranchNode>}
*/
async function load_node({ loader, parent, url, params, route, server_data_node }) {
	/** @type {Record<string, any> | null} */
	let data = null;
	let is_tracking = true;
	/** @type {import('types').Uses} */
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
		/** @param {string[]} deps */
		function depends(...deps) {
			for (const dep of deps) {
				const { href } = new URL(dep, url);
				uses.dependencies.add(href);
			}
		}
		/** @type {import('@sveltejs/kit').LoadEvent} */
		const load_input = {
			tracing: {
				enabled: false,
				root: noop_span,
				current: noop_span
			},
			route: new Proxy(route, { get: (target, key) => {
				if (is_tracking) uses.route = true;
				return target[key];
			} }),
			params: new Proxy(params, { get: (target, key) => {
				if (is_tracking) uses.params.add(key);
				return target[key];
			} }),
			data: server_data_node?.data ?? null,
			url: make_trackable(url, () => {
				if (is_tracking) uses.url = true;
			}, (param) => {
				if (is_tracking) uses.search_params.add(param);
			}, app.hash),
			async fetch(resource, init) {
				if (resource instanceof Request) init = {
					body: resource.method === "GET" || resource.method === "HEAD" ? void 0 : await resource.blob(),
					cache: resource.cache,
					credentials: resource.credentials,
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
				const { resolved, promise } = resolve_fetch_url(resource, init, url);
				if (is_tracking) depends(resolved.href);
				return promise;
			},
			setHeaders: noop,
			depends,
			parent() {
				if (is_tracking) uses.parent = true;
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
		data = await node.universal.load.call(null, load_input) ?? null;
	}
	return {
		node,
		loader,
		server: server_data_node,
		universal: node.universal?.load ? {
			type: "data",
			data,
			uses
		} : null,
		data: data ?? server_data_node?.data ?? null,
		slash: node.universal?.trailingSlash ?? server_data_node?.slash
	};
}
/**
* @param {Request | string | URL} input
* @param {RequestInit | undefined} init
* @param {URL} url
*/
function resolve_fetch_url(input, init, url) {
	let requested = input instanceof Request ? input.url : input;
	const resolved = new URL(requested, url);
	if (resolved.origin === url.origin) requested = resolved.href.slice(url.origin.length);
	return {
		resolved,
		promise: started ? subsequent_fetch(requested, resolved.href, init) : initial_fetch(requested, init)
	};
}
/**
* @param {boolean} parent_changed
* @param {boolean} route_changed
* @param {boolean} url_changed
* @param {Set<string>} search_params_changed
* @param {import('types').Uses | undefined} uses
* @param {Record<string, string>} params
*/
function has_changed(parent_changed, route_changed, url_changed, search_params_changed, uses, params) {
	if (force_invalidation) return true;
	if (!uses) return false;
	if (uses.parent && parent_changed) return true;
	if (uses.route && route_changed) return true;
	if (uses.url && url_changed) return true;
	for (const tracked_params of uses.search_params) if (search_params_changed.has(tracked_params)) return true;
	for (const param of uses.params) if (params[param] !== current.params[param]) return true;
	for (const href of uses.dependencies) if (invalidated.some((fn) => fn(new URL(href)))) return true;
	return false;
}
/**
* @param {import('types').ServerDataNode | import('types').ServerDataSkippedNode | null} node
* @param {import('./types.js').DataNode | null} [previous]
* @returns {import('./types.js').DataNode | null}
*/
function create_data_node(node, previous) {
	if (node?.type === "data") return node;
	if (node?.type === "skip") return previous ?? null;
	return null;
}
/**
* @param {URL | null} old_url
* @param {URL} new_url
*/
function diff_search_params(old_url, new_url) {
	if (!old_url) return new Set(new_url.searchParams.keys());
	const changed = new Set([...old_url.searchParams.keys(), ...new_url.searchParams.keys()]);
	for (const key of changed) {
		const old_values = old_url.searchParams.getAll(key);
		const new_values = new_url.searchParams.getAll(key);
		if (old_values.every((value) => new_values.includes(value)) && new_values.every((value) => old_values.includes(value))) changed.delete(key);
	}
	return changed;
}
/**
* @param {Omit<import('./types.js').NavigationFinished['state'], 'branch'> & { error: App.Error }} opts
* @returns {import('./types.js').NavigationFinished}
*/
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
/**
* @param {import('./types.js').NavigationIntent & { preload?: {} }} intent
* @returns {Promise<import('./types.js').NavigationResult>}
*/
async function load_route({ id, invalidating, url, params, route, preload }) {
	if (load_cache?.id === id) {
		preload_tokens.delete(load_cache.token);
		return load_cache.promise;
	}
	const { errors, layouts, leaf } = route;
	const loaders = [...layouts, leaf];
	errors.forEach((loader) => loader?.().catch(noop));
	loaders.forEach((loader) => loader?.[1]().catch(noop));
	/** @type {import('types').ServerNodesResponse | import('types').ServerRedirectNode | null} */
	let server_data = null;
	const url_changed = current.url ? id !== get_page_key(current.url) : false;
	const route_changed = current.route ? route.id !== current.route.id : false;
	const search_params_changed = diff_search_params(current.url, url);
	const server_data_nodes = server_data?.nodes;
	let parent_changed = false;
	const branch_promises = loaders.map(async (loader, i) => {
		if (!loader) return;
		/** @type {import('./types.js').BranchNode | undefined} */
		const previous = current.branch[i];
		const server_data_node = server_data_nodes?.[i];
		if ((!server_data_node || server_data_node.type === "skip") && loader[1] === previous?.loader && !has_changed(parent_changed, route_changed, url_changed, search_params_changed, previous.universal?.uses, params)) return previous;
		parent_changed = true;
		if (server_data_node?.type === "error") throw server_data_node;
		return load_node({
			loader: loader[1],
			url,
			params,
			route,
			parent: async () => {
				const data = {};
				for (let j = 0; j < i; j += 1) Object.assign(data, (await branch_promises[j])?.data);
				return data;
			},
			server_data_node: create_data_node(server_data_node === void 0 && loader[0] ? { type: "skip" } : server_data_node ?? null, loader[0] ? previous?.server : void 0)
		});
	});
	for (const p of branch_promises) p.catch(noop);
	/** @type {Array<import('./types.js').BranchNode | undefined>} */
	const branch = [];
	for (let i = 0; i < loaders.length; i += 1) if (loaders[i]) try {
		branch.push(await branch_promises[i]);
	} catch (err) {
		if (err instanceof Redirect) return {
			type: "redirect",
			location: err.location
		};
		if (preload_tokens.has(preload)) return preload_error({
			error: await handle_error(err, {
				params,
				url,
				route: { id: route.id }
			}),
			url,
			params,
			route
		});
		let status = get_status(err);
		/** @type {App.Error} */
		let error;
		if (server_data_nodes?.includes(err)) {
			status = err.status ?? status;
			error = err.error;
		} else if (err instanceof HttpError) error = err.body;
		else {
			if (await stores.updated.check()) {
				await update_service_worker();
				return await native_navigation(url);
			}
			error = await handle_error(err, {
				params,
				url,
				route: { id: route.id }
			});
		}
		const error_load = await load_nearest_error_page(i, branch, errors);
		if (error_load) return get_navigation_result_from_branch({
			url,
			params,
			branch: branch.slice(0, error_load.idx).concat(error_load.node),
			errors,
			status,
			error,
			route
		});
		else return await server_fallback(url, { id: route.id }, error, status);
	}
	else branch.push(void 0);
	return get_navigation_result_from_branch({
		url,
		params,
		branch,
		errors,
		status: 200,
		error: null,
		route,
		form: invalidating ? void 0 : null
	});
}
/**
* @param {number} i Start index to backtrack from
* @param {Array<import('./types.js').BranchNode | undefined>} branch Branch to backtrack
* @param {Array<import('types').CSRPageNodeLoader | undefined>} errors All error pages for this branch
* @returns {Promise<{idx: number; node: import('./types.js').BranchNode} | undefined>}
*/
async function load_nearest_error_page(i, branch, errors) {
	while (i--) if (errors[i]) {
		let j = i;
		while (!branch[j]) j -= 1;
		try {
			return {
				idx: j + 1,
				node: {
					node: await errors[i](),
					loader: errors[i],
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
/**
* @param {{
*   status: number;
*   error: App.Error;
*   url: URL;
*   route: { id: string | null }
* }} opts
* @returns {Promise<import('./types.js').NavigationFinished>}
*/
async function load_root_error_page({ status, error, url, route }) {
	/** @type {Record<string, string>} */
	const params = {};
	/** @type {import('types').ServerDataNode | null} */
	let server_data_node = null;
	try {
		return get_navigation_result_from_branch({
			url,
			params,
			branch: [await load_node({
				loader: default_layout_loader,
				url,
				params,
				route,
				parent: () => Promise.resolve({}),
				server_data_node: create_data_node(server_data_node)
			}), {
				node: await default_error_loader(),
				loader: default_error_loader,
				universal: null,
				server: null,
				data: null
			}],
			status,
			error,
			errors: [],
			route: null
		});
	} catch (error) {
		if (error instanceof Redirect) return _goto(new URL(error.location, location.href), {}, 0);
		throw error;
	}
}
/**
* Resolve the relative rerouted URL for a client-side navigation
* @param {URL} url
* @returns {Promise<URL | undefined>}
*/
async function get_rerouted_url(url) {
	const href = url.href;
	if (reroute_cache.has(href)) return reroute_cache.get(href);
	let rerouted;
	try {
		const promise = (async () => {
			let rerouted = await app.hooks.reroute({
				url: new URL(url),
				fetch: async (input, init) => {
					return resolve_fetch_url(input, init, url).promise;
				}
			}) ?? url;
			if (typeof rerouted === "string") {
				const tmp = new URL(url);
				if (app.hash) tmp.hash = rerouted;
				else tmp.pathname = rerouted;
				rerouted = tmp;
			}
			return rerouted;
		})();
		reroute_cache.set(href, promise);
		rerouted = await promise;
	} catch (e) {
		reroute_cache.delete(href);
		return;
	}
	return rerouted;
}
/**
* Resolve the full info (which route, params, etc.) for a client-side navigation from the URL,
* taking the reroute hook into account. If this isn't a client-side-navigation (or the URL is undefined),
* returns undefined.
* @param {URL | undefined} url
* @param {boolean} invalidating
* @returns {Promise<import('./types.js').NavigationIntent | undefined>}
*/
async function get_navigation_intent(url, invalidating) {
	if (!url) return;
	if (is_external_url(url, base, app.hash)) return;
	{
		const rerouted = await get_rerouted_url(url);
		if (!rerouted) return;
		const path = get_url_path(rerouted);
		for (const route of routes) {
			const params = route.exec(path);
			if (params) return {
				id: get_page_key(url),
				invalidating,
				route,
				params: decode_params(params),
				url
			};
		}
	}
}
/** @param {URL} url */
function get_url_path(url) {
	return decode_pathname(app.hash ? url.hash.replace(/^#/, "").replace(/[?#].+/, "") : url.pathname.slice(base.length)) || "/";
}
/** @param {URL} url */
function get_page_key(url) {
	return (app.hash ? url.hash.replace(/^#/, "") : url.pathname) + url.search;
}
/**
* @param {{
*   url: URL;
*   type: import('@sveltejs/kit').Navigation["type"];
*   intent?: import('./types.js').NavigationIntent;
*   delta?: number;
*   event?: PopStateEvent | MouseEvent;
*   scroll?: { x: number, y: number };
* }} opts
*/
function _before_navigate({ url, type, intent, delta, event, scroll }) {
	let should_block = false;
	const nav = create_navigation(current, intent, url, type, scroll ?? null);
	if (delta !== void 0) nav.navigation.delta = delta;
	if (event !== void 0) nav.navigation.event = event;
	const cancellable = {
		...nav.navigation,
		cancel: () => {
			should_block = true;
			nav.reject(/* @__PURE__ */ new Error("navigation cancelled"));
		}
	};
	if (!is_navigating) before_navigate_callbacks.forEach((fn) => fn(cancellable));
	return should_block ? null : nav;
}
/**
* @param {{
*   type: import('@sveltejs/kit').NavigationType;
*   url: URL;
*   popped?: {
*     state: Record<string, any>;
*     scroll: { x: number, y: number };
*     delta: number;
*   };
*   keepfocus?: boolean;
*   noscroll?: boolean;
*   replace_state?: boolean;
*   state?: Record<string, any>;
*   redirect_count?: number;
*   nav_token?: {};
*   accept?: () => void;
*   block?: () => void;
*   event?: Event
* }} opts
*/
async function navigate({ type, url, popped, keepfocus, noscroll, replace_state, state = {}, redirect_count = 0, nav_token = {}, accept = noop, block = noop, event }) {
	const prev_token = token;
	token = nav_token;
	const intent = await get_navigation_intent(url, false);
	const nav = type === "enter" ? create_navigation(current, intent, url, type) : _before_navigate({
		url,
		type,
		delta: popped?.delta,
		intent,
		scroll: popped?.scroll,
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
	if (started && nav.navigation.type !== "enter") stores.navigating.set(navigating.current = nav.navigation);
	let navigation_result = intent && await load_route(intent);
	if (!navigation_result) if (is_external_url(url, base, app.hash)) return await native_navigation(url, replace_state);
	else navigation_result = await server_fallback(url, { id: null }, await handle_error(new SvelteKitError(404, "Not Found", `Not found: ${url.pathname}`), {
		url,
		params: {},
		route: { id: null }
	}), 404, replace_state);
	url = intent?.url || url;
	if (token !== nav_token) {
		nav.reject(/* @__PURE__ */ new Error("navigation aborted"));
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
			error: await handle_error(/* @__PURE__ */ new Error("Redirect loop"), {
				url,
				params: {},
				route: { id: null }
			}),
			url,
			route: { id: null }
		});
	} else if (navigation_result.props.page.status >= 400) {
		if (await stores.updated.check()) {
			await update_service_worker();
			await native_navigation(url, replace_state);
		}
	}
	reset_invalidation();
	update_scroll_positions(previous_history_index);
	capture_snapshot(previous_navigation_index);
	if (navigation_result.props.page.url.pathname !== url.pathname) url.pathname = navigation_result.props.page.url.pathname;
	state = popped ? popped.state : state;
	if (!popped) {
		const change = replace_state ? 0 : 1;
		const entry = {
			[HISTORY_INDEX]: current_history_index += change,
			[NAVIGATION_INDEX]: current_navigation_index += change,
			[STATES_KEY]: state
		};
		(replace_state ? history.replaceState : history.pushState).call(history, entry, "", url);
		if (!replace_state) clear_onward_history(current_history_index, current_navigation_index);
	}
	const load_cache_fork = intent && load_cache?.id === intent.id ? load_cache.fork : null;
	if (load_cache?.fork && !load_cache_fork) discard_load_cache();
	load_cache = null;
	navigation_result.props.page.state = state;
	/**
	* @type {Promise<void> | undefined}
	*/
	let commit_promise;
	if (started) {
		const after_navigate = (await Promise.all(Array.from(on_navigate_callbacks, (fn) => fn(nav.navigation)))).filter(
			/** @returns {value is () => void} */
			(value) => typeof value === "function"
		);
		if (after_navigate.length > 0) {
			function cleanup() {
				after_navigate.forEach((fn) => {
					after_navigate_callbacks.delete(fn);
				});
			}
			after_navigate.push(cleanup);
			after_navigate.forEach((fn) => {
				after_navigate_callbacks.add(fn);
			});
		}
		const target = nav.navigation.to;
		current = {
			...navigation_result.state,
			nav: {
				params: target.params,
				route: target.route,
				url: target.url
			}
		};
		if (navigation_result.props.page) navigation_result.props.page.url = url;
		const fork = load_cache_fork && await load_cache_fork;
		if (fork) commit_promise = fork.commit();
		else {
			rendering_error = null;
			root.$set(navigation_result.props);
			if (rendering_error) Object.assign(navigation_result.props.page, rendering_error);
			update(navigation_result.props.page);
			commit_promise = settled?.();
		}
		has_navigated = true;
	} else await initialize(navigation_result, target, false);
	const { activeElement } = document;
	await commit_promise;
	await tick$1();
	await tick$1();
	/** @type {Element | null | ''} */
	let deep_linked = null;
	if (autoscroll) {
		const scroll = popped ? popped.scroll : noscroll ? scroll_state() : null;
		if (scroll) scrollTo(scroll.x, scroll.y);
		else if (deep_linked = url.hash && document.getElementById(get_id(url))) deep_linked.scrollIntoView();
		else scrollTo(0, 0);
	}
	const changed_focus = document.activeElement !== activeElement && document.activeElement !== document.body;
	if (!keepfocus && !changed_focus) reset_focus(url, !deep_linked);
	autoscroll = true;
	if (navigation_result.props.page) {
		if (rendering_error) Object.assign(navigation_result.props.page, rendering_error);
		Object.assign(page, navigation_result.props.page);
	}
	is_navigating = false;
	if (type === "popstate") restore_snapshot(current_navigation_index);
	nav.fulfil(void 0);
	if (nav.navigation.to) nav.navigation.to.scroll = scroll_state();
	after_navigate_callbacks.forEach((fn) => fn(nav.navigation));
	stores.navigating.set(navigating.current = null);
}
/**
* Does a full page reload if it wouldn't result in an endless loop in the SPA case
* @param {URL} url
* @param {{ id: string | null }} route
* @param {App.Error} error
* @param {number} status
* @param {boolean} [replace_state]
* @returns {Promise<import('./types.js').NavigationFinished>}
*/
async function server_fallback(url, route, error, status, replace_state) {
	if (url.origin === origin && url.pathname === location.pathname && !hydrated) return await load_root_error_page({
		status,
		error,
		url,
		route
	});
	return await native_navigation(url, replace_state);
}
/** @typedef {(typeof PRELOAD_PRIORITIES)['hover'] | (typeof PRELOAD_PRIORITIES)['tap']} PreloadDataPriority */
function setup_preload() {
	/** @type {NodeJS.Timeout} */
	let mousemove_timeout;
	/** @type {{ element: Element | SVGAElement | undefined; href: string | SVGAnimatedString | undefined }} */
	let current_a = {
		element: void 0,
		href: void 0
	};
	/** @type {PreloadDataPriority} */
	let current_priority;
	container.addEventListener("mousemove", (event) => {
		const target = event.target;
		clearTimeout(mousemove_timeout);
		mousemove_timeout = setTimeout(() => {
			preload(target, PRELOAD_PRIORITIES.hover);
		}, 20);
	});
	/** @param {Event} event */
	function tap(event) {
		if (event.defaultPrevented) return;
		preload(event.composedPath()[0], PRELOAD_PRIORITIES.tap);
	}
	container.addEventListener("mousedown", tap);
	container.addEventListener("touchstart", tap, { passive: true });
	const observer = new IntersectionObserver((entries) => {
		for (const entry of entries) if (entry.isIntersecting) {
			_preload_code(new URL(
				/** @type {HTMLAnchorElement} */
				entry.target.href
			));
			observer.unobserve(entry.target);
		}
	}, { threshold: 0 });
	/**
	* @param {Element} element
	* @param {PreloadDataPriority} priority
	*/
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
			current_a = {
				element: a,
				href: a.href
			};
			current_priority = PRELOAD_PRIORITIES.tap;
			const intent = await get_navigation_intent(url, false);
			if (!intent) return;
			_preload_data(intent);
		} else if (priority <= options.preload_code) {
			current_a = {
				element: a,
				href: a.href
			};
			current_priority = priority;
			_preload_code(url);
		}
	}
	function after_navigate() {
		observer.disconnect();
		for (const a of container.querySelectorAll("a")) {
			const { url, external, download } = get_link_info(a, base, app.hash);
			if (external || download) continue;
			const options = get_router_options(a);
			if (options.reload) continue;
			if (options.preload_code === PRELOAD_PRIORITIES.viewport) observer.observe(a);
			if (options.preload_code === PRELOAD_PRIORITIES.eager) _preload_code(url);
		}
	}
	after_navigate_callbacks.add(after_navigate);
	after_navigate();
}
/**
* @param {unknown} error
* @param {import('@sveltejs/kit').NavigationEvent} event
* @returns {import('types').MaybePromise<App.Error>}
*/
function handle_error(error, event) {
	if (error instanceof HttpError) return error.body;
	const status = get_status(error);
	const message = get_message(error);
	return app.hooks.handleError({
		error,
		event,
		status,
		message
	}) ?? { message };
}
/**
* @param {string | URL | ((url: URL) => boolean)} resource The invalidated URL
*/
function push_invalidated(resource) {
	if (typeof resource === "function") invalidated.push(resource);
	else {
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
			/** @type {import('@sveltejs/kit').BeforeNavigate} */
			const navigation = {
				...nav.navigation,
				cancel: () => {
					should_block = true;
					nav.reject(/* @__PURE__ */ new Error("navigation cancelled"));
				}
			};
			before_navigate_callbacks.forEach((fn) => fn(navigation));
		}
		if (should_block) {
			e.preventDefault();
			e.returnValue = "";
		} else history.scrollRestoration = "auto";
	});
	addEventListener("visibilitychange", () => {
		if (document.visibilityState === "hidden") persist_state();
	});
	if (!navigator.connection?.saveData) setup_preload();
	/** @param {MouseEvent} event */
	container.addEventListener("click", async (event) => {
		if (event.button || event.which !== 1) return;
		if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
		if (event.defaultPrevented) return;
		const a = find_anchor(event.composedPath()[0], container);
		if (!a) return;
		const { url, external, target, download } = get_link_info(a, base, app.hash);
		if (!url) return;
		if (target === "_parent" || target === "_top") {
			if (window.parent !== window) return;
		} else if (target && target !== "_self") return;
		const options = get_router_options(a);
		if (!(a instanceof SVGAElement) && url.protocol !== location.protocol && !(url.protocol === "https:" || url.protocol === "http:")) return;
		if (download) return;
		const [nonhash, hash] = (app.hash ? url.hash.replace(/^#/, "") : url.href).split("#");
		const same_pathname = nonhash === strip_hash(location);
		if (external || options.reload && (!same_pathname || !hash)) {
			if (_before_navigate({
				url,
				type: "link",
				event
			})) is_navigating = true;
			else event.preventDefault();
			return;
		}
		if (hash !== void 0 && same_pathname) {
			const [, current_hash] = current.url.href.split("#");
			if (current_hash === hash) {
				event.preventDefault();
				if (hash === "" || hash === "top" && a.ownerDocument.getElementById("top") === null) scrollTo({ top: 0 });
				else {
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
		const form = HTMLFormElement.prototype.cloneNode.call(event.target);
		const submitter = event.submitter;
		if ((submitter?.formTarget || form.target) === "_blank") return;
		if ((submitter?.formMethod || form.method) !== "get") return;
		const url = new URL(submitter?.hasAttribute("formaction") && submitter?.formAction || form.action);
		if (is_external_url(url, base, false)) return;
		const event_form = event.target;
		const options = get_router_options(event_form);
		if (options.reload) return;
		event.preventDefault();
		event.stopPropagation();
		const data = new FormData(event_form, submitter);
		url.search = new URLSearchParams(data).toString();
		navigate({
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
		if (event.state?.["sveltekit:history"]) {
			const history_index = event.state[HISTORY_INDEX];
			token = {};
			if (history_index === current_history_index) return;
			const scroll = scroll_positions[history_index];
			const state = event.state["sveltekit:states"] ?? {};
			const url = new URL(event.state["sveltekit:pageurl"] ?? location.href);
			const navigation_index = event.state[NAVIGATION_INDEX];
			const is_hash_change = current.url ? strip_hash(location) === strip_hash(current.url) : false;
			if (navigation_index === current_navigation_index && (has_navigated || is_hash_change)) {
				if (state !== page.state) page.state = state;
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
		} else if (!hash_navigating) {
			update_url(new URL(location.href));
			if (app.hash) location.reload();
		}
	});
	addEventListener("hashchange", () => {
		if (hash_navigating) {
			hash_navigating = false;
			history.replaceState({
				...history.state,
				[HISTORY_INDEX]: ++current_history_index,
				[NAVIGATION_INDEX]: current_navigation_index
			}, "", location.href);
		}
	});
	for (const link of document.querySelectorAll("link")) if (ICON_REL_ATTRIBUTES.has(link.rel)) link.href = link.href;
	addEventListener("pageshow", (event) => {
		if (event.persisted) stores.navigating.set(navigating.current = null);
	});
	/**
	* @param {URL} url
	*/
	function update_url(url) {
		current.url = page.url = url;
		stores.page.set(clone_page(page));
		stores.page.notify();
	}
}
/**
* @param {HTMLElement} target
* @param {import('./types.js').HydrateOptions} opts
*/
async function _hydrate(target, { status = 200, error, node_ids, params, route, server_route, data: server_data_nodes, form }) {
	hydrated = true;
	const url = new URL(location.href);
	/** @type {import('types').CSRRoute | undefined} */
	let parsed_route;
	({params = {}, route = { id: null }} = await get_navigation_intent(url, false) || {});
	parsed_route = routes.find(({ id }) => id === route.id);
	/** @type {import('./types.js').NavigationFinished | undefined} */
	let result;
	let hydrate = true;
	try {
		const branch_promises = node_ids.map(async (n, i) => {
			const server_data_node = server_data_nodes[i];
			if (server_data_node?.uses) server_data_node.uses = deserialize_uses(server_data_node.uses);
			return load_node({
				loader: app.nodes[n],
				url,
				params,
				route,
				parent: async () => {
					const data = {};
					for (let j = 0; j < i; j += 1) Object.assign(data, (await branch_promises[j]).data);
					return data;
				},
				server_data_node: create_data_node(server_data_node)
			});
		});
		/** @type {Array<import('./types.js').BranchNode | undefined>} */
		const branch = await Promise.all(branch_promises);
		if (parsed_route) {
			const layouts = parsed_route.layouts;
			for (let i = 0; i < layouts.length; i++) if (!layouts[i]) branch.splice(i, 0, void 0);
		}
		result = await get_navigation_result_from_branch({
			url,
			params,
			branch,
			status,
			error,
			errors: parsed_route?.errors,
			form,
			route: parsed_route ?? null
		});
	} catch (error) {
		if (error instanceof Redirect) {
			await native_navigation(new URL(error.location, location.href));
			return;
		}
		result = await load_root_error_page({
			status: get_status(error),
			error: await handle_error(error, {
				url,
				params,
				route
			}),
			url,
			route
		});
		target.textContent = "";
		hydrate = false;
	}
	if (result.props.page) result.props.page.state = {};
	await initialize(result, target, hydrate);
}
/**
* @param {any} uses
* @return {import('types').Uses}
*/
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
/**
* This flag is used to avoid client-side navigation when we're only using
* `location.replace()` to set focus.
*/
var resetting_focus = false;
/**
* @param {URL} url
* @param {boolean} [scroll]
*/
function reset_focus(url, scroll = true) {
	const autofocus = document.querySelector("[autofocus]");
	if (autofocus) autofocus.focus();
	else {
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
			const root = document.body;
			const tabindex = root.getAttribute("tabindex");
			root.tabIndex = -1;
			root.focus({
				preventScroll: true,
				focusVisible: false
			});
			if (tabindex !== null) root.setAttribute("tabindex", tabindex);
			else root.removeAttribute("tabindex");
		}
		const selection = getSelection();
		if (selection && selection.type !== "None") {
			/** @type {Range[]} */
			const ranges = [];
			for (let i = 0; i < selection.rangeCount; i += 1) ranges.push(selection.getRangeAt(i));
			setTimeout(() => {
				if (selection.rangeCount !== ranges.length) return;
				for (let i = 0; i < selection.rangeCount; i += 1) {
					const a = ranges[i];
					const b = selection.getRangeAt(i);
					if (a.commonAncestorContainer !== b.commonAncestorContainer || a.startContainer !== b.startContainer || a.endContainer !== b.endContainer || a.startOffset !== b.startOffset || a.endOffset !== b.endOffset) return;
				}
				selection.removeAllRanges();
			});
		}
	}
}
/**
* @template {import('@sveltejs/kit').NavigationType} T
* @param {import('./types.js').NavigationState} current
* @param {import('./types.js').NavigationIntent | undefined} intent
* @param {URL | null} url
* @param {T} type
* @param {{ x: number, y: number } | null} [target_scroll] The scroll position for the target (for popstate navigations)
*/
function create_navigation(current, intent, url, type, target_scroll = null) {
	/** @type {(value: any) => void} */
	let fulfil;
	/** @type {(error: any) => void} */
	let reject;
	const complete = new Promise((f, r) => {
		fulfil = f;
		reject = r;
	});
	complete.catch(noop);
	return {
		navigation: {
			from: {
				params: current.params,
				route: { id: current.route?.id ?? null },
				url: current.url,
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
		},
		fulfil,
		reject
	};
}
/**
* TODO: remove this in 3.0 when the page store is also removed
*
* We need to assign a new page object so that subscribers are correctly notified.
* However, spreading `{ ...page }` returns an empty object so we manually
* assign to each property instead.
*
* @param {import('@sveltejs/kit').Page} page
*/
function clone_page(page) {
	return {
		data: page.data,
		error: page.error,
		form: page.form,
		params: page.params,
		route: page.route,
		state: page.state,
		status: page.status,
		url: page.url
	};
}
/**
* @param {URL} url
* @returns {URL}
*/
function decode_hash(url) {
	const new_url = new URL(url);
	new_url.hash = decodeURIComponent(url.hash);
	return new_url;
}
/**
* @param {URL} url
* @returns {string}
*/
function get_id(url) {
	let id;
	if (app.hash) {
		const [, , second] = url.hash.split("#", 3);
		id = second ?? "";
	} else id = url.hash.slice(1);
	return decodeURIComponent(id);
}
//#endregion
export { updated as a, page as i, stores as n, load_css as o, navigating as r, resolve as s, start as t };
