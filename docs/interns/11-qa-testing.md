# Intern 11 – QA & Manual Testing Report

## Name

Inshrah Mumtaz

---

# Module

QA & Manual Testing

---

# Objective

My responsibility was to manually verify the functionality of the TaskFlow Management System, identify defects, document bugs, and prepare testing documentation for the project.

---

# Tasks Completed

- Created manual test cases.
- Performed manual testing on the application.
- Created a bug report.
- Tested required field validation.
- Tested empty input scenarios.
- Tested Prompt Builder functionality.
- Tested LocalStorage persistence.
- Captured application screenshots.
- Documented testing results.

---

# Testing Performed

## Dashboard

Verified that the dashboard loads correctly and displays the summary information.

Status:
- Passed

---

## Navigation Testing

Tested navigation links including:

- Dashboard
- Projects
- Tasks
- Board
- Members
- Reports
- Activity Log

Some navigation items were not functioning correctly and were recorded as bugs.

---

## Prompt Builder Testing

Verified:

- Required field validation
- Prompt generation
- Documentation prompt generation
- Error messages
- Empty field validation

Status:
- Passed

---

## LocalStorage Testing

Verified whether Prompt Builder data remained after refreshing the page.

Observed:

- Prompt Type remained selected.
- Other entered values were cleared.

This issue was documented in the bug report.

Status:
- Failed

---

## Manual Test Documentation

Prepared:

- tests/manual-test-cases.md

The document includes:

- Validation tests
- Prompt generation tests
- LocalStorage tests
- Responsive layout checks
- Accessibility checklist

---

## Bug Report

Prepared:

- tests/bug-report.md

Documented issues included:

- Navigation pages not opening correctly.
- Partial LocalStorage persistence.
- Other issues identified during manual verification.

---

## Screenshots

Captured screenshots for:

- Dashboard
- Prompt Builder
- Bug evidence

Stored inside:

docs/screenshots/

---

# Challenges

The biggest issue encountered during testing was that some application pages were inaccessible and LocalStorage only partially restored Prompt Builder data after refresh.

---

# AI Tools Used

- ChatGPT
- VS Code AI tools

---

# Prompting Techniques Used

- Role-based prompting
- Context-rich prompting
- Step-by-step prompting

---

# AI Assistance

AI was used to:

- Generate testing ideas.
- Improve manual test case structure.
- Draft bug report documentation.
- Explain Git workflow.

All generated content was manually reviewed before submission.

---

# Manual Verification

All documented observations were manually verified while testing the application.

---

# Conclusion

The QA process successfully identified validation behavior, documented existing bugs, prepared manual testing documentation, and provided evidence through screenshots. The testing artifacts are ready for project review and integration.