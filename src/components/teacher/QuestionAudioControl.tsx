import React, { useState, useRef, useEffect } from 'react';
import {
  Volume2,
  VolumeX,
  RefreshCw,
  Upload,
  Trash2,
  Check,
  AlertTriangle,
  Loader2,
  FileAudio,
} from 'lucide-react';
import { Question } from '../../types';
import { getAuthHeaders } from '../../lib/authSession';
import {
  normalizeMathTextForSpeech,
  getAudioHash,
  getQuestionSpokenText,
  getHintSpokenText,
} from '../../lib/vietnameseTts';
import { playVietnameseAudio, stopVietnameseAudio } from '../../lib/vietnameseAudioPlayer';

interface QuestionAudioControlProps {
  question: Question;
  questionIndex: number;
  type: 'prompt' | 'hint';
  isGrade1Scope: boolean;
  onChangeSpokenText: (newText: string) => void;
  onUpdateAudio: (audioUrl: string, audioHash: string) => void;
  onDeleteAudio: () => void;
  disabled?: boolean;
}

export const QuestionAudioControl: React.FC<QuestionAudioControlProps> = ({
  question,
  questionIndex,
  type,
  isGrade1Scope,
  onChangeSpokenText,
  onUpdateAudio,
  onDeleteAudio,
  disabled = false,
}) => {
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const isPrompt = type === 'prompt';
  const label = isPrompt ? 'Âm thanh đọc câu hỏi' : 'Âm thanh đọc gợi ý (khi làm sai)';
  const spokenValue = isPrompt
    ? (question.customSpokenPrompt ?? '')
    : (question.customSpokenHint ?? '');

  const defaultPlaceholder = isPrompt
    ? `Mặc định: ${normalizeMathTextForSpeech(question.prompt, question.options)}`
    : `Mặc định: ${question.ruleHints?.[0]?.hintText ? normalizeMathTextForSpeech(question.ruleHints[0].hintText) : 'Chưa có gợi ý'}`;

  const audioUrl = isPrompt ? question.audioUrl : question.hintAudioUrl;
  const audioHash = isPrompt ? question.audioHash : question.hintAudioHash;
  const hasAudio = Boolean(audioUrl && audioUrl.trim());

  // Expected normalized spoken text based on current inputs
  const expectedSpokenText = isPrompt
    ? getQuestionSpokenText(question)
    : getHintSpokenText(question);
  const expectedHash = getAudioHash(expectedSpokenText);

  // Stale detection: teacher changed text but hasn't re-synthesized audio yet
  const isStale = Boolean(hasAudio && audioHash && audioHash !== expectedHash);

  useEffect(() => {
    return () => {
      if (isPlaying) {
        stopVietnameseAudio();
      }
    };
  }, [isPlaying]);

  // 1. Play / Stop preview
  const handleTogglePlay = () => {
    if (isPlaying) {
      stopVietnameseAudio();
      setIsPlaying(false);
      return;
    }

    if (!hasAudio) {
      setActionError('Chưa có tệp âm thanh để nghe thử. Vui lòng bấm "Tạo âm thanh" hoặc tải tệp lên trước.');
      return;
    }

    setActionError(null);
    setIsPlaying(true);

    const playUrl = audioUrl
      ? (audioUrl.includes('?') ? `${audioUrl}&t=${Date.now()}` : `${audioUrl}?t=${Date.now()}`)
      : undefined;

    playVietnameseAudio(
      playUrl,
      undefined,
      () => setIsPlaying(true),
      () => setIsPlaying(false),
      (err) => {
        setIsPlaying(false);
        setActionError('Không thể phát âm thanh: tệp không tồn tại hoặc lỗi kết nối.');
      }
    );
  };

  // 2. Synthesize audio on demand or force re-synthesize
  const handleSynthesize = async () => {
    if (disabled || isSynthesizing) return;
    setActionError(null);
    setIsSynthesizing(true);
    stopVietnameseAudio();
    setIsPlaying(false);

    try {
      const res = await fetch('/api/audio/synthesize', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          text: expectedSpokenText,
          type,
          force: true, // Bypass existing audio cache (Req 2.2)
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Không thể tạo âm thanh. Vui lòng thử lại.');
      }

      // Add cache buster timestamp to audio URL so browser never plays old cached recording
      const freshUrl = `${data.audioUrl}?t=${Date.now()}`;
      onUpdateAudio(freshUrl, data.hash);
    } catch (err: any) {
      console.error('Synthesize audio error:', err);
      setActionError(err.message || 'Lỗi khi tạo âm thanh.');
    } finally {
      setIsSynthesizing(false);
    }
  };

  // 3. Upload custom audio file (MP3/WAV/M4A/OGG, <= 5MB)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setActionError(null);

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setActionError('Dung lượng tệp âm thanh không được vượt quá 5MB.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Validate format
    const lowerName = file.name.toLowerCase();
    const isValidFormat =
      lowerName.endsWith('.mp3') ||
      lowerName.endsWith('.wav') ||
      lowerName.endsWith('.m4a') ||
      lowerName.endsWith('.ogg');

    if (!isValidFormat) {
      setActionError('Vui lòng chọn tệp âm thanh định dạng .mp3, .wav, .m4a hoặc .ogg.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsUploading(true);
    stopVietnameseAudio();
    setIsPlaying(false);

    try {
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await fetch('/api/audio/upload', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          base64Data,
          filename: file.name,
          mimeType: file.type || 'audio/mpeg',
          type,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Không thể tải tệp âm thanh lên.');
      }

      onUpdateAudio(data.audioUrl, data.hash);
    } catch (err: any) {
      console.error('Upload audio error:', err);
      setActionError(err.message || 'Lỗi khi tải tệp âm thanh lên.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // 4. Confirm delete audio
  const handleConfirmDelete = () => {
    stopVietnameseAudio();
    setIsPlaying(false);
    onDeleteAudio();
    setShowDeleteConfirm(false);
  };

  return (
    <div
      className={`p-3 rounded-2xl border transition-all ${
        isPrompt
          ? 'bg-sky-50/70 border-sky-200'
          : 'bg-amber-50/70 border-amber-200'
      }`}
    >
      {/* Header Row: Label & Status Badges */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <label
          className={`text-xs font-black flex items-center gap-1.5 ${
            isPrompt ? 'text-sky-900' : 'text-amber-950'
          }`}
        >
          <Volume2 className={`w-3.5 h-3.5 ${isPrompt ? 'text-sky-600' : 'text-amber-600'}`} />
          <span>{label}</span>
        </label>

        <div className="flex items-center gap-1.5 flex-wrap">
          {hasAudio ? (
            isStale ? (
              <span
                className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1"
                title="Lời đọc đã thay đổi so với bản ghi âm hiện tại"
              >
                <AlertTriangle className="w-3 h-3 text-amber-600" />
                <span>Chưa tạo lại âm thanh mới</span>
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-600" />
                <span>Đã có âm thanh</span>
              </span>
            )
          ) : (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300">
              Chưa có âm thanh
            </span>
          )}

          {isGrade1Scope && (
            <span className="text-[10px] font-bold text-slate-500">
              (Bắt buộc cho Lớp 1)
            </span>
          )}
        </div>
      </div>

      {/* Spoken Text Edit Input */}
      <div className="mb-2">
        <input
          type="text"
          disabled={disabled || isSynthesizing || isUploading}
          value={spokenValue}
          onChange={(e) => onChangeSpokenText(e.target.value)}
          placeholder={defaultPlaceholder}
          className="w-full h-8 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:border-sky-500 focus:outline-hidden"
        />
        <p className="text-[10px] text-slate-400 mt-1">
          {isPrompt
            ? 'Lời đọc phát cho học sinh khi xem câu hỏi. Thầy/Cô có thể tùy chỉnh câu chữ theo ý muốn.'
            : 'Lời đọc phát cho học sinh khi làm sai câu hỏi. Hướng dẫn cách tư duy, tuyệt đối không lộ kết quả.'}
        </p>
      </div>

      {/* Action Buttons Toolbar (Req 2.1 - 2.5) */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-200/60">
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Preview Button */}
          <button
            type="button"
            disabled={!hasAudio || isSynthesizing || isUploading}
            onClick={handleTogglePlay}
            className={`h-7 px-2.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all border shadow-2xs ${
              isPlaying
                ? 'bg-amber-300 text-amber-950 border-amber-400 ring-2 ring-amber-300 animate-pulse'
                : hasAudio
                ? isPrompt
                  ? 'bg-white hover:bg-sky-100 text-sky-800 border-sky-300'
                  : 'bg-white hover:bg-amber-100 text-amber-900 border-amber-300'
                : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
            }`}
            title="Nghe thử âm thanh sẽ phát cho học sinh"
          >
            {isPlaying ? (
              <>
                <VolumeX className="w-3.5 h-3.5" />
                <span>Dừng nghe</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5" />
                <span>Nghe thử</span>
              </>
            )}
          </button>

          {/* Synthesize / Re-synthesize Button */}
          <button
            type="button"
            disabled={disabled || isSynthesizing || isUploading}
            onClick={handleSynthesize}
            className={`h-7 px-2.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all border shadow-2xs ${
              isStale
                ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600 animate-pulse'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
            }`}
            title={hasAudio ? 'Tạo lại âm thanh từ nội dung mới' : 'Tạo âm thanh từ nội dung'}
          >
            {isSynthesizing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-600" />
                <span>Đang tạo âm thanh...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-3 h-3 text-sky-600" />
                <span>{hasAudio ? 'Tạo lại âm thanh' : 'Tạo âm thanh'}</span>
              </>
            )}
          </button>

          {/* Upload Custom File Button */}
          <button
            type="button"
            disabled={disabled || isSynthesizing || isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="h-7 px-2.5 rounded-lg text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs"
            title="Tải lên tệp âm thanh có sẵn (.mp3, .wav, .m4a, .ogg <= 5MB)"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                <span>Đang tải tệp...</span>
              </>
            ) : (
              <>
                <Upload className="w-3 h-3 text-emerald-600" />
                <span>{hasAudio ? 'Thay thế bằng tệp...' : 'Tải lên tệp...'}</span>
              </>
            )}
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".mp3,.wav,.m4a,.ogg,audio/*"
            className="hidden"
          />
        </div>

        {/* Delete Audio Button (Req 2.3) */}
        {hasAudio && (
          <button
            type="button"
            disabled={disabled || isSynthesizing || isUploading}
            onClick={() => setShowDeleteConfirm(true)}
            className="h-7 px-2 rounded-lg text-xs font-bold text-rose-600 hover:text-rose-800 hover:bg-rose-50 border border-rose-200 hover:border-rose-300 flex items-center gap-1 cursor-pointer transition-all"
            title="Xóa âm thanh này khỏi bản nháp"
          >
            <Trash2 className="w-3 h-3" />
            <span>Xóa âm thanh</span>
          </button>
        )}
      </div>

      {/* Inline Confirmation for Delete (Req 2.3) */}
      {showDeleteConfirm && (
        <div className="mt-2.5 p-2.5 rounded-xl bg-rose-50 border-2 border-rose-300 text-xs animate-in fade-in duration-150">
          <div className="flex items-start gap-2 text-rose-900 font-bold mb-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>
              Xác nhận xóa {isPrompt ? 'âm thanh câu hỏi' : 'âm thanh gợi ý'} của Câu {questionIndex + 1}?
              (Tệp âm thanh vẫn được lưu bền vững cho các bản phát hành cũ nếu có).
            </span>
          </div>
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(false)}
              className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-black cursor-pointer shadow-xs"
            >
              Xác nhận xóa
            </button>
          </div>
        </div>
      )}

      {/* Error Notice */}
      {actionError && (
        <div className="mt-2 p-2 rounded-lg bg-rose-100 border border-rose-300 text-rose-900 text-xs font-semibold flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}
    </div>
  );
};
