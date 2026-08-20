export type Skill = {
    id: string;
    name: string;
};

export type SkillBoard = {
    version: 1;
    skills: Skill[];
};

export const emptySkillBoard = (): SkillBoard => ({
    version: 1,
    skills: [],
});

export const normalizeSkillName = (value: string): string => value.trim();

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

        const maybeSkill = skill as { id?: unknown; name?: unknown };
        return (
            typeof maybeSkill.id === "string" &&
            typeof maybeSkill.name === "string"
        );
    });
};
