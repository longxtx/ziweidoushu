import { BRANCH_GRID } from '@/constants';
import type { Chart, FlowYearInfo } from '@/engine';
import { PalaceCell } from './PalaceCell';
import { Seal } from './Seal';

interface Props {
  chart: Chart;
  currentDaXianIndex: number;
  selected: number | null;
  onSelect: (index: number) => void;
  /** 流年视图（null / undefined 表示关闭流年模式） */
  flow?: FlowYearInfo | null;
  /** 联动高亮宫位（本宫＋三方四正），null 表示无 */
  linked?: number[] | null;
}

/**
 * 十二宫格（PRD 6.5 / 7.2）
 *
 * 传统 4×4 布局，中央 2×2 为中宫。命盘为正方形，最大宽度锁定 640px。
 */
export function PalaceGrid({ chart, currentDaXianIndex, selected, onSelect, flow, linked }: Props) {
  // 桌面端键盘导航：方向键在宫位间移动（PRD 7.6）
  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const deltas: Record<string, number> = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -4,
      ArrowDown: 4,
    };
    const delta = deltas[e.key];
    if (delta === undefined) return;
    e.preventDefault();
    const current = selected ?? chart.soulPalaceIndex;
    onSelect((current + delta + 12) % 12);
  }

  return (
    <div
      data-guide="palace-grid"
      onKeyDown={handleKeyDown}
      className="mx-auto grid w-full gap-[6px]"
      style={{
        gridTemplateColumns: 'repeat(4, 1fr)',
        gridTemplateRows: 'repeat(4, 1fr)',
        maxWidth: 640,
        aspectRatio: '1 / 1',
      }}
    >
      {chart.palaces.map((p) => {
        const pos = BRANCH_GRID[p.earthlyBranch];
        return (
          <div
            key={p.index}
            style={{
              gridRow: pos.row,
              gridColumn: pos.col,
              // 逐个淡入（stagger 30ms，总时长 ≤ 500ms，PRD 6.8）
              animationDelay: `${p.index * 30}ms`,
            }}
            className="anim-palace-in min-w-0 min-h-0"
          >
            <PalaceCell
              palace={p}
              currentDaXianIndex={currentDaXianIndex}
              isSoulPalace={p.index === chart.soulPalaceIndex}
              selected={selected === p.index}
              linked={linked != null && linked.includes(p.index)}
              onSelect={onSelect}
              flowNote={
                flow
                  ? {
                      isSoul: p.index === flow.soulIndex,
                      hua: flow.mutagenByPalace.get(p.index) ?? [],
                    }
                  : undefined
              }
            />
          </div>
        );
      })}

      {/* 中宫：命主、身主、五行局、四柱 */}
      <div
        style={{ gridRow: '2 / 4', gridColumn: '2 / 4', background: 'var(--grad-center)' }}
        className="flex flex-col items-center justify-center gap-1 rounded p-2 text-center"
      >
        <Seal size={40} />
        <div className="text-kai text-[0.75rem] leading-tight" style={{ color: 'var(--ink)' }}>
          命主 {chart.soul}　身主 {chart.body}
        </div>
        <div className="text-[0.75rem] leading-tight" style={{ color: 'var(--gold)' }}>
          {chart.fiveElementsClass}
        </div>
        <div
          className="text-[0.625rem] leading-snug"
          style={{ color: 'var(--ink-light)' }}
          title={chart.chineseDate}
        >
          {chart.chineseDate}
        </div>
      </div>
    </div>
  );
}
