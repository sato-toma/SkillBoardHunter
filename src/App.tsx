import { useEffect, useState } from "react";
import { GrowthQuestDeck } from "./components/GrowthQuestDeck";
import { SkillMap } from "./components/SkillMap";
import { SkillMapDetail } from "./components/SkillMapDetail";
import { useAppDispatch, useAppSelector } from "./store/hooks";
import {
    addSkillRequested,
    appStarted,
    clearLevelUp,
    loadSampleRequested,
    questAdded,
    questCompleted,
    updateSkillDependenciesRequested,
    updateSkillPositionRequested,
    updateSkillRequested,
} from "./store/skillBoardSlice";
import "./App.css";

function App() {
    const dispatch = useAppDispatch();
    const [activeView, setActiveView] = useState<"map" | "quests" | "goals">(
        "map",
    );
    const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);
    const board = useAppSelector((state) => state.skillBoard.board);
    const skills = board.skills;
    const goal = board.goals?.[0];
    const requiredSkills = (goal?.requiredSkillIds ?? [])
        .map((id) => skills.find((skill) => skill.id === id))
        .filter((skill): skill is (typeof skills)[number] => Boolean(skill));
    const selectedSkill = skills.find((skill) => skill.id === selectedSkillId);
    const goalProgress = requiredSkills.length
        ? Math.round(
              requiredSkills.reduce(
                  (total, skill) => total + (skill.xp ?? 0),
                  0,
              ) / requiredSkills.length,
          )
        : 0;
    const goalUnlocked =
        requiredSkills.length > 0 &&
        requiredSkills.every((skill) => (skill.xp ?? 0) >= 60);
    const errorMessage = useAppSelector(
        (state) => state.skillBoard.errorMessage,
    );
    const quests = useAppSelector((state) => state.skillBoard.quests ?? []);
    const evidence = useAppSelector((state) => state.skillBoard.evidence ?? []);
    const lastLevelUp = useAppSelector(
        (state) => state.skillBoard.lastLevelUp ?? null,
    );

    useEffect(() => {
        dispatch(appStarted());
    }, [dispatch]);

    useEffect(() => {
        if (!selectedSkillId && skills[0]) {
            setSelectedSkillId(skills[0].id);
        }
        if (
            selectedSkillId &&
            !skills.some((skill) => skill.id === selectedSkillId)
        ) {
            setSelectedSkillId(skills[0]?.id ?? null);
        }
    }, [skills, selectedSkillId]);

    const handleToggleLink = (fromId: string, toId: string) => {
        const target = skills.find((skill) => skill.id === toId);
        if (!target || fromId === toId) return;
        const current = target.prerequisiteSkillIds ?? [];
        const next = current.includes(fromId)
            ? current.filter((id) => id !== fromId)
            : [...current, fromId];
        dispatch(
            updateSkillDependenciesRequested({
                id: toId,
                prerequisiteSkillIds: next,
            }),
        );
    };

    const handleQuickAdd = (name: string) => {
        if (!selectedSkill) return;
        const offsetX = (selectedSkill.layoutX ?? 460) + 120;
        const offsetY = (selectedSkill.layoutY ?? 260) + 60;
        dispatch(
            addSkillRequested({
                name,
                prerequisiteSkillIds: [selectedSkill.id],
                layoutX: offsetX,
                layoutY: offsetY,
            }),
        );
    };

    return (
        <main className="app-shell product-shell">
            <nav className="workspace-nav" aria-label="Workspace navigation">
                <div className="workspace-brand">
                    <span className="eyebrow">SKILLBOARD</span>
                    <strong>Hunter</strong>
                </div>
                {(
                    [
                        ["map", "Map", "Your territory"],
                        [
                            "quests",
                            "Quests",
                            `${quests.filter((quest) => quest.status === "open").length} open`,
                        ],
                        ["goals", "Goals", "What comes next"],
                    ] as const
                ).map(([view, label, detail]) => (
                    <button
                        className={
                            activeView === view
                                ? "workspace-nav-item active"
                                : "workspace-nav-item"
                        }
                        key={view}
                        type="button"
                        onClick={() => setActiveView(view)}
                    >
                        <span>{label}</span>
                        <small>{detail}</small>
                    </button>
                ))}
            </nav>
            <header className="app-header">
                <div>
                    <p className="eyebrow">SKILL PROGRESSION</p>
                    <h1>{goal?.title ?? "SkillBoard Hunter"}</h1>
                    <p>
                        {goal?.vision ??
                            "Goalを読み込み、Skillを積み上げて進みます。"}
                    </p>
                </div>
                <button
                    className="sample-button"
                    type="button"
                    onClick={() => dispatch(loadSampleRequested())}
                >
                    Load sample
                </button>
            </header>
            {activeView === "quests" && (
                <GrowthQuestDeck
                    goal={goal}
                    skills={skills}
                    quests={quests}
                    evidence={evidence}
                    levelUp={lastLevelUp}
                    onAddQuest={(quest) => dispatch(questAdded(quest))}
                    onCompleteQuest={(questId, questEvidence) =>
                        dispatch(
                            questCompleted({
                                questId,
                                evidence: questEvidence,
                            }),
                        )
                    }
                    onDismissLevelUp={() => dispatch(clearLevelUp())}
                />
            )}
            {(activeView === "map" || activeView === "goals") && (
                <section className="goal-status" aria-label="Goal progress">
                    <div className="goal-status-title">
                        <span className="eyebrow">CURRENT GOAL</span>
                        <strong>
                            {goalUnlocked ? "GOAL UNLOCKED" : "GOAL LOCKED"}
                        </strong>
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
            )}
            {activeView === "map" && (
                <section className="skill-map-panel" aria-label="Skill map">
                    <SkillMap
                        skills={skills}
                        selectedSkillId={selectedSkillId}
                        onSelect={setSelectedSkillId}
                        onToggleLink={handleToggleLink}
                        onMove={(id, x, y) =>
                            dispatch(
                                updateSkillPositionRequested({
                                    id,
                                    layoutX: x,
                                    layoutY: y,
                                }),
                            )
                        }
                    />
                    <SkillMapDetail
                        selectedSkill={selectedSkill}
                        skills={skills}
                        onXpChange={(skill, xp) =>
                            dispatch(
                                updateSkillRequested({
                                    id: skill.id,
                                    xp,
                                    status: skill.status ?? "new",
                                }),
                            )
                        }
                        onRemovePrerequisite={(skill, prerequisiteId) =>
                            dispatch(
                                updateSkillDependenciesRequested({
                                    id: skill.id,
                                    prerequisiteSkillIds: (
                                        skill.prerequisiteSkillIds ?? []
                                    ).filter((id) => id !== prerequisiteId),
                                }),
                            )
                        }
                        onQuickAdd={handleQuickAdd}
                    />
                    {errorMessage && (
                        <p role="alert" className="error-text">
                            {errorMessage}
                        </p>
                    )}
                </section>
            )}
            {activeView === "goals" && (
                <section className="workspace-view" aria-label="Goals">
                    <div className="workspace-view-heading">
                        <span className="eyebrow">GOAL JOURNAL</span>
                        <h2>Choose the world you want to make real.</h2>
                        <p>
                            Goals give your map a direction. Quest creation
                            belongs in the Quests view.
                        </p>
                    </div>
                    {(board.goals ?? []).map((currentGoal) => (
                        <article
                            className="workspace-record"
                            key={currentGoal.id}
                        >
                            <span className="eyebrow">CURRENT DIRECTION</span>
                            <h3>{currentGoal.title}</h3>
                            <p>{currentGoal.vision}</p>
                            <strong>
                                {currentGoal.requiredSkillIds?.length ?? 0}{" "}
                                Skills shape this path
                            </strong>
                        </article>
                    ))}
                </section>
            )}
        </main>
    );
}

export default App;
