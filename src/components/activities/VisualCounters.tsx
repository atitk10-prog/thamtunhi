import React from 'react';
import { VisualAssetConfig } from '../../types';
import {
  findStandardAsset,
  findStandardAssetByIcon,
  normalizeAssetUrl,
  getAssetCountUnit,
} from '../../lib/standardAssets';

interface VisualCountersProps {
  config?: VisualAssetConfig;
  isTeacherView?: boolean;
}

export const VisualCounters: React.FC<VisualCountersProps> = ({ config, isTeacherView = false }) => {
  // Scenario 3: Thiếu dữ liệu hoặc cần bổ sung hình minh họa
  if (!config || config.type === 'none' || config.requiresTeacherIllustration) {
    if (isTeacherView) {
      return (
        <div className="my-3 p-3.5 rounded-2xl bg-amber-50 border-2 border-dashed border-amber-300 text-amber-900 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-lg">💡</span>
            <div>
              <div className="font-black text-amber-800">Cần bổ sung hình minh họa</div>
              <div className="text-[11px] text-amber-700 font-medium">
                {config?.caption || 'Chưa có mô hình trực quan tự động phù hợp cho câu hỏi này. Thầy/Cô vui lòng chọn Kiểu mô hình hoặc Ảnh từ Thư viện.'}
              </div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  }

  // Resolve standard asset or custom image for item sprites
  const icon = config.iconName || 'apple';
  const customUrl = normalizeAssetUrl(config.imageUrl);
  const matchedAsset = customUrl ? findStandardAsset(customUrl) : findStandardAssetByIcon(icon);
  const effectiveUrl = customUrl || matchedAsset?.url;
  const effectiveLabel = config.imageAlt || matchedAsset?.title || 'Vật thể';
  const unitName = config.countUnit || getAssetCountUnit(effectiveUrl || icon, 'vật thể');

  // Render an individual item icon (High-res PNG asset from 60-pack, no crude emoji)
  const renderIcon = (index: number, keyPrefix = 'icon') => {
    if (effectiveUrl) {
      return (
        <div
          key={`${keyPrefix}-${index}`}
          className="relative w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center p-1 transition-transform hover:scale-110 drop-shadow-xs"
        >
          <img
            src={effectiveUrl}
            alt={effectiveLabel}
            className="w-full h-full object-contain filter drop-shadow-xs select-none"
            loading="lazy"
            onError={(e) => {
              const target = e.currentTarget;
              target.style.display = 'none';
              const fallback = target.nextElementSibling as HTMLElement;
              if (fallback) fallback.style.display = 'flex';
            }}
          />
          <div
            className="hidden w-10 h-10 rounded-xl bg-amber-50 border border-amber-300 text-amber-700 text-xs font-black items-center justify-center"
            title="Tệp ảnh chưa sẵn sàng"
          >
            ⚠️
          </div>
        </div>
      );
    }

    // Default styled counter block if no graphic asset is found
    return (
      <div
        key={`${keyPrefix}-${index}`}
        className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 border-2 border-amber-600 flex items-center justify-center font-bold text-white shadow-md select-none"
      >
        {index + 1}
      </div>
    );
  };

  // 1. Library Image Illustration (Single Image or Multi-Item Repeat)
  if (config.type === 'image') {
    const cleanUrl = normalizeAssetUrl(config.imageUrl);

    if (!cleanUrl) {
      if (isTeacherView) {
        return (
          <div className="my-3 p-3.5 rounded-2xl bg-amber-50 border-2 border-dashed border-amber-300 text-amber-900 text-xs font-semibold flex items-center gap-2">
            <span>💡</span>
            <span><strong>Cần chọn hình minh họa:</strong> Thầy/Cô vui lòng chọn ảnh từ Thư viện hình ảnh hoặc tải ảnh mới.</span>
          </div>
        );
      }
      return null;
    }

    // Multi-item repeat when count > 1
    if (typeof config.count === 'number' && config.count > 1) {
      const count = Math.min(config.count, 20);
      return (
        <div className="my-5 p-5 bg-sky-50/80 rounded-2xl border-2 border-sky-100 max-w-lg mx-auto">
          <div className="text-xs uppercase tracking-wider font-extrabold text-sky-700 mb-3 text-center">
            Quan sát mô hình đếm: {count} {unitName}
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {Array.from({ length: count }).map((_, i) => renderIcon(i, 'img-rep'))}
          </div>
          {config.caption && (
            <p className="text-xs text-slate-500 font-semibold italic mt-2 text-center px-2">
              {config.caption}
            </p>
          )}
        </div>
      );
    }

    // Zero count representation
    if (config.count === 0) {
      return (
        <div className="my-4 p-5 bg-gradient-to-b from-sky-50 to-indigo-50/50 rounded-3xl border-3 border-sky-200 shadow-sm max-w-md mx-auto">
          <div className="text-xs font-black uppercase tracking-wider text-sky-800 text-center mb-2">
            Mô hình đếm đồ vật (0 {unitName})
          </div>
          <div className="p-6 bg-white/90 rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-center">
            <span className="text-2xl mb-1">🧺</span>
            <span className="text-sm font-black text-slate-700">0 {unitName}</span>
            <span className="text-xs font-semibold text-slate-400 mt-0.5">(Khay rỗng – Số lượng: 0)</span>
          </div>
        </div>
      );
    }

    // Single Illustration Image
    const scaleClasses = {
      small: 'max-w-[200px]',
      medium: 'max-w-[320px]',
      large: 'max-w-[460px]',
      full: 'w-full max-w-xl',
    }[config.imageScale || 'medium'] || 'max-w-[320px]';

    const aspectClasses = {
      original: '',
      '1:1': 'aspect-square',
      '4:3': 'aspect-[4/3]',
      '16:9': 'aspect-video',
    }[config.imageAspectRatio || 'original'] || '';

    const fitClass = config.imageFit === 'cover' ? 'object-cover' : 'object-contain';

    const alignClass = {
      left: 'justify-start',
      center: 'justify-center',
      right: 'justify-end',
    }[config.imageAlign || 'center'] || 'justify-center';

    return (
      <div className={`my-4 w-full flex ${alignClass}`}>
        <div className={`flex flex-col items-center ${scaleClasses} w-full`}>
          <div className={`w-full overflow-hidden rounded-2xl bg-white border-2 border-slate-200 shadow-sm p-1.5 ${aspectClasses}`}>
            <img
              src={cleanUrl}
              alt={config.imageAlt || 'Hình minh họa câu hỏi'}
              className={`w-full h-full max-h-[360px] rounded-xl ${fitClass} transition-transform hover:scale-[1.01]`}
              loading="lazy"
              onError={(e) => {
                const target = e.currentTarget;
                target.style.display = 'none';
                const fallback = target.nextElementSibling as HTMLElement;
                if (fallback) fallback.style.display = 'flex';
              }}
            />
            <div className="hidden flex-col items-center justify-center text-center p-6 bg-amber-50 rounded-xl text-amber-800 text-xs font-bold gap-1.5">
              <span className="text-2xl">⚠️</span>
              <span>Không thể tải tệp hình ảnh. Thầy/Cô vui lòng kiểm tra lại liên kết trong Thư viện.</span>
            </div>
          </div>
          {config.caption && (
            <p className="text-xs text-slate-500 font-semibold italic mt-2 text-center px-2">
              {config.caption}
            </p>
          )}
        </div>
      </div>
    );
  }

  // 2. Word Story Problem
  if (config.type === 'word_story' && config.storyText) {
    return (
      <div className="my-4 p-4 rounded-2xl bg-amber-50 border-2 border-amber-200 text-amber-900 font-semibold text-lg flex items-center gap-3">
        <span className="text-2xl">📖</span>
        <span>{config.storyText}</span>
      </div>
    );
  }

  // 3. Five-Frame & Ten-Frame Grid Models (GDPT 2018)
  const isFrame = config.type === 'ten_frame' || config.type === 'five_frame';
  if (isFrame) {
    const isFive = config.type === 'five_frame' || config.gridSize === 5;
    const gridCellCount = isFive ? 5 : 10;
    const count = config.count ?? 0;
    const firstFrameCount = Math.min(count, gridCellCount);
    const secondFrameCount = !isFive && count > 10 ? Math.min(count - 10, 10) : 0;

    const dotColor = config.dotColor || 'blue';
    const dotClasses: Record<string, string> = {
      blue: 'bg-gradient-to-br from-sky-400 to-blue-600 border border-blue-700 text-white',
      red: 'bg-gradient-to-br from-rose-400 to-rose-600 border border-rose-700 text-white',
      green: 'bg-gradient-to-br from-emerald-400 to-emerald-600 border border-emerald-700 text-white',
      amber: 'bg-gradient-to-br from-amber-400 to-amber-600 border border-amber-700 text-white',
    };
    const dotClass = dotClasses[dotColor] || dotClasses.blue;

    return (
      <div className="my-4 p-5 bg-gradient-to-b from-sky-50 to-indigo-50/50 rounded-3xl border-3 border-sky-200 shadow-sm max-w-md mx-auto">
        <div className="text-xs font-black uppercase tracking-wider text-sky-700 text-center mb-1">
          {isFive ? 'Khung 5 Ô Trực Quan' : 'Khung 10 Ô (Ten-Frame) Trực Quan'}
        </div>
        {count === 0 && (
          <div className="text-[11px] font-bold text-slate-500 text-center mb-2">
            (0 chấm tròn – Khung rỗng)
          </div>
        )}
        <div
          className={`mx-auto grid gap-2 p-3 bg-white rounded-2xl border-3 border-sky-300 shadow-inner ${
            isFive ? 'max-w-[280px] grid-cols-5' : 'max-w-[280px] grid-cols-5'
          }`}
        >
          {Array.from({ length: gridCellCount }).map((_, i) => {
            const isFilled = i < firstFrameCount;
            return (
              <div
                key={`f1-${i}`}
                className="w-11 h-11 rounded-xl border-2 border-slate-200 bg-slate-50 flex items-center justify-center"
              >
                {isFilled && (
                  <div className={`w-8 h-8 rounded-full ${dotClass} shadow-sm flex items-center justify-center text-xs font-bold animate-in zoom-in-50`}>
                    ●
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {secondFrameCount > 0 && (
          <div className="mt-3">
            <div className="text-[11px] font-bold text-slate-500 text-center mb-1">Khung thứ hai:</div>
            <div className="max-w-[280px] mx-auto grid grid-cols-5 gap-2 p-3 bg-white rounded-2xl border-3 border-sky-300 shadow-inner">
              {Array.from({ length: 10 }).map((_, i) => {
                const isFilled = i < secondFrameCount;
                return (
                  <div
                    key={`f2-${i}`}
                    className="w-11 h-11 rounded-xl border-2 border-slate-200 bg-slate-50 flex items-center justify-center"
                  >
                    {isFilled && (
                      <div className={`w-8 h-8 rounded-full ${dotClass} shadow-sm flex items-center justify-center text-xs font-bold animate-in zoom-in-50`}>
                        ●
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // 4. Bundles of Tens & Singles / Que tính (Sử dụng SVG chuẩn từ bộ 60 tài nguyên)
  if (config.type === 'bundles' || (config.tens !== undefined && config.ones !== undefined)) {
    const rawTens = config.tens;
    const rawOnes = config.ones;

    // Check if missing data:
    if (rawTens === undefined && rawOnes === undefined && config.count === undefined) {
      if (isTeacherView) {
        return (
          <div className="my-3 p-3.5 rounded-2xl bg-amber-50 border-2 border-dashed border-amber-300 text-amber-900 text-xs font-semibold flex items-center gap-2">
            <span>💡</span>
            <span><strong>Cần bổ sung hình que tính:</strong> Chưa có số liệu bó chục hoặc que rời. Thầy/Cô vui lòng nhập số lượng cụ thể trong phần biên tập.</span>
          </div>
        );
      }
      return null;
    }

    const tens = Math.max(0, rawTens ?? 0);
    const ones = Math.max(0, rawOnes ?? 0);
    const isZero = tens === 0 && ones === 0;

    // Scenario 1: Số lượng thực sự bằng 0: hiển thị đúng số 0, tuyệt đối không fallback 4 que
    if (isZero) {
      return (
        <div className="my-4 p-5 bg-gradient-to-b from-sky-50 to-indigo-50/50 rounded-3xl border-3 border-sky-200 shadow-sm max-w-lg mx-auto">
          <div className="text-xs font-black uppercase tracking-wider text-emerald-800 text-center mb-3">
            🥢 Mô hình Que tính (0 que tính)
          </div>
          <div className="p-6 bg-white/90 rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-center">
            <span className="text-2xl mb-1">🥢</span>
            <span className="text-sm font-black text-slate-700">0 que tính</span>
            <span className="text-xs font-semibold text-slate-400 mt-0.5">
              0 bó chục &bull; 0 que lẻ (Khay rỗng – Số lượng: 0)
            </span>
          </div>
        </div>
      );
    }

    const isSmallStick = tens === 0;

    return (
      <div className="my-4 p-5 bg-gradient-to-b from-sky-50 to-indigo-50/50 rounded-3xl border-3 border-sky-200 shadow-sm max-w-xl mx-auto">
        <div className="text-xs font-black uppercase tracking-wider text-emerald-800 text-center mb-3">
          {isSmallStick ? `🥢 Mô hình Que tính (${ones} que lẻ)` : `🥢 Mô hình Bó Que tính & Que Lẻ (${tens} chục + ${ones} que lẻ)`}
        </div>
        <div className="flex flex-wrap items-center justify-center gap-6 p-4 bg-white/80 rounded-2xl border-2 border-sky-100">
          {/* Tens bundles with official SVG */}
          {tens > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-3">
              {Array.from({ length: tens }).map((_, i) => (
                <div
                  key={`ten-${i}`}
                  className="flex flex-col items-center p-2 rounded-2xl bg-amber-50/80 border-2 border-amber-300 shadow-xs transition-transform hover:scale-105"
                >
                  <img
                    src="/assets/toan-nhi/math-counting-stick-bundle10.svg"
                    alt="Bó 10 que tính"
                    className="w-16 h-28 object-contain filter drop-shadow-sm select-none"
                    loading="lazy"
                  />
                  <span className="text-[11px] font-black text-amber-900 mt-1.5">1 bó chục</span>
                </div>
              ))}
            </div>
          )}

          {/* Plus separator when both tens and ones exist */}
          {ones > 0 && tens > 0 && <span className="text-2xl font-black text-slate-400">+</span>}

          {/* Ones sticks with official SVG */}
          {ones > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-2 max-w-[260px]">
              {Array.from({ length: ones }).map((_, i) => (
                <div key={`one-${i}`} className="flex flex-col items-center">
                  <img
                    src="/assets/toan-nhi/math-counting-stick-single.svg"
                    alt={`Que tính ${i + 1}`}
                    className="w-3.5 h-28 object-contain filter drop-shadow-xs transition-transform hover:scale-110 select-none"
                    loading="lazy"
                  />
                </div>
              ))}
              <div className="w-full text-center text-[11px] font-black text-emerald-800 mt-1">
                {tens > 0 ? `${ones} que rời` : `${ones} que tính`}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 5. Addition (Phép cộng a + b: Minh họa đúng a vật + b vật)
  if (config.type === 'addition') {
    const left = Math.max(0, config.leftCount ?? 0);
    const right = Math.max(0, config.rightCount ?? 0);

    return (
      <div className="my-5 p-5 bg-gradient-to-r from-sky-50 via-amber-50/30 to-indigo-50 rounded-3xl border-2 border-sky-200 w-full max-w-xl mx-auto shadow-xs">
        <div className="text-xs uppercase tracking-wider font-extrabold text-sky-800 mb-3 text-center">
          Quan sát mô hình phép cộng: Gộp hai nhóm {unitName}
        </div>
        <div className="flex items-center justify-center gap-3 sm:gap-6">
          {/* Group 1 */}
          <div className="flex-1 p-3 sm:p-4 bg-white rounded-2xl border-2 border-sky-300 shadow-xs flex flex-col items-center">
            <div className="text-xs font-black text-sky-800 mb-2 uppercase tracking-wide text-center">
              {config.leftLabel || (left === 0 ? `0 ${unitName}` : `${left} ${unitName}`)}
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 min-h-[50px]">
              {left > 0 ? (
                Array.from({ length: left }).map((_, i) => renderIcon(i, 'add-left'))
              ) : (
                <div className="flex flex-col items-center justify-center py-2 text-slate-400">
                  <span className="text-xs font-semibold">(0 {unitName} – Khay rỗng)</span>
                </div>
              )}
            </div>
          </div>

          {/* Plus Sign */}
          <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-900 font-black flex items-center justify-center shadow-md text-2xl border-2 border-amber-500 flex-shrink-0">
            +
          </div>

          {/* Group 2 */}
          <div className="flex-1 p-3 sm:p-4 bg-white rounded-2xl border-2 border-indigo-300 shadow-xs flex flex-col items-center">
            <div className="text-xs font-black text-indigo-800 mb-2 uppercase tracking-wide text-center">
              {config.rightLabel || (right === 0 ? `0 ${unitName}` : `${right} ${unitName}`)}
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 min-h-[50px]">
              {right > 0 ? (
                Array.from({ length: right }).map((_, i) => renderIcon(i, 'add-right'))
              ) : (
                <div className="flex flex-col items-center justify-center py-2 text-slate-400">
                  <span className="text-xs font-semibold">(0 {unitName} – Khay rỗng)</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 6. Dual-Group Comparison
  const isComparison = config.type === 'comparison' || (config.leftCount !== undefined && config.rightCount !== undefined);
  if (isComparison) {
    if (config.leftCount === undefined && config.rightCount === undefined && config.count === undefined) {
      if (isTeacherView) {
        return (
          <div className="my-3 p-3.5 rounded-2xl bg-amber-50 border-2 border-dashed border-amber-300 text-amber-900 text-xs font-semibold flex items-center gap-2">
            <span>💡</span>
            <span><strong>Cần bổ sung số lượng so sánh:</strong> Chưa có số lượng của hai nhóm vật thể để so sánh.</span>
          </div>
        );
      }
      return null;
    }
    const left = Math.max(0, config.leftCount ?? config.count ?? 0);
    const right = Math.max(0, config.rightCount ?? 0);

    return (
      <div className="my-5 p-5 bg-sky-50/80 rounded-3xl border-2 border-sky-200 w-full max-w-xl mx-auto">
        <div className="text-xs uppercase tracking-wider font-extrabold text-sky-700 mb-3 text-center">
          Quan sát và so sánh hai nhóm {unitName}
        </div>
        <div className="flex items-center justify-center gap-4 sm:gap-8">
          {/* Left Group */}
          <div className="flex-1 p-3 sm:p-4 bg-white rounded-2xl border-2 border-sky-300 shadow-xs flex flex-col items-center">
            <div className="text-xs font-black text-sky-800 mb-2 uppercase tracking-wide">
              {config.leftLabel || `Nhóm A (${left} ${unitName})`}
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 min-h-[50px]">
              {left > 0 ? (
                Array.from({ length: left }).map((_, i) => renderIcon(i, 'left'))
              ) : (
                <span className="text-xs font-semibold text-slate-400 py-2">(0 {unitName} – Khay rỗng)</span>
              )}
            </div>
          </div>

          {/* Versus Placeholder */}
          <div className="w-10 h-10 rounded-full bg-amber-400 text-slate-900 font-black flex items-center justify-center shadow-md text-sm border-2 border-amber-500 flex-shrink-0">
            ?
          </div>

          {/* Right Group */}
          <div className="flex-1 p-3 sm:p-4 bg-white rounded-2xl border-2 border-sky-300 shadow-xs flex flex-col items-center">
            <div className="text-xs font-black text-sky-800 mb-2 uppercase tracking-wide">
              {config.rightLabel || `Nhóm B (${right} ${unitName})`}
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 min-h-[50px]">
              {right > 0 ? (
                Array.from({ length: right }).map((_, i) => renderIcon(i, 'right'))
              ) : (
                <span className="text-xs font-semibold text-slate-400 py-2">(0 {unitName} – Khay rỗng)</span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 7. Shapes (Geometry with SVG support)
  if (config.type === 'shapes' && config.shapeType) {
    if (config.shapeType === 'circle') {
      return (
        <div className="my-5 p-5 bg-gradient-to-b from-sky-50 to-indigo-50/50 rounded-3xl border-2 border-sky-200 max-w-sm mx-auto flex flex-col items-center">
          <div className="text-xs uppercase tracking-wider font-extrabold text-sky-800 mb-3 text-center">
            Quan sát hình học: Hình tròn
          </div>
          <img
            src="/assets/toan-nhi/math-shape-circle-blue.svg"
            alt="Hình tròn xanh"
            className="w-36 h-36 object-contain filter drop-shadow-md transition-transform hover:scale-105 select-none"
            loading="lazy"
          />
        </div>
      );
    }
    if (config.shapeType === 'triangle') {
      return (
        <div className="my-5 p-5 bg-gradient-to-b from-sky-50 to-indigo-50/50 rounded-3xl border-2 border-sky-200 max-w-sm mx-auto flex flex-col items-center">
          <div className="text-xs uppercase tracking-wider font-extrabold text-sky-800 mb-3 text-center">
            Quan sát hình học: Hình tam giác
          </div>
          <img
            src="/assets/toan-nhi/math-shape-triangle-yellow.svg"
            alt="Hình tam giác vàng"
            className="w-36 h-36 object-contain filter drop-shadow-md transition-transform hover:scale-105 select-none"
            loading="lazy"
          />
        </div>
      );
    }

    const shapeLabels: Record<string, { name: string; symbol: string }> = {
      square: { name: 'Hình vuông', symbol: '🟦' },
      rectangle: { name: 'Hình chữ nhật', symbol: '▬' },
      cylinder: { name: 'Khối trụ', symbol: '🛢️' },
      sphere: { name: 'Khối cầu', symbol: '🔮' },
    };
    const shape = shapeLabels[config.shapeType] || { name: 'Hình học', symbol: '🔷' };

    return (
      <div className="my-5 p-6 bg-gradient-to-br from-indigo-50 to-sky-50 rounded-3xl border-2 border-indigo-200 max-w-xs mx-auto text-center shadow-xs">
        <div className="text-xs uppercase tracking-wider font-extrabold text-indigo-700 mb-2">
          Quan sát hình học
        </div>
        <div className="w-24 h-24 mx-auto my-3 bg-white rounded-2xl border-2 border-indigo-300 shadow-md flex items-center justify-center text-5xl">
          {shape.symbol}
        </div>
        <div className="text-sm font-black text-indigo-950 mt-1">{shape.name}</div>
      </div>
    );
  }

  // 8. Single Counter Group (Zero-safe & Exact Representation with high-res PNG sprites)
  if (config.type === 'counters' && typeof config.count === 'number') {
    const count = Math.max(0, config.count);

    // Scenario 1: Số lượng thực sự bằng 0: hiển thị đúng số 0
    if (count === 0) {
      return (
        <div className="my-4 p-5 bg-gradient-to-b from-sky-50 to-indigo-50/50 rounded-3xl border-3 border-sky-200 shadow-sm max-w-md mx-auto">
          <div className="text-xs font-black uppercase tracking-wider text-sky-800 text-center mb-2">
            Mô hình đếm đồ vật (0 {unitName})
          </div>
          <div className="p-6 bg-white/90 rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-center">
            <span className="text-2xl mb-1">🧺</span>
            <span className="text-sm font-black text-slate-700">0 {unitName}</span>
            <span className="text-xs font-semibold text-slate-400 mt-0.5">(Khay rỗng – Số lượng: 0)</span>
          </div>
        </div>
      );
    }

    return (
      <div className="my-5 p-5 bg-sky-50/80 rounded-2xl border-2 border-sky-100 max-w-md mx-auto">
        <div className="text-xs uppercase tracking-wider font-extrabold text-sky-600 mb-3 text-center">
          Quan sát mô hình đếm: {count} {unitName}
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {Array.from({ length: count }).map((_, i) => renderIcon(i))}
        </div>
      </div>
    );
  }

  // 9. Vietnamese Currency (Banknotes & Coins - GDPT 2018)
  if (config.type === 'money' || (config.moneyBills && config.moneyBills.length > 0)) {
    if (!config.moneyBills || config.moneyBills.length === 0) {
      if (isTeacherView) {
        return (
          <div className="my-3 p-3.5 rounded-2xl bg-amber-50 border-2 border-dashed border-amber-300 text-amber-900 text-xs font-semibold flex items-center gap-2">
            <span>💡</span>
            <span><strong>Cần bổ sung mệnh giá tiền:</strong> Thầy/Cô vui lòng chọn các tờ tiền cụ thể trong phần biên tập.</span>
          </div>
        );
      }
      return null;
    }
    const bills = config.moneyBills;

    const getBanknoteStyle = (denom: number) => {
      switch (denom) {
        case 1000:
          return { bg: 'bg-amber-50', border: 'border-amber-600', text: 'text-amber-900', label: '1 000 đ', name: 'Một nghìn đồng' };
        case 2000:
          return { bg: 'bg-stone-100', border: 'border-stone-500', text: 'text-stone-900', label: '2 000 đ', name: 'Hai nghìn đồng' };
        case 5000:
          return { bg: 'bg-blue-50', border: 'border-blue-700', text: 'text-blue-950', label: '5 000 đ', name: 'Năm nghìn đồng' };
        case 10000:
          return { bg: 'bg-amber-100', border: 'border-amber-700', text: 'text-amber-950', label: '10 000 đ', name: 'Mười nghìn đồng' };
        case 20000:
          return { bg: 'bg-sky-100', border: 'border-sky-700', text: 'text-sky-950', label: '20 000 đ', name: 'Hai mươi nghìn đồng' };
        case 50000:
          return { bg: 'bg-rose-100', border: 'border-rose-600', text: 'text-rose-950', label: '50 000 đ', name: 'Năm mươi nghìn đồng' };
        case 100000:
          return { bg: 'bg-emerald-100', border: 'border-emerald-700', text: 'text-emerald-950', label: '100 000 đ', name: 'Một trăm nghìn đồng' };
        default:
          return { bg: 'bg-slate-100', border: 'border-slate-500', text: 'text-slate-900', label: `${denom.toLocaleString('vi-VN')} đ`, name: `${denom.toLocaleString('vi-VN')} đồng` };
      }
    };

    return (
      <div className="my-5 p-5 bg-gradient-to-b from-amber-50/70 to-emerald-50/40 rounded-3xl border-2 border-emerald-200/80 max-w-xl mx-auto shadow-xs">
        <div className="text-xs uppercase tracking-wider font-extrabold text-emerald-800 mb-3 text-center flex items-center justify-center gap-1.5">
          <span>🪙</span> Tiền Việt Nam (VNĐ) trực quan
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4">
          {bills.map((item, bIdx) => {
            const style = getBanknoteStyle(item.denomination);
            const count = Math.min(item.count || 1, 10);
            return (
              <div key={bIdx} className="flex flex-col items-center">
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {Array.from({ length: count }).map((_, cIdx) => (
                    <div
                      key={cIdx}
                      className={`relative w-40 h-22 sm:w-44 sm:h-24 rounded-xl border-2 ${style.border} ${style.bg} p-2 shadow-md flex flex-col justify-between transition-transform hover:scale-105`}
                    >
                      <div className="text-[7.5px] font-black tracking-tighter text-slate-700 text-center uppercase leading-tight truncate">
                        CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                      </div>
                      <div className="flex items-center justify-between px-1">
                        <div className="w-6 h-6 rounded-full border border-amber-600/40 bg-amber-400/20 flex items-center justify-center text-[9px] font-black text-amber-700">
                          ★
                        </div>
                        <div className={`text-base sm:text-lg font-black tracking-tight ${style.text}`}>
                          {item.denomination.toLocaleString('vi-VN')}
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-[8px] font-black text-slate-600 px-1">
                        <span>NGÂN HÀNG NHÀ NƯỚC</span>
                        <span className="uppercase text-emerald-700 font-extrabold">ĐỒNG</span>
                      </div>
                    </div>
                  ))}
                </div>
                <span className="text-[11px] font-bold text-slate-600 mt-1.5">
                  {count > 1 ? `${count} tờ ` : ''}{style.name} ({style.label})
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // 10. Analog Clock (Mặt đồng hồ SVG chuẩn từ bộ tài nguyên)
  if (config.type === 'clock' || config.hours !== undefined) {
    if (config.hours === undefined) {
      if (isTeacherView) {
        return (
          <div className="my-3 p-3.5 rounded-2xl bg-amber-50 border-2 border-dashed border-amber-300 text-amber-900 text-xs font-semibold flex items-center gap-2">
            <span>💡</span>
            <span><strong>Cần bổ sung thời gian đồng hồ:</strong> Thầy/Cô vui lòng thiết lập giờ và phút cụ thể trong phần biên tập.</span>
          </div>
        );
      }
      return null;
    }
    const hours = config.hours % 12;
    const minutes = config.minutes ?? 0;
    const hourAngle = (hours + minutes / 60) * 30;
    const minuteAngle = minutes * 6;

    return (
      <div className="my-5 p-5 bg-gradient-to-b from-sky-50 to-indigo-50/60 rounded-3xl border-2 border-sky-200 max-w-sm mx-auto shadow-xs flex flex-col items-center">
        <div className="text-xs uppercase tracking-wider font-extrabold text-sky-800 mb-3 text-center">
          ⏰ Quan sát đồng hồ kim
        </div>
        <div className="relative w-48 h-48 sm:w-52 sm:h-52 rounded-full bg-white border-4 border-sky-500 shadow-lg flex items-center justify-center overflow-hidden">
          <img
            src="/assets/toan-nhi/math-clock-face-blank.svg"
            alt="Mặt đồng hồ"
            className="absolute inset-0 w-full h-full object-contain p-2 select-none"
            loading="lazy"
          />

          {/* Hour Numbers Overlay for crisp legibility */}
          {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((num, i) => {
            const angle = (i * 30 - 90) * (Math.PI / 180);
            const radius = 72;
            const x = Math.round(Math.cos(angle) * radius);
            const y = Math.round(Math.sin(angle) * radius);
            return (
              <div
                key={num}
                className="absolute text-xs sm:text-sm font-black text-slate-800 select-none z-5"
                style={{ transform: `translate(${x}px, ${y}px)` }}
              >
                {num}
              </div>
            );
          })}

          {/* Hour Hand */}
          <div
            className="absolute w-2 h-14 bg-slate-900 rounded-full origin-bottom shadow z-10"
            style={{
              bottom: '50%',
              left: 'calc(50% - 4px)',
              transform: `rotate(${hourAngle}deg)`,
              transformOrigin: 'bottom center',
            }}
          />

          {/* Minute Hand */}
          <div
            className="absolute w-1.5 h-18 bg-rose-600 rounded-full origin-bottom shadow z-10"
            style={{
              bottom: '50%',
              left: 'calc(50% - 3px)',
              transform: `rotate(${minuteAngle}deg)`,
              transformOrigin: 'bottom center',
            }}
          />

          {/* Center Pin */}
          <div className="absolute w-4 h-4 rounded-full bg-slate-950 border-2 border-white shadow-md z-20" />
        </div>

        {config.showDigital && (
          <div className="mt-3 px-3 py-1 bg-white rounded-xl border border-sky-300 font-mono text-sm font-black text-sky-900 shadow-xs">
            {hours === 0 ? 12 : hours}:{minutes < 10 ? `0${minutes}` : minutes}
          </div>
        )}
      </div>
    );
  }

  // Fallback for unconfigured models in teacher view
  if (isTeacherView) {
    return (
      <div className="my-3 p-3.5 rounded-2xl bg-amber-50 border-2 border-dashed border-amber-300 text-amber-900 text-xs font-semibold flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="text-lg">💡</span>
          <div>
            <div className="font-black text-amber-800">Cần bổ sung hình minh họa</div>
            <div className="text-[11px] text-amber-700 font-medium">
              Chưa có mô hình trực quan tự động phù hợp cho câu hỏi này. Thầy/Cô vui lòng chọn Kiểu mô hình hoặc Ảnh từ Thư viện.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
