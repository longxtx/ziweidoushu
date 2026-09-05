import { describe, expect, it } from 'vitest';

import { astrolabeByBirth, detectPatterns, PATTERN_RULES } from '@/engine';
import type { BirthInput } from '@/engine';

const samples: BirthInput[] = [
  {
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
  {
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
  {
    calendar: 'solar',
    solarDate: '2000-01-01',
    timeIndex: 6,
    isEarlyZi: true,
    timeUnknown: true,
    gender: 'female',
    timezoneOffset: 8,
    longitude: 113.26,
    useTrueSolarTime: true,
    ziStrategy: 'late-zi-next-day',
  },
];

describe('格局规则表', () => {
  it('P0 收录不少于 20 条，且 id 唯一', () => {
    expect(PATTERN_RULES.length).toBeGreaterThanOrEqual(20);
    expect(new Set(PATTERN_RULES.map((r) => r.id)).size).toBe(PATTERN_RULES.length);
  });

  it('每条规则都有说明与出处', () => {
    for (const r of PATTERN_RULES) {
      expect(r.name).toBeTruthy();
      expect(r.description).toBeTruthy();
      expect(r.source).toBeTruthy();
      expect(r.conditions.length).toBeGreaterThan(0);
    }
  });
});

describe('detectPatterns', () => {
  it('多样本识别不抛异常，且结果结构完整', () => {
    for (const input of samples) {
      const result = astrolabeByBirth(input);
      expect(result.ok).toBe(true);
      if (!result.ok) continue;
      const hits = detectPatterns(result.value);
      expect(Array.isArray(hits)).toBe(true);
      for (const h of hits) {
        expect(h.name).toBeTruthy();
        expect(h.source).toBeTruthy();
        expect(h.evidences.length).toBeGreaterThan(0);
        expect(typeof h.complete).toBe('boolean');
      }
    }
  });

  it('完全成立的格局排在近似格局之前', () => {
    const result = astrolabeByBirth(samples[0]);
    if (!result.ok) return;
    const hits = detectPatterns(result.value);
    const firstPartial = hits.findIndex((h) => !h.complete);
    if (firstPartial === -1) return;
    expect(hits.slice(firstPartial).every((h) => !h.complete)).toBe(true);
  });

  it('同一命盘多次识别结果一致（纯函数）', () => {
    const result = astrolabeByBirth(samples[1]);
    if (!result.ok) return;
    const a = detectPatterns(result.value);
    const b = detectPatterns(result.value);
    expect(a).toEqual(b);
  });
});
