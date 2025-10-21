import { r as block, v as hydrating, w as hydrate_next, x as create_fragment_from_html, y as assign_nodes, z as teardown, E as EFFECT_TRANSPARENT, A as branch, B as noop, C as destroy_effect, D as hydrate_node, F as get_first_child } from "./DxO9wToY.js";
function snippet(node, get_snippet, ...args) {
  var anchor = node;
  var snippet2 = noop;
  var snippet_effect;
  block(() => {
    if (snippet2 === (snippet2 = get_snippet())) return;
    if (snippet_effect) {
      destroy_effect(snippet_effect);
      snippet_effect = null;
    }
    snippet_effect = branch(() => (
      /** @type {SnippetFn} */
      snippet2(anchor, ...args)
    ));
  }, EFFECT_TRANSPARENT);
  if (hydrating) {
    anchor = hydrate_node;
  }
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
