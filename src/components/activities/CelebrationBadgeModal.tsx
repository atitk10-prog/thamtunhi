import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Award, Star, CheckCircle, Home } from 'lucide-react';
import { FoxDetective } from '../mascot/FoxDetective';

interface CelebrationBadgeModalProps {
  isOpen: boolean;
  score: number;
  maxScore: number;
  firstTryCount: number;
  postHintCount: number;
  durationSeconds: number;
  onFinish: () => void;
  onRetry?: () => void;
}

export const CelebrationBadgeModal: React.FC<CelebrationBadgeModalProps> = ({
  isOpen,
  score,
  maxScore,
  firstTryCount,
  postHintCount,
  durationSeconds,
  onFinish,
  onRetry,
}) => {
  useEffect(() => {
    if (isOpen) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {
        // Fallback gracefully if canvas is constrained
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const percent = maxScore > 0 ? Math.round((score / maxScore) * 100) : 100;
  
  let badgeName = 'Huy Hiệu Thám Tử Nhí Kiên Trì';
  let badgeIcon = '🌟';
  let badgeDescription = 'Em đã rất chăm chỉ và không bỏ cuộc!';

  if (percent >= 90) {
    badgeName = 'Huy Hiệu Thám Tử Đại Tài';
    badgeIcon = '🏆';
    badgeDescription = 'Phá án thần tốc với độ chính xác xuất sắc!';
  } else if (percent >= 70) {
    badgeName = 'Huy Hiệu Kính Lúp Thông Thái';
    badgeIcon = '🔍';
    badgeDescription = 'Khám phá ra nhiều manh mối toán học hay!';
  }

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m} phút ${s} giây`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in zoom-in-95 duration-200">
      <div className="w-full max-w-md bg-white rounded-3xl border-4 border-amber-400 shadow-2xl p-6 sm:p-8 flex flex-col items-center text-center relative overflow-hidden">
        {/* Glow behind mascot */}
        <div className="w-40 h-40 rounded-full bg-amber-200/50 absolute top-4 filter blur-xl -z-0" />

        <div className="relative z-10 mb-2">
          <FoxDetective mood="celebrating" size="lg" />
        </div>

        <span className="text-4xl mb-1">{badgeIcon}</span>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-800">
          Chúc mừng Thám tử nhí!
        </h2>
        <p className="text-slate-600 font-bold text-sm mt-1">
          Em đã hoàn thành xuất sắc nhiệm vụ toán học!
        </p>

        {/* Badge Card */}
        <div className="w-full my-4 p-4 rounded-2xl bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-50 border-2 border-amber-300 shadow-sm flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center text-2xl font-black shadow mb-2">
            <Award className="w-7 h-7" />
          </div>
          <h4 className="text-lg font-black text-amber-900">{badgeName}</h4>
          <p className="text-xs font-semibold text-amber-800 mt-1">{badgeDescription}</p>
        </div>

        {/* Stats Grid */}
        <div className="w-full grid grid-cols-3 gap-2 my-2 text-left">
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500 uppercase">
              <Star className="w-3.5 h-3.5 text-amber-500" /> Điểm số
            </div>
            <div className="text-xl font-black text-slate-800 mt-1">
              {score ?? 0}/{maxScore > 0 ? maxScore : 80}
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500 uppercase">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Đúng ngay
            </div>
            <div className="text-xl font-black text-emerald-700 mt-1">
              {firstTryCount} câu
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500 uppercase">
              💡 Sau gợi ý
            </div>
            <div className="text-xl font-black text-sky-700 mt-1">
              +{postHintCount}
            </div>
          </div>
        </div>

        <div className="text-xs font-bold text-slate-500 mt-1">
          Thời gian hoàn thành: {formatTime(durationSeconds)}
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-2 mt-6">
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 active:scale-98 text-amber-950 text-base font-black shadow-md cursor-pointer transition-all flex items-center justify-center gap-2"
            >
              🔄 Luyện tập lại lượt mới
            </button>
          )}
          <button
            type="button"
            onClick={onFinish}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 active:scale-98 text-white text-base font-black shadow-lg shadow-emerald-200 cursor-pointer transition-all flex items-center justify-center gap-2"
          >
            <Home className="w-5 h-5" /> Trở về Bàn Nhiệm Vụ
          </button>
        </div>
      </div>
    </div>
  );
};
