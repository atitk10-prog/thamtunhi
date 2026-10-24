import React from 'react';
import { Delete, RotateCcw } from 'lucide-react';
import { Question } from '../../types';
import { VisualCounters } from './VisualCounters';

interface NumberInputQuestionProps {
  question: Question;
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
}

export const NumberInputQuestion: React.FC<NumberInputQuestionProps> = ({
  question,
  value,
  onChange,
  disabled = false,
}) => {
  const handleDigit = (digit: string) => {
    if (disabled || value.length >= 6) return;
    onChange(value + digit);
  };

  const handleBackspace = () => {
    if (disabled) return;
    onChange(value.slice(0, -1));
  };

  const handleClear = () => {
    if (disabled) return;
    onChange('');
  };

  return (
    <div className="w-full flex flex-col items-center">
      <VisualCounters config={question.visualConfig} />

      {/* Big Display Box */}
      <div className="w-full max-w-xs my-4">
        <label className="block text-xs uppercase tracking-wider font-extrabold text-slate-500 mb-2 text-center">
          Đáp án của em:
        </label>
        <div className="h-20 bg-white rounded-3xl border-4 border-sky-400 shadow-inner flex items-center justify-center text-4xl sm:text-5xl font-black text-sky-800 tracking-wider">
          {(value !== undefined && value !== null && value !== '') ? value : <span className="text-slate-300 font-normal text-3xl">?</span>}
        </div>
      </div>

      {/* Virtual Big Keypad for 6-8 year olds */}
      <div className="w-full max-w-xs grid grid-cols-3 gap-2.5 mt-2">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
          <button
            key={num}
            type="button"
            disabled={disabled}
            onClick={() => handleDigit(num)}
            className="h-16 rounded-2xl bg-white border-2 border-slate-200 hover:border-sky-400 hover:bg-sky-50 active:bg-sky-100 text-2xl sm:text-3xl font-extrabold text-slate-800 shadow-sm cursor-pointer active:scale-95 transition-all flex items-center justify-center"
          >
            {num}
          </button>
        ))}

        <button
          type="button"
          disabled={disabled}
          onClick={handleClear}
          title="Xóa hết"
          className="h-16 rounded-2xl bg-slate-100 border-2 border-slate-200 hover:bg-rose-50 hover:text-rose-600 active:scale-95 transition-all flex items-center justify-center text-slate-600 font-bold"
        >
          <RotateCcw className="w-6 h-6" />
        </button>

        <button
          type="button"
          disabled={disabled}
          onClick={() => handleDigit('0')}
          className="h-16 rounded-2xl bg-white border-2 border-slate-200 hover:border-sky-400 hover:bg-sky-50 active:bg-sky-100 text-2xl sm:text-3xl font-extrabold text-slate-800 shadow-sm cursor-pointer active:scale-95 transition-all flex items-center justify-center"
        >
          0
        </button>

        <button
          type="button"
          disabled={disabled}
          onClick={handleBackspace}
          title="Xóa một số"
          className="h-16 rounded-2xl bg-slate-100 border-2 border-slate-200 hover:bg-amber-50 hover:text-amber-700 active:scale-95 transition-all flex items-center justify-center text-slate-600 font-bold"
        >
          <Delete className="w-7 h-7" />
        </button>
      </div>
    </div>
  );
};
