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
  Layers
} from 'lucide-react';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Lesson, LessonVersion, Classroom, UserProfile, Assignment } from '../../types';
import { FoxDetective } from '../mascot/FoxDetective';
import { LessonEditorModal } from './LessonEditorModal';
import { AiDraftModal } from './AiDraftModal';
import { AssignModal } from './AssignModal';
import { MisconceptionAnalytics } from './MisconceptionAnalytics';
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
  const [loading, setLoading] = useState(true);

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
    try {
      // 1. Fetch Lessons
      const lSnap = await getDocs(collection(db, 'lessons'));
      const lList: Lesson[] = [];
      lSnap.forEach((d) => lList.push(d.data() as Lesson));

      // 2. Fetch Classes
      const cSnap = await getDocs(collection(db, 'classes'));
      const cList: Classroom[] = [];
      cSnap.forEach((d) => cList.push(d.data() as Classroom));

      // 3. Fetch Assignments
      const aSnap = await getDocs(collection(db, 'assignments'));
      const aList: Assignment[] = [];
      aSnap.forEach((d) => aList.push(d.data() as Assignment));

      setLessons(lList);
      setClasses(cList);
      setAssignments(aList);
    } catch (err) {
      console.error('Fetch teacher portal data error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditor = async (lesson?: Lesson) => {
    if (lesson) {
      setEditingLesson(lesson);
      // Fetch current version
      const vId = `version-${lesson.id}-v${lesson.currentVersion || 1}`;
      const vDoc = await getDoc(doc(db, 'lessonVersions', vId));
      if (vDoc.exists()) {
        setEditingVersion(vDoc.data() as LessonVersion);
      } else {
        setEditingVersion(null);
      }
    } else {
      setEditingLesson(null);
      setEditingVersion(null);
    }
    setIsEditorOpen(true);
  };

  const handleOpenAssign = (lesson: Lesson) => {
    setAssigningLesson(lesson);
    setIsAssignOpen(true);
  };

  const handlePreviewLesson = async (lesson: Lesson) => {
    const vId = `version-${lesson.id}-v${lesson.currentVersion || 1}`;
    const vDoc = await getDoc(doc(db, 'lessonVersions', vId));
    if (vDoc.exists()) {
      setPreviewLessonVersion(vDoc.data() as LessonVersion);
    } else {
      alert('Chưa có phiên bản nội dung bài học để xem trước.');
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
            environmentTag: 'demo',
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
            <Send className="w-4 h-4" /> Đợt Giao Bài &amp; Lớp Học ({assignments.length})
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
                          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
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
          <div className="space-y-6">
            {/* Classes Overview Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {classes.map((c) => (
                <div key={c.id} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-sky-600">Khối {c.grade}</span>
                    <Users className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="text-2xl font-black text-slate-800 mt-2">
                    Lớp {c.name}
                  </div>
                  <div className="text-xs font-semibold text-slate-500 mt-1">
                    {c.studentCount || 12} học sinh
                  </div>
                </div>
              ))}
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
            environmentTag: 'demo',
          });
          setIsEditorOpen(true);
        }}
      />

      {/* Assign Modal */}
      <AssignModal
        isOpen={isAssignOpen}
        lesson={assigningLesson}
        classes={classes}
        teacherId={currentUser.id}
        onClose={() => setIsAssignOpen(false)}
        onAssigned={fetchData}
      />
    </div>
  );
};
