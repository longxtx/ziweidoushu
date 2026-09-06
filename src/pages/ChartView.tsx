import { useMemo, useRef, useState } from 'react';

import { PalaceDetail } from '@/components/PalaceDetail';
import { PalaceGrid } from '@/components/PalaceGrid';
import { PalaceList } from '@/components/PalaceList';
import { ChartGuide } from '@/components/ChartGuide';
import { LS_CHART_GUIDE } from '@/constants';
import { STAR_MEANING } from '@/data/terms';
import {
  daXianPalaceIndex,
  detectPatterns,
  flowYearInfo,
  majorStarLabel,
  oppositeIndex,
  trineIndices,
} from '@/engine';
import type { Chart } from '@/engine';
import { buildShareUrl } from '@/library/share';
import { exportChartImage } from '@/library/exportImage';
import { useChartStore } from '@/store/useChartStore';
import { useLibraryStore } from '@/store/useLibraryStore';

interface Props {
  chart: Chart;
  onBack: () => void;
  /** 进入双盘对照 */
  onCompare: () => void;
  /** 打开盘库（保存后引导跳转用） */
  onOpenLibrary: () => void;
}

/** 轻提示，可带一个操作（如「去盘库查看」） */
interface ToastAction {
  label: string;
  onClick: () => void;
}

/** 由出生年推算当前虚岁，用于高亮当前大限 */
function nominalAge(chart: Chart): number {
  const birthYear = Number(chart.solarDate.slice(0, 4));
  return new Date().getFullYear() - birthYear + 1;
}

export function ChartView({ chart, onBack, onCompare, onOpenLibrary }: Props) {
  const [selected, setSelected] = useState<number | null>(null);

  // 三方四正联动：选中宫位后，本宫＋三方四正以金色细框在盘面标出
  const linked = useMemo(() => {
    if (selected === null) return null;
    const [wealth, career] = trineIndices(selected);
    return [selected, oppositeIndex(selected), wealth, career];
  }, [selected]);

  const age = useMemo(() => nominalAge(chart), [chart]);
  const currentDaXian = daXianPalaceIndex(chart, age);

  // 流年模式：步进为公历年，默认落在今年（engine/flow.ts 注释了干支边界约定）
  const birthYear = Number(chart.solarDate.slice(0, 4));
  const minFlowYear = birthYear;
  const maxFlowYear = birthYear + 119;
  const thisYear = new Date().getFullYear();
  const [flowMode, setFlowMode] = useState(false);
  // 盘面形态：宫格 / 列表（PRD F2）
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  // 首次进入命盘的三步引导（PRD 7.5），仅一次、可跳过
  const [guideDone, setGuideDone] = useState(() => {
    try {
      return localStorage.getItem(LS_CHART_GUIDE) === '1';
    } catch {
      return true; // 隐私模式下不打扰
    }
  });
  const [flowYear, setFlowYear] = useState(() =>
    Math.min(Math.max(thisYear, birthYear), birthYear + 119),
  );
  const shownFlowYear = Math.min(Math.max(flowYear, minFlowYear), maxFlowYear);
  const flow = flowMode ? flowYearInfo(chart, shownFlowYear) : null;
  // 格局识别（PRD F8）：纯前端声明式规则，结果随盘面确定
  const patterns = useMemo(() => detectPatterns(chart), [chart]);

  const input = useChartStore((s) => s.input);
  const saveCurrent = useLibraryStore((s) => s.saveCurrent);
  const findByInput = useLibraryStore((s) => s.findByInput);
  const [toast, setToast] = useState<{ text: string; action?: ToastAction } | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);

  function showToast(text: string, action?: ToastAction) {
    setToast({ text, action });
    window.clearTimeout(toastTimer.current);
    // 带操作的提示停留更久，给用户点击时间
    toastTimer.current = window.setTimeout(() => setToast(null), action ? 5000 : 2200);
  }

  async function handleSave() {
    if (!input) return;
    const existing = findByInput(input);
    await saveCurrent(input);
    // PRD：保存后给出可达的下一步，而非只有一句 toast
    showToast(existing ? '已在盘库，已更新' : '已存入盘库', {
      label: '去盘库查看',
      onClick: onOpenLibrary,
    });
  }

  async function handleShare() {
    if (!input) return;
    const url = buildShareUrl(input);
    try {
      await navigator.clipboard.writeText(url);
      // 给出可达的下一步：链接已复制，还可直接生成分享图
      showToast('分享链接已复制', { label: '生成分享图', onClick: handleExport });
    } catch {
      // 剪贴板不可用时降级为可复制的弹窗
      window.prompt('复制此分享链接分享给朋友：', url);
    }
  }

  function handleExport() {
    if (!input) return;
    exportChartImage(chart, input);
    showToast('已生成分享图');
  }

  function stepFlowYear(delta: number) {
    setFlowYear((y) => Math.min(Math.max(y + delta, minFlowYear), maxFlowYear));
  }

  function jumpToThisYear() {
    setFlowYear(Math.min(Math.max(thisYear, minFlowYear), maxFlowYear));
  }

  const soulPalace = chart.palaces[chart.soulPalaceIndex];
  const correction = chart.correction;

  // 命宫主星性质关键词（中性知识，不含吉凶与运势判断）
  const soulMeaning = soulPalace.majorStars
    .map((s) => STAR_MEANING[s.name])
    .filter(Boolean)
    .join('；');
  const bodyPalaceName = chart.palaces[chart.bodyPalaceIndex]?.name ?? '—';

  return (
    <div className="mx-auto w-full max-w-[720px] px-3 pb-12 xl:max-w-[1100px]">
      <header className="no-print flex items-center justify-between py-3">
        <button
          type="button"
          onClick={onBack}
          className="text-[0.8125rem]"
          style={{ color: 'var(--ink-light)' }}
        >
          ← 重新排盘
        </button>
        <div className="flex items-center gap-2">
          <span className="text-kai text-[0.9375rem]" style={{ color: 'var(--ink)' }}>
            本命盘
          </span>
          <span className="text-[0.75rem]" style={{ color: 'var(--ink-light)' }}>
            {age} 岁
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void handleSave()}
            className="rounded-sm px-2.5 py-1 text-[0.75rem]"
            style={{ border: '1px solid var(--border)', color: 'var(--cinnabar)' }}
          >
            保存
          </button>
          <button
            type="button"
            onClick={() => void handleShare()}
            className="rounded-sm px-2.5 py-1 text-[0.75rem] text-white"
            style={{ border: '1px solid var(--cinnabar-dark)', background: 'var(--grad-btn)' }}
          >
            分享
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="rounded-sm px-2 py-1 text-[0.75rem]"
            style={{ border: '1px solid var(--border)', color: 'var(--ink-light)' }}
          >
            导出
          </button>
        </div>
      </header>

      {toast && (
        <div className="no-print fixed inset-x-0 bottom-6 z-40 flex justify-center px-4">
          <div
            className="flex max-w-full items-center gap-3 rounded-full px-4 py-2 text-[0.8125rem] text-white shadow-lg"
            style={{ background: 'var(--toast-bg)' }}
            role="status"
          >
            <span>{toast.text}</span>
            {toast.action && (
              <button
                type="button"
                onClick={() => {
                  toast.action?.onClick();
                  setToast(null);
                }}
                className="shrink-0 underline"
                style={{ color: 'var(--on-accent)' }}
              >
                {toast.action.label}
              </button>
            )}
          </div>
        </div>
      )}

      {/* 真太阳时校正提示（PRD F1：需在盘面明示） */}
      {correction && (
        <div
          className="mb-3 rounded-sm px-3 py-2 text-[0.6875rem] leading-relaxed"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          <span style={{ color: 'var(--ink-light)' }}>
            已按真太阳时校正{' '}
            <strong style={{ color: 'var(--ink)' }}>
              {correction.offsetMinutes > 0 ? '+' : ''}
              {correction.offsetMinutes}
            </strong>{' '}
            分钟（经度差 {Math.round(correction.longitudeOffset)} 分，均时差{' '}
            {Math.round(correction.equationOfTime)} 分）
          </span>
          {correction.crossedDay && (
            <span className="ml-1" style={{ color: 'var(--cinnabar)' }}>
              · 校正后日期变为 {correction.correctedDate}
            </span>
          )}
          {correction.changedHour && !correction.crossedDay && (
            <span className="ml-1" style={{ color: 'var(--cinnabar)' }}>
              · 校正后时辰发生变化
            </span>
          )}
        </div>
      )}

      {/* 未填写时辰：常驻提示（PRD 7.3 边界态） */}
      {chart.input.timeUnknown && (
        <div
          className="mb-3 rounded-sm px-3 py-2 text-[0.75rem] leading-relaxed"
          style={{ background: 'var(--gold-soft)', color: 'var(--ink)' }}
          role="status"
        >
          当前按<strong>午时</strong>排盘（未填写出生时辰）：命宫与迁移宫可能不准。
          <button
            type="button"
            onClick={onBack}
            className="ml-1 underline"
            style={{ color: 'var(--cinnabar)' }}
          >
            返回补充时辰
          </button>
        </div>
      )}

      {/* 桌面端（≥1025px）双栏：左命盘 / 右常驻详情面板（PRD 7.6） */}
      <div className="xl:grid xl:grid-cols-[minmax(0,660px)_minmax(0,1fr)] xl:gap-4">
        <div>
          {/* 基本信息 */}
          <div
            className="mb-3 rounded p-3 text-[0.75rem] leading-relaxed"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
      >
        <div className="flex flex-wrap gap-x-4 gap-y-1" style={{ color: 'var(--ink-light)' }}>
          <span>阳历 {chart.solarDate}</span>
          <span>农历 {chart.lunarDate}</span>
          <span>{chart.time}时 {chart.timeRange}</span>
          <span>{chart.zodiac}　{chart.sign}</span>
        </div>
        <div className="mt-2" style={{ color: 'var(--ink)' }}>
          命宫：
          <span className="text-kai text-[0.875rem]">{majorStarLabel(soulPalace)}</span>
          <span className="ml-2 text-[0.75rem]" style={{ color: 'var(--ink-light)' }}>
            {chart.fiveElementsClass} · 命主{chart.soul} · 身主{chart.body}
          </span>
        </div>
      </div>

      {/* 时间轴：本命大限 / 流年切换 */}
      {/* 本命盘速览：命宫主星性质 + 盘面要点 */}
      <div
        className="mb-3 rounded p-3"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
      >
        <div className="text-kai text-[0.875rem]" style={{ color: 'var(--cinnabar)' }}>
          本命盘速览
        </div>
        {soulMeaning ? (
          <p className="mt-1 text-[0.8125rem] leading-relaxed" style={{ color: 'var(--ink)' }}>
            命宫 {majorStarLabel(soulPalace)}：{soulMeaning}
          </p>
        ) : (
          <p className="mt-1 text-[0.8125rem]" style={{ color: 'var(--ink)' }}>
            命宫无十四主星（空宫），性格与格局需借对宫星曜参看。
          </p>
        )}
        <p className="mt-1 text-[0.75rem]" style={{ color: 'var(--ink-light)' }}>
          {chart.fiveElementsClass} · 命主{chart.soul} · 身主{chart.body} · 身宫在{bodyPalaceName}
        </p>
      </div>

      <div data-guide="timeline" className="no-print mb-3 flex flex-wrap items-center gap-2">
        <div className="flex overflow-hidden rounded-sm" style={{ border: '1px solid var(--border)' }}>
          <button
            type="button"
            onClick={() => setFlowMode(false)}
            className="px-3 py-1 text-[0.75rem]"
            style={
              !flowMode
                ? { background: 'var(--cinnabar-soft)', color: 'var(--cinnabar)' }
                : { background: 'var(--bg-card)', color: 'var(--ink-light)' }
            }
          >
            本命 · 大限
          </button>
          <button
            type="button"
            onClick={() => setFlowMode(true)}
            className="px-3 py-1 text-[0.75rem]"
            style={
              flowMode
                ? { background: 'var(--cinnabar-soft)', color: 'var(--cinnabar)' }
                : { background: 'var(--bg-card)', color: 'var(--ink-light)' }
            }
          >
            流年
          </button>
        </div>
        {flow && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => stepFlowYear(-1)}
              className="px-2 py-1 text-[0.875rem] leading-none"
              style={{ color: 'var(--ink-light)' }}
              aria-label="上一年"
            >
              ‹
            </button>
            <span
              className="text-kai min-w-[150px] text-center text-[0.8125rem]"
              style={{ color: 'var(--ink)' }}
            >
              {flow.ganZhi}年 · {flow.year}
              <span className="ml-1 text-[0.6875rem]" style={{ color: 'var(--ink-light)' }}>
                虚岁 {flow.nominalAge}
              </span>
            </span>
            <button
              type="button"
              onClick={() => stepFlowYear(1)}
              className="px-2 py-1 text-[0.875rem] leading-none"
              style={{ color: 'var(--ink-light)' }}
              aria-label="下一年"
            >
              ›
            </button>
            {flow.year !== thisYear && (
              <button
                type="button"
                onClick={jumpToThisYear}
                className="ml-1 text-[0.75rem] underline"
                style={{ color: 'var(--cinnabar)' }}
              >
                回到今年
              </button>
            )}
          </div>
        )}

        {/* 双盘对照：低频操作，放在工具栏避免头部按钮拥挤（小屏更易点按） */}
        <button
          type="button"
          onClick={onCompare}
          className="rounded-sm px-2 py-1 text-[0.75rem]"
          style={{ border: '1px solid var(--gold)', color: 'var(--gold)' }}
          title="双盘对照：与另一张命盘并排比较"
        >
          合盘
        </button>

        {/* 宫格 / 列表 视图切换（PRD F2） */}
        <div className="ml-auto flex overflow-hidden rounded-sm" style={{ border: '1px solid var(--border)' }}>
          {[
            { v: 'grid' as const, label: '宫格' },
            { v: 'list' as const, label: '列表' },
          ].map(({ v, label }) => (
            <button
              key={v}
              type="button"
              onClick={() => setViewMode(v)}
              className="px-3 py-1 text-[0.75rem]"
              style={
                viewMode === v
                  ? { background: 'var(--cinnabar-soft)', color: 'var(--cinnabar)' }
                  : { background: 'var(--bg-card)', color: 'var(--ink-light)' }
              }
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {viewMode === 'grid' ? (
        <PalaceGrid
          chart={chart}
          currentDaXianIndex={currentDaXian}
          selected={selected}
          onSelect={setSelected}
          flow={flow}
          linked={linked}
        />
      ) : (
        <PalaceList chart={chart} selected={selected} onSelect={setSelected} flow={flow} />
      )}

      {flow ? (
        <p className="no-print mt-3 text-center text-[0.6875rem]" style={{ color: 'var(--ink-light)' }}>
          金色边框为 {flow.ganZhi} 年流年命宫（太岁地支「{flow.soulBranch}」）　·　「流禄／流权／流科／流忌」为该年流年四化，悬停可见化曜星名　·　宫位详情仍为本命盘
        </p>
      ) : (
        <p className="no-print mt-3 text-center text-[0.6875rem]" style={{ color: 'var(--ink-light)' }}>
          点击任一宫位查看详情与依据　·　朱砂边框为当前大限（{age} 岁）
        </p>
      )}

        </div>

        {/* 右栏：桌面常驻详情，点击宫位即切换内容，省去一次开关交互 */}
        <div className="hidden xl:block">
          {selected !== null && (
            <PalaceDetail
              chart={chart}
              index={selected}
              onClose={() => setSelected(null)}
              inline
            />
          )}
        </div>
      </div>

      {/* 移动端：底部抽屉 */}
      <div className="xl:hidden">
        {selected !== null && (
          <PalaceDetail chart={chart} index={selected} onClose={() => setSelected(null)} />
        )}
      </div>

      {/* 命中格局（PRD F8）：只列结构与依据，不给吉凶结论 */}
      <div
        className="no-print mt-4 rounded p-3"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
      >
        <h2 className="text-kai mb-2 text-[0.875rem]" style={{ color: 'var(--cinnabar)' }}>
          命中格局
        </h2>

        {patterns.length === 0 ? (
          <p className="text-[0.75rem] leading-relaxed" style={{ color: 'var(--ink-light)' }}>
            本盘未命中已收录的格局。格局库当前收录 20 条常见组合，将随规则库扩展持续增补。
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {patterns.map((h) => (
              <li
                key={h.id}
                className="rounded p-2"
                style={{ border: '1px solid var(--border)' }}
              >
                <div className="flex items-baseline gap-2">
                  <span className="text-kai text-[0.875rem]" style={{ color: 'var(--ink)' }}>
                    {h.name}
                  </span>
                  <span
                    className="rounded-sm px-[4px] text-[0.625rem]"
                    style={{
                      color: h.complete ? 'var(--cinnabar)' : 'var(--gold)',
                      border: `1px solid ${h.complete ? 'var(--cinnabar)' : 'var(--gold)'}`,
                    }}
                  >
                    {h.complete ? '成立' : '近似'}
                  </span>
                </div>

                <p className="mt-1 text-[0.75rem] leading-relaxed" style={{ color: 'var(--ink-light)' }}>
                  {h.description}
                </p>

                <ul
                  className="mt-1 list-inside list-disc text-[0.6875rem] leading-relaxed"
                  style={{ color: 'var(--ink-light)' }}
                >
                  {h.evidences.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>

                <p className="mt-1 text-[0.625rem]" style={{ color: 'var(--gold)' }}>
                  出处：{h.source}
                </p>
              </li>
            ))}
          </ul>
        )}

      </div>

      {!guideDone && <ChartGuide onDone={() => setGuideDone(true)} />}
    </div>
  );
}
