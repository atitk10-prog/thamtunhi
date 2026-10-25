import React, { useState } from 'react';
import { RotateCcw, Check, Sparkles } from 'lucide-react';
import { Question } from '../../types';
import { VisualCounters } from './VisualCounters';

interface ExpressionMatchQuestionProps {
  question: Question;
  matchedPairs: Record<string, string>; // left -> right
  onPairsChange: (pairs: Record<string, string>) => void;
  disabled?: boolean;
}

// Standard asset map for counting sprites
const ITEM_ASSET_MAP: Record<string, { url: string; fallbackEmoji: string; defaultLabel: string }> = {
  orange: { url: '/assets/images/standard/food_orange.png', fallbackEmoji: '🍊', defaultLabel: 'Quả cam' },
  flower: { url: '/assets/images/standard/nature_flower.png', fallbackEmoji: '🌸', defaultLabel: 'Bông hoa' },
  rabbit: { url: '/assets/images/standard/animals_rabbit.png', fallbackEmoji: '🐰', defaultLabel: 'Chú thỏ' },
  pencil: { url: '/assets/images/standard/school_pencil.png', fallbackEmoji: '✏️', defaultLabel: 'Bút chì' },
  apple: { url: '/assets/images/standard/food_apple.png', fallbackEmoji: '🍎', defaultLabel: 'Quả táo' },
  carrot: { url: '/assets/images/standard/food_carrot.png', fallbackEmoji: '🥕', defaultLabel: 'Củ cà rốt' },
  counting_sticks: { url: '/assets/images/standard/counting_sticks_single.png', fallbackEmoji: '🥢', defaultLabel: 'Que tính' },
};

/**
 * Helper to parse a left card into visual elements and a clean label
 * Crucially: Strips any answer numbers from the student-facing label
 */
function parseLeftCard(rawText: string, pairObj?: any) {
  // If rich metadata is already present
  if (pairObj?.count && (pairObj?.icon || pairObj?.image)) {
    return {
      isVisualQuantity: true,
      count: pairObj.count,
      itemKey: pairObj.icon || 'apple',
      cleanLabel: pairObj.label || 'Đồ vật',
    };
  }

  const text = (rawText || '').trim();

  // Pattern 1: Leading emojis, e.g. "🍊 🍊 (Quả cam)" or "🌸 🌸 🌸 🌸 🌸 (Bông hoa)"
  const emojiMatch = text.match(/^([🍊🌸🐰✏️🍎🥕🥢\s]+)(?:\(([^)]+)\)|(.*))?$/u);
  if (emojiMatch) {
    const emojis = emojiMatch[1].replace(/\s+/g, '');
    let itemKey = 'orange';
    if (emojis.includes('🌸')) itemKey = 'flower';
    else if (emojis.includes('🐰')) itemKey = 'rabbit';
    else if (emojis.includes('✏️')) itemKey = 'pencil';
    else if (emojis.includes('🍎')) itemKey = 'apple';
    else if (emojis.includes('🥕')) itemKey = 'carrot';
    else if (emojis.includes('🥢')) itemKey = 'counting_sticks';

    const count = Array.from(emojis).length;
    let cleanLabel = (emojiMatch[2] || emojiMatch[3] || '').trim();
    if (!cleanLabel) {
      cleanLabel = ITEM_ASSET_MAP[itemKey]?.defaultLabel || 'Đồ vật';
    }
    // Strip any leaked numbers from cleanLabel
    cleanLabel = cleanLabel.replace(/^\d+\s*/, '').replace(/\s*\(\d+\)/, '').trim();

    return {
      isVisualQuantity: true,
      count: Math.max(1, count),
      itemKey,
      cleanLabel,
    };
  }

  // Pattern 2: Vietnamese counting phrases: "2 quả cam", "5 bông hoa", "1 chú thỏ", "2 cây bút chì"
  const qtyRegex = /^(\d+)\s*(quả\s*cam|bông\s*hoa|hoa|chú\s*thỏ|con\s*thỏ|thỏ|cây\s*bút\s*chì|bút\s*chì|quả\s*táo|củ\s*cà\s*rốt|que\s*tính)/i;
  const match = text.match(qtyRegex);
  if (match) {
    const count = parseInt(match[1], 10);
    const noun = match[2].toLowerCase();
    let itemKey = 'orange';
    let cleanLabel = 'Quả cam';

    if (noun.includes('hoa')) {
      itemKey = 'flower';
      cleanLabel = 'Bông hoa';
    } else if (noun.includes('thỏ')) {
      itemKey = 'rabbit';
      cleanLabel = 'Chú thỏ';
    } else if (noun.includes('bút')) {
      itemKey = 'pencil';
      cleanLabel = 'Cây bút chì';
    } else if (noun.includes('táo')) {
      itemKey = 'apple';
      cleanLabel = 'Quả táo';
    } else if (noun.includes('cà rốt')) {
      itemKey = 'carrot';
      cleanLabel = 'Củ cà rốt';
    } else if (noun.includes('que')) {
      itemKey = 'counting_sticks';
      cleanLabel = 'Que tính';
    }

    return {
      isVisualQuantity: true,
      count,
      itemKey,
      cleanLabel,
    };
  }

  // Default: Text expression (e.g. "6 + 2", "Gộp 5 và 5", "Bảng lớp", "11")
  return {
    isVisualQuantity: false,
    count: 0,
    itemKey: '',
    cleanLabel: text,
  };
}

export const ExpressionMatchQuestion: React.FC<ExpressionMatchQuestionProps> = ({
  question,
  matchedPairs,
  onPairsChange,
  disabled = false,
}) => {
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);

  const rawPairs = question.pairs || [
    { left: 'Phần 1', right: 'Khớp 1' },
    { left: 'Phần 2', right: 'Khớp 2' },
  ];

  const leftItems = React.useMemo(() => rawPairs.map((p) => p.left), [rawPairs]);

  // Deterministically scramble right cards so they NEVER align 1-to-1 horizontally
  const rightItems = React.useMemo(() => {
    const list = rawPairs.map((p) => p.right);
    if (list.length <= 1) return list;
    if (list.length === 2) return [list[1], list[0]];
    if (list.length === 3) return [list[1], list[2], list[0]];
    return [...list.slice(1), list[0]];
  }, [rawPairs]);

  const handleSelectLeft = (left: string) => {
    if (disabled) return;
    setSelectedLeft(selectedLeft === left ? null : left);
  };

  const handleSelectRight = (right: string) => {
    if (disabled || !selectedLeft) return;

    // Strict 1-to-1 matching:
    // Remove any existing left mapped to this right
    const newPairs = { ...matchedPairs };
    Object.keys(newPairs).forEach((k) => {
      if (newPairs[k] === right) delete newPairs[k];
    });

    newPairs[selectedLeft] = right;
    onPairsChange(newPairs);
    setSelectedLeft(null);
  };

  const handleReset = () => {
    if (disabled) return;
    onPairsChange({});
    setSelectedLeft(null);
  };

  const matchedCount = Object.keys(matchedPairs).length;
  const isComplete = leftItems.length > 0 && leftItems.every((left) => Boolean(matchedPairs[left]));

  // Render individual item sprite (PNG with smooth fallback)
  const renderItemSprite = (itemKey: string, idx: number) => {
    const asset = ITEM_ASSET_MAP[itemKey];
    if (!asset) return null;

    return (
      <div
        key={idx}
        className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center p-0.5 transition-transform hover:scale-110 drop-shadow-xs"
      >
        <img
          src={asset.url}
          alt={asset.defaultLabel}
          className="w-full h-full object-contain filter drop-shadow-xs select-none"
          loading="lazy"
          onError={(e) => {
            const target = e.currentTarget;
            target.style.display = 'none';
            const fallback = target.nextElementSibling as HTMLElement;
            if (fallback) fallback.style.display = 'flex';
          }}
        />
        <span className="hidden text-2xl select-none leading-none">{asset.fallbackEmoji}</span>
      </div>
    );
  };

  return (
    <div className="w-full flex flex-col items-center">
      {question.visualConfig && question.visualConfig.type !== 'none' && (
        <VisualCounters config={question.visualConfig} questionPrompt={question.prompt} />
      )}

      {/* Guide Banner */}
      <div className="w-full max-w-xl bg-sky-50 border-2 border-sky-200 rounded-2xl p-3 sm:p-4 mb-4 flex items-center justify-between gap-2 shadow-xs">
        <div className="flex items-center gap-2 text-xs sm:text-sm font-extrabold text-sky-900">
          <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
          <span>
            {selectedLeft
              ? '👉 Bước 2: Chạm chọn số tương ứng ở Cột Phải để nối'
              : '👉 Bước 1: Chạm chọn hình ở Cột Trái &rarr; Chọn số ở Cột Phải'}
          </span>
        </div>
        <span className="text-xs font-black text-sky-700 bg-white px-2.5 py-1 rounded-xl border border-sky-200 shrink-0">
          Đã nối: {matchedCount}/{leftItems.length}
        </span>
      </div>

      {/* Two Column Grid */}
      <div className="w-full max-w-xl grid grid-cols-2 gap-4 sm:gap-6 my-2">
        {/* Left Column */}
        <div className="flex flex-col gap-3">
          <div className="text-xs font-black uppercase tracking-wider text-slate-500 text-center py-1 bg-slate-100 rounded-xl">
            Cột Trái (Hình ảnh / Đồ vật)
          </div>

          {leftItems.map((left, idx) => {
            const pairMeta = rawPairs.find((p) => p.left === left);
            const parsed = parseLeftCard(left, pairMeta);
            const isSelected = selectedLeft === left;
            const isPaired = Boolean(matchedPairs[left]);

            return (
              <button
                key={idx}
                type="button"
                disabled={disabled}
                onClick={() => handleSelectLeft(left)}
                className={`min-h-[76px] p-3 sm:p-4 rounded-2xl border-3 text-left transition-all active:scale-95 shadow-sm cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-amber-100/90 border-amber-500 ring-4 ring-amber-200 scale-102 shadow-md'
                    : isPaired
                    ? 'bg-emerald-50/80 border-emerald-400 text-slate-800'
                    : 'bg-white border-slate-200 hover:border-sky-400 hover:bg-sky-50/70 text-slate-800'
                }`}
              >
                {/* Visual Content: Renders exact count of objects without revealing numbers */}
                {parsed.isVisualQuantity ? (
                  <div className="w-full flex flex-col items-center gap-1.5 py-1">
                    <div className="flex flex-wrap items-center justify-center gap-2 w-full min-h-[48px]">
                      {Array.from({ length: parsed.count }).map((_, i) =>
                        renderItemSprite(parsed.itemKey, i)
                      )}
                    </div>
                    {/* Clean descriptive label - NO NUMBER in label */}
                    <span className="text-xs sm:text-sm font-extrabold text-slate-700 text-center">
                      {parsed.cleanLabel}
                    </span>
                  </div>
                ) : (
                  <div className="w-full py-2">
                    <span className="text-base sm:text-lg font-black text-slate-800 leading-snug">
                      {parsed.cleanLabel}
                    </span>
                  </div>
                )}

                {/* Connection Status Badge (NEVER reveals answer or "-> Số X") */}
                <div className="pt-2 border-t border-slate-100/80 flex items-center justify-between w-full mt-1">
                  <span className="text-[11px] font-bold text-slate-400">Thẻ #{idx + 1}</span>
                  {isPaired ? (
                    <span className="text-[11px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                      <Check className="w-3 h-3" /> Đã nối
                    </span>
                  ) : isSelected ? (
                    <span className="text-[11px] font-black text-amber-800 bg-amber-200 px-2 py-0.5 rounded-full animate-pulse">
                      Đang chọn...
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-slate-400">Chạm để chọn</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-3">
          <div className="text-xs font-black uppercase tracking-wider text-slate-500 text-center py-1 bg-slate-100 rounded-xl">
            Cột Phải (Đáp án / Số)
          </div>

          {rightItems.map((right, idx) => {
            const isPaired = Object.values(matchedPairs).includes(right);

            return (
              <button
                key={idx}
                type="button"
                disabled={disabled || !selectedLeft}
                onClick={() => handleSelectRight(right)}
                className={`min-h-[76px] p-3 sm:p-4 rounded-2xl border-3 text-base sm:text-lg font-black text-center transition-all shadow-sm flex flex-col justify-between items-center ${
                  selectedLeft
                    ? 'bg-white border-sky-400 hover:border-sky-600 hover:bg-sky-100 cursor-pointer active:scale-95 ring-3 ring-sky-200 animate-pulse text-sky-900'
                    : isPaired
                    ? 'bg-emerald-50/80 border-emerald-400 text-emerald-950 cursor-default'
                    : 'bg-slate-50 border-slate-200 text-slate-600 cursor-default opacity-85'
                }`}
              >
                <div className="flex-1 flex items-center justify-center w-full py-2">
                  <span className="text-xl sm:text-2xl font-black text-slate-800 tracking-wide">
                    {right}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-100/80 flex items-center justify-center w-full">
                  {isPaired ? (
                    <span className="text-[11px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                      <Check className="w-3 h-3" /> Đã nối
                    </span>
                  ) : selectedLeft ? (
                    <span className="text-[11px] font-black text-sky-700 bg-sky-100 px-2 py-0.5 rounded-full">
                      Chạm để nối
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-slate-400">Chọn thẻ trái trước</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Action Footer: Nối lại & Hướng dẫn kiểm tra */}
      <div className="w-full max-w-xl flex flex-wrap items-center justify-between gap-3 mt-5 pt-3 border-t border-slate-200">
        <button
          type="button"
          disabled={disabled || matchedCount === 0}
          onClick={handleReset}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-all ${
            matchedCount > 0 && !disabled
              ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer shadow-xs active:scale-95'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-60'
          }`}
        >
          <RotateCcw className="w-4 h-4" /> Nối lại
        </button>

        {isComplete ? (
          <div className="text-xs sm:text-sm font-extrabold text-emerald-800 bg-emerald-50 px-3.5 py-2 rounded-xl border border-emerald-300 flex items-center gap-1.5 shadow-xs">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Đã nối đủ các cặp! Em hãy nhấn nút <strong>Trả lời</strong> ở dưới để kiểm tra.</span>
          </div>
        ) : (
          <span className="text-xs font-semibold text-slate-500 italic">
            Hãy nối đủ {leftItems.length} cặp để hoàn thành câu hỏi.
          </span>
        )}
      </div>
    </div>
  );
};
