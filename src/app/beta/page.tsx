'use client';

import React, { useState, useEffect } from 'react';
import {
  BetaStudyTask,
  BetaSession,
  BetaEvaluationAggregate,
} from '@/types/beta';
import { BetaConsentModal } from '@/components/beta/BetaConsentModal';
import { BetaTaskSelector } from '@/components/beta/BetaTaskSelector';
import { PrePostTestWizard } from '@/components/beta/PrePostTestWizard';
import { BetaFeedbackModal } from '@/components/beta/BetaFeedbackModal';
import { BetaEvaluationDashboard } from '@/components/beta/BetaEvaluationDashboard';
import { SynchronizedSimulationWidget } from '@/components/collaboration/SynchronizedSimulationWidget';
import { Navigation } from '@/components/shell/Navigation';
import { FlaskConical, LayoutDashboard, ArrowRight, Sparkles, CheckCircle2, RotateCcw } from 'lucide-react';

export default function BetaStudyPage() {
  const [viewMode, setViewMode] = useState<'student_study' | 'researcher_dashboard'>('student_study');
  const [step, setStep] = useState<'consent' | 'select_task' | 'pretest' | 'explore' | 'posttest' | 'feedback' | 'completed'>('consent');

  const [participantCode, setParticipantCode] = useState<string>('');
  const [tasks, setTasks] = useState<BetaStudyTask[]>([]);
  const [selectedTask, setSelectedTask] = useState<BetaStudyTask | null>(null);
  const [activeSession, setActiveSession] = useState<BetaSession | null>(null);
  const [aggregate, setAggregate] = useState<BetaEvaluationAggregate | null>(null);

  const [exploreStartTime, setExploreStartTime] = useState<number>(Date.now());
  const [localSimParams, setLocalSimParams] = useState({
    length: 2.0,
    gravity: 9.81,
    damping: 0.05,
    mass: 1.0,
  });
  const [localSimRunning, setLocalSimRunning] = useState(false);

  // Load tasks & evaluation aggregate
  const fetchBetaData = async () => {
    try {
      const [tRes, aggRes] = await Promise.all([
        fetch('/api/beta?action=list_tasks'),
        fetch('/api/beta?action=evaluation_summary'),
      ]);
      const tData = await tRes.json();
      const aggData = await aggRes.json();

      if (tData.success) setTasks(tData.tasks);
      if (aggData.success) setAggregate(aggData.aggregate);
    } catch (e) {
      console.error('Failed to load beta tasks', e);
    }
  };

  useEffect(() => {
    fetchBetaData();
  }, []);

  const handleConsentGiven = async (code: string, ageConfirmed: boolean) => {
    setParticipantCode(code);
    try {
      await fetch('/api/beta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'grant_consent',
          participantCode: code,
          ageConfirmed,
        }),
      });
    } catch (e) {
      // transient
    }
    setStep('select_task');
  };

  const handleSelectTask = async (task: BetaStudyTask) => {
    setSelectedTask(task);
    try {
      const res = await fetch('/api/beta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start_session',
          participantCode,
          taskId: task.taskId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActiveSession(data.session);
      }
    } catch (e) {
      // fallback local session
      setActiveSession({
        sessionId: `local-sess-${Date.now()}`,
        participantCode,
        taskId: task.taskId,
        topicId: task.topicId,
        status: 'in_progress',
        startedAt: Date.now(),
        taskCompleted: false,
      });
    }
    setStep('pretest');
  };

  const handleSubmitPreTest = async (answers: number[]) => {
    if (!activeSession) return { score: 0, total: 3 };
    const res = await fetch('/api/beta', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'submit_pretest',
        sessionId: activeSession.sessionId,
        answers,
      }),
    });
    const data = await res.json();
    if (data.success && data.session) {
      setActiveSession(data.session);
      return { score: data.score, total: data.total };
    }
    return { score: 0, total: 3 };
  };

  const handleSubmitPostTest = async (answers: number[]) => {
    if (!activeSession) return { score: 0, total: 3, delta: 0 };
    const duration = Math.round((Date.now() - exploreStartTime) / 1000);
    const res = await fetch('/api/beta', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'submit_posttest',
        sessionId: activeSession.sessionId,
        answers,
        explorationDurationSeconds: duration,
      }),
    });
    const data = await res.json();
    if (data.success && data.session) {
      setActiveSession(data.session);
      return { score: data.score, total: data.total, delta: data.delta };
    }
    return { score: 0, total: 3, delta: 0 };
  };

  const handleSubmitFeedback = async (fbData: any) => {
    await fetch('/api/beta', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'submit_feedback',
        feedback: fbData,
      }),
    });
    fetchBetaData();
  };

  const handleDeleteParticipantData = async (code: string) => {
    await fetch('/api/beta', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'delete_participant_data',
        participantCode: code,
      }),
    });
    fetchBetaData();
  };

  return (
    <div className="flex min-h-screen w-screen flex-col bg-slate-950 text-slate-100 antialiased font-sans">
      <Navigation />

      {/* Top Beta Header */}
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-cyan-500/20 bg-slate-950/80 px-6 py-3 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-500/40 bg-cyan-950/60 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
            <FlaskConical className="h-4 w-4 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-wide">
              VisiOS Beta Launch & Learning Effectiveness Pilot
            </h1>
            <p className="text-[11px] text-slate-400">
              Measuring conceptual learning gain delta (Pre-Test vs Post-Test) & formative usability feedback.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex rounded-lg border border-slate-800 bg-slate-900/60 p-1 text-xs">
            <button
              onClick={() => setViewMode('student_study')}
              className={`rounded-md px-3 py-1 font-semibold transition-all ${
                viewMode === 'student_study'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Student Study Flow
            </button>
            <button
              onClick={() => {
                setViewMode('researcher_dashboard');
                fetchBetaData();
              }}
              className={`rounded-md px-3 py-1 font-semibold transition-all ${
                viewMode === 'researcher_dashboard'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Researcher Evaluation Dashboard
            </button>
          </div>

          {participantCode && (
            <span className="rounded-lg border border-cyan-500/30 bg-cyan-950/40 px-2.5 py-1 text-xs font-mono text-cyan-300">
              Code: {participantCode}
            </span>
          )}
        </div>
      </header>

      {/* Main Content Body */}
      <main className="flex-1 p-6 flex flex-col items-center justify-center max-w-6xl mx-auto w-full">
        {viewMode === 'researcher_dashboard' ? (
          aggregate ? (
            <div className="w-full">
              <BetaEvaluationDashboard
                aggregate={aggregate}
                onDeleteParticipantData={handleDeleteParticipantData}
                onRefresh={fetchBetaData}
              />
            </div>
          ) : (
            <div className="text-xs text-slate-400 italic">Loading evaluation metrics...</div>
          )
        ) : (
          <>
            {step === 'consent' && (
              <BetaConsentModal
                onConsentGiven={handleConsentGiven}
                onDecline={() => setStep('select_task')}
              />
            )}

            {step === 'select_task' && (
              <BetaTaskSelector
                tasks={tasks}
                onSelectTask={handleSelectTask}
              />
            )}

            {step === 'pretest' && selectedTask && (
              <PrePostTestWizard
                testType="pre"
                title={selectedTask.title}
                questions={selectedTask.preTestQuestions}
                onSubmitAnswers={handleSubmitPreTest}
                onProceedToNextStep={() => {
                  setExploreStartTime(Date.now());
                  setStep('explore');
                }}
              />
            )}

            {step === 'explore' && selectedTask && (
              <div className="w-full max-w-3xl space-y-4">
                {/* Prompt Banner */}
                <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/20 p-4 backdrop-blur-md">
                  <div className="flex items-center gap-2 pb-2 border-b border-cyan-500/20">
                    <Sparkles className="h-4 w-4 text-cyan-400" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-200">
                      Step 2: Interactive Exploration Task
                    </h3>
                  </div>
                  <p className="mt-2 text-xs text-slate-200 leading-relaxed font-medium">
                    {selectedTask.explorationPrompt}
                  </p>
                </div>

                {/* Embedded Simulation Widget */}
                <SynchronizedSimulationWidget
                  simulationState={{
                    roomId: 'beta-local',
                    simulationType: 'pendulum',
                    parameters: localSimParams,
                    isRunning: localSimRunning,
                    currentTime: 0,
                    stepIndex: 0,
                    stateVersion: 1,
                    updatedAt: Date.now(),
                    lastActorId: participantCode,
                    lastActorName: `Participant ${participantCode}`,
                  }}
                  isLocked={false}
                  canEdit={true}
                  onUpdateSimulation={async (patch) => {
                    if (patch.parameters) setLocalSimParams(patch.parameters as any);
                    if (typeof patch.isRunning === 'boolean') setLocalSimRunning(patch.isRunning);
                  }}
                />

                {/* Action to proceed to post-test */}
                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-slate-400">
                    Explore parameters, amplitude angles, and damping until you feel confident.
                  </span>
                  <button
                    onClick={() => setStep('posttest')}
                    className="flex items-center gap-1.5 rounded-lg border border-cyan-500/40 bg-cyan-600/30 px-5 py-2.5 text-xs font-bold text-cyan-200 hover:bg-cyan-600/50 transition-colors shadow-lg"
                  >
                    <span>I&apos;m Ready for the Post-Test</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {step === 'posttest' && selectedTask && (
              <PrePostTestWizard
                testType="post"
                title={selectedTask.title}
                questions={selectedTask.postTestQuestions}
                preTestScore={activeSession?.preTestScore}
                onSubmitAnswers={handleSubmitPostTest}
                onProceedToNextStep={() => setStep('feedback')}
              />
            )}

            {step === 'feedback' && activeSession && (
              <BetaFeedbackModal
                sessionId={activeSession.sessionId}
                participantCode={participantCode || 'P-101'}
                taskId={activeSession.taskId}
                onSubmitFeedback={handleSubmitFeedback}
                onFinish={() => {
                  setStep('select_task');
                  setSelectedTask(null);
                  setActiveSession(null);
                }}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}

