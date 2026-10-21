import React, { useState } from 'react';
import { Link2, RotateCcw } from 'lucide-react';
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

  const leftItems = React.useMemo(() => rawPairs.map((p) => p.left), [rawPairs]);

  // Deterministically scramble right cards so they do not align 1-to-1 horizontally
  const rightItems = React.useMemo(() => {
    const list = rawPairs.map((p) => p.right);
    if (list.length <= 1) return list;
    if (list.length === 2) return [list[1], list[0]];
    if (list.length === 3) return [list[1], list[2], list[0]];
    return [...list.slice(1), list[0]];
  }, [rawPairs]);

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

  const isComplete = leftItems.length > 0 && leftItems.every((left) => Boolean(matchedPairs[left]));

  return (
    <div className="w-full flex flex-col items-center">
      <div className="text-xs sm:text-sm font-extrabold text-sky-700 bg-sky-50 px-4 py-2 rounded-xl mb-4 border border-sky-200">
        👉 Bước 1: Chạm chọn thẻ cột Trái &rarr; Bước 2: Chạm chọn thẻ cột Phải để nối cặp
      </div>

      <div className="w-full max-w-xl grid grid-cols-2 gap-4 sm:gap-8 my-2">
        {/* Left Column */}
        <div className="flex flex-col gap-3">
          <div className="text-xs font-black uppercase tracking-wider text-slate-500 text-center">
            Cột Trái
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
                className={`min-h-[58px] p-3 sm:p-4 rounded-2xl border-3 text-base sm:text-lg font-bold text-left transition-all active:scale-95 shadow-sm cursor-pointer flex flex-col justify-center ${
                  isSelected
                    ? 'bg-amber-400 border-amber-600 text-slate-900 ring-4 ring-amber-200 scale-102'
                    : pairedWith
                    ? 'bg-sky-50 border-sky-400 text-sky-900 font-extrabold'
                    : 'bg-white border-slate-200 hover:border-sky-400 hover:bg-sky-50 text-slate-800'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="leading-snug">{left}</span>
                  {pairedWith && <Link2 className="w-4 h-4 text-sky-600 flex-shrink-0 ml-1" />}
                </div>
                {pairedWith && (
                  <span className="text-xs font-bold text-sky-700 mt-1 inline-flex items-center gap-1">
                    ➔ {pairedWith}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-3">
          <div className="text-xs font-black uppercase tracking-wider text-slate-500 text-center">
            Cột Phải
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
                    ? 'bg-sky-50 border-sky-400 text-sky-900 font-extrabold cursor-default'
                    : 'bg-slate-50 border-slate-200 text-slate-700 cursor-default opacity-80'
                }`}
              >
                <span className="leading-snug">{right}</span>
                {isPaired && <span className="text-[11px] font-bold text-sky-700 bg-sky-100 px-2 py-0.5 rounded-full flex-shrink-0">Đã nối</span>}
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
            Đã nối đủ các cặp! Em có thể nhấn Trả lời.
          </div>
        )}
      </div>
    </div>
  );
};
