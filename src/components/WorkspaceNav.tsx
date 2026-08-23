type WorkspaceView = 'map' | 'quests' | 'goals';

type WorkspaceNavProps = {
    activeView: WorkspaceView;
    openQuestCount: number;
    onViewChange: (view: WorkspaceView) => void;
};

export function WorkspaceNav({ activeView, openQuestCount, onViewChange }: WorkspaceNavProps) {
    const items = [
        ['map', 'Map', 'Your territory'],
        ['quests', 'Quests', `${openQuestCount} open`],
        ['goals', 'Goals', 'What comes next'],
    ] as const;

    return (
        <nav className="workspace-nav" aria-label="Workspace navigation">
            <div className="workspace-brand">
                <span className="eyebrow">SKILLBOARD</span>
                <strong>Hunter</strong>
            </div>
            {items.map(([view, label, detail]) => (
                <button
                    className={
                        activeView === view ? 'workspace-nav-item active' : 'workspace-nav-item'
                    }
                    key={view}
                    type="button"
                    onClick={() => onViewChange(view)}
                >
                    <span>{label}</span>
                    <small>{detail}</small>
                </button>
            ))}
        </nav>
    );
}
