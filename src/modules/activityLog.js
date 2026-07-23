/**
 * activityLog.js — Activity Log service layer
 * Persists audit entries in localStorage, aligned with dbo.ActivityLogs schema.
 */

const ActivityLog = (function () {
  'use strict';

  const STORAGE_KEY = 'taskflow_activity_logs';
  const ACTIVITY_CHANGED_EVENT = 'taskflow:activity-changed';

  const ENTITY_TYPES = Object.freeze(['Project', 'Task', 'Member']);
  const ACTION_TYPES = Object.freeze([
    'Created',
    'Updated',
    'Deleted',
    'Assigned',
    'Status Changed',
    'Priority Changed',
    'Completed'
  ]);

  function createId() {
    if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
    return `log-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function readEntries() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const entries = raw ? JSON.parse(raw) : [];
      return Array.isArray(entries) ? entries : [];
    } catch {
      return [];
    }
  }

  function writeEntries(entries) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }

  function notifyChanged() {
    if (typeof window === 'undefined' || typeof window.dispatchEvent !== 'function') return;
    window.dispatchEvent(new CustomEvent(ACTIVITY_CHANGED_EVENT));
  }

  function getCurrentUser() {
    const session = window.TaskFlowSession;
    return {
      userId: session?.memberId ?? 0,
      userName: session?.name ?? 'System'
    };
  }

  function getMemberName(memberId) {
    const store = globalThis.DataStore;
    if (!store || memberId == null) return 'Unknown member';
    const member = store.getMembers().find(function (m) {
      return String(m.id) === String(memberId);
    });
    return member ? member.name : 'Unknown member';
  }

  function getAssignedIds(task) {
    if (Array.isArray(task?.assignedMemberIds) && task.assignedMemberIds.length) {
      return task.assignedMemberIds;
    }
    const legacyId = task?.assignedMemberId ?? task?.assignedUserId;
    return legacyId == null ? [] : [legacyId];
  }

  function sortEntries(entries) {
    return entries.slice().sort(function (a, b) {
      const timeDiff = new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime();
      if (timeDiff !== 0) return timeDiff;
      return String(b.id).localeCompare(String(a.id));
    });
  }

  function record(entry) {
    const actor = getCurrentUser();
    const detail = String(entry.actionDetail || '').trim();
    if (!detail) return null;

    const logEntry = {
      id: createId(),
      userId: entry.userId != null ? entry.userId : actor.userId,
      userName: entry.userName || actor.userName,
      entityType: entry.entityType,
      entityId: entry.entityId,
      actionType: entry.actionType,
      actionDetail: detail.slice(0, 1000),
      occurredAt: entry.occurredAt || new Date().toISOString()
    };

    const entries = readEntries();
    entries.push(logEntry);
    writeEntries(entries);
    notifyChanged();
    return logEntry;
  }

  function getAll(options) {
    const opts = options || {};
    let entries = sortEntries(readEntries());

    if (opts.entityType && opts.entityType !== 'all') {
      entries = entries.filter(function (e) { return e.entityType === opts.entityType; });
    }
    if (opts.actionType && opts.actionType !== 'all') {
      entries = entries.filter(function (e) { return e.actionType === opts.actionType; });
    }
    if (opts.search) {
      const term = opts.search.toLowerCase();
      entries = entries.filter(function (e) {
        return e.actionDetail.toLowerCase().includes(term)
          || (e.userName && e.userName.toLowerCase().includes(term));
      });
    }
    if (opts.limit && opts.limit > 0) {
      entries = entries.slice(0, opts.limit);
    }

    return entries;
  }

  function getRecent(limit) {
    return getAll({ limit: limit || 5 });
  }

  function seed() {
    if (localStorage.getItem(STORAGE_KEY)) return;

    if (typeof DataStore === 'undefined') return;
    const store = DataStore;

    const projects = store.getProjects();
    const tasks = store.getTasks();
    const members = store.getMembers();
    const sprint = projects.find(function (p) { return p.name === 'TaskFlow Sprint'; });
    const task = tasks.find(function (t) { return t.title === 'Create project module'; });
    const manager = members.find(function (m) { return m.role === 'Manager'; });
    const member = members.find(function (m) { return m.role === 'Team Member'; });

    if (!sprint || !task || !manager) return;

    const baseTime = Date.now() - 3600000;
    const seedEntries = [
      {
        id: createId(),
        userId: manager.id,
        userName: manager.name,
        entityType: 'Project',
        entityId: sprint.id,
        actionType: 'Created',
        actionDetail: 'Project "TaskFlow Sprint" was created.',
        occurredAt: new Date(baseTime).toISOString()
      },
      {
        id: createId(),
        userId: manager.id,
        userName: manager.name,
        entityType: 'Task',
        entityId: task.id,
        actionType: 'Created',
        actionDetail: 'Task "Create project module" was created.',
        occurredAt: new Date(baseTime + 60000).toISOString()
      }
    ];

    if (member) {
      seedEntries.push({
        id: createId(),
        userId: manager.id,
        userName: manager.name,
        entityType: 'Task',
        entityId: task.id,
        actionType: 'Assigned',
        actionDetail: 'Task "Create project module" was assigned to ' + member.name + '.',
        occurredAt: new Date(baseTime + 120000).toISOString()
      });
    }

    writeEntries(seedEntries);
  }

  function logProjectCreated(project) {
    record({
      entityType: 'Project',
      entityId: project.id,
      actionType: 'Created',
      actionDetail: 'Project "' + project.name + '" was created.'
    });
  }

  function logProjectUpdated(project) {
    record({
      entityType: 'Project',
      entityId: project.id,
      actionType: 'Updated',
      actionDetail: 'Project "' + project.name + '" was updated.'
    });
  }

  function logProjectDeleted(project) {
    record({
      entityType: 'Project',
      entityId: project.id,
      actionType: 'Deleted',
      actionDetail: 'Project "' + project.name + '" was deleted.'
    });
  }

  function logTaskCreated(task) {
    record({
      entityType: 'Task',
      entityId: task.id,
      actionType: 'Created',
      actionDetail: 'Task "' + task.title + '" was created.'
    });

    const assignedIds = getAssignedIds(task);
    assignedIds.forEach(function (memberId) {
      record({
        entityType: 'Task',
        entityId: task.id,
        actionType: 'Assigned',
        actionDetail: 'Task "' + task.title + '" was assigned to ' + getMemberName(memberId) + '.'
      });
    });
  }

  function logTaskUpdated(existingTask, updatedTask) {
    const title = updatedTask.title || existingTask.title;

    if (existingTask.status !== updatedTask.status) {
      if (updatedTask.status === 'Done') {
        record({
          entityType: 'Task',
          entityId: updatedTask.id,
          actionType: 'Completed',
          actionDetail: 'Task "' + title + '" was marked as completed.'
        });
      } else {
        record({
          entityType: 'Task',
          entityId: updatedTask.id,
          actionType: 'Status Changed',
          actionDetail: 'Task "' + title + '" status changed from ' + existingTask.status + ' to ' + updatedTask.status + '.'
        });
      }
    }

    if (existingTask.priority !== updatedTask.priority) {
      record({
        entityType: 'Task',
        entityId: updatedTask.id,
        actionType: 'Priority Changed',
        actionDetail: 'Task "' + title + '" priority changed from ' + existingTask.priority + ' to ' + updatedTask.priority + '.'
      });
    }

    const oldIds = getAssignedIds(existingTask).map(String).sort().join(',');
    const newIds = getAssignedIds(updatedTask).map(String).sort().join(',');
    if (oldIds !== newIds) {
      getAssignedIds(updatedTask).forEach(function (memberId) {
        record({
          entityType: 'Task',
          entityId: updatedTask.id,
          actionType: 'Assigned',
          actionDetail: 'Task "' + title + '" was assigned to ' + getMemberName(memberId) + '.'
        });
      });
    }

    const trackedFields = ['title', 'description', 'projectId', 'dueDate', 'startDate'];
    const otherChanged = trackedFields.some(function (field) {
      return String(existingTask[field] ?? '') !== String(updatedTask[field] ?? '');
    });

    if (
      otherChanged
      && existingTask.status === updatedTask.status
      && existingTask.priority === updatedTask.priority
      && oldIds === newIds
    ) {
      record({
        entityType: 'Task',
        entityId: updatedTask.id,
        actionType: 'Updated',
        actionDetail: 'Task "' + title + '" was updated.'
      });
    }
  }

  function logTaskDeleted(task) {
    record({
      entityType: 'Task',
      entityId: task.id,
      actionType: 'Deleted',
      actionDetail: 'Task "' + task.title + '" was deleted.'
    });
  }

  function logStatusChanged(task, oldStatus, newStatus) {
    const title = task.title || 'Untitled task';
    if (newStatus === 'Done') {
      record({
        entityType: 'Task',
        entityId: task.id,
        actionType: 'Completed',
        actionDetail: 'Task "' + title + '" was marked as completed.'
      });
      return;
    }

    record({
      entityType: 'Task',
      entityId: task.id,
      actionType: 'Status Changed',
      actionDetail: 'Task "' + title + '" status changed from ' + oldStatus + ' to ' + newStatus + '.'
    });
  }

  function logMemberAdded(member) {
    record({
      entityType: 'Member',
      entityId: member.id,
      actionType: 'Created',
      actionDetail: 'Member "' + member.name + '" was added to the team.'
    });
  }

  function logMemberDeleted(member) {
    record({
      entityType: 'Member',
      entityId: member.id,
      actionType: 'Deleted',
      actionDetail: 'Member "' + member.name + '" was removed from the team.'
    });
  }

  /**
   * Removes all activity entries. Writing an empty array keeps the
   * storage key present (a truthy "[]"), so seed() will not repopulate
   * demo data on the next load.
   * Returns { success: true }.
   */
  function clearAll() {
    writeEntries([]);
    notifyChanged();
    return { success: true };
  }

  if (typeof DataStore !== 'undefined') {
    seed();
  } else if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function () {
      if (typeof DataStore !== 'undefined') seed();
    });
  }

  return {
    STORAGE_KEY,
    ACTIVITY_CHANGED_EVENT,
    ENTITY_TYPES,
    ACTION_TYPES,
    record,
    getAll,
    getRecent,
    seed,
    clearAll,
    logProjectCreated,
    logProjectUpdated,
    logProjectDeleted,
    logTaskCreated,
    logTaskUpdated,
    logTaskDeleted,
    logStatusChanged,
    logMemberAdded,
    logMemberDeleted
  };
})();

if (typeof globalThis !== 'undefined') {
  globalThis.ActivityLog = ActivityLog;
}
