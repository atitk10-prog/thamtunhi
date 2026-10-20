import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Copy, ArrowUp, ArrowDown, Save, Send, X, AlertCircle, Layers, Link as LinkIcon, Eye, Lightbulb } from 'lucide-react';
import { dataService } from '../../lib/dataService';
import { Lesson, LessonVersion, Question, InteractionType, MathErrorPattern } from '../../types';

interface LessonEditorModalProps {
  isOpen: boolean;
  lesson?: Lesson | null;
  lessonVersion?: LessonVersion | null;
  onClose: () => void;
  onSaved: () => void;
  teacherId: string;
}

const ERROR_PATTERNS: { value: MathErrorPattern; label: string }[] = [
  { value: 'GENERAL_CALCULATION_ERROR', label: 'Lỗi tính toán cơ bản' },
  { value: 'COUNTING_OFF_BY_ONE', label: 'Đếm lệch 1 đơn vị' },
  { value: 'WRONG_OPERATOR', label: 'Nhầm dấu phép tính (+ / −)' },
  { value: 'CROSS_TEN_ERROR', label: 'Sai bước qua 10 (cộng/trừ có nhớ)' },
  { value: 'NUMBER_ORDER_CONFUSION', label: 'Nhầm thứ tự số trên trục số' },
  { value: 'COMPARISON_INVERSION', label: 'Nhầm chiều so sánh (> / <)' },
  { value: 'WORD_PROBLEM_WRONG_OPERATION', label: 'Chọn sai phép tính bài toán có lời văn' },
  { value: 'PLACE_VALUE_SWAP', label: 'Nhầm vị trí hàng chục và hàng đơn vị' },
  { value: 'GEOMETRY_MISIDENTIFICATION', label: 'Nhầm lẫn hình phẳng / hình khối' },
  { value: 'MEASUREMENT_UNIT_ERROR', label: 'Nhầm đơn vị đo lường' },
];

export const LessonEditorModal: React.FC<LessonEditorModalProps> = ({
  isOpen,
  lesson,
  lessonVersion,
  onClose,
  onSaved,
  teacherId,
}) => {
  const isEditing = Boolean(lesson);

  const [title, setTitle] = useState('');
  const [grade, setGrade] = useState<1 | 2>(1);
  const [topic, setTopic] = useState('');
  const [learningStandard, setLearningStandard] = useState('');
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(20);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [versionLoadError, setVersionLoadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Synchronize state whenever modal opens or lesson/lessonVersion changes
  useEffect(() => {
    if (!isOpen) return;

    if (lesson) {
      setTitle(lesson.title || '');
      setGrade((lesson.grade as 1 | 2) || 1);
      setTopic(lesson.topic || '');
      setLearningStandard(lesson.learningStandard || '');
      setDescription(lesson.description || '');
      setDurationMinutes(lesson.durationMinutes || 20);

      if (lessonVersion && Array.isArray(lessonVersion.questions) && lessonVersion.questions.length > 0) {
        setQuestions(JSON.parse(JSON.stringify(lessonVersion.questions)));
        setVersionLoadError(null);
        setErrorMsg(null);
      } else if (lessonVersion === null) {
        // Failed to load lesson version from server
        setQuestions([]);
        setVersionLoadError('Không thể tải dữ liệu câu hỏi của bài học này. Vui lòng kiểm tra kết nối mạng và thử lại.');
      }
    } else {
      // New lesson creation mode
      setTitle('');
      setGrade(1);
      setTopic('');
      setLearningStandard('');
      setDescription('');
      setDurationMinutes(20);
      setVersionLoadError(null);
      setErrorMsg(null);
      setQuestions([
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
      ]);
    }
  }, [isOpen, lesson, lessonVersion]);

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
      explanation: 'Giải thích chi tiết các bước tính.',
      skillTag: topic || 'Kỹ năng toán học',
      difficulty: 'medium',
      ruleHints: [
        { pattern: 'GENERAL_CALCULATION_ERROR', hintText: 'Hãy quan sát kỹ và kiểm tra lại từng bước tính.' }
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
      ...JSON.parse(JSON.stringify(target)),
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

  // Options helpers (for single_choice)
  const handleUpdateOption = (qIdx: number, optIdx: number, val: string) => {
    const updated = [...questions];
    const currentOpts = updated[qIdx].options ? [...updated[qIdx].options!] : ['', '', '', ''];
    currentOpts[optIdx] = val;
    updated[qIdx].options = currentOpts;
    setQuestions(updated);
  };

  // Pairs helpers (for expression_match)
  const handleAddPair = (qIdx: number) => {
    const updated = [...questions];
    const currentPairs = updated[qIdx].pairs ? [...updated[qIdx].pairs!] : [];
    currentPairs.push({ left: `Vế ${currentPairs.length + 1}`, right: `Khớp ${currentPairs.length + 1}` });
    updated[qIdx].pairs = currentPairs;
    setQuestions(updated);
  };

  const handleUpdatePair = (qIdx: number, pIdx: number, side: 'left' | 'right', val: string) => {
    const updated = [...questions];
    const currentPairs = updated[qIdx].pairs ? [...updated[qIdx].pairs!] : [];
    if (currentPairs[pIdx]) {
      currentPairs[pIdx] = { ...currentPairs[pIdx], [side]: val };
      updated[qIdx].pairs = currentPairs;
      setQuestions(updated);
    }
  };

  const handleDeletePair = (qIdx: number, pIdx: number) => {
    const updated = [...questions];
    const currentPairs = updated[qIdx].pairs ? [...updated[qIdx].pairs!] : [];
    if (currentPairs.length <= 1) {
      alert('Dạng ghép nối cần có ít nhất 1 cặp thẻ.');
      return;
    }
    updated[qIdx].pairs = currentPairs.filter((_, i) => i !== pIdx);
    setQuestions(updated);
  };

  // Save logic (Draft or Publish)
  const handleSave = async (publish: boolean) => {
    setErrorMsg(null);

    if (versionLoadError) {
      setErrorMsg('Dữ liệu bài học chưa được tải thành công. Không thể lưu để bảo vệ dữ liệu hiện có.');
      return;
    }

    if (!title.trim()) {
      setErrorMsg('Vui lòng nhập tiêu đề bài học.');
      return;
    }
    if (!topic.trim()) {
      setErrorMsg('Vui lòng nhập chủ đề bài học.');
      return;
    }
    if (questions.length === 0) {
      setErrorMsg('Bài học phải có ít nhất 1 câu hỏi.');
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
        environmentTag: 'production',
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
        currentVersionId: versionId,
        createdBy: lesson?.createdBy || teacherId,
        createdAt: lesson?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        dataOrigin: 'real',
        environmentTag: 'production',
      };

      // 3. Save snapshot & header via unified dataService (Dual-Path)
      await dataService.saveLessonVersion(lessonDoc, versionDoc);

      onSaved();
      onClose();
    } catch (err) {
      console.error('Save lesson error:', err);
      setErrorMsg('Lỗi lưu trữ dữ liệu bài học. Vui lòng thử lại.');
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
              {isEditing ? `Biên Tập Bài Học: ${lesson?.title} (v${lesson?.currentVersion || 1} ➔ v${(lesson?.currentVersion || 1) + 1})` : 'Tạo Bài Học Toán Mới'}
            </h3>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              Soạn thảo thủ công đầy đủ 6 dạng tương tác toán học chuẩn GDPT 2018
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
          {versionLoadError && (
            <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-800 text-sm font-bold flex items-center gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{versionLoadError}</span>
            </div>
          )}

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
                  <option value={1}>Toán Lớp 1</option>
                  <option value={2}>Toán Lớp 2</option>
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
                  placeholder="Ví dụ: Số và Phép tính, Hình học, Đo lường..."
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
              <h4 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <Layers className="w-5 h-5 text-sky-600" />
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

            {questions.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-slate-500 font-bold">
                {versionLoadError ? 'Đang khóa danh sách do lỗi tải dữ liệu.' : 'Chưa có câu hỏi nào. Nhấn "Thêm câu hỏi" để bắt đầu.'}
              </div>
            ) : (
              <div className="space-y-4">
                {questions.map((q, idx) => (
                  <div
                    key={q.id || idx}
                    className="p-5 rounded-2xl bg-white border-2 border-slate-200 hover:border-sky-300 shadow-xs space-y-3 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-sky-500 text-white">
                          Câu {idx + 1}
                        </span>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                          [{q.interactionType}]
                        </span>
                      </div>

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

                    {/* Question Prompt */}
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">
                        Đề bài / Lời dẫn câu hỏi *
                      </label>
                      <textarea
                        rows={2}
                        value={q.prompt}
                        onChange={(e) => handleUpdateQuestion(idx, 'prompt', e.target.value)}
                        className="w-full p-2.5 rounded-lg border border-slate-200 text-sm font-bold text-slate-800 focus:border-sky-500 focus:outline-hidden"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">
                          Dạng tương tác trực quan
                        </label>
                        <select
                          value={q.interactionType}
                          onChange={(e) => handleUpdateQuestion(idx, 'interactionType', e.target.value as InteractionType)}
                          className="w-full h-9 px-2 rounded-lg border border-slate-200 text-xs font-bold bg-white"
                        >
                          <option value="number_input">Nhập số trực tiếp</option>
                          <option value="single_choice">Chọn 1 đáp án trắc nghiệm</option>
                          <option value="operator_pick">Chọn dấu phép tính / so sánh</option>
                          <option value="expression_match">Ghép nối cặp thẻ</option>
                          <option value="ten_frame_bundle">Khung 10 ô / Bó que tính</option>
                          <option value="number_line_order">Trục số / Thứ tự số</option>
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
                          placeholder="Ví dụ: 10, MATCHED_ALL, >"
                          className="w-full h-9 px-3 rounded-lg border border-emerald-300 bg-emerald-50/50 text-xs font-black text-emerald-800"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">
                          Kỹ năng / Skill Tag
                        </label>
                        <input
                          type="text"
                          value={q.skillTag || ''}
                          onChange={(e) => handleUpdateQuestion(idx, 'skillTag', e.target.value)}
                          placeholder="Cộng qua 10, Đếm số..."
                          className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs font-semibold"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">
                          Độ khó
                        </label>
                        <select
                          value={q.difficulty || 'medium'}
                          onChange={(e) => handleUpdateQuestion(idx, 'difficulty', e.target.value)}
                          className="w-full h-9 px-2 rounded-lg border border-slate-200 text-xs font-bold bg-white"
                        >
                          <option value="easy">Dễ (Nhận biết)</option>
                          <option value="medium">Vừa (Thông hiểu)</option>
                          <option value="hard">Khó (Vận dụng)</option>
                        </select>
                      </div>
                    </div>

                    {/* Specific Editor: single_choice Options */}
                    {q.interactionType === 'single_choice' && (
                      <div className="p-3 bg-sky-50/60 rounded-xl border border-sky-100 space-y-2">
                        <div className="text-xs font-black text-sky-800 uppercase tracking-wider">
                          Các lựa chọn trắc nghiệm (Chọn 1 đáp án đúng):
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {[0, 1, 2, 3].map((optIdx) => (
                            <div key={optIdx}>
                              <input
                                type="text"
                                value={(q.options && q.options[optIdx]) || ''}
                                onChange={(e) => handleUpdateOption(idx, optIdx, e.target.value)}
                                placeholder={`Lựa chọn ${String.fromCharCode(65 + optIdx)}`}
                                className="w-full h-8 px-2.5 rounded-lg border border-sky-200 bg-white text-xs font-bold text-slate-800"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Specific Editor: expression_match Pairs */}
                    {q.interactionType === 'expression_match' && (
                      <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-indigo-800 uppercase tracking-wider flex items-center gap-1">
                            <LinkIcon className="w-3.5 h-3.5" /> Các cặp thẻ ghép nối tương ứng:
                          </span>
                          <button
                            type="button"
                            onClick={() => handleAddPair(idx)}
                            className="px-2 py-0.5 rounded-lg bg-indigo-600 text-white text-[11px] font-extrabold cursor-pointer"
                          >
                            + Thêm cặp
                          </button>
                        </div>

                        <div className="space-y-1.5">
                          {(q.pairs || []).map((pair, pIdx) => (
                            <div key={pIdx} className="flex items-center gap-2">
                              <input
                                type="text"
                                value={pair.left}
                                onChange={(e) => handleUpdatePair(idx, pIdx, 'left', e.target.value)}
                                placeholder="Thẻ trái (Cột A)"
                                className="flex-1 h-8 px-2.5 rounded-lg border border-indigo-200 bg-white text-xs font-bold text-slate-800"
                              />
                              <span className="text-indigo-400 font-black">➔</span>
                              <input
                                type="text"
                                value={pair.right}
                                onChange={(e) => handleUpdatePair(idx, pIdx, 'right', e.target.value)}
                                placeholder="Thẻ phải (Cột B)"
                                className="flex-1 h-8 px-2.5 rounded-lg border border-indigo-200 bg-white text-xs font-bold text-slate-800"
                              />
                              <button
                                type="button"
                                onClick={() => handleDeletePair(idx, pIdx)}
                                className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Visual Config & Diagnostic Rule Hint */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1 flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5 text-sky-600" /> Cấu hình mô hình trực quan (Visual)
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <select
                            value={q.visualConfig?.type || 'counters'}
                            onChange={(e) => {
                              const newV = { ...(q.visualConfig || {}), type: e.target.value as any };
                              handleUpdateQuestion(idx, 'visualConfig', newV);
                            }}
                            className="w-full h-8 px-2 rounded-lg border border-slate-200 text-xs font-bold bg-white"
                          >
                            <option value="counters">Đếm đồ vật đơn</option>
                            <option value="comparison">So sánh 2 nhóm</option>
                            <option value="ten_frame">Khung 10 ô</option>
                            <option value="number_line">Trục số</option>
                            <option value="word_story">Bài toán lời văn</option>
                          </select>

                          <input
                            type="text"
                            value={q.visualConfig?.iconName || 'star'}
                            onChange={(e) => {
                              const newV = { ...(q.visualConfig || {}), iconName: e.target.value as any };
                              handleUpdateQuestion(idx, 'visualConfig', newV);
                            }}
                            placeholder="Biểu tượng: star, apple, carrot..."
                            className="w-full h-8 px-2.5 rounded-lg border border-slate-200 text-xs font-semibold"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1 flex items-center gap-1">
                          <Lightbulb className="w-3.5 h-3.5 text-amber-500" /> Mẫu lỗi chẩn đoán & Gợi ý Thám Tử
                        </label>
                        <select
                          value={q.ruleHints?.[0]?.pattern || 'GENERAL_CALCULATION_ERROR'}
                          onChange={(e) => {
                            const pattern = e.target.value as MathErrorPattern;
                            const currentHint = q.ruleHints?.[0]?.hintText || 'Hãy kiểm tra lại từng bước tính.';
                            handleUpdateQuestion(idx, 'ruleHints', [{ pattern, hintText: currentHint }]);
                          }}
                          className="w-full h-8 px-2 rounded-lg border border-slate-200 text-xs font-bold bg-white"
                        >
                          {ERROR_PATTERNS.map((p) => (
                            <option key={p.value} value={p.value}>{p.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Explanation */}
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">
                        Lời giải thích chi tiết & Hướng dẫn tự sửa lỗi
                      </label>
                      <input
                        type="text"
                        value={q.explanation || ''}
                        onChange={(e) => handleUpdateQuestion(idx, 'explanation', e.target.value)}
                        placeholder="Giải thích từng bước cho học sinh và giáo viên..."
                        className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs font-medium text-slate-700"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
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
              disabled={isSaving || Boolean(versionLoadError) || questions.length === 0}
              onClick={() => handleSave(false)}
              className="px-5 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 disabled:opacity-50 text-slate-800 font-bold text-sm flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Save className="w-4 h-4" /> Lưu bản nháp (v{lesson?.currentVersion || 1})
            </button>

            <button
              type="button"
              disabled={isSaving || Boolean(versionLoadError) || questions.length === 0}
              onClick={() => handleSave(true)}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 text-white font-black text-sm flex items-center gap-2 cursor-pointer shadow-md transition-all active:scale-95"
            >
              <Send className="w-4 h-4" /> Duyệt & Xuất bản {isEditing ? `(v${(lesson?.currentVersion || 1) + 1})` : '(v1)'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
