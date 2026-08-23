import { useEffect, useState } from "react";
import type { SkillStatus } from "./domain/skillBoard";
import { SkillDetailPanel } from "./components/SkillDetailPanel";
import { SkillNodeList } from "./components/SkillNodeList";
import { useAppDispatch, useAppSelector } from "./store/hooks";
import {
    addSkillRequested,
    appStarted,
    loadSampleRequested,
    updateSkillDependenciesRequested,
    updateSkillRequested,
} from "./store/skillBoardSlice";
import "./App.css";

function App() {
    const dispatch = useAppDispatch();
    const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<"tree" | "board">("tree");
    const board = useAppSelector((state) => state.skillBoard.board);
    const skills = board.skills;
    const goal = board.goals?.[0];
    const requiredSkills = (goal?.requiredSkillIds ?? [])
        .map((id) => skills.find((skill) => skill.id === id))
        .filter((skill): skill is (typeof skills)[number] => Boolean(skill));
    const selectedSkill = skills.find((skill) => skill.id === selectedSkillId);
    const isSkillUnlocked = (skill: (typeof skills)[number]) =>
        (skill.xp ?? 0) > 0 &&
        (skill.prerequisiteSkillIds ?? []).every(
            (id) =>
                (skills.find((candidate) => candidate.id === id)?.xp ?? 0) >=
                60,
        );
    const missingPrerequisites = (skill: (typeof skills)[number]) =>
        (skill.prerequisiteSkillIds ?? [])
            .map((id) => skills.find((candidate) => candidate.id === id))
            .filter(
                (candidate): candidate is (typeof skills)[number] =>
                    candidate !== undefined && (candidate.xp ?? 0) < 60,
            );
    const dependentSkills = selectedSkill
        ? skills.filter((skill) =>
              skill.prerequisiteSkillIds?.includes(selectedSkill.id),
          )
        : [];
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

    const handleSkillChange = (id: string, xp: number, status: SkillStatus) => {
        dispatch(updateSkillRequested({ id, xp, status }));
    };

    const handleAddSibling = (name: string) => {
        if (!selectedSkill) return;
        dispatch(
            addSkillRequested({
                name,
                prerequisiteSkillIds: selectedSkill.prerequisiteSkillIds,
            }),
        );
    };

    const handleCommit = (skill: (typeof skills)[number]) => {
        handleSkillChange(
            skill.id,
            Math.min(100, (skill.xp ?? 0) + 10),
            "practicing",
        );
    };

    const handleUnlock = (skill: (typeof skills)[number]) => {
        if (missingPrerequisites(skill).length > 0) return;
        handleSkillChange(skill.id, 100, skill.status ?? "learning");
    };

    return (
        <main className="app-shell product-shell">
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
            <section
                className="progression-panel"
                aria-label="Skill progression"
            >
                <div
                    className="mode-tabs"
                    role="tablist"
                    aria-label="Progression mode"
                >
                    {(["tree", "board"] as const).map((mode) => (
                        <button
                            className={
                                viewMode === mode
                                    ? "mode-tab active"
                                    : "mode-tab"
                            }
                            key={mode}
                            type="button"
                            onClick={() => setViewMode(mode)}
                        >
                            {mode === "tree" ? "Git Tree" : "Skill Board"}
                        </button>
                    ))}
                </div>
                {selectedSkill && (
                    <SkillDetailPanel
                        selectedSkill={selectedSkill}
                        skills={skills}
                        viewMode={viewMode}
                        dependentSkills={dependentSkills}
                        missingPrerequisites={missingPrerequisites(
                            selectedSkill,
                        )}
                        isUnlocked={isSkillUnlocked}
                        onXpChange={(skill, xp) =>
                            handleSkillChange(
                                skill.id,
                                xp,
                                skill.status ?? "new",
                            )
                        }
                        onCommit={() => handleCommit(selectedSkill)}
                        onDependencyChange={(skill, prerequisiteSkillIds) =>
                            dispatch(
                                updateSkillDependenciesRequested({
                                    id: skill.id,
                                    prerequisiteSkillIds,
                                }),
                            )
                        }
                        onUnlock={handleUnlock}
                        onAddSibling={handleAddSibling}
                    />
                )}
                {errorMessage && (
                    <p role="alert" className="error-text">
                        {errorMessage}
                    </p>
                )}

                <SkillNodeList
                    skills={skills}
                    viewMode={viewMode}
                    selectedSkillId={selectedSkillId}
                    onSelect={(skill) => setSelectedSkillId(skill.id)}
                />
            </section>
        </main>
    );
}

export default App;
