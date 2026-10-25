import React from 'react';
import { Question } from '../../types';
import { VisualCounters } from './VisualCounters';

interface OperatorPickQuestionProps {
  question: Question;
  selectedOperator: string;
  onSelectOperator: (op: string) => void;
  disabled?: boolean;
}

export const OperatorPickQuestion: React.FC<OperatorPickQuestionProps> = ({
  question,
  selectedOperator,
  onSelectOperator,
  disabled = false,
}) => {
  const operators = question.options || ['>', '<', '='];

  return (
    <div className="w-full flex flex-col items-center">
      <VisualCounters config={question.visualConfig} questionPrompt={question.prompt} />

      <div className="text-center text-sm font-bold text-slate-500 mb-4 uppercase tracking-wider">
        Chạm chọn dấu thích hợp:
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 my-2">
        {operators.map((op) => {
          const isSelected = selectedOperator === op;
          return (
            <button
              key={op}
              type="button"
              disabled={disabled}
              onClick={() => onSelectOperator(op)}
              className={`w-20 h-20 sm:w-24 sm:h-24 rounded-3xl border-3 flex items-center justify-center text-4xl sm:text-5xl font-black transition-all cursor-pointer shadow-md active:scale-95 ${
                isSelected
                  ? 'bg-amber-400 border-amber-600 text-slate-900 shadow-amber-300 ring-4 ring-amber-200 scale-110'
                  : 'bg-white border-slate-200 hover:border-sky-400 hover:bg-sky-50 text-sky-800'
              } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              {op}
            </button>
          );
        })}
      </div>

      {selectedOperator && (
        <div className="mt-5 px-6 py-2 rounded-full bg-amber-100 text-amber-900 font-extrabold text-base border border-amber-300">
          Em đã chọn dấu: <span className="text-xl font-black">{selectedOperator}</span>
        </div>
      )}
    </div>
  );
};
