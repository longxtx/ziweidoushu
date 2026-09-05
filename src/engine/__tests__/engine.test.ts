import { describe, expect, it } from 'vitest';

import { astrolabeByBirth, computeTrueSolarTime, minuteToHour } from '../index';
import type { SolarBirthInput } from '../index';

const baseInput: Omit<SolarBirthInput, 'solarDate' | 'timeIndex'> = {
  calendar: 'solar',
  isEarlyZi: false,
  gender: 'male',
  timezoneOffset: 8,
  useTrueSolarTime: false,
  ziStrategy: 'late-zi-next-day',
};

describe('真太阳时校正', () => {
  it('北京时间（东经 116.4°）经度时差约为 -14.4 分钟', () => {
    const r = computeTrueSolarTime({
      date: '2020-06-15',
      timeIndex: 6,
      isEarlyZi: false,
      longitude: 116.4,
      timezoneOffset: 8,
    });
    expect(r.longitudeOffset).toBeCloseTo(-14.4, 1);
  });

  it('东经 120°（时区中央经线）经度时差为 0', () => {
    const r = computeTrueSolarTime({
      date: '2020-06-15',
      timeIndex: 6,
      isEarlyZi: false,
      longitude: 120,
      timezoneOffset: 8,
    });
    expect(r.longitudeOffset).toBeCloseTo(0, 5);
  });

  it('极端经度可导致跨时辰', () => {
    // 新疆喀什约东经 75.98°，与东八区中央经线相差 44°，约 -176 分钟
    const r = computeTrueSolarTime({
      date: '2020-06-15',
      timeIndex: 6,
      isEarlyZi: false,
      longitude: 75.98,
      timezoneOffset: 8,
    });
    expect(r.offsetMinutes).toBeLessThan(-150);
    expect(r.changedHour).toBe(true);
  });

  it('分钟数反解时辰覆盖全时段', () => {
    expect(minuteToHour(30)).toEqual({ timeIndex: 0, isEarlyZi: true });
    expect(minuteToHour(120)).toEqual({ timeIndex: 1, isEarlyZi: false });
    expect(minuteToHour(1320)).toEqual({ timeIndex: 11, isEarlyZi: false });
    expect(minuteToHour(1410)).toEqual({ timeIndex: 0, isEarlyZi: false });
  });
});

describe('排盘引擎', () => {
  it('阳历排盘返回完整十二宫', () => {
    const result = astrolabeByBirth({ ...baseInput, solarDate: '1990-05-15', timeIndex: 6 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const chart = result.value;
    expect(chart.palaces).toHaveLength(12);
    expect(chart.soulPalaceIndex).toBeGreaterThanOrEqual(0);
    expect(chart.fiveElementsClass).toBeTruthy();
    // 十四主星必须全部落宫
    const majorCount = chart.palaces.reduce((n, p) => n + p.majorStars.length, 0);
    expect(majorCount).toBe(14);
  });

  it('每个宫位都有天干地支与大限区间', () => {
    const result = astrolabeByBirth({ ...baseInput, solarDate: '1988-02-14', timeIndex: 3 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    for (const p of result.value.palaces) {
      expect(p.heavenlyStem).toBeTruthy();
      expect(p.earthlyBranch).toBeTruthy();
      expect(p.daXian.range[0]).toBeLessThanOrEqual(p.daXian.range[1]);
    }
  });

  it('农历排盘可用，且与同日阳历结果一致', () => {
    const solar = astrolabeByBirth({ ...baseInput, solarDate: '1990-05-15', timeIndex: 6 });
    const lunar = astrolabeByBirth({
      ...baseInput,
      calendar: 'lunar',
      lunarDate: { year: 1990, month: 4, day: 21, isLeapMonth: false },
      timeIndex: 6,
    });
    expect(lunar.ok).toBe(true);
    if (!lunar.ok || !solar.ok) return;
    // 1990-05-15 对应农历四月廿一
    expect(lunar.value.lunarDate).toBe(solar.value.lunarDate);
  });

  it('晚子时算次日（forward）时日柱与早子时不同', () => {
    const early = astrolabeByBirth({
      ...baseInput,
      solarDate: '1990-05-15',
      timeIndex: 0,
      isEarlyZi: true,
    });
    const late = astrolabeByBirth({
      ...baseInput,
      solarDate: '1990-05-15',
      timeIndex: 0,
      isEarlyZi: false,
    });
    expect(early.ok && late.ok).toBe(true);
    if (!early.ok || !late.ok) return;
    // 命宫由「生月 + 生时」决定，同月内早晚子时命宫相同属正常；差异体现在日柱
    expect(early.value.chineseDate).not.toBe(late.value.chineseDate);
  });

  it('晚子时换日策略（Q2）会改变日柱', () => {
    const sameDay = astrolabeByBirth({
      ...baseInput,
      solarDate: '1990-05-15',
      timeIndex: 0,
      isEarlyZi: false,
      ziStrategy: 'late-zi-same-day',
    });
    const nextDay = astrolabeByBirth({
      ...baseInput,
      solarDate: '1990-05-15',
      timeIndex: 0,
      isEarlyZi: false,
      ziStrategy: 'late-zi-next-day',
    });
    expect(sameDay.ok && nextDay.ok).toBe(true);
    if (!sameDay.ok || !nextDay.ok) return;
    expect(sameDay.value.chineseDate).not.toBe(nextDay.value.chineseDate);
  });
});

describe('边界与错误', () => {
  it('历法越界被拦截', () => {
    const r = astrolabeByBirth({ ...baseInput, solarDate: '1899-05-15', timeIndex: 6 });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe('DATE_OUT_OF_RANGE');
    expect(r.error.message).toContain('1900');
  });

  it('不存在的闰月被拦截', () => {
    const r = astrolabeByBirth({
      ...baseInput,
      calendar: 'lunar',
      lunarDate: { year: 2026, month: 5, day: 10, isLeapMonth: true },
      timeIndex: 6,
    });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe('LEAP_MONTH_INVALID');
  });

  it('非法时辰被拦截', () => {
    const r = astrolabeByBirth({ ...baseInput, solarDate: '1990-05-15', timeIndex: 12 });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe('INVALID_TIME_INDEX');
  });

  it('启用真太阳时但缺少经度时报错', () => {
    const r = astrolabeByBirth({
      ...baseInput,
      solarDate: '1990-05-15',
      timeIndex: 6,
      useTrueSolarTime: true,
    });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe('MISSING_LONGITUDE');
  });
});
