(function () {
  'use strict';

  function getInitials(name) {
    return name
      .split(' ')
      .map(function (p) { return p[0]; })
      .join('')
      .toUpperCase();
  }

  function syncUserToMembers(session) {
    var store = globalThis.DataStore;
    if (!store || !session) return null;

    try {
      var members = store.getMembers();
      var existing = members.find(function (m) {
        return m.email && m.email.toLowerCase() === session.email.toLowerCase();
      });
      if (existing) return existing.id;

      var newMember = {
        id: Date.now(),
        name: session.name,
        email: session.email,
        role: session.role,
        initials: getInitials(session.name),
      };
      members.push(newMember);
      store.saveMembers(members);
      return newMember.id;
    } catch (_) {
      return null;
    }
  }

  function initHeader(session) {
    var nameEl = document.getElementById('headerUserName');
    if (nameEl) nameEl.textContent = session.name + ' (' + session.role + ')';

    var greetingEl = document.getElementById('dashboardGreeting');
    if (greetingEl) greetingEl.textContent = 'Welcome back, ' + session.name + '!';
  }

  function initLogout() {
    var handlers = ['headerLogoutBtn', 'headerSignoutBtn'];
    handlers.forEach(function (id) {
      var btn = document.getElementById(id);
      if (btn) {
        btn.addEventListener('click', function () {
          window.JWT.remove();
          window.location.replace('src/html_files/login.html');
        });
      }
    });
  }

  function applySidebarFilters(session) {
    var perms = window.Permissions.of(session.role);

    var visible = {
      'nav-dashboard':      true,
      'nav-projects':       perms.indexOf('create_project') !== -1 || perms.indexOf('edit_project') !== -1,
      'nav-tasks':          perms.indexOf('create_task') !== -1 || perms.indexOf('view_tasks') !== -1,
      'nav-board':          perms.indexOf('create_task') !== -1 || perms.indexOf('edit_task') !== -1,
      'nav-members':        session.role !== 'Team Member',
      'nav-reports':        perms.indexOf('view_reports') !== -1,
      'nav-activity-log':   perms.indexOf('view_activity_log') !== -1,
      'nav-prompt-builder': perms.indexOf('use_prompt_builder') !== -1,
    };

    Object.keys(visible).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) {
        el.style.display = visible[id] ? '' : 'none';
      }
    });
  }

  function init() {
    var session = window.JWT.getSession();
    if (!session) return;

    window.TaskFlowSession = session;

    var memberId = syncUserToMembers(session);
    if (memberId) {
      session.memberId = memberId;
    }

    initHeader(session);
    initLogout();
    applySidebarFilters(session);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
