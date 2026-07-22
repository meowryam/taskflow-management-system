/* ── Prompt Type Configuration ───────────────────────────────── */
var PROMPT_CONFIG = {
  'project-breakdown': {
    role: 'Senior Software Architect',
    outputFormat: 'Structured breakdown with sections: architecture overview, component list, data flow, technology decisions, and risk assessment.',
  },
  'task-description': {
    role: 'Senior Project Manager',
    outputFormat: 'A clear task description with: summary, acceptance criteria, dependencies, estimated effort, and definition of done.',
  },
  'acceptance-criteria': {
    role: 'Senior Business Analyst',
    outputFormat: 'A Gherkin-style table with Scenario ID, Given/When/Then steps, and priority for each scenario.',
  },
  'code-review': {
    role: 'Senior Software Engineer',
    outputFormat: 'A review checklist covering: code quality, security, performance, error handling, and adherence to coding standards.',
  },
  'test-cases': {
    role: 'Senior QA Engineer',
    outputFormat: 'A table with columns: Test Case ID, Title, Preconditions, Steps, Expected Result, Priority.',
  },
  'documentation': {
    role: 'Senior Technical Writer',
    outputFormat: 'A documentation outline with: overview, prerequisites, step-by-step instructions, configuration reference, troubleshooting, and FAQs.',
  },
};

var SUMMARY_PROMPT = {
  role: 'Senior Developer onboarding a new team member',
  outputFormat: [
    'Provide:',
    '- Project purpose',
    '- Main modules',
    '- Current progress',
    '- Completed work',
    '- Active tasks',
    '- Pending tasks',
    '- Team members and responsibilities',
    '- Important technical notes',
  ].join('\n'),
};

/* ── Context Data ─────────────────────────────────────────────── */
var PromptContextStore = {
  fallbackData: {
    members: [
      { id: 'member-1', name: 'Hassan Ahmed', role: 'Frontend Developer', email: 'hassan@taskflow.local' },
      { id: 'member-2', name: 'Ali', role: 'Backend Developer', email: 'ali@taskflow.local' },
      { id: 'member-3', name: 'Sara', role: 'QA Engineer', email: 'sara@taskflow.local' },
    ],
    projects: [
      {
        id: 'project-1',
        name: 'TaskFlow Management System',
        description: 'A project management platform for managing projects, tasks, members, and reports.',
        status: 'In Progress',
      },
    ],
    tasks: [
      {
        id: 'task-1',
        projectId: 'project-1',
        title: 'Implement Authentication Module',
        description: 'Add a secure login flow, session persistence, and route protection.',
        assignedMemberIds: ['member-1'],
        priority: 'High',
        status: 'In Progress',
        dueDate: '2026-08-15',
        completionPercentage: 60,
      },
    ],
  },

  getSnapshot: function () {
    var store = window.DataStore;
    var projects = store && typeof store.getProjects === 'function' ? store.getProjects() : [];
    var tasks = store && typeof store.getTasks === 'function' ? store.getTasks() : [];
    var members = store && typeof store.getMembers === 'function' ? store.getMembers() : [];

    if (!projects.length && !tasks.length && !members.length) {
      return {
        projects: PromptContextStore.fallbackData.projects.slice(),
        tasks: PromptContextStore.fallbackData.tasks.slice(),
        members: PromptContextStore.fallbackData.members.slice(),
        isFallback: true,
      };
    }

    return {
      projects: projects,
      tasks: tasks,
      members: members,
      isFallback: false,
    };
  },

  getVisibleSnapshot: function () {
    var snapshot = PromptContextStore.getSnapshot();
    var session = window.TaskFlowSession || null;

    if (!session || session.role !== 'Team Member') {
      return snapshot;
    }

    var visibleTasks = snapshot.tasks.filter(function (task) {
      return PromptContextStore._isTaskOwnedBySession(task, session);
    });
    var visibleProjectIds = {};
    visibleTasks.forEach(function (task) {
      visibleProjectIds[String(task.projectId)] = true;
    });

    return {
      projects: snapshot.projects.filter(function (project) {
        return visibleProjectIds[String(project.id)];
      }),
      tasks: visibleTasks,
      members: snapshot.members,
      isFallback: snapshot.isFallback,
    };
  },

  _isTaskOwnedBySession: function (task, session) {
    var assignedIds = PromptContextStore.getAssignedMemberIds(task);
    if (session.memberId) {
      return assignedIds.some(function (id) {
        return String(id) === String(session.memberId);
      });
    }

    return assignedIds.some(function (id) {
      return String(id) === String(session.email);
    }) || String(task.assignedUserId) === String(session.email);
  },

  getAssignedMemberIds: function (task) {
    if (Array.isArray(task && task.assignedMemberIds)) {
      return task.assignedMemberIds.filter(function (id) {
        return id !== null && id !== undefined && id !== '';
      });
    }

    var fallbackId = task && (task.assignedMemberId || task.assignedUserId);
    return fallbackId === null || fallbackId === undefined || fallbackId === '' ? [] : [fallbackId];
  },

  findProjectById: function (projects, projectId) {
    return projects.find(function (project) {
      return String(project.id) === String(projectId);
    }) || null;
  },

  findTaskById: function (tasks, taskId) {
    return tasks.find(function (task) {
      return String(task.id) === String(taskId);
    }) || null;
  },

  findMemberById: function (members, memberId) {
    return members.find(function (member) {
      return String(member.id) === String(memberId);
    }) || null;
  },

  getProjectTasks: function (tasks, projectId) {
    return tasks.filter(function (task) {
      return String(task.projectId) === String(projectId);
    });
  },

  getProjectMembers: function (projectTasks, members) {
    var seen = {};
    var related = [];

    projectTasks.forEach(function (task) {
      PromptContextStore.getAssignedMemberIds(task).forEach(function (memberId) {
        var member = PromptContextStore.findMemberById(members, memberId);
        if (member && !seen[String(member.id)]) {
          seen[String(member.id)] = true;
          related.push(member);
        }
      });
    });

    return related;
  },

  getTaskCompletion: function (task) {
    var explicitValue = PromptContextStore._firstDefined(task, [
      'completionPercentage',
      'completionPercent',
      'progressPercentage',
      'progress',
      'implementationProgress',
    ]);

    if (explicitValue !== undefined && explicitValue !== null && explicitValue !== '') {
      var parsed = Number(explicitValue);
      if (!isNaN(parsed)) {
        return PromptContextStore._clampPercentage(parsed);
      }
    }

    switch (task && task.status) {
      case 'Done':
        return 100;
      case 'Review':
        return 85;
      case 'In Progress':
        return 60;
      case 'Todo':
      default:
        return 0;
    }
  },

  getProjectProgress: function (project, projectTasks) {
    var explicitValue = PromptContextStore._firstDefined(project, [
      'progressPercentage',
      'progress',
      'completionPercentage',
    ]);

    if (explicitValue !== undefined && explicitValue !== null && explicitValue !== '') {
      var parsed = Number(explicitValue);
      if (!isNaN(parsed)) {
        return PromptContextStore._clampPercentage(parsed);
      }
    }

    if (!projectTasks.length) {
      return 0;
    }

    var total = 0;
    for (var i = 0; i < projectTasks.length; i++) {
      total += PromptContextStore.getTaskCompletion(projectTasks[i]);
    }

    return Math.round(total / projectTasks.length);
  },

  getProjectStatus: function (project, projectTasks) {
    if (project && project.status) {
      if (project.status === 'Active') return 'In Progress';
      return project.status;
    }

    if (!projectTasks.length) {
      return 'Not Started';
    }

    var hasActive = projectTasks.some(function (task) {
      return task.status && task.status !== 'Done';
    });

    return hasActive ? 'In Progress' : 'Completed';
  },

  getTaskOwnerLabel: function (task, members) {
    var assignedIds = PromptContextStore.getAssignedMemberIds(task);
    if (!assignedIds.length) return 'Unassigned';

    return assignedIds.map(function (memberId) {
      var member = PromptContextStore.findMemberById(members, memberId);
      return member ? member.name : 'Unknown member';
    }).join(', ');
  },

  formatMemberLabel: function (member) {
    if (!member) return 'Unknown member';
    return member.name + (member.role ? ' (' + member.role + ')' : '');
  },

  formatDate: function (value) {
    if (!value) return 'Not specified';

    var date = new Date(value);
    if (isNaN(date.getTime())) return String(value);

    return date.toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  },

  getTaskSummaryLabel: function (task, members) {
    return task.title + ' (' + (task.status || 'Unknown status') + ', ' + (task.priority || 'No priority') + ', ' + PromptContextStore.getTaskOwnerLabel(task, members) + ', ' + PromptContextStore.getTaskCompletion(task) + '% complete)';
  },

  sortByLabel: function (items) {
    return items.slice().sort(function (a, b) {
      var left = a.name || a.title || '';
      var right = b.name || b.title || '';
      return String(left).localeCompare(String(right));
    });
  },

  _clampPercentage: function (value) {
    return Math.max(0, Math.min(100, Math.round(value)));
  },

  _firstDefined: function (source, keys) {
    if (!source) return undefined;

    for (var i = 0; i < keys.length; i++) {
      var value = source[keys[i]];
      if (value !== undefined && value !== null && value !== '') {
        return value;
      }
    }

    return undefined;
  },
};

/* ── Prompt Generation Logic ─────────────────────────────────── */
var PromptGenerator = {
  generate: function (data) {
    PromptGenerator._trimAll(data);

    var config = PROMPT_CONFIG[data.promptType];
    if (!config) {
      return '';
    }

    var lines = [];
    var project = data.selectedProject;
    var selectedTask = data.selectedTask;

    lines.push('Role:');
    lines.push('Act as a ' + config.role + '.');
    lines.push('');

    lines.push('Context:');
    lines.push('You are working on the ' + (project ? project.name : 'current project') + '.');
    lines.push('Prompt Category: ' + PromptGenerator._getPromptTypeLabel(data.promptType) + '.');
    if (data.context) {
      lines.push(data.context);
    }
    lines.push('');

    PromptGenerator._appendProjectSection(lines, data);
    PromptGenerator._appendTaskSection(lines, data);

    lines.push('Task:');
    lines.push(data.mainTask);
    lines.push('');

    lines.push('Constraints:');
    lines.push(data.constraints || 'Follow the existing TaskFlow frontend structure, reuse current localStorage-backed data, and avoid unrelated module changes.');
    lines.push('');

    lines.push('Expected Output Format:');
    lines.push(data.expectedFormat || config.outputFormat);
    lines.push('');

    lines.push('Edge Cases:');
    lines.push(data.edgeCases || PromptGenerator._getDefaultEdgeCases(selectedTask));

    return lines.join('\n');
  },

  generateProjectSummary: function (data) {
    PromptGenerator._trimAll(data);

    var lines = [];

    lines.push('Role:');
    lines.push('Act as a ' + SUMMARY_PROMPT.role + '.');
    lines.push('');

    lines.push('Context:');
    lines.push('You are onboarding a new team member to the ' + data.selectedProject.name + '.');
    if (data.context) {
      lines.push(data.context);
    }
    lines.push('');

    PromptGenerator._appendProjectSection(lines, data);
    PromptGenerator._appendSummarySection(lines, data);

    lines.push('Task:');
    lines.push('Provide an onboarding summary prompt for a new team member using the current project context, active work, completed work, and team ownership details.');
    lines.push('');

    lines.push('Constraints:');
    lines.push(data.constraints || 'Keep the summary practical, specific to the current TaskFlow state, and aligned with the existing frontend and localStorage architecture.');
    lines.push('');

    lines.push('Expected Output Format:');
    lines.push(SUMMARY_PROMPT.outputFormat);
    lines.push('');

    lines.push('Edge Cases:');
    lines.push(data.edgeCases || 'Handle projects with no completed tasks, no active tasks, missing due dates, changing ownership, and partial implementation details.');

    return lines.join('\n');
  },

  validate: function (data, options) {
    var errors = {};
    var mode = options && options.mode ? options.mode : 'default';

    if (mode !== 'summary' && !data.promptType) {
      errors.promptType = 'Please select a prompt type.';
    }
    if (!data.projectId || !String(data.projectId).trim()) {
      errors.projectId = 'Please select a project.';
    }
    if (mode !== 'summary' && (!data.mainTask || !data.mainTask.trim())) {
      errors.mainTask = 'Main task description is required.';
    }

    return errors;
  },

  _appendProjectSection: function (lines, data) {
    var project = data.selectedProject;

    lines.push('Project Information:');
    lines.push('Project: ' + (project ? project.name : 'Unknown project'));
    lines.push('Description: ' + ((project && project.description) || 'No description provided.'));
    lines.push('Status: ' + data.projectStatus);
    lines.push('Progress: ' + data.projectProgress + '%');
    lines.push('Team:');

    if (data.projectMembers.length) {
      data.projectMembers.forEach(function (member) {
        lines.push('- ' + PromptContextStore.formatMemberLabel(member));
      });
    } else {
      lines.push('- No related team members found.');
    }

    lines.push('Related Tasks:');
    if (data.projectTasks.length) {
      data.projectTasks.forEach(function (task) {
        lines.push('- ' + PromptContextStore.getTaskSummaryLabel(task, data.members));
      });
    } else {
      lines.push('- No related tasks found.');
    }
    lines.push('');
  },

  _appendTaskSection: function (lines, data) {
    var selectedTask = data.selectedTask;

    lines.push('Task Information:');
    if (!selectedTask) {
      lines.push('No existing project task was selected. Use the project context and the task request below to guide the response.');
      lines.push('');
      return;
    }

    lines.push('Task: ' + selectedTask.title);
    lines.push('Description: ' + (selectedTask.description || 'No task description provided.'));
    lines.push('Assigned Member: ' + data.taskOwnerLabel);
    lines.push('Priority: ' + (selectedTask.priority || 'Not specified'));
    lines.push('Current Status: ' + (selectedTask.status || 'Not specified'));
    lines.push('Implementation Progress: ' + data.taskCompletion + '%');
    lines.push('Due Date: ' + PromptContextStore.formatDate(selectedTask.dueDate));
    lines.push('');
  },

  _appendSummarySection: function (lines, data) {
    var buckets = { completed: [], active: [], pending: [] };

    data.projectTasks.forEach(function (task) {
      if (task.status === 'Done') {
        buckets.completed.push(task);
      } else if (task.status === 'Todo') {
        buckets.pending.push(task);
      } else {
        buckets.active.push(task);
      }
    });

    lines.push('Current Project Snapshot:');
    lines.push('Completed Work:');
    PromptGenerator._appendTaskBucket(lines, buckets.completed, data.members);
    lines.push('Active Tasks:');
    PromptGenerator._appendTaskBucket(lines, buckets.active, data.members);
    lines.push('Pending Tasks:');
    PromptGenerator._appendTaskBucket(lines, buckets.pending, data.members);
    lines.push('');
  },

  _appendTaskBucket: function (lines, tasks, members) {
    if (!tasks.length) {
      lines.push('- None.');
      return;
    }

    tasks.forEach(function (task) {
      lines.push('- ' + PromptContextStore.getTaskSummaryLabel(task, members));
    });
  },

  _getPromptTypeLabel: function (promptType) {
    switch (promptType) {
      case 'project-breakdown':
        return 'Project Breakdown';
      case 'task-description':
        return 'Task Description';
      case 'acceptance-criteria':
        return 'Acceptance Criteria';
      case 'code-review':
        return 'Code Review';
      case 'test-cases':
        return 'Test Cases';
      case 'documentation':
        return 'Documentation';
      default:
        return 'Prompt';
    }
  },

  _getDefaultEdgeCases: function (selectedTask) {
    var defaults = [
      'Incomplete project metadata or missing task descriptions.',
      'Conflicting ownership, outdated status, or stale completion percentages.',
      'Dependencies blocked by incomplete related tasks or missing team coverage.',
      'Regression risk when changes affect existing TaskFlow localStorage flows or shared UI sections.',
    ];

    if (!selectedTask) {
      defaults.unshift('No existing task was selected, so the response must infer scope from project context and the requested task.');
    }

    return defaults.join(' ');
  },

  _trimAll: function (data) {
    for (var key in data) {
      if (data.hasOwnProperty(key) && typeof data[key] === 'string') {
        data[key] = data[key].trim();
      }
    }
  },
};

/* ── UI Controller ───────────────────────────────────────────── */
var UiController = {
  els: {},
  state: {
    snapshot: null,
  },
  _toastTimer: null,

  init: function () {
    UiController._cacheElements();
    UiController._bindEvents();
    UiController._restoreLastType();
    UiController._refreshContextData();
    UiController._updateDefaults();
  },

  _cacheElements: function () {
    UiController.els = {
      form: document.getElementById('promptForm'),
      promptType: document.getElementById('promptType'),
      projectId: document.getElementById('projectSelect'),
      projectSummaryBtn: document.getElementById('generateSummaryBtn'),
      taskId: document.getElementById('taskSelect'),
      techStack: document.getElementById('techStack'),
      context: document.getElementById('context'),
      mainTask: document.getElementById('mainTask'),
      constraints: document.getElementById('constraints'),
      expectedFormat: document.getElementById('expectedFormat'),
      edgeCases: document.getElementById('edgeCases'),
      generateBtn: document.getElementById('generateBtn'),
      copyBtn: document.getElementById('copyBtn'),
      resetBtn: document.getElementById('resetBtn'),
      output: document.getElementById('output'),
      toast: document.getElementById('toast'),
      projectEmpty: document.getElementById('projectContextEmpty'),
      projectDetails: document.getElementById('projectDetails'),
      projectMeta: document.getElementById('projectMeta'),
      projectMembers: document.getElementById('projectMembers'),
      projectTasks: document.getElementById('projectTasks'),
      taskEmpty: document.getElementById('taskContextEmpty'),
      taskDetails: document.getElementById('taskDetails'),
      taskMeta: document.getElementById('taskMeta'),
      dataStatus: document.getElementById('promptBuilderDataStatus'),
    };

    UiController.els.validation = {
      promptType: document.getElementById('validPromptType'),
      projectId: document.getElementById('validProjectId'),
      mainTask: document.getElementById('validMainTask'),
    };
  },

  _bindEvents: function () {
    UiController.els.promptType.addEventListener('change', function () {
      UiController._updateDefaults();
      UiController._saveLastType();
    });

    UiController.els.projectId.addEventListener('change', function () {
      UiController._handleProjectChange();
    });

    UiController.els.taskId.addEventListener('change', function () {
      UiController._renderTaskContext();
    });

    UiController.els.generateBtn.addEventListener('click', function (e) {
      e.preventDefault();
      UiController._handleGenerate();
    });

    UiController.els.projectSummaryBtn.addEventListener('click', function (e) {
      e.preventDefault();
      UiController._handleSummaryGenerate();
    });

    UiController.els.copyBtn.addEventListener('click', function () {
      UiController._handleCopy();
    });

    UiController.els.resetBtn.addEventListener('click', function (e) {
      e.preventDefault();
      UiController._handleReset();
    });

    UiController.els.form.addEventListener('submit', function (e) {
      e.preventDefault();
      UiController._handleGenerate();
    });

    var promptNav = document.getElementById('nav-prompt-builder');
    if (promptNav) {
      promptNav.addEventListener('click', function () {
        UiController._refreshContextData();
      });
    }

    window.addEventListener('focus', function () {
      UiController._refreshContextData();
    });
    window.addEventListener('taskflow:tasks-changed', function () {
      UiController._refreshContextData();
    });
  },

  _refreshContextData: function () {
    UiController.state.snapshot = PromptContextStore.getVisibleSnapshot();
    UiController._populateProjectOptions();
    UiController._renderProjectContext();
    UiController._renderTaskContext();
    UiController._renderDataStatus();
  },

  _populateProjectOptions: function () {
    var snapshot = UiController.state.snapshot;
    var selectedProjectId = UiController.els.projectId.value;

    UiController.els.projectId.replaceChildren(new Option('Select a project', ''));
    PromptContextStore.sortByLabel(snapshot.projects).forEach(function (project) {
      UiController.els.projectId.add(new Option(project.name || 'Untitled project', project.id));
    });

    if (PromptContextStore.findProjectById(snapshot.projects, selectedProjectId)) {
      UiController.els.projectId.value = selectedProjectId;
    }

    UiController._populateTaskOptions();
  },

  _populateTaskOptions: function () {
    var snapshot = UiController.state.snapshot;
    var selectedProjectId = UiController.els.projectId.value;
    var selectedTaskId = UiController.els.taskId.value;
    var projectTasks = PromptContextStore.sortByLabel(PromptContextStore.getProjectTasks(snapshot.tasks, selectedProjectId));

    UiController.els.taskId.replaceChildren(new Option('Select a related task', ''));
    projectTasks.forEach(function (task) {
      UiController.els.taskId.add(new Option(task.title || 'Untitled task', task.id));
    });
    UiController.els.taskId.disabled = !selectedProjectId || projectTasks.length === 0;

    if (PromptContextStore.findTaskById(projectTasks, selectedTaskId)) {
      UiController.els.taskId.value = selectedTaskId;
    } else {
      UiController.els.taskId.value = '';
    }
  },

  _handleProjectChange: function () {
    UiController._populateTaskOptions();
    UiController._renderProjectContext();
    UiController._renderTaskContext();
  },

  _renderDataStatus: function () {
    var snapshot = UiController.state.snapshot;
    if (!snapshot.projects.length) {
      UiController.els.dataStatus.textContent = 'No projects are available yet. Create a project to generate context-aware prompts.';
      return;
    }

    if (snapshot.isFallback) {
      UiController.els.dataStatus.textContent = 'Using isolated fallback data because project, task, and member records are not available yet.';
      return;
    }

    UiController.els.dataStatus.textContent = snapshot.projects.length + ' project' + (snapshot.projects.length === 1 ? '' : 's') + ' loaded from TaskFlow data.';
  },

  _renderProjectContext: function () {
    var details = UiController._getSelectedDetails();
    var project = details.project;

    if (!project) {
      UiController.els.projectEmpty.hidden = false;
      UiController.els.projectDetails.hidden = true;
      UiController.els.projectMeta.innerHTML = '';
      UiController.els.projectMembers.innerHTML = '';
      UiController.els.projectTasks.innerHTML = '';
      return;
    }

    UiController.els.projectEmpty.hidden = true;
    UiController.els.projectDetails.hidden = false;

    UiController.els.projectMeta.innerHTML = [
      UiController._metaItem('Project', project.name || 'Untitled project'),
      UiController._metaItem('Description', project.description || 'No description provided.'),
      UiController._metaItem('Status', details.projectStatus),
      UiController._metaItem('Progress', details.projectProgress + '%'),
    ].join('');

    UiController._renderList(UiController.els.projectMembers, details.projectMembers, function (member) {
      return PromptContextStore.formatMemberLabel(member);
    }, 'No related team members found.');

    UiController._renderList(UiController.els.projectTasks, details.projectTasks, function (task) {
      return PromptContextStore.getTaskSummaryLabel(task, details.members);
    }, 'No related tasks found.');
  },

  _renderTaskContext: function () {
    var details = UiController._getSelectedDetails();
    var task = details.task;

    if (!task) {
      UiController.els.taskEmpty.hidden = false;
      UiController.els.taskDetails.hidden = true;
      UiController.els.taskMeta.innerHTML = '';
      UiController.els.taskEmpty.textContent = details.project ? 'Select a task to include ownership, priority, status, due date, and completion details.' : 'Select a project first to view related tasks.';
      return;
    }

    UiController.els.taskEmpty.hidden = true;
    UiController.els.taskDetails.hidden = false;
    UiController.els.taskMeta.innerHTML = [
      UiController._metaItem('Task', task.title || 'Untitled task'),
      UiController._metaItem('Description', task.description || 'No description provided.'),
      UiController._metaItem('Assigned Member', details.taskOwnerLabel),
      UiController._metaItem('Priority', task.priority || 'Not specified'),
      UiController._metaItem('Status', task.status || 'Not specified'),
      UiController._metaItem('Due Date', PromptContextStore.formatDate(task.dueDate)),
      UiController._metaItem('Completion', details.taskCompletion + '%'),
    ].join('');
  },

  _metaItem: function (label, value) {
    return '<div class="pb-meta-item"><span class="pb-meta-label">' + UiController._escapeHtml(label) + '</span><span class="pb-meta-value">' + UiController._escapeHtml(value) + '</span></div>';
  },

  _renderList: function (container, items, formatter, emptyText) {
    container.innerHTML = '';
    if (!items.length) {
      var empty = document.createElement('li');
      empty.className = 'pb-context-list__empty';
      empty.textContent = emptyText;
      container.appendChild(empty);
      return;
    }

    items.forEach(function (item) {
      var li = document.createElement('li');
      li.textContent = formatter(item);
      container.appendChild(li);
    });
  },

  _getSelectedDetails: function () {
    var snapshot = UiController.state.snapshot || PromptContextStore.getVisibleSnapshot();
    var project = PromptContextStore.findProjectById(snapshot.projects, UiController.els.projectId.value);
    var projectTasks = project ? PromptContextStore.getProjectTasks(snapshot.tasks, project.id) : [];
    var projectMembers = PromptContextStore.getProjectMembers(projectTasks, snapshot.members);
    var task = project ? PromptContextStore.findTaskById(projectTasks, UiController.els.taskId.value) : null;

    return {
      snapshot: snapshot,
      members: snapshot.members,
      project: project,
      projectTasks: PromptContextStore.sortByLabel(projectTasks),
      projectMembers: projectMembers,
      projectProgress: project ? PromptContextStore.getProjectProgress(project, projectTasks) : 0,
      projectStatus: project ? PromptContextStore.getProjectStatus(project, projectTasks) : 'Not Started',
      task: task,
      taskCompletion: task ? PromptContextStore.getTaskCompletion(task) : 0,
      taskOwnerLabel: task ? PromptContextStore.getTaskOwnerLabel(task, snapshot.members) : 'Unassigned',
    };
  },

  _readFormData: function () {
    var details = UiController._getSelectedDetails();

    return {
      promptType: UiController.els.promptType.value,
      projectId: UiController.els.projectId.value,
      taskId: UiController.els.taskId.value,
      techStack: UiController.els.techStack.value,
      context: UiController.els.context.value,
      mainTask: UiController.els.mainTask.value,
      constraints: UiController.els.constraints.value,
      expectedFormat: UiController.els.expectedFormat.value,
      edgeCases: UiController.els.edgeCases.value,
      selectedProject: details.project,
      selectedTask: details.task,
      projectTasks: details.projectTasks,
      projectMembers: details.projectMembers,
      projectProgress: details.projectProgress,
      projectStatus: details.projectStatus,
      taskCompletion: details.taskCompletion,
      taskOwnerLabel: details.taskOwnerLabel,
      members: details.members,
    };
  },

  _updateDefaults: function () {
    var type = UiController.els.promptType.value;
    var config = PROMPT_CONFIG[type];
    if (config) {
      UiController.els.expectedFormat.value = config.outputFormat;
    } else {
      UiController.els.expectedFormat.value = '';
    }
  },

  _saveLastType: function () {
    try {
      localStorage.setItem('promptBuilderLastType', UiController.els.promptType.value);
    } catch (e) {
      /* localStorage unavailable */
    }
  },

  _restoreLastType: function () {
    try {
      var saved = localStorage.getItem('promptBuilderLastType');
      if (saved && PROMPT_CONFIG[saved]) {
        UiController.els.promptType.value = saved;
      }
    } catch (e) {
      /* localStorage unavailable */
    }
  },

  _handleGenerate: function () {
    UiController._refreshContextData();

    var data = UiController._readFormData();
    var errors = PromptGenerator.validate(data, { mode: 'default' });
    UiController._clearValidation();

    if (Object.keys(errors).length > 0) {
      UiController._renderValidation(errors);
      return;
    }

    var prompt = PromptGenerator.generate(data);
    UiController.els.output.textContent = prompt;
    UiController.els.copyBtn.disabled = false;
  },

  _handleSummaryGenerate: function () {
    UiController._refreshContextData();

    var data = UiController._readFormData();
    var errors = PromptGenerator.validate(data, { mode: 'summary' });
    UiController._clearValidation();

    if (Object.keys(errors).length > 0) {
      UiController._renderValidation(errors);
      return;
    }

    var prompt = PromptGenerator.generateProjectSummary(data);
    UiController.els.output.textContent = prompt;
    UiController.els.copyBtn.disabled = false;
  },

  _renderValidation: function (errors) {
    for (var field in errors) {
      if (errors.hasOwnProperty(field)) {
        var inputEl = UiController.els[field];
        var msgEl = UiController.els.validation[field];
        if (inputEl) {
          inputEl.classList.add('field-error');
        }
        if (msgEl) {
          msgEl.textContent = errors[field];
        }
      }
    }
  },

  _clearValidation: function () {
    for (var key in UiController.els.validation) {
      if (UiController.els.validation.hasOwnProperty(key)) {
        UiController.els.validation[key].textContent = '';
      }
    }
    var allEls = UiController.els;
    for (var k in allEls) {
      if (allEls.hasOwnProperty(k) && allEls[k] && allEls[k].classList) {
        allEls[k].classList.remove('field-error');
      }
    }
  },

  _handleCopy: function () {
    var text = UiController.els.output.textContent;
    if (!text) return;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(
        function () {
          UiController._showToast('Copied to clipboard!');
        },
        function () {
          UiController._fallbackCopy(text);
        }
      );
    } else {
      UiController._fallbackCopy(text);
    }
  },

  _fallbackCopy: function (text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    UiController._showToast('Copied to clipboard!');
  },

  _handleReset: function () {
    UiController.els.form.reset();
    UiController.els.output.textContent = '';
    UiController.els.copyBtn.disabled = true;
    UiController._clearValidation();
    UiController._updateDefaults();
    UiController._populateTaskOptions();
    UiController._renderProjectContext();
    UiController._renderTaskContext();
  },

  _showToast: function (msg) {
    UiController.els.toast.textContent = msg;
    UiController.els.toast.className = 'toast show';

    clearTimeout(UiController._toastTimer);
    UiController._toastTimer = setTimeout(function () {
      UiController.els.toast.classList.remove('show');
    }, 2500);
  },

  _escapeHtml: function (value) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(String(value || '')));
    return div.innerHTML;
  },
};

/* ── Boot ─────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', function () {
  UiController.init();
});
