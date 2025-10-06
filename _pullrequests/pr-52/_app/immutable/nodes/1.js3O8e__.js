import "../chunks/CKOwlSI2.js";
import { i as init } from "../chunks/D00NUfsB.js";
import { a7 as push, F as from_html, o as first_child, O as template_effect, p as append, a8 as pop, K as child, M as reset, I as sibling } from "../chunks/IgMcu7UN.js";
import { s as set_text } from "../chunks/BJVj4UIE.js";
import { s as stores, p as page$2 } from "../chunks/DgvrRszP.js";
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
