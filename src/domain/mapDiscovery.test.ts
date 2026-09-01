import { describe, expect, it } from 'vitest';
import { discoverAround } from './mapDiscovery';
import type { Goal, Skill } from './skillBoard';

const skills: Skill[] = [
    { id: 'web', name: 'Web Fundamentals' },
    { id: 'css', name: 'CSS Layout' },
    { id: 'react', name: 'React', prerequisiteSkillIds: ['web'] },
    { id: 'testing', name: 'Testing', prerequisiteSkillIds: ['react'] },
    { id: 'ui', name: 'Product UI', prerequisiteSkillIds: ['react', 'css'] },
];

const goals: Goal[] = [{ id: 'ship-v1', title: 'Ship v1', requiredSkillIds: ['ui', 'testing'] }];

describe('discoverAround', () => {
    it('reveals only the active node with zero hops', () => {
        const view = discoverAround('react', skills, goals, 0, 0);
        expect(view.nodes).toEqual([{ id: 'react', name: 'React', kind: 'skill', band: 0, role: 'center' }]);
        expect(view.edges).toEqual([]);
    });

    it('reveals direct parents and children as path nodes one hop out', () => {
        const view = discoverAround('react', skills, goals, 1, 1);
        const byId = Object.fromEntries(view.nodes.map((n) => [n.id, n]));

        expect(byId.ui).toMatchObject({ role: 'path', band: 1 });
        expect(byId.testing).toMatchObject({ role: 'path', band: 1 });
        expect(byId.web).toMatchObject({ role: 'path', band: -1 });
        // css is a sibling: it shares parent "ui" with the active node, but is not
        // itself an ancestor of react.
        expect(byId.css).toMatchObject({ role: 'sibling-up', band: 0 });
    });

    it('marks the path edge between the active node and a direct parent', () => {
        const view = discoverAround('react', skills, goals, 1, 0);
        expect(view.edges).toContainEqual({ childId: 'react', parentId: 'ui', kind: 'path' });
        expect(view.edges).toContainEqual({ childId: 'react', parentId: 'testing', kind: 'path' });
    });

    it('marks the sibling edge between a sibling node and the shared ancestor', () => {
        const view = discoverAround('react', skills, goals, 1, 0);
        expect(view.edges).toContainEqual({ childId: 'css', parentId: 'ui', kind: 'sibling' });
    });

    it('reveals a Goal two hops up and keeps it a path node', () => {
        const view = discoverAround('react', skills, goals, 2, 0);
        const byId = Object.fromEntries(view.nodes.map((n) => [n.id, n]));
        expect(byId['ship-v1']).toMatchObject({ kind: 'goal', role: 'path', band: 2 });
    });

    it('does not reveal nodes beyond the requested hop count', () => {
        const view = discoverAround('react', skills, goals, 1, 0);
        expect(view.nodes.some((n) => n.id === 'ship-v1')).toBe(false);
    });

    it('does not include edges between two nodes that were not revealed', () => {
        const view = discoverAround('react', skills, goals, 0, 0);
        expect(view.edges).toEqual([]);
    });

    it('marks a node that shares a child with an already-revealed descendant as sibling-down', () => {
        const extendedSkills: Skill[] = [
            ...skills,
            { id: 'frontend-tooling', name: 'Frontend Tooling', prerequisiteSkillIds: ['web'] },
        ];
        const view = discoverAround('react', extendedSkills, goals, 0, 1);
        const byId = Object.fromEntries(view.nodes.map((n) => [n.id, n]));
        expect(byId['frontend-tooling']).toMatchObject({ role: 'sibling-down', band: 0 });
    });
});
