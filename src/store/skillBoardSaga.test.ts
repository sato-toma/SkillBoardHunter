import { describe, expect, it } from "vitest";
import type {
    PersistenceError,
    Result,
    SkillBoardPersistencePort,
} from "../application/skillBoardPersistencePort";
import { addSkillRequested, appStarted } from "./skillBoardSlice";
import { createAppStore } from "./store";

const flushSaga = async () => {
    await Promise.resolve();
    await Promise.resolve();
};

const createError = (kind: PersistenceError["kind"]): PersistenceError => ({
    kind,
    message: `error:${kind}`,
    recoverable: true,
});

describe("skillBoardSaga", () => {
    it("falls back to empty board when load returns invalid-data", async () => {
        const port: SkillBoardPersistencePort = {
            load: async () => ({
                ok: false,
                error: createError("invalid-data"),
            }),
            save: async () => ({ ok: true, value: undefined }),
            clear: async () => ({ ok: true, value: undefined }),
        };

        const store = createAppStore(port);
        store.dispatch(appStarted());
        await flushSaga();

        const state = store.getState().skillBoard;
        expect(state.board.skills).toEqual([]);
        expect(state.errorMessage).toBeNull();
    });

    it("does not update state when save fails", async () => {
        const failedSave: Result<void, PersistenceError> = {
            ok: false,
            error: createError("write-failed"),
        };

        const port: SkillBoardPersistencePort = {
            load: async () => ({ ok: true, value: { version: 1, skills: [] } }),
            save: async () => failedSave,
            clear: async () => ({ ok: true, value: undefined }),
        };

        const store = createAppStore(port);
        store.dispatch(addSkillRequested({ name: "React" }));
        await flushSaga();

        const state = store.getState().skillBoard;
        expect(state.board.skills).toHaveLength(0);
        expect(state.errorMessage).toContain("失敗");
    });
});
