import { A as child, C as get, D as template_effect, F as state, I as user_derived, M as sibling, N as proxy, P as set, S as delegated, W as reset, _ as append, c as bind_value, g as set_text, j as first_child, l as remove_input_defaults, m as index, p as each, x as delegate, y as from_html } from "../chunks/CeMGYp1X.js";
import "../chunks/BJgEf1bw.js";
//#region src/routes/[worker]/parallel/+page.svelte
var root_1 = from_html(`<p><code class="svelte-qrjmsr"> <br/> </code></p>`);
var root = from_html(`<input type="number" min="0" max="10"/> <button>Compute</button> <div id="result"></div>`, 1);
function _page($$anchor, $$props) {
	const swarpc = user_derived(() => $$props.data.swarpc);
	let results = proxy(Array.from({ length: 11 }, () => ({
		result: 0,
		node: "?",
		progress: "waiting"
	})));
	let tableOf = state(0);
	async function compute() {
		await Promise.all(results.map(async (_, i) => {
			const { result, node } = await get(swarpc).multiply({
				a: i,
				b: get(tableOf)
			}, ({ progress: p, node }) => {
				results[i].progress = Math.round(p * 100) + "%";
				results[i].node = node;
			});
			results[i].result = result;
			results[i].node = node;
		}));
	}
	var fragment = root();
	var input = first_child(fragment);
	remove_input_defaults(input);
	var button = sibling(input, 2);
	var div = sibling(button, 2);
	each(div, 21, () => results, index, ($$anchor, $$item, i) => {
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
		append($$anchor, p_1);
	});
	reset(div);
	bind_value(input, () => get(tableOf), ($$value) => set(tableOf, $$value));
	delegated("click", button, compute);
	append($$anchor, fragment);
}
delegate(["click"]);
//#endregion
export { _page as component };
