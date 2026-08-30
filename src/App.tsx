import { useEffect, useState } from 'react';
import { AppHeader } from './components/AppHeader';
import { FocusView } from './components/FocusView';
import { GoalStatus } from './components/GoalStatus';
import { GoalsView } from './components/GoalsView';
import { SkillDeck } from './components/SkillDeck';
import { SkillMapWorkspace } from './components/SkillMapWorkspace';
import { WorkspaceNav, type WorkspaceView } from './components/WorkspaceNav';
import { useAppDispatch, useAppSelector } from './store/hooks';
import {
    addSkillRequested,
    appStarted,
    loadSampleRequested,
    updateSkillDependenciesRequested,
    updateSkillDetailsRequested,
    updateSkillPositionRequested,
    updateSkillRequested,
} from './store/skillBoardSlice';
import './App.css';

function App() {
    const dispatch = useAppDispatch();
    const [activeView, setActiveView] = useState<WorkspaceView>('map');
    const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);
    const board = useAppSelector((state) => state.skillBoard.board);
    const skills = board.skills;
    const goal = board.goals?.[0];
    const requiredSkills = (goal?.requiredSkillIds ?? [])
        .map((id) => skills.find((skill) => skill.id === id))
        .filter((skill): skill is (typeof skills)[number] => Boolean(skill));
    const selectedSkill = skills.find((skill) => skill.id === selectedSkillId);
    const goalProgress = requiredSkills.length
        ? Math.round(
              requiredSkills.reduce((total, skill) => total + (skill.xp ?? 0), 0) /
                  requiredSkills.length,
          )
        : 0;
    const goalUnlocked =
        requiredSkills.length > 0 && requiredSkills.every((skill) => (skill.xp ?? 0) >= 60);
    const errorMessage = useAppSelector((state) => state.skillBoard.errorMessage);

    useEffect(() => {
        dispatch(appStarted());
    }, [dispatch]);

    useEffect(() => {
        if (!selectedSkillId && skills[0]) {
            setSelectedSkillId(skills[0].id);
        }
        if (selectedSkillId && !skills.some((skill) => skill.id === selectedSkillId)) {
            setSelectedSkillId(skills[0]?.id ?? null);
        }
    }, [skills, selectedSkillId]);

    const handleToggleLink = (fromId: string, toId: string) => {
        const target = skills.find((skill) => skill.id === toId);
        if (!target || fromId === toId) return;
        const current = target.prerequisiteSkillIds ?? [];
        const next = current.includes(fromId)
            ? current.filter((id) => id !== fromId)
            : [...current, fromId];
        dispatch(
            updateSkillDependenciesRequested({
                id: toId,
                prerequisiteSkillIds: next,
            }),
        );
    };

    return (
        <main className="app-shell product-shell">
            <WorkspaceNav
                activeView={activeView}
                skillCount={skills.length}
                onViewChange={setActiveView}
            />
            <AppHeader goal={goal} onLoadSample={() => dispatch(loadSampleRequested())} />
            {activeView === 'skills' && (
                <SkillDeck
                    skills={skills}
                    onAddSkill={(name) => dispatch(addSkillRequested({ name }))}
                />
            )}
            {(activeView === 'map' || activeView === 'goals') && (
                <GoalStatus
                    requiredSkills={requiredSkills}
                    goalProgress={goalProgress}
                    goalUnlocked={goalUnlocked}
                />
            )}
            {activeView === 'map' && (
                <SkillMapWorkspace
                    skills={skills}
                    selectedSkillId={selectedSkillId}
                    selectedSkill={selectedSkill}
                    errorMessage={errorMessage}
                    onSelect={setSelectedSkillId}
                    onToggleLink={handleToggleLink}
                    onMove={(id, x, y) =>
                        dispatch(
                            updateSkillPositionRequested({
                                id,
                                layoutX: x,
                                layoutY: y,
                            }),
                        )
                    }
                    onXpChange={(skill, xp) =>
                        dispatch(
                            updateSkillRequested({
                                id: skill.id,
                                xp,
                                status: skill.status ?? 'new',
                            }),
                        )
                    }
                    onRemovePrerequisite={(skill, prerequisiteId) =>
                        dispatch(
                            updateSkillDependenciesRequested({
                                id: skill.id,
                                prerequisiteSkillIds: (skill.prerequisiteSkillIds ?? []).filter(
                                    (id) => id !== prerequisiteId,
                                ),
                            }),
                        )
                    }
                    onEditSave={(skill, updates) =>
                        dispatch(
                            updateSkillDetailsRequested({
                                id: skill.id,
                                name: updates.name,
                                status: updates.status,
                            }),
                        )
                    }
                />
            )}
            {activeView === 'goals' && <GoalsView goals={board.goals ?? []} />}
            {activeView === 'focus' && <FocusView skills={skills} goals={board.goals ?? []} />}
        </main>
    );
}

export default App;
