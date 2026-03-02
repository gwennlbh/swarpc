import { d as block, h as hydrating, e as hydrate_next, E as EFFECT_TRANSPARENT, i as read_hydration_instruction, H as HYDRATION_START, j as HYDRATION_START_ELSE, k as skip_nodes, l as set_hydrate_node, m as set_hydrating, n as hydrate_node } from "./BfvVvcMy.js";
import { B as BranchManager } from "./DD3MC3Xw.js";
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
      var hydrated_key;
      if (data === HYDRATION_START) {
        hydrated_key = 0;
      } else if (data === HYDRATION_START_ELSE) {
        hydrated_key = false;
      } else {
        hydrated_key = parseInt(data.substring(1));
      }
      if (key !== hydrated_key) {
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
      update_branch(false, null);
    }
  }, flags);
}
export {
  if_block as i
};
