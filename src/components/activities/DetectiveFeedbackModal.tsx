import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { FoxDetective } from '../mascot/FoxDetective';
import { MathErrorPattern } from '../../types';
import { ERROR_PATTERN_LABELS } from '../../lib/mathEngine';

interface DetectiveFeedbackModalProps {
  isOpen: boolean;
  pattern?: MathErrorPattern;
  hintText?: string;
  visualGuidance?: string;
  onRetry: () => void;
  canTryAgain: boolean;
  onContinue?: () => void;
}

export const DetectiveFeedbackModal: React.FC<DetectiveFeedbackModalProps> = ({
  isOpen,
  pattern,
  hintText,
  visualGuidance,
  onRetry,
  canTryAgain,
  onContinue,
}) => {
  if (!isOpen) return null;

  const patternInfo = pattern ? ERROR_PATTERN_LABELS[pattern] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white rounded-3xl border-4 border-amber-300 shadow-2xl p-6 sm:p-8 flex flex-col items-center text-center relative overflow-hidden">
        {/* Decorative background circle */}
        <div className="absolute -top-16 -right-16 w-44 h-44 rounded-full bg-amber-100/60 -z-0" />
        <div className="absolute -bottom-16 -left-16 w-44 h-44 rounded-full bg-sky-100/60 -z-0" />

        {/* Mascot */}
        <div className="relative z-10 mb-3">
          <FoxDetective mood="thinking" size="lg" />
        </div>

        {/* Title */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100 text-amber-900 text-xs sm:text-sm font-extrabold mb-2 uppercase tracking-wider">
          <Sparkles className="w-4 h-4 text-amber-600" /> Manh Mối Thám Tử Toán Nhí
        </div>

        <h3 className="text-2xl sm:text-3xl font-black text-slate-800 mb-2">
          Gần đúng rồi, đừng nản lòng nhé!
        </h3>

        {/* Pattern badge for insight */}
        {patternInfo && (
          <div className="mb-3 px-3 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold">
            Phát hiện mẫu lỗi: <span className="text-slate-800 font-extrabold">{patternInfo.label}</span>
          </div>
        )}

        {/* Hint text */}
        <div className="w-full my-3 p-4 rounded-2xl bg-amber-50 border-2 border-amber-200 text-amber-950 font-bold text-base sm:text-lg leading-relaxed text-left">
          💡 <span className="underline decoration-amber-400 decoration-2">Lời khuyên của Cáo Thám tử:</span>
          <p className="mt-2 text-slate-800 font-semibold text-base">
            {hintText || 'Em hãy đọc kỹ lại câu hỏi và kiểm tra từng bước tính một lần nữa nhé!'}
          </p>
        </div>

        {visualGuidance && (
          <div className="w-full mb-4 p-3 rounded-xl bg-sky-50 border border-sky-200 text-sky-900 text-sm font-medium text-left">
            🔍 <strong>Gợi ý trực quan:</strong> {visualGuidance}
          </div>
        )}

        {/* Action button */}
        <div className="w-full flex flex-col sm:flex-row gap-3 mt-2">
          {canTryAgain ? (
            <button
              type="button"
              onClick={onRetry}
              className="flex-1 py-4 px-6 rounded-2xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white text-lg font-black shadow-lg shadow-amber-300/50 cursor-pointer active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              Thử lại lần nữa nào! 🦊
            </button>
          ) : (
            onContinue && (
              <button
                type="button"
                onClick={onContinue}
                className="flex-1 py-4 px-6 rounded-2xl bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white text-lg font-black shadow-lg shadow-sky-300/50 cursor-pointer active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                Tiếp tục câu sau <ArrowRight className="w-5 h-5" />
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
};
