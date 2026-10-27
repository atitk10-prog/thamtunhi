import React, { useState, useEffect } from 'react';
import { Sparkles, X, AlertTriangle, Check, Loader2, RefreshCw, PlusCircle, HelpCircle, Volume2 } from 'lucide-react';
import { Question } from '../../types';
import { getAuthHeaders } from '../../lib/authSession';
import { isGrade1Weeks1To9, normalizeMathTextForSpeech, getAudioHash, getQuestionSpokenText, getHintSpokenText } from '../../lib/vietnameseTts';
import { playVietnameseAudio, stopVietnameseAudio } from '../../lib/vietnameseAudioPlayer';
import { QuestionAudioControl } from './QuestionAudioControl';

export interface AiDraftMeta {
  grade: 1 | 2;
  topic: string;
  targetPattern?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  applyMode?: 'create_new' | 'replace' | 'append';
  updateMetadata?: boolean;
}

interface AiDraftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyQuestions: (questions: Question[], meta?: AiDraftMeta) => void;
  existingQuestionCount?: number;
  isExistingLesson?: boolean;
  isPublishedLesson?: boolean;
  currentTitle?: string;
}

export const AiDraftModal: React.FC<AiDraftModalProps> = ({
  isOpen,
  onClose,
  onApplyQuestions,
  existingQuestionCount = 0,
  isExistingLesson = false,
  isPublishedLesson = false,
  currentTitle = '',
}) => {
  const [grade, setGrade] = useState<1 | 2>(1);
  const [topic, setTopic] = useState('Phép cộng trong phạm vi 10');
  const [targetPattern, setTargetPattern] = useState<string>('AUTO');
  const [customPattern, setCustomPattern] = useState<string>('');
  const [questionCount, setQuestionCount] = useState<number>(4);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [applyMode, setApplyMode] = useState<'create_new' | 'replace' | 'append'>(
    isPublishedLesson ? 'create_new' : (existingQuestionCount > 0 ? 'append' : 'create_new')
  );
  const [confirmReplace, setConfirmReplace] = useState<boolean>(false);
  const [updateMetadata, setUpdateMetadata] = useState<boolean>(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [draftQuestions, setDraftQuestions] = useState<Question[]>([]);
  const [playingDraftId, setPlayingDraftId] = useState<string | null>(null);

  // Automatically select recommended apply mode when modal opens
  useEffect(() => {
    if (isOpen) {
      if (isPublishedLesson) {
        setApplyMode('create_new');
      } else if (existingQuestionCount > 0) {
        setApplyMode('append');
      } else {
        setApplyMode('create_new');
      }
      setConfirmReplace(false);
      setErrorMsg(null);
    }
    return () => {
      stopVietnameseAudio();
      setPlayingDraftId(null);
    };
  }, [isOpen, isPublishedLesson, existingQuestionCount]);

  const handleSafeClose = () => {
    stopVietnameseAudio();
    setPlayingDraftId(null);
    onClose();
  };

  const handleToggleDraftAudio = (q: Question, type: 'question' | 'hint', key: string) => {
    if (playingDraftId === key) {
      stopVietnameseAudio();
      setPlayingDraftId(null);
      return;
    }
    stopVietnameseAudio();

    const url = type === 'question' ? q.audioUrl : q.hintAudioUrl;
    if (!url || !url.trim()) {
      setPlayingDraftId(null);
      return;
    }

    setPlayingDraftId(key);
    playVietnameseAudio(
      url,
      undefined,
      () => setPlayingDraftId(key),
      () => setPlayingDraftId(null),
      () => setPlayingDraftId(null)
    );
  };

  if (!isOpen) return null;

  const effectivePattern = targetPattern === 'CUSTOM'
    ? (customPattern.trim() || 'Lỗi học sinh tự nhập')
    : targetPattern;

  const handleGenerate = async () => {
    stopVietnameseAudio();
    setPlayingDraftId(null);
    setLoading(true);
    setErrorMsg(null);
    setDraftQuestions([]);

    try {
      const res = await fetch('/api/teacher/generate-draft', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          grade,
          topic,
          targetPattern: effectivePattern,
          questionCount,
          difficulty,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        let msg = '';
        if (res.status === 404 || data.code === 'GEMINI_MODEL_NOT_FOUND') {
          msg = data.error || `Mô hình AI (${data.model || 'Gemini'}) chưa khả dụng với API key hiện tại (Lỗi 404). Vui lòng cấu hình biến GEMINI_MODEL (ví dụ: gemini-3.5-flash-lite hoặc gemini-3.8-flash).`;
        } else if (res.status === 429 || data.code === 'GEMINI_QUOTA_EXCEEDED') {
          msg = data.error || 'Tài khoản Gemini API tạm thời hết hạn mức yêu cầu (Lỗi 429). Thầy/Cô vui lòng thử lại sau ít phút hoặc nâng hạn mức API key.';
        } else if (res.status === 504 || data.code === 'GEMINI_TIMEOUT') {
          msg = data.error || 'Quá thời gian chờ phản hồi từ mô hình AI (quá 30 giây). Thầy/Cô vui lòng thử lại hoặc giảm bớt số lượng câu hỏi.';
        } else if (res.status === 401 || data.code === 'GEMINI_AUTH_INVALID') {
          msg = data.error || 'Khóa bí mật GEMINI_API_KEY không hợp lệ hoặc chưa được cấp quyền truy cập mô hình này.';
        } else if (res.status === 502 || data.code === 'AI_NETWORK_ERROR') {
          msg = data.error || 'Không thể kết nối đến máy chủ Google Gemini. Vui lòng kiểm tra lại kết nối mạng.';
        } else {
          msg = data.error || 'Có lỗi khi tạo bài nháp từ AI. Thầy/Cô vui lòng thử lại sau.';
        }
        setErrorMsg(msg);
        return;
      }

      if (data.questions && Array.isArray(data.questions) && data.questions.length > 0) {
        const enriched = data.questions.map((q: Question) => {
          const spokenPrompt = getQuestionSpokenText(q);
          const pHash = getAudioHash(spokenPrompt);
          const spokenHint = getHintSpokenText(q);
          const hHash = spokenHint ? getAudioHash(spokenHint) : undefined;
          return {
            ...q,
            // Requirement 2: NEVER assign fake /audio/ URLs if not synthesized
            audioUrl: q.audioUrl || '',
            audioHash: q.audioUrl ? (q.audioHash || pHash) : '',
            hintAudioUrl: q.hintAudioUrl || '',
            hintAudioHash: q.hintAudioUrl ? (q.hintAudioHash || hHash) : '',
          };
        });
        setDraftQuestions(enriched);

        if (data.audioErrors && Array.isArray(data.audioErrors) && data.audioErrors.length > 0) {
          const errorDetails = data.audioErrors.map((err: any) => `Câu ${err.questionIndex + 1} (${err.target === 'prompt' ? 'câu hỏi' : 'gợi ý'})`).join(', ');
          setErrorMsg(`Lưu ý: Có ${data.audioErrors.length} mục âm thanh chưa tạo thành công [${errorDetails}]. Thầy/Cô vui lòng bấm "Tạo lại âm thanh" cho từng câu bên dưới trước khi xuất bản.`);
        }
      } else {
        setErrorMsg('Dữ liệu AI phản hồi nhưng không chứa danh sách câu hỏi hợp lệ.');
      }
    } catch (err: any) {
      setErrorMsg('Không thể kết nối đến máy chủ hệ thống. Vui lòng kiểm tra kết nối mạng của bạn và thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDraftQuestion = (idx: number, updates: Partial<Question>) => {
    setDraftQuestions((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], ...updates };
      return updated;
    });
  };

  const handleApply = () => {
    if (draftQuestions.length > 0) {
      if (applyMode === 'replace' && existingQuestionCount > 0 && !confirmReplace) {
        setErrorMsg('Vui lòng tích chọn ô xác nhận trước khi thay thế các câu hỏi hiện tại.');
        return;
      }
      stopVietnameseAudio();
      setPlayingDraftId(null);
      onApplyQuestions(draftQuestions, {
        grade,
        topic,
        targetPattern: effectivePattern,
        difficulty,
        applyMode,
        updateMetadata,
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white rounded-3xl border-3 border-sky-300 shadow-2xl p-5 sm:p-7 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-sky-500 text-white flex items-center justify-center shadow">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800">
                AI Soạn Đề Toán Nháp (Gemini)
              </h3>
              <p className="text-xs font-semibold text-slate-500">
                Tạo chuẩn xác theo Chương trình GDPT 2018 với chẩn đoán mẫu lỗi sư phạm
              </p>
            </div>
          </div>

          <button
            type="button"
            aria-label="Đóng AI Soạn Bài"
            onClick={handleSafeClose}
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Controls */}
        <div className="flex-1 overflow-y-auto py-3.5 space-y-3.5 pr-1">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1">
                Khối Lớp *
              </label>
              <select
                value={grade}
                onChange={(e) => setGrade(Number(e.target.value) as 1 | 2)}
                className="w-full h-11 px-3.5 rounded-xl border-2 border-slate-200 bg-white font-bold text-slate-800 focus:border-sky-500 focus:outline-hidden text-sm"
              >
                <option value={1}>Toán Lớp 1 (GDPT 2018)</option>
                <option value={2}>Toán Lớp 2 (GDPT 2018)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1">
                Độ Khó *
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as any)}
                className="w-full h-11 px-3.5 rounded-xl border-2 border-slate-200 bg-white font-bold text-slate-800 focus:border-sky-500 focus:outline-hidden text-sm"
              >
                <option value="easy">Cơ bản / Nhận biết (Dễ)</option>
                <option value="medium">Thông hiểu / Luyện tập (Vừa)</option>
                <option value="hard">Vận dụng / Nâng cao (Khó)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1">
              Chủ Đề Bài Học *
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Ví dụ: Phép cộng có nhớ trong phạm vi 20, Khung 10 ô, Đồng hồ..."
              className="w-full h-11 px-3.5 rounded-xl border-2 border-slate-200 bg-white font-bold text-slate-800 focus:border-sky-500 focus:outline-hidden text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1 flex items-center justify-between">
                <span>Tập trung mẫu lỗi</span>
                <span className="text-[10px] font-bold text-sky-600 normal-case">Tùy chọn sư phạm</span>
              </label>
              <select
                value={targetPattern}
                onChange={(e) => setTargetPattern(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border-2 border-slate-200 bg-white font-bold text-slate-800 focus:border-sky-500 focus:outline-hidden text-xs"
              >
                <option value="AUTO">✨ AI tự xác định mẫu lỗi phù hợp (Khuyến nghị)</option>
                <option value="COUNTING_OFF_BY_ONE">Đếm lệch 1 đơn vị (COUNTING_OFF_BY_ONE)</option>
                <option value="WRONG_OPERATOR">Nhầm dấu phép tính (+, -, =) (WRONG_OPERATOR)</option>
                <option value="CROSS_TEN_ERROR">Sai bước qua 10 (cộng/trừ có nhớ) (CROSS_TEN_ERROR)</option>
                <option value="PLACE_VALUE_SWAP">Đảo vị trí Chục và Đơn vị (PLACE_VALUE_SWAP)</option>
                <option value="COMPARISON_INVERSION">Đảo chiều dấu so sánh (&gt; / &lt;) (COMPARISON_INVERSION)</option>
                <option value="WORD_PROBLEM_WRONG_OPERATION">Chọn sai phép tính toán có lời văn (WORD_PROBLEM)</option>
                <option value="GEOMETRY_MISIDENTIFICATION">Nhầm lẫn hình phẳng / hình khối (GEOMETRY)</option>
                <option value="MEASUREMENT_UNIT_ERROR">Nhầm đơn vị đo lường (MEASUREMENT)</option>
                <option value="CUSTOM">✏️ Khác – Tự nhập mẫu lỗi riêng...</option>
              </select>

              {targetPattern === 'CUSTOM' && (
                <div className="mt-2 animate-in fade-in duration-200">
                  <input
                    type="text"
                    value={customPattern}
                    onChange={(e) => setCustomPattern(e.target.value)}
                    placeholder="Nhập mô tả lỗi (ví dụ: Quên trừ số mượn, nhầm lẫn số 6 và số 9)..."
                    className="w-full h-10 px-3 rounded-xl border-2 border-indigo-300 bg-indigo-50/50 font-bold text-slate-800 focus:border-indigo-500 focus:outline-hidden text-xs"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1">
                Số Lượng Câu Hỏi
              </label>
              <select
                value={questionCount}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                className="w-full h-11 px-3.5 rounded-xl border-2 border-slate-200 bg-white font-bold text-slate-800 focus:border-sky-500 focus:outline-hidden text-sm"
              >
                <option value={2}>2 câu kiểm tra nhanh</option>
                <option value={4}>4 câu bài tập chuẩn (Khuyến nghị)</option>
                <option value={8}>8 câu trọn bộ bài giảng</option>
              </select>
            </div>
          </div>

          {/* Error Notice */}
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-900 text-xs font-semibold flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>{errorMsg}</div>
            </div>
          )}

          {/* Generated Questions Preview */}
          {draftQuestions.length > 0 && (
            <div className="mt-3 p-4 rounded-2xl bg-slate-50 border-2 border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-black uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600" /> Đã sinh thành công {draftQuestions.length} câu hỏi hợp lệ:
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                  {draftQuestions.length}/{questionCount} câu
                </span>
              </div>

              {/* 3 Lựa chọn áp dụng câu hỏi AI */}
              {(existingQuestionCount > 0 || isExistingLesson) && (
                <div className="p-3.5 rounded-2xl bg-white border-2 border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-700 block">
                      Chọn phương thức áp dụng vào hệ thống:
                    </span>
                    {isPublishedLesson && (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                        Bài đang phát hành
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    {/* Lựa chọn 1: Tạo bài học mới (mặc định cho bài đã phát hành) */}
                    <label
                      className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                        applyMode === 'create_new'
                          ? 'bg-sky-50/80 border-sky-500 shadow-xs ring-2 ring-sky-200'
                          : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="applyMode"
                        checked={applyMode === 'create_new'}
                        onChange={() => setApplyMode('create_new')}
                        className="mt-1 text-sky-600 focus:ring-sky-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-800">
                            🌱 Tạo bài học mới (Bản nháp độc lập)
                          </span>
                          {isPublishedLesson && (
                            <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                              Mặc định an toàn
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium mt-0.5 leading-relaxed">
                          Tạo bài học nháp mới có ID riêng, tiêu đề theo chủ đề AI (&ldquo;Bài tập Toán: {topic}&rdquo;), chứa đúng <strong>{draftQuestions.length} câu hỏi vừa sinh</strong>. Không làm thay đổi hay ghi đè bài học hoặc phiên bản đang phát hành.
                        </p>
                      </div>
                    </label>

                    {/* Lựa chọn 2: Thay thế câu hỏi hiện tại (Yêu cầu xác nhận) */}
                    <div
                      className={`p-3 rounded-xl border-2 transition-all ${
                        applyMode === 'replace'
                          ? 'bg-rose-50/60 border-rose-400 shadow-xs'
                          : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="radio"
                          name="applyMode"
                          checked={applyMode === 'replace'}
                          onChange={() => setApplyMode('replace')}
                          className="mt-1 text-rose-600 focus:ring-rose-500"
                        />
                        <div className="flex-1">
                          <span className="text-xs font-black text-slate-800">
                            ⚠️ Thay thế câu hỏi hiện tại ({existingQuestionCount} câu)
                          </span>
                          <p className="text-[11px] text-slate-500 font-medium mt-0.5 leading-relaxed">
                            Xóa toàn bộ {existingQuestionCount} câu hỏi cũ trong bài hiện tại và thay thế bằng {draftQuestions.length} câu hỏi mới từ AI.
                          </p>
                        </div>
                      </label>

                      {/* Checkbox bắt buộc xác nhận khi chọn thay thế */}
                      {applyMode === 'replace' && existingQuestionCount > 0 && (
                        <div className="mt-2.5 ml-7 p-2.5 rounded-lg bg-rose-100/80 border border-rose-300">
                          <label className="flex items-start gap-2 cursor-pointer text-xs font-black text-rose-900">
                            <input
                              type="checkbox"
                              checked={confirmReplace}
                              onChange={(e) => setConfirmReplace(e.target.checked)}
                              className="w-4 h-4 mt-0.5 rounded text-rose-600 focus:ring-rose-500"
                            />
                            <span>
                              Tôi xác nhận muốn xóa {existingQuestionCount} câu hỏi hiện tại để thay thế bằng {draftQuestions.length} câu mới này.
                            </span>
                          </label>
                        </div>
                      )}
                    </div>

                    {/* Lựa chọn 3: Thêm vào cuối bài */}
                    <label
                      className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                        applyMode === 'append'
                          ? 'bg-indigo-50/70 border-indigo-500 shadow-xs'
                          : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="applyMode"
                        checked={applyMode === 'append'}
                        onChange={() => setApplyMode('append')}
                        className="mt-1 text-indigo-600 focus:ring-indigo-500"
                      />
                      <div className="flex-1">
                        <span className="text-xs font-black text-slate-800">
                          ➕ Thêm vào cuối bài hiện tại
                        </span>
                        <p className="text-[11px] text-slate-500 font-medium mt-0.5 leading-relaxed">
                          Giữ nguyên {existingQuestionCount} câu hỏi hiện có và nối tiếp thêm {draftQuestions.length} câu hỏi mới vào sau (tổng cộng {existingQuestionCount + draftQuestions.length} câu).
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* Safeguard: Do not overwrite existing lesson title/grade without explicit teacher confirmation */}
              {isExistingLesson && applyMode !== 'create_new' && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 space-y-1.5">
                  <div className="text-xs font-black text-amber-900 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <span>Đang chỉnh sửa bài học hiện có: &ldquo;{currentTitle || 'Bài học đã lưu'}&rdquo;</span>
                  </div>
                  <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                    Hệ thống sẽ <strong>giữ nguyên Tiêu đề bài học, Khối lớp và Tác giả giáo viên</strong> đã thiết lập.
                  </p>
                  <label className="flex items-center gap-2 cursor-pointer pt-1 text-xs font-bold text-slate-800">
                    <input
                      type="checkbox"
                      checked={updateMetadata}
                      onChange={(e) => setUpdateMetadata(e.target.checked)}
                      className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500"
                    />
                    <span>Xác nhận cập nhật Tiêu đề và Khối lớp theo chủ đề AI vừa chọn (&ldquo;{topic}&rdquo;)</span>
                  </label>
                </div>
              )}

              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {draftQuestions.map((q, idx) => {
                  const isGrade1 = Number(grade) === 1;
                  const isGrade1Scope = isGrade1 && isGrade1Weeks1To9({ id: 'ai-draft', grade: 1, title: topic, topic });
                  const qKey = `q-${idx}`;
                  const hKey = `h-${idx}`;
                  const isQPlaying = playingDraftId === qKey;
                  const isHPlaying = playingDraftId === hKey;

                  return (
                    <div key={idx} className="p-3 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-sky-600 font-black">Câu {idx + 1} [{q.interactionType}]</span>
                          {q.visualConfig?.type === 'addition' && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 font-extrabold">
                              ➕ {q.visualConfig.leftCount} + {q.visualConfig.rightCount}
                            </span>
                          )}
                          {q.visualConfig?.type === 'subtraction' && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 font-extrabold">
                              ➖ {q.visualConfig.leftCount} bớt {q.visualConfig.rightCount}
                            </span>
                          )}
                          {q.visualConfig?.type === 'bundles' && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-extrabold">
                              🥢 {q.visualConfig.tens ?? 0} chục + {q.visualConfig.ones ?? 0} que
                            </span>
                          )}
                          {q.visualConfig?.type === 'counters' && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-extrabold">
                              🍎 {q.visualConfig.count ?? 0} đồ vật
                            </span>
                          )}
                          {(q.visualConfig?.type === 'none' || q.visualConfig?.requiresTeacherIllustration) && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 font-extrabold">
                              💡 Cần bổ sung hình
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-emerald-700">Đáp án: <strong>{q.expectedAnswer}</strong></span>
                        </div>
                      </div>

                      <p className="text-slate-800">{q.prompt}</p>

                      {q.ruleHints && q.ruleHints[0] && (
                        <div className="pt-0.5">
                          <p className="text-[11px] text-amber-700 font-medium">
                            💡 Manh mối thám tử: {q.ruleHints[0].hintText}
                          </p>
                        </div>
                      )}

                      {/* Full Audio Management for Grade 1 Questions in AI Draft (Req 2) */}
                      {isGrade1 && (
                        <div className="pt-2 border-t border-slate-100 space-y-2 mt-1">
                          <QuestionAudioControl
                            question={q}
                            questionIndex={idx}
                            type="prompt"
                            isGrade1Scope={isGrade1Scope}
                            onChangeSpokenText={(text) => handleUpdateDraftQuestion(idx, { customSpokenPrompt: text })}
                            onUpdateAudio={(audioUrl, audioHash) => handleUpdateDraftQuestion(idx, { audioUrl, audioHash })}
                            onDeleteAudio={() => handleUpdateDraftQuestion(idx, { audioUrl: '', audioHash: '' })}
                          />
                          <QuestionAudioControl
                            question={q}
                            questionIndex={idx}
                            type="hint"
                            isGrade1Scope={isGrade1Scope}
                            onChangeSpokenText={(text) => handleUpdateDraftQuestion(idx, { customSpokenHint: text })}
                            onUpdateAudio={(hintAudioUrl, hintAudioHash) => handleUpdateDraftQuestion(idx, { hintAudioUrl, hintAudioHash })}
                            onDeleteAudio={() => handleUpdateDraftQuestion(idx, { hintAudioUrl: '', hintAudioHash: '' })}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-3.5 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleSafeClose}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm cursor-pointer transition-colors"
          >
            Đóng
          </button>

          {draftQuestions.length > 0 ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={loading}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                title="Tạo lại bộ câu hỏi khác"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Tạo lại
              </button>

              <button
                type="button"
                onClick={handleApply}
                disabled={applyMode === 'replace' && existingQuestionCount > 0 && !confirmReplace}
                className={`px-5 py-2 rounded-xl text-white font-black text-sm flex items-center gap-2 cursor-pointer shadow-md transition-all active:scale-95 ${
                  applyMode === 'replace' && existingQuestionCount > 0 && !confirmReplace
                    ? 'bg-slate-400 cursor-not-allowed opacity-60 shadow-none'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                <Check className="w-4 h-4" />
                {applyMode === 'create_new'
                  ? `Tạo bài học mới (${draftQuestions.length} câu)`
                  : applyMode === 'replace'
                  ? `Thay thế câu hỏi (${draftQuestions.length} câu)`
                  : `Thêm ${draftQuestions.length} câu vào bài`}
              </button>
            </div>
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

