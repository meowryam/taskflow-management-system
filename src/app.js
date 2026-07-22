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
    if (!store || !session) return;

    try {
      var members = store.getMembers();
      var exists = members.some(function (m) {
        return m.email && m.email.toLowerCase() === session.email.toLowerCase();
      });
      if (!exists) {
        members.push({
          id: Date.now(),
          name: session.name,
          email: session.email,
          role: session.role,
          initials: getInitials(session.name),
        });
        store.saveMembers(members);
      }
    } catch (_) {}
  }

  function initHeader(session) {
    var nameEl = document.getElementById('headerUserName');
    if (nameEl) nameEl.textContent = session.name;

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

  function init() {
    var session = window.JWT.getSession();
    if (!session) return;

    window.TaskFlowSession = session;
    syncUserToMembers(session);
    initHeader(session);
    initLogout();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
