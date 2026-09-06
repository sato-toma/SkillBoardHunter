# Detailed Design: Skill Notes, Evidence Links, and Related Context

## Status

Implemented

## Phase Status

| Phase | Status | Evidence or link |
| --- | --- | --- |
| Plan | Complete | User request, 2026-09-06 |
| Change Scope | Complete | This document |
| Detailed Design | Complete | Interaction confirmed 2026-09-06 |
| Implementation | Complete | `src/domain/`, `src/store/`, `src/components/` |
| Unit Test | Complete | Focused Vitest tests |
| Functional Test | Complete | Saved a Note and Link, reloaded, and verified direct context, 2026-09-06 |

## Goal

Let a user record several free-form notes and external proof links for a Skill, then see its
directly related Skills and Goals without leaving the selected Skill context.

## Scope

### In scope

- Multiple free-form notes for each Skill
- Multiple user-labelled external links for each Skill
- Existing XP, Level, and Status as the visible achievement progress
- Direct prerequisites, dependent Skills, and directly related Goals in the Skill detail panel
- Local persistence and reload of the new Skill metadata

### Out of scope

- Automatic import or XP awards from external services
- Rich-text notes, attachments, or link previews
- User-defined graph relationships beyond existing prerequisites
- Transitive or multi-hop relationship browsing

## Confirmed Requirements

- A Skill can have multiple free-form notes.
- XP, Level, and Status describe achievement progress; no new achievement score is added.
- A Skill can have multiple external links with a user-provided label and URL.
- Related context contains only directly connected prerequisites, dependent Skills, and Goals.

## Change Scope

- `src/domain/skillBoard.ts`: new optional, validated Skill metadata types.
- `src/store/`: update action payloads, reducer state transitions, and persistence workflow.
- `src/components/NodeEditPage.tsx`: note and link editing interaction.
- `src/components/SkillMapDetail.tsx`: achievement progress and direct related context display.
- Existing JSON localStorage board records remain valid because the new properties are optional.

## Data Model and Persistence

```text
Skill
  notes: SkillNote[]

SkillNote
  id: string
  content: string
  links: SkillNoteLink[]

SkillNoteLink
  id: string
  label: string
  url: HTTP(S) URL
```

- A Note owns zero or more Links. Deleting a Note also removes its Links.
- Deleting a Link leaves its Note in place.
- Names, note content, link labels, and URLs are trimmed on save.
- Empty notes, empty link labels or URLs, and non-HTTP(S) URLs are rejected before persistence.
- The entire Board is saved using the existing localStorage adapter. Existing boards without
  `notes` remain valid and load normally.

## Implementation Design

### Module Boundaries

- `src/domain/skillBoard.ts` owns note/link types and validation.
- `src/store/skillBoardSaga.ts` validates and persists a Skill detail update as one transaction.
- `src/components/NodeEditPage.tsx` owns temporary inline-editing state.
- `src/components/SkillMapDetail.tsx` presents saved notes and direct graph context.

### State and Data Flow

```text
Node edit form -> updateSkillDetailsRequested -> saga validation -> localStorage save
-> skillUpdated -> selected Skill detail
```

### Error Handling

- An invalid metadata update shows an error and leaves stored Board data unchanged.
- Invalid persisted data, including unsafe external URLs, follows the existing invalid-data load
  recovery path.

### Platform Considerations

- Windows/Web opens validated external links in a new browser tab.
- Android/Capacitor and future iOS use the same URL data model; their external browser behavior
  must be verified when those platforms are introduced.

## Interaction Validation: Node Metadata Editing

- Prototype A: `prototypes/node-metadata/prototype-a-inline-fields.html`. Add, edit, and remove
  notes and links in the Node edit dialog.
- Prototype B: `prototypes/node-metadata/prototype-b-item-dialog.html`. Use a separate dialog to
  add each note or link, then edit the resulting summary list.
- User-selected model: Prototype A (confirmed 2026-09-06), refined as Note-to-Link $1:N$.
- Core action sequence: Open Edit -> add one or more Notes -> add zero or more labelled Links to
  each Note -> remove a Link or Note when needed -> Save.
- Feedback after each action: New fields appear in the current editor. Removed fields disappear
  immediately. Saved notes and links appear in the selected Skill detail.
- Invalid or blocked action behavior: Save rejects blank Note content, blank Link labels or URLs,
  and non-HTTP(S) URLs without changing saved data.
- Undo or recovery behavior: Cancel discards all unsaved form changes. A saved Note or Link is
  removed by editing the Skill and using its individual removal control.
- Rejected alternatives: Prototype B was rejected because repeated note-taking and linking is
  more direct when all of a Skill's metadata remains visible in one editor.
- Verification method: Component tests cover add, remove, and save. Domain tests cover URL
  validation. Saga tests verify persistence before state updates. Manual browser verification
  covers the complete save and reload flow.

## Initial Test Strategy

### Unit Tests

- Accept valid notes and labelled HTTP(S) links.
- Reject blank note content, blank link labels, and invalid URLs.
- Preserve metadata through reducer and persistence state transitions.

### Component or Integration Tests

- Add, edit, remove, save, and reopen several notes and links.
- Display direct prerequisites, dependents, and related Goals for the selected Skill.

### Functional Test

- Save metadata, reload the application, and verify it is restored.