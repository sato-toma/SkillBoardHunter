import type { SagaIterator } from "redux-saga";
import { call, put, select, takeEvery } from "redux-saga/effects";
import type { SkillBoardPersistencePort } from "../application/skillBoardPersistencePort";
import {
    normalizeSkillName,
    levelFromXp,
    normalizeXp,
    type Skill,
    type SkillBoard,
    type SkillStatus,
} from "../domain/skillBoard";
import {
    addSkillRequested,
    appStarted,
    boardLoaded,
    persistenceFailed,
    removeSkillRequested,
    updateGoalRequested,
    updateSkillRequested,
    type SkillBoardState,
    skillAdded,
    skillRemoved,
    skillUpdated,
    goalUpdated,
} from "./skillBoardSlice";

type SkillBoardRootState = {
    skillBoard: SkillBoardState;
};

const STORAGE_FAILURE_MESSAGE =
    "保存処理に失敗しました。しばらくしてから再試行してください。";

const createSkillId = (): string => {
    if (
        typeof crypto !== "undefined" &&
        typeof crypto.randomUUID === "function"
    ) {
        return crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

function* handleAppStarted(port: SkillBoardPersistencePort): SagaIterator {
    const result: Awaited<ReturnType<SkillBoardPersistencePort["load"]>> =
        yield call([port, port.load]);

    if (result.ok) {
        yield put(boardLoaded(result.value));
        return;
    }

    if (result.error.kind === "invalid-data") {
        yield put(
            persistenceFailed({
                message: "保存データが破損しているため初期化しました。",
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
        yield put(
            persistenceFailed({ message: "Skill名を入力してください。" }),
        );
        return;
    }

    const currentBoard: SkillBoard = yield select(
        (state: SkillBoardRootState) => state.skillBoard.board,
    );
    const newSkill: Skill = {
        id: createSkillId(),
        name: normalized,
        xp: 0,
        level: 1,
        status: "new",
    };
    const nextBoard: SkillBoard = {
        ...currentBoard,
        skills: [...currentBoard.skills, newSkill],
    };

    const saveResult: Awaited<ReturnType<SkillBoardPersistencePort["save"]>> =
        yield call([port, port.save], nextBoard);

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
    const currentSkill = currentBoard.skills.find(
        (skill) => skill.id === action.payload.id,
    );

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
    const saveResult: Awaited<ReturnType<SkillBoardPersistencePort["save"]>> =
        yield call([port, port.save], nextBoard);

    if (!saveResult.ok) {
        yield put(persistenceFailed({ message: STORAGE_FAILURE_MESSAGE }));
        return;
    }

    yield put(skillUpdated(updatedSkill));
}

function* handleUpdateGoalRequested(
    port: SkillBoardPersistencePort,
    action: ReturnType<typeof updateGoalRequested>,
): SagaIterator {
    const title = action.payload.title.trim();

    if (!title) {
        yield put(persistenceFailed({ message: "Goal名を入力してください。" }));
        return;
    }

    const currentBoard: SkillBoard = yield select(
        (state: SkillBoardRootState) => state.skillBoard.board,
    );
    const goal = {
        id: currentBoard.goals?.[0]?.id ?? createSkillId(),
        title,
        vision: action.payload.vision.trim(),
        requiredSkillIds: action.payload.requiredSkillIds.filter((skillId) =>
            currentBoard.skills.some((skill) => skill.id === skillId),
        ),
    };
    const nextBoard: SkillBoard = { ...currentBoard, goals: [goal] };
    const saveResult: Awaited<ReturnType<SkillBoardPersistencePort["save"]>> =
        yield call([port, port.save], nextBoard);

    if (!saveResult.ok) {
        yield put(persistenceFailed({ message: STORAGE_FAILURE_MESSAGE }));
        return;
    }

    yield put(goalUpdated(goal));
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
        skills: currentBoard.skills.filter(
            (skill) => skill.id !== action.payload.id,
        ),
        goals: currentBoard.goals?.map((goal) => ({
            ...goal,
            requiredSkillIds: goal.requiredSkillIds?.filter(
                (skillId) => skillId !== action.payload.id,
            ),
        })),
    };

    const saveResult: Awaited<ReturnType<SkillBoardPersistencePort["save"]>> =
        yield call([port, port.save], nextBoard);

    if (!saveResult.ok) {
        yield put(persistenceFailed({ message: STORAGE_FAILURE_MESSAGE }));
        return;
    }

    yield put(skillRemoved({ id: action.payload.id }));
}

export function* createSkillBoardSaga(
    port: SkillBoardPersistencePort,
): SagaIterator {
    yield takeEvery(appStarted.type, handleAppStarted, port);
    yield takeEvery(addSkillRequested.type, handleAddSkillRequested, port);
    yield takeEvery(
        removeSkillRequested.type,
        handleRemoveSkillRequested,
        port,
    );
    yield takeEvery(
        updateSkillRequested.type,
        handleUpdateSkillRequested,
        port,
    );
    yield takeEvery(updateGoalRequested.type, handleUpdateGoalRequested, port);
}
