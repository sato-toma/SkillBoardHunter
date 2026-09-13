import { parse, stringify, type TomlTable } from 'smol-toml';
import type {
    Goal,
    Skill,
    SkillBoard,
    SkillLevel,
    SkillNote,
    SkillStatus,
} from '../domain/skillBoard';

const FORMAT = 'skillboard';
const FORMAT_VERSION = '1.0.0';
const SUPPORTED_MAJOR = 1;

export type SkillBoardTomlErrorKind =
    | 'invalid-toml'
    | 'unsupported-format'
    | 'unsupported-version'
    | 'invalid-schema';

export class SkillBoardTomlError extends Error {
    readonly kind: SkillBoardTomlErrorKind;

    constructor(kind: SkillBoardTomlErrorKind, message: string, cause?: unknown) {
        super(message, { cause });
        this.name = 'SkillBoardTomlError';
        this.kind = kind;
    }
}

type TomlBoard = {
    meta: { format: string; formatVersion: string; exportedAt: string };
    board: { id: string };
    skills: TomlTable[];
    goals?: TomlTable[];
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

const isString = (value: unknown): value is string => typeof value === 'string';
const isNumber = (value: unknown): value is number =>
    typeof value === 'number' && Number.isFinite(value);
const isStringArray = (value: unknown): value is string[] =>
    Array.isArray(value) && value.every(isString);

const isSemVer = (value: string): boolean => /^\d+\.\d+\.\d+$/.test(value);

const readSkillNote = (value: unknown): SkillNote | null => {
    if (!isRecord(value) || !isString(value.id) || !isString(value.content)) return null;
    if (!Array.isArray(value.links)) return null;

    const links = value.links.map((link) => {
        if (!isRecord(link) || !isString(link.id) || !isString(link.label) || !isString(link.url)) {
            return null;
        }
        return { id: link.id, label: link.label, url: link.url };
    });

    return links.every((link): link is NonNullable<typeof link> => link !== null)
        ? { id: value.id, content: value.content, links }
        : null;
};

const readSkill = (value: unknown): Skill | null => {
    if (!isRecord(value) || !isString(value.id) || !isString(value.name)) return null;
    if (value.prerequisiteSkillIds !== undefined && !isStringArray(value.prerequisiteSkillIds)) {
        return null;
    }
    if (value.notes !== undefined && !Array.isArray(value.notes)) return null;
    if (value.notes?.some((note) => readSkillNote(note) === null)) return null;
    if (value.xp !== undefined && !isNumber(value.xp)) return null;
    if (value.level !== undefined && ![1, 2, 3, 4, 5].includes(value.level as number)) return null;
    if (
        value.status !== undefined &&
        !['new', 'learning', 'practicing', 'mastered'].includes(value.status as string)
    )
        return null;
    if (value.layoutX !== undefined && !isNumber(value.layoutX)) return null;
    if (value.layoutY !== undefined && !isNumber(value.layoutY)) return null;

    return {
        id: value.id,
        name: value.name,
        prerequisiteSkillIds: value.prerequisiteSkillIds as string[] | undefined,
        notes: value.notes?.map((note) => readSkillNote(note) as SkillNote),
        xp: value.xp as number | undefined,
        level: value.level as SkillLevel | undefined,
        status: value.status as SkillStatus | undefined,
        layoutX: value.layoutX as number | undefined,
        layoutY: value.layoutY as number | undefined,
    };
};

const readGoal = (value: unknown): Goal | null => {
    if (!isRecord(value) || !isString(value.id) || !isString(value.title)) return null;
    if (value.vision !== undefined && !isString(value.vision)) return null;
    if (value.requiredSkillIds !== undefined && !isStringArray(value.requiredSkillIds)) return null;
    return {
        id: value.id,
        title: value.title,
        vision: value.vision as string | undefined,
        requiredSkillIds: value.requiredSkillIds as string[] | undefined,
    };
};

const validateBoard = (value: unknown): SkillBoard => {
    if (!isRecord(value))
        throw new SkillBoardTomlError('invalid-schema', 'TOML root must be a table.');
    const meta = value.meta;
    if (!isRecord(meta) || !isString(meta.format) || !isString(meta.formatVersion)) {
        throw new SkillBoardTomlError('invalid-schema', 'TOML meta is missing required fields.');
    }
    if (meta.format !== FORMAT) {
        throw new SkillBoardTomlError('unsupported-format', `Unsupported format: ${meta.format}`);
    }
    if (!isSemVer(meta.formatVersion)) {
        throw new SkillBoardTomlError('unsupported-version', 'formatVersion must be SemVer.');
    }
    if (Number(meta.formatVersion.split('.')[0]) !== SUPPORTED_MAJOR) {
        throw new SkillBoardTomlError(
            'unsupported-version',
            `Only format major version ${SUPPORTED_MAJOR} is supported.`,
        );
    }
    if (!isRecord(value.board) || !isString(value.board.id)) {
        throw new SkillBoardTomlError('invalid-schema', 'TOML board.id is required.');
    }
    if (!Array.isArray(value.skills)) {
        throw new SkillBoardTomlError('invalid-schema', 'TOML skills must be an array.');
    }

    const skills = value.skills.map(readSkill);
    if (skills.some((skill): skill is null => skill === null)) {
        throw new SkillBoardTomlError('invalid-schema', 'TOML contains an invalid Skill.');
    }
    if (value.goals !== undefined && !Array.isArray(value.goals)) {
        throw new SkillBoardTomlError('invalid-schema', 'TOML goals must be an array.');
    }
    const goals = value.goals === undefined ? [] : value.goals.map(readGoal);
    if (goals.some((goal): goal is null => goal === null)) {
        throw new SkillBoardTomlError('invalid-schema', 'TOML contains an invalid Goal.');
    }

    return { version: 1, skills: skills as Skill[], goals: goals as Goal[] };
};

export const exportSkillBoardToml = (board: SkillBoard, exportedAt = new Date()): string =>
    stringify({
        meta: {
            format: FORMAT,
            formatVersion: FORMAT_VERSION,
            exportedAt: exportedAt.toISOString(),
        },
        board: { id: 'default' },
        skills: board.skills.map((skill) => ({ ...skill })),
        goals: (board.goals ?? []).map((goal) => ({ ...goal })),
    } as TomlBoard);

export const importSkillBoardToml = (source: string): SkillBoard => {
    let parsed: unknown;
    try {
        parsed = parse(source);
    } catch (error) {
        throw new SkillBoardTomlError('invalid-toml', 'The file contains invalid TOML.', error);
    }
    return validateBoard(parsed);
};
