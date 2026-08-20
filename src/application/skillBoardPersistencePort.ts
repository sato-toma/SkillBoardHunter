import type { SkillBoard } from "../domain/skillBoard";

export type PersistenceErrorKind =
    | "unavailable"
    | "read-failed"
    | "write-failed"
    | "delete-failed"
    | "invalid-data";

export type PersistenceError = {
    kind: PersistenceErrorKind;
    message: string;
    cause?: unknown;
    recoverable: boolean;
};

export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

export interface SkillBoardPersistencePort {
    load(): Promise<Result<SkillBoard, PersistenceError>>;
    save(board: SkillBoard): Promise<Result<void, PersistenceError>>;
    clear(): Promise<Result<void, PersistenceError>>;
}
