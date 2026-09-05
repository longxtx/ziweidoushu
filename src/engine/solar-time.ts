/**
 * 真太阳时校正（PRD 5.1 M1 / F1）
 *
 * 真太阳时 = 钟表时间 + 经度时差 + 均时差
 *   经度时差 = (出生地经度 − 时区中央经度) × 4 分钟
 *   均时差（Equation of Time）采用标准近似公式，精度约 ±0.5 分钟，对本场景足够。
 *
 * 输入为「时辰」而非具体时刻，因此以时辰中点作为代表时刻参与计算；
 * 校正后若跨越时辰或日期边界，需由上层向用户明示（PRD 7.3 边界态）。
 */

import type { SolarTimeCorrection } from './types';

/** 一天分钟数 */
const DAY_MINUTES = 1440;

/**
 * 十二时辰的起止分钟（自当日 00:00 起算）
 * 索引 0 表示子时，其中早子为 [0,60)，晚子为 [1380,1440)
 */
const HOUR_RANGES: Array<[number, number]> = [
  [0, 60], // 0 子（早子）
  [60, 180], // 1 丑
  [180, 300], // 2 寅
  [300, 420], // 3 卯
  [420, 540], // 4 辰
  [540, 660], // 5 巳
  [660, 780], // 6 午
  [780, 900], // 7 未
  [900, 1020], // 8 申
  [1020, 1140], // 9 酉
  [1140, 1260], // 10 戌
  [1260, 1380], // 11 亥
];

/** 时辰中点（分钟），晚子单独处理为 [1380,1440) 的中点 */
const HOUR_MIDPOINTS: number[] = [30, 120, 240, 360, 480, 600, 720, 840, 960, 1080, 1200, 1320];
const LATE_ZI_MIDPOINT = 1410;

/** 取时辰代表时刻（中点） */
export function hourMidpoint(timeIndex: number, isEarlyZi: boolean): number {
  if (timeIndex === 0) return isEarlyZi ? HOUR_MIDPOINTS[0] : LATE_ZI_MIDPOINT;
  return HOUR_MIDPOINTS[timeIndex];
}

/** 由分钟数反解时辰 */
export function minuteToHour(minute: number): { timeIndex: number; isEarlyZi: boolean } {
  const m = ((minute % DAY_MINUTES) + DAY_MINUTES) % DAY_MINUTES;
  if (m >= 1380) return { timeIndex: 0, isEarlyZi: false }; // 晚子
  for (let i = 1; i < HOUR_RANGES.length; i++) {
    const [start, end] = HOUR_RANGES[i];
    if (m >= start && m < end) return { timeIndex: i, isEarlyZi: false };
  }
  return { timeIndex: 0, isEarlyZi: true }; // [0,60) 早子
}

/**
 * 均时差（分钟）
 * EoT ≈ 9.87·sin(2B) − 7.53·cos(B) − 1.5·sin(B)，B = 2π(N − 81)/364
 */
export function equationOfTime(dayOfYear: number): number {
  const b = (2 * Math.PI * (dayOfYear - 81)) / 364;
  return 9.87 * Math.sin(2 * b) - 7.53 * Math.cos(b) - 1.5 * Math.sin(b);
}

/** 一年中的第几天（1-365/366） */
export function dayOfYear(date: Date): number {
  const start = Date.UTC(date.getUTCFullYear(), 0, 1);
  const current = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  return Math.floor((current - start) / 86400000) + 1;
}

function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function formatDate(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * 计算真太阳时校正
 *
 * @param params.date        钟表日期 YYYY-MM-DD
 * @param params.timeIndex   时辰索引 0-11
 * @param params.isEarlyZi   是否早子时
 * @param params.longitude   出生地经度（东经为正）
 * @param params.timezoneOffset 时区偏移小时数
 */
export function computeTrueSolarTime(params: {
  date: string;
  timeIndex: number;
  isEarlyZi: boolean;
  longitude: number;
  timezoneOffset: number;
}): SolarTimeCorrection {
  const { date, timeIndex, isEarlyZi, longitude, timezoneOffset } = params;

  const base = parseDate(date);
  const longitudeOffset = (longitude - timezoneOffset * 15) * 4;
  const eot = equationOfTime(dayOfYear(base));
  const offsetMinutes = longitudeOffset + eot;

  const clockMinutes = hourMidpoint(timeIndex, isEarlyZi);
  const trueMinutes = clockMinutes + offsetMinutes;

  // 跨日处理：< 0 归前一日，>= 1440 归次日
  let dayShift = 0;
  let normalized = trueMinutes;
  while (normalized < 0) {
    normalized += DAY_MINUTES;
    dayShift -= 1;
  }
  while (normalized >= DAY_MINUTES) {
    normalized -= DAY_MINUTES;
    dayShift += 1;
  }

  const corrected = new Date(base.getTime() + dayShift * 86400000);
  const { timeIndex: correctedTimeIndex, isEarlyZi: correctedIsEarlyZi } = minuteToHour(normalized);

  return {
    offsetMinutes: Math.round(offsetMinutes * 10) / 10,
    longitudeOffset: Math.round(longitudeOffset * 10) / 10,
    equationOfTime: Math.round(eot * 10) / 10,
    correctedDate: formatDate(corrected),
    correctedTimeIndex,
    correctedIsEarlyZi,
    crossedDay: dayShift !== 0,
    changedHour: correctedTimeIndex !== timeIndex || correctedIsEarlyZi !== isEarlyZi,
  };
}
