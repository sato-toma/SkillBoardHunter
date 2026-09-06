import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SkillMap } from './SkillMap';

describe('SkillMap', () => {
    it('zooms toward the pointer and prevents page scrolling', () => {
        render(
            <SkillMap
                skills={[{ id: 'react', name: 'React', xp: 10 }]}
                selectedSkillId={null}
                onSelect={() => undefined}
                onToggleLink={() => undefined}
                onMove={() => undefined}
            />,
        );

        const canvas = screen.getByLabelText('Skill map').querySelector('.skill-map-canvas');
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
});
