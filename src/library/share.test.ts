import { describe, it, expect } from 'vitest';

import type { BirthInput } from '@/engine';
import { decodeChart, encodeChart } from './share';

const solar: BirthInput = {
  calendar: 'solar',
  solarDate: '1990-05-15',
  timeIndex: 6,
  isEarlyZi: true,
  gender: 'male',
  timezoneOffset: 8,
  longitude: 116.4,
  useTrueSolarTime: true,
  ziStrategy: 'late-zi-next-day',
};

const lunar: BirthInput = {
  calendar: 'lunar',
  lunarDate: { year: 1990, month: 4, day: 21, isLeapMonth: false },
  timeIndex: 0,
  isEarlyZi: false,
  gender: 'female',
  timezoneOffset: 8,
  longitude: 121.47,
  useTrueSolarTime: true,
  ziStrategy: 'late-zi-same-day',
  yearDivide: 'exact',
};

describe('share 编解码', () => {
  it('阳历输入往返一致', () => {
    expect(decodeChart(encodeChart(solar))).toEqual(solar);
  });

  it('农历输入（含闰月标记/年分界）往返一致', () => {
    expect(decodeChart(encodeChart(lunar))).toEqual(lunar);
  });

  it('闰月标记正确保留', () => {
    const leap: BirthInput = {
      ...lunar,
      lunarDate: { year: 2023, month: 2, day: 10, isLeapMonth: true },
    };
    expect(decodeChart(encodeChart(leap))).toEqual(leap);
  });

  it('不知时辰标志保留', () => {
    const unknown: BirthInput = { ...solar, timeUnknown: true, timeIndex: 6 };
    expect(decodeChart(encodeChart(unknown))).toEqual(unknown);
  });

  it('链接不含姓名与备注', () => {
    const param = encodeChart(solar);
    expect(param).not.toMatch(/name|remark|昵称/);
  });

  it('非法参数安全返回 null', () => {
    expect(decodeChart('not-base64!!!')).toBeNull();
    expect(decodeChart(encodeChart(solar).slice(0, 6))).toBeNull();
    expect(decodeChart('')).toBeNull();
  });
});
