import { type FormEvent, useState } from 'react';
import type { Evidence, Quest, QuestDifficulty, Skill } from '../domain/skillBoard';

type GrowthQuestDeckProps = {
    goal?: { id: string; title: string; vision?: string };
    skills: Skill[];
    quests: Quest[];
    evidence: Evidence[];
    levelUp: {
        skillName: string;
        capability: string;
        nextSkills: string[];
    } | null;
    onAddQuest: (quest: Quest) => void;
    onCompleteQuest: (questId: string, evidence: Evidence) => void;
    onDismissLevelUp: () => void;
};

const newId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export function GrowthQuestDeck({
    goal,
    skills,
    quests,
    evidence,
    levelUp,
    onAddQuest,
    onCompleteQuest,
    onDismissLevelUp,
}: GrowthQuestDeckProps) {
    const [showCreate, setShowCreate] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [criteria, setCriteria] = useState('');
    const [difficulty, setDifficulty] = useState<QuestDifficulty>('medium');
    const [expectedXp, setExpectedXp] = useState(20);
    const [skillId, setSkillId] = useState(skills[0]?.id ?? '');
    const [activeQuestId, setActiveQuestId] = useState<string | null>(null);
    const [proof, setProof] = useState('');
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

    const createQuest = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!title.trim() || !description.trim() || !criteria.trim() || !skillId) return;
        onAddQuest({
            id: newId(),
            goalId: goal?.id,
            title: title.trim(),
            description: description.trim(),
            requiredActions: [],
            difficulty,
            expectedXp,
            relatedSkillIds: [skillId],
            completionCriteria: criteria.trim(),
            status: 'open',
        });
        setTitle('');
        setDescription('');
        setCriteria('');
        setShowCreate(false);
    };

    const completeQuest = (event: FormEvent<HTMLFormElement>, quest: Quest) => {
        event.preventDefault();
        if (!proof.trim() || !date) return;
        onCompleteQuest(quest.id, {
            id: newId(),
            source: 'manual',
            date,
            description: proof.trim(),
            relatedSkillId: quest.relatedSkillIds[0] ?? '',
            xp: quest.expectedXp,
            confidence: 'medium',
        });
        setProof('');
        setActiveQuestId(null);
    };

    const openQuests = quests.filter((quest) => quest.status === 'open');
    const completedQuests = quests.filter((quest) => quest.status === 'completed');

    return (
        <section className="quest-deck" aria-label="Quest progression">
            <div className="quest-deck-intro">
                <div>
                    <p className="eyebrow">THE NEXT MOVE</p>
                    <h2>{goal?.title ?? 'Choose a direction'}</h2>
                    <p>{goal?.vision ?? 'Your map begins with one meaningful move.'}</p>
                </div>
                <div className="quest-deck-stats">
                    <span>{evidence.length} evidence</span>
                    <span>{completedQuests.length} quests cleared</span>
                </div>
            </div>
            {levelUp && (
                <aside className="level-up-panel" aria-live="polite">
                    <div className="level-up-mark">LEVEL UP</div>
                    <div>
                        <p className="eyebrow">NEW CAPABILITY</p>
                        <h3>{levelUp.skillName}</h3>
                        <p>{levelUp.capability}</p>
                        {levelUp.nextSkills.length > 0 && (
                            <p className="next-paths">
                                The map now points toward {levelUp.nextSkills.join(', ')}.
                            </p>
                        )}
                    </div>
                    <button type="button" onClick={onDismissLevelUp} aria-label="Dismiss level up">
                        Continue
                    </button>
                </aside>
            )}
            <div className="quest-deck-header">
                <div>
                    <span className="eyebrow">QUEST DECK</span>
                    <h3>Make progress you can point to.</h3>
                </div>
                <button
                    className="create-quest-button"
                    type="button"
                    onClick={() => setShowCreate((visible) => !visible)}
                >
                    {showCreate ? 'Close' : 'New Quest'}
                </button>
            </div>
            {showCreate && (
                <form className="quest-create-form" onSubmit={createQuest}>
                    <input
                        aria-label="Quest title"
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                        placeholder="What would make your Goal more real?"
                    />
                    <textarea
                        aria-label="Quest description"
                        value={description}
                        onChange={(event) => setDescription(event.target.value)}
                        placeholder="Describe the change you want to cause."
                        rows={3}
                    />
                    <textarea
                        aria-label="Completion criteria"
                        value={criteria}
                        onChange={(event) => setCriteria(event.target.value)}
                        placeholder="What will exist when this is done?"
                        rows={2}
                    />
                    <div className="quest-create-controls">
                        <label>
                            Skill
                            <select
                                value={skillId}
                                onChange={(event) => setSkillId(event.target.value)}
                            >
                                {skills.map((skill) => (
                                    <option key={skill.id} value={skill.id}>
                                        {skill.name}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label>
                            Difficulty
                            <select
                                value={difficulty}
                                onChange={(event) =>
                                    setDifficulty(event.target.value as QuestDifficulty)
                                }
                            >
                                <option value="easy">Easy</option>
                                <option value="medium">Medium</option>
                                <option value="hard">Hard</option>
                            </select>
                        </label>
                        <label>
                            XP
                            <input
                                type="number"
                                min="1"
                                max="100"
                                value={expectedXp}
                                onChange={(event) => setExpectedXp(Number(event.target.value))}
                            />
                        </label>
                    </div>
                    <button type="submit">Place Quest</button>
                </form>
            )}
            <div className="quest-cards">
                {openQuests.length === 0 && (
                    <p className="quest-empty">
                        No open Quests yet. Create one that changes something outside this screen.
                    </p>
                )}
                {openQuests.map((quest) => {
                    const skill = skills.find((candidate) =>
                        quest.relatedSkillIds.includes(candidate.id),
                    );
                    return (
                        <article className="quest-card" key={quest.id}>
                            <div className="quest-card-top">
                                <span className="quest-number">NEXT QUEST</span>
                                <strong>+{quest.expectedXp} XP</strong>
                            </div>
                            <h4>{quest.title}</h4>
                            <p>{quest.description}</p>
                            <div className="quest-card-footer">
                                <span>{skill?.name ?? 'Unknown Skill'}</span>
                                <span>{quest.difficulty}</span>
                                <span>{quest.completionCriteria}</span>
                            </div>
                            {activeQuestId === quest.id ? (
                                <form
                                    className="proof-form"
                                    onSubmit={(event) => completeQuest(event, quest)}
                                >
                                    <textarea
                                        aria-label="Evidence"
                                        value={proof}
                                        onChange={(event) => setProof(event.target.value)}
                                        placeholder="What did you actually make, test, publish, or share?"
                                        rows={3}
                                    />
                                    <label>
                                        Date
                                        <input
                                            type="date"
                                            value={date}
                                            onChange={(event) => setDate(event.target.value)}
                                        />
                                    </label>
                                    <button type="submit">Claim Progress</button>
                                </form>
                            ) : (
                                <button
                                    className="claim-button"
                                    type="button"
                                    onClick={() => setActiveQuestId(quest.id)}
                                >
                                    I did this
                                </button>
                            )}
                        </article>
                    );
                })}
            </div>
        </section>
    );
}
