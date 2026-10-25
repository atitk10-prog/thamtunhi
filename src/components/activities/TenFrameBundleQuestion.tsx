import React from 'react';
import { Question } from '../../types';
import { VisualCounters } from './VisualCounters';

interface TenFrameBundleQuestionProps {
  question: Question;
  selectedAnswer: string;
  onSelectAnswer: (ans: string) => void;
  disabled?: boolean;
}

export const TenFrameBundleQuestion: React.FC<TenFrameBundleQuestionProps> = ({
  question,
  selectedAnswer,
  onSelectAnswer,
  disabled = false,
}) => {
  const options = question.options || ['10', '15', '20'];

  return (
    <div className="w-full flex flex-col items-center">
      <VisualCounters config={question.visualConfig} questionPrompt={question.prompt} />

      {/* Answer selection options */}
      <div className="w-full max-w-md grid grid-cols-3 gap-3 mt-4">
        {options.map((opt) => {
          const isSelected = selectedAnswer === opt;
          return (
            <button
              key={opt}
              type="button"
              disabled={disabled}
              onClick={() => onSelectAnswer(opt)}
              className={`h-16 rounded-2xl border-3 text-2xl font-black transition-all cursor-pointer shadow-sm active:scale-95 flex items-center justify-center ${
                isSelected
                  ? 'bg-amber-400 border-amber-600 text-slate-900 shadow-amber-200 ring-4 ring-amber-200 scale-105'
                  : 'bg-white border-slate-200 hover:border-sky-400 hover:bg-sky-50 text-slate-800'
              } ${disabled ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
};
