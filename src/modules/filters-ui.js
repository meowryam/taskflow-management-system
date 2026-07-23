(function () {
  var searchInput = document.getElementById('filterSearch');
  var statusSelect = document.getElementById('filterStatus');
  var prioritySelect = document.getElementById('filterPriority');
  var projectSelect = document.getElementById('filterProject');
  var memberSelect = document.getElementById('filterMember');
  var sortSelect = document.getElementById('filterSort');
  var clearBtn = document.getElementById('clearFiltersBtn');
  var cardGrid = document.getElementById('taskCardGrid');
  var countDisplay = document.getElementById('tasksCount');

  function populateDropdown(select, items, valueKey, labelKey, placeholder) {
    select.replaceChildren(new Option(placeholder, ''));
    items.forEach(function (item) {
      select.add(new Option(item[labelKey], item[valueKey]));
    });
  }

  function getFilterValues() {
    return {
      query: searchInput.value,
      status: statusSelect.value,
      priority: prioritySelect.value,
      projectId: projectSelect.value,
      memberId: memberSelect.value
    };
  }

  function getProjectName(projectId) {
    var project = DataStore.getProjects().find(function (item) {
      return String(item.id) === String(projectId);
    });
    return project ? (project.name || project.projectName || 'Unknown project') : 'Unknown project';
  }

  function getAssignedMemberIds(task) {
    if (Array.isArray(task.assignedMemberIds)) return task.assignedMemberIds;
    var legacyId = task.assignedMemberId !== undefined ? task.assignedMemberId : task.assignedUserId;
    return legacyId === undefined || legacyId === null ? [] : [legacyId];
  }

  function getAssignedMembers(task) {
    var ids = getAssignedMemberIds(task);
    return DataStore.getMembers().filter(function (member) {
      return ids.some(function (id) { return String(id) === String(member.id); });
    });
  }

  function getInitials(member) {
    if (member.initials) return member.initials;
    return String(member.name || member.fullName || 'U')
      .split(/\s+/).filter(Boolean).slice(0, 2).map(function (part) { return part[0]; }).join('').toUpperCase();
  }

  function getStatusClass(status) {
    return {
      'Todo': 'todo',
      'In Progress': 'in-progress',
      'Review': 'review',
      'Done': 'done'
    }[status] || 'todo';
  }

  function getPriorityClass(priority) {
    return String(priority || 'Low').toLowerCase();
  }

  function statusIcon(status) {
    if (status === 'Done') return '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m3 8 3 3 7-7"/></svg>';
    if (status === 'Review') return '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M1.5 8s2.2-4 6.5-4 6.5 4 6.5 4-2.2 4-6.5 4-6.5-4-6.5-4Z"/><circle cx="8" cy="8" r="1.7"/></svg>';
    if (status === 'In Progress') return '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="5.5"/><path d="M8 4.5V8l2.5 1.5"/></svg>';
    return '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="5.5"/></svg>';
  }

  function priorityIcon(priority) {
    if (priority === 'High') return '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 13V3m0 0L4.5 6.5M8 3l3.5 3.5"/></svg>';
    if (priority === 'Low') return '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 3v10m0 0 3.5-3.5M8 13 4.5 9.5"/></svg>';
    return '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h10"/></svg>';
  }

  function escapeHtml(value) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(value == null ? '' : String(value)));
    return div.innerHTML;
  }

  function createMemberMarkup(members) {
    if (members.length === 0) return '<span class="task-card__unassigned">Unassigned</span>';
    var avatars = members.slice(0, 3).map(function (member, index) {
      return '<span class="task-card__avatar task-card__avatar--' + (index % 3) + '" title="' +
        escapeHtml(member.name || member.fullName || 'Member') + '">' + escapeHtml(getInitials(member)) + '</span>';
    }).join('');
    var extra = members.length > 3 ? '<span class="task-card__avatar task-card__avatar--more">+' + (members.length - 3) + '</span>' : '';
    var names = members.map(function (member) { return member.name || member.fullName || 'Member'; }).join(', ');
    return '<span class="task-card__avatars">' + avatars + extra + '</span><span class="task-card__member-names">' + escapeHtml(names) + '</span>';
  }

  function createTaskCard(task) {
    var card = document.createElement('article');
    var statusClass = getStatusClass(task.status);
    var priorityClass = getPriorityClass(task.priority);
    var taskId = escapeHtml(task.id);
    var members = getAssignedMembers(task);
    card.className = 'task-card task-card--' + statusClass;
    card.dataset.taskId = String(task.id);
    card.innerHTML =
      '<div class="task-card__topline">' +
        '<span class="task-card__project">' + escapeHtml(getProjectName(task.projectId)) + '</span>' +
        '<div class="task-card__menu">' +
          '<button class="task-card__menu-trigger" type="button" aria-label="Task actions" aria-expanded="false">' +
            '<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="4" cy="10" r="1.5"/><circle cx="10" cy="10" r="1.5"/><circle cx="16" cy="10" r="1.5"/></svg>' +
          '</button>' +
          '<div class="task-card__menu-popover" hidden>' +
            '<button type="button" data-task-action="edit" data-task-id="' + taskId + '">Edit task</button>' +
            '<button type="button" class="task-card__delete-action" data-task-action="delete" data-task-id="' + taskId + '">Delete task</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<h3 class="task-card__title">' + escapeHtml(task.title || 'Untitled task') + '</h3>' +
      (task.description ? '<p class="task-card__description">' + escapeHtml(task.description) + '</p>' : '') +
      '<div class="task-card__badges">' +
        '<span class="task-card__badge task-card__status task-card__status--' + statusClass + '">' + statusIcon(task.status) + escapeHtml(task.status) + '</span>' +
        '<span class="task-card__badge task-card__priority task-card__priority--' + priorityClass + '">' + priorityIcon(task.priority) + escapeHtml(task.priority) + '</span>' +
      '</div>' +
      '<div class="task-card__schedule">' +
        '<span><strong>Created</strong>' + escapeHtml(task.startDate || (task.createdAt || '').slice(0, 10) || '—') + '</span>' +
        '<span><strong>Due</strong>' + escapeHtml(task.dueDate || '—') + '</span>' +
      '</div>' +
      '<div class="task-card__members">' + createMemberMarkup(members) + '</div>';
    return card;
  }

  function renderCards(tasks) {
    cardGrid.replaceChildren();
    if (!tasks || tasks.length === 0) {
      var empty = document.createElement('p');
      empty.className = 'task-card-grid__empty';
      empty.textContent = 'No tasks match your filters.';
      cardGrid.appendChild(empty);
      countDisplay.textContent = '0 tasks found';
      return;
    }
    tasks.forEach(function (task) { cardGrid.appendChild(createTaskCard(task)); });
    countDisplay.textContent = tasks.length + ' task' + (tasks.length !== 1 ? 's' : '') + ' found';
  }

  function taskIncludesMember(task, memberId) {
    return getAssignedMemberIds(task).some(function (id) { return String(id) === String(memberId); });
  }

  function getTasksForCurrentUser() {
    var allTasks = DataStore.getTasks();
    var session = window.TaskFlowSession;
    if (!session || session.role !== 'Team Member') return allTasks;
    var memberId = session.memberId || session.email;
    return allTasks.filter(function (task) { return taskIncludesMember(task, memberId); });
  }

  function refresh() {
    var filters = getFilterValues();
    var mappedFilters = { query: filters.query, status: filters.status, priority: filters.priority };
    if (filters.projectId !== '') mappedFilters.projectId = filters.projectId;
    var filtered = Filters.applyAllFilters(getTasksForCurrentUser(), mappedFilters);
    if (filters.memberId !== '') {
      filtered = filtered.filter(function (task) { return taskIncludesMember(task, filters.memberId); });
    }
    if (sortSelect.value === 'asc' || sortSelect.value === 'desc') {
      filtered = Filters.sortByDueDate(filtered, sortSelect.value);
    }
    renderCards(filtered);
  }

  function clearAll() {
    searchInput.value = statusSelect.value = prioritySelect.value = '';
    projectSelect.value = memberSelect.value = sortSelect.value = '';
    refresh();
  }

  function loadDropdowns() {
    populateDropdown(projectSelect, DataStore.getProjects(), 'id', 'name', 'All Projects');
    populateDropdown(memberSelect, DataStore.getMembers(), 'id', 'name', 'All Members');
  }

  function setup() {
    loadDropdowns();
    refresh();
    searchInput.addEventListener('input', refresh);
    statusSelect.addEventListener('change', refresh);
    prioritySelect.addEventListener('change', refresh);
    projectSelect.addEventListener('change', refresh);
    memberSelect.addEventListener('change', refresh);
    sortSelect.addEventListener('change', refresh);
    clearBtn.addEventListener('click', clearAll);
    window.addEventListener('taskflow:tasks-changed', refresh);
    window.addEventListener('taskflow:projects-changed', function () { loadDropdowns(); refresh(); });
    window.addEventListener('taskflow:members-changed', function () { loadDropdowns(); refresh(); });
  }

  if (searchInput) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup);
    else setup();
  }
})();
