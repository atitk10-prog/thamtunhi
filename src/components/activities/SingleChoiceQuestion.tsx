import React from 'react';
import { Question } from '../../types';
import { VisualCounters } from './VisualCounters';

interface SingleChoiceQuestionProps {
  question: Question;
  selectedAnswer: string;
  onSelectAnswer: (ans: string) => void;
  disabled?: boolean;
}

export const SingleChoiceQuestion: React.FC<SingleChoiceQuestionProps> = ({
  question,
  selectedAnswer,
  onSelectAnswer,
  disabled = false,
}) => {
  const options = question.options || ['A', 'B', 'C', 'D'];

  return (
    <div className="w-full">
      <VisualCounters config={question.visualConfig} questionPrompt={question.prompt} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
        {options.map((opt, idx) => {
          const isSelected = selectedAnswer === opt;
          return (
            <button
              key={idx}
              type="button"
              disabled={disabled}
              onClick={() => onSelectAnswer(opt)}
              className={`min-h-[64px] px-6 py-4 rounded-2xl border-3 text-xl font-bold transition-all duration-200 flex items-center justify-between shadow-sm cursor-pointer active:scale-98 text-left ${
                isSelected
                  ? 'bg-amber-400 border-amber-500 text-slate-900 shadow-amber-200 ring-4 ring-amber-200/60 scale-[1.02]'
                  : 'bg-white border-slate-200 hover:border-sky-400 hover:bg-sky-50/50 text-slate-800'
              } ${disabled ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-center gap-4">
                <span className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg ${
                  isSelected ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className="text-xl sm:text-2xl font-extrabold">{opt}</span>
              </div>
              {isSelected && (
                <span className="text-2xl text-amber-900 animate-bounce">
                  ✨
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
