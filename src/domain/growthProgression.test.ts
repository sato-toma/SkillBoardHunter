import { describe, expect, it } from "vitest";
import { applyQuestCompletion, levelFromXp, type Quest } from "./skillBoard";

const quest: Quest = {
    id: "quest-1",
    title: "Make the first release",
    description: "Put a useful slice in front of someone.",
    requiredActions: ["Build", "Share"],
    difficulty: "medium",
    expectedXp: 30,
    relatedSkillIds: ["skill-release"],
    completionCriteria: "Someone can use it.",
    status: "open",
};

const evidence = {
    id: "evidence-1",
    source: "manual" as const,
    date: "2026-08-23",
    description: "Shared the working slice and collected feedback.",
    relatedSkillId: "skill-release",
    xp: 30,
    confidence: "medium" as const,
};

describe("growth progression", () => {
    it("turns evidence into capped XP and a capability level up", () => {
        const completion = applyQuestCompletion(quest, evidence, [
            { id: "skill-release", name: "Release practice", xp: 15 },
        ]);

        expect(completion?.evidence.xp).toBe(30);
        expect(completion?.skills[0]).toMatchObject({ xp: 45, level: 3 });
        expect(completion?.levelUps[0]?.capability.description).toContain(
            "real task",
        );
    });

    it("does not award progress without related evidence", () => {
        expect(
            applyQuestCompletion(
                quest,
                { ...evidence, relatedSkillId: "skill-other" },
                [{ id: "skill-release", name: "Release practice", xp: 15 }],
            ),
        ).toBeNull();
        expect(
            applyQuestCompletion({ ...quest, status: "completed" }, evidence, [
                { id: "skill-release", name: "Release practice", xp: 15 },
            ]),
        ).toBeNull();
    });

    it("keeps the board level thresholds stable", () => {
        expect(levelFromXp(19)).toBe(1);
        expect(levelFromXp(20)).toBe(2);
        expect(levelFromXp(80)).toBe(5);
    });
});
