import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import {
    emptySkillBoard,
    type Skill,
    type SkillBoard,
} from "../domain/skillBoard";

export type SkillBoardState = {
    board: SkillBoard;
    errorMessage: string | null;
};

const initialState: SkillBoardState = {
    board: emptySkillBoard(),
    errorMessage: null,
};

const skillBoardSlice = createSlice({
    name: "skillBoard",
    initialState,
    reducers: {
        appStarted: () => undefined,
        addSkillRequested: (_state, _action: PayloadAction<{ name: string }>) =>
            undefined,
        removeSkillRequested: (
            _state,
            _action: PayloadAction<{ id: string }>,
        ) => undefined,
        boardLoaded: (state, action: PayloadAction<SkillBoard>) => {
            state.board = action.payload;
            state.errorMessage = null;
        },
        skillAdded: (state, action: PayloadAction<Skill>) => {
            state.board.skills.push(action.payload);
            state.errorMessage = null;
        },
        skillRemoved: (state, action: PayloadAction<{ id: string }>) => {
            state.board.skills = state.board.skills.filter(
                (skill) => skill.id !== action.payload.id,
            );
            state.errorMessage = null;
        },
        persistenceFailed: (
            state,
            action: PayloadAction<{ message: string }>,
        ) => {
            state.errorMessage = action.payload.message;
        },
    },
});

export const {
    appStarted,
    addSkillRequested,
    removeSkillRequested,
    boardLoaded,
    skillAdded,
    skillRemoved,
    persistenceFailed,
} = skillBoardSlice.actions;

export const skillBoardReducer = skillBoardSlice.reducer;
