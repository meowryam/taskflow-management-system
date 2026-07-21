# Module Documentation

## Intern
**Name:** Hassaan Ahmed

## Module
**Assigned Module:** Prompt Builder and Responsible AI

## GitHub Issue
**Issue Link:** https://github.com/meowryam/taskflow-management-system/issues/7

## Branch
**Branch Name:** `feat/prompt-builder`

## Pull Request
**PR Link:** TBD

## Files Modified
- `index.html`
- `src/styles/style.css`
- `src/modules/promptBuilder.js`
- `tests/manual-test-cases.md`
- `interns/prompt-builder.md`

## Responsibilities
- Build a Prompt Builder using HTML, CSS, and vanilla JavaScript.
- Generate structured prompts for six software engineering categories.
- Add validation, copy, reset, responsive design, and Responsible AI guidance.
- Store only the last selected prompt type in LocalStorage.

## Features Implemented
- Six prompt types:
  - Project Breakdown
  - Task Description
  - Acceptance Criteria
  - Code Review
  - Test Cases
  - Documentation
- Generated prompts include Role, Context, Task, Constraints, Expected Output Format, and Edge Cases.
- Required-field validation.
- Automatic roles and output formats.
- Copy Prompt and Clear / Reset buttons.
- Responsive layout.
- Responsible AI guidance.
- LocalStorage persistence for the selected prompt type.

## AI Tool Used
- DeepSeek through the OpenCode CLI agent

## Prompting Techniques Used
- Role-based
- Context-rich
- Constraint-based
- Output-format specification
- Edge-case prompting

## Prompt Used
```text
Act as a senior frontend engineer working on an existing project called
TaskFlow Management System.

Before writing code:
1. Inspect the existing repository structure and coding style.
2. Do not overwrite or break modules created by other developers.
3. Identify the minimum files that need to be added or modified.
4. Provide a short implementation plan first.

Build a complete Prompt Builder module using only HTML, CSS, and vanilla
JavaScript.

The Prompt Builder must allow users to generate professional prompts for
the following categories:

1. Project Breakdown
2. Task Description
3. Acceptance Criteria
4. Code Review
5. Test Cases
6. Documentation

The user interface must contain:

- Prompt type dropdown
- Project or module name input
- Technology stack input
- Context textarea
- Main task textarea
- Constraints textarea
- Expected output format field
- Edge cases textarea
- Generate Prompt button
- Copy Prompt button
- Clear or Reset button
- Generated prompt output area
- Form validation messages

Every generated prompt must contain the following clearly labelled
sections:

- Role
- Context
- Task
- Constraints
- Expected Output Format
- Edge Cases

Create suitable default roles for each prompt type:

- Project Breakdown: Senior Software Architect
- Task Description: Senior Project Manager
- Acceptance Criteria: Senior Business Analyst
- Code Review: Senior Software Engineer
- Test Cases: Senior QA Engineer
- Documentation: Senior Technical Writer

Functional requirements:

- Do not generate a prompt when required fields are empty.
- Show clear validation messages.
- Update the suggested output format when the prompt type changes.
- Trim unnecessary whitespace.
- Copy the generated prompt to the clipboard.
- Show a success message after copying.
- Reset all fields correctly.
- Make the interface responsive.
- Use accessible labels and semantic HTML.
- Keep prompt-generation logic separate from DOM and UI logic.
- Use clear function and variable names.
- Add comments only where useful.

Add a visible Responsible AI guidance section containing these rules:

- Never share passwords, API keys, credentials, or private company
  information with AI tools.
- Never commit .env files or secret values.
- Do not blindly trust AI-generated code.
- Manually review and test all AI-generated output.
- Do not use AI to create fake commits, reviews, reports, or evidence.
- Developers must understand and explain all submitted code.
- AI may assist with planning, debugging, testing, refactoring, and
  documentation but must not replace human verification.

Do not use:

- An AI API
- A backend server
- A database
- External libraries
- Frameworks
- API keys or secrets

Store only the last selected prompt type in LocalStorage.
Do not store user-entered prompt content or sensitive information.

Keep the implementation simple, beginner-friendly, maintainable, and easy
to explain.
```

## AI Mistake Found
- No functional mistake was found after reviewing and testing the generated implementation.

## Manual Fix
- No corrective fix was required.
- The code, DOM references, validation, prompt generation, LocalStorage, copy, reset, and responsive behavior were manually verified.

## Testing Performed
- [x] All six prompt types generate correctly
- [x] All six required prompt sections are included
- [x] Empty and whitespace-only required fields are rejected
- [x] Optional fields use fallback values
- [x] Prompt type updates the role and output format
- [x] Copy Prompt works
- [x] Clear / Reset works
- [x] Selected prompt type remains after refresh
- [x] No user-entered prompt content is stored
- [x] Responsive layout works on mobile
- [x] Responsible AI section is visible

## Screenshots

### Prompt Builder Interface
![Prompt Builder Interface](../screenshots/prompt-builder-default.png)

### Generated Prompt
![Generated Prompt](../screenshots/prompt-builder-generated.png)

## Notes
- The module uses HTML, CSS, and vanilla JavaScript only.
- No API, backend, database, framework, or external library is used.
- Only `promptBuilderLastType` is stored in LocalStorage.
- Detailed test cases are available in `tests/manual-test-cases.md`.