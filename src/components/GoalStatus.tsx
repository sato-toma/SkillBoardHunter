import type { Skill } from '../domain/skillBoard';

type GoalStatusProps = {
    requiredSkills: Skill[];
    goalProgress: number;
    goalUnlocked: boolean;
};

export function GoalStatus({ requiredSkills, goalProgress, goalUnlocked }: GoalStatusProps) {
    return (
        <section className="goal-status" aria-label="Goal progress">
            <div className="goal-status-title">
                <span className="eyebrow">CURRENT GOAL</span>
                <strong>{goalUnlocked ? 'GOAL UNLOCKED' : 'GOAL LOCKED'}</strong>
            </div>
            <progress max="100" value={goalProgress} />
            <div className="goal-chips">
                {requiredSkills.map((skill) => (
                    <span key={skill.id}>
                        {skill.name} · {skill.xp ?? 0}%
                    </span>
                ))}
            </div>
        </section>
    );
}
