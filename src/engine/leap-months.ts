import { LEAP_MONTHS } from './leap-months.data';

export const MIN_LUNAR_YEAR = 1900;
export const MAX_LUNAR_YEAR = 2100;

/**
 * 查询某农历年的闰月月份
 *
 * @returns 闰月月份（1-12）；0 表示该年无闰月；-1 表示超出 1900–2100 支持范围
 */
export function getLeapMonthOf(year: number): number {
  const idx = year - MIN_LUNAR_YEAR;
  if (idx < 0 || idx >= LEAP_MONTHS.length) return -1;
  return LEAP_MONTHS[idx];
}

/** 该农历年是否存在闰月 */
export function hasLeapMonth(year: number): boolean {
  return getLeapMonthOf(year) > 0;
}
