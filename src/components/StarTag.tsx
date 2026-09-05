import { brightnessState, stateToken } from '@/engine';
import type { Star } from '@/engine';
import { MUTAGEN_COLORS, MUTAGEN_MEANING, STAR_TYPE_TIP } from '@/constants';
import { TermTip } from './TermTip';

interface Props {
  star: Star;
  /** major 主星（大号楷体）/ minor 辅曜 / adj 杂曜 */
  size?: 'major' | 'minor' | 'adj';
  showBrightness?: boolean;
  /**
   * 启用点击式术语解释卡（PRD 7.5）。
   * 宫格内点击即开详情，故默认关闭、保留 title 悬浮。
   */
  interactive?: boolean;
}

/**
 * 星曜标签
 *
 * 颜色不作为唯一信息载体：四化同时带文字标识（PRD 6.7），
 * 去色截图下仍可区分。
 */
export function StarTag({ star, size = 'minor', showBrightness = false, interactive }: Props) {
  const state = brightnessState(star.brightness);
  const stateColor = state ? `var(--st-${stateToken(state)}-fg)` : undefined;

  const textClass =
    size === 'major' ? 'text-kai text-[1rem] leading-tight' : 'text-[0.75rem] leading-tight';
  const color = size === 'major' ? 'var(--ink)' : 'var(--ink-light)';

  // PRD 7.5：星曜 hover 显示分类说明，四化 hover 显示含义（中性术语，非命理结论）
  const tipParts = [STAR_TYPE_TIP[star.type], star.mutagen ? `化${star.mutagen}：${MUTAGEN_MEANING[star.mutagen]}` : ''].filter(
    Boolean,
  );
  const tip = `${star.name}（${star.type}）${tipParts.length ? '\n' + tipParts.join('\n') : ''}`;

  return (
    <span
      className={`inline-flex items-baseline gap-[2px] ${textClass}`}
      style={{ color }}
      title={interactive ? undefined : tip}
      aria-label={`${star.name}${star.mutagen ? `化${star.mutagen}` : ''}${
        star.brightness ? `　${star.brightness}` : ''
      }`}
    >
      {interactive ? (
        <TermTip term={`${star.name}（${star.type}）`} body={tipParts.join('\n')}>
          {star.name}
        </TermTip>
      ) : (
        <span>{star.name}</span>
      )}

      {star.mutagen && (
        <span
          className="text-[0.625rem] rounded-sm px-[2px] leading-none"
          style={{
            color: MUTAGEN_COLORS[star.mutagen],
            border: `1px solid ${MUTAGEN_COLORS[star.mutagen]}`,
          }}
        >
          {star.mutagen}
        </span>
      )}

      {showBrightness && star.brightness && (
        <span className="text-[0.625rem] leading-none" style={{ color: stateColor }}>
          {star.brightness}
        </span>
      )}
    </span>
  );
}
