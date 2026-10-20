import React from 'react';
import { VisualAssetConfig } from '../../types';

interface VisualCountersProps {
  config?: VisualAssetConfig;
}

export const VisualCounters: React.FC<VisualCountersProps> = ({ config }) => {
  if (!config) return null;

  if (config.type === 'word_story' && config.storyText) {
    return (
      <div className="my-4 p-4 rounded-2xl bg-amber-50 border-2 border-amber-200 text-amber-900 font-semibold text-lg flex items-center gap-3">
        <span className="text-2xl">📖</span>
        <span>{config.storyText}</span>
      </div>
    );
  }

  if (config.type === 'counters' && config.count) {
    const icon = config.iconName || 'apple';
    const renderIcon = (index: number) => {
      switch (icon) {
        case 'apple':
          return (
            <div key={index} className="w-12 h-12 flex items-center justify-center text-3xl transition-transform hover:scale-125 drop-shadow">
              🍎
            </div>
          );
        case 'fish':
          return (
            <div key={index} className="w-12 h-12 flex items-center justify-center text-3xl transition-transform hover:scale-125 drop-shadow">
              🐟
            </div>
          );
        case 'star':
          return (
            <div key={index} className="w-12 h-12 flex items-center justify-center text-3xl transition-transform hover:scale-125 drop-shadow">
              ⭐
            </div>
          );
        case 'block':
        default:
          return (
            <div key={index} className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 border-2 border-amber-600 flex items-center justify-center font-bold text-white shadow-md">
              {index + 1}
            </div>
          );
      }
    };

    return (
      <div className="my-5 p-5 bg-sky-50/80 rounded-2xl border-2 border-sky-100">
        <div className="text-xs uppercase tracking-wider font-extrabold text-sky-600 mb-3 text-center">
          Quan sát mô hình đếm ({config.count} vật thể)
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {Array.from({ length: config.count }).map((_, i) => renderIcon(i))}
        </div>
      </div>
    );
  }

  return null;
};
