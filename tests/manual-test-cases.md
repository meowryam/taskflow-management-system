# TaskFlow Management System — Manual Test Cases

## 1. Test Information

| Field | Details |
|---|---|
| Project | TaskFlow Management System |
| Tester | Intern 11 — QA & Manual Testing |
| Group | Beta |
| Testing Type | Manual Functional Testing and Regression Testing |
| Roles Tested | Team Member, Admin, and Manager |
| Environment | Windows, Google Chrome |
| Application URL | `http://localhost:8000` |
| Server Command | `python -m http.server 8000` |
| Test Date | July 23, 2026 |

> The application was tested through a local HTTP server. Opening `index.html`
> directly through a `file://` URL may prevent JavaScript modules and features
> such as Create Task from working correctly.

---

# 2. Authentication Test Cases

| Test ID | Role | Test Scenario | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|
| AUTH-001 | All Roles | Open the Login page | Login page should load correctly | Login page loaded correctly | PASS |
| AUTH-002 | All Roles | Login with valid credentials | User should log in and reach the correct dashboard | Login completed successfully | PASS |
| AUTH-003 | All Roles | Login with incorrect credentials | Appropriate error message should appear | Error message displayed | PASS |
| AUTH-004 | All Roles | Submit Login form with empty fields | Required-field validation should appear | Required validation displayed | PASS |
| AUTH-005 | All Roles | Enter an invalid email or username | Invalid input should be rejected | Validation message displayed | PASS |
| AUTH-006 | All Roles | Toggle password visibility | Password should switch between hidden and visible | Visibility toggle worked correctly | PASS |
| AUTH-007 | All Roles | Open Forgot Password | Forgot Password page or form should open | Forgot Password opened correctly | PASS |
| AUTH-008 | All Roles | Open Create Account page | Signup page should open | Signup page opened correctly | PASS |
| AUTH-009 | All Roles | Submit invalid Signup information | Relevant validation messages should appear | Validation worked correctly | PASS |
| AUTH-010 | All Roles | Create an account with valid information | Account should be created successfully | Account creation worked | PASS |
| AUTH-011 | All Roles | Click Google Login | Google authentication should start | Google Login is not implemented | FAIL |

---

# 3. Team Member Dashboard Test Cases

| Test ID | Test Scenario | Expected Result | Actual Result | Status |
|---|---|---|---|---|
| TM-DASH-001 | Open Team Member Dashboard | Dashboard should load successfully | Dashboard loaded successfully | PASS |
| TM-DASH-002 | Verify dashboard cards and statistics | Cards and statistics should display correctly | Dashboard information displayed correctly | PASS |
| TM-DASH-003 | Use Dashboard search | Search should accept input and return relevant results | Search worked correctly | PASS |
| TM-DASH-004 | Click Notification Bell | Notification panel should respond | Notification Bell worked correctly | PASS |
| TM-DASH-005 | Use sidebar navigation | Selected modules should open correctly | Navigation worked correctly | PASS |
| TM-DASH-006 | Open Activity Log from the dashboard | Activity Log page should open | Activity Log opened correctly | PASS |
| TM-DASH-007 | Verify the displayed Team Member role | Team Member name and role should be displayed | Admin User/Administrator information is displayed | FAIL |
| TM-DASH-008 | Click the Profile icon | Profile or account menu should open | Nothing happens | FAIL |

---

# 4. Team Member Tasks Test Cases

| Test ID | Test Scenario | Expected Result | Actual Result | Status |
|---|---|---|---|---|
| TM-TASK-001 | Open Tasks page | Tasks page should open correctly | Tasks page opened | PASS |
| TM-TASK-002 | Verify Tasks search and filter controls | Controls should be displayed and usable | Controls displayed correctly | PASS |
| TM-TASK-003 | Search for an existing task | Matching task should appear | Search worked when task data was available | PASS |
| TM-TASK-004 | Apply Task filters | Task list should update based on the filter | Filters worked correctly | PASS |

---

# 5. Team Member Board Test Cases

| Test ID | Test Scenario | Expected Result | Actual Result | Status |
|---|---|---|---|---|
| TM-BOARD-001 | Open Board page | Board should open correctly | Board opened correctly | PASS |
| TM-BOARD-002 | Search for an existing task | Matching task should appear | Board search worked | PASS |
| TM-BOARD-003 | Filter Board by project | Only tasks for the selected project should appear | Project filter worked | PASS |
| TM-BOARD-004 | Filter Board by priority | Only matching priority tasks should appear | Priority filter worked | PASS |
| TM-BOARD-005 | Clear Board filters | All filters should reset | Filters reset correctly | PASS |
| TM-BOARD-006 | Change a task status using the status control | Task should move to the selected status | Status changed correctly | PASS |
| TM-BOARD-007 | Drag and drop a task | Task should move to the new column | Drag and drop worked | PASS |
| TM-BOARD-008 | Refresh after moving a task | Updated task position should remain saved | Task movement was not retained after refresh | FAIL |

---

# 6. Team Member Activity Log Test Cases

| Test ID | Test Scenario | Expected Result | Actual Result | Status |
|---|---|---|---|---|
| TM-LOG-001 | Open Activity Log | Activity Log should open correctly | Page opened correctly | PASS |
| TM-LOG-002 | Search Activity Log | Matching activity records should appear | Search worked correctly | PASS |
| TM-LOG-003 | Filter by Entity Type | Matching entities should appear | Entity Type filter worked | PASS |
| TM-LOG-004 | Filter by Action Type | Matching actions should appear | Action Type filter worked | PASS |
| TM-LOG-005 | Clear Activity Log filters | Original activity list should return | Filters cleared correctly | PASS |
| TM-LOG-006 | Clear the Activity Log | Confirmation should appear before clearing | Confirmation appeared and log cleared | PASS |

---

# 7. Team Member Prompt Builder Test Cases

| Test ID | Test Scenario | Expected Result | Actual Result | Status |
|---|---|---|---|---|
| TM-PROMPT-001 | Open Prompt Builder | Prompt Builder should open correctly | Page opened correctly | PASS |
| TM-PROMPT-002 | Select a Prompt Type | Selected type should be applied | Prompt Type selection worked | PASS |
| TM-PROMPT-003 | Open Project dropdown | Available projects should be listed | Project dropdown was empty | FAIL |
| TM-PROMPT-004 | Submit without required fields | Required-field validation should appear | Validation messages appeared | PASS |
| TM-PROMPT-005 | Generate a prompt | Prompt should be generated after valid input | Prompt could not be generated because no project was available | FAIL |
| TM-PROMPT-006 | Clear or reset the form | Entered information should be removed | Form cleared correctly | PASS |

---

# 8. Admin Dashboard Test Cases

| Test ID | Test Scenario | Expected Result | Actual Result | Status |
|---|---|---|---|---|
| AD-DASH-001 | Open Admin Dashboard | Dashboard should load correctly | Dashboard loaded correctly | PASS |
| AD-DASH-002 | Verify dashboard cards and charts | Dashboard information should display correctly | Cards and charts displayed correctly | PASS |
| AD-DASH-003 | Use Dashboard search | Relevant results should appear | Search worked correctly | PASS |
| AD-DASH-004 | Click Notification Bell | Notification panel should respond | Notification Bell worked correctly | PASS |
| AD-DASH-005 | Open Activity Log shortcut | Activity Log page should open | Activity Log opened correctly | PASS |
| AD-DASH-006 | Use sidebar navigation | Admin modules should open correctly | Navigation worked correctly | PASS |
| AD-DASH-007 | Click Profile icon | Profile or account menu should open | Nothing happens | FAIL |

---

# 9. Admin Projects Test Cases

| Test ID | Test Scenario | Expected Result | Actual Result | Status |
|---|---|---|---|---|
| AD-PROJ-001 | Open Projects page | Projects page should open correctly | Page opened correctly | PASS |
| AD-PROJ-002 | Create a project with valid information | Project should be created | Project created successfully | PASS |
| AD-PROJ-003 | Submit Project form with missing fields | Validation messages should appear | Validation worked | PASS |
| AD-PROJ-004 | Edit an existing project | Project information should update | Project updated successfully | PASS |
| AD-PROJ-005 | Delete a project | Delete confirmation should appear | Confirmation appeared | PASS |
| AD-PROJ-006 | Confirm project deletion | Project should be removed | Project deleted successfully | PASS |
| AD-PROJ-007 | Cancel project deletion | Project should remain unchanged | Deletion was cancelled correctly | PASS |

---

# 10. Admin Tasks Test Cases

| Test ID | Test Scenario | Expected Result | Actual Result | Status |
|---|---|---|---|---|
| AD-TASK-001 | Open Tasks page | Tasks page should load correctly | Page loaded correctly | PASS |
| AD-TASK-002 | Click Create Task | Task creation form should open | Form opened correctly | PASS |
| AD-TASK-003 | Create a task with valid information | Task should be created | Task created successfully | PASS |
| AD-TASK-004 | Submit incomplete Task form | Required-field validation should appear | Validation worked correctly | PASS |
| AD-TASK-005 | Select a Task start date | Start date should be accepted | Start date worked correctly | PASS |
| AD-TASK-006 | Search for a task | Matching task should appear | Search worked correctly | PASS |
| AD-TASK-007 | Apply Task filters | Task list should update | Filters worked correctly | PASS |
| AD-TASK-008 | Edit an existing task | Updated task information should be saved | Task updated successfully | PASS |

---

# 11. Admin Members Test Cases

| Test ID | Test Scenario | Expected Result | Actual Result | Status |
|---|---|---|---|---|
| AD-MEM-001 | Open Members page | Members page should open correctly | Page opened correctly | PASS |
| AD-MEM-002 | View the Members list | Existing members should display | Members displayed correctly | PASS |
| AD-MEM-003 | Add a member | New member should be added | Member added successfully | PASS |
| AD-MEM-004 | Edit a member | Member details should update | Member updated successfully | PASS |
| AD-MEM-005 | Delete a member | Member should be removed | Member deleted successfully | PASS |

---

# 12. Admin Board Test Cases

| Test ID | Test Scenario | Expected Result | Actual Result | Status |
|---|---|---|---|---|
| AD-BOARD-001 | Open Board | Board should open correctly | Board opened correctly | PASS |
| AD-BOARD-002 | Search Board tasks | Matching task should appear | Search worked correctly | PASS |
| AD-BOARD-003 | Filter Board by project | Project-specific tasks should appear | Project filter worked | PASS |
| AD-BOARD-004 | Filter Board by priority | Matching priority tasks should appear | Priority filter worked | PASS |
| AD-BOARD-005 | Clear Board filters | All filters should reset | Filters reset correctly | PASS |
| AD-BOARD-006 | Change task status | Task should move to the selected status | Status updated correctly | PASS |
| AD-BOARD-007 | Drag and drop a task | Task should move between columns | Drag and drop worked | PASS |

---

# 13. Admin Activity Log Test Cases

| Test ID | Test Scenario | Expected Result | Actual Result | Status |
|---|---|---|---|---|
| AD-LOG-001 | Open Activity Log | Page should open correctly | Page opened correctly | PASS |
| AD-LOG-002 | Search Activity Log | Matching records should appear | Search worked correctly | PASS |
| AD-LOG-003 | Filter by Entity Type | Matching entries should appear | Filter worked correctly | PASS |
| AD-LOG-004 | Filter by Action Type | Matching entries should appear | Filter worked correctly | PASS |
| AD-LOG-005 | Clear filters | Full activity list should return | Filters cleared correctly | PASS |
| AD-LOG-006 | Clear Activity Log | Confirmation should appear and records should clear | Feature worked correctly | PASS |

---

# 14. Admin Prompt Builder Test Cases

| Test ID | Test Scenario | Expected Result | Actual Result | Status |
|---|---|---|---|---|
| AD-PROMPT-001 | Open Prompt Builder | Page should open correctly | Page opened correctly | PASS |
| AD-PROMPT-002 | Select a Prompt Type | Selected type should be applied | Selection worked | PASS |
| AD-PROMPT-003 | Select a Project | Project should be selectable | Project selection worked | PASS |
| AD-PROMPT-004 | Enter Prompt Builder details | Form should accept valid information | Valid information was accepted | PASS |
| AD-PROMPT-005 | Generate a prompt | Prompt should be generated | Prompt generated successfully | PASS |
| AD-PROMPT-006 | Submit incomplete form | Required-field validation should appear | Validation worked correctly | PASS |
| AD-PROMPT-007 | Clear or reset the form | All fields should be cleared | Form cleared correctly | PASS |

---

# 15. Admin Reports Test Cases

| Test ID | Test Scenario | Expected Result | Actual Result | Status |
|---|---|---|---|---|
| AD-REPORT-001 | Open Reports page | Reports page should load correctly | Reports page loaded correctly | PASS |
| AD-REPORT-002 | Verify Executive Snapshot | Snapshot values should display correctly | Snapshot displayed correctly | PASS |
| AD-REPORT-003 | Verify Reports charts | All charts should render correctly | Charts rendered correctly | PASS |
| AD-REPORT-004 | Search Reports | Relevant report data should appear | Search worked correctly | PASS |
| AD-REPORT-005 | Search with unmatched text | Empty or no-results state should appear | Unmatched search handled correctly | PASS |
| AD-REPORT-006 | Filter Reports by Project | Project-specific information should appear | Project filter worked correctly | PASS |
| AD-REPORT-007 | Compare different Projects | Report data should change by project | Project-specific data displayed | PASS |
| AD-REPORT-008 | Filter Reports by Priority | Matching priority information should appear | Priority filter worked correctly | PASS |
| AD-REPORT-009 | Filter Reports by Status | Matching status information should appear | Status filter worked correctly | PASS |
| AD-REPORT-010 | Filter Reports by Member | Member-specific information should appear | Member filter worked correctly | PASS |
| AD-REPORT-011 | Apply multiple filters | Results should satisfy all selected filters | Combined filtering worked correctly | PASS |
| AD-REPORT-012 | Clear Reports filters | Default Reports information should return | Filters cleared correctly | PASS |
| AD-REPORT-013 | Export Reports as PDF | A PDF file should download | PDF exported successfully | PASS |
| AD-REPORT-014 | Open exported PDF | PDF should contain readable Reports information | Exported PDF was correct | PASS |
| AD-REPORT-015 | Export Reports as CSV | A CSV file should download | CSV exported successfully | PASS |
| AD-REPORT-016 | Open exported CSV | CSV should contain headers and report rows | Exported CSV was correct | PASS |
| AD-REPORT-017 | Print Reports | Browser print dialog should open | Print dialog opened | PASS |
| AD-REPORT-018 | Refresh Reports page | Reports should reload correctly | Page reloaded correctly | PASS |
| AD-REPORT-019 | Navigate away and return | Reports should reopen correctly | Navigation worked correctly | PASS |
| AD-REPORT-020 | Reduce browser width | Reports should remain readable | Layout remained usable | PASS |

---

# 16. Manager Role Test Cases

The Manager role was tested against the same major modules as the Admin role.

| Test ID | Module | Expected Result | Actual Result | Status |
|---|---|---|---|---|
| MGR-001 | Dashboard | Dashboard should work like the Admin Dashboard | Dashboard functions worked | PASS |
| MGR-002 | Projects | Project functions should work | Project functions worked | PASS |
| MGR-003 | Tasks | Task functions should work | Task functions worked | PASS |
| MGR-004 | Members | Member functions should work | Member functions worked | PASS |
| MGR-005 | Board | Board features should work | Board features worked | PASS |
| MGR-006 | Activity Log | Activity Log should work | Activity Log worked | PASS |
| MGR-007 | Prompt Builder | Prompt Builder should work | Prompt Builder worked | PASS |
| MGR-008 | Reports | Reports features should work | Reports features worked | PASS |
| MGR-009 | Profile Icon | Profile menu should open | Nothing happens when clicked | FAIL |

---

# 17. Final Test Summary

| Testing Area | Passed | Failed | Total |
|---|---:|---:|---:|
| Authentication | 10 | 1 | 11 |
| Team Member Dashboard | 6 | 2 | 8 |
| Team Member Tasks | 4 | 0 | 4 |
| Team Member Board | 7 | 1 | 8 |
| Team Member Activity Log | 6 | 0 | 6 |
| Team Member Prompt Builder | 4 | 2 | 6 |
| Admin Dashboard | 6 | 1 | 7 |
| Admin Projects | 7 | 0 | 7 |
| Admin Tasks | 8 | 0 | 8 |
| Admin Members | 5 | 0 | 5 |
| Admin Board | 7 | 0 | 7 |
| Admin Activity Log | 6 | 0 | 6 |
| Admin Prompt Builder | 7 | 0 | 7 |
| Admin Reports | 20 | 0 | 20 |
| Manager | 8 | 1 | 9 |
| **Overall** | **111** | **8** | **119** |

---

# 18. Regression Testing Results

Regression testing was completed after pulling the latest changes from `main`.

The following previously reported issues were verified as resolved:

- Dashboard Search
- Notification Bell
- Create Task button
- Task creation
- Activity Log navigation label
- Reports Search
- Reports Project filter
- Reports Priority filter
- Reports Status filter
- Reports Member filter
- Reports PDF export
- Reports CSV export
- Reports Print functionality

The remaining failed scenarios are documented in `tests/bug-report.md`.