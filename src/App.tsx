import { useEffect, useState, type FormEvent } from "react";
import { levelFromXp, type SkillStatus } from "./domain/skillBoard";
import { useAppDispatch, useAppSelector } from "./store/hooks";
import {
    addSkillRequested,
    appStarted,
    removeSkillRequested,
    updateGoalRequested,
    updateSkillRequested,
} from "./store/skillBoardSlice";
import "./App.css";

function App() {
    const dispatch = useAppDispatch();
    const [name, setName] = useState("");
    const [goalTitle, setGoalTitle] = useState("");
    const [goalVision, setGoalVision] = useState("");
    const [requiredSkillIds, setRequiredSkillIds] = useState<string[]>([]);
    const board = useAppSelector((state) => state.skillBoard.board);
    const skills = board.skills;
    const goal = board.goals?.[0];
    const errorMessage = useAppSelector(
        (state) => state.skillBoard.errorMessage,
    );

    useEffect(() => {
        dispatch(appStarted());
    }, [dispatch]);

    useEffect(() => {
        setGoalTitle(goal?.title ?? "");
        setGoalVision(goal?.vision ?? "");
        setRequiredSkillIds(goal?.requiredSkillIds ?? []);
    }, [goal?.title, goal?.vision, goal?.requiredSkillIds]);

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        dispatch(addSkillRequested({ name }));
        setName("");
    };

    const handleDelete = (id: string) => {
        dispatch(removeSkillRequested({ id }));
    };

    const handleGoalSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        dispatch(
            updateGoalRequested({
                title: goalTitle,
                vision: goalVision,
                requiredSkillIds,
            }),
        );
    };

    const handleSkillChange = (id: string, xp: number, status: SkillStatus) => {
        dispatch(updateSkillRequested({ id, xp, status }));
    };

    return (
        <main className="app-shell">
            <header className="app-header">
                <div>
                    <p className="eyebrow">PERSONAL SKILL BOARD</p>
                    <h1>SkillBoard Hunter</h1>
                    <p>目標から逆算して、いま育てているSkillを見渡します。</p>
                </div>
                <span className="local-badge">LOCAL FIRST</span>
            </header>

            <section className="goal-panel" aria-label="Goal設定">
                <div className="section-heading">
                    <p className="eyebrow">NORTH STAR</p>
                    <h2>目指す世界</h2>
                </div>
                <form className="goal-form" onSubmit={handleGoalSubmit}>
                    <input
                        aria-label="Goal名"
                        value={goalTitle}
                        onChange={(event) => setGoalTitle(event.target.value)}
                        placeholder="例: 自分のプロダクトを届ける"
                    />
                    <textarea
                        aria-label="Goalの説明"
                        value={goalVision}
                        onChange={(event) => setGoalVision(event.target.value)}
                        placeholder="どんな世界を実現したいか、何をやりたいか"
                        rows={2}
                    />
                    <fieldset className="required-skills">
                        <legend>このGoalに必要なSkill</legend>
                        {skills.length === 0 && (
                            <span>先にSkillを追加してください。</span>
                        )}
                        {skills.map((skill) => (
                            <label key={skill.id}>
                                <input
                                    type="checkbox"
                                    checked={requiredSkillIds.includes(
                                        skill.id,
                                    )}
                                    onChange={(event) =>
                                        setRequiredSkillIds((current) =>
                                            event.target.checked
                                                ? [...current, skill.id]
                                                : current.filter(
                                                      (id) => id !== skill.id,
                                                  ),
                                        )
                                    }
                                />
                                {skill.name}
                            </label>
                        ))}
                    </fieldset>
                    <button type="submit">Goalを更新</button>
                </form>
                {goal && (goal.requiredSkillIds?.length ?? 0) > 0 && (
                    <div className="goal-links">
                        <strong>必要なSkill</strong>
                        <div>
                            {goal.requiredSkillIds
                                ?.map(
                                    (skillId) =>
                                        skills.find(
                                            (skill) => skill.id === skillId,
                                        )?.name,
                                )
                                .filter(Boolean)
                                .map((skillName) => (
                                    <span key={skillName}>{skillName}</span>
                                ))}
                        </div>
                    </div>
                )}
            </section>

            <section className="skill-panel" aria-label="Skillボード">
                <div className="section-heading board-heading">
                    <div>
                        <p className="eyebrow">THE PATH</p>
                        <h2>必要なSkill</h2>
                    </div>
                    <span className="skill-count">{skills.length} SKILLS</span>
                </div>
                <form className="skill-form" onSubmit={handleSubmit}>
                    <div className="form-row">
                        <input
                            id="skill-name"
                            name="skill-name"
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            placeholder="例: TypeScript"
                        />
                        <button type="submit">Skillを追加</button>
                    </div>
                </form>

                {errorMessage && (
                    <p role="alert" className="error-text">
                        {errorMessage}
                    </p>
                )}

                <ul className="skill-list" aria-label="Skill一覧">
                    {skills.length === 0 && (
                        <li className="empty">
                            まだSkillは登録されていません。
                        </li>
                    )}
                    {skills.map((skill) => (
                        <li key={skill.id} className="skill-card">
                            <div className="skill-card-header">
                                <div>
                                    <span className="skill-index">
                                        {String(
                                            skills.indexOf(skill) + 1,
                                        ).padStart(2, "0")}
                                    </span>
                                    <h3>{skill.name}</h3>
                                </div>
                                <button
                                    className="delete-button"
                                    type="button"
                                    onClick={() => handleDelete(skill.id)}
                                >
                                    削除
                                </button>
                            </div>
                            <div className="skill-meta">
                                <strong>
                                    LEVEL {levelFromXp(skill.xp ?? 0)}
                                </strong>
                                <span>{skill.xp ?? 0} XP</span>
                            </div>
                            <label className="xp-control">
                                <span>経験値</span>
                                <input
                                    aria-label={`${skill.name}の経験値`}
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={skill.xp ?? 0}
                                    onChange={(event) =>
                                        handleSkillChange(
                                            skill.id,
                                            Number(event.target.value),
                                            skill.status ?? "new",
                                        )
                                    }
                                />
                            </label>
                            <label className="status-control">
                                状態
                                <select
                                    aria-label={`${skill.name}の状態`}
                                    value={skill.status ?? "new"}
                                    onChange={(event) =>
                                        handleSkillChange(
                                            skill.id,
                                            skill.xp ?? 0,
                                            event.target.value as SkillStatus,
                                        )
                                    }
                                >
                                    <option value="new">未経験</option>
                                    <option value="learning">学習中</option>
                                    <option value="practicing">実践中</option>
                                    <option value="mastered">熟練</option>
                                </select>
                            </label>
                        </li>
                    ))}
                </ul>
            </section>
        </main>
    );
}

export default App;
