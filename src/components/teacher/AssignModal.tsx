import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Send,
  CheckSquare,
  Square,
  Calendar,
  Loader2,
  User,
  BookOpen,
  Search,
  Eye,
  Check,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Layers,
} from 'lucide-react';
import { dataService } from '../../lib/dataService';
import { Lesson, Classroom } from '../../types';

export interface AssignModalProps {
  isOpen: boolean;
  initialLesson?: Lesson | null;
  initialClassId?: string | null;
  targetStudent?: { id: string; displayName: string; classId: string; studentCode?: string } | null;
  classes: Classroom[];
  lessons: Lesson[];
  teacherId: string;
  onClose: () => void;
  onAssigned: () => void;
  onPreviewLesson?: (lesson: Lesson) => void;
}

export const AssignModal: React.FC<AssignModalProps> = ({
  isOpen,
  initialLesson = null,
  initialClassId = null,
  targetStudent = null,
  classes,
  lessons,
  teacherId,
  onClose,
  onAssigned,
  onPreviewLesson,
}) => {
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(initialLesson);
  const [isBrowsingLessons, setIsBrowsingLessons] = useState<boolean>(!initialLesson);
  const [searchQuery, setSearchQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState<number | 'all'>('all');

  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState<string>(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [instructions, setInstructions] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Duplicate assignment detection & deliberate re-assignment
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [allowReassign, setAllowReassign] = useState(false);

  // Synchronize state whenever modal opens or props change
  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      setDuplicateWarning(null);
      setAllowReassign(false);
      setSearchQuery('');
      setInstructions('');

      if (initialLesson) {
        setSelectedLesson(initialLesson);
        setIsBrowsingLessons(false);
        setGradeFilter(initialLesson.grade);
      } else {
        setSelectedLesson(null);
        setIsBrowsingLessons(true);
      }

      if (targetStudent) {
        setSelectedClassIds([targetStudent.classId]);
        const targetClass = classes.find((c) => c.id === targetStudent.classId);
        if (targetClass) setGradeFilter(targetClass.grade);
      } else if (initialClassId) {
        setSelectedClassIds([initialClassId]);
        const targetClass = classes.find((c) => c.id === initialClassId);
        if (targetClass) setGradeFilter(targetClass.grade);
      } else {
        setSelectedClassIds([]);
      }
    }
  }, [isOpen, initialLesson, initialClassId, targetStudent, classes]);

  // When a lesson is chosen, auto-filter classes to matching grade
  const targetGrade = useMemo(() => {
    if (selectedLesson) return selectedLesson.grade;
    if (targetStudent) {
      const cls = classes.find((c) => c.id === targetStudent.classId);
      return cls?.grade || 1;
    }
    if (initialClassId) {
      const cls = classes.find((c) => c.id === initialClassId);
      return cls?.grade || 1;
    }
    return typeof gradeFilter === 'number' ? gradeFilter : 1;
  }, [selectedLesson, targetStudent, initialClassId, classes, gradeFilter]);

  // Eligible classes strictly matching target grade
  const eligibleClasses = useMemo(() => {
    return classes.filter((c) => c.grade === targetGrade);
  }, [classes, targetGrade]);

  // Published lessons matching grade and search query
  const eligibleLessons = useMemo(() => {
    return lessons
      .filter((l) => (l.status === 'published' || l.isPublished === true) && l.status !== 'draft')
      .filter((l) => {
        // If a class is already determined, strictly match grade
        if (targetStudent || initialClassId) {
          const targetClass = classes.find(
            (c) => c.id === (targetStudent?.classId || initialClassId)
          );
          if (targetClass && l.grade !== targetClass.grade) return false;
        } else if (gradeFilter !== 'all') {
          if (l.grade !== gradeFilter) return false;
        }

        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase().trim();
        return (
          l.title.toLowerCase().includes(q) ||
          (l.description && l.description.toLowerCase().includes(q)) ||
          (l.id && l.id.toLowerCase().includes(q))
        );
      });
  }, [lessons, targetStudent, initialClassId, classes, gradeFilter, searchQuery]);

  if (!isOpen) return null;

  const toggleClass = (cId: string) => {
    if (targetStudent) return; // Locked to target student's class
    setSelectedClassIds((prev) =>
      prev.includes(cId) ? prev.filter((id) => id !== cId) : [...prev, cId]
    );
    setDuplicateWarning(null);
  };

  const selectAll = () => {
    if (targetStudent) return;
    if (selectedClassIds.length === eligibleClasses.length) {
      setSelectedClassIds([]);
    } else {
      setSelectedClassIds(eligibleClasses.map((c) => c.id));
    }
    setDuplicateWarning(null);
  };

  const handleSelectLesson = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setIsBrowsingLessons(false);
    setErrorMsg(null);
    setDuplicateWarning(null);

    // If currently selected classes don't match the new lesson's grade, reset them
    if (targetStudent) {
      const studentClass = classes.find((c) => c.id === targetStudent.classId);
      if (studentClass && studentClass.grade !== lesson.grade) {
        setErrorMsg(`Bài học này thuộc Khối ${lesson.grade}, nhưng học sinh thuộc lớp Khối ${studentClass.grade}.`);
      }
    } else {
      const stillValid = selectedClassIds.filter((cId) => {
        const cls = classes.find((c) => c.id === cId);
        return cls && cls.grade === lesson.grade;
      });
      setSelectedClassIds(stillValid);
    }
  };

  const handleAssign = async () => {
    if (isSubmitting) return;

    if (!selectedLesson) {
      setErrorMsg('Vui lòng chọn bài học cần giao từ danh sách.');
      setIsBrowsingLessons(true);
      return;
    }

    if (!targetStudent && selectedClassIds.length === 0) {
      setErrorMsg('Vui lòng chọn ít nhất 1 lớp học nhận bài.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const versionId =
        selectedLesson.currentVersionId ||
        `version-${selectedLesson.id}-v${selectedLesson.currentVersion || 1}`;

      if (targetStudent) {
        const cls = classes.find((c) => c.id === targetStudent.classId);
        if (cls && cls.grade !== selectedLesson.grade) {
          setErrorMsg(
            `Không thể giao: Bài học thuộc Khối ${selectedLesson.grade}, nhưng lớp ${cls.name} thuộc Khối ${cls.grade}.`
          );
          setIsSubmitting(false);
          return;
        }

        const assignmentPayload = {
          title: `[Toán ${selectedLesson.grade}] ${selectedLesson.title}`,
          lessonId: selectedLesson.id,
          lessonVersionId: versionId,
          classId: targetStudent.classId,
          className: cls?.name || '',
          studentId: targetStudent.id,
          studentName: targetStudent.displayName,
          dueDate,
          instructions: instructions.trim() || undefined,
          allowReassign,
        };

        await dataService.saveAssignment(assignmentPayload as any);
      } else {
        // Whole class assignments
        for (const classId of selectedClassIds) {
          const cls = eligibleClasses.find((c) => c.id === classId);
          const assignmentPayload = {
            title: `[Toán ${selectedLesson.grade}] ${selectedLesson.title}`,
            lessonId: selectedLesson.id,
            lessonVersionId: versionId,
            classId,
            className: cls?.name || '',
            dueDate,
            instructions: instructions.trim() || undefined,
            allowReassign,
          };
          await dataService.saveAssignment(assignmentPayload as any);
        }
      }

      onAssigned();
      onClose();
    } catch (err: any) {
      console.error('Assign error:', err);
      if (err?.code === 'ASSIGNMENT_DUPLICATE') {
        setDuplicateWarning(err.message || 'Bài học này đã được giao cho lớp/học sinh trước đó.');
      } else {
        setErrorMsg(err?.message || 'Không thể giao bài. Vui lòng kiểm tra kết nối mạng.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-white rounded-3xl border-3 border-sky-300 shadow-2xl p-5 sm:p-7 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-amber-950 flex items-center justify-center font-black shadow-xs">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-slate-800">
                {targetStudent
                  ? 'Giao Bài Riêng Cho Học Sinh'
                  : initialClassId
                  ? 'Giao Bài Cho Lớp Học'
                  : 'Giao Bài Luyện Tập Toán'}
              </h3>
              <p className="text-xs font-semibold text-slate-500">
                {targetStudent
                  ? `Chỉ định riêng cho em ${targetStudent.displayName} (${targetStudent.studentCode || ''})`
                  : 'Bài đã xuất bản • Học sinh nhận bài ngay lập tức'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2 shrink-0">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Duplicate Assignment Alert with Re-assign checkbox */}
        {duplicateWarning && (
          <div className="mb-4 p-3.5 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-950 text-xs font-semibold shrink-0 space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Cảnh báo trùng đợt giao bài</span>
            </div>
            <p className="text-amber-800">{duplicateWarning}</p>
            <label className="flex items-center gap-2 font-black text-amber-950 cursor-pointer pt-1 border-t border-amber-200">
              <input
                type="checkbox"
                checked={allowReassign}
                onChange={(e) => setAllowReassign(e.target.checked)}
                className="w-4 h-4 rounded-md accent-amber-500 text-amber-600"
              />
              <span>Giao lại đợt mới (Tạo đợt bài mới, không ghi đè lịch sử kết quả cũ)</span>
            </label>
          </div>
        )}

        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* SECTION 1: LESSON SELECTION */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-sky-600" /> 1. Bài học giao bài
              </label>
              {selectedLesson && (
                <button
                  type="button"
                  onClick={() => setIsBrowsingLessons(!isBrowsingLessons)}
                  className="text-xs font-bold text-sky-600 hover:text-sky-800 hover:underline cursor-pointer flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  {isBrowsingLessons ? 'Thu gọn danh sách' : 'Chọn bài học khác'}
                </button>
              )}
            </div>

            {/* Currently Selected Lesson Card */}
            {selectedLesson && !isBrowsingLessons ? (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-50 to-indigo-50/60 border-2 border-sky-300 flex items-center justify-between gap-3 shadow-xs">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-full bg-sky-600 text-white text-[10px] font-black uppercase tracking-wider">
                      Toán Lớp {selectedLesson.grade}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-white text-sky-800 text-[10px] font-bold border border-sky-200">
                      v{selectedLesson.currentVersion || 1}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                      <Check className="w-3 h-3 text-emerald-600" /> Đã xuất bản
                    </span>
                  </div>
                  <h4 className="text-sm font-black text-slate-900 truncate">
                    {selectedLesson.title}
                  </h4>
                  <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                    {selectedLesson.description || 'Bài tập rèn luyện kỹ năng tư duy logic toán học.'}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {onPreviewLesson && (
                    <button
                      type="button"
                      onClick={() => onPreviewLesson(selectedLesson)}
                      title="Xem trước bài học"
                      className="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 cursor-pointer transition-colors shadow-2xs"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsBrowsingLessons(true)}
                    className="px-3 py-1.5 rounded-xl bg-white hover:bg-sky-50 text-sky-700 text-xs font-bold border border-sky-200 cursor-pointer transition-colors"
                  >
                    Đổi bài
                  </button>
                </div>
              </div>
            ) : (
              /* Lesson Browser & Search */
              <div className="p-3.5 rounded-2xl bg-slate-50 border-2 border-slate-200 space-y-3">
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Tìm kiếm bài học..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full h-9 pl-9 pr-3 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-800 placeholder-slate-400 focus:border-sky-500 focus:outline-hidden"
                    />
                  </div>

                  {/* Grade filter tabs if not locked to student/class */}
                  {!targetStudent && !initialClassId && (
                    <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shrink-0">
                      <button
                        type="button"
                        onClick={() => setGradeFilter('all')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-black cursor-pointer transition-colors ${
                          gradeFilter === 'all'
                            ? 'bg-sky-600 text-white'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Tất cả
                      </button>
                      <button
                        type="button"
                        onClick={() => setGradeFilter(1)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-black cursor-pointer transition-colors ${
                          gradeFilter === 1
                            ? 'bg-sky-600 text-white'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Khối 1
                      </button>
                      <button
                        type="button"
                        onClick={() => setGradeFilter(2)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-black cursor-pointer transition-colors ${
                          gradeFilter === 2
                            ? 'bg-sky-600 text-white'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Khối 2
                      </button>
                    </div>
                  )}
                </div>

                {/* Lesson List */}
                <div className="max-h-52 overflow-y-auto space-y-2 pr-1">
                  {eligibleLessons.length === 0 ? (
                    <div className="p-6 text-center text-xs font-bold text-slate-500 bg-white rounded-xl border border-slate-200">
                      Không tìm thấy bài học đã xuất bản nào phù hợp.
                    </div>
                  ) : (
                    eligibleLessons.map((l) => {
                      const isSelected = selectedLesson?.id === l.id;
                      return (
                        <div
                          key={l.id}
                          className={`p-3 rounded-xl border-2 transition-all flex items-center justify-between gap-2 cursor-pointer ${
                            isSelected
                              ? 'bg-sky-50 border-sky-400 text-sky-900'
                              : 'bg-white border-slate-200 hover:border-sky-300 text-slate-800'
                          }`}
                          onClick={() => handleSelectLesson(l)}
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="px-2 py-0.5 rounded-md bg-sky-100 text-sky-800 text-[10px] font-black uppercase">
                                Khối {l.grade}
                              </span>
                              <span className="text-[10px] font-bold text-slate-400">
                                v{l.currentVersion || 1}
                              </span>
                            </div>
                            <div className="text-xs font-black truncate">{l.title}</div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                            {onPreviewLesson && (
                              <button
                                type="button"
                                onClick={() => onPreviewLesson(l)}
                                title="Xem trước nội dung"
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleSelectLesson(l)}
                              className={`px-3 py-1 rounded-lg text-xs font-black cursor-pointer transition-colors ${
                                isSelected
                                  ? 'bg-sky-600 text-white'
                                  : 'bg-slate-100 hover:bg-sky-100 text-slate-800 hover:text-sky-800'
                              }`}
                            >
                              {isSelected ? 'Đã chọn' : 'Chọn'}
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* SECTION 2: TARGET CLASSROOM OR STUDENT */}
          <div>
            <label className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5 mb-2">
              <User className="w-3.5 h-3.5 text-sky-600" /> 2. Đối tượng nhận bài
            </label>

            {targetStudent ? (
              <div className="p-3.5 bg-amber-50 rounded-2xl border-2 border-amber-300 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-400 text-amber-950 flex items-center justify-center font-black">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[10px] font-black text-amber-800 uppercase tracking-wider">
                      Giao riêng cho học sinh
                    </div>
                    <div className="text-sm font-black text-slate-900">
                      {targetStudent.displayName}
                    </div>
                    <div className="text-xs font-bold text-sky-700">
                      Mã: {targetStudent.studentCode || targetStudent.id} • Lớp{' '}
                      {classes.find((c) => c.id === targetStudent.classId)?.name || ''}
                    </div>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-full bg-amber-200 text-amber-950 text-xs font-black">
                  Cá nhân
                </span>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-500">
                    Chọn lớp phụ trách nhận bài (Khối {targetGrade})
                  </span>
                  <button
                    type="button"
                    onClick={selectAll}
                    className="text-xs font-bold text-sky-600 hover:underline cursor-pointer"
                  >
                    {selectedClassIds.length === eligibleClasses.length && eligibleClasses.length > 0
                      ? 'Bỏ chọn hết'
                      : 'Chọn tất cả'}
                  </button>
                </div>

                <div className="space-y-2">
                  {eligibleClasses.length === 0 ? (
                    <div className="p-4 rounded-xl bg-slate-50 text-center text-xs font-bold text-slate-500 border border-slate-200">
                      Không tìm thấy lớp học Khối {targetGrade} do bạn phụ trách.
                    </div>
                  ) : (
                    eligibleClasses.map((cls) => {
                      const isChecked = selectedClassIds.includes(cls.id);
                      return (
                        <button
                          key={cls.id}
                          type="button"
                          onClick={() => toggleClass(cls.id)}
                          className={`w-full p-3 rounded-2xl border-2 text-left font-bold text-sm flex items-center justify-between transition-colors cursor-pointer ${
                            isChecked
                              ? 'bg-sky-50 border-sky-400 text-sky-900'
                              : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            {isChecked ? (
                              <CheckSquare className="w-5 h-5 text-sky-600" />
                            ) : (
                              <Square className="w-5 h-5 text-slate-400" />
                            )}
                            <span>Lớp {cls.name}</span>
                          </div>
                          <span className="text-xs font-semibold text-slate-500">
                            {cls.studentCount || 0} học sinh
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* SECTION 3: DUE DATE */}
          <div>
            <label className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5 mb-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500" /> 3. Hạn hoàn thành
            </label>
            <input
              type="date"
              value={dueDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl border-2 border-slate-200 bg-white font-bold text-slate-800 text-sm focus:border-sky-500 focus:outline-hidden"
            />
          </div>

          {/* SECTION 4: INSTRUCTIONS */}
          <div>
            <label className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5 mb-1.5">
              <span className="text-sky-600 font-bold">💬</span> 4. Lời dặn của thầy cô (Tùy chọn)
            </label>
            <textarea
              rows={2}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Ví dụ: Các em nhớ đếm kỹ que tính và đọc kỹ gợi ý của Thám tử Cáo trước khi chọn đáp án nhé!"
              className="w-full p-3 rounded-xl border-2 border-slate-200 bg-white font-semibold text-slate-800 text-xs focus:border-sky-500 focus:outline-hidden resize-none"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold cursor-pointer transition-colors"
          >
            Hủy
          </button>

          <button
            type="button"
            disabled={
              isSubmitting ||
              !selectedLesson ||
              (!targetStudent && selectedClassIds.length === 0) ||
              (Boolean(duplicateWarning) && !allowReassign)
            }
            onClick={handleAssign}
            className="px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 active:scale-95 text-white text-sm font-black flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50 transition-all"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Đang giao bài...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" /> Xác nhận giao bài
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
