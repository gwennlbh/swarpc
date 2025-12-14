import { f as from_html, a as append, t as text, c as comment } from "../chunks/DMHudwnx.js";
import { f as first_child, s as sibling, g as get, d as set, e as state, h as child, i as user_derived, r as reset, t as template_effect } from "../chunks/B56w8_OF.js";
import { d as delegate, s as set_text } from "../chunks/CvTFX0E4.js";
import { i as if_block } from "../chunks/C5iW8EHu.js";
import { r as remove_input_defaults } from "../chunks/mpMHATjQ.js";
import { b as bind_value } from "../chunks/YmcJiyud.js";
var root_5 = from_html(`<button>Cancel</button>`);
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
  button.__click = async () => {
    const cancelable = get(swarpc).multiply.cancelable({ a: get(a), b: get(b) }, ({ progress: p }) => {
      set(loading, true);
      set(progress, p, true);
    });
    set(cancel, cancelable.cancel, true);
    set(result, await cancelable.request.then((r) => r.result), true);
    set(loading, false);
    set(cancel, void 0);
  };
  var node = child(button);
  {
    var consequent = ($$anchor2) => {
      var text$1 = text();
      template_effect(($0) => set_text(text$1, `loading... ${$0 ?? ""}%`), [() => Math.round(get(progress) * 100)]);
      append($$anchor2, text$1);
    };
    var alternate_1 = ($$anchor2) => {
      var fragment_2 = comment();
      var node_1 = first_child(fragment_2);
      {
        var consequent_1 = ($$anchor3) => {
          var text_1 = text();
          template_effect(() => set_text(text_1, get(result)));
          append($$anchor3, text_1);
        };
        var alternate = ($$anchor3) => {
          var text_2 = text("compute");
          append($$anchor3, text_2);
        };
        if_block(
          node_1,
          ($$render) => {
            if (get(result)) $$render(consequent_1);
            else $$render(alternate, false);
          },
          true
        );
      }
      append($$anchor2, fragment_2);
    };
    if_block(node, ($$render) => {
      if (get(loading)) $$render(consequent);
      else $$render(alternate_1, false);
    });
  }
  reset(button);
  reset(search);
  var node_2 = sibling(search, 2);
  {
    var consequent_2 = ($$anchor2) => {
      var button_1 = root_5();
      button_1.__click = async () => {
        get(cancel)?.("User cancelled");
        set(loading, false);
      };
      append($$anchor2, button_1);
    };
    if_block(node_2, ($$render) => {
      if (get(cancel)) $$render(consequent_2);
    });
  }
  bind_value(input, () => get(a), ($$value) => set(a, $$value));
  bind_value(input_1, () => get(b), ($$value) => set(b, $$value));
  append($$anchor, fragment);
}
delegate(["click"]);
export {
  _page as component
};
