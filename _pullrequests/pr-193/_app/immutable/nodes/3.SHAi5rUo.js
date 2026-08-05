import { A as child, B as push, D as template_effect, H as enable_legacy_mode_flag, M as sibling, W as reset, _ as append, a as init, u as set_attribute, y as from_html, z as pop } from "../chunks/DoroVSRy.js";
import { s as resolve } from "../chunks/Cs171oCr.js";
import "../chunks/DhaYE-8x.js";
//#region node_modules/svelte/src/internal/flags/legacy.js
enable_legacy_mode_flag();
//#endregion
//#region src/routes/+page.svelte
var root = from_html(`<nav><p>Single-node tests</p> <ul><li><a>Using a service worker</a></li> <li><a>Using a dedicated worker</a></li> <li><a>Using a shared worker</a></li></ul> <p>Multi-node tests</p> <ul><li><a>Using a service worker</a></li> <li><a>Using a dedicated worker</a></li> <li><a>Using a shared worker</a></li></ul></nav>`);
function _page($$anchor, $$props) {
	push($$props, false);
	init();
	var nav = root();
	var ul = sibling(child(nav), 2);
	var li = child(ul);
	var a = child(li);
	reset(li);
	var li_1 = sibling(li, 2);
	var a_1 = child(li_1);
	reset(li_1);
	var li_2 = sibling(li_1, 2);
	var a_2 = child(li_2);
	reset(li_2);
	reset(ul);
	var ul_1 = sibling(ul, 4);
	var li_3 = child(ul_1);
	var a_3 = child(li_3);
	reset(li_3);
	var li_4 = sibling(li_3, 2);
	var a_4 = child(li_4);
	reset(li_4);
	var li_5 = sibling(li_4, 2);
	var a_5 = child(li_5);
	reset(li_5);
	reset(ul_1);
	reset(nav);
	template_effect(($0, $1, $2, $3, $4, $5) => {
		set_attribute(a, "href", $0);
		set_attribute(a_1, "href", $1);
		set_attribute(a_2, "href", $2);
		set_attribute(a_3, "href", `${$3 ?? ""}?nodes=10`);
		set_attribute(a_4, "href", `${$4 ?? ""}?nodes=10`);
		set_attribute(a_5, "href", `${$5 ?? ""}?nodes=10`);
	}, [
		() => resolve("/[worker]/", { worker: "service" }),
		() => resolve("/[worker]/", { worker: "dedicated" }),
		() => resolve("/[worker]/", { worker: "shared" }),
		() => resolve("/[worker]/parallel/", { worker: "service" }),
		() => resolve("/[worker]/parallel/", { worker: "dedicated" }),
		() => resolve("/[worker]/parallel/", { worker: "shared" })
	]);
	append($$anchor, nav);
	pop();
}
//#endregion
export { _page as component };
