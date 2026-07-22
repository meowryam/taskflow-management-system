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
//   deadline: string,       // ISO date string, e.g. "2026-08-01"
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

    if (!deadline) {
      errors.deadline = "Deadline is required.";
    } else if (Number.isNaN(new Date(deadline).getTime())) {
      errors.deadline = "Deadline must be a valid date.";
    }

    if (!STATUS_OPTIONS.includes(status)) {
      errors.status = `Status must be one of: ${STATUS_OPTIONS.join(", ")}.`;
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors,
      value: { name, description, deadline, status },
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
      deadline: result.value.deadline,
      status: result.value.status,
      createdAt: new Date().toISOString(),
    };
    projects.push(project);
    saveProjects(projects);

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
      deadline: result.value.deadline,
      status: result.value.status,
    };
    projects[index] = updated;
    saveProjects(projects);

    return { valid: true, errors: {}, project: updated };
  }

  function deleteProjectById(id) {
    const projects = loadProjects().filter((p) => p.id !== id);
    saveProjects(projects);
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
  // does not create its own root, does not inject styles, and does not
  // decide where it lives on the page — that's Day 2 integration work.

  let container = null;
  let editingId = null;

  function render() {
    if (!container) return;
    container.innerHTML = "";

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

    container.appendChild(header);

    const formHost = document.createElement("div");
    formHost.className = "pm-form-host";
    container.appendChild(formHost);

    const listHost = document.createElement("div");
    listHost.className = "pm-list-host";
    container.appendChild(listHost);

    renderList();
  }

  function renderForm(project) {
    const formHost = container.querySelector(".pm-form-host");
    formHost.innerHTML = "";

    const form = document.createElement("form");
    form.className = "pm-form";
    form.noValidate = true;

    const heading = document.createElement("h3");
    heading.textContent = project ? "Edit Project" : "Create Project";
    form.appendChild(heading);

    const nameRow = buildFieldRow("pm-name", "Name", "input", { type: "text", value: project ? project.name : "" });
    const descRow = buildFieldRow("pm-description", "Description", "textarea", { value: project ? project.description : "" });
    const deadlineRow = buildFieldRow("pm-deadline", "Deadline", "input", { type: "date", value: project ? project.deadline : "" });
    const statusRow = buildStatusRow(project ? project.status : "Active");

    form.appendChild(nameRow.row);
    form.appendChild(descRow.row);
    form.appendChild(deadlineRow.row);
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

    formHost.appendChild(form);
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
    const fieldToId = { name: "pm-name", description: "pm-description", deadline: "pm-deadline", status: "pm-status" };
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

    if (projects.length === 0) {
      const empty = document.createElement("p");
      empty.className = "pm-empty";
      empty.textContent = "No projects yet. Click \"New Project\" to add one.";
      listHost.appendChild(empty);
      return;
    }

    const table = document.createElement("table");
    table.className = "pm-table";

    const thead = document.createElement("thead");
    thead.innerHTML =
      "<tr><th>Name</th><th>Description</th><th>Deadline</th><th>Status</th><th>Actions</th></tr>";
    table.appendChild(thead);

    const tbody = document.createElement("tbody");

    projects.forEach((project) => {
      const tr = document.createElement("tr");

      const nameTd = document.createElement("td");
      nameTd.textContent = project.name;
      tr.appendChild(nameTd);

      const descTd = document.createElement("td");
      descTd.textContent = project.description;
      tr.appendChild(descTd);

      const deadlineTd = document.createElement("td");
      deadlineTd.textContent = formatDeadline(project.deadline);
      if (isOverdue(project)) {
        deadlineTd.classList.add("pm-overdue");
        deadlineTd.textContent += " (Overdue)";
      }
      tr.appendChild(deadlineTd);

      const statusTd = document.createElement("td");
      const badge = document.createElement("span");
      badge.className = statusBadgeClass(project.status);
      badge.textContent = project.status;
      statusTd.appendChild(badge);
      tr.appendChild(statusTd);

      const actionsTd = document.createElement("td");
      actionsTd.className = "pm-actions";

      const editBtn = document.createElement("button");
      editBtn.type = "button";
      editBtn.className = "pm-btn pm-btn--secondary pm-btn--small";
      editBtn.textContent = "Edit";
      editBtn.addEventListener("click", () => {
        editingId = project.id;
        renderForm(project);
      });
      actionsTd.appendChild(editBtn);

      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "pm-btn pm-btn--danger pm-btn--small";
      deleteBtn.textContent = "Delete";
      deleteBtn.addEventListener("click", () => handleDeleteClick(project));
      actionsTd.appendChild(deleteBtn);

      tr.appendChild(actionsTd);
      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    listHost.appendChild(table);
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
