/**
 * members.js
 * Team Members module for TaskFlow Management System
 * Owner: Intern 6
 *
 * Uses the existing global DataStore (see src/dataStore.js) for persistence.
 * Member shape matches DataStore's seed data: { id, name, email, role, initials }
 * Tasks link to members via assignedMemberIds[] (canonical) or legacy assignedUserId.
 */

const Members = (function () {
  function getAssignedMemberIds(task) {
    if (Array.isArray(task?.assignedMemberIds)) {
      return task.assignedMemberIds.filter((id) => id != null);
    }
    const legacyId = task?.assignedMemberId ?? task?.assignedUserId;
    return legacyId == null ? [] : [legacyId];
  }

  function taskIncludesMember(task, memberId) {
    return getAssignedMemberIds(task).some(
      (id) => String(id) === String(memberId)
    );
  }

  // ---------- Validation ----------

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function isDuplicateEmail(email, members, excludeId) {
    return members.some(
      (m) =>
        m.id !== excludeId &&
        m.email.toLowerCase() === email.toLowerCase()
    );
  }

  function getInitials(name) {
    return name
      .trim()
      .split(/\s+/)
      .map((part) => part[0].toUpperCase())
      .slice(0, 2)
      .join("");
  }

  // ---------- Core logic ----------

  /**
   * Adds a new member.
   * Returns { success: true, member } or { success: false, error }
   */
  function addMember(name, role, email) {
    if (window.Permissions && window.TaskFlowSession) {
      if (!window.Permissions.check(window.TaskFlowSession.role, "manage_team")) {
        return { success: false, error: "You don't have permission to add members." };
      }
    }

    const members = DataStore.getMembers();

    if (!name || !name.trim()) {
      return { success: false, error: "Name is required." };
    }
    if (!email || !isValidEmail(email)) {
      return { success: false, error: "A valid email is required." };
    }
    if (isDuplicateEmail(email, members)) {
      return { success: false, error: "A member with this email already exists." };
    }

    const newMember = {
      id: Date.now(),
      name: name.trim(),
      role: role ? role.trim() : "Team Member",
      email: email.trim(),
      initials: getInitials(name),
    };

    members.push(newMember);
    DataStore.saveMembers(members);
    if (typeof ActivityLog !== 'undefined') {
      ActivityLog.logMemberAdded(newMember);
    }
    return { success: true, member: newMember };
  }

  /**
   * Updates an existing member's name, role and email.
   * Re-runs the same validation as addMember, but excludes the member
   * being edited from the duplicate-email check so keeping their own
   * email is allowed. Initials are recomputed from the new name.
   * Returns { success: true, member } or { success: false, error }
   */
  function editMember(id, name, role, email) {
    if (window.Permissions && window.TaskFlowSession) {
      if (!window.Permissions.check(window.TaskFlowSession.role, "manage_team")) {
        return { success: false, error: "You don't have permission to edit members." };
      }
    }

    const members = DataStore.getMembers();
    const member = members.find((m) => m.id === id);

    if (!member) {
      return { success: false, error: "Member not found." };
    }
    if (!name || !name.trim()) {
      return { success: false, error: "Name is required." };
    }
    if (!email || !isValidEmail(email)) {
      return { success: false, error: "A valid email is required." };
    }
    if (isDuplicateEmail(email, members, id)) {
      return { success: false, error: "A member with this email already exists." };
    }

    member.name = name.trim();
    member.role = role ? role.trim() : "Team Member";
    member.email = email.trim();
    member.initials = getInitials(name);

    DataStore.saveMembers(members);
    if (typeof ActivityLog !== 'undefined' && typeof ActivityLog.logMemberUpdated === 'function') {
      ActivityLog.logMemberUpdated(member);
    }
    return { success: true, member };
  }

  /**
   * Returns how many tasks are currently assigned to a member (any status).
   */
  function getAssignedTaskCount(memberId) {
    const tasks = DataStore.getTasks();
    return tasks.filter((task) => taskIncludesMember(task, memberId)).length;
  }

  /**
   * Returns only ACTIVE (non-Done) tasks assigned to a member.
   * Used to decide whether deletion should be blocked.
   */
  function getActiveTasksForMember(memberId) {
    const tasks = DataStore.getTasks();
    return tasks.filter(
      (task) => taskIncludesMember(task, memberId) && task.status !== "Done"
    );
  }

  /**
   * Attempts to delete a member.
   * Blocks deletion if the member has active (non-Done) assigned tasks.
   * Returns { success: true } or { success: false, error, taskCount }
   */
  function deleteMember(memberId) {
    if (window.Permissions && window.TaskFlowSession) {
      if (!window.Permissions.check(window.TaskFlowSession.role, 'manage_team')) {
        return { success: false, error: "You don't have permission to delete members." };
      }
    }

    const members = DataStore.getMembers();
    const member = members.find((m) => m.id === memberId);

    if (!member) {
      return { success: false, error: "Member not found." };
    }

    const activeTasks = getActiveTasksForMember(memberId);

    if (activeTasks.length > 0) {
      return {
        success: false,
        error: `Cannot delete ${member.name}: they have ${activeTasks.length} active task(s) assigned. Reassign or complete these tasks first.`,
        taskCount: activeTasks.length,
      };
    }

    const updated = members.filter((m) => m.id !== memberId);
    DataStore.saveMembers(updated);
    if (typeof ActivityLog !== 'undefined') {
      ActivityLog.logMemberDeleted(member);
    }
    return { success: true };
  }

  /**
   * Returns all members with a live task count attached.
   * Does not mutate stored data.
   */
  function getAllMembers() {
    return DataStore.getMembers().map((m) => ({
      ...m,
      taskCount: getAssignedTaskCount(m.id),
    }));
  }

  return {
    addMember,
    editMember,
    deleteMember,
    getAllMembers,
    getAssignedTaskCount,
    getActiveTasksForMember,
    isValidEmail,
    getInitials,
  };
})();