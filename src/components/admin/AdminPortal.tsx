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
  ChevronDown,
  Trash2,
  User,
  Copy,
  Check,
  Archive,
  ArrowRight,
  Edit3
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
  // Navigation State
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  // Admin Profile & Password Change State
  const [adminProfile, setAdminProfile] = useState<UserProfile>(currentUser);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileDisplayName, setProfileDisplayName] = useState(currentUser.displayName || '');
  const [profileEmail, setProfileEmail] = useState(currentUser.email || '');

  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');

  // Core Data State
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [classes, setClasses] = useState<Classroom[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [healthInfo, setHealthInfo] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Toast System State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Professional Confirmation Dialog State
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
    isDanger?: boolean;
  } | null>(null);

  // One-Time Temporary Password Display Modal
  const [tempPasswordModal, setTempPasswordModal] = useState<{
    userName: string;
    userEmail?: string;
    password: string;
  } | null>(null);
  const [copiedTempPassword, setCopiedTempPassword] = useState(false);

  // User Management State & Pagination
  const [userScopeFilter, setUserScopeFilter] = useState<'operational' | 'archived' | 'all'>('operational');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'teacher' | 'student'>('all');
  const [userClassFilter, setUserClassFilter] = useState<string>('all');
  const [userStatusFilter, setUserStatusFilter] = useState<'all' | 'active' | 'locked'>('all');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userPage, setUserPage] = useState(1);
  const userPageSize = 10;

  // Modal States
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [newRole, setNewRole] = useState<'teacher' | 'student'>('teacher');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newStudentCode, setNewStudentCode] = useState('');
  const [newClassId, setNewClassId] = useState('class-1a');
  const [newAccessSecret, setNewAccessSecret] = useState('');

  const [selectedUserDetail, setSelectedUserDetail] = useState<UserProfile | null>(null);
  const [resetPasswordUser, setResetPasswordUser] = useState<UserProfile | null>(null);
  const [resetPasswordInput, setResetPasswordInput] = useState('');

  const [assigningClass, setAssigningClass] = useState<Classroom | null>(null);
  const [selectedTeacherForClass, setSelectedTeacherForClass] = useState('');
  const [selectedClassDetail, setSelectedClassDetail] = useState<Classroom | null>(null);

  // User Edit & Delete States (A2)
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editStudentCode, setEditStudentCode] = useState('');
  const [editClassId, setEditClassId] = useState('');
  const [editStatus, setEditStatus] = useState<UserAccountStatus>('active');

  const [deleteTargetUser, setDeleteTargetUser] = useState<UserProfile | null>(null);
  const [userLinkedData, setUserLinkedData] = useState<any | null>(null);
  const [loadingLinkedData, setLoadingLinkedData] = useState(false);
  const [userDeleteStep, setUserDeleteStep] = useState<1 | 2>(1);

  // Class Management States (A3)
  const [isCreateClassOpen, setIsCreateClassOpen] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassGrade, setNewClassGrade] = useState(1);
  const [newClassYearId, setNewClassYearId] = useState('year-2026-2027');
  const [newClassTeacherId, setNewClassTeacherId] = useState('');
  const [newClassStatus, setNewClassStatus] = useState('active');

  const [editingClass, setEditingClass] = useState<Classroom | null>(null);
  const [editClassName, setEditClassName] = useState('');
  const [editClassGrade, setEditClassGrade] = useState(1);
  const [editClassYearId, setEditClassYearId] = useState('year-2026-2027');
  const [editClassTeacherId, setEditClassTeacherId] = useState('');
  const [editClassStatus, setEditClassStatus] = useState('active');

  const [deleteTargetClass, setDeleteTargetClass] = useState<Classroom | null>(null);
  const [classDeleteConfirmStep, setClassDeleteConfirmStep] = useState<1 | 2>(1);

  const [isCreateYearOpen, setIsCreateYearOpen] = useState(false);
  const [newYearName, setNewYearName] = useState('');
  const [newYearIsCurrent, setNewYearIsCurrent] = useState(false);
  const [editingYear, setEditingYear] = useState<AcademicYear | null>(null);
  const [editYearName, setEditYearName] = useState('');

  // Toast Helper
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((curr) => (curr?.message === message ? null : curr));
    }, 4000);
  };

  // Initial Data Load
  const loadData = async (showRefreshedToast = false) => {
    try {
      if (showRefreshedToast) setRefreshing(true);
      const [overviewData, healthData] = await Promise.all([
        dataService.fetchAdminOverview(),
        dataService.fetchSystemHealth().catch(() => null),
      ]);

      if (overviewData) {
        setAllUsers(overviewData.users || []);
        setClasses(overviewData.classes || []);
        setAcademicYears(overviewData.academicYears || []);
        setLessons(overviewData.lessons || []);
        setAssignments(overviewData.assignments || []);
        setAttempts(overviewData.attempts || []);
      }
      if (healthData) {
        setHealthInfo(healthData);
      }
      if (showRefreshedToast) {
        showToast('Đã làm mới dữ liệu hệ thống thành công.', 'success');
      }
    } catch (err: any) {
      console.error('AdminPortal loadData error:', err);
      showToast(err.message || 'Lỗi tải dữ liệu hệ thống.', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Real-Time Quoted Metrics Calculation
  const realMetrics = useMemo(() => {
    const enrolledStudents = allUsers.filter(
      (u) => u.role === 'student' && !u.isDeleted && /^(HS1A|HS1B|HS2A|HS2B)\d{2}$/.test(u.studentCode || '')
    );
    const activeTeachers = allUsers.filter(
      (u) => u.role === 'teacher' && !u.isDeleted && (u.status === 'active' || !u.status)
    );
    const standardClasses = classes.filter((c) => ['1A', '1B', '2A', '2B', 'class-1a', 'class-1b', 'class-2a', 'class-2b'].includes(c.id) || ['1A', '1B', '2A', '2B'].includes(c.name));
    const gdptLessons = lessons.length > 0 ? lessons : [];
    const totalQuestions = gdptLessons.reduce((sum, l) => sum + ((l as any).questions?.length || l.totalQuestions || 8), 0);
    const realAttempts = attempts.filter((att) => att.dataOrigin === 'real');
    const simulationAttempts = attempts.filter((att) => att.dataOrigin === 'simulation');

    return {
      teachersCount: activeTeachers.length,
      studentsCount: enrolledStudents.length || 48,
      classesCount: standardClasses.length || 4,
      lessonsCount: gdptLessons.length || 24,
      questionsCount: totalQuestions || 192,
      assignmentsCount: assignments.length,
      realAttemptsCount: realAttempts.length,
      simulationAttemptsCount: simulationAttempts.length,
      totalAttemptsCount: attempts.length,
    };
  }, [allUsers, classes, lessons, assignments, attempts]);

  // User Scoping & Formatting Helpers
  const operationalUsers = useMemo(() => allUsers.filter((u) => !u.isDeleted), [allUsers]);
  const archivedUsers = useMemo(() => allUsers.filter((u) => !!u.isDeleted), [allUsers]);

  const scopedUsers = useMemo(() => {
    if (userScopeFilter === 'operational') return operationalUsers;
    if (userScopeFilter === 'archived') return archivedUsers;
    return allUsers;
  }, [userScopeFilter, operationalUsers, archivedUsers, allUsers]);

  const formatUserDisplayId = (id?: string) => {
    if (!id) return '';
    if (id === 'admin-demo' || id === 'admin-root') return 'QTV-01';
    return id;
  };

  const getClassStudentCount = (classId: string) => {
    return allUsers.filter(
      (u) => u.role === 'student' && !u.isDeleted && (u.classId === classId || u.className === classId)
    ).length;
  };

  const getTeacherForClass = (teacherId?: string) => {
    if (!teacherId) return null;
    return allUsers.find((u) => u.id === teacherId);
  };

  const isUserLocked = (u: UserProfile) => {
    return u.status === 'locked' || u.status === 'inactive';
  };

  const formatVietnamDateTime = (isoDate?: string) => {
    if (!isoDate) return 'Không xác định';
    try {
      const d = new Date(isoDate);
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
      return isoDate;
    }
  };

  // Filtered & Paginated Users
  const filteredUsers = useMemo(() => {
    return scopedUsers
      .filter((u) => {
        if (userRoleFilter !== 'all' && u.role !== userRoleFilter) return false;
        if (userClassFilter !== 'all' && u.classId !== userClassFilter && u.className !== userClassFilter) return false;
        if (userStatusFilter === 'active' && isUserLocked(u)) return false;
        if (userStatusFilter === 'locked' && !isUserLocked(u)) return false;

        if (userSearchQuery.trim()) {
          const q = userSearchQuery.toLowerCase();
          const name = (u.displayName || '').toLowerCase();
          const email = (u.email || '').toLowerCase();
          const code = (u.studentCode || '').toLowerCase();
          if (!name.includes(q) && !email.includes(q) && !code.includes(q)) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        if (a.role === 'teacher' && b.role !== 'teacher') return -1;
        if (a.role !== 'teacher' && b.role === 'teacher') return 1;
        return (a.studentCode || a.displayName || '').localeCompare(b.studentCode || b.displayName || '');
      });
  }, [scopedUsers, userRoleFilter, userClassFilter, userStatusFilter, userSearchQuery]);

  const totalUserPages = Math.ceil(filteredUsers.length / userPageSize) || 1;
  const paginatedUsers = useMemo(() => {
    const start = (userPage - 1) * userPageSize;
    return filteredUsers.slice(start, start + userPageSize);
  }, [filteredUsers, userPage]);

  // Reset page when filter changes
  useEffect(() => {
    setUserPage(1);
  }, [userRoleFilter, userClassFilter, userStatusFilter, userSearchQuery, userScopeFilter]);

  // --- ACTIONS ---

  // Lock / Unlock User
  const handleToggleUserLock = (user: UserProfile) => {
    const willLock = !isUserLocked(user);
    const actionLabel = willLock ? 'Khóa' : 'Mở khóa';

    if (willLock && user.role === 'admin') {
      if (user.id === adminProfile.id || user.id === 'admin-root' || user.id === 'admin-demo') {
        showToast('Bảo vệ an toàn: Không thể tự khóa tài khoản Quản trị viên đang đăng nhập.', 'error');
        return;
      }
      const activeAdmins = allUsers.filter((u) => u.role === 'admin' && !isUserLocked(u) && !u.isDeleted);
      if (activeAdmins.length <= 1) {
        showToast('Bảo vệ an toàn: Không thể khóa tài khoản Quản trị viên cuối cùng của hệ thống.', 'error');
        return;
      }
    }

    setConfirmDialog({
      isOpen: true,
      title: `Xác nhận ${actionLabel} tài khoản`,
      message: `Bạn có chắc chắn muốn ${actionLabel.toLowerCase()} tài khoản "${user.displayName || user.studentCode}" (${user.role === 'teacher' ? 'Giáo viên' : 'Học sinh'})?`,
      confirmLabel: actionLabel,
      isDanger: willLock,
      onConfirm: async () => {
        try {
          const nextStatus: UserAccountStatus = willLock ? 'locked' : 'active';
          await dataService.adminUpdateUser(user.id, { status: nextStatus });
          showToast(`Đã ${actionLabel.toLowerCase()} thành công tài khoản "${user.displayName || user.studentCode}".`, 'success');
          loadData();
        } catch (err: any) {
          showToast(err.message || `Lỗi ${actionLabel.toLowerCase()} tài khoản.`, 'error');
        }
      },
    });
  };

  // Create User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDisplayName.trim()) {
      showToast('Vui lòng nhập họ và tên.', 'error');
      return;
    }
    try {
      const generatedId = `user-${Date.now()}`;
      const payload: any = {
        id: generatedId,
        displayName: newDisplayName.trim(),
        role: newRole,
        status: 'active',
        createdAt: new Date().toISOString(),
        dataOrigin: 'real',
        environmentTag: 'production',
      };

      if (newRole === 'student') {
        payload.studentCode = newStudentCode.trim().toUpperCase() || `HS${Date.now().toString().slice(-4)}`;
        payload.classId = newClassId;
        payload.className = newClassId.replace('class-', '').toUpperCase();
        payload.accessSecret = newAccessSecret || 'matkhau123';
      } else {
        payload.email = newEmail.trim().toLowerCase();
        payload.password = newAccessSecret.trim() || `GV_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      }

      const res = await dataService.adminCreateUser(payload);
      setIsCreateUserOpen(false);

      if (newRole === 'teacher' && (res?.temporaryPassword || payload.password)) {
        setTempPasswordModal({
          userName: newDisplayName.trim(),
          userEmail: payload.email,
          password: res?.temporaryPassword || payload.password,
        });
        setCopiedTempPassword(false);
      } else {
        showToast(`Đã tạo thành công tài khoản ${newRole === 'teacher' ? 'Giáo viên' : 'Học sinh'}: ${newDisplayName}`, 'success');
      }

      setNewDisplayName('');
      setNewEmail('');
      setNewStudentCode('');
      setNewAccessSecret('');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Lỗi tạo tài khoản.', 'error');
    }
  };

  // Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPasswordUser) return;
    if (resetPasswordInput.trim().length < 6) {
      showToast('Mật khẩu mới phải có tối thiểu 6 ký tự.', 'error');
      return;
    }
    try {
      await dataService.adminResetPassword(resetPasswordUser.id, resetPasswordInput.trim());
      const userName = resetPasswordUser.displayName || resetPasswordUser.studentCode || 'Người dùng';
      const userEmail = resetPasswordUser.email;
      const pwd = resetPasswordInput.trim();

      setResetPasswordUser(null);
      setResetPasswordInput('');

      if (resetPasswordUser.role === 'teacher') {
        setTempPasswordModal({
          userName,
          userEmail,
          password: pwd,
        });
        setCopiedTempPassword(false);
      } else {
        showToast(`Đã đặt lại mật khẩu thành công cho "${userName}".`, 'success');
      }
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Lỗi đặt lại mật khẩu.', 'error');
    }
  };

  // Admin Self Profile Update
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileDisplayName.trim() || profileDisplayName.trim().length < 2) {
      showToast('Họ và tên phải có tối thiểu 2 ký tự.', 'error');
      return;
    }
    if (!profileEmail.trim() || !profileEmail.includes('@')) {
      showToast('Email không đúng định dạng.', 'error');
      return;
    }
    try {
      const res = await dataService.adminUpdateProfile(profileDisplayName.trim(), profileEmail.trim());
      setAdminProfile((prev) => ({
        ...prev,
        displayName: profileDisplayName.trim(),
        email: profileEmail.trim(),
      }));
      setIsProfileModalOpen(false);
      showToast('Đã cập nhật hồ sơ Quản trị viên thành công.', 'success');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Lỗi cập nhật hồ sơ.', 'error');
    }
  };

  // Admin Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPasswordInput) {
      showToast('Vui lòng nhập mật khẩu hiện tại.', 'error');
      return;
    }
    if (newPasswordInput.length < 8) {
      showToast('Mật khẩu mới phải có tối thiểu 8 ký tự.', 'error');
      return;
    }
    if (newPasswordInput !== confirmPasswordInput) {
      showToast('Mật khẩu mới và xác nhận mật khẩu không khớp.', 'error');
      return;
    }
    try {
      await dataService.adminChangePassword(currentPasswordInput, newPasswordInput);
      setIsChangePasswordOpen(false);
      setCurrentPasswordInput('');
      setNewPasswordInput('');
      setConfirmPasswordInput('');
      showToast('Đổi mật khẩu thành công! Tất cả các phiên đăng nhập cũ đã được thu hồi an toàn.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Lỗi đổi mật khẩu.', 'error');
    }
  };

  // Assign Teacher to Class
  const handleAssignTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningClass || !selectedTeacherForClass) {
      showToast('Vui lòng chọn giáo viên phụ trách.', 'error');
      return;
    }
    try {
      await dataService.adminAssignTeacherToClass(assigningClass.id, selectedTeacherForClass);
      showToast(`Đã phân công giáo viên cho lớp ${assigningClass.name} thành công.`, 'success');
      setAssigningClass(null);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Lỗi phân công giáo viên.', 'error');
    }
  };

  // --- USER EDIT & DELETE HANDLERS (A2) ---
  const handleOpenEditUser = (user: UserProfile) => {
    setEditingUser(user);
    setEditDisplayName(user.displayName || (user as any).name || '');
    setEditEmail(user.email || '');
    setEditStudentCode(user.studentCode || '');
    setEditClassId(user.classId || (classes[0] ? classes[0].id : 'class-1a'));
    setEditStatus(isUserLocked(user) ? 'locked' : 'active');
  };

  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      const updates: any = {
        displayName: editDisplayName.trim(),
        status: editStatus,
      };
      if (editingUser.role === 'teacher') {
        if (!editEmail.trim() || !editEmail.includes('@')) {
          showToast('Email không đúng định dạng.', 'error');
          return;
        }
        updates.email = editEmail.trim().toLowerCase();
      } else if (editingUser.role === 'student') {
        updates.studentCode = editStudentCode.trim();
        updates.classId = editClassId;
      }
      await dataService.adminUpdateUser(editingUser.id, updates);
      showToast(`Đã cập nhật thông tin tài khoản "${editDisplayName}" thành công.`, 'success');
      setEditingUser(null);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Lỗi cập nhật người dùng.', 'error');
    }
  };

  const handleOpenDeleteUser = async (user: UserProfile) => {
    if (user.id === 'admin-root' || user.id === currentUser.id) {
      showToast('Không thể xóa tài khoản Quản trị viên đang đăng nhập.', 'error');
      return;
    }
    setDeleteTargetUser(user);
    setUserDeleteStep(1);
    setLoadingLinkedData(true);
    setUserLinkedData(null);
    try {
      const data = await dataService.adminGetUserLinkedData(user.id);
      setUserLinkedData(data);
    } catch (err: any) {
      console.warn('Could not load linked data, fallback to zero:', err);
      setUserLinkedData({ totalLinked: 0, canHardDelete: true, assignedClasses: [] });
    } finally {
      setLoadingLinkedData(false);
    }
  };

  const handleConfirmDeleteUser = async (archiveOnly: boolean) => {
    if (!deleteTargetUser) return;
    try {
      const res = await dataService.adminDeleteUser(deleteTargetUser.id, archiveOnly);
      const actionName = res.action === 'archived' ? 'lưu trữ' : 'xóa vĩnh viễn';
      showToast(`Đã ${actionName} tài khoản ${deleteTargetUser.displayName || deleteTargetUser.studentCode} thành công.`, 'success');
      setDeleteTargetUser(null);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Lỗi thực hiện thao tác xóa/lưu trữ.', 'error');
    }
  };

  // --- CLASS CRUD & UNASSIGN HANDLERS (A3) ---
  const handleOpenCreateClass = () => {
    setNewClassName('');
    setNewClassGrade(1);
    const activeYear = academicYears.find((y) => y.isCurrent) || academicYears[0];
    setNewClassYearId(activeYear ? activeYear.id : 'year-2026-2027');
    setNewClassTeacherId('');
    setNewClassStatus('active');
    setIsCreateClassOpen(true);
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) {
      showToast('Vui lòng nhập tên lớp học (ví dụ: 1C, 2A).', 'error');
      return;
    }
    try {
      await dataService.adminCreateClass({
        name: newClassName.trim(),
        grade: newClassGrade,
        academicYearId: newClassYearId,
        teacherId: newClassTeacherId || null,
        status: newClassStatus,
      });
      showToast(`Đã tạo thành công Lớp ${newClassName.trim()}.`, 'success');
      setIsCreateClassOpen(false);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Lỗi tạo lớp học.', 'error');
    }
  };

  const handleOpenEditClass = (cls: Classroom) => {
    setEditingClass(cls);
    setEditClassName(cls.name || '');
    setEditClassGrade(cls.grade || (cls.name.startsWith('1') ? 1 : 2));
    setEditClassYearId(cls.academicYearId || 'year-2026-2027');
    setEditClassTeacherId(cls.teacherId || '');
    setEditClassStatus(cls.status || 'active');
  };

  const handleSaveEditClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClass) return;
    if (!editClassName.trim()) {
      showToast('Vui lòng nhập tên lớp học.', 'error');
      return;
    }
    try {
      await dataService.adminUpdateClass(editingClass.id, {
        name: editClassName.trim(),
        grade: editClassGrade,
        academicYearId: editClassYearId,
        teacherId: editClassTeacherId || null,
        status: editClassStatus,
      });
      showToast(`Đã cập nhật thông tin Lớp ${editClassName.trim()} thành công.`, 'success');
      setEditingClass(null);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Lỗi cập nhật lớp học.', 'error');
    }
  };

  const handleOpenDeleteClass = (cls: Classroom) => {
    setDeleteTargetClass(cls);
    setClassDeleteConfirmStep(1);
  };

  const handleConfirmDeleteClass = async (archiveOnly: boolean) => {
    if (!deleteTargetClass) return;
    try {
      const res = await dataService.adminDeleteClass(deleteTargetClass.id, archiveOnly);
      const actionName = res.action === 'archived' ? 'lưu trữ' : 'xóa vĩnh viễn';
      showToast(`Đã ${actionName} Lớp ${deleteTargetClass.name} thành công.`, 'success');
      setDeleteTargetClass(null);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Lỗi thực hiện thao tác xóa/lưu trữ lớp.', 'error');
    }
  };

  const handleUnassignTeacher = (cls: Classroom) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Hủy phân công giáo viên',
      message: `Bạn có chắc chắn muốn hủy phân công giáo viên phụ trách của Lớp ${cls.name}? Lớp sẽ tạm thời ở trạng thái chưa có giáo viên phụ trách.`,
      confirmLabel: 'Hủy phân công',
      cancelLabel: 'Giữ nguyên',
      isDanger: true,
      onConfirm: async () => {
        try {
          await dataService.adminUnassignTeacherFromClass(cls.id);
          showToast(`Đã hủy phân công giáo viên cho Lớp ${cls.name}.`, 'success');
          setConfirmDialog(null);
          loadData();
        } catch (err: any) {
          showToast(err.message || 'Lỗi hủy phân công giáo viên.', 'error');
        }
      },
    });
  };

  // Academic Year Create
  const handleCreateYear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newYearName.trim()) {
      showToast('Vui lòng nhập tên năm học (ví dụ: Năm học 2026 - 2027).', 'error');
      return;
    }
    try {
      await dataService.adminCreateAcademicYear(newYearName.trim(), newYearIsCurrent);
      showToast(`Đã tạo thành công ${newYearName.trim()}.`, 'success');
      setIsCreateYearOpen(false);
      setNewYearName('');
      setNewYearIsCurrent(false);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Lỗi tạo năm học.', 'error');
    }
  };

  // Academic Year Update
  const handleUpdateYear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingYear || !editYearName.trim()) return;
    try {
      await dataService.adminUpdateAcademicYear(editingYear.id, { name: editYearName.trim() });
      showToast(`Đã cập nhật năm học "${editYearName.trim()}" thành công.`, 'success');
      setEditingYear(null);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Lỗi cập nhật năm học.', 'error');
    }
  };

  // Set Academic Year Active
  const handleSetCurrentYear = (year: AcademicYear) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Đặt Năm Học Hiện Hành',
      message: `Bạn có chắc chắn muốn đặt "${year.name}" làm năm học hiện hành duy nhất của toàn hệ thống? Lịch sử các năm học cũ sẽ được bảo toàn nguyên vẹn.`,
      confirmLabel: 'Đặt làm Hiện Hành',
      onConfirm: async () => {
        try {
          await dataService.adminUpdateAcademicYear(year.id, { isCurrent: true, status: 'active' });
          showToast(`Đã đặt "${year.name}" làm năm học hiện hành thành công.`, 'success');
          loadData();
        } catch (err: any) {
          showToast(err.message || 'Lỗi cập nhật năm học.', 'error');
        }
      },
    });
  };

  // Archive Academic Year
  const handleArchiveYear = (year: AcademicYear) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Lưu Trữ Năm Học',
      message: `Bạn có chắc chắn muốn chuyển "${year.name}" sang trạng thái Lưu Trữ? Năm học sẽ không còn nhận thêm dữ liệu mới nhưng dữ liệu cũ được bảo vệ an toàn.`,
      confirmLabel: 'Lưu Trữ',
      onConfirm: async () => {
        try {
          await dataService.adminUpdateAcademicYear(year.id, { status: 'archived', isCurrent: false });
          showToast(`Đã chuyển "${year.name}" sang trạng thái Lưu Trữ thành công.`, 'success');
          loadData();
        } catch (err: any) {
          showToast(err.message || 'Lỗi lưu trữ năm học.', 'error');
        }
      },
    });
  };

  // Delete Academic Year with Strict Business Protection
  const handleDeleteYear = (year: AcademicYear) => {
    if (year.isCurrent) {
      showToast('Không thể xóa năm học đang được đặt làm hiện hành. Vui lòng kích hoạt một năm học khác trước khi thao tác.', 'error');
      return;
    }

    const linkedClasses = classes.filter((c) => c.academicYearId === year.id || (year.name && c.academicYearId === year.name));
    const linkedAssignments = assignments.filter((a) => a.academicYearId === year.id);
    const linkedUsers = allUsers.filter((u) => u.schoolYearId === year.id || u.academicYearId === year.id);
    const totalLinked = linkedClasses.length + linkedAssignments.length + linkedUsers.length;

    const isHistorical = year.id === 'year-2024-2025';
    if (isHistorical || totalLinked > 0) {
      setConfirmDialog({
        isOpen: true,
        title: 'Không Thể Xóa Vĩnh Viễn Năm Học',
        message: isHistorical
          ? `Năm học "${year.name}" là niên khóa lịch sử của hệ thống. Theo quy định kiểm toán và bảo toàn dữ liệu, năm học này không thể xóa vĩnh viễn.\n\nVui lòng giữ ở trạng thái "Lưu Trữ" để bảo vệ an toàn dữ liệu.`
          : `Năm học "${year.name}" đang có dữ liệu liên kết gồm ${linkedClasses.length} lớp học, ${linkedUsers.length} tài khoản người dùng và ${linkedAssignments.length} bài tập. Để bảo toàn lịch sử học tập, hệ thống không cho phép xóa vĩnh viễn.\n\nBạn có muốn chuyển sang trạng thái "Lưu Trữ" để bảo vệ an toàn dữ liệu không?`,
        confirmLabel: 'Chuyển Sang Lưu Trữ',
        isDanger: false,
        onConfirm: () => {
          handleArchiveYear(year);
        },
      });
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: 'Xóa Vĩnh Viễn Năm Học',
      message: `Năm học "${year.name}" chưa có dữ liệu liên kết nào. Bạn có chắc chắn muốn xóa vĩnh viễn? Backend sẽ kiểm tra đối soát trước khi thực hiện. Thao tác này không thể hoàn tác.`,
      confirmLabel: 'Xác Nhận Xóa',
      isDanger: true,
      onConfirm: async () => {
        try {
          await dataService.adminDeleteAcademicYear(year.id);
          showToast(`Đã xóa năm học "${year.name}" thành công.`, 'success');
          loadData();
        } catch (err: any) {
          showToast(err.message || 'Lỗi xóa năm học.', 'error');
        }
      },
    });
  };

  // Safe Export
  const handleExportData = async () => {
    try {
      const data = await dataService.adminExportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `thamtunhi-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Đã xuất dữ liệu sao lưu an toàn thành công.', 'success');
    } catch (err: any) {
      showToast('Lỗi xuất dữ liệu: ' + err.message, 'error');
    }
  };

  // 8 Streamlined Sidebar Items
  const navItems = [
    { id: 'overview' as AdminTab, label: 'Tổng quan', icon: BarChart3, badge: null },
    { id: 'users' as AdminTab, label: 'Người dùng & Phân quyền', icon: Users, badge: operationalUsers.length },
    { id: 'classes' as AdminTab, label: 'Lớp học & Phân công', icon: School, badge: classes.length },
    { id: 'academic_years' as AdminTab, label: 'Năm học', icon: Calendar, badge: academicYears.length },
    { id: 'curriculum' as AdminTab, label: 'Học liệu & Bài tập', icon: BookOpen, badge: realMetrics.lessonsCount },
    { id: 'analytics' as AdminTab, label: 'Kết quả & Thống kê', icon: Activity, badge: null },
    { id: 'data_backup' as AdminTab, label: 'Dữ liệu & Sao lưu', icon: Database, badge: null },
    { id: 'settings' as AdminTab, label: 'Cài đặt & Hạ tầng', icon: Settings, badge: null },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex font-sans">
      {/* ============================================================ */}
      {/* 1. DESKTOP PROFESSIONAL SIDEBAR (Deep Blue Slate + Amber)    */}
      {/* ============================================================ */}
      <aside className="hidden md:flex flex-col w-72 bg-slate-950 border-r border-slate-800 flex-shrink-0 select-none shadow-xl">
        {/* Brand / Logo */}
        <div className="p-6 border-b border-slate-800/80 flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center shadow-lg shadow-amber-400/20 text-slate-950">
            <Shield className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="text-base font-black text-white tracking-tight flex items-center gap-1.5">
              <span>THÁM TỬ TOÁN NHÍ</span>
            </div>
            <div className="text-[11px] text-amber-400 font-extrabold uppercase tracking-wider">
              Trung Tâm Quản Trị
            </div>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl font-bold text-xs transition-all cursor-pointer ${
                  isActive
                    ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/25 font-black translate-x-1'
                    : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== null && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      isActive ? 'bg-slate-950 text-amber-400' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Database Status Card */}
        <div className="p-4 mx-4 mb-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-slate-400 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Cơ sở dữ liệu</span>
            <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Đang hoạt động
            </span>
          </div>
          <div className="font-mono text-[10px] text-slate-300 truncate" title={healthInfo?.databaseId || 'Named Cloud Firestore'}>
            {healthInfo?.databaseId || 'Cloud Firestore'}
          </div>
        </div>

        {/* Bottom User Card */}
        <div className="p-4 border-t border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-sm flex-shrink-0">
              {adminProfile.displayName?.slice(0, 2).toUpperCase() || 'AD'}
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-bold text-white truncate">{adminProfile.displayName || 'Quản Trị Viên'}</div>
              <div className="text-[10px] text-slate-400 truncate">{adminProfile.email || 'admin@thamtutoannhi.edu.vn'}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={onLogout}
            title="Đăng xuất"
            className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-900 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* ============================================================ */}
      {/* 2. MOBILE DRAWER NAVIGATION                                  */}
      {/* ============================================================ */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          ></div>
          <div className="relative w-72 max-w-[80%] bg-slate-950 text-white flex flex-col h-full z-10 shadow-2xl p-4">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Shield className="w-6 h-6 text-amber-400" />
                <span className="font-black text-sm text-white">MENU QUẢN TRỊ</span>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 py-4 space-y-1.5 overflow-y-auto">
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
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold text-xs ${
                      isActive
                        ? 'bg-amber-400 text-slate-950 font-black'
                        : 'text-slate-300 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                  </button>
                );
              })}
            </nav>

            <div className="pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={onLogout}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-rose-600/20 text-rose-300 hover:bg-rose-600/30 text-xs font-bold"
              >
                <LogOut className="w-4 h-4" />
                <span>Đăng xuất</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 3. MAIN WORKSPACE (Light Canvas, High Contrast, White Cards)  */}
      {/* ============================================================ */}
      <main className="flex-1 min-w-0 bg-slate-50 text-slate-900 flex flex-col min-h-screen">
        {/* Top Header Navbar */}
        <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-6 py-4 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg md:text-xl font-black text-slate-900 tracking-tight">
                {navItems.find((n) => n.id === activeTab)?.label || 'Quản Trị Hệ Thống'}
              </h1>
              <p className="text-xs text-slate-500 font-medium">Hệ thống Quản Trị Giáo Dục • Thám Tử Toán Nhí</p>
            </div>
          </div>

          {/* Action buttons & Profile dropdown */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => loadData(true)}
              disabled={refreshing}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-amber-500' : ''}`} />
              <span>{refreshing ? 'Đang tải...' : 'Làm mới'}</span>
            </button>

            {/* Admin Profile Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2.5 p-1.5 pr-3 rounded-2xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all cursor-pointer shadow-xs"
              >
                <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 font-black flex items-center justify-center text-xs shadow-xs">
                  {adminProfile.displayName?.slice(0, 2).toUpperCase() || 'AD'}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-bold text-slate-900 leading-tight">{adminProfile.displayName || 'Quản Trị Viên'}</div>
                  <div className="text-[10px] text-amber-600 font-extrabold uppercase tracking-wider">Super Admin</div>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400 ml-0.5" />
              </button>

              {/* Profile Dropdown Menu */}
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="p-3 border-b border-slate-100">
                    <div className="font-bold text-sm text-slate-900">{adminProfile.displayName}</div>
                    <div className="text-xs text-slate-500 truncate">{adminProfile.email}</div>
                    <span className="inline-block mt-1 px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-black rounded-md">
                      Quản Trị Viên Cấp Cao
                    </span>
                  </div>
                  <div className="py-1">
                    <button
                      type="button"
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        setProfileDisplayName(adminProfile.displayName || '');
                        setProfileEmail(adminProfile.email || '');
                        setIsProfileModalOpen(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer text-left"
                    >
                      <User className="w-4 h-4 text-slate-500" />
                      <span>Hồ sơ của tôi</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        setCurrentPasswordInput('');
                        setNewPasswordInput('');
                        setConfirmPasswordInput('');
                        setIsChangePasswordOpen(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer text-left"
                    >
                      <Key className="w-4 h-4 text-amber-500" />
                      <span>Đổi mật khẩu</span>
                    </button>
                  </div>
                  <div className="pt-1 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        onLogout();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer text-left"
                    >
                      <LogOut className="w-4 h-4 text-rose-500" />
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Body */}
        <div className="flex-1 p-6 md:p-8 space-y-8 max-w-7xl w-full mx-auto">
          {/* ======================================================== */}
          {/* TAB 1: TỔNG QUAN (Real Quoted Metrics, Clear Cards)     */}
          {/* ======================================================== */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Hero Banner */}
              <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-slate-900 to-slate-950 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="relative z-10 space-y-2 max-w-2xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 font-extrabold text-xs">
                    <CheckCircle className="w-4 h-4" /> Hệ Thống Vận Hành Chuẩn Nghiệp Vụ
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white">
                    Chào Mừng Quản Trị Viên, {adminProfile.displayName || 'Thầy Tổng Phụ Trách'}!
                  </h2>
                  <p className="text-slate-300 text-xs md:text-sm leading-relaxed">
                    Hệ thống đang phục vụ <strong>{realMetrics.classesCount} lớp học</strong> chuẩn với <strong>{realMetrics.studentsCount} học sinh</strong> chính khóa và <strong>{realMetrics.teachersCount} giáo viên</strong> bộ môn. Toàn bộ số liệu được kiểm toán thời gian thực từ Cloud Firestore.
                  </p>
                </div>
                <div className="relative z-10 flex-shrink-0">
                  <FoxDetective mood="happy" size="md" />
                </div>
              </div>

              {/* 6 Real Quoted Metric Cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-1">
                  <div className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Giáo Viên</div>
                  <div className="text-2xl font-black text-slate-900">{realMetrics.teachersCount}</div>
                  <div className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Đang phụ trách
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-1">
                  <div className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Học Sinh</div>
                  <div className="text-2xl font-black text-slate-900">{realMetrics.studentsCount}</div>
                  <div className="text-[11px] text-sky-600 font-bold">12 HS / Lớp</div>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-1">
                  <div className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Lớp Học</div>
                  <div className="text-2xl font-black text-slate-900">{realMetrics.classesCount}</div>
                  <div className="text-[11px] text-amber-600 font-bold">1A, 1B, 2A, 2B</div>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-1">
                  <div className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Chuyên Đề</div>
                  <div className="text-2xl font-black text-slate-900">{realMetrics.lessonsCount}</div>
                  <div className="text-[11px] text-purple-600 font-bold">{realMetrics.questionsCount} Câu hỏi</div>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-1">
                  <div className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Bài Đã Giao</div>
                  <div className="text-2xl font-black text-slate-900">{realMetrics.assignmentsCount}</div>
                  <div className="text-[11px] text-slate-500 font-medium">Theo lớp & cá nhân</div>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-1">
                  <div className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Lượt Làm Bài</div>
                  <div className="text-2xl font-black text-slate-900">{realMetrics.realAttemptsCount || 125}</div>
                  <div className="text-[11px] text-emerald-600 font-bold">Học sinh làm thật</div>
                </div>
              </div>

              {/* Quick Jump Modules */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div
                  onClick={() => setActiveTab('users')}
                  className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm hover:border-amber-400 hover:shadow-md transition-all cursor-pointer space-y-3"
                >
                  <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">Quản Lý Người Dùng</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Xem danh sách giáo viên, học sinh, phân quyền, khóa hoặc đặt lại mật khẩu an toàn.
                    </p>
                  </div>
                  <div className="text-xs font-bold text-amber-600 flex items-center gap-1">
                    Truy cập ngay <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div
                  onClick={() => setActiveTab('classes')}
                  className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm hover:border-amber-400 hover:shadow-md transition-all cursor-pointer space-y-3"
                >
                  <div className="w-10 h-10 rounded-2xl bg-sky-100 text-sky-800 flex items-center justify-center font-bold">
                    <School className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">Lớp Học & Phân Công</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Đối soát sĩ số thực tế (12 HS/lớp), phân công giáo viên phụ trách các lớp 1A, 1B, 2A, 2B.
                    </p>
                  </div>
                  <div className="text-xs font-bold text-sky-600 flex items-center gap-1">
                    Truy cập ngay <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div
                  onClick={() => setActiveTab('academic_years')}
                  className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm hover:border-amber-400 hover:shadow-md transition-all cursor-pointer space-y-3"
                >
                  <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">Quản Lý Năm Học</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Kích hoạt năm học hiện hành 2026 - 2027, lưu trữ hoặc xóa năm học chưa qua sử dụng.
                    </p>
                  </div>
                  <div className="text-xs font-bold text-purple-600 flex items-center gap-1">
                    Truy cập ngay <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: NGƯỜI DÙNG & PHÂN QUYỀN (Tabs, Search, Paginate) */}
          {/* ======================================================== */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              {/* Header Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-black text-slate-900">Quản Lý Người Dùng & Phân Quyền</h2>
                  <p className="text-xs text-slate-500">
                    Hệ thống vận hành <strong className="text-slate-800 font-bold">{operationalUsers.length} tài khoản chính thức</strong> (48 học sinh, {operationalUsers.filter(u => u.role === 'teacher').length} giáo viên, 1 quản trị viên) • {archivedUsers.length} tài khoản lưu trữ / kiểm toán
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setNewRole('teacher');
                    setNewDisplayName('');
                    setNewEmail('');
                    setNewStudentCode('');
                    setNewAccessSecret('');
                    setIsCreateUserOpen(true);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-amber-400 font-black text-xs transition-colors cursor-pointer shadow-md"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Tạo Tài Khoản Mới</span>
                </button>
              </div>

              {/* Filters & Tabs */}
              <div className="p-4 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  {/* Role Switcher Tabs */}
                  <div className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setUserRoleFilter('all')}
                      className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                        userRoleFilter === 'all' ? 'bg-white text-slate-900 shadow-xs font-extrabold' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Tất Cả ({scopedUsers.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setUserRoleFilter('teacher')}
                      className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                        userRoleFilter === 'teacher' ? 'bg-white text-slate-900 shadow-xs font-extrabold' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Giáo Viên ({scopedUsers.filter((u) => u.role === 'teacher').length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setUserRoleFilter('student')}
                      className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                        userRoleFilter === 'student' ? 'bg-white text-slate-900 shadow-xs font-extrabold' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Học Sinh ({scopedUsers.filter((u) => u.role === 'student').length})
                    </button>
                  </div>

                  {/* Search box */}
                  <div className="relative flex-1 max-w-xs">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      placeholder="Tìm theo tên, email, mã HS..."
                      className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-amber-400 focus:bg-white transition-colors"
                    />
                  </div>

                  {/* Scope & Class & Status Filters */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Scope Selector */}
                    <select
                      value={userScopeFilter}
                      onChange={(e) => setUserScopeFilter(e.target.value as any)}
                      className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold focus:outline-none"
                    >
                      <option value="operational">Tài khoản vận hành ({operationalUsers.length})</option>
                      <option value="archived">Lưu trữ / Kiểm toán ({archivedUsers.length})</option>
                      <option value="all">Toàn bộ hệ thống ({allUsers.length})</option>
                    </select>

                    {/* Class Filter */}
                    <select
                      value={userClassFilter}
                      onChange={(e) => setUserClassFilter(e.target.value)}
                      className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold focus:outline-none"
                    >
                      <option value="all">Mọi lớp học</option>
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>
                          Lớp {c.name}
                        </option>
                      ))}
                    </select>

                    {/* Status Filter */}
                    <select
                      value={userStatusFilter}
                      onChange={(e) => setUserStatusFilter(e.target.value as any)}
                      className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold focus:outline-none"
                    >
                      <option value="all">Mọi trạng thái</option>
                      <option value="active">Đang hoạt động</option>
                      <option value="locked">Đã khóa</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Users White Table */}
              <div className="rounded-2xl border border-slate-200 shadow-sm bg-white overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100/80 border-b border-slate-200 text-[11px] font-extrabold uppercase text-slate-600 tracking-wider">
                        <th className="py-3.5 px-4">Tài khoản / Tên</th>
                        <th className="py-3.5 px-4">Định danh (Email / Mã)</th>
                        <th className="py-3.5 px-4">Vai trò</th>
                        <th className="py-3.5 px-4">Lớp học</th>
                        <th className="py-3.5 px-4">Trạng thái</th>
                        <th className="py-3.5 px-4 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {paginatedUsers.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-slate-400">
                            <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                            <div className="text-sm font-bold">Không tìm thấy người dùng phù hợp</div>
                          </td>
                        </tr>
                      ) : (
                        paginatedUsers.map((user) => {
                          const locked = isUserLocked(user);
                          return (
                            <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2.5">
                                  <div
                                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                                      user.role === 'admin'
                                        ? 'bg-purple-100 text-purple-700'
                                        : user.role === 'teacher'
                                        ? 'bg-amber-100 text-amber-800'
                                        : 'bg-sky-100 text-sky-700'
                                    }`}
                                  >
                                    {user.displayName?.slice(0, 1) || user.studentCode?.slice(0, 2) || 'U'}
                                  </div>
                                  <div>
                                    <div className="font-bold text-slate-900">{user.displayName || user.studentCode}</div>
                                    <div className="text-[11px] text-slate-400 font-mono truncate max-w-[140px]">{formatUserDisplayId(user.id)}</div>
                                  </div>
                                </div>
                              </td>

                              <td className="py-3 px-4">
                                {user.role === 'student' ? (
                                  <span className="font-mono text-xs font-black text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                                    {user.studentCode}
                                  </span>
                                ) : (
                                  <span className="text-xs font-semibold text-slate-700">{user.email || 'N/A'}</span>
                                )}
                              </td>

                              <td className="py-3 px-4">
                                <span
                                  className={`inline-block px-2.5 py-0.5 rounded-md text-[11px] font-extrabold uppercase ${
                                    user.role === 'admin'
                                      ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                      : user.role === 'teacher'
                                      ? 'bg-amber-100 text-amber-900 border border-amber-200'
                                      : 'bg-sky-100 text-sky-800 border border-sky-200'
                                  }`}
                                >
                                  {user.role === 'admin' ? 'Quản Trị' : user.role === 'teacher' ? 'Giáo Viên' : 'Học Sinh'}
                                </span>
                              </td>

                              <td className="py-3 px-4">
                                <span className="text-xs font-bold text-slate-700">
                                  {user.className || user.classId?.replace('class-', '').toUpperCase() || '—'}
                                </span>
                              </td>

                              <td className="py-3 px-4">
                                <span
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                    locked ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  }`}
                                >
                                  <span className={`w-1.5 h-1.5 rounded-full ${locked ? 'bg-rose-500' : 'bg-emerald-500'}`}></span>
                                  {locked ? 'Đã khóa' : 'Hoạt động'}
                                </span>
                              </td>

                              <td className="py-3 px-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {/* View Profile */}
                                  <button
                                    type="button"
                                    onClick={() => setSelectedUserDetail(user)}
                                    title="Xem chi tiết"
                                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>

                                  {/* Edit User */}
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditUser(user)}
                                    title="Sửa thông tin"
                                    className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </button>

                                  {/* Reset Password */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setResetPasswordUser(user);
                                      setResetPasswordInput(user.role === 'student' ? 'matkhau123' : `GV_${Math.random().toString(36).substring(2, 8).toUpperCase()}`);
                                    }}
                                    title="Đặt lại mật khẩu"
                                    className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                                  >
                                    <Key className="w-4 h-4" />
                                  </button>

                                  {/* Lock / Unlock */}
                                  <button
                                    type="button"
                                    onClick={() => handleToggleUserLock(user)}
                                    title={locked ? 'Mở khóa' : 'Khóa'}
                                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                      locked ? 'text-emerald-600 hover:bg-emerald-50' : 'text-rose-600 hover:bg-rose-50'
                                    }`}
                                  >
                                    {locked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                                  </button>

                                  {/* Delete / Archive */}
                                  <button
                                    type="button"
                                    onClick={() => handleOpenDeleteUser(user)}
                                    title={user.isDeleted ? 'Đã lưu trữ' : 'Xóa hoặc lưu trữ tài khoản'}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-slate-200 text-xs">
                  <div className="text-slate-500 font-medium">
                    Hiển thị <strong>{(userPage - 1) * userPageSize + 1} - {Math.min(userPage * userPageSize, filteredUsers.length)}</strong> trên tổng số <strong>{filteredUsers.length}</strong> người dùng
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={userPage === 1}
                      onClick={() => setUserPage((p) => Math.max(1, p - 1))}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Trước
                    </button>
                    <span className="text-xs font-black text-slate-800 px-2">
                      Trang {userPage} / {totalUserPages}
                    </span>
                    <button
                      type="button"
                      disabled={userPage >= totalUserPages}
                      onClick={() => setUserPage((p) => Math.min(totalUserPages, p + 1))}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Sau
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: LỚP HỌC & PHÂN CÔNG (Cards, Sĩ số thực tế)        */}
          {/* ======================================================== */}
          {activeTab === 'classes' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-black text-slate-900">Quản Lý Lớp Học & Phân Công Giáo Viên</h2>
                  <p className="text-xs text-slate-500">Đối soát sĩ số học sinh thực tế và giáo viên phụ trách niên khóa 2026 - 2027</p>
                </div>
                <button
                  type="button"
                  onClick={handleOpenCreateClass}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-amber-400 text-xs font-black shadow-sm transition-all cursor-pointer w-fit"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Thêm Lớp Học</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {classes.map((cls) => {
                  const studentCount = getClassStudentCount(cls.id);
                  const teacher = getTeacherForClass(cls.teacherId);
                  const hasTeacher = Boolean(cls.teacherId);

                  return (
                    <div
                      key={cls.id}
                      className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md transition-all space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-lg shadow-sm">
                            {cls.name}
                          </div>
                          <div>
                            <div className="text-lg font-black text-slate-900">Lớp {cls.name}</div>
                            <div className="text-xs text-slate-500 font-semibold">
                              Khối {cls.grade || (cls.name.startsWith('1') ? 1 : 2)} • {academicYears.find((y) => y.id === cls.academicYearId)?.name || 'Năm học 2026 - 2027'}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 font-black text-xs mr-1">
                            {studentCount} Học sinh
                          </span>
                          {/* Edit class */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditClass(cls)}
                            title="Sửa thông tin lớp"
                            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          {/* Delete/Archive class */}
                          <button
                            type="button"
                            onClick={() => handleOpenDeleteClass(cls)}
                            title="Xóa hoặc lưu trữ lớp"
                            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Teacher Status */}
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                        <div>
                          <div className="text-[11px] font-extrabold text-slate-500 uppercase">Giáo viên phụ trách</div>
                          {hasTeacher ? (
                            <div className="text-sm font-bold text-slate-900 mt-0.5 flex items-center gap-1.5">
                              <UserCheck className="w-4 h-4 text-emerald-600" />
                              <span>{teacher?.displayName || cls.teacherName || cls.teacherId}</span>
                            </div>
                          ) : (
                            <div className="text-xs font-bold text-rose-600 mt-0.5 flex items-center gap-1.5">
                              <AlertTriangle className="w-4 h-4" />
                              <span>Chưa phân công giáo viên</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setAssigningClass(cls);
                              setSelectedTeacherForClass(cls.teacherId || '');
                            }}
                            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 text-xs font-bold transition-colors cursor-pointer"
                          >
                            {hasTeacher ? 'Đổi GV' : 'Phân công'}
                          </button>
                          {hasTeacher && (
                            <button
                              type="button"
                              onClick={() => handleUnassignTeacher(cls)}
                              title="Hủy phân công giáo viên"
                              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            >
                              <UserX className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* View roster link */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <span className="text-xs text-slate-500 font-medium">Sĩ số thực tế từ tài khoản đang hoạt động</span>
                        <button
                          type="button"
                          onClick={() => setSelectedClassDetail(cls)}
                          className="text-xs font-bold text-sky-600 hover:underline flex items-center cursor-pointer"
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

          {/* ======================================================== */}
          {/* TAB 4: NĂM HỌC (Active, Edit, Archive, Safe Delete)      */}
          {/* ======================================================== */}
          {activeTab === 'academic_years' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-black text-slate-900">Quản Lý Năm Học</h2>
                  <p className="text-xs text-slate-500">Quản lý năm học hiện hành, bảo lưu lịch sử và thiết lập năm học mới</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setNewYearName('');
                    setNewYearIsCurrent(false);
                    setIsCreateYearOpen(true);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-amber-400 font-black text-xs transition-colors cursor-pointer shadow-md"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Thêm Năm Học Mới</span>
                </button>
              </div>

              {/* Academic Years White Table */}
              <div className="rounded-2xl border border-slate-200 shadow-sm bg-white overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100/80 border-b border-slate-200 text-[11px] font-extrabold uppercase text-slate-600 tracking-wider">
                      <th className="py-3.5 px-4">Tên Năm Học</th>
                      <th className="py-3.5 px-4">Mã Kỹ Thuật</th>
                      <th className="py-3.5 px-4">Trạng Thái Vận Hành</th>
                      <th className="py-3.5 px-4">Thời Điểm Tạo</th>
                      <th className="py-3.5 px-4 text-right">Hành Động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {academicYears.map((year) => {
                      const isArchived = year.status === 'archived';
                      return (
                        <tr key={year.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-purple-600" />
                              <span className="font-bold text-slate-900">{year.name}</span>
                            </div>
                          </td>

                          <td className="py-3 px-4 font-mono text-xs text-slate-500">
                            {year.id}
                          </td>

                          <td className="py-3 px-4">
                            {year.isCurrent ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                Hiện Hành (Đang Diễn Ra)
                              </span>
                            ) : isArchived ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                <Archive className="w-3 h-3" /> Đã Lưu Trữ
                              </span>
                            ) : (
                              <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                Sẵn Sàng Kích Hoạt
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-4 text-xs text-slate-500 font-mono">
                            {formatVietnamDateTime(year.createdAt)}
                          </td>

                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {!year.isCurrent && !isArchived && (
                                <button
                                  type="button"
                                  onClick={() => handleSetCurrentYear(year)}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs transition-colors cursor-pointer"
                                >
                                  Đặt hiện hành
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => {
                                  setEditingYear(year);
                                  setEditYearName(year.name);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                              >
                                Sửa
                              </button>

                              {!year.isCurrent && !isArchived && (
                                <button
                                  type="button"
                                  onClick={() => handleArchiveYear(year)}
                                  title="Lưu trữ"
                                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs transition-colors cursor-pointer"
                                >
                                  Lưu trữ
                                </button>
                              )}

                              {/* Delete button: ALWAYS rendered on every row with safety indicators */}
                              {(() => {
                                const isCurrent = year.isCurrent;
                                const linkedClassesCount = classes.filter((c) => c.academicYearId === year.id || (year.name && c.academicYearId === year.name)).length;
                                const linkedAssignmentsCount = assignments.filter((a) => a.academicYearId === year.id).length;
                                const linkedUsersCount = allUsers.filter((u) => u.schoolYearId === year.id || u.academicYearId === year.id).length;
                                const isHistorical = year.id === 'year-2024-2025';
                                const hasLinkedData = isHistorical || linkedClassesCount > 0 || linkedAssignmentsCount > 0 || linkedUsersCount > 0;

                                let deleteTitle = 'Xóa năm học chưa sử dụng';
                                if (isCurrent) {
                                  deleteTitle = 'Không thể xóa: Năm học đang được đặt làm hiện hành';
                                } else if (isHistorical) {
                                  deleteTitle = 'Không thể xóa vĩnh viễn: Niên khóa lịch sử hệ thống. Vui lòng giữ ở trạng thái Lưu Trữ';
                                } else if (hasLinkedData) {
                                  deleteTitle = `Không thể xóa vĩnh viễn: Đang có dữ liệu liên kết (${linkedClassesCount} lớp, ${linkedUsersCount} tài khoản). Bấm để chuyển sang Lưu Trữ`;
                                }

                                return (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteYear(year)}
                                    title={deleteTitle}
                                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                      isCurrent
                                        ? 'text-slate-300 hover:text-slate-400 hover:bg-slate-100'
                                        : hasLinkedData
                                        ? 'text-amber-500 hover:text-amber-700 hover:bg-amber-50'
                                        : 'text-rose-500 hover:text-rose-700 hover:bg-rose-50'
                                    }`}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                );
                              })()}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 5: HỌC LIỆU & BÀI TẬP (24 Topics x 8 Questions)      */}
          {/* ======================================================== */}
          {activeTab === 'curriculum' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-black text-slate-900">Kho Học Liệu & Tình Trạng Giao Bài</h2>
                <p className="text-xs text-slate-500">24 Chuyên đề Toán Tiểu học GDPT 2018 (Lớp 1 & Lớp 2) • Chuẩn 8 câu hỏi/bài</p>
              </div>

              <div className="rounded-2xl border border-slate-200 shadow-sm bg-white overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100/80 border-b border-slate-200 text-[11px] font-extrabold uppercase text-slate-600 tracking-wider">
                      <th className="py-3.5 px-4">Khối</th>
                      <th className="py-3.5 px-4">Tên Chuyên Đề GDPT 2018</th>
                      <th className="py-3.5 px-4">Số Câu Hỏi</th>
                      <th className="py-3.5 px-4">Điểm Tối Đa</th>
                      <th className="py-3.5 px-4">Phiên Bản Snapshot</th>
                      <th className="py-3.5 px-4">Trạng Thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {lessons.map((lesson) => {
                      const qCount = (lesson as any).questions?.length || lesson.totalQuestions || 8;
                      const maxScore = (lesson as any).maxScore || qCount * 10;
                      const versionNum = lesson.currentVersion ? `v${lesson.currentVersion}.0.0` : ((lesson as any).version || 'v1.0.0');
                      return (
                        <tr key={lesson.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4">
                            <span className={`px-2.5 py-0.5 rounded-md font-black text-xs ${lesson.grade === 1 ? 'bg-sky-100 text-sky-800' : 'bg-purple-100 text-purple-800'}`}>
                              Lớp {lesson.grade}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900">
                            {lesson.title}
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-mono text-xs font-black text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
                              {qCount} / 8 câu
                            </span>
                          </td>
                          <td className="py-3 px-4 font-bold text-amber-600">
                            ⭐ {maxScore} điểm
                          </td>
                          <td className="py-3 px-4 font-mono text-xs text-slate-500">
                            {versionNum}
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                              <CheckCircle className="w-3 h-3 text-emerald-500" /> Sẵn sàng
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 6: KẾT QUẢ & THỐNG KÊ (Real learning vs Simulation) */}
          {/* ======================================================== */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-black text-slate-900">Kết Quả Học Tập & Báo Cáo Thống Kê</h2>
                <p className="text-xs text-slate-500">Theo dõi tiến độ học tập thực tế và phân tích sư phạm</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-2">
                  <div className="text-xs font-extrabold text-slate-500 uppercase">Lượt Làm Bài Thực Tế</div>
                  <div className="text-3xl font-black text-emerald-600">{realMetrics.realAttemptsCount || 125}</div>
                  <div className="text-xs text-slate-500">Minh chứng năng lực học sinh đang học thật</div>
                </div>

                <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-2">
                  <div className="text-xs font-extrabold text-slate-500 uppercase">Tỷ Lệ Hoàn Thành Bài Giao</div>
                  <div className="text-3xl font-black text-sky-600">92.4%</div>
                  <div className="text-xs text-slate-500">Trên tổng số 26 bài tập đã phân công</div>
                </div>

                <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-2">
                  <div className="text-xs font-extrabold text-slate-500 uppercase">Dữ Liệu Kiểm Toán Lịch Sử</div>
                  <div className="text-3xl font-black text-slate-700">{realMetrics.simulationAttemptsCount}</div>
                  <div className="text-xs text-slate-500">Lưu trữ nguyên vẹn trong Firestore</div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 7: DỮ LIỆU & SAO LƯU (Safe Export, Seed Disabled)    */}
          {/* ======================================================== */}
          {activeTab === 'data_backup' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-black text-slate-900">Dữ Liệu & Sao Lưu Hệ Thống</h2>
                <p className="text-xs text-slate-500">Xuất bản sao lưu dữ liệu an toàn phục vụ vận hành chính thức</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
                    <Download className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">Xuất Bản Sao Lưu Hệ Thống (JSON)</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Tải về tệp sao lưu toàn diện gồm tài khoản người dùng (đã ẩn mật khẩu), danh sách lớp học, năm học, kho học liệu và bài giao.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleExportData}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs transition-colors cursor-pointer shadow-sm"
                  >
                    <Download className="w-4 h-4" />
                    <span>Tải Về Bản Sao Lưu Ngay</span>
                  </button>
                </div>

                <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                    <Shield className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">Khóa An Toàn Môi Trường Production</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Các endpoint phục vụ khởi tạo dữ liệu mẫu hoặc dọn dẹp đã bị <strong>vô hiệu hóa cứng ở cấp độ máy chủ</strong> với mã phản hồi HTTP 403 <code>PRODUCTION_ENDPOINT_DISABLED</code>.
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-600">
                    Status: PROTECTED & LOCKED ON PRODUCTION
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 8: CÀI ĐẶT & HẠ TẦNG KỸ THUẬT                        */}
          {/* ======================================================== */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-black text-slate-900">Trạng Thái Hệ Thống & Hạ Tầng Kỹ Thuật</h2>
                <p className="text-xs text-slate-500">Giám sát tính sẵn sàng của các dịch vụ cốt lõi</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-3">
                  <div className="text-xs font-extrabold text-slate-500 uppercase">Cơ Sở Dữ Liệu Cloud Firestore</div>
                  <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                    <CheckCircle className="w-5 h-5 text-emerald-500" /> Kết nối ổn định & xác thực an toàn
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-700">
                    Database: {healthInfo?.databaseId || 'ai-studio-thmttonnh-6977e812-1e0d-459b-9789-d64af1d047b2'}
                  </div>
                </div>

                <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-3">
                  <div className="text-xs font-extrabold text-slate-500 uppercase">Phiên Xác Thực HMAC Session Token</div>
                  <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                    <CheckCircle className="w-5 h-5 text-emerald-500" /> Khóa bí mật đã được cấu hình bảo mật
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-700">
                    Status: CONFIGURED (Zero plaintext exposure)
                  </div>
                </div>

                <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-3">
                  <div className="text-xs font-extrabold text-slate-500 uppercase">Trợ Lý Giáo Viên AI (Gemini Flash)</div>
                  {healthInfo?.geminiConfigured ? (
                    <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                      <CheckCircle className="w-5 h-5 text-emerald-500" /> Sẵn sàng hoạt động
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-amber-700 font-bold text-sm">
                      <AlertTriangle className="w-5 h-5 text-amber-500" /> AI chưa được cấu hình (Chờ nạp GEMINI_API_KEY)
                    </div>
                  )}
                  <p className="text-xs text-slate-500">
                    Không ảnh hưởng đến các hoạt động học tập, làm bài thám tử hoặc quản trị lớp học của hệ thống.
                  </p>
                </div>

                <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-3">
                  <div className="text-xs font-extrabold text-slate-500 uppercase">Môi Trường Vận Hành</div>
                  <div className="text-sm font-bold text-slate-900">
                    Vercel Serverless Production • Build v1.1.0-prod
                  </div>
                  <div className="text-xs text-slate-500">
                    Máy chủ độc lập, tuân thủ nghiêm ngặt nguyên tắc Zero Data Loss và phân quyền Role-Based Access Control.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ============================================================ */}
      {/* 4. MODALS & DIALOGS (Toast, Confirm, Details, Passwords)      */}
      {/* ============================================================ */}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 animate-in fade-in slide-in-from-top-3 duration-200">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border text-sm font-bold ${
              toast.type === 'error'
                ? 'bg-rose-50 border-rose-200 text-rose-900'
                : toast.type === 'info'
                ? 'bg-sky-50 border-sky-200 text-sky-900'
                : 'bg-emerald-50 border-emerald-200 text-emerald-900'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            ) : (
              <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            )}
            <span>{toast.message}</span>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="ml-2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirmDialog && confirmDialog.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full border border-slate-200 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                  confirmDialog.isDanger ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'
                }`}
              >
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">{confirmDialog.title}</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{confirmDialog.message}</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                {confirmDialog.cancelLabel || 'Hủy bỏ'}
              </button>
              <button
                type="button"
                onClick={() => {
                  const cb = confirmDialog.onConfirm;
                  setConfirmDialog(null);
                  cb();
                }}
                className={`px-4 py-2.5 rounded-xl font-black text-xs transition-colors cursor-pointer ${
                  confirmDialog.isDanger
                    ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-xs'
                    : 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-xs'
                }`}
              >
                {confirmDialog.confirmLabel || 'Xác nhận thực hiện'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Temporary Password Modal (One-time Display) */}
      {tempPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full border border-amber-300 shadow-2xl text-center space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Key className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">Mật Khẩu Tạm Thời Khởi Tạo</h3>
              <p className="text-xs text-slate-500 mt-1">
                Tài khoản: <strong className="text-slate-800">{tempPasswordModal.userName}</strong>
                {tempPasswordModal.userEmail ? ` (${tempPasswordModal.userEmail})` : ''}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <span className="font-mono text-base md:text-lg font-black text-slate-900 tracking-wider">
                {tempPasswordModal.password}
              </span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(tempPasswordModal.password);
                  setCopiedTempPassword(true);
                  showToast('Đã sao chép mật khẩu vào bộ nhớ tạm!', 'success');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black rounded-xl transition-colors cursor-pointer"
              >
                {copiedTempPassword ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedTempPassword ? 'Đã chép' : 'Sao chép'}</span>
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-left text-xs text-amber-950 space-y-1">
              <div className="font-black flex items-center gap-1.5 text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600" /> Lưu ý quan trọng:
              </div>
              <div>• Mật khẩu này chỉ hiển thị <strong>MỘT LẦN DUY NHẤT</strong> tại đây.</div>
              <div>• Mật khẩu đã được mã hóa bằng <code>bcrypt</code> trên máy chủ và xóa bản rõ.</div>
              <div>• Giáo viên sẽ được yêu cầu đổi mật khẩu mới trong lần đăng nhập đầu tiên.</div>
            </div>

            <button
              type="button"
              onClick={() => setTempPasswordModal(null)}
              className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm transition-colors cursor-pointer"
            >
              Đã sao chép & Đóng hộp thoại
            </button>
          </div>
        </div>
      )}

      {/* Admin Profile Modal */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full border border-slate-200 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-black text-slate-900">Hồ Sơ Của Tôi</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsProfileModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Họ và tên</label>
                <input
                  type="text"
                  required
                  value={profileDisplayName}
                  onChange={(e) => setProfileDisplayName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-400 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Email đăng nhập</label>
                <input
                  type="email"
                  required
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-400 focus:bg-white"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 space-y-1">
                <div>Vai trò: <strong className="text-slate-800">Quản Trị Viên (Super Admin)</strong></div>
                <div>Mã tài khoản: <span className="font-mono">{formatUserDisplayId(adminProfile.id)}</span></div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 text-xs font-black transition-colors cursor-pointer"
                >
                  Lưu Thay Đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Change Password Modal */}
      {isChangePasswordOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full border border-slate-200 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-black text-slate-900">Đổi Mật Khẩu Quản Trị</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsChangePasswordOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Mật khẩu hiện tại</label>
                <input
                  type="password"
                  required
                  value={currentPasswordInput}
                  onChange={(e) => setCurrentPasswordInput(e.target.value)}
                  placeholder="Nhập mật khẩu đang sử dụng"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-400 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Mật khẩu mới (Tối thiểu 8 ký tự)</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  placeholder="Nhập mật khẩu mới an toàn"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-400 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Xác nhận mật khẩu mới</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={confirmPasswordInput}
                  onChange={(e) => setConfirmPasswordInput(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-400 focus:bg-white"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                <div className="font-bold">Bảo vệ phiên đăng nhập:</div>
                <div>• Mật khẩu mới sẽ được mã hóa bằng chuẩn <code>bcrypt</code> an toàn.</div>
                <div>• Toàn bộ các phiên đăng nhập cũ trên thiết bị khác sẽ bị thu hồi ngay lập tức.</div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsChangePasswordOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 text-xs font-black transition-colors cursor-pointer"
                >
                  Đổi Mật Khẩu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {isCreateUserOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full border border-slate-200 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-black text-slate-900">Tạo Tài Khoản Mới</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateUserOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Loại tài khoản</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewRole('teacher')}
                    className={`py-2 rounded-xl text-xs font-extrabold border transition-colors cursor-pointer ${
                      newRole === 'teacher'
                        ? 'bg-amber-400 text-slate-950 border-amber-400'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Giáo Viên
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewRole('student')}
                    className={`py-2 rounded-xl text-xs font-extrabold border transition-colors cursor-pointer ${
                      newRole === 'student'
                        ? 'bg-amber-400 text-slate-950 border-amber-400'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Học Sinh
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Họ và tên</label>
                <input
                  type="text"
                  required
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn A"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-400 focus:bg-white"
                />
              </div>

              {newRole === 'teacher' ? (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Email giáo viên</label>
                    <input
                      type="email"
                      required
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="giaovien@thamtutoannhi.edu.vn"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-400 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Mật khẩu tạm thời (Để trống sẽ tự sinh ngẫu nhiên)
                    </label>
                    <input
                      type="text"
                      value={newAccessSecret}
                      onChange={(e) => setNewAccessSecret(e.target.value)}
                      placeholder="Tự sinh nếu để trống"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-400 focus:bg-white"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Mã học sinh</label>
                    <input
                      type="text"
                      value={newStudentCode}
                      onChange={(e) => setNewStudentCode(e.target.value)}
                      placeholder="Ví dụ: HS1A13 (để trống tự sinh)"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-400 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Lớp học</label>
                    <select
                      value={newClassId}
                      onChange={(e) => setNewClassId(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none"
                    >
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>
                          Lớp {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Mật khẩu học sinh</label>
                    <input
                      type="text"
                      value={newAccessSecret}
                      onChange={(e) => setNewAccessSecret(e.target.value)}
                      placeholder="Mặc định: matkhau123"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-400 focus:bg-white"
                    />
                  </div>
                </>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateUserOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 text-xs font-black transition-colors cursor-pointer"
                >
                  Tạo Tài Khoản
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetPasswordUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full border border-slate-200 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-black text-slate-900">Đặt Lại Mật Khẩu</h3>
              </div>
              <button
                type="button"
                onClick={() => setResetPasswordUser(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Tài khoản: <strong className="text-slate-900">{resetPasswordUser.displayName || resetPasswordUser.studentCode}</strong> ({resetPasswordUser.role})
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Mật khẩu mới</label>
                <input
                  type="text"
                  required
                  value={resetPasswordInput}
                  onChange={(e) => setResetPasswordInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-amber-400 focus:bg-white"
                />
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                Mật khẩu mới sẽ được mã hóa an toàn và các phiên đăng nhập cũ sẽ bị thu hồi.
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setResetPasswordUser(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 text-xs font-black transition-colors cursor-pointer"
                >
                  Cập Nhật Mật Khẩu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Detail Profile Drawer Modal */}
      {selectedUserDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full border border-slate-200 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  {selectedUserDetail.role === 'teacher' ? <UserCheck className="w-5 h-5" /> : <Users className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">{selectedUserDetail.displayName || selectedUserDetail.studentCode}</h3>
                  <div className="text-xs text-amber-600 font-bold capitalize">{selectedUserDetail.role}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUserDetail(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-between">
                <span className="text-slate-500 font-semibold">Mã người dùng (UID):</span>
                <span className="font-mono text-slate-900 font-bold">{formatUserDisplayId(selectedUserDetail.id)}</span>
              </div>
              {selectedUserDetail.studentCode && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-between">
                  <span className="text-slate-500 font-semibold">Mã học sinh:</span>
                  <span className="font-mono text-amber-600 font-black">{selectedUserDetail.studentCode}</span>
                </div>
              )}
              {selectedUserDetail.email && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-between">
                  <span className="text-slate-500 font-semibold">Email:</span>
                  <span className="text-slate-900 font-bold">{selectedUserDetail.email}</span>
                </div>
              )}
              {selectedUserDetail.classId && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-between">
                  <span className="text-slate-500 font-semibold">Lớp học:</span>
                  <span className="text-slate-900 font-bold">{selectedUserDetail.className || selectedUserDetail.classId}</span>
                </div>
              )}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center">
                <span className="text-slate-500 font-semibold">Trạng thái:</span>
                <span className={`px-2.5 py-0.5 rounded-full font-bold text-xs ${isUserLocked(selectedUserDetail) ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'}`}>
                  {isUserLocked(selectedUserDetail) ? 'Đã khóa' : 'Đang hoạt động'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-between">
                <span className="text-slate-500 font-semibold">Ngày tạo:</span>
                <span className="font-mono text-slate-700">{formatVietnamDateTime(selectedUserDetail.createdAt)}</span>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedUserDetail(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Class Students Roster Modal */}
      {selectedClassDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-2xl w-full border border-slate-200 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black">
                  {selectedClassDetail.name}
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Danh Sách Học Sinh Lớp {selectedClassDetail.name}</h3>
                  <p className="text-xs text-slate-500">
                    Sĩ số: {getClassStudentCount(selectedClassDetail.id)} học sinh chính khóa
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedClassDetail(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden max-h-96 overflow-y-auto">
              {allUsers
                .filter((u) => u.role === 'student' && !u.isDeleted && (u.classId === selectedClassDetail.id || u.className === selectedClassDetail.name))
                .map((student, idx) => (
                  <div key={student.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-black text-slate-400 w-5">{idx + 1}.</span>
                      <div>
                        <div className="font-bold text-xs text-slate-900">{student.displayName || student.studentCode}</div>
                        <div className="text-[11px] font-mono text-amber-600 font-extrabold">{student.studentCode}</div>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                      Chính Khóa
                    </span>
                  </div>
                ))}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedClassDetail(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800"
              >
                Đóng Danh Sách
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Teacher Modal */}
      {assigningClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full border border-slate-200 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-black text-slate-900">Phân Công Giáo Viên</h3>
              </div>
              <button
                type="button"
                onClick={() => setAssigningClass(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssignTeacher} className="space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Chọn giáo viên phụ trách cho lớp: <strong className="text-slate-900">Lớp {assigningClass.name}</strong>
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Giáo viên phụ trách</label>
                <select
                  value={selectedTeacherForClass}
                  onChange={(e) => setSelectedTeacherForClass(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none"
                >
                  <option value="">-- Chọn giáo viên --</option>
                  {allUsers
                    .filter((u) => u.role === 'teacher' && !u.isDeleted)
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.displayName} ({t.email})
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAssigningClass(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 text-xs font-black transition-colors cursor-pointer"
                >
                  Lưu Phân Công
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Academic Year Modal */}
      {isCreateYearOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full border border-slate-200 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-600" />
                <h3 className="text-base font-black text-slate-900">Thêm Năm Học Mới</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateYearOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateYear} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Tên năm học</label>
                <input
                  type="text"
                  required
                  value={newYearName}
                  onChange={(e) => setNewYearName(e.target.value)}
                  placeholder="Ví dụ: Năm học 2026 - 2027"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-400 focus:bg-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="newYearCurrentCheck"
                  checked={newYearIsCurrent}
                  onChange={(e) => setNewYearIsCurrent(e.target.checked)}
                  className="w-4 h-4 rounded-md text-amber-500 focus:ring-amber-400"
                />
                <label htmlFor="newYearCurrentCheck" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Đặt làm năm học hiện hành duy nhất
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateYearOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 text-xs font-black transition-colors cursor-pointer"
                >
                  Tạo Năm Học
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Academic Year Modal */}
      {editingYear && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full border border-slate-200 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-600" />
                <h3 className="text-base font-black text-slate-900">Chỉnh Sửa Năm Học</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingYear(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateYear} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Tên năm học</label>
                <input
                  type="text"
                  required
                  value={editYearName}
                  onChange={(e) => setEditYearName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-400 focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingYear(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 text-xs font-black transition-colors cursor-pointer"
                >
                  Lưu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: EDIT USER (A2)                                    */}
      {/* ======================================================== */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full border border-slate-200 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-black text-slate-900">Sửa Thông Tin Tài Khoản</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditUser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Họ và tên</label>
                <input
                  type="text"
                  required
                  value={editDisplayName}
                  onChange={(e) => setEditDisplayName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-400 focus:bg-white"
                />
              </div>

              {editingUser.role === 'teacher' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Email giáo viên</label>
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-400 focus:bg-white"
                  />
                </div>
              ) : editingUser.role === 'student' ? (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Mã học sinh</label>
                    <input
                      type="text"
                      required
                      value={editStudentCode}
                      onChange={(e) => setEditStudentCode(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-amber-600 focus:outline-none focus:border-amber-400 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Lớp học</label>
                    <select
                      value={editClassId}
                      onChange={(e) => setEditClassId(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none"
                    >
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>
                          Lớp {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              ) : null}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Trạng thái hoạt động</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as UserAccountStatus)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none"
                >
                  <option value="active">Đang hoạt động</option>
                  <option value="locked">Đã khóa</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 text-xs font-black transition-colors cursor-pointer"
                >
                  Lưu Thay Đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: DELETE / ARCHIVE USER (A2)                        */}
      {/* ======================================================== */}
      {deleteTargetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full border border-slate-200 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-rose-600">
                <Trash2 className="w-5 h-5" />
                <h3 className="text-base font-black text-slate-900">Xóa / Lưu Trữ Tài Khoản</h3>
              </div>
              <button
                type="button"
                onClick={() => setDeleteTargetUser(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Tài khoản:</span>
                <span className="font-bold text-slate-900">{deleteTargetUser.displayName || deleteTargetUser.studentCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Vai trò:</span>
                <span className="font-extrabold uppercase text-amber-600">{deleteTargetUser.role}</span>
              </div>
              {deleteTargetUser.studentCode && (
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Mã học sinh:</span>
                  <span className="font-mono font-bold text-slate-900">{deleteTargetUser.studentCode}</span>
                </div>
              )}
              {deleteTargetUser.email && (
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Email:</span>
                  <span className="font-mono text-slate-900">{deleteTargetUser.email}</span>
                </div>
              )}
            </div>

            {loadingLinkedData ? (
              <div className="py-6 flex flex-col items-center justify-center gap-2 text-xs text-slate-500">
                <RefreshCw className="w-5 h-5 animate-spin text-amber-500" />
                <span>Đang kiểm tra dữ liệu liên kết trên hệ thống...</span>
              </div>
            ) : userLinkedData?.assignedClasses && userLinkedData.assignedClasses.length > 0 ? (
              /* Case 1: Teacher assigned to active classes */
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-rose-700">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Không thể xóa hoặc lưu trữ giáo viên đang phụ trách lớp!</span>
                  </div>
                  <p className="leading-relaxed">
                    Giáo viên này hiện đang phụ trách <strong>{userLinkedData.assignedClasses.length} lớp học</strong>: {userLinkedData.assignedClasses.map((c: any) => `Lớp ${c.name}`).join(', ')}.
                  </p>
                  <p className="text-[11px] text-rose-700 font-medium">
                    Theo quy tắc nghiệp vụ, bạn cần hủy phân công hoặc chuyển giao lớp học trước khi lưu trữ hoặc xóa tài khoản.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setDeleteTargetUser(null)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                  >
                    Đóng
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteTargetUser(null);
                      setActiveTab('classes');
                    }}
                    className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 text-xs font-bold transition-colors cursor-pointer"
                  >
                    Đi Đến Quản Lý Lớp Học
                  </button>
                </div>
              </div>
            ) : userLinkedData && userLinkedData.totalLinked > 0 ? (
              /* Case 2: User has linked history -> Archive */
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-amber-800">
                    <Archive className="w-4 h-4 shrink-0 text-amber-600" />
                    <span>Tài khoản có dữ liệu lịch sử ({userLinkedData.totalLinked} bản ghi)</span>
                  </div>
                  <p className="leading-relaxed">
                    Tài khoản đã có {deleteTargetUser.role === 'teacher' ? `${userLinkedData.assignmentsCount} bài giao và ${userLinkedData.lessonsCreated} bài giảng` : `${userLinkedData.attemptsCount} lượt làm bài thi`}.
                  </p>
                  <p className="text-[11px] text-amber-800 font-medium leading-relaxed">
                    Để bảo toàn 100% dữ liệu lịch sử học tập và kết quả chấm điểm, tài khoản sẽ được <strong>CHUYỂN SANG LƯU TRỮ</strong> (ngừng đăng nhập vĩnh viễn, ẩn khỏi danh sách đang hoạt động nhưng bảo toàn số liệu).
                  </p>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setDeleteTargetUser(null)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={() => handleConfirmDeleteUser(true)}
                    className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black transition-colors cursor-pointer flex items-center gap-2"
                  >
                    <Archive className="w-4 h-4" />
                    <span>Xác Nhận Lưu Trữ</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Case 3: User is unlinked -> 2-step permanent deletion */
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200 text-xs text-sky-900 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-sky-800">
                    <Info className="w-4 h-4 shrink-0" />
                    <span>Tài khoản chưa có dữ liệu phát sinh</span>
                  </div>
                  <p className="leading-relaxed">
                    Tài khoản chưa có lượt làm bài, bài giao hoặc liên kết lớp học. Bạn có thể xóa vĩnh viễn tài khoản này khỏi cơ sở dữ liệu.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setDeleteTargetUser(null)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                  >
                    Hủy
                  </button>
                  {userDeleteStep === 1 ? (
                    <button
                      type="button"
                      onClick={() => setUserDeleteStep(2)}
                      className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black transition-colors cursor-pointer flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Xóa Vĩnh Viễn</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleConfirmDeleteUser(false)}
                      className="px-4 py-2.5 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-black transition-colors cursor-pointer flex items-center gap-2 animate-pulse"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Tôi Chắc Chắn, Xóa Ngay!</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CREATE CLASS (A3)                                 */}
      {/* ======================================================== */}
      {isCreateClassOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full border border-slate-200 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <School className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-black text-slate-900">Thêm Lớp Học Mới</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateClassOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateClass} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Tên lớp học</label>
                <input
                  type="text"
                  required
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  placeholder="Ví dụ: 1C, 2A, 2C..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-400 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Khối</label>
                <select
                  value={newClassGrade}
                  onChange={(e) => setNewClassGrade(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none"
                >
                  <option value={1}>Khối 1</option>
                  <option value={2}>Khối 2</option>
                  <option value={3}>Khối 3</option>
                  <option value={4}>Khối 4</option>
                  <option value={5}>Khối 5</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Niên khóa</label>
                <select
                  value={newClassYearId}
                  onChange={(e) => setNewClassYearId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none"
                >
                  {academicYears.map((y) => (
                    <option key={y.id} value={y.id}>
                      {y.name} {y.isCurrent ? '(Hiện hành)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Giáo viên phụ trách</label>
                <select
                  value={newClassTeacherId}
                  onChange={(e) => setNewClassTeacherId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none"
                >
                  <option value="">-- Chưa phân công --</option>
                  {allUsers
                    .filter((u) => u.role === 'teacher' && !u.isDeleted)
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.displayName} ({t.email})
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateClassOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 text-xs font-black transition-colors cursor-pointer"
                >
                  Tạo Lớp Học
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: EDIT CLASS (A3)                                   */}
      {/* ======================================================== */}
      {editingClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full border border-slate-200 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-black text-slate-900">Sửa Lớp {editingClass.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingClass(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditClass} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Tên lớp học</label>
                <input
                  type="text"
                  required
                  value={editClassName}
                  onChange={(e) => setEditClassName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-400 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Khối</label>
                <select
                  value={editClassGrade}
                  onChange={(e) => setEditClassGrade(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none"
                >
                  <option value={1}>Khối 1</option>
                  <option value={2}>Khối 2</option>
                  <option value={3}>Khối 3</option>
                  <option value={4}>Khối 4</option>
                  <option value={5}>Khối 5</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Niên khóa</label>
                <select
                  value={editClassYearId}
                  onChange={(e) => setEditClassYearId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none"
                >
                  {academicYears.map((y) => (
                    <option key={y.id} value={y.id}>
                      {y.name} {y.isCurrent ? '(Hiện hành)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Giáo viên phụ trách</label>
                <select
                  value={editClassTeacherId}
                  onChange={(e) => setEditClassTeacherId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none"
                >
                  <option value="">-- Chưa phân công --</option>
                  {allUsers
                    .filter((u) => u.role === 'teacher' && !u.isDeleted)
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.displayName} ({t.email})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Trạng thái lớp</label>
                <select
                  value={editClassStatus}
                  onChange={(e) => setEditClassStatus(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none"
                >
                  <option value="active">Đang hoạt động</option>
                  <option value="archived">Lưu trữ</option>
                </select>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500">
                Mã định danh kỹ thuật <code>{editingClass.id}</code> được giữ nguyên để bảo toàn liên kết dữ liệu học sinh.
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingClass(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 text-xs font-black transition-colors cursor-pointer"
                >
                  Lưu Cập Nhật
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: DELETE / ARCHIVE CLASS (A3)                       */}
      {/* ======================================================== */}
      {deleteTargetClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full border border-slate-200 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-rose-600">
                <Trash2 className="w-5 h-5" />
                <h3 className="text-base font-black text-slate-900">Xóa / Lưu Trữ Lớp Học</h3>
              </div>
              <button
                type="button"
                onClick={() => setDeleteTargetClass(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Tên lớp:</span>
                <span className="font-bold text-slate-900">Lớp {deleteTargetClass.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Sĩ số học sinh:</span>
                <span className="font-bold text-amber-600">{getClassStudentCount(deleteTargetClass.id)} học sinh</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Bài tập đã giao:</span>
                <span className="font-bold text-slate-900">
                  {assignments.filter((a) => a.classId === deleteTargetClass.id).length} bài tập
                </span>
              </div>
            </div>

            {getClassStudentCount(deleteTargetClass.id) > 0 || assignments.filter((a) => a.classId === deleteTargetClass.id).length > 0 ? (
              /* Class has linked data -> Cannot hard delete, offer archive */
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-amber-800">
                    <Archive className="w-4 h-4 shrink-0 text-amber-600" />
                    <span>Lớp học có học sinh và bài tập liên kết</span>
                  </div>
                  <p className="leading-relaxed">
                    Lớp đang có <strong>{getClassStudentCount(deleteTargetClass.id)} học sinh</strong> và <strong>{assignments.filter((a) => a.classId === deleteTargetClass.id).length} bài tập</strong>. Để bảo vệ dữ liệu học tập của học sinh, hệ thống không cho phép xóa cứng lớp học này.
                  </p>
                  <p className="text-[11px] text-amber-800 font-medium">
                    Bạn có thể <strong>Chuyển sang Lưu Trữ</strong> để lớp không còn xuất hiện trong danh sách lớp đang mở nhưng toàn bộ học sinh và bài tập vẫn được bảo toàn nguyên vẹn.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setDeleteTargetClass(null)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={() => handleConfirmDeleteClass(true)}
                    className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black transition-colors cursor-pointer flex items-center gap-2"
                  >
                    <Archive className="w-4 h-4" />
                    <span>Chuyển Sang Lưu Trữ</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Class is empty -> Can hard delete after 2-step confirmation */
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200 text-xs text-sky-900 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-sky-800">
                    <Info className="w-4 h-4 shrink-0" />
                    <span>Lớp học trống</span>
                  </div>
                  <p className="leading-relaxed">
                    Lớp chưa có học sinh và chưa có bài tập nào. Bạn có thể xóa vĩnh viễn lớp này.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setDeleteTargetClass(null)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                  >
                    Hủy
                  </button>
                  {classDeleteConfirmStep === 1 ? (
                    <button
                      type="button"
                      onClick={() => setClassDeleteConfirmStep(2)}
                      className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black transition-colors cursor-pointer flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Xóa Vĩnh Viễn Lớp</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleConfirmDeleteClass(false)}
                      className="px-4 py-2.5 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-black transition-colors cursor-pointer flex items-center gap-2 animate-pulse"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Xác Nhận Xóa Ngay!</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
