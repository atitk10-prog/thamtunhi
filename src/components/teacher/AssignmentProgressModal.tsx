import React, { useState, useEffect } from 'react';
import {
  X,
  Users,
  CheckCircle2,
  Clock,
  BookOpen,
  Award,
  Layers,
  Search,
  RefreshCw,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { Assignment, AssignmentProgress, AssignmentStudentProgress } from '../../types';
import { dataService } from '../../lib/dataService';

export interface AssignmentProgressModalProps {
  isOpen: boolean;
  assignment: Assignment | null;
  onClose: () => void;
}

export const AssignmentProgressModal: React.FC<AssignmentProgressModalProps> = ({
  isOpen,
  assignment,
  onClose,
}) => {
  const [dataOrigin, setDataOrigin] = useState<'real' | 'simulation'>('real');
  const [progress, setProgress] = useState<AssignmentProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'in_progress' | 'not_started'>('all');

  useEffect(() => {
    if (isOpen && assignment) {
      loadProgress(dataOrigin);
    }
  }, [isOpen, assignment]);

  const loadProgress = async (origin: 'real' | 'simulation' = dataOrigin) => {
    if (!assignment) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await dataService.fetchAssignmentProgress(assignment.id, origin);
      setProgress(data);
    } catch (err: any) {
      console.error('Fetch assignment progress error:', err);
      setErrorMsg(err.message || 'Không thể tải tiến độ bài làm. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !assignment) return null;

  const filteredStudents = (progress?.studentProgressList || []).filter((s: AssignmentStudentProgress) => {
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !q ||
      s.studentName.toLowerCase().includes(q) ||
      (s.studentCode && s.studentCode.toLowerCase().includes(q));
    return matchesStatus && matchesQuery;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-white rounded-3xl border-3 border-sky-300 shadow-2xl p-5 sm:p-7 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase text-sky-600 tracking-wider">
                Theo Dõi Tiến Độ Chi Tiết
              </span>
              <span
                className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full border ${
                  assignment.status === 'cancelled'
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : assignment.status === 'closed'
                    ? 'bg-slate-100 text-slate-700 border-slate-200'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}
              >
                {assignment.status === 'cancelled'
                  ? 'Đã hủy'
                  : assignment.status === 'closed'
                  ? 'Đã đóng'
                  : 'Đang mở'}
              </span>
            </div>
            <h3 className="text-xl font-black text-slate-800 mt-0.5">
              {assignment.title}
            </h3>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              Lớp: <span className="font-bold text-slate-700">{assignment.className || assignment.classId}</span>
              {assignment.studentName && <span> • Riêng học sinh: {assignment.studentName}</span>}
              {assignment.dueDate && <span> • Hạn nộp: {assignment.dueDate}</span>}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => loadProgress(dataOrigin)}
              disabled={loading}
              className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors"
              title="Làm mới tiến độ"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto py-4 space-y-5 pr-1">
          {errorMsg && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {loading && !progress ? (
            <div className="p-12 text-center text-slate-500 font-bold">
              Đang tải tiến độ bài làm của lớp...
            </div>
          ) : progress ? (
            <>
              {/* Data Origin Mode Switcher & Scope Notice (Requirement 5 & 8) */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase text-slate-500">Nguồn dữ liệu:</span>
                  <div className="flex rounded-xl bg-white p-1 border border-slate-200 shadow-2xs text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => {
                        setDataOrigin('real');
                        loadProgress('real');
                      }}
                      className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                        dataOrigin === 'real'
                          ? 'bg-emerald-600 text-white font-black shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Bài nộp của học sinh (Thực tế)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDataOrigin('simulation');
                        loadProgress('simulation');
                      }}
                      className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                        dataOrigin === 'simulation'
                          ? 'bg-amber-400 text-slate-900 font-black shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Dữ liệu mô phỏng quay clip
                    </button>
                  </div>
                </div>

                <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${dataOrigin === 'real' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                  <span>
                    {dataOrigin === 'real'
                      ? 'Phạm vi: Dữ liệu làm bài thực tế từ tài khoản học sinh, hoàn toàn tách biệt.'
                      : 'Phạm vi: Dữ liệu mô phỏng phục vụ quay video hướng dẫn, không tính vào điểm thực.'}
                  </span>
                </div>
              </div>

              {/* Summary Metrics Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="p-3.5 rounded-2xl bg-sky-50 border border-sky-100 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-sky-700 text-xs font-extrabold">
                    <span>Được giao</span>
                    <Users className="w-4 h-4" />
                  </div>
                  <div className="text-2xl font-black text-sky-900 mt-2">
                    {progress.totalStudents}
                    <span className="text-xs font-bold text-sky-600 ml-1">HS</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-100 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-emerald-700 text-xs font-extrabold">
                    <span>Đã nộp bài</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div className="text-2xl font-black text-emerald-900 mt-2">
                    {progress.submittedStudentsCount}
                    <span className="text-xs font-bold text-emerald-600 ml-1">
                      ({progress.totalStudents > 0 ? Math.round((progress.submittedStudentsCount / progress.totalStudents) * 100) : 0}%)
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-100 border border-slate-200 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-700 text-xs font-extrabold">
                    <span>Chưa làm</span>
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div className="text-2xl font-black text-slate-900 mt-2">
                    {progress.notStartedStudentsCount}
                    <span className="text-xs font-bold text-slate-500 ml-1">HS</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-100 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-indigo-700 text-xs font-extrabold">
                    <span>Tổng lượt nộp</span>
                    <Layers className="w-4 h-4" />
                  </div>
                  <div className="text-2xl font-black text-indigo-900 mt-2">
                    {progress.totalAttemptsCount}
                    <span className="text-xs font-bold text-indigo-600 ml-1">lượt</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-100 flex flex-col justify-between col-span-2 sm:col-span-1">
                  <div className="flex items-center justify-between text-amber-800 text-xs font-extrabold">
                    <span>Điểm TB</span>
                    <Award className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="text-2xl font-black text-amber-900 mt-2">
                    {progress.averageScore}
                    <span className="text-xs font-bold text-amber-600 ml-1">đ</span>
                  </div>
                </div>
              </div>

              {/* Filter and Search Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                  <button
                    type="button"
                    onClick={() => setStatusFilter('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer transition-colors ${
                      statusFilter === 'all'
                        ? 'bg-slate-800 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Tất cả ({progress.studentProgressList.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('completed')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer transition-colors ${
                      statusFilter === 'completed'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                    }`}
                  >
                    Đã nộp ({progress.submittedStudentsCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('in_progress')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer transition-colors ${
                      statusFilter === 'in_progress'
                        ? 'bg-amber-500 text-white'
                        : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                    }`}
                  >
                    Đang làm ({progress.inProgressStudentsCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('not_started')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer transition-colors ${
                      statusFilter === 'not_started'
                        ? 'bg-slate-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Chưa làm ({progress.notStartedStudentsCount})
                  </button>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm tên hoặc mã học sinh..."
                    className="w-full h-9 pl-9 pr-3 rounded-xl border border-slate-200 text-xs font-semibold focus:border-sky-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Student Roster Table */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-black border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3">Học sinh</th>
                        <th className="px-4 py-3">Trạng thái</th>
                        <th className="px-4 py-3 text-center">Số lượt làm</th>
                        <th className="px-4 py-3 text-right">Điểm cao nhất</th>
                        <th className="px-4 py-3">Nộp lần cuối</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                      {filteredStudents.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                            Không có học sinh nào phù hợp bộ lọc.
                          </td>
                        </tr>
                      ) : (
                        filteredStudents.map((s: AssignmentStudentProgress) => (
                          <tr key={s.studentId} className="hover:bg-slate-50/70 transition-colors">
                            <td className="px-4 py-3">
                              <div className="font-extrabold text-slate-900">{s.studentName}</div>
                              {s.studentCode && (
                                <div className="text-[11px] text-slate-400 font-medium">
                                  Mã: {s.studentCode}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {s.status === 'completed' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Đã hoàn thành
                                </span>
                              ) : s.status === 'in_progress' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-black bg-amber-50 text-amber-700 border border-amber-200">
                                  <Clock className="w-3 h-3 text-amber-600" /> Đang làm
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-500">
                                  <BookOpen className="w-3 h-3 text-slate-400" /> Chưa làm
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {s.attemptsCount > 0 ? (
                                <span className="font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full text-[11px] border border-indigo-200">
                                  {s.attemptsCount} lần
                                </span>
                              ) : (
                                <span className="text-slate-400">0</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {s.status === 'completed' ? (
                                <span className="font-black text-sm text-amber-900 bg-amber-50 px-2.5 py-0.5 rounded-xl border border-amber-200">
                                  {s.bestScore} / {s.maxScore || 80}
                                </span>
                              ) : (
                                <span className="text-slate-300 font-bold">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-slate-500 text-[11px]">
                              {s.lastSubmittedAt ? (
                                <span>{new Date(s.lastSubmittedAt).toLocaleDateString('vi-VN')} {new Date(s.lastSubmittedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                              ) : (
                                <span className="text-slate-300">—</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-black text-xs cursor-pointer shadow-xs transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
