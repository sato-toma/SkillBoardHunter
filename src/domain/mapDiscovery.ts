import { type FocusNode, focusChildren, focusParents, type Goal, type Skill } from './skillBoard';

export type DiscoveryRole = 'center' | 'path' | 'sibling-up' | 'sibling-down';

export type DiscoveryNode = FocusNode & {
    // Positive = Goal-side (up), negative = Skill-side (down), 0 = the active node.
    band: number;
    role: DiscoveryRole;
};

export type DiscoveryEdgeKind = 'path' | 'sibling' | 'other';

export type DiscoveryEdge = {
    childId: string;
    parentId: string;
    kind: DiscoveryEdgeKind;
};

export type DiscoveryView = {
    nodes: DiscoveryNode[];
    edges: DiscoveryEdge[];
};

const bfsLevels = (
    startId: string,
    neighborsOf: (id: string) => FocusNode[],
    maxHops: number,
): Map<string, number> => {
    const levels = new Map<string, number>();
    let frontier = [startId];
    const seen = new Set<string>([startId]);
    for (let hop = 1; hop <= maxHops; hop++) {
        const next: string[] = [];
        for (const id of frontier) {
            for (const neighbor of neighborsOf(id)) {
                if (!seen.has(neighbor.id)) {
                    seen.add(neighbor.id);
                    levels.set(neighbor.id, hop);
                    next.push(neighbor.id);
                }
            }
        }
        frontier = next;
        if (frontier.length === 0) break;
    }
    return levels;
};

const findNode = (id: string, skills: Skill[], goals: Goal[]): Omit<FocusNode, 'id'> => {
    const skill = skills.find((candidate) => candidate.id === id);
    if (skill) return { name: skill.name, kind: 'skill' };
    const goal = goals.find((candidate) => candidate.id === id);
    return { name: goal?.title ?? id, kind: 'goal' };
};

// Builds only the part of the board that has actually been revealed around `centerId`:
// the active node, its ancestors/descendants up to the given hop counts, and any node
// that shares a parent/child with something already revealed (a "sibling").
// Nothing else is computed, so this scales to a board with many more Skills and Goals.
export const discoverAround = (
    centerId: string,
    skills: Skill[],
    goals: Goal[],
    upHops: number,
    downHops: number,
): DiscoveryView => {
    const parentsOfId = (id: string) => focusParents(id, skills, goals);
    const childrenOfId = (id: string) => focusChildren(id, skills, goals);

    const upLevels = bfsLevels(centerId, parentsOfId, upHops);
    const downLevels = bfsLevels(centerId, childrenOfId, downHops);

    const hopOf = (id: string): number | null => {
        if (id === centerId) return 0;
        if (upLevels.has(id)) return upLevels.get(id) as number;
        if (downLevels.has(id)) return -(downLevels.get(id) as number);
        return null;
    };

    const band = new Map<string, number>([[centerId, 0]]);
    for (const [id, hop] of upLevels) band.set(id, hop);
    for (const [id, hop] of downLevels) band.set(id, -hop);

    const siblingUpIds = new Set<string>();
    const siblingDownIds = new Set<string>();
    for (const [ancestorId, hop] of upLevels.entries()) {
        for (const child of childrenOfId(ancestorId)) {
            if (!band.has(child.id)) {
                band.set(child.id, hop - 1);
                siblingUpIds.add(child.id);
            }
        }
    }
    for (const [descendantId, hop] of downLevels.entries()) {
        for (const parent of parentsOfId(descendantId)) {
            if (!band.has(parent.id)) {
                // `+ 0` avoids storing a distinct -0 when hop is 1, which would otherwise
                // compare unequal to a plain 0 band in tests and equality checks.
                band.set(parent.id, -(hop - 1) + 0);
                siblingDownIds.add(parent.id);
            }
        }
    }

    const nodes: DiscoveryNode[] = [...band.entries()].map(([id, nodeBand]) => {
        const { name, kind } = findNode(id, skills, goals);
        const role: DiscoveryRole =
            id === centerId
                ? 'center'
                : siblingUpIds.has(id)
                  ? 'sibling-up'
                  : siblingDownIds.has(id)
                    ? 'sibling-down'
                    : 'path';
        return { id, name, kind, band: nodeBand, role };
    });

    const edges: DiscoveryEdge[] = [];
    const addEdgeIfRevealed = (childId: string, parentId: string) => {
        if (!band.has(childId) || !band.has(parentId)) return;
        const hc = hopOf(childId);
        const hp = hopOf(parentId);
        const isPath = hc !== null && hp !== null && hp - hc === 1 && (hc >= 0 || hp <= 0);
        const isSibling =
            !isPath &&
            ((siblingUpIds.has(childId) && (parentId === centerId || upLevels.has(parentId))) ||
                (siblingDownIds.has(parentId) && (childId === centerId || downLevels.has(childId))));
        edges.push({ childId, parentId, kind: isPath ? 'path' : isSibling ? 'sibling' : 'other' });
    };
    for (const skill of skills) {
        for (const prerequisiteId of skill.prerequisiteSkillIds ?? []) {
            addEdgeIfRevealed(prerequisiteId, skill.id);
        }
    }
    for (const goal of goals) {
        for (const requiredId of goal.requiredSkillIds ?? []) {
            addEdgeIfRevealed(requiredId, goal.id);
        }
    }

    return { nodes, edges };
};
