import { fireEvent, render, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SkillMap } from './SkillMap';

describe('SkillMap', () => {
    it('zooms toward the pointer and prevents page scrolling', () => {
        const { container } = render(
            <SkillMap
                skills={[{ id: 'react', name: 'React', xp: 10 }]}
                goals={[]}
                selectedSkillId={null}
                onSelect={() => undefined}
                onMove={() => undefined}
                onCreateLink={() => undefined}
                onRelinkLink={() => undefined}
                onDeleteLink={() => undefined}
            />,
        );

        const canvas = within(container)
            .getByLabelText('Skill map')
            .querySelector('.skill-map-canvas');
        if (!canvas) throw new Error('Skill map canvas is not rendered');
        const wheelEvent = new WheelEvent('wheel', {
            bubbles: true,
            cancelable: true,
            clientX: 300,
            clientY: 200,
            deltaY: -120,
        });

        fireEvent(canvas, wheelEvent);

        const world = canvas.querySelector<HTMLElement>('.skill-map-world');
        expect(wheelEvent.defaultPrevented).toBe(true);
        expect(world?.style.transform).toBe('translate(-36px, -24px) scale(1.12)');
    });

    it('only shows link ports after entering link editing mode', () => {
        const { container } = render(
            <SkillMap
                skills={[
                    { id: 'react', name: 'React', xp: 50 },
                    { id: 'web', name: 'Web', prerequisiteSkillIds: ['react'] },
                ]}
                goals={[]}
                selectedSkillId={null}
                onSelect={() => undefined}
                onMove={() => undefined}
                onCreateLink={() => undefined}
                onRelinkLink={() => undefined}
                onDeleteLink={() => undefined}
            />,
        );
        const map = within(container);

        expect(map.queryByTitle('Drag to create a link')).toBeNull();
        expect(map.queryByTitle('Drag to relink or delete')).toBeNull();

        fireEvent.click(map.getByRole('button', { name: 'Edit links' }));

        expect(map.getAllByTitle('Drag to create a link')).toHaveLength(2);
        expect(map.getByTitle('Drag to relink or delete')).toBeTruthy();

        fireEvent.click(map.getByRole('button', { name: 'Exit link editing' }));

        expect(map.queryByTitle('Drag to create a link')).toBeNull();
        expect(map.queryByTitle('Drag to relink or delete')).toBeNull();
    });
});
