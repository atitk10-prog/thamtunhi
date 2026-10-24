import React, { useState, useEffect } from 'react';
import { RotateCcw } from 'lucide-react';
import { Question } from '../../types';

interface NumberLineOrderQuestionProps {
  question: Question;
  answer: string;
  onAnswerChange: (ans: string) => void;
  disabled?: boolean;
}

export const NumberLineOrderQuestion: React.FC<NumberLineOrderQuestionProps> = ({
  question,
  answer,
  onAnswerChange,
  disabled = false,
}) => {
  const isOrdering = (question.options || []).length > 2 && String(question.expectedAnswer ?? '').includes(',');

  // Scramble available tiles so they are NEVER presented in the sorted answer order
  const availableTiles = React.useMemo(() => {
    const raw = question.options || ['1', '2', '3', '4'];
    const expected = String(question.expectedAnswer ?? '').split(',').map((s) => s.trim());

    // Make a copy and scramble deterministically
    const scrambled = [...raw];
    if (scrambled.length > 1) {
      // Rotate or reverse if currently sorted
      if (scrambled.join(',') === expected.join(',')) {
        // Swap elements so it is not in expected order
        const last = scrambled.pop()!;
        scrambled.unshift(last);
      }
      // Second check: if still matches, reverse
      if (scrambled.join(',') === expected.join(',')) {
        scrambled.reverse();
      }
    }
    return scrambled;
  }, [question.options, question.expectedAnswer]);

  const [selectedSequence, setSelectedSequence] = useState<string[]>(
    answer ? answer.split(',').filter(Boolean) : []
  );

  useEffect(() => {
    if (answer) {
      setSelectedSequence(answer.split(',').filter(Boolean));
    } else {
      setSelectedSequence([]);
    }
  }, [answer]);

  const handleTileClick = (tile: string) => {
    if (disabled || selectedSequence.includes(tile)) return;
    const nextSeq = [...selectedSequence, tile];
    setSelectedSequence(nextSeq);
    onAnswerChange(nextSeq.join(','));
  };

  const handleRemoveTile = (index: number) => {
    if (disabled) return;
    const nextSeq = selectedSequence.filter((_, i) => i !== index);
    setSelectedSequence(nextSeq);
    onAnswerChange(nextSeq.join(','));
  };

  const handleReset = () => {
    if (disabled) return;
    setSelectedSequence([]);
    onAnswerChange('');
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* Number line visual when target or min/max is present */}
      {question.visualConfig?.type === 'number_line' && (
        <div className="w-full max-w-xl my-4 p-4 sm:p-6 bg-sky-50/80 rounded-3xl border-2 border-sky-200">
          <div className="text-xs font-black uppercase tracking-wider text-sky-800 text-center mb-4">
            Trục Số Thám Tử (Nhảy bước từ trái sang phải)
          </div>
          <div className="relative pt-6 pb-2 px-4">
            {/* Horizontal Line with Arrow */}
            <div className="h-2 bg-sky-400 rounded-full w-full relative">
              <div className="absolute right-0 -top-1.5 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-l-[12px] border-l-sky-500" />
            </div>

            {/* Tick marks */}
            <div className="flex justify-between items-center mt-3">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((tick) => (
                <div key={tick} className="flex flex-col items-center">
                  <div className="w-0.5 h-3 bg-sky-600 -mt-5" />
                  <span className="text-xs sm:text-sm font-extrabold text-sky-900 mt-2">{tick}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* If this is a sequence sorting activity */}
      {isOrdering ? (
        <div className="w-full max-w-lg flex flex-col items-center">
          <div className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
            Chạm vào từng số để xếp theo thứ tự:
          </div>

          {/* Sorted Target Slots */}
          <div className="w-full min-h-[72px] p-3 rounded-2xl bg-amber-50/70 border-3 border-dashed border-amber-300 flex items-center justify-center gap-3 flex-wrap">
            {selectedSequence.length === 0 ? (
              <span className="text-sm font-bold text-amber-700/80">
                Chạm vào các thẻ số bên dưới để xếp vào đây
              </span>
            ) : (
              selectedSequence.map((val, idx) => (
                <button
                  key={idx}
                  type="button"
                  disabled={disabled}
                  onClick={() => handleRemoveTile(idx)}
                  className="w-14 h-14 rounded-2xl bg-amber-400 border-2 border-amber-600 text-slate-900 text-2xl font-black shadow-md cursor-pointer hover:bg-rose-400 hover:text-white transition-all flex items-center justify-center"
                  title="Chạm để gỡ số này ra"
                >
                  {val}
                </button>
              ))
            )}
          </div>

          {/* Available Number Tiles */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
            {availableTiles.map((tile) => {
              const isUsed = selectedSequence.includes(tile);
              return (
                <button
                  key={tile}
                  type="button"
                  disabled={disabled || isUsed}
                  onClick={() => handleTileClick(tile)}
                  className={`w-16 h-16 rounded-2xl border-3 text-2xl font-black transition-all shadow-sm flex items-center justify-center ${
                    isUsed
                      ? 'bg-slate-100 border-slate-200 text-slate-300 cursor-not-allowed scale-90 opacity-40'
                      : 'bg-white border-slate-200 hover:border-sky-400 hover:bg-sky-50 text-slate-800 cursor-pointer active:scale-95'
                  }`}
                >
                  {tile}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-4 mt-5">
            <button
              type="button"
              disabled={disabled || selectedSequence.length === 0}
              onClick={handleReset}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold flex items-center gap-2 cursor-pointer transition-colors"
            >
              <RotateCcw className="w-4 h-4" /> Xếp lại
            </button>
          </div>
        </div>
      ) : (
        /* If single choice or number line option */
        <div className="w-full max-w-sm grid grid-cols-2 gap-3 mt-4">
          {(question.options || []).map((opt) => (
            <button
              key={opt}
              type="button"
              disabled={disabled}
              onClick={() => onAnswerChange(opt)}
              className={`h-16 rounded-2xl border-3 text-2xl font-black cursor-pointer shadow-sm active:scale-95 flex items-center justify-center transition-all ${
                answer === opt
                  ? 'bg-amber-400 border-amber-600 text-slate-900 ring-4 ring-amber-200 scale-105'
                  : 'bg-white border-slate-200 hover:border-sky-400 hover:bg-sky-50 text-slate-800'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
