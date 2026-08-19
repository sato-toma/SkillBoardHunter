---
name: development-workflow
description: "Run the complete SkillBoard Hunter development workflow through Plan, Change Scope, Detailed Design, Implementation, Unit Test, and Functional Test. Use when taking a feature from an idea to verified behavior with phase gates and handoff records."
argument-hint: "Describe the feature to take through the development phases"
user-invocable: true
---

# Development Workflow

Use this Skill to coordinate the complete workflow. Delegate detailed planning to `.github/skills/detailed-design/SKILL.md` when needed, but keep each phase separate in the report and in the work.

## Procedure

1. Read `docs/development-workflow.md`, `docs/development-plan.md`, relevant ADRs, nearby code, and existing tests.
2. Run the Plan phase and record user value, priority, scope, exclusions, initial acceptance criteria, and open questions.
3. Stop and ask the user about any unresolved product, data, platform, error, or acceptance behavior.
4. Run Change Scope and record affected files, module boundaries, persistence impact, platform differences, compatibility risks, and technical issues.
5. Run Detailed Design using `docs/detailed-design-template.md`. Do not write production code until the design gate is satisfied.
6. Record architecture alternatives and trade-offs in the design document. Add an ADR when the decision changes the technology or architecture.
7. Run Implementation according to the approved design. Record any design deviation and its reason.
8. Immediately run the narrowest available typecheck, lint, build, or focused executable check after implementation.
9. Run Unit Test for domain logic, state transitions, serialization, adapters, invalid input, and error handling.
10. Run Functional Test for the user flow, acceptance criteria, UI behavior, persistence/reload behavior, and relevant platform boundaries.
11. Record failed checks, unverified risks, environment constraints, and follow-up actions in `docs/technical-issues.md`.
12. Report each phase separately with its status, evidence, remaining risks, and open questions.

## Phase Gates

- Do not move from Plan to Change Scope until scope and initial acceptance criteria are explicit.
- Do not move from Change Scope to Detailed Design until affected boundaries and risks are known.
- Do not move from Detailed Design to Implementation while product behavior or persisted data is ambiguous.
- Do not move from Implementation to Unit Test without a focused executable validation after the edit.
- Do not treat passing Unit Test as completion; Functional Test must verify every acceptance criterion.
- Do not claim completion when a required phase is skipped. State the limitation and record the follow-up.

## Completion Summary

Report:

- Plan status and scope
- Change Scope status and affected areas
- Detailed Design document and decisions
- Implementation files and deviations
- Unit Test commands and results
- Functional Test steps, environment, and results
- Technical issues, residual risks, and open questions
