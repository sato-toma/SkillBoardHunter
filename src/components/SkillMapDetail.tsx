import { useState } from 'react';
import { isSkillUnlocked, type Skill, type SkillStatus } from '../domain/skillBoard';
import { NodeEditPage } from './NodeEditPage';

type SkillMapDetailProps = {
    selectedSkill: Skill | undefined;
    skills: Skill[];
    onXpChange: (skill: Skill, xp: number) => void;
    onRemovePrerequisite: (skill: Skill, prerequisiteId: string) => void;
    onEditSave: (skill: Skill, updates: { name: string; status: SkillStatus }) => void;
};

export function SkillMapDetail({
    selectedSkill,
    skills,
    onXpChange,
    onRemovePrerequisite,
    onEditSave,
}: SkillMapDetailProps) {
    const [isEditing, setIsEditing] = useState(false);

    if (!selectedSkill) {
        return (
            <aside className="skill-map-detail empty">
                <p>Select a Skill on the map to see it here.</p>
            </aside>
        );
    }

    const unlocked = isSkillUnlocked(selectedSkill, skills);
    const prerequisites = (selectedSkill.prerequisiteSkillIds ?? [])
        .map((id) => skills.find((skill) => skill.id === id))
        .filter((skill): skill is Skill => Boolean(skill));

    return (
        <aside className="skill-map-detail" aria-label="Selected Skill">
            <div className="skill-map-detail-heading">
                <h3>{selectedSkill.name}</h3>
                <span className={unlocked ? 'state-badge unlocked' : 'state-badge locked'}>
                    {unlocked ? 'UNLOCKED' : 'LOCKED'}
                </span>
            </div>
            <button type="button" className="skill-map-edit-button" onClick={() => setIsEditing(true)}>
                Edit
            </button>
            <label className="skill-map-xp">
                <span>{selectedSkill.xp ?? 0} XP</span>
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={selectedSkill.xp ?? 0}
                    onChange={(event) => onXpChange(selectedSkill, Number(event.target.value))}
                    aria-label={`${selectedSkill.name} XP`}
                />
            </label>
            <div className="skill-map-prereqs">
                <span className="skill-map-label">Prerequisites</span>
                {prerequisites.length === 0 && (
                    <p className="skill-map-empty-note">None yet. Connect it on the map.</p>
                )}
                <ul>
                    {prerequisites.map((prerequisite) => (
                        <li key={prerequisite.id}>
                            {prerequisite.name}
                            <button
                                type="button"
                                aria-label={`Remove ${prerequisite.name} as a prerequisite`}
                                onClick={() => onRemovePrerequisite(selectedSkill, prerequisite.id)}
                            >
                                ×
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
            {isEditing && (
                <NodeEditPage
                    skill={selectedSkill}
                    onCancel={() => setIsEditing(false)}
                    onSave={(updates) => {
                        onEditSave(selectedSkill, updates);
                        setIsEditing(false);
                    }}
                />
            )}
        </aside>
    );
}
