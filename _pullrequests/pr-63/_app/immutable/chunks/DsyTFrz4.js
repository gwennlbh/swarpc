import { v as block, w as hydrating, x as hydrate_next, y as create_fragment_from_html, z as assign_nodes, A as teardown, E as EFFECT_TRANSPARENT, B as hydrate_node, C as get_first_child } from "./DMYzM3Fw.js";
import { B as BranchManager } from "./L8JBpe-E.js";
function snippet(node, get_snippet, ...args) {
  var branches = new BranchManager(node);
  block(() => {
    const snippet2 = get_snippet() ?? null;
    branches.ensure(snippet2, snippet2 && ((anchor) => snippet2(anchor, ...args)));
  }, EFFECT_TRANSPARENT);
}
function createRawSnippet(fn) {
  return (anchor, ...params) => {
    var snippet2 = fn(...params);
    var element;
    if (hydrating) {
      element = /** @type {Element} */
      hydrate_node;
      hydrate_next();
    } else {
      var html = snippet2.render().trim();
      var fragment = create_fragment_from_html(html);
      element = /** @type {Element} */
      get_first_child(fragment);
      anchor.before(element);
    }
    const result = snippet2.setup?.(element);
    assign_nodes(element, element);
    if (typeof result === "function") {
      teardown(result);
    }
  };
}
export {
  createRawSnippet as c,
  snippet as s
};
