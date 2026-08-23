import { useEffect, useState } from 'react';
import { GrowthQuestDeck } from './components/GrowthQuestDeck';
import { AppHeader } from './components/AppHeader';
import { GoalStatus } from './components/GoalStatus';
import { GoalsView } from './components/GoalsView';
import { SkillMapWorkspace } from './components/SkillMapWorkspace';
import { WorkspaceNav } from './components/WorkspaceNav';
import { useAppDispatch, useAppSelector } from './store/hooks';
import {
    addSkillRequested,
    appStarted,
    clearLevelUp,
    loadSampleRequested,
    questAdded,
    questCompleted,
    updateSkillDependenciesRequested,
    updateSkillPositionRequested,
    updateSkillRequested,
} from './store/skillBoardSlice';
import './App.css';

function App() {
    const dispatch = useAppDispatch();
    const [activeView, setActiveView] = useState<'map' | 'quests' | 'goals'>('map');
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
    const quests = useAppSelector((state) => state.skillBoard.quests ?? []);
    const evidence = useAppSelector((state) => state.skillBoard.evidence ?? []);
    const lastLevelUp = useAppSelector((state) => state.skillBoard.lastLevelUp ?? null);

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

    const handleQuickAdd = (name: string) => {
        if (!selectedSkill) return;
        const offsetX = (selectedSkill.layoutX ?? 460) + 120;
        const offsetY = (selectedSkill.layoutY ?? 260) + 60;
        dispatch(
            addSkillRequested({
                name,
                prerequisiteSkillIds: [selectedSkill.id],
                layoutX: offsetX,
                layoutY: offsetY,
            }),
        );
    };

    return (
        <main className="app-shell product-shell">
            <WorkspaceNav
                activeView={activeView}
                openQuestCount={quests.filter((quest) => quest.status === 'open').length}
                onViewChange={setActiveView}
            />
            <AppHeader goal={goal} onLoadSample={() => dispatch(loadSampleRequested())} />
            {activeView === 'quests' && (
                <GrowthQuestDeck
                    goal={goal}
                    skills={skills}
                    quests={quests}
                    evidence={evidence}
                    levelUp={lastLevelUp}
                    onAddQuest={(quest) => dispatch(questAdded(quest))}
                    onCompleteQuest={(questId, questEvidence) =>
                        dispatch(
                            questCompleted({
                                questId,
                                evidence: questEvidence,
                            }),
                        )
                    }
                    onDismissLevelUp={() => dispatch(clearLevelUp())}
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
                    onQuickAdd={handleQuickAdd}
                />
            )}
            {activeView === 'goals' && <GoalsView goals={board.goals ?? []} />}
        </main>
    );
}

export default App;
