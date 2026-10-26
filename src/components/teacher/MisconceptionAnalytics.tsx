import React, { useState, useEffect, useMemo } from 'react';
import {
  Download,
  Sparkles,
  Filter,
  CheckCircle,
  TrendingUp,
  RefreshCw,
  Loader2,
  Users,
  BookOpen,
  Award,
  Calendar,
  AlertCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Edit3,
  Lightbulb,
  FileSpreadsheet,
  Check,
  ChevronRight,
  Target
} from 'lucide-react';
import { dataService } from '../../lib/dataService';
import { Attempt, MistakeInsight, MathErrorPattern, Assignment } from '../../types';
import { ERROR_PATTERN_LABELS } from '../../lib/mathEngine';
import { getAuthHeaders } from '../../lib/authSession';

interface MisconceptionAnalyticsProps {
  teacherId: string;
  onOpenLessonEditor?: (lesson: any, version?: any) => void;
}

interface StudentSummary {
  studentId: string;
  studentName: string;
  studentCode: string;
  classId: string;
  totalAssigned: number;
  completedAssignmentsCount: number;
  totalSubmissions: number;
  avgScore: number;
  bestScore: number;
  lastScore: number;
  firstScore: number;
  progressScore: number;
  primaryErrorPattern: string;
  lastCompletedAt: string | null;
}

interface QuestionStat {
  questionId: string;
  questionOrder: number;
  promptSnippet: string;
  totalAttempts: number;
  firstTryCorrectCount: number;
  postHintCorrectCount: number;
  wrongCount: number;
  topDetectedPattern: string;
}

export const MisconceptionAnalytics: React.FC<MisconceptionAnalyticsProps> = ({ teacherId, onOpenLessonEditor }) => {
  // 1. Multi-dimensional Filters (Operating Strictly on Real Operational Submissions)
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>('year-2026-2027');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedWeek, setSelectedWeek] = useState<string>('all');
  const [selectedLesson, setSelectedLesson] = useState<string>('all');
  const [selectedStudent, setSelectedStudent] = useState<string>('all');
  const [selectedTimeRange, setSelectedTimeRange] = useState<'all' | 'today' | '7d' | '30d'>('all');

  // 3. Raw Data
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [insights, setInsights] = useState<MistakeInsight[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [classesList, setClassesList] = useState<any[]>([]);
  const [studentsList, setStudentsList] = useState<any[]>([]);
  const [attemptAnswers, setAttemptAnswers] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [lessonsList, setLessonsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 4. View Mode (Sub-tabs)
  const [activeViewTab, setActiveViewTab] = useState<'taxonomy' | 'students' | 'lessons'>('taxonomy');

  // 5. AI Summary & Pedagogical Recommendations
  const [aiResult, setAiResult] = useState<{
    summary: string;
    strengths?: string;
    topErrors?: string;
    studentsNeedingSupport?: string;
    pedagogicalActions?: string[];
    recommendations?: string[];
    isFallback?: boolean;
    cached?: boolean;
  } | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  // 6. Reinforcement Lesson Draft Creation State
  const [creatingDraft, setCreatingDraft] = useState(false);
  const [draftResult, setDraftResult] = useState<{
    lesson: any;
    version: any;
    message: string;
  } | null>(null);

  useEffect(() => {
    fetchAnalyticsData();
  }, [teacherId]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const data = await dataService.fetchTeacherAnalytics(teacherId);
      setAttempts(data.attempts || []);
      setInsights(data.insights || []);
      setAssignments(data.assignments || []);
      setClassesList(data.classes || []);
      setStudentsList(data.students || []);
      setAttemptAnswers(data.attemptAnswers || []);
      setAcademicYears(data.academicYears || []);
      setLessonsList(data.lessons || []);
    } catch (err) {
      console.error('Fetch analytics error:', err);
    } finally {
      setLoading(false);
    }
  };

  // --- FILTERING ENGINE (Operational Data Strictly Isolated) ---
  const isRealCompletedAttempt = (att: Attempt) =>
    att.dataOrigin !== 'simulation' &&
    att.dataOrigin !== 'test' &&
    !(att as any).isArchivedTest &&
    !att.id.startsWith('att-demo-') &&
    !att.id.includes('-test-') &&
    !att.studentId?.startsWith('student-test-') &&
    att.status === 'completed' &&
    Boolean(att.completedAt);

  const filteredAttempts = useMemo(() => {
    return attempts.filter((a) => {
      // 1. Data Origin & Completion: Strictly real and finished submissions
      if (!isRealCompletedAttempt(a)) return false;

      // 2. Class
      if (selectedClass !== 'all' && a.classId !== selectedClass) return false;

      // 3. Student
      if (selectedStudent !== 'all' && a.studentId !== selectedStudent) return false;

      // 4. Lesson / Assignment
      if (selectedLesson !== 'all' && a.lessonId !== selectedLesson && a.assignmentId !== selectedLesson) return false;

      // 5. Week (cross-referenced with assignments)
      if (selectedWeek !== 'all') {
        const asg = assignments.find((as) => as.id === a.assignmentId || (as.lessonId === a.lessonId && as.classId === a.classId));
        if (!asg || String((asg as any).week) !== String(selectedWeek)) return false;
      }

      // 6. Academic Year (defaults to year-2026-2027)
      if (selectedAcademicYear !== 'all') {
        const asg = assignments.find((as) => as.id === a.assignmentId || (as.lessonId === a.lessonId && as.classId === a.classId));
        const asgYear = asg?.academicYearId || 'year-2026-2027';
        if (asgYear !== selectedAcademicYear) return false;
      }

      // 7. Time Range
      if (selectedTimeRange !== 'all') {
        const dateStr = a.completedAt || a.startedAt;
        if (!dateStr) return false;
        const itemDate = new Date(dateStr).getTime();
        const now = Date.now();
        if (selectedTimeRange === 'today') {
          const isToday = new Date(dateStr).toDateString() === new Date().toDateString();
          if (!isToday) return false;
        } else if (selectedTimeRange === '7d' && now - itemDate > 7 * 86400000) {
          return false;
        } else if (selectedTimeRange === '30d' && now - itemDate > 30 * 86400000) {
          return false;
        }
      }

      return true;
    });
  }, [attempts, assignments, selectedClass, selectedStudent, selectedLesson, selectedWeek, selectedAcademicYear, selectedTimeRange]);

  const filteredAssignments = useMemo(() => {
    return assignments.filter((asg) => {
      if (asg.dataOrigin === 'simulation') return false;
      if (asg.status !== 'open' || asg.status === 'cancelled' || asg.status === 'archived') return false;
      if (selectedClass !== 'all' && asg.classId !== selectedClass) return false;
      if (selectedWeek !== 'all' && String((asg as any).week) !== String(selectedWeek)) return false;
      if (selectedAcademicYear !== 'all') {
        const asgYear = asg.academicYearId || 'year-2026-2027';
        if (asgYear !== selectedAcademicYear) return false;
      }
      if (selectedLesson !== 'all' && asg.lessonId !== selectedLesson && asg.id !== selectedLesson) return false;
      return true;
    });
  }, [assignments, selectedClass, selectedWeek, selectedAcademicYear, selectedLesson]);

  const filteredInsights = useMemo(() => {
    return insights.filter((ins) => {
      if (ins.dataOrigin === 'simulation') return false;
      if (selectedClass !== 'all' && ins.classId !== selectedClass) return false;
      if (selectedStudent !== 'all' && ins.studentId !== selectedStudent) return false;
      return true;
    });
  }, [insights, selectedClass, selectedStudent]);

  // --- ACCURATE KPI METRICS (Requirement A) ---
  const completedAttemptsList = useMemo(() => {
    return filteredAttempts.filter((a) => a.status === 'completed' && Boolean(a.completedAt || a.score > 0));
  }, [filteredAttempts]);

  const totalAttempts = filteredAttempts.length;
  const completedAttempts = completedAttemptsList.length;
  const inProgressAttempts = filteredAttempts.filter((a) => a.status === 'in_progress').length;

  const totalAssignmentsCount = filteredAssignments.length;

  // Target students assigned in selected scope (strictly exclude test accounts and blanks)
  const targetStudents = useMemo(() => {
    return studentsList.filter((s) => {
      if (!s.displayName?.trim() || !s.studentCode?.trim() || s.studentCode === '—' || s.studentCode.startsWith('HSQA')) return false;
      if (selectedClass !== 'all' && s.classId !== selectedClass) return false;
      if (selectedStudent !== 'all' && s.id !== selectedStudent) return false;
      return true;
    });
  }, [studentsList, selectedClass, selectedStudent]);

  const totalStudentsAssigned = targetStudents.length;

  // Unique submitted students
  const uniqueSubmittedStudentIds = useMemo(() => {
    return new Set(completedAttemptsList.map((a) => a.studentId));
  }, [completedAttemptsList]);

  const uniqueSubmittedCount = uniqueSubmittedStudentIds.size;
  const completedStudentsCount = uniqueSubmittedCount;
  const uncompletedStudentsCount = Math.max(0, totalStudentsAssigned - completedStudentsCount);

  // Average score on 100% scale
  const avgScore = completedAttempts > 0
    ? Math.round(
        completedAttemptsList.reduce((sum, a) => {
          const max = a.maxScore && a.maxScore > 0 ? a.maxScore : (a.totalQuestions ? a.totalQuestions * 10 : 80);
          return sum + ((a.score || 0) / max) * 100;
        }, 0) / completedAttempts
      )
    : 0;

  const totalFirstTry = completedAttemptsList.reduce((sum, a) => sum + (a.firstAttemptCorrectCount || 0), 0);
  const totalPostHint = completedAttemptsList.reduce((sum, a) => sum + (a.postHintCorrectCount || 0), 0);
  const hintRecoveryRate = (totalFirstTry + totalPostHint) > 0
    ? Math.round((totalPostHint / (totalFirstTry + totalPostHint)) * 100)
    : 0;

  // --- STUDENT LEVEL DETAILED PROGRESS (Requirement A, B, C) ---
  const studentSummaries: StudentSummary[] = useMemo(() => {
    const map = new Map<string, StudentSummary>();

    // Seed ONLY with legitimate students from targetStudents
    targetStudents
      .filter((st) => st.displayName?.trim() && st.studentCode?.trim() && !st.studentCode.startsWith('HSQA') && st.studentCode !== '—')
      .forEach((st) => {
        map.set(st.id, {
          studentId: st.id,
          studentName: st.displayName.trim(),
          studentCode: st.studentCode?.trim() || '',
          classId: st.classId || '',
          totalAssigned: totalAssignmentsCount,
          completedAssignmentsCount: 0,
          totalSubmissions: 0,
          avgScore: 0,
          bestScore: 0,
          lastScore: 0,
          firstScore: 0,
          progressScore: 0,
          primaryErrorPattern: 'Chưa làm',
          lastCompletedAt: null,
        });
      });

    // Group completed attempts by student
    const studentAttemptsMap = new Map<string, Attempt[]>();
    completedAttemptsList.forEach((att) => {
      // Must be a recognized student in our map (strictly isolates unlinked test attempts)
      if (!map.has(att.studentId)) return;
      const list = studentAttemptsMap.get(att.studentId) || [];
      list.push(att);
      studentAttemptsMap.set(att.studentId, list);
    });

    studentAttemptsMap.forEach((attList, stId) => {
      const stRecord = map.get(stId);
      if (!stRecord) return; // Never create a dummy row for unverified IDs

      // Sort chronologically (oldest first)
      attList.sort((a, b) => new Date(a.completedAt || a.startedAt || 0).getTime() - new Date(b.completedAt || b.startedAt || 0).getTime());

      const scoresPct = attList.map((a) => {
        const max = a.maxScore && a.maxScore > 0 ? a.maxScore : (a.totalQuestions ? a.totalQuestions * 10 : 80);
        return Math.round(((a.score || 0) / max) * 100);
      });

      const uniqueAssignmentsCompleted = new Set(attList.map((a) => a.assignmentId || a.lessonId)).size;
      const firstScore = scoresPct[0] || 0;
      const lastScore = scoresPct[scoresPct.length - 1] || 0;
      const bestScore = Math.max(...scoresPct);
      const avg = Math.round(scoresPct.reduce((acc, v) => acc + v, 0) / scoresPct.length);
      const progress = attList.length > 1 ? lastScore - firstScore : 0;

      // Find top error for this student
      const stInsights = filteredInsights.filter((i) => i.studentId === stId);
      const errCounts: Record<string, number> = {};
      stInsights.forEach((i) => {
        errCounts[i.errorPattern] = (errCounts[i.errorPattern] || 0) + (i.errorCount || 1);
      });
      const topStErr = Object.entries(errCounts).sort((a, b) => b[1] - a[1])[0];
      const errLabel = topStErr ? (ERROR_PATTERN_LABELS[topStErr[0] as MathErrorPattern]?.label || topStErr[0]) : 'Không có lỗi';

      stRecord.completedAssignmentsCount = uniqueAssignmentsCompleted;
      stRecord.totalSubmissions = attList.length;
      stRecord.avgScore = avg;
      stRecord.bestScore = bestScore;
      stRecord.firstScore = firstScore;
      stRecord.lastScore = lastScore;
      stRecord.progressScore = progress;
      stRecord.primaryErrorPattern = errLabel;
      stRecord.lastCompletedAt = attList[attList.length - 1]?.completedAt || null;

      map.set(stId, stRecord);
    });

    return Array.from(map.values()).sort((a, b) => {
      // Sort in canonical order by studentCode (HS1B01 -> HS1B12)
      return (a.studentCode || '').localeCompare(b.studentCode || '', undefined, { numeric: true });
    });
  }, [targetStudents, completedAttemptsList, totalAssignmentsCount, filteredInsights]);

  // Overall student progress statistics
  const improvedStudentsCount = studentSummaries.filter((s) => s.progressScore > 0).length;
  const multiAttemptStudents = studentSummaries.filter((s) => s.totalSubmissions > 1);
  const overallImprovementRate = multiAttemptStudents.length > 0
    ? Math.round((improvedStudentsCount / multiAttemptStudents.length) * 100)
    : 0;

  // --- TAXONOMY OF 10 MATHEMATICAL ERRORS (Requirement B) ---
  const ALL_PATTERNS_ORDER: MathErrorPattern[] = [
    'COUNTING_OFF_BY_ONE',
    'COMPARISON_INVERSION',
    'WRONG_OPERATOR',
    'NUMBER_ORDER_CONFUSION',
    'PLACE_VALUE_SWAP',
    'CROSS_TEN_ERROR',
    'GEOMETRY_MISIDENTIFICATION',
    'MEASUREMENT_UNIT_ERROR',
    'WORD_PROBLEM_WRONG_OPERATION',
    'GENERAL_CALCULATION_ERROR',
  ];

  const taxonomyMap = useMemo(() => {
    const counts: Record<string, number> = {};
    const studentsByPattern: Record<string, Map<string, { studentName: string; studentCode: string; classId: string; count: number }>> = {};
    const lessonsByPattern: Record<string, Set<string>> = {};

    filteredInsights.forEach((ins) => {
      const p = ins.errorPattern || 'GENERAL_CALCULATION_ERROR';
      counts[p] = (counts[p] || 0) + (ins.errorCount || 1);

      if (ins.studentId) {
        if (!studentsByPattern[p]) studentsByPattern[p] = new Map();
        const cur = studentsByPattern[p].get(ins.studentId) || {
          studentName: ins.studentName || 'Học sinh',
          studentCode: '',
          classId: ins.classId || '',
          count: 0,
        };
        cur.count += (ins.errorCount || 1);
        studentsByPattern[p].set(ins.studentId, cur);
      }

      if (ins.topic) {
        if (!lessonsByPattern[p]) lessonsByPattern[p] = new Set();
        lessonsByPattern[p].add(ins.topic);
      }
    });

    // Also scan question answers if available
    attemptAnswers.forEach((ans) => {
      if (!ans.isFinalCorrect && ans.detectedPattern) {
        const p = ans.detectedPattern as string;
        counts[p] = (counts[p] || 0) + 1;
      }
    });

    const totalErrors = Object.values(counts).reduce((a, b) => a + b, 0) || 1;

    return ALL_PATTERNS_ORDER.map((pattern) => {
      const count = counts[pattern] || 0;
      const percentage = Math.round((count / totalErrors) * 100);
      const meta = ERROR_PATTERN_LABELS[pattern] || {
        label: pattern,
        description: 'Lỗi tính toán',
        advice: 'Tăng cường luyện tập trực quan.',
      };
      const studentsMap = studentsByPattern[pattern] || new Map();
      const studentsList = Array.from(studentsMap.entries()).map(([id, s]) => ({
        studentId: id,
        ...s,
      })).sort((a, b) => b.count - a.count);

      const relatedLessons = Array.from(lessonsByPattern[pattern] || []);

      return {
        pattern,
        count,
        percentage,
        meta,
        students: studentsList,
        relatedLessons,
      };
    }).sort((a, b) => b.count - a.count);
  }, [filteredInsights, attemptAnswers]);

  // --- PER-ASSIGNMENT & QUESTION STATS (Requirement A) ---
  const assignmentStats = useMemo(() => {
    return filteredAssignments.map((asg) => {
      const asgAttempts = completedAttemptsList.filter(
        (a) => a.assignmentId === asg.id || (Boolean(asg.lessonId) && a.lessonId === asg.lessonId && a.classId === asg.classId)
      );
      const submittedStudents = new Set(asgAttempts.map((a) => a.studentId)).size;
      const targetClass = classesList.find((c) => c.id === asg.classId);
      const totalClassStudents = targetClass?.studentCount || 24;
      const completionRate = totalClassStudents > 0 ? Math.round((submittedStudents / totalClassStudents) * 100) : 0;

      const avg = asgAttempts.length > 0
        ? Math.round(
            asgAttempts.reduce((sum, a) => {
              const max = a.maxScore && a.maxScore > 0 ? a.maxScore : 80;
              return sum + ((a.score || 0) / max) * 100;
            }, 0) / asgAttempts.length
          )
        : 0;

      return {
        assignmentId: asg.id,
        title: asg.title,
        grade: asg.grade,
        week: (asg as any).week || 1,
        classId: asg.classId,
        submittedStudents,
        totalClassStudents,
        completionRate,
        avgScore: avg,
        totalAttempts: asgAttempts.length,
      };
    }).sort((a, b) => b.totalAttempts - a.totalAttempts);
  }, [filteredAssignments, completedAttemptsList, classesList]);

  // --- EXPORT CSV WITH UTF-8 BOM (Requirement A) ---
  const handleExportCSV = () => {
    const BOM = '\uFEFF';
    const headers = [
      'Mã Học Sinh',
      'Họ Và Tên',
      'Lớp',
      'Số Bài Đã Giao',
      'Số Bài Hoàn Thành',
      'Tổng Lượt Nộp',
      'Điểm Trung Bình (%)',
      'Điểm Cao Nhất (%)',
      'Điểm Gần Nhất (%)',
      'Tiến Bộ (+/- %)',
      'Lỗi Hay Gặp Nhất',
      'Lần Nộp Gần Nhất',
      'Nguồn Dữ Liệu'
    ];

    const originLabel = 'Bài nộp của học sinh (Thực tế)';

    const rows = studentSummaries.map((s) => {
      const progressLabel = s.totalSubmissions > 1 ? (s.progressScore >= 0 ? `+${s.progressScore}%` : `${s.progressScore}%`) : 'Mới nộp 1 lần';
      return [
        `"${s.studentCode}"`,
        `"${s.studentName}"`,
        `"${s.classId}"`,
        s.totalAssigned,
        s.completedAssignmentsCount,
        s.totalSubmissions,
        `"${s.avgScore}%"`,
        `"${s.bestScore}%"`,
        `"${s.lastScore}%"`,
        `"${progressLabel}"`,
        `"${s.primaryErrorPattern}"`,
        `"${s.lastCompletedAt ? new Date(s.lastCompletedAt).toLocaleString('vi-VN') : 'Chưa nộp'}"`,
        `"${originLabel}"`
      ];
    });

    const csvContent = BOM + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `bao_cao_phan_tich_mau_loi_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- AI SUMMARY GENERATION (Requirement C & D) ---
  const handleGenerateAiAnalysis = async () => {
    setLoadingAi(true);
    setAiResult(null);

    try {
      const topPatterns = taxonomyMap.slice(0, 5).map((p) => ({
        pattern: p.pattern,
        label: p.meta.label,
        count: p.count,
      }));

      // Requirement 1: Không đưa học sinh chưa nộp bài vào nhóm mắc lỗi hoặc yếu kiến thức.
      // Tách rõ nhóm đã có kết quả và nhóm chưa có dữ liệu.
      const evaluatedStudents = studentSummaries.filter((s) => s.totalSubmissions > 0);
      const unsubmittedStudents = studentSummaries.filter((s) => s.totalSubmissions === 0);

      const studentsNeedingHelp = evaluatedStudents
        .filter((s) => s.avgScore < 70)
        .slice(0, 8)
        .map((s) => ({
          name: s.studentName,
          code: s.studentCode,
          avgScore: s.avgScore,
          topPattern: s.primaryErrorPattern,
        }));

      // Cache version key hash based on attempts state
      const dataVersion = `${completedAttempts}_${avgScore}_${evaluatedStudents.length}_${unsubmittedStudents.length}_${filteredInsights.length}_${filteredAttempts[0]?.completedAt || ''}`;

      const res = await fetch('/api/teacher/summarize-insights', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          patterns: topPatterns,
          totalAttempts,
          completedAttempts,
          avgScore,
          hintRecoveryRate,
          dataOrigin: 'real',
          classId: selectedClass,
          dataVersion,
          improvedCount: improvedStudentsCount,
          studentsNeedingHelp,
          evaluatedCount: evaluatedStudents.length,
          unsubmittedCount: unsubmittedStudents.length,
          unsubmittedNames: unsubmittedStudents.map((s) => s.studentName),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setAiResult(data);
      } else {
        alert(data.error || 'Không thể tạo bản phân tích AI lúc này.');
      }
    } catch {
      alert('Không thể kết nối đến máy chủ AI.');
    } finally {
      setLoadingAi(false);
    }
  };

  // --- CREATE REINFORCEMENT DRAFT LESSON (Requirement C: Bản nháp, không tự giao) ---
  const handleCreateReinforcementDraft = async () => {
    setCreatingDraft(true);
    setDraftResult(null);

    try {
      const topPatterns = taxonomyMap.filter((p) => p.count > 0).slice(0, 3).map((p) => p.pattern);
      const grade = selectedClass.includes('2') ? 2 : 1;

      const topLabels = topPatterns.map((p) => ERROR_PATTERN_LABELS[p as MathErrorPattern]?.label || p).join(', ');
      const title = `Bài Củng Cố: Rèn Luyện ${topLabels || 'Kỹ Năng Toán Học'}`;

      const result = await dataService.createReinforcementDraft({
        grade,
        patterns: topPatterns.length > 0 ? topPatterns : ['COUNTING_OFF_BY_ONE', 'COMPARISON_INVERSION'],
        topic: 'Củng cố kiến thức theo mẫu lỗi',
        title,
      });

      setDraftResult(result);
    } catch (err: any) {
      alert(err.message || 'Lỗi khi tạo bài củng cố bản nháp.');
    } finally {
      setCreatingDraft(false);
    }
  };

  const visibleAcademicYears = academicYears.filter((y) =>
    y.id === 'year-2026-2027' || (!y.name.includes('2025') && y.status !== 'archived')
  );

  const handleResetFilters = () => {
    setSelectedAcademicYear('year-2026-2027');
    setSelectedClass('all');
    setSelectedWeek('all');
    setSelectedLesson('all');
    setSelectedStudent('all');
    setSelectedTimeRange('all');
  };

  return (
    <div className="space-y-6">
      {/* 1. UNIFIED STATS HEADER */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span className="p-2 rounded-xl bg-sky-100 text-sky-600">📊</span>
            Thống Kê & Phân Tích Nhầm Lẫn
          </h2>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            Phân tích sư phạm chuyên sâu từ dữ liệu làm bài thực tế của học sinh năm học 2026–2027 ({filteredAttempts.length} lượt hoàn thành)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchAnalyticsData}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            title="Làm mới dữ liệu từ máy chủ"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-sky-600' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs flex items-center gap-2 cursor-pointer transition-colors border border-slate-200"
          >
            <Download className="w-4 h-4 text-emerald-600" /> Xuất Báo Cáo CSV (UTF-8 BOM)
          </button>
        </div>
      </div>

      {/* 2. MULTI-DIMENSIONAL FILTERS BAR */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-700">
            <Filter className="w-4 h-4 text-sky-600" />
            <span>Bộ Lọc Đa Chiều (Năm Học • Lớp • Tuần • Bài Tập • Học Sinh • Thời Gian)</span>
          </div>
          <button
            type="button"
            onClick={handleResetFilters}
            className="text-xs font-extrabold text-sky-600 hover:text-sky-800 underline cursor-pointer"
          >
            Đặt lại bộ lọc
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* 1. Năm học - Strictly 2026-2027 */}
          <div>
            <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1">
              Năm học
            </label>
            <select
              value={selectedAcademicYear}
              onChange={(e) => setSelectedAcademicYear(e.target.value)}
              className="w-full h-9 px-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 focus:bg-white focus:border-sky-500 outline-none"
            >
              {visibleAcademicYears.length > 0 ? (
                visibleAcademicYears.map((y) => (
                  <option key={y.id} value={y.id}>{y.name}</option>
                ))
              ) : (
                <option value="year-2026-2027">Năm học 2026 - 2027</option>
              )}
            </select>
          </div>

          {/* 2. Lớp */}
          <div>
            <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1">
              Lớp học
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full h-9 px-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 focus:bg-white focus:border-sky-500 outline-none"
            >
              <option value="all">Tất cả các lớp</option>
              {classesList.map((c) => (
                <option key={c.id} value={c.id}>Lớp {c.name || c.id}</option>
              ))}
            </select>
          </div>

          {/* 3. Tuần */}
          <div>
            <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1">
              Tuần học
            </label>
            <select
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(e.target.value)}
              className="w-full h-9 px-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 focus:bg-white focus:border-sky-500 outline-none"
            >
              <option value="all">Tất cả các tuần</option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((w) => (
                <option key={w} value={String(w)}>Tuần {w}</option>
              ))}
            </select>
          </div>

          {/* 4. Bài tập */}
          <div>
            <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1">
              Bài tập đã giao
            </label>
            <select
              value={selectedLesson}
              onChange={(e) => setSelectedLesson(e.target.value)}
              className="w-full h-9 px-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 focus:bg-white focus:border-sky-500 outline-none truncate"
            >
              <option value="all">Tất cả bài tập ({filteredAssignments.length})</option>
              {filteredAssignments.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.title}
                </option>
              ))}
            </select>
          </div>

          {/* 5. Học sinh */}
          <div>
            <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1">
              Học sinh
            </label>
            <select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              className="w-full h-9 px-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 focus:bg-white focus:border-sky-500 outline-none truncate"
            >
              <option value="all">Tất cả học sinh ({targetStudents.length})</option>
              {targetStudents.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.displayName} ({s.studentCode || s.classId})
                </option>
              ))}
            </select>
          </div>

          {/* 6. Thời gian */}
          <div>
            <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1">
              Khoảng thời gian
            </label>
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value as any)}
              className="w-full h-9 px-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 focus:bg-white focus:border-sky-500 outline-none"
            >
              <option value="all">Toàn bộ thời gian</option>
              <option value="today">Hôm nay</option>
              <option value="7d">7 ngày gần nhất</option>
              <option value="30d">30 ngày gần nhất</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. PRIMARY KPI SUMMARY CARDS (Requirement A) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Bài giao & Học sinh được giao */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                Bài giao & Phân công
              </span>
              <BookOpen className="w-4 h-4 text-sky-600" />
            </div>
            <div className="text-3xl font-black text-slate-800 mt-2">
              {totalAssignmentsCount} <span className="text-sm font-bold text-slate-500">bài giao</span>
            </div>
          </div>
          <div className="text-xs font-semibold text-slate-600 mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
            <span>Học sinh được giao:</span>
            <span className="font-black text-slate-800">{totalStudentsAssigned} em</span>
          </div>
        </div>

        {/* Card 2: Lượt nộp & Hoàn thành */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                Lượt nộp & Hoàn thành
              </span>
              <CheckCircle className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-3xl font-black text-emerald-700 mt-2">
              {completedAttempts} <span className="text-sm font-bold text-slate-500">lượt hoàn thành</span>
            </div>
          </div>
          <div className="text-xs font-semibold text-slate-600 mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
            <span>Đã nộp bài:</span>
            <span className="font-black text-emerald-700">
              {completedStudentsCount}/{totalStudentsAssigned} em ({totalStudentsAssigned > 0 ? Math.round((completedStudentsCount / totalStudentsAssigned) * 100) : 0}%) • Chưa làm: {uncompletedStudentsCount} em
            </span>
          </div>
        </div>

        {/* Card 3: Điểm trung bình */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                Điểm trung bình lớp
              </span>
              <Award className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-3xl font-black text-sky-700 mt-2 flex items-baseline gap-1.5">
              <span>{avgScore}%</span>
              <span className="text-xs font-semibold text-slate-400">(mẫu: {completedAttempts} lượt làm)</span>
            </div>
          </div>
          <div className="text-xs font-semibold text-slate-600 mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
            <span>Đúng lần đầu:</span>
            <span className="font-black text-emerald-600">{totalFirstTry} câu</span>
          </div>
        </div>

        {/* Card 4: Tiến bộ sau gợi ý & Giữa các lần làm */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                Mức độ tiến bộ
              </span>
              <TrendingUp className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-3xl font-black text-indigo-700 mt-2 flex items-baseline gap-1.5">
              <span>+{improvedStudentsCount}</span>
              <span className="text-sm font-bold text-slate-500">em tăng điểm (mẫu: {multiAttemptStudents.length} em làm lại)</span>
            </div>
          </div>
          <div className="text-xs font-semibold text-slate-600 mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
            <span>Tự sửa sau gợi ý:</span>
            <span className="font-black text-indigo-700">
              {hintRecoveryRate}% <span className="text-[11px] font-semibold text-slate-500">(mẫu: {totalFirstTry + totalPostHint} câu cần gợi ý)</span>
            </span>
          </div>
        </div>
      </div>

      {/* 4. AI PEDAGOGICAL COCKPIT & REINFORCEMENT ACTION (Requirement C & D) */}
      <div className="bg-gradient-to-br from-indigo-900 via-sky-900 to-slate-900 text-white p-6 rounded-3xl shadow-md space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-indigo-500/30 text-amber-300 border border-indigo-400/40 text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> AI Sư Phạm & Củng Cố GDPT 2018
              </span>
              {aiResult?.cached && (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[11px] font-bold">
                  Đã lưu bộ nhớ đệm
                </span>
              )}
            </div>
            <h3 className="text-lg font-black text-white mt-1.5">
              Phân Tích Mẫu Lỗi Hệ Thống & Đề Xuất Hoạt Động Củng Cố
            </h3>
            <p className="text-xs text-slate-300 font-medium">
              Chỉ phân tích dữ liệu tổng hợp bài làm đã lưu, không suy diễn khi thiếu dữ liệu minh chứng.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={loadingAi}
              onClick={handleGenerateAiAnalysis}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-900 font-black text-xs flex items-center gap-2 cursor-pointer shadow-sm transition-all"
            >
              {loadingAi ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>{aiResult ? 'Cập Nhật AI Phân Tích' : 'AI Phân Tích Mẫu Lỗi'}</span>
            </button>

            <button
              type="button"
              disabled={creatingDraft}
              onClick={handleCreateReinforcementDraft}
              className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs flex items-center gap-2 cursor-pointer border border-white/20 transition-all"
            >
              {creatingDraft ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lightbulb className="w-4 h-4 text-amber-300" />}
              <span>Tạo Bài Củng Cố Từ Lỗi Sai</span>
            </button>
          </div>
        </div>

        {/* Reinforcement Draft Result Notification (Requirement C: Bản nháp giáo viên duyệt) */}
        {draftResult && (
          <div className="p-4 rounded-2xl bg-emerald-950/80 border-2 border-emerald-400 text-white space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-black text-emerald-300 text-xs uppercase tracking-wider">
                <Check className="w-4 h-4" /> Đã tạo bài củng cố dạng BẢN NHÁP thành công!
              </div>
              <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-800 text-emerald-100">
                Bản nháp (Chưa giao)
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-200">
              {draftResult.message} Bài học: <strong>{draftResult.lesson?.title}</strong> ({draftResult.version?.questions?.length || 5} câu hỏi trực quan tập trung vào lỗi sai của lớp).
            </p>
            {onOpenLessonEditor && (
              <button
                type="button"
                onClick={() => onOpenLessonEditor(draftResult.lesson, draftResult.version)}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" /> Biên tập & Duyệt bài nháp ngay
              </button>
            )}
          </div>
        )}

        {/* AI Result Card */}
        {aiResult && (
          <div className="p-5 rounded-2xl bg-white/5 border border-white/15 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                {aiResult.isFallback ? (
                  <span className="px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/30 text-xs font-black flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" /> Phân Tích Sư Phạm Theo Quy Tắc (Rule-based Heuristic)
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full bg-gradient-to-r from-purple-500/30 to-indigo-500/30 text-amber-300 border border-purple-400/40 text-xs font-black flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Mô Hình Google Gemini AI
                  </span>
                )}
                {aiResult.cached && (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[11px] font-bold">
                    Bộ nhớ đệm (Cache)
                  </span>
                )}
              </div>
              <span className="text-[11px] text-slate-300">
                {aiResult.isFallback
                  ? 'Phân tích ngoại tuyến dựa trên dữ liệu lưu trữ (Tiết kiệm 100% quota API)'
                  : 'Phân tích tự động dựa trên tổng hợp số liệu đã lưu'}
              </span>
            </div>

            <div className="text-xs font-bold text-slate-200 leading-relaxed">
              {aiResult.summary}
            </div>

            {/* Phân tách rõ ràng Nhóm đã có kết quả vs Nhóm chưa có dữ liệu */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
              <div className="p-3.5 rounded-2xl bg-sky-950/70 border border-sky-400/40 shadow-xs">
                <div className="font-black text-sky-300 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-sky-400" /> Nhóm đã có kết quả đánh giá ({studentSummaries.filter(s => s.totalSubmissions > 0).length} em)
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-800 text-sky-100">
                    Mẫu: {completedAttempts} lượt làm hợp lệ
                  </span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Căn cứ trên các bài nộp đã ghi nhận. Điểm trung bình nhóm đạt <strong>{avgScore}%</strong>, mức độ tiến bộ +{improvedStudentsCount} em.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-950/70 border border-amber-400/40 shadow-xs">
                <div className="font-black text-amber-300 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" /> Nhóm chưa có dữ liệu đánh giá ({studentSummaries.filter(s => s.totalSubmissions === 0).length} em)
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-800 text-amber-100">
                    Chưa nộp bài
                  </span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Tách riêng để đôn đốc hoàn thành bài tập. Hệ thống không xếp các em chưa nộp bài vào nhóm mắc lỗi hay yếu kiến thức.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-white/10 text-xs">
              <div className="p-3 rounded-xl bg-emerald-900/30 border border-emerald-500/30">
                <div className="font-black text-emerald-300 mb-1 flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5" /> Điểm mạnh ghi nhận:
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  {aiResult.strengths || 'Học sinh có ý thức hoàn thành bài đầy đủ.'}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-rose-900/30 border border-rose-500/30">
                <div className="font-black text-rose-300 mb-1 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" /> Mẫu lỗi nổi bật:
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  {aiResult.topErrors || 'Cần chú ý lỗi đếm vội và nhầm dấu so sánh.'}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-amber-900/30 border border-amber-500/30">
                <div className="font-black text-amber-300 mb-1 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" /> Nhóm cần hỗ trợ:
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  {aiResult.studentsNeedingSupport || 'Theo dõi sát các em có điểm dưới trung bình.'}
                </p>
              </div>
            </div>

            {aiResult.pedagogicalActions && aiResult.pedagogicalActions.length > 0 && (
              <div className="pt-3 border-t border-white/10 space-y-1.5">
                <div className="text-[11px] font-black uppercase tracking-wider text-amber-300">
                  Biện pháp sư phạm cụ thể trên lớp:
                </div>
                <ul className="list-disc list-inside space-y-1 text-xs text-slate-200">
                  {aiResult.pedagogicalActions.map((act, i) => (
                    <li key={i}>{act}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 5. SUB-VIEWS NAVIGATION (Requirement A & B) */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          type="button"
          onClick={() => setActiveViewTab('taxonomy')}
          className={`pb-3 px-4 text-xs font-black transition-colors cursor-pointer border-b-2 flex items-center gap-2 ${
            activeViewTab === 'taxonomy'
              ? 'border-sky-600 text-sky-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Target className="w-4 h-4" /> 10 Nhóm Lỗi Toán Học GDPT 2018 ({taxonomyMap.filter(t => t.count > 0).length})
        </button>

        <button
          type="button"
          onClick={() => setActiveViewTab('students')}
          className={`pb-3 px-4 text-xs font-black transition-colors cursor-pointer border-b-2 flex items-center gap-2 ${
            activeViewTab === 'students'
              ? 'border-sky-600 text-sky-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" /> Thống Kê & Tiến Bộ Từng Học Sinh ({studentSummaries.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveViewTab('lessons')}
          className={`pb-3 px-4 text-xs font-black transition-colors cursor-pointer border-b-2 flex items-center gap-2 ${
            activeViewTab === 'lessons'
              ? 'border-sky-600 text-sky-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" /> Tỷ Lệ Theo Bài Tập Đã Giao ({assignmentStats.length})
        </button>
      </div>

      {/* VIEW 1: 10 ERROR PATTERNS TAXONOMY (Requirement B) */}
      {activeViewTab === 'taxonomy' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <h4 className="text-base font-black text-slate-800">
                Phân Loại Mẫu Lỗi Toán Học GDPT 2018
              </h4>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">
                Mỗi nhóm lỗi hiển thị số lượt, tỷ lệ, bài liên quan và danh sách học sinh cần củng cố theo quyền giáo viên.
              </p>
            </div>
            <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-slate-100 text-slate-600">
              10 nhóm chuẩn hoá
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {taxonomyMap.map(({ pattern, count, percentage, meta, students, relatedLessons }) => (
              <div
                key={pattern}
                className="bg-white p-5 rounded-3xl border-2 border-slate-200 hover:border-sky-300 transition-all shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-black text-slate-800">
                      {meta.label}
                    </span>
                    <span className={`text-xs font-black px-2.5 py-0.5 rounded-full border ${
                      count > 0 ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}>
                      {count} lượt ({percentage}%)
                    </span>
                  </div>

                  <p className="text-xs font-medium text-slate-600 mb-3">
                    {meta.description}
                  </p>

                  {/* Related Lessons */}
                  {relatedLessons.length > 0 && (
                    <div className="text-[11px] font-semibold text-slate-500 mb-2">
                      📚 Bài học liên quan: {relatedLessons.slice(0, 2).join(', ')}
                    </div>
                  )}

                  {/* Affected Students List (Requirement B) */}
                  {students.length > 0 ? (
                    <div className="mt-2 p-2.5 rounded-2xl bg-rose-50/60 border border-rose-100 space-y-1">
                      <div className="text-[11px] font-black uppercase tracking-wider text-rose-800">
                        Học sinh cần củng cố ({students.length} em):
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {students.map((st) => (
                          <span
                            key={st.studentId}
                            className="px-2 py-0.5 rounded-lg bg-white border border-rose-200 text-[11px] font-bold text-rose-900 shadow-2xs"
                          >
                            {st.studentName} ({st.count} lần)
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1.5 rounded-xl border border-emerald-100">
                      ✓ Chưa ghi nhận học sinh mắc lỗi này trong phạm vi đang lọc.
                    </div>
                  )}
                </div>

                {/* Pedagogical Advice */}
                <div className="mt-4 pt-3 border-t border-slate-100 text-xs font-semibold text-sky-900 bg-sky-50/70 p-3 rounded-2xl border border-sky-100">
                  💡 <strong>Biện pháp sư phạm:</strong> {meta.advice}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 2: STUDENT DETAIL & PROGRESS TABLE (Requirement A) */}
      {activeViewTab === 'students' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h4 className="text-base font-black text-slate-800">
                Bảng Thống Kê Chi Tiết Từng Học Sinh & Mức Độ Tiến Bộ
              </h4>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">
                Theo dõi điểm trung bình, cao nhất, gần nhất, số lần làm bài và tiến bộ giữa lần đầu so với lần gần nhất.
              </p>
            </div>
            <span className="text-xs font-black px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              {improvedStudentsCount}/{multiAttemptStudents.length} em có tiến bộ ({overallImprovementRate}%)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-black tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Mã HS</th>
                  <th className="py-3 px-4">Họ và Tên</th>
                  <th className="py-3 px-4">Lớp</th>
                  <th className="py-3 px-4 text-center">Đã Hoàn Thành</th>
                  <th className="py-3 px-4 text-center">Số Lần Làm</th>
                  <th className="py-3 px-4 text-center">Điểm TB</th>
                  <th className="py-3 px-4 text-center">Điểm Cao Nhất</th>
                  <th className="py-3 px-4 text-center">Lần Gần Nhất</th>
                  <th className="py-3 px-4 text-center">Tiến Bộ</th>
                  <th className="py-3 px-4">Lỗi Hay Gặp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-bold text-slate-700">
                {studentSummaries.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-10 text-center text-slate-400 font-bold">
                      Không tìm thấy học sinh nào trong phạm vi lọc hiện tại.
                    </td>
                  </tr>
                ) : (
                  studentSummaries.map((st) => (
                    <tr key={st.studentId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-black text-slate-500">{st.studentCode || '—'}</td>
                      <td className="py-3 px-4 font-black text-slate-900">{st.studentName}</td>
                      <td className="py-3 px-4 text-slate-500 uppercase">{st.classId}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 font-black">
                          {st.completedAssignmentsCount}/{st.totalAssigned}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-black">
                        {st.totalSubmissions > 0 ? st.totalSubmissions : <span className="text-slate-400 font-normal">0</span>}
                      </td>
                      <td className="py-3 px-4 text-center font-black text-sky-700">
                        {st.totalSubmissions > 0 ? `${st.avgScore}%` : <span className="text-slate-400 font-normal">Chưa có</span>}
                      </td>
                      <td className="py-3 px-4 text-center font-black text-emerald-700">
                        {st.totalSubmissions > 0 ? `${st.bestScore}%` : <span className="text-slate-400 font-normal">Chưa có</span>}
                      </td>
                      <td className="py-3 px-4 text-center font-black text-indigo-700">
                        {st.totalSubmissions > 0 ? `${st.lastScore}%` : <span className="text-slate-400 font-normal">Chưa có</span>}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {st.totalSubmissions === 0 ? (
                          <span className="text-slate-400 text-[11px] font-semibold">Chưa làm</span>
                        ) : st.totalSubmissions > 1 ? (
                          st.progressScore > 0 ? (
                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-black text-[11px]">
                              <ArrowUpRight className="w-3 h-3" /> +{st.progressScore}%
                            </span>
                          ) : st.progressScore < 0 ? (
                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-black text-[11px]">
                              <ArrowDownRight className="w-3 h-3" /> {st.progressScore}%
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-black text-[11px]">
                              <Minus className="w-3 h-3" /> 0%
                            </span>
                          )
                        ) : (
                          <span className="text-slate-400 text-[11px] font-semibold">1 lần làm</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-semibold">
                        {st.totalSubmissions > 0 ? (
                          <span className={st.primaryErrorPattern === 'Không có lỗi' ? 'text-emerald-600' : 'text-rose-700'}>
                            {st.primaryErrorPattern}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-normal">Chưa làm</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 3: LESSON & ASSIGNMENT BREAKDOWN (Requirement A) */}
      {activeViewTab === 'lessons' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h4 className="text-base font-black text-slate-800">
                Thống Kê Tỷ Lệ Hoàn Thành & Điểm Số Theo Bài Tập
              </h4>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">
                Tỷ lệ đúng/sai theo từng bài tập đã giao trong phạm vi phân công của giáo viên.
              </p>
            </div>
            <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-slate-100 text-slate-600">
              {assignmentStats.length} bài tập
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-black tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Tên Bài Tập</th>
                  <th className="py-3 px-4 text-center">Khối</th>
                  <th className="py-3 px-4 text-center">Tuần</th>
                  <th className="py-3 px-4">Lớp</th>
                  <th className="py-3 px-4 text-center">Số Học Sinh Nộp</th>
                  <th className="py-3 px-4 text-center">Tỷ Lệ Hoàn Thành</th>
                  <th className="py-3 px-4 text-center">Điểm Trung Bình</th>
                  <th className="py-3 px-4 text-center">Tổng Lượt Làm</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-bold text-slate-700">
                {assignmentStats.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-slate-400 font-bold">
                      Không có bài tập nào phù hợp với bộ lọc hiện tại.
                    </td>
                  </tr>
                ) : (
                  assignmentStats.map((asg) => (
                    <tr key={asg.assignmentId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-black text-slate-900">{asg.title}</td>
                      <td className="py-3 px-4 text-center font-bold text-sky-700">Lớp {asg.grade}</td>
                      <td className="py-3 px-4 text-center font-bold">Tuần {asg.week}</td>
                      <td className="py-3 px-4 uppercase text-slate-600">{asg.classId}</td>
                      <td className="py-3 px-4 text-center font-black">
                        {asg.submittedStudents}/{asg.totalClassStudents} em
                      </td>
                      <td className="py-3 px-4 text-center font-black text-emerald-700">
                        {asg.completionRate}%
                      </td>
                      <td className="py-3 px-4 text-center font-black text-sky-700">
                        {asg.avgScore}%
                      </td>
                      <td className="py-3 px-4 text-center font-black">
                        {asg.totalAttempts} lượt
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
