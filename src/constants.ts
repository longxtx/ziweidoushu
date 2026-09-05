/** 十二时辰（索引 0-11，0 为子时） */
export const TIME_BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

/** 时辰对应的时间段 */
export const TIME_RANGES = [
  '23:00–01:00',
  '01:00–03:00',
  '03:00–05:00',
  '05:00–07:00',
  '07:00–09:00',
  '09:00–11:00',
  '11:00–13:00',
  '13:00–15:00',
  '15:00–17:00',
  '17:00–19:00',
  '19:00–21:00',
  '21:00–23:00',
];

/** 时辰的中文全称 */
export const TIME_NAMES = TIME_BRANCHES.map((b) => `${b}时`);

export const PALACE_NAMES = [
  '命宫',
  '兄弟',
  '夫妻',
  '子女',
  '财帛',
  '疾厄',
  '迁移',
  '交友',
  '官禄',
  '田宅',
  '福德',
  '父母',
];

/**
 * 十二宫格网格位置（CSS Grid 行列，1-based）
 *
 * 传统盘面布局：
 *   巳 午 未 申
 *   辰  中  酉
 *   卯  宫  戌
 *   寅 丑 子 亥
 */
export const BRANCH_GRID: Record<string, { row: number; col: number }> = {
  巳: { row: 1, col: 1 },
  午: { row: 1, col: 2 },
  未: { row: 1, col: 3 },
  申: { row: 1, col: 4 },
  辰: { row: 2, col: 1 },
  酉: { row: 2, col: 4 },
  卯: { row: 3, col: 1 },
  戌: { row: 3, col: 4 },
  寅: { row: 4, col: 1 },
  丑: { row: 4, col: 2 },
  子: { row: 4, col: 3 },
  亥: { row: 4, col: 4 },
};

/** 常用时区偏移（PRD F1：默认 UTC+8，海外出生可选） */
export const TIMEZONE_OPTIONS: { label: string; offset: number }[] = [
  { label: 'UTC+8　北京 / 香港 / 新加坡', offset: 8 },
  { label: 'UTC+9　东京 / 首尔', offset: 9 },
  { label: 'UTC+7　曼谷 / 雅加达', offset: 7 },
  { label: 'UTC+5:30　印度', offset: 5.5 },
  { label: 'UTC+3　莫斯科 / 迪拜', offset: 3 },
  { label: 'UTC+1　柏林 / 巴黎', offset: 1 },
  { label: 'UTC+0　伦敦', offset: 0 },
  { label: 'UTC-5　纽约 / 多伦多', offset: -5 },
  { label: 'UTC-8　洛杉矶 / 温哥华', offset: -8 },
  { label: 'UTC+10　悉尼', offset: 10 },
  { label: 'UTC+12　奥克兰', offset: 12 },
];

/** 本地偏好存储键（PRD 9.6：主题、引导标记等放 localStorage） */
export const LS_DEFAULT_TRUE_SOLAR = 'zw-default-true-solar';
export const LS_SCHOOL = 'zw-school';
/** 命盘页三步引导已完成标记 */
export const LS_CHART_GUIDE = 'zw-guide-chart-v1';

/** 四化 → 语义色（PRD 6.2.5） */
export const MUTAGEN_COLORS: Record<string, string> = {
  禄: 'var(--mu-lu)',
  权: 'var(--mu-quan)',
  科: 'var(--mu-ke)',
  忌: 'var(--mu-ji)',
};

/** 四化的通俗含义 */
export const MUTAGEN_MEANING: Record<string, string> = {
  禄: '资源、人缘、顺畅',
  权: '掌控、竞争、主导',
  科: '名声、贵人、化解',
  忌: '执着、阻碍、纠结',
};

/** 星曜分类说明（PRD 7.5：hover 内联术语，中性知识） */
export const STAR_TYPE_TIP: Record<string, string> = {
  主星: '紫微斗数核心星曜，主导命盘格局与性格基调。',
  辅曜: '辅佐类星曜，增强或调和主星特质。',
  杂曜: '次要星曜，影响细节吉凶与特定领域。',
};
