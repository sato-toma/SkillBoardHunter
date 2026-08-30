# Detailed Design: MVP-1 Board Experience

## Status

Draft

## Phase Status

| Phase | Status | Evidence or link |
| --- | --- | --- |
| Plan | Complete | User request 2026-08-21 |
| Change Scope | Complete | This document |
| Detailed Design | Provisional | Map vs Focus split, Focus simplification, and Node edit page scope confirmed 2026-08-30 (see interaction validation records); unified Node model relationship interaction still needs prototype validation |
| Implementation | Partial | Previous Skill/Goal vertical slice is implemented; Node edit page (name/status) and simplified Focus are implemented; shared Node model is not implemented |
| Unit Test | In progress | Existing Redux and domain tests pass; new Node tests are not started |
| Functional Test | Not started |  |

## Related Documents

- Development plan: `docs/development-plan.md`
- Development workflow: `docs/development-workflow.md`
- MVP-0 design: `docs/detailed-design-mvp-0.md`
- Deferred TOML design: `docs/detailed-design-mvp-1-toml-io.md`
- Technical issues: `docs/technical-issues.md`

## Goal

Represent the user's direction and capabilities as one connected board. `Skill` and `Goal` are views over the same Node graph rather than separate relationship systems.

## Scope

### In scope

- Display all Nodes in one Map
- Add Nodes from the Skills and Goals entry points
- Display parent and child relationships
- Open a Node edit page from the Map
- Add and remove parents and children from the Node edit page
- Select related Nodes through an Add parent/Add child dialog
- Use a display-oriented Node category without making it a different Node type
- Preserve existing Skill progression behavior where it remains compatible

### Out of scope

- TOML Import/Export
- Automatic semantic classification of Nodes
- Automatic calculation of a Node category from graph depth
- Complex path-finding algorithms
- Multi-user sharing
- i18n implementation
- Final XP, evidence, or Goal-specific metadata design

## Confirmed Requirements

- Skills and Goals can both add Nodes.
- Map displays Skill and Goal Nodes in the same graph.
- A Node can have multiple parents and multiple children.
- A Node can be both a parent and a child.
- Map is primarily an inspection surface.
- Map supports view operations such as zoom and pan without becoming an editing surface.
- Node relationship editing happens on the Node edit page.
- `Add parent` and `Add child` open a Node selection dialog.
- Node category is a display classification, not a domain type.
- For a selected reference layer, Nodes on the parent side can be presented as Goals and Nodes on the child side can be presented as Skills.
- XP, vision, evidence, and other Node-specific fields remain open for later design.
- **Superseded 2026-08-30:** "Map is primarily an inspection surface" and "Node relationship editing happens on the Node edit page" are replaced by the Map vs Focus split below. Map keeps direct connection editing; there is no separate Node edit page for now.

## Assumptions

- The initial category terminology may change after interaction validation.
- The reference layer is a view or filter setting and does not change the Node's identity.
- Relationship direction is stored once on the child as parent references; child lists are derived.
- Existing saved Skill/Goal data must not be discarded during migration.
- Self-reference and duplicate relationships are invalid.
- Whether cycles are allowed is unresolved and must be decided before relationship implementation.

## Decisions for the First Vertical Slice

- Use **Node** as the domain entity name.
- Use **Node category** as the provisional term for display classification.
- Treat the selected layer as a reference point for presenting parent-side Nodes as Goals and child-side Nodes as Skills.
- Do not encode `Skill` or `Goal` as mutually exclusive domain types.
- Treat zoom and pan as view operations. The desktop interaction candidate is Middle Mouse; touch gestures are future platform work.
- Add category editing later, after the relationship interaction is validated.
- **Superseded 2026-08-30:** the "read-only Map plus separate Node edit page with Add parent/Add child dialog" direction is replaced. See "Interaction Validation: Map vs Focus responsibility split" below.

## Provisional Interaction Specification

This section is provisional until a runnable prototype has been tried.

### Selected direction

Use a shared Node graph with a read-only Map and a Node edit page for relationships.

1. Select a Node in Map.
2. Open the Node edit page.
3. Choose `Add parent` or `Add child`.
4. Select a Node in the dialog.
5. Confirm the relationship.
6. Review the updated parent and child lists.
7. Return to Map and confirm the unified graph.

### Interaction rules

- `Add parent` adds the selected Node as a parent of the current Node.
- `Add child` adds the selected Node as a child of the current Node.
- The current Node is excluded from the selection dialog.
- Existing relationships cannot be added twice.
- Dialog cancellation does not change state.
- Zoom and pan do not mutate Node data.
- Relationship removal is available on the edit page.
- Invalid relationships show a visible error and do not update the Board.

### Interaction validation record

- Prototype A: Checkbox editor with persistent parent and child checkbox lists.
- Prototype B: Selection dialog opened by `Add parent` or `Add child`.
- User direction: Prototype B is preferred provisionally.
- Required validation: Try both prototypes and compare discoverability, cancellation, duplicate prevention, relationship direction, and recovery after an invalid action.
- **Superseded 2026-08-30:** this whole record assumed Map would become read-only and editing would move to a separate Node edit page. See "Interaction Validation: Map vs Focus responsibility split" below for the current direction. This record is kept for history only.
- Previously rejected alternative (now reconsidered): Editing relationships directly on Map Nodes, because Map should remain an inspection surface.

### Interaction Validation: Layer grouping (reference-node navigation)

- Prototype A: Fixed depth bands. All layers stay visible at once; clicking any Node makes it the reference and relabels Goal-side/Skill-side around it, but nothing is hidden.
- Prototype B: Focus window. Only three bands are visible: parents (Goal-side), the reference Node, and children (Skill-side). Clicking a parent or child card re-centers the view on that Node; a breadcrumb keeps earlier reference Nodes reachable.
- User-selected model: Prototype B, for a **focused** context where the user is working toward one Goal.
- Core action sequence: click a Goal-side card to move the reference up one layer, click a Skill-side card to move it down one layer, or click a breadcrumb entry to jump back to an earlier reference.
- Feedback after each action: Goal-side/Skill-side bands relabel around the new reference; the breadcrumb grows.
- Invalid or blocked action behavior: a band with no parent or no child shows a placeholder message instead of staying empty.
- Undo or recovery behavior: breadcrumb entries let the user return to any earlier reference Node without losing state.
- Rejected alternative: none fully rejected. Prototype A remains a candidate for a separate **exploration** context (see below) rather than being discarded.
- Verification method: manual click-through of a disposable HTML prototype; the prototype was removed after validation and is not backed by an automated test.

New scope discovered during validation:

- Two different usage contexts emerged. An **exploration context** should show a Node's multiple parents (Goals) at once, useful when looking for many possible directions from acquired Skills. A **focused context** should show only one active Goal at a time, useful once the user has committed to a direction and is leveling up Skills toward it.
- Confirmed direction: keep the existing Map as the exploration context, since it already shows the full graph. Layer navigation is a new, separate **Focus** page rather than a mode toggle inside Map.
- Confirmed: the focused view's initial reference Node defaults to a Skill currently in `learning` or `practicing` status.
- Whether this grouping makes unlocking the board more fun is unconfirmed. Treat it as an experiment, not a committed feature, until validated with real use.

### First implementation (Focus page)

- Added `src/components/FocusView.tsx`, a read-only page reachable from `WorkspaceNav` as `focus`.
- Reuses the existing `Skill`/`Goal` data; no Node model migration was needed for this first slice.
- Domain helpers in `src/domain/skillBoard.ts`: `focusParents` (Skills whose `prerequisiteSkillIds` include the node, plus Goals whose `requiredSkillIds` include it), `focusChildren` (a Skill's own prerequisites, or a Goal's required Skills), and `defaultFocusNodeId`.
- The Goal-side band can show more than one entry when a node has multiple parents (mirrors the validated prototype). The "designate a single active Goal" idea from user feedback is **not implemented**; this remains an open question below.
- Verified manually in the running app: default reference selection, moving up via a Goal-side card, moving down via a Skill-side card, and returning through the breadcrumb.
- Unit tests: `src/domain/layerFocus.test.ts` covers `focusParents`, `focusChildren`, and `defaultFocusNodeId`, including empty-parent and empty-child cases.
- Not yet done: component/integration test for `FocusView` itself, and a decision on restricting the Goal-side band to a single designated Goal.

### Interaction Validation: Focus simplification (2026-08-30)

The user found the breadcrumb/multi-step history confusing: after moving the reference, the node they came from lost its highlight and became just one more list entry, so they could not tell "this is the node I was looking at". The actual need was simpler: see one node's direct connections locally, not manage navigation history.

- Rejected: keep the breadcrumb but highlight the previous node distinctly. Reason: the user preferred removing the history mechanism entirely rather than making it more visible.
- Confirmed model: Focus always shows only the current node's direct parents (Goal-side) and direct children (Skill-side), with no breadcrumb and no navigation history. Clicking a Goal-side or Skill-side card changes the current node immediately; there is no trail to go back through.
- Implementation: removed the `trail` state, `jumpTo`, and the breadcrumb UI from `FocusView.tsx`. `moveTo` now only updates `referenceId`.
- Consequence: there is no way to jump back to a previously viewed node except by clicking through parents/children again, or by returning to Map and reselecting. This is accepted for now; revisit only if losing history proves painful in real use.
- Verification method: `npm test` passes; manual check in the running app that clicking a Goal-side or Skill-side card updates the three bands with no breadcrumb shown.

### Interaction Validation: Map vs Focus responsibility split

The user lost track of why Map and Focus behave differently. This record captures the clarified mental model, confirmed by the user on 2026-08-30.

- Option A (previous plan): Map becomes read-only. All relationship editing moves to a dedicated Node edit page reached from Map, using `Add parent`/`Add child` dialogs.
- Option B (current implementation): Map keeps the full graph with a fixed reference (no layer switching) and direct connection editing on the graph itself (`onToggleLink`, `onRemovePrerequisite` in `SkillMapWorkspace`). Focus stays read-only and only changes which layer/reference is displayed.
- User-selected model: Option B. Map answers "what Skill can I aim for next", using the full graph with editable connections and no layer switching. Focus answers "what does the board look like around this layer", using layer navigation with no editing.
- Core action sequence:
  - Map: click/drag to connect or disconnect two Skill nodes; the reference (whole graph) never changes.
  - Focus: click a Goal-side or Skill-side card to move to that node and see its direct parents/children. No connection editing here, and no navigation history (see "Interaction Validation: Focus simplification").
- Feedback after each action: Map re-renders the changed connection immediately; Focus relabels its three bands around the new current node.
- Invalid or blocked action behavior: unchanged from each view's existing behavior (Map shows the existing error message region; Focus shows a placeholder for an empty band).
- Undo or recovery behavior: Map edits can be reversed by repeating the toggle. Focus has no history; returning to an earlier node means clicking through parents/children again or reselecting in Map.
- Rejected alternative: the separate Node edit page with a selection dialog (Option A). Reason: it added an extra navigation step for an action (connecting Skills) the user wants to do while looking at the full Map.
- Open follow-up: the user tentatively suggested Focus could also gain connection editing, sharing the same editing interaction as Map, but decided to keep Focus read-only for now. Revisit this only if layer navigation alone proves insufficient in real use.
- Verification method: no new code was needed, since the current Map and Focus implementations already match this model. Verify by running the app: confirm Map has no layer/reference control and its existing connection edit controls still work, and confirm Focus has no connection-editing control and only changes the displayed layer.

### Interaction Validation: Node edit page (2026-08-30)

- Confirmed need: a Node edit page for fields the Map graph and its inline side panel do not cover (rename, status). This is separate from connection editing, which stays on Map (see the split above).
- Scope for this slice: edit an existing Skill's `name` and `status`. `level` is derived from `xp` (see `levelFromXp`) and is not independently editable. Category, evidence, and vision fields are out of scope until the unified Node model defines them (see Open Questions).
- How it opens: an explicit `Edit` button on the selected Node's side panel in Map (`SkillMapDetail`), not a click on the Node itself, so accidental edits during graph browsing are avoided.
- Implementation: `src/components/NodeEditPage.tsx`, a modal dialog with a name field and a status dropdown, opened from `SkillMapDetail` and wired through `SkillMapWorkspace` to a new `updateSkillDetailsRequested` action (`skillBoardSlice.ts`, handled in `skillBoardSaga.ts`). Cancelling or clicking outside the dialog discards changes; Save rejects an empty name with an inline error and does not close the dialog.
- Not yet done: an equivalent edit page for Goals (title, vision); component/integration test for `NodeEditPage`.
- Verification method: `npm test` passes with existing saga/slice tests; manual check in the running app that Edit opens the dialog, Cancel discards changes, and Save updates the name/status shown in Map.

## Open Questions

- Is **Node category** the final term, or should the UI use another term such as `role` or 'layer'? The user proposed 'layer' but is not sure it is the right word.
  - Owner: Product owner
  - Decision point: Before Node model implementation
- Is the reference layer selected by the user, or fixed by the current board view?
  - Resolved by prototype: the user selects the reference Node by clicking it. Clicking a parent (Goal-side) card moves the reference up one layer; clicking a child (Skill-side) card moves it down one layer. See "Interaction Validation: Layer grouping" below.
- ~~Does the focused single-Goal layer view live on a new dedicated page, or as a toggle inside the existing Map?~~ Resolved: implemented as a new `Focus` page, separate from Map/Skills/Goals.
- How is a single active Goal designated when a Node has multiple parents, for the focused context?
  - Owner: Product owner
  - Decision point: Before layer-navigation implementation
  - Provisional direction: designated ahead of time from the Skills or Goals view. The exact mechanism (a "current Goal" flag, pinning, etc.) is undecided.
- Is grouping Nodes by layer worth building at all? The user is unsure it makes unlocking the board more fun.
  - Owner: Product owner
  - Decision point: Before committing to layer-navigation implementation; treat as an experiment to validate with real use.
- Are parent-side and child-side classifications only visual labels, or should they filter the Skills and Goals pages?
  - Owner: Product owner
  - Decision point: Before list and navigation implementation
- Are cycles allowed in the general Node graph?
  - Owner: Product owner
  - Decision point: Before relationship validation implementation
- How should existing Skill and Goal records migrate into Nodes?
  - Owner: Implementation team
  - Decision point: Before persistence changes
- What are the final XP, evidence, and vision fields?
  - Owner: Product owner
  - Decision point: Before progression metadata implementation

## User Flow and Acceptance Criteria

**Superseded 2026-08-30:** steps 2-5 below described the read-only-Map-plus-edit-page flow. The confirmed direction is direct editing on Map instead (see "Interaction Validation: Map vs Focus responsibility split"). This flow and its acceptance criteria need to be rewritten before the unified Node model is implemented; keep them here only as history until that rewrite happens.

1. Add a Node from the Skills or Goals entry point.
2. Select the Node in Map.
3. Open its edit page.
4. Add a parent or child through the selection dialog.
5. Remove the relationship from the edit page.
6. Confirm the same Node and relationship in Map.

Acceptance criteria (historical, pending rewrite):

- [ ] Skills can add a Node.
- [ ] Goals can add a Node.
- [ ] Map displays all Nodes in one graph.
- [ ] A Map Node opens its edit page.
- [ ] A parent can be added from the edit page.
- [ ] A child can be added from the edit page.
- [ ] A relationship can be removed from the edit page.
- [ ] One Node can appear as both parent and child.
- [ ] The selection dialog excludes the current Node and duplicate relationships.
- [ ] Invalid relationship updates are rejected without mutating state.
- [ ] Parent-side and child-side presentation follows the selected reference layer.
- [ ] Existing saved data remains readable during migration.

## Data Model and Persistence

The target model uses one Node collection. Skill and Goal are not separate graph entities.

```ts
export type BoardNode = {
  id: string;
  name: string;
  parentNodeIds: string[];
  category?: string;
  layoutX?: number;
  layoutY?: number;
};

export type SkillBoard = {
  version: 1;
  nodes: BoardNode[];
};
```

Child Nodes are derived by finding Nodes whose `parentNodeIds` include the current Node ID. XP, level, status, vision, evidence, and import references are optional extensions and do not determine whether a Node is a Skill or Goal.

The persistence adapter must support a migration path from the current `{ skills, goals }` shape to `{ nodes }`. The migration must preserve IDs, names, layout data, parent links, and any existing progression fields. The exact migration mapping remains an open question.

## Implementation Design

### Module Boundaries

- `domain`: BoardNode, relationship validation, reference-layer presentation rules
- `store`: Node creation, update, deletion, relationship actions, and migration state
- `components`: unified Map, Skills/Goals views, Node edit page, and Node selection dialog
- `application`: persistence port and migration orchestration
- `persistence`: serialization and legacy data migration

### State and Data Flow

```text
Map or entry view
  -> Redux action
  -> domain validation / reducer or saga
  -> persistence adapter
  -> unified Node Board
  -> Map and filtered views re-render
```

### Error Handling

- Empty Node names are rejected.
- Self-reference and duplicate relationships are rejected.
- Cycle behavior follows the decision made before implementation.
- A failed save leaves the current Board unchanged and shows an error.
- Invalid legacy data is handled through the existing persistence error contract.

### Platform Considerations

- Windows/Web is the primary validation platform.
- Direct connection editing on Map should work with keyboard and touch input, not only mouse drag.
- Android and iOS should be able to reuse the same interaction structure.

## Test Strategy

### Unit Tests

- Add and normalize a Node.
- Add a parent relationship in the correct direction.
- Add a child relationship in the correct direction.
- Reject self-reference and duplicate relationships.
- Verify selected-layer parent/child presentation.
- Verify migration preserves IDs, names, links, and optional fields.

### Component or Integration Tests

- Add a Node from Skills and see it in Map.
- Add a Node from Goals and see it in Map.
- Add a connection directly on Map and verify both Nodes' parent/child lists update.
- Remove a connection directly on Map and verify Map updates.
- Reject an invalid connection (self-reference or duplicate) without mutating state.
- Confirm that a Node can be both parent and child.
- Move the Focus reference through Goal-side and Skill-side cards and confirm Focus has no connection-editing control.

### Manual Verification

- Create Nodes on both sides of a selected reference layer.
- Build a three-level parent/child chain.
- Verify parent-side and child-side presentation.
- Try duplicate, self-reference, invalid, and cancelled operations.
- Reload migrated data and verify the unified graph.

### Regression Risks

- Migration can create orphaned relationship IDs.
- Maintaining both legacy and unified shapes temporarily can cause divergent updates.
- Treating category as a domain type would recreate the current Skill/Goal split.
- A non-obvious reference layer could make Skills and Goals classification difficult to understand.

## Rollout and Recovery

- Validate the two relationship prototypes before production UI work.
- Implement the unified Node model behind the existing persistence boundary.
- Migrate legacy data without deleting the original record until conversion succeeds.
- Keep a fallback read path for legacy data during the transition.
- If relationship editing causes regressions, disable editing while keeping unified Map viewing available.

## Trade-offs

| Option | Benefits | Costs or risks | Decision |
| --- | --- | --- | --- |
| Separate Skill and Goal graph types | Simple initial screens | Prevents recursive mixed relationships | Rejected |
| Shared Node with fixed category type | Easy filtering | Category becomes another rigid type boundary | Rejected |
| Shared Node with reference-layer presentation | Supports recursive relationships and flexible views | Requires clear reference-layer UX | Provisional choice |
| Edit relationships directly on Map | Fast access, matches "what can I aim for next" mental model | Makes Map dense and harder to inspect at large graph sizes | Selected 2026-08-30 (reverses earlier rejection) |
| Edit relationships on Node page with selection dialog | Clear direction and recoverable actions | Requires page navigation away from the graph the user is looking at | Rejected 2026-08-30 (was provisional choice) |

## Implementation Checklist

- [x] Plan: scope, priority, and initial acceptance criteria recorded
- [x] Change Scope: affected modules, data, platforms, and risks recorded
- [ ] Detailed Design: open questions resolved and design approved
- [ ] Interaction prototypes tried and selected model confirmed
- [ ] Update ADR if the architecture changes
- [ ] Implementation: shared Node model completed
- [ ] Unit Test: focused Node tests added and passing
- [ ] Functional Test: acceptance criteria verified
- [ ] Run validation commands and record results
- [ ] Record remaining technical issues
