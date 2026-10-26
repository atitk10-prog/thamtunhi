import React from 'react';
import { X, Award, CheckCircle, Clock, Calendar, BarChart3, TrendingUp, AlertCircle, FileText } from 'lucide-react';
import { Attempt, Assignment } from '../../types';
import { FoxDetective } from '../mascot/FoxDetective';

interface StudentLessonProgressModalProps {
  isOpen: boolean;
  assignment: Assignment;
  attempts: Attempt[];
  onClose: () => void;
}

export const StudentLessonProgressModal: React.FC<StudentLessonProgressModalProps> = ({
  isOpen,
  assignment,
  attempts,
  onClose,
}) => {
  if (!isOpen) return null;

  // Filter completed and in-progress attempts
  const completedAttempts = attempts.filter((a) => a.status === 'completed' && Boolean(a.completedAt));
  const inProgressAttempt = attempts.find((a) => a.status === 'in_progress');

  // Sort completed attempts DESC by completedAt
  const sortedCompleted = [...completedAttempts].sort(
    (a, b) => new Date(b.completedAt || 0).getTime() - new Date(a.completedAt || 0).getTime()
  );

  const bestAttempt = completedAttempts.reduce<Attempt | null>((best, cur) => {
    if (!best) return cur;
    return (cur.score ?? 0) > (best.score ?? 0) ? cur : best;
  }, null);

  const latestCompleted = sortedCompleted[0] || null;
  const completedCount = completedAttempts.length;

  const maxScore = bestAttempt?.maxScore && bestAttempt.maxScore > 0
    ? bestAttempt.maxScore
    : (bestAttempt?.totalQuestions ? bestAttempt.totalQuestions * 10 : 80);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border-2 border-sky-100 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-sky-500 via-sky-600 to-indigo-600 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-2xl">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-[11px] font-black uppercase tracking-wider text-sky-200">
                Lịch sử tiến độ học tập
              </div>
              <h3 className="text-base sm:text-lg font-black leading-snug line-clamp-1">
                {assignment.title}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/25 text-white transition-colors cursor-pointer"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Status */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
              <div className="text-[11px] font-bold text-slate-500 uppercase">Trạng thái</div>
              <div className="mt-1 flex items-center justify-center gap-1">
                {completedCount > 0 ? (
                  <span className="text-xs font-black text-emerald-700 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    Đã hoàn thành
                  </span>
                ) : inProgressAttempt ? (
                  <span className="text-xs font-black text-amber-700 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    Đang làm
                  </span>
                ) : (
                  <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
                    Chưa làm
                  </span>
                )}
              </div>
            </div>

            {/* Total Completed Count */}
            <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200 text-center">
              <div className="text-[11px] font-bold text-indigo-700 uppercase">Số lượt nộp</div>
              <div className="mt-1 text-lg font-black text-indigo-900">
                {completedCount} <span className="text-xs font-bold text-indigo-600">lượt</span>
              </div>
            </div>

            {/* Highest Score */}
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-center">
              <div className="text-[11px] font-bold text-amber-800 uppercase">Điểm cao nhất</div>
              <div className="mt-1 text-lg font-black text-amber-900">
                {bestAttempt ? (
                  <>
                    {bestAttempt.score ?? 0}
                    <span className="text-xs font-bold text-amber-700">/{maxScore}</span>
                  </>
                ) : (
                  <span className="text-xs text-slate-400 font-bold">--</span>
                )}
              </div>
            </div>

            {/* Latest Score */}
            <div className="p-3.5 rounded-2xl bg-sky-50 border border-sky-200 text-center">
              <div className="text-[11px] font-bold text-sky-800 uppercase">Điểm gần nhất</div>
              <div className="mt-1 text-lg font-black text-sky-900">
                {latestCompleted ? (
                  <>
                    {latestCompleted.score ?? 0}
                    <span className="text-xs font-bold text-sky-700">/{maxScore}</span>
                  </>
                ) : (
                  <span className="text-xs text-slate-400 font-bold">--</span>
                )}
              </div>
            </div>
          </div>

          {/* In-Progress Notification Banner */}
          {inProgressAttempt && (
            <div className="p-3.5 rounded-2xl bg-amber-50 border-2 border-amber-300 flex items-center justify-between gap-3 text-amber-900">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600 shrink-0 animate-spin" />
                <span className="text-xs font-bold">
                  Em đang có một lượt làm dở dang chưa nộp. (Lượt này chưa được tính vào số lượt hoàn thành).
                </span>
              </div>
              <span className="text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 shrink-0">
                Đang làm
              </span>
            </div>
          )}

          {/* Detailed Attempts Table */}
          <div>
            <h4 className="text-sm font-black text-slate-800 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-sky-600" /> Chi tiết các lần nộp bài ({completedCount} lần)
            </h4>

            {completedAttempts.length === 0 ? (
              <div className="p-6 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <FoxDetective mood="thinking" size="sm" className="mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-500">
                  Em chưa có lượt nộp bài hoàn thành nào cho bài này. Hãy bấm "Bắt đầu phá án" để làm bài nhé!
                </p>
              </div>
            ) : (
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-600 uppercase font-black tracking-wider text-[11px]">
                      <tr>
                        <th className="px-3.5 py-3">Lượt làm</th>
                        <th className="px-3.5 py-3">Thời gian nộp</th>
                        <th className="px-3.5 py-3 text-center">Điểm số</th>
                        <th className="px-3.5 py-3 text-center">Số câu đúng</th>
                        <th className="px-3.5 py-3 text-right">Đánh giá</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {sortedCompleted.map((att, idx) => {
                        const attemptNum = completedCount - idx;
                        const score = att.score ?? 0;
                        const totalQ = att.totalQuestions || 8;
                        const correct = att.correctCount ?? Math.round((score / (att.maxScore || 80)) * totalQ);
                        const isBest = att.id === bestAttempt?.id;
                        const isLatest = idx === 0;

                        return (
                          <tr key={att.id || idx} className="hover:bg-sky-50/50 transition-colors">
                            <td className="px-3.5 py-3 font-black text-slate-800">
                              <div className="flex items-center gap-1.5">
                                <span>Lần #{attemptNum}</span>
                                {isLatest && (
                                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-indigo-100 text-indigo-700">
                                    Gần nhất
                                  </span>
                                )}
                                {isBest && (
                                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 flex items-center gap-0.5">
                                    <Award className="w-2.5 h-2.5 text-amber-600" /> Cao nhất
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-3.5 py-3 text-slate-600 font-medium">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                                <span>
                                  {att.completedAt
                                    ? `${new Date(att.completedAt).toLocaleDateString('vi-VN')} lúc ${new Date(att.completedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`
                                    : 'Không rõ'}
                                </span>
                              </div>
                            </td>
                            <td className="px-3.5 py-3 text-center">
                              <span className="inline-block px-2.5 py-1 rounded-xl font-black text-slate-900 bg-amber-50 border border-amber-200">
                                {score}/{att.maxScore && att.maxScore > 0 ? att.maxScore : 80}
                              </span>
                            </td>
                            <td className="px-3.5 py-3 text-center font-bold text-slate-700">
                              {correct}/{totalQ} câu
                            </td>
                            <td className="px-3.5 py-3 text-right">
                              {score >= (att.maxScore || 80) * 0.9 ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                                  🌟 Xuất sắc
                                </span>
                              ) : score >= (att.maxScore || 80) * 0.7 ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-black text-sky-700 bg-sky-50 px-2 py-0.5 rounded-lg border border-sky-200">
                                  👍 Rất tốt
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                                  💪 Cố gắng thêm
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold cursor-pointer transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
