import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { NodeEditPage } from './NodeEditPage';

describe('NodeEditPage', () => {
    it('saves several notes with links attached to their note', () => {
        const onSave = vi.fn();
        render(
            <NodeEditPage
                skill={{ id: 'react', name: 'React' }}
                onSave={onSave}
                onCancel={() => undefined}
            />,
        );

        fireEvent.click(screen.getByRole('button', { name: 'Add note' }));
        fireEvent.change(screen.getByLabelText('Note 1'), {
            target: { value: 'Built a feature.' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Add link' }));
        fireEvent.change(screen.getByLabelText('Note 1 link 1 label'), {
            target: { value: 'Pull request' },
        });
        fireEvent.change(screen.getByLabelText('Note 1 link 1 URL'), {
            target: { value: 'https://github.com/example/project/pull/1' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Save' }));

        expect(onSave).toHaveBeenCalledWith({
            name: 'React',
            status: 'new',
            notes: [
                {
                    id: expect.any(String),
                    content: 'Built a feature.',
                    links: [
                        {
                            id: expect.any(String),
                            label: 'Pull request',
                            url: 'https://github.com/example/project/pull/1',
                        },
                    ],
                },
            ],
        });
    });

    it('removes a link without removing its note, and removes a note with its links', () => {
        const onSave = vi.fn();
        const { container } = render(
            <NodeEditPage
                skill={{
                    id: 'react',
                    name: 'React',
                    notes: [
                        {
                            id: 'note-1',
                            content: 'Keep this note.',
                            links: [
                                {
                                    id: 'link-1',
                                    label: 'Proof',
                                    url: 'https://github.com/example/project',
                                },
                            ],
                        },
                        { id: 'note-2', content: 'Remove this note.', links: [] },
                    ],
                }}
                onSave={onSave}
                onCancel={() => undefined}
            />,
        );
        const editor = within(container);

        fireEvent.click(editor.getByRole('button', { name: 'Remove link' }));
        fireEvent.click(editor.getAllByRole('button', { name: 'Remove note' })[1]);
        fireEvent.click(editor.getByRole('button', { name: 'Save' }));

        expect(onSave).toHaveBeenCalledWith({
            name: 'React',
            status: 'new',
            notes: [{ id: 'note-1', content: 'Keep this note.', links: [] }],
        });
    });
});
