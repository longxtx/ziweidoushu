import { useState } from 'react';

interface Props {
  /** 术语标题，如「天同（主星）」 */
  term: string;
  body: string;
  children: React.ReactNode;
}

/**
 * 术语内联解释：虚下划线 + 点击弹出解释卡，不跳页（PRD 7.5）。
 * 用于宫位详情等可交互区域；宫格内因点击即开详情，仍用 title 悬浮。
 */
export function TermTip({ term, body, children }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <span className="relative inline-block">
      <span
        role="button"
        tabIndex={0}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            e.stopPropagation();
            setOpen((v) => !v);
          }
        }}
        className="cursor-help border-b border-dashed"
        style={{ borderColor: 'var(--gold)' }}
        aria-label={`${term} 术语解释`}
      >
        {children}
      </span>

      {open && (
        <span
          className="absolute left-0 top-full z-30 mt-1 block w-[220px] rounded p-2 text-left text-[0.75rem] leading-relaxed"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow)',
            color: 'var(--ink-light)',
            whiteSpace: 'pre-line',
          }}
        >
          <span className="mb-1 block text-[0.8125rem]" style={{ color: 'var(--ink)' }}>
            {term}
          </span>
          {body}
        </span>
      )}
    </span>
  );
}
