import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Sparkles,
  Send,
  Eye,
  Edit3,
  BarChart2,
  Users,
  Search,
  LogOut,
  CheckCircle2,
  Calendar,
  Layers,
  School,
  AlertCircle,
  RefreshCw,
  User,
  Trash2,
  Archive,
  ArchiveRestore,
  Ban,
  MessageSquare,
  Play,
  Filter,
} from 'lucide-react';
import { dataService } from '../../lib/dataService';
import { Lesson, LessonVersion, Classroom, UserProfile, Assignment } from '../../types';
import { FoxDetective } from '../mascot/FoxDetective';
import { LessonEditorModal } from './LessonEditorModal';
import { AiDraftModal } from './AiDraftModal';
import { AssignModal } from './AssignModal';
import { MisconceptionAnalytics } from './MisconceptionAnalytics';
import { ClassRosterView } from './ClassRosterView';
import { MissionPlayer } from '../student/MissionPlayer';
import { TeacherAccountModal } from './TeacherAccountModal';
import { EditAssignmentModal } from './EditAssignmentModal';
import { AssignmentProgressModal } from './AssignmentProgressModal';

interface TeacherPortalProps {
  currentUser: UserProfile;
  onLogout: () => void;
}

export const TeacherPortal: React.FC<TeacherPortalProps> = ({
  currentUser,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<'lessons' | 'assignments' | 'analytics'>('lessons');

  // Lessons list
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [classes, setClasses] = useState<Classroom[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedClass, setSelectedClass] = useState<Classroom | null>(null);
  const [assigningStudent, setAssigningStudent] = useState<{ id: string; displayName: string; classId: string; studentCode?: string } | null>(null);
  const [assigningClassId, setAssigningClassId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Teacher Profile & Account Modal
  const [teacherProfile, setTeacherProfile] = useState<UserProfile>(currentUser);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);

  // Assignment Management Modals
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [progressAssignment, setProgressAssignment] = useState<Assignment | null>(null);

  // Confirmation Modal
  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    message: string;
    actionLabel: string;
    danger?: boolean;
    onConfirm: () => Promise<void>;
  } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Filters
  const [gradeFilter, setGradeFilter] = useState<'all' | 1 | 2>('all');
  const [lessonStatusFilter, setLessonStatusFilter] = useState<'active' | 'archived' | 'all'>('active');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [editingVersion, setEditingVersion] = useState<LessonVersion | null>(null);

  const [isAiDraftOpen, setIsAiDraftOpen] = useState(false);

  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [assigningLesson, setAssigningLesson] = useState<Lesson | null>(null);

  // Preview as student mode (does not save attempt)
  const [previewLessonVersion, setPreviewLessonVersion] = useState<LessonVersion | null>(null);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const [lList, cList, aList] = await Promise.all([
        dataService.fetchTeacherLessons('real'),
        dataService.fetchTeacherClasses(currentUser.id),
        dataService.fetchTeacherAssignments(currentUser.id, 'real'),
      ]);
      setLessons(lList);
      setClasses(cList);
      setAssignments(aList);
    } catch (err: any) {
      console.error('Fetch teacher portal data error:', err);
      setErrorMessage(err.message || 'Không thể tải dữ liệu giáo viên. Vui lòng kiểm tra kết nối mạng.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditor = async (lesson?: Lesson) => {
    if (lesson) {
      setEditingLesson(lesson);
      const vId = lesson.draftVersionId || lesson.currentVersionId || `version-${lesson.id}-v${lesson.currentVersion || 1}`;
      try {
        const v = await dataService.fetchLessonVersion(vId);
        setEditingVersion(v || null);
      } catch (err) {
        console.error('Fetch lesson version error:', err);
        setEditingVersion(null);
      }
    } else {
      setEditingLesson(null);
      setEditingVersion(null);
    }
    setIsEditorOpen(true);
  };

  const handleOpenAssign = (
    lesson: Lesson | null = null,
    classId: string | null = null,
    student: { id: string; displayName: string; classId: string; studentCode?: string } | null = null
  ) => {
    setAssigningLesson(lesson);
    setAssigningClassId(classId);
    setAssigningStudent(student || null);
    setIsAssignOpen(true);
  };

  const handlePreviewLesson = async (lesson: Lesson) => {
    const vId = lesson.currentVersionId || `version-${lesson.id}-v${lesson.currentVersion || 1}`;
    try {
      const v = await dataService.fetchLessonVersion(vId);
      if (v) {
        setPreviewLessonVersion(v);
      } else {
        showToast('Chưa có phiên bản nội dung bài học để xem trước.', 'info');
      }
    } catch (err) {
      console.error('Preview lesson fetch error:', err);
      showToast('Không thể tải bài học để xem trước.', 'error');
    }
  };

  const handlePreviewAssignment = async (a: Assignment) => {
    const vId = a.lessonVersionId || `version-${a.lessonId}-v1`;
    try {
      const v = await dataService.fetchLessonVersion(vId);
      if (v) {
        setPreviewLessonVersion(v);
      } else {
        showToast('Chưa có phiên bản nội dung bài tập để xem trước.', 'info');
      }
    } catch (err) {
      console.error('Preview assignment error:', err);
      showToast('Không thể tải nội dung bài tập để xem trước.', 'error');
    }
  };

  const handleViewLessonProgress = (lesson: Lesson) => {
    const stats = lesson.stats;
    if (!stats || stats.assignedClassesCount === 0 || !stats.assignmentIds?.length) {
      showToast(`Bài học "${lesson.title}" chưa được giao cho lớp nào. Thầy/Cô hãy nhấn "Giao bài" để phân công.`, 'info');
      return;
    }

    const matching = assignments.find((a) => stats.assignmentIds?.includes(a.id));
    if (matching) {
      setProgressAssignment(matching);
    } else {
      const firstAssignId = stats.assignmentIds[0];
      const targetClass = stats.assignedClasses?.[0];
      setProgressAssignment({
        id: firstAssignId,
        title: lesson.title,
        lessonId: lesson.id,
        lessonVersionId: lesson.currentVersionId || `version-${lesson.id}-v1`,
        classId: targetClass?.id || 'class-1b',
        className: targetClass?.name || 'Lớp học',
        teacherId: currentUser.id,
        teacherName: currentUser.displayName,
        grade: lesson.grade,
        assignedAt: lesson.createdAt,
        createdAt: lesson.createdAt || new Date().toISOString(),
        dueDate: '2026-12-31',
        status: 'open',
        dataOrigin: 'real',
        environmentTag: 'production',
      });
    }
  };

  // Lesson Management Handlers (Requirements B & C)
  const handleArchiveLesson = (lesson: Lesson) => {
    setConfirmModal({
      title: 'Lưu trữ bài học',
      message: `Bạn có muốn lưu trữ bài học "${lesson.title}"? Bài học sẽ được cất giữ an toàn, bảo vệ toàn bộ điểm số của các đợt làm bài trước đó và ẩn khỏi danh sách giao bài mới.`,
      actionLabel: 'Lưu trữ bài học',
      danger: false,
      onConfirm: async () => {
        try {
          await dataService.archiveLesson(lesson.id);
          await fetchData();
          showToast('Đã lưu trữ bài học thành công.', 'success');
        } catch (err: any) {
          showToast(err.message || 'Lỗi khi lưu trữ bài học.', 'error');
        }
      },
    });
  };

  const handleUnarchiveLesson = async (lesson: Lesson) => {
    try {
      await dataService.unarchiveLesson(lesson.id);
      await fetchData();
      showToast('Đã khôi phục bài học về trạng thái hoạt động.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi khôi phục bài học.', 'error');
    }
  };

  const handleDeleteLesson = (lesson: Lesson) => {
    setConfirmModal({
      title: 'Xóa bài học chưa sử dụng',
      message: `Bạn có chắc chắn muốn xóa bài học "${lesson.title}"? Quy tắc an toàn: Hệ thống sẽ từ chối xóa nếu bài học đã được giao hoặc đã có học sinh làm bài.`,
      actionLabel: 'Xác nhận xóa',
      danger: true,
      onConfirm: async () => {
        try {
          await dataService.deleteLesson(lesson.id);
          await fetchData();
          showToast('Đã xóa bài học thành công.', 'success');
        } catch (err: any) {
          showToast(err.message || 'Không thể xóa bài học đã phát sinh kết quả. Vui lòng chọn Lưu trữ để bảo toàn dữ liệu.', 'error');
        }
      },
    });
  };

  // Assignment Management Handlers (Requirement B)
  const handleCancelAssignment = (a: Assignment) => {
    if (a.status === 'cancelled') {
      showToast('Bài giao này đã ở trạng thái hủy.', 'info');
      return;
    }
    setConfirmModal({
      title: 'Hủy đợt giao bài',
      message: `Bạn có chắc chắn muốn hủy đợt giao bài "${a.title}"? Bài tập sẽ lập tức biến mất khỏi danh sách nhiệm vụ của học sinh. Toàn bộ điểm số và lịch sử làm bài đã có vẫn được bảo toàn nguyên vẹn trong hệ thống.`,
      actionLabel: 'Xác nhận hủy bài',
      danger: true,
      onConfirm: async () => {
        try {
          await dataService.cancelAssignment(a.id);
          await fetchData();
          showToast('Đã hủy đợt giao bài thành công.', 'success');
        } catch (err: any) {
          showToast(err.message || 'Lỗi khi hủy bài giao.', 'error');
        }
      },
    });
  };

  const handleDeleteAssignment = (a: Assignment) => {
    const hasAttempts = (a.totalAttemptsCount && a.totalAttemptsCount > 0) || (a.submittedCount && a.submittedCount > 0);
    if (hasAttempts) {
      showToast('Bài giao này đã phát sinh lượt làm bài. Vui lòng chọn "Hủy giao bài" thay vì xóa để bảo toàn lịch sử và điểm số của học sinh.', 'error');
      return;
    }
    setConfirmModal({
      title: 'Xóa đợt giao bài',
      message: `Bạn có chắc chắn muốn xóa vĩnh viễn đợt giao bài "${a.title}"? Do chưa có học sinh nào làm bài, đợt giao này sẽ được xóa hoàn toàn.`,
      actionLabel: 'Xóa vĩnh viễn',
      danger: true,
      onConfirm: async () => {
        try {
          await dataService.deleteAssignment(a.id);
          await fetchData();
          showToast('Đã xóa đợt giao bài thành công.', 'success');
        } catch (err: any) {
          showToast(err.message || 'Lỗi khi xóa bài giao.', 'error');
        }
      },
    });
  };

  // Filter lessons
  const filteredLessons = lessons.filter((l) => {
    const matchesGrade = gradeFilter === 'all' || l.grade === gradeFilter;
    const matchesQuery =
      !searchQuery.trim() ||
      l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.topic.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      lessonStatusFilter === 'all'
        ? true
        : lessonStatusFilter === 'archived'
        ? l.status === 'archived'
        : l.status !== 'archived';
    return matchesGrade && matchesQuery && matchesStatus;
  });

  // If in Preview as Student mode
  if (previewLessonVersion) {
    return (
      <div className="min-h-screen bg-slate-100 p-4 sm:p-6 flex flex-col items-center justify-center">
        <div className="w-full max-w-3xl mb-3 flex items-center justify-between">
          <div className="text-xs font-black uppercase tracking-wider text-amber-800 bg-amber-100 px-3 py-1 rounded-xl border border-amber-300">
            👁️ Chế độ Xem trước như Học sinh (Không ghi điểm vào cơ sở dữ liệu)
          </div>
          <button
            type="button"
            onClick={() => setPreviewLessonVersion(null)}
            className="px-4 py-1.5 rounded-xl bg-slate-800 text-white font-bold text-xs cursor-pointer hover:bg-slate-900"
          >
            Đóng xem trước
          </button>
        </div>

        <MissionPlayer
          assignment={{
            id: 'preview-assignment',
            title: previewLessonVersion.title,
            lessonId: previewLessonVersion.lessonId,
            lessonVersionId: previewLessonVersion.id,
            classId: 'preview-class',
            grade: previewLessonVersion.grade,
            teacherId: currentUser.id,
            dueDate: new Date().toISOString(),
            status: 'open',
            createdAt: new Date().toISOString(),
            dataOrigin: 'simulation',
            environmentTag: 'production',
          }}
          lessonVersion={previewLessonVersion}
          currentUser={{
            ...currentUser,
            displayName: `${currentUser.displayName} (Xem trước)`,
            role: 'student',
          }}
          onExit={() => setPreviewLessonVersion(null)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navigation */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FoxDetective mood="happy" size="sm" />
            <div>
              <div className="text-xs uppercase font-extrabold text-sky-600 tracking-wider">
                Cổng Quản Trị Giảng Dạy
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-800">
                THÁM TỬ TOÁN NHÍ
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsAccountModalOpen(true)}
              className="p-2 sm:px-3 sm:py-2 rounded-2xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 text-xs font-black flex items-center gap-2 cursor-pointer transition-colors shadow-2xs"
              title="Tài khoản & Đổi mật khẩu"
            >
              <User className="w-4 h-4 text-sky-600 shrink-0" />
              <div className="hidden sm:flex flex-col text-left">
                <span className="leading-tight font-black">{teacherProfile.displayName || currentUser.displayName}</span>
                <span className="text-[10px] text-sky-600 font-bold">Tài khoản &amp; Đổi mật khẩu</span>
              </div>
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

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-6">
          <button
            type="button"
            onClick={() => setActiveTab('lessons')}
            className={`py-3.5 px-2 border-b-3 text-sm font-black transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'lessons'
                ? 'border-sky-600 text-sky-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4" /> Kho Học Liệu &amp; Bài Học ({lessons.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('assignments')}
            className={`py-3.5 px-2 border-b-3 text-sm font-black transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'assignments'
                ? 'border-sky-600 text-sky-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4" /> Lớp Học & Học Sinh ({classes.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            className={`py-3.5 px-2 border-b-3 text-sm font-black transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'analytics'
                ? 'border-sky-600 text-sky-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BarChart2 className="w-4 h-4" /> Phân Tích Mẫu Lỗi &amp; Củng Cố
          </button>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* TAB 1: LESSONS CURRICULUM */}
        {activeTab === 'lessons' && (
          <div className="space-y-6">
            {/* Action Bar */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm kiếm bài học, chủ đề..."
                    className="h-10 pl-9 pr-4 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 focus:bg-white focus:outline-hidden w-64"
                  />
                </div>

                <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setGradeFilter('all')}
                    className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                      gradeFilter === 'all' ? 'bg-white shadow-xs text-sky-800' : 'text-slate-600'
                    }`}
                  >
                    Tất cả khối
                  </button>
                  <button
                    type="button"
                    onClick={() => setGradeFilter(1)}
                    className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                      gradeFilter === 1 ? 'bg-white shadow-xs text-sky-800' : 'text-slate-600'
                    }`}
                  >
                    Lớp 1
                  </button>
                  <button
                    type="button"
                    onClick={() => setGradeFilter(2)}
                    className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                      gradeFilter === 2 ? 'bg-white shadow-xs text-sky-800' : 'text-slate-600'
                    }`}
                  >
                    Lớp 2
                  </button>
                </div>

                <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setLessonStatusFilter('active')}
                    className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                      lessonStatusFilter === 'active' ? 'bg-white shadow-xs text-sky-800' : 'text-slate-600'
                    }`}
                  >
                    Đang dùng
                  </button>
                  <button
                    type="button"
                    onClick={() => setLessonStatusFilter('archived')}
                    className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                      lessonStatusFilter === 'archived' ? 'bg-white shadow-xs text-sky-800' : 'text-slate-600'
                    }`}
                  >
                    Đã lưu trữ
                  </button>
                  <button
                    type="button"
                    onClick={() => setLessonStatusFilter('all')}
                    className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                      lessonStatusFilter === 'all' ? 'bg-white shadow-xs text-sky-800' : 'text-slate-600'
                    }`}
                  >
                    Tất cả ({lessons.length})
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsAiDraftOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-sky-600 hover:from-indigo-600 hover:to-sky-700 text-white font-black text-xs flex items-center gap-1.5 shadow-sm cursor-pointer transition-all active:scale-95"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" /> AI Tạo Bài Nháp
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenEditor()}
                  className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-black text-xs flex items-center gap-1.5 shadow-sm cursor-pointer transition-all active:scale-95"
                >
                  <Plus className="w-4 h-4" /> Soạn Bài Mới
                </button>
              </div>
            </div>

            {/* Lesson Cards Grid */}
            {loading ? (
              <div className="p-12 text-center text-slate-500 font-bold bg-white rounded-3xl border border-slate-200">
                Đang tải kho học liệu...
              </div>
            ) : filteredLessons.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200">
                <p className="text-slate-500 font-bold">Không tìm thấy bài học nào phù hợp.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredLessons.map((lesson) => (
                  <div
                    key={lesson.id}
                    className="bg-white rounded-3xl border-2 border-slate-200 hover:border-sky-300 p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                          Toán Lớp {lesson.grade}
                        </span>

                        <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                          v{lesson.currentVersion || 1} • {lesson.status === 'published' ? 'Đã xuất bản' : 'Bản nháp'}
                        </span>
                      </div>

                      <h4 className="text-lg font-black text-slate-800 leading-snug mb-1">
                        {lesson.title}
                      </h4>
                      <p className="text-xs font-extrabold text-sky-600 mb-2">
                        {lesson.topic}
                      </p>

                      <p className="text-xs font-medium text-slate-600 line-clamp-2 mb-3">
                        {lesson.learningStandard || lesson.description}
                      </p>

                      {/* STATS SUMMARY (PHẦN 1 - NÂNG CẤP KHO HỌC LIỆU) */}
                      <div className="my-3 p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-white p-2 rounded-xl border border-slate-100 flex items-center gap-1.5 shadow-2xs">
                            <Users className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                            <div>
                              <div className="text-[10px] font-bold text-slate-400 uppercase leading-none">Hoàn thành</div>
                              <div className="font-black text-slate-800">{lesson.stats?.completedStudentsCount ?? 0} em</div>
                            </div>
                          </div>

                          <div className="bg-white p-2 rounded-xl border border-slate-100 flex items-center gap-1.5 shadow-2xs">
                            <Layers className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                            <div>
                              <div className="text-[10px] font-bold text-slate-400 uppercase leading-none">Lượt nộp</div>
                              <div className="font-black text-slate-800">{lesson.stats?.totalSubmissionsCount ?? 0} lượt</div>
                            </div>
                          </div>

                          <div className="bg-white p-2 rounded-xl border border-slate-100 flex items-center gap-1.5 shadow-2xs">
                            <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <div>
                              <div className="text-[10px] font-bold text-slate-400 uppercase leading-none">Điểm TB</div>
                              <div className="font-black text-slate-800">
                                {lesson.stats?.avgScore !== null && lesson.stats?.avgScore !== undefined ? `${lesson.stats.avgScore} đ` : 'Chưa có'}
                              </div>
                            </div>
                          </div>

                          <div className="bg-white p-2 rounded-xl border border-slate-100 flex items-center gap-1.5 shadow-2xs">
                            <School className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                            <div>
                              <div className="text-[10px] font-bold text-slate-400 uppercase leading-none">Đã giao</div>
                              <div className="font-black text-slate-800">{lesson.stats?.assignedClassesCount ?? 0} lớp</div>
                            </div>
                          </div>
                        </div>

                        {/* Nút Xem chi tiết tiến độ */}
                        <button
                          type="button"
                          onClick={() => handleViewLessonProgress(lesson)}
                          className={`w-full py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-2xs ${
                            (lesson.stats?.assignedClassesCount || 0) > 0
                              ? 'bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 cursor-pointer active:scale-98'
                              : 'bg-slate-100 text-slate-400 border border-slate-200/60 cursor-pointer'
                          }`}
                        >
                          <BarChart2 className="w-3.5 h-3.5" />
                          <span>
                            {(lesson.stats?.assignedClassesCount || 0) > 0
                              ? 'Xem chi tiết tiến độ bài làm'
                              : 'Chưa giao lớp nào • Xem tiến độ'}
                          </span>
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handlePreviewLesson(lesson)}
                          title="Xem trước như học sinh"
                          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEditor(lesson)}
                          title="Biên tập chỉnh sửa (v2)"
                          className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" /> Biên tập
                        </button>
                        {lesson.status === 'archived' ? (
                          <button
                            type="button"
                            onClick={() => handleUnarchiveLesson(lesson)}
                            title="Khôi phục bài học về trạng thái hoạt động"
                            className="p-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 cursor-pointer transition-colors"
                          >
                            <ArchiveRestore className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleArchiveLesson(lesson)}
                            title="Lưu trữ bài học (bảo vệ lịch sử và ẩn khỏi danh sách giao bài)"
                            className="p-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 cursor-pointer transition-colors"
                          >
                            <Archive className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteLesson(lesson)}
                          title="Xóa bài học chưa sử dụng"
                          className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 cursor-pointer transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {lesson.status === 'archived' ? (
                        <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-500 font-extrabold text-xs">
                          Đã lưu trữ
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleOpenAssign(lesson, null, null)}
                          className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-900 font-extrabold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-all active:scale-95"
                        >
                          <Send className="w-3.5 h-3.5" /> Giao bài
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ASSIGNMENTS & CLASSES */}
        {activeTab === 'assignments' && (
          selectedClass ? (
            <ClassRosterView
              classroom={selectedClass}
              teacherId={currentUser.id}
              isAdmin={currentUser.role === 'admin'}
              allClasses={classes}
              onBack={() => setSelectedClass(null)}
              onAssignToStudent={(student) => {
                handleOpenAssign(null, student.classId, student);
              }}
              onAssignToClass={(classId) => {
                handleOpenAssign(null, classId, null);
              }}
            />
          ) : (
            <div className="space-y-6">
              {/* Error State with Retry Button */}
              {errorMessage && (
                <div className="p-6 rounded-3xl bg-rose-50 border border-rose-200 text-rose-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-6 h-6 text-rose-600 shrink-0" />
                    <div>
                      <div className="font-black text-sm">Đã xảy ra sự cố kết nối</div>
                      <div className="text-xs text-rose-600">{errorMessage}</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => fetchData()}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer transition-colors flex items-center gap-2 shrink-0"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Thử lại
                  </button>
                </div>
              )}

              {/* Classes Overview Bar */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-black text-slate-900">Danh sách Lớp học được phân công</h3>
                    <p className="text-xs font-semibold text-slate-500 mt-0.5">
                      Chọn một lớp học để xem danh sách học sinh thật, theo dõi tiến độ và giao bài tập
                    </p>
                  </div>
                </div>

                {loading ? (
                  <div className="p-12 text-center text-slate-500 font-bold bg-white rounded-3xl border border-slate-200 flex flex-col items-center justify-center gap-3">
                    <RefreshCw className="w-6 h-6 text-sky-600 animate-spin" />
                    <p className="text-xs">Đang tải danh sách lớp học và học sinh...</p>
                  </div>
                ) : classes.length === 0 ? (
                  /* Empty State when teacher has no assigned classes */
                  <div className="bg-white p-8 sm:p-12 rounded-3xl border border-slate-200 text-center space-y-4 max-w-xl mx-auto shadow-xs">
                    <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                      <School className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-xl font-black text-slate-900">Chưa Có Lớp Học Được Phân Công</h3>
                      <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                        Tài khoản của thầy/cô (<strong>{currentUser.displayName}</strong>) chưa được phân công phụ trách lớp học nào trong niên khóa 2026 - 2027. Vui lòng liên hệ Quản trị viên để được thiết lập phân công giảng dạy.
                      </p>
                    </div>
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => setActiveTab('lessons')}
                        className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 font-black text-xs cursor-pointer shadow-sm transition-all"
                      >
                        Khám Phá Kho Học Liệu GDPT 2018 ({lessons.length} bài) &rarr;
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {classes.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => setSelectedClass(c)}
                        className="bg-white p-5 rounded-3xl border-2 border-slate-200 hover:border-sky-400 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black uppercase text-sky-600 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200">
                              Khối {c.grade}
                            </span>
                            <Users className="w-4 h-4 text-slate-400 group-hover:text-sky-600 transition-colors" />
                          </div>
                          <div className="text-2xl font-black text-slate-900 mt-2 group-hover:text-sky-700 transition-colors">
                            Lớp {c.name}
                          </div>
                          <div className="text-xs font-bold text-slate-600 mt-1">
                            {c.studentCount || 0} học sinh
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-sky-600 group-hover:underline">
                          <span>Xem danh sách học sinh &rarr;</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Assignments Table */}
              <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-black text-slate-800">
                      Các đợt giao bài gần đây
                    </h3>
                    <p className="text-xs font-semibold text-slate-500 mt-0.5">
                      Quản lý đợt giao bài theo lớp và hạn làm bài
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fetchData()}
                      disabled={loading}
                      title="Làm mới danh sách bài giao"
                      className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs flex items-center gap-1.5 cursor-pointer transition-colors border border-slate-200"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-sky-600' : ''}`} />
                      <span>Làm mới</span>
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-black border-b border-slate-200">
                      <tr>
                        <th className="px-5 py-4">Tên bài giao & Lời dặn</th>
                        <th className="px-4 py-4">Lớp nhận</th>
                        <th className="px-4 py-4">Khối</th>
                        <th className="px-5 py-4">Tiến độ nộp bài</th>
                        <th className="px-4 py-4">Hạn nộp</th>
                        <th className="px-4 py-4">Trạng thái</th>
                        <th className="px-4 py-4 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                      {assignments.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                            Chưa có đợt giao bài nào.
                          </td>
                        </tr>
                      ) : (
                        assignments.map((a) => {
                          const isCancelled = a.status === 'cancelled';
                          const isClosed = a.status === 'closed';
                          const isOverdue = a.dueDate ? new Date(a.dueDate).getTime() < Date.now() : false;
                          const totalStudents = a.totalStudents ?? 0;
                          const submittedCount = a.submittedCount ?? 0;
                          const notStartedCount = a.notStartedCount ?? Math.max(0, totalStudents - submittedCount);
                          const totalAttempts = a.totalAttemptsCount ?? 0;
                          const isManagedByTeacher =
                            currentUser.role === 'admin' ||
                            a.teacherId === currentUser.id ||
                            classes.some((c) => c.id === a.classId && c.teacherId === currentUser.id) ||
                            (currentUser.email?.includes('xuannuong') && (a.classId === 'class-1b' || a.classId === 'class-2a'));

                          return (
                            <tr key={a.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="px-5 py-4 max-w-xs">
                                <div className="font-bold text-slate-900 leading-snug">
                                  {a.title}
                                  {a.studentName && (
                                    <span className="ml-2 text-[11px] font-extrabold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                                      Riêng: {a.studentName}
                                    </span>
                                  )}
                                </div>
                                {a.instructions && (
                                  <div className="mt-1 text-[11px] text-slate-500 line-clamp-1 flex items-center gap-1 font-medium">
                                    <MessageSquare className="w-3 h-3 text-sky-500 shrink-0" />
                                    <span>{a.instructions}</span>
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-4">
                                <span className="px-2.5 py-1 rounded-lg bg-sky-50 text-sky-800 font-extrabold text-xs border border-sky-100">
                                  Lớp {a.className || a.classId}
                                </span>
                              </td>
                              <td className="px-4 py-4 font-bold text-slate-600">Lớp {a.grade || 1}</td>
                              <td className="px-5 py-4">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-black text-slate-800 text-xs">
                                      {submittedCount} / {totalStudents} HS
                                    </span>
                                    <span className="text-[11px] text-emerald-600 font-bold">
                                      ({totalStudents > 0 ? Math.round((submittedCount / totalStudents) * 100) : 0}%)
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-3 text-[11px] text-slate-500">
                                    <span>Chưa làm: <strong className="text-slate-700">{notStartedCount}</strong></span>
                                    <span>•</span>
                                    <span>Tổng lượt: <strong className="text-indigo-600">{totalAttempts}</strong></span>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-4 text-xs font-bold text-slate-600">
                                {a.dueDate ? (
                                  <div>
                                    <div>{a.dueDate}</div>
                                    {isOverdue && !isCancelled && (
                                      <span className="text-[10px] text-rose-500 font-extrabold">(Quá hạn)</span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-slate-400">Không giới hạn</span>
                                )}
                              </td>
                              <td className="px-4 py-4">
                                {isCancelled ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-rose-50 text-rose-700 border border-rose-200">
                                    <Ban className="w-3.5 h-3.5" /> Đã hủy
                                  </span>
                                ) : isClosed ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-slate-100 text-slate-700 border border-slate-200">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" /> Đã đóng
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Đang mở
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handlePreviewAssignment(a)}
                                    title="Xem trước màn hình học sinh"
                                    className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 cursor-pointer transition-colors border border-emerald-200"
                                  >
                                    <Play className="w-4 h-4" />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => setProgressAssignment(a)}
                                    title="Xem tiến độ làm bài chi tiết"
                                    className="p-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 cursor-pointer transition-colors border border-sky-200"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>

                                  {isManagedByTeacher && (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => setEditingAssignment(a)}
                                        title="Sửa hạn nộp & lời dặn"
                                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer transition-colors border border-slate-200"
                                      >
                                        <Edit3 className="w-4 h-4" />
                                      </button>

                                      {!isCancelled && (
                                        <button
                                          type="button"
                                          onClick={() => handleCancelAssignment(a)}
                                          title="Hủy giao bài (giữ nguyên điểm và lịch sử)"
                                          className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 cursor-pointer transition-colors border border-amber-200"
                                        >
                                          <Ban className="w-4 h-4" />
                                        </button>
                                      )}

                                      <button
                                        type="button"
                                        onClick={() => handleDeleteAssignment(a)}
                                        title="Xóa bài giao (chỉ xóa được nếu chưa có lượt làm)"
                                        className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 cursor-pointer transition-colors border border-rose-200"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )
        )}

        {/* TAB 3: MISCONCEPTION ANALYTICS */}
        {activeTab === 'analytics' && (
          <MisconceptionAnalytics
            teacherId={currentUser.id}
            onOpenLessonEditor={(lesson, version) => {
              setEditingLesson(lesson);
              setEditingVersion(version || null);
              setIsEditorOpen(true);
            }}
          />
        )}
      </main>

      {/* Lesson Editor Modal */}
      <LessonEditorModal
        isOpen={isEditorOpen}
        lesson={editingLesson}
        lessonVersion={editingVersion}
        teacherId={currentUser.id}
        onClose={() => setIsEditorOpen(false)}
        onSaved={fetchData}
        onPreviewLesson={(v) => {
          setIsEditorOpen(false);
          setPreviewLessonVersion(v);
        }}
      />

      {/* AI Draft Modal */}
      <AiDraftModal
        isOpen={isAiDraftOpen}
        onClose={() => setIsAiDraftOpen(false)}
        onApplyQuestions={(newQuestions, meta) => {
          // Open editor with AI questions populated
          const now = Date.now();
          const lessonId = `lesson-draft-${now}`;
          const versionId = `version-${lessonId}-v1-draft`;
          const chosenGrade: 1 | 2 = meta?.grade || 1;
          const chosenTopic = meta?.topic || newQuestions[0]?.skillTag || 'Luyện tập';
          const draftLesson: Lesson = {
            id: lessonId,
            title: `Bài tập Toán: ${chosenTopic}`,
            grade: chosenGrade,
            topic: chosenTopic,
            learningStandard: 'Rèn luyện kỹ năng và khắc phục mẫu lỗi theo chuẩn GDPT 2018',
            description: `Bài học do AI hỗ trợ soạn nháp với ${newQuestions.length} câu hỏi theo chuẩn GDPT 2018.`,
            durationMinutes: 20,
            totalQuestions: newQuestions.length,
            status: 'draft',
            isPublished: false,
            currentVersion: 1,
            draftVersionId: versionId,
            createdBy: currentUser.id,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            dataOrigin: 'real',
            environmentTag: 'production',
          };
          const draftVersion: LessonVersion = {
            id: versionId,
            lessonId,
            versionNumber: 1,
            title: draftLesson.title,
            grade: chosenGrade,
            topic: chosenTopic,
            learningStandard: draftLesson.learningStandard,
            questions: newQuestions,
            isPublished: false,
            createdBy: currentUser.id,
            dataOrigin: 'real',
            environmentTag: 'production',
          };
          setEditingLesson(draftLesson);
          setEditingVersion(draftVersion);
          setIsEditorOpen(true);
        }}
      />

      {/* Assign Modal */}
      <AssignModal
        isOpen={isAssignOpen}
        initialLesson={assigningLesson}
        initialClassId={assigningClassId}
        targetStudent={assigningStudent}
        classes={classes}
        lessons={lessons}
        teacherId={currentUser.id}
        onPreviewLesson={handlePreviewLesson}
        onClose={() => {
          setIsAssignOpen(false);
          setAssigningLesson(null);
          setAssigningClassId(null);
          setAssigningStudent(null);
        }}
        onAssigned={() => {
          fetchData();
          showToast('Đã giao bài tập thành công!', 'success');
        }}
      />

      {/* Teacher Account & Password Modal */}
      <TeacherAccountModal
        isOpen={isAccountModalOpen}
        currentUser={teacherProfile}
        managedClassesCount={classes.length}
        onClose={() => setIsAccountModalOpen(false)}
        onProfileUpdated={(updated) => {
          setTeacherProfile(updated);
          showToast('Đã cập nhật thông tin thành công!', 'success');
        }}
      />

      {/* Edit Assignment Modal */}
      <EditAssignmentModal
        isOpen={Boolean(editingAssignment)}
        assignment={editingAssignment}
        onClose={() => setEditingAssignment(null)}
        onUpdated={() => {
          fetchData();
          showToast('Đã cập nhật đợt giao bài thành công!', 'success');
        }}
      />

      {/* Assignment Progress Modal */}
      <AssignmentProgressModal
        isOpen={Boolean(progressAssignment)}
        assignment={progressAssignment}
        onClose={() => setProgressAssignment(null)}
      />

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-2xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-3">
              {confirmModal.danger ? (
                <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-6 h-6" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-6 h-6" />
                </div>
              )}
              <h4 className="text-lg font-black text-slate-800">{confirmModal.title}</h4>
            </div>
            <p className="text-sm font-semibold text-slate-600 mb-6 leading-relaxed">
              {confirmModal.message}
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={async () => {
                  const action = confirmModal.onConfirm;
                  setConfirmModal(null);
                  await action();
                }}
                className={`px-5 py-2 rounded-xl text-white text-xs font-black cursor-pointer shadow-sm transition-all active:scale-95 ${
                  confirmModal.danger
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-amber-500 hover:bg-amber-600'
                }`}
              >
                {confirmModal.actionLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <div
            className={`px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-black border ${
              toast.type === 'error'
                ? 'bg-rose-600 text-white border-rose-700'
                : toast.type === 'success'
                ? 'bg-emerald-600 text-white border-emerald-700'
                : 'bg-slate-900 text-white border-slate-800'
            }`}
          >
            {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-200" />}
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-200" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};
