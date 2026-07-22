/**
 * members.js
 * Team Members module for TaskFlow Management System
 * Owner: Intern 6
 *
 * Uses the existing global DataStore (see src/dataStore.js) for persistence.
 * Member shape matches DataStore's seed data: { id, name, email, role, initials }
 * Tasks link to members via task.assignedUserId (confirmed from dataStore.js seed).
 */

const Members = (function () {
  // ---------- Validation ----------

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function isDuplicateEmail(email, members) {
    return members.some(
      (m) => m.email.toLowerCase() === email.toLowerCase()
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
    return { success: true, member: newMember };
  }

  /**
   * Returns how many tasks are currently assigned to a member (any status).
   */
  function getAssignedTaskCount(memberId) {
    const tasks = DataStore.getTasks();
    return tasks.filter((task) => task.assignedUserId === memberId).length;
  }

  /**
   * Returns only ACTIVE (non-Done) tasks assigned to a member.
   * Used to decide whether deletion should be blocked.
   */
  function getActiveTasksForMember(memberId) {
    const tasks = DataStore.getTasks();
    return tasks.filter(
      (task) => task.assignedUserId === memberId && task.status !== "Done"
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
    deleteMember,
    getAllMembers,
    getAssignedTaskCount,
    getActiveTasksForMember,
    isValidEmail,
    getInitials,
  };
})();