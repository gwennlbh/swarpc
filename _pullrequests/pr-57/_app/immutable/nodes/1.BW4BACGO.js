import "../chunks/CKOwlSI2.js";
import { i as init } from "../chunks/Du0hMIwk.js";
import { a8 as push, G as from_html, p as first_child, P as template_effect, q as append, a9 as pop, L as child, N as reset, J as sibling } from "../chunks/DxO9wToY.js";
import { s as set_text } from "../chunks/CZk5GCzL.js";
import { s as stores, p as page$2 } from "../chunks/D_R5iS6O.js";
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
