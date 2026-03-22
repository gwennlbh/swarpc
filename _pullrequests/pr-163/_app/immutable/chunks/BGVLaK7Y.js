import { d as block, h as hydrating, e as hydrate_next, E as EFFECT_TRANSPARENT, i as read_hydration_instruction, j as skip_nodes, k as set_hydrate_node, l as set_hydrating, m as hydrate_node } from "./aeDwZSEd.js";
import { B as BranchManager } from "./zAvPtT5X.js";
function if_block(node, fn, elseif = false) {
  var marker;
  if (hydrating) {
    marker = hydrate_node;
    hydrate_next();
  }
  var branches = new BranchManager(node);
  var flags = elseif ? EFFECT_TRANSPARENT : 0;
  function update_branch(key, fn2) {
    if (hydrating) {
      var data = read_hydration_instruction(
        /** @type {TemplateNode} */
        marker
      );
      if (key !== parseInt(data.substring(1))) {
        var anchor = skip_nodes();
        set_hydrate_node(anchor);
        branches.anchor = anchor;
        set_hydrating(false);
        branches.ensure(key, fn2);
        set_hydrating(true);
        return;
      }
    }
    branches.ensure(key, fn2);
  }
  block(() => {
    var has_branch = false;
    fn((fn2, key = 0) => {
      has_branch = true;
      update_branch(key, fn2);
    });
    if (!has_branch) {
      update_branch(-1, null);
    }
  }, flags);
}
export {
  if_block as i
};
