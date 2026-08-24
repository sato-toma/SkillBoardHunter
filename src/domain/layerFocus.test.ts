import { describe, expect, it } from 'vitest';
import {
    defaultFocusNodeId,
    focusChildren,
    focusParents,
    type Goal,
    type Skill,
} from './skillBoard';

const skills: Skill[] = [
    { id: 'web', name: 'Web Fundamentals', status: 'mastered' },
    { id: 'react', name: 'React', prerequisiteSkillIds: ['web'], status: 'practicing' },
    { id: 'ui', name: 'Product UI', prerequisiteSkillIds: ['react'], status: 'learning' },
];

const goals: Goal[] = [{ id: 'ship-v1', title: 'Ship v1', requiredSkillIds: ['ui'] }];

describe('layer focus navigation', () => {
    it('finds Skill and Goal parents (Goal-side) for a Skill', () => {
        expect(focusParents('react', skills, goals)).toEqual([
            { id: 'ui', name: 'Product UI', kind: 'skill' },
        ]);
        expect(focusParents('ui', skills, goals)).toEqual([
            { id: 'ship-v1', name: 'Ship v1', kind: 'goal' },
        ]);
    });

    it('returns no parents when nothing depends on the node', () => {
        expect(focusParents('ship-v1', skills, goals)).toEqual([]);
    });

    it('finds prerequisite children (Skill-side) for a Skill', () => {
        expect(focusChildren('react', skills, goals)).toEqual([
            { id: 'web', name: 'Web Fundamentals', kind: 'skill' },
        ]);
    });

    it('finds a Goal required Skills as its children', () => {
        expect(focusChildren('ship-v1', skills, goals)).toEqual([
            { id: 'ui', name: 'Product UI', kind: 'skill' },
        ]);
    });

    it('returns no children for a root Skill with no prerequisites', () => {
        expect(focusChildren('web', skills, goals)).toEqual([]);
    });

    it('defaults to the first in-progress Skill', () => {
        expect(defaultFocusNodeId(skills)).toBe('react');
    });

    it('falls back to the first Skill when none are in progress', () => {
        const noneInProgress: Skill[] = [{ id: 'a', name: 'A', status: 'new' }];
        expect(defaultFocusNodeId(noneInProgress)).toBe('a');
    });

    it('returns null when there are no Skills', () => {
        expect(defaultFocusNodeId([])).toBeNull();
    });
});
