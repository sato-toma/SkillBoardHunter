---
name: detailed-design
description: "Create or review the Plan, Change Scope, and Detailed Design phases for SkillBoard Hunter features. Use for requirements clarification, persistence changes, platform behavior, acceptance criteria, test strategy, and technical trade-offs before implementation."
argument-hint: "Describe the feature or design decision to work on"
user-invocable: true
---

# Plan and Detailed Design Workflow

Use this workflow for the Plan, Change Scope, and Detailed Design phases. Do not implement production code or claim that unit or functional testing is complete in this Skill.

## Procedure

1. Read `docs/development-plan.md`, `docs/development-workflow.md`, relevant ADRs, nearby code, and existing tests.
2. Complete the Plan phase: define user value, scope, priority, and initial acceptance criteria.
3. Complete the Change Scope phase: identify affected files, modules, persisted data, platform differences, and risks.
4. Extract confirmed requirements and list assumptions separately.
5. Identify every question that can change user-visible behavior, persisted data, platform support, or acceptance criteria.
6. For unclear user interactions, prepare and validate at least two runnable operation prototypes before implementation. Ask the user to try them and record the selected operation model and rejected alternatives.
7. Ask the user those questions before implementation. Do not fill in product decisions silently.
8. Complete the Detailed Design phase using `docs/detailed-design-template.md`.
9. Define acceptance criteria that can be checked from the user's perspective.
10. Define module boundaries and data flow. Keep domain logic independent from browser and Capacitor APIs.
11. Define separate Unit Test and Functional Test plans, including invalid input, empty state, persistence failure, and reload behavior when relevant.
12. Record rejected alternatives and trade-offs. Create or update an ADR when the decision affects the architecture or technology stack.
13. Record unresolved risks or environment constraints in `docs/technical-issues.md` with a next action and revisit condition.

## Required Stop Conditions

Pause and ask the user when any of these are unresolved:

- The expected behavior has more than one plausible interpretation.
- The data model or file format is not specified enough to preserve user data safely.
- Platform behavior differs between Web, Android, and iOS and the desired behavior is unknown.
- An error, empty, loading, or recovery behavior is user-visible but unspecified.
- A test cannot be written because the acceptance condition is not observable.
- The user has not approved a phase boundary that changes scope, persisted data, or platform behavior.
- The user has not tried or approved a prototype when the operation model is unclear.

## Completion Summary

Report:

- Design files changed
- Questions resolved or still open
- Design validation performed
- Phase status for Plan, Change Scope, and Detailed Design
- Remaining technical issues and their revisit conditions
