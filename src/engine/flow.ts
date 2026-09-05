/**
 * 流年计算（太岁地支法）
 *
 * - 流年命宫 = 太岁地支所在宫（紫微斗数主流的「太岁法」）；
 * - 流年四化 = 按流年天干安禄权科忌，标注到化曜所在宫。
 *
 * 本模块只用干支算术，不依赖历法表；年干支按公历年近似
 * （立春前数日的边界差对交互式流年查看影响可忽略，已在类型注释注明）。
 */
import type { Chart, Mutagen } from './types';

const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'] as const;
const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const;

/** 年干四化表（禄、权、科、忌 → 星名），紫微斗数通行的标准四化 */
const GAN_4HUA: Record<string, readonly [string, string, string, string]> = {
  甲: ['廉贞', '破军', '武曲', '太阳'],
  乙: ['天机', '天梁', '紫微', '太阴'],
  丙: ['天同', '天机', '文昌', '廉贞'],
  丁: ['太阴', '天同', '天机', '巨门'],
  戊: ['贪狼', '太阴', '右弼', '天机'],
  己: ['武曲', '贪狼', '天梁', '文曲'],
  庚: ['太阳', '武曲', '太阴', '天同'],
  辛: ['巨门', '太阳', '文曲', '文昌'],
  壬: ['天梁', '紫微', '左辅', '武曲'],
  癸: ['破军', '巨门', '太阴', '贪狼'],
};

/** 流年四化之一：某颗星在某一年化某象 */
export interface FlowMutagen {
  star: string;
  kind: Mutagen;
}

export interface FlowYearInfo {
  year: number;
  /** 干支纪年，如「丙午」 */
  ganZhi: string;
  /** 该年流年者的虚岁 */
  nominalAge: number;
  /** 流年命宫索引（太岁地支所在宫） */
  soulIndex: number;
  /** 流年命宫地支，即太岁地支 */
  soulBranch: string;
  /** 每宫流年四化（按宫分组，供盘面标注） */
  mutagenByPalace: Map<number, FlowMutagen[]>;
}

const mod = (n: number, m: number) => ((n % m) + m) % m;

/** 公历年 → 干支（锚点：1900 年为庚子年） */
export function stemBranchOfYear(year: number): string {
  const stemIdx = mod(6 + (year - 1900), 10);
  const branchIdx = mod(year - 1900, 12);
  return STEMS[stemIdx] + BRANCHES[branchIdx];
}

/** 按天干取四化（禄权科忌 → 星名） */
export function mutagensOfStem(stem: string): FlowMutagen[] {
  const table = GAN_4HUA[stem];
  if (!table) return [];
  const kinds: Mutagen[] = ['禄', '权', '科', '忌'];
  return kinds.map((kind, i) => ({ star: table[i], kind }));
}

/** 宫位四化流向（PRD F3.4） */
export interface PalaceMutagenFlow {
  /** 本宫宫干四化飞入何处：化象 + 化曜 + 落入宫位 */
  outward: { kind: Mutagen; star: string; targetIndex: number; targetName: string }[];
  /** 生年四化落在本宫的星曜 */
  incoming: { kind: Mutagen; star: string }[];
}

export function palaceMutagens(chart: Chart, index: number): PalaceMutagenFlow {
  const palace = chart.palaces[index];
  const outward: PalaceMutagenFlow['outward'] = [];
  if (palace) {
    for (const m of mutagensOfStem(palace.heavenlyStem)) {
      const target = chart.palaces.find((p) =>
        [...p.majorStars, ...p.minorStars, ...p.adjectiveStars].some((s) => s.name === m.star),
      );
      if (target) {
        outward.push({
          kind: m.kind,
          star: m.star,
          targetIndex: target.index,
          targetName: target.name,
        });
      }
    }
  }
  const incoming: PalaceMutagenFlow['incoming'] = palace
    ? [...palace.majorStars, ...palace.minorStars]
        .filter((s) => s.mutagen)
        .map((s) => ({ kind: s.mutagen as Mutagen, star: s.name }))
    : [];
  return { outward, incoming };
}

export function flowYearInfo(chart: Chart, year: number): FlowYearInfo {
  const birthYear = Number(chart.solarDate.slice(0, 4));
  const ganZhi = stemBranchOfYear(year);
  const stem = ganZhi[0];
  const soulBranch = ganZhi[1];
  const soulIndex = chart.palaces.findIndex((p) => p.earthlyBranch === soulBranch);
  const huaOfStem = GAN_4HUA[stem];
  const kinds: Mutagen[] = ['禄', '权', '科', '忌'];

  const mutagenByPalace = new Map<number, FlowMutagen[]>();
  for (const palace of chart.palaces) {
    // 化曜可能是主星，也可能是昌曲辅弼等，跨三类星曜查找
    const names = new Set(
      [...palace.majorStars, ...palace.minorStars, ...palace.adjectiveStars].map((s) => s.name),
    );
    const hits: FlowMutagen[] = [];
    kinds.forEach((kind, i) => {
      const star = huaOfStem[i];
      if (names.has(star)) hits.push({ star, kind });
    });
    if (hits.length > 0) mutagenByPalace.set(palace.index, hits);
  }

  return {
    year,
    ganZhi,
    nominalAge: year - birthYear + 1,
    soulIndex,
    soulBranch,
    mutagenByPalace,
  };
}
