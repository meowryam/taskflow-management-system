import { createTask } from './taskService.js';

const form = document.getElementById('taskForm');
const taskSection = document.getElementById('task-creation-section');
const availabilityMessage = document.getElementById('taskAvailabilityMessage');
const formMessage = document.getElementById('taskFormMessage');
const submitButton = document.getElementById('createTaskButton');
const projectSelect = document.getElementById('taskProject');
const memberSelect = document.getElementById('taskAssignedMember');
const taskNavigation = Array.from(document.querySelectorAll('.sidebar__item')).find((item) => (
  item.querySelector('.sidebar__label')?.textContent.trim() === 'Tasks'
));
let projects = [];
let members = [];
let isSubmitting = false;

function normalizeReference(item, type) {
  const rawId = item.id ?? item[`${type}Id`] ?? item[`${type === 'member' ? 'user' : type}Id`];
  const label = type === 'project'
    ? (item.name ?? item.projectName ?? item.title)
    : (item.name ?? item.fullName ?? item.memberName);
  return rawId == null ? null : { id: rawId, label: label || `Unnamed ${type}` };
}

function populateSelect(select, items, placeholder) {
  select.replaceChildren(new Option(placeholder, ''));
  items.forEach((item) => select.add(new Option(item.label, item.id)));
}

function loadDependencies() {
  projects = globalThis.DataStore.getProjects().map((item) => normalizeReference(item, 'project')).filter(Boolean);
  var allMembers = globalThis.DataStore.getMembers().map((item) => normalizeReference(item, 'member')).filter(Boolean);

  var session = window.TaskFlowSession;
  if (session && session.role === 'Team Member') {
    var memberId = session.memberId || session.email;
    members = allMembers.filter(function (m) {
      return String(m.id) === String(memberId) ||
             String(m.label).toLowerCase() === String(session.email).toLowerCase();
    });
  } else {
    members = allMembers;
  }

  populateSelect(projectSelect, projects, 'Select a project');
  populateSelect(memberSelect, members, 'Select a member');

  const missing = [];
  if (projects.length === 0) missing.push('projects');
  if (members.length === 0) missing.push('members');
  submitButton.disabled = missing.length > 0;
  availabilityMessage.textContent = missing.length
    ? `Task creation is unavailable until ${missing.join(' and ')} exist.`
    : '';
}

function readForm() {
  return {
    title: form.elements.title.value,
    description: form.elements.description.value,
    projectId: form.elements.projectId.value,
    assignedMemberId: form.elements.assignedMemberId.value,
    dueDate: form.elements.dueDate.value,
    priority: form.elements.priority.value,
    status: form.elements.status.value
  };
}

function clearErrors() {
  form.querySelectorAll('.task-form__error').forEach((element) => { element.textContent = ''; });
  form.querySelectorAll('[aria-invalid="true"]').forEach((element) => element.removeAttribute('aria-invalid'));
}

function renderErrors(errors) {
  clearErrors();
  Object.entries(errors).forEach(([fieldName, message]) => {
    const field = form.elements[fieldName];
    const error = document.getElementById(`${fieldName}Error`);
    if (field) field.setAttribute('aria-invalid', 'true');
    if (error) error.textContent = message;
  });
  form.querySelector('[aria-invalid="true"]')?.focus();
}

function showMessage(message, type) {
  formMessage.textContent = message;
  formMessage.className = `task-form__message task-form__message--${type}`;
}

function clearFormState() {
  clearErrors();
  formMessage.textContent = '';
  formMessage.className = 'task-form__message';
}

function handleSubmit(event) {
  event.preventDefault();
  if (isSubmitting || submitButton.disabled) return;

  isSubmitting = true;
  submitButton.disabled = true;
  clearErrors();

  try {
    const result = createTask(readForm(), projects, members);
    if (!result.isValid) {
      renderErrors(result.errors);
      showMessage('Please correct the highlighted fields.', 'error');
      return;
    }

    form.reset();
    clearFormState();
    showMessage('Task created successfully.', 'success');
  } catch (error) {
    console.error('Task creation failed.', error);
    showMessage('The task could not be saved. Check browser storage and try again.', 'error');
  } finally {
    isSubmitting = false;
    submitButton.disabled = projects.length === 0 || members.length === 0;
  }
}

function showTaskCreation(event) {
  event?.preventDefault();
  document.querySelectorAll('.main-content > section').forEach((section) => {
    section.style.display = section === taskSection ? '' : 'none';
  });
  document.querySelector('.header__title').textContent = 'Create Task';
  document.querySelectorAll('.sidebar__item').forEach((item) => item.classList.remove('sidebar__item--active'));
  taskNavigation?.classList.add('sidebar__item--active');
  document.getElementById('sidebar')?.classList.remove('sidebar--open');
  loadDependencies();
}

if (form) {
  form.addEventListener('submit', handleSubmit);
  form.addEventListener('reset', () => window.setTimeout(clearFormState, 0));
  window.showCreateTaskForm = showTaskCreation;
  window.addEventListener('taskflow:projects-changed', loadDependencies);
  window.addEventListener('taskflow:members-changed', loadDependencies);
  loadDependencies();
  window.loadTaskCreationDeps = loadDependencies;
}