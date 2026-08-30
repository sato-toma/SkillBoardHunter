import type { SagaIterator } from 'redux-saga';
import { call, put, select, takeEvery } from 'redux-saga/effects';
import type { SkillBoardPersistencePort } from '../application/skillBoardPersistencePort';
import {
    levelFromXp,
    normalizeSkillName,
    normalizeXp,
    type Skill,
    type SkillBoard,
    type SkillStatus,
    sampleSkillBoard,
} from '../domain/skillBoard';
import {
    addSkillRequested,
    appStarted,
    boardLoaded,
    goalAdded,
    goalRemoved,
    goalUpdated,
    loadSampleRequested,
    persistenceFailed,
    removeGoalRequested,
    removeSkillRequested,
    type SkillBoardState,
    skillAdded,
    skillRemoved,
    skillUpdated,
    updateGoalRequested,
    updateSkillDependenciesRequested,
    updateSkillDetailsRequested,
    updateSkillPositionRequested,
    updateSkillRequested,
} from './skillBoardSlice';

type SkillBoardRootState = {
    skillBoard: SkillBoardState;
};

const STORAGE_FAILURE_MESSAGE = '保存処理に失敗しました。しばらくしてから再試行してください。';

const createSkillId = (): string => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

function* handleAppStarted(port: SkillBoardPersistencePort): SagaIterator {
    const result: Awaited<ReturnType<SkillBoardPersistencePort['load']>> = yield call([
        port,
        port.load,
    ]);

    if (result.ok) {
        yield put(boardLoaded(result.value));
        return;
    }

    if (result.error.kind === 'invalid-data') {
        yield put(
            persistenceFailed({
                message: '保存データが破損しているため初期化しました。',
            }),
        );
        yield put(boardLoaded({ version: 1, skills: [] }));
        return;
    }

    yield put(persistenceFailed({ message: STORAGE_FAILURE_MESSAGE }));
}

function* handleAddSkillRequested(
    port: SkillBoardPersistencePort,
    action: ReturnType<typeof addSkillRequested>,
): SagaIterator {
    const normalized = normalizeSkillName(action.payload.name);

    if (!normalized) {
        yield put(persistenceFailed({ message: 'Skill名を入力してください。' }));
        return;
    }

    const currentBoard: SkillBoard = yield select(
        (state: SkillBoardRootState) => state.skillBoard.board,
    );
    const newSkill: Skill = {
        id: createSkillId(),
        name: normalized,
        prerequisiteSkillIds: action.payload.prerequisiteSkillIds,
        xp: 0,
        level: 1,
        status: 'new',
        layoutX: action.payload.layoutX,
        layoutY: action.payload.layoutY,
    };
    const nextBoard: SkillBoard = {
        ...currentBoard,
        skills: [...currentBoard.skills, newSkill],
    };

    const saveResult: Awaited<ReturnType<SkillBoardPersistencePort['save']>> = yield call(
        [port, port.save],
        nextBoard,
    );

    if (!saveResult.ok) {
        yield put(persistenceFailed({ message: STORAGE_FAILURE_MESSAGE }));
        return;
    }

    yield put(skillAdded(newSkill));
}

function* handleUpdateSkillRequested(
    port: SkillBoardPersistencePort,
    action: ReturnType<typeof updateSkillRequested>,
): SagaIterator {
    const currentBoard: SkillBoard = yield select(
        (state: SkillBoardRootState) => state.skillBoard.board,
    );
    const currentSkill = currentBoard.skills.find((skill) => skill.id === action.payload.id);

    if (!currentSkill) return;

    const xp = normalizeXp(action.payload.xp);
    const updatedSkill: Skill = {
        ...currentSkill,
        xp,
        level: levelFromXp(xp),
        status: action.payload.status as SkillStatus,
    };
    const nextBoard: SkillBoard = {
        ...currentBoard,
        skills: currentBoard.skills.map((skill) =>
            skill.id === updatedSkill.id ? updatedSkill : skill,
        ),
    };
    const saveResult: Awaited<ReturnType<SkillBoardPersistencePort['save']>> = yield call(
        [port, port.save],
        nextBoard,
    );

    if (!saveResult.ok) {
        yield put(persistenceFailed({ message: STORAGE_FAILURE_MESSAGE }));
        return;
    }

    yield put(skillUpdated(updatedSkill));
}

function* handleUpdateSkillDependenciesRequested(
    port: SkillBoardPersistencePort,
    action: ReturnType<typeof updateSkillDependenciesRequested>,
): SagaIterator {
    if (action.payload.prerequisiteSkillIds.includes(action.payload.id)) {
        yield put(persistenceFailed({ message: 'Skill cannot depend on itself.' }));
        return;
    }

    const currentBoard: SkillBoard = yield select(
        (state: SkillBoardRootState) => state.skillBoard.board,
    );
    const nextBoard: SkillBoard = {
        ...currentBoard,
        skills: currentBoard.skills.map((skill) =>
            skill.id === action.payload.id
                ? {
                      ...skill,
                      prerequisiteSkillIds: action.payload.prerequisiteSkillIds,
                  }
                : skill,
        ),
    };
    const saveResult: Awaited<ReturnType<SkillBoardPersistencePort['save']>> = yield call(
        [port, port.save],
        nextBoard,
    );

    if (!saveResult.ok) {
        yield put(persistenceFailed({ message: STORAGE_FAILURE_MESSAGE }));
        return;
    }

    const updatedSkill = nextBoard.skills.find((skill) => skill.id === action.payload.id);
    if (updatedSkill) yield put(skillUpdated(updatedSkill));
}

function* handleUpdateSkillDetailsRequested(
    port: SkillBoardPersistencePort,
    action: ReturnType<typeof updateSkillDetailsRequested>,
): SagaIterator {
    const normalized = normalizeSkillName(action.payload.name);

    if (!normalized) {
        yield put(persistenceFailed({ message: 'Skill名を入力してください。' }));
        return;
    }

    const currentBoard: SkillBoard = yield select(
        (state: SkillBoardRootState) => state.skillBoard.board,
    );
    const currentSkill = currentBoard.skills.find((skill) => skill.id === action.payload.id);

    if (!currentSkill) return;

    const updatedSkill: Skill = {
        ...currentSkill,
        name: normalized,
        status: action.payload.status,
    };
    const nextBoard: SkillBoard = {
        ...currentBoard,
        skills: currentBoard.skills.map((skill) =>
            skill.id === updatedSkill.id ? updatedSkill : skill,
        ),
    };
    const saveResult: Awaited<ReturnType<SkillBoardPersistencePort['save']>> = yield call(
        [port, port.save],
        nextBoard,
    );

    if (!saveResult.ok) {
        yield put(persistenceFailed({ message: STORAGE_FAILURE_MESSAGE }));
        return;
    }

    yield put(skillUpdated(updatedSkill));
}

function* handleUpdateSkillPositionRequested(
    port: SkillBoardPersistencePort,
    action: ReturnType<typeof updateSkillPositionRequested>,
): SagaIterator {
    const currentBoard: SkillBoard = yield select(
        (state: SkillBoardRootState) => state.skillBoard.board,
    );
    const nextBoard: SkillBoard = {
        ...currentBoard,
        skills: currentBoard.skills.map((skill) =>
            skill.id === action.payload.id
                ? {
                      ...skill,
                      layoutX: action.payload.layoutX,
                      layoutY: action.payload.layoutY,
                  }
                : skill,
        ),
    };
    const saveResult: Awaited<ReturnType<SkillBoardPersistencePort['save']>> = yield call(
        [port, port.save],
        nextBoard,
    );

    if (!saveResult.ok) {
        yield put(persistenceFailed({ message: STORAGE_FAILURE_MESSAGE }));
        return;
    }

    const updatedSkill = nextBoard.skills.find((skill) => skill.id === action.payload.id);
    if (updatedSkill) yield put(skillUpdated(updatedSkill));
}

function* handleLoadSampleRequested(port: SkillBoardPersistencePort): SagaIterator {
    const board = sampleSkillBoard();
    const saveResult: Awaited<ReturnType<SkillBoardPersistencePort['save']>> = yield call(
        [port, port.save],
        board,
    );

    if (!saveResult.ok) {
        yield put(persistenceFailed({ message: STORAGE_FAILURE_MESSAGE }));
        return;
    }

    yield put(boardLoaded(board));
}

function* handleUpdateGoalRequested(
    port: SkillBoardPersistencePort,
    action: ReturnType<typeof updateGoalRequested>,
): SagaIterator {
    const title = action.payload.title.trim();

    if (!title) {
        yield put(persistenceFailed({ message: 'Goal名を入力してください。' }));
        return;
    }

    const currentBoard: SkillBoard = yield select(
        (state: SkillBoardRootState) => state.skillBoard.board,
    );
    const goal = {
        id: action.payload.id ?? createSkillId(),
        title,
        vision: action.payload.vision.trim(),
        requiredSkillIds: action.payload.requiredSkillIds.filter((skillId) =>
            currentBoard.skills.some((skill) => skill.id === skillId),
        ),
    };
    const nextBoard: SkillBoard = {
        ...currentBoard,
        goals: (currentBoard.goals ?? []).some((currentGoal) => currentGoal.id === goal.id)
            ? currentBoard.goals?.map((currentGoal) =>
                  currentGoal.id === goal.id ? goal : currentGoal,
              )
            : [...(currentBoard.goals ?? []), goal],
    };
    const saveResult: Awaited<ReturnType<SkillBoardPersistencePort['save']>> = yield call(
        [port, port.save],
        nextBoard,
    );

    if (!saveResult.ok) {
        yield put(persistenceFailed({ message: STORAGE_FAILURE_MESSAGE }));
        return;
    }

    yield put(
        currentBoard.goals?.some((currentGoal) => currentGoal.id === goal.id)
            ? goalUpdated(goal)
            : goalAdded(goal),
    );
}

function* handleRemoveGoalRequested(
    port: SkillBoardPersistencePort,
    action: ReturnType<typeof removeGoalRequested>,
): SagaIterator {
    const currentBoard: SkillBoard = yield select(
        (state: SkillBoardRootState) => state.skillBoard.board,
    );
    const nextBoard: SkillBoard = {
        ...currentBoard,
        goals: currentBoard.goals?.filter((goal) => goal.id !== action.payload.id),
    };
    const saveResult: Awaited<ReturnType<SkillBoardPersistencePort['save']>> = yield call(
        [port, port.save],
        nextBoard,
    );

    if (!saveResult.ok) {
        yield put(persistenceFailed({ message: STORAGE_FAILURE_MESSAGE }));
        return;
    }

    yield put(goalRemoved({ id: action.payload.id }));
}

function* handleRemoveSkillRequested(
    port: SkillBoardPersistencePort,
    action: ReturnType<typeof removeSkillRequested>,
): SagaIterator {
    const currentBoard: SkillBoard = yield select(
        (state: SkillBoardRootState) => state.skillBoard.board,
    );
    const nextBoard: SkillBoard = {
        ...currentBoard,
        skills: currentBoard.skills.filter((skill) => skill.id !== action.payload.id),
        goals: currentBoard.goals?.map((goal) => ({
            ...goal,
            requiredSkillIds: goal.requiredSkillIds?.filter(
                (skillId) => skillId !== action.payload.id,
            ),
        })),
    };

    const saveResult: Awaited<ReturnType<SkillBoardPersistencePort['save']>> = yield call(
        [port, port.save],
        nextBoard,
    );

    if (!saveResult.ok) {
        yield put(persistenceFailed({ message: STORAGE_FAILURE_MESSAGE }));
        return;
    }

    yield put(skillRemoved({ id: action.payload.id }));
}

export function* createSkillBoardSaga(port: SkillBoardPersistencePort): SagaIterator {
    yield takeEvery(appStarted.type, handleAppStarted, port);
    yield takeEvery(addSkillRequested.type, handleAddSkillRequested, port);
    yield takeEvery(removeSkillRequested.type, handleRemoveSkillRequested, port);
    yield takeEvery(updateSkillRequested.type, handleUpdateSkillRequested, port);
    yield takeEvery(updateGoalRequested.type, handleUpdateGoalRequested, port);
    yield takeEvery(removeGoalRequested.type, handleRemoveGoalRequested, port);
    yield takeEvery(
        updateSkillDependenciesRequested.type,
        handleUpdateSkillDependenciesRequested,
        port,
    );
    yield takeEvery(updateSkillDetailsRequested.type, handleUpdateSkillDetailsRequested, port);
    yield takeEvery(updateSkillPositionRequested.type, handleUpdateSkillPositionRequested, port);
    yield takeEvery(loadSampleRequested.type, handleLoadSampleRequested, port);
}
