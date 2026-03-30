import { f as from_html, a as append } from "../chunks/QyJcC7qq.js";
import { i as init } from "../chunks/Bo9gkmj4.js";
import { J as push, f as first_child, t as template_effect, K as pop, c as child, r as reset, s as sibling } from "../chunks/BxH_ITiD.js";
import { s as set_text } from "../chunks/h1mKhmrH.js";
import { p as page$2 } from "../chunks/CIr8juvZ.js";
import { s as stores } from "../chunks/DaBBQvjW.js";
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
