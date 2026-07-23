# TaskFlow Management System — Bug Report

## 1. Test Information

| Field | Details |
|---|---|
| Project | TaskFlow Management System |
| Tester | Intern 11 — QA & Manual Testing |
| Group | Beta |
| Roles Tested | Team Member, Admin, and Manager |
| Testing Type | Manual Functional and Regression Testing |
| Environment | Windows, Google Chrome |
| Application URL | `http://localhost:8000` |
| Test Date | July 23, 2026 |

---

# 2. Open Bugs

## BUG-001 — Google Login Is Not Implemented

| Field | Details |
|---|---|
| Module | Authentication |
| Roles | All Roles |
| Severity | Low |
| Priority | Low |
| Status | Open |

### Preconditions

- The Login page is open.

### Steps to Reproduce

1. Open the TaskFlow Login page.
2. Click the Google Login button.

### Expected Result

Google authentication should start and allow the user to sign in using a
Google account.

### Actual Result

Google authentication is not implemented.

---

## BUG-002 — Incorrect Role Displayed for Team Member

| Field | Details |
|---|---|
| Module | Dashboard |
| Role | Team Member |
| Severity | Medium |
| Priority | Medium |
| Status | Open |

### Preconditions

- A Team Member account is available.

### Steps to Reproduce

1. Log in as a Team Member.
2. Open the Dashboard.
3. Review the account name and role displayed in the sidebar or header.

### Expected Result

The interface should display the logged-in Team Member's name and role.

### Actual Result

The interface displays **Admin User** or **Administrator**.

---

## BUG-003 — Team Member Profile Icon Does Not Open a Menu

| Field | Details |
|---|---|
| Module | Dashboard |
| Role | Team Member |
| Severity | Low |
| Priority | Low |
| Status | Open |

### Steps to Reproduce

1. Log in as a Team Member.
2. Open the Dashboard.
3. Click the Profile icon.

### Expected Result

A profile or account menu should open.

### Actual Result

Nothing happens when the icon is clicked.

---

## BUG-004 — Team Member Board Changes Do Not Persist

| Field | Details |
|---|---|
| Module | Board |
| Role | Team Member |
| Severity | Medium |
| Priority | Medium |
| Status | Open |

### Preconditions

- At least one task is displayed on the Board.

### Steps to Reproduce

1. Log in as a Team Member.
2. Open the Board.
3. Drag a task into a different status column.
4. Verify that the task moves.
5. Refresh the browser.
6. Return to the Board if redirected.

### Expected Result

The updated task status and position should remain saved after refresh.

### Actual Result

The Board returns to its previous or default state, and the task movement is
not retained.

---

## BUG-005 — Team Member Project Dropdown Is Empty

| Field | Details |
|---|---|
| Module | Prompt Builder |
| Role | Team Member |
| Severity | High |
| Priority | High |
| Status | Open |

### Preconditions

- The user is logged in as a Team Member.
- Projects exist in the system.

### Steps to Reproduce

1. Open the Prompt Builder.
2. Click the Project dropdown.

### Expected Result

Projects available to the Team Member should appear in the dropdown.

### Actual Result

The Project dropdown is empty.

---

## BUG-006 — Team Member Cannot Generate a Prompt

| Field | Details |
|---|---|
| Module | Prompt Builder |
| Role | Team Member |
| Severity | High |
| Priority | High |
| Status | Open |

### Preconditions

- The user is logged in as a Team Member.
- The Prompt Builder is open.

### Steps to Reproduce

1. Select a Prompt Type.
2. Enter the required information.
3. Attempt to select a Project.
4. Click Generate Prompt.

### Expected Result

The Team Member should be able to select a Project and generate a prompt.

### Actual Result

Prompt generation cannot continue because the required Project dropdown does
not contain any projects.

### Related Bug

- BUG-005 — Team Member Project Dropdown Is Empty.

---

## BUG-007 — Admin Profile Icon Does Not Open a Menu

| Field | Details |
|---|---|
| Module | Dashboard |
| Role | Admin |
| Severity | Low |
| Priority | Low |
| Status | Open |

### Steps to Reproduce

1. Log in as Admin.
2. Open the Dashboard.
3. Click the Profile icon.

### Expected Result

A profile or account menu should open.

### Actual Result

Nothing happens when the Profile icon is clicked.

---

## BUG-008 — Manager Profile Icon Does Not Open a Menu

| Field | Details |
|---|---|
| Module | Dashboard |
| Role | Manager |
| Severity | Low |
| Priority | Low |
| Status | Open |

### Steps to Reproduce

1. Log in as Manager.
2. Open the Dashboard.
3. Click the Profile icon.

### Expected Result

A profile or account menu should open.

### Actual Result

Nothing happens when the Profile icon is clicked.

---

# 3. Open Bug Summary

| Bug ID | Module | Role | Severity | Status |
|---|---|---|---|---|
| BUG-001 | Authentication | All Roles | Low | Open |
| BUG-002 | Dashboard | Team Member | Medium | Open |
| BUG-003 | Dashboard | Team Member | Low | Open |
| BUG-004 | Board | Team Member | Medium | Open |
| BUG-005 | Prompt Builder | Team Member | High | Open |
| BUG-006 | Prompt Builder | Team Member | High | Open |
| BUG-007 | Dashboard | Admin | Low | Open |
| BUG-008 | Dashboard | Manager | Low | Open |

## Severity Summary

| Severity | Count |
|---|---:|
| Critical | 0 |
| High | 2 |
| Medium | 2 |
| Low | 4 |
| **Total** | **8** |

---

# 4. Resolved Issues

## RESOLVED-001 — Dashboard Search Was Non-Functional

**Status:** Verified Fixed

Dashboard Search now accepts input and works correctly.

---

## RESOLVED-002 — Notification Bell Was Non-Functional

**Status:** Verified Fixed

The Notification Bell now responds correctly.

---

## RESOLVED-003 — Create Task Button Was Non-Functional

**Status:** Verified Fixed

The Create Task form opens correctly when the application is served through a
local HTTP server.

### Correct Run Method

```bash
python -m http.server 8000