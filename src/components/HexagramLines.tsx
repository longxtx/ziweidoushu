/**
 * 六爻图（PRD 6.4 / 6.8）：阳爻为实线，阴爻为两段短线。
 * 在斗数产品中**仅作装饰**——用于空状态、加载占位、章节分隔，不作为功能控件。
 */
interface Props {
  /** 宽度（px），移动端建议 112、常规 84 */
  size?: number;
  color?: string;
}

export function HexagramLines({ size = 84, color = 'var(--ink)' }: Props) {
  const barH = Math.max(4, Math.round(size / 10.5));
  const half = size * 0.42;

  return (
    <div className="flex flex-col items-center gap-[6px]" aria-hidden="true">
      {[true, false, true, true, false, true].map((yang, i) =>
        yang ? (
          <span
            key={i}
            className="block rounded-sm"
            style={{ width: size, height: barH, background: color }}
          />
        ) : (
          <span key={i} className="flex justify-between" style={{ width: size }}>
            <span className="block rounded-sm" style={{ width: half, height: barH, background: color }} />
            <span className="block rounded-sm" style={{ width: half, height: barH, background: color }} />
          </span>
        ),
      )}
    </div>
  );
}
