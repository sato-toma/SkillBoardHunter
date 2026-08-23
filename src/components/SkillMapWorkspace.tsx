import { SkillMap } from './SkillMap';
import { SkillMapDetail } from './SkillMapDetail';
import type { Skill } from '../domain/skillBoard';

type SkillMapWorkspaceProps = {
    skills: Skill[];
    selectedSkillId: string | null;
    selectedSkill: Skill | undefined;
    errorMessage: string | null;
    onSelect: (id: string) => void;
    onToggleLink: (fromId: string, toId: string) => void;
    onMove: (id: string, x: number, y: number) => void;
    onXpChange: (skill: Skill, xp: number) => void;
    onRemovePrerequisite: (skill: Skill, prerequisiteId: string) => void;
    onQuickAdd: (name: string) => void;
};

export function SkillMapWorkspace({
    skills,
    selectedSkillId,
    selectedSkill,
    errorMessage,
    onSelect,
    onToggleLink,
    onMove,
    onXpChange,
    onRemovePrerequisite,
    onQuickAdd,
}: SkillMapWorkspaceProps) {
    return (
        <section className="skill-map-panel" aria-label="Skill map">
            <SkillMap
                skills={skills}
                selectedSkillId={selectedSkillId}
                onSelect={onSelect}
                onToggleLink={onToggleLink}
                onMove={onMove}
            />
            <SkillMapDetail
                selectedSkill={selectedSkill}
                skills={skills}
                onXpChange={onXpChange}
                onRemovePrerequisite={onRemovePrerequisite}
                onQuickAdd={onQuickAdd}
            />
            {errorMessage && (
                <p role="alert" className="error-text">
                    {errorMessage}
                </p>
            )}
        </section>
    );
}
