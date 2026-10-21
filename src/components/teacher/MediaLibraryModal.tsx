import React, { useState, useEffect, useRef } from 'react';
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
} from 'lucide-react';
import { MediaCategory, MediaItem } from '../../types';
import { dataService } from '../../lib/dataService';

export const MEDIA_CATEGORIES: { id: MediaCategory; label: string; icon: string }[] = [
  { id: 'fruits', label: 'Hoa quả', icon: '🍎' },
  { id: 'animals', label: 'Động vật', icon: '🐶' },
  { id: 'items', label: 'Đồ vật học tập', icon: '🎒' },
  { id: 'counters_frames', label: 'Chấm tròn & Khung số', icon: '🔴' },
  { id: 'counting_sticks', label: 'Que tính & Bó que', icon: '🥢' },
  { id: 'geometry', label: 'Hình học phẳng & Khối', icon: '📐' },
  { id: 'clock_time', label: 'Đồng hồ & Thời gian', icon: '⏰' },
  { id: 'money_measurement', label: 'Tiền tệ & Đơn vị đo', icon: '🪙' },
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
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Upload Form State
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCategory, setUploadCategory] = useState<MediaCategory>('fruits');
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

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadMedia();
    }
  }, [isOpen, selectedCategory]);

  const loadMedia = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const items = await dataService.fetchMediaLibrary(selectedCategory, searchQuery);
      setMediaList(items);
    } catch (err: any) {
      setErrorMsg(err.message || 'Không thể tải thư viện hình ảnh.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadMedia();
  };

  // Process File Selection with Automatic Client Compression
  const handleFileSelect = async (file: File) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsCompressing(true);
    setUploadFile(file);

    // Auto populate title from file name without extension
    const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
    if (!uploadTitle) {
      setUploadTitle(baseName.charAt(0).toUpperCase() + baseName.slice(1));
    }

    try {
      const compressed = await dataService.compressImageClient(file, {
        maxWidth: 1200,
        maxHeight: 1200,
        maxBytes: 1_000_000, // strictly under 1MB
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

      // Auto select if caller requested
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-5xl max-h-[92vh] bg-white rounded-3xl border-3 border-sky-300 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-sky-500 via-indigo-600 to-blue-600 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center border border-white/30 shadow-inner">
              <FolderOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
                Thư Viện Hình Ảnh Dùng Chung
                <span className="px-2 py-0.5 rounded-full bg-sky-200/30 text-sky-100 text-xs font-bold border border-white/20">
                  Toán Tiểu Học
                </span>
              </h2>
              <p className="text-xs text-sky-100 font-medium">
                Quản lý, tìm kiếm và tái sử dụng hình minh họa chuẩn hóa cho câu hỏi Toán
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tab switchers */}
            <div className="flex bg-black/20 p-1 rounded-xl border border-white/20">
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
                Duyệt hình ảnh ({mediaList.length})
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
                <Upload className="w-3.5 h-3.5" /> Tải ảnh mới (&lt; 1MB)
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
          <div className="mx-6 mt-4 p-3 bg-rose-50 border-2 border-rose-200 rounded-2xl flex items-center justify-between text-rose-800 text-xs font-bold animate-in fade-in">
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
          <div className="mx-6 mt-4 p-3 bg-emerald-50 border-2 border-emerald-200 rounded-2xl flex items-center justify-between text-emerald-800 text-xs font-bold animate-in fade-in">
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
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'browse' ? (
            <div className="space-y-4">
              {/* Filter & Search Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                {/* Search Form */}
                <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm kiếm hình theo tên, mô tả..."
                    className="w-full h-10 pl-9 pr-20 rounded-xl border-2 border-slate-200 focus:border-sky-500 text-xs font-semibold focus:outline-hidden transition-colors"
                  />
                  <button
                    type="submit"
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    Tìm
                  </button>
                </form>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={loadMedia}
                    disabled={isLoading}
                    className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                    title="Làm mới danh sách"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                    <span>Làm mới</span>
                  </button>

                  <span className="text-xs font-bold text-slate-400">
                    Hiển thị {mediaList.length} hình ảnh
                  </span>
                </div>
              </div>

              {/* Categories Pills */}
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedCategory('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                    selectedCategory === 'all'
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  🌟 Tất cả danh mục
                </button>
                {MEDIA_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                      selectedCategory === cat.id
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>

              {/* Grid of Images */}
              {isLoading ? (
                <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
                  <span className="text-xs font-bold">Đang tải thư viện hình ảnh...</span>
                </div>
              ) : mediaList.length === 0 ? (
                <div className="py-16 text-center rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center">
                    <ImageIcon className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-700">Chưa có hình ảnh nào phù hợp</h3>
                    <p className="text-xs text-slate-500 font-medium mt-1">
                      Thử đổi từ khóa tìm kiếm hoặc nhấn nút &ldquo;Tải ảnh mới&rdquo; để thêm hình ảnh vào thư viện.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('upload')}
                    className="mt-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm transition-transform active:scale-95"
                  >
                    <Upload className="w-3.5 h-3.5" /> Tải ảnh mới ngay
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {mediaList.map((item) => {
                    const isSelected = selectedMediaId === item.id;
                    const catInfo = MEDIA_CATEGORIES.find((c) => c.id === item.category);

                    return (
                      <div
                        key={item.id}
                        className={`group relative bg-white rounded-2xl border-2 transition-all overflow-hidden flex flex-col ${
                          isSelected
                            ? 'border-sky-500 ring-3 ring-sky-200 shadow-md'
                            : 'border-slate-200 hover:border-sky-300 hover:shadow-md'
                        }`}
                      >
                        {/* Image Canvas Box */}
                        <div className="relative aspect-square w-full bg-slate-50 flex items-center justify-center overflow-hidden p-2">
                          <img
                            src={item.url}
                            alt={item.title}
                            className="max-h-full max-w-full object-contain transition-transform group-hover:scale-105"
                            loading="lazy"
                          />

                          {/* Quick Lightbox Zoom */}
                          <button
                            type="button"
                            onClick={() => setPreviewMedia(item)}
                            className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/50 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            title="Xem kích thước đầy đủ"
                          >
                            <Maximize2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Category Badge */}
                          <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-xs border border-slate-200 text-[10px] font-black text-slate-700 flex items-center gap-1 shadow-xs">
                            <span>{catInfo?.icon || '📁'}</span>
                            <span className="truncate max-w-[80px]">{catInfo?.label || item.category}</span>
                          </div>
                        </div>

                        {/* Card Info */}
                        <div className="p-3 flex-1 flex flex-col justify-between bg-white">
                          <div>
                            <h4
                              className="text-xs font-black text-slate-800 truncate"
                              title={item.title}
                            >
                              {item.title}
                            </h4>
                            <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium mt-0.5">
                              <span>{(item.sizeBytes / 1024).toFixed(0)} KB</span>
                              <span className="uppercase">{item.mimeType.replace('image/', '')}</span>
                            </div>
                            {item.description && (
                              <p className="text-[11px] text-slate-500 line-clamp-1 mt-1" title={item.description}>
                                {item.description}
                              </p>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between gap-1">
                            {onSelectMedia && (
                              <button
                                type="button"
                                onClick={() => {
                                  onSelectMedia(item);
                                  onClose();
                                }}
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
                            )}

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
                  <p className="font-black">Quy chuẩn tệp hình ảnh môn Toán:</p>
                  <ul className="list-disc pl-4 space-y-0.5 text-slate-600">
                    <li>Hỗ trợ định dạng: <strong>JPG, JPEG, PNG, WebP</strong>. Chặn tuyệt đối SVG/HTML.</li>
                    <li>Giới hạn dung lượng: <strong>&lt; 1.000.000 byte (1 MB)</strong>.</li>
                    <li>Hệ thống <strong>tự động tối ưu và nén tỷ lệ chuẩn</strong> ở trình duyệt trước khi tải lên.</li>
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
                          Tối ưu: {(compressionStats.compressedSize / 1024).toFixed(0)} KB ({compressionStats.mimeType.replace('image/', '')})
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
                        JPG, PNG, WebP (Dung lượng tự động nén &lt; 1 MB)
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
                    placeholder="Ví dụ: Quả táo đỏ đếm số, Khung 5 ô xanh..."
                    className="w-full h-10 px-3 rounded-xl border-2 border-slate-200 focus:border-sky-500 text-xs font-semibold focus:outline-hidden"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Phân nhóm môn Toán <span className="text-rose-500">*</span>
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
                  placeholder="Ví dụ: Hình minh họa trực quan 5 quả táo đỏ dùng cho bài tập đếm số lớp 1..."
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
                    <img src={deleteTarget.url} alt="" className="max-w-full max-h-full object-contain" />
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
                  src={previewMedia.url}
                  alt={previewMedia.title}
                  className="max-w-full max-h-full object-contain rounded-xl"
                />
              </div>

              <div className="w-full text-center px-4">
                <h4 className="text-sm font-black text-slate-800">{previewMedia.title}</h4>
                <p className="text-xs text-slate-500 font-medium">
                  {previewMedia.description || 'Không có mô tả'} • {(previewMedia.sizeBytes / 1024).toFixed(0)} KB
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
