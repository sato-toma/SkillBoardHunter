export type Skill = {
    id: string;
    name: string;
    xp?: number;
    level?: SkillLevel;
    status?: SkillStatus;
};

export type SkillLevel = 1 | 2 | 3 | 4 | 5;
export type SkillStatus = "new" | "learning" | "practicing" | "mastered";

export type Goal = {
    id: string;
    title: string;
    vision?: string;
    requiredSkillIds?: string[];
};

export type SkillBoard = {
    version: 1;
    skills: Skill[];
    goals?: Goal[];
};

export const emptySkillBoard = (): SkillBoard => ({
    version: 1,
    skills: [],
    goals: [],
});

export const normalizeSkillName = (value: string): string => value.trim();

export const normalizeXp = (value: number): number =>
    Math.min(100, Math.max(0, Math.round(value)));

export const levelFromXp = (xp: number): SkillLevel => {
    const normalizedXp = normalizeXp(xp);

    if (normalizedXp >= 80) return 5;
    if (normalizedXp >= 60) return 4;
    if (normalizedXp >= 40) return 3;
    if (normalizedXp >= 20) return 2;
    return 1;
};

export const isSkillBoard = (value: unknown): value is SkillBoard => {
    if (!value || typeof value !== "object") {
        return false;
    }

    const board = value as { version?: unknown; skills?: unknown };

    if (board.version !== 1 || !Array.isArray(board.skills)) {
        return false;
    }

    return board.skills.every((skill) => {
        if (!skill || typeof skill !== "object") {
            return false;
        }

        const maybeSkill = skill as {
            id?: unknown;
            name?: unknown;
            xp?: unknown;
            level?: unknown;
            status?: unknown;
        };
        return (
            typeof maybeSkill.id === "string" &&
            typeof maybeSkill.name === "string" &&
            (maybeSkill.xp === undefined ||
                (typeof maybeSkill.xp === "number" &&
                    Number.isFinite(maybeSkill.xp))) &&
            (maybeSkill.level === undefined ||
                [1, 2, 3, 4, 5].includes(maybeSkill.level as number)) &&
            (maybeSkill.status === undefined ||
                ["new", "learning", "practicing", "mastered"].includes(
                    maybeSkill.status as string,
                ))
        );
    });
};
