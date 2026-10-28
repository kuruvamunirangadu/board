'use client';

import React from 'react';
import { BetaStudyTask } from '@/types/beta';
import { BookOpen, Clock, Target, ArrowRight, Activity, Code, Zap } from 'lucide-react';

interface BetaTaskSelectorProps {
  tasks: BetaStudyTask[];
  onSelectTask: (task: BetaStudyTask) => void;
}

export const BetaTaskSelector: React.FC<BetaTaskSelectorProps> = ({
  tasks,
  onSelectTask,
}) => {
  const getSubjectIcon = (subjectId: string) => {
    switch (subjectId) {
      case 'physics':
        return <Activity className="h-4 w-4 text-cyan-400" />;
      case 'computer-science':
        return <Code className="h-4 w-4 text-emerald-400" />;
      case 'electronics':
        return <Zap className="h-4 w-4 text-amber-400" />;
      default:
        return <BookOpen className="h-4 w-4 text-purple-400" />;
    }
  };

  return (
    <div className="w-full max-w-4xl space-y-4">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-bold text-white tracking-wide">
          Select a Pilot Learning Evaluation Study
        </h2>
        <p className="text-xs text-slate-400 max-w-xl mx-auto">
          Each task pairs a 3-question conceptual pre-test, an interactive visual exploration on the VisiOS canvas, and a post-test to measure learning gain.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        {tasks.map((task) => (
          <div
            key={task.taskId}
            className="flex flex-col justify-between rounded-xl border border-cyan-500/20 bg-slate-950/70 p-5 shadow-lg hover:border-cyan-500/50 hover:bg-cyan-950/10 transition-all backdrop-blur-md"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="flex items-center gap-1.5 rounded-md border border-slate-800 bg-slate-900 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-300">
                  {getSubjectIcon(task.subjectId)}
                  <span className="capitalize">{task.subjectId.replace('-', ' ')}</span>
                </span>
                <span className="flex items-center gap-1 text-[10px] text-slate-400">
                  <Clock className="h-3 w-3" /> ~{task.estimatedMinutes} mins
                </span>
              </div>

              <h3 className="text-sm font-bold text-white mb-2 leading-snug">
                {task.title}
              </h3>

              <div className="text-[11px] text-slate-400 mb-3 space-y-1">
                <span className="font-semibold text-cyan-400 flex items-center gap-1">
                  <Target className="h-3 w-3" /> Targeted Learning Objectives:
                </span>
                <ul className="list-disc list-inside space-y-1 text-slate-300">
                  {task.learningObjectives.map((obj, i) => (
                    <li key={i} className="leading-tight">{obj}</li>
                  ))}
                </ul>
              </div>
            </div>

            <button
              onClick={() => onSelectTask(task)}
              className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg border border-cyan-500/40 bg-cyan-600/20 py-2 text-xs font-bold text-cyan-200 hover:bg-cyan-600/40 transition-colors shadow-sm"
            >
              <span>Begin Study Task</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

