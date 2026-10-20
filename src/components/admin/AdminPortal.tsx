import React, { useState, useEffect, useMemo } from 'react';
import {
  Shield,
  Activity,
  Users,
  School,
  Database,
  Calendar,
  BookOpen,
  BarChart3,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  Lock,
  Unlock,
  Plus,
  Search,
  Filter,
  Download,
  CheckCircle,
  AlertTriangle,
  Info,
  Clock,
  UserCheck,
  UserX,
  Key,
  RefreshCw,
  Eye,
  ChevronRight,
  Trash2
} from 'lucide-react';
import { dataService } from '../../lib/dataService';
import {
  UserProfile,
  Classroom,
  AcademicYear,
  AuditLog,
  SystemHealth,
  UserAccountStatus,
  AdminTab,
  Lesson,
  Assignment,
  Attempt
} from '../../types';
import { FoxDetective } from '../mascot/FoxDetective';

interface AdminPortalProps {
  currentUser: UserProfile;
  onLogout: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  currentUser,
  onLogout,
}) => {
  // 9 Official Navigation Tabs
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Core Data State
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [classes, setClasses] = useState<Classroom[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [healthInfo, setHealthInfo] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // User Management State
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'teacher' | 'student' | 'admin'>('all');
  const [userClassFilter, setUserClassFilter] = useState<string>('all');
  const [userStatusFilter, setUserStatusFilter] = useState<'all' | 'active' | 'locked'>('all');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [auditMode, setAuditMode] = useState(false); // Only displays simulation tags when explicitly turned on by authorized admin

  // Modal States
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [newRole, setNewRole] = useState<'teacher' | 'student'>('teacher');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newStudentCode, setNewStudentCode] = useState('');
  const [newClassId, setNewClassId] = useState('class-1a');
  const [newAccessSecret, setNewAccessSecret] = useState('matkhau123');

  const [selectedUserDetail, setSelectedUserDetail] = useState<UserProfile | null>(null);

  const [resetPasswordUser, setResetPasswordUser] = useState<UserProfile | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');

  const [assigningClass, setAssigningClass] = useState<Classroom | null>(null);
  const [selectedTeacherForClass, setSelectedTeacherForClass] = useState('');

  const [isCreateYearOpen, setIsCreateYearOpen] = useState(false);
  const [newYearName, setNewYearName] = useState('');
  const [newYearIsCurrent, setNewYearIsCurrent] = useState(false);

  const [selectedClassDetail, setSelectedClassDetail] = useState<Classroom | null>(null);

  // Audit Logs Filter State
  const [auditActionFilter, setAuditActionFilter] = useState<string>('all');
  const [auditSearchQuery, setAuditSearchQuery] = useState('');

  useEffect(() => {
    fetchSystemData();
  }, []);

  const fetchSystemData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const overview = await dataService.fetchAdminOverview();
      const uList: UserProfile[] = overview.users || [];
      const cList: Classroom[] = overview.classes || [];
      const yList: AcademicYear[] = overview.academicYears || [];
      const lList: Lesson[] = overview.lessons || [];
      const aList: Assignment[] = overview.assignments || [];
      const attList: Attempt[] = overview.attempts || [];
      const logList: AuditLog[] = overview.auditLogs || [];

      setAllUsers(uList);
      setClasses(cList);
      setAcademicYears(yList);
      setLessons(lList);
      setAssignments(aList);
      setAttempts(attList);
      setAuditLogs(logList.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || '')));

      // Probe Health API
      try {
        const hRes = await fetch('/api/health');
        if (hRes.ok) {
          const hData = await hRes.json();
          setHealthInfo(hData);
        } else {
          setHealthInfo({
            status: 'degraded',
            firebaseProjectId: 'indigo-lotus-2nmq3',
            databaseId: 'ai-studio-thmttonnh-6977e812-1e0d-459b-9789-d64af1d047b2',
            authConnected: false,
            geminiConfigured: false,
            buildVersion: '1.1.0-prod',
            environmentTag: 'production',
            demoStats: {
              teachersCount: uList.filter(u => u.role === 'teacher').length,
              classesCount: cList.length,
              studentsCount: uList.filter(u => u.role === 'student').length,
              lessonsCount: lList.length,
              assignmentsCount: aList.length,
              attemptsCount: attList.length,
            },
            warnings: ['Không thể kết nối API Health Backend (/api/health). Vui lòng kiểm tra Vercel Functions.'],
          });
        }
      } catch {
        setHealthInfo({
          status: 'degraded',
          firebaseProjectId: 'indigo-lotus-2nmq3',
          databaseId: 'ai-studio-thmttonnh-6977e812-1e0d-459b-9789-d64af1d047b2',
          authConnected: false,
          geminiConfigured: false,
          buildVersion: '1.1.0-prod',
          environmentTag: 'production',
          demoStats: {
            teachersCount: uList.filter(u => u.role === 'teacher').length,
            classesCount: cList.length,
            studentsCount: uList.filter(u => u.role === 'student').length,
            lessonsCount: lList.length,
            assignmentsCount: aList.length,
            attemptsCount: attList.length,
          },
          warnings: ['Lỗi kết nối mạng tới máy chủ API.'],
        });
      }
    } catch (err) {
      console.error('Fetch admin overview error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Helper check status
  const isUserLocked = (u: UserProfile): boolean => u.status === 'locked' || u.status === 'inactive';

  // Computed metrics
  const activeUsers = useMemo(() => allUsers.filter(u => !u.isDeleted), [allUsers]);
  const teachers = useMemo(() => activeUsers.filter(u => u.role === 'teacher'), [activeUsers]);
  const students = useMemo(() => activeUsers.filter(u => u.role === 'student'), [activeUsers]);
  const admins = useMemo(() => activeUsers.filter(u => u.role === 'admin'), [activeUsers]);

  const realAttempts = useMemo(() => attempts.filter(a => a.dataOrigin === 'real'), [attempts]);
  const simulationAttempts = useMemo(() => attempts.filter(a => a.dataOrigin === 'simulation'), [attempts]);

  const currentAcademicYear = useMemo(() => academicYears.find(y => y.isCurrent) || academicYears[0], [academicYears]);

  // Class student count calculated live from active student profiles
  const getClassStudentCount = (classId: string): number => {
    return students.filter(s => s.classId === classId).length;
  };

  // Filtered Users List
  const filteredUsers = useMemo(() => {
    return activeUsers.filter(user => {
      // Role filter
      if (userRoleFilter !== 'all' && user.role !== userRoleFilter) return false;
      // Class filter
      if (userClassFilter !== 'all' && user.classId !== userClassFilter) return false;
      // Status filter
      if (userStatusFilter === 'active' && isUserLocked(user)) return false;
      if (userStatusFilter === 'locked' && !isUserLocked(user)) return false;
      // Search query
      if (userSearchQuery.trim()) {
        const q = userSearchQuery.trim().toLowerCase();
        const matchName = (user.displayName || '').toLowerCase().includes(q);
        const matchEmail = (user.email || '').toLowerCase().includes(q);
        const matchCode = (user.studentCode || '').toLowerCase().includes(q);
        if (!matchName && !matchEmail && !matchCode) return false;
      }
      return true;
    });
  }, [activeUsers, userRoleFilter, userClassFilter, userStatusFilter, userSearchQuery]);

  // Filtered Audit Logs
  const filteredAuditLogs = useMemo(() => {
    return auditLogs.filter(log => {
      if (auditActionFilter !== 'all' && log.action !== auditActionFilter) return false;
      if (auditSearchQuery.trim()) {
        const q = auditSearchQuery.trim().toLowerCase();
        const matchAction = (log.action || '').toLowerCase().includes(q);
        const matchActor = (log.actorName || log.performedBy || log.actorId || '').toLowerCase().includes(q);
        const matchDetails = (log.details || '').toLowerCase().includes(q);
        const matchTarget = (log.targetName || log.targetId || '').toLowerCase().includes(q);
        if (!matchAction && !matchActor && !matchDetails && !matchTarget) return false;
      }
      return true;
    });
  }, [auditLogs, auditActionFilter, auditSearchQuery]);

  // Format Vietnam Date/Time
  const formatVietnamDateTime = (isoString?: string): string => {
    if (!isoString) return 'Chưa ghi nhận';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;
      return d.toLocaleString('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  // Humanize Action for Audit Log
  const humanizeAction = (action: string): { label: string; color: string } => {
    switch (action) {
      case 'CREATE_USER':
      case 'CREATE_STUDENT':
        return { label: 'Tạo tài khoản mới', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
      case 'LOCK_USER':
        return { label: 'Khóa tài khoản', color: 'bg-rose-50 text-rose-800 border-rose-200' };
      case 'UNLOCK_USER':
        return { label: 'Mở khóa tài khoản', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
      case 'UPDATE_USER':
      case 'UPDATE_STUDENT':
        return { label: 'Cập nhật thông tin', color: 'bg-sky-50 text-sky-800 border-sky-200' };
      case 'DELETE_USER':
        return { label: 'Xóa tài khoản', color: 'bg-rose-50 text-rose-800 border-rose-200' };
      case 'RESET_PASSWORD':
        return { label: 'Đặt lại mật khẩu', color: 'bg-amber-50 text-amber-800 border-amber-200' };
      case 'ASSIGN_TEACHER_TO_CLASS':
        return { label: 'Phân công giáo viên', color: 'bg-indigo-50 text-indigo-800 border-indigo-200' };
      case 'CREATE_ACADEMIC_YEAR':
        return { label: 'Tạo năm học mới', color: 'bg-purple-50 text-purple-800 border-purple-200' };
      case 'UPDATE_ACADEMIC_YEAR':
        return { label: 'Cập nhật năm học', color: 'bg-purple-50 text-purple-800 border-purple-200' };
      case 'EXPORT_SYSTEM_DATA':
        return { label: 'Xuất dữ liệu an toàn', color: 'bg-teal-50 text-teal-800 border-teal-200' };
      case 'GOOGLE_LOGIN_CREATE':
        return { label: 'Đăng nhập Google', color: 'bg-blue-50 text-blue-800 border-blue-200' };
      default:
        return { label: action || 'Thao tác hệ thống', color: 'bg-slate-50 text-slate-800 border-slate-200' };
    }
  };

  // Handlers for User CRUD
  const handleToggleLockUser = async (user: UserProfile) => {
    const isLocked = isUserLocked(user);
    const newStatus: UserAccountStatus = isLocked ? 'active' : 'locked';
    const actionLabel = isLocked ? 'Mở khóa' : 'Khóa';

    // Protection: Admin cannot self-lock and cannot lock the last admin
    if (user.role === 'admin' && !isLocked) {
      if (user.id === currentUser.id || user.id === 'admin-root') {
        alert('Bảo vệ an toàn: Không thể tự khóa tài khoản Quản trị viên đang đăng nhập.');
        return;
      }
      const activeAdmins = allUsers.filter(u => u.role === 'admin' && !isUserLocked(u) && !u.isDeleted);
      if (activeAdmins.length <= 1) {
        alert('Bảo vệ an toàn: Không thể khóa tài khoản Quản trị viên cuối cùng của hệ thống.');
        return;
      }
    }

    if (!confirm(`XÁC NHẬN: Bạn có chắc chắn muốn ${actionLabel} tài khoản "${user.displayName || user.studentCode}"?`)) {
      return;
    }

    try {
      await dataService.adminUpdateUser(user.id, { status: newStatus });
      alert(`Đã ${actionLabel.toLowerCase()} thành công tài khoản "${user.displayName || user.studentCode}".`);
      fetchSystemData();
    } catch (err: any) {
      console.error('Toggle lock error:', err);
      alert(err.message || `Lỗi ${actionLabel.toLowerCase()} tài khoản.`);
    }
  };

  const handleCreateUser = async () => {
    if (!newDisplayName.trim()) {
      alert('Vui lòng nhập họ và tên.');
      return;
    }

    try {
      const newUid = `user-${Date.now()}`;
      const newUser: UserProfile = {
        id: newUid,
        role: newRole,
        displayName: newDisplayName.trim(),
        email: newRole === 'teacher' ? (newEmail.trim() || `${newUid}@thamtutoannhi.edu.vn`) : undefined,
        studentCode: newRole === 'student' ? (newStudentCode.trim().toUpperCase() || `HS${Date.now().toString().slice(-4)}`) : undefined,
        classId: newRole === 'student' ? newClassId : undefined,
        className: newRole === 'student' ? classes.find(c => c.id === newClassId)?.name || '1A' : undefined,
        grade: newRole === 'student' ? (classes.find(c => c.id === newClassId)?.grade || 1) : undefined,
        status: 'active',
        createdAt: new Date().toISOString(),
        dataOrigin: 'real',
        environmentTag: 'production',
      };

      await dataService.adminCreateUser(newUser);
      alert(`Đã tạo thành công tài khoản ${newRole === 'teacher' ? 'Giáo viên' : 'Học sinh'}: ${newDisplayName}`);
      setIsCreateUserOpen(false);
      setNewDisplayName('');
      setNewEmail('');
      setNewStudentCode('');
      fetchSystemData();
    } catch (err: any) {
      console.error('Create user error:', err);
      alert(err.message || 'Lỗi tạo tài khoản.');
    }
  };

  const handleDeleteUser = async (user: UserProfile) => {
    if (user.id === currentUser.id || user.id === 'admin-root') {
      alert('Bảo vệ an toàn: Không thể xóa tài khoản Quản trị viên đang đăng nhập.');
      return;
    }
    if (!confirm(`XÁC NHẬN: Bạn có chắc chắn muốn lưu trữ/xóa tài khoản "${user.displayName || user.studentCode}"?`)) {
      return;
    }
    try {
      await dataService.adminDeleteUser(user.id);
      alert(`Đã hoàn tất lưu trữ tài khoản "${user.displayName || user.studentCode}".`);
      fetchSystemData();
    } catch (err: any) {
      console.error('Delete user error:', err);
      alert(err.message || 'Lỗi xóa tài khoản.');
    }
  };

  const handleResetPassword = async () => {
    if (!resetPasswordUser) return;
    if (!newPasswordInput || newPasswordInput.trim().length < 6) {
      alert('Mật khẩu mới phải có tối thiểu 6 ký tự.');
      return;
    }

    try {
      await dataService.adminResetPassword(resetPasswordUser.id, newPasswordInput.trim());
      alert(`Đã đặt lại mật khẩu thành công cho "${resetPasswordUser.displayName || resetPasswordUser.studentCode}".`);
      setResetPasswordUser(null);
      setNewPasswordInput('');
      fetchSystemData();
    } catch (err: any) {
      alert(err.message || 'Lỗi đặt lại mật khẩu.');
    }
  };

  const handleAssignTeacher = async () => {
    if (!assigningClass || !selectedTeacherForClass) {
      alert('Vui lòng chọn giáo viên phụ trách.');
      return;
    }

    try {
      await dataService.adminAssignTeacherToClass(assigningClass.id, selectedTeacherForClass);
      alert(`Đã phân công giáo viên cho lớp ${assigningClass.name} thành công.`);
      setAssigningClass(null);
      setSelectedTeacherForClass('');
      fetchSystemData();
    } catch (err: any) {
      alert(err.message || 'Lỗi phân công giáo viên.');
    }
  };

  const handleCreateAcademicYear = async () => {
    if (!newYearName.trim()) {
      alert('Vui lòng nhập tên năm học (ví dụ: Năm học 2026 - 2027).');
      return;
    }

    try {
      await dataService.adminCreateAcademicYear(newYearName.trim(), newYearIsCurrent);
      alert(`Đã tạo thành công ${newYearName.trim()}.`);
      setIsCreateYearOpen(false);
      setNewYearName('');
      setNewYearIsCurrent(false);
      fetchSystemData();
    } catch (err: any) {
      alert(err.message || 'Lỗi tạo năm học.');
    }
  };

  const handleSetCurrentAcademicYear = async (year: AcademicYear) => {
    if (year.isCurrent) return;
    if (!confirm(`XÁC NHẬN: Bạn có chắc chắn muốn đặt "${year.name}" làm năm học hoạt động chính thức?`)) {
      return;
    }
    try {
      await dataService.adminUpdateAcademicYear(year.id, { isCurrent: true });
      alert(`Đã đặt "${year.name}" làm năm học hiện tại.`);
      fetchSystemData();
    } catch (err: any) {
      alert(err.message || 'Lỗi cập nhật năm học.');
    }
  };

  const handleExportData = async (type: 'students' | 'results' | 'all') => {
    try {
      const res = await dataService.adminExportData();
      const exportBlob = new Blob([JSON.stringify(res, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(exportBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `thamtutoannhi_backup_${type}_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      alert('Đã xuất dữ liệu sao lưu thành công.');
    } catch (err: any) {
      alert('Lỗi xuất dữ liệu: ' + err.message);
    }
  };

  // Navigation Items Config
  const navItems: { id: AdminTab; label: string; icon: React.ComponentType<{ className?: string }>; badge?: number | string }[] = [
    { id: 'overview', label: 'Tổng quan', icon: Activity },
    { id: 'users', label: 'Người dùng & Phân quyền', icon: Users, badge: activeUsers.length },
    { id: 'classes', label: 'Lớp học & Phân công', icon: School, badge: classes.length },
    { id: 'academic_years', label: 'Năm học', icon: Calendar, badge: academicYears.length },
    { id: 'curriculum', label: 'Học liệu & Bài tập', icon: BookOpen, badge: lessons.length },
    { id: 'analytics', label: 'Kết quả & Thống kê', icon: BarChart3 },
    { id: 'data_backup', label: 'Dữ liệu & Sao lưu', icon: Database },
    { id: 'audit_logs', label: 'Nhật ký hoạt động', icon: FileText, badge: auditLogs.length },
    { id: 'settings', label: 'Cài đặt hệ thống', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Top Header Bar */}
      <header className="bg-slate-950 border-b border-slate-800 sticky top-0 z-40 shadow-lg flex-shrink-0">
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          {/* Logo & Platform Info */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 md:hidden cursor-pointer hover:bg-slate-800"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-amber-400" /> : <Menu className="w-5 h-5 text-amber-400" />}
            </button>

            <div className="w-11 h-11 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-md shadow-amber-400/20">
              <Shield className="w-6 h-6 text-slate-950" />
            </div>

            <div>
              <div className="text-[11px] uppercase font-black text-amber-400 tracking-wider flex items-center gap-1.5">
                <span>Trung Tâm Quản Trị Hệ Thống</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse hidden sm:inline-block"></span>
              </div>
              <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                THÁM TỬ TOÁN NHÍ
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 text-[10px] font-bold border border-slate-700">
                  v1.1.0-prod
                </span>
              </h1>
            </div>
          </div>

          {/* User Profile & Actions */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => fetchSystemData(true)}
              disabled={refreshing}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer hidden sm:flex items-center gap-1.5 text-xs font-bold"
              title="Làm mới dữ liệu từ Firestore"
            >
              <RefreshCw className={`w-4 h-4 text-amber-400 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden lg:inline">Làm mới</span>
            </button>

            <div className="hidden sm:flex flex-col text-right pr-2">
              <span className="text-sm font-black text-white">
                {currentUser.displayName || 'Quản trị viên'}
              </span>
              <span className="text-[11px] font-semibold text-amber-400">
                Super Admin
              </span>
            </div>

            <button
              type="button"
              onClick={onLogout}
              className="px-3.5 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/80 text-rose-200 hover:text-white text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors border border-rose-800/60"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Đăng xuất</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Body with Sidebar */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Desktop Sidebar (Left Navigation) */}
        <aside className="w-64 lg:w-72 flex-shrink-0 bg-slate-950 border-r border-slate-800 p-4 space-y-1 hidden md:flex flex-col justify-between">
          <div className="space-y-1">
            <div className="px-3 py-2 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
              Phân Hệ Quản Trị
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-amber-400 text-slate-950 font-black shadow-md shadow-amber-400/20'
                      : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                        isActive
                          ? 'bg-slate-950 text-amber-400'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick System Badge at Bottom of Sidebar */}
          <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-slate-400 uppercase">Cơ sở dữ liệu</span>
              <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                <CheckCircle className="w-3 h-3" /> Trực tuyến
              </span>
            </div>
            <div className="text-[11px] text-slate-300 font-mono truncate" title="ai-studio-thmttonnh-6977e812-1e0d-459b-9789-d64af1d047b2">
              DB: ai-studio-thmttonnh...
            </div>
            <div className="text-[11px] text-amber-400 font-semibold">
              Năm học: {currentAcademicYear?.name || '2026 - 2027'}
            </div>
          </div>
        </aside>

        {/* Mobile Navigation Drawer Overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex flex-col bg-slate-950/95 backdrop-blur-md p-6 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-6 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black">
                  <Shield className="w-5 h-5 text-slate-950" />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-black text-amber-400">Hệ Thống Quản Trị</div>
                  <h2 className="text-lg font-black text-white">Menu Điều Hành</h2>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 py-6 space-y-1.5 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-sm font-bold transition-all ${
                      isActive
                        ? 'bg-amber-400 text-slate-950 font-black shadow-lg shadow-amber-400/20'
                        : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <Icon className={`w-5 h-5 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== undefined && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-slate-800 text-slate-300">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <div className="text-xs text-slate-400">
                Đang đăng nhập: <strong className="text-white">{currentUser.displayName}</strong>
              </div>
              <button
                type="button"
                onClick={onLogout}
                className="px-3.5 py-2 rounded-xl bg-rose-950 text-rose-200 text-xs font-bold border border-rose-800"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 bg-slate-900 p-4 sm:p-6 lg:p-8 space-y-6 overflow-y-auto">
          {/* ========================================================================= */}
          {/* TAB 1: TỔNG QUAN (OVERVIEW)                                               */}
          {/* ========================================================================= */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Header Hero Banner */}
              <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-amber-400/10 text-amber-400 border border-amber-400/30 text-xs font-extrabold uppercase tracking-wider">
                      Trang Tổng Quan Hệ Thống
                    </span>
                    <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      Dữ liệu thời gian thực
                    </span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    Chào mừng trở lại, {currentUser.displayName || 'Quản trị viên'}!
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400 font-medium max-w-2xl">
                    Hệ thống đang phục vụ 4 lớp học chuẩn GDPT 2018 với 24 chuyên đề Toán học tương tác trực quan. Toàn bộ số liệu dưới đây được truy vấn trực tiếp từ Cloud Firestore.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsCreateUserOpen(true)}
                    className="px-5 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-sm font-black shadow-lg shadow-amber-400/20 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-slate-950" /> Thêm Tài Khoản
                  </button>
                </div>
              </div>

              {/* 4 Core Quantitative Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {/* 1. Students Card */}
                <div
                  onClick={() => { setActiveTab('users'); setUserRoleFilter('student'); }}
                  className="p-6 rounded-3xl bg-slate-950 border border-slate-800 hover:border-sky-500/50 transition-all shadow-md cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-400 flex items-center justify-center font-black group-hover:scale-105 transition-transform">
                      <Users className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold text-sky-400 group-hover:translate-x-1 transition-transform flex items-center">
                      Quản lý <ChevronRight className="w-4 h-4 ml-0.5" />
                    </span>
                  </div>
                  <div className="text-3xl font-black text-white">{students.length}</div>
                  <div className="text-xs font-bold text-slate-300 mt-1">Tài khoản Học sinh</div>
                  <div className="text-[11px] text-slate-500 mt-2 font-medium">
                    Phân bổ đều trong 4 lớp học (12 HS/lớp)
                  </div>
                </div>

                {/* 2. Teachers Card */}
                <div
                  onClick={() => { setActiveTab('users'); setUserRoleFilter('teacher'); }}
                  className="p-6 rounded-3xl bg-slate-950 border border-slate-800 hover:border-amber-500/50 transition-all shadow-md cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-black group-hover:scale-105 transition-transform">
                      <UserCheck className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold text-amber-400 group-hover:translate-x-1 transition-transform flex items-center">
                      Quản lý <ChevronRight className="w-4 h-4 ml-0.5" />
                    </span>
                  </div>
                  <div className="text-3xl font-black text-white">{teachers.length}</div>
                  <div className="text-xs font-bold text-slate-300 mt-1">Giáo viên phụ trách</div>
                  <div className="text-[11px] text-slate-500 mt-2 font-medium">
                    Phụ trách Khối 1 &amp; Khối 2
                  </div>
                </div>

                {/* 3. Classrooms Card */}
                <div
                  onClick={() => setActiveTab('classes')}
                  className="p-6 rounded-3xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 transition-all shadow-md cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-black group-hover:scale-105 transition-transform">
                      <School className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold text-emerald-400 group-hover:translate-x-1 transition-transform flex items-center">
                      Xem lớp <ChevronRight className="w-4 h-4 ml-0.5" />
                    </span>
                  </div>
                  <div className="text-3xl font-black text-white">{classes.length}</div>
                  <div className="text-xs font-bold text-slate-300 mt-1">Lớp học chuẩn</div>
                  <div className="text-[11px] text-slate-500 mt-2 font-medium">
                    Lớp 1A, 1B, 2A, 2B (100% có giáo viên)
                  </div>
                </div>

                {/* 4. Curriculum Lessons Card */}
                <div
                  onClick={() => setActiveTab('curriculum')}
                  className="p-6 rounded-3xl bg-slate-950 border border-slate-800 hover:border-purple-500/50 transition-all shadow-md cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center font-black group-hover:scale-105 transition-transform">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold text-purple-400 group-hover:translate-x-1 transition-transform flex items-center">
                      Kho bài <ChevronRight className="w-4 h-4 ml-0.5" />
                    </span>
                  </div>
                  <div className="text-3xl font-black text-white">{lessons.length}</div>
                  <div className="text-xs font-bold text-slate-300 mt-1">Chuyên đề Toán GDPT</div>
                  <div className="text-[11px] text-slate-500 mt-2 font-medium">
                    192 câu hỏi chuẩn (8 câu / chuyên đề)
                  </div>
                </div>
              </div>

              {/* Learning Activity & Transparency Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="text-xs font-extrabold uppercase text-slate-400">
                    Nhiệm Vụ Bài Tập Đã Giao
                  </div>
                  <div className="text-2xl font-black text-white flex items-center gap-2">
                    {assignments.length} <span className="text-xs font-semibold text-slate-400">đợt giao bài</span>
                  </div>
                  <div className="text-xs text-slate-400">
                    Giáo viên phân công trực tiếp tới các lớp học
                  </div>
                </div>

                <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="text-xs font-extrabold uppercase text-slate-400 flex items-center justify-between">
                    <span>Lượt Làm Bài Thực Tế</span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 text-[10px] font-black border border-emerald-500/30">
                      Học sinh thật
                    </span>
                  </div>
                  <div className="text-2xl font-black text-white flex items-center gap-2">
                    {realAttempts.length} <span className="text-xs font-semibold text-slate-400">lượt hoàn thành</span>
                  </div>
                  <div className="text-xs text-slate-400">
                    {simulationAttempts.length} lượt lịch sử thử nghiệm được lưu trữ riêng biệt, không tính gộp vào báo cáo học tập thật.
                  </div>
                </div>

                <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="text-xs font-extrabold uppercase text-slate-400">
                    Năm Học Vận Hành
                  </div>
                  <div className="text-2xl font-black text-amber-400 flex items-center gap-2">
                    {currentAcademicYear?.name || 'Năm học 2026 - 2027'}
                  </div>
                  <div className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5" /> Đang mở khóa học tập cho học sinh
                  </div>
                </div>
              </div>

              {/* Quick Operation Short-cuts */}
              <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">
                  Lối Tắt Điều Hành Nhanh
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  <button
                    type="button"
                    onClick={() => { setActiveTab('users'); setIsCreateUserOpen(true); }}
                    className="p-4 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-left transition-colors cursor-pointer group"
                  >
                    <Users className="w-5 h-5 text-amber-400 mb-2 group-hover:scale-110 transition-transform" />
                    <div className="text-xs sm:text-sm font-bold text-white">Thêm tài khoản</div>
                    <div className="text-[11px] text-slate-400">Học sinh hoặc giáo viên</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('classes')}
                    className="p-4 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-left transition-colors cursor-pointer group"
                  >
                    <School className="w-5 h-5 text-sky-400 mb-2 group-hover:scale-110 transition-transform" />
                    <div className="text-xs sm:text-sm font-bold text-white">Phân công lớp</div>
                    <div className="text-[11px] text-slate-400">Gán giáo viên chủ nhiệm</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('curriculum')}
                    className="p-4 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-left transition-colors cursor-pointer group"
                  >
                    <BookOpen className="w-5 h-5 text-purple-400 mb-2 group-hover:scale-110 transition-transform" />
                    <div className="text-xs sm:text-sm font-bold text-white">Kho học liệu</div>
                    <div className="text-[11px] text-slate-400">24 chuyên đề GDPT</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('audit_logs')}
                    className="p-4 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-left transition-colors cursor-pointer group"
                  >
                    <FileText className="w-5 h-5 text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
                    <div className="text-xs sm:text-sm font-bold text-white">Nhật ký hoạt động</div>
                    <div className="text-[11px] text-slate-400">Theo dõi lịch sử quản trị</div>
                  </button>
                </div>
              </div>

              {/* Recent Audit Log Preview */}
              <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">
                    Nhật Ký Quản Trị Gần Đây
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('audit_logs')}
                    className="text-xs font-bold text-amber-400 hover:underline flex items-center"
                  >
                    Xem toàn bộ nhật ký <ChevronRight className="w-4 h-4 ml-0.5" />
                  </button>
                </div>

                <div className="divide-y divide-slate-800/80">
                  {auditLogs.slice(0, 5).map((log) => {
                    const badge = humanizeAction(log.action);
                    return (
                      <div key={log.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2.5">
                          <span className={`px-2.5 py-0.5 rounded-md border text-[11px] font-bold ${badge.color}`}>
                            {badge.label}
                          </span>
                          <span className="font-semibold text-slate-200">
                            {log.details || log.action}
                          </span>
                        </div>
                        <div className="text-slate-400 text-[11px] font-mono sm:text-right">
                          {formatVietnamDateTime(log.timestamp)}
                        </div>
                      </div>
                    );
                  })}
                  {auditLogs.length === 0 && (
                    <div className="py-6 text-center text-slate-500 text-xs">
                      Chưa có nhật ký hoạt động nào được ghi nhận.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: NGƯỜI DÙNG & PHÂN QUYỀN (USERS)                                   */}
          {/* ========================================================================= */}
          {activeTab === 'users' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Header and Add Action */}
              <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-black text-white">Quản Lý Người Dùng &amp; Phân Quyền</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Quản lý danh sách tài khoản Giáo viên, Học sinh và Quản trị viên trong hệ thống
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsCreateUserOpen(true)}
                    className="px-4 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black shadow-md shadow-amber-400/20 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-slate-950" /> Thêm Người Dùng
                  </button>
                </div>
              </div>

              {/* Sub-Tabs: Role Filter */}
              <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-2">
                <button
                  type="button"
                  onClick={() => setUserRoleFilter('all')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    userRoleFilter === 'all'
                      ? 'bg-amber-400 text-slate-950 font-black'
                      : 'bg-slate-950 text-slate-400 hover:text-white'
                  }`}
                >
                  Tất cả ({activeUsers.length})
                </button>
                <button
                  type="button"
                  onClick={() => setUserRoleFilter('teacher')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    userRoleFilter === 'teacher'
                      ? 'bg-amber-400 text-slate-950 font-black'
                      : 'bg-slate-950 text-slate-400 hover:text-white'
                  }`}
                >
                  Giáo viên ({teachers.length})
                </button>
                <button
                  type="button"
                  onClick={() => setUserRoleFilter('student')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    userRoleFilter === 'student'
                      ? 'bg-amber-400 text-slate-950 font-black'
                      : 'bg-slate-950 text-slate-400 hover:text-white'
                  }`}
                >
                  Học sinh ({students.length})
                </button>
                <button
                  type="button"
                  onClick={() => setUserRoleFilter('admin')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    userRoleFilter === 'admin'
                      ? 'bg-amber-400 text-slate-950 font-black'
                      : 'bg-slate-950 text-slate-400 hover:text-white'
                  }`}
                >
                  Quản trị viên ({admins.length})
                </button>
              </div>

              {/* Search & Filter Toolbar */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="flex-1 relative">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    id="user-search-input"
                    type="text"
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    placeholder="Tìm theo họ tên, email hoặc mã học sinh..."
                    className="w-full h-10 pl-10 pr-4 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-400"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={userClassFilter}
                    onChange={(e) => setUserClassFilter(e.target.value)}
                    className="h-10 px-3 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-white focus:outline-hidden"
                  >
                    <option value="all">Tất cả lớp học</option>
                    <option value="class-1a">Lớp 1A</option>
                    <option value="class-1b">Lớp 1B</option>
                    <option value="class-2a">Lớp 2A</option>
                    <option value="class-2b">Lớp 2B</option>
                  </select>

                  <select
                    value={userStatusFilter}
                    onChange={(e) => setUserStatusFilter(e.target.value as any)}
                    className="h-10 px-3 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-white focus:outline-hidden"
                  >
                    <option value="all">Tất cả trạng thái</option>
                    <option value="active">Đang hoạt động</option>
                    <option value="locked">Đã khóa</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => setAuditMode(!auditMode)}
                    className={`h-10 px-3 rounded-xl text-xs font-bold border transition-colors cursor-pointer flex items-center gap-1.5 ${
                      auditMode
                        ? 'bg-amber-400 text-slate-950 border-amber-400'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                    title="Bật chế độ kiểm toán nguồn gốc dữ liệu"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span className="hidden xl:inline">Kiểm toán nguồn</span>
                  </button>
                </div>
              </div>

              {/* Users Table */}
              <div className="rounded-3xl bg-slate-950 border border-slate-800 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-extrabold uppercase tracking-wider text-[11px]">
                        <th className="px-5 py-3.5">Họ và Tên</th>
                        <th className="px-5 py-3.5">Vai Trò</th>
                        <th className="px-5 py-3.5">Mã / Email</th>
                        <th className="px-5 py-3.5">Lớp Phụ Trách / Học</th>
                        <th className="px-5 py-3.5">Trạng Thái</th>
                        {auditMode && <th className="px-5 py-3.5 text-amber-400">Nguồn Gốc</th>}
                        <th className="px-5 py-3.5 text-right">Thao Tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-semibold text-slate-300">
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={auditMode ? 7 : 6} className="px-6 py-12 text-center text-slate-500 text-xs">
                            Không tìm thấy tài khoản phù hợp với bộ lọc.
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((user) => {
                          const locked = isUserLocked(user);
                          const isSelf = user.id === currentUser.id;

                          return (
                            <tr key={user.id} className="hover:bg-slate-900/60 transition-colors">
                              <td className="px-5 py-3.5">
                                <button
                                  type="button"
                                  onClick={() => setSelectedUserDetail(user)}
                                  className="font-bold text-white hover:text-amber-400 hover:underline cursor-pointer text-left"
                                >
                                  {user.displayName || user.studentCode}
                                </button>
                              </td>
                              <td className="px-5 py-3.5">
                                <span
                                  className={`px-2.5 py-0.5 rounded-md font-bold text-[11px] border ${
                                    user.role === 'admin'
                                      ? 'bg-purple-950/60 text-purple-300 border-purple-800'
                                      : user.role === 'teacher'
                                      ? 'bg-sky-950/60 text-sky-300 border-sky-800'
                                      : 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
                                  }`}
                                >
                                  {user.role === 'admin' ? 'Quản trị viên' : user.role === 'teacher' ? 'Giáo viên' : 'Học sinh'}
                                </span>
                              </td>
                              <td className="px-5 py-3.5 font-mono text-slate-400">
                                {user.role === 'student' ? user.studentCode : user.email}
                              </td>
                              <td className="px-5 py-3.5 font-semibold text-slate-300">
                                {user.className || user.classId || '—'}
                              </td>
                              <td className="px-5 py-3.5">
                                <span
                                  className={`px-2 py-0.5 rounded-md text-[11px] font-black border ${
                                    locked
                                      ? 'bg-rose-950/60 text-rose-300 border-rose-800'
                                      : 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
                                  }`}
                                >
                                  {locked ? 'Đã khóa' : 'Đang hoạt động'}
                                </span>
                              </td>
                              {auditMode && (
                                <td className="px-5 py-3.5">
                                  <span
                                    className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                                      user.dataOrigin === 'simulation'
                                        ? 'bg-amber-950/60 text-amber-300 border border-amber-800'
                                        : 'bg-slate-800 text-slate-300'
                                    }`}
                                  >
                                    {user.dataOrigin || 'real'}
                                  </span>
                                </td>
                              )}
                              <td className="px-5 py-3.5 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedUserDetail(user)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                                    title="Xem chi tiết hồ sơ"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleToggleLockUser(user)}
                                    disabled={isSelf && !locked}
                                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                      locked
                                        ? 'text-emerald-400 hover:bg-emerald-950/60'
                                        : 'text-amber-400 hover:bg-amber-950/60'
                                    } ${isSelf && !locked ? 'opacity-30 cursor-not-allowed' : ''}`}
                                    title={locked ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
                                  >
                                    {locked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => { setResetPasswordUser(user); setNewPasswordInput(''); }}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors cursor-pointer"
                                    title="Đặt lại mật khẩu truy cập"
                                  >
                                    <Key className="w-4 h-4" />
                                  </button>

                                  {!isSelf && (
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteUser(user)}
                                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                                      title="Lưu trữ tài khoản"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: LỚP HỌC & PHÂN CÔNG (CLASSES)                                      */}
          {/* ========================================================================= */}
          {activeTab === 'classes' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-black text-white">Quản Lý Lớp Học &amp; Phân Công Giáo Viên</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Theo dõi 4 lớp học chuẩn, tính toán sĩ số thực tế và phân công giáo viên chủ nhiệm
                  </p>
                </div>
              </div>

              {/* 4 Class Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {classes.map((cls) => {
                  const studentCount = getClassStudentCount(cls.id);
                  const teacher = teachers.find(t => t.id === cls.teacherId);
                  const hasTeacher = Boolean(cls.teacherId);

                  return (
                    <div
                      key={cls.id}
                      className="p-6 rounded-3xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all shadow-md space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-lg">
                            {cls.name}
                          </div>
                          <div>
                            <div className="text-lg font-black text-white">Lớp {cls.name}</div>
                            <div className="text-xs text-slate-400 font-semibold">
                              Khối {cls.grade || (cls.name.startsWith('1') ? 1 : 2)} • Năm học 2026 - 2027
                            </div>
                          </div>
                        </div>

                        <span className="px-3 py-1 rounded-full bg-slate-900 border border-slate-700 text-amber-400 font-black text-xs">
                          {studentCount} Học sinh
                        </span>
                      </div>

                      {/* Teacher Assignment Status */}
                      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800/80 flex items-center justify-between">
                        <div>
                          <div className="text-[11px] font-extrabold text-slate-400 uppercase">Giáo viên phụ trách</div>
                          {hasTeacher ? (
                            <div className="text-sm font-bold text-white mt-0.5 flex items-center gap-1.5">
                              <UserCheck className="w-4 h-4 text-emerald-400" />
                              <span>{teacher?.displayName || cls.teacherName || cls.teacherId}</span>
                            </div>
                          ) : (
                            <div className="text-xs font-bold text-rose-400 mt-0.5 flex items-center gap-1.5">
                              <AlertTriangle className="w-4 h-4" />
                              <span>Chưa phân công giáo viên</span>
                            </div>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => { setAssigningClass(cls); setSelectedTeacherForClass(cls.teacherId || ''); }}
                          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold transition-colors cursor-pointer"
                        >
                          Phân công
                        </button>
                      </div>

                      {/* Action to view students of this class */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                        <span className="text-xs text-slate-400 font-medium">
                          Sĩ số thực tế tính từ tài khoản liên kết
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelectedClassDetail(cls)}
                          className="text-xs font-bold text-sky-400 hover:underline flex items-center"
                        >
                          Xem danh sách học sinh ({studentCount}) <ChevronRight className="w-4 h-4 ml-0.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: NĂM HỌC (ACADEMIC YEARS)                                          */}
          {/* ========================================================================= */}
          {activeTab === 'academic_years' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-black text-white">Quản Lý Năm Học</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Thiết lập năm học hiện tại và bảo tồn lịch sử dữ liệu của các niên khóa trước
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsCreateYearOpen(true)}
                  className="px-4 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-slate-950" /> Thêm Năm Học
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {academicYears.map((year) => (
                  <div
                    key={year.id}
                    className={`p-6 rounded-3xl border transition-all ${
                      year.isCurrent
                        ? 'bg-slate-950 border-amber-400 shadow-xl shadow-amber-400/10'
                        : 'bg-slate-950 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center font-black">
                        <Calendar className="w-5 h-5" />
                      </div>
                      {year.isCurrent ? (
                        <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[11px] font-black border border-emerald-500/30 flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" /> Năm học hiện tại
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full bg-slate-900 text-slate-500 text-[11px] font-semibold border border-slate-800">
                          Lưu trữ
                        </span>
                      )}
                    </div>

                    <div className="text-lg font-black text-white">{year.name}</div>
                    <div className="text-xs text-slate-500 mt-1 font-mono">
                      Khởi tạo: {formatVietnamDateTime(year.createdAt)}
                    </div>

                    {!year.isCurrent && (
                      <div className="mt-6 pt-4 border-t border-slate-800">
                        <button
                          type="button"
                          onClick={() => handleSetCurrentAcademicYear(year)}
                          className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 text-xs font-bold border border-slate-700 transition-colors cursor-pointer"
                        >
                          Đặt làm năm học hiện tại
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 5: HỌC LIỆU & BÀI TẬP (CURRICULUM)                                    */}
          {/* ========================================================================= */}
          {activeTab === 'curriculum' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-black text-white">Kho Học Liệu &amp; Tình Trạng Giao Bài</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Tổng thể 24 chuyên đề GDPT 2018 (12 chuyên đề Khối 1, 12 chuyên đề Khối 2), mỗi bài chuẩn 8 câu hỏi
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1.5 rounded-xl bg-purple-500/10 text-purple-400 text-xs font-black border border-purple-500/30">
                    24 Bài học • 192 Câu hỏi
                  </span>
                </div>
              </div>

              {/* Lessons List Table */}
              <div className="rounded-3xl bg-slate-950 border border-slate-800 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-extrabold uppercase tracking-wider text-[11px]">
                        <th className="px-5 py-3.5">Khối</th>
                        <th className="px-5 py-3.5">Tên Chuyên Đề</th>
                        <th className="px-5 py-3.5">Yêu Cầu Cần Đạt (GDPT 2018)</th>
                        <th className="px-5 py-3.5 text-center">Số Câu</th>
                        <th className="px-5 py-3.5 text-center">Phiên Bản</th>
                        <th className="px-5 py-3.5 text-center">Trạng Thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-semibold text-slate-300">
                      {lessons.map((lesson) => (
                        <tr key={lesson.id} className="hover:bg-slate-900/60 transition-colors">
                          <td className="px-5 py-3.5">
                            <span className="px-2 py-0.5 rounded-md bg-slate-800 text-amber-400 font-black text-[11px]">
                              Lớp {lesson.grade}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 font-bold text-white max-w-xs">
                            {lesson.title}
                          </td>
                          <td className="px-5 py-3.5 text-slate-400 max-w-md truncate">
                            {lesson.learningStandard || lesson.topic}
                          </td>
                          <td className="px-5 py-3.5 text-center font-bold text-emerald-400">
                            {lesson.totalQuestions || 8} câu
                          </td>
                          <td className="px-5 py-3.5 text-center font-mono text-slate-400">
                            v{lesson.currentVersion || 1}.0
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            <span className="px-2 py-0.5 rounded-md bg-emerald-950/60 text-emerald-300 text-[11px] font-bold border border-emerald-800">
                              Đã phát hành
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 6: KẾT QUẢ & THỐNG KÊ (ANALYTICS)                                     */}
          {/* ========================================================================= */}
          {activeTab === 'analytics' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-black text-white">Kết Quả Học Tập &amp; Phân Tích Lỗi Sai</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Thống kê tỷ lệ hoàn thành, điểm số thực tế và chẩn đoán mô hình lỗi nhận thức toán học
                  </p>
                </div>

                <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
                  Ưu tiên số liệu học sinh thật
                </div>
              </div>

              {/* Summary Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="text-xs font-extrabold uppercase text-slate-400">Tổng Bài Làm Đã Nộp</div>
                  <div className="text-3xl font-black text-white">{attempts.filter(a => a.status === 'completed').length}</div>
                  <div className="text-xs text-slate-500">Bao gồm các bài hoàn thành cả bài</div>
                </div>

                <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="text-xs font-extrabold uppercase text-slate-400">Lượt Học Sinh Thật</div>
                  <div className="text-3xl font-black text-emerald-400">{realAttempts.length}</div>
                  <div className="text-xs text-slate-500">Không tính các bài test script tự sinh</div>
                </div>

                <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="text-xs font-extrabold uppercase text-slate-400">Dữ Liệu Kiểm Toán Lịch Sử</div>
                  <div className="text-3xl font-black text-slate-400">{simulationAttempts.length}</div>
                  <div className="text-xs text-slate-500">Lưu trữ minh bạch, không sửa nhãn nguồn</div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 7: DỮ LIỆU & SAO LƯU (DATA BACKUP)                                    */}
          {/* ========================================================================= */}
          {activeTab === 'data_backup' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-black text-white">Dữ Liệu &amp; Sao Lưu Hệ Thống</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Công cụ sao lưu dữ liệu, bảo toàn cơ sở dữ liệu Cloud Firestore và giám sát an toàn vận hành
                  </p>
                </div>

                <div className="px-3.5 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-400" /> Khóa an toàn Production đang bật
                </div>
              </div>

              {/* Export Actions Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-4">
                  <div className="w-10 h-10 rounded-2xl bg-sky-500/10 text-sky-400 flex items-center justify-center font-black">
                    <Download className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white">Sao Lưu Danh Sách Học Sinh</h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Xuất danh sách học sinh kèm mã lớp, ngày tạo (mật khẩu đã được lọc bỏ an toàn)
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleExportData('students')}
                    className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-sky-400 text-xs font-bold border border-slate-700 transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" /> Tải tệp JSON an toàn
                  </button>
                </div>

                <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-4">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-black">
                    <Download className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white">Sao Lưu Toàn Bộ Cấu Hình</h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Xuất toàn bộ cấu trúc lớp học, năm học và kho học liệu GDPT 2018
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleExportData('all')}
                    className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 text-xs font-bold border border-slate-700 transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" /> Tải cấu hình sao lưu
                  </button>
                </div>

                <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-4">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-black">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white">Bảo Toàn Cơ Sở Dữ Liệu</h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Các thao tác khởi tạo hay dọn dẹp hàng loạt đã bị vô hiệu hóa hoàn toàn trên Production
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-emerald-400 font-semibold">
                    ✓ Không có quyền seed/wipe trên Production
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 8: NHẬT KÝ HOẠT ĐỘNG (AUDIT LOGS)                                     */}
          {/* ========================================================================= */}
          {activeTab === 'audit_logs' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-black text-white">Nhật Ký Hoạt Động Hệ Thống</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Ghi vết bất biến toàn bộ thao tác quản trị, phân quyền, giao bài và tạo người dùng
                  </p>
                </div>

                <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-amber-400 text-xs font-bold">
                  {auditLogs.length} sự kiện đã lưu
                </span>
              </div>

              {/* Search & Filter Toolbar */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="flex-1 relative">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={auditSearchQuery}
                    onChange={(e) => setAuditSearchQuery(e.target.value)}
                    placeholder="Tìm kiếm theo hành động, người thực hiện hoặc chi tiết..."
                    className="w-full h-10 pl-10 pr-4 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-white placeholder-slate-500 focus:outline-hidden"
                  />
                </div>

                <select
                  value={auditActionFilter}
                  onChange={(e) => setAuditActionFilter(e.target.value)}
                  className="h-10 px-3 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-white focus:outline-hidden"
                >
                  <option value="all">Tất cả hành động</option>
                  <option value="CREATE_USER">Tạo người dùng mới</option>
                  <option value="CREATE_STUDENT">Tạo học sinh</option>
                  <option value="LOCK_USER">Khóa tài khoản</option>
                  <option value="UNLOCK_USER">Mở khóa tài khoản</option>
                  <option value="UPDATE_USER">Cập nhật thông tin</option>
                  <option value="RESET_PASSWORD">Đặt lại mật khẩu</option>
                  <option value="ASSIGN_TEACHER_TO_CLASS">Phân công giáo viên</option>
                  <option value="CREATE_ACADEMIC_YEAR">Tạo năm học</option>
                  <option value="EXPORT_SYSTEM_DATA">Xuất dữ liệu</option>
                </select>
              </div>

              {/* Logs Table */}
              <div className="rounded-3xl bg-slate-950 border border-slate-800 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-extrabold uppercase tracking-wider text-[11px]">
                        <th className="px-5 py-3.5">Thời Điểm (Giờ VN)</th>
                        <th className="px-5 py-3.5">Hành Động</th>
                        <th className="px-5 py-3.5">Người Thực Hiện</th>
                        <th className="px-5 py-3.5">Đối Tượng</th>
                        <th className="px-5 py-3.5">Chi Tiết</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-semibold text-slate-300">
                      {filteredAuditLogs.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-slate-500 text-xs">
                            Chưa có sự kiện nào phù hợp với bộ lọc tìm kiếm.
                          </td>
                        </tr>
                      ) : (
                        filteredAuditLogs.map((log) => {
                          const badge = humanizeAction(log.action);
                          const actorDisplay = log.actorName || log.performedBy || log.actorId || 'Không xác định (bản ghi cũ)';
                          const actorRoleDisplay = log.actorRole || (log.performedBy?.startsWith('teacher') ? 'Giáo viên' : log.performedBy?.startsWith('admin') ? 'Quản trị viên' : '');
                          const targetDisplay = log.targetName || log.targetId || log.targetUserId || log.classId || (log.targetCollection ? `${log.targetCollection}` : '') || 'Hệ thống';

                          return (
                            <tr key={log.id} className="hover:bg-slate-900/60 transition-colors">
                              <td className="px-5 py-3.5 font-mono text-slate-400 whitespace-nowrap">
                                {formatVietnamDateTime(log.timestamp)}
                              </td>
                              <td className="px-5 py-3.5 whitespace-nowrap">
                                <span className={`px-2.5 py-0.5 rounded-md border font-bold text-[11px] ${badge.color}`}>
                                  {badge.label}
                                </span>
                              </td>
                              <td className="px-5 py-3.5 whitespace-nowrap">
                                <span className="font-bold text-white">{actorDisplay}</span>
                                {actorRoleDisplay && (
                                  <span className="text-[10px] text-slate-400 ml-1.5 font-normal">
                                    ({actorRoleDisplay})
                                  </span>
                                )}
                              </td>
                              <td className="px-5 py-3.5 font-medium text-slate-300 max-w-xs truncate">
                                {targetDisplay}
                              </td>
                              <td className="px-5 py-3.5 text-slate-400 max-w-md truncate">
                                {log.details || log.action}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 9: CÀI ĐẶT HỆ THỐNG (SETTINGS)                                        */}
          {/* ========================================================================= */}
          {activeTab === 'settings' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-black text-white">Cài Đặt &amp; Trạng Thái Hệ Thống</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Kiểm tra trạng thái kết nối Cloud Firestore, Firebase Authentication, AI Engine và khóa bảo mật
                  </p>
                </div>

                <div className="px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-black flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" /> Hệ thống sẵn sàng
                </div>
              </div>

              {/* Infrastructure Status Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 1. Firebase Cloud Firestore */}
                <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 shadow-sm space-y-3">
                  <div className="text-xs font-black uppercase text-slate-400">
                    Firebase Cloud Firestore
                  </div>
                  <div className="text-lg font-black text-white">
                    indigo-lotus-2nmq3
                  </div>
                  <div className="text-xs font-mono bg-slate-900 p-2.5 rounded-xl border border-slate-800 text-slate-400 truncate">
                    DB: ai-studio-thmttonnh-6977e812-1e0d-459b-9789-d64af1d047b2
                  </div>
                  <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4" /> Kết nối máy chủ thời gian thực
                  </div>
                </div>

                {/* 2. Authentication Provider */}
                <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 shadow-sm space-y-3">
                  <div className="text-xs font-black uppercase text-slate-400">
                    Firebase Authentication
                  </div>
                  <div className="text-lg font-black text-white">
                    Email / Mật khẩu &amp; Google
                  </div>
                  <div className="text-xs text-slate-400">
                    Học sinh đăng nhập bằng mã số trường cấp (HS1A01), không thu thập số điện thoại hay email cá nhân.
                  </div>
                  <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4" /> Phiên Auth bảo mật qua F5
                  </div>
                </div>

                {/* 3. Gemini AI Engine */}
                <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 shadow-sm space-y-3">
                  <div className="text-xs font-black uppercase text-slate-400">
                    AI Engine (Gemini 2.5 Flash)
                  </div>
                  <div className="text-lg font-black text-white">
                    Trợ lý Soạn Giáo Án
                  </div>
                  <div className="text-xs text-slate-400">
                    {healthInfo?.geminiConfigured
                      ? 'Khóa API đã được kích hoạt trên môi trường máy chủ.'
                      : 'AI chưa được cấu hình (Cần thêm GEMINI_API_KEY trong Vercel Settings để kích hoạt tính năng).'}
                  </div>
                  <div className={`text-xs font-bold flex items-center gap-1.5 ${
                    healthInfo?.geminiConfigured ? 'text-emerald-400' : 'text-amber-400'
                  }`}>
                    {healthInfo?.geminiConfigured ? (
                      <>
                        <CheckCircle className="w-4 h-4" /> Sẵn sàng hoạt động
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-4 h-4" /> AI chưa được cấu hình
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Security & Secrets Safeguard Overview */}
              <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">
                  Chính Sách Bảo Mật Khóa Bí Mật &amp; Phiên Đăng Nhập
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5">
                    <div className="font-bold text-white flex items-center gap-2">
                      <Key className="w-4 h-4 text-amber-400" /> Khóa Ký Phiên HMAC (`AUTH_SECRET`)
                    </div>
                    <div className="text-slate-400">
                      Cơ chế HMAC-SHA256 không lưu trạng thái. Mọi mật khẩu và khóa bí mật được ẩn tuyệt đối ở tầng trình duyệt, không bao giờ lộ ra frontend hay nhật ký.
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5">
                    <div className="font-bold text-white flex items-center gap-2">
                      <Shield className="w-4 h-4 text-emerald-400" /> Nguyên Tắc Phân Quyền Đa Tầng (RBAC)
                    </div>
                    <div className="text-slate-400">
                      Học sinh bị chặn 100% các API quản trị và API giáo viên. Giáo viên chỉ xem được danh sách học sinh của các lớp được phân công phụ trách.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ========================================================================= */}
      {/* MODALS SECTION                                                            */}
      {/* ========================================================================= */}

      {/* 1. Create User Modal */}
      {isCreateUserOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 rounded-3xl border border-slate-700 shadow-2xl p-6 sm:p-8 space-y-4 text-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-lg font-black text-white">Tạo Tài Khoản Mới</h3>
              <button
                type="button"
                onClick={() => setIsCreateUserOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-1">
                Vai trò
              </label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as any)}
                className="w-full h-11 px-3 rounded-xl bg-slate-950 border border-slate-700 text-sm font-bold text-white focus:outline-hidden"
              >
                <option value="student">Học sinh</option>
                <option value="teacher">Giáo viên</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-1">
                Họ và tên *
              </label>
              <input
                type="text"
                value={newDisplayName}
                onChange={(e) => setNewDisplayName(e.target.value)}
                placeholder="Ví dụ: Trần Minh Khôi"
                className="w-full h-11 px-3 rounded-xl bg-slate-950 border border-slate-700 text-sm font-bold text-white placeholder-slate-500 focus:outline-hidden"
              />
            </div>

            {newRole === 'student' ? (
              <>
                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 mb-1">
                    Mã học sinh
                  </label>
                  <input
                    type="text"
                    value={newStudentCode}
                    onChange={(e) => setNewStudentCode(e.target.value)}
                    placeholder="Ví dụ: HS1A15"
                    className="w-full h-11 px-3 rounded-xl bg-slate-950 border border-slate-700 text-sm font-bold text-white placeholder-slate-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 mb-1">
                    Lớp phân công
                  </label>
                  <select
                    value={newClassId}
                    onChange={(e) => setNewClassId(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl bg-slate-950 border border-slate-700 text-sm font-bold text-white focus:outline-hidden"
                  >
                    <option value="class-1a">Lớp 1A</option>
                    <option value="class-1b">Lớp 1B</option>
                    <option value="class-2a">Lớp 2A</option>
                    <option value="class-2b">Lớp 2B</option>
                  </select>
                </div>
              </>
            ) : (
              <div>
                <label className="block text-xs font-black uppercase text-slate-400 mb-1">
                  Email giáo viên
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="giaovien@thamtutoannhi.edu.vn"
                  className="w-full h-11 px-3 rounded-xl bg-slate-950 border border-slate-700 text-sm font-bold text-white placeholder-slate-500 focus:outline-hidden"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsCreateUserOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleCreateUser}
                className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black shadow-md cursor-pointer"
              >
                Tạo tài khoản
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. User Detail Modal */}
      {selectedUserDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-slate-900 rounded-3xl border border-slate-700 shadow-2xl p-6 sm:p-8 space-y-4 text-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black">
                  {selectedUserDetail.role === 'teacher' ? <UserCheck className="w-5 h-5" /> : <Users className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">{selectedUserDetail.displayName || selectedUserDetail.studentCode}</h3>
                  <div className="text-xs text-amber-400 font-semibold capitalize">{selectedUserDetail.role}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUserDetail(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">ID Người Dùng:</span>
                <span className="font-mono text-white">{selectedUserDetail.id}</span>
              </div>
              {selectedUserDetail.studentCode && (
                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">Mã Học Sinh:</span>
                  <span className="font-mono text-amber-400 font-bold">{selectedUserDetail.studentCode}</span>
                </div>
              )}
              {selectedUserDetail.email && (
                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">Email:</span>
                  <span className="text-white">{selectedUserDetail.email}</span>
                </div>
              )}
              {selectedUserDetail.classId && (
                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">Lớp:</span>
                  <span className="text-white font-bold">{selectedUserDetail.className || selectedUserDetail.classId}</span>
                </div>
              )}
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">Trạng Thái:</span>
                <span className={`px-2 py-0.5 rounded-md font-bold ${isUserLocked(selectedUserDetail) ? 'bg-rose-950 text-rose-300' : 'bg-emerald-950 text-emerald-300'}`}>
                  {isUserLocked(selectedUserDetail) ? 'Đã khóa' : 'Đang hoạt động'}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">Ngày Tạo:</span>
                <span className="font-mono text-slate-300">{formatVietnamDateTime(selectedUserDetail.createdAt)}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedUserDetail(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Reset Password Modal */}
      {resetPasswordUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 rounded-3xl border border-slate-700 shadow-2xl p-6 sm:p-8 space-y-4 text-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-lg font-black text-white">Đặt Lại Mật Khẩu</h3>
              <button
                type="button"
                onClick={() => setResetPasswordUser(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-400">
              Đặt lại mật khẩu cho tài khoản: <strong className="text-white">{resetPasswordUser.displayName || resetPasswordUser.studentCode}</strong>
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-1">
                Mật khẩu mới (tối thiểu 6 ký tự)
              </label>
              <input
                type="text"
                value={newPasswordInput}
                onChange={(e) => setNewPasswordInput(e.target.value)}
                placeholder="Nhập mật khẩu mới..."
                className="w-full h-11 px-3 rounded-xl bg-slate-950 border border-slate-700 text-sm font-bold text-white placeholder-slate-500 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setResetPasswordUser(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleResetPassword}
                className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black shadow-md cursor-pointer"
              >
                Lưu mật khẩu mới
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Assign Teacher to Class Modal */}
      {assigningClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 rounded-3xl border border-slate-700 shadow-2xl p-6 sm:p-8 space-y-4 text-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-lg font-black text-white">Phân Công Giáo Viên Chủ Nhiệm</h3>
              <button
                type="button"
                onClick={() => setAssigningClass(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-400">
              Chọn giáo viên phụ trách cho lớp: <strong className="text-amber-400">{assigningClass.name}</strong>
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-1">
                Giáo viên phụ trách
              </label>
              <select
                value={selectedTeacherForClass}
                onChange={(e) => setSelectedTeacherForClass(e.target.value)}
                className="w-full h-11 px-3 rounded-xl bg-slate-950 border border-slate-700 text-sm font-bold text-white focus:outline-hidden"
              >
                <option value="">-- Chọn giáo viên --</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.displayName} ({t.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setAssigningClass(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleAssignTeacher}
                className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black shadow-md cursor-pointer"
              >
                Xác nhận phân công
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Create Academic Year Modal */}
      {isCreateYearOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 rounded-3xl border border-slate-700 shadow-2xl p-6 sm:p-8 space-y-4 text-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-lg font-black text-white">Thêm Năm Học Mới</h3>
              <button
                type="button"
                onClick={() => setIsCreateYearOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-1">
                Tên năm học
              </label>
              <input
                type="text"
                value={newYearName}
                onChange={(e) => setNewYearName(e.target.value)}
                placeholder="Ví dụ: Năm học 2026 - 2027"
                className="w-full h-11 px-3 rounded-xl bg-slate-950 border border-slate-700 text-sm font-bold text-white placeholder-slate-500 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="check-is-current"
                checked={newYearIsCurrent}
                onChange={(e) => setNewYearIsCurrent(e.target.checked)}
                className="w-4 h-4 rounded-md accent-amber-400 cursor-pointer"
              />
              <label htmlFor="check-is-current" className="text-xs font-bold text-slate-300 cursor-pointer">
                Đặt làm năm học hiện tại ngay sau khi tạo
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsCreateYearOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleCreateAcademicYear}
                className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black shadow-md cursor-pointer"
              >
                Tạo năm học
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Class Detail Modal with Enrolled Students */}
      {selectedClassDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-slate-900 rounded-3xl border border-slate-700 shadow-2xl p-6 sm:p-8 space-y-4 text-slate-200 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black">
                  {selectedClassDetail.name}
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Danh Sách Học Sinh Lớp {selectedClassDetail.name}</h3>
                  <div className="text-xs text-slate-400">
                    Sĩ số: {getClassStudentCount(selectedClassDetail.id)} học sinh
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedClassDetail(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 py-2 pr-1">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 uppercase text-[10px] font-extrabold border-b border-slate-800">
                    <th className="px-4 py-2.5">Mã HS</th>
                    <th className="px-4 py-2.5">Họ và Tên</th>
                    <th className="px-4 py-2.5">Trạng Thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-semibold text-slate-300">
                  {students
                    .filter(s => s.classId === selectedClassDetail.id)
                    .map(student => (
                      <tr key={student.id} className="hover:bg-slate-950/60">
                        <td className="px-4 py-2.5 font-mono text-amber-400 font-bold">{student.studentCode}</td>
                        <td className="px-4 py-2.5 font-bold text-white">{student.displayName}</td>
                        <td className="px-4 py-2.5">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${isUserLocked(student) ? 'bg-rose-950 text-rose-300' : 'bg-emerald-950 text-emerald-300'}`}>
                            {isUserLocked(student) ? 'Đã khóa' : 'Hoạt động'}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedClassDetail(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
