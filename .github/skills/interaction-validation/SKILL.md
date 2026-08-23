---
name: interaction-validation
description: "Use before implementing or changing user-facing interactions when the operation model is unclear, especially for graphs, trees, dependency boards, skill trees, progress systems, drag-and-drop, linking, unlocking, or multi-step editing. Validate operation feel with prototypes before production code."
---

# Interaction Validation

Use this workflow before writing production code for an interaction whose operation model has not been confirmed.

## Required Process

1. Identify the user's actual actions, not only the desired appearance.
   - How does the user select an item?
   - How do they create, remove, or change a relationship?
   - How do they see prerequisites and impact?
   - How do they change progress or unlock an item?
2. Prepare at least two small, runnable interaction prototypes using the existing app or a disposable prototype surface.
   - Example: a Git-tree flow where the user expands nodes and edits parent links.
   - Example: a skill-board flow where the user selects, connects, and unlocks nodes.
3. Ask the user to try both prototypes. Ask about the operation sequence, discoverability, feedback, undo/recovery, and whether the result matches their mental model.
4. Record the result in the relevant design document:
   - Confirmed operation model
   - User actions and state transitions
   - Rejected alternatives and why
   - Acceptance criteria observable through interaction
5. Implement only the confirmed operation model.
6. Validate the implemented flow with an executable component or functional test covering the complete action sequence.

## Stop Conditions

Stop and ask the user before implementation when:

- The same requirement can be satisfied by different operation sequences.
- A graph, tree, dependency, unlock, or progress interaction has only been described visually.
- The user has not tried or approved the prototype interaction.
- The behavior for invalid links, blocked actions, undo, or deletion is unclear.

## Interaction Record Template

```md
### Interaction Validation: <feature>

- Prototype A:
- Prototype B:
- User-selected model:
- Core action sequence:
- Feedback after each action:
- Invalid or blocked action behavior:
- Undo or recovery behavior:
- Rejected alternatives:
- Verification method:
```

Do not treat screenshots or styling changes as interaction validation. The user must be able to perform the relevant operations.
