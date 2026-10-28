'use client';

import React, { useState } from 'react';
import { Target, CheckCircle2, BookmarkCheck, FlaskConical, HelpCircle } from 'lucide-react';

interface MetricKPICardsProps {
  overallAccuracyFormatted: string;
  totalAttemptsCount: number;
  coveragePercentage: number;
  conceptsAssessedCount: number;
  totalConceptsAvailable: number;
  completedObjectivesCount: number;
  savedExperimentsCount: number;
  retakePolicy: string;
}

export const MetricKPICards: React.FC<MetricKPICardsProps> = ({
  overallAccuracyFormatted,
  totalAttemptsCount,
  coveragePercentage,
  conceptsAssessedCount,
  totalConceptsAvailable,
  completedObjectivesCount,
  savedExperimentsCount,
  retakePolicy,
}) => {
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  const cards = [
    {
      id: 'accuracy',
      title: 'Assessment Accuracy',
      value: overallAccuracyFormatted,
      subtext: `${totalAttemptsCount} total attempts evaluated (${retakePolicy.replace('_', ' ')})`,
      icon: Target,
      color: 'text-cyan-400',
      borderColor: 'border-cyan-500/30',
      bgColor: 'bg-cyan-950/20',
      tooltip:
        'Accuracy is calculated as (correct responses / total eligible evaluated attempts) * 100. If 0 attempts exist, displays "No assessment data".',
    },
    {
      id: 'coverage',
      title: 'Assessment Coverage',
      value: `${coveragePercentage.toFixed(1)}%`,
      subtext: `${conceptsAssessedCount} of ${totalConceptsAvailable} concepts evaluated`,
      icon: CheckCircle2,
      color: 'text-emerald-400',
      borderColor: 'border-emerald-500/30',
      bgColor: 'bg-emerald-950/20',
      tooltip:
        'Proportion of available curriculum concepts that possess at least one completed assessment attempt. Merely viewing a concept does not count.',
    },
    {
      id: 'objectives',
      title: 'Demonstrated Objectives',
      value: `${completedObjectivesCount}`,
      subtext: 'Concepts with demonstrated accuracy >= 80%',
      icon: BookmarkCheck,
      color: 'text-purple-400',
      borderColor: 'border-purple-500/30',
      bgColor: 'bg-purple-950/20',
      tooltip:
        'Count of specific learning objectives backed by verified assessment accuracy >= 80%. Unassessed objectives are not assumed to be mastered.',
    },
    {
      id: 'experiments',
      title: 'Saved Experiments',
      value: `${savedExperimentsCount}`,
      subtext: 'Persisted simulation checkpoints',
      icon: FlaskConical,
      color: 'text-amber-400',
      borderColor: 'border-amber-500/30',
      bgColor: 'bg-amber-950/20',
      tooltip:
        'Real saved experiment configurations and phase checkpoints. Distinguishes saved experiments from simulations that were only opened or played.',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.id}
            className={`relative flex flex-col justify-between rounded-xl border ${card.borderColor} ${card.bgColor} p-4 backdrop-blur-md transition-all hover:border-slate-600`}
          >
            <div className="flex items-start justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {card.title}
              </span>
              <button
                onMouseEnter={() => setActiveTooltip(card.id)}
                onMouseLeave={() => setActiveTooltip(null)}
                className="text-slate-500 hover:text-slate-300"
                title="View metric calculation formula"
              >
                <HelpCircle className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Tooltip Popup */}
            {activeTooltip === card.id && (
              <div className="absolute top-10 right-2 z-20 w-60 rounded-lg border border-slate-700 bg-slate-900 p-2.5 text-[11px] text-slate-300 shadow-xl backdrop-blur-md">
                <span className="font-semibold text-cyan-300 block mb-1">Calculation Rule:</span>
                {card.tooltip}
              </div>
            )}

            <div className="my-3 flex items-baseline gap-2">
              <span className={`text-2xl font-bold tracking-tight ${card.color}`}>
                {card.value}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 border-t border-slate-800/80 pt-2">
              <Icon className={`h-3.5 w-3.5 ${card.color}`} />
              <span className="truncate">{card.subtext}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

