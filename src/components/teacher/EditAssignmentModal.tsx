import React, { useState, useEffect } from 'react';
import { X, Calendar, MessageSquare, Lock, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Assignment } from '../../types';
import { dataService } from '../../lib/dataService';

export interface EditAssignmentModalProps {
  isOpen: boolean;
  assignment: Assignment | null;
  onClose: () => void;
  onUpdated: () => void;
}

export const EditAssignmentModal: React.FC<EditAssignmentModalProps> = ({
  isOpen,
  assignment,
  onClose,
  onUpdated,
}) => {
  const [dueDate, setDueDate] = useState('');
  const [instructions, setInstructions] = useState('');
  const [status, setStatus] = useState<'open' | 'closed'>('open');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && assignment) {
      setDueDate(assignment.dueDate || '');
      setInstructions(assignment.instructions || '');
      setStatus((assignment.status as 'open' | 'closed') || 'open');
      setErrorMsg(null);
    }
  }, [isOpen, assignment]);

  if (!isOpen || !assignment) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await dataService.updateAssignment(assignment.id, {
        dueDate: dueDate.trim() || undefined,
        instructions: instructions.trim() || undefined,
        status,
      });

      onUpdated();
      onClose();
    } catch (err: any) {
      console.error('Update assignment error:', err);
      setErrorMsg(err.message || 'Không thể cập nhật bài giao. Vui lòng kiểm tra lại kết nối mạng.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white rounded-3xl border-3 border-sky-300 shadow-2xl p-5 sm:p-7 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
          <div>
            <span className="text-xs font-black uppercase text-sky-600 tracking-wider">
              Điều Chỉnh Bài Giao
            </span>
            <h3 className="text-lg font-black text-slate-800">
              {assignment.title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Locked Class & Lesson Notice */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-600">
              <p className="font-extrabold text-slate-800">
                Lớp nhận bài: <span className="text-sky-600">{assignment.className || assignment.classId}</span>
                {assignment.studentName && <span> • Riêng học sinh: {assignment.studentName}</span>}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Lớp nhận và đề bài gốc được bảo vệ an toàn nhằm không làm thay đổi bài làm hoặc điểm số của học sinh.
              </p>
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5 mb-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500" /> Hạn nộp bài
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl border-2 border-slate-200 bg-white font-bold text-slate-800 text-sm focus:border-sky-500 focus:outline-hidden"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Để trống nếu không giới hạn thời gian nộp bài.
            </p>
          </div>

          {/* Status Toggle */}
          <div>
            <label className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5 mb-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" /> Trạng thái bài giao
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setStatus('open')}
                className={`p-3 rounded-2xl border-2 font-black text-xs flex items-center justify-center gap-2 cursor-pointer transition-all ${
                  status === 'open'
                    ? 'bg-emerald-50 border-emerald-400 text-emerald-800 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span>Đang mở cho làm</span>
              </button>

              <button
                type="button"
                onClick={() => setStatus('closed')}
                className={`p-3 rounded-2xl border-2 font-black text-xs flex items-center justify-center gap-2 cursor-pointer transition-all ${
                  status === 'closed'
                    ? 'bg-slate-100 border-slate-400 text-slate-800 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                <span>Đã đóng (khóa nộp)</span>
              </button>
            </div>
          </div>

          {/* Teacher Instructions */}
          <div>
            <label className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5 mb-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-sky-600" /> Lời dặn dò của thầy cô
            </label>
            <textarea
              rows={3}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Nhập ghi chú hoặc nhắc nhở học sinh (hiển thị trực tiếp trên góc học tập của học sinh)..."
              className="w-full p-3 rounded-xl border-2 border-slate-200 bg-white font-semibold text-slate-800 text-xs focus:border-sky-500 focus:outline-hidden resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer transition-colors"
            >
              Đóng
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 active:scale-95 text-white text-xs font-black flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50 transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Đang cập nhật...
                </>
              ) : (
                'Lưu thay đổi'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
