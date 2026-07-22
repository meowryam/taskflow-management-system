(function () {
  'use strict';

  function getWeekStart() {
    var now = new Date();
    var day = now.getDay();
    var diff = now.getDate() - day + (day === 0 ? -6 : 1);
    var monday = new Date(now.getFullYear(), now.getMonth(), diff);
    monday.setHours(0, 0, 0, 0);
    return monday;
  }

  function getSession() {
    return window.TaskFlowSession || null;
  }

  function filterTasksByRole(tasks) {
    var session = getSession();
    if (!session) return tasks;
    if (session.role !== 'Team Member') return tasks;
    if (!session.memberId) return tasks.filter(function (t) {
      return String(t.assignedUserId) === String(session.email);
    });
    return tasks.filter(function (t) {
      return String(t.assignedUserId) === String(session.memberId);
    });
  }

  function filterProjectsByRole(projects, tasks) {
    var session = getSession();
    if (!session) return projects;
    if (session.role !== 'Team Member') return projects;
    var userTaskProjectIds = new Set();
    tasks.forEach(function (t) {
      if (t.projectId) userTaskProjectIds.add(String(t.projectId));
    });
    return projects.filter(function (p) {
      return userTaskProjectIds.has(String(p.id));
    });
  }

  function getOwnTasks() {
    var session = getSession();
    if (!session) return [];
    var allTasks = globalThis.DataStore.getTasks();
    if (session.role !== 'Team Member') return allTasks;
    if (!session.memberId) return allTasks.filter(function (t) {
      return String(t.assignedUserId) === String(session.email);
    });
    return allTasks.filter(function (t) {
      return String(t.assignedUserId) === String(session.memberId);
    });
  }

  function refresh() {
    var store = globalThis.DataStore;
    if (!store) return;

    var session = getSession();
    var allTasks = store.getTasks();
    var allProjects = store.getProjects();
    var allMembers = store.getMembers();

    var visibleProjects, visibleTasks, teamMembers;

    if (session && (session.role === 'Team Member')) {
      visibleTasks = filterTasksByRole(allTasks);
      visibleProjects = filterProjectsByRole(allProjects, visibleTasks);
      teamMembers = session.memberId
        ? allMembers.filter(function (m) { return String(m.id) === String(session.memberId); }).length
        : 1;
    } else {
      visibleTasks = allTasks;
      visibleProjects = allProjects;
      teamMembers = allMembers.length;
    }

    var totalProjects = visibleProjects.length;
    var activeTasks = visibleTasks.filter(function (t) { return t.status !== 'Done'; }).length;

    var weekStart = getWeekStart();
    var completedThisWeek = visibleTasks.filter(function (t) {
      if (t.status !== 'Done') return false;
      if (!t.createdAt) return false;
      return new Date(t.createdAt) >= weekStart;
    }).length;

    setText('statTotalProjects', String(totalProjects));
    setText('statActiveTasks', String(activeTasks));
    setText('statTeamMembers', String(teamMembers));
    setText('statCompletedWeek', String(completedThisWeek));

    if (globalThis.ActivityLogUI && typeof globalThis.ActivityLogUI.renderDashboardFeed === 'function') {
      globalThis.ActivityLogUI.renderDashboardFeed();
    }
  }

  function setText(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', refresh);
  } else {
    refresh();
  }

  document.addEventListener('taskflow:tasks-changed', refresh);
  document.addEventListener('taskflow:members-changed', refresh);
  document.addEventListener('taskflow:projects-changed', refresh);
  document.addEventListener('taskflow:activity-changed', refresh);
})();
