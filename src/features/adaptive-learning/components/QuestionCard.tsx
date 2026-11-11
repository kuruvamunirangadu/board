'use client';

import { FormEvent, useState } from 'react';
import { AssessmentQuestion } from '../../assessment/AssessmentContracts';

export function QuestionCard({ question, disabled, onSubmit, onHint }: {
  question: AssessmentQuestion;
  disabled?: boolean;
  onSubmit: (answer: string | number) => void;
  onHint: () => void;
}) {
  const [answer, setAnswer] = useState('');
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!answer.trim() || disabled) return;
    onSubmit(question.questionType === 'multiple_choice' ? Number(answer) : answer.trim());
  };
  return <form onSubmit={submit} className="space-y-3">
    <div className="flex items-center justify-between text-[11px] text-slate-400"><span>Difficulty {question.difficulty}/5</span><span>{question.questionType.replaceAll('_', ' ')}</span></div>
    <p className="text-sm text-slate-100 leading-relaxed">{question.question}</p>
    {question.questionType === 'multiple_choice' && question.options ? <div className="space-y-2">{question.options.map((option, index) => <label key={`${question.id}-${index}`} className={`flex gap-2 items-start p-2 rounded border text-xs cursor-pointer ${answer === String(index) ? 'border-indigo-400 bg-indigo-950/50 text-white' : 'border-slate-700 bg-slate-900/50 text-slate-300'}`}><input type="radio" name={`assessment-${question.id}`} value={index} checked={answer === String(index)} onChange={(event) => setAnswer(event.target.value)} disabled={disabled} />{option}</label>)}</div> : <input aria-label="Your answer" value={answer} onChange={(event) => setAnswer(event.target.value)} disabled={disabled} placeholder={question.unit ? `Answer (${question.unit})` : 'Enter your answer'} className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />}
    <div className="flex gap-2"><button type="submit" disabled={disabled || !answer.trim()} className="rounded bg-indigo-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">Check answer</button><button type="button" onClick={onHint} disabled={disabled} className="rounded border border-slate-700 px-3 py-2 text-xs text-slate-300 disabled:opacity-50">Hint</button></div>
  </form>;
}
