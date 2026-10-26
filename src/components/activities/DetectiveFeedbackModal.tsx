import React from 'react';
import { Sparkles, ArrowRight, Volume2 } from 'lucide-react';
import { FoxDetective } from '../mascot/FoxDetective';
import { MathErrorPattern } from '../../types';
import { ERROR_PATTERN_LABELS } from '../../lib/mathEngine';
import { playVietnameseAudio, stopVietnameseAudio } from '../../lib/vietnameseAudioPlayer';
import { normalizeMathTextForSpeech, getAudioHash } from '../../lib/vietnameseTts';

interface DetectiveFeedbackModalProps {
  isOpen: boolean;
  pattern?: MathErrorPattern;
  hintText?: string;
  visualGuidance?: string;
  hintAudioUrl?: string;
  isGrade1Scope?: boolean;
  onRetry: () => void;
  canTryAgain: boolean;
  onContinue?: () => void;
}

export const DetectiveFeedbackModal: React.FC<DetectiveFeedbackModalProps> = ({
  isOpen,
  pattern,
  hintText,
  visualGuidance,
  hintAudioUrl,
  isGrade1Scope = false,
  onRetry,
  canTryAgain,
  onContinue,
}) => {
  const [isPlaying, setIsPlaying] = React.useState(false);

  React.useEffect(() => {
    if (!isOpen) {
      stopVietnameseAudio();
      setIsPlaying(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const patternInfo = pattern ? ERROR_PATTERN_LABELS[pattern] : null;

  const handleToggleAudio = () => {
    if (!hintText) return;
    if (isPlaying) {
      stopVietnameseAudio();
    }
    const spoken = normalizeMathTextForSpeech(hintText);
    const url = hintAudioUrl || `/audio/h_${getAudioHash(spoken)}.mp3`;
    playVietnameseAudio(
      url,
      spoken,
      () => setIsPlaying(true),
      () => setIsPlaying(false)
    );
  };

  const handleSafeRetry = () => {
    stopVietnameseAudio();
    setIsPlaying(false);
    onRetry();
  };

  const handleSafeContinue = () => {
    stopVietnameseAudio();
    setIsPlaying(false);
    if (onContinue) onContinue();
  };

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

        {/* Hint text with audio speaker */}
        <div className="w-full my-3 p-4 rounded-2xl bg-amber-50 border-2 border-amber-200 text-amber-950 font-bold text-base sm:text-lg leading-relaxed text-left">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-sm sm:text-base font-extrabold text-amber-900 underline decoration-amber-400 decoration-2">
              💡 Lời khuyên của Cáo Thám tử:
            </span>
            {isGrade1Scope && (
              <button
                type="button"
                onClick={handleToggleAudio}
                className={`p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center border shadow-xs ${
                  isPlaying
                    ? 'bg-amber-500 text-white border-amber-600 ring-2 ring-amber-300 scale-105'
                    : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300'
                }`}
                aria-label="Phát âm thanh manh mối"
                title="Nghe manh mối"
              >
                <Volume2 className={`w-4 h-4 ${isPlaying ? 'animate-pulse' : ''}`} />
              </button>
            )}
          </div>
          <p className="text-slate-800 font-semibold text-base leading-relaxed">
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
              onClick={handleSafeRetry}
              className="flex-1 py-4 px-6 rounded-2xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white text-lg font-black shadow-lg shadow-amber-300/50 cursor-pointer active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              Thử lại lần nữa nào! 🦊
            </button>
          ) : (
            onContinue && (
              <button
                type="button"
                onClick={handleSafeContinue}
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
