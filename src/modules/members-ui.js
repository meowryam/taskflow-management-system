/**
 * members-ui.js
 * Rendering/DOM layer for the Team Members module.
 * Kept separate from members.js (data logic).
 *
 * Fix log:
 *  - v1: reused .stat-card/.dashboard__stats-grid, which was sized for
 *    short stat-number content and overflowed with real member data.
 *    Now uses its own scoped CSS (auto-wrapping grid).
 *  - v1: Members section stayed visible after navigating to Dashboard
 *    or Prompt Builder, because those nav items are wired by Intern 1's
 *    inline script, which has no knowledge of members-section. Fixed by
 *    ALSO listening on those nav links.
 *  - v2: Aligned the view with the Dashboard design system (reuses
 *    .widget-card / .widget-empty / .pm-btn and design tokens, adds a
 *    scoped .member-tile grid). Added an Add/Edit form toggle and a
 *    styled delete-confirmation dialog. Navigation is now hooked on the
 *    #nav-members list item itself so programmatic navigateTo('members')
 *    also renders the view; the central router's hideAllSections() now
 *    covers members-section, so the old per-link hide listeners were
 *    removed.
 */

(function () {
  "use strict";

  const STYLE_ID = "members-module-styles";

  // Same accent gradient palette the Dashboard team widget uses, so
  // avatars look consistent across the app.
  const AVATAR_GRADIENTS = [
    "linear-gradient(135deg,#9AAA63,#b8c88a)",
    "linear-gradient(135deg,#B6CAED,#cedcf3)",
    "linear-gradient(135deg,#F3B7DA,#f8cfe7)",
    "linear-gradient(135deg,#F6D868,#f9e494)",
    "linear-gradient(135deg,#c4b5fd,#ddd6fe)",
    "linear-gradient(135deg,#fdba74,#fed7aa)",
  ];

  // Tracks which member (if any) is currently being edited. null = add mode.
  let editingId = null;

  /**
   * Minimal HTML escaping. Prevents member names/emails containing quotes
   * or angle brackets from breaking rendered markup or the edit form's
   * prefilled value attributes.
   */
  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .members-view {
        display: flex;
        flex-direction: column;
        gap: 24px;
        animation: slideUpFade 0.5s cubic-bezier(0.16,1,0.3,1) both;
      }
      .members-form {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 14px;
      }
      .members-form .pm-form-row { margin-bottom: 0; }
      .members-form-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 16px;
      }
      .members-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
        gap: 18px;
      }
      .member-tile {
        background: rgba(255,255,255,0.55);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border: 1px solid rgba(255,255,255,0.5);
        border-radius: 18px;
        padding: 16px;
        display: flex;
        gap: 12px;
        align-items: flex-start;
        min-width: 0; /* prevents flex/grid overflow */
        box-shadow: 0 1px 3px rgba(0,0,0,0.03), 0 4px 12px rgba(154,170,99,0.04);
        transition: all 0.3s cubic-bezier(0.16,1,0.3,1);
      }
      .member-tile:hover {
        transform: translateY(-3px);
        box-shadow: 0 10px 28px rgba(154,170,99,0.1), 0 3px 8px rgba(0,0,0,0.04);
        border-color: rgba(154,170,99,0.15);
      }
      .member-tile__avatar {
        flex-shrink: 0;
        width: 44px;
        height: 44px;
        border-radius: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-weight: 700;
        font-size: 0.9rem;
        color: #fff;
      }
      .member-tile__info {
        flex: 1;
        min-width: 0; /* allows text to wrap instead of pushing the tile wider */
      }
      .member-tile__name {
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-size: 0.95rem;
        font-weight: 700;
        color: var(--color-gray-800, #2c2820);
        margin: 0 0 2px;
        overflow-wrap: break-word;
      }
      .member-tile__role {
        font-size: 0.76rem;
        font-weight: 600;
        color: var(--color-primary-dark, #7a8a4a);
        margin: 0 0 8px;
        overflow-wrap: break-word;
      }
      .member-tile__email {
        font-size: 0.78rem;
        color: rgba(44,40,32,0.5);
        margin: 0 0 2px;
        overflow-wrap: break-word;
      }
      .member-tile__tasks {
        font-size: 0.74rem;
        color: rgba(44,40,32,0.45);
        margin: 0;
      }
      .member-tile__actions {
        display: flex;
        gap: 6px;
        margin-top: 12px;
      }

      /* Styled confirmation dialog (design-system aligned) */
      .members-dialog-overlay {
        position: fixed;
        inset: 0;
        background: rgba(26,23,18,0.45);
        backdrop-filter: blur(4px);
        -webkit-backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        z-index: 2000;
        animation: membersFadeIn 0.2s ease;
      }
      .members-dialog {
        background: rgba(255,255,255,0.9);
        backdrop-filter: blur(24px);
        -webkit-backdrop-filter: blur(24px);
        border: 1px solid rgba(255,255,255,0.6);
        border-radius: 20px;
        padding: 26px;
        width: 100%;
        max-width: 400px;
        box-shadow: 0 20px 60px rgba(0,0,0,0.22);
        animation: membersDialogIn 0.25s cubic-bezier(0.16,1,0.3,1);
      }
      .members-dialog__title {
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-size: 1.1rem;
        font-weight: 700;
        color: var(--color-gray-900, #1a1712);
        margin: 0 0 10px;
      }
      .members-dialog__msg {
        font-size: 0.88rem;
        color: var(--color-gray-600, #5c5340);
        line-height: 1.5;
        margin: 0 0 20px;
      }
      .members-dialog__msg--error {
        color: var(--color-danger, #a8452f);
        font-weight: 500;
      }
      .members-dialog__actions {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
      }

      @keyframes membersFadeIn {
        from { opacity: 0; }
        to   { opacity: 1; }
      }
      @keyframes membersDialogIn {
        from { opacity: 0; transform: translateY(12px) scale(0.98); }
        to   { opacity: 1; transform: translateY(0) scale(1); }
      }
    `;
    document.head.appendChild(style);
  }

  function ensureMembersSection() {
    let section = document.getElementById("members-section");
    if (section) return section;

    const main = document.getElementById("mainContent");
    section = document.createElement("section");
    section.id = "members-section";
    section.setAttribute("aria-label", "Team Members");
    section.style.display = "none";
    main.appendChild(section);
    return section;
  }

  function setActiveNav(activeLi) {
    const allNavItems = document.querySelectorAll(".sidebar__item");
    allNavItems.forEach((item) => {
      item.classList.remove("sidebar__item--active");
      const link = item.querySelector(".sidebar__link");
      if (link) link.removeAttribute("aria-current");
    });
    if (!activeLi) return;
    activeLi.classList.add("sidebar__item--active");
    const activeLink = activeLi.querySelector(".sidebar__link");
    if (activeLink) activeLink.setAttribute("aria-current", "page");
  }

  function showMembers(e) {
    if (e) e.preventDefault();

    const section = ensureMembersSection();
    section.style.display = "";

    const headerTitle = document.querySelector(".header__title");
    if (headerTitle) headerTitle.textContent = "Team Members";

    setActiveNav(document.getElementById("nav-members"));

    const sidebar = document.getElementById("sidebar");
    if (sidebar) sidebar.classList.remove("sidebar--open");

    renderMembers();
  }

  function canManageMembers() {
    return window.Permissions && window.TaskFlowSession
      ? window.Permissions.check(window.TaskFlowSession.role, "manage_team")
      : false;
  }

  function renderMembers() {
    const section = document.getElementById("members-section");
    if (!section) return;

    const members = Members.getAllMembers();
    const canManage = canManageMembers();
    const editing = editingId !== null
      ? members.find((m) => m.id === editingId)
      : null;

    // If the member being edited disappeared, fall back to add mode.
    if (editingId !== null && !editing) editingId = null;

    const formTitle = editing ? "Edit Team Member" : "Add Team Member";
    const submitLabel = editing ? "Save Changes" : "Add Member";
    const nameVal = editing ? escapeHtml(editing.name) : "";
    const roleVal = editing ? escapeHtml(editing.role) : "";
    const emailVal = editing ? escapeHtml(editing.email) : "";

    const teamBody = members.length === 0
      ? `
        <div class="widget-empty">
          <div class="widget-empty__icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="9" cy="8" r="3"/><path d="M3 20C3 16.6863 5.68629 14 9 14C12.3137 14 15 16.6863 15 20"/></svg>
          </div>
          <span class="widget-empty__text">No members yet</span>
        </div>`
      : `
        <div class="members-grid">
          ${members
            .map((m, i) => {
              const gradient = AVATAR_GRADIENTS[i % AVATAR_GRADIENTS.length];
              const actions = canManage
                ? `
                <div class="member-tile__actions">
                  <button type="button" class="pm-btn pm-btn--secondary pm-btn--small edit-member-btn" data-id="${m.id}">Edit</button>
                  <button type="button" class="pm-btn pm-btn--danger pm-btn--small delete-member-btn" data-id="${m.id}">Delete</button>
                </div>`
                : "";
              return `
              <div class="member-tile" data-id="${m.id}">
                <div class="member-tile__avatar" style="background:${gradient}">${escapeHtml(m.initials)}</div>
                <div class="member-tile__info">
                  <h3 class="member-tile__name">${escapeHtml(m.name)}</h3>
                  <p class="member-tile__role">${escapeHtml(m.role)}</p>
                  <p class="member-tile__email">${escapeHtml(m.email)}</p>
                  <p class="member-tile__tasks">${m.taskCount} task(s) assigned</p>
                  ${actions}
                </div>
              </div>`;
            })
            .join("")}
        </div>`;

    section.innerHTML = `
      <div class="members-view">
        <div class="widget-card">
          <div class="widget-card__header">
            <div class="widget-card__title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              ${formTitle}
            </div>
          </div>
          <div class="widget-card__body">
            <form id="add-member-form" novalidate>
              <div class="members-form">
                <div class="pm-form-row">
                  <label for="member-name">Full Name</label>
                  <input type="text" id="member-name" placeholder="e.g. Sara Khan" value="${nameVal}" required />
                </div>
                <div class="pm-form-row">
                  <label for="member-role">Role</label>
                  <input type="text" id="member-role" placeholder="e.g. Developer" value="${roleVal}" />
                </div>
                <div class="pm-form-row">
                  <label for="member-email">Email</label>
                  <input type="email" id="member-email" placeholder="name@example.com" value="${emailVal}" required />
                </div>
              </div>
              <p class="pm-error" id="member-form-error"></p>
              <div class="members-form-actions">
                <button type="submit" class="pm-btn pm-btn--primary" id="member-submit-btn">${submitLabel}</button>
                ${editing ? '<button type="button" class="pm-btn pm-btn--secondary" id="member-cancel-btn">Cancel</button>' : ""}
              </div>
            </form>
          </div>
        </div>

        <div class="widget-card">
          <div class="widget-card__header">
            <div class="widget-card__title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              Team
            </div>
            <span class="widget-card__badge">${members.length} member${members.length !== 1 ? "s" : ""}</span>
          </div>
          <div class="widget-card__body">
            ${teamBody}
          </div>
        </div>
      </div>
    `;

    attachMemberEvents();

    if (editing) {
      const nameInput = document.getElementById("member-name");
      if (nameInput) nameInput.focus();
    }
  }

  function attachMemberEvents() {
    const form = document.getElementById("add-member-form");
    const errorEl = document.getElementById("member-form-error");

    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const name = document.getElementById("member-name").value;
        const role = document.getElementById("member-role").value;
        const email = document.getElementById("member-email").value;

        const result = editingId !== null
          ? Members.editMember(editingId, name, role, email)
          : Members.addMember(name, role, email);

        if (!result.success) {
          errorEl.textContent = result.error;
          return;
        }
        errorEl.textContent = "";
        editingId = null;
        renderMembers();
      });
    }

    const cancelBtn = document.getElementById("member-cancel-btn");
    if (cancelBtn) {
      cancelBtn.addEventListener("click", () => {
        editingId = null;
        renderMembers();
      });
    }

    document.querySelectorAll(".edit-member-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        editingId = Number(btn.getAttribute("data-id"));
        renderMembers();
      });
    });

    document.querySelectorAll(".delete-member-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = Number(btn.getAttribute("data-id"));
        openDeleteDialog(id);
      });
    });
  }

  /* ---------- Styled delete-confirmation dialog ---------- */

  let dialogKeyHandler = null;

  function closeDeleteDialog() {
    const overlay = document.getElementById("members-delete-dialog");
    if (overlay) overlay.remove();
    if (dialogKeyHandler) {
      document.removeEventListener("keydown", dialogKeyHandler);
      dialogKeyHandler = null;
    }
  }

  function openDeleteDialog(id) {
    const members = Members.getAllMembers();
    const member = members.find((m) => m.id === id);
    if (!member) return;

    closeDeleteDialog();

    const overlay = document.createElement("div");
    overlay.className = "members-dialog-overlay";
    overlay.id = "members-delete-dialog";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.innerHTML = `
      <div class="members-dialog">
        <h3 class="members-dialog__title">Delete member?</h3>
        <p class="members-dialog__msg" id="members-dialog-msg">
          Are you sure you want to remove <strong>${escapeHtml(member.name)}</strong> from the team? This action cannot be undone.
        </p>
        <div class="members-dialog__actions" id="members-dialog-actions">
          <button type="button" class="pm-btn pm-btn--secondary" id="members-dialog-cancel">Cancel</button>
          <button type="button" class="pm-btn pm-btn--danger" id="members-dialog-confirm">Delete</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeDeleteDialog();
    });

    dialogKeyHandler = (e) => {
      if (e.key === "Escape") closeDeleteDialog();
    };
    document.addEventListener("keydown", dialogKeyHandler);

    const cancelBtn = document.getElementById("members-dialog-cancel");
    if (cancelBtn) cancelBtn.addEventListener("click", closeDeleteDialog);

    const confirmBtn = document.getElementById("members-dialog-confirm");
    if (confirmBtn) {
      confirmBtn.addEventListener("click", () => {
        const result = Members.deleteMember(id);
        if (!result.success) {
          // Surface the safety-check error inside the dialog instead of
          // a browser alert(); swap the confirm action for a dismiss.
          const msg = document.getElementById("members-dialog-msg");
          const actions = document.getElementById("members-dialog-actions");
          if (msg) {
            msg.classList.add("members-dialog__msg--error");
            msg.textContent = result.error;
          }
          if (actions) {
            actions.innerHTML =
              '<button type="button" class="pm-btn pm-btn--secondary" id="members-dialog-dismiss">Close</button>';
            const dismiss = document.getElementById("members-dialog-dismiss");
            if (dismiss) dismiss.addEventListener("click", closeDeleteDialog);
          }
          return;
        }
        closeDeleteDialog();
        renderMembers();
      });
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    injectStyles();
    // Create the section up front so the central router can find and show
    // it regardless of listener ordering.
    ensureMembersSection();

    // Hook navigation on the #nav-members list item itself. This catches
    // both real sidebar clicks (which bubble up from the link) and
    // programmatic navigateTo('members') calls that dispatch .click() on
    // the list item. The central router's hideAllSections() already hides
    // members-section when navigating away, so no per-link hide listeners
    // are needed anymore.
    const membersNav = document.getElementById("nav-members");
    if (membersNav) membersNav.addEventListener("click", showMembers);
  });
})();
