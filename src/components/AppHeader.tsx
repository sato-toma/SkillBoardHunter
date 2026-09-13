import type { Goal } from '../domain/skillBoard';

type AppHeaderProps = {
    goal?: Goal;
    onLoadSample: () => void;
    onExport: () => void;
    onImport: (file: File) => void;
    errorMessage: string | null;
};

export function AppHeader({
    goal,
    onLoadSample,
    onExport,
    onImport,
    errorMessage,
}: AppHeaderProps) {
    return (
        <header className="app-header">
            <div>
                <p className="eyebrow">SKILL PROGRESSION</p>
                <h1>{goal?.title ?? 'SkillBoard Hunter'}</h1>
                <p>{goal?.vision ?? 'Goalを読み込み、Skillを積み上げて進みます。'}</p>
            </div>
            <div className="app-header-actions">
                <button className="sample-button" type="button" onClick={onLoadSample}>
                    Load sample
                </button>
                <button className="sample-button" type="button" onClick={onExport}>
                    Export TOML
                </button>
                <label className="sample-button">
                    Import TOML
                    <input
                        type="file"
                        accept=".toml,text/plain"
                        hidden
                        onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file) onImport(file);
                            event.target.value = '';
                        }}
                    />
                </label>
                {errorMessage && <p className="app-header-error">{errorMessage}</p>}
            </div>
        </header>
    );
}
