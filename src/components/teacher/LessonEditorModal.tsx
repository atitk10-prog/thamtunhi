import React, { useState } from 'react';
import { Plus, Trash2, Copy, ArrowUp, ArrowDown, Save, Send, X, AlertCircle } from 'lucide-react';
import { dataService } from '../../lib/dataService';
import { Lesson, LessonVersion, Question, InteractionType } from '../../types';

interface LessonEditorModalProps {
  isOpen: boolean;
  lesson?: Lesson | null;
  lessonVersion?: LessonVersion | null;
  onClose: () => void;
  onSaved: () => void;
  teacherId: string;
}

export const LessonEditorModal: React.FC<LessonEditorModalProps> = ({
  isOpen,
  lesson,
  lessonVersion,
  onClose,
  onSaved,
  teacherId,
}) => {
  const isEditing = Boolean(lesson);

  const [title, setTitle] = useState(lesson?.title || '');
  const [grade, setGrade] = useState<1 | 2>(lesson?.grade || 1);
  const [topic, setTopic] = useState(lesson?.topic || '');
  const [learningStandard, setLearningStandard] = useState(lesson?.learningStandard || '');
  const [description, setDescription] = useState(lesson?.description || '');
  const [durationMinutes, setDurationMinutes] = useState(lesson?.durationMinutes || 20);

  const [questions, setQuestions] = useState<Question[]>(
    lessonVersion?.questions || [
      {
        id: `q-custom-${Date.now()}-1`,
        order: 1,
        prompt: 'Thám tử Cáo có 3 quả táo đỏ, thêm 2 quả táo xanh. Hỏi có tất cả mấy quả táo?',
        interactionType: 'number_input',
        expectedAnswer: '5',
        explanation: '3 + 2 = 5 quả táo.',
        skillTag: 'Cộng phạm vi 10',
        difficulty: 'easy',
        ruleHints: [
          { pattern: 'COUNTING_OFF_BY_ONE', hintText: 'Đếm lại từng quả táo: 1, 2, 3, 4, 5.' }
        ]
      }
    ]
  );

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  // Add new question
  const handleAddQuestion = () => {
    const nextOrder = questions.length + 1;
    const newQ: Question = {
      id: `q-custom-${Date.now()}-${nextOrder}`,
      order: nextOrder,
      prompt: `Câu hỏi toán số ${nextOrder}`,
      interactionType: 'number_input',
      expectedAnswer: '10',
      explanation: 'Giải thích chi tiết cho câu hỏi.',
      skillTag: topic || 'Kỹ năng toán học',
      difficulty: 'medium',
      ruleHints: [
        { pattern: 'GENERAL_CALCULATION_ERROR', hintText: 'Hãy kiểm tra lại từng bước tính.' }
      ]
    };
    setQuestions([...questions, newQ]);
  };

  // Remove question
  const handleDeleteQuestion = (index: number) => {
    if (questions.length <= 1) {
      alert('Bài học cần có ít nhất 1 câu hỏi.');
      return;
    }
    const filtered = questions.filter((_, i) => i !== index);
    const reordered = filtered.map((q, i) => ({ ...q, order: i + 1 }));
    setQuestions(reordered);
  };

  // Clone question
  const handleCloneQuestion = (index: number) => {
    const target = questions[index];
    const cloned: Question = {
      ...target,
      id: `q-custom-${Date.now()}-${questions.length + 1}`,
      prompt: `${target.prompt} (Bản sao)`,
      order: questions.length + 1,
    };
    setQuestions([...questions, cloned]);
  };

  // Move up/down
  const handleMoveQuestion = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === questions.length - 1)) return;
    const newArr = [...questions];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const temp = newArr[index];
    newArr[index] = newArr[targetIdx];
    newArr[targetIdx] = temp;
    const reordered = newArr.map((q, i) => ({ ...q, order: i + 1 }));
    setQuestions(reordered);
  };

  // Update question field
  const handleUpdateQuestion = (index: number, field: keyof Question, value: any) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  // Save logic (Draft or Publish)
  const handleSave = async (publish: boolean) => {
    setErrorMsg(null);

    // Validation
    if (!title.trim()) {
      setErrorMsg('Vui lòng nhập tiêu đề bài học.');
      return;
    }
    if (!topic.trim()) {
      setErrorMsg('Vui lòng nhập chủ đề bài học.');
      return;
    }
    for (let i = 0; i < questions.length; i++) {
      if (!questions[i].prompt.trim()) {
        setErrorMsg(`Câu hỏi số ${i + 1} chưa có nội dung câu hỏi.`);
        return;
      }
      if (!questions[i].expectedAnswer.trim()) {
        setErrorMsg(`Câu hỏi số ${i + 1} chưa có đáp án chuẩn.`);
        return;
      }
    }

    setIsSaving(true);
    try {
      const lessonId = lesson?.id || `lesson-custom-${Date.now()}`;
      const nextVersionNumber = lesson ? (lesson.currentVersion || 1) + (publish ? 1 : 0) : 1;
      const versionId = `version-${lessonId}-v${nextVersionNumber}`;

      // 1. Create or update Immutable LessonVersion snapshot
      const versionDoc: LessonVersion = {
        id: versionId,
        lessonId,
        versionNumber: nextVersionNumber,
        title,
        grade,
        topic,
        learningStandard,
        questions,
        isPublished: publish,
        publishedAt: publish ? new Date().toISOString() : undefined,
        createdBy: teacherId,
        dataOrigin: 'real',
        environmentTag: 'demo',
      };
      // 2. Create or update Lesson header
      const lessonDoc: Lesson = {
        id: lessonId,
        title,
        grade,
        topic,
        learningStandard,
        description,
        durationMinutes,
        totalQuestions: questions.length,
        status: publish ? 'published' : 'draft',
        currentVersion: nextVersionNumber,
        createdBy: lesson?.createdBy || teacherId,
        createdAt: lesson?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        dataOrigin: 'real',
        environmentTag: 'demo',
      };

      // 3. Save snapshot & header via unified dataService (Dual-Path)
      await dataService.saveLessonVersion(lessonDoc, versionDoc);

      onSaved();
      onClose();
    } catch (err) {
      console.error('Save lesson error:', err);
      setErrorMsg('Lỗi lưu trữ dữ liệu lên Firebase. Vui lòng thử lại.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-white rounded-3xl border-3 border-sky-300 shadow-2xl p-6 sm:p-8 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-800">
              {isEditing ? 'Biên Tập Bài Học Toán (v1 ➔ v2)' : 'Tạo Bài Học Mới'}
            </h3>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              Soạn thảo thủ công đầy đủ theo cấu trúc chuẩn GDPT 2018
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto py-5 space-y-6 pr-2">
          {errorMsg && (
            <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-800 text-sm font-bold flex items-center gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Lesson Metadata Form */}
          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1">
                  Tiêu đề bài học *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ví dụ: Phép cộng có nhớ trong phạm vi 20"
                  className="w-full h-11 px-3.5 rounded-xl border-2 border-slate-200 bg-white font-bold text-slate-800 focus:border-sky-500 focus:outline-hidden text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1">
                  Khối Lớp *
                </label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(Number(e.target.value) as 1 | 2)}
                  className="w-full h-11 px-3.5 rounded-xl border-2 border-slate-200 bg-white font-bold text-slate-800 focus:border-sky-500 focus:outline-hidden text-sm"
                >
                  <option value={1}>Lớp 1</option>
                  <option value={2}>Lớp 2</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1">
                  Chủ đề GDPT 2018 *
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Ví dụ: Số và Phép tính, Đo lường..."
                  className="w-full h-11 px-3.5 rounded-xl border-2 border-slate-200 bg-white font-bold text-slate-800 focus:border-sky-500 focus:outline-hidden text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1">
                  Thời lượng dự kiến (phút)
                </label>
                <input
                  type="number"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full h-11 px-3.5 rounded-xl border-2 border-slate-200 bg-white font-bold text-slate-800 focus:border-sky-500 focus:outline-hidden text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1">
                Yêu cầu cần đạt (Chuẩn năng lực GDPT 2018)
              </label>
              <textarea
                rows={2}
                value={learningStandard}
                onChange={(e) => setLearningStandard(e.target.value)}
                placeholder="Ví dụ: Thực hiện được phép cộng qua 10 bằng cách tách số..."
                className="w-full p-3 rounded-xl border-2 border-slate-200 bg-white font-semibold text-slate-800 focus:border-sky-500 focus:outline-hidden text-sm"
              />
            </div>
          </div>

          {/* Questions Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-black text-slate-800">
                Danh sách câu hỏi ({questions.length} câu)
              </h4>

              <button
                type="button"
                onClick={handleAddQuestion}
                className="px-3.5 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-extrabold flex items-center gap-1.5 border border-sky-200 cursor-pointer transition-colors"
              >
                <Plus className="w-4 h-4" /> Thêm câu hỏi
              </button>
            </div>

            <div className="space-y-4">
              {questions.map((q, idx) => (
                <div
                  key={q.id}
                  className="p-5 rounded-2xl bg-white border-2 border-slate-200 shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-sky-500 text-white">
                      Câu {idx + 1}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleMoveQuestion(idx, 'up')}
                        disabled={idx === 0}
                        title="Di chuyển lên"
                        className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 disabled:opacity-30 cursor-pointer"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveQuestion(idx, 'down')}
                        disabled={idx === questions.length - 1}
                        title="Di chuyển xuống"
                        className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 disabled:opacity-30 cursor-pointer"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCloneQuestion(idx)}
                        title="Nhân bản câu này"
                        className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteQuestion(idx)}
                        title="Xóa câu hỏi"
                        className="p-1 rounded-lg hover:bg-rose-50 text-rose-500 cursor-pointer ml-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      Đề bài / Lời dẫn câu hỏi *
                    </label>
                    <input
                      type="text"
                      value={q.prompt}
                      onChange={(e) => handleUpdateQuestion(idx, 'prompt', e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm font-bold text-slate-800"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">
                        Dạng tương tác trực quan
                      </label>
                      <select
                        value={q.interactionType}
                        onChange={(e) => handleUpdateQuestion(idx, 'interactionType', e.target.value as InteractionType)}
                        className="w-full h-9 px-2 rounded-lg border border-slate-200 text-xs font-bold"
                      >
                        <option value="number_input">Nhập số trực tiếp</option>
                        <option value="single_choice">Chọn 1 đáp án trắc nghiệm</option>
                        <option value="operator_pick">Chọn dấu phép tính / so sánh</option>
                        <option value="expression_match">Ghép nối cặp thẻ</option>
                        <option value="ten_frame_bundle">Khung 10 ô / Bó chục que tính</option>
                        <option value="number_line_order">Trục số / Sắp thứ tự số</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">
                        Đáp án chuẩn xác *
                      </label>
                      <input
                        type="text"
                        value={q.expectedAnswer}
                        onChange={(e) => handleUpdateQuestion(idx, 'expectedAnswer', e.target.value)}
                        className="w-full h-9 px-3 rounded-lg border border-emerald-300 bg-emerald-50/50 text-xs font-black text-emerald-800"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">
                        Độ khó
                      </label>
                      <select
                        value={q.difficulty}
                        onChange={(e) => handleUpdateQuestion(idx, 'difficulty', e.target.value)}
                        className="w-full h-9 px-2 rounded-lg border border-slate-200 text-xs font-bold"
                      >
                        <option value="easy">Dễ (Nhận biết)</option>
                        <option value="medium">Vừa (Thông hiểu)</option>
                        <option value="hard">Khó (Vận dụng)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      Lời giải thích chi tiết
                    </label>
                    <input
                      type="text"
                      value={q.explanation}
                      onChange={(e) => handleUpdateQuestion(idx, 'explanation', e.target.value)}
                      placeholder="Giải thích từng bước cho học sinh và giáo viên..."
                      className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs font-medium text-slate-700"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm cursor-pointer transition-colors"
          >
            Hủy
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={isSaving}
              onClick={() => handleSave(false)}
              className="px-5 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-sm flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Save className="w-4 h-4" /> Lưu bản nháp (v{lesson?.currentVersion || 1})
            </button>

            <button
              type="button"
              disabled={isSaving}
              onClick={() => handleSave(true)}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-sm flex items-center gap-2 cursor-pointer shadow-md transition-all active:scale-95"
            >
              <Send className="w-4 h-4" /> Duyệt &amp; Xuất bản {isEditing ? `(v${(lesson?.currentVersion || 1) + 1})` : '(v1)'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
