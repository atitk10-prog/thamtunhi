import React, { useState, useEffect } from 'react';
import { Play, CheckCircle, Clock, Award, LogOut, Sparkles, BookOpen, Key, RefreshCw, AlertCircle, Calendar } from 'lucide-react';
import { Assignment, LessonVersion, Attempt, UserProfile } from '../../types';
import { FoxDetective } from '../mascot/FoxDetective';
import { MissionPlayer } from './MissionPlayer';
import { StudentPinModal } from './StudentPinModal';
import { dataService } from '../../lib/dataService';

interface StudentPortalProps {
  currentUser: UserProfile;
  onLogout: () => void;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({
  currentUser,
  onLogout,
}) => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [attempts, setAttempts] = useState<Record<string, Attempt[]>>({});
  const [loading, setLoading] = useState(true);
  const [emptyReason, setEmptyReason] = useState<string | null>(null);

  // Active mission state
  const [activeAssignment, setActiveAssignment] = useState<Assignment | null>(null);
  const [activeLessonVersion, setActiveLessonVersion] = useState<LessonVersion | null>(null);
  const [loadingMission, setLoadingMission] = useState(false);

  // PIN change modal
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);

  useEffect(() => {
    fetchStudentAssignments();
    try {
      const savedAssignment = sessionStorage.getItem('thamtunhi_active_mission_assignment');
      const savedVersion = sessionStorage.getItem('thamtunhi_active_mission_version');
      if (savedAssignment && savedVersion) {
        setActiveAssignment(JSON.parse(savedAssignment));
        setActiveLessonVersion(JSON.parse(savedVersion));
      }
    } catch (e) {
      console.warn('Failed to restore mission session:', e);
    }
  }, [currentUser]);

  const fetchStudentAssignments = async () => {
    setLoading(true);
    setEmptyReason(null);
    try {
      if (!currentUser.classId) {
        setEmptyReason('Tài khoản chưa được xếp vào lớp học. Em hãy báo thầy cô xếp lớp cho em nhé!');
        setAssignments([]);
        setAttempts({});
        return;
      }

      // 1. Fetch assignments strictly for student's class and own private assignments
      const list = await dataService.fetchStudentAssignments(currentUser.classId, currentUser.id);

      // Exclude cancelled and archived assignments (Requirement A6)
      const visibleList = list.filter((a) => a.status !== 'cancelled' && a.status !== 'archived');

      // Sort strictly by assignedAt DESC, fallback to createdAt DESC (Requirement A1 & A2)
      visibleList.sort((a, b) => {
        const timeA = new Date(a.assignedAt || a.createdAt || 0).getTime();
        const timeB = new Date(b.assignedAt || b.createdAt || 0).getTime();
        return timeB - timeA;
      });

      // 2. Fetch attempts for current student and group into arrays per assignment
      const attList = await dataService.fetchStudentAttempts(currentUser.id);
      const attMap: Record<string, Attempt[]> = {};
      attList.forEach((att) => {
        if (!attMap[att.assignmentId]) {
          attMap[att.assignmentId] = [];
        }
        attMap[att.assignmentId].push(att);
      });

      setAssignments(visibleList);
      setAttempts(attMap);

      if (visibleList.length === 0) {
        setEmptyReason(
          `Thầy cô lớp ${currentUser.className || ''} chưa giao bài luyện tập mới. Em hãy quay lại sau nhé!`
        );
      }
    } catch (err: any) {
      console.error('Fetch student assignments error:', err);
      setEmptyReason(
        err.message || 'Không thể kết nối đến máy chủ để tải bài tập. Em hãy kiểm tra đường truyền mạng nhé.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleStartMission = async (assignment: Assignment) => {
    setLoadingMission(true);
    try {
      // Fetch the immutable LessonVersion via unified data service
      const version = await dataService.fetchLessonVersion(assignment.lessonVersionId);
      if (version) {
        try {
          sessionStorage.setItem('thamtunhi_active_mission_assignment', JSON.stringify(assignment));
          sessionStorage.setItem('thamtunhi_active_mission_version', JSON.stringify(version));
        } catch (e) {}
        setActiveLessonVersion(version);
        setActiveAssignment(assignment);
      } else {
        alert('Không tìm thấy nội dung bài học. Vui lòng báo giáo viên.');
      }
    } catch (err) {
      console.error('Load mission error:', err);
      alert('Không thể tải bài học. Vui lòng thử lại.');
    } finally {
      setLoadingMission(false);
    }
  };

  if (activeAssignment && activeLessonVersion) {
    return (
      <div className="min-h-screen bg-slate-100 p-4 sm:p-6 flex items-center justify-center">
        <MissionPlayer
          assignment={activeAssignment}
          lessonVersion={activeLessonVersion}
          currentUser={currentUser}
          onExit={() => {
            try {
              sessionStorage.removeItem('thamtunhi_active_mission_assignment');
              sessionStorage.removeItem('thamtunhi_active_mission_version');
            } catch (e) {}
            setActiveAssignment(null);
            setActiveLessonVersion(null);
            fetchStudentAssignments();
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-slate-50 to-amber-50/40">
      {/* Navigation Top Header */}
      <header className="bg-white/90 backdrop-blur-md border-b-2 border-sky-100 sticky top-0 z-30 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FoxDetective mood="happy" size="sm" />
            <div>
              <div className="text-xs uppercase font-extrabold text-sky-600 tracking-wider">
                Góc Học Tập Thám Tử
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-800">
                THÁM TỬ TOÁN NHÍ
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-sm font-extrabold text-slate-800">
                {currentUser.displayName}
              </span>
              <span className="text-xs font-bold text-sky-600">
                Mã: {currentUser.studentCode} • {currentUser.className ? `Lớp ${currentUser.className}` : 'Chưa phân lớp'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsPinModalOpen(true)}
              className="px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-900 border-2 border-amber-300 text-xs font-black flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow-2xs"
              title="Đổi mã PIN bí mật của em"
            >
              <Key className="w-4 h-4 text-amber-600" />
              <span>Đổi mã PIN</span>
            </button>

            <button
              type="button"
              onClick={onLogout}
              className="p-2 sm:px-4 sm:py-2 rounded-2xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-700 text-sm font-bold flex items-center gap-2 cursor-pointer transition-colors border border-slate-200"
            >
              <LogOut className="w-4 h-4" /> <span className="hidden sm:inline">Đăng xuất</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Welcome Banner */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-sky-500 via-sky-600 to-indigo-600 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden mb-8">
          <div className="relative z-10 max-w-xl text-center sm:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/20 text-xs font-black uppercase tracking-wider mb-3">
              <Sparkles className="w-4 h-4 text-amber-300" /> Nhiệm vụ hôm nay
            </div>
            <h2 className="text-2xl sm:text-3xl font-black leading-tight">
              Chào mừng Thám tử nhí {currentUser.displayName}!
            </h2>
            <p className="mt-2 text-sky-100 text-sm sm:text-base font-semibold">
              Mỗi bài toán là một câu đố thú vị. Đừng sợ sai, vì mỗi lỗi sai đều là một manh mối để em tiến bộ hơn!
            </p>
          </div>

          <div className="relative z-10 flex-shrink-0">
            <FoxDetective mood="idle" size="lg" />
          </div>
        </div>

        {/* Assigned Missions Section */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-800 flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-sky-600" /> Bàn Nhiệm Vụ Của Em
            </h3>
            <p className="text-xs sm:text-sm font-bold text-slate-500 mt-0.5">
              Các bài luyện tập toán được giáo viên giao cho em và lớp {currentUser.className || ''}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
            <p className="text-lg font-bold text-slate-600 animate-pulse">
              Đang tải danh sách bài tập...
            </p>
          </div>
        ) : assignments.length === 0 ? (
          <div className="p-10 sm:p-12 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200 shadow-xs">
            <FoxDetective mood="thinking" size="md" className="mx-auto mb-4" />
            <h4 className="text-lg font-black text-slate-700">Chưa có nhiệm vụ mới</h4>
            <p className="text-sm font-semibold text-slate-500 mt-1 max-w-md mx-auto">
              {emptyReason || 'Thầy cô sẽ sớm giao bài luyện tập toán thú vị cho em nhé!'}
            </p>
            <button
              type="button"
              onClick={fetchStudentAssignments}
              className="mt-4 px-4 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer border border-sky-200 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Tải lại danh sách
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assignments.map((assignment) => {
              const assignmentAttempts = attempts[assignment.id] || [];
              const completedAttempts = assignmentAttempts.filter((a) => a.status === 'completed');
              const inProgressAttempt = assignmentAttempts.find((a) => a.status === 'in_progress');
              const completedCount = completedAttempts.length;

              // Check if assignment is overdue
              const isOverdue = Boolean(
                assignment.dueDate && new Date(assignment.dueDate).getTime() < Date.now()
              );

              // 4 Distinct States (Requirement A3):
              // - Đã hoàn thành (completedCount > 0)
              // - Quá hạn (isOverdue && completedCount === 0)
              // - Đang làm (inProgressAttempt && completedCount === 0)
              // - Chưa làm (completedCount === 0 && !inProgressAttempt && !isOverdue)
              const isFinished = completedCount > 0;
              const isStarted = !isFinished && Boolean(inProgressAttempt);
              const isDueExpired = !isFinished && isOverdue;

              const bestAttempt = completedAttempts.reduce<Attempt | null>((best, cur) => {
                if (!best) return cur;
                return (cur.score ?? 0) > (best.score ?? 0) ? cur : best;
              }, null);

              return (
                <div
                  key={assignment.id}
                  className={`bg-white rounded-3xl border-3 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between ${
                    isDueExpired
                      ? 'border-rose-200 hover:border-rose-400'
                      : isFinished
                      ? 'border-emerald-200 hover:border-emerald-400'
                      : 'border-slate-200 hover:border-sky-400'
                  }`}
                >
                  <div>
                    {/* Top status bar */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                        Toán Lớp {assignment.grade || currentUser.grade || 1}
                      </span>

                      {/* 4 Distinct Badges */}
                      {isFinished ? (
                        <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Đã hoàn thành
                        </span>
                      ) : isDueExpired ? (
                        <span className="inline-flex items-center gap-1 text-xs font-black text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-600" /> Quá hạn
                        </span>
                      ) : isStarted ? (
                        <span className="inline-flex items-center gap-1 text-xs font-black text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                          <Clock className="w-3.5 h-3.5 text-amber-600" /> Đang làm
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                          <BookOpen className="w-3.5 h-3.5 text-slate-400" /> Chưa làm
                        </span>
                      )}
                    </div>

                    {/* Submission count tag (Requirement A4) */}
                    {completedCount > 0 && (
                      <div className="mb-2">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-black">
                          <Sparkles className="w-3 h-3 text-indigo-500" /> Đã làm {completedCount} lần
                        </span>
                      </div>
                    )}

                    <h4 className="text-lg font-black text-slate-800 mb-2 leading-snug">
                      {assignment.title}
                    </h4>

                    {/* Teacher instructions */}
                    {assignment.instructions && (
                      <div className="my-2.5 p-2.5 rounded-2xl bg-sky-50/70 border border-sky-100 text-xs text-sky-950 flex items-start gap-1.5">
                        <span className="font-extrabold text-sky-700 shrink-0">💬 Lời dặn:</span>
                        <span className="font-semibold text-slate-700">{assignment.instructions}</span>
                      </div>
                    )}

                    {/* Best score display */}
                    {isFinished && bestAttempt && (
                      <div className="my-3 p-3 rounded-2xl bg-amber-50/80 border border-amber-200 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-amber-900 font-extrabold text-sm">
                          <Award className="w-4 h-4 text-amber-600" /> Điểm cao nhất:
                        </div>
                        <span className="text-lg font-black text-amber-900">
                          {bestAttempt.score ?? 0}/{bestAttempt.maxScore && bestAttempt.maxScore > 0 ? bestAttempt.maxScore : (bestAttempt.totalQuestions ? bestAttempt.totalQuestions * 10 : 80)}
                        </span>
                      </div>
                    )}

                    {/* Due date info */}
                    <div className="mt-2.5 flex items-center gap-1.5 text-xs font-bold text-slate-500">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        {assignment.dueDate ? `Hạn nộp: ${assignment.dueDate}` : 'Không giới hạn thời gian'}
                      </span>
                      {isDueExpired && (
                        <span className="text-rose-600 font-extrabold text-[11px]">(Hết hạn nộp)</span>
                      )}
                    </div>
                  </div>

                  {/* Action button */}
                  <div className="mt-6 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      disabled={loadingMission}
                      onClick={() => handleStartMission(assignment)}
                      className={`w-full py-3.5 px-4 rounded-2xl text-base font-black flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 shadow-md ${
                        isFinished
                          ? 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                          : isDueExpired
                          ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300'
                          : 'bg-amber-400 hover:bg-amber-500 text-slate-900 shadow-amber-200 ring-2 ring-amber-300'
                      }`}
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>
                        {isFinished
                          ? (inProgressAttempt ? `Tiếp tục làm lượt ${completedCount + 1}` : 'Luyện tập lại')
                          : isStarted
                          ? 'Tiếp tục làm'
                          : isDueExpired
                          ? 'Làm bài quá hạn'
                          : 'Bắt đầu phá án'}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Student PIN / Password Change Modal */}
      <StudentPinModal
        isOpen={isPinModalOpen}
        studentName={currentUser.displayName}
        studentCode={currentUser.studentCode || ''}
        onClose={() => setIsPinModalOpen(false)}
        onSuccess={() => fetchStudentAssignments()}
      />
    </div>
  );
};
