import { A as child, B as push, C as get, D as template_effect, F as state, G as noop, I as user_derived, K as __exportAll, M as sibling, N as proxy, P as set, S as delegated, U as next, W as reset, _ as append, b as text, c as bind_value, g as set_text, h as if_block, l as remove_input_defaults, s as bind_checked, x as delegate, y as from_html, z as pop } from "../chunks/CACIRoGU.js";
import "../chunks/DhaYE-8x.js";
import { n as RequestCancelledError } from "../chunks/DgXLx4VU.js";
//#region src/routes/[worker]/once/+page.ts
var _page_exports = /* @__PURE__ */ __exportAll({ entries: () => entries });
var entries = () => [
	{ worker: "service" },
	{ worker: "dedicated" },
	{ worker: "shared" }
];
//#endregion
//#region src/routes/[worker]/once/+page.svelte
var root = from_html(`<button><!></button>`);
var root_1 = from_html(`<div><h2>Once Mode Tests</h2> <label><input type="checkbox"/> Broadcast</label> <section id="test-once" class="svelte-1erqe5"><h3>Test 1: .once() - cancels previous call of same method</h3> <input type="number"/> * <input type="number"/> = <!></section> <section id="test-onceby-key" class="svelte-1erqe5"><h3>Test 2: .onceBy(key) - cancels previous call with same key</h3> <input type="number"/> * <input type="number"/> = <!></section> <section id="test-global-onceby" class="svelte-1erqe5"><h3>Test 3: global onceBy - cancels any call with same global key</h3> <input type="number"/> * <input type="number"/> = <!></section></div>`);
function _page($$anchor, $$props) {
	push($$props, true);
	const computeButton = ($$anchor, index = noop, computation = noop) => {
		var button = root();
		var node = child(button);
		var consequent = ($$anchor) => {
			var text$1 = text();
			template_effect(($0) => set_text(text$1, `loading... ${$0 ?? ""}`), [() => progresses[index()].map((p) => (p * 100).toFixed(0) + "%").join(", ")]);
			append($$anchor, text$1);
		};
		var consequent_1 = ($$anchor) => {
			var text_1 = text();
			template_effect(() => set_text(text_1, results[index()]));
			append($$anchor, text_1);
		};
		var alternate = ($$anchor) => {
			append($$anchor, text("compute"));
		};
		if_block(node, ($$render) => {
			if (loadingStates[index()]) $$render(consequent);
			else if (results[index()] !== null) $$render(consequent_1, 1);
			else $$render(alternate, -1);
		});
		reset(button);
		delegated("click", button, async () => {
			await compute(index(), computation());
		});
		append($$anchor, button);
	};
	const swarpc = user_derived(() => $$props.data.swarpc);
	let a = state(0);
	let b = state(0);
	let progresses = proxy([
		[0],
		[0],
		[0]
	]);
	let loadingStates = proxy([
		false,
		false,
		false
	]);
	let results = proxy([
		null,
		null,
		null
	]);
	let broadcast = state(false);
	const proc = user_derived(() => get(broadcast) ? get(swarpc).multiply.broadcast : get(swarpc).multiply);
	async function compute(index, computation) {
		let cancelled = false;
		loadingStates[index] = true;
		progresses[index] = [0];
		try {
			const r = await computation({
				a: get(a),
				b: get(b)
			}, (ps) => {
				if (ps instanceof Map) progresses[index] = [...ps.values()].map((p) => p.progress);
				else progresses[index] = [ps.progress];
			});
			if ("result" in r) results[index] = r.result;
			else if (r.some((p) => p.status === "rejected")) {
				cancelled = r.every((p) => p.reason instanceof RequestCancelledError);
				if (!cancelled) results[index] = -999;
			} else {
				const answers = r.map((p) => p.value.result);
				results[index] = answers.reduce((a, b) => a + b, 0) / answers.length;
			}
		} catch (e) {
			if (e instanceof RequestCancelledError) {
				cancelled = true;
				return;
			} else results[index] = -999;
		} finally {
			if (!cancelled) loadingStates[index] = false;
		}
	}
	var div = root_1();
	var label = sibling(child(div), 2);
	var input = child(label);
	remove_input_defaults(input);
	next();
	reset(label);
	var section = sibling(label, 2);
	var input_1 = sibling(child(section), 2);
	remove_input_defaults(input_1);
	var input_2 = sibling(input_1, 2);
	remove_input_defaults(input_2);
	computeButton(sibling(input_2, 2), () => 0, () => get(proc).once);
	reset(section);
	var section_1 = sibling(section, 2);
	var input_3 = sibling(child(section_1), 2);
	remove_input_defaults(input_3);
	var input_4 = sibling(input_3, 2);
	remove_input_defaults(input_4);
	computeButton(sibling(input_4, 2), () => 1, () => (...args) => get(proc).onceBy("custom-key", ...args));
	reset(section_1);
	var section_2 = sibling(section_1, 2);
	var input_5 = sibling(child(section_2), 2);
	remove_input_defaults(input_5);
	var input_6 = sibling(input_5, 2);
	remove_input_defaults(input_6);
	computeButton(sibling(input_6, 2), () => 2, () => (...args) => get(swarpc).onceBy("global-key").multiply(...args));
	reset(section_2);
	reset(div);
	bind_checked(input, () => get(broadcast), ($$value) => set(broadcast, $$value));
	bind_value(input_1, () => get(a), ($$value) => set(a, $$value));
	bind_value(input_2, () => get(b), ($$value) => set(b, $$value));
	bind_value(input_3, () => get(a), ($$value) => set(a, $$value));
	bind_value(input_4, () => get(b), ($$value) => set(b, $$value));
	bind_value(input_5, () => get(a), ($$value) => set(a, $$value));
	bind_value(input_6, () => get(b), ($$value) => set(b, $$value));
	append($$anchor, div);
	pop();
}
delegate(["click"]);
//#endregion
export { _page as component, _page_exports as universal };
