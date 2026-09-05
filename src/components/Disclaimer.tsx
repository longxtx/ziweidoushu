import { useEffect, useState } from 'react';

const STORAGE_KEY = 'zw-disclaimer-ack';

/**
 * 免责声明（PRD 7.5）
 *
 * 首次访问展示一次，AI 解读前会再展示一次（后者待 P1 接入）。
 * 用户确认后记录在本地，不再打扰。
 */
export function Disclaimer() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
    } catch {
      // localStorage 不可用时也展示，确保用户至少看到一次
      setVisible(true);
    }
  }, []);

  const ack = () => {
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      /* 忽略写入失败 */
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-6" role="dialog" aria-modal="true">
      <div
        className="absolute inset-0"
        style={{ background: 'var(--overlay-deep)' }}
        aria-hidden="true"
      />
      <div
        className="relative w-full max-w-[400px] rounded p-5"
        style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow)' }}
      >
        <h2 className="text-kai mb-3 text-[1.0625rem] font-semibold" style={{ color: 'var(--ink)' }}>
          使用须知
        </h2>
        <ul
          className="mb-4 list-inside list-disc text-[0.8125rem] leading-relaxed"
          style={{ color: 'var(--ink-light)' }}
        >
          <li>本工具内容属于传统文化研究与娱乐参考，<strong>不构成</strong>医疗、法律、投资或人生决策建议。</li>
          <li>命理分析并非宿命结论，请结合自身判断。</li>
          <li>您填写的出生数据<strong>仅在您的设备本地处理</strong>，不会上传服务器。</li>
        </ul>
        <button
          type="button"
          onClick={ack}
          className="w-full rounded py-2 text-[0.875rem] text-white"
          style={{ background: 'var(--grad-btn)' }}
        >
          我已了解
        </button>
      </div>
    </div>
  );
}
