(function () {
  var searchInput = document.getElementById('filterSearch');
  var statusSelect = document.getElementById('filterStatus');
  var prioritySelect = document.getElementById('filterPriority');
  var projectSelect = document.getElementById('filterProject');
  var memberSelect = document.getElementById('filterMember');
  var sortSelect = document.getElementById('filterSort');
  var clearBtn = document.getElementById('clearFiltersBtn');
  var tableBody = document.getElementById('taskTableBody');
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
    var projects = DataStore.getProjects();
    var project = projects.find(function (p) { return String(p.id) === String(projectId); });
    return project ? (project.name || project.projectName || 'Unknown') : 'Unknown';
  }

  function getMemberName(memberId) {
    var members = DataStore.getMembers();
    var member = members.find(function (m) { return String(m.id) === String(memberId); });
    return member ? (member.name || member.fullName || 'Unknown') : 'Unknown';
  }

  function getPriorityClass(priority) {
    switch (priority) {
      case 'High': return 'priority--high';
      case 'Medium': return 'priority--medium';
      case 'Low': return 'priority--low';
      default: return '';
    }
  }

  function getStatusClass(status) {
    switch (status) {
      case 'Todo': return 'status--todo';
      case 'In Progress': return 'status--in-progress';
      case 'Review': return 'status--review';
      case 'Done': return 'status--done';
      default: return '';
    }
  }

  function renderTable(tasks) {
    if (!tasks || tasks.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="6" class="task-table__empty">No tasks match your filters.</td></tr>';
      countDisplay.textContent = '0 tasks found';
      return;
    }

    var html = '';
    for (var i = 0; i < tasks.length; i++) {
      var task = tasks[i];
      html += '<tr>' +
        '<td class="task-table__title">' + escapeHtml(task.title) + '</td>' +
        '<td>' + escapeHtml(getProjectName(task.projectId)) + '</td>' +
        '<td>' + escapeHtml(getMemberName(task.assignedUserId || task.assignedMemberId)) + '</td>' +
        '<td><span class="priority-badge ' + getPriorityClass(task.priority) + '">' + escapeHtml(task.priority) + '</span></td>' +
        '<td><span class="status-badge ' + getStatusClass(task.status) + '">' + escapeHtml(task.status) + '</span></td>' +
        '<td>' + (task.dueDate ? escapeHtml(task.dueDate) : '<span class="no-date">—</span>') + '</td>' +
        '</tr>';
    }
    tableBody.innerHTML = html;
    countDisplay.textContent = tasks.length + ' task' + (tasks.length !== 1 ? 's' : '') + ' found';
  }

  function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  function getTasksForCurrentUser() {
    var allTasks = DataStore.getTasks();
    var session = window.TaskFlowSession;
    if (!session) return allTasks;
    if (session.role === 'Admin' || session.role === 'Manager') return allTasks;
    if (!session.memberId) return allTasks.filter(function (t) {
      return String(t.assignedUserId) === String(session.email);
    });
    return allTasks.filter(function (t) {
      return String(t.assignedUserId) === String(session.memberId);
    });
  }

  function refresh() {
    var allTasks = getTasksForCurrentUser();
    var filters = getFilterValues();

    var mappedFilters = {
      query: filters.query,
      status: filters.status,
      priority: filters.priority
    };

    if (filters.projectId !== '') mappedFilters.projectId = filters.projectId;
    if (filters.memberId !== '') mappedFilters.memberId = filters.memberId;

    var filtered = Filters.applyAllFilters(allTasks, mappedFilters);

    if (sortSelect.value === 'asc' || sortSelect.value === 'desc') {
      filtered = Filters.sortByDueDate(filtered, sortSelect.value);
    }

    renderTable(filtered);
  }

  function clearAll() {
    searchInput.value = '';
    statusSelect.value = '';
    prioritySelect.value = '';
    projectSelect.value = '';
    memberSelect.value = '';
    sortSelect.value = '';
    refresh();
  }

  function loadDropdowns() {
    var projects = DataStore.getProjects();
    var members = DataStore.getMembers();

    populateDropdown(projectSelect, projects, 'id', 'name', 'All Projects');
    populateDropdown(memberSelect, members, 'id', 'name', 'All Members');
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
    window.addEventListener('taskflow:projects-changed', function () {
      loadDropdowns();
      refresh();
    });
    window.addEventListener('taskflow:members-changed', function () {
      loadDropdowns();
      refresh();
    });
  }

  if (searchInput) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', setup);
    } else {
      setup();
    }
  }
})();