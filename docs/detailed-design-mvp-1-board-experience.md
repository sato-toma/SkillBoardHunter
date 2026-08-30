# Detailed Design: MVP-1 Board Experience

## Status

Draft

## Phase status

| Phase | Status |
| --- | --- |
| Plan | Complete |
| Change scope | Complete |
| Detailed design | Provisional |
| Implementation | Partial |
| Unit test | In progress |
| Functional test | Not started |

## Goal

Help the user understand their current growth path and choose the next skill to work on.

## Current product decision

The board has two different jobs:

- Map: exploration and direct editing of connections.
- Focus: local inspection around one node.
- Node edit page: small edit flow for fields such as name and status.

This is the current model, and it is intentionally simpler than the earlier Node-only design.

## User experience

### Map

- Shows the full graph.
- Lets the user inspect the whole board.
- Lets the user edit connections directly while staying in the graph.
- Should feel like a planning surface, not a detail editor.

### Focus

- Shows only the current node and its direct neighbors.
- Parent side = goal-side context.
- Child side = skill-side context.
- No breadcrumb/history. The user picks a new node directly.
- Intended for local understanding of the current path, not for deep graph management.

### Node edit page

- Used for small field edits such as name and status.
- Opened explicitly from the selected node panel.
- Not used for graph relationships.

## Scope

### In scope

- Multiple skills and goals visible in the same board
- Direct relationship edits in Map
- Local view of a node and its nearby connections in Focus
- Small node edits for basic metadata
- Local persistence and existing board behavior

### Out of scope

- Full unified Node model migration
- Automatic graph classification
- Complex pathfinding
- Sharing, multi-user sync, and server features
- Final metadata design for evidence, vision, and advanced goal fields

## Decisions

- Map remains the main exploration surface.
- Focus is a separate local inspection view.
- Relationship editing stays in Map, not in Focus.
- The Node edit page is only for small field updates, not graph structure.
- The current board still uses the existing Skill/Goal model for now.

## Key constraints

- The user still does not know whether Focus is a lasting feature or only a test.
- The board should feel easy to read before it becomes fully graph-heavy.
- The interface should not overload the user with too many modes or navigation steps.

## Open questions

- Is the board still conceptually a graph, or should it be framed more as a path map?
- Should Focus eventually support editing too, or stay read-only?
- What is the final naming for the layer/context concept?
- When the unified Node model arrives, how do existing Skill and Goal records migrate?

## Validation

The current design is considered valid only if:

- Map feels like the place to make direction decisions.
- Focus feels like a local look around the current node.
- Editing a node does not interrupt board reading.
- The user can tell the difference between exploring the graph and inspecting one local path.

## Implementation status

- Map behavior is implemented.
- Focus is implemented in a simplified form.
- Node edit page for basic fields is implemented.
- A full unified Node model is not yet implemented.
