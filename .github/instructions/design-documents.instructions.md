---
description: "Use when creating or updating detailed design documents, ADRs, implementation plans, test plans, or technical issue records."
applyTo: "docs/**/*.md"
---

# Design Documentation Guidelines

- Separate confirmed requirements, assumptions, open questions, and decisions.
- Do not turn an assumption into a requirement without user confirmation.
- A detailed design must describe implementation structure, data flow, persistence impact, error handling, platform differences, acceptance criteria, and test strategy.
- For each acceptance criterion, include at least one observable verification method.
- Record alternatives and trade-offs when choosing a framework, storage model, API boundary, or test approach.
- Keep ADRs focused on one decision and explain why rejected alternatives were not selected.
- Add unresolved technical matters to `docs/technical-issues.md` rather than hiding them in prose.
