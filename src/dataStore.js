const DataStore = (function () {
  const STORAGE_KEYS = Object.freeze({
    TASKS: 'taskflow_tasks',
    PROJECTS: 'taskflow_projects',
    MEMBERS: 'taskflow_members'
  });
  const TASKS_CHANGED_EVENT = 'taskflow:tasks-changed';
  const TASK_STATUSES = Object.freeze(['Todo', 'In Progress', 'Review', 'Done']);

  function readCollection(key) {
    try {
      const data = localStorage.getItem(key);
      const collection = data ? JSON.parse(data) : [];
      return Array.isArray(collection) ? collection : [];
    } catch {
      return [];
    }
  }

  function writeCollection(key, collection) {
    localStorage.setItem(key, JSON.stringify(collection));
  }

  function addAssignmentCompatibility(task) {
    const compatibleMemberId = Array.isArray(task.assignedMemberIds)
      ? task.assignedMemberIds[0]
      : task.assignedMemberId;
    if (compatibleMemberId !== undefined && task.assignedUserId === undefined) {
      Object.defineProperty(task, 'assignedUserId', {
        configurable: true,
        enumerable: false,
        value: compatibleMemberId
      });
    }
    return task;
  }

  function getTasks() {
    return readCollection(STORAGE_KEYS.TASKS).map(addAssignmentCompatibility);
  }

  function getProjects() {
    return readCollection(STORAGE_KEYS.PROJECTS);
  }

  function getMembers() {
    return readCollection(STORAGE_KEYS.MEMBERS);
  }

  function saveTasks(tasks) {
    writeCollection(STORAGE_KEYS.TASKS, tasks);
  }

  function saveProjects(projects) {
    writeCollection(STORAGE_KEYS.PROJECTS, projects);
  }

  function saveMembers(members) {
    writeCollection(STORAGE_KEYS.MEMBERS, members);
  }

  function getTaskById(taskId) {
    return getTasks().find((task) => String(task.id) === String(taskId)) || null;
  }

  function validateTaskStatus(status) {
    if (!TASK_STATUSES.includes(status)) {
      throw new TypeError('Task status must be Todo, In Progress, Review, or Done.');
    }
  }

  function notifyTasksChanged(action, taskId) {
    if (typeof window === 'undefined' || typeof window.dispatchEvent !== 'function') return;
    window.dispatchEvent(new CustomEvent(TASKS_CHANGED_EVENT, {
      detail: { action, taskId }
    }));
  }

  function addTask(task) {
    validateTaskStatus(task.status);
    const tasks = getTasks();
    if (tasks.some((item) => String(item.id) === String(task.id))) {
      throw new Error(`A task with ID ${task.id} already exists.`);
    }

    tasks.push({ ...task });
    saveTasks(tasks);
    notifyTasksChanged('added', task.id);
    return { ...task };
  }

  function updateTask(taskId, changes) {
    if (Object.hasOwn(changes, 'status')) validateTaskStatus(changes.status);
    const tasks = getTasks();
    const index = tasks.findIndex((task) => String(task.id) === String(taskId));
    if (index === -1) return null;

    tasks[index] = { ...tasks[index], ...changes, id: tasks[index].id };
    saveTasks(tasks);
    notifyTasksChanged('updated', tasks[index].id);
    return { ...tasks[index] };
  }

  function deleteTask(taskId) {
    const tasks = getTasks();
    const remainingTasks = tasks.filter((task) => String(task.id) !== String(taskId));
    if (remainingTasks.length === tasks.length) return false;

    saveTasks(remainingTasks);
    notifyTasksChanged('deleted', taskId);
    return true;
  }

  function seed() {
    const members = [
      { id: 1, name: 'TaskFlow Admin', email: 'admin@taskflow.local', role: 'Admin', initials: 'TA' },
      { id: 2, name: 'Project Manager', email: 'manager@taskflow.local', role: 'Manager', initials: 'PM' },
      { id: 3, name: 'Team Member', email: 'member@taskflow.local', role: 'Team Member', initials: 'TM' }
    ];
    const projects = [
      { id: 1, name: 'TaskFlow Sprint', description: 'Build and integrate the TaskFlow management system.', deadline: getFutureDate(7), status: 'Active' },
      { id: 2, name: 'Website Launch', description: 'Prepare the product website for launch.', deadline: getFutureDate(30), status: 'Planned' }
    ];
    const tasks = [
      { id: 1, projectId: 1, title: 'Create project module', description: 'Implement project create, edit, delete, and list behavior.', assignedUserId: 3, dueDate: getFutureDate(2), priority: 'High', status: 'In Progress', createdAt: new Date().toISOString() },
      { id: 2, projectId: 1, title: 'Prepare manual test cases', description: 'Write test cases for the integrated TaskFlow product.', assignedUserId: 3, dueDate: getFutureDate(5), priority: 'Medium', status: 'Todo', createdAt: new Date().toISOString() },
      { id: 3, projectId: 1, title: 'Initialize application layout', description: 'Create the initial application structure and dashboard shell.', assignedUserId: 1, dueDate: getPastDate(1), priority: 'Low', status: 'Done', createdAt: new Date().toISOString() },
      { id: 4, projectId: 2, title: 'Create landing page', description: 'Build the responsive landing page.', assignedUserId: 2, dueDate: getFutureDate(10), priority: 'High', status: 'Todo', createdAt: new Date().toISOString() },
      { id: 5, projectId: 2, title: 'Setup domain and hosting', description: 'Configure DNS and deploy to production server.', assignedUserId: 1, dueDate: null, priority: 'High', status: 'Review', createdAt: new Date().toISOString() }
    ];

    saveMembers(members);
    saveProjects(projects);
    saveTasks(tasks);
  }

  function getFutureDate(daysFromNow) {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date.toISOString().split('T')[0];
  }

  function getPastDate(daysAgo) {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date.toISOString().split('T')[0];
  }

  if (!localStorage.getItem(STORAGE_KEYS.TASKS)) seed();

  return {
    STORAGE_KEYS,
    TASKS_CHANGED_EVENT,
    TASK_STATUSES,
    getTasks,
    getTaskById,
    getProjects,
    getMembers,
    addTask,
    updateTask,
    deleteTask,
    saveTasks,
    saveProjects,
    saveMembers
  };
})();

if (typeof globalThis !== 'undefined') {
  globalThis.DataStore = DataStore;
}
