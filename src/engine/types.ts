/**
 * 领域模型（对应 PRD 9.3 / 9.8）
 *
 * 约定：
 * - 星曜、宫位内部标识统一使用中文原名，便于与规则表逐条对照与调试（PRD 附录 D.4）
 * - slug 仅用于 URL 与 i18n key
 */

export type CalendarType = 'solar' | 'lunar';
export type Gender = 'male' | 'female';

/** 晚子时（23:00-24:00）换日策略 */
export type ZiStrategy = 'late-zi-same-day' | 'late-zi-next-day';

/** 流派：三合派（星性为主）/ 四化派（飞星四化为主） */
export type School = 'san-he' | 'si-hua';

/** 年分界：正月初一 / 立春 */
export type YearDivide = 'normal' | 'exact';

interface BirthCommon {
  /** 时辰索引 0-11（0=子、1=丑 … 11=亥） */
  timeIndex: number;
  /** timeIndex 为 0 时区分早子（00-01）与晚子（23-24） */
  isEarlyZi: boolean;
  /**
   * 用户不确定时辰：按午时排盘。
   * 命宫与迁移宫可能不准，UI 必须常驻提示（PRD F1 / 7.3）。
   */
  timeUnknown?: boolean;
  gender: Gender;
  /** 时区偏移（小时），如 8 表示 UTC+8 */
  timezoneOffset: number;
  /** 出生地经度（东经为正），用于真太阳时校正 */
  longitude?: number;
  /** 是否启用真太阳时校正 */
  useTrueSolarTime: boolean;
  ziStrategy: ZiStrategy;
  school?: School;
  yearDivide?: YearDivide;
}

export interface SolarBirthInput extends BirthCommon {
  calendar: 'solar';
  /** 阳历日期 YYYY-MM-DD */
  solarDate: string;
}

export interface LunarBirthInput extends BirthCommon {
  calendar: 'lunar';
  lunarDate: {
    year: number;
    month: number;
    day: number;
    /** 是否闰月 */
    isLeapMonth: boolean;
  };
}

/** 判别联合：阳历与农历各自只携带必需字段，避免出现「两者都填/都不填」的非法状态 */
export type BirthInput = SolarBirthInput | LunarBirthInput;

/** 星曜亮度（斗数七级） */
export type Brightness = '庙' | '旺' | '得' | '利' | '平' | '不' | '陷';

/** 旺衰五态，用于统一配色（PRD 6.2.4） */
export type StrengthState = '旺' | '相' | '休' | '囚' | '衰';

/** 四化 */
export type Mutagen = '禄' | '权' | '科' | '忌';

export type StarType = '主星' | '吉星' | '煞星' | '杂曜' | '桃花星' | '解神' | '禄存' | '天马';

export interface Star {
  name: string;
  type: StarType;
  /** 亮度，无亮度数据时为空 */
  brightness?: Brightness;
  /** 四化 */
  mutagen?: Mutagen;
}

export interface DaXian {
  /** 起止年龄 [起, 止] */
  range: [number, number];
  heavenlyStem: string;
  earthlyBranch: string;
}

export interface Palace {
  index: number;
  /** 宫位名，如「命宫」 */
  name: string;
  isBodyPalace: boolean;
  /** 是否来因宫（四化派重要概念） */
  isOriginalPalace: boolean;
  heavenlyStem: string;
  earthlyBranch: string;
  majorStars: Star[];
  minorStars: Star[];
  adjectiveStars: Star[];
  /** 长生十二神 */
  changsheng12: string;
  /** 博士十二神 */
  boshi12: string;
  daXian: DaXian;
  /** 小限年龄数组 */
  xiaoXian: number[];
}

/** 真太阳时校正结果 */
export interface SolarTimeCorrection {
  /** 校正量（分钟）：真太阳时 − 钟表时间 */
  offsetMinutes: number;
  /** 经度时差分量（分钟） */
  longitudeOffset: number;
  /** 均时差分量（分钟） */
  equationOfTime: number;
  /** 校正后的日期 YYYY-MM-DD */
  correctedDate: string;
  correctedTimeIndex: number;
  correctedIsEarlyZi: boolean;
  /** 校正后是否跨日 */
  crossedDay: boolean;
  /** 校正后是否改变了时辰 */
  changedHour: boolean;
}

export interface Chart {
  input: BirthInput;
  solarDate: string;
  lunarDate: string;
  /** 干支纪年四柱 */
  chineseDate: string;
  time: string;
  timeRange: string;
  sign: string;
  zodiac: string;
  soulPalaceIndex: number;
  bodyPalaceIndex: number;
  /** 五行局，如「水二局」 */
  fiveElementsClass: string;
  /** 命主 */
  soul: string;
  /** 身主 */
  body: string;
  palaces: Palace[];
  /** 启用真太阳时校正时存在 */
  correction?: SolarTimeCorrection;
}

// ---------- 错误模型（PRD 9.8：以 Result 返回，不抛异常）----------

export type EngineErrorCode =
  | 'DATE_OUT_OF_RANGE'
  | 'LEAP_MONTH_INVALID'
  | 'INVALID_TIME_INDEX'
  | 'INVALID_LUNAR_DATE'
  | 'MISSING_LONGITUDE'
  | 'INTERNAL_ERROR';

export interface EngineError {
  code: EngineErrorCode;
  /** 面向用户的中文提示，可直接展示 */
  message: string;
  detail?: unknown;
}

export type Result<T> = { ok: true; value: T } | { ok: false; error: EngineError };

export const ok = <T>(value: T): Result<T> => ({ ok: true, value });

export const err = <T>(code: EngineErrorCode, message: string, detail?: unknown): Result<T> => ({
  ok: false,
  error: { code, message, detail },
});
