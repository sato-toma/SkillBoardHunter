import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MapDiscoveryView } from './MapDiscoveryView';

describe('MapDiscoveryView', () => {
    it('reveals one more goal-side hop and resets around a newly selected node', () => {
        render(
            <MapDiscoveryView
                skills={[
                    { id: 'web', name: 'Web Fundamentals' },
                    {
                        id: 'react',
                        name: 'React',
                        prerequisiteSkillIds: ['web'],
                        status: 'learning',
                    },
                    { id: 'ui', name: 'Product UI', prerequisiteSkillIds: ['react'] },
                ]}
                goals={[{ id: 'ship-v1', title: 'Ship v1', requiredSkillIds: ['ui'] }]}
            />,
        );

        expect(
            screen.getByRole('heading', { name: 'Search Skills related to React.' }),
        ).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Product UI' })).toBeTruthy();
        expect(screen.queryByRole('button', { name: 'Ship v1' })).toBeNull();

        fireEvent.click(screen.getByRole('button', { name: /Expand toward Goals/ }));

        expect(screen.getByRole('button', { name: 'Ship v1' })).toBeTruthy();

        fireEvent.click(screen.getByRole('button', { name: 'Product UI' }));

        expect(
            screen.getByRole('heading', { name: 'Search Skills related to Product UI.' }),
        ).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Ship v1' })).toBeTruthy();
        expect(screen.getByRole('button', { name: 'React' })).toBeTruthy();
        expect(screen.queryByRole('button', { name: 'Web Fundamentals' })).toBeNull();
    });
});
