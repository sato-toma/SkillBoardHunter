import { describe, expect, it } from "vitest";
import {
    boardLoaded,
    goalAdded,
    goalRemoved,
    goalUpdated,
    persistenceFailed,
    type SkillBoardState,
    skillAdded,
    skillBoardReducer,
    skillRemoved,
    skillUpdated,
} from "./skillBoardSlice";

const initialState: SkillBoardState = {
    board: { version: 1, skills: [] },
    errorMessage: null,
};

describe("skillBoardSlice reducer", () => {
    it("applies add and remove state transitions", () => {
        const added = skillBoardReducer(
            initialState,
            skillAdded({ id: "s1", name: "TypeScript" }),
        );

        expect(added.board.skills).toHaveLength(1);
        expect(added.board.skills[0]?.name).toBe("TypeScript");

        const removed = skillBoardReducer(added, skillRemoved({ id: "s1" }));
        expect(removed.board.skills).toHaveLength(0);
    });

    it("updates error state and clears it on board load", () => {
        const failed = skillBoardReducer(
            initialState,
            persistenceFailed({ message: "save failed" }),
        );
        expect(failed.errorMessage).toBe("save failed");

        const loaded = skillBoardReducer(
            failed,
            boardLoaded({ version: 1, skills: [{ id: "a", name: "React" }] }),
        );
        expect(loaded.errorMessage).toBeNull();
        expect(loaded.board.skills).toHaveLength(1);
    });

    it("updates a skill's experience state", () => {
        const state: SkillBoardState = {
            board: {
                version: 1,
                skills: [{ id: "s1", name: "React", xp: 40, level: 3 }],
            },
            errorMessage: null,
        };

        const updated = skillBoardReducer(
            state,
            skillUpdated({
                id: "s1",
                name: "React",
                xp: 80,
                level: 5,
                status: "practicing",
            }),
        );

        expect(updated.board.skills[0]).toMatchObject({
            xp: 80,
            level: 5,
            status: "practicing",
        });
    });

    it("keeps multiple goals and their skill links independent", () => {
        const firstGoal = {
            id: "g1",
            title: "Ship a product",
            vision: "Make useful tools",
            requiredSkillIds: ["s1"],
        };
        const secondGoal = {
            id: "g2",
            title: "Write a book",
            vision: "Share what I learn",
            requiredSkillIds: ["s2"],
        };

        const withGoals = skillBoardReducer(
            skillBoardReducer(initialState, goalAdded(firstGoal)),
            goalAdded(secondGoal),
        );
        expect(withGoals.board.goals).toEqual([firstGoal, secondGoal]);

        const updated = skillBoardReducer(
            withGoals,
            goalUpdated({ ...firstGoal, requiredSkillIds: ["s1", "s2"] }),
        );
        expect(updated.board.goals).toEqual([
            { ...firstGoal, requiredSkillIds: ["s1", "s2"] },
            secondGoal,
        ]);

        const removed = skillBoardReducer(updated, goalRemoved({ id: "g1" }));
        expect(removed.board.goals).toEqual([secondGoal]);
    });
});
