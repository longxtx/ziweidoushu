import { useState } from 'react';

import { LS_DEFAULT_TRUE_SOLAR, TIME_BRANCHES, TIME_RANGES, TIMEZONE_OPTIONS } from '@/constants';
import { CITIES, findCity } from '@/data/cities';
import type { BirthInput, ZiStrategy } from '@/engine';
import { Seal } from '@/components/Seal';

const CURRENT_YEAR = new Date().getFullYear();

/** 首页示例盘：一键排盘，降低首次使用门槛（PRD 7.5 新手引导） */
const EXAMPLES: { label: string; input: BirthInput }[] = [
  {
    label: '1990 男 · 午时',
    input: {
      calendar: 'solar',
      solarDate: '1990-05-15',
      timeIndex: 6,
      isEarlyZi: true,
      gender: 'male',
      timezoneOffset: 8,
      longitude: 116.4,
      useTrueSolarTime: true,
      ziStrategy: 'late-zi-next-day',
    },
  },
  {
    label: '1988 女 · 子时',
    input: {
      calendar: 'solar',
      solarDate: '1988-08-08',
      timeIndex: 0,
      isEarlyZi: true,
      gender: 'female',
      timezoneOffset: 8,
      longitude: 121.47,
      useTrueSolarTime: true,
      ziStrategy: 'late-zi-next-day',
    },
  },
  {
    label: '时辰不详示例',
    input: {
      calendar: 'solar',
      solarDate: '2000-01-01',
      timeIndex: 6,
      isEarlyZi: true,
      timeUnknown: true,
      gender: 'male',
      timezoneOffset: 8,
      longitude: 113.26,
      useTrueSolarTime: true,
      ziStrategy: 'late-zi-next-day',
    },
  },
];

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="mb-4 block">
      <span className="mb-1 block text-[0.8125rem] font-medium" style={{ color: 'var(--ink)' }}>
        {label}
        {hint && (
          <span className="ml-1 text-[0.6875rem] font-normal" style={{ color: 'var(--ink-light)' }}>
            {hint}
          </span>
        )}
      </span>
      {children}
    </label>
  );
}

const inputStyle = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  color: 'var(--ink)',
  borderRadius: 'var(--radius-sm)',
  padding: '8px 10px',
  fontSize: 14,
  width: '100%',
};

interface Props {
  onCast: (input: BirthInput) => void | Promise<void>;
  onLibrary: () => void;
  error?: string | null;
}

export function ChartForm({ onCast, onLibrary, error }: Props) {
  const [calendar, setCalendar] = useState<'solar' | 'lunar'>('solar');
  const [solarDate, setSolarDate] = useState('1990-05-15');
  const [lunarYear, setLunarYear] = useState(1990);
  const [lunarMonth, setLunarMonth] = useState(4);
  const [lunarDay, setLunarDay] = useState(21);
  const [isLeapMonth, setIsLeapMonth] = useState(false);

  const [timeIndex, setTimeIndex] = useState(6);
  const [isEarlyZi, setIsEarlyZi] = useState(true);
  const [timeUnknown, setTimeUnknown] = useState(false);
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [cityName, setCityName] = useState('北京');
  const [tzOffset, setTzOffset] = useState(8);
  // 真太阳时默认开关读取设置页偏好（PRD 7.1 设置项）
  const [useTrueSolarTime, setUseTrueSolarTime] = useState(
    () => localStorage.getItem(LS_DEFAULT_TRUE_SOLAR) !== 'off',
  );
  const [ziStrategy, setZiStrategy] = useState<ZiStrategy>('late-zi-next-day');
  const [showAdvanced, setShowAdvanced] = useState(false);
  // 排盘进行中：引擎为按需加载，首次可能需下载，必须给出反馈（PRD 7.3）
  const [submitting, setSubmitting] = useState(false);

  const city = findCity(cityName) ?? CITIES[0];

  const buildInput = (): BirthInput => ({
    calendar,
    solarDate,
    lunarDate: { year: lunarYear, month: lunarMonth, day: lunarDay, isLeapMonth },
    // 不知时辰时按午时排盘，并在结果页常驻提示（PRD 7.3）
    timeIndex: timeUnknown ? 6 : timeIndex,
    isEarlyZi,
    timeUnknown,
    gender,
    timezoneOffset: tzOffset,
    longitude: city.longitude,
    useTrueSolarTime,
    ziStrategy,
  });

  const submit = async () => {
    setSubmitting(true);
    try {
      await onCast(buildInput());
    } finally {
      setSubmitting(false);
    }
  };

  const useExample = async (input: BirthInput) => {
    setSubmitting(true);
    try {
      await onCast(input);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[560px] px-4 pb-12">
      <header className="py-8 text-center">
        <Seal size={68} />
        <h1 className="text-kai mt-4 text-[1.5rem] font-semibold" style={{ color: 'var(--ink)' }}>
          紫微斗数排盘
        </h1>
        <p className="mt-1 text-[0.8125rem]" style={{ color: 'var(--ink-light)' }}>
          真太阳时校正 · 每个结论都可追溯 · 数据只在本机处理
        </p>
      </header>

      <div className="mb-3 text-center">
        <button
          type="button"
          onClick={onLibrary}
          className="text-[0.75rem]"
          style={{ color: 'var(--ink-light)' }}
        >
          ☰ 我的盘库
        </button>
      </div>

      {/* 示例盘：降低「必须填生日才能进入」的门槛（PRD 7.5），置于首屏显眼处 */}
      <div
        className="mb-4 rounded p-3"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
      >
        <p className="mb-2 text-[0.75rem]" style={{ color: 'var(--ink-light)' }}>
          不知道填什么？先试试示例盘，一键看效果：
        </p>
        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex.label}
              type="button"
              onClick={() => void useExample(ex.input)}
              disabled={submitting}
              className="rounded-sm px-3 py-1.5 text-[0.75rem]"
              style={{ border: '1px solid var(--border)', color: 'var(--ink)' }}
            >
              {ex.label}
            </button>
          ))}
        </div>
      </div>

      {/* 三张差异化引导卡（PRD 7.5：准 / 懂 / 私密） */}
      <div className="mb-4 grid gap-2 sm:grid-cols-3">
        {[
          { t: '排得准', d: '真太阳时校正、闰月与早晚子时严格处理，盘面标明校正分钟数' },
          { t: '看得懂', d: '点开任一宫位，可下钻到安星规则与推导依据' },
          { t: '够私密', d: '数据只在你这台设备上处理，不上传、无账号' },
        ].map(({ t, d }) => (
          <div
            key={t}
            className="rounded p-3"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
          >
            <div className="text-kai text-[0.875rem]" style={{ color: 'var(--cinnabar)' }}>
              {t}
            </div>
            <p className="mt-1 text-[0.6875rem] leading-relaxed" style={{ color: 'var(--ink-light)' }}>
              {d}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded p-4" style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow)' }}>
        {/* 明确告知默认值为示例信息，避免用户误排他人的盘 */}
        <p className="mb-3 text-[0.75rem]" style={{ color: 'var(--ink-light)' }}>
          下面是示例信息，请改成你自己的出生日期与时辰。
        </p>

        {/* 历法切换 */}
        <div className="mb-4 flex gap-2">
          {(['solar', 'lunar'] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCalendar(c)}
              className="flex-1 rounded-sm py-2 text-[0.875rem]"
              style={{
                background: calendar === c ? 'var(--cinnabar)' : 'transparent',
                color: calendar === c ? 'var(--on-accent)' : 'var(--ink-light)',
                border: `1px solid ${calendar === c ? 'var(--cinnabar)' : 'var(--border)'}`,
              }}
            >
              {c === 'solar' ? '阳历' : '农历'}
            </button>
          ))}
        </div>

        {calendar === 'solar' ? (
          <Field label="出生日期">
            <input
              type="date"
              value={solarDate}
              min={`1900-01-01`}
              max={`2100-12-31`}
              onChange={(e) => setSolarDate(e.target.value)}
              style={inputStyle}
            />
          </Field>
        ) : (
          <>
            <div className="mb-4 flex gap-2">
              {[
                { v: lunarYear, set: setLunarYear, ph: '年', min: 1900, max: 2100 },
                { v: lunarMonth, set: setLunarMonth, ph: '月', min: 1, max: 12 },
                { v: lunarDay, set: setLunarDay, ph: '日', min: 1, max: 30 },
              ].map(({ v, set, ph, min, max }) => (
                <input
                  key={ph}
                  type="number"
                  value={v}
                  min={min}
                  max={max}
                  placeholder={ph}
                  onChange={(e) => set(Number(e.target.value))}
                  style={{ ...inputStyle, flex: 1 }}
                  aria-label={`农历${ph}`}
                />
              ))}
            </div>
            <label className="mb-4 flex items-center gap-2 text-[0.8125rem]" style={{ color: 'var(--ink)' }}>
              <input
                type="checkbox"
                checked={isLeapMonth}
                onChange={(e) => setIsLeapMonth(e.target.checked)}
              />
              闰月（若该年无此闰月会提示错误）
            </label>
          </>
        )}

        {/* 时辰 */}
        <Field label="出生时辰">
          {/* PRD F1：为「不知时辰」提供明确入口，而非让用户随意选一个 */}
          <label
            className="mb-2 flex items-center gap-2 text-[0.75rem]"
            style={{ color: 'var(--ink-light)' }}
          >
            <input
              type="checkbox"
              checked={timeUnknown}
              onChange={(e) => setTimeUnknown(e.target.checked)}
            />
            我不清楚出生时辰
          </label>

          {timeUnknown ? (
            <p
              className="rounded-sm p-2 text-[0.75rem] leading-relaxed"
              style={{ background: 'var(--gold-soft)', color: 'var(--ink)' }}
            >
              将按<strong>午时</strong>排盘。命宫与迁移宫可能不准，建议向家人确认后重新排盘。
            </p>
          ) : (
            <>
          <div className="mt-1 grid grid-cols-6 gap-1">
            {TIME_BRANCHES.map((b, i) => (
              <button
                key={b}
                type="button"
                onClick={() => setTimeIndex(i)}
                className="rounded-sm py-[5px] leading-tight"
                style={{
                  background: timeIndex === i ? 'var(--gold)' : 'transparent',
                  color: timeIndex === i ? 'var(--on-accent)' : 'var(--ink)',
                  border: `1px solid ${timeIndex === i ? 'var(--gold)' : 'var(--border)'}`,
                }}
                title={`${b}时 ${TIME_RANGES[i]}`}
                aria-label={`${b}时 ${TIME_RANGES[i]}`}
              >
                {/* 直接显示时间段：移动端无 hover，不能只靠 title */}
                <span className="block text-[0.8125rem]">{b}</span>
                <span
                  className="block text-[0.5625rem]"
                  style={{ color: timeIndex === i ? 'var(--on-accent)' : 'var(--ink-light)' }}
                >
                  {TIME_RANGES[i].replace(/:00/g, '')}
                </span>
              </button>
            ))}
          </div>
          {timeIndex === 0 && (
            <div className="mt-2 flex gap-2">
              {[
                { v: true, label: '早子 00–01' },
                { v: false, label: '晚子 23–24' },
              ].map(({ v, label }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setIsEarlyZi(v)}
                  className="flex-1 rounded-sm py-[6px] text-[0.75rem]"
                  style={{
                    background: isEarlyZi === v ? 'var(--cinnabar)' : 'transparent',
                    color: isEarlyZi === v ? 'var(--on-accent)' : 'var(--ink-light)',
                    border: `1px solid ${isEarlyZi === v ? 'var(--cinnabar)' : 'var(--border)'}`,
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
          <p className="mt-1 text-[0.6875rem]" style={{ color: 'var(--ink-light)' }}>
            {TIME_RANGES[timeIndex]}
            {timeIndex === 0 && `（${isEarlyZi ? '早子' : '晚子'}）`}
          </p>
            </>
          )}
        </Field>

        {/* 性别 */}
        <Field label="性别">
          <div className="flex gap-2">
            {[
              { v: 'male' as const, label: '男' },
              { v: 'female' as const, label: '女' },
            ].map(({ v, label }) => (
              <button
                key={v}
                type="button"
                onClick={() => setGender(v)}
                className="flex-1 rounded-sm py-2 text-[0.875rem]"
                style={{
                  background: gender === v ? 'var(--cinnabar)' : 'transparent',
                  color: gender === v ? 'var(--on-accent)' : 'var(--ink)',
                  border: `1px solid ${gender === v ? 'var(--cinnabar)' : 'var(--border)'}`,
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </Field>

        {/* 出生地 */}
        <Field
          label="出生地"
          hint={`东经 ${city.longitude}°　·　找不到你的城市时，选地理位置最近的城市，真太阳时误差通常小于 5 分钟`}
        >
          <select
            value={cityName}
            onChange={(e) => setCityName(e.target.value)}
            style={inputStyle}
          >
            {CITIES.map((c) => (
              <option key={`${c.province}-${c.name}`} value={c.name}>
                {c.province} · {c.name}
              </option>
            ))}
          </select>
        </Field>

        {/* 时区（PRD F1：海外出生可选） */}
        <Field label="出生时区" hint="默认 UTC+8；海外出生请选择当地时间对应的时区">
          <select
            value={tzOffset}
            onChange={(e) => setTzOffset(Number(e.target.value))}
            style={inputStyle}
          >
            {TIMEZONE_OPTIONS.map((tz) => (
              <option key={tz.offset} value={tz.offset}>
                {tz.label}
              </option>
            ))}
          </select>
        </Field>

        {/* 高级设置 */}
        <button
          type="button"
          onClick={() => setShowAdvanced((s) => !s)}
          className="mb-3 text-[0.75rem]"
          style={{ color: 'var(--ink-light)' }}
        >
          {showAdvanced ? '收起高级设置 ▲' : '展开高级设置 ▼'}
        </button>

        {showAdvanced && (
          <div className="mb-4 rounded p-3" style={{ background: 'var(--bg)' }}>
            <label className="mb-3 flex items-start gap-2 text-[0.8125rem]" style={{ color: 'var(--ink)' }}>
              <input
                type="checkbox"
                checked={useTrueSolarTime}
                onChange={(e) => setUseTrueSolarTime(e.target.checked)}
                className="mt-[3px]"
              />
              <span>
                真太阳时校正
                <span className="block text-[0.6875rem]" style={{ color: 'var(--ink-light)' }}>
                  按出生地经度与均时差校正，更贴近古法。关闭后按钟表时间排盘。
                </span>
              </span>
            </label>

            <label className="flex flex-col gap-1 text-[0.8125rem]" style={{ color: 'var(--ink)' }}>
              晚子时（23–24 点）换日
              <select
                value={ziStrategy}
                onChange={(e) => setZiStrategy(e.target.value as ZiStrategy)}
                style={{ ...inputStyle, marginTop: 4 }}
              >
                <option value="late-zi-next-day">算作次日（通行做法）</option>
                <option value="late-zi-same-day">算作当日</option>
              </select>
            </label>
          </div>
        )}

        {error && (
          <p
            className="mb-3 rounded-sm p-2 text-[0.75rem]"
            style={{ background: 'var(--error-soft)', color: 'var(--cinnabar)' }}
            role="alert"
          >
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={() => void submit()}
          disabled={submitting}
          className="w-full rounded py-3 text-[0.9375rem] text-white"
          style={{
            background: 'var(--grad-btn)',
            boxShadow: 'var(--shadow)',
            opacity: submitting ? 0.6 : 1,
          }}
        >
          {submitting ? '排盘中…' : '开始排盘'}
        </button>

        <p className="mt-3 text-center text-[0.6875rem]" style={{ color: 'var(--ink-light)' }}>
          支持 {1900}–{2100} 年出生 · 当前参考年 {CURRENT_YEAR}
        </p>
      </div>

      <p className="mt-6 text-center text-[0.6875rem] leading-relaxed" style={{ color: 'var(--ink-light)' }}>
        本工具用于传统文化研究与娱乐，内容不构成医疗、法律或投资建议。
        <br />
        出生数据仅在您的设备本地处理，不会上传。
      </p>
    </div>
  );
}
