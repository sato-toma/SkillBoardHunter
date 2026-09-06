import { describe, expect, it, vi } from 'vitest';
import type {
    PersistenceError,
    Result,
    SkillBoardPersistencePort,
} from '../application/skillBoardPersistencePort';
import {
    addSkillRequested,
    appStarted,
    boardLoaded,
    updateRelationRequested,
    updateSkillDetailsRequested,
} from './skillBoardSlice';
import { createAppStore } from './store';

const flushSaga = async () => {
    await Promise.resolve();
    await Promise.resolve();
};

const createError = (kind: PersistenceError['kind']): PersistenceError => ({
    kind,
    message: `error:${kind}`,
    recoverable: true,
});

describe('skillBoardSaga', () => {
    it('falls back to empty board when load returns invalid-data', async () => {
        const port: SkillBoardPersistencePort = {
            load: async () => ({
                ok: false,
                error: createError('invalid-data'),
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

    it('does not update state when save fails', async () => {
        const failedSave: Result<void, PersistenceError> = {
            ok: false,
            error: createError('write-failed'),
        };

        const port: SkillBoardPersistencePort = {
            load: async () => ({ ok: true, value: { version: 1, skills: [] } }),
            save: async () => failedSave,
            clear: async () => ({ ok: true, value: undefined }),
        };

        const store = createAppStore(port);
        store.dispatch(addSkillRequested({ name: 'React' }));
        await flushSaga();

        const state = store.getState().skillBoard;
        expect(state.board.skills).toHaveLength(0);
        expect(state.errorMessage).toContain('失敗');
    });

    it('persists notes and their links before updating a skill', async () => {
        const save = vi.fn(async () => ({ ok: true as const, value: undefined }));
        const port: SkillBoardPersistencePort = {
            load: async () => ({ ok: true, value: { version: 1, skills: [] } }),
            save,
            clear: async () => ({ ok: true, value: undefined }),
        };
        const store = createAppStore(port);
        store.dispatch(boardLoaded({ version: 1, skills: [{ id: 'react', name: 'React' }] }));
        store.dispatch(
            updateSkillDetailsRequested({
                id: 'react',
                name: 'React',
                status: 'practicing',
                notes: [
                    {
                        id: 'note-1',
                        content: 'Built a feature.',
                        links: [
                            {
                                id: 'link-1',
                                label: 'Pull request',
                                url: 'https://github.com/example/project/pull/1',
                            },
                        ],
                    },
                ],
            }),
        );
        await flushSaga();

        expect(save).toHaveBeenCalledWith({
            version: 1,
            skills: [
                {
                    id: 'react',
                    name: 'React',
                    status: 'practicing',
                    notes: [
                        {
                            id: 'note-1',
                            content: 'Built a feature.',
                            links: [
                                {
                                    id: 'link-1',
                                    label: 'Pull request',
                                    url: 'https://github.com/example/project/pull/1',
                                },
                            ],
                        },
                    ],
                },
            ],
        });
        expect(store.getState().skillBoard.board.skills[0]?.notes?.[0]?.links).toHaveLength(1);
    });

    it('relinks a relationship to a Goal in one persisted board update', async () => {
        const save = vi.fn(async () => ({ ok: true as const, value: undefined }));
        const port: SkillBoardPersistencePort = {
            load: async () => ({ ok: true, value: { version: 1, skills: [] } }),
            save,
            clear: async () => ({ ok: true, value: undefined }),
        };
        const store = createAppStore(port);
        store.dispatch(
            boardLoaded({
                version: 1,
                skills: [
                    { id: 'react', name: 'React' },
                    { id: 'ui', name: 'Product UI', prerequisiteSkillIds: ['react'] },
                ],
                goals: [{ id: 'ship', title: 'Ship', requiredSkillIds: [] }],
            }),
        );

        store.dispatch(
            updateRelationRequested({ fromId: 'react', oldToId: 'ui', newToId: 'ship' }),
        );
        await flushSaga();

        expect(save).toHaveBeenCalledWith({
            version: 1,
            skills: [
                { id: 'react', name: 'React' },
                { id: 'ui', name: 'Product UI', prerequisiteSkillIds: [] },
            ],
            goals: [{ id: 'ship', title: 'Ship', requiredSkillIds: ['react'] }],
        });
    });
});
