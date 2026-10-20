import React, { useState } from 'react';
import { Sparkles, X, AlertTriangle, Check, Loader2 } from 'lucide-react';
import { Question } from '../../types';

interface AiDraftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyQuestions: (questions: Question[]) => void;
}

export const AiDraftModal: React.FC<AiDraftModalProps> = ({
  isOpen,
  onClose,
  onApplyQuestions,
}) => {
  const [grade, setGrade] = useState<1 | 2>(1);
  const [topic, setTopic] = useState('Phép cộng trong phạm vi 10');
  const [targetPattern, setTargetPattern] = useState('COUNTING_OFF_BY_ONE');
  const [questionCount, setQuestionCount] = useState<number>(4);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [draftQuestions, setDraftQuestions] = useState<Question[]>([]);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setLoading(true);
    setErrorMsg(null);
    setDraftQuestions([]);

    try {
      const res = await fetch('/api/teacher/generate-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grade,
          topic,
          targetPattern,
          questionCount,
          difficulty,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.code === 'AI_NOT_CONFIGURED') {
          setErrorMsg('AI chưa cấu hình: Chưa tìm thấy GEMINI_API_KEY trong hệ thống. Thầy/Cô vẫn có thể tự biên soạn bài học thủ công qua công cụ biên tập.');
        } else {
          setErrorMsg(data.error || 'Có lỗi khi tạo bài nháp từ AI.');
        }
        return;
      }

      if (data.questions && Array.isArray(data.questions)) {
        setDraftQuestions(data.questions);
      } else {
        setErrorMsg('Dữ liệu AI trả về không đúng định dạng chuẩn.');
      }
    } catch (err) {
      setErrorMsg('Không thể kết nối đến máy chủ AI.');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (draftQuestions.length > 0) {
      onApplyQuestions(draftQuestions);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white rounded-3xl border-3 border-sky-300 shadow-2xl p-6 sm:p-8 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-sky-500 text-white flex items-center justify-center shadow">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800">
                AI Soạn Bài Nháp Toán (Gemini)
              </h3>
              <p className="text-xs font-semibold text-slate-500">
                Tạo câu hỏi bám sát GDPT 2018 với quy tắc chẩn đoán lỗi sai trực quan
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Controls */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1.5">
                Khối Lớp
              </label>
              <select
                value={grade}
                onChange={(e) => setGrade(Number(e.target.value) as 1 | 2)}
                className="w-full h-12 px-4 rounded-xl border-2 border-slate-200 bg-white font-bold text-slate-800 focus:border-sky-500 focus:outline-hidden"
              >
                <option value={1}>Toán Lớp 1 (GDPT 2018)</option>
                <option value={2}>Toán Lớp 2 (GDPT 2018)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1.5">
                Độ Khó
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as any)}
                className="w-full h-12 px-4 rounded-xl border-2 border-slate-200 bg-white font-bold text-slate-800 focus:border-sky-500 focus:outline-hidden"
              >
                <option value="easy">Cơ bản / Nhận biết (Dễ)</option>
                <option value="medium">Thông hiểu / Luyện tập (Vừa)</option>
                <option value="hard">Vận dụng / Nâng cao (Khó)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1.5">
              Chủ Đề Bài Học
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Ví dụ: Phép cộng có nhớ trong phạm vi 20, Khung 10 ô..."
              className="w-full h-12 px-4 rounded-xl border-2 border-slate-200 bg-white font-bold text-slate-800 focus:border-sky-500 focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1.5">
                Tập trung mẫu lỗi
              </label>
              <select
                value={targetPattern}
                onChange={(e) => setTargetPattern(e.target.value)}
                className="w-full h-12 px-3 rounded-xl border-2 border-slate-200 bg-white font-bold text-slate-800 focus:border-sky-500 focus:outline-hidden text-sm"
              >
                <option value="COUNTING_OFF_BY_ONE">Đếm lệch 1 đơn vị</option>
                <option value="WRONG_OPERATOR">Nhầm dấu phép tính (+/-)</option>
                <option value="CROSS_TEN_ERROR">Sai bước qua 10 (cộng/trừ có nhớ)</option>
                <option value="PLACE_VALUE_SWAP">Đảo vị trí Chục và Đơn vị</option>
                <option value="COMPARISON_INVERSION">Đảo chiều dấu so sánh (&gt; / &lt;)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1.5">
                Số lượng câu hỏi
              </label>
              <select
                value={questionCount}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                className="w-full h-12 px-4 rounded-xl border-2 border-slate-200 bg-white font-bold text-slate-800 focus:border-sky-500 focus:outline-hidden"
              >
                <option value={2}>2 câu mẫu</option>
                <option value={4}>4 câu bài tập</option>
                <option value={8}>8 câu trọn bộ</option>
              </select>
            </div>
          </div>

          {/* Error Notice */}
          {errorMsg && (
            <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-900 text-sm font-semibold flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>{errorMsg}</div>
            </div>
          )}

          {/* Generated Questions Preview */}
          {draftQuestions.length > 0 && (
            <div className="mt-4 p-4 rounded-2xl bg-slate-50 border-2 border-slate-200 space-y-3">
              <div className="text-xs font-black uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-600" /> Đã sinh {draftQuestions.length} câu hỏi hợp lệ:
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {draftQuestions.map((q, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800">
                    <span className="text-sky-600">Câu {idx + 1}:</span> {q.prompt} (Đáp án: <strong className="text-emerald-600">{q.expectedAnswer}</strong>)
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm cursor-pointer transition-colors"
          >
            Đóng
          </button>

          {draftQuestions.length > 0 ? (
            <button
              type="button"
              onClick={handleApply}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm flex items-center gap-2 cursor-pointer shadow-md transition-all active:scale-95"
            >
              <Check className="w-4 h-4" /> Đưa vào bài giảng
            </button>
          ) : (
            <button
              type="button"
              disabled={loading}
              onClick={handleGenerate}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-black text-sm flex items-center gap-2 cursor-pointer shadow-md transition-all active:scale-95 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Đang tạo bài nháp...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" /> AI Tạo Bài Nháp
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
