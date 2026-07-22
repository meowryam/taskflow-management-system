# Bug Report

## Bug 1

### Title
Projects page does not open

### Module
Projects

### Severity
High

### Priority
High

### Steps to Reproduce
1. Open TaskFlow.
2. Click **Projects** from the left navigation menu.

### Expected Result
The Projects page should open and display project management options.

### Actual Result
Nothing happens when the Projects menu is clicked.

### Status
Open

---

## Bug 2

### Title
Tasks page does not open

### Module
Tasks

### Severity
High

### Priority
High

### Steps to Reproduce
1. Open TaskFlow.
2. Click **Tasks**.

### Expected Result
The Tasks page should load.

### Actual Result
Nothing happens.

### Status
Open

---

## Bug 3

### Title
Board page does not open

### Module
Board

### Severity
High

### Priority
High

### Steps to Reproduce
1. Open TaskFlow.
2. Click **Board**.

### Expected Result
The Kanban board should load.

### Actual Result
Nothing happens.

### Status
Open

---

## Bug 4

### Title
Members page does not open

### Module
Members

### Severity
High

### Priority
High

### Steps to Reproduce
1. Open TaskFlow.
2. Click **Members**.

### Expected Result
Members page should load.

### Actual Result
Nothing happens.

### Status
Open

---

## Bug 5

### Title
Reports page does not open

### Module
Reports

### Severity
High

### Priority
High

### Steps to Reproduce
1. Open TaskFlow.
2. Click **Reports**.

### Expected Result
Reports page should load.

### Actual Result
Nothing happens.

### Status
Open

---

## Bug 6

### Title
Activity Log page does not open

### Module
Activity Log

### Severity
High

### Priority
High

### Steps to Reproduce
1. Open TaskFlow.
2. Click **Activity Log**.

### Expected Result
Activity Log page should load.

### Actual Result
Nothing happens.

### Status
Open

---

## Bug 7

### Title
Prompt Builder only partially saves data after page refresh

### Module
Prompt Builder

### Severity
Medium

### Priority
Medium

### Steps to Reproduce
1. Open Prompt Builder.
2. Select **Documentation** as Prompt Type.
3. Enter a Project Name.
4. Enter a Main Task.
5. Generate a prompt.
6. Refresh the page.
7. Return to Prompt Builder.

### Expected Result
All entered information and generated prompt should remain after refresh.

### Actual Result
Only the selected Prompt Type remained. Project Name, Main Task and generated prompt were cleared.

### Status
Open

---

## Observation (Not a Bug)

### Title
Required field validation works correctly

### Observation
When Prompt Type, Project / Module Name and Main Task are left empty, the application correctly displays validation messages and prevents prompt generation.

### Result
Pass

---

## Observation (Expected Behaviour)

### Title
Optional fields accept free-form text

### Observation
Technology Stack, Context, Constraints and Edge Cases fields accept letters, numbers and special characters.

### Result
Expected behaviour because these fields are optional.

---

## Suggested Enhancement

### Title
Improve validation for optional fields

### Suggestion
Although optional fields do not require validation, the application could improve usability by:

- Adding maximum character limits.
- Trimming unnecessary whitespace.
- Displaying example placeholder text.
- Warning users when meaningless input (for example random characters) is entered.

### Priority
Low

### Type
Enhancement