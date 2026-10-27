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
  Image as ImageIcon,
  Crop,
  CheckSquare,
  Square,
  Sliders,
  Sparkles,
  FolderOpen,
  Info,
  Volume2,
} from 'lucide-react';
import { dataService } from '../../lib/dataService';
import { Lesson, LessonVersion, Question, InteractionType, MathErrorPattern, VisualAssetConfig, MediaItem } from '../../types';
import { VisualCounters } from '../activities/VisualCounters';
import { MediaLibraryModal } from './MediaLibraryModal';
import { AiDraftModal, AiDraftMeta } from './AiDraftModal';
import { normalizeAssetUrl, getAssetCountUnit } from '../../lib/standardAssets';
import { isGrade1Weeks1To9, normalizeMathTextForSpeech, getAudioHash, getQuestionSpokenText, getHintSpokenText } from '../../lib/vietnameseTts';
import { playVietnameseAudio, stopVietnameseAudio } from '../../lib/vietnameseAudioPlayer';
import { QuestionAudioControl } from './QuestionAudioControl';

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

  // Media Library target question index for illustration assignment
  const [mediaLibraryTargetQIdx, setMediaLibraryTargetQIdx] = useState<number | null>(null);

  // AI Draft Modal state inside editor
  const [isAiDraftOpen, setIsAiDraftOpen] = useState(false);
  // Dedicated state for AI-created new lesson draft (preserving current published lesson)
  const [overrideLessonId, setOverrideLessonId] = useState<string | null>(null);
  const [isNewAiLesson, setIsNewAiLesson] = useState<boolean>(false);

  // Live student preview toggles per question
  const [previewOpenIdxs, setPreviewOpenIdxs] = useState<Record<number, boolean>>({});

  const togglePreview = (qIdx: number) => {
    setPreviewOpenIdxs((prev) => ({ ...prev, [qIdx]: !(prev[qIdx] ?? true) }));
  };

  // Scope check: Audio playback only for Grade 1 Weeks 1-9
  const isGrade1Scope = grade === 1 && isGrade1Weeks1To9({ grade: 1, title: topic });
  const [playingEditorAudioId, setPlayingEditorAudioId] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      stopVietnameseAudio();
      setPlayingEditorAudioId(null);
    };
  }, [isOpen]);

  const handleSafeClose = () => {
    stopVietnameseAudio();
    setPlayingEditorAudioId(null);
    onClose();
  };

  // Synchronize state whenever modal opens or lesson/lessonVersion changes
  useEffect(() => {
    if (!isOpen) return;

    setOverrideLessonId(null);
    setIsNewAiLesson(false);

    // 1. If lessonVersion has questions (from draft, AI, or published version), ALWAYS preserve all questions
    if (lessonVersion && Array.isArray(lessonVersion.questions) && lessonVersion.questions.length > 0) {
      setTitle(lessonVersion.title || lesson?.title || '');
      setGrade((lessonVersion.grade || lesson?.grade || 1) as 1 | 2);
      setTopic(lessonVersion.topic || lesson?.topic || '');
      setLearningStandard(lessonVersion.learningStandard || lesson?.learningStandard || '');
      setDescription(lesson?.description || '');
      setDurationMinutes(lesson?.durationMinutes || 20);
      setQuestions(JSON.parse(JSON.stringify(lessonVersion.questions)));
      setVersionLoadError(null);
      setErrorMsg(null);
    } else if (lesson) {
      setTitle(lesson.title || '');
      setGrade((lesson.grade as 1 | 2) || 1);
      setTopic(lesson.topic || '');
      setLearningStandard(lesson.learningStandard || '');
      setDescription(lesson.description || '');
      setDurationMinutes(lesson.durationMinutes || 20);

      if (lessonVersion === null) {
        // Failed to load lesson version from server - Strictly DO NOT fallback to mock questions
        setQuestions([]);
        setVersionLoadError('Không thể tải dữ liệu câu hỏi của bài học này từ cơ sở dữ liệu. Để bảo vệ an toàn kho học liệu, các thao tác Lưu nháp và Xuất bản đã bị khóa.');
      } else {
        setQuestions([]);
        setVersionLoadError(null);
        setErrorMsg(null);
      }
    } else {
      // Brand new lesson creation mode from scratch
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

  const handleToggleQuestionAudio = (q: Question, idx: number) => {
    const key = `q-${idx}`;
    if (playingEditorAudioId === key) {
      stopVietnameseAudio();
      setPlayingEditorAudioId(null);
      return;
    }
    stopVietnameseAudio();

    const spoken = getQuestionSpokenText(q);
    const hash = getAudioHash(spoken);
    const url = q.audioUrl || `/audio/q_${hash}.mp3?text=${encodeURIComponent(spoken)}`;

    setPlayingEditorAudioId(key);
    playVietnameseAudio(
      url,
      undefined,
      () => setPlayingEditorAudioId(key),
      () => setPlayingEditorAudioId(null),
      () => setPlayingEditorAudioId(null)
    );
  };

  const handleToggleHintAudio = (q: Question, idx: number) => {
    const key = `h-${idx}`;
    if (playingEditorAudioId === key) {
      stopVietnameseAudio();
      setPlayingEditorAudioId(null);
      return;
    }
    stopVietnameseAudio();

    const spoken = getHintSpokenText(q);
    const hash = getAudioHash(spoken);
    const url = q.hintAudioUrl || `/audio/h_${hash}.mp3?text=${encodeURIComponent(spoken)}`;

    setPlayingEditorAudioId(key);
    playVietnameseAudio(
      url,
      undefined,
      () => setPlayingEditorAudioId(key),
      () => setPlayingEditorAudioId(null),
      () => setPlayingEditorAudioId(null)
    );
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

  // Visual Config helpers with strict capacity & grid consistency enforcement (P0)
  const handleUpdateVisual = (qIdx: number, updates: Partial<VisualAssetConfig>) => {
    const updated = [...questions];
    const currentV = updated[qIdx].visualConfig || { type: 'counters' };
    const merged: VisualAssetConfig = { ...currentV, ...updates };

    // Enforce 5-frame capacity (max 5 dots) and 10-frame capacity (max 10 dots)
    if (merged.type === 'five_frame' || merged.gridSize === 5) {
      merged.gridSize = 5;
      if (merged.count !== undefined && merged.count > 5) {
        merged.count = 5;
      }
      merged.tens = 0;
      merged.ones = merged.count;
    } else if (merged.type === 'ten_frame') {
      const gSize = merged.gridSize === 5 ? 5 : 10;
      merged.gridSize = gSize;
      if (merged.count !== undefined && merged.count > gSize) {
        merged.count = gSize;
      }
      merged.tens = 0;
      merged.ones = merged.count;
    }

    updated[qIdx].visualConfig = merged;
    setQuestions(updated);
  };

  // Construct current version doc in memory (for preview or saving)
  const buildCurrentVersionDoc = (publish: boolean): { lessonDoc: Lesson; versionDoc: LessonVersion } => {
    const effectiveIsEditing = isNewAiLesson ? false : isEditing;
    const lessonId = isNewAiLesson
      ? (overrideLessonId || `lesson-ai-${Date.now()}`)
      : (lesson?.id || `lesson-custom-${Date.now()}`);

    const nextVersionNumber = effectiveIsEditing
      ? (publish ? (lesson?.currentVersion || 1) + 1 : lesson?.currentVersion || 1)
      : 1;

    const versionId = isNewAiLesson
      ? (publish ? `version-${lessonId}-v1` : `version-${lessonId}-v1-draft`)
      : (publish
          ? `version-${lessonId}-v${nextVersionNumber}`
          : (lesson?.draftVersionId || `version-${lessonId}-v${nextVersionNumber}-draft`));

    let finalQuestions = questions;
    if (grade === 1 && isGrade1Weeks1To9({ grade: 1, title: topic })) {
      finalQuestions = questions.map((q) => {
        const spokenPrompt = getQuestionSpokenText(q);
        const pHash = getAudioHash(spokenPrompt);
        const spokenHint = getHintSpokenText(q);
        const hHash = spokenHint ? getAudioHash(spokenHint) : undefined;

        // Preserve teacher-uploaded, customized, or explicitly deleted audio (NEVER invent fake URLs)
        const effectiveAudioUrl = q.audioUrl ? q.audioUrl.trim() : '';
        const effectiveAudioHash = q.audioUrl ? (q.audioHash || pHash) : '';
        const effectiveHintUrl = q.hintAudioUrl ? q.hintAudioUrl.trim() : '';
        const effectiveHintHash = q.hintAudioUrl ? (q.hintAudioHash || hHash) : '';

        return {
          ...q,
          audioHash: effectiveAudioHash,
          audioUrl: effectiveAudioUrl,
          hintAudioHash: effectiveHintHash,
          hintAudioUrl: effectiveHintUrl,
        };
      });
    }

    const versionDoc: LessonVersion = {
      id: versionId,
      lessonId,
      versionNumber: nextVersionNumber,
      title,
      grade,
      topic,
      learningStandard,
      questions: finalQuestions,
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
      status: publish ? 'published' : 'draft',
      isPublished: publish,
      currentVersion: publish ? nextVersionNumber : (effectiveIsEditing ? (lesson?.currentVersion || 1) : 1),
      currentVersionId: publish ? versionId : (effectiveIsEditing ? (lesson?.currentVersionId || versionId) : versionId),
      draftVersionId: publish ? undefined : versionId,
      createdBy: effectiveIsEditing ? (lesson?.createdBy || teacherId) : teacherId,
      createdAt: effectiveIsEditing ? (lesson?.createdAt || new Date().toISOString()) : new Date().toISOString(),
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
    stopVietnameseAudio();
    setPlayingEditorAudioId(null);
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

    // Validation with type safety (zero-safe nullish coalescing)
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const safePrompt = String(q.prompt ?? '').trim();
      const safeAnswer = String(q.expectedAnswer ?? '').trim();
      if (safePrompt === '') {
        setErrorMsg(`Câu hỏi số ${i + 1} chưa có nội dung câu hỏi.`);
        return;
      }
      if (safeAnswer === '') {
        setErrorMsg(`Câu hỏi số ${i + 1} chưa có đáp án chuẩn.`);
        return;
      }
      if (q.interactionType === 'single_choice') {
        if (!q.options || q.options.length < 2) {
          setErrorMsg(`Câu hỏi số ${i + 1} (trắc nghiệm) cần ít nhất 2 phương án lựa chọn.`);
          return;
        }
        const trimmedOpts = q.options.map((o) => String(o ?? '').trim()).filter((s) => s !== '');
        const uniqueOpts = new Set(trimmedOpts);
        if (uniqueOpts.size < trimmedOpts.length) {
          setErrorMsg(`Câu hỏi số ${i + 1} (trắc nghiệm): Các phương án lựa chọn không được trùng lặp.`);
          return;
        }
        if (!trimmedOpts.includes(safeAnswer)) {
          setErrorMsg(`Câu hỏi số ${i + 1} (trắc nghiệm): Đáp án đúng ("${safeAnswer}") phải nằm trong danh sách các phương án.`);
          return;
        }
      }
      if (q.interactionType === 'expression_match' && (!q.pairs || q.pairs.length < 2)) {
        setErrorMsg(`Câu hỏi số ${i + 1} (ghép nối) cần ít nhất 2 cặp thẻ.`);
        return;
      }

      // Strict Pre-Publish Pedagogical & Consistency Validation (Req A, B, D)
      if (publish) {
        // 0. Grade 1 Weeks 1-9 Audio Completeness, Freshness & Accessibility Check (Requirements 2, 3)
        if (isGrade1Scope) {
          if (!q.audioUrl || !q.audioUrl.trim()) {
            setErrorMsg(`Câu hỏi số ${i + 1} chưa có âm thanh câu hỏi. Với Lớp 1 trong phạm vi, học sinh cần được hỗ trợ nghe, vui lòng bấm "Tạo âm thanh" trước khi xuất bản.`);
            return;
          }
          if (!q.hintAudioUrl || !q.hintAudioUrl.trim()) {
            setErrorMsg(`Câu hỏi số ${i + 1} chưa có âm thanh gợi ý. Với Lớp 1 trong phạm vi, vui lòng bấm "Tạo âm thanh" cho phần gợi ý trước khi xuất bản.`);
            return;
          }

          // Check stale audio (text was edited after audio was created)
          const expectedPromptSpoken = getQuestionSpokenText(q);
          const expectedPromptHash = getAudioHash(expectedPromptSpoken);
          if (q.audioHash && q.audioHash !== expectedPromptHash) {
            setErrorMsg(`Câu hỏi số ${i + 1}: Lời đọc câu hỏi đã bị sửa đổi nhưng chưa được tạo lại âm thanh. Thầy/Cô vui lòng bấm "Tạo lại âm thanh" trước khi xuất bản.`);
            return;
          }

          const expectedHintSpoken = getHintSpokenText(q);
          const expectedHintHash = expectedHintSpoken ? getAudioHash(expectedHintSpoken) : '';
          if (expectedHintHash && q.hintAudioHash && q.hintAudioHash !== expectedHintHash) {
            setErrorMsg(`Câu hỏi số ${i + 1}: Lời đọc gợi ý đã bị sửa đổi nhưng chưa được tạo lại âm thanh. Thầy/Cô vui lòng bấm "Tạo lại âm thanh" trước khi xuất bản.`);
            return;
          }

          // Verify accessibility of audio files
          try {
            const checkPromptRes = await fetch(q.audioUrl, { method: 'HEAD' });
            if (!checkPromptRes.ok) {
              setErrorMsg(`Câu hỏi số ${i + 1}: Tệp âm thanh câu hỏi không truy cập được (Mã lỗi HTTP ${checkPromptRes.status}). Vui lòng tạo lại âm thanh.`);
              return;
            }
          } catch {
            setErrorMsg(`Câu hỏi số ${i + 1}: Không thể kết nối để kiểm tra tệp âm thanh câu hỏi.`);
            return;
          }

          try {
            const checkHintRes = await fetch(q.hintAudioUrl, { method: 'HEAD' });
            if (!checkHintRes.ok) {
              setErrorMsg(`Câu hỏi số ${i + 1}: Tệp âm thanh gợi ý không truy cập được (Mã lỗi HTTP ${checkHintRes.status}). Vui lòng tạo lại âm thanh.`);
              return;
            }
          } catch {
            setErrorMsg(`Câu hỏi số ${i + 1}: Không thể kết nối để kiểm tra tệp âm thanh gợi ý.`);
            return;
          }
        }

        const vc = q.visualConfig;
        const hasAuto = vc && vc.type !== 'none' && vc.type !== 'image' && !vc.imageUrl;
        const numericAnswer = parseInt(safeAnswer, 10);

        // 1. Check visual counter & math match
        if (hasAuto && !isNaN(numericAnswer)) {
          if ((vc.type === 'counters' || vc.type === 'five_frame' || vc.type === 'ten_frame') && vc.count !== undefined) {
            // If the prompt is a counting question or doesn't have an addition formula overriding
            const isAddFormula = safePrompt.includes('+');
            if (!isAddFormula && vc.count !== numericAnswer) {
              setErrorMsg(`Câu hỏi số ${i + 1}: Số lượng hình minh họa (${vc.count}) không khớp với đáp án chuẩn (${safeAnswer}). Vui lòng sửa lại trước khi xuất bản.`);
              return;
            }
          } else if (vc.type === 'addition') {
            const left = vc.leftCount ?? 0;
            const right = vc.rightCount ?? 0;
            const sum = left + right;
            if (sum !== numericAnswer) {
              setErrorMsg(`Câu hỏi số ${i + 1}: Tổng số lượng 2 nhóm hình (${left} + ${right} = ${sum}) không khớp với đáp án chuẩn (${safeAnswer}). Vui lòng sửa lại trước khi xuất bản.`);
              return;
            }
          } else if (vc.type === 'subtraction') {
            const left = vc.leftCount ?? 0;
            const right = vc.rightCount ?? 0;
            const diff = left - right;
            if (diff !== numericAnswer) {
              setErrorMsg(`Câu hỏi số ${i + 1}: Phép tính trừ trong hình (${left} - ${right} = ${diff}) không khớp với đáp án chuẩn (${safeAnswer}). Vui lòng sửa lại trước khi xuất bản.`);
              return;
            }
          }
        }

        // 2. Check frame conflicts
        const isFrame = vc?.type === 'ten_frame' || vc?.type === 'five_frame';
        const isFive = vc?.type === 'five_frame' || vc?.gridSize === 5;
        if (isFrame) {
          if (isFive && safePrompt.toLowerCase().includes('khung 10 ô')) {
            setErrorMsg(`Câu hỏi số ${i + 1}: Đề bài nhắc đến Khung 10 ô nhưng hình minh họa đang cấu hình Khung 5 ô.`);
            return;
          }
          if (!isFive && safePrompt.toLowerCase().includes('khung 5 ô')) {
            setErrorMsg(`Câu hỏi số ${i + 1}: Đề bài nhắc đến Khung 5 ô nhưng hình minh họa đang cấu hình Khung 10 ô.`);
            return;
          }
        }

        // 3. Check caption leaking answer
        if (vc?.caption && safeAnswer && vc.caption.toLowerCase().includes(safeAnswer.toLowerCase())) {
          setErrorMsg(`Câu hỏi số ${i + 1}: Chú thích hình minh họa đang chứa đáp án "${safeAnswer}". Hãy chỉnh sửa chú thích để tránh làm lộ kết quả.`);
          return;
        }

        // 4. Check Grade 1 Range (e.g. Range 1-5)
        const isRange1To5 = topic.toLowerCase().includes('1 2 3 4 5') ||
          topic.toLowerCase().includes('phạm vi 5') ||
          title.toLowerCase().includes('1 2 3 4 5') ||
          title.toLowerCase().includes('phạm vi 5');

        if (isRange1To5) {
          if (!isNaN(numericAnswer) && (numericAnswer < 0 || numericAnswer > 5)) {
            setErrorMsg(`Câu hỏi số ${i + 1}: Đáp án (${safeAnswer}) nằm ngoài phạm vi các số 1–5 của bài học.`);
            return;
          }
          if (q.options && Array.isArray(q.options)) {
            for (const opt of q.options) {
              const optNum = parseInt(String(opt).trim(), 10);
              if (!isNaN(optNum) && (optNum < 0 || optNum > 5)) {
                setErrorMsg(`Câu hỏi số ${i + 1}: Lựa chọn (${opt}) vượt quá phạm vi các số 1–5 của bài học.`);
                return;
              }
            }
          }
          const addMatch = safePrompt.match(/(\d+)\s*\+\s*(\d+)/);
          if (addMatch) {
            const a = parseInt(addMatch[1], 10);
            const b = parseInt(addMatch[2], 10);
            if (a + b > 5 || a > 5 || b > 5) {
              setErrorMsg(`Câu hỏi số ${i + 1}: Phép tính "${addMatch[0]}" vượt quá phạm vi các số 1–5 của bài học.`);
              return;
            }
          }
        }

        // 5. Check Hints: Absolutely NO Answer Leaks (Req B)
        if (q.ruleHints && Array.isArray(q.ruleHints)) {
          for (const h of q.ruleHints) {
            const hText = (h.hintText || '').trim();
            // Check for complete math formulas like 2 + 3 = 5 or 4 + 4 = 8
            if (/\b\d+\s*[\+\-]\s*\d+\s*=\s*\d+\b/.test(hText)) {
              setErrorMsg(`Câu hỏi số ${i + 1}: Manh mối "${hText}" chứa phép tính giải hoàn chỉnh. Hãy chỉ dẫn cách đếm/suy nghĩ, không đưa ra đáp án.`);
              return;
            }
            if (/đáp án là|kết quả là|phép tính là|chọn đáp án/i.test(hText)) {
              setErrorMsg(`Câu hỏi số ${i + 1}: Manh mối có dấu hiệu làm lộ kết quả. Vui lòng chỉnh lại lời hướng dẫn.`);
              return;
            }
          }
        }
      }
    }

    setIsSaving(true);
    try {
      stopVietnameseAudio();
      setPlayingEditorAudioId(null);
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
                {isNewAiLesson
                  ? '✨ Bản nháp mới từ AI'
                  : (isEditing ? `Phiên bản hiện tại: v${lesson?.currentVersion || 1}` : 'Soạn bài mới')}
              </span>
              {!isNewAiLesson && lesson?.status === 'published' && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-800">
                  Đang phát hành
                </span>
              )}
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-800 mt-1">
              {isNewAiLesson
                ? `Bản Nháp Mới: ${title || 'Toán Thám Tử'}`
                : (isEditing ? `Biên Tập: ${lesson?.title}` : 'Tạo Bài Học Toán Mới')}
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
              onClick={handleSafeClose}
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

          {/* AI New Lesson Draft Reassurance Banner */}
          {isNewAiLesson && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border-2 border-emerald-300 text-emerald-900 text-xs font-bold flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>
                  Đang soạn thảo bài học nháp mới tạo từ AI (Mã bài: {overrideLessonId}, chứa đúng {questions.length} câu hỏi). Bài học đã phát hành trước đó được bảo toàn nguyên vẹn.
                </span>
              </div>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900">
                NHÁP
              </span>
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

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAiDraftOpen(true)}
                  disabled={Boolean(versionLoadError)}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white text-xs font-black flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-40 transition-all active:scale-95"
                  title="Nhờ AI Gemini gợi ý soạn thêm câu hỏi theo chủ đề"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" /> AI Soạn Đề
                </button>

                <button
                  type="button"
                  onClick={handleAddQuestion}
                  disabled={Boolean(versionLoadError)}
                  className="px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-extrabold flex items-center gap-1.5 border border-sky-200 cursor-pointer disabled:opacity-40 transition-colors"
                >
                  <Plus className="w-4 h-4" /> Thêm câu hỏi
                </button>
              </div>
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
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-slate-600">
                          Đề bài / Lời dẫn câu hỏi *
                        </label>
                        {isGrade1Scope && (
                          <button
                            type="button"
                            onClick={() => handleToggleQuestionAudio(q, idx)}
                            className={`p-1 px-2 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors border shadow-2xs ${
                              playingEditorAudioId === `q-${idx}`
                                ? 'bg-amber-100 text-amber-800 border-amber-300 ring-1 ring-amber-400 animate-pulse'
                                : 'bg-sky-50 hover:bg-sky-100 text-sky-700 border-sky-200'
                            }`}
                            aria-label="Phát âm thanh câu hỏi"
                            title="Nghe thử câu hỏi"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <textarea
                        rows={2}
                        value={q.prompt}
                        onChange={(e) => handleUpdateQuestion(idx, 'prompt', e.target.value)}
                        placeholder="Nhập nội dung đề bài tiếng Việt..."
                        className="w-full p-2.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-800 focus:border-sky-500 focus:outline-hidden"
                      />

                      {/* Custom Spoken Prompt for Grade 1 */}
                      {/* Full Audio Management for Question Prompt (Req 2) */}
                      {isGrade1Scope && (
                        <div className="mt-2.5">
                          <QuestionAudioControl
                            question={q}
                            questionIndex={idx}
                            type="prompt"
                            isGrade1Scope={isGrade1Scope}
                            onChangeSpokenText={(text) => handleUpdateQuestion(idx, 'customSpokenPrompt', text)}
                            onUpdateAudio={(audioUrl, audioHash) => {
                              const updated = [...questions];
                              updated[idx] = { ...updated[idx], audioUrl, audioHash };
                              setQuestions(updated);
                            }}
                            onDeleteAudio={() => {
                              const updated = [...questions];
                              updated[idx] = { ...updated[idx], audioUrl: '', audioHash: '' };
                              setQuestions(updated);
                            }}
                          />
                        </div>
                      )}
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
                          <option value="ten_frame_bundle">5. Bó que tính / Que rời (Tách gộp số)</option>
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

                    {/* 5. Editor Form: number_line_order options */}
                    {q.interactionType === 'number_line_order' && (
                      <div className="p-3 bg-purple-50/70 rounded-xl border border-purple-200 space-y-2">
                        <div className="text-xs font-black text-purple-800 uppercase tracking-wider">
                          Các thẻ số cần sắp xếp theo thứ tự:
                        </div>
                        <input
                          type="text"
                          value={(q.options || []).join(', ')}
                          onChange={(e) => {
                            const list = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                            handleUpdateQuestion(idx, 'options', list);
                          }}
                          placeholder="Ví dụ: 6, 10, 8, 7"
                          className="w-full h-8 px-2.5 rounded-lg border border-purple-200 bg-white text-xs font-bold"
                        />
                      </div>
                    )}

                    {/* 6. DEDICATED QUESTION ILLUSTRATION SECTION (P0) */}
                    {(() => {
                      const vc = q.visualConfig;
                      const hasImage = vc?.type === 'image' || Boolean(vc?.imageUrl);
                      const hasAuto = vc && vc.type !== 'none' && !hasImage;
                      const currentMode: 'auto' | 'image' | 'none' = hasImage ? 'image' : (hasAuto ? 'auto' : 'none');

                      // Pedagogical check
                      const safeAnswerStr = String(q.expectedAnswer ?? '').trim();
                      const numericAnswer = parseInt(safeAnswerStr, 10);
                      const countWarning =
                        !isNaN(numericAnswer) &&
                        hasAuto &&
                        vc.count !== undefined &&
                        (vc.type === 'counters' || vc.type === 'ten_frame' || vc.type === 'five_frame') &&
                        numericAnswer !== vc.count;

                      const additionWarning =
                        !isNaN(numericAnswer) &&
                        hasAuto &&
                        vc?.type === 'addition' &&
                        vc.leftCount !== undefined &&
                        vc.rightCount !== undefined &&
                        (vc.leftCount + vc.rightCount) !== numericAnswer;

                      const subtractionWarning =
                        !isNaN(numericAnswer) &&
                        hasAuto &&
                        vc?.type === 'subtraction' &&
                        vc.leftCount !== undefined &&
                        vc.rightCount !== undefined &&
                        (vc.leftCount - vc.rightCount) !== numericAnswer;

                      const isFrame = vc?.type === 'ten_frame' || vc?.type === 'five_frame';
                      const isFive = vc?.type === 'five_frame' || vc?.gridSize === 5;

                      const frameConflictWarning =
                        isFrame &&
                        ((isFive && q.prompt.toLowerCase().includes('khung 10 ô')) ||
                          (!isFive && q.prompt.toLowerCase().includes('khung 5 ô')));

                      const captionLeaksAnswer =
                        hasImage &&
                        vc?.caption &&
                        safeAnswerStr !== '' &&
                        vc.caption.toLowerCase().includes(safeAnswerStr.toLowerCase());

                      const isLivePreviewOpen = previewOpenIdxs[idx] ?? true;

                      return (
                        <div className="p-4 bg-gradient-to-br from-slate-50 via-sky-50/30 to-indigo-50/20 rounded-2xl border-2 border-sky-200 shadow-xs space-y-3">
                          {/* Section Header with 3-Mode Selector */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-sky-100">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-sky-600 text-white flex items-center justify-center shadow-xs">
                                <Eye className="w-4 h-4" />
                              </div>
                              <div>
                                <h5 className="text-xs font-black text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                                  Hình Minh Họa Câu Hỏi
                                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-sky-100 text-sky-700 font-bold lowercase">
                                    {currentMode === 'auto' ? 'Mô hình tự động' : currentMode === 'image' ? 'Ảnh thư viện' : 'Không có hình'}
                                  </span>
                                </h5>
                                <p className="text-[11px] text-slate-500 font-medium">
                                  Giáo viên chủ động chọn mô hình hoặc tải ảnh trực quan
                                </p>
                              </div>
                            </div>

                            {/* 3 Mode Pills */}
                            <div className="flex bg-slate-200/80 p-0.5 rounded-xl text-xs font-bold self-start sm:self-auto">
                              <button
                                type="button"
                                onClick={() => {
                                  const pLower = (q.prompt || '').toLowerCase();
                                  let detectedIcon = vc?.iconName;
                                  if (!detectedIcon) {
                                    if (pLower.includes('cà rốt')) detectedIcon = 'carrot';
                                    else if (pLower.includes('cá')) detectedIcon = 'fish';
                                    else if (pLower.includes('sao')) detectedIcon = 'star';
                                    else if (pLower.includes('kẹo')) detectedIcon = 'candy';
                                    else if (pLower.includes('bút')) detectedIcon = 'pencil';
                                    else if (pLower.includes('hoa')) detectedIcon = 'flower';
                                    else if (pLower.includes('chim')) detectedIcon = 'bird';
                                    else if (pLower.includes('thỏ')) detectedIcon = 'rabbit';
                                    else if (pLower.includes('cam')) detectedIcon = 'orange';
                                    else detectedIcon = 'apple';
                                  }

                                  const isQue = pLower.includes('que tính') || pLower.includes('bó que') || q.interactionType === 'ten_frame_bundle';
                                  const isSub = pLower.includes('bớt') || pLower.includes('ăn mất') || pLower.includes('còn lại') || pLower.includes('-');
                                  const isAdd = pLower.includes('thêm') || pLower.includes('tất cả') || pLower.includes('+');

                                  let targetType: any = 'counters';
                                  if (isQue) targetType = 'bundles';
                                  else if (isSub) targetType = 'subtraction';
                                  else if (isAdd) targetType = 'addition';

                                  const nums = (q.prompt.match(/\b\d+\b/g) || []).map(Number);
                                  const leftCount = nums.length >= 2 ? nums[0] : (isSub ? 8 : 4);
                                  const rightCount = nums.length >= 2 ? nums[1] : (isSub ? 3 : 2);

                                  handleUpdateVisual(idx, {
                                    type: targetType,
                                    count: vc?.count ?? (nums[0] || 4),
                                    iconName: detectedIcon,
                                    leftCount: isSub || isAdd ? leftCount : undefined,
                                    rightCount: isSub || isAdd ? rightCount : undefined,
                                    leftLabel: isSub ? (detectedIcon === 'carrot' ? 'Có 8 củ cà rốt' : 'Ban đầu') : undefined,
                                    rightLabel: isSub ? (detectedIcon === 'carrot' ? 'Thỏ ăn mất 3 củ' : 'Bớt đi') : undefined,
                                    tens: isQue ? (vc?.tens ?? (nums[0] ? Math.floor(nums[0] / 10) : 0)) : undefined,
                                    ones: isQue ? (vc?.ones ?? (nums[0] ? nums[0] % 10 : 7)) : undefined,
                                    imageUrl: undefined,
                                    imageId: undefined,
                                  });
                                }}
                                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                                  currentMode === 'auto'
                                    ? 'bg-white text-sky-700 shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                🎨 Mô hình tự động
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (!vc?.imageUrl) {
                                    setMediaLibraryTargetQIdx(idx);
                                  } else {
                                    handleUpdateVisual(idx, { type: 'image' });
                                  }
                                }}
                                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                                  currentMode === 'image'
                                    ? 'bg-white text-sky-700 shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                🖼️ Thư viện ảnh
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  handleUpdateQuestion(idx, 'visualConfig', undefined);
                                }}
                                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                                  currentMode === 'none'
                                    ? 'bg-white text-slate-800 shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                🚫 Không dùng hình
                              </button>
                            </div>
                          </div>

                          {/* MODE 1: AUTO MODEL CONFIG */}
                          {currentMode === 'auto' && (
                            <div className="space-y-3 animate-in fade-in">
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                                <div>
                                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Kiểu mô hình</label>
                                  <select
                                    value={
                                      isFrame
                                        ? 'counters'
                                        : (vc?.type || 'counters')
                                    }
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      if (val === 'subtraction') {
                                        handleUpdateVisual(idx, { type: 'subtraction', leftCount: 5, rightCount: 2, iconName: vc?.iconName || 'apple', gridSize: undefined });
                                      } else {
                                        handleUpdateVisual(idx, { type: val as any, gridSize: undefined });
                                      }
                                    }}
                                    className="w-full h-8 px-2 rounded-lg border border-slate-200 bg-white text-xs font-bold"
                                  >
                                    <option value="addition">➕ Phép cộng gộp hai nhóm (1 + 3)</option>
                                    <option value="subtraction">➖ Phép trừ bớt đi (5 - 2)</option>
                                    <option value="counters">🍎 Đếm đồ vật rời</option>
                                    <option value="bundles">🥢 Bó que tính chục - đơn vị</option>
                                    <option value="comparison">⚖️ So sánh 2 nhóm</option>
                                    <option value="number_line">📏 Trục số</option>
                                    <option value="shapes">📐 Hình học</option>
                                    <option value="word_story">📖 Bài toán lời văn</option>
                                  </select>
                                </div>

                                {/* Dynamic sub-controls based on model type */}
                                {vc?.type === 'addition' && (
                                  <>
                                    <div>
                                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Loại vật thể</label>
                                      <select
                                        value={vc.iconName || 'apple'}
                                        onChange={(e) => handleUpdateVisual(idx, { iconName: e.target.value })}
                                        className="w-full h-8 px-2 rounded-lg border border-slate-200 bg-white text-xs font-bold"
                                      >
                                        <option value="apple">🍎 Quả táo (apple)</option>
                                        <option value="star">⭐ Ngôi sao (star)</option>
                                        <option value="candy">🍬 Kẹo ngọt (candy)</option>
                                        <option value="fish">🐟 Chú cá (fish)</option>
                                        <option value="pencil">✏️ Bút chì (pencil)</option>
                                        <option value="carrot">🥕 Cà rốt (carrot)</option>
                                        <option value="flower">🌸 Bông hoa (flower)</option>
                                        <option value="bird">🐦 Chú chim (bird)</option>
                                        <option value="rabbit">🐰 Chú thỏ (rabbit)</option>
                                        <option value="orange">🍊 Quả cam (orange)</option>
                                        <option value="block">🧱 Khối vuông (block)</option>
                                      </select>
                                    </div>
                                    <div>
                                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Nhóm 1 (Trái)</label>
                                      <input
                                        type="number"
                                        min={0}
                                        max={20}
                                        value={vc.leftCount ?? 0}
                                        onChange={(e) => handleUpdateVisual(idx, { leftCount: Math.max(0, Number(e.target.value)) })}
                                        className="w-full h-8 px-2 rounded-lg border border-slate-200 bg-white text-xs font-bold"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Nhóm 2 (Phải)</label>
                                      <input
                                        type="number"
                                        min={0}
                                        max={20}
                                        value={vc.rightCount ?? 0}
                                        onChange={(e) => handleUpdateVisual(idx, { rightCount: Math.max(0, Number(e.target.value)) })}
                                        className="w-full h-8 px-2 rounded-lg border border-slate-200 bg-white text-xs font-bold"
                                      />
                                    </div>
                                  </>
                                )}
                                {vc?.type === 'counters' && (
                                  <>
                                    <div>
                                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Loại vật thể</label>
                                      <select
                                        value={vc.iconName || 'apple'}
                                        onChange={(e) => handleUpdateVisual(idx, { iconName: e.target.value })}
                                        className="w-full h-8 px-2 rounded-lg border border-slate-200 bg-white text-xs font-bold"
                                      >
                                        <option value="apple">🍎 Quả táo (apple)</option>
                                        <option value="star">⭐ Ngôi sao (star)</option>
                                        <option value="candy">🍬 Kẹo ngọt (candy)</option>
                                        <option value="fish">🐟 Chú cá (fish)</option>
                                        <option value="pencil">✏️ Bút chì (pencil)</option>
                                        <option value="carrot">🥕 Cà rốt (carrot)</option>
                                        <option value="flower">🌸 Bông hoa (flower)</option>
                                        <option value="bird">🐦 Chú chim (bird)</option>
                                        <option value="rabbit">🐰 Chú thỏ (rabbit)</option>
                                        <option value="orange">🍊 Quả cam (orange)</option>
                                        <option value="block">🧱 Khối vuông (block)</option>
                                      </select>
                                    </div>
                                    <div>
                                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Số lượng đếm</label>
                                      <input
                                        type="number"
                                        min={0}
                                        max={20}
                                        value={vc.count ?? 0}
                                        onChange={(e) => handleUpdateVisual(idx, { count: Math.max(0, Number(e.target.value)) })}
                                        className="w-full h-8 px-2 rounded-lg border border-slate-200 bg-white text-xs font-bold"
                                      />
                                    </div>
                                  </>
                                )}

                                {vc?.type === 'subtraction' && (
                                  <>
                                    <div>
                                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Loại vật thể</label>
                                      <select
                                        value={vc.iconName || 'apple'}
                                        onChange={(e) => handleUpdateVisual(idx, { iconName: e.target.value })}
                                        className="w-full h-8 px-2 rounded-lg border border-slate-200 bg-white text-xs font-bold"
                                      >
                                        <option value="apple">🍎 Quả táo (apple)</option>
                                        <option value="star">⭐ Ngôi sao (star)</option>
                                        <option value="candy">🍬 Kẹo ngọt (candy)</option>
                                        <option value="fish">🐟 Chú cá (fish)</option>
                                        <option value="pencil">✏️ Bút chì (pencil)</option>
                                        <option value="carrot">🥕 Cà rốt (carrot)</option>
                                        <option value="flower">🌸 Bông hoa (flower)</option>
                                        <option value="bird">🐦 Chú chim (bird)</option>
                                        <option value="rabbit">🐰 Chú thỏ (rabbit)</option>
                                        <option value="orange">🍊 Quả cam (orange)</option>
                                        <option value="block">🧱 Khối vuông (block)</option>
                                      </select>
                                    </div>

                                    <div>
                                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Ban đầu (Trái)</label>
                                      <input
                                        type="number"
                                        min={0}
                                        max={20}
                                        value={vc.leftCount ?? 5}
                                        onChange={(e) => handleUpdateVisual(idx, { leftCount: Math.max(0, Number(e.target.value)) })}
                                        className="w-full h-8 px-2 rounded-lg border border-slate-200 bg-white text-xs font-bold"
                                      />
                                    </div>

                                    <div>
                                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Bớt đi (Phải)</label>
                                      <input
                                        type="number"
                                        min={0}
                                        max={20}
                                        value={vc.rightCount ?? 2}
                                        onChange={(e) => handleUpdateVisual(idx, { rightCount: Math.max(0, Number(e.target.value)) })}
                                        className="w-full h-8 px-2 rounded-lg border border-slate-200 bg-white text-xs font-bold"
                                      />
                                    </div>
                                  </>
                                )}

                                {vc?.type === 'bundles' && (
                                  <>
                                    <div>
                                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Số bó chục (tens)</label>
                                      <input
                                        type="number"
                                        min={0}
                                        max={9}
                                        value={vc.tens ?? 0}
                                        onChange={(e) => handleUpdateVisual(idx, { tens: Number(e.target.value) })}
                                        className="w-full h-8 px-2 rounded-lg border border-slate-200 bg-white text-xs font-bold"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Số que lẻ (ones)</label>
                                      <input
                                        type="number"
                                        min={0}
                                        max={9}
                                        value={vc.ones ?? 0}
                                        onChange={(e) => handleUpdateVisual(idx, { ones: Number(e.target.value) })}
                                        className="w-full h-8 px-2 rounded-lg border border-slate-200 bg-white text-xs font-bold"
                                      />
                                    </div>
                                  </>
                                )}

                                {vc?.type === 'comparison' && (
                                  <>
                                    <div>
                                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Nhóm Trái (Số lượng)</label>
                                      <input
                                        type="number"
                                        min={0}
                                        value={vc.leftCount ?? 4}
                                        onChange={(e) => handleUpdateVisual(idx, { leftCount: Number(e.target.value) })}
                                        className="w-full h-8 px-2 rounded-lg border border-slate-200 bg-white text-xs font-bold"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Nhóm Phải (Số lượng)</label>
                                      <input
                                        type="number"
                                        min={0}
                                        value={vc.rightCount ?? 2}
                                        onChange={(e) => handleUpdateVisual(idx, { rightCount: Number(e.target.value) })}
                                        className="w-full h-8 px-2 rounded-lg border border-slate-200 bg-white text-xs font-bold"
                                      />
                                    </div>
                                  </>
                                )}

                                {vc?.type === 'shapes' && (
                                  <div>
                                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Loại hình học</label>
                                    <select
                                      value={vc.shapeType || 'circle'}
                                      onChange={(e) => handleUpdateVisual(idx, { shapeType: e.target.value as any })}
                                      className="w-full h-8 px-2 rounded-lg border border-slate-200 bg-white text-xs font-bold"
                                    >
                                      <option value="circle">⚪ Hình tròn</option>
                                      <option value="square">🟦 Hình vuông</option>
                                      <option value="triangle">🔺 Hình tam giác</option>
                                      <option value="rectangle">▬ Hình chữ nhật</option>
                                      <option value="cylinder">🛢️ Khối trụ</option>
                                      <option value="sphere">🔮 Khối cầu</option>
                                    </select>
                                  </div>
                                )}
                              </div>

                              {vc?.type === 'word_story' && (
                                <div>
                                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Tình huống bài toán lời văn</label>
                                  <input
                                    type="text"
                                    value={vc.storyText || ''}
                                    onChange={(e) => handleUpdateVisual(idx, { storyText: e.target.value })}
                                    placeholder="Ví dụ: Có 5 quả táo, mẹ cho thêm 2 quả nữa..."
                                    className="w-full h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold"
                                  />
                                </div>
                              )}
                            </div>
                          )}

                          {/* MODE 2: LIBRARY IMAGE CONFIG */}
                          {currentMode === 'image' && (
                            <div className="space-y-3 animate-in fade-in">
                              {vc?.imageUrl ? (
                                <div className="p-3 bg-white rounded-xl border border-sky-200 shadow-xs space-y-3">
                                  {/* Thumbnail & Image Meta */}
                                  <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                      <div className="w-14 h-14 rounded-lg bg-slate-50 border border-slate-200 overflow-hidden flex items-center justify-center p-1">
                                        <img src={normalizeAssetUrl(vc.imageUrl)} alt="" className="max-w-full max-h-full object-contain" />
                                      </div>
                                      <div>
                                        <div className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                                          <span>{vc.imageAlt || 'Hình ảnh từ thư viện'}</span>
                                          {vc.countUnit && (
                                            <span className="px-1.5 py-0.2 rounded-full bg-sky-100 text-sky-800 text-[10px] font-bold">
                                              đơn vị: {vc.countUnit}
                                            </span>
                                          )}
                                        </div>
                                        <div className="text-[10px] text-slate-400 font-semibold flex items-center gap-2 mt-0.5">
                                          <span>Tỷ lệ: {vc.imageAspectRatio || 'Gốc'}</span>
                                          <span>•</span>
                                          <span>Cỡ: {vc.imageScale || 'Vừa'}</span>
                                          <span>•</span>
                                          <span>Số lượng: {vc.leftCount !== undefined && vc.rightCount !== undefined ? `${vc.leftCount} + ${vc.rightCount}` : (vc.count ?? 1)}</span>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => setMediaLibraryTargetQIdx(idx)}
                                        className="px-3 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-bold cursor-pointer transition-colors"
                                      >
                                        Đổi hình khác
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateQuestion(idx, 'visualConfig', undefined)}
                                        className="px-2.5 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 text-xs font-bold cursor-pointer transition-colors"
                                      >
                                        Gỡ hình
                                      </button>
                                    </div>
                                  </div>

                                  {/* Multi-object Repetition & Math Count Controls for Questions */}
                                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                    <div>
                                      <label className="block text-[10px] font-black text-slate-700 mb-0.5">
                                        Số lượng lặp lại trong câu hỏi
                                      </label>
                                      <div className="flex items-center gap-1.5">
                                        <input
                                          type="number"
                                          min={0}
                                          max={20}
                                          value={vc.count ?? 1}
                                          onChange={(e) => handleUpdateVisual(idx, { count: Math.max(0, Number(e.target.value)), leftCount: undefined, rightCount: undefined })}
                                          className="w-20 h-7 px-2 rounded-lg border border-slate-200 bg-white text-xs font-bold"
                                        />
                                        <span className="text-[11px] text-slate-500 font-bold">
                                          {vc.countUnit || 'đối tượng'}
                                        </span>
                                      </div>
                                    </div>

                                    <div className="sm:col-span-2 flex items-center gap-2 pt-1">
                                      <span className="text-[10px] text-slate-400 font-bold">Thử nhanh:</span>
                                      {[1, 2, 3, 5, 8].map((n) => (
                                        <button
                                          key={n}
                                          type="button"
                                          onClick={() => handleUpdateVisual(idx, { count: n, leftCount: undefined, rightCount: undefined })}
                                          className={`px-2 py-0.5 rounded-md text-[10px] font-black cursor-pointer transition-all ${
                                            (vc.count ?? 1) === n && vc.leftCount === undefined
                                              ? 'bg-sky-600 text-white shadow-xs'
                                              : 'bg-white text-slate-600 hover:bg-sky-100 border border-slate-200'
                                          }`}
                                        >
                                          {n} {vc.countUnit || ''}
                                        </button>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Image Styling Controls: Scale, AspectRatio, Fit, Align */}
                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100">
                                    <div>
                                      <label className="block text-[10px] font-bold text-slate-600">Kích thước hiển thị</label>
                                      <select
                                        value={vc.imageScale || 'medium'}
                                        onChange={(e) => handleUpdateVisual(idx, { imageScale: e.target.value as any })}
                                        className="w-full h-7 px-2 rounded-lg border border-slate-200 text-xs font-bold bg-white"
                                      >
                                        <option value="small">Nhỏ (~180px)</option>
                                        <option value="medium">Vừa (~280px)</option>
                                        <option value="large">Lớn (~380px)</option>
                                        <option value="full">100% Khung</option>
                                      </select>
                                    </div>

                                    <div>
                                      <label className="block text-[10px] font-bold text-slate-600">Tỷ lệ khung hình / Cắt</label>
                                      <select
                                        value={vc.imageAspectRatio || 'original'}
                                        onChange={(e) => handleUpdateVisual(idx, { imageAspectRatio: e.target.value as any })}
                                        className="w-full h-7 px-2 rounded-lg border border-slate-200 text-xs font-bold bg-white"
                                      >
                                        <option value="original">Tỷ lệ gốc</option>
                                        <option value="1:1">1:1 (Vuông)</option>
                                        <option value="4:3">4:3 (Tiêu chuẩn)</option>
                                        <option value="16:9">16:9 (Ngang)</option>
                                      </select>
                                    </div>

                                    <div>
                                      <label className="block text-[10px] font-bold text-slate-600">Kiểu vừa khung (Fit)</label>
                                      <select
                                        value={vc.imageFit || 'contain'}
                                        onChange={(e) => handleUpdateVisual(idx, { imageFit: e.target.value as any })}
                                        className="w-full h-7 px-2 rounded-lg border border-slate-200 text-xs font-bold bg-white"
                                      >
                                        <option value="contain">Vừa trọn (Contain - không méo)</option>
                                        <option value="cover">Cắt lấp đầy (Cover)</option>
                                      </select>
                                    </div>

                                    <div>
                                      <label className="block text-[10px] font-bold text-slate-600">Căn lề hiển thị</label>
                                      <select
                                        value={vc.imageAlign || 'center'}
                                        onChange={(e) => handleUpdateVisual(idx, { imageAlign: e.target.value as any })}
                                        className="w-full h-7 px-2 rounded-lg border border-slate-200 text-xs font-bold bg-white"
                                      >
                                        <option value="center">Căn giữa</option>
                                        <option value="left">Căn trái</option>
                                        <option value="right">Căn phải</option>
                                      </select>
                                    </div>
                                  </div>

                                  {/* Caption and Teacher Verification */}
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                                    <div>
                                      <label className="block text-[10px] font-bold text-slate-600">
                                        Chú thích hình ảnh (Hiển thị dưới ảnh - Không ghi đáp án)
                                      </label>
                                      <input
                                        type="text"
                                        value={vc.caption || ''}
                                        onChange={(e) => handleUpdateVisual(idx, { caption: e.target.value })}
                                        placeholder="Ví dụ: Hình minh họa quả cam đếm số..."
                                        className="w-full h-7 px-2 rounded-lg border border-slate-200 text-xs font-medium"
                                      />
                                    </div>

                                    <div className="flex items-center gap-2 pt-4">
                                      <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                                        <input
                                          type="checkbox"
                                          checked={Boolean(vc.isTeacherVerified)}
                                          onChange={(e) => handleUpdateVisual(idx, { isTeacherVerified: e.target.checked })}
                                          className="w-4 h-4 rounded-md text-sky-600 focus:ring-sky-500 border-slate-300 cursor-pointer"
                                        />
                                        <span>Giáo viên đã xem trước &amp; xác nhận hình phù hợp</span>
                                      </label>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="p-6 bg-white rounded-2xl border-2 border-dashed border-sky-300 text-center flex flex-col items-center justify-center gap-2">
                                  <ImageIcon className="w-8 h-8 text-sky-500" />
                                  <div>
                                    <p className="text-xs font-black text-slate-700">Chưa có hình ảnh nào được chọn</p>
                                    <p className="text-[11px] text-slate-400">Chọn hình từ Thư viện dùng chung hoặc tải ảnh mới (&lt; 1MB)</p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setMediaLibraryTargetQIdx(idx)}
                                    className="mt-1 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm transition-transform active:scale-95"
                                  >
                                    <FolderOpen className="w-4 h-4" /> Mở Thư viện hình ảnh
                                  </button>
                                </div>
                              )}
                            </div>
                          )}

                          {/* MODE 3: NO VISUAL */}
                          {currentMode === 'none' && (
                            <div className="p-3 bg-slate-100/70 rounded-xl border border-slate-200 text-slate-500 text-xs font-medium flex items-center justify-between">
                              <span>Câu hỏi này hiện không có hình minh họa (chỉ dùng chữ và phép tính).</span>
                              <button
                                type="button"
                                onClick={() => {
                                  handleUpdateVisual(idx, { type: 'counters', count: 4, iconName: 'apple' });
                                }}
                                className="px-3 py-1 rounded-lg bg-white border border-slate-300 hover:bg-sky-50 hover:text-sky-700 text-slate-700 text-xs font-bold cursor-pointer"
                              >
                                + Thêm hình
                              </button>
                            </div>
                          )}

                          {/* PEDAGOGICAL CONSISTENCY ADVISORIES (Chống sai lệch nội dung Toán) */}
                          {countWarning && (
                            <div className="p-2.5 bg-amber-50 border-2 border-amber-200 rounded-xl text-amber-900 text-xs font-bold flex items-start gap-2">
                              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                              <div>
                                <span>Lưu ý sư phạm: </span>
                                <span className="font-semibold">
                                  Đáp án chính xác câu hỏi là &ldquo;{q.expectedAnswer}&rdquo;, nhưng số lượng vật thể trong mô hình đang là {vc?.count}. Vui lòng đối soát xem học sinh có được yêu cầu đếm đúng số lượng này không.
                                </span>
                              </div>
                            </div>
                          )}

                          {additionWarning && (
                            <div className="p-2.5 bg-rose-50 border-2 border-rose-200 rounded-xl text-rose-800 text-xs font-bold flex items-start gap-2">
                              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                              <div>
                                <span>Cảnh báo sai lệch phép cộng: </span>
                                <span className="font-semibold">
                                  Mô hình gồm {vc?.leftCount} + {vc?.rightCount} = {(vc?.leftCount ?? 0) + (vc?.rightCount ?? 0)} vật thể, nhưng đáp án câu hỏi là &ldquo;{q.expectedAnswer}&rdquo;. Vui lòng chỉnh số lượng hoặc đáp án cho đồng nhất trước khi xuất bản.
                                </span>
                              </div>
                            </div>
                          )}

                          {subtractionWarning && (
                            <div className="p-2.5 bg-rose-50 border-2 border-rose-200 rounded-xl text-rose-800 text-xs font-bold flex items-start gap-2">
                              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                              <div>
                                <span>Cảnh báo sai lệch phép trừ: </span>
                                <span className="font-semibold">
                                  Mô hình gồm {vc?.leftCount} − {vc?.rightCount} = {(vc?.leftCount ?? 0) - (vc?.rightCount ?? 0)} vật thể, nhưng đáp án câu hỏi là &ldquo;{q.expectedAnswer}&rdquo;. Vui lòng chỉnh số lượng hoặc đáp án cho đồng nhất trước khi xuất bản.
                                </span>
                              </div>
                            </div>
                          )}

                          {frameConflictWarning && (
                            <div className="p-2.5 bg-rose-50 border-2 border-rose-200 rounded-xl text-rose-800 text-xs font-bold flex items-start gap-2">
                              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                              <div>
                                <span>Cảnh báo đồng bộ khung: </span>
                                <span className="font-semibold">
                                  Lời dẫn câu hỏi nhắc tới {isFive ? 'Khung 10 ô' : 'Khung 5 ô'}, nhưng cấu hình mô hình hiện tại là {isFive ? 'Khung 5 ô' : 'Khung 10 ô'}. Hãy chọn đúng kiểu khung để học sinh không bị nhầm lẫn.
                                </span>
                              </div>
                            </div>
                          )}

                          {captionLeaksAnswer && (
                            <div className="p-2.5 bg-amber-50 border-2 border-amber-200 rounded-xl text-amber-900 text-xs font-bold flex items-start gap-2">
                              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                              <div>
                                <span>Lưu ý bảo mật đáp án: </span>
                                <span className="font-semibold">
                                  Chú thích hình có chứa đáp án &ldquo;{q.expectedAnswer}&rdquo;. Hãy điều chỉnh chú thích để không vô tình tiết lộ kết quả cho học sinh.
                                </span>
                              </div>
                            </div>
                          )}

                          {hasImage && !vc?.isTeacherVerified && (
                            <div className="p-2.5 bg-sky-50 border border-sky-200 rounded-xl text-sky-800 text-xs font-semibold flex items-center gap-2">
                              <Info className="w-4 h-4 text-sky-600 flex-shrink-0" />
                              <span>Vui lòng xem trước và tích chọn xác nhận hình ảnh phù hợp với nội dung Toán học.</span>
                            </div>
                          )}

                          {/* LIVE STUDENT PREVIEW BOX (Xem trước chuẩn học sinh) */}
                          <div className="pt-2 border-t border-sky-100">
                            <div className="flex items-center justify-between mb-2">
                              <button
                                type="button"
                                onClick={() => togglePreview(idx)}
                                className="text-xs font-black text-sky-800 hover:text-sky-900 flex items-center gap-1.5 cursor-pointer"
                              >
                                <Play className="w-3.5 h-3.5 text-sky-600" />
                                <span>Xem trước theo đúng giao diện học sinh</span>
                                <span className="text-[10px] text-slate-400 font-normal">
                                  ({isLivePreviewOpen ? 'Thu gọn' : 'Mở rộng'})
                                </span>
                              </button>
                            </div>

                            {isLivePreviewOpen && (
                              <div className="p-3 bg-white rounded-xl border border-sky-200 shadow-inner">
                                <div className="text-[10px] font-black uppercase text-slate-400 mb-1 text-center tracking-wider">
                                  Màn hình học sinh sẽ nhìn thấy:
                                </div>
                                <VisualCounters config={q.visualConfig} isTeacherView={true} questionPrompt={q.prompt} />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Diagnostic Rule Hint & Explanation */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-bold text-slate-600 flex items-center gap-1">
                            <Lightbulb className="w-3.5 h-3.5 text-amber-500" /> Mẫu lỗi chẩn đoán &amp; Gợi ý Thám Tử
                          </label>
                          {isGrade1Scope && (
                            <button
                              type="button"
                              onClick={() => handleToggleHintAudio(q, idx)}
                              className={`p-1 px-1.5 rounded-md text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors border shadow-2xs ${
                                playingEditorAudioId === `h-${idx}`
                                  ? 'bg-amber-200 text-amber-900 border-amber-400 animate-pulse'
                                  : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200'
                              }`}
                              aria-label="Phát âm thanh manh mối"
                              title="Nghe thử manh mối"
                            >
                              <Volume2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
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

                        {/* Full Audio Management for Wrong-Answer Hint (Req 2) */}
                        {isGrade1Scope && (
                          <div className="mt-2">
                            <QuestionAudioControl
                              question={q}
                              questionIndex={idx}
                              type="hint"
                              isGrade1Scope={isGrade1Scope}
                              onChangeSpokenText={(text) => handleUpdateQuestion(idx, 'customSpokenHint', text)}
                              onUpdateAudio={(hintAudioUrl, hintAudioHash) => {
                                const updated = [...questions];
                                updated[idx] = { ...updated[idx], hintAudioUrl, hintAudioHash };
                                setQuestions(updated);
                              }}
                              onDeleteAudio={() => {
                                const updated = [...questions];
                                updated[idx] = { ...updated[idx], hintAudioUrl: '', hintAudioHash: '' };
                                setQuestions(updated);
                              }}
                            />
                          </div>
                        )}
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
            onClick={handleSafeClose}
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

        {/* Media Library Modal Integration (P0) */}
        {mediaLibraryTargetQIdx !== null && (
          <MediaLibraryModal
            isOpen={mediaLibraryTargetQIdx !== null}
            onClose={() => setMediaLibraryTargetQIdx(null)}
            selectedMediaId={questions[mediaLibraryTargetQIdx]?.visualConfig?.imageId}
            onSelectMedia={(selectedMedia: MediaItem) => {
              const cleanUrl = normalizeAssetUrl(selectedMedia.url);
              const isBg = selectedMedia.category === 'backgrounds';
              handleUpdateVisual(mediaLibraryTargetQIdx, {
                type: 'image',
                imageId: selectedMedia.id,
                imageUrl: cleanUrl,
                imageAlt: selectedMedia.title,
                countUnit: selectedMedia.countUnit || getAssetCountUnit(cleanUrl),
                imageScale: questions[mediaLibraryTargetQIdx]?.visualConfig?.imageScale || (isBg ? 'full' : 'medium'),
                imageAspectRatio: isBg ? '16:9' : (questions[mediaLibraryTargetQIdx]?.visualConfig?.imageAspectRatio || 'original'),
                imageFit: questions[mediaLibraryTargetQIdx]?.visualConfig?.imageFit || (isBg ? 'cover' : 'contain'),
                imageAlign: questions[mediaLibraryTargetQIdx]?.visualConfig?.imageAlign || 'center',
                isTeacherVerified: true,
              });
              setMediaLibraryTargetQIdx(null);
            }}
          />
        )}
        {/* Direct AI Draft Modal inside Editor */}
        <AiDraftModal
          isOpen={isAiDraftOpen}
          onClose={() => setIsAiDraftOpen(false)}
          existingQuestionCount={questions.length}
          isExistingLesson={isEditing && !isNewAiLesson}
          isPublishedLesson={!isNewAiLesson && (lesson?.status === 'published' || Boolean(lesson?.isPublished))}
          currentTitle={title}
          onApplyQuestions={(newAiQuestions, meta) => {
            // Option 1: Tạo bài học mới (Bản nháp độc lập)
            if (meta?.applyMode === 'create_new') {
              const newLessonId = `lesson-ai-${Date.now()}`;
              setOverrideLessonId(newLessonId);
              setIsNewAiLesson(true);
              const chosenTopic = meta?.topic || topic || 'Chủ đề mới';
              const chosenGrade = meta?.grade || grade || 1;
              setTopic(chosenTopic);
              setGrade(chosenGrade);
              setTitle(`Bài tập Toán: ${chosenTopic}`);
              setDescription(`Bài học nháp tạo từ AI Gemini (${newAiQuestions.length} câu hỏi theo chuẩn GDPT 2018).`);
              setLearningStandard(`Rèn luyện kỹ năng và chẩn đoán mẫu lỗi chủ đề ${chosenTopic} theo chuẩn GDPT 2018`);
              // Contain ONLY the new AI questions, ZERO old questions copied!
              setQuestions(newAiQuestions.map((q, i) => ({ ...q, order: i + 1 })));
              setVersionLoadError(null);
              setErrorMsg(null);
              return;
            }

            // Option 2 & 3: Replace or Append in current lesson
            const shouldUpdateMeta = (!isEditing && !isNewAiLesson) || meta?.updateMetadata === true;

            if (shouldUpdateMeta) {
              if (meta?.topic) setTopic(meta.topic);
              if (meta?.grade) setGrade(meta.grade);
              if (meta?.topic) {
                setTitle(`Bài tập Toán: ${meta.topic}`);
                if (!learningStandard || learningStandard.includes('Thám tử Cáo')) {
                  setLearningStandard(`Rèn luyện kỹ năng và chẩn đoán mẫu lỗi chủ đề ${meta.topic} theo chuẩn GDPT 2018`);
                }
              }
            }

            if (meta?.applyMode === 'replace') {
              setQuestions(newAiQuestions.map((q, i) => ({ ...q, order: i + 1 })));
            } else {
              const startOrder = questions.length;
              const reindexed = newAiQuestions.map((q, i) => ({
                ...q,
                order: startOrder + i + 1,
              }));
              setQuestions([...questions, ...reindexed]);
            }
          }}
        />
      </div>
    </div>
  );
};
