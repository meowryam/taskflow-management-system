// ============================================================================
// TaskFlow — Activity Log Module
// Tracks task/project/member changes and provides activity feed for dashboard.
// ============================================================================
(function () {
  'use strict';

  var STORAGE_KEY = 'taskflow_activity_log';
  var MAX_ENTRIES = 50;

  /* ── Storage ────────────────────────────────────────────── */
  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function save(entries) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
    } catch (e) { /* quota exceeded — silently drop */ }
  }

  /* ── Helpers ─────────────────────────────────────────────── */
  function generateId() {
    return 'act_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
  }

  function getCurrentUser() {
    var session = window.TaskFlowSession || {};
    var members = (typeof DataStore !== 'undefined') ? DataStore.getMembers() : [];
    var member = members.find(function (m) {
      return String(m.id) === String(session.memberId) || m.email === session.email;
    });
    return {
      userId: session.memberId || 'unknown',
      userName: member ? member.name : (session.name || 'User'),
      userInitials: member ? member.initials : '?'
    };
  }

  function getTaskById(id) {
    if (typeof DataStore === 'undefined') return null;
    return DataStore.getTasks().find(function (t) { return String(t.id) === String(id); }) || null;
  }

  function getProjectById(id) {
    if (typeof DataStore === 'undefined') return null;
    return DataStore.getProjects().find(function (p) { return String(p.id) === String(id); }) || null;
  }

  function relativeTime(isoString) {
    var now = new Date();
    var then = new Date(isoString);
    var diff = Math.floor((now - then) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
    if (diff < 604800) return Math.floor(diff / 86400) + 'd ago';
    return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  /* ── Add Entry ──────────────────────────────────────────── */
  function addEntry(type, entityName, entityId, extra) {
    var entries = load();
    var user = getCurrentUser();

    var descriptions = {
      task_created:   'created task',
      task_updated:   'updated task',
      task_completed: 'completed task',
      task_deleted:   'deleted task',
      project_created: 'created project',
      project_updated: 'updated project',
      project_deleted: 'deleted project',
      member_added:   'added team member',
      member_removed: 'removed team member',
      board_moved:    'moved task'
    };

    var badgeTypes = {
      task_created:   'created',
      task_updated:   'updated',
      task_completed: 'completed',
      task_deleted:   'updated',
      project_created: 'created',
      project_updated: 'updated',
      project_deleted: 'updated',
      member_added:   'created',
      member_removed: 'created',
      board_moved:    'updated'
    };

    var avatarColors = [
      'background:linear-gradient(135deg,#9AAA63,#b8c88a)',
      'background:linear-gradient(135deg,#B6CAED,#cedcf3)',
      'background:linear-gradient(135deg,#F3B7DA,#f8cfe7)',
      'background:linear-gradient(135deg,#F6D868,#f9e494)',
      'background:linear-gradient(135deg,#c4b5fd,#ddd6fe)',
      'background:linear-gradient(135deg,#fdba74,#fed7aa)'
    ];

    var entry = {
      id: generateId(),
      type: type,
      userId: user.userId,
      userName: user.userName,
      userInitials: user.userInitials,
      entityName: entityName || 'Unknown',
      entityId: entityId || '',
      description: descriptions[type] || 'modified',
      badgeType: badgeTypes[type] || 'updated',
      avatarColor: avatarColors[Math.floor(Math.random() * avatarColors.length)],
      timestamp: new Date().toISOString(),
      extra: extra || ''
    };

    entries.unshift(entry);
    save(entries);

    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new CustomEvent('taskflow:activity-updated'));
    }
  }

  /* ── Event Handlers ─────────────────────────────────────── */
  var lastKnown = { tasks: 0, projects: 0, members: 0 };

  function onTasksChanged(e) {
    var detail = (e && e.detail) || {};
    var task = getTaskById(detail.taskId);

    if (detail.action === 'added' && task) {
      addEntry('task_created', task.title, detail.taskId);
    } else if (detail.action === 'deleted') {
      addEntry('task_deleted', 'a task', detail.taskId);
    } else if (detail.action === 'updated' && task) {
      if (task.status === 'Done') {
        addEntry('task_completed', task.title, detail.taskId);
      } else {
        addEntry('task_updated', task.title, detail.taskId);
      }
    } else if (detail.action === 'board_move' && task) {
      addEntry('board_moved', task.title, detail.taskId, 'to ' + (task.status || 'a column'));
    }
  }

  function onProjectsChanged() {
    var store = typeof DataStore !== 'undefined' ? DataStore : null;
    if (!store) return;
    var projects = store.getProjects();
    var count = projects.length;

    if (count > lastKnown.projects) {
      var latest = projects[projects.length - 1];
      if (latest) addEntry('project_created', latest.name, latest.id);
    } else if (count < lastKnown.projects) {
      addEntry('project_deleted', 'a project', '');
    }
    lastKnown.projects = count;
  }

  function onMembersChanged() {
    var store = typeof DataStore !== 'undefined' ? DataStore : null;
    if (!store) return;
    var members = store.getMembers();
    var count = members.length;

    if (count > lastKnown.members) {
      var latest = members[members.length - 1];
      if (latest) addEntry('member_added', latest.name, latest.id);
    } else if (count < lastKnown.members) {
      addEntry('member_removed', 'a member', '');
    }
    lastKnown.members = count;
  }

  function initCounts() {
    var store = typeof DataStore !== 'undefined' ? DataStore : null;
    if (store) {
      lastKnown.tasks = store.getTasks().length;
      lastKnown.projects = store.getProjects().length;
      lastKnown.members = store.getMembers().length;
    }
  }

  /* ── Public API ─────────────────────────────────────────── */
  window.ActivityLog = {
    getActivities: function () { return load(); },
    addEntry: addEntry,
    getRelativeTime: relativeTime,
    getTaskById: getTaskById,
    getProjectById: getProjectById
  };

  /* ── Init ───────────────────────────────────────────────── */
  document.addEventListener('taskflow:tasks-changed', onTasksChanged);
  document.addEventListener('taskflow:projects-changed', onProjectsChanged);
  document.addEventListener('taskflow:members-changed', onMembersChanged);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCounts);
  } else {
    initCounts();
  }
})();
