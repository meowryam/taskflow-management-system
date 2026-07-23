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

  function notifyProjectsChanged() {
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new CustomEvent('taskflow:projects-changed'));
    }
  }

  function notifyMembersChanged() {
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new CustomEvent('taskflow:members-changed'));
    }
  }

  function saveProjects(projects) {
    writeCollection(STORAGE_KEYS.PROJECTS, projects);
    notifyProjectsChanged();
  }

  function saveMembers(members) {
    writeCollection(STORAGE_KEYS.MEMBERS, members);
    notifyMembersChanged();
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

  // Seed is available as a utility but does NOT auto-run.
  // The app starts with no data; users create their own projects and tasks.
  // Call DataStore.seedDemoData() explicitly to load sample data for testing.

  function seed() {
    var members = [
      { id: 1, name: 'Demo Admin', email: 'admin@demo.local', role: 'Admin', initials: 'DA' },
      { id: 2, name: 'Demo Manager', email: 'manager@demo.local', role: 'Manager', initials: 'DM' },
      { id: 3, name: 'Demo Member', email: 'member@demo.local', role: 'Team Member', initials: 'DN' }
    ];
    var projects = [
      { id: 1, name: 'Sample Sprint', description: 'Example project with sample data for demonstration purposes.', deadline: getFutureDate(7), status: 'Active', createdAt: new Date().toISOString() },
      { id: 2, name: 'Sample Launch', description: 'Example product launch project for demonstration purposes.', deadline: getFutureDate(30), status: 'Active', createdAt: new Date().toISOString() }
    ];
    var tasks = [
      { id: 1, projectId: 1, title: 'Sample: Setup project', description: 'This is demo data. Create your own tasks to replace it.', assignedUserId: 3, dueDate: getFutureDate(2), priority: 'High', status: 'In Progress', createdAt: new Date().toISOString() },
      { id: 2, projectId: 1, title: 'Sample: Write test cases', description: 'This is demo data. Create your own tasks to replace it.', assignedUserId: 3, dueDate: getFutureDate(5), priority: 'Medium', status: 'Todo', createdAt: new Date().toISOString() },
      { id: 3, projectId: 1, title: 'Sample: Initialize layout', description: 'This is demo data. Create your own tasks to replace it.', assignedUserId: 1, dueDate: getPastDate(1), priority: 'Low', status: 'Done', createdAt: new Date().toISOString() },
      { id: 4, projectId: 2, title: 'Sample: Landing page', description: 'This is demo data. Create your own tasks to replace it.', assignedUserId: 2, dueDate: getFutureDate(10), priority: 'High', status: 'Todo', createdAt: new Date().toISOString() },
      { id: 5, projectId: 2, title: 'Sample: DNS setup', description: 'This is demo data. Create your own tasks to replace it.', assignedUserId: 1, dueDate: null, priority: 'High', status: 'Review', createdAt: new Date().toISOString() }
    ];

    saveMembers(members);
    saveProjects(projects);
    saveTasks(tasks);
  }

  // DO NOT auto-seed — users create their own real data.
  // To load demo data for testing, run: DataStore.seedDemoData() in the console.

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

  // Demo data seed is available via DataStore.seedDemoData() for testing.
  // No auto-seeding — the app starts empty. Users create their own data.

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
    saveMembers,
    seedDemoData: seed
  };
})();

if (typeof globalThis !== 'undefined') {
  globalThis.DataStore = DataStore;
}
