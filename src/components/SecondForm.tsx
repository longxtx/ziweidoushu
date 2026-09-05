import { useState } from 'react';

import { LS_DEFAULT_TRUE_SOLAR, TIME_BRANCHES, TIME_RANGES, TIMEZONE_OPTIONS } from '@/constants';
import { CITIES, findCity } from '@/data/cities';
import { astrolabeByBirth } from '@/engine';
import type { BirthInput, Chart, ZiStrategy } from '@/engine';

/**
 * 合盘用的对方出生录入表单。
 * 与首页表单同源同字段，但去掉营销/示例/高级收纳等冗余，聚焦「快速录入第二人」。
 */
interface Props {
  onChart: (chart: Chart) => void;
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

export function SecondForm({ onChart }: Props) {
  const [calendar, setCalendar] = useState<'solar' | 'lunar'>('solar');
  const [solarDate, setSolarDate] = useState('1995-06-20');
  const [lunarYear, setLunarYear] = useState(1995);
  const [lunarMonth, setLunarMonth] = useState(5);
  const [lunarDay, setLunarDay] = useState(23);
  const [isLeapMonth, setIsLeapMonth] = useState(false);

  const [timeIndex, setTimeIndex] = useState(6);
  const [isEarlyZi, setIsEarlyZi] = useState(true);
  const [timeUnknown, setTimeUnknown] = useState(false);
  const [gender, setGender] = useState<'male' | 'female'>('female');
  const [cityName, setCityName] = useState('北京');
  const [tzOffset, setTzOffset] = useState(8);
  // 复用设置页的真太阳时默认偏好
  const [useTrueSolarTime, setUseTrueSolarTime] = useState(
    () => localStorage.getItem(LS_DEFAULT_TRUE_SOLAR) !== 'off',
  );
  const [ziStrategy, setZiStrategy] = useState<ZiStrategy>('late-zi-next-day');
  const [error, setError] = useState<string | null>(null);

  const city = findCity(cityName) ?? CITIES[0];

  const submit = () => {
    const input: BirthInput = {
      calendar,
      solarDate,
      lunarDate: { year: lunarYear, month: lunarMonth, day: lunarDay, isLeapMonth },
      timeIndex: timeUnknown ? 6 : timeIndex,
      isEarlyZi,
      timeUnknown,
      gender,
      timezoneOffset: tzOffset,
      longitude: city.longitude,
      useTrueSolarTime,
      ziStrategy,
    };
    const result = astrolabeByBirth(input);
    if (result.ok) {
      setError(null);
      onChart(result.value);
    } else {
      setError(result.error.message);
    }
  };

  return (
    <div className="rounded p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      {/* 历法切换 */}
      <div className="mb-4 flex gap-2">
        {(['solar', 'lunar'] as const).map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCalendar(c)}
            className="flex-1 rounded-sm py-1.5 text-[0.8125rem]"
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
        <label className="mb-3 block text-[0.8125rem]" style={{ color: 'var(--ink)' }}>
          出生日期
          <input
            type="date"
            value={solarDate}
            min="1900-01-01"
            max="2100-12-31"
            onChange={(e) => setSolarDate(e.target.value)}
            style={{ ...inputStyle, marginTop: 4 }}
          />
        </label>
      ) : (
        <div className="mb-3 flex gap-2">
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
      )}

      {calendar === 'lunar' && (
        <label className="mb-3 flex items-center gap-2 text-[0.75rem]" style={{ color: 'var(--ink)' }}>
          <input
            type="checkbox"
            checked={isLeapMonth}
            onChange={(e) => setIsLeapMonth(e.target.checked)}
          />
          闰月
        </label>
      )}

      {/* 时辰 */}
      <label className="mb-3 block text-[0.8125rem]" style={{ color: 'var(--ink)' }}>
        出生时辰
        <label
          className="mt-1 flex items-center gap-2 text-[0.75rem]"
          style={{ color: 'var(--ink-light)' }}
        >
          <input
            type="checkbox"
            checked={timeUnknown}
            onChange={(e) => setTimeUnknown(e.target.checked)}
          />
          不清楚，按午时排盘
        </label>
        {!timeUnknown ? (
          <>
            <div className="mt-1 grid grid-cols-6 gap-1">
              {TIME_BRANCHES.map((b, i) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setTimeIndex(i)}
                  className="rounded-sm py-[5px] text-[0.75rem]"
                  style={{
                    background: timeIndex === i ? 'var(--gold)' : 'transparent',
                    color: timeIndex === i ? 'var(--on-accent)' : 'var(--ink)',
                    border: `1px solid ${timeIndex === i ? 'var(--gold)' : 'var(--border)'}`,
                  }}
                  title={TIME_RANGES[i]}
                >
                  {b}
                </button>
              ))}
            </div>
            {timeIndex === 0 && (
              <div className="mt-1 flex gap-2">
                {[
                  { v: true, label: '早子 00–01' },
                  { v: false, label: '晚子 23–24' },
                ].map(({ v, label }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setIsEarlyZi(v)}
                    className="flex-1 rounded-sm py-[5px] text-[0.6875rem]"
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
          </>
        ) : (
          <p className="mt-1 text-[0.6875rem]" style={{ color: 'var(--ink-light)' }}>
            将按午时排盘，命宫与迁移宫可能不准
          </p>
        )}
      </label>

      {/* 性别 + 出生地 */}
      <div className="mb-3 flex gap-2">
        <div className="flex-1">
          <label className="block text-[0.8125rem]" style={{ color: 'var(--ink)' }}>
            性别
            <div className="mt-1 flex gap-2">
              {[
                { v: 'male' as const, label: '男' },
                { v: 'female' as const, label: '女' },
              ].map(({ v, label }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setGender(v)}
                  className="flex-1 rounded-sm py-1.5 text-[0.8125rem]"
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
          </label>
        </div>
        <div className="flex-[1.6]">
          <label className="block text-[0.8125rem]" style={{ color: 'var(--ink)' }}>
            出生地
            <select
              value={cityName}
              onChange={(e) => setCityName(e.target.value)}
              style={{ ...inputStyle, marginTop: 1 }}
            >
              {CITIES.map((c) => (
                <option key={`${c.province}-${c.name}`} value={c.name}>
                  {c.province} · {c.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {/* 时区（默认 UTC+8，海外出生可选） */}
      <label className="mb-3 block text-[0.8125rem]" style={{ color: 'var(--ink)' }}>
        出生时区
        <select
          value={tzOffset}
          onChange={(e) => setTzOffset(Number(e.target.value))}
          style={{ ...inputStyle, marginTop: 4 }}
        >
          {TIMEZONE_OPTIONS.map((tz) => (
            <option key={tz.offset} value={tz.offset}>
              {tz.label}
            </option>
          ))}
        </select>
      </label>

      {/* 真太阳时与晚子策略 */}
      <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-2">
        <label className="flex items-center gap-2 text-[0.75rem]" style={{ color: 'var(--ink)' }}>
          <input
            type="checkbox"
            checked={useTrueSolarTime}
            onChange={(e) => setUseTrueSolarTime(e.target.checked)}
          />
          真太阳时校正
        </label>
        <label className="flex items-center gap-2 text-[0.75rem]" style={{ color: 'var(--ink)' }}>
          晚子时
          <select
            value={ziStrategy}
            onChange={(e) => setZiStrategy(e.target.value as ZiStrategy)}
            style={{ ...inputStyle, width: 150, padding: '4px 6px', fontSize: 12 }}
          >
            <option value="late-zi-next-day">算次日</option>
            <option value="late-zi-same-day">算当日</option>
          </select>
        </label>
      </div>

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
        onClick={submit}
        className="w-full rounded py-2.5 text-[0.875rem] text-white"
        style={{ background: 'var(--grad-btn)' }}
      >
        生成第二张命盘
      </button>
    </div>
  );
}
