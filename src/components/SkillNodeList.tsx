import { useState } from "react";
import type { Skill } from "../domain/skillBoard";

type SkillNodeListProps = {
    skills: Skill[];
    viewMode: "board" | "tree" | "graph";
    selectedSkillId: string | null;
    onSelect: (skill: Skill) => void;
};

export function SkillNodeList({
    skills,
    viewMode,
    selectedSkillId,
    onSelect,
}: SkillNodeListProps) {
    const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());

    const childrenOf = (parentId: string) =>
        skills.filter((skill) =>
            skill.prerequisiteSkillIds?.includes(parentId),
        );

    const roots = skills.filter(
        (skill) =>
            !skills.some((candidate) =>
                skill.prerequisiteSkillIds?.includes(candidate.id),
            ),
    );

    const renderTreeNode = (
        skill: Skill,
        depth: number,
        trail: Set<string>,
    ) => {
        const children = childrenOf(skill.id).filter(
            (child) => !trail.has(child.id),
        );
        const collapsed = collapsedIds.has(skill.id);
        const nextTrail = new Set(trail).add(skill.id);

        return (
            <li key={skill.id} className="tree-node">
                <div
                    className="tree-node-row"
                    style={{ paddingLeft: `${depth * 24}px` }}
                >
                    {children.length > 0 ? (
                        <button
                            className="tree-toggle"
                            type="button"
                            aria-label={`${skill.name} children`}
                            aria-expanded={!collapsed}
                            onClick={() =>
                                setCollapsedIds((current) => {
                                    const next = new Set(current);
                                    if (next.has(skill.id))
                                        next.delete(skill.id);
                                    else next.add(skill.id);
                                    return next;
                                })
                            }
                        >
                            {collapsed ? "+" : "−"}
                        </button>
                    ) : (
                        <span
                            className="tree-toggle-placeholder"
                            aria-hidden="true"
                        />
                    )}
                    <button
                        className={
                            selectedSkillId === skill.id
                                ? "skill-list-item selected"
                                : "skill-list-item"
                        }
                        type="button"
                        onClick={() => onSelect(skill)}
                    >
                        <span className="skill-list-item-name">
                            {skill.name}
                        </span>
                        <span className="skill-list-item-progress">
                            <span className="node-progress">
                                <span style={{ width: `${skill.xp ?? 0}%` }} />
                            </span>
                            <span>{skill.xp ?? 0}%</span>
                        </span>
                    </button>
                </div>
                {!collapsed && children.length > 0 && (
                    <ul className="tree-children">
                        {children.map((child) =>
                            renderTreeNode(child, depth + 1, nextTrail),
                        )}
                    </ul>
                )}
            </li>
        );
    };

    if (viewMode === "tree") {
        return (
            <ul className="skill-list tree-view" aria-label="Skill hierarchy">
                {skills.length === 0 && (
                    <li className="empty">まだSkillは登録されていません。</li>
                )}
                {roots.map((skill) => renderTreeNode(skill, 0, new Set()))}
            </ul>
        );
    }

    return (
        <ul className={`skill-list ${viewMode}-view`} aria-label="Skill一覧">
            {skills.length === 0 && (
                <li className="empty">まだSkillは登録されていません。</li>
            )}
            {skills.map((skill) => (
                <li key={skill.id} className="skill-list-row">
                    <button
                        className={
                            selectedSkillId === skill.id
                                ? "skill-list-item selected"
                                : "skill-list-item"
                        }
                        type="button"
                        onClick={() => onSelect(skill)}
                    >
                        <span className="skill-list-item-name">
                            {skill.name}
                        </span>
                        <span className="skill-list-item-progress">
                            <span className="node-progress">
                                <span style={{ width: `${skill.xp ?? 0}%` }} />
                            </span>
                            <span>{skill.xp ?? 0}%</span>
                        </span>
                    </button>
                </li>
            ))}
        </ul>
    );
}
