import React, { useState, useEffect } from 'react';
import { Download, Sparkles, Filter, AlertTriangle, CheckCircle, TrendingUp, RefreshCw, Loader2 } from 'lucide-react';
import { dataService } from '../../lib/dataService';
import { Attempt, MistakeInsight, MathErrorPattern } from '../../types';
import { ERROR_PATTERN_LABELS } from '../../lib/mathEngine';
import { getAuthHeaders } from '../../lib/authSession';

interface MisconceptionAnalyticsProps {
  teacherId: string;
}

export const MisconceptionAnalytics: React.FC<MisconceptionAnalyticsProps> = ({ teacherId }) => {
  const [dataOriginFilter, setDataOriginFilter] = useState<'all' | 'simulation' | 'real'>('real');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [insights, setInsights] = useState<MistakeInsight[]>([]);
  const [loading, setLoading] = useState(true);

  // AI Summary state
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiRecommendations, setAiRecommendations] = useState<string[]>([]);
  const [loadingAi, setLoadingAi] = useState(false);

  useEffect(() => {
    fetchAnalyticsData();
  }, [dataOriginFilter, selectedClass]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const data = await dataService.fetchTeacherAnalytics(teacherId);
      let attList = data.attempts;
      let insList = data.insights;

      // Apply client filter for dataOrigin & class
      if (dataOriginFilter !== 'all') {
        attList = attList.filter((a) => a.dataOrigin === dataOriginFilter);
        insList = insList.filter((i) => i.dataOrigin === dataOriginFilter);
      }
      if (selectedClass !== 'all') {
        attList = attList.filter((a) => a.classId === selectedClass);
        insList = insList.filter((i) => i.classId === selectedClass);
      }

      setAttempts(attList);
      setInsights(insList);
    } catch (err) {
      console.error('Fetch analytics error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Compute metrics accurately based on completed attempts
  const totalAttempts = attempts.length;
  const completedAttemptsList = attempts.filter((a) => a.status === 'completed');
  const inProgressAttemptsList = attempts.filter((a) => a.status === 'in_progress');
  const completedAttempts = completedAttemptsList.length;

  // Accurate score ratio: do NOT divide by completedAttempts * 80!
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

  // Group mistake insights by pattern
  const patternCounts: Record<string, number> = {};
  insights.forEach((ins) => {
    const p = ins.errorPattern || 'GENERAL_CALCULATION_ERROR';
    patternCounts[p] = (patternCounts[p] || 0) + (ins.errorCount || 1);
  });

  const sortedPatterns = Object.entries(patternCounts).sort((a, b) => b[1] - a[1]);

  // Export CSV with UTF-8 BOM
  const handleExportCSV = () => {
    const BOM = '\uFEFF';
    const headers = [
      'ID Lượt làm',
      'Học sinh',
      'Mã HS',
      'Lớp',
      'Bài học',
      'Trạng thái',
      'Điểm đạt được',
      'Điểm tối đa',
      'Tỷ lệ đạt (%)',
      'Đúng lần đầu',
      'Đúng sau gợi ý',
      'Thời gian (giây)',
      'Nguồn dữ liệu',
      'Thời điểm ghi nhận'
    ];

    const rows = attempts.map((a) => {
      const max = a.maxScore && a.maxScore > 0 ? a.maxScore : (a.totalQuestions ? a.totalQuestions * 10 : 80);
      const pct = Math.round(((a.score || 0) / max) * 100);
      const statusLabel = a.status === 'completed' ? 'Đã hoàn thành' : 'Đang làm dở';
      const originLabel = a.dataOrigin === 'simulation' ? 'Dữ liệu lưu trữ/kiểm toán' : 'Dữ liệu học sinh chính thức';

      return [
        `"${a.id}"`,
        `"${a.studentName || 'Học sinh'}"`,
        `"${a.studentCode || ''}"`,
        `"${a.classId}"`,
        `"${a.lessonTitle || ''}"`,
        `"${statusLabel}"`,
        a.score || 0,
        max,
        `"${pct}%"`,
        a.firstAttemptCorrectCount || 0,
        a.postHintCorrectCount || 0,
        a.durationSeconds || 0,
        `"${originLabel}"`,
        `"${a.completedAt || a.startedAt || ''}"`
      ];
    });

    const csvContent = BOM + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `bao_cao_ket_qua_toan_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // AI Summary Call
  const handleGenerateAiSummary = async () => {
    setLoadingAi(true);
    setAiSummary(null);
    setAiRecommendations([]);

    try {
      const topPatterns = sortedPatterns.slice(0, 4).map(([pattern, count]) => ({
        pattern,
        label: ERROR_PATTERN_LABELS[pattern as MathErrorPattern]?.label || pattern,
        count,
      }));

      const res = await fetch('/api/teacher/summarize-insights', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          patterns: topPatterns,
          totalAttempts,
          avgScore,
          hintRecoveryRate,
          dataOrigin: dataOriginFilter,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setAiSummary(data.summary);
        setAiRecommendations(data.recommendations || []);
      } else {
        alert(data.error || 'AI chưa cấu hình hoặc không khả dụng.');
      }
    } catch {
      alert('Không thể kết nối đến máy chủ AI.');
    } finally {
      setLoadingAi(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Filter and Actions Bar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-black uppercase text-slate-500">
            <Filter className="w-4 h-4 text-sky-600" /> Nguồn dữ liệu:
          </div>
          <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => setDataOriginFilter('real')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                dataOriginFilter === 'real' ? 'bg-white shadow-xs text-emerald-800 font-black' : 'text-slate-600'
              }`}
            >
              Học sinh thực tế
            </button>
            <button
              type="button"
              onClick={() => setDataOriginFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                dataOriginFilter === 'all' ? 'bg-white shadow-xs text-sky-800 font-black' : 'text-slate-600'
              }`}
            >
              Tất cả ({attempts.length})
            </button>
            <button
              type="button"
              onClick={() => setDataOriginFilter('simulation')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                dataOriginFilter === 'simulation' ? 'bg-amber-400 text-slate-900 font-black shadow-xs' : 'text-slate-600'
              }`}
            >
              Lưu trữ / Kiểm toán
            </button>
          </div>

          {/* Class selector */}
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="h-9 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700"
          >
            <option value="all">Tất cả các lớp (1A, 1B, 2A, 2B)</option>
            <option value="class-1a">Lớp 1A</option>
            <option value="class-1b">Lớp 1B</option>
            <option value="class-2a">Lớp 2A</option>
            <option value="class-2b">Lớp 2B</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchAnalyticsData}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs flex items-center gap-2 cursor-pointer transition-colors border border-slate-200"
          >
            <Download className="w-4 h-4" /> Xuất Báo Cáo CSV (UTF-8 BOM)
          </button>

          <button
            type="button"
            disabled={loadingAi}
            onClick={handleGenerateAiSummary}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-sky-600 hover:from-indigo-600 hover:to-sky-700 text-white font-extrabold text-xs flex items-center gap-2 cursor-pointer shadow-sm transition-all"
          >
            {loadingAi ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 text-amber-300" />
            )}
            <span>AI Tóm Tắt Khắc Phục Lỗi</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <div className="text-xs font-black uppercase tracking-wider text-slate-400">
            Tổng lượt làm bài
          </div>
          <div className="text-3xl font-black text-slate-800 mt-2">
            {totalAttempts}
          </div>
          <div className="text-xs font-semibold text-slate-500 mt-1">
            {completedAttempts} lượt đã hoàn thành trọn vẹn
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <div className="text-xs font-black uppercase tracking-wider text-slate-400">
            Tỷ lệ điểm trung bình
          </div>
          <div className="text-3xl font-black text-sky-700 mt-2">
            {avgScore}%
          </div>
          <div className="text-xs font-semibold text-slate-500 mt-1">
            Trên thang điểm chuẩn 100%
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <div className="text-xs font-black uppercase tracking-wider text-slate-400">
            Đúng ngay lần đầu
          </div>
          <div className="text-3xl font-black text-emerald-700 mt-2">
            {totalFirstTry} câu
          </div>
          <div className="text-xs font-semibold text-emerald-600 mt-1 flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" /> Nắm vững kiến thức trực tiếp
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <div className="text-xs font-black uppercase tracking-wider text-slate-400">
            Tiến bộ sau khi nhận gợi ý
          </div>
          <div className="text-3xl font-black text-amber-600 mt-2">
            +{totalPostHint} câu
          </div>
          <div className="text-xs font-semibold text-amber-700 mt-1 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> {hintRecoveryRate}% khắc phục thành công
          </div>
        </div>
      </div>

      {/* AI Pedagogical Summary Card (when generated) */}
      {aiSummary && (
        <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-50 via-sky-50 to-white border-2 border-indigo-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-indigo-900 font-black text-base">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <span>AI Đề Xuất Hoạt Động Củng Cố Cho Giáo Viên:</span>
          </div>

          <p className="text-sm font-semibold text-slate-700 leading-relaxed">
            {aiSummary}
          </p>

          {aiRecommendations.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-indigo-100">
              <div className="text-xs font-black uppercase tracking-wider text-indigo-700">
                Gợi ý hoạt động thực hành trên lớp:
              </div>
              <ul className="list-disc list-inside space-y-1 text-xs font-bold text-slate-700">
                {aiRecommendations.map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Misconception Error Taxonomy Distribution */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-lg font-black text-slate-800">
              Phân Phối Nhóm Lỗi Sai Toán Học (GDPT 2018)
            </h4>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              Phát hiện qua thuật toán đối sánh mẫu lỗi từ các lượt làm bài của học sinh
            </p>
          </div>
          <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-slate-100 text-slate-600">
            {sortedPatterns.length} nhóm lỗi ghi nhận
          </span>
        </div>

        {loading ? (
          <div className="p-10 text-center text-slate-500 font-bold">
            Đang tải dữ liệu phân tích...
          </div>
        ) : sortedPatterns.length === 0 ? (
          <div className="p-10 text-center text-slate-500 font-bold">
            Chưa có dữ liệu lỗi sai trong phạm vi lọc hiện tại.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sortedPatterns.map(([pattern, count]) => {
              const meta = ERROR_PATTERN_LABELS[pattern as MathErrorPattern] || {
                label: pattern,
                description: 'Lỗi tính toán',
                advice: 'Rèn luyện tính nhẩm thêm.'
              };

              return (
                <div
                  key={pattern}
                  className="p-4 rounded-2xl bg-slate-50/80 border-2 border-slate-100 hover:border-amber-300 transition-colors flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-black text-slate-800">
                        {meta.label}
                      </span>
                      <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                        {count} lần gặp
                      </span>
                    </div>
                    <p className="text-xs font-medium text-slate-600 mb-2">
                      {meta.description}
                    </p>
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-200/60 text-xs font-bold text-sky-900 bg-sky-50 p-2 rounded-xl">
                    💡 <strong>Biện pháp sư phạm:</strong> {meta.advice}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
