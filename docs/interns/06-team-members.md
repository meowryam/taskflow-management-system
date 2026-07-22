# Module Documentation

## Intern
**Name:** Muhammad Haris

## Module
**Assigned Module:** Team Members

## GitHub Issue
**Issue Link:** https://github.com/meowryam/taskflow-management-system/issues/21

## Branch
**Branch Name:** `feature/team-members`

## Pull Request
**PR Link:** https://github.com/meowryam/taskflow-management-system/pull/24

## Files Modified
- `index.html`
- `src/modules/members.js`
- `src/modules/members-ui.js`
- `docs/interns/team-members.md`

## Responsibilities
- Build a Team Members module allowing team members to be added, listed, and deleted.
- Show a live count of tasks currently assigned to each member.
- Prevent deletion of a member who has active (non-Done) tasks assigned.
- Integrate into the existing sidebar/layout without modifying the application shell code written by Intern 1.

## Features Implemented
- Add member form: name, role, email.
- Auto-generated avatar initials from the member's name.
- Live assigned-task count per member, calculated from `DataStore.getTasks()` via `task.assignedUserId`.
- Delete member with a safety check: blocked with a warning if the member has active (non-Done) tasks.
- Validation: empty name rejected, invalid email format rejected, duplicate email rejected.
- Dedicated responsive card grid (`auto-fill, minmax(240px, 1fr)`) that wraps correctly regardless of member count.
- Self-contained navigation hook: the module finds the existing "Members" sidebar link itself and wires up its own view, rather than editing Intern 1's existing routing script.

## AI Tool Used
- Claude

## Prompting Techniques Used
- Role-based
- Context-rich
- Constraint-based
- Output-format specification
- Edge-case prompting

## Prompt Used
```text
Role: Act as a senior JavaScript mentor.

Task: Create a Team Members module for the TaskFlow Management System —
add member (name, role, email), display a live count of tasks assigned
to each member, and support deleting a member.

Context: The real index.html (sidebar/header shell built by another
intern) and the real dataStore.js were provided. dataStore.js exposes a
global DataStore object using LocalStorage, with getMembers(),
saveMembers(), getTasks(), etc. Members are shaped as
{ id, name, email, role, initials }. Tasks link to members via
task.assignedUserId. The Members nav link already exists in the sidebar
but has no handler yet.

Constraints: Plain JavaScript only, no external libraries. Logic must be
separate from DOM/UI rendering code. Must not modify the existing shell
code or the inline routing script already written by the Project Setup
intern. Must match the existing DataStore API exactly rather than
inventing a new storage pattern.

Output Format: Return the code first, split into a data-logic file and a
UI-rendering file, then a short explanation, then instructions for how
to manually test it.

Edge Cases: Empty name, invalid email format, duplicate email, deleting
a member with zero tasks vs. deleting a member with active (non-Done)
tasks — the latter must be blocked with a warning, not silently allowed.
```

## AI Mistake Found
- The first version reused the Dashboard's `.stat-card` / `.dashboard__stats-grid`
  CSS classes, which were designed for short stat-number content, not member
  cards with name + role + email + task count + a delete button. This caused
  the member cards to overflow horizontally off-screen.
- The Members view stayed visible after navigating to Dashboard or Prompt
  Builder, because those nav handlers were written before this module
  existed and had no way to know the Members section needed hiding.

## Manual Fix
- Replaced the borrowed CSS with a dedicated, scoped, auto-wrapping grid
  (`grid-template-columns: repeat(auto-fill, minmax(240px, 1fr))`) plus
  `min-width: 0` on flexible children to stop overflow.
- Added click listeners on the Dashboard and Prompt Builder nav links
  (in addition to, not replacing, Intern 1's existing listeners) that hide
  the Members section when the user navigates away from it.

## Testing Performed
- [x] Adding a member with a blank name is rejected
- [x] Adding a member with an invalid email format is rejected
- [x] Adding a member with a duplicate email is rejected
- [x] Adding a valid member succeeds and appears immediately with correct initials
- [x] Task count per member updates correctly based on `assignedUserId`
- [x] Deleting a member with active (non-Done) tasks is blocked with a warning
- [x] Deleting a member with only completed tasks (or none) succeeds
- [x] Member cards wrap correctly and do not overflow horizontally
- [x] Members section hides correctly when navigating to Dashboard
- [x] Members section hides correctly when navigating to Prompt Builder

## Screenshots

### Team Members Interface
![Team Members Interface](../screenshots/team-members-default.png)

### Delete Blocked Warning
![Delete Blocked Warning](../screenshots/team-members-delete-warning.png)

## Notes
- The module uses plain JavaScript only — no external libraries, no framework.
- Logic (`members.js`) is kept fully separate from rendering (`members-ui.js`)
  per the assignment's constraint-based prompting requirement.
- The module does not modify the existing application shell or routing
  script; it self-registers into the existing "Members" sidebar link.