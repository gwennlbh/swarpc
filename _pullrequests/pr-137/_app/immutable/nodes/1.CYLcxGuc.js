import { f as from_html, a as append } from "../chunks/B5U2deAT.js";
import { i as init } from "../chunks/58kuJTsf.js";
import { P as push, f as first_child, t as template_effect, Q as pop, c as child, r as reset, s as sibling } from "../chunks/CGUuT_w7.js";
import { s as set_text } from "../chunks/C4bS4PAl.js";
import { s as stores, p as page$2 } from "../chunks/VVGkz_uN.js";
const page$1 = {
  get error() {
    return page$2.error;
  },
  get status() {
    return page$2.status;
  }
};
({
  check: stores.updated.check
});
const page = page$1;
var root = from_html(`<h1> </h1> <p> </p>`, 1);
function Error$1($$anchor, $$props) {
  push($$props, false);
  init();
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
export {
  Error$1 as component
};
