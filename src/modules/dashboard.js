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

  function refresh() {
    var store = globalThis.DataStore;
    if (!store) return;

    var tasks = store.getTasks();
    var projects = store.getProjects();
    var members = store.getMembers();

    var totalProjects = projects.length;
    var activeTasks = tasks.filter(function (t) { return t.status !== 'Done'; }).length;
    var teamMembers = members.length;

    var weekStart = getWeekStart();
    var completedThisWeek = tasks.filter(function (t) {
      if (t.status !== 'Done') return false;
      if (!t.createdAt) return false;
      return new Date(t.createdAt) >= weekStart;
    }).length;

    setText('statTotalProjects', String(totalProjects));
    setText('statActiveTasks', String(activeTasks));
    setText('statTeamMembers', String(teamMembers));
    setText('statCompletedWeek', String(completedThisWeek));
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
})();
