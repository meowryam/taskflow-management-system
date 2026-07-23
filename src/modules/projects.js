// ============================================================================
// TaskFlow - Project Management module (Intern 3)
//
// Scope: Project CRUD, schema, localStorage persistence, list rendering,
// edit/delete, deadline handling, status handling, validation, and a delete
// warning when related tasks exist.
//
// This module does not own the page. It does not touch dataStore.js,
// index.html, or app.js, does not create any layout/navigation/theme, and
// does not render anything until asked to. Integration (deciding where in
// the page this mounts, and what stylesheet applies to its markup) happens
// during Day 2 — call `Projects.mount(containerElement)` from wherever that
// integration lives.
//
// Project schema:
// {
//   id: string,
//   name: string,
//   description: string,
//   startDate: string,      // ISO date string, e.g. "2026-07-01"
//   deadline: string,       // ISO date string, e.g. "2026-08-01" — shown in the UI as "End Date"
//   status: "Active" | "Completed" | "On Hold",
//   createdAt: string        // ISO datetime string
// }
// ============================================================================

const Projects = (function () {
  const PROJECTS_KEY = "projects";
  // Read-only, defensive lookup so this module can warn about related tasks
  // even before/without tasks.js being implemented. Assumes each task (if
  // present) has a `projectId` field pointing at a project's id.
  const TASKS_KEY = "tasks";

  const STATUS_OPTIONS = ["Active", "Completed", "On Hold"];

  const NAME_MAX_LENGTH = 100;
  const DESCRIPTION_MAX_LENGTH = 500;

  // -- Storage -----------------------------------------------------------
  // TEMPORARY localStorage wrapper, scoped to this file only.
  // Shape (readCollection/writeCollection/generateId) intentionally mirrors
  // what a shared DataStore module would expose, so that once the team
  // agrees on a shared data API, every call below can be repointed at
  // `DataStore` instead of `storage` with no other logic changes.
  const storage = {
    readCollection(key) {
      try {
        const raw = localStorage.getItem(`taskflow_${key}`);
        return raw ? JSON.parse(raw) : [];
      } catch (err) {
        console.error(`Projects: failed to read "${key}" from storage`, err);
        return [];
      }
    },
    writeCollection(key, data) {
      try {
        localStorage.setItem(`taskflow_${key}`, JSON.stringify(data));
      } catch (err) {
        console.error(`Projects: failed to write "${key}" to storage`, err);
      }
    },
    generateId(prefix) {
      const random = Math.random().toString(36).slice(2, 9);
      return `${prefix || "id"}_${Date.now()}_${random}`;
    },
  };

  function loadProjects() {
    return storage.readCollection(PROJECTS_KEY);
  }

  function saveProjects(projects) {
    storage.writeCollection(PROJECTS_KEY, projects);
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new CustomEvent('taskflow:projects-changed'));
    }
  }

  function generateId() {
    return storage.generateId("proj");
  }

  function getRelatedTaskCount(projectId) {
    const tasks = storage.readCollection(TASKS_KEY);
    if (!Array.isArray(tasks)) return 0;
    return tasks.filter((t) => t && t.projectId === projectId).length;
  }

  // -- Validation ----------------------------------------------------------

  function validateProject(input) {
    const errors = {};
    const name = (input.name || "").trim();
    const description = (input.description || "").trim();
    const startDate = (input.startDate || "").trim();
    const deadline = (input.deadline || "").trim();
    const status = input.status || "Active";

    if (!name) {
      errors.name = "Project name is required.";
    } else if (name.length > NAME_MAX_LENGTH) {
      errors.name = `Project name must be ${NAME_MAX_LENGTH} characters or fewer.`;
    }

    if (description.length > DESCRIPTION_MAX_LENGTH) {
      errors.description = `Description must be ${DESCRIPTION_MAX_LENGTH} characters or fewer.`;
    }

    const startDateTime = new Date(startDate).getTime();
    if (!startDate) {
      errors.startDate = "Start date is required.";
    } else if (Number.isNaN(startDateTime)) {
      errors.startDate = "Start date must be a valid date.";
    }

    if (!deadline) {
      errors.deadline = "Deadline is required.";
    } else if (Number.isNaN(new Date(deadline).getTime())) {
      errors.deadline = "Deadline must be a valid date.";
    } else if (startDate && !Number.isNaN(startDateTime) && new Date(deadline).getTime() < startDateTime) {
      errors.deadline = "End date cannot be before the start date.";
    }

    if (!STATUS_OPTIONS.includes(status)) {
      errors.status = `Status must be one of: ${STATUS_OPTIONS.join(", ")}.`;
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors,
      value: { name, description, startDate, deadline, status },
    };
  }

  // -- CRUD ------------------------------------------------------------------

  function getAllProjects() {
    return loadProjects().sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  function getProjectById(id) {
    return loadProjects().find((p) => p.id === id) || null;
  }

  function createProject(input) {
    const result = validateProject(input);
    if (!result.valid) return result;

    const projects = loadProjects();
    const project = {
      id: generateId(),
      name: result.value.name,
      description: result.value.description,
      startDate: result.value.startDate,
      deadline: result.value.deadline,
      status: result.value.status,
      createdAt: new Date().toISOString(),
    };
    projects.push(project);
    saveProjects(projects);

    if (typeof ActivityLog !== 'undefined') {
      ActivityLog.logProjectCreated(project);
    }

    return { valid: true, errors: {}, project };
  }

  function updateProject(id, input) {
    const result = validateProject(input);
    if (!result.valid) return result;

    const projects = loadProjects();
    const index = projects.findIndex((p) => p.id === id);
    if (index === -1) {
      return { valid: false, errors: { _: "Project not found." } };
    }

    const updated = {
      ...projects[index],
      name: result.value.name,
      description: result.value.description,
      startDate: result.value.startDate,
      deadline: result.value.deadline,
      status: result.value.status,
    };
    projects[index] = updated;
    saveProjects(projects);

    if (typeof ActivityLog !== 'undefined') {
      ActivityLog.logProjectUpdated(updated);
    }

    return { valid: true, errors: {}, project: updated };
  }

  function deleteProjectById(id) {
    const project = loadProjects().find((p) => p.id === id) || null;
    const projects = loadProjects().filter((p) => p.id !== id);
    saveProjects(projects);
    if (project && typeof ActivityLog !== 'undefined') {
      ActivityLog.logProjectDeleted(project);
    }
  }

  // -- Deadline / status helpers ---------------------------------------------

  function isOverdue(project) {
    if (project.status === "Completed") return false;
    const deadlineTime = new Date(project.deadline).getTime();
    if (Number.isNaN(deadlineTime)) return false;
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    return deadlineTime < startOfToday.getTime();
  }

  function formatDeadline(dateStr) {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function statusBadgeClass(status) {
    switch (status) {
      case "Active":
        return "pm-badge pm-badge--active";
      case "Completed":
        return "pm-badge pm-badge--completed";
      case "On Hold":
        return "pm-badge pm-badge--onhold";
      default:
        return "pm-badge";
    }
  }

  // -- Rendering ---------------------------------------------------------------
  // Renders into whatever container element the caller hands in. This module
  // does not create its own root and does not decide where it lives on the
  // page — that's Day 2 integration work. It does inject one scoped
  // <style> block (see injectStyles below) containing the project-card
  // grid CSS, built entirely from Dashboard design tokens/patterns already
  // defined in style.css (same approach members-ui.js uses for member
  // tiles), so no shared stylesheet has to be touched.

  const STYLE_ID = "pm-projects-module-styles";

  // Same folder icon the Dashboard widget-empty state uses for projects,
  // reused here so the icon language stays identical across the app.
  const FOLDER_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 7C3 5.89543 3.89543 5 5 5H9L11 8H19C20.1046 8 21 8.89543 21 10V17C21 18.1046 20.1046 19 19 19H5C3.89543 19 3 18.1046 3 17V7Z"/></svg>';
  const FOLDER_ICON_LARGE = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 7C3 5.89543 3.89543 5 5 5H9L11 8H19C20.1046 8 21 8.89543 21 10V17C21 18.1046 20.1046 19 19 19H5C3.89543 19 3 18.1046 3 17V7Z"/></svg>';

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .projects-view {
        display: flex;
        flex-direction: column;
        gap: 24px;
        animation: slideUpFade 0.5s cubic-bezier(0.16,1,0.3,1) both;
      }
      .pm-date-row-group {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
        gap: 14px;
      }
      .projects-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 18px;
      }
      .project-card {
        background: rgba(255,255,255,0.55);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border: 1px solid rgba(255,255,255,0.5);
        border-radius: 18px;
        padding: 18px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        min-width: 0;
        box-shadow: 0 1px 3px rgba(0,0,0,0.03), 0 4px 12px rgba(154,170,99,0.04);
        transition: all 0.3s cubic-bezier(0.16,1,0.3,1);
      }
      .project-card:hover {
        transform: translateY(-3px);
        box-shadow: 0 10px 28px rgba(154,170,99,0.1), 0 3px 8px rgba(0,0,0,0.04);
        border-color: rgba(154,170,99,0.15);
      }
      .project-card__header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 10px;
      }
      .project-card__name {
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-size: 0.95rem;
        font-weight: 700;
        color: var(--color-gray-800, #2c2820);
        margin: 0;
        overflow-wrap: break-word;
      }
      .project-card__description {
        font-size: 0.82rem;
        color: rgba(44,40,32,0.6);
        margin: 0;
        line-height: 1.5;
        overflow-wrap: break-word;
      }
      .project-card__description--empty {
        color: rgba(44,40,32,0.35);
        font-style: italic;
      }
      .project-card__meta {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
        gap: 10px;
        padding-top: 10px;
        border-top: 1px solid rgba(154,170,99,0.12);
      }
      .project-card__meta-item {
        display: flex;
        flex-direction: column;
        gap: 2px;
        min-width: 0;
      }
      .project-card__meta-label {
        font-size: 0.66rem;
        font-weight: 600;
        color: rgba(44,40,32,0.4);
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }
      .project-card__meta-value {
        font-size: 0.78rem;
        font-weight: 600;
        color: var(--color-gray-700, #423c2e);
        overflow-wrap: break-word;
      }
      .project-card__actions {
        display: flex;
        gap: 6px;
        margin-top: 4px;
      }
    `;
    document.head.appendChild(style);
  }

  let container = null;
  let editingId = null;

  function render() {
    if (!container) return;
    injectStyles();
    container.innerHTML = "";

    const view = document.createElement("div");
    view.className = "projects-view";

    const header = document.createElement("div");
    header.className = "pm-header";

    const title = document.createElement("h2");
    title.textContent = "Project Management";
    header.appendChild(title);

    const newBtn = document.createElement("button");
    newBtn.type = "button";
    newBtn.className = "pm-btn pm-btn--primary";
    newBtn.textContent = "New Project";
    newBtn.addEventListener("click", () => {
      editingId = null;
      renderForm(null);
    });
    header.appendChild(newBtn);

    view.appendChild(header);

    const formHost = document.createElement("div");
    formHost.className = "pm-form-host";
    view.appendChild(formHost);

    const listHost = document.createElement("div");
    listHost.className = "pm-list-host";
    view.appendChild(listHost);

    container.appendChild(view);

    renderList();
  }

  function renderForm(project) {
    const formHost = container.querySelector(".pm-form-host");
    formHost.innerHTML = "";

    const card = document.createElement("div");
    card.className = "widget-card pm-form-card";

    const cardHeader = document.createElement("div");
    cardHeader.className = "widget-card__header";

    const cardTitle = document.createElement("div");
    cardTitle.className = "widget-card__title";
    cardTitle.innerHTML = FOLDER_ICON;
    cardTitle.appendChild(document.createTextNode(project ? "Edit Project" : "Create Project"));
    cardHeader.appendChild(cardTitle);
    card.appendChild(cardHeader);

    const cardBody = document.createElement("div");
    cardBody.className = "widget-card__body";

    const form = document.createElement("form");
    form.className = "pm-form";
    form.noValidate = true;

    const nameRow = buildFieldRow("pm-name", "Name", "input", { type: "text", value: project ? project.name : "" });
    const descRow = buildFieldRow("pm-description", "Description", "textarea", { value: project ? project.description : "" });
    const startDateRow = buildFieldRow("pm-start-date", "Start Date", "input", { type: "date", value: project ? project.startDate : "" });
    const deadlineRow = buildFieldRow("pm-deadline", "End Date", "input", { type: "date", value: project ? project.deadline : "" });
    const statusRow = buildStatusRow(project ? project.status : "Active");

    form.appendChild(nameRow.row);
    form.appendChild(descRow.row);

    const dateGroup = document.createElement("div");
    dateGroup.className = "pm-date-row-group";
    dateGroup.appendChild(startDateRow.row);
    dateGroup.appendChild(deadlineRow.row);
    form.appendChild(dateGroup);

    form.appendChild(statusRow.row);

    const actions = document.createElement("div");
    actions.className = "pm-form-actions";

    const submitBtn = document.createElement("button");
    submitBtn.type = "submit";
    submitBtn.className = "pm-btn pm-btn--primary";
    submitBtn.textContent = project ? "Save Changes" : "Create Project";
    actions.appendChild(submitBtn);

    const cancelBtn = document.createElement("button");
    cancelBtn.type = "button";
    cancelBtn.className = "pm-btn pm-btn--secondary";
    cancelBtn.textContent = "Cancel";
    cancelBtn.addEventListener("click", () => {
      editingId = null;
      formHost.innerHTML = "";
    });
    actions.appendChild(cancelBtn);

    form.appendChild(actions);

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const input = {
        name: nameRow.input.value,
        description: descRow.input.value,
        startDate: startDateRow.input.value,
        deadline: deadlineRow.input.value,
        status: statusRow.select.value,
      };

      clearFieldErrors(form);

      const result = project ? updateProject(project.id, input) : createProject(input);

      if (!result.valid) {
        showFieldErrors(form, result.errors);
        return;
      }

      editingId = null;
      formHost.innerHTML = "";
      renderList();
    });

    cardBody.appendChild(form);
    card.appendChild(cardBody);
    formHost.appendChild(card);
  }

  function buildFieldRow(id, labelText, tag, opts) {
    const row = document.createElement("div");
    row.className = "pm-form-row";

    const label = document.createElement("label");
    label.setAttribute("for", id);
    label.textContent = labelText;
    row.appendChild(label);

    const input = document.createElement(tag);
    input.id = id;
    if (opts.type) input.type = opts.type;
    input.value = opts.value || "";
    row.appendChild(input);

    return { row, input };
  }

  function buildStatusRow(currentStatus) {
    const row = document.createElement("div");
    row.className = "pm-form-row";

    const label = document.createElement("label");
    label.setAttribute("for", "pm-status");
    label.textContent = "Status";
    row.appendChild(label);

    const select = document.createElement("select");
    select.id = "pm-status";
    STATUS_OPTIONS.forEach((status) => {
      const opt = document.createElement("option");
      opt.value = status;
      opt.textContent = status;
      if (status === currentStatus) opt.selected = true;
      select.appendChild(opt);
    });
    row.appendChild(select);

    return { row, select };
  }

  function clearFieldErrors(form) {
    form.querySelectorAll(".pm-error").forEach((el) => el.remove());
  }

  function showFieldErrors(form, errors) {
    const fieldToId = { name: "pm-name", description: "pm-description", startDate: "pm-start-date", deadline: "pm-deadline", status: "pm-status" };
    Object.keys(errors).forEach((field) => {
      const inputId = fieldToId[field];
      const input = inputId ? form.querySelector(`#${inputId}`) : null;
      const msg = document.createElement("div");
      msg.className = "pm-error";
      msg.textContent = errors[field];
      if (input) {
        input.insertAdjacentElement("afterend", msg);
      } else {
        form.appendChild(msg);
      }
    });
  }

  function renderList() {
    const listHost = container.querySelector(".pm-list-host");
    listHost.innerHTML = "";

    const projects = getAllProjects();

    const card = document.createElement("div");
    card.className = "widget-card";

    const cardHeader = document.createElement("div");
    cardHeader.className = "widget-card__header";

    const cardTitle = document.createElement("div");
    cardTitle.className = "widget-card__title";
    cardTitle.innerHTML = FOLDER_ICON;
    cardTitle.appendChild(document.createTextNode("Projects"));
    cardHeader.appendChild(cardTitle);

    const badge = document.createElement("span");
    badge.className = "widget-card__badge";
    badge.textContent = projects.length + (projects.length === 1 ? " project" : " projects");
    cardHeader.appendChild(badge);

    card.appendChild(cardHeader);

    const cardBody = document.createElement("div");
    cardBody.className = "widget-card__body";

    if (projects.length === 0) {
      const empty = document.createElement("div");
      empty.className = "widget-empty";
      empty.innerHTML =
        '<div class="widget-empty__icon">' + FOLDER_ICON_LARGE + "</div>" +
        '<span class="widget-empty__text">No projects yet. Click "New Project" to add one.</span>';
      cardBody.appendChild(empty);
    } else {
      const grid = document.createElement("div");
      grid.className = "projects-grid";
      projects.forEach((project) => grid.appendChild(buildProjectCard(project)));
      cardBody.appendChild(grid);
    }

    card.appendChild(cardBody);
    listHost.appendChild(card);
  }

  function buildMetaItem(label, value) {
    const item = document.createElement("div");
    item.className = "project-card__meta-item";

    const labelEl = document.createElement("span");
    labelEl.className = "project-card__meta-label";
    labelEl.textContent = label;
    item.appendChild(labelEl);

    const valueEl = document.createElement("span");
    valueEl.className = "project-card__meta-value";
    valueEl.textContent = value;
    item.appendChild(valueEl);

    return item;
  }

  function buildProjectCard(project) {
    const card = document.createElement("div");
    card.className = "project-card";

    const header = document.createElement("div");
    header.className = "project-card__header";

    const name = document.createElement("h3");
    name.className = "project-card__name";
    name.textContent = project.name;
    header.appendChild(name);

    const statusBadge = document.createElement("span");
    statusBadge.className = statusBadgeClass(project.status);
    statusBadge.textContent = project.status;
    header.appendChild(statusBadge);

    card.appendChild(header);

    const desc = document.createElement("p");
    desc.className = project.description
      ? "project-card__description"
      : "project-card__description project-card__description--empty";
    desc.textContent = project.description || "No description provided.";
    card.appendChild(desc);

    const meta = document.createElement("div");
    meta.className = "project-card__meta";

    meta.appendChild(buildMetaItem("Start Date", project.startDate ? formatDeadline(project.startDate) : "Not set"));

    const endDateItem = buildMetaItem("End Date", formatDeadline(project.deadline) + (isOverdue(project) ? " (Overdue)" : ""));
    if (isOverdue(project)) {
      endDateItem.querySelector(".project-card__meta-value").classList.add("pm-overdue");
    }
    meta.appendChild(endDateItem);

    meta.appendChild(buildMetaItem("Created", formatDeadline(project.createdAt)));

    card.appendChild(meta);

    const actions = document.createElement("div");
    actions.className = "project-card__actions";

    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.className = "pm-btn pm-btn--secondary pm-btn--small";
    editBtn.textContent = "Edit";
    editBtn.addEventListener("click", () => {
      editingId = project.id;
      renderForm(project);
    });
    actions.appendChild(editBtn);

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "pm-btn pm-btn--danger pm-btn--small";
    deleteBtn.textContent = "Delete";
    deleteBtn.addEventListener("click", () => handleDeleteClick(project));
    actions.appendChild(deleteBtn);

    card.appendChild(actions);

    return card;
  }

  function handleDeleteClick(project) {
    const relatedCount = getRelatedTaskCount(project.id);
    let confirmed;
    if (relatedCount > 0) {
      confirmed = window.confirm(
        `"${project.name}" has ${relatedCount} related task${relatedCount === 1 ? "" : "s"}. ` +
          "Deleting this project will not delete those tasks automatically, but they will be left pointing at a missing project. Continue?"
      );
    } else {
      confirmed = window.confirm(`Delete project "${project.name}"? This cannot be undone.`);
    }

    if (!confirmed) return;

    deleteProjectById(project.id);
    renderList();
  }

  // -- Mount -------------------------------------------------------------
  // Explicit entry point for Day 2 integration. Does not run on its own;
  // whatever owns the page layout calls this with a container it controls.

  function mount(containerElement) {
    if (!containerElement) {
      throw new Error("Projects.mount requires a container element.");
    }
    container = containerElement;
    render();
  }

  return {
    mount,
    getAllProjects,
    getProjectById,
    createProject,
    updateProject,
    deleteProjectById,
    validateProject,
    isOverdue,
    getRelatedTaskCount,
    STATUS_OPTIONS,
  };
})();

if (typeof window !== "undefined") {
  window.Projects = Projects;
}
