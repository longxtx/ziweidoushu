interface Props {
  /** 印文，默认「紫」（PRD Q7：品牌名含「易」时可改为「易」） */
  text?: string;
  size?: number;
}

export function Seal({ text = '紫', size = 68 }: Props) {
  return (
    <div
      className="text-kai flex select-none items-center justify-center font-semibold text-white"
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.18),
        background: 'var(--cinnabar)',
        fontSize: Math.round(size * 0.52),
        lineHeight: 1,
        boxShadow: 'var(--shadow)',
      }}
      aria-hidden="true"
    >
      {text}
    </div>
  );
}
