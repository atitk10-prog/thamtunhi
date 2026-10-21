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
      case 'block':
      default:
        return (
          <div key={`${keyPrefix}-${index}`} className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 border-2 border-amber-600 flex items-center justify-center font-bold text-white shadow-md">
            {index + 1}
          </div>
        );
    }
  };

  if (config.type === 'word_story' && config.storyText) {
    return (
      <div className="my-4 p-4 rounded-2xl bg-amber-50 border-2 border-amber-200 text-amber-900 font-semibold text-lg flex items-center gap-3">
        <span className="text-2xl">📖</span>
        <span>{config.storyText}</span>
      </div>
    );
  }

  // Dual-Group Comparison (e.g. 4 ngôi sao vs 2 ngôi sao)
  const isComparison = config.type === 'comparison' || (config.leftCount !== undefined && config.rightCount !== undefined);
  if (isComparison) {
    const left = config.leftCount ?? config.count ?? 0;
    const right = config.rightCount ?? 0;

    return (
      <div className="my-5 p-5 bg-sky-50/80 rounded-3xl border-2 border-sky-200 w-full max-w-xl">
        <div className="text-xs uppercase tracking-wider font-extrabold text-sky-700 mb-3 text-center">
          Quan sát và so sánh hai nhóm vật thể
        </div>
        <div className="flex items-center justify-center gap-4 sm:gap-8">
          {/* Left Group */}
          <div className="flex-1 p-3 sm:p-4 bg-white rounded-2xl border-2 border-sky-300 shadow-xs flex flex-col items-center">
            <div className="text-xs font-black text-sky-800 mb-2 uppercase tracking-wide">
              {config.leftLabel ? config.leftLabel.replace(/\d+\s*(ngôi sao|vật thể|quả|bông|chú)?/gi, '').trim() || config.leftLabel : 'Nhóm A'}
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
              {config.rightLabel ? config.rightLabel.replace(/\d+\s*(ngôi sao|vật thể|quả|bông|chú)?/gi, '').trim() || config.rightLabel : 'Nhóm B'}
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 min-h-[50px]">
              {Array.from({ length: right }).map((_, i) => renderIcon(i, 'right'))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Single Counter Group
  if (config.type === 'counters' && config.count) {
    return (
      <div className="my-5 p-5 bg-sky-50/80 rounded-2xl border-2 border-sky-100">
        <div className="text-xs uppercase tracking-wider font-extrabold text-sky-600 mb-3 text-center">
          Quan sát mô hình đếm
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {Array.from({ length: config.count }).map((_, i) => renderIcon(i))}
        </div>
      </div>
    );
  }

  return null;
};
