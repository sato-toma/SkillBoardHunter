export type Skill = {
    id: string;
    name: string;
    prerequisiteSkillIds?: string[];
    xp?: number;
    level?: SkillLevel;
    status?: SkillStatus;
    layoutX?: number;
    layoutY?: number;
};

export type SkillLevel = 1 | 2 | 3 | 4 | 5;
export type SkillStatus = "new" | "learning" | "practicing" | "mastered";

export type QuestDifficulty = "easy" | "medium" | "hard";
export type QuestStatus = "open" | "completed";
export type EvidenceSource = "manual" | "github" | "other";
export type EvidenceConfidence = "low" | "medium" | "high";

export type Quest = {
    id: string;
    goalId?: string;
    title: string;
    description: string;
    requiredActions: string[];
    difficulty: QuestDifficulty;
    expectedXp: number;
    relatedSkillIds: string[];
    completionCriteria: string;
    status: QuestStatus;
    completedAt?: string;
};

export type Evidence = {
    id: string;
    source: EvidenceSource;
    date: string;
    description: string;
    relatedSkillId: string;
    xp: number;
    confidence: EvidenceConfidence;
    questId?: string;
};

export type Capability = {
    id: string;
    skillId: string;
    level: SkillLevel;
    title: string;
    description: string;
};

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

export const sampleSkillBoard = (): SkillBoard => ({
    version: 1,
    goals: [
        {
            id: "goal-product",
            title: "Ship a useful product",
            vision: "Turn an idea into something people can use.",
            requiredSkillIds: ["skill-ui", "skill-react", "skill-release"],
        },
    ],
    skills: [
        {
            id: "skill-web",
            name: "Web fundamentals",
            xp: 85,
            level: 5,
            status: "mastered",
        },
        {
            id: "skill-react",
            name: "React",
            prerequisiteSkillIds: ["skill-web"],
            xp: 60,
            level: 4,
            status: "practicing",
        },
        {
            id: "skill-ui",
            name: "Product UI",
            prerequisiteSkillIds: ["skill-react"],
            xp: 35,
            level: 2,
            status: "learning",
        },
        {
            id: "skill-release",
            name: "Release practice",
            prerequisiteSkillIds: ["skill-react"],
            xp: 15,
            level: 1,
            status: "learning",
        },
    ],
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

export const capabilityForLevel = (
    skillId: string,
    level: SkillLevel,
): Capability => {
    const capabilities: Record<SkillLevel, [string, string]> = {
        1: ["See the shape", "Understand the basic shape of this skill."],
        2: ["Use with guidance", "Use this skill with a guided example."],
        3: ["Apply in reality", "Apply this skill to a real task."],
        4: [
            "Improve the result",
            "Explain trade-offs and improve an existing result.",
        ],
        5: ["Help someone else", "Help another person use this skill."],
    };
    const [title, description] = capabilities[level];
    return {
        id: `${skillId}-capability-${level}`,
        skillId,
        level,
        title,
        description,
    };
};

export type QuestCompletion = {
    quest: Quest;
    evidence: Evidence;
    skills: Skill[];
    levelUps: Array<{ skill: Skill; capability: Capability }>;
};

export const applyQuestCompletion = (
    quest: Quest,
    evidence: Evidence,
    skills: Skill[],
): QuestCompletion | null => {
    if (
        quest.status === "completed" ||
        !quest.title.trim() ||
        !evidence.description.trim() ||
        !evidence.date ||
        evidence.xp <= 0 ||
        quest.relatedSkillIds.length === 0
    )
        return null;

    const awardedXp = Math.min(normalizeXp(quest.expectedXp), 40);
    if (
        awardedXp <= 0 ||
        !quest.relatedSkillIds.includes(evidence.relatedSkillId) ||
        !skills.some((skill) => quest.relatedSkillIds.includes(skill.id))
    )
        return null;

    const levelUps: Array<{ skill: Skill; capability: Capability }> = [];
    const updatedSkills = skills.map((skill) => {
        if (!quest.relatedSkillIds.includes(skill.id)) return skill;
        const previousLevel = levelFromXp(skill.xp ?? 0);
        const xp = normalizeXp((skill.xp ?? 0) + awardedXp);
        const updatedSkill: Skill = {
            ...skill,
            xp,
            level: levelFromXp(xp),
            status: xp >= 80 ? "mastered" : "practicing",
        };
        if ((updatedSkill.level ?? 1) > previousLevel) {
            levelUps.push({
                skill: updatedSkill,
                capability: capabilityForLevel(
                    skill.id,
                    updatedSkill.level ?? 1,
                ),
            });
        }
        return updatedSkill;
    });

    return {
        quest: { ...quest, status: "completed", completedAt: evidence.date },
        evidence: { ...evidence, xp: awardedXp, questId: quest.id },
        skills: updatedSkills,
        levelUps,
    };
};

export const isSkillUnlocked = (skill: Skill, skills: Skill[]): boolean =>
    (skill.xp ?? 0) > 0 &&
    (skill.prerequisiteSkillIds ?? []).every(
        (id) =>
            (skills.find((candidate) => candidate.id === id)?.xp ?? 0) >= 60,
    );

const neighborIds = (skill: Skill, skills: Skill[]): string[] => [
    ...(skill.prerequisiteSkillIds ?? []),
    ...skills
        .filter((candidate) =>
            candidate.prerequisiteSkillIds?.includes(skill.id),
        )
        .map((candidate) => candidate.id),
];

export type SkillVisibility = "hidden" | "discoverable" | "unlocked";

export const skillVisibility = (
    skill: Skill,
    skills: Skill[],
): SkillVisibility => {
    if (isSkillUnlocked(skill, skills)) return "unlocked";
    if ((skill.xp ?? 0) > 0) return "discoverable";
    const hasUnlockedNeighbor = neighborIds(skill, skills).some((id) => {
        const neighbor = skills.find((candidate) => candidate.id === id);
        return neighbor ? isSkillUnlocked(neighbor, skills) : false;
    });
    return hasUnlockedNeighbor ? "discoverable" : "hidden";
};

export type SkillPosition = { x: number; y: number };

export const fallbackSkillLayout = (
    skill: Skill,
    skills: Skill[],
): SkillPosition => {
    const depthOf = (id: string, trail: Set<string> = new Set()): number => {
        if (trail.has(id)) return 0;
        const current = skills.find((candidate) => candidate.id === id);
        const prerequisites = current?.prerequisiteSkillIds ?? [];
        if (prerequisites.length === 0) return 0;
        const nextTrail = new Set(trail).add(id);
        return 1 + Math.max(...prerequisites.map((p) => depthOf(p, nextTrail)));
    };
    const depth = depthOf(skill.id);
    const sameDepth = skills.filter(
        (candidate) => depthOf(candidate.id) === depth,
    );
    const indexAtDepth = Math.max(
        0,
        sameDepth.findIndex((candidate) => candidate.id === skill.id),
    );
    const ringRadius = 90 + depth * 150;
    const angleStep = (2 * Math.PI) / Math.max(1, sameDepth.length);
    const angle = indexAtDepth * angleStep - Math.PI / 2;
    return {
        x: 460 + Math.round(Math.cos(angle) * ringRadius),
        y: 260 + Math.round(Math.sin(angle) * ringRadius * 0.7),
    };
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
