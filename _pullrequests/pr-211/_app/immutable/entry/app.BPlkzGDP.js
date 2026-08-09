const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["../nodes/0.DRtx-Gw_.js","../chunks/DoroVSRy.js","../chunks/D-m_iixq.js","../chunks/DhaYE-8x.js","../nodes/1.DYF6lA-r.js","../chunks/CuYianj6.js","../chunks/C0_FQhCQ.js","../nodes/2.CqA4ZfBX.js","../chunks/DgXLx4VU.js","../nodes/3.yYoz0BqR.js","../nodes/4.uabVwu5Y.js","../nodes/5.e31qmgJB.js","../assets/5.BnF6-MMK.css","../nodes/6.BMBYslOs.js","../assets/6.3kMZvOdl.css"])))=>i.map(i=>d[i]);
import { A as child, B as push, C as get, D as template_effect, F as state, I as user_derived, M as sibling, O as user_effect, P as set, T as tick, W as reset, _ as append, b as text, d as component, g as set_text, h as if_block, i as prop, j as first_child, k as user_pre_effect, n as onMount, o as bind_this, r as asClassComponent, v as comment, y as from_html, z as pop } from "../chunks/DoroVSRy.js";
import { t as __vitePreload } from "../chunks/CW7Fztz1.js";
import "../chunks/DhaYE-8x.js";
//#region .svelte-kit/generated/client-optimized/matchers.js
var matchers = {};
//#endregion
//#region .svelte-kit/generated/root.svelte
var root = from_html(`<div id="svelte-announcer" aria-live="assertive" aria-atomic="true" style="position: absolute; left: 0; top: 0; clip: rect(0 0 0 0); clip-path: inset(50%); overflow: hidden; white-space: nowrap; width: 1px; height: 1px"><!></div>`);
var root_1 = from_html(`<!> <!>`, 1);
function Root($$anchor, $$props) {
	push($$props, true);
	let components = prop($$props, "components", 23, () => []), data_0 = prop($$props, "data_0", 3, null), data_1 = prop($$props, "data_1", 3, null), data_2 = prop($$props, "data_2", 3, null);
	user_pre_effect(() => $$props.stores.page.set($$props.page));
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
	var fragment = root_1();
	var node = first_child(fragment);
	var consequent_1 = ($$anchor) => {
		const Pyramid_0 = user_derived(() => $$props.constructors[0]);
		var fragment_1 = comment();
		component(first_child(fragment_1), () => get(Pyramid_0), ($$anchor, Pyramid_0_1) => {
			bind_this(Pyramid_0_1($$anchor, {
				get data() {
					return data_0();
				},
				get form() {
					return $$props.form;
				},
				get params() {
					return $$props.page.params;
				},
				children: ($$anchor, $$slotProps) => {
					var fragment_2 = comment();
					var node_2 = first_child(fragment_2);
					var consequent = ($$anchor) => {
						const Pyramid_1 = user_derived(() => $$props.constructors[1]);
						var fragment_3 = comment();
						component(first_child(fragment_3), () => get(Pyramid_1), ($$anchor, Pyramid_1_1) => {
							bind_this(Pyramid_1_1($$anchor, {
								get data() {
									return data_1();
								},
								get form() {
									return $$props.form;
								},
								get params() {
									return $$props.page.params;
								},
								children: ($$anchor, $$slotProps) => {
									var fragment_4 = comment();
									component(first_child(fragment_4), () => get(Pyramid_2), ($$anchor, Pyramid_2_1) => {
										bind_this(Pyramid_2_1($$anchor, {
											get data() {
												return data_2();
											},
											get form() {
												return $$props.form;
											},
											get params() {
												return $$props.page.params;
											}
										}), ($$value) => components()[2] = $$value, () => components()?.[2]);
									});
									append($$anchor, fragment_4);
								},
								$$slots: { default: true }
							}), ($$value) => components()[1] = $$value, () => components()?.[1]);
						});
						append($$anchor, fragment_3);
					};
					var alternate = ($$anchor) => {
						const Pyramid_1 = user_derived(() => $$props.constructors[1]);
						var fragment_5 = comment();
						component(first_child(fragment_5), () => get(Pyramid_1), ($$anchor, Pyramid_1_2) => {
							bind_this(Pyramid_1_2($$anchor, {
								get data() {
									return data_1();
								},
								get form() {
									return $$props.form;
								},
								get params() {
									return $$props.page.params;
								}
							}), ($$value) => components()[1] = $$value, () => components()?.[1]);
						});
						append($$anchor, fragment_5);
					};
					if_block(node_2, ($$render) => {
						if ($$props.constructors[2]) $$render(consequent);
						else $$render(alternate, -1);
					});
					append($$anchor, fragment_2);
				},
				$$slots: { default: true }
			}), ($$value) => components()[0] = $$value, () => components()?.[0]);
		});
		append($$anchor, fragment_1);
	};
	var alternate_1 = ($$anchor) => {
		const Pyramid_0 = user_derived(() => $$props.constructors[0]);
		var fragment_6 = comment();
		component(first_child(fragment_6), () => get(Pyramid_0), ($$anchor, Pyramid_0_2) => {
			bind_this(Pyramid_0_2($$anchor, {
				get data() {
					return data_0();
				},
				get form() {
					return $$props.form;
				},
				get params() {
					return $$props.page.params;
				}
			}), ($$value) => components()[0] = $$value, () => components()?.[0]);
		});
		append($$anchor, fragment_6);
	};
	if_block(node, ($$render) => {
		if ($$props.constructors[1]) $$render(consequent_1);
		else $$render(alternate_1, -1);
	});
	var node_7 = sibling(node, 2);
	var consequent_3 = ($$anchor) => {
		var div = root();
		var node_8 = child(div);
		var consequent_2 = ($$anchor) => {
			var text$1 = text();
			template_effect(() => set_text(text$1, get(title)));
			append($$anchor, text$1);
		};
		if_block(node_8, ($$render) => {
			if (get(navigated)) $$render(consequent_2);
		});
		reset(div);
		append($$anchor, div);
	};
	if_block(node_7, ($$render) => {
		if (get(mounted)) $$render(consequent_3);
	});
	append($$anchor, fragment);
	pop();
}
//#endregion
//#region .svelte-kit/generated/root.js
var root_default = asClassComponent(Root);
//#endregion
//#region .svelte-kit/generated/client-optimized/app.js
var nodes = [
	() => __vitePreload(() => import("../nodes/0.DRtx-Gw_.js"), __vite__mapDeps([0,1,2,3]), import.meta.url),
	() => __vitePreload(() => import("../nodes/1.DYF6lA-r.js"), __vite__mapDeps([4,1,5,6,3]), import.meta.url),
	() => __vitePreload(() => import("../nodes/2.CqA4ZfBX.js"), __vite__mapDeps([7,1,6,2,3,8]), import.meta.url),
	() => __vitePreload(() => import("../nodes/3.yYoz0BqR.js"), __vite__mapDeps([9,1,5,6,3]), import.meta.url),
	() => __vitePreload(() => import("../nodes/4.uabVwu5Y.js"), __vite__mapDeps([10,1,3]), import.meta.url),
	() => __vitePreload(() => import("../nodes/5.e31qmgJB.js"), __vite__mapDeps([11,1,3,8,12]), import.meta.url),
	() => __vitePreload(() => import("../nodes/6.BMBYslOs.js"), __vite__mapDeps([13,1,3,14]), import.meta.url)
];
var server_loads = [];
var dictionary = {
	"/": [3],
	"/[worker]": [4, [2]],
	"/[worker]/once": [5, [2]],
	"/[worker]/parallel": [6, [2]]
};
var hooks = {
	handleError: (({ error }) => {
		console.error(error);
	}),
	reroute: (() => {}),
	transport: {}
};
var decoders = Object.fromEntries(Object.entries(hooks.transport).map(([k, v]) => [k, v.decode]));
var encoders = Object.fromEntries(Object.entries(hooks.transport).map(([k, v]) => [k, v.encode]));
var hash = false;
var decode = (type, value) => decoders[type](value);
//#endregion
export { decode, decoders, dictionary, encoders, hash, hooks, matchers, nodes, root_default as root, server_loads };
