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
 *    ALSO listening on those nav links (in addition to Intern 1's own
 *    listener — addEventListener is additive, this doesn't remove or
 *    replace their handler) and hiding members-section when they fire.
 */

(function () {
  "use strict";

  const STYLE_ID = "members-module-styles";

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .members-card {
        background: #fff;
        border-radius: 12px;
        padding: 20px 24px;
        margin-bottom: 20px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.08);
      }
      .members-card h2 {
        margin: 0 0 16px 0;
        font-size: 18px;
      }
      .members-form-row {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        margin-bottom: 12px;
      }
      .members-form-row label {
        display: flex;
        flex-direction: column;
        font-size: 13px;
        flex: 1 1 200px;
        gap: 4px;
      }
      .members-form-row input {
        padding: 8px 10px;
        border: 1px solid #ddd;
        border-radius: 6px;
        font-size: 14px;
      }
      .members-error {
        color: #d33;
        font-size: 13px;
        margin: 4px 0 10px;
        min-height: 16px;
      }
      .members-add-btn {
        padding: 8px 18px;
        border: none;
        border-radius: 6px;
        background: #2f3b2f;
        color: #fff;
        cursor: pointer;
        font-size: 14px;
      }
      .members-add-btn:hover {
        opacity: 0.9;
      }
      .members-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
        gap: 16px;
      }
      .member-card {
        border: 1px solid #eee;
        border-radius: 10px;
        padding: 16px;
        display: flex;
        gap: 12px;
        align-items: flex-start;
        min-width: 0; /* prevents flex/grid overflow */
      }
      .member-avatar {
        flex-shrink: 0;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: #e4e8dd;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: 13px;
      }
      .member-info {
        flex: 1;
        min-width: 0; /* allows text to wrap/truncate instead of pushing card wider */
      }
      .member-info h3 {
        margin: 0 0 4px 0;
        font-size: 15px;
        overflow-wrap: break-word;
      }
      .member-info p {
        margin: 2px 0;
        font-size: 12.5px;
        color: #666;
        overflow-wrap: break-word;
      }
      .member-delete-btn {
        margin-top: 10px;
        padding: 5px 12px;
        font-size: 12.5px;
        border: 1px solid #ddd;
        border-radius: 6px;
        background: #fff;
        cursor: pointer;
      }
      .member-delete-btn:hover {
        background: #fbeaea;
        border-color: #e5b3b3;
      }
    `;
    document.head.appendChild(style);
  }

  function findNavItemByLabel(labelText) {
    const items = document.querySelectorAll(".sidebar__item");
    for (const item of items) {
      const label = item.querySelector(".sidebar__label");
      if (label && label.textContent.trim() === labelText) {
        return item;
      }
    }
    return null;
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

  function hideMembersSection() {
    const section = document.getElementById("members-section");
    if (section) section.style.display = "none";
  }

  function hideOtherSections() {
    const dashboard = document.querySelector(".dashboard");
    const promptBuilder = document.getElementById("prompt-builder-section");
    if (dashboard) dashboard.style.display = "none";
    if (promptBuilder) promptBuilder.style.display = "none";
  }

  function setActiveNav(activeLi) {
    const allNavItems = document.querySelectorAll(".sidebar__item");
    allNavItems.forEach((item) => {
      item.classList.remove("sidebar__item--active");
      const link = item.querySelector(".sidebar__link");
      if (link) link.removeAttribute("aria-current");
    });
    activeLi.classList.add("sidebar__item--active");
    const activeLink = activeLi.querySelector(".sidebar__link");
    if (activeLink) activeLink.setAttribute("aria-current", "page");
  }

  function showMembers(e) {
    if (e) e.preventDefault();
    hideOtherSections();

    const section = ensureMembersSection();
    section.style.display = "";

    const headerTitle = document.querySelector(".header__title");
    if (headerTitle) headerTitle.textContent = "Team Members";

    const membersNav = findNavItemByLabel("Members");
    if (membersNav) setActiveNav(membersNav);

    const sidebar = document.getElementById("sidebar");
    if (sidebar) sidebar.classList.remove("sidebar--open");

    renderMembers();
  }

  function renderMembers() {
    const section = document.getElementById("members-section");
    if (!section) return;

    const members = Members.getAllMembers();
    var canDelete = window.Permissions && window.TaskFlowSession
      ? window.Permissions.check(window.TaskFlowSession.role, 'manage_team')
      : false;

    section.innerHTML = `
      <div class="members-card">
        <h2>Add Team Member</h2>
        <form id="add-member-form" novalidate>
          <div class="members-form-row">
            <label>Full Name
              <input type="text" id="member-name" placeholder="e.g. Sara Khan" required />
            </label>
            <label>Role
              <input type="text" id="member-role" placeholder="e.g. Developer" />
            </label>
            <label>Email
              <input type="email" id="member-email" placeholder="name@example.com" required />
            </label>
          </div>
          <p class="members-error" id="member-form-error"></p>
          <button type="submit" class="members-add-btn">Add Member</button>
        </form>
      </div>

      <div class="members-card">
        <h2>Team (${members.length})</h2>
        <div class="members-grid">
          ${members
            .map(
              (m) => `
            <div class="member-card" data-id="${m.id}">
              <div class="member-avatar">${m.initials}</div>
              <div class="member-info">
                <h3>${m.name}</h3>
                <p>${m.role}</p>
                <p>${m.email}</p>
                <p>${m.taskCount} task(s) assigned</p>
                ${canDelete ? '<button class="member-delete-btn delete-member-btn" data-id="' + m.id + '">Delete</button>' : ''}
              </div>
            </div>
          `
            )
            .join("")}
        </div>
      </div>
    `;

    attachMemberEvents();
  }

  function attachMemberEvents() {
    const form = document.getElementById("add-member-form");
    const errorEl = document.getElementById("member-form-error");

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = document.getElementById("member-name").value;
      const role = document.getElementById("member-role").value;
      const email = document.getElementById("member-email").value;

      const result = Members.addMember(name, role, email);
      if (!result.success) {
        errorEl.textContent = result.error;
        return;
      }
      errorEl.textContent = "";
      renderMembers();
    });

    document.querySelectorAll(".delete-member-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = Number(btn.getAttribute("data-id"));
        const result = Members.deleteMember(id);
        if (!result.success) {
          alert(result.error);
          return;
        }
        renderMembers();
      });
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    injectStyles();

    const membersNav = findNavItemByLabel("Members");
    if (membersNav) {
      const link = membersNav.querySelector(".sidebar__link");
      if (link) link.addEventListener("click", showMembers);
    }

    // Hide Members section when navigating away, since Intern 1's
    // original handlers for these two links don't know it exists.
    const dashboardNav = document.getElementById("nav-dashboard");
    if (dashboardNav) {
      dashboardNav.addEventListener("click", hideMembersSection);
    }

    const promptBuilderNav = document.getElementById("nav-prompt-builder");
    if (promptBuilderNav) {
      promptBuilderNav.addEventListener("click", hideMembersSection);
    }
  });
})();