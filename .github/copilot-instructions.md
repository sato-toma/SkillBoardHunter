# SkillBoard Hunter Project Guidelines

## Project Direction

- Follow the product direction in `docs/development-plan.md`.
- Keep the Local First and User Owned Data principles intact.
- Implement the smallest useful MVP slice before adding graph, goal, sharing, or server features.
- Record significant technology and architecture decisions in `docs/decisions/` using ADR format.
- Follow the phase gates in `docs/development-workflow.md`: Plan, Change Scope, Detailed Design, Implementation, Unit Test, and Functional Test.

## Before Implementation

- Read the relevant design document, ADRs, and existing code before editing.
- Complete the Plan, Change Scope, and Detailed Design phases before writing production code.
- If a requirement, behavior, data shape, platform constraint, or acceptance condition is unclear, ask the user before implementing it.
- Do not silently choose product behavior when multiple interpretations are plausible. Record the answer in the relevant design document.
- State a falsifiable implementation hypothesis and a focused validation check before making a non-trivial change.

## Design and Testing

- For a feature, create or update a detailed design document using `docs/detailed-design-template.md` before implementation when the behavior crosses a module boundary or changes persisted data.
- Describe implementation boundaries, data flow, error handling, platform differences, acceptance criteria, and test cases.
- Add focused tests for new behavior. Prefer domain tests for business rules and component tests for user-visible behavior.
- Keep Implementation, Unit Test, and Functional Test as separate phases and report them separately.
- Add focused unit tests for domain rules, state transitions, serialization, and adapters. Use component or integration tests for user-visible flows.
- Do not treat passing unit tests as completion; verify every acceptance criterion in the Functional Test phase.
- Run the narrowest relevant test or typecheck immediately after an edit, then broaden validation only as needed.
- Do not claim a behavior is verified unless an executable check was run or the limitation is stated.

## Architecture Boundaries

- Keep domain logic independent from browser APIs and Capacitor APIs.
- Access local persistence through an adapter or repository boundary.
- Keep React components focused on presentation and user interaction; put state transitions and business rules in testable modules.
- Preserve the existing technology decision in `docs/decisions/0001-technology-stack.md` unless a new ADR supersedes it.

## Handoff and Technical Issues

- Record unresolved technical questions, failed approaches, environment constraints, and follow-up work in `docs/technical-issues.md`.
- Each issue must include context, impact, current status, next action, and the date or task that should revisit it.
- At the end of a task, summarize changed files, validation performed, remaining risks, and open questions.

## Editing Rules

- Keep changes focused and preserve unrelated user changes.
- Prefer existing project patterns over new abstractions.
- Avoid adding comments unless they explain non-obvious behavior.
- Do not commit or create branches unless explicitly requested.
