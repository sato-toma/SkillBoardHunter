# Detailed Design: MVP-1 Board Experience

## Status

Draft

## Phase status

| Phase | Status |
| --- | --- |
| Plan | Revised 2026-09-01 |
| Change scope | Needs update |
| Detailed design | Interaction confirmed 2026-09-01, write-up in progress |
| Implementation | Partial, discovery drilling not yet built |
| Unit test | In progress |
| Functional test | Not started |

## Goal

Help the user understand their current growth path and choose the next skill to work on.

## Current product decision (revised 2026-09-01)

The first version of this split did not match how the user actually wants to use the two views.
Roles are now reassigned:

- Map: discovery/search surface. Look across the whole board and find skills related to a
  chosen skill, one hop at a time in either direction. Direct editing of connections stays
  available here, but it is a secondary capability, not the main job.
- Focus: roadmap/path surface. Anchored on one current skill, shows the goal-side path above
  it and the skill-side path below it, framed as a local segment of the user's roadmap.
  Read-only.
- Node edit page: small edit flow for fields such as name and status. Unchanged.

The previous model (Map = editing surface, Focus = generic local inspection) is superseded.

## User experience

### Map (discovery/search)

- Shows the full graph today; the discovery interaction below replaces that with a lazy,
  expand-driven view once implemented (see Interaction Validation).
- Selecting a skill makes it the active skill and immediately shows its direct parent(s) and
  child(ren), the same as today's Focus default.
- "Expand toward Goals" / "Expand toward Detail" reveal one more hop at a time, in either
  direction, cumulatively (earlier hops stay visible).
- Nodes that share a parent/child with an already-revealed node (siblings) are shown
  automatically alongside the path, styled distinctly (dashed/outline), without extending the
  reveal further out on their own.
- Only revealed nodes are laid out and rendered; the rest of the board is not computed. This is
  what keeps the view usable as the board grows.
- Clicking any revealed node makes it the new active skill and resets the reveal to its
  immediate neighborhood.
- The active skill's on-screen position stays stable; expanding must not make it jump.
- Editing connections directly stays available, but is secondary to the discovery job. See Open
  questions for the unresolved conflict with the existing click-to-link gesture.
- Should feel like the place to search out how things relate, not only a planning canvas.

### Focus (roadmap/path)

- Shows only the current node and its direct neighbors, anchored on one current skill (not a
  full end-to-end path to a Goal).
- Parent side = goal-side context (where this skill leads).
- Child side = skill-side context (what this skill was built on).
- No breadcrumb/history. The user picks a new node directly.
- Framing should read as "a segment of my roadmap around where I am now", not as generic search.
- Stays read-only: browse and jump only, no editing from this view.

### Node edit page

- Used for small field edits such as name and status.
- Opened explicitly from the selected node panel.
- Not used for graph relationships.

## Scope

### In scope

- Multiple skills and goals visible in the same board
- Hop-by-hop discovery/search drilling in Map, in both directions from a selected skill
- Direct relationship edits in Map (kept, secondary to discovery)
- Local roadmap/path framing of a node and its direct neighbors in Focus
- Small node edits for basic metadata
- Local persistence and existing board behavior

### Out of scope

- Full unified Node model migration
- Automatic graph classification
- Complex pathfinding or full end-to-end path computation to a Goal
- Sharing, multi-user sync, and server features
- Final metadata design for evidence, vision, and advanced goal fields

## Decisions

- Map is the discovery/search surface: find skills related to a chosen skill, drilling one hop
  at a time in either direction. Direct relationship editing stays in Map as a secondary
  capability.
- Focus is the roadmap/path surface: a read-only local segment of the path around one current
  skill (goal-side above, skill-side below). Not used for search across the whole board.
- The Node edit page is only for small field updates, not graph structure.
- The current board still uses the existing Skill/Goal model for now.

## Key constraints

- The exact interaction for hop-by-hop drilling in Map is not yet confirmed with the user and
  needs prototype validation before implementation (see Open questions and Next action).
- The board should feel easy to read before it becomes fully graph-heavy.
- The interface should not overload the user with too many modes or navigation steps.

## Open questions

- How does clicking a node to recenter the discovery view coexist with Map's existing
  click-to-select / click-to-connect editing gesture? Both currently want to react to a plain
  node click. Needs a decision (for example: separate edit-mode toggle, a distinct control to
  start linking, or a modifier/long-press) before implementation.
- What is the final naming for the layer/context concept (Map/Focus vs. other terms)?
- When the unified Node model arrives, how do existing Skill and Goal records migrate?

## Validation

The current design is considered valid only if:

- Map feels like the place to search out how a skill relates to the rest of the board.
- Focus feels like a local, read-only look at the roadmap around the current node.
- Editing a node does not interrupt board reading.
- The user can tell the difference between searching the graph (Map) and reading one local
  roadmap segment (Focus).

## Interaction Validation: Map discovery drilling

- Prototype A: highlight an expanding ego-network inside the full graph (all nodes pre-laid-out
  and dimmed by default).
- Prototype B: expanding local subgraph showing only discovered nodes; recentering cleared
  everything and started fresh.
- User-selected model: Prototype A's overall shape (keep a real graph with edges, cumulative
  reveal, siblings shown), refined through several rounds:
  - Only nodes actually revealed are laid out/rendered; nothing is pre-computed for the rest of
    the board (adopted from Prototype B's lazy-reveal idea, applied inside Prototype A's
    graph-with-edges visual style).
  - Siblings (nodes sharing a parent/child with a revealed node) are shown automatically,
    styled with a dashed/outline treatment, attached to the band of the node they branch from.
  - No dropdown/picker for choosing a starting skill; the view always has one active skill, and
    switching it happens by clicking a node (the same idea that would let Map set the active
    skill for this view).
  - The active skill's vertical screen position is kept stable: centered in view on first pick,
    and scroll is compensated on every expand so it never jumps.
- Core action sequence: pick/click a skill to make it active -> immediate parent(s)/child(ren)
  appear automatically -> press Expand toward Goals/Detail to reveal one more hop at a time,
  cumulatively -> click any revealed node (path or sibling) to make it the new active skill,
  which resets the reveal to its immediate neighborhood.
- Feedback after each action: newly revealed nodes and edges appear immediately; path nodes use
  a hop-based color gradient per direction; siblings use a dashed outline; the active skill node
  is visually distinct and does not move on screen.
- Invalid or blocked action behavior: not applicable yet, this interaction has no destructive or
  blocked actions (read-only discovery). Needs revisiting once combined with editing.
- Undo or recovery behavior: not applicable, discovery has no persisted state to undo.
- Rejected alternatives:
  - Static full-graph-always-visible layout (original Prototype A): rejected, does not scale to
    a board with many more skills.
  - Prototype B's "clear everything on recenter, no persistent graph shape": rejected, loses
    the sense of the wider graph while searching.
  - Dropdown-based "choose a different start": rejected, does not match the mental model of an
    always-present active skill that Map itself should be able to set.
- Verification method: manual interaction test using
  `prototypes/map-discovery-drilling/prototype-a-highlight-in-graph.html`. Production
  implementation needs a component/functional test covering: pick active skill -> immediate
  neighbors shown -> expand up/down -> siblings appear -> recenter on a revealed node -> active
  skill position stable across expands.

## Implementation status

- Map currently implements the full-graph view and direct editing, but not hop-by-hop discovery
  drilling. This is new work, pending interaction-validation prototypes.
- Focus currently implements the local neighbor view; it needs to be reframed as a roadmap
  segment (wording/framing change) but its read-only, single-hop behavior already matches the
  confirmed model.
- Node edit page for basic fields is implemented.
- A full unified Node model is not yet implemented.
