import { memo, useState } from 'react';

import { majorStarLabel } from '@/engine';
import type { FlowMutagen, Palace } from '@/engine';
import { MUTAGEN_COLORS } from '@/constants';
import { StarTag } from './StarTag';

interface FlowCellNote {
  /** 是否为流年命宫 */
  isSoul: boolean;
  /** 该宫流年四化 */
  hua: FlowMutagen[];
}

interface Props {
  palace: Palace;
  /** 当前大限所在宫位索引，-1 表示无 */
  currentDaXianIndex: number;
  isSoulPalace: boolean;
  selected: boolean;
  /** 是否为三方四正联动宫 */
  linked: boolean;
  onSelect: (index: number) => void;
  /** 流年标注：仅流年模式开启时传入 */
  flowNote?: FlowCellNote | null;
}

/** 超过该数量后辅曜折叠为「+N」（PRD 6.5） */
const MINOR_LIMIT = 6;

function PalaceCellInner({
  palace,
  currentDaXianIndex,
  isSoulPalace,
  selected,
  linked,
  onSelect,
  flowNote,
}: Props) {
  const isCurrentDaXian = palace.index === currentDaXianIndex;
  const isFlowSoul = flowNote?.isSoul ?? false;
  const isEmpty = palace.majorStars.length === 0;
  const [showAllMinor, setShowAllMinor] = useState(false);

  let borderColor = 'var(--border)';
  let borderWidth = 1;
  let background = 'var(--bg-card)';
  // PRD 6.5：大限与流年可叠加，流年占外框时大限改用内框区分
  let daXianInner = false;
  if (selected) {
    borderColor = 'var(--cinnabar)';
    borderWidth = 2;
  } else if (flowNote && isFlowSoul) {
    borderColor = 'var(--gold)';
    borderWidth = 1.5;
    background = 'var(--gold-soft)';
    daXianInner = isCurrentDaXian;
  } else if (isCurrentDaXian) {
    borderColor = 'var(--cinnabar)';
    borderWidth = 1.5;
    background = 'var(--cinnabar-soft)';
  } else if (linked) {
    // 三方四正联动：金色细框
    borderColor = 'var(--gold)';
  }

  return (
    <button
      type="button"
      onClick={() => onSelect(palace.index)}
      data-guide={isSoulPalace ? 'soul' : undefined}
      className="no-select relative flex h-full w-full flex-col items-center justify-start overflow-hidden rounded p-1 text-center"
      style={{
        background,
        border: `${borderWidth}px solid ${borderColor}`,
        minHeight: 72,
        // 身宫：金色虚线内框（PRD 6.5）；大限内框：流年叠加时的内框层
        outline: palace.isBodyPalace ? '1px dashed var(--gold)' : undefined,
        outlineOffset: palace.isBodyPalace ? '-4px' : undefined,
        boxShadow: daXianInner ? 'inset 0 0 0 1.5px var(--cinnabar)' : undefined,
        // 大限 / 流年切换的边框过渡（PRD 6.8：≤300ms）
        transition: 'border-color 300ms ease, background-color 300ms ease',
      }}
      aria-label={`${palace.name}　${majorStarLabel(palace)}`}
    >
      {/* 左上：大限年龄区间　右上：宫位干支 */}
      <div className="flex w-full items-start justify-between text-[0.625rem] leading-none">
        <span style={{ color: 'var(--gold)' }}>
          {palace.daXian.range[0]}–{palace.daXian.range[1]}
        </span>
        <span style={{ color: 'var(--ink-light)' }}>
          {palace.heavenlyStem}
          {palace.earthlyBranch}
        </span>
      </div>

      {/* 宫位名：命宫用朱砂强调，是整个盘面的视觉锚点 */}
      <div
        className={`text-kai mt-[2px] text-[0.8125rem] font-semibold leading-none ${
          isSoulPalace ? '' : ''
        }`}
        style={{ color: isSoulPalace ? 'var(--cinnabar)' : 'var(--ink)' }}
      >
        {palace.name}
      </div>

      {/* 流年四化标注（悬停可见化曜星名） */}
      {flowNote && flowNote.hua.length > 0 && (
        <div className="mt-[2px] flex max-w-full flex-wrap items-center justify-center gap-x-1 leading-none">
          {flowNote.hua.map((h) => (
            <span
              key={h.star}
              className="rounded-sm px-[2px] text-[0.5625rem] leading-none"
              style={{
                color: MUTAGEN_COLORS[h.kind],
                border: `1px solid ${MUTAGEN_COLORS[h.kind]}`,
              }}
              title={`流年化${h.kind}：${h.star}`}
            >
              流{h.kind}
            </span>
          ))}
        </div>
      )}

      {/* 主星 */}
      <div className="mt-1 flex flex-col items-center gap-[1px]">
        {isEmpty ? (
          <span className="text-[0.75rem]" style={{ color: 'var(--ink-light)' }}>
            空宫
          </span>
        ) : (
          palace.majorStars.map((s) => (
            <StarTag key={s.name} star={s} size="major" showBrightness />
          ))
        )}
      </div>

      {/* 辅曜（超出折叠，+N 可点击展开） */}
      {palace.minorStars.length > 0 && (
        <div className="mt-1 flex flex-wrap items-center justify-center gap-x-1 gap-y-[1px]">
          {(showAllMinor ? palace.minorStars : palace.minorStars.slice(0, MINOR_LIMIT)).map((s) => (
            <StarTag key={s.name} star={s} size="minor" />
          ))}
          {palace.minorStars.length > MINOR_LIMIT && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                setShowAllMinor((v) => !v);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowAllMinor((v) => !v);
                }
              }}
              className="cursor-pointer text-[0.625rem] underline"
              style={{ color: 'var(--gold)' }}
              aria-label={
                showAllMinor
                  ? '收起辅曜'
                  : `展开其余 ${palace.minorStars.length - MINOR_LIMIT} 颗辅曜`
              }
            >
              {showAllMinor ? '收起' : `+${palace.minorStars.length - MINOR_LIMIT}`}
            </span>
          )}
        </div>
      )}

      {/* 身宫角标 */}
      {palace.isBodyPalace && (
        <span
          className="text-kai absolute bottom-[2px] right-[3px] text-[0.625rem] leading-none"
          style={{ color: 'var(--gold)' }}
        >
          身
        </span>
      )}

      {/* 长生十二神 */}
      <span
        className="absolute bottom-[2px] left-[3px] text-[0.625rem] leading-none"
        style={{ color: 'var(--ink-light)' }}
      >
        {palace.changsheng12}
      </span>
    </button>
  );
}

export const PalaceCell = memo(PalaceCellInner);
