import type { Goal } from '../domain/skillBoard';

type GoalsViewProps = {
    goals: Goal[];
};

export function GoalsView({ goals }: GoalsViewProps) {
    return (
        <section className="workspace-view" aria-label="Goals">
            <div className="workspace-view-heading">
                <span className="eyebrow">GOAL JOURNAL</span>
                <h2>Choose the world you want to make real.</h2>
                <p>Goals give your map a direction. Quest creation belongs in the Quests view.</p>
            </div>
            {goals.map((goal) => (
                <article className="workspace-record" key={goal.id}>
                    <span className="eyebrow">CURRENT DIRECTION</span>
                    <h3>{goal.title}</h3>
                    <p>{goal.vision}</p>
                    <strong>{goal.requiredSkillIds?.length ?? 0} Skills shape this path</strong>
                </article>
            ))}
        </section>
    );
}
