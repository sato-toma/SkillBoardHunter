import { useEffect, useState, type FormEvent } from "react";
import { useAppDispatch, useAppSelector } from "./store/hooks";
import {
    addSkillRequested,
    appStarted,
    removeSkillRequested,
} from "./store/skillBoardSlice";
import "./App.css";

function App() {
    const dispatch = useAppDispatch();
    const [name, setName] = useState("");
    const skills = useAppSelector((state) => state.skillBoard.board.skills);
    const errorMessage = useAppSelector(
        (state) => state.skillBoard.errorMessage,
    );

    useEffect(() => {
        dispatch(appStarted());
    }, [dispatch]);

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        dispatch(addSkillRequested({ name }));
        setName("");
    };

    const handleDelete = (id: string) => {
        dispatch(removeSkillRequested({ id }));
    };

    return (
        <main className="app-shell">
            <header>
                <h1>SkillBoard Hunter</h1>
                <p>Skillを登録し、ローカル保存で管理します。</p>
            </header>

            <section className="skill-panel" aria-label="Skill登録">
                <form className="skill-form" onSubmit={handleSubmit}>
                    <label htmlFor="skill-name">Skill名</label>
                    <div className="form-row">
                        <input
                            id="skill-name"
                            name="skill-name"
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            placeholder="例: TypeScript"
                        />
                        <button type="submit">登録</button>
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
                        <li key={skill.id}>
                            <span>{skill.name}</span>
                            <button
                                type="button"
                                onClick={() => handleDelete(skill.id)}
                            >
                                削除
                            </button>
                        </li>
                    ))}
                </ul>
            </section>
        </main>
    );
}

export default App;
