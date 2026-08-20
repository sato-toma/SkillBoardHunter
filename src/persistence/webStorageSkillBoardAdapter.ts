import type {
    PersistenceError,
    Result,
    SkillBoardPersistencePort,
} from "../application/skillBoardPersistencePort";
import {
    emptySkillBoard,
    isSkillBoard,
    type SkillBoard,
} from "../domain/skillBoard";

const createError = (
    kind: PersistenceError["kind"],
    message: string,
    recoverable: boolean,
    cause?: unknown,
): PersistenceError => ({
    kind,
    message,
    recoverable,
    cause,
});

export class WebStorageSkillBoardAdapter implements SkillBoardPersistencePort {
    private readonly storageKey: string;
    private readonly storage: Storage | null;

    constructor(
        storageKey: string,
        storage: Storage | null = globalThis.localStorage ?? null,
    ) {
        this.storageKey = storageKey;
        this.storage = storage;
    }

    async load(): Promise<Result<SkillBoard, PersistenceError>> {
        if (!this.storage) {
            return {
                ok: false,
                error: createError(
                    "unavailable",
                    "Storage is not available",
                    true,
                ),
            };
        }

        try {
            const raw = this.storage.getItem(this.storageKey);

            if (!raw) {
                return { ok: true, value: emptySkillBoard() };
            }

            const parsed: unknown = JSON.parse(raw);

            if (!isSkillBoard(parsed)) {
                return {
                    ok: false,
                    error: createError(
                        "invalid-data",
                        "Stored data is invalid",
                        true,
                    ),
                };
            }

            return { ok: true, value: parsed };
        } catch (error) {
            return {
                ok: false,
                error: createError(
                    "read-failed",
                    "Failed to load board",
                    true,
                    error,
                ),
            };
        }
    }

    async save(board: SkillBoard): Promise<Result<void, PersistenceError>> {
        if (!this.storage) {
            return {
                ok: false,
                error: createError(
                    "unavailable",
                    "Storage is not available",
                    true,
                ),
            };
        }

        try {
            this.storage.setItem(this.storageKey, JSON.stringify(board));
            return { ok: true, value: undefined };
        } catch (error) {
            return {
                ok: false,
                error: createError(
                    "write-failed",
                    "Failed to save board",
                    true,
                    error,
                ),
            };
        }
    }

    async clear(): Promise<Result<void, PersistenceError>> {
        if (!this.storage) {
            return {
                ok: false,
                error: createError(
                    "unavailable",
                    "Storage is not available",
                    true,
                ),
            };
        }

        try {
            this.storage.removeItem(this.storageKey);
            return { ok: true, value: undefined };
        } catch (error) {
            return {
                ok: false,
                error: createError(
                    "delete-failed",
                    "Failed to clear board",
                    true,
                    error,
                ),
            };
        }
    }
}
