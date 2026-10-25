import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  Upload,
  Search,
  Image as ImageIcon,
  Check,
  Trash2,
  AlertTriangle,
  Loader2,
  FolderOpen,
  Info,
  Maximize2,
  RefreshCw,
  Eye,
  Sparkles,
} from 'lucide-react';
import { MediaCategory, MediaItem } from '../../types';
import { dataService } from '../../lib/dataService';
import { STANDARD_ASSETS, normalizeAssetUrl } from '../../lib/standardAssets';

export interface CategoryDef {
  id: MediaCategory;
  label: string;
  icon: string;
  standardCount: number;
}

export const MEDIA_CATEGORIES: CategoryDef[] = [
  { id: 'food', label: 'Trái cây, thực phẩm', icon: '🍎', standardCount: 15 },
  { id: 'animals', label: 'Động vật', icon: '🐶', standardCount: 12 },
  { id: 'school', label: 'Đồ dùng học tập', icon: '🎒', standardCount: 10 },
  { id: 'nature', label: 'Thiên nhiên', icon: '🌻', standardCount: 8 },
  { id: 'backgrounds', label: 'Phông cảnh', icon: '🏞️', standardCount: 5 },
  { id: 'math', label: 'Công cụ Toán học', icon: '📐', standardCount: 10 },
];

interface MediaLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMedia?: (media: MediaItem) => void;
  selectedMediaId?: string;
}

export const MediaLibraryModal: React.FC<MediaLibraryModalProps> = ({
  isOpen,
  onClose,
  onSelectMedia,
  selectedMediaId,
}) => {
  const [activeTab, setActiveTab] = useState<'browse' | 'upload'>('browse');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [mediaList, setMediaList] = useState<MediaItem[]>(STANDARD_ASSETS);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Upload Form State
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCategory, setUploadCategory] = useState<MediaCategory>('food');
  const [uploadDescription, setUploadDescription] = useState('');
  const [isCompressing, setIsCompressing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [compressionStats, setCompressionStats] = useState<{
    originalSize: number;
    compressedSize: number;
    mimeType: string;
    width: number;
    height: number;
  } | null>(null);
  const [compressedData, setCompressedData] = useState<{
    base64: string;
    mimeType: string;
    sizeBytes: number;
    width: number;
    height: number;
  } | null>(null);

  // Delete Confirmation State
  const [deleteTarget, setDeleteTarget] = useState<MediaItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteBlockedReason, setDeleteBlockedReason] = useState<string | null>(null);

  // Lightbox Preview State
  const [previewMedia, setPreviewMedia] = useState<MediaItem | null>(null);

  // In-question Preview Modal State
  const [questionPreviewMedia, setQuestionPreviewMedia] = useState<MediaItem | null>(null);
  const [previewCount, setPreviewCount] = useState<number>(3);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadMedia();
    }
  }, [isOpen]);

  const loadMedia = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const items = await dataService.fetchMediaLibrary('all');
      if (Array.isArray(items) && items.length > 0) {
        setMediaList(items);
      } else {
        setMediaList(STANDARD_ASSETS);
      }
    } catch (err: any) {
      console.warn('Backend loadMedia failed, using standard assets:', err);
      setMediaList(STANDARD_ASSETS);
    } finally {
      setIsLoading(false);
    }
  };

  // Compute dynamic category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: mediaList.length };
    for (const cat of MEDIA_CATEGORIES) {
      counts[cat.id] = mediaList.filter((m) => {
        if (m.category === cat.id) return true;
        if (cat.id === 'food' && (m.category as any) === 'fruits') return true;
        if (cat.id === 'school' && (m.category as any) === 'items') return true;
        if (
          cat.id === 'math' &&
          ['counters_frames', 'counting_sticks', 'geometry', 'clock_time', 'money_measurement'].includes(m.category as any)
        )
          return true;
        return false;
      }).length;
    }
    return counts;
  }, [mediaList]);

  // Filtered Media List based on category & search query
  const filteredMedia = useMemo(() => {
    let result = mediaList;
    if (selectedCategory !== 'all') {
      result = result.filter((m) => {
        if (m.category === selectedCategory) return true;
        if (selectedCategory === 'food' && (m.category as any) === 'fruits') return true;
        if (selectedCategory === 'school' && (m.category as any) === 'items') return true;
        if (
          selectedCategory === 'math' &&
          ['counters_frames', 'counting_sticks', 'geometry', 'clock_time', 'money_measurement'].includes(m.category as any)
        )
          return true;
        return false;
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter((item) => {
        const titleMatch = item.title && item.title.toLowerCase().includes(q);
        const descMatch = item.description && item.description.toLowerCase().includes(q);
        const catMatch = item.category && item.category.toLowerCase().includes(q);
        const aliasMatch = Array.isArray(item.aliases) && item.aliases.some((a) => a.toLowerCase().includes(q));
        return titleMatch || descMatch || catMatch || aliasMatch;
      });
    }

    return result;
  }, [mediaList, selectedCategory, searchQuery]);

  // Process File Selection with Automatic Client Compression
  const handleFileSelect = async (file: File) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsCompressing(true);
    setUploadFile(file);

    const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
    if (!uploadTitle) {
      setUploadTitle(baseName.charAt(0).toUpperCase() + baseName.slice(1));
    }

    try {
      const compressed = await dataService.compressImageClient(file, {
        maxWidth: 1200,
        maxHeight: 1200,
        maxBytes: 1_000_000,
      });

      setCompressedData({
        base64: compressed.base64,
        mimeType: compressed.mimeType,
        sizeBytes: compressed.sizeBytes,
        width: compressed.width,
        height: compressed.height,
      });

      setCompressionStats({
        originalSize: file.size,
        compressedSize: compressed.sizeBytes,
        mimeType: compressed.mimeType,
        width: compressed.width,
        height: compressed.height,
      });

      setUploadPreview(compressed.base64);
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi xử lý tệp ảnh.');
      setUploadFile(null);
      setUploadPreview(null);
      setCompressedData(null);
      setCompressionStats(null);
    } finally {
      setIsCompressing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  // Submit Upload
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadTitle.trim()) {
      setErrorMsg('Vui lòng nhập tên hình ảnh.');
      return;
    }
    if (!compressedData) {
      setErrorMsg('Vui lòng chọn hình ảnh hợp lệ để tải lên.');
      return;
    }

    setIsUploading(true);
    setErrorMsg(null);
    try {
      const newMedia = await dataService.uploadMedia({
        title: uploadTitle.trim(),
        category: uploadCategory,
        description: uploadDescription.trim(),
        base64Data: compressedData.base64,
        mimeType: compressedData.mimeType,
        width: compressedData.width,
        height: compressedData.height,
      });

      setSuccessMsg(`Đã tải lên hình ảnh "${newMedia.title}" thành công!`);

      // Reset form
      setUploadFile(null);
      setUploadPreview(null);
      setUploadTitle('');
      setUploadDescription('');
      setCompressedData(null);
      setCompressionStats(null);

      // Refresh list and switch to browse tab
      await loadMedia();
      setActiveTab('browse');

      if (onSelectMedia) {
        onSelectMedia(newMedia);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi tải ảnh lên hệ thống.');
    } finally {
      setIsUploading(false);
    }
  };

  // Delete Media Handler with Referential Protection
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    if (deleteTarget.isStandardAsset || deleteTarget.id.startsWith('std-')) {
      setErrorMsg('Không thể xóa tài nguyên đồ họa chuẩn của hệ thống.');
      setDeleteTarget(null);
      return;
    }

    setIsDeleting(true);
    setDeleteBlockedReason(null);
    try {
      await dataService.deleteMedia(deleteTarget.id);
      setMediaList((prev) => prev.filter((m) => m.id !== deleteTarget.id));
      setDeleteTarget(null);
      setSuccessMsg('Đã xóa hình ảnh khỏi thư viện.');
    } catch (err: any) {
      if (err.code === 'CANNOT_DELETE_REFERENCED_MEDIA' || err.code === 'CANNOT_DELETE_DRAFT_REFERENCED_MEDIA') {
        setDeleteBlockedReason(err.message);
      } else {
        setErrorMsg(err.message || 'Không thể xóa hình ảnh.');
        setDeleteTarget(null);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSelectMediaItem = (item: MediaItem) => {
    if (onSelectMedia) {
      onSelectMedia(item);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-900/65 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-6xl max-h-[94vh] bg-white rounded-3xl border-3 border-sky-300 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-sky-500 via-indigo-600 to-blue-600 text-white flex items-center justify-between shadow-md flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center border border-white/30 shadow-inner">
              <FolderOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                Thư Viện Đồ Họa Toán Nhí
                <span className="px-2 py-0.5 rounded-full bg-emerald-400 text-slate-900 text-[11px] font-black shadow-xs">
                  60 Hình Chuẩn
                </span>
              </h2>
              <p className="text-xs text-sky-100 font-medium hidden sm:block">
                Bộ tài nguyên đồ họa chuẩn Toán tiểu học lớp 1–2: sắc nét, đúng số lượng, không bị mất ảnh
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tab switchers */}
            <div className="flex bg-black/25 p-1 rounded-xl border border-white/20">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('browse');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  activeTab === 'browse'
                    ? 'bg-white text-sky-700 shadow-sm'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                Duyệt hình ({mediaList.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('upload');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1 cursor-pointer ${
                  activeTab === 'upload'
                    ? 'bg-white text-sky-700 shadow-sm'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                <Upload className="w-3.5 h-3.5" /> Tải ảnh mới
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer transition-colors"
              title="Đóng cửa sổ"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="mx-6 mt-3 p-3 bg-rose-50 border-2 border-rose-200 rounded-2xl flex items-center justify-between text-rose-800 text-xs font-bold animate-in fade-in flex-shrink-0">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMsg(null)}
              className="text-rose-500 hover:text-rose-700 font-bold ml-2 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {successMsg && (
          <div className="mx-6 mt-3 p-3 bg-emerald-50 border-2 border-emerald-200 rounded-2xl flex items-center justify-between text-emerald-800 text-xs font-bold animate-in fade-in flex-shrink-0">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => setSuccessMsg(null)}
              className="text-emerald-500 hover:text-emerald-700 font-bold ml-2 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {activeTab === 'browse' ? (
            <div className="space-y-4">
              {/* Filter & Search Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                {/* Search Form */}
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm theo tên (táo, cá, bút...), nhãn, từ đồng nghĩa..."
                    className="w-full h-10 pl-9 pr-8 rounded-xl border-2 border-slate-200 focus:border-sky-500 text-xs font-semibold focus:outline-hidden transition-colors"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 justify-between sm:justify-end">
                  <span className="text-xs font-bold text-slate-500">
                    Hiển thị <span className="text-sky-600 font-black">{filteredMedia.length}</span> / {mediaList.length} tài nguyên
                  </span>

                  <button
                    type="button"
                    onClick={loadMedia}
                    disabled={isLoading}
                    className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                    title="Làm mới danh sách"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline">Làm mới</span>
                  </button>
                </div>
              </div>

              {/* 6 Categories Pills */}
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedCategory('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black cursor-pointer transition-all flex items-center gap-1.5 ${
                    selectedCategory === 'all'
                      ? 'bg-sky-600 text-white shadow-sm ring-2 ring-sky-300'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span>🌟 Tất cả</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/10">
                    {categoryCounts.all ?? mediaList.length}
                  </span>
                </button>

                {MEDIA_CATEGORIES.map((cat) => {
                  const isActive = selectedCategory === cat.id;
                  const currentCount = categoryCounts[cat.id] ?? cat.standardCount;

                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer transition-all ${
                        isActive
                          ? 'bg-sky-600 text-white shadow-sm ring-2 ring-sky-300'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <span>{cat.icon}</span>
                      <span>{cat.label}</span>
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                        isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {currentCount}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Grid of Images */}
              {isLoading ? (
                <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
                  <span className="text-xs font-bold">Đang tải thư viện đồ họa...</span>
                </div>
              ) : filteredMedia.length === 0 ? (
                <div className="py-16 text-center rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center">
                    <ImageIcon className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-700">Không tìm thấy hình ảnh nào</h3>
                    <p className="text-xs text-slate-500 font-medium mt-1">
                      Thử tìm với từ khóa khác (ví dụ: &ldquo;táo&rdquo;, &ldquo;thỏ&rdquo;, &ldquo;thước&rdquo;, &ldquo;que tính&rdquo;)
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory('all');
                      setSearchQuery('');
                    }}
                    className="mt-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    Xem toàn bộ 60 hình chuẩn
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
                  {filteredMedia.map((item) => {
                    const isSelected = selectedMediaId === item.id || selectedMediaId === item.url;
                    const isStandard = Boolean(item.isStandardAsset || item.id.startsWith('std-'));
                    const isBackground = item.category === 'backgrounds';
                    const isSvg = item.mimeType === 'image/svg+xml' || item.url.endsWith('.svg');
                    const cleanUrl = normalizeAssetUrl(item.url);

                    return (
                      <div
                        key={item.id}
                        className={`group relative bg-white rounded-2xl border-2 transition-all flex flex-col ${
                          isSelected
                            ? 'border-sky-500 ring-4 ring-sky-200 shadow-lg scale-[1.02]'
                            : 'border-slate-200 hover:border-sky-300 hover:shadow-md'
                        }`}
                      >
                        {/* Image Preview Canvas */}
                        <div
                          className={`relative w-full bg-slate-50 flex items-center justify-center overflow-hidden cursor-pointer ${
                            isBackground ? 'aspect-video' : 'aspect-square'
                          } p-2 rounded-t-2xl`}
                          onClick={() => handleSelectMediaItem(item)}
                        >
                          <img
                            src={cleanUrl}
                            alt={item.title}
                            className={`max-h-full max-w-full ${
                              isBackground ? 'object-cover w-full h-full rounded-lg' : 'object-contain'
                            } transition-transform duration-200 group-hover:scale-105`}
                            loading="lazy"
                            onError={(e) => {
                              const target = e.currentTarget;
                              target.style.display = 'none';
                              const fallback = target.nextElementSibling as HTMLElement;
                              if (fallback) fallback.style.display = 'flex';
                            }}
                          />
                          <div className="hidden flex-col items-center justify-center text-center p-2 text-rose-500">
                            <AlertTriangle className="w-6 h-6 mb-1 text-rose-500" />
                            <span className="text-[10px] font-bold">Lỗi ảnh</span>
                          </div>

                          {/* Quick Lightbox Zoom */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewMedia(item);
                            }}
                            className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10"
                            title="Xem kích thước đầy đủ"
                          >
                            <Maximize2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Standard Asset Badge */}
                          <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
                            {isStandard && (
                              <span className="px-2 py-0.5 rounded-full bg-sky-600/90 text-white text-[9px] font-black shadow-xs flex items-center gap-1 backdrop-blur-xs">
                                <Sparkles className="w-2.5 h-2.5" /> Chuẩn
                              </span>
                            )}
                            {isSvg && (
                              <span className="px-2 py-0.5 rounded-full bg-indigo-600/90 text-white text-[9px] font-black shadow-xs">
                                SVG
                              </span>
                            )}
                          </div>

                          {/* Count Unit Badge */}
                          {item.countUnit && (
                            <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-white/95 text-slate-800 border border-slate-200 text-[10px] font-bold shadow-xs">
                              đơn vị: {item.countUnit}
                            </div>
                          )}

                          {/* Selected Active Checkmark */}
                          {isSelected && (
                            <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-sky-600 text-white flex items-center justify-center shadow-md">
                              <Check className="w-4 h-4 stroke-[3]" />
                            </div>
                          )}
                        </div>

                        {/* Card Info */}
                        <div className="p-2.5 flex-1 flex flex-col justify-between bg-white rounded-b-2xl">
                          <div>
                            <h4
                              className="text-xs font-black text-slate-800 line-clamp-1"
                              title={item.title}
                            >
                              {item.title}
                            </h4>
                            <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold mt-0.5">
                              <span>{(item.sizeBytes / 1024).toFixed(0)} KB</span>
                              <span className="uppercase text-slate-500 font-semibold">
                                {isSvg ? 'SVG' : 'PNG'}
                              </span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="pt-2 mt-2 border-t border-slate-100 flex items-center gap-1">
                            {/* In-Question Preview Button */}
                            <button
                              type="button"
                              onClick={() => {
                                setQuestionPreviewMedia(item);
                                setPreviewCount(3);
                              }}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-sky-100 hover:text-sky-700 text-slate-600 cursor-pointer transition-colors"
                              title="Xem thử cách hiển thị trong câu hỏi Toán"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {/* Select Button */}
                            <button
                              type="button"
                              onClick={() => handleSelectMediaItem(item)}
                              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-black flex items-center justify-center gap-1 cursor-pointer transition-all ${
                                isSelected
                                  ? 'bg-sky-600 text-white shadow-xs'
                                  : 'bg-sky-50 text-sky-700 hover:bg-sky-100'
                              }`}
                            >
                              {isSelected ? (
                                <>
                                  <Check className="w-3.5 h-3.5" /> Đã chọn
                                </>
                              ) : (
                                'Chọn hình'
                              )}
                            </button>

                            {/* Delete Button (Only for teacher custom uploads, never for standard assets) */}
                            {!isStandard && (
                              <button
                                type="button"
                                onClick={() => {
                                  setDeleteTarget(item);
                                  setDeleteBlockedReason(null);
                                }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors"
                                title="Xóa hình ảnh này"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* Upload Tab */
            <form onSubmit={handleUploadSubmit} className="max-w-2xl mx-auto space-y-5">
              <div className="p-4 bg-sky-50 rounded-2xl border-2 border-sky-200 text-sky-900 text-xs flex items-start gap-3">
                <Info className="w-5 h-5 text-sky-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-black">Quy chuẩn tải ảnh bổ sung cho giáo viên:</p>
                  <ul className="list-disc pl-4 space-y-0.5 text-slate-600">
                    <li>Hỗ trợ định dạng: <strong>PNG, JPG, JPEG, WebP</strong>.</li>
                    <li>Giới hạn dung lượng: <strong>&lt; 1.000.000 byte (1 MB)</strong>.</li>
                    <li>Trình duyệt <strong>tự động tối ưu hóa và nén tỷ lệ chuẩn</strong> trước khi tải lên.</li>
                  </ul>
                </div>
              </div>

              {/* Drag and Drop Box */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-3 border-dashed rounded-3xl p-6 text-center cursor-pointer transition-all ${
                  uploadPreview
                    ? 'border-sky-300 bg-sky-50/50'
                    : 'border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-sky-400'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileSelect(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />

                {isCompressing ? (
                  <div className="py-8 flex flex-col items-center justify-center gap-2">
                    <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
                    <span className="text-xs font-bold text-slate-700">
                      Đang phân tích và tối ưu hóa nén ảnh...
                    </span>
                  </div>
                ) : uploadPreview ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-40 h-40 rounded-2xl border-2 border-sky-300 bg-white shadow-sm overflow-hidden flex items-center justify-center p-2">
                      <img
                        src={uploadPreview}
                        alt="Xem trước hình tải lên"
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                    {compressionStats && (
                      <div className="px-3 py-1.5 rounded-xl bg-white border border-sky-200 text-xs font-bold text-sky-900 shadow-xs flex items-center gap-3">
                        <span>Gốc: {(compressionStats.originalSize / 1024).toFixed(0)} KB</span>
                        <span>→</span>
                        <span className="text-emerald-600">
                          Tối ưu: {(compressionStats.compressedSize / 1024).toFixed(0)} KB
                        </span>
                        <span>
                          {compressionStats.width}×{compressionStats.height}px
                        </span>
                      </div>
                    )}
                    <span className="text-xs text-slate-500 font-semibold underline">
                      Bấm vào đây để chọn tệp ảnh khác
                    </span>
                  </div>
                ) : (
                  <div className="py-8 flex flex-col items-center justify-center gap-2">
                    <div className="w-12 h-12 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-700">
                        Kéo thả hình ảnh vào đây hoặc bấm để chọn tệp
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        PNG, JPG, WebP (Dung lượng tự động nén &lt; 1 MB)
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Form Metadata Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tên hình ảnh <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    placeholder="Ví dụ: Quả bưởi da xanh, Chú gấu nâu..."
                    className="w-full h-10 px-3 rounded-xl border-2 border-slate-200 focus:border-sky-500 text-xs font-semibold focus:outline-hidden"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Danh mục môn Toán <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value as MediaCategory)}
                    className="w-full h-10 px-3 rounded-xl border-2 border-slate-200 focus:border-sky-500 text-xs font-bold focus:outline-hidden bg-white"
                  >
                    {MEDIA_CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.icon} {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mô tả chi tiết / Ghi chú sư phạm (Tùy chọn)
                </label>
                <textarea
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  placeholder="Ví dụ: Dùng cho bài tập đếm số hoặc so sánh nhiều hơn - ít hơn..."
                  rows={2}
                  className="w-full p-3 rounded-xl border-2 border-slate-200 focus:border-sky-500 text-xs font-medium focus:outline-hidden resize-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('browse');
                    setUploadFile(null);
                    setUploadPreview(null);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isUploading || isCompressing || !compressedData}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 disabled:opacity-40 text-white font-black text-xs flex items-center gap-2 cursor-pointer shadow-md transition-all active:scale-95"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Đang lưu hình...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" /> Lưu vào Thư Viện
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* In-Question Preview Lightbox Modal */}
        {questionPreviewMedia && (
          <div
            onClick={() => setQuestionPreviewMedia(null)}
            className="fixed inset-0 z-70 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-xl bg-white rounded-3xl p-5 shadow-2xl border-3 border-sky-400 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
                    <Eye className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-800">
                      Xem Trước Hình Trong Câu Hỏi Toán
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Mô phỏng hiển thị chính xác cách học sinh nhìn thấy khi làm bài
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setQuestionPreviewMedia(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Simulation Controls */}
              {questionPreviewMedia.category !== 'backgrounds' && (
                <div className="flex items-center justify-between p-2.5 bg-sky-50 rounded-2xl border border-sky-200 text-xs font-bold text-sky-900">
                  <span>Số lượng đối tượng cần thử nghiệm:</span>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 5, 8].map((cnt) => (
                      <button
                        key={cnt}
                        type="button"
                        onClick={() => setPreviewCount(cnt)}
                        className={`w-7 h-7 rounded-lg text-xs font-black cursor-pointer transition-all ${
                          previewCount === cnt
                            ? 'bg-sky-600 text-white shadow-xs'
                            : 'bg-white text-slate-700 hover:bg-sky-100 border border-sky-200'
                        }`}
                      >
                        {cnt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Student Mockup Box */}
              <div className="p-4 rounded-2xl bg-gradient-to-b from-sky-50/50 to-indigo-50/30 border-2 border-sky-200 space-y-3">
                <div className="text-xs font-black text-slate-800">
                  Câu hỏi mẫu: Có bao nhiêu {questionPreviewMedia.title.toLowerCase()} trong hình dưới đây?
                </div>

                <div className="min-h-[140px] p-4 bg-white rounded-xl border border-sky-100 shadow-inner flex flex-wrap items-center justify-center gap-3">
                  {questionPreviewMedia.category === 'backgrounds' ? (
                    <div className="w-full aspect-video rounded-xl overflow-hidden border border-slate-200 shadow-xs">
                      <img
                        src={normalizeAssetUrl(questionPreviewMedia.url)}
                        alt={questionPreviewMedia.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    Array.from({ length: previewCount }).map((_, i) => (
                      <div
                        key={i}
                        className="w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center p-1 rounded-xl bg-slate-50 border border-slate-100 shadow-xs"
                      >
                        <img
                          src={normalizeAssetUrl(questionPreviewMedia.url)}
                          alt=""
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                    ))
                  )}
                </div>

                {/* Simulated Options */}
                <div className="grid grid-cols-4 gap-2 pt-1">
                  {['A. ?', 'B. ?', 'C. ?', 'D. ?'].map((opt, i) => (
                    <div
                      key={i}
                      className="py-2 text-center rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-600 shadow-xs"
                    >
                      {opt}
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setQuestionPreviewMedia(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleSelectMediaItem(questionPreviewMedia);
                    setQuestionPreviewMedia(null);
                  }}
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-black cursor-pointer shadow-md flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" /> Chọn hình này cho câu hỏi
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteTarget && (
          <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
            <div className="w-full max-w-md bg-white rounded-3xl p-6 border-3 border-rose-300 shadow-2xl space-y-4">
              <div className="flex items-center gap-3 text-rose-600">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-6 h-6 text-rose-600" />
                </div>
                <div>
                  <h4 className="text-base font-black text-slate-800">
                    Xác nhận xóa hình ảnh
                  </h4>
                  <p className="text-xs font-semibold text-slate-500">
                    Thao tác này sẽ gỡ hình khỏi Thư viện dùng chung.
                  </p>
                </div>
              </div>

              {deleteBlockedReason ? (
                <div className="p-3 bg-amber-50 rounded-2xl border-2 border-amber-200 text-amber-900 text-xs font-bold leading-relaxed space-y-1">
                  <div className="flex items-center gap-1.5 text-amber-800 font-black">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Bảo toàn dữ liệu học liệu:</span>
                  </div>
                  <p>{deleteBlockedReason}</p>
                </div>
              ) : (
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl border border-slate-200 bg-white overflow-hidden flex items-center justify-center p-1 flex-shrink-0">
                    <img src={normalizeAssetUrl(deleteTarget.url)} alt="" className="max-w-full max-h-full object-contain" />
                  </div>
                  <div className="overflow-hidden">
                    <h5 className="text-xs font-black text-slate-800 truncate">{deleteTarget.title}</h5>
                    <p className="text-[11px] text-slate-400">
                      {(deleteTarget.sizeBytes / 1024).toFixed(0)} KB • {deleteTarget.category}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setDeleteTarget(null);
                    setDeleteBlockedReason(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  Đóng
                </button>
                {!deleteBlockedReason && (
                  <button
                    type="button"
                    onClick={handleDeleteConfirm}
                    disabled={isDeleting}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black cursor-pointer shadow-sm flex items-center gap-1.5"
                  >
                    {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    <span>Xác nhận xóa</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Lightbox Preview Modal */}
        {previewMedia && (
          <div
            onClick={() => setPreviewMedia(null)}
            className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-3xl max-h-[85vh] bg-white rounded-3xl p-4 shadow-2xl flex flex-col items-center gap-3 border-3 border-white/20"
            >
              <button
                type="button"
                onClick={() => setPreviewMedia(null)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="max-h-[65vh] overflow-hidden flex items-center justify-center p-4">
                <img
                  src={normalizeAssetUrl(previewMedia.url)}
                  alt={previewMedia.title}
                  className="max-w-full max-h-full object-contain rounded-xl"
                />
              </div>

              <div className="w-full text-center px-4">
                <h4 className="text-sm font-black text-slate-800">{previewMedia.title}</h4>
                <p className="text-xs text-slate-500 font-medium">
                  {previewMedia.description || 'Tài nguyên đồ họa chuẩn'} • {(previewMedia.sizeBytes / 1024).toFixed(0)} KB
                  {previewMedia.countUnit ? ` • Đơn vị đếm: ${previewMedia.countUnit}` : ''}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
