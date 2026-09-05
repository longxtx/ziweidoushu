import { useEffect, useState } from 'react';

import { LS_CHART_GUIDE } from '@/constants';

/**
 * 首次进入命盘的三步气泡引导（PRD 7.5）
 * ① 这是你的命宫 ② 点宫位看解读 ③ 切换看今年运势
 * 仅出现一次，可跳过，localStorage 记录。
 */
const STEPS: { target: string; text: string }[] = [
  { target: '[data-guide="soul"]', text: '这是你的命宫，整张盘的起点，宫名以朱砂标出。' },
  { target: '[data-guide="palace-grid"]', text: '点击任一宫位，可查看星曜、三方四正与推导依据。' },
  { target: '[data-guide="timeline"]', text: '在这里切换「本命·大限」与「流年」，看某一年的运势。' },
];

export function ChartGuide({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    const el = document.querySelector(STEPS[step].target);
    setRect(el ? el.getBoundingClientRect() : null);
  }, [step]);

  function finish() {
    try {
      localStorage.setItem(LS_CHART_GUIDE, '1');
    } catch {
      /* 隐私模式忽略 */
    }
    onDone();
  }

  const isLast = step === STEPS.length - 1;
  // 目标在屏幕下半部时气泡置于其上方，反之置于下方
  const top = rect
    ? rect.top > window.innerHeight / 2
      ? Math.max(12, rect.top - 110)
      : rect.bottom + 12
    : 120;

  return (
    <div className="no-print fixed inset-0 z-[60]" onClick={finish}>
      {/* 挖洞遮罩：高亮目标区域 */}
      {rect && (
        <div
          className="pointer-events-none absolute rounded"
          style={{
            top: rect.top - 4,
            left: rect.left - 4,
            width: rect.width + 8,
            height: rect.height + 8,
            boxShadow: '0 0 0 9999px var(--overlay)',
          }}
        />
      )}

      <div
        className="absolute left-3 right-3 rounded-lg p-3"
        style={{ top, background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="新手引导"
      >
        <p className="text-[0.8125rem] leading-relaxed" style={{ color: 'var(--ink)' }}>
          {STEPS[step].text}
        </p>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-[0.6875rem]" style={{ color: 'var(--ink-light)' }}>
            {step + 1} / {STEPS.length}
          </span>
          <div className="flex items-center gap-3">
            <button type="button" onClick={finish} className="text-[0.75rem]" style={{ color: 'var(--ink-light)' }}>
              跳过
            </button>
            <button
              type="button"
              onClick={() => (isLast ? finish() : setStep(step + 1))}
              className="rounded px-3 py-1 text-[0.75rem]"
              style={{ background: 'var(--grad-btn)', color: 'var(--on-accent)' }}
            >
              {isLast ? '知道了' : '下一步'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
