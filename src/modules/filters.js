const Filters = (function () {

  function getAssignedMemberIds(task) {
    if (Array.isArray(task && task.assignedMemberIds)) {
      return task.assignedMemberIds.filter(function (id) { return id != null; });
    }
    var legacyId = task && (task.assignedMemberId !== undefined ? task.assignedMemberId : task.assignedUserId);
    return legacyId == null ? [] : [legacyId];
  }

  function searchTasks(tasks, query) {
    if (!query || typeof query !== 'string' || query.trim() === '') {
      return tasks;
    }
    const lowerQuery = query.trim().toLowerCase();
    return tasks.filter(function (task) {
      return task.title.toLowerCase().includes(lowerQuery);
    });
  }

  function filterByProject(tasks, projectId) {
    if (projectId === null || projectId === undefined || projectId === '') {
      return tasks;
    }
    return tasks.filter(function (task) {
      return String(task.projectId) === String(projectId);
    });
  }

  function filterByStatus(tasks, status) {
    if (!status || typeof status !== 'string' || status.trim() === '') {
      return tasks;
    }
    var filterStatus = status.trim();
    return tasks.filter(function (task) {
      return task.status === filterStatus;
    });
  }

  function filterByPriority(tasks, priority) {
    if (!priority || typeof priority !== 'string' || priority.trim() === '') {
      return tasks;
    }
    var filterPriority = priority.trim();
    return tasks.filter(function (task) {
      return task.priority === filterPriority;
    });
  }

  function filterByMember(tasks, memberId) {
    if (memberId === null || memberId === undefined || memberId === '') {
      return tasks;
    }
    return tasks.filter(function (task) {
      return getAssignedMemberIds(task).some(function (id) {
        return String(id) === String(memberId);
      });
    });
  }

  function applyAllFilters(tasks, filters) {
    if (!tasks || !Array.isArray(tasks)) return [];
    if (!filters || typeof filters !== 'object') return tasks;

    var result = tasks.slice();

    if (filters.query) {
      result = searchTasks(result, filters.query);
    }
    if (filters.projectId !== null && filters.projectId !== undefined && filters.projectId !== '') {
      result = filterByProject(result, filters.projectId);
    }
    if (filters.status) {
      result = filterByStatus(result, filters.status);
    }
    if (filters.priority) {
      result = filterByPriority(result, filters.priority);
    }
    if (filters.memberId !== null && filters.memberId !== undefined && filters.memberId !== '') {
      result = filterByMember(result, filters.memberId);
    }

    return result;
  }

  function sortByDueDate(tasks, order) {
    if (!tasks || !Array.isArray(tasks)) return [];

    var sorted = tasks.slice();
    var isAscending = order !== 'desc';

    sorted.sort(function (a, b) {
      if (a.dueDate === null || a.dueDate === undefined) return 1;
      if (b.dueDate === null || b.dueDate === undefined) return -1;

      var dateA = new Date(a.dueDate).getTime();
      var dateB = new Date(b.dueDate).getTime();

      if (isNaN(dateA)) return 1;
      if (isNaN(dateB)) return -1;

      return isAscending ? dateA - dateB : dateB - dateA;
    });

    return sorted;
  }

  function clearFilters() {
    return {};
  }

  return {
    searchTasks: searchTasks,
    filterByProject: filterByProject,
    filterByStatus: filterByStatus,
    filterByPriority: filterByPriority,
    filterByMember: filterByMember,
    applyAllFilters: applyAllFilters,
    sortByDueDate: sortByDueDate,
    clearFilters: clearFilters
  };
})();
