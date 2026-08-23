# Growth Loop Core Design

## Decision

The first growth experience is a Goal-led Quest deck placed before the existing Skill Board. The Board remains the map of the user's current capabilities; the Quest deck is the next move.

The core loop is:

```text
Goal -> Quest -> Action -> Evidence -> XP -> Skill Level -> Capability -> next path
```

## Scope

Included:

- Create a Quest linked to a Goal and Skill
- Describe the intended change and completion criteria
- Complete a Quest by recording Evidence
- Award XP from the Quest's expected value, capped at 40 XP per completion
- Recalculate Skill XP and Level
- Show the new Capability and dependent Skills after a Level Up
- Keep Quest and Evidence state in Redux for the current session

Not included yet:

- Automatic external integrations
- XP from raw activity volume without a Quest
- Durable Quest/Evidence persistence
- AI-generated Goals or Quests
- Sharing and graph pathfinding

## Progression Rules

- Evidence description and date are required.
- Evidence must reference a Skill related to the Quest.
- A completed Quest cannot be completed again.
- XP is based on the Quest's expected value and is capped at 40.
- Existing 0-100 Skill XP and 1-5 Level thresholds are retained.
- Level Up feedback names the new capability and any dependent Skills.
- Activity quantity can provide the base Quest XP in a future scoring extension; meaningful outcomes and external evaluation can add bonuses later.

## Interaction Decision

The primary action is `I did this`, followed by a short Evidence record. This keeps the user focused on an outcome rather than on maintaining a task list. Creating a Quest is secondary and can be opened from `New Quest`. The existing tree and board views remain available below as the map and inspection tools.

## Persistence and Compatibility

Quest, Evidence, and Level Up state are runtime-only in this slice. Existing Skill Board persistence is unchanged, so old stored boards remain compatible. Before making growth history durable, define a versioned board format and migration behavior.

## Verification

- Unit tests cover XP/Level thresholds, related Evidence validation, and duplicate completion.
- Redux tests cover Quest completion updating the Quest, Evidence, and Skill state.
- TypeScript build validation and the full Vitest suite are required before release.
- Browser functional coverage is still pending because `tests/e2e` has no executable spec.
