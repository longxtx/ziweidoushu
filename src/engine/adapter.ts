/**
 * 排盘适配层
 *
 * MVP 阶段以 iztro 作为排盘内核（其准确性经过社区长期验证），
 * 本层负责：输入校验 → 真太阳时校正 → 调用内核 → 转换为自有领域模型（PRD 9.3）。
 *
 * 这样内核可替换：V1.0 自研核心后，只要保持本文件的对外契约不变，上层无需改动。
 */

import { astro } from 'iztro';
import { lunar2solar } from 'lunar-lite';

import { MIN_LUNAR_YEAR, MAX_LUNAR_YEAR, getLeapMonthOf } from './leap-months';
import { computeTrueSolarTime } from './solar-time';
import { err, ok } from './types';
import type {
  BirthInput,
  Brightness,
  Chart,
  Mutagen,
  Palace,
  Result,
  SolarTimeCorrection,
  Star,
  StarType,
} from './types';

export const MIN_YEAR = 1900;
export const MAX_YEAR = 2100;

const CN_MONTH = ['', '正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'];

type IztroAstrolabe = ReturnType<typeof astro.withOptions>;
type IztroPalace = IztroAstrolabe['palaces'][number];
type IztroStar = IztroPalace['majorStars'][number];

const BRIGHTNESS_MAP: Record<string, Brightness> = {
  miao: '庙',
  wang: '旺',
  de: '得',
  li: '利',
  ping: '平',
  bu: '不',
  xian: '陷',
};

const STAR_TYPE_MAP: Record<string, StarType> = {
  major: '主星',
  soft: '吉星',
  tough: '煞星',
  adjective: '杂曜',
  flower: '桃花星',
  helper: '解神',
  lucun: '禄存',
  tianma: '天马',
};

/** 我们的时辰索引（0-11）→ iztro 时辰索引（0-12，0 早子 / 12 晚子） */
export function toIztroTimeIndex(timeIndex: number, isEarlyZi: boolean): number {
  if (timeIndex === 0) return isEarlyZi ? 0 : 12;
  return timeIndex;
}

function mapStar(s: IztroStar): Star {
  return {
    name: s.name,
    type: STAR_TYPE_MAP[s.type] ?? '杂曜',
    brightness: s.brightness ? BRIGHTNESS_MAP[s.brightness] : undefined,
    mutagen: s.mutagen as Mutagen | undefined,
  };
}

function mapPalace(p: IztroPalace): Palace {
  return {
    index: p.index,
    name: p.name,
    isBodyPalace: p.isBodyPalace,
    isOriginalPalace: p.isOriginalPalace,
    heavenlyStem: p.heavenlyStem,
    earthlyBranch: p.earthlyBranch,
    majorStars: p.majorStars.map(mapStar),
    minorStars: p.minorStars.map(mapStar),
    adjectiveStars: p.adjectiveStars.map(mapStar),
    changsheng12: p.changsheng12,
    boshi12: p.boshi12,
    daXian: {
      range: [p.decadal.range[0], p.decadal.range[1]],
      heavenlyStem: p.decadal.heavenlyStem,
      earthlyBranch: p.decadal.earthlyBranch,
    },
    xiaoXian: p.ages ?? [],
  };
}

/**
 * 农历转换
 *
 * 说明：lunar-lite 是 lunar-typescript 的包装层，后者含 1900–2100 全量历法数据表（约 415KB）。
 * 由于排盘内核 iztro 本身即静态依赖该库，这部分体积目前无法剥离；
 * 已通过「引擎按需加载」将其隔离在首屏之外（首屏 ~52KB gzip，满足 PRD 9.7 首屏 ≤200KB）。
 * V1.0 自研核心时可用压缩历法表（201×4 字节）替代，届时引擎体积可下降一个数量级。
 *
 * 已知偏差（需在风险表登记）：引擎 chunk 实测约 154KB gzip，
 * 超出 PRD 9.7「引擎包 ≤ 60KB」预算；根源为 iztro → lunar-typescript 的静态依赖，
 * 在 MVP 阶段（内核用 iztro）无法规避，待 V1.0 自研核心后复核。
 */
function lunarToSolar(y: number, m: number, d: number, isLeapMonth: boolean): string {
  const s = lunar2solar(`${y}-${m}-${d}`, isLeapMonth);
  return `${s.solarYear}-${String(s.solarMonth).padStart(2, '0')}-${String(s.solarDay).padStart(2, '0')}`;
}

/**
 * 农历 → 公历（供表单实时预览使用）。
 * 与排盘入口同样遵守 PRD 9.8：错误以 Result 返回，不抛异常。
 */
export function lunarToSolarDate(
  y: number,
  m: number,
  d: number,
  isLeapMonth: boolean,
): Result<string> {
  if (!Number.isInteger(y) || y < MIN_LUNAR_YEAR || y > MAX_LUNAR_YEAR) {
    return err(
      'DATE_OUT_OF_RANGE',
      `暂不支持 ${MIN_LUNAR_YEAR} 年之前或 ${MAX_LUNAR_YEAR} 年之后的农历日期`,
    );
  }
  if (!Number.isInteger(m) || m < 1 || m > 12) {
    return err('INVALID_LUNAR_DATE', `农历月份应在 1–12 之间，当前为「${m}」`);
  }
  if (!Number.isInteger(d) || d < 1 || d > 30) {
    return err('INVALID_LUNAR_DATE', `农历日期应在 1–30 之间，当前为「${d}」`);
  }
  try {
    return ok(lunarToSolar(y, m, d, isLeapMonth));
  } catch (e) {
    return err('INVALID_LUNAR_DATE', `农历 ${y} 年${CN_MONTH[m] ?? m}月${d} 日不存在，请确认日期`, e);
  }
}

/**
 * 排盘主入口（PRD 9.8）
 *
 * 相同输入永远返回相同结果；错误以 Result 返回，不抛异常。
 */
export function astrolabeByBirth(input: BirthInput): Result<Chart> {
  // 1. 时辰校验
  if (!Number.isInteger(input.timeIndex) || input.timeIndex < 0 || input.timeIndex > 11) {
    return err('INVALID_TIME_INDEX', '时辰无效，请在子时至亥时之间选择');
  }

  let dateStr = '';
  let lunarStr = '';
  let timeIndex = input.timeIndex;
  let isEarlyZi = input.isEarlyZi;
  let correction: SolarTimeCorrection | undefined;
  let useSolarInput = input.calendar === 'solar';

  // 2. 农历闰月校验：不静默纠正，必须报错（PRD 7.3）
  //    同时把农历统一转换为阳历，便于做真太阳时校正与年份范围校验
  if (input.calendar === 'solar') {
    dateStr = input.solarDate;
  } else {
    const { year: ly, month: lm, day: ld, isLeapMonth } = input.lunarDate;

    if (!Number.isInteger(ly) || ly < MIN_LUNAR_YEAR || ly > MAX_LUNAR_YEAR) {
      return err(
        'DATE_OUT_OF_RANGE',
        `暂不支持 ${MIN_LUNAR_YEAR} 年之前或 ${MAX_LUNAR_YEAR} 年之后的出生日期（历法数据范围为 ${MIN_LUNAR_YEAR}–${MAX_LUNAR_YEAR} 年）`,
      );
    }
    // 先做范围校验，再交给历法库——非法输入必须拦在抛异常之前（PRD 9.8：不抛异常）
    if (!Number.isInteger(lm) || lm < 1 || lm > 12) {
      return err('INVALID_LUNAR_DATE', `农历月份应在 1–12 之间，当前为「${lm}」`);
    }
    if (!Number.isInteger(ld) || ld < 1 || ld > 30) {
      return err('INVALID_LUNAR_DATE', `农历日期应在 1–30 之间，当前为「${ld}」`);
    }
    if (isLeapMonth) {
      const leap = getLeapMonthOf(ly);
      if (leap !== lm) {
        return err('LEAP_MONTH_INVALID', `农历 ${ly} 年没有闰${CN_MONTH[lm] ?? lm}月，请确认月份`);
      }
    }
    lunarStr = `${ly}-${lm}-${ld}`;
    try {
      dateStr = lunarToSolar(ly, lm, ld, isLeapMonth);
    } catch (e) {
      // 例如「1990 年正月三十一」这类不存在的日期
      return err(
        'INVALID_LUNAR_DATE',
        `农历 ${ly} 年${CN_MONTH[lm] ?? lm}月${ld} 日不存在，请确认日期`,
        e,
      );
    }
  }

  // 4. 年份范围（PRD 5.4：历法库边界，越界必须明确拦截）
  const year = Number(dateStr.slice(0, 4));
  if (!Number.isFinite(year) || year < MIN_YEAR || year > MAX_YEAR) {
    return err(
      'DATE_OUT_OF_RANGE',
      `暂不支持 ${MIN_YEAR} 年之前或 ${MAX_YEAR} 年之后的出生日期（历法数据范围为 ${MIN_YEAR}–${MAX_YEAR} 年）`,
    );
  }

  // 5. 真太阳时校正（校正后日期已变化，故改用阳历排盘）
  if (input.useTrueSolarTime) {
    if (typeof input.longitude !== 'number') {
      return err('MISSING_LONGITUDE', '启用真太阳时校正需要出生地经度，请补充出生地');
    }
    correction = computeTrueSolarTime({
      date: dateStr,
      timeIndex,
      isEarlyZi,
      longitude: input.longitude,
      timezoneOffset: input.timezoneOffset,
    });
    dateStr = correction.correctedDate;
    timeIndex = correction.correctedTimeIndex;
    isEarlyZi = correction.correctedIsEarlyZi;
    useSolarInput = true;
  }

  // 6. 调用排盘内核
  try {
    const astrolabe = astro.withOptions({
      type: useSolarInput ? 'solar' : 'lunar',
      dateStr: useSolarInput ? dateStr : lunarStr,
      timeIndex: toIztroTimeIndex(timeIndex, isEarlyZi),
      gender: input.gender === 'male' ? '男' : '女',
      isLeapMonth: input.calendar === 'lunar' ? input.lunarDate.isLeapMonth : false,
      fixLeap: true,
      language: 'zh-CN',
      config: {
        // 晚子时策略（PRD Q2）
        dayDivide: input.ziStrategy === 'late-zi-same-day' ? 'current' : 'forward',
        yearDivide: input.yearDivide ?? 'normal',
        algorithm: 'default',
      },
    });

    const palaces = astrolabe.palaces.map(mapPalace);
    const soulPalaceIndex = palaces.findIndex((p) => p.name === '命宫');
    const bodyPalaceIndex = palaces.findIndex((p) => p.isBodyPalace);

    const chart: Chart = {
      input,
      solarDate: astrolabe.solarDate,
      lunarDate: astrolabe.lunarDate,
      chineseDate: astrolabe.chineseDate,
      time: astrolabe.time,
      timeRange: astrolabe.timeRange,
      sign: astrolabe.sign,
      zodiac: astrolabe.zodiac,
      soulPalaceIndex,
      bodyPalaceIndex,
      fiveElementsClass: astrolabe.fiveElementsClass,
      soul: astrolabe.soul,
      body: astrolabe.body,
      palaces,
      correction,
    };

    return ok(chart);
  } catch (e) {
    return err('INTERNAL_ERROR', '排盘失败，请检查输入后重试', e);
  }
}

/** 由命盘获取指定年份的大限宫位索引（PRD F7 的基础能力） */
export function daXianPalaceIndex(chart: Chart, age: number): number {
  const palace = chart.palaces.find((p) => age >= p.daXian.range[0] && age <= p.daXian.range[1]);
  return palace ? palace.index : -1;
}
