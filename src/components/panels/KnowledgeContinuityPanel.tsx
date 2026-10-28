'use client';

import React, { useState, useEffect } from 'react';
import { 
  History, 
  Sparkles, 
  Bookmark, 
  CheckCircle2, 
  XCircle, 
  BookOpen, 
  Activity, 
  RotateCcw,
  Calendar,
  Layers
} from 'lucide-react';
import { LearningActivity, ExperimentCheckpoint } from '@/types/session';
import { sessionPersistence } from '@/lib/persistence';

interface KnowledgeContinuityPanelProps {
  sessionId: string;
  isImmersive?: boolean;
}

export const KnowledgeContinuityPanel: React.FC<KnowledgeContinuityPanelProps> = ({
  sessionId,
  isImmersive = false,
}) => {
  const [activities, setActivities] = useState<LearningActivity[]>([]);
  const [checkpoints, setCheckpoints] = useState<ExperimentCheckpoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [acts, cps] = await Promise.all([
        sessionPersistence.getLearningActivities(sessionId),
        sessionPersistence.listCheckpoints(sessionId),
      ]);
      setActivities(acts);
      setCheckpoints(cps);
    } catch (e) {
      console.error('Failed to load continuity data', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 4000);
    return () => clearInterval(interval);
  }, [sessionId]);

  const knowledgeChecks = activities.filter((a) => a.activityType === 'knowledge_check_attempt');
  const correctChecks = knowledgeChecks.filter((a) => a.metadata?.isCorrect);
  const accuracyPct = knowledgeChecks.length > 0
    ? Math.round((correctChecks.length / knowledgeChecks.length) * 100)
    : 0;

  const conceptExplanations = activities.filter((a) => a.activityType === 'concept_explained');

  return (
    <div className="space-y-4 text-xs">
      {/* Continuity Overview Card */}
      <div
        className={`p-3.5 rounded-xl border flex items-center justify-between ${
          isImmersive
            ? 'bg-cyan-950/30 border-cyan-500/30 text-cyan-200'
            : 'bg-slate-800/80 border-slate-700 text-slate-200'
        }`}
      >
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400">
            <History className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-xs text-slate-100">Knowledge Continuity</div>
            <div className="text-[10px] text-slate-400">
              {activities.length} total learning events logged
            </div>
          </div>
        </div>
        <button
          onClick={loadData}
          title="Refresh History"
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Metric Summary Cards */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800 flex flex-col items-center text-center">
          <BookOpen className="w-3.5 h-3.5 text-cyan-400 mb-1" />
          <span className="text-base font-bold text-slate-100">{conceptExplanations.length}</span>
          <span className="text-[10px] text-slate-400">Concepts</span>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800 flex flex-col items-center text-center">
          <Activity className="w-3.5 h-3.5 text-blue-400 mb-1" />
          <span className="text-base font-bold text-slate-100">{checkpoints.length}</span>
          <span className="text-[10px] text-slate-400">Experiments</span>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800 flex flex-col items-center text-center">
          <Sparkles className="w-3.5 h-3.5 text-purple-400 mb-1" />
          <span className="text-base font-bold text-emerald-400">
            {knowledgeChecks.length > 0 ? `${accuracyPct}%` : '—'}
          </span>
          <span className="text-[10px] text-slate-400">Checks ({knowledgeChecks.length})</span>
        </div>
      </div>

      {/* Saved Experiments Section */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-slate-300 font-medium text-xs">
          <div className="flex items-center space-x-1.5">
            <Bookmark className="w-3.5 h-3.5 text-blue-400" />
            <span>Saved Experiment Checkpoints ({checkpoints.length})</span>
          </div>
        </div>

        {checkpoints.length === 0 ? (
          <div className="p-3 rounded-lg bg-slate-950/30 border border-slate-800 text-[11px] text-slate-500 text-center">
            No simulation checkpoints saved yet.
          </div>
        ) : (
          <div className="space-y-1.5 max-h-36 overflow-y-auto">
            {checkpoints.map((cp) => (
              <div
                key={cp.id}
                className="p-2 rounded-lg bg-slate-900/50 border border-slate-800 text-[11px] flex items-center justify-between"
              >
                <div>
                  <div className="font-semibold text-slate-200">{cp.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    g={cp.parameters.gravity}m/s², L={cp.parameters.length}m &rarr; T={cp.metrics.period}s
                  </div>
                </div>
                <span className="text-[9px] text-slate-500 font-mono">
                  {new Date(cp.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Activity Stream */}
      <div className="space-y-1.5">
        <div className="flex items-center space-x-1.5 text-slate-300 font-medium text-xs">
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          <span>Activity Timeline</span>
        </div>

        {isLoading ? (
          <div className="p-4 text-center text-slate-500 text-xs">Loading activity stream...</div>
        ) : activities.length === 0 ? (
          <div className="p-3 rounded-lg bg-slate-950/30 border border-slate-800 text-[11px] text-slate-500 text-center">
            Interact with nodes, run simulations, or test knowledge checks to record continuity.
          </div>
        ) : (
          <div className="space-y-1.5 max-h-56 overflow-y-auto">
            {activities.map((act) => {
              let Icon = Sparkles;
              let iconColor = 'text-cyan-400';

              if (act.activityType === 'concept_explained') {
                Icon = BookOpen;
                iconColor = 'text-cyan-400';
              } else if (act.activityType === 'simulation_experiment') {
                Icon = Activity;
                iconColor = 'text-blue-400';
              } else if (act.activityType === 'knowledge_check_attempt') {
                Icon = act.metadata?.isCorrect ? CheckCircle2 : XCircle;
                iconColor = act.metadata?.isCorrect ? 'text-emerald-400' : 'text-rose-400';
              }

              return (
                <div
                  key={act.id}
                  className="p-2 rounded-lg bg-slate-900/40 border border-slate-800/80 text-[11px] flex items-start space-x-2"
                >
                  <Icon className={`w-3.5 h-3.5 ${iconColor} shrink-0 mt-0.5`} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-200 truncate">{act.title}</div>
                    {act.metadata?.details && (
                      <div className="text-[10px] text-slate-400 line-clamp-1">
                        {act.metadata.details}
                      </div>
                    )}
                  </div>
                  <div className="text-[9px] text-slate-500 shrink-0 font-mono">
                    {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

