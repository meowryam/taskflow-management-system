/* ============================================================
   permissions.js — Role-based permission simulation
   Maps each system role to a set of allowed actions. All
   checks are deterministic and driven entirely by the role
   string extracted from the JWT payload.
   ============================================================ */

const PERMISSION_MATRIX = {
  Admin: [
    "create_project",
    "delete_project",
    "edit_project",
    "archive_project",
    "manage_team",
    "create_task",
    "edit_task",
    "delete_task",
    "reassign_task",
    "view_reports",
    "export_reports",
    "manage_settings",
    "view_activity_log",
    "use_prompt_builder",
  ],
  Manager: [
    "create_project",
    "edit_project",
    "create_task",
    "edit_task",
    "delete_task",
    "reassign_task",
    "view_reports",
    "export_reports",
    "view_activity_log",
    "use_prompt_builder",
  ],
  "Team Member": [
    "create_task",
    "edit_task",
    "view_tasks",
    "view_activity_log",
    "use_prompt_builder",
  ],
};

window.Permissions = {
  /**
   * Returns the permission list for a given role.
   * @param {string} role
   * @returns {string[]}
   */
  of(role) {
    return PERMISSION_MATRIX[role] || [];
  },

  /**
   * Checks whether a role holds a specific permission.
   * @param {string} role
   * @param {string} permission
   * @returns {boolean}
   */
  check(role, permission) {
    const perms = this.of(role);
    return perms.includes(permission);
  },

  /**
   * Returns the full matrix (for auditing / test assertions).
   * @returns {Object}
   */
  getMatrix() {
    return PERMISSION_MATRIX;
  },

  /**
   * Returns all known permission keys.
   * @returns {string[]}
   */
  allKeys() {
    const set = new Set();
    Object.values(PERMISSION_MATRIX).forEach((list) =>
      list.forEach((k) => set.add(k)),
    );
    return [...set].sort();
  },
};
