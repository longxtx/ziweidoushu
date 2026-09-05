import { useMemo, useState } from 'react';

import { PalaceDetail } from '@/components/PalaceDetail';
import { PalaceGrid } from '@/components/PalaceGrid';
import { SecondForm } from '@/components/SecondForm';
import { daXianPalaceIndex, flowYearInfo } from '@/engine';
import type { Chart, Palace } from '@/engine';

/**
 * 双盘对照（合盘 · PRD 之外的用户扩展，F5 分享场景的延伸）
 *
 * 原则：只并排陈述事实（出生参数、盘面结构、十二宫主星），
 * 不输出任何「合盘吉凶 / 缘分」结论，避免未经审校的命理判断（与 PRD 10.1 一致）。
 */

interface Props {
  chartA: Chart;
  onBack: () => void;
}

const PALACE_NAMES = [
  '命宫',
  '兄弟',
  '夫妻',
  '子女',
  '财帛',
  '疾厄',
  '迁移',
  '交友',
  '官禄',
  '田宅',
  '福德',
  '父母',
];

function birthYear(c: Chart): number {
  return Number(c.solarDate.slice(0, 4));
}

function nominalAge(c: Chart): number {
  return new Date().getFullYear() - birthYear(c) + 1;
}

function starSummary(p: Palace | undefined): string {
  if (!p || p.majorStars.length === 0) return '空宫';
  return p.majorStars.map((s) => s.name + (s.mutagen ? `·化${s.mutagen}` : '')).join('、');
}

interface CompareRow {
  title: string;
  a: string;
  b: string;
  sub?: boolean;
}

export function CompareView({ chartA, onBack }: Props) {
  const [chartB, setChartB] = useState<Chart | null>(null);
  const [errB, setErrB] = useState<string | null>(null);
  const [detail, setDetail] = useState<{ side: 'a' | 'b'; index: number } | null>(null);
  const [flowMode, setFlowMode] = useState(false);
  const thisYear = new Date().getFullYear();
  const baseA = birthYear(chartA);
  const minYear = chartB ? Math.min(baseA, birthYear(chartB)) : baseA;
  const maxYear = chartB ? Math.max(baseA + 119, birthYear(chartB) + 119) : baseA + 119;
  const [flowYear, setFlowYear] = useState(() => Math.min(Math.max(thisYear, baseA), baseA + 119));
  const shownYear = Math.min(Math.max(flowYear, minYear), maxYear);

  const flowA = flowMode ? flowYearInfo(chartA, shownYear) : null;
  const flowB = chartB && flowMode ? flowYearInfo(chartB, shownYear) : null;

  const rows: CompareRow[] = useMemo(() => {
    if (!chartB) return [];
    const genderOf = (c: Chart) => (c.input.gender === 'male' ? '男' : '女');
    const find = (c: Chart, name: string) => c.palaces.find((p) => p.name === name);
    const basic: CompareRow[] = [
      { title: '出生日期', a: chartA.solarDate, b: chartB.solarDate },
      { title: '农历', a: chartA.lunarDate, b: chartB.lunarDate },
      { title: '性别', a: genderOf(chartA), b: genderOf(chartB) },
      { title: '五行局', a: chartA.fiveElementsClass, b: chartB.fiveElementsClass },
      { title: '命主 / 身主', a: `${chartA.soul} / ${chartA.body}`, b: `${chartB.soul} / ${chartB.body}` },
    ];
    const palaces: CompareRow[] = PALACE_NAMES.map((name) => {
      const pa = find(chartA, name);
      const pb = find(chartB, name);
      return {
        title: name,
        a: `${pa?.earthlyBranch ?? ''}宫·${starSummary(pa)}`,
        b: `${pb?.earthlyBranch ?? ''}宫·${starSummary(pb)}`,
        sub: true,
      };
    });
    return [...basic, ...palaces];
  }, [chartA, chartB]);

  const daXianA = daXianPalaceIndex(chartA, nominalAge(chartA));

  function handleChartB(c: Chart) {
    setChartB(c);
    setErrB(null);
  }

  function stepFlow(delta: number) {
    setFlowYear((y) => Math.min(Math.max(y + delta, minYear), maxYear));
  }

  return (
    <div className="mx-auto w-full max-w-[1080px] px-3 pb-12">
      <div className="flex items-center justify-between py-3">
        <button
          type="button"
          onClick={onBack}
          className="text-[0.8125rem]"
          style={{ color: 'var(--ink-light)' }}
        >
          ← 返回命盘
        </button>
        <h1 className="text-[1rem] font-medium" style={{ color: 'var(--ink)' }}>
          双盘对照
        </h1>
        <span className="w-10" />
      </div>

      {!chartB ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {/* 命盘一：当前已出的盘 */}
          <section>
            <h2 className="text-kai mb-2 text-[0.875rem]" style={{ color: 'var(--cinnabar)' }}>
              命盘一 · {chartA.input.gender === 'male' ? '男' : '女'}（当前）
            </h2>
            <PalaceGrid
              chart={chartA}
              currentDaXianIndex={daXianA}
              selected={null}
              onSelect={(i) => setDetail({ side: 'a', index: i })}
            />
          </section>
          <section>
            <h2 className="text-kai mb-2 text-[0.875rem]" style={{ color: 'var(--cinnabar)' }}>
              命盘二 · 录入对方出生数据
            </h2>
            <SecondForm onChart={handleChartB} />
            {errB && <p style={{ color: 'var(--cinnabar)' }}>{errB}</p>}
          </section>
        </div>
      ) : (
        <>
          {/* 时间轴：作用于两张盘的同一公历年 */}
          <div className="no-print mb-3 flex flex-wrap items-center gap-2">
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
                二人流年
              </button>
            </div>
            {flowMode && flowA && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => stepFlow(-1)}
                  className="px-2 py-1 text-[0.875rem] leading-none"
                  style={{ color: 'var(--ink-light)' }}
                  aria-label="上一年"
                >
                  ‹
                </button>
                <span className="text-kai min-w-[150px] text-center text-[0.8125rem]" style={{ color: 'var(--ink)' }}>
                  {flowA.ganZhi}年 · {flowA.year}
                </span>
                <button
                  type="button"
                  onClick={() => stepFlow(1)}
                  className="px-2 py-1 text-[0.875rem] leading-none"
                  style={{ color: 'var(--ink-light)' }}
                  aria-label="下一年"
                >
                  ›
                </button>
                {flowA.year !== thisYear && (
                  <button
                    type="button"
                    onClick={() => setFlowYear(Math.min(Math.max(thisYear, minYear), maxYear))}
                    className="ml-1 text-[0.75rem] underline"
                    style={{ color: 'var(--cinnabar)' }}
                  >
                    回到今年
                  </button>
                )}
              </div>
            )}
            <button
              type="button"
              onClick={() => setChartB(null)}
              className="ml-auto text-[0.75rem] underline"
              style={{ color: 'var(--ink-light)' }}
            >
              重新录入命盘二
            </button>
          </div>

          <div className="grid items-start gap-4 lg:grid-cols-2">
            <section>
              <h2 className="text-kai mb-2 text-[0.875rem]" style={{ color: 'var(--cinnabar)' }}>
                命盘一 · {chartA.input.gender === 'male' ? '男' : '女'}
              </h2>
              <PalaceGrid
                chart={chartA}
                currentDaXianIndex={daXianA}
                selected={detail?.side === 'a' ? detail.index : null}
                onSelect={(i) => setDetail({ side: 'a', index: i })}
                flow={flowA}
              />
            </section>
            <section>
              <h2 className="text-kai mb-2 text-[0.875rem]" style={{ color: 'var(--cinnabar)' }}>
                命盘二 · {chartB.input.gender === 'male' ? '男' : '女'}
              </h2>
              <PalaceGrid
                chart={chartB}
                currentDaXianIndex={daXianPalaceIndex(chartB, nominalAge(chartB))}
                selected={detail?.side === 'b' ? detail.index : null}
                onSelect={(i) => setDetail({ side: 'b', index: i })}
                flow={flowB}
              />
            </section>
          </div>

          {flowMode && (
            <p className="no-print mt-2 text-center text-[0.6875rem]" style={{ color: 'var(--ink-light)' }}>
              金色边框为两张盘各自的 {flowA?.ganZhi} 年流年命宫　·　「流禄」等为各自流年四化
            </p>
          )}

          {/* 对照表 */}
          <div
            className="no-print mt-6 rounded p-3"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
          >
            <h2 className="text-kai mb-2 text-[0.875rem]" style={{ color: 'var(--cinnabar)' }}>
              十二宫主星对照
            </h2>
            <p className="mb-2 text-[0.6875rem]" style={{ color: 'var(--ink-light)' }}>
              差异项以朱砂标出。仅并列盘面事实，供参考比较。
            </p>
            <div className="grid grid-cols-[88px_1fr_1fr] gap-x-2 gap-y-1 text-[0.75rem]">
              <div style={{ color: 'var(--ink-light)' }}>宫位</div>
              <div style={{ color: 'var(--ink-light)' }}>命盘一</div>
              <div style={{ color: 'var(--ink-light)' }}>命盘二</div>
              {rows.map((r) => {
                const differ = r.a !== r.b;
                return (
                  <div key={r.title} className="contents">
                    <div
                      className={r.sub ? 'border-t py-1' : 'py-1'}
                      style={{
                        color: r.sub ? 'var(--ink)' : 'var(--cinnabar)',
                        borderTopColor: 'var(--border)',
                        fontWeight: r.sub ? 500 : 600,
                      }}
                    >
                      {r.title}
                    </div>
                    <div
                      className={r.sub ? 'border-t py-1' : 'py-1'}
                      style={{
                        borderTopColor: 'var(--border)',
                        color: differ ? 'var(--cinnabar)' : 'var(--ink)',
                        lineHeight: 1.5,
                      }}
                    >
                      {r.a}
                    </div>
                    <div
                      className={r.sub ? 'border-t py-1' : 'py-1'}
                      style={{
                        borderTopColor: 'var(--border)',
                        color: differ ? 'var(--cinnabar)' : 'var(--ink)',
                        lineHeight: 1.5,
                      }}
                    >
                      {r.b}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <p
            className="mt-4 text-center text-[0.6875rem] leading-relaxed"
            style={{ color: 'var(--ink-light)' }}
          >
            双盘对照仅并列事实：不输出任何合盘吉凶、缘分或配对结论，请勿据此做关系决策。
            <br />
            出生数据仅在您的设备本地处理，不会上传。
          </p>
        </>
      )}

      {detail && (
        <PalaceDetail
          chart={detail.side === 'a' ? chartA : chartB ?? chartA}
          index={detail.index}
          onClose={() => setDetail(null)}
        />
      )}
    </div>
  );
}
