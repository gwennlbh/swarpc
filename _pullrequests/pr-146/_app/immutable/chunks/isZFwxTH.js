import { c as comment, a as append } from "./BvobdH6J.js";
import { d as block, E as EFFECT_TRANSPARENT, f as first_child } from "./fgLhyt9-.js";
import { B as BranchManager } from "./CZWb_kik.js";
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
