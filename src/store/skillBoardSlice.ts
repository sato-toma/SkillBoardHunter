import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import {
    emptySkillBoard,
    type Goal,
    type Skill,
    type SkillBoard,
    type SkillStatus,
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
        addSkillRequested: (
            _state,
            _action: PayloadAction<{
                name: string;
                prerequisiteSkillIds?: string[];
            }>,
        ) => undefined,
        removeSkillRequested: (
            _state,
            _action: PayloadAction<{ id: string }>,
        ) => undefined,
        updateSkillRequested: (
            _state,
            _action: PayloadAction<{
                id: string;
                xp: number;
                status: SkillStatus;
            }>,
        ) => undefined,
        updateSkillDependenciesRequested: (
            _state,
            _action: PayloadAction<{
                id: string;
                prerequisiteSkillIds: string[];
            }>,
        ) => undefined,
        loadSampleRequested: () => undefined,
        updateGoalRequested: (
            _state,
            _action: PayloadAction<{
                id?: string;
                title: string;
                vision: string;
                requiredSkillIds: string[];
            }>,
        ) => undefined,
        removeGoalRequested: (_state, _action: PayloadAction<{ id: string }>) =>
            undefined,
        goalAdded: (state, action: PayloadAction<Goal>) => {
            state.board.goals = [...(state.board.goals ?? []), action.payload];
            state.errorMessage = null;
        },
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
        skillUpdated: (state, action: PayloadAction<Skill>) => {
            state.board.skills = state.board.skills.map((skill) =>
                skill.id === action.payload.id ? action.payload : skill,
            );
            state.errorMessage = null;
        },
        goalUpdated: (state, action: PayloadAction<Goal>) => {
            state.board.goals = (state.board.goals ?? []).map((goal) =>
                goal.id === action.payload.id ? action.payload : goal,
            );
            state.errorMessage = null;
        },
        goalRemoved: (state, action: PayloadAction<{ id: string }>) => {
            state.board.goals = (state.board.goals ?? []).filter(
                (goal) => goal.id !== action.payload.id,
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
    updateSkillRequested,
    updateSkillDependenciesRequested,
    loadSampleRequested,
    updateGoalRequested,
    removeGoalRequested,
    boardLoaded,
    skillAdded,
    skillRemoved,
    skillUpdated,
    goalUpdated,
    goalAdded,
    goalRemoved,
    persistenceFailed,
} = skillBoardSlice.actions;

export const skillBoardReducer = skillBoardSlice.reducer;
