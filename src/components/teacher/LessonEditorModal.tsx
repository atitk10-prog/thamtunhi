import React, { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  Save,
  Send,
  X,
  AlertCircle,
  Layers,
  Link as LinkIcon,
  Eye,
  Lightbulb,
  CheckCircle2,
  AlertTriangle,
  Play,
} from 'lucide-react';
import { dataService } from '../../lib/dataService';
import { Lesson, LessonVersion, Question, InteractionType, MathErrorPattern, VisualAssetConfig } from '../../types';

interface LessonEditorModalProps {
  isOpen: boolean;
  lesson?: Lesson | null;
  lessonVersion?: LessonVersion | null;
  onClose: () => void;
  onSaved: () => void;
  teacherId: string;
  onPreviewLesson?: (lessonVersion: LessonVersion) => void;
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
  onPreviewLesson,
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

  // Delete confirmation modal state
  const [deleteConfirmIdx, setDeleteConfirmIdx] = useState<number | null>(null);

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
        // Failed to load lesson version from server - Strictly DO NOT fallback to mock questions
        setQuestions([]);
        setVersionLoadError('Không thể tải dữ liệu câu hỏi của bài học này từ cơ sở dữ liệu. Để bảo vệ an toàn kho học liệu, các thao tác Lưu nháp và Xuất bản đã bị khóa.');
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
          acceptableAnswers: ['5', 'năm', '5 quả'],
          explanation: '3 + 2 = 5 quả táo.',
          skillTag: 'Cộng phạm vi 10',
          difficulty: 'easy',
          visualConfig: {
            type: 'counters',
            count: 5,
            iconName: 'apple',
          },
          ruleHints: [
            {
              pattern: 'COUNTING_OFF_BY_ONE',
              hintText: 'Đếm lại từng quả táo: 1, 2, 3, 4, 5.',
              visualActionGuidance: 'Chạm vào từng quả táo để đếm.',
            },
          ],
        },
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
      acceptableAnswers: ['10'],
      explanation: 'Giải thích chi tiết các bước tính.',
      skillTag: topic || 'Kỹ năng toán học',
      difficulty: 'medium',
      ruleHints: [
        { pattern: 'GENERAL_CALCULATION_ERROR', hintText: 'Hãy quan sát kỹ và kiểm tra lại từng bước tính.' },
      ],
    };
    setQuestions([...questions, newQ]);
  };

  // Confirm delete question
  const handleConfirmDelete = () => {
    if (deleteConfirmIdx === null) return;
    if (questions.length <= 1) {
      setErrorMsg('Bài học cần có ít nhất 1 câu hỏi.');
      setDeleteConfirmIdx(null);
      return;
    }
    const filtered = questions.filter((_, i) => i !== deleteConfirmIdx);
    const reordered = filtered.map((q, i) => ({ ...q, order: i + 1 }));
    setQuestions(reordered);
    setDeleteConfirmIdx(null);
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

  // Options helpers (for single_choice, operator_pick)
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
    updated[qIdx].expectedAnswer = 'MATCHED_ALL';
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

  // Visual Config helpers
  const handleUpdateVisual = (qIdx: number, updates: Partial<VisualAssetConfig>) => {
    const updated = [...questions];
    const currentV = updated[qIdx].visualConfig || { type: 'counters' };
    updated[qIdx].visualConfig = { ...currentV, ...updates };
    setQuestions(updated);
  };

  // Construct current version doc in memory (for preview or saving)
  const buildCurrentVersionDoc = (publish: boolean): { lessonDoc: Lesson; versionDoc: LessonVersion } => {
    const lessonId = lesson?.id || `lesson-custom-${Date.now()}`;
    const nextVersionNumber = isEditing
      ? (publish ? (lesson?.currentVersion || 1) + 1 : lesson?.currentVersion || 1)
      : 1;

    const versionId = publish
      ? `version-${lessonId}-v${nextVersionNumber}`
      : `version-${lessonId}-v${nextVersionNumber}-draft`;

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

    const lessonDoc: Lesson = {
      id: lessonId,
      title,
      grade,
      topic,
      learningStandard,
      description,
      durationMinutes,
      totalQuestions: questions.length,
      status: publish ? 'published' : (lesson?.status || 'draft'),
      currentVersion: publish ? nextVersionNumber : (lesson?.currentVersion || 1),
      currentVersionId: publish ? versionId : (lesson?.currentVersionId || versionId),
      draftVersionId: publish ? undefined : versionId,
      createdBy: lesson?.createdBy || teacherId,
      createdAt: lesson?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dataOrigin: 'real',
      environmentTag: 'production',
    };

    return { lessonDoc, versionDoc };
  };

  // Handle Preview inside MissionPlayer without saving
  const handlePreview = () => {
    if (questions.length === 0) {
      setErrorMsg('Cần ít nhất 1 câu hỏi để xem trước.');
      return;
    }
    const { versionDoc } = buildCurrentVersionDoc(false);
    if (onPreviewLesson) {
      onPreviewLesson(versionDoc);
    }
  };

  // Save logic (Draft or Publish)
  const handleSave = async (publish: boolean) => {
    setErrorMsg(null);

    if (versionLoadError) {
      setErrorMsg('Dữ liệu bài học chưa được tải thành công. Thao tác lưu bị chặn để bảo vệ dữ liệu hiện có.');
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

    // Validation
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.prompt.trim()) {
        setErrorMsg(`Câu hỏi số ${i + 1} chưa có nội dung câu hỏi.`);
        return;
      }
      if (!q.expectedAnswer.trim()) {
        setErrorMsg(`Câu hỏi số ${i + 1} chưa có đáp án chuẩn.`);
        return;
      }
      if (q.interactionType === 'expression_match' && (!q.pairs || q.pairs.length < 2)) {
        setErrorMsg(`Câu hỏi số ${i + 1} (ghép nối) cần ít nhất 2 cặp thẻ.`);
        return;
      }
    }

    setIsSaving(true);
    try {
      const { lessonDoc, versionDoc } = buildCurrentVersionDoc(publish);
      await dataService.saveLessonVersion(lessonDoc, versionDoc);
      onSaved();
      onClose();
    } catch (err: any) {
      console.error('Save lesson error:', err);
      setErrorMsg(err?.message || 'Lỗi lưu trữ dữ liệu bài học. Vui lòng thử lại.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-5xl bg-white rounded-3xl border-3 border-sky-300 shadow-2xl p-5 sm:p-7 flex flex-col max-h-[94vh] overflow-hidden relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-lg bg-sky-100 text-sky-800">
                {isEditing ? `Phiên bản hiện tại: v${lesson?.currentVersion || 1}` : 'Soạn bài mới'}
              </span>
              {lesson?.status === 'published' && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-800">
                  Đang phát hành
                </span>
              )}
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-800 mt-1">
              {isEditing ? `Biên Tập: ${lesson?.title}` : 'Tạo Bài Học Toán Mới'}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {onPreviewLesson && (
              <button
                type="button"
                onClick={handlePreview}
                disabled={Boolean(versionLoadError) || questions.length === 0}
                className="px-3.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-40 transition-colors"
                title="Xem trước bài này dưới góc nhìn học sinh"
              >
                <Play className="w-3.5 h-3.5 text-amber-600 fill-amber-600" /> Xem trước
              </button>
            )}

            <button
              type="button"
              aria-label="Đóng cửa sổ biên tập"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-5 pr-2">
          {/* Version Load Error Warning */}
          {versionLoadError && (
            <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-900 text-sm font-bold flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-rose-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-black text-rose-700 uppercase tracking-wide text-xs mb-0.5">
                  Khóa Bảo Toàn Học Liệu Tự Động
                </div>
                <span>{versionLoadError}</span>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-800 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Lesson Metadata Form */}
          <div className="p-4 sm:p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="sm:col-span-2">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1">
                  Tiêu đề bài học *
                </label>
                <input
                  type="text"
                  id="lesson-editor-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ví dụ: Phép cộng có nhớ trong phạm vi 20"
                  className="w-full h-10 px-3.5 rounded-xl border-2 border-slate-200 bg-white font-bold text-slate-800 focus:border-sky-500 focus:outline-hidden text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1">
                  Khối Lớp *
                </label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(Number(e.target.value) as 1 | 2)}
                  className="w-full h-10 px-3.5 rounded-xl border-2 border-slate-200 bg-white font-bold text-slate-800 focus:border-sky-500 focus:outline-hidden text-sm"
                >
                  <option value={1}>Toán Lớp 1 (GDPT 2018)</option>
                  <option value={2}>Toán Lớp 2 (GDPT 2018)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1">
                  Chủ đề GDPT 2018 *
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Ví dụ: Số và Phép tính, Hình học, Đo lường..."
                  className="w-full h-10 px-3.5 rounded-xl border-2 border-slate-200 bg-white font-bold text-slate-800 focus:border-sky-500 focus:outline-hidden text-sm"
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
                  className="w-full h-10 px-3.5 rounded-xl border-2 border-slate-200 bg-white font-bold text-slate-800 focus:border-sky-500 focus:outline-hidden text-sm"
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
                className="w-full p-2.5 rounded-xl border-2 border-slate-200 bg-white font-medium text-slate-800 focus:border-sky-500 focus:outline-hidden text-xs"
              />
            </div>
          </div>

          {/* Questions Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-base sm:text-lg font-black text-slate-800 flex items-center gap-2">
                <Layers className="w-5 h-5 text-sky-600" />
                Danh sách câu hỏi ({questions.length} câu)
              </h4>

              <button
                type="button"
                onClick={handleAddQuestion}
                disabled={Boolean(versionLoadError)}
                className="px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-extrabold flex items-center gap-1.5 border border-sky-200 cursor-pointer disabled:opacity-40 transition-colors"
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
                    id={`question-card-${idx}`}
                    className="p-4 sm:p-5 rounded-2xl bg-white border-2 border-slate-200 hover:border-sky-300 shadow-xs space-y-3 transition-colors"
                  >
                    {/* Question Item Header & Reordering Controls */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-sky-600 text-white shadow-xs">
                          Câu {idx + 1}
                        </span>
                        <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md uppercase tracking-wider">
                          [{q.interactionType}]
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleMoveQuestion(idx, 'up')}
                          disabled={idx === 0}
                          title="Di chuyển lên"
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 disabled:opacity-20 cursor-pointer"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveQuestion(idx, 'down')}
                          disabled={idx === questions.length - 1}
                          title="Di chuyển xuống"
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 disabled:opacity-20 cursor-pointer"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCloneQuestion(idx)}
                          title="Nhân bản câu này"
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 cursor-pointer"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmIdx(idx)}
                          title="Xóa câu hỏi (Có xác nhận)"
                          className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500 cursor-pointer ml-1"
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
                        placeholder="Nhập nội dung đề bài tiếng Việt..."
                        className="w-full p-2.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-800 focus:border-sky-500 focus:outline-hidden"
                      />
                    </div>

                    {/* Meta row: InteractionType, ExpectedAnswer, SkillTag, Difficulty */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">
                          Dạng tương tác trực quan
                        </label>
                        <select
                          value={q.interactionType}
                          onChange={(e) => {
                            const newType = e.target.value as InteractionType;
                            handleUpdateQuestion(idx, 'interactionType', newType);
                            if (newType === 'expression_match') {
                              handleUpdateQuestion(idx, 'expectedAnswer', 'MATCHED_ALL');
                            }
                          }}
                          className="w-full h-9 px-2 rounded-lg border border-slate-200 text-xs font-bold bg-white"
                        >
                          <option value="single_choice">1. Chọn 1 đáp án trắc nghiệm</option>
                          <option value="number_input">2. Nhập số trực tiếp</option>
                          <option value="operator_pick">3. Chọn dấu phép tính / so sánh</option>
                          <option value="expression_match">4. Ghép nối cặp thẻ</option>
                          <option value="ten_frame_bundle">5. Khung 10 ô / Bó que tính</option>
                          <option value="number_line_order">6. Trục số / Thứ tự số</option>
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

                    {/* 1. Editor Form: single_choice */}
                    {q.interactionType === 'single_choice' && (
                      <div className="p-3 bg-sky-50/70 rounded-xl border border-sky-200 space-y-2">
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

                    {/* 2. Editor Form: number_input */}
                    {q.interactionType === 'number_input' && (
                      <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-1">
                        <label className="block text-xs font-black text-emerald-800 uppercase tracking-wider">
                          Các dạng đáp án hợp lệ tương đương (phân cách bằng dấu phẩy):
                        </label>
                        <input
                          type="text"
                          value={(q.acceptableAnswers || []).join(', ')}
                          onChange={(e) => {
                            const list = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                            handleUpdateQuestion(idx, 'acceptableAnswers', list);
                          }}
                          placeholder="Ví dụ: 3, ba, 3 con"
                          className="w-full h-8 px-2.5 rounded-lg border border-emerald-300 bg-white text-xs font-bold text-slate-800"
                        />
                      </div>
                    )}

                    {/* 3. Editor Form: operator_pick */}
                    {q.interactionType === 'operator_pick' && (
                      <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200 space-y-2">
                        <div className="text-xs font-black text-amber-800 uppercase tracking-wider">
                          Các phím dấu lựa chọn (Click để chọn nhanh đáp án):
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          {['>', '<', '=', '+', '-'].map((op) => (
                            <button
                              key={op}
                              type="button"
                              onClick={() => handleUpdateQuestion(idx, 'expectedAnswer', op)}
                              className={`w-9 h-9 rounded-xl font-black text-sm border-2 cursor-pointer transition-all ${
                                q.expectedAnswer === op
                                  ? 'bg-amber-400 border-amber-600 text-slate-900 shadow-sm scale-105'
                                  : 'bg-white border-amber-200 text-slate-700 hover:bg-amber-100'
                              }`}
                            >
                              {op}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 4. Editor Form: expression_match */}
                    {q.interactionType === 'expression_match' && (
                      <div className="p-3 bg-indigo-50/70 rounded-xl border border-indigo-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-indigo-800 uppercase tracking-wider flex items-center gap-1">
                            <LinkIcon className="w-3.5 h-3.5" /> Các cặp thẻ ghép nối tương ứng:
                          </span>
                          <button
                            type="button"
                            onClick={() => handleAddPair(idx)}
                            className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-extrabold cursor-pointer"
                          >
                            + Thêm cặp thẻ
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

                    {/* 5. Editor Form: ten_frame_bundle */}
                    {q.interactionType === 'ten_frame_bundle' && (
                      <div className="p-3 bg-teal-50/70 rounded-xl border border-teal-200 space-y-2">
                        <div className="text-xs font-black text-teal-800 uppercase tracking-wider">
                          Cấu hình mô hình Khung 10 ô / Que tính:
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600">Kiểu mô hình</label>
                            <select
                              value={q.visualConfig?.type === 'bundles' ? 'bundles' : 'ten_frame'}
                              onChange={(e) => handleUpdateVisual(idx, { type: e.target.value as any })}
                              className="w-full h-8 px-2 rounded-lg border border-teal-200 bg-white text-xs font-bold"
                            >
                              <option value="ten_frame">Khung 10 ô (Ten-Frame)</option>
                              <option value="bundles">Bó que tính chục - đơn vị</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600">Số bó chục (tens)</label>
                            <input
                              type="number"
                              value={q.visualConfig?.tens ?? 0}
                              onChange={(e) => handleUpdateVisual(idx, { tens: Number(e.target.value) })}
                              className="w-full h-8 px-2 rounded-lg border border-teal-200 bg-white text-xs font-bold"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600">Số que lẻ (ones)</label>
                            <input
                              type="number"
                              value={q.visualConfig?.ones ?? 0}
                              onChange={(e) => handleUpdateVisual(idx, { ones: Number(e.target.value) })}
                              className="w-full h-8 px-2 rounded-lg border border-teal-200 bg-white text-xs font-bold"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600">Tổng chấm / que (count)</label>
                            <input
                              type="number"
                              value={q.visualConfig?.count ?? 10}
                              onChange={(e) => handleUpdateVisual(idx, { count: Number(e.target.value) })}
                              className="w-full h-8 px-2 rounded-lg border border-teal-200 bg-white text-xs font-bold"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 6. Editor Form: number_line_order */}
                    {q.interactionType === 'number_line_order' && (
                      <div className="p-3 bg-purple-50/70 rounded-xl border border-purple-200 space-y-2">
                        <div className="text-xs font-black text-purple-800 uppercase tracking-wider">
                          Cấu hình Trục số & Thứ tự số:
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600">Mốc nhỏ nhất (min)</label>
                            <input
                              type="number"
                              value={q.visualConfig?.min ?? 0}
                              onChange={(e) => handleUpdateVisual(idx, { min: Number(e.target.value), type: 'number_line' })}
                              className="w-full h-8 px-2 rounded-lg border border-purple-200 bg-white text-xs font-bold"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600">Mốc lớn nhất (max)</label>
                            <input
                              type="number"
                              value={q.visualConfig?.max ?? 10}
                              onChange={(e) => handleUpdateVisual(idx, { max: Number(e.target.value), type: 'number_line' })}
                              className="w-full h-8 px-2 rounded-lg border border-purple-200 bg-white text-xs font-bold"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600">Số đích / mốc nhảy</label>
                            <input
                              type="number"
                              value={q.visualConfig?.target ?? 0}
                              onChange={(e) => handleUpdateVisual(idx, { target: Number(e.target.value), type: 'number_line' })}
                              className="w-full h-8 px-2 rounded-lg border border-purple-200 bg-white text-xs font-bold"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600">Các thẻ xếp thứ tự</label>
                            <input
                              type="text"
                              value={(q.options || []).join(', ')}
                              onChange={(e) => {
                                const list = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                                handleUpdateQuestion(idx, 'options', list);
                              }}
                              placeholder="Ví dụ: 6, 10, 8, 7"
                              className="w-full h-8 px-2 rounded-lg border border-purple-200 bg-white text-xs font-bold"
                            />
                          </div>
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
                            onChange={(e) => handleUpdateVisual(idx, { type: e.target.value as any })}
                            className="w-full h-8 px-2 rounded-lg border border-slate-200 text-xs font-bold bg-white"
                          >
                            <option value="counters">Đếm đồ vật đơn</option>
                            <option value="comparison">So sánh 2 nhóm</option>
                            <option value="ten_frame">Khung 10 ô</option>
                            <option value="bundles">Bó que tính</option>
                            <option value="number_line">Trục số</option>
                            <option value="word_story">Bài toán lời văn</option>
                          </select>

                          <select
                            value={q.visualConfig?.iconName || 'star'}
                            onChange={(e) => handleUpdateVisual(idx, { iconName: e.target.value })}
                            className="w-full h-8 px-2 rounded-lg border border-slate-200 text-xs font-bold bg-white"
                          >
                            <option value="star">⭐ Ngôi sao (star)</option>
                            <option value="apple">🍎 Quả táo (apple)</option>
                            <option value="candy">🍬 Kẹo ngọt (candy)</option>
                            <option value="fish">🐟 Chú cá (fish)</option>
                            <option value="pencil">✏️ Bút chì (pencil)</option>
                            <option value="block">🧱 Khối vuông (block)</option>
                          </select>
                        </div>

                        {q.visualConfig?.type === 'comparison' && (
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            <input
                              type="number"
                              value={q.visualConfig.leftCount ?? 0}
                              onChange={(e) => handleUpdateVisual(idx, { leftCount: Number(e.target.value) })}
                              placeholder="Số lượng Trái"
                              className="h-7 px-2 rounded-lg border border-slate-200 text-xs font-bold"
                            />
                            <input
                              type="number"
                              value={q.visualConfig.rightCount ?? 0}
                              onChange={(e) => handleUpdateVisual(idx, { rightCount: Number(e.target.value) })}
                              placeholder="Số lượng Phải"
                              className="h-7 px-2 rounded-lg border border-slate-200 text-xs font-bold"
                            />
                          </div>
                        )}

                        {q.visualConfig?.type === 'word_story' && (
                          <div className="mt-2">
                            <input
                              type="text"
                              value={q.visualConfig.storyText || ''}
                              onChange={(e) => handleUpdateVisual(idx, { storyText: e.target.value })}
                              placeholder="Văn bản tóm tắt tình huống trực quan..."
                              className="w-full h-7 px-2 rounded-lg border border-slate-200 text-xs font-semibold"
                            />
                          </div>
                        )}
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
                          className="w-full h-8 px-2 rounded-lg border border-slate-200 text-xs font-bold bg-white mb-2"
                        >
                          {ERROR_PATTERNS.map((p) => (
                            <option key={p.value} value={p.value}>{p.label}</option>
                          ))}
                        </select>

                        <input
                          type="text"
                          value={q.ruleHints?.[0]?.hintText || ''}
                          onChange={(e) => {
                            const currentPattern = q.ruleHints?.[0]?.pattern || 'GENERAL_CALCULATION_ERROR';
                            handleUpdateQuestion(idx, 'ruleHints', [{ pattern: currentPattern, hintText: e.target.value }]);
                          }}
                          placeholder="Lời gợi ý thân thiện khi học sinh chọn sai..."
                          className="w-full h-7 px-2 rounded-lg border border-slate-200 text-xs font-medium"
                        />
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
            className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm cursor-pointer transition-colors"
          >
            Đóng
          </button>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              disabled={isSaving || Boolean(versionLoadError) || questions.length === 0}
              onClick={() => handleSave(false)}
              className="px-4 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 disabled:opacity-40 text-slate-800 font-bold text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Lưu lại nháp câu hỏi mà không phát hành bản mới"
            >
              <Save className="w-4 h-4" /> Lưu bản nháp (v{lesson?.currentVersion || 1})
            </button>

            <button
              type="button"
              disabled={isSaving || Boolean(versionLoadError) || questions.length === 0}
              onClick={() => handleSave(true)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:opacity-40 text-white font-black text-xs sm:text-sm flex items-center gap-2 cursor-pointer shadow-md transition-all active:scale-95"
              title="Xuất bản snapshot bất biến mới cho toàn trường"
            >
              <Send className="w-4 h-4" /> Duyệt & Xuất bản {isEditing ? `(v${(lesson?.currentVersion || 1) + 1})` : '(v1)'}
            </button>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {deleteConfirmIdx !== null && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
            <div className="w-full max-w-md bg-white rounded-3xl p-6 border-3 border-rose-300 shadow-2xl space-y-4">
              <div className="flex items-center gap-3 text-rose-600">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-6 h-6 text-rose-600" />
                </div>
                <div>
                  <h4 className="text-base font-black text-slate-800">
                    Xác nhận xóa câu hỏi số {deleteConfirmIdx + 1}
                  </h4>
                  <p className="text-xs font-semibold text-slate-500">
                    Thao tác này sẽ xóa câu hỏi và tự động cập nhật lại thứ tự các câu còn lại.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 max-h-24 overflow-y-auto">
                &ldquo;{questions[deleteConfirmIdx]?.prompt || 'Nội dung câu hỏi...'}&rdquo;
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmIdx(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black cursor-pointer shadow-sm"
                >
                  Xác nhận xóa
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
