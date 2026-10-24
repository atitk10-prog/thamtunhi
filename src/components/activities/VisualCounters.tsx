import React from 'react';
import { VisualAssetConfig } from '../../types';

interface VisualCountersProps {
  config?: VisualAssetConfig;
}

export const VisualCounters: React.FC<VisualCountersProps> = ({ config }) => {
  if (!config) return null;

  const icon = config.iconName || 'apple';
  const renderIcon = (index: number, keyPrefix = 'icon') => {
    switch (icon) {
      case 'apple':
        return (
          <div key={`${keyPrefix}-${index}`} className="w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center text-3xl transition-transform hover:scale-125 drop-shadow">
            🍎
          </div>
        );
      case 'fish':
        return (
          <div key={`${keyPrefix}-${index}`} className="w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center text-3xl transition-transform hover:scale-125 drop-shadow">
            🐟
          </div>
        );
      case 'star':
        return (
          <div key={`${keyPrefix}-${index}`} className="w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center text-3xl transition-transform hover:scale-125 drop-shadow">
            ⭐
          </div>
        );
      case 'candy':
        return (
          <div key={`${keyPrefix}-${index}`} className="w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center text-3xl transition-transform hover:scale-125 drop-shadow">
            🍬
          </div>
        );
      case 'pencil':
        return (
          <div key={`${keyPrefix}-${index}`} className="w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center text-3xl transition-transform hover:scale-125 drop-shadow">
            ✏️
          </div>
        );
      case 'carrot':
        return (
          <div key={`${keyPrefix}-${index}`} className="w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center text-3xl transition-transform hover:scale-125 drop-shadow">
            🥕
          </div>
        );
      case 'flower':
        return (
          <div key={`${keyPrefix}-${index}`} className="w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center text-3xl transition-transform hover:scale-125 drop-shadow">
            🌸
          </div>
        );
      case 'bird':
        return (
          <div key={`${keyPrefix}-${index}`} className="w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center text-3xl transition-transform hover:scale-125 drop-shadow">
            🐦
          </div>
        );
      case 'rabbit':
      case 'bunny':
        return (
          <div key={`${keyPrefix}-${index}`} className="w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center text-3xl transition-transform hover:scale-125 drop-shadow">
            🐰
          </div>
        );
      case 'orange':
        return (
          <div key={`${keyPrefix}-${index}`} className="w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center text-3xl transition-transform hover:scale-125 drop-shadow">
            🍊
          </div>
        );
      case 'banana':
        return (
          <div key={`${keyPrefix}-${index}`} className="w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center text-3xl transition-transform hover:scale-125 drop-shadow">
            🍌
          </div>
        );
      case 'ball':
        return (
          <div key={`${keyPrefix}-${index}`} className="w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center text-3xl transition-transform hover:scale-125 drop-shadow">
            ⚽
          </div>
        );
      case 'book':
        return (
          <div key={`${keyPrefix}-${index}`} className="w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center text-3xl transition-transform hover:scale-125 drop-shadow">
            📚
          </div>
        );
      case 'hat':
        return (
          <div key={`${keyPrefix}-${index}`} className="w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center text-3xl transition-transform hover:scale-125 drop-shadow">
            🧢
          </div>
        );
      case 'car':
        return (
          <div key={`${keyPrefix}-${index}`} className="w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center text-3xl transition-transform hover:scale-125 drop-shadow">
            🚗
          </div>
        );
      case 'duck':
        return (
          <div key={`${keyPrefix}-${index}`} className="w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center text-3xl transition-transform hover:scale-125 drop-shadow">
            🦆
          </div>
        );
      case 'block':
      default:
        return (
          <div key={`${keyPrefix}-${index}`} className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 border-2 border-amber-600 flex items-center justify-center font-bold text-white shadow-md">
            {index + 1}
          </div>
        );
    }
  };

  // 1. Uploaded / Library Image Illustration (P0)
  if (config.type === 'image' || config.imageUrl) {
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
              src={config.imageUrl}
              alt={config.imageAlt || 'Hình minh họa câu hỏi'}
              className={`w-full h-full max-h-[360px] rounded-xl ${fitClass} transition-transform hover:scale-[1.02]`}
              loading="lazy"
            />
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

  // 3. Five-Frame & Ten-Frame Grid Models
  const isFrame = config.type === 'ten_frame' || config.type === 'five_frame';
  if (isFrame) {
    const isFive = config.type === 'five_frame' || config.gridSize === 5;
    const gridCellCount = isFive ? 5 : 10;
    const count = Math.min(config.count ?? 0, gridCellCount);

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
        <div className="text-xs font-black uppercase tracking-wider text-sky-700 text-center mb-3">
          {isFive ? 'Khung 5 Ô Trực Quan' : 'Khung 10 Ô (Ten-Frame) Trực Quan'}
        </div>
        <div
          className={`mx-auto grid gap-2 p-3 bg-white rounded-2xl border-3 border-sky-300 shadow-inner ${
            isFive ? 'max-w-[280px] grid-cols-5' : 'max-w-[280px] grid-cols-5'
          }`}
        >
          {Array.from({ length: gridCellCount }).map((_, i) => {
            const isFilled = i < count;
            return (
              <div
                key={i}
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
    );
  }

  // 4. Bundles of Tens & Singles
  if (config.type === 'bundles' || (config.tens !== undefined && config.ones !== undefined)) {
    const tens = config.tens || 0;
    const ones = config.ones || 0;

    return (
      <div className="my-4 p-5 bg-gradient-to-b from-sky-50 to-indigo-50/50 rounded-3xl border-3 border-sky-200 shadow-sm max-w-lg mx-auto">
        <div className="text-xs font-black uppercase tracking-wider text-sky-700 text-center mb-3">
          Mô hình Bó Que tính &amp; Que Lẻ
        </div>
        <div className="flex flex-wrap items-center justify-center gap-6 p-4 bg-white/80 rounded-2xl border-2 border-sky-100">
          {/* Tens */}
          <div className="flex flex-wrap items-center gap-3">
            {Array.from({ length: tens }).map((_, i) => (
              <div
                key={`ten-${i}`}
                className="flex flex-col items-center p-2 rounded-xl bg-amber-50 border-2 border-amber-300 shadow-sm"
              >
                <div className="w-10 h-16 rounded-lg bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 border-2 border-amber-600 flex items-center justify-center text-xs font-black text-amber-950 shadow">
                  10
                </div>
                <span className="text-[11px] font-bold text-amber-800 mt-1">1 bó chục</span>
              </div>
            ))}
          </div>

          {ones > 0 && tens > 0 && <span className="text-2xl font-black text-slate-400">+</span>}

          {/* Ones */}
          {ones > 0 && (
            <div className="flex flex-wrap items-center gap-2 max-w-[160px]">
              {Array.from({ length: ones }).map((_, i) => (
                <div
                  key={`one-${i}`}
                  className="w-2.5 h-14 rounded-full bg-gradient-to-b from-emerald-400 to-emerald-600 border border-emerald-700 shadow-sm"
                  title="Que tính rời"
                />
              ))}
              <div className="w-full text-center text-[11px] font-bold text-emerald-800">
                Que rời
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 5. Dual-Group Comparison
  const isComparison = config.type === 'comparison' || (config.leftCount !== undefined && config.rightCount !== undefined);
  if (isComparison) {
    const left = config.leftCount ?? config.count ?? 0;
    const right = config.rightCount ?? 0;

    return (
      <div className="my-5 p-5 bg-sky-50/80 rounded-3xl border-2 border-sky-200 w-full max-w-xl mx-auto">
        <div className="text-xs uppercase tracking-wider font-extrabold text-sky-700 mb-3 text-center">
          Quan sát và so sánh hai nhóm vật thể
        </div>
        <div className="flex items-center justify-center gap-4 sm:gap-8">
          {/* Left Group */}
          <div className="flex-1 p-3 sm:p-4 bg-white rounded-2xl border-2 border-sky-300 shadow-xs flex flex-col items-center">
            <div className="text-xs font-black text-sky-800 mb-2 uppercase tracking-wide">
              {(() => {
                const cleaned = (config.leftLabel || '').replace(/\d+/g, '').replace(/(ngôi sao|vật thể|quả|bông|chú)/gi, '').trim();
                return cleaned || 'Nhóm A';
              })()}
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 min-h-[50px]">
              {Array.from({ length: left }).map((_, i) => renderIcon(i, 'left'))}
            </div>
          </div>

          {/* Versus Placeholder */}
          <div className="w-10 h-10 rounded-full bg-amber-400 text-slate-900 font-black flex items-center justify-center shadow-md text-sm border-2 border-amber-500 flex-shrink-0">
            ?
          </div>

          {/* Right Group */}
          <div className="flex-1 p-3 sm:p-4 bg-white rounded-2xl border-2 border-sky-300 shadow-xs flex flex-col items-center">
            <div className="text-xs font-black text-sky-800 mb-2 uppercase tracking-wide">
              {(() => {
                const cleaned = (config.rightLabel || '').replace(/\d+/g, '').replace(/(ngôi sao|vật thể|quả|bông|chú)/gi, '').trim();
                return cleaned || 'Nhóm B';
              })()}
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 min-h-[50px]">
              {Array.from({ length: right }).map((_, i) => renderIcon(i, 'right'))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 6. Shapes (Geometry)
  if (config.type === 'shapes' && config.shapeType) {
    const shapeLabels: Record<string, { name: string; symbol: string }> = {
      circle: { name: 'Hình tròn', symbol: '⚪' },
      square: { name: 'Hình vuông', symbol: '🟦' },
      triangle: { name: 'Hình tam giác', symbol: '🔺' },
      rectangle: { name: 'Hình chữ nhật', symbol: '▬' },
      cylinder: { name: 'Khối trụ', symbol: '🛢️' },
      sphere: { name: 'Khối cầu', symbol: '🔮' },
    };
    const shape = shapeLabels[config.shapeType] || { name: 'Hình học', symbol: '🔷' };

    return (
      <div className="my-4 p-5 bg-gradient-to-b from-sky-50 to-indigo-50/50 rounded-2xl border-2 border-sky-200 text-center max-w-sm mx-auto">
        <div className="text-5xl mb-2">{shape.symbol}</div>
        <div className="text-xs font-black text-sky-800 uppercase tracking-wider">{shape.name}</div>
      </div>
    );
  }

  // 7. Single Counter Group
  if (config.type === 'counters' && config.count) {
    return (
      <div className="my-5 p-5 bg-sky-50/80 rounded-2xl border-2 border-sky-100 max-w-md mx-auto">
        <div className="text-xs uppercase tracking-wider font-extrabold text-sky-600 mb-3 text-center">
          Quan sát mô hình đếm
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {Array.from({ length: config.count }).map((_, i) => renderIcon(i))}
        </div>
      </div>
    );
  }

  // 8. Vietnamese Currency (Banknotes & Coins - GDPT 2018)
  if (config.type === 'money' || (config.moneyBills && config.moneyBills.length > 0)) {
    const bills = config.moneyBills || [{ denomination: 2000, count: 1 }];

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
                      {/* Banknote Header */}
                      <div className="text-[7.5px] font-black tracking-tighter text-slate-700 text-center uppercase leading-tight truncate">
                        CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                      </div>
                      {/* Center Denomination */}
                      <div className="flex items-center justify-between px-1">
                        <div className="w-6 h-6 rounded-full border border-amber-600/40 bg-amber-400/20 flex items-center justify-center text-[9px] font-black text-amber-700">
                          ★
                        </div>
                        <div className={`text-base sm:text-lg font-black tracking-tight ${style.text}`}>
                          {item.denomination.toLocaleString('vi-VN')}
                        </div>
                      </div>
                      {/* Banknote Footer */}
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

  // 9. Analog Clock (GDPT 2018 - Xem đồng hồ kim và thời gian)
  if (config.type === 'clock' || config.hours !== undefined) {
    const hours = (config.hours ?? 8) % 12;
    const minutes = config.minutes ?? 0;
    const hourAngle = (hours + minutes / 60) * 30;
    const minuteAngle = minutes * 6;

    return (
      <div className="my-5 p-5 bg-gradient-to-b from-sky-50 to-indigo-50/60 rounded-3xl border-2 border-sky-200 max-w-sm mx-auto shadow-xs flex flex-col items-center">
        <div className="text-xs uppercase tracking-wider font-extrabold text-sky-800 mb-3 text-center">
          ⏰ Quan sát đồng hồ kim
        </div>
        <div className="relative w-48 h-48 sm:w-52 sm:h-52 rounded-full bg-white border-4 border-sky-500 shadow-lg flex items-center justify-center">
          {/* Hour Numbers 1 to 12 */}
          {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((num, i) => {
            const angle = (i * 30 - 90) * (Math.PI / 180);
            const radius = 72; // px from center
            const x = Math.round(Math.cos(angle) * radius);
            const y = Math.round(Math.sin(angle) * radius);
            return (
              <div
                key={num}
                className="absolute text-xs sm:text-sm font-black text-slate-800 select-none"
                style={{ transform: `translate(${x}px, ${y}px)` }}
              >
                {num}
              </div>
            );
          })}

          {/* Hour Hand */}
          <div
            className="absolute w-2 h-14 bg-slate-900 rounded-full origin-bottom shadow"
            style={{
              bottom: '50%',
              transform: `rotate(${hourAngle}deg)`,
              transformOrigin: '50% 100%',
            }}
          />

          {/* Minute Hand */}
          <div
            className="absolute w-1.5 h-18 bg-rose-600 rounded-full origin-bottom shadow"
            style={{
              bottom: '50%',
              transform: `rotate(${minuteAngle}deg)`,
              transformOrigin: '50% 100%',
            }}
          />

          {/* Center Pin */}
          <div className="absolute w-4 h-4 rounded-full bg-amber-400 border-2 border-slate-900 z-10 shadow" />
        </div>

        {config.showDigital && (
          <div className="mt-3 px-3 py-1 rounded-xl bg-sky-100 border border-sky-300 text-xs font-black text-sky-900">
            {hours === 0 ? 12 : hours}:{minutes < 10 ? `0${minutes}` : minutes}
          </div>
        )}
      </div>
    );
  }

  return null;
};

