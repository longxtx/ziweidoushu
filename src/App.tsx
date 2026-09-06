import { Suspense, lazy, useEffect, useState } from 'react';

import { Disclaimer } from '@/components/Disclaimer';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { HexagramLines } from '@/components/HexagramLines';
import { useTheme } from '@/hooks/useTheme';
import { decodeChart } from '@/library/share';
import type { BirthInput } from '@/engine';
import { ChartForm } from '@/pages/ChartForm';
import { useChartStore } from '@/store/useChartStore';
import { useLibraryStore } from '@/store/useLibraryStore';

// 命盘页连同排盘引擎一起按需加载，首屏只保留表单
const ChartView = lazy(() =>
  import('@/pages/ChartView').then((m) => ({ default: m.ChartView })),
);
// 盘库与存储层按需加载，不计入首屏
const Library = lazy(() => import('@/pages/Library').then((m) => ({ default: m.Library })));
// 双盘对照按需加载
const CompareView = lazy(() => import('@/pages/CompareView').then((m) => ({ default: m.CompareView })));
// 设置与合规按需加载
const Settings = lazy(() => import('@/pages/Settings').then((m) => ({ default: m.Settings })));

function DisclaimerGate() {
  const { chart } = useChartStore();
  // 出盘后不再展示，避免打断查看命盘
  if (chart) return null;
  return <Disclaimer />;
}

function Loading({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center py-16">
      {/* 六爻图仅作加载占位装饰（PRD 6.4） */}
      <HexagramLines size={112} color="var(--border)" />
      <p className="mt-4 text-center text-[0.8125rem]" style={{ color: 'var(--ink-light)' }}>
        {text}…
      </p>
    </div>
  );
}

/** 分享回流浮层：接收者打开分享链接看到对方命盘，引导查看自己的命盘（PRD 7.3 流程 3） */
function ShareOverlay({ onViewOwn }: { onViewOwn: () => void }) {
  return (
    <div
      className="no-print fixed inset-0 z-50 flex items-end justify-center px-3 pb-8"
      style={{ background: 'var(--overlay-soft)' }}
      onClick={onViewOwn}
    >
      <div
        className="w-full max-w-[560px] rounded-lg p-5 text-center"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-[0.9375rem]" style={{ color: 'var(--ink)' }}>
          朋友分享的命盘已为你打开
        </p>
        <p className="mt-1 text-[0.75rem]" style={{ color: 'var(--ink-light)' }}>
          这是对方命盘，仅供对照参考
        </p>
        <button
          type="button"
          onClick={onViewOwn}
          className="mt-4 w-full rounded py-2.5 text-[0.875rem] text-white"
          style={{ background: 'var(--grad-btn)' }}
        >
          查看你自己的命盘
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const { theme, toggle } = useTheme();
  const { chart, error, cast, clear } = useChartStore();
  const loadLibrary = useLibraryStore((s) => s.load);

  const [view, setView] = useState<'home' | 'library' | 'settings'>('home');
  const [compare, setCompare] = useState(false);
  const [shareActive, setShareActive] = useState(false);

  // 启动后加载盘库（IndexedDB）
  useEffect(() => {
    void loadLibrary();
  }, [loadLibrary]);

  // 分享链接还原：?share= 参数解码后直接排盘（PRD F5）
  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get('share');
    if (!param) return;
    const decoded = decodeChart(param);
    if (decoded) {
      void cast(decoded);
      setShareActive(true);
      // 清理 URL 参数，避免刷新重复还原
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [cast]);

  // 首屏引擎预取：停留在表单时空闲预加载排盘引擎，使首次排盘秒开（省流量模式跳过）
  useEffect(() => {
    const conn = (navigator as unknown as { connection?: { saveData?: boolean } }).connection;
    if (conn?.saveData) return;
    const w = window as unknown as {
      requestIdleCallback?: (cb: () => void) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    const start =
      w.requestIdleCallback ??
      ((cb: () => void) => window.setTimeout(cb, 2500) as unknown as number);
    const cancel = w.cancelIdleCallback ?? ((id: number) => window.clearTimeout(id));
    const id = start(() => void import('@/engine'));
    return () => cancel(id);
  }, []);

  const openLibrary = () => setView('library');
  const backHome = () => setView('home');
  const openFromLibrary = (input: BirthInput) => {
    void cast(input);
    setView('home');
  };
  // 盘库「对比」：先排该盘作为命盘一，再进入双盘对照
  const compareFromLibrary = async (input: BirthInput) => {
    await cast(input);
    setCompare(true);
  };
  const closeShare = () => {
    setShareActive(false);
    clear();
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* 顶部装饰线：朱砂 → 金 → 朱砂（PRD 6.5） */}
      <div className="deco-line" />

      <div className="mx-auto max-w-[720px] px-3">
        <div className="no-print flex items-center justify-end gap-2 py-2">
          <button
            type="button"
            onClick={() => setView('settings')}
            className="rounded-sm px-2 py-1 text-[0.75rem]"
            style={{ border: '1px solid var(--border)', color: 'var(--ink-light)' }}
          >
            设置
          </button>
          <button
            type="button"
            onClick={toggle}
            className="rounded-sm px-2 py-1 text-[0.75rem]"
            style={{ color: 'var(--ink-light)', border: '1px solid var(--border)' }}
            aria-label="切换深浅色主题"
          >
            {theme === 'light' ? '书卷 · 深色' : '宣纸 · 浅色'}
          </button>
        </div>
      </div>

      <DisclaimerGate />

      {view === 'settings' ? (
        <Suspense fallback={<Loading text="设置加载中" />}>
          <Settings onBack={() => setView('home')} />
        </Suspense>
      ) : chart && compare ? (
        <Suspense fallback={<Loading text="双盘对照加载中" />}>
          <CompareView chartA={chart} onBack={() => setCompare(false)} />
        </Suspense>
      ) : chart ? (
        <Suspense fallback={<Loading text="命盘加载中" />}>
          <ChartView
            chart={chart}
            onBack={clear}
            onCompare={() => setCompare(true)}
            onOpenLibrary={openLibrary}
          />
        </Suspense>
      ) : view === 'library' ? (
        <Suspense fallback={<Loading text="盘库加载中" />}>
          <Library onOpen={openFromLibrary} onCompare={compareFromLibrary} onBack={backHome} />
        </Suspense>
      ) : (
        <ChartForm onCast={cast} onLibrary={openLibrary} error={error?.message ?? null} />
      )}

      {shareActive && chart && <ShareOverlay onViewOwn={closeShare} />}
      </div>
    </ErrorBoundary>
  );
}
