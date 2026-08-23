import type { Goal } from '../domain/skillBoard';

type AppHeaderProps = {
    goal?: Goal;
    onLoadSample: () => void;
};

export function AppHeader({ goal, onLoadSample }: AppHeaderProps) {
    return (
        <header className="app-header">
            <div>
                <p className="eyebrow">SKILL PROGRESSION</p>
                <h1>{goal?.title ?? 'SkillBoard Hunter'}</h1>
                <p>{goal?.vision ?? 'Goalを読み込み、Skillを積み上げて進みます。'}</p>
            </div>
            <button className="sample-button" type="button" onClick={onLoadSample}>
                Load sample
            </button>
        </header>
    );
}
