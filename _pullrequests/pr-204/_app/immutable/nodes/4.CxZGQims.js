import { A as child, C as get, D as template_effect, F as state, I as user_derived, M as sibling, P as set, S as delegated, W as reset, _ as append, b as text, c as bind_value, g as set_text, h as if_block, j as first_child, l as remove_input_defaults, x as delegate, y as from_html } from "../chunks/CACIRoGU.js";
import "../chunks/DhaYE-8x.js";
//#region src/routes/[worker]/+page.svelte
var root = from_html(`<button>Cancel</button>`);
var root_1 = from_html(`<search><input type="number"/> * <input type="number"/> = <button><!></button></search> <!>`, 1);
function _page($$anchor, $$props) {
	const swarpc = user_derived(() => $$props.data.swarpc);
	let a = state(0);
	let b = state(0);
	let result = state(0);
	let progress = state(0);
	let loading = state(false);
	let cancel = state(void 0);
	var fragment = root_1();
	var search = first_child(fragment);
	var input = child(search);
	remove_input_defaults(input);
	var input_1 = sibling(input, 2);
	remove_input_defaults(input_1);
	var button = sibling(input_1, 2);
	var node = child(button);
	var consequent = ($$anchor) => {
		var text$1 = text();
		template_effect(($0) => set_text(text$1, `loading... ${$0 ?? ""}%`), [() => Math.round(get(progress) * 100)]);
		append($$anchor, text$1);
	};
	var consequent_1 = ($$anchor) => {
		var text_1 = text();
		template_effect(() => set_text(text_1, get(result)));
		append($$anchor, text_1);
	};
	var alternate = ($$anchor) => {
		append($$anchor, text("compute"));
	};
	if_block(node, ($$render) => {
		if (get(loading)) $$render(consequent);
		else if (get(result)) $$render(consequent_1, 1);
		else $$render(alternate, -1);
	});
	reset(button);
	reset(search);
	var node_1 = sibling(search, 2);
	var consequent_2 = ($$anchor) => {
		var button_1 = root();
		delegated("click", button_1, async () => {
			get(cancel)?.("User cancelled");
			set(loading, false);
		});
		append($$anchor, button_1);
	};
	if_block(node_1, ($$render) => {
		if (get(cancel)) $$render(consequent_2);
	});
	bind_value(input, () => get(a), ($$value) => set(a, $$value));
	bind_value(input_1, () => get(b), ($$value) => set(b, $$value));
	delegated("click", button, async () => {
		const cancelable = get(swarpc).multiply.cancelable({
			a: get(a),
			b: get(b)
		}, ({ progress: p }) => {
			set(loading, true);
			set(progress, p, true);
		});
		set(cancel, cancelable.cancel, true);
		set(result, await cancelable.request.then((r) => r.result), true);
		set(loading, false);
		set(cancel, void 0);
	});
	append($$anchor, fragment);
}
delegate(["click"]);
//#endregion
export { _page as component };
