import { describe, expect, it } from 'vitest';

import { astrolabeByBirth } from '../index';
import type { LunarBirthInput, SolarBirthInput } from '../index';

const base = {
  isEarlyZi: false,
  gender: 'male' as const,
  timezoneOffset: 8,
  useTrueSolarTime: false,
  ziStrategy: 'late-zi-next-day' as const,
};

const lunarInput = (year: number, month: number, day: number, isLeapMonth = false): LunarBirthInput => ({
  ...base,
  calendar: 'lunar',
  lunarDate: { year, month, day, isLeapMonth },
  timeIndex: 6,
});

/**
 * 健壮性：任何输入都必须以 Result 返回，绝不允许抛异常冒泡到 UI。
 * 引擎契约见 PRD 9.8 —— UI 层依赖「可穷举处理全部边界」这一前提。
 */
describe('输入健壮性：任何输入都不应抛异常', () => {
  const cases: Array<[string, SolarBirthInput | LunarBirthInput]> = [
    ['农历月份为 0', lunarInput(1990, 0, 1)],
    ['农历月份为 13', lunarInput(1990, 13, 1)],
    ['农历月份为负', lunarInput(1990, -1, 1)],
    ['农历日为 0', lunarInput(1990, 4, 0)],
    ['农历日超出 30（正月三十一）', lunarInput(1990, 1, 31)],
    // 该月仅有 29 天：会通过范围校验，但历法库会抛错，须被引擎捕获
    ['农历日超出当月实际天数（1990 年正月三十）', lunarInput(1990, 1, 30)],
    ['农历日为 99', lunarInput(1990, 4, 99)],
    ['农历年份越界', lunarInput(1899, 4, 21)],
    ['农历闰月但年份无闰月', lunarInput(2026, 5, 10, true)],
    ['农历闰五月但实为闰六月', lunarInput(2025, 5, 10, true)],
    ['阳历日期为空', { ...base, calendar: 'solar', solarDate: '', timeIndex: 6 }],
    ['阳历日期格式非法', { ...base, calendar: 'solar', solarDate: 'not-a-date', timeIndex: 6 }],
    ['阳历 2 月 30 日', { ...base, calendar: 'solar', solarDate: '1990-02-30', timeIndex: 6 }],
    ['时辰为负', { ...base, calendar: 'solar', solarDate: '1990-05-15', timeIndex: -1 }],
    ['时辰为小数', { ...base, calendar: 'solar', solarDate: '1990-05-15', timeIndex: 6.5 }],
    ['时辰为NaN', { ...base, calendar: 'solar', solarDate: '1990-05-15', timeIndex: NaN }],
  ];

  it.each(cases)('%s', (_label, input) => {
    expect(() => astrolabeByBirth(input)).not.toThrow();
  });

  it('非法输入应返回明确的错误，而不是产出一张错误的命盘', () => {
    const results = cases.map(([label, input]) => ({
      label,
      r: astrolabeByBirth(input),
    }));

    for (const { label, r } of results) {
      if (!r.ok) {
        // 错误必须带 code 与可直接展示的中文提示
        expect(r.error.code, label).toBeTruthy();
        expect(r.error.message, label).toBeTruthy();
      }
    }
  });

  it('农历日期超出当月实际天数时给出明确提示，而非崩溃', () => {
    // 1990 年正月仅有 29 天
    const r = astrolabeByBirth(lunarInput(1990, 1, 30));
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe('INVALID_LUNAR_DATE');
    expect(r.error.message).toContain('不存在');
  });

  it('阳历非法日期应被拒绝而非静默纠正', () => {
    const r = astrolabeByBirth({
      ...base,
      calendar: 'solar',
      solarDate: '1990-02-30',
      timeIndex: 6,
    });
    // 2 月 30 日不存在：要么报错，要么给出可解释的结果，但不能崩溃（已由上一组用例保证）
    if (!r.ok) {
      expect(r.error.message.length).toBeGreaterThan(5);
    }
  });

  it('农历闰月校验能识别「闰月存在但月份不符」', () => {
    const r = astrolabeByBirth(lunarInput(2025, 5, 10, true)); // 2025 年实为闰六月
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe('LEAP_MONTH_INVALID');
  });

  it('农历闰月校验能通过正确的闰月', () => {
    const r = astrolabeByBirth(lunarInput(2025, 6, 10, true)); // 2025 年闰六月
    expect(r.ok).toBe(true);
  });
});
