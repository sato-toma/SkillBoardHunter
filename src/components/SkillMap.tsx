import { useMemo, useRef, useState } from 'react';
import { fallbackSkillLayout, type Skill, skillVisibility } from '../domain/skillBoard';

type SkillMapProps = {
    skills: Skill[];
    selectedSkillId: string | null;
    onSelect: (id: string) => void;
    onToggleLink: (fromId: string, toId: string) => void;
    onMove: (id: string, x: number, y: number) => void;
};

const MAP_WIDTH = 920;
const MAP_HEIGHT = 520;

export function SkillMap({
    skills,
    selectedSkillId,
    onSelect,
    onToggleLink,
    onMove,
}: SkillMapProps) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [linkSourceId, setLinkSourceId] = useState<string | null>(null);
    const [dragPreview, setDragPreview] = useState<{
        id: string;
        x: number;
        y: number;
    } | null>(null);

    const positioned = useMemo(
        () =>
            skills.map((skill) => {
                const fallback = fallbackSkillLayout(skill, skills);
                const base = {
                    skill,
                    x: skill.layoutX ?? fallback.x,
                    y: skill.layoutY ?? fallback.y,
                    visibility: skillVisibility(skill, skills),
                };
                return dragPreview && dragPreview.id === skill.id
                    ? { ...base, x: dragPreview.x, y: dragPreview.y }
                    : base;
            }),
        [skills, dragPreview],
    );

    const visible = positioned.filter((entry) => entry.visibility !== 'hidden');
    const edges = visible.flatMap((entry) =>
        (entry.skill.prerequisiteSkillIds ?? [])
            .map((id) => visible.find((candidate) => candidate.skill.id === id))
            .filter((from): from is (typeof visible)[number] => Boolean(from))
            .map((from) => ({ from, to: entry })),
    );

    const toLocalPoint = (clientX: number, clientY: number) => {
        const bounds = containerRef.current?.getBoundingClientRect();
        if (!bounds) return { x: clientX, y: clientY };
        return {
            x: Math.round(((clientX - bounds.left) / bounds.width) * MAP_WIDTH),
            y: Math.round(((clientY - bounds.top) / bounds.height) * MAP_HEIGHT),
        };
    };

    const handlePointerDown =
        (skillId: string) => (event: React.PointerEvent<HTMLButtonElement>) => {
            event.preventDefault();
            const target = event.currentTarget;
            target.setPointerCapture(event.pointerId);
            let moved = false;

            const handleMove = (moveEvent: PointerEvent) => {
                moved = true;
                const point = toLocalPoint(moveEvent.clientX, moveEvent.clientY);
                setDragPreview({ id: skillId, ...point });
            };
            const handleUp = (upEvent: PointerEvent) => {
                target.releasePointerCapture(event.pointerId);
                window.removeEventListener('pointermove', handleMove);
                window.removeEventListener('pointerup', handleUp);
                if (moved) {
                    const point = toLocalPoint(upEvent.clientX, upEvent.clientY);
                    onMove(skillId, point.x, point.y);
                } else {
                    handleNodeClick(skillId);
                }
                setDragPreview(null);
            };
            window.addEventListener('pointermove', handleMove);
            window.addEventListener('pointerup', handleUp);
        };

    const handleNodeClick = (skillId: string) => {
        onSelect(skillId);
        if (!linkSourceId) {
            setLinkSourceId(skillId);
            return;
        }
        if (linkSourceId === skillId) {
            setLinkSourceId(null);
            return;
        }
        onToggleLink(linkSourceId, skillId);
        setLinkSourceId(null);
    };

    return (
        <section className="skill-map" aria-label="Skill map">
            <div className="skill-map-hint">
                {linkSourceId
                    ? 'Click another visible Skill to connect it, or click the same Skill again to cancel.'
                    : 'Click a Skill to select it, then click a second Skill to connect them. Drag to reposition.'}
            </div>
            <div className="skill-map-canvas" ref={containerRef}>
                <svg
                    className="skill-map-edges"
                    viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
                    preserveAspectRatio="none"
                    aria-hidden="true"
                >
                    {edges.map(({ from, to }) => (
                        <line
                            key={`${from.skill.id}-${to.skill.id}`}
                            x1={from.x}
                            y1={from.y}
                            x2={to.x}
                            y2={to.y}
                        />
                    ))}
                </svg>
                {visible.map(({ skill, x, y, visibility }) => (
                    <button
                        type="button"
                        key={skill.id}
                        className={[
                            'skill-map-node',
                            `visibility-${visibility}`,
                            selectedSkillId === skill.id ? 'selected' : '',
                            linkSourceId === skill.id ? 'linking' : '',
                        ]
                            .filter(Boolean)
                            .join(' ')}
                        style={{
                            left: `${(x / MAP_WIDTH) * 100}%`,
                            top: `${(y / MAP_HEIGHT) * 100}%`,
                        }}
                        onPointerDown={handlePointerDown(skill.id)}
                        aria-pressed={selectedSkillId === skill.id}
                    >
                        <span className="skill-map-node-name">{skill.name}</span>
                        {visibility === 'unlocked' && (
                            <span className="skill-map-node-xp">{skill.xp ?? 0} XP</span>
                        )}
                    </button>
                ))}
            </div>
        </section>
    );
}
