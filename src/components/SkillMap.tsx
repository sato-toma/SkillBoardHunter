import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fallbackSkillLayout, type Goal, type Skill, skillVisibility } from '../domain/skillBoard';

type MapNode =
    | {
          id: string;
          name: string;
          kind: 'skill';
          skill: Skill;
          visibility: ReturnType<typeof skillVisibility>;
          x: number;
          y: number;
      }
    | { id: string; name: string; kind: 'goal'; goal: Goal; x: number; y: number };

type Link = { fromId: string; toId: string };

type SkillMapProps = {
    skills: Skill[];
    goals: Goal[];
    selectedSkillId: string | null;
    onSelect: (id: string) => void;
    onMove: (id: string, x: number, y: number) => void;
    onCreateLink: (fromId: string, toId: string) => void;
    onRelinkLink: (fromId: string, oldToId: string, newToId: string) => void;
    onDeleteLink: (fromId: string, toId: string) => void;
};

const MAP_WIDTH = 920;
const MAP_HEIGHT = 520;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2.5;
const ZOOM_STEP = 1.12;
const roundViewportCoordinate = (value: number) => Math.round(value * 1000) / 1000;

export function SkillMap({
    skills,
    goals,
    selectedSkillId,
    onSelect,
    onMove,
    onCreateLink,
    onRelinkLink,
    onDeleteLink,
}: SkillMapProps) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const linkDragCleanupRef = useRef<(() => void) | null>(null);
    const [viewport, setViewport] = useState({ x: 0, y: 0, scale: 1 });
    const [linkEditMode, setLinkEditMode] = useState(false);
    const [linkStatus, setLinkStatus] = useState<string | null>(null);
    const [dragPreview, setDragPreview] = useState<{
        id: string;
        x: number;
        y: number;
    } | null>(null);
    const [linkDrag, setLinkDrag] = useState<{
        fromId: string;
        oldToId: string | null;
        x: number;
        y: number;
        targetId: string | null;
    } | null>(null);

    const positioned = useMemo(
        () =>
            skills.map((skill): MapNode => {
                const fallback = fallbackSkillLayout(skill, skills);
                const base = {
                    skill,
                    id: skill.id,
                    name: skill.name,
                    kind: 'skill' as const,
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

    const visibleSkills = useMemo(
        () =>
            positioned.filter(
                (entry): entry is Extract<MapNode, { kind: 'skill' }> =>
                    entry.kind === 'skill' && entry.visibility !== 'hidden',
            ),
        [positioned],
    );
    const visible = useMemo(
        () => [
            ...visibleSkills,
            ...goals.map(
                (goal, index): MapNode => ({
                    id: goal.id,
                    name: goal.title,
                    kind: 'goal',
                    goal,
                    x: MAP_WIDTH - 90,
                    y: 120 + index * 150,
                }),
            ),
        ],
        [goals, visibleSkills],
    );
    const links = visible.flatMap((entry) => {
        const targets =
            entry.kind === 'skill'
                ? (entry.skill.prerequisiteSkillIds ?? []).map((fromId) => ({
                      fromId,
                      toId: entry.id,
                  }))
                : (entry.goal.requiredSkillIds ?? []).map((fromId) => ({
                      fromId,
                      toId: entry.id,
                  }));
        return targets.filter((link) => visible.some((node) => node.id === link.fromId));
    });

    const toLocalPoint = useCallback(
        (clientX: number, clientY: number) => {
            const bounds = containerRef.current?.getBoundingClientRect();
            if (!bounds) return { x: clientX, y: clientY };
            return {
                x: Math.round(
                    ((clientX - bounds.left - viewport.x) / (bounds.width * viewport.scale)) *
                        MAP_WIDTH,
                ),
                y: Math.round(
                    ((clientY - bounds.top - viewport.y) / (bounds.height * viewport.scale)) *
                        MAP_HEIGHT,
                ),
            };
        },
        [viewport],
    );

    const findNodeAt = useCallback(
        (x: number, y: number): MapNode | undefined =>
            visible.find((node) => Math.abs(node.x - x) <= 75 && Math.abs(node.y - y) <= 48),
        [visible],
    );

    const startLinkDrag = (
        event: React.PointerEvent<HTMLElement> | React.MouseEvent<HTMLElement>,
        fromId: string,
        oldToId: string | null,
    ) => {
        event.preventDefault();
        event.stopPropagation();
        const point = toLocalPoint(event.clientX, event.clientY);
        setLinkStatus(
            oldToId
                ? 'Move the blue link handle to another node or empty space.'
                : 'Drag the gold port to another node.',
        );
        setLinkDrag({ fromId, oldToId, x: point.x, y: point.y, targetId: null });

        linkDragCleanupRef.current?.();
        const handleMove = (moveEvent: PointerEvent) => {
            const nextPoint = toLocalPoint(moveEvent.clientX, moveEvent.clientY);
            const target = findNodeAt(nextPoint.x, nextPoint.y);
            setLinkDrag((current) =>
                current
                    ? {
                          ...current,
                          x: nextPoint.x,
                          y: nextPoint.y,
                          targetId: target && target.id !== current.fromId ? target.id : null,
                      }
                    : null,
            );
        };
        const handleUp = () => {
            setLinkDrag((current) => {
                if (!current) return null;
                if (current.targetId) {
                    setLinkStatus(current.oldToId ? 'Link relinked.' : 'Link created.');
                    if (current.oldToId) {
                        if (current.oldToId !== current.targetId) {
                            onRelinkLink(current.fromId, current.oldToId, current.targetId);
                        }
                    } else {
                        onCreateLink(current.fromId, current.targetId);
                    }
                } else if (current.oldToId) {
                    setLinkStatus('Link deleted.');
                    onDeleteLink(current.fromId, current.oldToId);
                } else {
                    setLinkStatus('Link creation cancelled.');
                }
                return null;
            });
            linkDragCleanupRef.current?.();
        };
        const handleMouseMove = (event: MouseEvent) => handleMove(event as PointerEvent);
        linkDragCleanupRef.current = () => {
            document.removeEventListener('pointermove', handleMove, true);
            document.removeEventListener('pointerup', handleUp, true);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleUp);
            linkDragCleanupRef.current = null;
        };
        document.addEventListener('pointermove', handleMove, true);
        document.addEventListener('pointerup', handleUp, { once: true, capture: true });
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleUp, { once: true });
    };

    useEffect(() => {
        return () => linkDragCleanupRef.current?.();
    }, []);

    const edges = links
        .map((link) => ({
            link,
            from: visible.find((node) => node.id === link.fromId),
            to: visible.find((node) => node.id === link.toId),
        }))
        .filter((edge): edge is { link: Link; from: MapNode; to: MapNode } =>
            Boolean(edge.from && edge.to),
        );

    const handleNodePointerDown =
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
                    onSelect(skillId);
                }
                setDragPreview(null);
            };
            window.addEventListener('pointermove', handleMove);
            window.addEventListener('pointerup', handleUp);
        };

    const toggleLinkEditMode = () => {
        setLinkDrag(null);
        setLinkStatus(null);
        setLinkEditMode((current) => !current);
    };

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleWheel = (event: WheelEvent) => {
            if (event.deltaY === 0) return;

            event.preventDefault();
            const bounds = container.getBoundingClientRect();
            const pointerX = event.clientX - bounds.left;
            const pointerY = event.clientY - bounds.top;

            setViewport((current) => {
                const nextScale = Math.min(
                    MAX_ZOOM,
                    Math.max(
                        MIN_ZOOM,
                        current.scale * (event.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP),
                    ),
                );
                const scaleRatio = nextScale / current.scale;

                return {
                    scale: nextScale,
                    x: roundViewportCoordinate(pointerX - (pointerX - current.x) * scaleRatio),
                    y: roundViewportCoordinate(pointerY - (pointerY - current.y) * scaleRatio),
                };
            });
        };

        container.addEventListener('wheel', handleWheel, { passive: false });
        return () => container.removeEventListener('wheel', handleWheel);
    }, []);

    return (
        <section className="skill-map" aria-label="Skill map">
            <div className="skill-map-toolbar">
                <button type="button" className="view-button" onClick={toggleLinkEditMode}>
                    {linkEditMode ? 'Exit link editing' : 'Edit links'}
                </button>
                <span className="skill-map-hint">
                    {linkEditMode
                        ? 'Drag the small gold square to create a link. Drag a blue link end to another node to relink, or to empty space to delete.'
                        : 'Click a Skill to select it. Edit it in the detail panel, or drag it to reposition.'}
                </span>
                {linkStatus && <span className="skill-map-link-status">{linkStatus}</span>}
            </div>
            <div className="skill-map-canvas" ref={containerRef}>
                <div
                    className="skill-map-world"
                    style={{
                        transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.scale})`,
                    }}
                >
                    <svg
                        className="skill-map-edges"
                        viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
                        preserveAspectRatio="none"
                        aria-hidden="true"
                    >
                        {edges.map(({ link, from, to }) => (
                            <line
                                key={`${link.fromId}-${link.toId}`}
                                x1={from.x}
                                y1={from.y}
                                x2={to.x}
                                y2={to.y}
                            />
                        ))}
                        {linkDrag && (
                            <line
                                className={
                                    linkDrag.targetId ? 'link-preview valid' : 'link-preview'
                                }
                                x1={visible.find((node) => node.id === linkDrag.fromId)?.x ?? 0}
                                y1={visible.find((node) => node.id === linkDrag.fromId)?.y ?? 0}
                                x2={
                                    linkDrag.targetId
                                        ? (visible.find((node) => node.id === linkDrag.targetId)
                                              ?.x ?? linkDrag.x)
                                        : linkDrag.x
                                }
                                y2={
                                    linkDrag.targetId
                                        ? (visible.find((node) => node.id === linkDrag.targetId)
                                              ?.y ?? linkDrag.y)
                                        : linkDrag.y
                                }
                            />
                        )}
                    </svg>
                    {visible.map((node) => {
                        const skill = node.kind === 'skill' ? node.skill : undefined;
                        const visibility = skill ? skillVisibility(skill, skills) : undefined;
                        return (
                            <div
                                className="skill-map-node-wrap"
                                key={node.id}
                                style={{
                                    left: `${(node.x / MAP_WIDTH) * 100}%`,
                                    top: `${(node.y / MAP_HEIGHT) * 100}%`,
                                }}
                            >
                                <button
                                    type="button"
                                    className={[
                                        'skill-map-node',
                                        node.kind === 'goal' ? 'goal' : '',
                                        visibility ? `visibility-${visibility}` : '',
                                        selectedSkillId === node.id ? 'selected' : '',
                                        linkDrag?.targetId === node.id ? 'link-drop-target' : '',
                                    ]
                                        .filter(Boolean)
                                        .join(' ')}
                                    onPointerDown={
                                        node.kind === 'skill' && !linkEditMode
                                            ? handleNodePointerDown(node.id)
                                            : undefined
                                    }
                                    aria-pressed={selectedSkillId === node.id}
                                >
                                    <span className="skill-map-node-name">{node.name}</span>
                                    {skill && visibility === 'unlocked' && (
                                        <span className="skill-map-node-xp">
                                            {skill.xp ?? 0} XP
                                        </span>
                                    )}
                                </button>
                                {linkEditMode && node.kind === 'skill' && (
                                    <button
                                        type="button"
                                        className="skill-map-link-port"
                                        title="Drag to create a link"
                                        aria-label={`Create link from ${node.name}`}
                                        onPointerDown={(event) =>
                                            startLinkDrag(event, node.id, null)
                                        }
                                        onMouseDown={(event) => startLinkDrag(event, node.id, null)}
                                    />
                                )}
                            </div>
                        );
                    })}
                    {linkEditMode &&
                        edges.map((edge) => (
                            <button
                                type="button"
                                className="skill-map-link-handle"
                                key={`${edge.link.fromId}-${edge.link.toId}`}
                                title="Drag to relink or delete"
                                aria-label={`Link from ${edge.from.name} to ${edge.to.name}`}
                                style={{
                                    left: `${(edge.to.x / MAP_WIDTH) * 100}%`,
                                    top: `${(edge.to.y / MAP_HEIGHT) * 100}%`,
                                }}
                                onPointerDown={(event) =>
                                    startLinkDrag(event, edge.link.fromId, edge.link.toId)
                                }
                                onMouseDown={(event) =>
                                    startLinkDrag(event, edge.link.fromId, edge.link.toId)
                                }
                            />
                        ))}
                </div>
            </div>
        </section>
    );
}
