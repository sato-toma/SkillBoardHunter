import { useState } from 'react';
import type { Skill, SkillStatus } from '../domain/skillBoard';

type NodeEditPageProps = {
    skill: Skill;
    onSave: (updates: { name: string; status: SkillStatus }) => void;
    onCancel: () => void;
};

const STATUS_OPTIONS: SkillStatus[] = ['new', 'learning', 'practicing', 'mastered'];

export function NodeEditPage({ skill, onSave, onCancel }: NodeEditPageProps) {
    const [name, setName] = useState(skill.name);
    const [status, setStatus] = useState<SkillStatus>(skill.status ?? 'new');
    const [error, setError] = useState<string | null>(null);

    const handleSave = () => {
        const trimmed = name.trim();
        if (!trimmed) {
            setError('Skill name cannot be empty.');
            return;
        }
        onSave({ name: trimmed, status });
    };

    return (
        <div className="node-edit-overlay" role="presentation" onClick={onCancel}>
            <div
                className="node-edit-dialog"
                role="dialog"
                aria-modal="true"
                aria-label="Edit Node"
                onClick={(event) => event.stopPropagation()}
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
