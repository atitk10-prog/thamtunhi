import React from 'react';
import { Question } from '../../types';

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
  const visual = question.visualConfig;
  const isBundle = visual?.type === 'bundles' || visual?.tens !== undefined;
  const tens = visual?.tens || 0;
  const ones = visual?.ones || 0;
  const count = visual?.count || (tens * 10 + ones);

  const options = question.options || ['10', '15', '20'];

  return (
    <div className="w-full flex flex-col items-center">
      {/* Visual Model Canvas */}
      <div className="w-full max-w-lg my-4 p-5 bg-gradient-to-b from-sky-50 to-indigo-50/50 rounded-3xl border-3 border-sky-200 shadow-sm">
        {isBundle && tens > 0 ? (
          <div>
            <div className="text-xs font-black uppercase tracking-wider text-sky-700 text-center mb-3">
              Mô hình Que tính: {tens} Bó Chục &amp; {ones} Que Lẻ
            </div>
            <div className="flex flex-wrap items-center justify-center gap-6 p-4 bg-white/80 rounded-2xl border-2 border-sky-100">
              {/* Tens Bundles */}
              <div className="flex flex-wrap items-center gap-3">
                {Array.from({ length: tens }).map((_, i) => (
                  <div
                    key={`ten-${i}`}
                    className="flex flex-col items-center p-2 rounded-xl bg-amber-50 border-2 border-amber-300 shadow-sm"
                  >
                    <div className="w-10 h-16 rounded-lg bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 border-2 border-amber-600 flex items-center justify-center text-xs font-black text-amber-950 shadow">
                      10
                    </div>
                    <span className="text-[11px] font-bold text-amber-800 mt-1">1 bó chục</span>
                  </div>
                ))}
              </div>

              {/* Plus separator */}
              {ones > 0 && <span className="text-2xl font-black text-slate-400">+</span>}

              {/* Ones Single Sticks */}
              {ones > 0 && (
                <div className="flex flex-wrap items-center gap-2 max-w-[160px]">
                  {Array.from({ length: ones }).map((_, i) => (
                    <div
                      key={`one-${i}`}
                      className="w-2.5 h-14 rounded-full bg-gradient-to-b from-emerald-400 to-emerald-600 border border-emerald-700 shadow-sm"
                      title="1 que tính rời"
                    />
                  ))}
                  <div className="w-full text-center text-[11px] font-bold text-emerald-800">
                    {ones} que rời
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div>
            <div className="text-xs font-black uppercase tracking-wider text-sky-700 text-center mb-3">
              Khung 10 Ô (Ten-Frame) Trực Quan
            </div>
            {/* Ten frame grid: 2 rows of 5 cells */}
            <div className="max-w-[280px] mx-auto grid grid-cols-5 gap-2 p-3 bg-white rounded-2xl border-3 border-sky-300 shadow-inner">
              {Array.from({ length: 10 }).map((_, i) => {
                const isFilled = i < Math.min(count, 10);
                return (
                  <div
                    key={i}
                    className="w-11 h-11 rounded-xl border-2 border-slate-200 bg-slate-50 flex items-center justify-center"
                  >
                    {isFilled && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-400 to-rose-600 border border-rose-700 shadow-sm flex items-center justify-center text-white text-xs font-bold animate-in zoom-in-50">
                        ●
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {count > 10 && (
              <div className="mt-3">
                <div className="text-[11px] font-bold text-slate-500 text-center mb-1">Khung thứ hai:</div>
                <div className="max-w-[280px] mx-auto grid grid-cols-5 gap-2 p-3 bg-white rounded-2xl border-3 border-sky-300 shadow-inner">
                  {Array.from({ length: 10 }).map((_, i) => {
                    const isFilled = i < count - 10;
                    return (
                      <div
                        key={i}
                        className="w-11 h-11 rounded-xl border-2 border-slate-200 bg-slate-50 flex items-center justify-center"
                      >
                        {isFilled && (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-400 to-sky-600 border border-sky-700 shadow-sm flex items-center justify-center text-white text-xs font-bold animate-in zoom-in-50">
                            ●
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

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
