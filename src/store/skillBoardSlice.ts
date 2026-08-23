import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import {
    applyQuestCompletion,
    type Evidence,
    emptySkillBoard,
    type Goal,
    type Quest,
    type Skill,
    type SkillBoard,
    type SkillStatus,
} from '../domain/skillBoard';

export type SkillBoardState = {
    board: SkillBoard;
    quests?: Quest[];
    evidence?: Evidence[];
    lastLevelUp?: {
        skillName: string;
        capability: string;
        nextSkills: string[];
    } | null;
    errorMessage: string | null;
};

const initialState: SkillBoardState = {
    board: emptySkillBoard(),
    quests: [],
    evidence: [],
    lastLevelUp: null,
    errorMessage: null,
};

const skillBoardSlice = createSlice({
    name: 'skillBoard',
    initialState,
    reducers: {
        appStarted: () => undefined,
        addSkillRequested: (
            _state,
            _action: PayloadAction<{
                name: string;
                prerequisiteSkillIds?: string[];
                layoutX?: number;
                layoutY?: number;
            }>,
        ) => undefined,
        removeSkillRequested: (_state, _action: PayloadAction<{ id: string }>) => undefined,
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
        updateSkillPositionRequested: (
            _state,
            _action: PayloadAction<{
                id: string;
                layoutX: number;
                layoutY: number;
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
        removeGoalRequested: (_state, _action: PayloadAction<{ id: string }>) => undefined,
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
        questAdded: (state, action: PayloadAction<Quest>) => {
            state.quests ??= [];
            state.quests.push(action.payload);
            state.errorMessage = null;
        },
        questCompleted: (state, action: PayloadAction<{ questId: string; evidence: Evidence }>) => {
            const quest = (state.quests ?? []).find(
                (candidate) => candidate.id === action.payload.questId,
            );
            if (!quest) {
                state.errorMessage = 'Quest was not found.';
                return;
            }
            const completion = applyQuestCompletion(
                quest,
                action.payload.evidence,
                state.board.skills,
            );
            if (!completion) {
                state.errorMessage =
                    'Add evidence for a related Skill before completing this Quest.';
                return;
            }
            state.quests = (state.quests ?? []).map((candidate) =>
                candidate.id === quest.id ? completion.quest : candidate,
            );
            state.evidence ??= [];
            state.evidence.push(completion.evidence);
            state.board.skills = completion.skills;
            const levelUp = completion.levelUps[0];
            state.lastLevelUp = levelUp
                ? {
                      skillName: levelUp.skill.name,
                      capability: levelUp.capability.description,
                      nextSkills: state.board.skills
                          .filter((skill) => skill.prerequisiteSkillIds?.includes(levelUp.skill.id))
                          .map((skill) => skill.name),
                  }
                : null;
            state.errorMessage = null;
        },
        clearLevelUp: (state) => {
            state.lastLevelUp = null;
        },
        persistenceFailed: (state, action: PayloadAction<{ message: string }>) => {
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
    updateSkillPositionRequested,
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
    questAdded,
    questCompleted,
    clearLevelUp,
    persistenceFailed,
} = skillBoardSlice.actions;

export const skillBoardReducer = skillBoardSlice.reducer;
