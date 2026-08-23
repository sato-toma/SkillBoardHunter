import { useState } from "react";
import { levelFromXp, type Skill } from "../domain/skillBoard";

type SkillDetailPanelProps = {
    selectedSkill: Skill;
    skills: Skill[];
    viewMode: "board" | "tree" | "graph";
    dependentSkills: Skill[];
    missingPrerequisites: Skill[];
    isUnlocked: (skill: Skill) => boolean;
    onXpChange: (skill: Skill, xp: number) => void;
    onCommit: () => void;
    onDependencyChange: (skill: Skill, prerequisiteSkillIds: string[]) => void;
    onUnlock: (skill: Skill) => void;
    onAddSibling: (name: string) => void;
};

export function SkillDetailPanel({
    selectedSkill,
    skills,
    viewMode,
    dependentSkills,
    missingPrerequisites,
    isUnlocked,
    onXpChange,
    onCommit,
    onDependencyChange,
    onUnlock,
    onAddSibling,
}: SkillDetailPanelProps) {
    const [siblingName, setSiblingName] = useState("");
    const unlocked = isUnlocked(selectedSkill);
    const prerequisites = selectedSkill.prerequisiteSkillIds ?? [];

    return (
        <aside className="skill-detail" aria-label="選択したSkillの詳細">
            <div className="skill-detail-header">
                <div>
                    <p className="eyebrow">SELECTED NODE</p>
                    <h3>{selectedSkill.name}</h3>
                </div>
                <strong
                    className={
                        unlocked
                            ? "unlock-state unlocked"
                            : "unlock-state locked"
                    }
                >
                    {unlocked ? "UNLOCKED" : "LOCKED"}
                </strong>
            </div>
            <div className="skill-detail-summary">
                <span>Level {levelFromXp(selectedSkill.xp ?? 0)}</span>
                <span>{selectedSkill.xp ?? 0} XP</span>
                <span>{dependentSkills.length} dependents</span>
            </div>
            <label className="xp-control">
                <span>Attainment for {selectedSkill.name}</span>
                <input
                    aria-label={`${selectedSkill.name}の経験値`}
                    type="range"
                    min="0"
                    max="100"
                    value={selectedSkill.xp ?? 0}
                    onChange={(event) =>
                        onXpChange(selectedSkill, Number(event.target.value))
                    }
                />
            </label>
            <fieldset className="detail-dependencies">
                <legend>Prerequisites</legend>
                {skills
                    .filter((candidate) => candidate.id !== selectedSkill.id)
                    .map((candidate) => {
                        const checked = prerequisites.includes(candidate.id);
                        return (
                            <label key={candidate.id}>
                                <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() =>
                                        onDependencyChange(
                                            selectedSkill,
                                            checked
                                                ? prerequisites.filter(
                                                      (id) =>
                                                          id !== candidate.id,
                                                  )
                                                : [
                                                      ...prerequisites,
                                                      candidate.id,
                                                  ],
                                        )
                                    }
                                />
                                {candidate.name}
                            </label>
                        );
                    })}
            </fieldset>
            <p className="detail-impact">
                {dependentSkills.length > 0
                    ? `Changing this node affects: ${dependentSkills.map((skill) => skill.name).join(", ")}.`
                    : "No dependent Skills yet."}
            </p>
            <p className="detail-blocked">
                {missingPrerequisites.length > 0
                    ? `Blocked by: ${missingPrerequisites.map((skill) => skill.name).join(", ")}.`
                    : "All prerequisites are satisfied."}
            </p>
            {viewMode === "tree" && (
                <>
                    <button
                        className="commit-button"
                        type="button"
                        onClick={onCommit}
                        disabled={(selectedSkill.xp ?? 0) >= 100}
                    >
                        Commit XP +10
                    </button>
                    <form
                        className="sibling-form"
                        onSubmit={(event) => {
                            event.preventDefault();
                            onAddSibling(siblingName);
                            setSiblingName("");
                        }}
                    >
                        <label htmlFor="sibling-name">Add sibling Skill</label>
                        <div>
                            <input
                                id="sibling-name"
                                value={siblingName}
                                onChange={(event) =>
                                    setSiblingName(event.target.value)
                                }
                                placeholder="Skill name"
                            />
                            <button type="submit">Add sibling</button>
                        </div>
                    </form>
                </>
            )}
            {viewMode === "board" && (
                <button
                    className="unlock-button"
                    type="button"
                    disabled={missingPrerequisites.length > 0 || unlocked}
                    onClick={() => onUnlock(selectedSkill)}
                >
                    {unlocked ? "Skill unlocked" : "Unlock Skill"}
                </button>
            )}
        </aside>
    );
}
