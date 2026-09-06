import { describe, expect, it } from 'vitest';
import {
    fallbackSkillLayout,
    isSkillBoard,
    isSkillUnlocked,
    normalizeSkillNotes,
    type Skill,
    skillVisibility,
} from './skillBoard';

const skills: Skill[] = [
    { id: 'root', name: 'Root', xp: 80 },
    { id: 'near', name: 'Near', prerequisiteSkillIds: ['root'], xp: 0 },
    { id: 'far', name: 'Far', prerequisiteSkillIds: ['near'], xp: 0 },
];

describe('skill map rules', () => {
    it('separates unlocked, discoverable, and hidden territory', () => {
        expect(isSkillUnlocked(skills[0], skills)).toBe(true);
        expect(skillVisibility(skills[0], skills)).toBe('unlocked');
        expect(skillVisibility(skills[1], skills)).toBe('discoverable');
        expect(skillVisibility(skills[2], skills)).toBe('hidden');
    });

    it('returns stable fallback positions for legacy Skills', () => {
        const first = fallbackSkillLayout(skills[0], skills);
        const second = fallbackSkillLayout(skills[0], skills);
        const deeper = fallbackSkillLayout(skills[2], skills);

        expect(first).toEqual(second);
        expect(deeper).not.toEqual(first);
    });

    it('accepts labelled HTTP links attached to a note', () => {
        expect(
            normalizeSkillNotes([
                {
                    id: 'note-1',
                    content: ' Shipped a feature. ',
                    links: [
                        { id: 'link-1', label: ' GitHub ', url: ' https://github.com/example ' },
                    ],
                },
            ]),
        ).toEqual([
            {
                id: 'note-1',
                content: 'Shipped a feature.',
                links: [{ id: 'link-1', label: 'GitHub', url: 'https://github.com/example' }],
            },
        ]);
        expect(
            normalizeSkillNotes([
                {
                    id: 'note-1',
                    content: 'Proof',
                    links: [{ id: 'link-1', label: 'X', url: 'ftp://x.com' }],
                },
            ]),
        ).toBeNull();
    });

    it('rejects persisted notes with non-HTTP external links', () => {
        expect(
            isSkillBoard({
                version: 1,
                skills: [
                    {
                        id: 'react',
                        name: 'React',
                        notes: [
                            {
                                id: 'note-1',
                                content: 'Proof',
                                links: [
                                    { id: 'link-1', label: 'Unsafe', url: 'javascript:alert(1)' },
                                ],
                            },
                        ],
                    },
                ],
            }),
        ).toBe(false);
    });
});
