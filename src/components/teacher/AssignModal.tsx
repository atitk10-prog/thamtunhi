import React, { useState } from 'react';
import { X, Send, CheckSquare, Square, Calendar, Loader2 } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Lesson, Classroom } from '../../types';

interface AssignModalProps {
  isOpen: boolean;
  lesson: Lesson | null;
  classes: Classroom[];
  teacherId: string;
  onClose: () => void;
  onAssigned: () => void;
}

export const AssignModal: React.FC<AssignModalProps> = ({
  isOpen,
  lesson,
  classes,
  teacherId,
  onClose,
  onAssigned,
}) => {
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState<string>(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !lesson) return null;

  // Filter classes matching lesson grade
  const eligibleClasses = classes.filter((c) => c.grade === lesson.grade);

  const toggleClass = (cId: string) => {
    setSelectedClassIds((prev) =>
      prev.includes(cId) ? prev.filter((id) => id !== cId) : [...prev, cId]
    );
  };

  const selectAll = () => {
    if (selectedClassIds.length === eligibleClasses.length) {
      setSelectedClassIds([]);
    } else {
      setSelectedClassIds(eligibleClasses.map((c) => c.id));
    }
  };

  const handleAssign = async () => {
    if (selectedClassIds.length === 0) {
      setErrorMsg('Vui lòng chọn ít nhất 1 lớp học.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const versionId = `version-${lesson.id}-v${lesson.currentVersion || 1}`;

      for (const classId of selectedClassIds) {
        const cls = eligibleClasses.find((c) => c.id === classId);
        // Idempotency key based on lesson + class + version
        const idempotencyKey = `assign-${lesson.id}-v${lesson.currentVersion || 1}-${classId}`;
        const assignmentDoc = {
          id: idempotencyKey,
          title: `[Toán ${lesson.grade}] ${lesson.title}`,
          lessonId: lesson.id,
          lessonVersionId: versionId,
          classId,
          className: cls?.name || '1A',
          grade: lesson.grade,
          teacherId,
          dueDate,
          status: 'open',
          idempotencyKey,
          createdAt: new Date().toISOString(),
          dataOrigin: 'real',
          environmentTag: 'demo',
        };

        await setDoc(doc(db, 'assignments', idempotencyKey), assignmentDoc, { merge: true });
      }

      onAssigned();
      onClose();
    } catch (err) {
      console.error('Assign error:', err);
      setErrorMsg('Không thể giao bài. Vui lòng kiểm tra kết nối mạng.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-3xl border-3 border-sky-300 shadow-2xl p-6 sm:p-8 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div>
            <h3 className="text-xl font-black text-slate-800">Giao Bài Cho Lớp</h3>
            <p className="text-xs font-semibold text-slate-500 mt-0.5 truncate max-w-xs">
              {lesson.title} (v{lesson.currentVersion || 1})
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold">
            {errorMsg}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-black uppercase tracking-wider text-slate-600">
                Chọn Lớp Nhận Bài (Khối {lesson.grade})
              </label>
              <button
                type="button"
                onClick={selectAll}
                className="text-xs font-bold text-sky-600 hover:underline cursor-pointer"
              >
                {selectedClassIds.length === eligibleClasses.length ? 'Bỏ chọn hết' : 'Chọn tất cả'}
              </button>
            </div>

            <div className="space-y-2">
              {eligibleClasses.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-50 text-center text-xs font-bold text-slate-500">
                  Không tìm thấy lớp học Khối {lesson.grade}.
                </div>
              ) : (
                eligibleClasses.map((cls) => {
                  const isChecked = selectedClassIds.includes(cls.id);
                  return (
                    <button
                      key={cls.id}
                      type="button"
                      onClick={() => toggleClass(cls.id)}
                      className={`w-full p-3 rounded-xl border-2 text-left font-bold text-sm flex items-center justify-between transition-colors cursor-pointer ${
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
                        {cls.studentCount || 12} học sinh
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500" /> Hạn Hoàn Thành
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl border-2 border-slate-200 bg-white font-bold text-slate-800 text-sm focus:border-sky-500 focus:outline-hidden"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold cursor-pointer"
          >
            Hủy
          </button>

          <button
            type="button"
            disabled={isSubmitting || selectedClassIds.length === 0}
            onClick={handleAssign}
            className="px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 active:scale-95 text-white text-sm font-black flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50 transition-all"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Đang giao...
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
