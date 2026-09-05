import { describe, expect, it } from 'vitest';

import { astrolabeByBirth, flowYearInfo, stemBranchOfYear } from '@/engine';
import type { BirthInput } from '@/engine';

const baseInput: BirthInput = {
  calendar: 'solar',
  solarDate: '1990-05-15',
  timeIndex: 6,
  isEarlyZi: true,
  gender: 'female',
  timezoneOffset: 8,
  useTrueSolarTime: false,
  ziStrategy: 'late-zi-same-day',
};

describe('stemBranchOfYear', () => {
  it('1900 年为庚子年，随后逐年顺推', () => {
    expect(stemBranchOfYear(1900)).toBe('庚子');
    expect(stemBranchOfYear(1901)).toBe('辛丑');
    expect(stemBranchOfYear(1990)).toBe('庚午');
    expect(stemBranchOfYear(2026)).toBe('丙午');
    expect(stemBranchOfYear(2100)).toBe('庚申');
  });
});

describe('flowYearInfo', () => {
  const result = astrolabeByBirth(baseInput);
  expect(result.ok).toBe(true);
  if (!result.ok) return;
  const chart = result.value;

  it('太岁地支落在对应地支宫位', () => {
    const info = flowYearInfo(chart, 2026);
    expect(info.ganZhi).toBe('丙午');
    expect(info.nominalAge).toBe(37);
    expect(info.soulIndex).toBeGreaterThanOrEqual(0);
    expect(chart.palaces[info.soulIndex].earthlyBranch).toBe('午');
  });

  it('丙年四化 = 天同禄 天机权 文昌科 廉贞忌，化曜都在盘上某宫', () => {
    const info = flowYearInfo(chart, 2026);
    const hits = [...info.mutagenByPalace.values()].flat();
    // 廉贞必为十四主星，丙年化忌
    expect(hits).toContainEqual({ star: '廉贞', kind: '忌' });
    const allNames = new Set(
      chart.palaces.flatMap((p) =>
        [...p.majorStars, ...p.minorStars, ...p.adjectiveStars].map((s) => s.name),
      ),
    );
    for (const h of hits) {
      expect(allNames.has(h.star)).toBe(true);
    }
  });

  it('出生当年即虚岁 1 岁', () => {
    const info = flowYearInfo(chart, 1990);
    expect(info.nominalAge).toBe(1);
    expect(info.soulBranch).toBe('午');
  });
});
