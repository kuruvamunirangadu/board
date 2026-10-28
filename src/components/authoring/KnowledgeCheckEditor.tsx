'use client';

import React from 'react';
import { HelpCircle, Plus, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';

interface KnowledgeCheckData {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  hint?: string;
}

interface KnowledgeCheckEditorProps {
  knowledgeCheck?: KnowledgeCheckData;
  onChange: (data?: KnowledgeCheckData) => void;
}

export const KnowledgeCheckEditor: React.FC<KnowledgeCheckEditorProps> = ({
  knowledgeCheck,
  onChange,
}) => {
  const isEnabled = !!knowledgeCheck;

  const handleToggle = () => {
    if (isEnabled) {
      onChange(undefined);
    } else {
      onChange({
        question: 'Which statement accurately describes this concept?',
        options: ['First possibility', 'Second alternative', 'Third option', 'Fourth option'],
        correctIndex: 0,
        explanation: 'Detailed explanation of why this option is scientifically or mathematically correct.',
        hint: 'Review the definition and core principles.',
      });
    }
  };

  if (!isEnabled) {
    return (
      <div className="p-4 rounded-xl bg-slate-900/30 border border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <HelpCircle className="w-5 h-5 text-slate-500" />
          <div>
            <h4 className="text-xs font-semibold text-slate-300">Formative Knowledge Check</h4>
            <p className="text-[11px] text-slate-500">
              Attach an interactive multiple-choice question to assess learner mastery
            </p>
          </div>
        </div>
        <button
          onClick={handleToggle}
          className="px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-medium transition"
        >
          Enable Quiz
        </button>
      </div>
    );
  }

  const handleQuestionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange({
      ...knowledgeCheck,
      question: e.target.value,
    });
  };

  const handleOptionChange = (idx: number, val: string) => {
    const nextOptions = [...knowledgeCheck.options];
    nextOptions[idx] = val;
    onChange({
      ...knowledgeCheck,
      options: nextOptions,
    });
  };

  const handleAddOption = () => {
    onChange({
      ...knowledgeCheck,
      options: [...knowledgeCheck.options, `Option ${knowledgeCheck.options.length + 1}`],
    });
  };

  const handleRemoveOption = (idx: number) => {
    if (knowledgeCheck.options.length <= 2) return; // Keep minimum 2
    const nextOptions = knowledgeCheck.options.filter((_, i) => i !== idx);
    let nextCorrect = knowledgeCheck.correctIndex;
    if (nextCorrect >= nextOptions.length) {
      nextCorrect = nextOptions.length - 1;
    }
    onChange({
      ...knowledgeCheck,
      options: nextOptions,
      correctIndex: nextCorrect,
    });
  };

  const handleSelectCorrect = (idx: number) => {
    onChange({
      ...knowledgeCheck,
      correctIndex: idx,
    });
  };

  const handleExplanationChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange({
      ...knowledgeCheck,
      explanation: e.target.value,
    });
  };

  const handleHintChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...knowledgeCheck,
      hint: e.target.value,
    });
  };

  return (
    <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <HelpCircle className="w-4 h-4 text-purple-400" />
          <h4 className="text-xs font-semibold text-white">Interactive Knowledge Check Quiz</h4>
        </div>
        <button
          onClick={handleToggle}
          className="text-xs text-red-400 hover:text-red-300 transition"
        >
          Remove Quiz
        </button>
      </div>

      {/* Question Text */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-medium text-slate-300">Question Prompt</label>
        <textarea
          rows={2}
          value={knowledgeCheck.question}
          onChange={handleQuestionChange}
          placeholder="Enter question text here..."
          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 transition"
        />
      </div>

      {/* Options List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-medium text-slate-300">
            Answer Options (Select the correct answer)
          </label>
          <button
            onClick={handleAddOption}
            className="flex items-center space-x-1 text-[11px] text-cyan-400 hover:text-cyan-300"
          >
            <Plus className="w-3 h-3" />
            <span>Add Option</span>
          </button>
        </div>

        <div className="space-y-2">
          {knowledgeCheck.options.map((opt, idx) => {
            const isCorrect = knowledgeCheck.correctIndex === idx;

            return (
              <div
                key={idx}
                className={`flex items-center space-x-2 p-2 rounded-lg border transition ${
                  isCorrect
                    ? 'bg-emerald-950/30 border-emerald-500/50'
                    : 'bg-slate-950 border-slate-800'
                }`}
              >
                <button
                  type="button"
                  onClick={() => handleSelectCorrect(idx)}
                  className={`p-1 rounded-full transition ${
                    isCorrect
                      ? 'text-emerald-400 bg-emerald-500/20'
                      : 'text-slate-600 hover:text-slate-400'
                  }`}
                  title="Mark as correct answer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                </button>

                <input
                  type="text"
                  value={opt}
                  onChange={(e) => handleOptionChange(idx, e.target.value)}
                  className="flex-1 bg-transparent border-none text-xs text-white focus:outline-none"
                  placeholder={`Option ${idx + 1}`}
                />

                {knowledgeCheck.options.length > 2 && (
                  <button
                    onClick={() => handleRemoveOption(idx)}
                    className="p-1 text-slate-600 hover:text-red-400 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Explanation & Hint */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-slate-300">Explanation (Shown after answer)</label>
          <textarea
            rows={2}
            value={knowledgeCheck.explanation}
            onChange={handleExplanationChange}
            placeholder="Explain why the correct answer is true..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-cyan-500 transition"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-medium text-slate-300">Optional Hint</label>
          <input
            type="text"
            value={knowledgeCheck.hint || ''}
            onChange={handleHintChange}
            placeholder="Provide a clue for struggling learners..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-cyan-500 transition"
          />
        </div>
      </div>
    </div>
  );
};

