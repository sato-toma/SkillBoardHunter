import { describe, expect, it } from "vitest";
import {
    boardLoaded,
    persistenceFailed,
    skillAdded,
    skillBoardReducer,
    skillRemoved,
    type SkillBoardState,
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
});
