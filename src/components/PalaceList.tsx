import { MUTAGEN_COLORS } from '@/constants';
import type { Chart, FlowYearInfo } from '@/engine';

/**
 * 十二宫列表视图（PRD F2：移动端可切换为列表模式，按宫位顺序纵向排列，便于阅读）。
 * 宫格信息密集时提供逐宫纵向阅读的替代形态。
 */
interface Props {
  chart: Chart;
  selected: number | null;
  onSelect: (index: number) => void;
  flow?: FlowYearInfo | null;
}

export function PalaceList({ chart, selected, onSelect, flow }: Props) {
  return (
    <ul className="flex flex-col gap-2">
      {chart.palaces.map((p) => {
        const isFlowSoul = flow?.soulIndex === p.index;
        const hua = flow?.mutagenByPalace.get(p.index) ?? [];
        const isSoul = p.index === chart.soulPalaceIndex;

        let borderColor = 'var(--border)';
        let background = 'var(--bg-card)';
        if (selected === p.index) {
          borderColor = 'var(--cinnabar)';
          background = 'var(--cinnabar-soft)';
        } else if (isFlowSoul) {
          borderColor = 'var(--gold)';
          background = 'var(--gold-soft)';
        }

        return (
          <li key={p.index}>
            <button
              type="button"
              onClick={() => onSelect(p.index)}
              className="w-full rounded p-3 text-left"
              style={{ background, border: `1.5px solid ${borderColor}` }}
              aria-label={`${p.name}　${
                p.majorStars.length ? p.majorStars.map((s) => s.name).join('、') : '空宫'
              }`}
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-kai text-[0.9375rem]" style={{ color: isSoul ? 'var(--cinnabar)' : 'var(--ink)' }}>
                  {p.name}
                  {p.isBodyPalace && (
                    <span className="ml-1 text-[0.6875rem]" style={{ color: 'var(--gold)' }}>
                      身
                    </span>
                  )}
                </span>
                <span className="text-[0.6875rem]" style={{ color: 'var(--ink-light)' }}>
                  {p.heavenlyStem}
                  {p.earthlyBranch} · 大限 {p.daXian.range[0]}–{p.daXian.range[1]}
                </span>
              </div>

              <div className="mt-1 text-[0.875rem]" style={{ color: 'var(--ink)' }}>
                {p.majorStars.length > 0
                  ? p.majorStars.map((s) => s.name + (s.mutagen ? `·化${s.mutagen}` : '')).join('、')
                  : '空宫'}
              </div>

              {p.minorStars.length > 0 && (
                <div className="mt-1 text-[0.6875rem]" style={{ color: 'var(--ink-light)' }}>
                  {p.minorStars.map((s) => s.name).join('　')}
                </div>
              )}

              {hua.length > 0 && (
                <div className="mt-1 flex gap-2 text-[0.6875rem]">
                  {hua.map((h) => (
                    <span key={h.star} style={{ color: MUTAGEN_COLORS[h.kind] }}>
                      流{h.kind}（{h.star}）
                    </span>
                  ))}
                </div>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
