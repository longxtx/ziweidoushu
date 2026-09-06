import { useEffect } from 'react';

import { MUTAGEN_COLORS, MUTAGEN_MEANING } from '@/constants';
import { PALACE_MEANING, starMeaning } from '@/data/terms';
import { brightnessState, detectPatterns, majorStarLabel, oppositeIndex, palaceMutagens, stateToken, trineIndices } from '@/engine';
import type { Chart } from '@/engine';
import { StarTag } from './StarTag';

interface Props {
  chart: Chart;
  index: number;
  onClose: () => void;
  /**
   * 内嵌模式：桌面端（≥1025px）常驻侧栏面板，免去一次开关交互（PRD 7.6）。
   * 关闭时仍渲染为浮层抽屉。
   */
  inline?: boolean;
}

function StateBadge({ state }: { state: ReturnType<typeof brightnessState> }) {
  if (!state) return null;
  return (
    <span
      className="rounded-sm px-[4px] py-[1px] text-[0.625rem] leading-none"
      style={{
        color: `var(--st-${stateToken(state)}-fg)`,
        background: `var(--st-${stateToken(state)}-bg)`,
        border: `1px solid var(--st-${stateToken(state)}-bd)`,
      }}
    >
      {state}
    </span>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-4">
      <h3
        className="text-kai mb-2 text-[0.875rem] font-semibold"
        style={{ color: 'var(--cinnabar)' }}
      >
        {title}
      </h3>
      {children}
    </section>
  );
}

/**
 * 宫位详情抽屉（PRD F3 / 6.5）
 *
 * MVP 只呈现「事实层」：星曜落宫、亮度、四化、三方四正、推导依据。
 * 解读文案待内容库审校后接入（PRD 10.1），不在未审校前生成命理结论。
 */
export function PalaceDetail({ chart, index, onClose, inline }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const palace = chart.palaces[index];
  if (!palace) return null;

  const opposite = chart.palaces[oppositeIndex(index)];
  const [wealthIdx, careerIdx] = trineIndices(index);
  const wealth = chart.palaces[wealthIdx];
  const career = chart.palaces[careerIdx];

  const isSoul = index === chart.soulPalaceIndex;
  const isBody = palace.isBodyPalace;

  const basis: string[] = [];
  if (isSoul) basis.push('命宫：由生月与生时推定（寅宫起正月顺数至生月，再逆数生时）');
  if (isBody) basis.push('身宫：由生时推定，与某宫重叠时强化该宫影响');
  basis.push(`宫位天干：由五虎遁（年上起月）推定，为「${palace.heavenlyStem}${palace.earthlyBranch}」`);
  basis.push(
    `大限：本盘为${chart.fiveElementsClass}，${palace.daXian.range[0]}–${palace.daXian.range[1]} 岁行此宫`,
  );

  // PRD F3.4：本宫宫干四化飞入何处 + 生年四化落在本宫的星曜
  const mu = palaceMutagens(chart, index);

  // PRD F8：与本宫相关的格局（证据中出现本宫名称者）
  const relatedPatterns = detectPatterns(chart).filter((h) =>
    h.evidences.some((e) => e.includes(palace.name)),
  );

  return (
    <div
      className={
        inline
          ? 'no-print relative'
          : 'no-print fixed inset-0 z-50 flex items-end'
      }
      role="dialog"
      aria-modal={inline ? undefined : true}
    >
      {/* 遮罩（仅浮层模式） */}
      {!inline && (
        <div
          className="anim-fade-in absolute inset-0"
          style={{ background: 'var(--overlay)' }}
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <div
        className={
          inline
            ? 'anim-fade-in sticky top-4 max-h-[85vh] overflow-y-auto rounded-lg p-4'
            : 'anim-drawer-up relative max-h-[85vh] w-full overflow-y-auto rounded-t-2xl px-4 pb-8 pt-3'
        }
        style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow)' }}
      >
        {/* 拖拽指示条（仅浮层模式） */}
        {!inline && (
          <div
            className="mx-auto mb-3 h-1 w-10 rounded-full"
            style={{ background: 'var(--border)' }}
          />
        )}

        <header className="flex items-baseline justify-between">
          <div className="flex items-baseline gap-2">
            <h2 className="text-kai text-[1.25rem] font-semibold" style={{ color: 'var(--ink)' }}>
              {palace.name}
            </h2>
            <span className="text-[0.75rem]" style={{ color: 'var(--ink-light)' }}>
              {palace.heavenlyStem}
              {palace.earthlyBranch}
            </span>
            {isSoul && (
              <span className="text-[0.6875rem]" style={{ color: 'var(--cinnabar)' }}>
                命宫
              </span>
            )}
            {isBody && (
              <span className="text-[0.6875rem]" style={{ color: 'var(--gold)' }}>
                身宫
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-2 text-[0.8125rem]"
            style={{ color: 'var(--ink-light)' }}
            aria-label="关闭"
          >
            关闭
          </button>
        </header>

        {PALACE_MEANING[palace.name] && (
          <p className="mt-1 text-[0.75rem]" style={{ color: 'var(--ink)' }}>
            {PALACE_MEANING[palace.name]}
          </p>
        )}

        <p className="mt-1 text-[0.8125rem]" style={{ color: 'var(--ink-light)' }}>
          {majorStarLabel(palace)}　长生：{palace.changsheng12}　博士：{palace.boshi12}
        </p>

        <Section title="本宫星曜">
          <div className="flex flex-col gap-2">
            {palace.majorStars.length === 0 && (
              <p className="text-[0.8125rem]" style={{ color: 'var(--ink-light)' }}>
                本宫无十四主星（空宫），其对宫与三合宫的影响需重点参看。
              </p>
            )}
            {[...palace.majorStars, ...palace.minorStars].map((s) => {
              const meaning = starMeaning(s.name);
              return (
                <div key={s.name} className="flex flex-col gap-[2px]">
                  <div className="flex flex-wrap items-center gap-2">
                    <StarTag star={s} size="major" interactive />
                    <StateBadge state={brightnessState(s.brightness)} />
                    {s.brightness && (
                      <span className="text-[0.6875rem]" style={{ color: 'var(--ink-light)' }}>
                        {s.brightness}
                      </span>
                    )}
                    {s.mutagen && (
                      <span
                        className="text-[0.6875rem]"
                        style={{ color: MUTAGEN_COLORS[s.mutagen] }}
                      >
                        化{s.mutagen}　{MUTAGEN_MEANING[s.mutagen]}
                      </span>
                    )}
                    <span className="text-[0.6875rem]" style={{ color: 'var(--ink-light)' }}>
                      {s.type}
                    </span>
                  </div>
                  {meaning && (
                    <span className="text-[0.6875rem]" style={{ color: 'var(--ink-light)' }}>
                      {meaning}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </Section>

        <Section title="三方四正">
          <div className="grid grid-cols-2 gap-2 text-[0.8125rem]">
            {[
              { label: '对宫', p: opposite },
              { label: '三合（财帛位）', p: wealth },
              { label: '三合（官禄位）', p: career },
            ].map(({ label, p }) => (
              <div
                key={label}
                className="rounded p-2"
                style={{ border: '1px solid var(--border)' }}
              >
                <div className="text-[0.6875rem]" style={{ color: 'var(--ink-light)' }}>
                  {label}·{p.name}
                </div>
                <div className="mt-[2px]">{majorStarLabel(p)}</div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="四化影响">
          {mu.outward.length === 0 && mu.incoming.length === 0 ? (
            <p className="text-[0.8125rem]" style={{ color: 'var(--ink-light)' }}>
              本宫宫干「{palace.heavenlyStem}」与生年干在本宫均无四化作用。
            </p>
          ) : (
            <div className="flex flex-col gap-3 text-[0.8125rem]">
              {mu.outward.length > 0 && (
                <div>
                  <div className="text-[0.75rem]" style={{ color: 'var(--ink-light)' }}>
                    本宫宫干「{palace.heavenlyStem}」四化飞入
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
                    {mu.outward.map((m) => (
                      <span key={`${m.kind}-${m.star}`} style={{ color: MUTAGEN_COLORS[m.kind] }}>
                        化{m.kind}：{m.star} → {m.targetName}宫
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {mu.incoming.length > 0 && (
                <div>
                  <div className="text-[0.75rem]" style={{ color: 'var(--ink-light)' }}>
                    生年四化落在本宫的星曜
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
                    {mu.incoming.map((m) => (
                      <span key={m.star} style={{ color: MUTAGEN_COLORS[m.kind] }}>
                        {m.star} 化{m.kind}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </Section>

        {relatedPatterns.length > 0 && (
          <Section title="相关格局">
            <ul className="flex flex-col gap-1 text-[0.75rem]">
              {relatedPatterns.map((h) => (
                <li key={h.id} className="flex items-baseline gap-2">
                  <span style={{ color: 'var(--ink)' }}>{h.name}</span>
                  <span className="text-[0.625rem]" style={{ color: h.complete ? 'var(--cinnabar)' : 'var(--gold)' }}>
                    {h.complete ? '成立' : '近似'}
                  </span>
                  <span className="text-[0.6875rem]" style={{ color: 'var(--ink-light)' }}>
                    {h.evidences.join('；')}
                  </span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        <Section title="依据">
          <ul className="list-inside list-disc text-[0.75rem] leading-relaxed" style={{ color: 'var(--ink-light)' }}>
            {basis.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </Section>

        <p
          className="mt-6 rounded p-3 text-[0.6875rem] leading-relaxed"
          style={{ background: 'var(--bg)', color: 'var(--ink-light)' }}
        >
          本工具提供的内容属于传统文化研究参考，不构成医疗、法律、投资或人生决策建议。
        </p>
      </div>
    </div>
  );
}
