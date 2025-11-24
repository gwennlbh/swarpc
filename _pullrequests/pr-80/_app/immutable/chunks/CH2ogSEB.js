import { c as comment, a as append } from "./D8EFpo4R.js";
import { d as block, E as EFFECT_TRANSPARENT, f as first_child } from "./CeNyfUoB.js";
import { B as BranchManager } from "./cL-A_Epx.js";
function snippet(node, get_snippet, ...args) {
  var branches = new BranchManager(node);
  block(() => {
    const snippet2 = get_snippet() ?? null;
    branches.ensure(snippet2, snippet2 && ((anchor) => snippet2(anchor, ...args)));
  }, EFFECT_TRANSPARENT);
}
function Layout($$anchor, $$props) {
  var fragment = comment();
  var node = first_child(fragment);
  snippet(node, () => $$props.children);
  append($$anchor, fragment);
}
export {
  Layout as L
};
