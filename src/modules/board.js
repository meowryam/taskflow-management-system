/**
 * TaskFlow Management System - Kanban Task Board Module
 * Intern 5 Module implementation.
 * 
 * Self-contained module that dynamically injects board CSS and mounts the
 * 4-column Kanban board within the main application layout without requiring
 * modifications to shared core files (index.html, style.css).
 */

(function () {
  'use strict';

  var COLUMNS = ['Todo', 'In Progress', 'Review', 'Done'];

  var KanbanBoard = function () {
    this.tasks = [];
    this.projects = [];
    this.members = [];
    this.draggedTaskId = null;

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
  };

  /**
   * Dynamically loads board.css without altering shared style.css
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
   * Dynamically mounts #board-section inside #mainContent if absent
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
          '<input type="text" id="filter-search" class="board-input" placeholder="Search tasks by title..." />' +
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
          '<button type="button" id="btn-clear-filters" class="board-btn board-btn--outline">Clear Filters</button>' +
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
      opt.textContent = proj.name;
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

    // Attach click listener to any sidebar link labeled "Board"
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
        self.moveTask(self.draggedTaskId, status);
        self.draggedTaskId = null;
      }
    });

    if (tasks.length === 0) {
      var emptyEl = document.createElement('div');
      emptyEl.className = 'kanban-empty';
      emptyEl.innerHTML = '<span class="kanban-empty__icon">📋</span><span>No tasks in ' + status + '</span>';
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

  KanbanBoard.prototype.createCardElement = function (task) {
    var self = this;

    var card = document.createElement('div');
    card.className = 'kanban-card';
    card.setAttribute('draggable', 'true');
    card.setAttribute('data-task-id', task.id);

    card.addEventListener('dragstart', function (e) {
      self.draggedTaskId = task.id;
      card.classList.add('kanban-card--dragging');
      e.dataTransfer.setData('text/plain', String(task.id));
    });

    card.addEventListener('dragend', function () {
      card.classList.remove('kanban-card--dragging');
      self.draggedTaskId = null;
    });

    var title = document.createElement('div');
    title.className = 'kanban-card__title';
    title.textContent = task.title;
    card.appendChild(title);

    if (task.description) {
      var desc = document.createElement('div');
      desc.className = 'kanban-card__desc';
      desc.textContent = task.description;
      card.appendChild(desc);
    }

    var footer = document.createElement('div');
    footer.className = 'kanban-card__footer';

    var badgesGroup = document.createElement('div');
    badgesGroup.className = 'kanban-card__badges';

    var priorityClass = 'badge--low';
    if (task.priority === 'High') priorityClass = 'badge--high';
    else if (task.priority === 'Medium') priorityClass = 'badge--medium';

    var pBadge = document.createElement('span');
    pBadge.className = 'badge ' + priorityClass;
    pBadge.textContent = task.priority || 'Low';
    badgesGroup.appendChild(pBadge);

    if (task.dueDate) {
      var dueSpan = document.createElement('span');
      dueSpan.className = 'due-date';
      dueSpan.innerHTML = '📅 ' + task.dueDate;
      badgesGroup.appendChild(dueSpan);
    }

    footer.appendChild(badgesGroup);

    var actionsGroup = document.createElement('div');
    actionsGroup.className = 'kanban-card__actions';

    var member = this.members.find(function (m) { return m.id === task.assignedUserId; });
    var initials = member ? (member.initials || member.name.substring(0, 2).toUpperCase()) : 'UN';
    var memberName = member ? member.name : 'Unassigned';

    var avatar = document.createElement('div');
    avatar.className = 'member-avatar';
    avatar.textContent = initials;
    avatar.title = 'Assigned to ' + memberName;
    actionsGroup.appendChild(avatar);

    var select = document.createElement('select');
    select.className = 'status-select';
    select.title = 'Move task status';

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
      self.moveTask(task.id, newStatus);
    });

    actionsGroup.appendChild(select);
    footer.appendChild(actionsGroup);

    card.appendChild(footer);
    return card;
  };

  KanbanBoard.prototype.moveTask = function (taskId, newStatus) {
    var task = this.tasks.find(function (t) { return String(t.id) === String(taskId); });
    if (!task || task.status === newStatus) return;

    task.status = newStatus;
    if (newStatus === 'Done') {
      task.completedAt = new Date().toISOString();
    }

    if (typeof DataStore !== 'undefined') {
      DataStore.saveTasks(this.tasks);
    }

    this.renderBoard();
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
