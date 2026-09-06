import { useState } from 'react';
import {
    focusParents,
    type Goal,
    isSkillUnlocked,
    type Skill,
    type SkillNote,
    type SkillStatus,
} from '../domain/skillBoard';
import { NodeEditPage } from './NodeEditPage';

type SkillMapDetailProps = {
    selectedSkill: Skill | undefined;
    skills: Skill[];
    goals: Goal[];
    onXpChange: (skill: Skill, xp: number) => void;
    onRemovePrerequisite: (skill: Skill, prerequisiteId: string) => void;
    onEditSave: (
        skill: Skill,
        updates: { name: string; status: SkillStatus; notes: SkillNote[] },
    ) => void;
};

export function SkillMapDetail({
    selectedSkill,
    skills,
    goals,
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
    const dependents = focusParents(selectedSkill.id, skills, []).filter(
        (node) => node.kind === 'skill',
    );
    const relatedGoals = focusParents(selectedSkill.id, [], goals).filter(
        (node) => node.kind === 'goal',
    );

    return (
        <aside className="skill-map-detail" aria-label="Selected Skill">
            <div className="skill-map-detail-heading">
                <h3>{selectedSkill.name}</h3>
                <span className={unlocked ? 'state-badge unlocked' : 'state-badge locked'}>
                    {unlocked ? 'UNLOCKED' : 'LOCKED'}
                </span>
            </div>
            <button
                type="button"
                className="skill-map-edit-button"
                onClick={() => setIsEditing(true)}
            >
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
            <div className="skill-map-progress">
                <span className="skill-map-label">Achievement</span>
                <span>
                    Level {selectedSkill.level ?? 1} · {selectedSkill.status ?? 'new'}
                </span>
            </div>
            {(selectedSkill.notes ?? []).length > 0 && (
                <div className="skill-map-notes">
                    <span className="skill-map-label">Notes</span>
                    {(selectedSkill.notes ?? []).map((note) => (
                        <article key={note.id}>
                            <p>{note.content}</p>
                            {note.links.length > 0 && (
                                <ul>
                                    {note.links.map((link) => (
                                        <li key={link.id}>
                                            <a href={link.url} target="_blank" rel="noreferrer">
                                                {link.label}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </article>
                    ))}
                </div>
            )}
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
            <div className="skill-map-related">
                <span className="skill-map-label">Next Skills</span>
                {dependents.length ? (
                    <ul>
                        {dependents.map((skill) => (
                            <li key={skill.id}>{skill.name}</li>
                        ))}
                    </ul>
                ) : (
                    <p className="skill-map-empty-note">None directly connected.</p>
                )}
            </div>
            <div className="skill-map-related">
                <span className="skill-map-label">Related Goals</span>
                {relatedGoals.length ? (
                    <ul>
                        {relatedGoals.map((goal) => (
                            <li key={goal.id}>{goal.name}</li>
                        ))}
                    </ul>
                ) : (
                    <p className="skill-map-empty-note">None directly connected.</p>
                )}
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
