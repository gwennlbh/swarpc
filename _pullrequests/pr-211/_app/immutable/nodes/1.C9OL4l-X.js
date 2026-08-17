import { A as child, B as push, D as template_effect, M as sibling, W as reset, _ as append, g as set_text, j as first_child, y as from_html, z as pop } from "../chunks/DoroVSRy.js";
import { i as page$3, n as stores } from "../chunks/CseRRi3B.js";
import "../chunks/DhaYE-8x.js";
//#region node_modules/@sveltejs/kit/src/runtime/app/state/client.js
var page$2 = {
	get data() {
		return page$3.data;
	},
	get error() {
		return page$3.error;
	},
	get form() {
		return page$3.form;
	},
	get params() {
		return page$3.params;
	},
	get route() {
		return page$3.route;
	},
	get state() {
		return page$3.state;
	},
	get status() {
		return page$3.status;
	},
	get url() {
		return page$3.url;
	}
};
stores.updated.check;
//#endregion
//#region node_modules/@sveltejs/kit/src/runtime/app/state/index.js
/**
* A read-only reactive object with information about the current page, serving several use cases:
* - retrieving the combined `data` of all pages/layouts anywhere in your component tree (also see [loading data](https://svelte.dev/docs/kit/load))
* - retrieving the current value of the `form` prop anywhere in your component tree (also see [form actions](https://svelte.dev/docs/kit/form-actions))
* - retrieving the page state that was set through `goto`, `pushState` or `replaceState` (also see [goto](https://svelte.dev/docs/kit/$app-navigation#goto) and [shallow routing](https://svelte.dev/docs/kit/shallow-routing))
* - retrieving metadata such as the URL you're on, the current route and its parameters, and whether or not there was an error
*
* ```svelte
* <!--- file: +layout.svelte --->
* <script>
* 	import { page } from '$app/state';
* <\/script>
*
* <p>Currently at {page.url.pathname}</p>
*
* {#if page.error}
* 	<span class="red">Problem detected</span>
* {:else}
* 	<span class="small">All systems operational</span>
* {/if}
* ```
*
* Changes to `page` are available exclusively with runes. (The legacy reactivity syntax will not reflect any changes)
*
* ```svelte
* <!--- file: +page.svelte --->
* <script>
* 	import { page } from '$app/state';
* 	const id = $derived(page.params.id); // This will correctly update id for usage on this page
* 	$: badId = page.params.id; // Do not use; will never update after initial load
* <\/script>
* ```
*
* On the server, values can only be read during rendering (in other words _not_ in e.g. `load` functions). In the browser, the values can be read at any time.
*
* @type {import('@sveltejs/kit').Page}
*/
var page = page$2;
//#endregion
//#region node_modules/@sveltejs/kit/src/runtime/components/svelte-5/error.svelte
var root = from_html(`<h1> </h1> <p> </p>`, 1);
function Error$1($$anchor, $$props) {
	push($$props, true);
	var fragment = root();
	var h1 = first_child(fragment);
	var text = child(h1, true);
	reset(h1);
	var p = sibling(h1, 2);
	var text_1 = child(p, true);
	reset(p);
	template_effect(() => {
		set_text(text, page.status);
		set_text(text_1, page.error?.message);
	});
	append($$anchor, fragment);
	pop();
}
//#endregion
export { Error$1 as component };
