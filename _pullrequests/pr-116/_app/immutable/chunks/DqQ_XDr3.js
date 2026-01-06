import { j as block, k as hydrating, m as hydrate_next, E as EFFECT_TRANSPARENT, n as read_hydration_instruction, H as HYDRATION_START_ELSE, o as skip_nodes, p as set_hydrate_node, q as set_hydrating } from "./CM8fHnnq.js";
import { B as BranchManager } from "./9bZ5lWPv.js";
function if_block(node, fn, elseif = false) {
  if (hydrating) {
    hydrate_next();
  }
  var branches = new BranchManager(node);
  var flags = elseif ? EFFECT_TRANSPARENT : 0;
  function update_branch(condition, fn2) {
    if (hydrating) {
      const is_else = read_hydration_instruction(node) === HYDRATION_START_ELSE;
      if (condition === is_else) {
        var anchor = skip_nodes();
        set_hydrate_node(anchor);
        branches.anchor = anchor;
        set_hydrating(false);
        branches.ensure(condition, fn2);
        set_hydrating(true);
        return;
      }
    }
    branches.ensure(condition, fn2);
  }
  block(() => {
    var has_branch = false;
    fn((fn2, flag = true) => {
      has_branch = true;
      update_branch(flag, fn2);
    });
    if (!has_branch) {
      update_branch(false, null);
    }
  }, flags);
}
export {
  if_block as i
};
