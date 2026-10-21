import React, { useState } from 'react';
import {
  X,
  User,
  Lock,
  Mail,
  Shield,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  Building,
  Key,
  ExternalLink,
  Check,
} from 'lucide-react';
import { UserProfile } from '../../types';
import { changePassword, updateStoredUser } from '../../lib/authSession';
import { dataService } from '../../lib/dataService';

interface TeacherAccountModalProps {
  isOpen: boolean;
  currentUser: UserProfile;
  managedClassesCount: number;
  onClose: () => void;
  onProfileUpdated: (updatedUser: UserProfile) => void;
}

export const TeacherAccountModal: React.FC<TeacherAccountModalProps> = ({
  isOpen,
  currentUser,
  managedClassesCount,
  onClose,
  onProfileUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');

  // Profile Edit State
  const [displayName, setDisplayName] = useState(currentUser.displayName || '');
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  if (!isOpen) return null;

  const isGoogleAccount =
    currentUser.authProvider === 'google' ||
    Boolean(currentUser.email?.endsWith('@gmail.com') && currentUser.id?.length > 25);

  // Password Strength Calculation
  const hasMinLength = newPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasNumberOrSymbol = /[0-9\W]/.test(newPassword);
  const isPasswordStrong = hasMinLength && hasUpper && hasLower && hasNumberOrSymbol;

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);

    if (!displayName.trim() || displayName.trim().length < 2) {
      setProfileMsg({ text: 'Họ tên giáo viên phải có ít nhất 2 ký tự.', type: 'error' });
      return;
    }

    setIsUpdatingProfile(true);
    try {
      await dataService.updateTeacherProfile(displayName.trim(), phone.trim());
      const updated = updateStoredUser({
        displayName: displayName.trim(),
        name: displayName.trim(),
        phone: phone.trim(),
      });
      if (updated) {
        onProfileUpdated(updated);
      }
      setProfileMsg({ text: 'Cập nhật thông tin thành công!', type: 'success' });
    } catch (err: any) {
      setProfileMsg({ text: err.message || 'Lỗi cập nhật hồ sơ.', type: 'error' });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (isGoogleAccount) {
      setPasswordMsg({
        text: 'Tài khoản đăng nhập bằng Google không thể đổi mật khẩu trong ứng dụng.',
        type: 'error',
      });
      return;
    }

    if (!currentPassword.trim() || !newPassword.trim()) {
      setPasswordMsg({ text: 'Vui lòng điền đầy đủ mật khẩu hiện tại và mật khẩu mới.', type: 'error' });
      return;
    }

    if (newPassword === currentPassword) {
      setPasswordMsg({ text: 'Mật khẩu mới không được trùng với mật khẩu hiện tại.', type: 'error' });
      return;
    }

    if (!isPasswordStrong) {
      setPasswordMsg({
        text: 'Mật khẩu mới phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và số hoặc ký tự đặc biệt.',
        type: 'error',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ text: 'Mật khẩu xác nhận không khớp.', type: 'error' });
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await changePassword(currentPassword.trim(), newPassword.trim());
      setPasswordMsg({
        text: res.message || 'Đổi mật khẩu thành công! Các phiên cũ đã được thu hồi.',
        type: 'success',
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordMsg({ text: err.message || 'Lỗi đổi mật khẩu.', type: 'error' });
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white rounded-3xl border-3 border-sky-300 shadow-2xl p-6 sm:p-7 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500 text-white flex items-center justify-center font-black shadow-xs">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-800">Tài Khoản Giáo Viên</h3>
              <p className="text-xs font-semibold text-slate-500">
                {currentUser.displayName} • {currentUser.email || 'Hệ thống nội bộ'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2 mb-4 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'profile'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <User className="w-3.5 h-3.5" /> Thông tin cá nhân
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('password')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'password'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Key className="w-3.5 h-3.5" /> Đổi mật khẩu
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto pr-1">
          {activeTab === 'profile' && (
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              {profileMsg && (
                <div
                  className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                    profileMsg.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  {profileMsg.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{profileMsg.text}</span>
                </div>
              )}

              {/* Account Meta Badges */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-500">Loại tài khoản:</span>
                  <span className="font-black text-sky-700 uppercase">
                    {currentUser.role === 'admin' ? 'Quản Trị Viên' : 'Giáo Viên'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-500">Phương thức đăng nhập:</span>
                  <span className="font-bold text-slate-800">
                    {isGoogleAccount ? 'Google OAuth' : 'Mật khẩu nội bộ'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-500">Lớp phụ trách:</span>
                  <span className="font-bold text-slate-800">{managedClassesCount} lớp</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
                  Họ và tên giáo viên <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Nhập họ tên giáo viên"
                  required
                  className="w-full h-11 px-3.5 rounded-xl border-2 border-slate-200 bg-white font-bold text-slate-800 text-sm focus:border-sky-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={currentUser.email || ''}
                  disabled
                  className="w-full h-11 px-3.5 rounded-xl border-2 border-slate-100 bg-slate-50 font-bold text-slate-500 text-sm cursor-not-allowed"
                />
                <span className="text-[11px] text-slate-400 font-medium mt-1 block">
                  Email dùng để nhận thông báo và làm tên đăng nhập chính thức.
                </span>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
                  Số điện thoại liên hệ
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0912 345 678"
                  className="w-full h-11 px-3.5 rounded-xl border-2 border-slate-200 bg-white font-bold text-slate-800 text-sm focus:border-sky-500 focus:outline-hidden"
                />
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={isUpdatingProfile}
                  className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 active:scale-95 text-white text-sm font-black flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all disabled:opacity-50"
                >
                  {isUpdatingProfile ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Đang cập nhật...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" /> Lưu thay đổi hồ sơ
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'password' && (
            <div className="space-y-4">
              {isGoogleAccount ? (
                /* Google Account notice */
                <div className="p-5 rounded-2xl bg-amber-50 border-2 border-amber-200 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-200 text-amber-900 mx-auto flex items-center justify-center font-black">
                    <Shield className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-amber-900">
                      Tài khoản đăng nhập bằng Google
                    </h4>
                    <p className="text-xs text-amber-800 font-medium mt-1 leading-relaxed">
                      Bạn đang sử dụng tài khoản Google để đăng nhập vào Thám Tử Toán Nhí. Mật khẩu của bạn được bảo mật bởi hạ tầng Google và không thể thay đổi tại đây.
                    </p>
                  </div>
                  <a
                    href="https://myaccount.google.com/security"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black transition-colors"
                  >
                    Quản lý tài khoản Google <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              ) : (
                /* Internal Password Form */
                <form onSubmit={handleChangePassword} className="space-y-4">
                  {passwordMsg && (
                    <div
                      className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                        passwordMsg.type === 'success'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-rose-50 text-rose-800 border border-rose-200'
                      }`}
                    >
                      {passwordMsg.type === 'success' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      )}
                      <span>{passwordMsg.text}</span>
                    </div>
                  )}

                  {/* Current Password */}
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
                      Mật khẩu hiện tại <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrent ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Nhập mật khẩu đang dùng"
                        required
                        className="w-full h-11 pl-3.5 pr-10 rounded-xl border-2 border-slate-200 bg-white font-bold text-slate-800 text-sm focus:border-sky-500 focus:outline-hidden"
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

                  {/* New Password */}
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
                      Mật khẩu mới <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showNew ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Tối thiểu 8 ký tự, có chữ hoa, số"
                        required
                        className="w-full h-11 pl-3.5 pr-10 rounded-xl border-2 border-slate-200 bg-white font-bold text-slate-800 text-sm focus:border-sky-500 focus:outline-hidden"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNew(!showNew)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Password Strength Checklist */}
                    <div className="mt-2 p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-xs">
                      <div className="font-bold text-slate-600 mb-1">Yêu cầu độ mạnh mật khẩu:</div>
                      <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                        <Check className="w-3.5 h-3.5" /> Tối thiểu 8 ký tự
                      </div>
                      <div className={`flex items-center gap-1.5 ${hasUpper ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                        <Check className="w-3.5 h-3.5" /> Có ít nhất 1 chữ hoa (A-Z)
                      </div>
                      <div className={`flex items-center gap-1.5 ${hasLower ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                        <Check className="w-3.5 h-3.5" /> Có ít nhất 1 chữ thường (a-z)
                      </div>
                      <div className={`flex items-center gap-1.5 ${hasNumberOrSymbol ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                        <Check className="w-3.5 h-3.5" /> Có ít nhất 1 chữ số hoặc ký tự đặc biệt
                      </div>
                    </div>
                  </div>

                  {/* Confirm New Password */}
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
                      Xác nhận mật khẩu mới <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirm ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Nhập lại mật khẩu mới"
                        required
                        className="w-full h-11 pl-3.5 pr-10 rounded-xl border-2 border-slate-200 bg-white font-bold text-slate-800 text-sm focus:border-sky-500 focus:outline-hidden"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {confirmPassword && newPassword !== confirmPassword && (
                      <span className="text-xs text-rose-600 font-bold mt-1 block">
                        Mật khẩu xác nhận chưa khớp.
                      </span>
                    )}
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isChangingPassword || !isPasswordStrong || newPassword !== confirmPassword}
                      className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 active:scale-95 text-white text-sm font-black flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all disabled:opacity-50"
                    >
                      {isChangingPassword ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Đang cập nhật mật khẩu...
                        </>
                      ) : (
                        <>
                          <Key className="w-4 h-4" /> Cập nhật mật khẩu mới
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
