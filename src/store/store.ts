import { configureStore } from "@reduxjs/toolkit";
import createSagaMiddleware from "redux-saga";
import type { SkillBoardPersistencePort } from "../application/skillBoardPersistencePort";
import { createSkillBoardSaga } from "./skillBoardSaga";
import { skillBoardReducer } from "./skillBoardSlice";

export const createAppStore = (port: SkillBoardPersistencePort) => {
    const sagaMiddleware = createSagaMiddleware();

    const store = configureStore({
        reducer: {
            skillBoard: skillBoardReducer,
        },
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware().concat(sagaMiddleware),
    });

    sagaMiddleware.run(createSkillBoardSaga, port);

    return store;
};

export type AppStore = ReturnType<typeof createAppStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
