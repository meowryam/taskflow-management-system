(function () {
  'use strict';

  /* ── Helpers ─────────────────────────────────────────────── */
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

  function setText(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function safeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ── Role-based filtering ──────────────────────────────── */
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
    var ids = new Set();
    tasks.forEach(function (t) { if (t.projectId) ids.add(String(t.projectId)); });
    return projects.filter(function (p) { return ids.has(String(p.id)); });
  }

  /* ── Greeting ──────────────────────────────────────────── */
  function renderGreeting() {
    var el = document.getElementById('dashboardGreeting');
    if (!el) return;
    var h = new Date().getHours();
    var g = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
    el.textContent = g + '!';
  }

  /* ── Mini Calendar ─────────────────────────────────────── */
  function renderCalendar() {
    var now = new Date();
    var year = now.getFullYear();
    var month = now.getMonth();
    var today = now.getDate();
    var months = ['January','February','March','April','May','June',
                  'July','August','September','October','November','December'];

    setText('calMonth', months[month] + ' ' + year);
    setText('calendarBadge', months[month].substring(0,3) + ' ' + year);

    var firstDay = new Date(year, month, 1).getDay();
    firstDay = firstDay === 0 ? 6 : firstDay - 1;
    var daysInMonth = new Date(year, month + 1, 0).getDate();
    var gridEl = document.getElementById('calendarDaysGrid');
    if (!gridEl) return;

    var html = '';
    for (var i = 0; i < firstDay; i++) {
      html += '<span class="calendar-mini__day calendar-mini__day--empty">0</span>';
    }
    // Mark days that have task deadlines as having events
    var store = globalThis.DataStore;
    var deadlineDays = {};
    if (store) {
      var tasks = store.getTasks();
      tasks.forEach(function (t) {
        if (t.dueDate && month === new Date(t.dueDate).getMonth() && year === new Date(t.dueDate).getFullYear()) {
          deadlineDays[new Date(t.dueDate).getDate()] = true;
        }
      });
    }
    for (var d = 1; d <= daysInMonth; d++) {
      var cls = 'calendar-mini__day';
      if (d === today) { cls += ' calendar-mini__day--today'; }
      else if (deadlineDays[d]) { cls += ' calendar-mini__day--has-event'; }
      html += '<span class="' + cls + '">' + d + '</span>';
    }
    gridEl.innerHTML = html;
  }

  /* ── Weekly Productivity Chart ────────────────────────── */
  function updateWeeklyChart(tasks) {
    var chart = document.getElementById('weeklyChart');
    if (!chart) return;

    var weekStart = getWeekStart();
    var counts = [0, 0, 0, 0, 0, 0, 0]; // Mon-Sun
    var todayIdx = new Date().getDay();
    todayIdx = todayIdx === 0 ? 6 : todayIdx - 1;

    tasks.forEach(function (t) {
      if (t.status !== 'Done' || !t.createdAt) return;
      var d = new Date(t.createdAt);
      if (d < weekStart) return;
      var idx = d.getDay();
      idx = idx === 0 ? 6 : idx - 1;
      counts[idx]++;
    });

    var maxVal = Math.max.apply(null, counts.concat(1));
    var days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    var barColors = ['','pink','blue','today','yellow','','pink'];

    var html = '';
    for (var i = 0; i < 7; i++) {
      var h = Math.max(8, Math.round((counts[i] / maxVal) * 100));
      var colorCls = barColors[i] ? ' weekly-chart__bar--' + barColors[i] : '';
      if (i === todayIdx && !barColors[i]) colorCls = ' weekly-chart__bar--today';
      html += '<div class="weekly-chart__bar-group">' +
        '<div class="weekly-chart__bar' + colorCls + '" style="height:' + h + '%" title="' + counts[i] + ' completed"></div>' +
        '<span class="weekly-chart__label">' + days[i] + '</span>' +
        '<span class="weekly-chart__value">' + counts[i] + '</span>' +
        '</div>';
    }
    chart.innerHTML = html;
  }

  /* ── Task Distribution Donut ───────────────────────────── */
  function updateTaskDistribution(tasks) {
    var counts = { done: 0, progress: 0, review: 0, todo: 0 };
    tasks.forEach(function (t) {
      var s = (t.status || '').toLowerCase();
      if (s === 'done') counts.done++;
      else if (s === 'in progress' || s === 'in-progress') counts.progress++;
      else if (s === 'review') counts.review++;
      else counts.todo++;
    });

    setText('donutDone', String(counts.done));
    setText('donutProgress', String(counts.progress));
    setText('donutReview', String(counts.review));
    setText('donutTodo', String(counts.todo));
    setText('donutTotal', String(tasks.length));

    var total = tasks.length || 1;
    var percents = [
      Math.round((counts.done / total) * 100),
      Math.round((counts.progress / total) * 100),
      Math.round((counts.review / total) * 100),
      Math.round((counts.todo / total) * 100)
    ];
    var colors = ['#9AAA63', '#F3B7DA', '#B6CAED', '#F6D868'];

    var svg = document.querySelector('.donut-chart svg');
    if (!svg) return;
    var circles = svg.querySelectorAll('circle:nth-child(n+3)');
    if (circles.length < 4) return;
    var circum = 2 * Math.PI * 15;
    var cum = 0;
    circles.forEach(function (c, i) {
      var dashLen = (percents[i] / 100) * circum;
      c.setAttribute('stroke-dasharray', dashLen + ' ' + circum);
      c.setAttribute('stroke-dashoffset', String(-cum));
      c.setAttribute('stroke', colors[i]);
      cum += dashLen;
    });
  }

  /* ── Progress Bar ──────────────────────────────────────── */
  function updateProgress(tasks) {
    var doneCount = tasks.filter(function (t) { return (t.status || '').toLowerCase() === 'done'; }).length;
    var progressCount = tasks.filter(function (t) {
      var s = (t.status || '').toLowerCase();
      return s === 'in progress' || s === 'in-progress';
    }).length;
    var total = tasks.length || 1;
    var pct = Math.round((doneCount / total) * 100);

    setText('progressPercentage', pct + '%');
    setText('progressDoneCount', String(doneCount));
    setText('progressActiveCount', String(progressCount));
    setText('progressPendingCount', String(total - doneCount - progressCount));

    var fill = document.querySelector('.progress-bar__fill--animate');
    if (fill) {
      fill.setAttribute('data-target', String(pct));
      fill.style.width = pct + '%';
      fill.style.transition = 'width 1s cubic-bezier(0.16,1,0.3,1)';
    }
  }

  /* ── Project Progress List ────────────────────────────── */
  function updateProjectProgress(projects, tasks) {
    var list = document.getElementById('projectProgressList');
    if (!list) return;

    if (!projects || projects.length === 0) {
      list.innerHTML = '<div class="widget-empty">' +
        '<div class="widget-empty__icon"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 7C3 5.89543 3.89543 5 5 5H9L11 8H19C20.1046 8 21 8.89543 21 10V17C21 18.1046 20.1046 19 19 19H5C3.89543 19 3 18.1046 3 17V7Z"/></svg></div>' +
        '<span class="widget-empty__text">No projects yet</span></div>';
      return;
    }

    var items = projects.slice(0, 4).map(function (p) {
      var projTasks = tasks.filter(function (t) { return String(t.projectId) === String(p.id); });
      var doneT = projTasks.filter(function (t) { return (t.status || '').toLowerCase() === 'done'; }).length;
      var pct = projTasks.length > 0 ? Math.round((doneT / projTasks.length) * 100) : 0;
      return { name: p.name || 'Untitled', pct: pct, total: projTasks.length };
    });

    var html = '';
    items.forEach(function (item, i) {
      var delay = (i * 0.1) + 's';
      html += '<div class="project-progress-item">' +
        '<div class="project-progress-item__header">' +
        '<span class="project-progress-item__name">' + safeHtml(item.name) + '</span>' +
        '<span class="project-progress-item__pct">' + item.pct + '%</span>' +
        '</div>' +
        '<div class="project-progress-item__bar">' +
        '<div class="project-progress-item__fill" style="width:' + item.pct + '%;transition-delay:' + delay + '"></div>' +
        '</div></div>';
    });
    list.innerHTML = html;
  }

  /* ── Team Members ──────────────────────────────────────── */
  function updateTeamMembers(members) {
    var list = document.getElementById('teamList');
    var badge = document.getElementById('teamOnlineBadge');
    if (!list) return;

    if (!members || members.length === 0) {
      list.innerHTML = '<div class="widget-empty">' +
        '<div class="widget-empty__icon"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="9" cy="8" r="3"/><path d="M3 20C3 16.6863 5.68629 14 9 14C12.3137 14 15 16.6863 15 20"/></svg></div>' +
        '<span class="widget-empty__text">No members yet</span></div>';
      if (badge) badge.textContent = '0 online';
      return;
    }

    if (badge) badge.textContent = members.length + ' member' + (members.length !== 1 ? 's' : '');

    var avColors = [
      'background:linear-gradient(135deg,#9AAA63,#b8c88a)',
      'background:linear-gradient(135deg,#B6CAED,#cedcf3)',
      'background:linear-gradient(135deg,#F3B7DA,#f8cfe7)',
      'background:linear-gradient(135deg,#F6D868,#f9e494)',
      'background:linear-gradient(135deg,#c4b5fd,#ddd6fe)',
      'background:linear-gradient(135deg,#fdba74,#fed7aa)'
    ];
    var statuses = ['online', 'online', 'online', 'busy'];

    var html = '';
    members.forEach(function (m, i) {
      var ini = (m.initials || (m.name || '?').substring(0,2).toUpperCase());
      var name = m.name || 'Unknown';
      var role = m.role || 'Member';
      var bg = avColors[i % avColors.length];
      var st = statuses[i % statuses.length];
      html += '<div class="team-member-row">' +
        '<div class="team-member-row__avatar team-member-row__avatar--' + st + '" style="' + bg + '">' + safeHtml(ini) + '</div>' +
        '<div class="team-member-row__info">' +
        '<div class="team-member-row__name">' + safeHtml(name) + '</div>' +
        '<div class="team-member-row__role">' + safeHtml(role) + '</div>' +
        '</div></div>';
    });
    list.innerHTML = html;
  }

  /* ── Upcoming Deadlines ───────────────────────────────── */
  function updateDeadlines(tasks) {
    var deadlineList = document.getElementById('deadlineList');
    var deadlineCount = document.getElementById('deadlineCount');
    if (!deadlineList) return;

    var tasksWithDeadlines = tasks.filter(function (t) {
      return t.dueDate && (t.status || '').toLowerCase() !== 'done';
    });

    if (tasksWithDeadlines.length === 0) {
      if (deadlineCount) deadlineCount.textContent = '0 deadlines';
      deadlineList.innerHTML = '<div class="widget-empty">' +
        '<div class="widget-empty__icon"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/></svg></div>' +
        '<span class="widget-empty__text">All caught up!</span></div>';
      return;
    }

    tasksWithDeadlines.sort(function (a, b) { return new Date(a.dueDate) - new Date(b.dueDate); });
    var shown = tasksWithDeadlines.slice(0, 3);
    if (deadlineCount) deadlineCount.textContent = shown.length + ' deadline' + (shown.length !== 1 ? 's' : '');

    var now = new Date();
    var html = '';
    shown.forEach(function (t) {
      var due = new Date(t.dueDate);
      var diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
      var urgency = diffDays <= 1 ? 'urgent' : diffDays <= 3 ? 'soon' : 'normal';
      var countdownText = diffDays <= 0 ? 'Today' : diffDays + ' day' + (diffDays !== 1 ? 's' : '');

      var iconSvg;
      if (urgency === 'urgent') {
        iconSvg = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>';
      } else if (urgency === 'soon') {
        iconSvg = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>';
      } else {
        iconSvg = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/></svg>';
      }

      html += '<div class="deadline-item">' +
        '<div class="deadline-item__icon deadline-item__icon--' + urgency + '">' + iconSvg + '</div>' +
        '<div class="deadline-item__info">' +
        '<div class="deadline-item__name">' + safeHtml(t.title || 'Untitled Task') + '</div>' +
        '<div class="deadline-item__date">' + due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + '</div>' +
        '</div>' +
        '<span class="deadline-item__countdown deadline-item__countdown--' + urgency + '">' + countdownText + '</span>' +
        '</div>';
    });
    deadlineList.innerHTML = html;
  }

  /* ── Activity Timeline ─────────────────────────────────── */
  function renderActivityTimeline() {
    var timeline = document.getElementById('activityTimeline');
    var countEl = document.getElementById('activityCount');
    if (!timeline) return;

    var activities = (window.ActivityLog && window.ActivityLog.getActivities) ? window.ActivityLog.getActivities() : [];
    if (countEl) countEl.textContent = activities.length + ' update' + (activities.length !== 1 ? 's' : '');

    if (activities.length === 0) {
      timeline.innerHTML = '<div class="activity-empty">' +
        '<div class="activity-empty__icon"><svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg></div>' +
        '<p class="activity-empty__text">No recent activity yet</p>' +
        '<p class="activity-empty__hint">Activity will appear here as your team works</p></div>';
      return;
    }

    var getRelativeTime = window.ActivityLog ? window.ActivityLog.getRelativeTime : function (t) { return t; };
    var html = '';
    activities.slice(0, 20).forEach(function (a, i) {
      var delay = (i * 0.05) + 's';
      html += '<div class="activity-item" style="animation-delay:' + delay + '">' +
        '<div class="activity-item__avatar" style="' + (a.avatarColor || 'background:linear-gradient(135deg,#9AAA63,#b8c88a)') + '">' + safeHtml(a.userInitials || '?') + '</div>' +
        '<div class="activity-item__content">' +
        '<div class="activity-item__text"><strong>' + safeHtml(a.userName || 'Someone') + '</strong> ' + safeHtml(a.description || 'made a change') + ' <strong>' + safeHtml(a.entityName || '') + '</strong>' + (a.extra ? ' ' + safeHtml(a.extra) : '') + '</div>' +
        '<div class="activity-item__meta">' +
        '<span class="activity-item__time">' + getRelativeTime(a.timestamp) + '</span>' +
        '<span class="activity-item__badge activity-item__badge--' + (a.badgeType || 'created') + '">' + (a.badgeType || 'created') + '</span>' +
        '</div></div></div>';
    });
    timeline.innerHTML = html;
  }

  /* ── Core Refresh ──────────────────────────────────────── */
  function refresh() {
    var store = globalThis.DataStore;
    if (!store) return;

    var session = getSession();
    var allTasks = store.getTasks();
    var allProjects = store.getProjects();
    var allMembers = store.getMembers();

    var visibleProjects, visibleTasks, teamMembers;

    if (session && session.role === 'Team Member') {
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

    updateProgress(visibleTasks);
    updateTaskDistribution(visibleTasks);
    updateWeeklyChart(visibleTasks);
    updateDeadlines(visibleTasks);
    updateProjectProgress(visibleProjects, visibleTasks);
    updateTeamMembers(allMembers);
    renderActivityTimeline();
  }

  /* ── Init & Event Listeners ───────────────────────────── */
  function init() {
    renderGreeting();
    refresh();
    renderCalendar();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  document.addEventListener('taskflow:tasks-changed', function () {
    refresh();
    renderCalendar();
  });
  document.addEventListener('taskflow:members-changed', function () {
    refresh();
    renderCalendar();
  });
  document.addEventListener('taskflow:projects-changed', function () {
    refresh();
    renderCalendar();
  });
  document.addEventListener('taskflow:activity-updated', function () {
    renderActivityTimeline();
  });
})();
