'use client';

import React, { useState } from 'react';
import { 
  ConceptDefinition, 
  TopicDefinition, 
  SubjectDefinition,
  LearningResource 
} from '@/types/knowledge';
import { 
  X, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  Activity, 
  Box, 
  FileText, 
  TrendingUp, 
  Layers,
  ArrowRight,
  BookOpen
} from 'lucide-react';

interface StudentExperiencePreviewModalProps {
  subject: SubjectDefinition;
  topic?: TopicDefinition;
  concept: ConceptDefinition;
  resources: LearningResource[];
  onClose: () => void;
}

export const StudentExperiencePreviewModal: React.FC<StudentExperiencePreviewModalProps> = ({
  subject,
  topic,
  concept,
  resources,
  onClose,
}) => {
  const [selectedQuizAnswer, setSelectedQuizAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  const conceptResources = resources.filter((r) => r.associatedConceptIds.includes(concept.id));

  const handleSelectAnswer = (index: number) => {
    setSelectedQuizAnswer(index);
    setShowExplanation(true);
  };

  const handleResetQuiz = () => {
    setSelectedQuizAnswer(null);
    setShowExplanation(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-4xl max-h-[90vh] bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono text-[10px]">
                  STUDENT PREVIEW
                </span>
                <span className="text-xs text-slate-400">{subject.displayName} / {topic?.title || 'Topic'}</span>
              </div>
              <h3 className="text-base font-bold text-white mt-0.5">{concept.title}</h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {/* Concept Overview Card */}
          <div className="p-5 rounded-xl bg-slate-900/50 border border-slate-800 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 flex items-center space-x-1">
                  <Clock className="w-3 h-3 text-cyan-400" />
                  <span>{concept.estimatedMinutes} Minutes Study</span>
                </span>
                <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 capitalize font-medium">
                  {concept.difficultyLevel} Level
                </span>
              </div>
              <span className="text-xs text-slate-400">
                Prerequisites: {concept.prerequisiteConceptIds.length > 0 ? `${concept.prerequisiteConceptIds.length} required` : 'None (Foundation)'}
              </span>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">{concept.description}</p>

            {/* Learning Objectives */}
            {concept.learningObjectives && concept.learningObjectives.length > 0 && (
              <div className="pt-3 border-t border-slate-800/80">
                <h4 className="text-xs font-semibold text-slate-300 mb-2">Target Learning Objectives:</h4>
                <ul className="space-y-1.5">
                  {concept.learningObjectives.map((obj, i) => (
                    <li key={i} className="flex items-start space-x-2 text-xs text-slate-400">
                      <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                      <span>{obj}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Attached Visual & Simulation Activities */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-slate-300 flex items-center space-x-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Interactive Board Visualizers & Simulations ({conceptResources.length})</span>
            </h4>

            {conceptResources.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-900/30 border border-slate-800 text-xs text-slate-500">
                No interactive activities attached to this concept.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {conceptResources.map((res) => (
                  <div
                    key={res.id}
                    className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-2 relative overflow-hidden"
                  >
                    <div className="flex items-center space-x-2 text-xs font-semibold text-white">
                      {res.resourceType === 'simulation' ? (
                        <Activity className="w-4 h-4 text-blue-400" />
                      ) : res.resourceType === '3d_model' ? (
                        <Box className="w-4 h-4 text-emerald-400" />
                      ) : res.resourceType === 'graph' ? (
                        <TrendingUp className="w-4 h-4 text-purple-400" />
                      ) : (
                        <FileText className="w-4 h-4 text-cyan-400" />
                      )}
                      <span>{res.title}</span>
                    </div>
                    <p className="text-xs text-slate-400">{res.description}</p>
                    <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500">
                      <span>Engine: {res.requiredCapability}</span>
                      <span className="text-cyan-400 hover:underline cursor-pointer flex items-center space-x-1">
                        <span>Launch on Board</span>
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Knowledge Check Formative Assessment */}
          {concept.knowledgeCheck && (
            <div className="p-5 rounded-xl bg-purple-950/20 border border-purple-800/40 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <HelpCircle className="w-4 h-4 text-purple-400" />
                  <h4 className="text-xs font-semibold text-purple-200">Knowledge Check (Simulated)</h4>
                </div>
                {selectedQuizAnswer !== null && (
                  <button
                    onClick={handleResetQuiz}
                    className="text-xs text-purple-300 hover:text-white underline"
                  >
                    Retry Question
                  </button>
                )}
              </div>

              <p className="text-sm font-medium text-white">{concept.knowledgeCheck.question}</p>

              {/* Options */}
              <div className="space-y-2">
                {concept.knowledgeCheck.options.map((opt, idx) => {
                  const isSelected = selectedQuizAnswer === idx;
                  const isCorrect = idx === concept.knowledgeCheck?.correctIndex;

                  let optionStyles = 'bg-slate-900/80 border-slate-800 hover:border-purple-500/50 text-slate-200';
                  if (showExplanation) {
                    if (isCorrect) {
                      optionStyles = 'bg-emerald-950/60 border-emerald-500 text-emerald-200 font-semibold';
                    } else if (isSelected && !isCorrect) {
                      optionStyles = 'bg-rose-950/60 border-rose-500 text-rose-200';
                    } else {
                      optionStyles = 'bg-slate-900/40 border-slate-800/60 text-slate-500 opacity-60';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => !showExplanation && handleSelectAnswer(idx)}
                      disabled={showExplanation}
                      className={`w-full text-left p-3 rounded-xl border text-xs flex items-center justify-between transition ${optionStyles}`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 font-mono text-[10px] flex items-center justify-center font-bold">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span>{opt}</span>
                      </div>
                      {showExplanation && (
                        <div>
                          {isCorrect ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : isSelected ? (
                            <XCircle className="w-4 h-4 text-rose-400" />
                          ) : null}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Feedback / Explanation */}
              {showExplanation && (
                <div
                  className={`p-4 rounded-xl border text-xs space-y-1.5 animate-in fade-in ${
                    selectedQuizAnswer === concept.knowledgeCheck.correctIndex
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                      : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                  }`}
                >
                  <p className="font-semibold">
                    {selectedQuizAnswer === concept.knowledgeCheck.correctIndex
                      ? '✨ Correct! Excellent grasp of this concept.'
                      : '❌ Incorrect answer.'}
                  </p>
                  <p className="text-slate-300 leading-relaxed">{concept.knowledgeCheck.explanation}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/60 text-xs text-slate-400">
          <span>This preview accurately mirrors student mode and does not alter live study progress.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium transition"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
};

