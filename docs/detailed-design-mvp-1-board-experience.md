# Detailed Design: MVP-1 Board Experience

## Status

Draft

## Phase Status

| Phase | Status | Evidence or link |
| --- | --- | --- |
| Plan | Complete | User request 2026-08-21 |
| Change Scope | Complete | This document |
| Detailed Design | Provisional | Shared Node model and relationship interaction are recorded; prototype validation is pending |
| Implementation | Partial | Previous Skill/Goal vertical slice is implemented; shared Node model is not implemented |
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
- Keep Map read-only for relationship editing. A selected Map Node can navigate to its edit page.
- Treat zoom and pan as view operations. The desktop interaction candidate is Middle Mouse; touch gestures are future platform work.
- Edit relationships with `Add parent` and `Add child` actions followed by a Node selection dialog.
- Add category editing later, after the relationship interaction is validated.

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
- Rejected alternative: Editing relationships directly on Map Nodes, because Map should remain an inspection surface.

## Open Questions

- Is **Node category** the final term, or should the UI use another term such as `role` or 'layer'?
  - Owner: Product owner
  - Decision point: Before Node model implementation
- Is the reference layer selected by the user, or fixed by the current board view?
  - Owner: Product owner
  - Decision point: Before Skills/Goals view implementation
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

1. Add a Node from the Skills or Goals entry point.
2. Select the Node in Map.
3. Open its edit page.
4. Add a parent or child through the selection dialog.
5. Remove the relationship from the edit page.
6. Confirm the same Node and relationship in Map.

Acceptance criteria:

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
- The edit page and selection dialog should work with keyboard and touch input.
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
- Navigate from Map to the Node edit page.
- Add a parent and child through the dialog.
- Cancel the dialog without changing state.
- Remove a relationship and verify Map updates.
- Confirm that a Node can be both parent and child.

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
| Edit relationships directly on Map | Fast access | Makes Map dense and harder to inspect | Rejected |
| Edit relationships on Node page with selection dialog | Clear direction and recoverable actions | Requires page navigation | Provisional choice |

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
