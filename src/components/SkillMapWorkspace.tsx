import { useState } from 'react';
import type { Goal, Skill, SkillNote, SkillStatus } from '../domain/skillBoard';
import { MapDiscoveryView } from './MapDiscoveryView';
import { SkillMap } from './SkillMap';
import { SkillMapDetail } from './SkillMapDetail';

type MapMode = 'board' | 'discovery';

type SkillMapWorkspaceProps = {
    skills: Skill[];
    goals: Goal[];
    selectedSkillId: string | null;
    selectedSkill: Skill | undefined;
    errorMessage: string | null;
    onSelect: (id: string) => void;
    onMove: (id: string, x: number, y: number) => void;
    onCreateLink: (fromId: string, toId: string) => void;
    onRelinkLink: (fromId: string, oldToId: string, newToId: string) => void;
    onDeleteLink: (fromId: string, toId: string) => void;
    onXpChange: (skill: Skill, xp: number) => void;
    onRemovePrerequisite: (skill: Skill, prerequisiteId: string) => void;
    onEditSave: (
        skill: Skill,
        updates: { name: string; status: SkillStatus; notes: SkillNote[] },
    ) => void;
};

export function SkillMapWorkspace({
    skills,
    goals,
    selectedSkillId,
    selectedSkill,
    errorMessage,
    onSelect,
    onMove,
    onCreateLink,
    onRelinkLink,
    onDeleteLink,
    onXpChange,
    onRemovePrerequisite,
    onEditSave,
}: SkillMapWorkspaceProps) {
    const [mode, setMode] = useState<MapMode>('board');

    return (
        <section className="skill-map-panel" aria-label="Skill map">
            <fieldset className="view-switcher">
                <legend>Map mode</legend>
                <button
                    type="button"
                    className={mode === 'board' ? 'view-button active' : 'view-button'}
                    onClick={() => setMode('board')}
                >
                    Board
                </button>
                <button
                    type="button"
                    className={mode === 'discovery' ? 'view-button active' : 'view-button'}
                    onClick={() => setMode('discovery')}
                >
                    Discovery
                </button>
            </fieldset>
            {mode === 'discovery' && <MapDiscoveryView skills={skills} goals={goals} />}
            {mode === 'board' && (
                <>
                    <SkillMap
                        skills={skills}
                        goals={goals}
                        selectedSkillId={selectedSkillId}
                        onSelect={onSelect}
                        onMove={onMove}
                        onCreateLink={onCreateLink}
                        onRelinkLink={onRelinkLink}
                        onDeleteLink={onDeleteLink}
                    />
                    <SkillMapDetail
                        selectedSkill={selectedSkill}
                        skills={skills}
                        goals={goals}
                        onXpChange={onXpChange}
                        onRemovePrerequisite={onRemovePrerequisite}
                        onEditSave={onEditSave}
                    />
                </>
            )}
            {errorMessage && (
                <p role="alert" className="error-text">
                    {errorMessage}
                </p>
            )}
        </section>
    );
}
