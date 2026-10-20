import React, { useState } from 'react';
import { Check, RotateCcw } from 'lucide-react';
import { Question } from '../../types';

interface ExpressionMatchQuestionProps {
  question: Question;
  matchedPairs: Record<string, string>; // left -> right
  onPairsChange: (pairs: Record<string, string>) => void;
  disabled?: boolean;
}

export const ExpressionMatchQuestion: React.FC<ExpressionMatchQuestionProps> = ({
  question,
  matchedPairs,
  onPairsChange,
  disabled = false,
}) => {
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);

  const rawPairs = question.pairs || [
    { left: 'Phần 1', right: 'Khớp 1' },
    { left: 'Phần 2', right: 'Khớp 2' }
  ];

  const leftItems = rawPairs.map((p) => p.left);
  // Keep right items fixed or stable
  const rightItems = rawPairs.map((p) => p.right);

  const handleSelectLeft = (left: string) => {
    if (disabled) return;
    setSelectedLeft(selectedLeft === left ? null : left);
  };

  const handleSelectRight = (right: string) => {
    if (disabled || !selectedLeft) return;

    // Check if right is already paired
    const newPairs = { ...matchedPairs };
    
    // Remove if another left was mapped to this right
    Object.keys(newPairs).forEach((k) => {
      if (newPairs[k] === right) delete newPairs[k];
    });

    newPairs[selectedLeft] = right;
    onPairsChange(newPairs);
    setSelectedLeft(null);
  };

  const handleReset = () => {
    if (disabled) return;
    onPairsChange({});
    setSelectedLeft(null);
  };

  const isComplete = leftItems.every((left) => matchedPairs[left]);

  return (
    <div className="w-full flex flex-col items-center">
      <div className="text-xs sm:text-sm font-extrabold text-sky-700 bg-sky-50 px-4 py-2 rounded-xl mb-4 border border-sky-200">
        👉 Bước 1: Chạm chọn thẻ cột Trái &rarr; Bước 2: Chạm chọn thẻ cột Phải tương ứng
      </div>

      <div className="w-full max-w-xl grid grid-cols-2 gap-4 sm:gap-8 my-2">
        {/* Left Column */}
        <div className="flex flex-col gap-3">
          <div className="text-xs font-black uppercase tracking-wider text-slate-500 text-center">
            Cột A
          </div>
          {leftItems.map((left, idx) => {
            const isSelected = selectedLeft === left;
            const pairedWith = matchedPairs[left];

            return (
              <button
                key={idx}
                type="button"
                disabled={disabled}
                onClick={() => handleSelectLeft(left)}
                className={`min-h-[58px] p-3 sm:p-4 rounded-2xl border-3 text-base sm:text-lg font-bold text-left transition-all active:scale-95 shadow-sm cursor-pointer flex items-center justify-between ${
                  isSelected
                    ? 'bg-amber-400 border-amber-600 text-slate-900 ring-4 ring-amber-200 scale-102'
                    : pairedWith
                    ? 'bg-emerald-50 border-emerald-400 text-emerald-900 font-extrabold'
                    : 'bg-white border-slate-200 hover:border-sky-400 hover:bg-sky-50 text-slate-800'
                }`}
              >
                <span>{left}</span>
                {pairedWith && <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-3">
          <div className="text-xs font-black uppercase tracking-wider text-slate-500 text-center">
            Cột B
          </div>
          {rightItems.map((right, idx) => {
            const isPaired = Object.values(matchedPairs).includes(right);

            return (
              <button
                key={idx}
                type="button"
                disabled={disabled || !selectedLeft}
                onClick={() => handleSelectRight(right)}
                className={`min-h-[58px] p-3 sm:p-4 rounded-2xl border-3 text-base sm:text-lg font-bold text-left transition-all shadow-sm flex items-center justify-between ${
                  selectedLeft
                    ? 'bg-white border-sky-300 hover:border-sky-500 hover:bg-sky-100/70 cursor-pointer active:scale-95 ring-2 ring-sky-200 animate-pulse'
                    : isPaired
                    ? 'bg-emerald-50 border-emerald-400 text-emerald-900 font-extrabold cursor-default'
                    : 'bg-slate-50 border-slate-200 text-slate-700 cursor-default opacity-80'
                }`}
              >
                <span>{right}</span>
                {isPaired && <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-4 mt-5">
        <button
          type="button"
          disabled={disabled || Object.keys(matchedPairs).length === 0}
          onClick={handleReset}
          className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold flex items-center gap-2 cursor-pointer transition-colors"
        >
          <RotateCcw className="w-4 h-4" /> Nối lại từ đầu
        </button>

        {isComplete && (
          <div className="text-sm font-extrabold text-emerald-700 bg-emerald-100 px-4 py-2 rounded-xl border border-emerald-300">
            Đã nối đủ các cặp!
          </div>
        )}
      </div>
    </div>
  );
};
