import React, { useState, useEffect } from 'react';
import {
  Users,
  ArrowLeft,
  Search,
  Plus,
  Lock,
  Unlock,
  Key,
  ArrowRightLeft,
  Send,
  History,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  Award,
  Check,
  Edit,
  UserPlus,
  Loader2,
  Calendar,
} from 'lucide-react';
import { dataService } from '../../lib/dataService';
import { Classroom } from '../../types';

interface StudentRosterItem {
  id: string;
  studentCode: string;
  displayName: string;
  classId: string;
  className: string;
  grade: number;
  status: 'active' | 'locked' | 'inactive';
  assignedCount: number;
  completedCount: number;
  inProgressCount: number;
  avgScore: number | null;
  lastActive: string | null;
  createdAt?: string;
}

interface ClassRosterViewProps {
  classroom: Classroom;
  teacherId: string;
  isAdmin: boolean;
  allClasses: Classroom[];
  onBack: () => void;
  onAssignToStudent: (student: { id: string; displayName: string; classId: string; studentCode?: string }) => void;
  onAssignToClass: (classId: string) => void;
}

export const ClassRosterView: React.FC<ClassRosterViewProps> = ({
  classroom,
  teacherId,
  isAdmin,
  allClasses,
  onBack,
  onAssignToStudent,
  onAssignToClass,
}) => {
  const [students, setStudents] = useState<StudentRosterItem[]>([]);
  const [classAssignments, setClassAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'locked'>('all');

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addName, setAddName] = useState('');
  const [addCode, setAddCode] = useState('');
  const [addSecret, setAddSecret] = useState('matkhau123');
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Edit / Action modal
  const [editingStudent, setEditingStudent] = useState<StudentRosterItem | null>(null);
  const [editAction, setEditAction] = useState<'transfer' | 'reset_secret' | 'rename' | null>(null);
  const [transferTargetClassId, setTransferTargetClassId] = useState(classroom.id);
  const [newSecret, setNewSecret] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Student history modal
  const [viewingHistoryStudent, setViewingHistoryStudent] = useState<StudentRosterItem | null>(null);
  const [studentAttempts, setStudentAttempts] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    fetchRoster();
  }, [classroom.id]);

  const fetchRoster = async () => {
    setLoading(true);
    try {
      const data = await dataService.fetchClassStudents(classroom.id);
      setStudents(data.students);
      setClassAssignments(data.assignments);
    } catch (err: any) {
      console.error('Fetch class roster error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Open add student modal
  const handleOpenAddModal = () => {
    const nextIdx = students.length + 1;
    const padded = nextIdx < 10 ? `0${nextIdx}` : `${nextIdx}`;
    setAddName('');
    setAddCode(`HS${classroom.name.replace(/[^A-Za-z0-9]/g, '').toUpperCase()}${padded}`);
    setAddSecret('matkhau123');
    setAddError(null);
    setIsAddOpen(true);
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addName.trim() || !addCode.trim() || !addSecret.trim()) {
      setAddError('Vui lòng điền đầy đủ họ tên, mã học sinh và mật khẩu.');
      return;
    }
    setIsAdding(true);
    setAddError(null);
    try {
      await dataService.addStudentToClass(classroom.id, {
        displayName: addName.trim(),
        studentCode: addCode.trim().toUpperCase(),
        accessSecret: addSecret.trim(),
        grade: classroom.grade,
      });
      setIsAddOpen(false);
      await fetchRoster();
    } catch (err: any) {
      setAddError(err.message || 'Lỗi thêm học sinh mới.');
    } finally {
      setIsAdding(false);
    }
  };

  // Toggle lock / unlock
  const handleToggleLock = async (student: StudentRosterItem) => {
    const isLocked = student.status === 'locked' || student.status === 'inactive';
    const nextStatus: 'active' | 'locked' = isLocked ? 'active' : 'locked';
    const confirmMsg = nextStatus === 'locked'
      ? `Bạn có chắc muốn KHÓA tài khoản của học sinh ${student.displayName} (${student.studentCode})?`
      : `Mở khóa tài khoản cho học sinh ${student.displayName} (${student.studentCode})?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      await dataService.updateStudent(student.id, { status: nextStatus });
      await fetchRoster();
    } catch (err: any) {
      alert(err.message || 'Không thể thay đổi trạng thái học sinh.');
    }
  };

  // Submit edit (transfer, reset secret, or rename)
  const handleSubmitEdit = async () => {
    if (!editingStudent) return;
    setIsUpdating(true);
    setEditError(null);

    try {
      if (editAction === 'transfer') {
        if (transferTargetClassId === classroom.id) {
          setEditError('Vui lòng chọn lớp học khác với lớp hiện tại.');
          setIsUpdating(false);
          return;
        }
        await dataService.updateStudent(editingStudent.id, { classId: transferTargetClassId });
      } else if (editAction === 'reset_secret') {
        if (!newSecret.trim()) {
          setEditError('Vui lòng nhập mật khẩu mới.');
          setIsUpdating(false);
          return;
        }
        await dataService.updateStudent(editingStudent.id, { accessSecret: newSecret.trim() });
      } else if (editAction === 'rename') {
        if (!newDisplayName.trim()) {
          setEditError('Vui lòng nhập tên học sinh.');
          setIsUpdating(false);
          return;
        }
        await dataService.updateStudent(editingStudent.id, { displayName: newDisplayName.trim() });
      }

      setEditingStudent(null);
      setEditAction(null);
      await fetchRoster();
    } catch (err: any) {
      setEditError(err.message || 'Lỗi cập nhật học sinh.');
    } finally {
      setIsUpdating(false);
    }
  };

  // View student attempt history
  const handleViewHistory = async (student: StudentRosterItem) => {
    setViewingHistoryStudent(student);
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/student/attempts?studentId=${encodeURIComponent(student.id)}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('thamtunhi_auth_token') || ''}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setStudentAttempts(data.attempts || []);
      } else {
        setStudentAttempts([]);
      }
    } catch (err) {
      console.error('Fetch student history error:', err);
      setStudentAttempts([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Filter students
  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      !searchQuery.trim() ||
      s.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.studentCode.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && s.status !== 'locked') ||
      (statusFilter === 'locked' && s.status === 'locked');
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Chưa có hoạt động';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Breadcrumb & Action Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onBack}
            className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer transition-colors flex items-center gap-1.5 text-xs font-bold"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại danh sách lớp
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase text-sky-600 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200">
                Toán Khối {classroom.grade}
              </span>
              <span className="text-xs font-bold text-slate-500">
                Niên khóa: {classroom.academicYearId || '2025-2026'}
              </span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 mt-1">
              Danh sách Học Sinh Lớp {classroom.name}
            </h2>
            <p className="text-xs font-semibold text-slate-500">
              Sĩ số thực tế: <strong className="text-sky-700">{students.length} học sinh</strong> (xác thực từ cơ sở dữ liệu tài khoản)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            id="btn-assign-class"
            onClick={() => onAssignToClass(classroom.id)}
            className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-sm cursor-pointer transition-all active:scale-95"
          >
            <Send className="w-4 h-4" /> Giao bài cho cả lớp
          </button>

          <button
            type="button"
            id="btn-add-student"
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-black text-xs flex items-center gap-1.5 shadow-sm cursor-pointer transition-all active:scale-95"
          >
            <UserPlus className="w-4 h-4" /> Thêm học sinh
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              id="roster-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo Mã học sinh hoặc Họ tên..."
              className="w-full h-10 pl-10 pr-4 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:border-sky-500 focus:outline-hidden"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold">
          <span className="text-slate-500 uppercase tracking-wider font-black">Trạng thái:</span>
          <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-lg cursor-pointer ${statusFilter === 'all' ? 'bg-white shadow-xs text-sky-800 font-black' : 'text-slate-600'}`}
            >
              Tất cả ({students.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1 rounded-lg cursor-pointer ${statusFilter === 'active' ? 'bg-white shadow-xs text-emerald-800 font-black' : 'text-slate-600'}`}
            >
              Đang học ({students.filter((s) => s.status !== 'locked').length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('locked')}
              className={`px-3 py-1 rounded-lg cursor-pointer ${statusFilter === 'locked' ? 'bg-white shadow-xs text-rose-800 font-black' : 'text-slate-600'}`}
            >
              Bị khóa ({students.filter((s) => s.status === 'locked').length})
            </button>
          </div>
        </div>
      </div>

      {/* Roster Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-16 text-center text-slate-500 font-bold flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-sky-600 animate-spin" />
            <p>Đang tải danh sách học sinh Lớp {classroom.name}...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-16 text-center text-slate-400 font-bold">
            Không tìm thấy học sinh nào phù hợp với bộ lọc tìm kiếm.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-black border-b border-slate-200">
                <tr>
                  <th className="px-5 py-4">Mã HS</th>
                  <th className="px-5 py-4">Họ và tên</th>
                  <th className="px-5 py-4">Trạng thái</th>
                  <th className="px-5 py-4 text-center">Tiến độ nộp bài</th>
                  <th className="px-5 py-4 text-center">Điểm TB</th>
                  <th className="px-5 py-4">Lần học gần nhất</th>
                  <th className="px-5 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {filteredStudents.map((student) => {
                  const isLocked = student.status === 'locked' || student.status === 'inactive';

                  return (
                    <tr key={student.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-4">
                        <span className="font-mono font-black text-xs px-2.5 py-1 rounded-lg bg-sky-50 text-sky-800 border border-sky-200">
                          {student.studentCode}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-black text-slate-900">{student.displayName}</div>
                        <div className="text-[11px] text-slate-400">Khối {student.grade} • Lớp {classroom.name}</div>
                      </td>

                      <td className="px-5 py-4">
                        {isLocked ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-50 text-rose-700 border border-rose-200">
                            <Lock className="w-3 h-3" /> Đã khóa
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" /> Đang học
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-center">
                        <span className="text-xs font-bold text-slate-800">
                          {student.completedCount} / {student.assignedCount} bài
                        </span>
                        <div className="w-24 h-1.5 bg-slate-100 rounded-full mx-auto mt-1 overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{
                              width: `${student.assignedCount > 0 ? Math.round((student.completedCount / student.assignedCount) * 100) : 0}%`,
                            }}
                          />
                        </div>
                      </td>

                      <td className="px-5 py-4 text-center">
                        {student.avgScore !== null ? (
                          <span className={`text-xs font-black px-2 py-0.5 rounded-lg ${
                            student.avgScore >= 80 ? 'bg-amber-100 text-amber-900' : 'bg-slate-100 text-slate-800'
                          }`}>
                            ⭐ {student.avgScore}%
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-slate-400">Chưa có</span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-xs text-slate-600">
                        {formatDate(student.lastActive)}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onAssignToStudent(student)}
                            title="Giao bài riêng cho học sinh này"
                            className="p-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 cursor-pointer transition-colors"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleViewHistory(student)}
                            title="Xem lịch sử bài làm chi tiết"
                            className="p-1.5 rounded-lg bg-sky-100 hover:bg-sky-200 text-sky-900 cursor-pointer transition-colors"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleLock(student)}
                            title={isLocked ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
                            className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                              isLocked ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {isLocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setEditingStudent(student);
                              setEditAction('reset_secret');
                              setNewSecret('');
                              setEditError(null);
                            }}
                            title="Đặt lại mật khẩu"
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer transition-colors"
                          >
                            <Key className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setEditingStudent(student);
                              setEditAction('transfer');
                              setTransferTargetClassId(allClasses.find((c) => c.id !== classroom.id)?.id || classroom.id);
                              setEditError(null);
                            }}
                            title="Chuyển lớp an toàn"
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer transition-colors"
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Class Assignments Progress Breakdown */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
        <h3 className="text-lg font-black text-slate-800 mb-2">
          Theo dõi tiến độ các bài tập đã giao cho Lớp {classroom.name}
        </h3>
        <p className="text-xs font-semibold text-slate-500 mb-4">
          Tỷ lệ học sinh đã nhận, chưa làm, đang làm và hoàn tất theo từng bài
        </p>

        {classAssignments.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl text-slate-400 font-bold text-xs">
            Chưa có bài tập nào được giao cho lớp này. Nhấn "Giao bài cho cả lớp" để bắt đầu.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-black border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Tên bài học</th>
                  <th className="px-4 py-3">Hạn nộp</th>
                  <th className="px-4 py-3 text-center">Sĩ số nhận</th>
                  <th className="px-4 py-3 text-center text-emerald-700">Đã hoàn thành</th>
                  <th className="px-4 py-3 text-center text-sky-700">Đang làm</th>
                  <th className="px-4 py-3 text-center text-slate-500">Chưa làm</th>
                  <th className="px-4 py-3 text-center">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {classAssignments.map((a) => {
                  const targetCount = a.studentId ? 1 : students.length;
                  return (
                    <tr key={a.id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3 font-bold text-slate-900">
                        {a.title}
                        {a.studentName && (
                          <span className="ml-2 text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                            Riêng: {a.studentName}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">{a.dueDate || 'Không giới hạn'}</td>
                      <td className="px-4 py-3 text-center font-bold">{targetCount}</td>
                      <td className="px-4 py-3 text-center text-emerald-700 font-bold">
                        {/* Dynamically computed from attempt count */}
                        {students.filter((s) => s.completedCount > 0).length}
                      </td>
                      <td className="px-4 py-3 text-center text-sky-700 font-bold">
                        {students.filter((s) => s.inProgressCount > 0).length}
                      </td>
                      <td className="px-4 py-3 text-center text-slate-500 font-bold">
                        {Math.max(0, targetCount - students.filter((s) => s.completedCount > 0).length)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" /> Đang mở
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: ADD STUDENT */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-3xl border-3 border-sky-300 shadow-2xl p-6 sm:p-8 flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-xl font-black text-slate-900">Thêm Học Sinh Mới</h3>
                <p className="text-xs font-semibold text-slate-500">Lớp {classroom.name} (Khối {classroom.grade})</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {addError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold">
                {addError}
              </div>
            )}

            <form onSubmit={handleAddStudent} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1">
                  Họ và tên học sinh *
                </label>
                <input
                  type="text"
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn An"
                  className="w-full h-11 px-3.5 rounded-xl border-2 border-slate-200 font-bold text-slate-800 text-sm focus:border-sky-500 focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1">
                  Mã học sinh đăng nhập *
                </label>
                <input
                  type="text"
                  value={addCode}
                  onChange={(e) => setAddCode(e.target.value.toUpperCase())}
                  placeholder="Ví dụ: HS1A15"
                  className="w-full h-11 px-3.5 rounded-xl border-2 border-slate-200 font-mono font-bold text-slate-800 text-sm focus:border-sky-500 focus:outline-hidden"
                  required
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Mã học sinh dùng để đăng nhập cổng học sinh. Không phân biệt hoa/thường.
                </span>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1">
                  Mật khẩu truy cập ban đầu *
                </label>
                <input
                  type="text"
                  value={addSecret}
                  onChange={(e) => setAddSecret(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border-2 border-slate-200 font-mono font-bold text-slate-800 text-sm focus:border-sky-500 focus:outline-hidden"
                  required
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isAdding}
                  className="px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-black text-sm flex items-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Thêm học sinh
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT STUDENT (TRANSFER, RESET SECRET, RENAME) */}
      {editingStudent && editAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-3xl border-3 border-sky-300 shadow-2xl p-6 sm:p-8 flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-xl font-black text-slate-900">
                  {editAction === 'transfer' && 'Chuyển Lớp An Toàn'}
                  {editAction === 'reset_secret' && 'Đặt Lại Mật Khẩu'}
                  {editAction === 'rename' && 'Cập Nhật Họ Tên'}
                </h3>
                <p className="text-xs font-semibold text-slate-500">
                  Học sinh: {editingStudent.displayName} ({editingStudent.studentCode})
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingStudent(null);
                  setEditAction(null);
                }}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {editError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold">
                {editError}
              </div>
            )}

            <div className="space-y-4">
              {editAction === 'transfer' && (
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1.5">
                    Chọn lớp chuyển đến:
                  </label>
                  <select
                    value={transferTargetClassId}
                    onChange={(e) => setTransferTargetClassId(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl border-2 border-slate-200 bg-white font-bold text-slate-800 text-sm focus:border-sky-500 focus:outline-hidden"
                  >
                    {allClasses.map((c) => (
                      <option key={c.id} value={c.id} disabled={c.id === classroom.id}>
                        Lớp {c.name} (Khối {c.grade}) {c.id === classroom.id ? '— Lớp hiện tại' : ''}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-500 mt-2 font-medium">
                    Toàn bộ lịch sử bài làm và điểm số của học sinh sẽ được bảo toàn khi chuyển lớp.
                  </p>
                </div>
              )}

              {editAction === 'reset_secret' && (
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1.5">
                    Mật khẩu truy cập mới:
                  </label>
                  <input
                    type="text"
                    value={newSecret}
                    onChange={(e) => setNewSecret(e.target.value)}
                    placeholder="Nhập mật khẩu mới cho học sinh..."
                    className="w-full h-11 px-3.5 rounded-xl border-2 border-slate-200 font-mono font-bold text-slate-800 text-sm focus:border-sky-500 focus:outline-hidden"
                  />
                  <p className="text-[11px] text-slate-500 mt-2 font-medium">
                    Mật khẩu cũ không bao giờ được hiển thị để bảo đảm an toàn thông tin cá nhân.
                  </p>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setEditingStudent(null);
                    setEditAction(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={handleSubmitEdit}
                  className="px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-black text-sm flex items-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Lưu thay đổi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: STUDENT HISTORY */}
      {viewingHistoryStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-white rounded-3xl border-3 border-sky-300 shadow-2xl p-6 sm:p-8 flex flex-col max-h-[85vh] overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-xl font-black text-slate-900">
                  Lịch Sử Học Tập: {viewingHistoryStudent.displayName}
                </h3>
                <p className="text-xs font-semibold text-slate-500">
                  Mã HS: {viewingHistoryStudent.studentCode} • Lớp {classroom.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewingHistoryStudent(null)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {loadingHistory ? (
                <div className="p-12 text-center text-slate-500 font-bold flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-sky-600" />
                  <p>Đang tải lịch sử bài làm...</p>
                </div>
              ) : studentAttempts.length === 0 ? (
                <div className="p-12 text-center text-slate-400 font-bold">
                  Học sinh chưa có lượt làm bài nào được ghi nhận.
                </div>
              ) : (
                studentAttempts.map((att) => {
                  const max = att.maxScore && att.maxScore > 0 ? att.maxScore : (att.totalQuestions ? att.totalQuestions * 10 : 80);
                  const pct = Math.round(((att.score || 0) / max) * 100);

                  return (
                    <div
                      key={att.id}
                      className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-black text-slate-900 text-sm">
                          {att.lessonTitle || 'Bài tập Toán'}
                        </div>
                        <div className="text-xs text-slate-500 font-medium mt-0.5 flex items-center gap-2">
                          <span>{formatDate(att.completedAt || att.startedAt)}</span>
                          <span>•</span>
                          <span>{att.status === 'completed' ? 'Đã nộp bài' : 'Đang làm dở'}</span>
                          <span>•</span>
                          <span>Đúng lần 1: {att.firstAttemptCorrectCount || 0}</span>
                          <span>•</span>
                          <span>Sau gợi ý: +{att.postHintCorrectCount || 0}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-lg font-black text-slate-900">
                          {att.score ?? 0}/{max}
                        </div>
                        <div className={`text-xs font-black px-2 py-0.5 rounded-full inline-block ${
                          pct >= 80 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {pct}%
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setViewingHistoryStudent(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
