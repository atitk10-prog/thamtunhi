import React, { useState } from 'react';
import { X, Key, CheckCircle2, AlertCircle, Loader2, Eye, EyeOff, Sparkles } from 'lucide-react';
import { FoxDetective } from '../mascot/FoxDetective';
import { changePassword } from '../../lib/authSession';

interface StudentPinModalProps {
  isOpen: boolean;
  studentName: string;
  studentCode: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const StudentPinModal: React.FC<StudentPinModalProps> = ({
  isOpen,
  studentName,
  studentCode,
  onClose,
  onSuccess,
}) => {
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanCurrent = currentPin.trim();
    const cleanNew = newPin.trim();
    const cleanConfirm = confirmPin.trim();

    if (!cleanCurrent || !cleanNew) {
      setErrorMsg('Em hãy nhập đầy đủ mã bí mật hiện tại và mã mới nhé!');
      return;
    }

    if (cleanNew.length < 4 || cleanNew.length > 20) {
      setErrorMsg('Mã bí mật mới phải từ 4 đến 20 số hoặc chữ em nhé!');
      return;
    }

    if (cleanNew === cleanCurrent) {
      setErrorMsg('Mã mới không được trùng với mã hiện tại em nhé!');
      return;
    }

    if (cleanNew !== cleanConfirm) {
      setErrorMsg('Mã bí mật xác nhận chưa khớp, em hãy kiểm tra lại!');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await changePassword(cleanCurrent, cleanNew);
      setSuccessMsg(res.message || 'Chúc mừng em đã đổi mã bí mật thành công!');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Mã hiện tại chưa đúng hoặc có lỗi xảy ra.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-3xl border-3 border-sky-300 shadow-2xl p-6 sm:p-7 flex flex-col relative overflow-hidden">
        {/* Header with Mascot */}
        <div className="flex items-start justify-between mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <FoxDetective mood={successMsg ? 'happy' : 'idle'} size="sm" />
            <div>
              <span className="text-[10px] uppercase font-black tracking-wider text-sky-600 block">
                Bảo vệ tài khoản thám tử
              </span>
              <h3 className="text-lg font-black text-slate-800">Đổi Mã Bí Mật Của Em</h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Success Alert */}
        {successMsg && (
          <div className="mb-4 p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-300 text-emerald-900 text-sm font-black flex items-center gap-2.5 animate-bounce">
            <Sparkles className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-3 bg-sky-50/70 rounded-2xl border border-sky-200 text-xs font-bold text-sky-900 flex items-center justify-between">
            <span>Học sinh: {studentName}</span>
            <span className="font-mono text-sky-700 bg-white px-2 py-0.5 rounded-lg border border-sky-200">
              {studentCode}
            </span>
          </div>

          {/* Current Secret */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
              Mã bí mật đang dùng
            </label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPin}
                onChange={(e) => setCurrentPin(e.target.value)}
                placeholder="Nhập mã hiện tại"
                required
                className="w-full h-11 pl-3.5 pr-10 rounded-2xl border-2 border-slate-200 bg-white font-bold text-slate-800 text-sm focus:border-sky-500 focus:outline-hidden"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* New Secret */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
              Mã bí mật mới (4 - 20 số hoặc chữ)
            </label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                placeholder="Ví dụ: 123456 hoặc toannhi"
                required
                className="w-full h-11 pl-3.5 pr-10 rounded-2xl border-2 border-slate-200 bg-white font-bold text-slate-800 text-sm focus:border-sky-500 focus:outline-hidden"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <span className="text-[11px] text-slate-500 font-semibold mt-1 block">
              💡 Gợi ý: Em hãy chọn mã dễ nhớ và đừng chia sẻ cho người khác nhé!
            </span>
          </div>

          {/* Confirm Secret */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
              Nhập lại mã bí mật mới
            </label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
                placeholder="Nhập lại mã mới để kiểm tra"
                required
                className="w-full h-11 pl-3.5 pr-10 rounded-2xl border-2 border-slate-200 bg-white font-bold text-slate-800 text-sm focus:border-sky-500 focus:outline-hidden"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !currentPin || !newPin || newPin !== confirmPin}
              className="px-6 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-500 active:scale-95 text-slate-900 text-sm font-black flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50 transition-all ring-2 ring-amber-300"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Đang lưu...
                </>
              ) : (
                <>
                  <Key className="w-4 h-4" /> Lưu mã mới
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
