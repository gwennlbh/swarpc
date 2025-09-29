import { q as block, r as hydrating, v as hydrate_next, E as EFFECT_TRANSPARENT, P as read_hydration_instruction, Q as HYDRATION_START_ELSE, R as skip_nodes, S as set_hydrate_node, T as set_hydrating, U as create_text, z as branch, V as current_batch, W as UNINITIALIZED, X as should_defer_append, Y as resume_effect, Z as pause_effect, C as hydrate_node } from "./IgMcu7UN.js";
function if_block(node, fn, elseif = false) {
  if (hydrating) {
    hydrate_next();
  }
  var anchor = node;
  var consequent_effect = null;
  var alternate_effect = null;
  var condition = UNINITIALIZED;
  var flags = elseif ? EFFECT_TRANSPARENT : 0;
  var has_branch = false;
  const set_branch = (fn2, flag = true) => {
    has_branch = true;
    update_branch(flag, fn2);
  };
  var offscreen_fragment = null;
  function commit() {
    if (offscreen_fragment !== null) {
      offscreen_fragment.lastChild.remove();
      anchor.before(offscreen_fragment);
      offscreen_fragment = null;
    }
    var active = condition ? consequent_effect : alternate_effect;
    var inactive = condition ? alternate_effect : consequent_effect;
    if (active) {
      resume_effect(active);
    }
    if (inactive) {
      pause_effect(inactive, () => {
        if (condition) {
          alternate_effect = null;
        } else {
          consequent_effect = null;
        }
      });
    }
  }
  const update_branch = (new_condition, fn2) => {
    if (condition === (condition = new_condition)) return;
    let mismatch = false;
    if (hydrating) {
      const is_else = read_hydration_instruction(anchor) === HYDRATION_START_ELSE;
      if (!!condition === is_else) {
        anchor = skip_nodes();
        set_hydrate_node(anchor);
        set_hydrating(false);
        mismatch = true;
      }
    }
    var defer = should_defer_append();
    var target = anchor;
    if (defer) {
      offscreen_fragment = document.createDocumentFragment();
      offscreen_fragment.append(target = create_text());
    }
    if (condition) {
      consequent_effect ??= fn2 && branch(() => fn2(target));
    } else {
      alternate_effect ??= fn2 && branch(() => fn2(target));
    }
    if (defer) {
      var batch = (
        /** @type {Batch} */
        current_batch
      );
      var active = condition ? consequent_effect : alternate_effect;
      var inactive = condition ? alternate_effect : consequent_effect;
      if (active) batch.skipped_effects.delete(active);
      if (inactive) batch.skipped_effects.add(inactive);
      batch.add_callback(commit);
    } else {
      commit();
    }
    if (mismatch) {
      set_hydrating(true);
    }
  };
  block(() => {
    has_branch = false;
    fn(set_branch);
    if (!has_branch) {
      update_branch(null, null);
    }
  }, flags);
  if (hydrating) {
    anchor = hydrate_node;
  }
}
export {
  if_block as i
};
