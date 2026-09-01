import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { discoverAround, type DiscoveryNode } from '../domain/mapDiscovery';
import { defaultFocusNodeId, type Goal, type Skill } from '../domain/skillBoard';

type MapDiscoveryViewProps = {
    skills: Skill[];
    goals: Goal[];
};

const CANVAS_WIDTH = 900;
const ROW_HEIGHT = 90;
const MARGIN = 60;

export function MapDiscoveryView({ skills, goals }: MapDiscoveryViewProps) {
    const [activeId, setActiveId] = useState<string | null>(() => defaultFocusNodeId(skills));
    const [upHops, setUpHops] = useState(1);
    const [downHops, setDownHops] = useState(1);
    const viewportRef = useRef<HTMLDivElement | null>(null);
    // Tracks the active node's last vertical position so scroll can be compensated
    // instead of letting the active node visually jump when it moves.
    const previousCenterYRef = useRef<number | null>(null);

    useEffect(() => {
        const stillExists =
            activeId &&
            (skills.some((skill) => skill.id === activeId) ||
                goals.some((goal) => goal.id === activeId));
        if (!stillExists) {
            setActiveId(defaultFocusNodeId(skills));
            setUpHops(1);
            setDownHops(1);
            previousCenterYRef.current = null;
        }
    }, [skills, goals, activeId]);

    const recenter = (id: string) => {
        if (id === activeId) return;
        setActiveId(id);
        setUpHops(1);
        setDownHops(1);
        previousCenterYRef.current = null;
    };

    const view = useMemo(
        () => (activeId ? discoverAround(activeId, skills, goals, upHops, downHops) : null),
        [activeId, skills, goals, upHops, downHops],
    );

    const layout = useMemo(() => {
        if (!view) return null;
        const centerY = MARGIN + upHops * ROW_HEIGHT;
        const canvasHeight = MARGIN * 2 + (upHops + downHops) * ROW_HEIGHT;
        const bandGroups = new Map<number, DiscoveryNode[]>();
        for (const node of view.nodes) {
            const list = bandGroups.get(node.band) ?? [];
            list.push(node);
            bandGroups.set(node.band, list);
        }
        const positions = new Map<string, { x: number; y: number }>();
        for (const [band, nodes] of bandGroups) {
            const y = centerY - band * ROW_HEIGHT;
            const spacing = CANVAS_WIDTH / (nodes.length + 1);
            nodes.forEach((node, index) => {
                positions.set(node.id, { x: spacing * (index + 1), y });
            });
        }
        return { centerY, canvasHeight, positions };
    }, [view, upHops, downHops]);

    useLayoutEffect(() => {
        const viewport = viewportRef.current;
        if (!viewport || !layout) return;
        if (previousCenterYRef.current === null) {
            viewport.scrollTop = Math.max(0, layout.centerY - viewport.clientHeight / 2);
        } else if (layout.centerY !== previousCenterYRef.current) {
            viewport.scrollTop += layout.centerY - previousCenterYRef.current;
        }
        previousCenterYRef.current = layout.centerY;
    });

    if (!activeId || !view || !layout) {
        return (
            <section className="workspace-view map-discovery" aria-label="Map discovery">
                <div className="workspace-view-heading">
                    <span className="eyebrow">DISCOVERY</span>
                    <h2>Add a Skill to start searching.</h2>
                </div>
            </section>
        );
    }

    const activeName = view.nodes.find((node) => node.id === activeId)?.name ?? activeId;

    return (
        <section className="workspace-view map-discovery" aria-label="Map discovery">
            <div className="workspace-view-heading">
                <span className="eyebrow">DISCOVERY</span>
                <h2>Search Skills related to {activeName}.</h2>
                <p>
                    Click a node to search from there. Dashed nodes share a Goal or Skill with
                    something on the highlighted path, but are not themselves on it.
                </p>
            </div>
            <div className="map-discovery-controls">
                <button type="button" onClick={() => setUpHops((value) => value + 1)}>
                    ▲ Expand toward Goals
                </button>
                <button type="button" onClick={() => setDownHops((value) => value + 1)}>
                    ▼ Expand toward Detail
                </button>
            </div>
            <div className="map-discovery-viewport" ref={viewportRef}>
                <div
                    className="map-discovery-canvas"
                    style={{ height: layout.canvasHeight, width: CANVAS_WIDTH }}
                >
                    <svg
                        className="map-discovery-edges"
                        width={CANVAS_WIDTH}
                        height={layout.canvasHeight}
                        aria-hidden="true"
                    >
                        {view.edges.map(({ childId, parentId, kind }) => {
                            const a = layout.positions.get(childId);
                            const b = layout.positions.get(parentId);
                            if (!a || !b) return null;
                            return (
                                <line
                                    key={`${childId}-${parentId}`}
                                    x1={a.x}
                                    y1={a.y}
                                    x2={b.x}
                                    y2={b.y}
                                    className={kind === 'path' ? 'path-edge' : 'sibling-edge'}
                                />
                            );
                        })}
                    </svg>
                    {view.nodes.map((node) => {
                        const pos = layout.positions.get(node.id);
                        if (!pos) return null;
                        const hopBucket = Math.min(Math.abs(node.band), 4);
                        const roleClass =
                            node.role === 'center'
                                ? 'center'
                                : node.role === 'sibling-up'
                                  ? 'sibling-up'
                                  : node.role === 'sibling-down'
                                    ? 'sibling-down'
                                    : node.band > 0
                                      ? `up-${hopBucket}`
                                      : node.band < 0
                                        ? `down-${hopBucket}`
                                        : '';
                        return (
                            <button
                                type="button"
                                key={node.id}
                                className={[
                                    'map-discovery-node',
                                    node.kind === 'goal' ? 'goal' : '',
                                    roleClass,
                                ]
                                    .filter(Boolean)
                                    .join(' ')}
                                style={{ left: `${pos.x}px`, top: `${pos.y}px` }}
                                onClick={() => recenter(node.id)}
                            >
                                {node.name}
                            </button>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
