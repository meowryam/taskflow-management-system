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
      'nav-members':        session.role !== 'Team Member' && perms.indexOf('manage_team') !== -1,
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

  function applyDashboardRoleFilters(session) {
    var perms = window.Permissions.of(session.role);
    var role = session.role;

    // Hide "New Project" quick action for Team Members (no create_project permission)
    var createProjectBtn = document.querySelector('.quick-action-card--project');
    if (createProjectBtn) {
      createProjectBtn.style.display = perms.indexOf('create_project') !== -1 ? '' : 'none';
    }

    // Hide "Invite Member" quick action for non-Admin roles (no manage_team permission)
    var inviteMemberBtn = document.querySelector('.quick-action-card--member');
    if (inviteMemberBtn) {
      inviteMemberBtn.style.display = perms.indexOf('manage_team') !== -1 ? '' : 'none';
    }

    // Hide "Generate Report" quick action if no view_reports permission
    var reportBtn = document.querySelector('.quick-action-card--report');
    if (reportBtn) {
      reportBtn.style.display = perms.indexOf('view_reports') !== -1 ? '' : 'none';
    }

    // Hide "Create Task" quick action for Team Members (no create_task permission)
    var createTaskBtn = document.querySelector('.quick-action-card--task');
    if (createTaskBtn) {
      createTaskBtn.style.display = perms.indexOf('create_task') !== -1 ? '' : 'none';
    }

    // Hide "Quick Create" hero button for Team Members
    var quickCreateBtn = document.querySelector('.hero-btn--primary');
    if (quickCreateBtn) {
      quickCreateBtn.style.display = perms.indexOf('create_project') !== -1 || perms.indexOf('create_task') !== -1 ? '' : 'none';
    }

    // Hide "View Reports" hero button if no view_reports permission
    var viewReportsBtn = document.querySelector('.hero-btn--secondary');
    if (viewReportsBtn) {
      viewReportsBtn.style.display = perms.indexOf('view_reports') !== -1 ? '' : 'none';
    }

    // Update stat cards for Team Members - show only their assigned data
    if (role === 'Team Member') {
      var statsGrid = document.querySelector('.dashboard__stats-grid');
      if (statsGrid) {
        // Team Members only see relevant stats
        var memberCountCard = document.querySelector('.stat-card--members');
        if (memberCountCard) memberCountCard.style.display = 'none';
      }
    }
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
    applyDashboardRoleFilters(session);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
