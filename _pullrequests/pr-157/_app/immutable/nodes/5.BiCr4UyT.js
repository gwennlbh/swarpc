import { f as from_html, a as append, t as text } from "../chunks/DZo5_qKz.js";
import { O as push, Z as proxy, _ as noop, g as get, P as pop, a as state, c as child, s as sibling, u as user_derived, b as set, r as reset, $ as next, t as template_effect } from "../chunks/BfvVvcMy.js";
import { d as delegate, a as delegated, s as set_text } from "../chunks/BJmypUAI.js";
import { i as if_block } from "../chunks/BwUkGESQ.js";
import { r as remove_input_defaults } from "../chunks/CQNZnu2W.js";
import { a as bind_checked, b as bind_value } from "../chunks/CgHfaNe3.js";
import { R as RequestCancelledError } from "../chunks/B5z_hPLV.js";
const entries = () => [
  { worker: "service" },
  { worker: "dedicated" },
  { worker: "shared" }
];
const _page$1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  entries
}, Symbol.toStringTag, { value: "Module" }));
var root_1 = from_html(`<button><!></button>`);
var root = from_html(`<div><h2>Once Mode Tests</h2> <label><input type="checkbox"/> Broadcast</label> <section id="test-once" class="svelte-1erqe5"><h3>Test 1: .once() - cancels previous call of same method</h3> <input type="number"/> * <input type="number"/> = <!></section> <section id="test-onceby-key" class="svelte-1erqe5"><h3>Test 2: .onceBy(key) - cancels previous call with same key</h3> <input type="number"/> * <input type="number"/> = <!></section> <section id="test-global-onceby" class="svelte-1erqe5"><h3>Test 3: global onceBy - cancels any call with same global key</h3> <input type="number"/> * <input type="number"/> = <!></section></div>`);
function _page($$anchor, $$props) {
  push($$props, true);
  const computeButton = ($$anchor2, index = noop, computation = noop) => {
    var button = root_1();
    var node = child(button);
    {
      var consequent = ($$anchor3) => {
        var text$1 = text();
        template_effect(($0) => set_text(text$1, `loading... ${$0 ?? ""}`), [
          () => progresses[index()].map((p) => (p * 100).toFixed(0) + "%").join(", ")
        ]);
        append($$anchor3, text$1);
      };
      var consequent_1 = ($$anchor3) => {
        var text_1 = text();
        template_effect(() => set_text(text_1, results[index()]));
        append($$anchor3, text_1);
      };
      var alternate = ($$anchor3) => {
        var text_2 = text("compute");
        append($$anchor3, text_2);
      };
      if_block(node, ($$render) => {
        if (loadingStates[index()]) $$render(consequent);
        else if (results[index()] !== null) $$render(consequent_1, 1);
        else $$render(alternate, false);
      });
    }
    reset(button);
    delegated("click", button, async () => {
      await compute(index(), computation());
    });
    append($$anchor2, button);
  };
  const swarpc = user_derived(() => $$props.data.swarpc);
  let a = state(0);
  let b = state(0);
  let progresses = proxy([[0], [0], [0]]);
  let loadingStates = proxy([false, false, false]);
  let results = proxy([null, null, null]);
  let broadcast = state(false);
  const proc = user_derived(() => get(broadcast) ? get(swarpc).multiply.broadcast : get(swarpc).multiply);
  async function compute(index, computation) {
    let cancelled = false;
    loadingStates[index] = true;
    progresses[index] = [0];
    try {
      const r = await computation({ a: get(a), b: get(b) }, (ps) => {
        if (ps instanceof Map) {
          progresses[index] = [...ps.values()].map((p) => p.progress);
        } else {
          progresses[index] = [ps.progress];
        }
      });
      if ("result" in r) {
        results[index] = r.result;
      } else {
        if (r.some((p) => p.status === "rejected")) {
          cancelled = r.every((p) => p.reason instanceof RequestCancelledError);
          if (!cancelled) results[index] = -999;
        } else {
          const answers = r.map((p) => p.value.result);
          results[index] = answers.reduce((a2, b2) => a2 + b2, 0) / answers.length;
        }
      }
    } catch (e) {
      if (e instanceof RequestCancelledError) {
        cancelled = true;
        return;
      } else {
        results[index] = -999;
      }
    } finally {
      if (!cancelled) loadingStates[index] = false;
    }
  }
  var div = root();
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
  var node_1 = sibling(input_2, 2);
  computeButton(node_1, () => 0, () => get(proc).once);
  reset(section);
  var section_1 = sibling(section, 2);
  var input_3 = sibling(child(section_1), 2);
  remove_input_defaults(input_3);
  var input_4 = sibling(input_3, 2);
  remove_input_defaults(input_4);
  var node_2 = sibling(input_4, 2);
  computeButton(node_2, () => 1, () => (...args) => get(proc).onceBy("custom-key", ...args));
  reset(section_1);
  var section_2 = sibling(section_1, 2);
  var input_5 = sibling(child(section_2), 2);
  remove_input_defaults(input_5);
  var input_6 = sibling(input_5, 2);
  remove_input_defaults(input_6);
  var node_3 = sibling(input_6, 2);
  computeButton(node_3, () => 2, () => (...args) => get(swarpc).onceBy("global-key").multiply(...args));
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
export {
  _page as component,
  _page$1 as universal
};
