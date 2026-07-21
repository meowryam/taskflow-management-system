/**
 * Shared persistence boundary for TaskFlow modules.
 * Replace BrowserStorageAdapter with an API adapter later; consumers use the
 * repository methods below and do not access localStorage directly.
 */

export const STORAGE_KEYS = Object.freeze({
  tasks: 'taskflow.tasks',
  projects: 'taskflow.projects',
  members: 'taskflow.members'
});

export const TASKS_CHANGED_EVENT = 'taskflow:tasks-changed';
export const TASK_STATUSES = Object.freeze(['Todo', 'In Progress', 'Review', 'Done']);

class BrowserStorageAdapter {
  read(key) {
    const rawValue = window.localStorage.getItem(key);
    if (rawValue === null) return [];

    try {
      const value = JSON.parse(rawValue);
      return Array.isArray(value) ? value : [];
    } catch (error) {
      console.warn(`TaskFlow ignored invalid data in ${key}.`, error);
      return [];
    }
  }

  write(key, value) {
    window.localStorage.setItem(key, JSON.stringify(value));
  }
}

export class TaskRepository {
  constructor(adapter = new BrowserStorageAdapter()) {
    this.adapter = adapter;
  }

  getTasks() {
    return this.adapter.read(STORAGE_KEYS.tasks);
  }

  getTaskById(taskId) {
    return this.getTasks().find((task) => task.id === String(taskId)) ?? null;
  }

  addTask(task) {
    const tasks = this.getTasks();
    if (tasks.some((item) => item.id === task.id)) {
      throw new Error(`A task with ID ${task.id} already exists.`);
    }

    tasks.push({ ...task });
    this.adapter.write(STORAGE_KEYS.tasks, tasks);
    this.notify('added', task.id);
    return { ...task };
  }

  updateTask(taskId, changes) {
    const id = String(taskId);
    const tasks = this.getTasks();
    const index = tasks.findIndex((task) => task.id === id);
    if (index === -1) return null;
    if (Object.hasOwn(changes, 'status') && !TASK_STATUSES.includes(changes.status)) {
      throw new TypeError('Task status must be Todo, In Progress, Review, or Done.');
    }

    // Merge permits a Kanban module to send only { status: 'Done' }.
    tasks[index] = { ...tasks[index], ...changes, id };
    this.adapter.write(STORAGE_KEYS.tasks, tasks);
    this.notify('updated', id);
    return { ...tasks[index] };
  }

  deleteTask(taskId) {
    const id = String(taskId);
    const tasks = this.getTasks();
    const remainingTasks = tasks.filter((task) => task.id !== id);
    if (remainingTasks.length === tasks.length) return false;

    this.adapter.write(STORAGE_KEYS.tasks, remainingTasks);
    this.notify('deleted', id);
    return true;
  }

  getProjects() {
    return this.adapter.read(STORAGE_KEYS.projects);
  }

  getMembers() {
    return this.adapter.read(STORAGE_KEYS.members);
  }

  notify(action, taskId) {
    window.dispatchEvent(new CustomEvent(TASKS_CHANGED_EVENT, {
      detail: { action, taskId }
    }));
  }
}

export const taskStore = new TaskRepository();

// Named functions form the shared contract used by Task Creation and Board.
export const getTasks = () => taskStore.getTasks();
export const getTaskById = (taskId) => taskStore.getTaskById(taskId);
export const addTask = (task) => taskStore.addTask(task);
export const updateTask = (taskId, changes) => taskStore.updateTask(taskId, changes);
export const deleteTask = (taskId) => taskStore.deleteTask(taskId);
