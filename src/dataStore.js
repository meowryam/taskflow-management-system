const DataStore = (function () {
  const STORAGE_KEYS = {
    TASKS: 'taskflow_tasks',
    PROJECTS: 'taskflow_projects',
    MEMBERS: 'taskflow_members'
  };

  function init() {
    if (!localStorage.getItem(STORAGE_KEYS.TASKS)) {
      seed();
    }
  }

  function getTasks() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TASKS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  function getProjects() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PROJECTS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  function getMembers() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MEMBERS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  function saveTasks(tasks) {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  }

  function saveProjects(projects) {
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
  }

  function saveMembers(members) {
    localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));
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

  init();

  return {
    getTasks,
    getProjects,
    getMembers,
    saveTasks,
    saveProjects,
    saveMembers
  };
})();
