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
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Filters
  const [gradeFilter, setGradeFilter] = useState<'all' | 1 | 2>('all');
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
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const [lList, cList, aList] = await Promise.all([
        dataService.fetchTeacherLessons(),
        dataService.fetchTeacherClasses(currentUser.id),
        dataService.fetchTeacherAssignments(currentUser.id),
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
      const vId = lesson.currentVersionId || `version-${lesson.id}-v${lesson.currentVersion || 1}`;
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

  const handleOpenAssign = (lesson: Lesson, student?: { id: string; displayName: string; classId: string; studentCode?: string }) => {
    setAssigningLesson(lesson);
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

  // Filter lessons
  const filteredLessons = lessons.filter((l) => {
    const matchesGrade = gradeFilter === 'all' || l.grade === gradeFilter;
    const matchesQuery =
      !searchQuery.trim() ||
      l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.topic.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesGrade && matchesQuery;
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

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-sm font-black text-slate-800">
                {currentUser.displayName}
              </span>
              <span className="text-xs font-semibold text-emerald-600">
                Giáo viên Toán GDPT 2018
              </span>
            </div>

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
                      </div>

                      <button
                        type="button"
                        onClick={() => handleOpenAssign(lesson)}
                        className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-900 font-extrabold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-all active:scale-95"
                      >
                        <Send className="w-3.5 h-3.5" /> Giao bài
                      </button>
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
                if (lessons.length > 0) {
                  handleOpenAssign(lessons[0], student);
                } else {
                  showToast('Chưa có bài học trong kho học liệu để giao.', 'info');
                }
              }}
              onAssignToClass={(classId) => {
                if (lessons.length > 0) {
                  handleOpenAssign(lessons[0]);
                } else {
                  showToast('Chưa có bài học trong kho học liệu để giao.', 'info');
                }
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
                    onClick={fetchData}
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
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-black text-slate-800">
                      Các đợt giao bài gần đây
                    </h3>
                    <p className="text-xs font-semibold text-slate-500 mt-0.5">
                      Quản lý đợt giao bài theo lớp và hạn làm bài
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-black border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-4">Tên bài giao</th>
                        <th className="px-6 py-4">Lớp nhận</th>
                        <th className="px-6 py-4">Khối</th>
                        <th className="px-6 py-4">Hạn nộp</th>
                        <th className="px-6 py-4">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                      {assignments.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                            Chưa có đợt giao bài nào.
                          </td>
                        </tr>
                      ) : (
                        assignments.map((a) => (
                          <tr key={a.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="px-6 py-4 font-bold text-slate-900">
                              {a.title}
                              {a.studentName && (
                                <span className="ml-2 text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                                  Riêng: {a.studentName}
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <span className="px-2.5 py-1 rounded-lg bg-sky-50 text-sky-800 font-extrabold text-xs">
                                Lớp {a.className || a.classId}
                              </span>
                            </td>
                            <td className="px-6 py-4">Lớp {a.grade || 1}</td>
                            <td className="px-6 py-4 text-xs font-bold text-slate-600">
                              {a.dueDate || 'Không giới hạn'}
                            </td>
                            <td className="px-6 py-4">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Đang mở
                              </span>
                            </td>
                          </tr>
                        ))
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
          <MisconceptionAnalytics teacherId={currentUser.id} />
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
      />

      {/* AI Draft Modal */}
      <AiDraftModal
        isOpen={isAiDraftOpen}
        onClose={() => setIsAiDraftOpen(false)}
        onApplyQuestions={(newQuestions) => {
          // Open editor with AI questions populated
          setEditingLesson(null);
          setEditingVersion({
            id: `version-draft-${Date.now()}`,
            lessonId: `lesson-draft-${Date.now()}`,
            versionNumber: 1,
            title: `Bài tập Toán AI: ${newQuestions[0]?.skillTag || 'Luyện tập'}`,
            grade: newQuestions[0]?.order ? 1 : 1,
            topic: newQuestions[0]?.skillTag || 'Phép tính',
            learningStandard: 'Rèn luyện kỹ năng và khắc phục mẫu lỗi theo chuẩn GDPT 2018',
            questions: newQuestions,
            isPublished: false,
            createdBy: currentUser.id,
            dataOrigin: 'real',
            environmentTag: 'production',
          });
          setIsEditorOpen(true);
        }}
      />

      {/* Assign Modal */}
      <AssignModal
        isOpen={isAssignOpen}
        lesson={assigningLesson}
        classes={classes}
        targetStudent={assigningStudent}
        teacherId={currentUser.id}
        onClose={() => {
          setIsAssignOpen(false);
          setAssigningStudent(null);
        }}
        onAssigned={fetchData}
      />

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
