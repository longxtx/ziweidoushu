/**
 * 宫位关系计算
 *
 * palaces 数组按地支顺序（子丑寅卯…）排列，索引即地支位置，
 * 因此对宫为 +6，三合为 +4 / +8。
 */

import type { Chart, Palace } from './types';

/** 对宫（六冲） */
export function oppositeIndex(index: number): number {
  return (index + 6) % 12;
}

/** 三合宫（两个） */
export function trineIndices(index: number): [number, number] {
  return [(index + 4) % 12, (index + 8) % 12];
}

/** 三方四正：本宫 + 对宫 + 两个三合宫 */
export function threeSidesAndCenter(index: number): number[] {
  const [a, b] = trineIndices(index);
  return [index, oppositeIndex(index), a, b];
}

export function palaceAt(chart: Chart, index: number): Palace | undefined {
  return chart.palaces[index];
}

/** 取某宫的三方四正（用于宫位详情，PRD F3） */
export function surrounded(chart: Chart, index: number) {
  return {
    target: palaceAt(chart, index),
    opposite: palaceAt(chart, oppositeIndex(index)),
    wealth: palaceAt(chart, trineIndices(index)[0]),
    career: palaceAt(chart, trineIndices(index)[1]),
  };
}

/** 宫位内是否为空宫（无十四主星） */
export function isEmptyPalace(palace: Palace): boolean {
  return palace.majorStars.length === 0;
}

/** 取宫位主星名的组合描述，如「天同太阴」或「空宫」 */
export function majorStarLabel(palace: Palace): string {
  if (palace.majorStars.length === 0) return '空宫';
  return palace.majorStars.map((s) => s.name).join('');
}
