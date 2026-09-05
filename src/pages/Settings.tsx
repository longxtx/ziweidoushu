import { useState } from 'react';

import type { School } from '@/engine';
import { LS_DEFAULT_TRUE_SOLAR, LS_SCHOOL } from '@/constants';
import { clearAll } from '@/library/storage';
import { useChartStore } from '@/store/useChartStore';
import { useLibraryStore } from '@/store/useLibraryStore';

/**
 * 设置与合规（PRD 7.1 P0 / 9.6 清理能力 / 第 8 章隐私）
 * 含：真太阳时默认、流派、隐私说明、免责声明、意见反馈、一键清除本地数据。
 */
interface Props {
  onBack: () => void;
}

function Row({ title, hint, children }: { title: string; hint?: string; children?: React.ReactNode }) {
  return (
    <div className="border-b py-3" style={{ borderColor: 'var(--border)' }}>
      <div className="text-[0.875rem]" style={{ color: 'var(--ink)' }}>
        {title}
      </div>
      {hint && (
        <p className="mt-1 text-[0.75rem] leading-relaxed" style={{ color: 'var(--ink-light)' }}>
          {hint}
        </p>
      )}
      {children && <div className="mt-2">{children}</div>}
    </div>
  );
}

export function Settings({ onBack }: Props) {
  const [school, setSchool] = useState<School>(
    () => (localStorage.getItem(LS_SCHOOL) as School | null) ?? 'san-he',
  );
  const [defaultTST, setDefaultTST] = useState<boolean>(
    () => localStorage.getItem(LS_DEFAULT_TRUE_SOLAR) !== 'off',
  );

  function changeSchool(next: School) {
    setSchool(next);
    localStorage.setItem(LS_SCHOOL, next);
  }

  function changeTST(next: boolean) {
    setDefaultTST(next);
    localStorage.setItem(LS_DEFAULT_TRUE_SOLAR, next ? 'on' : 'off');
  }

  async function handleClear() {
    const ok = window.confirm(
      '将删除本机保存的全部命盘、偏好设置与缓存，且无法恢复。确定继续吗？',
    );
    if (!ok) return;
    await clearAll();
    useLibraryStore.setState({ charts: [], loaded: false });
    useChartStore.getState().clear();
    window.alert('已清除全部本地数据。');
    window.location.reload();
  }

  return (
    <div className="mx-auto w-full max-w-[560px] px-4 pb-12">
      <div className="flex items-center py-3">
        <button type="button" onClick={onBack} className="text-[0.875rem]" style={{ color: 'var(--ink-light)' }}>
          ← 返回
        </button>
        <h1 className="text-kai flex-1 text-center text-[1.125rem] font-medium" style={{ color: 'var(--ink)' }}>
          设置与合规
        </h1>
        <span className="w-10" />
      </div>

      <div className="rounded p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <Row title="真太阳时校正（默认）" hint="开启后，新排盘会按出生地经度与均时差校正，并在盘面标明校正分钟数。">
          <div className="flex gap-2">
            {[
              { v: true, label: '默认开启（推荐）' },
              { v: false, label: '默认关闭' },
            ].map(({ v, label }) => (
              <button
                key={label}
                type="button"
                onClick={() => changeTST(v)}
                className="flex-1 rounded-sm py-1.5 text-[0.8125rem]"
                style={{
                  background: defaultTST === v ? 'var(--cinnabar)' : 'transparent',
                  color: defaultTST === v ? 'var(--on-accent)' : 'var(--ink)',
                  border: `1px solid ${defaultTST === v ? 'var(--cinnabar)' : 'var(--border)'}`,
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </Row>

        <Row
          title="流派偏好"
          hint="MVP 阶段排盘结果与流派无关（内核为通用规则）。该偏好将随 V1.0 自研引擎接入后生效，用于解读口径与差异标注。"
        >
          <div className="flex gap-2">
            {[
              { v: 'san-he' as School, label: '三合派（星性为主）' },
              { v: 'si-hua' as School, label: '四化派（飞星四化）' },
            ].map(({ v, label }) => (
              <button
                key={v}
                type="button"
                onClick={() => changeSchool(v)}
                className="flex-1 rounded-sm py-1.5 text-[0.8125rem]"
                style={{
                  background: school === v ? 'var(--cinnabar)' : 'transparent',
                  color: school === v ? 'var(--on-accent)' : 'var(--ink)',
                  border: `1px solid ${school === v ? 'var(--cinnabar)' : 'var(--border)'}`,
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </Row>

        <Row
          title="隐私说明"
          hint="排盘全程在您的浏览器内完成，出生数据不会上传服务器，也没有任何账号体系。分享链接只含排盘参数，不含姓名与备注。"
        />

        <Row
          title="免责声明"
          hint="本工具用于传统文化研究与娱乐，不构成医疗、法律、投资或人生决策建议；涉及健康的描述仅为养生提示。"
        />

        <Row
          title="意见反馈"
          hint="发现排盘结果与权威工具不一致？欢迎反馈具体出生参数与差异点，用于规则校正。"
        >
          <a
            href="mailto:feedback@ziwei-lab.example?subject=紫微鉴反馈"
            className="text-[0.8125rem] underline"
            style={{ color: 'var(--cinnabar)' }}
          >
            发送反馈邮件
          </a>
        </Row>

        <Row title="清除本地数据" hint="删除本机保存的全部命盘、偏好与缓存（不可恢复）。">
          <button
            type="button"
            onClick={() => void handleClear()}
            className="w-full rounded py-2 text-[0.875rem]"
            style={{ border: '1px solid var(--cinnabar)', color: 'var(--cinnabar)' }}
          >
            一键清除本机全部数据
          </button>
        </Row>
      </div>

      <p className="mt-4 text-center text-[0.6875rem] leading-relaxed" style={{ color: 'var(--ink-light)' }}>
        紫微鉴 · 数据只在本机处理
      </p>
    </div>
  );
}
