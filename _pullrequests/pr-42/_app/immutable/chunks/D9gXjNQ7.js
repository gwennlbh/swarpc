import { q as block, r as hydrating, v as hydrate_next, w as create_fragment_from_html, x as assign_nodes, y as teardown, E as EFFECT_TRANSPARENT, z as branch, A as noop, B as destroy_effect, C as hydrate_node, D as get_first_child } from "./BB8fdnAN.js";
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
