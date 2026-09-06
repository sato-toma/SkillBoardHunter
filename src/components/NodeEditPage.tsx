import { useState } from 'react';
import type { Skill, SkillNote, SkillStatus } from '../domain/skillBoard';

type NodeEditPageProps = {
    skill: Skill;
    onSave: (updates: { name: string; status: SkillStatus; notes: SkillNote[] }) => void;
    onCancel: () => void;
};

const STATUS_OPTIONS: SkillStatus[] = ['new', 'learning', 'practicing', 'mastered'];
const createId = () =>
    typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export function NodeEditPage({ skill, onSave, onCancel }: NodeEditPageProps) {
    const [name, setName] = useState(skill.name);
    const [status, setStatus] = useState<SkillStatus>(skill.status ?? 'new');
    const [notes, setNotes] = useState<SkillNote[]>(skill.notes ?? []);
    const [error, setError] = useState<string | null>(null);

    const handleSave = () => {
        const trimmed = name.trim();
        if (!trimmed) {
            setError('Skill name cannot be empty.');
            return;
        }
        onSave({ name: trimmed, status, notes });
    };

    return (
        <div className="node-edit-overlay">
            <div
                className="node-edit-dialog"
                role="dialog"
                aria-modal="true"
                aria-label="Edit Node"
            >
                <h3>Edit Node</h3>
                <label className="node-edit-field">
                    <span>Name</span>
                    <input
                        type="text"
                        value={name}
                        onChange={(event) => {
                            setName(event.target.value);
                            setError(null);
                        }}
                        aria-label="Node name"
                    />
                </label>
                <div className="node-edit-notes">
                    <span>Notes and evidence</span>
                    {notes.map((note, noteIndex) => (
                        <div className="node-edit-note" key={note.id}>
                            <textarea
                                value={note.content}
                                onChange={(event) =>
                                    setNotes((current) =>
                                        current.map((candidate, index) =>
                                            index === noteIndex
                                                ? { ...candidate, content: event.target.value }
                                                : candidate,
                                        ),
                                    )
                                }
                                aria-label={`Note ${noteIndex + 1}`}
                            />
                            <button
                                type="button"
                                onClick={() =>
                                    setNotes((current) =>
                                        current.filter((_, index) => index !== noteIndex),
                                    )
                                }
                            >
                                Remove note
                            </button>
                            {note.links.map((link, linkIndex) => (
                                <div className="node-edit-link" key={link.id}>
                                    <input
                                        type="text"
                                        value={link.label}
                                        placeholder="Link label"
                                        onChange={(event) =>
                                            setNotes((current) =>
                                                current.map((candidate, index) =>
                                                    index !== noteIndex
                                                        ? candidate
                                                        : {
                                                              ...candidate,
                                                              links: candidate.links.map(
                                                                  (candidateLink, index) =>
                                                                      index === linkIndex
                                                                          ? {
                                                                                ...candidateLink,
                                                                                label: event.target
                                                                                    .value,
                                                                            }
                                                                          : candidateLink,
                                                              ),
                                                          },
                                                ),
                                            )
                                        }
                                        aria-label={`Note ${noteIndex + 1} link ${linkIndex + 1} label`}
                                    />
                                    <input
                                        type="url"
                                        value={link.url}
                                        placeholder="https://"
                                        onChange={(event) =>
                                            setNotes((current) =>
                                                current.map((candidate, index) =>
                                                    index !== noteIndex
                                                        ? candidate
                                                        : {
                                                              ...candidate,
                                                              links: candidate.links.map(
                                                                  (candidateLink, index) =>
                                                                      index === linkIndex
                                                                          ? {
                                                                                ...candidateLink,
                                                                                url: event.target
                                                                                    .value,
                                                                            }
                                                                          : candidateLink,
                                                              ),
                                                          },
                                                ),
                                            )
                                        }
                                        aria-label={`Note ${noteIndex + 1} link ${linkIndex + 1} URL`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setNotes((current) =>
                                                current.map((candidate, index) =>
                                                    index !== noteIndex
                                                        ? candidate
                                                        : {
                                                              ...candidate,
                                                              links: candidate.links.filter(
                                                                  (_, index) => index !== linkIndex,
                                                              ),
                                                          },
                                                ),
                                            )
                                        }
                                    >
                                        Remove link
                                    </button>
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={() =>
                                    setNotes((current) =>
                                        current.map((candidate, index) =>
                                            index !== noteIndex
                                                ? candidate
                                                : {
                                                      ...candidate,
                                                      links: [
                                                          ...candidate.links,
                                                          { id: createId(), label: '', url: '' },
                                                      ],
                                                  },
                                        ),
                                    )
                                }
                            >
                                Add link
                            </button>
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={() =>
                            setNotes((current) => [
                                ...current,
                                { id: createId(), content: '', links: [] },
                            ])
                        }
                    >
                        Add note
                    </button>
                </div>
                <label className="node-edit-field">
                    <span>Status</span>
                    <select
                        value={status}
                        onChange={(event) => setStatus(event.target.value as SkillStatus)}
                        aria-label="Node status"
                    >
                        {STATUS_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                                {option}
                            </option>
                        ))}
                    </select>
                </label>
                {error && (
                    <p role="alert" className="error-text">
                        {error}
                    </p>
                )}
                <div className="node-edit-actions">
                    <button type="button" onClick={onCancel}>
                        Cancel
                    </button>
                    <button type="button" className="primary" onClick={handleSave}>
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
}
