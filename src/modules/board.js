/**
 * TaskFlow Management System - Kanban Task Board Module
 * Intern 5 Module implementation.
 * 
 * Re-implemented Kanban Board aligned with application theme (olive green,
 * design tokens, card layout, dynamic due date indicators, drag & drop, 
 * multi-member assignees, and task creator footer display).
 */

(function () {
  'use strict';

  var COLUMNS = ['Todo', 'In Progress', 'Review', 'Done'];

  var STATUS_ICONS = {
    'Todo': '📝',
    'In Progress': '⚡',
    'Review': '🔍',
    'Done': '✅'
  };

  /**
   * Formats ISO or YYYY-MM-DD date into "DD MMM YYYY" (e.g. 24 Jul 2026)
   */
  function formatDate(dateStr) {
    if (!dateStr) return null;
    var d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
  }

  /**
   * Calculates dynamic due date indicator badge (Overdue, Due Today, Due Tomorrow, X Days Left)
   */
  function getDueDateInfo(dueDateStr, isCompleted) {
    if (!dueDateStr) return null;
    var formattedText = formatDate(dueDateStr);

    // If completed (Done status), requirement specifies: "If completed: no overdue indicator"
    if (isCompleted) {
      return { dateText: formattedText, pill: null };
    }

    var today = new Date();
    today.setHours(0, 0, 0, 0);

    var due = new Date(dueDateStr);
    if (isNaN(due.getTime())) {
      return { dateText: formattedText, pill: null };
    }
    due.setHours(0, 0, 0, 0);

    var diffMs = due.getTime() - today.getTime();
    var diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { dateText: formattedText, pill: { label: 'Overdue', class: 'due-pill--danger' } };
    } else if (diffDays === 0) {
      return { dateText: formattedText, pill: { label: 'Due Today', class: 'due-pill--warning' } };
    } else if (diffDays === 1) {
      return { dateText: formattedText, pill: { label: 'Due Tomorrow', class: 'due-pill--amber' } };
    } else {
      return { dateText: formattedText, pill: { label: diffDays + ' Days Left', class: 'due-pill--info' } };
    }
  }

  var KanbanBoard = function () {
    this.tasks = [];
    this.projects = [];
    this.members = [];
    this.draggedTaskId = null;
    this.pendingStatusChange = null;
    this.previousFocus = null;

    this.filters = {
      search: '',
      projectId: 'all',
      priority: 'all'
    };

    this.init();
  };

  KanbanBoard.prototype.init = function () {
    this.injectStyles();
    this.mountBoardSection();
    this.bindElements();
    this.setupEventListeners();
    this.loadData();
    this.setupNavigation();
    this.setupAutoSync();
  };

  /**
   * Dynamically loads board.css if absent
   */
  KanbanBoard.prototype.injectStyles = function () {
    if (!document.getElementById('board-css')) {
      var link = document.createElement('link');
      link.id = 'board-css';
      link.rel = 'stylesheet';
      link.href = 'src/styles/board.css';
      document.head.appendChild(link);
    }
  };

  /**
   * Dynamically mounts #board-section inside #mainContent or main if absent
   */
  KanbanBoard.prototype.mountBoardSection = function () {
    var existingSec = document.getElementById('board-section');
    if (existingSec) return;

    var mainContent = document.getElementById('mainContent') || document.querySelector('main');
    if (!mainContent) return;

    var boardSec = document.createElement('section');
    boardSec.id = 'board-section';
    boardSec.className = 'board-view';
    boardSec.style.display = 'none';
    boardSec.setAttribute('aria-label', 'Task Board');

    boardSec.innerHTML = 
      '<div class="board-toolbar">' +
        '<div class="board-toolbar__search">' +
          '<input type="text" id="filter-search" class="board-input" placeholder="🔍 Search tasks by title or description..." />' +
        '</div>' +
        '<div class="board-toolbar__filters">' +
          '<select id="filter-project" class="board-select">' +
            '<option value="all">All Projects</option>' +
          '</select>' +
          '<select id="filter-priority" class="board-select">' +
            '<option value="all">All Priorities</option>' +
            '<option value="High">High Priority</option>' +
            '<option value="Medium">Medium Priority</option>' +
            '<option value="Low">Low Priority</option>' +
          '</select>' +
          '<button type="button" id="btn-clear-filters" class="board-btn board-btn--outline">Reset Filters</button>' +
        '</div>' +
      '</div>' +
      '<div class="kanban-board" id="kanban-board"></div>';

    mainContent.appendChild(boardSec);
  };

  KanbanBoard.prototype.bindElements = function () {
    this.boardContainer = document.getElementById('kanban-board');
    this.searchInput = document.getElementById('filter-search');
    this.projectSelect = document.getElementById('filter-project');
    this.prioritySelect = document.getElementById('filter-priority');
    this.btnClearFilters = document.getElementById('btn-clear-filters');
  };

  KanbanBoard.prototype.loadData = function () {
    if (typeof DataStore !== 'undefined') {
      this.tasks = DataStore.getTasks() || [];
      this.projects = DataStore.getProjects() || [];
      this.members = DataStore.getMembers() || [];
    }
    this.populateProjectDropdown();
    this.renderBoard();
  };

  KanbanBoard.prototype.populateProjectDropdown = function () {
    if (!this.projectSelect) return;

    var currentVal = this.projectSelect.value;
    this.projectSelect.innerHTML = '<option value="all">All Projects</option>';

    for (var i = 0; i < this.projects.length; i++) {
      var proj = this.projects[i];
      var opt = document.createElement('option');
      opt.value = proj.id;
      opt.textContent = proj.name || ('Project #' + proj.id);
      this.projectSelect.appendChild(opt);
    }

    this.projectSelect.value = currentVal || 'all';
  };

  KanbanBoard.prototype.setupEventListeners = function () {
    var self = this;

    if (this.searchInput) {
      this.searchInput.addEventListener('input', function (e) {
        self.filters.search = e.target.value.trim().toLowerCase();
        self.renderBoard();
      });
    }

    if (this.projectSelect) {
      this.projectSelect.addEventListener('change', function (e) {
        self.filters.projectId = e.target.value;
        self.renderBoard();
      });
    }

    if (this.prioritySelect) {
      this.prioritySelect.addEventListener('change', function (e) {
        self.filters.priority = e.target.value;
        self.renderBoard();
      });
    }

    if (this.btnClearFilters) {
      this.btnClearFilters.addEventListener('click', function () {
        self.filters = { search: '', projectId: 'all', priority: 'all' };
        if (self.searchInput) self.searchInput.value = '';
        if (self.projectSelect) self.projectSelect.value = 'all';
        if (self.prioritySelect) self.prioritySelect.value = 'all';
        self.renderBoard();
      });
    }
  };

  /**
   * Listen to DataStore changes from other tabs/modules
   */
  KanbanBoard.prototype.setupAutoSync = function () {
    var self = this;
    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      window.addEventListener('taskflow:tasks-changed', function () {
        self.loadData();
      });
      window.addEventListener('taskflow:projects-changed', function () {
        self.loadData();
      });
      window.addEventListener('taskflow:members-changed', function () {
        self.loadData();
      });
    }
  };

  /**
   * Seamless sidebar navigation hook
   */
  KanbanBoard.prototype.setupNavigation = function () {
    var self = this;

    function activateBoardView() {
      var sections = document.querySelectorAll('.main-content > section, main > section');
      sections.forEach(function (sec) {
        sec.style.display = (sec.id === 'board-section') ? '' : 'none';
      });

      var headerTitle = document.querySelector('.header__title');
      if (headerTitle) {
        headerTitle.textContent = 'Task Board';
      }

      var navItems = document.querySelectorAll('.sidebar__item');
      navItems.forEach(function (item) {
        var label = item.querySelector('.sidebar__label');
        if (label && label.textContent.trim().toLowerCase() === 'board') {
          item.classList.add('sidebar__item--active');
        } else {
          item.classList.remove('sidebar__item--active');
        }
      });

      self.loadData();
    }

    var navItems = document.querySelectorAll('.sidebar__item');
    navItems.forEach(function (item) {
      var label = item.querySelector('.sidebar__label');
      if (label && label.textContent.trim().toLowerCase() === 'board') {
        item.addEventListener('click', function (e) {
          e.preventDefault();
          activateBoardView();
        });
      }
    });
  };

  KanbanBoard.prototype.getFilteredTasks = function () {
    var self = this;
    return this.tasks.filter(function (task) {
      if (self.filters.search) {
        var matchTitle = task.title && task.title.toLowerCase().indexOf(self.filters.search) !== -1;
        var matchDesc = task.description && task.description.toLowerCase().indexOf(self.filters.search) !== -1;
        if (!matchTitle && !matchDesc) return false;
      }

      if (self.filters.projectId !== 'all') {
        if (String(task.projectId) !== String(self.filters.projectId)) return false;
      }

      if (self.filters.priority !== 'all') {
        if (task.priority !== self.filters.priority) return false;
      }

      return true;
    });
  };

  KanbanBoard.prototype.renderBoard = function () {
    if (!this.boardContainer) return;

    this.boardContainer.innerHTML = '';
    var filteredTasks = this.getFilteredTasks();

    for (var i = 0; i < COLUMNS.length; i++) {
      var status = COLUMNS[i];
      var columnTasks = filteredTasks.filter(function (t) { return t.status === status; });
      var colEl = this.createColumnElement(status, columnTasks);
      this.boardContainer.appendChild(colEl);
    }
  };

  KanbanBoard.prototype.createColumnElement = function (status, tasks) {
    var self = this;

    var column = document.createElement('div');
    column.className = 'kanban-column';
    column.setAttribute('data-status', status);

    var header = document.createElement('div');
    header.className = 'kanban-column__header';

    var titleGroup = document.createElement('div');
    titleGroup.className = 'kanban-column__title-group';

    var iconSpan = document.createElement('span');
    iconSpan.className = 'kanban-column__icon';
    iconSpan.textContent = STATUS_ICONS[status] || '📋';
    titleGroup.appendChild(iconSpan);

    var title = document.createElement('h3');
    title.className = 'kanban-column__title';
    title.textContent = status;
    titleGroup.appendChild(title);

    var countBadge = document.createElement('span');
    countBadge.className = 'kanban-column__badge';
    countBadge.textContent = tasks.length;

    header.appendChild(titleGroup);
    header.appendChild(countBadge);
    column.appendChild(header);

    var list = document.createElement('div');
    list.className = 'kanban-column__list';
    list.setAttribute('data-status', status);

    list.addEventListener('dragover', function (e) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      list.classList.add('kanban-column__list--drag-over');
    });

    list.addEventListener('dragenter', function (e) {
      e.preventDefault();
      list.classList.add('kanban-column__list--drag-over');
    });

    list.addEventListener('dragleave', function (e) {
      list.classList.remove('kanban-column__list--drag-over');
    });

    list.addEventListener('drop', function (e) {
      e.preventDefault();
      list.classList.remove('kanban-column__list--drag-over');
      if (self.draggedTaskId !== null) {
        self.requestStatusChange(self.draggedTaskId, status);
        self.draggedTaskId = null;
      }
    });

    if (tasks.length === 0) {
      var emptyEl = document.createElement('div');
      emptyEl.className = 'kanban-empty';
      emptyEl.innerHTML = 
        '<div class="kanban-empty__icon">' + (STATUS_ICONS[status] || '📋') + '</div>' +
        '<div class="kanban-empty__text">No tasks in ' + status + '</div>';
      list.appendChild(emptyEl);
    } else {
      for (var j = 0; j < tasks.length; j++) {
        var cardEl = this.createCardElement(tasks[j]);
        list.appendChild(cardEl);
      }
    }

    column.appendChild(list);
    return column;
  };

  /**
   * Helper to lookup ALL assigned member objects for a task
   * Handles task.assignedMemberIds (array), task.assignedUserId, task.assignedMemberId
   */
  KanbanBoard.prototype.getTaskAssignedMembers = function (task) {
    var self = this;
    var memberIds = [];

    if (Array.isArray(task.assignedMemberIds) && task.assignedMemberIds.length > 0) {
      memberIds = task.assignedMemberIds;
    } else if (task.assignedUserId !== undefined && task.assignedUserId !== null) {
      memberIds = [task.assignedUserId];
    } else if (task.assignedMemberId !== undefined && task.assignedMemberId !== null) {
      memberIds = [task.assignedMemberId];
    }

    if (memberIds.length === 0) {
      return [{ name: 'Unassigned', initials: 'UN' }];
    }

    var foundMembers = [];
    for (var i = 0; i < memberIds.length; i++) {
      var id = memberIds[i];
      var m = self.members.find(function (item) {
        return String(item.id) === String(id);
      });

      if (m) {
        foundMembers.push({
          name: m.name || m.fullName || ('Member #' + id),
          initials: m.initials || (m.name ? m.name.substring(0, 2).toUpperCase() : 'M')
        });
      } else {
        foundMembers.push({
          name: 'Member #' + id,
          initials: 'M' + id
        });
      }
    }

    return foundMembers;
  };

  /**
   * Helper to lookup task creator / assigner full name
   */
  KanbanBoard.prototype.getTaskCreatorName = function (task) {
    if (!task) return 'TaskFlow Admin';

    // 1. Direct string properties on task
    if (task.createdBy && typeof task.createdBy === 'string') return task.createdBy;
    if (task.creatorName && typeof task.creatorName === 'string') return task.creatorName;
    if (task.assignedBy && typeof task.assignedBy === 'string') return task.assignedBy;
    if (task.author && typeof task.author === 'string') return task.author;

    // 2. ID properties on task (e.g. createdByUserId, creatorId, userId)
    var creatorId = task.createdByUserId || task.creatorId || task.createdById || task.userId;
    if (creatorId !== undefined && creatorId !== null) {
      var member = this.members.find(function (m) {
        return String(m.id) === String(creatorId);
      });
      if (member && member.name) return member.name;
    }

    // 3. ActivityLog lookup for "Task Created" action for this taskId
    if (typeof ActivityLog !== 'undefined' && typeof ActivityLog.getEntries === 'function') {
      var logs = ActivityLog.getEntries();
      var createLog = logs.find(function (l) {
        return String(l.entityId) === String(task.id) && l.entityType === 'Task' && l.actionType === 'Created';
      });
      if (createLog && createLog.userName) return createLog.userName;
    }

    // 4. Active Session user fallback
    var session = window.TaskFlowSession || (window.JWT && window.JWT.getSession && window.JWT.getSession());
    if (session && session.name) return session.name;

    // 5. Default fallback
    return 'TaskFlow Admin';
  };

  /**
   * Helper to lookup project name for a task
   */
  KanbanBoard.prototype.getTaskProjectName = function (task) {
    if (task.projectName) return task.projectName;
    if (!task.projectId) return 'Unassigned';

    var project = this.projects.find(function (p) {
      return String(p.id) === String(task.projectId);
    });

    return project ? (project.name || project.title || 'Project #' + project.id) : ('Project #' + task.projectId);
  };

  /**
   * Builds task card following required structured design layout:
   * ┌──────────────────────────────────────────────┐
   * │ Fix Login Validation                         │
   * │ Improve email and password validation rules. │
   * ├──────────────────────────────────────────────┤
   * │ Priority      High                           │
   * │ Project       Website                        │
   * │ Assigned To   Bilal, Ahmed, Ali              │
   * │ Start Date    22 Jul 2026                    │
   * │ Due Date      24 Jul 2026                    │
   * │               [Overdue]                      │
   * └──────────────────────────────────────────────┘
   */
  KanbanBoard.prototype.createCardElement = function (task) {
    var self = this;

    var card = document.createElement('div');
    card.className = 'kanban-card';
    card.setAttribute('draggable', 'true');
    card.setAttribute('data-task-id', task.id);

    // Drag events
    card.addEventListener('dragstart', function (e) {
      self.draggedTaskId = task.id;
      card.classList.add('kanban-card--dragging');
      e.dataTransfer.setData('text/plain', String(task.id));
    });

    card.addEventListener('dragend', function () {
      card.classList.remove('kanban-card--dragging');
      self.draggedTaskId = null;
    });

    // --- TOP SECTION: Title & Description ---
    var cardHeader = document.createElement('div');
    cardHeader.className = 'kanban-card__header';

    var title = document.createElement('div');
    title.className = 'kanban-card__title';
    title.textContent = task.title || 'Untitled Task';
    cardHeader.appendChild(title);

    if (task.description) {
      var desc = document.createElement('div');
      desc.className = 'kanban-card__desc';
      desc.textContent = task.description;
      cardHeader.appendChild(desc);
    }
    card.appendChild(cardHeader);

    // --- SECTION DIVIDER ---
    var divider = document.createElement('div');
    divider.className = 'kanban-card__divider';
    card.appendChild(divider);

    // --- BOTTOM SECTION: Key-Value Details Table/Grid ---
    var details = document.createElement('div');
    details.className = 'kanban-card__details';

    // 1. Priority Row
    var rowPriority = document.createElement('div');
    rowPriority.className = 'kanban-card__row';

    var lblPriority = document.createElement('span');
    lblPriority.className = 'kanban-card__label';
    lblPriority.textContent = 'Priority';

    var valPriority = document.createElement('span');
    valPriority.className = 'kanban-card__value';

    var pText = task.priority || 'Low';
    var pClass = 'badge--low';
    if (pText === 'High') pClass = 'badge--high';
    else if (pText === 'Medium') pClass = 'badge--medium';

    var badgeSpan = document.createElement('span');
    badgeSpan.className = 'badge ' + pClass;
    badgeSpan.textContent = pText;
    valPriority.appendChild(badgeSpan);

    rowPriority.appendChild(lblPriority);
    rowPriority.appendChild(valPriority);
    details.appendChild(rowPriority);

    // 2. Project Row
    var rowProject = document.createElement('div');
    rowProject.className = 'kanban-card__row';

    var lblProject = document.createElement('span');
    lblProject.className = 'kanban-card__label';
    lblProject.textContent = 'Project';

    var valProject = document.createElement('span');
    valProject.className = 'kanban-card__value';
    valProject.textContent = this.getTaskProjectName(task);

    rowProject.appendChild(lblProject);
    rowProject.appendChild(valProject);
    details.appendChild(rowProject);

    // 3. Assigned To Row (Displays ALL assigned members)
    var assignedMembers = this.getTaskAssignedMembers(task);
    var allMemberNames = assignedMembers.map(function (m) { return m.name; }).join(', ');

    var rowAssigned = document.createElement('div');
    rowAssigned.className = 'kanban-card__row';

    var lblAssigned = document.createElement('span');
    lblAssigned.className = 'kanban-card__label';
    lblAssigned.textContent = 'Assigned To';

    var valAssigned = document.createElement('span');
    valAssigned.className = 'kanban-card__value';
    valAssigned.textContent = allMemberNames;

    rowAssigned.appendChild(lblAssigned);
    rowAssigned.appendChild(valAssigned);
    details.appendChild(rowAssigned);

    // 4. Start Date Row (Gracefully hidden if not present in task model)
    if (task.startDate) {
      var rowStart = document.createElement('div');
      rowStart.className = 'kanban-card__row';

      var lblStart = document.createElement('span');
      lblStart.className = 'kanban-card__label';
      lblStart.textContent = 'Start Date';

      var valStart = document.createElement('span');
      valStart.className = 'kanban-card__value';
      valStart.textContent = formatDate(task.startDate) || task.startDate;

      rowStart.appendChild(lblStart);
      rowStart.appendChild(valStart);
      details.appendChild(rowStart);
    }

    // 5. Due Date Row with Vertical Right-Aligned Stacking (Clean nowrap pill)
    if (task.dueDate) {
      var isCompleted = (task.status === 'Done');
      var dueInfo = getDueDateInfo(task.dueDate, isCompleted);

      if (dueInfo) {
        var rowDue = document.createElement('div');
        rowDue.className = 'kanban-card__row kanban-card__row--due';

        var lblDue = document.createElement('span');
        lblDue.className = 'kanban-card__label';
        lblDue.textContent = 'Due Date';

        var dueGroup = document.createElement('div');
        dueGroup.className = 'kanban-card__due-group';

        var dueTextSpan = document.createElement('span');
        dueTextSpan.className = 'kanban-card__due-date';
        dueTextSpan.textContent = dueInfo.dateText;
        dueGroup.appendChild(dueTextSpan);

        if (dueInfo.pill) {
          var pillSpan = document.createElement('span');
          pillSpan.className = 'due-pill ' + dueInfo.pill.class;
          pillSpan.textContent = dueInfo.pill.label;
          dueGroup.appendChild(pillSpan);
        }

        rowDue.appendChild(lblDue);
        rowDue.appendChild(dueGroup);
        details.appendChild(rowDue);
      }
    }

    card.appendChild(details);

    // --- FOOTER SECTION: Task Creator Full Name & Quick Status Selector ---
    var creatorFullName = this.getTaskCreatorName(task);

    var cardFooter = document.createElement('div');
    cardFooter.className = 'kanban-card__footer';

    var creatorArea = document.createElement('div');
    creatorArea.className = 'kanban-card__creator';

    var creatorLabel = document.createElement('span');
    creatorLabel.className = 'kanban-card__creator-label';
    creatorLabel.textContent = 'Created by';

    var creatorName = document.createElement('span');
    creatorName.className = 'kanban-card__creator-name';
    creatorName.textContent = creatorFullName;

    creatorArea.appendChild(creatorLabel);
    creatorArea.appendChild(creatorName);
    cardFooter.appendChild(creatorArea);

    var select = document.createElement('select');
    select.className = 'status-select';
    select.title = 'Change task status';

    for (var k = 0; k < COLUMNS.length; k++) {
      var opt = document.createElement('option');
      opt.value = COLUMNS[k];
      opt.textContent = COLUMNS[k];
      if (COLUMNS[k] === task.status) {
        opt.selected = true;
      }
      select.appendChild(opt);
    }

    select.addEventListener('change', function (e) {
      var newStatus = e.target.value;
      self.requestStatusChange(task.id, newStatus, select);
    });

    cardFooter.appendChild(select);
    card.appendChild(cardFooter);

    return card;
  };

  KanbanBoard.prototype.getCurrentUser = function () {
    if (typeof window !== 'undefined' && window.TaskFlowSession) {
      return {
        userId: window.TaskFlowSession.memberId || window.TaskFlowSession.userId || 0,
        userName: window.TaskFlowSession.name || window.TaskFlowSession.userName || 'TaskFlow User'
      };
    }
    if (typeof window !== 'undefined' && window.JWT && typeof window.JWT.getSession === 'function') {
      var session = window.JWT.getSession();
      if (session) {
        return {
          userId: session.userId || session.memberId || 0,
          userName: session.name || session.username || 'TaskFlow User'
        };
      }
    }
    return {
      userId: 1,
      userName: 'TaskFlow Admin'
    };
  };

  KanbanBoard.prototype.escapeHtml = function (str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  /**
   * Intercept status change requests and open confirmation modal
   */
  KanbanBoard.prototype.requestStatusChange = function (taskId, newStatus, selectEl) {
    var task = this.tasks.find(function (t) { return String(t.id) === String(taskId); });
    if (!task) return;

    // Edge case: Same-column drop or same status select -> Do not open modal
    if (task.status === newStatus) {
      if (selectEl) selectEl.value = task.status;
      return;
    }

    this.pendingStatusChange = {
      task: task,
      oldStatus: task.status,
      newStatus: newStatus,
      selectEl: selectEl || null
    };

    this.openStatusChangeModal();
  };

  /**
   * Opens status change confirmation modal with description textarea and validation
   */
  KanbanBoard.prototype.openStatusChangeModal = function () {
    var self = this;
    var pending = this.pendingStatusChange;
    var existingOverlay = document.getElementById('status-change-modal-overlay');
    if (existingOverlay) {
      existingOverlay.remove();
    }
    var task = pending.task;
    var oldStatus = pending.oldStatus;
    var newStatus = pending.newStatus;

    this.previousFocus = document.activeElement;

    var overlay = document.createElement('div');
    overlay.className = 'status-modal-overlay';
    overlay.id = 'status-change-modal-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'status-modal-title');

    var modal = document.createElement('div');
    modal.className = 'status-modal';

    function getBadgeClass(st) {
      if (st === 'Todo') return 'status-modal__status-badge--todo';
      if (st === 'In Progress') return 'status-modal__status-badge--in-progress';
      if (st === 'Review') return 'status-modal__status-badge--review';
      if (st === 'Done') return 'status-modal__status-badge--done';
      return '';
    }

    modal.innerHTML = 
      '<div class="status-modal__header">' +
        '<div class="status-modal__title-group">' +
          '<span class="status-modal__icon">🔄</span>' +
          '<h3 class="status-modal__title" id="status-modal-title">Change Task Status</h3>' +
        '</div>' +
        '<button type="button" class="status-modal__close-btn" id="status-modal-close" aria-label="Close modal">&times;</button>' +
      '</div>' +
      '<div class="status-modal__body">' +
        '<div class="status-modal__info-box">' +
          '<div class="status-modal__info-row">' +
            '<span class="status-modal__info-label">Task</span>' +
            '<div class="status-modal__task-name">' + this.escapeHtml(task.title || 'Untitled Task') + '</div>' +
          '</div>' +
          '<div class="status-modal__transition-grid">' +
            '<div class="status-modal__status-box">' +
              '<span class="status-modal__status-title">Move From</span>' +
              '<span class="status-modal__status-badge ' + getBadgeClass(oldStatus) + '">' +
                (STATUS_ICONS[oldStatus] || '📋') + ' ' + oldStatus +
              '</span>' +
            '</div>' +
            '<div class="status-modal__arrow">➔</div>' +
            '<div class="status-modal__status-box">' +
              '<span class="status-modal__status-title">Move To</span>' +
              '<span class="status-modal__status-badge ' + getBadgeClass(newStatus) + '">' +
                (STATUS_ICONS[newStatus] || '📋') + ' ' + newStatus +
              '</span>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="status-modal__field">' +
          '<label for="status-change-comment" class="status-modal__field-label">' +
            '<span>Description / Comment <span class="status-modal__required">*</span></span>' +
          '</label>' +
          '<textarea id="status-change-comment" class="status-modal__textarea" rows="4" placeholder="Enter details or reason for changing task status..."></textarea>' +
          '<div id="status-change-error" class="status-modal__error-msg" style="display: none;"></div>' +
        '</div>' +
      '</div>' +
      '<div class="status-modal__actions">' +
        '<button type="button" id="btn-cancel-status-change" class="status-modal__btn status-modal__btn--cancel">Cancel</button>' +
        '<button type="button" id="btn-submit-status-change" class="status-modal__btn status-modal__btn--submit">Update Status</button>' +
      '</div>';

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    var textarea = document.getElementById('status-change-comment');
    var errorDiv = document.getElementById('status-change-error');
    var btnCancel = document.getElementById('btn-cancel-status-change');
    var btnSubmit = document.getElementById('btn-submit-status-change');
    var btnClose = document.getElementById('status-modal-close');

    setTimeout(function () {
      if (textarea) textarea.focus();
    }, 50);

    if (textarea) {
      textarea.addEventListener('input', function () {
        textarea.classList.remove('status-modal__textarea--invalid');
        if (errorDiv) {
          errorDiv.style.display = 'none';
          errorDiv.textContent = '';
        }
      });
    }

    if (btnCancel) {
      btnCancel.addEventListener('click', function () {
        self.closeStatusChangeModal(false);
      });
    }

    if (btnClose) {
      btnClose.addEventListener('click', function () {
        self.closeStatusChangeModal(false);
      });
    }

    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) {
        self.closeStatusChangeModal(false);
      }
    });

    if (btnSubmit) {
      btnSubmit.addEventListener('click', function () {
        self.confirmStatusChange();
      });
    }

    this.modalKeydownHandler = function (e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        self.closeStatusChangeModal(false);
        return;
      }

      if (e.key === 'Tab') {
        var focusables = [textarea, btnCancel, btnSubmit, btnClose].filter(Boolean);
        var activeIdx = focusables.indexOf(document.activeElement);

        if (e.shiftKey) {
          if (activeIdx <= 0) {
            e.preventDefault();
            focusables[focusables.length - 1].focus();
          }
        } else {
          if (activeIdx === -1 || activeIdx >= focusables.length - 1) {
            e.preventDefault();
            focusables[0].focus();
          }
        }
      }
    };

    document.addEventListener('keydown', this.modalKeydownHandler);
  };

  /**
   * Validates description input and executes status update
   */
  KanbanBoard.prototype.confirmStatusChange = function () {
    if (!this.pendingStatusChange) return;

    var textarea = document.getElementById('status-change-comment');
    var errorDiv = document.getElementById('status-change-error');

    var comment = textarea ? textarea.value : '';

    if (!comment || comment.trim().length === 0) {
      if (textarea) {
        textarea.classList.add('status-modal__textarea--invalid');
        textarea.focus();
      }
      if (errorDiv) {
        errorDiv.textContent = '⚠️ Description / comment is required before changing status.';
        errorDiv.style.display = 'flex';
      }
      return;
    }

    var pending = this.pendingStatusChange;
    this.updateTaskWithComment(pending.task, pending.oldStatus, pending.newStatus, comment.trim());
    this.closeStatusChangeModal(true);
  };

  /**
   * Persists task status, history comment, and records activity log
   */
  KanbanBoard.prototype.updateTaskWithComment = function (task, oldStatus, newStatus, comment) {
    var self = this;
    var currentUser = this.getCurrentUser();

    task.status = newStatus;
    if (newStatus === 'Done') {
      task.completedAt = new Date().toISOString();
    }

    if (!Array.isArray(task.history)) {
      task.history = [];
    }

    var historyEntry = {
      fromStatus: oldStatus,
      toStatus: newStatus,
      comment: comment,
      timestamp: new Date().toISOString(),
      user: currentUser.userName,
      userId: currentUser.userId
    };

    task.history.push(historyEntry);

    if (typeof DataStore !== 'undefined') {
      if (typeof DataStore.updateTask === 'function') {
        DataStore.updateTask(task.id, {
          status: newStatus,
          completedAt: task.completedAt || null,
          history: task.history
        });
      } else if (typeof DataStore.saveTasks === 'function') {
        DataStore.saveTasks(this.tasks);
      }

      if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
        window.dispatchEvent(new CustomEvent('taskflow:tasks-changed', {
          detail: { action: 'board_move', taskId: task.id, comment: comment }
        }));
      }
    }

    if (typeof ActivityLog !== 'undefined') {
      var actionType = (newStatus === 'Done') ? 'Completed' : 'Status Changed';
      var detailMsg = 'Task "' + (task.title || 'Untitled') + '" status changed from ' + oldStatus + ' to ' + newStatus + '. Description: ' + comment;

      if (typeof ActivityLog.record === 'function') {
        ActivityLog.record({
          entityType: 'Task',
          entityId: task.id,
          actionType: actionType,
          actionDetail: detailMsg,
          occurredAt: new Date().toISOString(),
          userId: currentUser.userId,
          userName: currentUser.userName
        });
      } else if (typeof ActivityLog.logStatusChanged === 'function') {
        ActivityLog.logStatusChanged(task, oldStatus, newStatus);
      }
    }

    var toastMsg = 'Task "' + (task.title || 'Untitled Task') + '" moved from ' + oldStatus + ' to ' + newStatus + ' successfully.';
    this.showToast(toastMsg);

    this.renderBoard();
  };

  /**
   * Displays a toast notification in bottom right corner upon successful status update
   */
  KanbanBoard.prototype.showToast = function (message) {
    if (!message) return;

    var container = document.getElementById('kanban-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'kanban-toast-container';
      container.className = 'kanban-toast-container';
      container.setAttribute('aria-live', 'polite');
      container.setAttribute('aria-atomic', 'true');
      document.body.appendChild(container);
    }

    var toastEl = document.createElement('div');
    toastEl.className = 'kanban-toast';
    toastEl.setAttribute('role', 'status');

    var iconSpan = document.createElement('span');
    iconSpan.className = 'kanban-toast__icon';
    iconSpan.textContent = '✓';

    var contentDiv = document.createElement('div');
    contentDiv.className = 'kanban-toast__content';
    contentDiv.textContent = message;

    var closeBtn = document.createElement('button');
    closeBtn.className = 'kanban-toast__close-btn';
    closeBtn.type = 'button';
    closeBtn.setAttribute('aria-label', 'Dismiss notification');
    closeBtn.innerHTML = '&times;';

    toastEl.appendChild(iconSpan);
    toastEl.appendChild(contentDiv);
    toastEl.appendChild(closeBtn);

    container.appendChild(toastEl);

    var isDismissed = false;

    function dismissToast() {
      if (isDismissed) return;
      isDismissed = true;
      toastEl.classList.add('kanban-toast--exiting');
      setTimeout(function () {
        if (toastEl.parentNode) {
          toastEl.parentNode.removeChild(toastEl);
        }
      }, 260);
    }

    closeBtn.addEventListener('click', dismissToast);

    setTimeout(dismissToast, 3500);
  };

  /**
   * Closes status change modal and resets state
   */
  KanbanBoard.prototype.closeStatusChangeModal = function (isSuccess, silent) {
    if (this.modalKeydownHandler) {
      document.removeEventListener('keydown', this.modalKeydownHandler);
      this.modalKeydownHandler = null;
    }

    var overlay = document.getElementById('status-change-modal-overlay');
    if (overlay) {
      overlay.remove();
    }

    if (!isSuccess && this.pendingStatusChange && this.pendingStatusChange.selectEl) {
      this.pendingStatusChange.selectEl.value = this.pendingStatusChange.oldStatus;
    }

    this.pendingStatusChange = null;

    if (!silent && this.previousFocus) {
      try {
        this.previousFocus.focus();
      } catch (e) {}
      this.previousFocus = null;
    }
  };

  KanbanBoard.prototype.moveTask = function (taskId, newStatus, selectEl) {
    this.requestStatusChange(taskId, newStatus, selectEl);
  };

  KanbanBoard.prototype.refresh = function () {
    this.loadData();
  };

  document.addEventListener('DOMContentLoaded', function () {
    window.KanbanBoardModule = new KanbanBoard();
  });

  if (document.readyState === 'interactive' || document.readyState === 'complete') {
    window.KanbanBoardModule = window.KanbanBoardModule || new KanbanBoard();
  }
})();
