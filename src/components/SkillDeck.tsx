import { type FormEvent, useState } from 'react';
import type { Skill } from '../domain/skillBoard';

type SkillDeckProps = {
    skills: Skill[];
    onAddSkill: (name: string) => void;
};

export function SkillDeck({ skills, onAddSkill }: SkillDeckProps) {
    const [showCreate, setShowCreate] = useState(false);
    const [name, setName] = useState('');

    const createSkill = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const normalizedName = name.trim();
        if (!normalizedName) return;
        onAddSkill(normalizedName);
        setName('');
        setShowCreate(false);
    };

    return (
        <section className="skill-deck" aria-label="Skills">
            <div className="skill-deck-intro">
                <div>
                    <p className="eyebrow">SKILL LIBRARY</p>
                    <h2>Build the abilities behind your direction.</h2>
                    <p>
                        Keep every Skill here. Use Map to arrange relationships and track progress.
                    </p>
                </div>
                <span className="skill-count">{skills.length} skills</span>
            </div>
            <div className="skill-deck-header">
                <div>
                    <span className="eyebrow">YOUR SKILLS</span>
                    <h3>Add the next capability you want to develop.</h3>
                </div>
                <button
                    className="create-skill-button"
                    type="button"
                    onClick={() => setShowCreate((visible) => !visible)}
                >
                    {showCreate ? 'Close' : 'Add a Skill'}
                </button>
            </div>
            {showCreate && (
                <form className="skill-create-form" onSubmit={createSkill}>
                    <label htmlFor="new-skill-name">Skill name</label>
                    <div>
                        <input
                            id="new-skill-name"
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            placeholder="e.g. Facilitation"
                        />
                        <button type="submit">Add Skill</button>
                    </div>
                </form>
            )}
            <div className="skill-deck-list">
                {skills.length === 0 && (
                    <p className="skill-empty">No Skills yet. Add the first one.</p>
                )}
                {skills.map((skill) => (
                    <article className="skill-library-item" key={skill.id}>
                        <div>
                            <h3>{skill.name}</h3>
                            <p>
                                {skill.status ?? 'new'} · {skill.xp ?? 0} XP
                            </p>
                        </div>
                        <span>Level {skill.level ?? 1}</span>
                    </article>
                ))}
            </div>
        </section>
    );
}
