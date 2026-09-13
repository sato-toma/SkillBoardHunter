import { describe, expect, it } from 'vitest';
import { exportSkillBoardToml, importSkillBoardToml, SkillBoardTomlError } from './skillBoardToml';

const expectErrorKind = (action: () => unknown, kind: string) => {
    try {
        action();
    } catch (error) {
        expect(error).toBeInstanceOf(SkillBoardTomlError);
        expect(error).toMatchObject({ kind });
        return;
    }
    throw new Error(`Expected ${kind} error.`);
};

describe('skillBoardToml', () => {
    it('round-trips a board with skills, goals, notes, and layout', () => {
        const board = {
            version: 1 as const,
            skills: [
                {
                    id: 'react',
                    name: 'React',
                    prerequisiteSkillIds: ['web'],
                    xp: 60,
                    level: 4 as const,
                    status: 'practicing' as const,
                    layoutX: 120,
                    layoutY: 240,
                    notes: [
                        {
                            id: 'note-1',
                            content: 'Built a feature.',
                            links: [{ id: 'link-1', label: 'PR', url: 'https://example.com/pr' }],
                        },
                    ],
                },
            ],
            goals: [
                { id: 'ship', title: 'Ship', vision: 'Release it', requiredSkillIds: ['react'] },
            ],
        };

        expect(
            importSkillBoardToml(exportSkillBoardToml(board, new Date('2026-01-01T00:00:00Z'))),
        ).toEqual(board);
    });

    it('ignores unknown keys while importing a supported major version', () => {
        const board = importSkillBoardToml(`
            [meta]
            format = "skillboard"
            formatVersion = "1.2.0"
            futureKey = "ignored"

            [board]
            id = "default"

            [[skills]]
            id = "react"
            name = "React"
            unknownSkillField = true
        `);

        expect(board).toEqual({ version: 1, skills: [{ id: 'react', name: 'React' }], goals: [] });
    });

    it('rejects an unsupported major version', () => {
        const importUnsupportedVersion = () =>
            importSkillBoardToml(`
                [meta]
                format = "skillboard"
                formatVersion = "2.0.0"
                [board]
                id = "default"
                [[skills]]
                id = "react"
                name = "React"
            `);

        expectErrorKind(importUnsupportedVersion, 'unsupported-version');
    });

    it('rejects invalid TOML and invalid required fields', () => {
        expectErrorKind(() => importSkillBoardToml('not = [valid'), 'invalid-toml');
        expectErrorKind(
            () =>
                importSkillBoardToml(`
                [meta]
                format = "skillboard"
                formatVersion = "1.0.0"
                [board]
                id = "default"
                [[skills]]
                id = "react"
            `),
            'invalid-schema',
        );
    });
});
