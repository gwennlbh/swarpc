import { f as from_html, a as append, t as text, c as comment } from "../chunks/1eH1gM8z.js";
import { P as push, s as sibling, a as set, g as get, u as user_derived, b as state, Q as pop, c as child, r as reset, t as template_effect, f as first_child } from "../chunks/DKPhgljT.js";
import { d as delegate, s as set_text } from "../chunks/F9g-_yVI.js";
import { i as if_block } from "../chunks/CbNsrp5X.js";
import { r as remove_input_defaults } from "../chunks/BcjR_jen.js";
import { b as bind_value } from "../chunks/BNvrdC7Q.js";
const entries = () => [
  { worker: "service" },
  { worker: "dedicated" },
  { worker: "shared" }
];
const _page$1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  entries
}, Symbol.toStringTag, { value: "Module" }));
var root = from_html(`<div><h2>Once Mode Tests</h2> <section id="test-once" class="svelte-1erqe5"><h3>Test 1: .once() - cancels previous call of same method</h3> <input type="number"/> * <input type="number"/> = <button><!></button></section> <section id="test-onceby-key" class="svelte-1erqe5"><h3>Test 2: .onceBy(key) - cancels previous call with same key</h3> <input type="number"/> * <input type="number"/> = <button><!></button></section> <section id="test-global-onceby" class="svelte-1erqe5"><h3>Test 3: global onceBy - cancels any call with same global key</h3> <input type="number"/> * <input type="number"/> = <button><!></button></section></div>`);
function _page($$anchor, $$props) {
  push($$props, true);
  const swarpc = user_derived(() => $$props.data.swarpc);
  let a = state(0);
  let b = state(0);
  let result1 = state(0);
  let result2 = state(0);
  let result3 = state(0);
  let progress1 = state(0);
  let progress2 = state(0);
  let progress3 = state(0);
  let loading1 = state(false);
  let loading2 = state(false);
  let loading3 = state(false);
  var div = root();
  var section = sibling(child(div), 2);
  var input = sibling(child(section), 2);
  remove_input_defaults(input);
  var input_1 = sibling(input, 2);
  remove_input_defaults(input_1);
  var button = sibling(input_1, 2);
  button.__click = async () => {
    set(loading1, true);
    set(progress1, 0);
    try {
      const r = await get(swarpc).multiply.once({ a: get(a), b: get(b) }, ({ progress: p }) => {
        set(progress1, p, true);
      });
      set(result1, r.result, true);
    } catch (e) {
      set(
        result1,
        -999
        // Error sentinel
      );
    } finally {
      set(loading1, false);
    }
  };
  var node = child(button);
  {
    var consequent = ($$anchor2) => {
      var text$1 = text();
      template_effect(($0) => set_text(text$1, `loading... ${$0 ?? ""}%`), [() => Math.round(get(progress1) * 100)]);
      append($$anchor2, text$1);
    };
    var alternate_1 = ($$anchor2) => {
      var fragment_1 = comment();
      var node_1 = first_child(fragment_1);
      {
        var consequent_1 = ($$anchor3) => {
          var text_1 = text();
          template_effect(() => set_text(text_1, get(result1)));
          append($$anchor3, text_1);
        };
        var alternate = ($$anchor3) => {
          var text_2 = text("compute");
          append($$anchor3, text_2);
        };
        if_block(
          node_1,
          ($$render) => {
            if (get(result1)) $$render(consequent_1);
            else $$render(alternate, false);
          },
          true
        );
      }
      append($$anchor2, fragment_1);
    };
    if_block(node, ($$render) => {
      if (get(loading1)) $$render(consequent);
      else $$render(alternate_1, false);
    });
  }
  reset(button);
  reset(section);
  var section_1 = sibling(section, 2);
  var input_2 = sibling(child(section_1), 2);
  remove_input_defaults(input_2);
  var input_3 = sibling(input_2, 2);
  remove_input_defaults(input_3);
  var button_1 = sibling(input_3, 2);
  button_1.__click = async () => {
    set(loading2, true);
    set(progress2, 0);
    try {
      const r = await get(swarpc).multiply.onceBy("foo", { a: get(a), b: get(b) }, ({ progress: p }) => {
        set(progress2, p, true);
      });
      set(result2, r.result, true);
    } catch (e) {
      set(
        result2,
        -999
        // Error sentinel
      );
    } finally {
      set(loading2, false);
    }
  };
  var node_2 = child(button_1);
  {
    var consequent_2 = ($$anchor2) => {
      var text_3 = text();
      template_effect(($0) => set_text(text_3, `loading... ${$0 ?? ""}%`), [() => Math.round(get(progress2) * 100)]);
      append($$anchor2, text_3);
    };
    var alternate_3 = ($$anchor2) => {
      var fragment_4 = comment();
      var node_3 = first_child(fragment_4);
      {
        var consequent_3 = ($$anchor3) => {
          var text_4 = text();
          template_effect(() => set_text(text_4, get(result2)));
          append($$anchor3, text_4);
        };
        var alternate_2 = ($$anchor3) => {
          var text_5 = text("compute");
          append($$anchor3, text_5);
        };
        if_block(
          node_3,
          ($$render) => {
            if (get(result2)) $$render(consequent_3);
            else $$render(alternate_2, false);
          },
          true
        );
      }
      append($$anchor2, fragment_4);
    };
    if_block(node_2, ($$render) => {
      if (get(loading2)) $$render(consequent_2);
      else $$render(alternate_3, false);
    });
  }
  reset(button_1);
  reset(section_1);
  var section_2 = sibling(section_1, 2);
  var input_4 = sibling(child(section_2), 2);
  remove_input_defaults(input_4);
  var input_5 = sibling(input_4, 2);
  remove_input_defaults(input_5);
  var button_2 = sibling(input_5, 2);
  button_2.__click = async () => {
    set(loading3, true);
    set(progress3, 0);
    try {
      const r = await get(swarpc).onceBy("global-key").multiply({ a: get(a), b: get(b) }, ({ progress: p }) => {
        set(progress3, p, true);
      });
      set(result3, r.result, true);
    } catch (e) {
      set(
        result3,
        -999
        // Error sentinel
      );
    } finally {
      set(loading3, false);
    }
  };
  var node_4 = child(button_2);
  {
    var consequent_4 = ($$anchor2) => {
      var text_6 = text();
      template_effect(($0) => set_text(text_6, `loading... ${$0 ?? ""}%`), [() => Math.round(get(progress3) * 100)]);
      append($$anchor2, text_6);
    };
    var alternate_5 = ($$anchor2) => {
      var fragment_7 = comment();
      var node_5 = first_child(fragment_7);
      {
        var consequent_5 = ($$anchor3) => {
          var text_7 = text();
          template_effect(() => set_text(text_7, get(result3)));
          append($$anchor3, text_7);
        };
        var alternate_4 = ($$anchor3) => {
          var text_8 = text("compute");
          append($$anchor3, text_8);
        };
        if_block(
          node_5,
          ($$render) => {
            if (get(result3)) $$render(consequent_5);
            else $$render(alternate_4, false);
          },
          true
        );
      }
      append($$anchor2, fragment_7);
    };
    if_block(node_4, ($$render) => {
      if (get(loading3)) $$render(consequent_4);
      else $$render(alternate_5, false);
    });
  }
  reset(button_2);
  reset(section_2);
  reset(div);
  bind_value(input, () => get(a), ($$value) => set(a, $$value));
  bind_value(input_1, () => get(b), ($$value) => set(b, $$value));
  bind_value(input_2, () => get(a), ($$value) => set(a, $$value));
  bind_value(input_3, () => get(b), ($$value) => set(b, $$value));
  bind_value(input_4, () => get(a), ($$value) => set(a, $$value));
  bind_value(input_5, () => get(b), ($$value) => set(b, $$value));
  append($$anchor, div);
  pop();
}
delegate(["click"]);
export {
  _page as component,
  _page$1 as universal
};
