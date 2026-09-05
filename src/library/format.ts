import type { BirthInput } from '@/engine';

const ZI_NAMES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

/** 输入参数里不会含姓名/备注，可安全用于默认昵称与展示摘要 */
export function birthLabel(input: BirthInput): string {
  if (input.calendar === 'solar') {
    return `阳历 ${input.solarDate}`;
  }
  const { year, month, day, isLeapMonth } = input.lunarDate;
  return `农历 ${year}年${isLeapMonth ? '闰' : ''}${month}月${day}日`;
}

/** 时辰展示：早子时 / 子时（晚子）/ 时辰不详 */
export function timeLabel(input: BirthInput): string {
  if (input.timeUnknown) return '时辰不详';
  const zi = ZI_NAMES[input.timeIndex] ?? '?';
  if (input.timeIndex === 0) return input.isEarlyZi ? '早子时' : '晚子时';
  return `${zi}时`;
}

export function genderLabel(input: BirthInput): string {
  return input.gender === 'male' ? '男' : '女';
}

/** 命盘摘要：性别 · 日期 · 时辰 */
export function chartSummary(input: BirthInput): string {
  return `${genderLabel(input)} · ${birthLabel(input)} · ${timeLabel(input)}`;
}

/** 默认昵称：命盘 + 阳历/农历日期 */
export function defaultName(input: BirthInput): string {
  return `命盘 ${input.calendar === 'solar' ? input.solarDate : `${input.lunarDate.year}-${input.lunarDate.month}-${input.lunarDate.day}`}`;
}

const TAG_PRESETS = ['家人', '朋友', '客户'];

export function isPresetTag(tag: string): boolean {
  return TAG_PRESETS.includes(tag);
}

export const TAG_PRESET_LIST = TAG_PRESETS;
