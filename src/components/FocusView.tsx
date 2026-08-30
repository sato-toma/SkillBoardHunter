import { useEffect, useMemo, useState } from 'react';
import {
    defaultFocusNodeId,
    type FocusNode,
    focusChildren,
    focusParents,
    type Goal,
    type Skill,
} from '../domain/skillBoard';

type FocusViewProps = {
    skills: Skill[];
    goals: Goal[];
};

const nameOf = (id: string, skills: Skill[], goals: Goal[]): string =>
    skills.find((skill) => skill.id === id)?.name ??
    goals.find((goal) => goal.id === id)?.title ??
    id;

export function FocusView({ skills, goals }: FocusViewProps) {
    const [referenceId, setReferenceId] = useState<string | null>(() => defaultFocusNodeId(skills));

    useEffect(() => {
        const stillExists =
            referenceId &&
            (skills.some((skill) => skill.id === referenceId) ||
                goals.some((goal) => goal.id === referenceId));
        if (!stillExists) {
            setReferenceId(defaultFocusNodeId(skills));
        }
    }, [skills, goals, referenceId]);

    const moveTo = (nextId: string) => {
        if (!referenceId || nextId === referenceId) return;
        setReferenceId(nextId);
    };

    const parents = useMemo<FocusNode[]>(
        () => (referenceId ? focusParents(referenceId, skills, goals) : []),
        [referenceId, skills, goals],
    );
    const children = useMemo<FocusNode[]>(
        () => (referenceId ? focusChildren(referenceId, skills, goals) : []),
        [referenceId, skills, goals],
    );

    if (!referenceId) {
        return (
            <section className="workspace-view" aria-label="Focus">
                <div className="workspace-view-heading">
                    <span className="eyebrow">FOCUS</span>
                    <h2>Add a Skill to start a focused path.</h2>
                </div>
            </section>
        );
    }

    return (
        <section className="workspace-view focus-view" aria-label="Focus">
            <div className="workspace-view-heading">
                <span className="eyebrow">FOCUS</span>
                <h2>See one node's direct parents and children.</h2>
                <p>
                    This is an experiment: it is not yet clear whether focusing on one node at a
                    time makes unlocking the board more fun.
                </p>
            </div>
            <div className="focus-lane focus-lane-goal">
                <span className="focus-lane-label">Goal-side</span>
                {parents.length === 0 && (
                    <span className="focus-lane-empty">No further Goal above this node.</span>
                )}
                {parents.map((node) => (
                    <button
                        className="focus-node focus-node-goal"
                        key={node.id}
                        type="button"
                        onClick={() => moveTo(node.id)}
                    >
                        {node.name}
                    </button>
                ))}
            </div>
            <div className="focus-lane focus-lane-reference">
                <span className="focus-lane-label">Reference</span>
                <span className="focus-node focus-node-reference">
                    {nameOf(referenceId, skills, goals)}
                </span>
            </div>
            <div className="focus-lane focus-lane-skill">
                <span className="focus-lane-label">Skill-side</span>
                {children.length === 0 && (
                    <span className="focus-lane-empty">No further Skill below this node.</span>
                )}
                {children.map((node) => (
                    <button
                        className="focus-node focus-node-skill"
                        key={node.id}
                        type="button"
                        onClick={() => moveTo(node.id)}
                    >
                        {node.name}
                    </button>
                ))}
            </div>
        </section>
    );
}
