import { f as from_html, a as append, t as text } from "../chunks/BvobdH6J.js";
import { f as first_child, g as get, c as child, s as sibling, a as state, r as reset, b as set, u as user_derived, t as template_effect } from "../chunks/fgLhyt9-.js";
import { d as delegate, a as delegated, s as set_text } from "../chunks/CFMc5Fxh.js";
import { i as if_block } from "../chunks/B613TmHw.js";
import { r as remove_input_defaults } from "../chunks/SsZcGxk6.js";
import { b as bind_value } from "../chunks/jazgmlqp.js";
var root_4 = from_html(`<button>Cancel</button>`);
var root = from_html(`<search><input type="number"/> * <input type="number"/> = <button><!></button></search> <!>`, 1);
function _page($$anchor, $$props) {
  const swarpc = user_derived(() => $$props.data.swarpc);
  let a = state(0);
  let b = state(0);
  let result = state(0);
  let progress = state(0);
  let loading = state(false);
  let cancel = state(void 0);
  var fragment = root();
  var search = first_child(fragment);
  var input = child(search);
  remove_input_defaults(input);
  var input_1 = sibling(input, 2);
  remove_input_defaults(input_1);
  var button = sibling(input_1, 2);
  var node = child(button);
  {
    var consequent = ($$anchor2) => {
      var text$1 = text();
      template_effect(($0) => set_text(text$1, `loading... ${$0 ?? ""}%`), [() => Math.round(get(progress) * 100)]);
      append($$anchor2, text$1);
    };
    var consequent_1 = ($$anchor2) => {
      var text_1 = text();
      template_effect(() => set_text(text_1, get(result)));
      append($$anchor2, text_1);
    };
    var alternate = ($$anchor2) => {
      var text_2 = text("compute");
      append($$anchor2, text_2);
    };
    if_block(node, ($$render) => {
      if (get(loading)) $$render(consequent);
      else if (get(result)) $$render(consequent_1, 1);
      else $$render(alternate, false);
    });
  }
  reset(button);
  reset(search);
  var node_1 = sibling(search, 2);
  {
    var consequent_2 = ($$anchor2) => {
      var button_1 = root_4();
      delegated("click", button_1, async () => {
        get(cancel)?.("User cancelled");
        set(loading, false);
      });
      append($$anchor2, button_1);
    };
    if_block(node_1, ($$render) => {
      if (get(cancel)) $$render(consequent_2);
    });
  }
  bind_value(input, () => get(a), ($$value) => set(a, $$value));
  bind_value(input_1, () => get(b), ($$value) => set(b, $$value));
  delegated("click", button, async () => {
    const cancelable = get(swarpc).multiply.cancelable({ a: get(a), b: get(b) }, ({ progress: p }) => {
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
export {
  _page as component
};
