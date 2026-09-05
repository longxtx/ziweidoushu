/**
 * 格局识别（PRD F8）
 *
 * 设计约束：
 * - 规则以**声明式数据**描述，新增格局无需改代码（PRD F8）。
 * - 输出只含「结构事实」：是否成立、命中的星曜与宫位、传统出处。
 *   吉凶倾向属命理结论，需内容审校后接入（PRD 10.1），此处不生成。
 * - 未完全成立但接近的组合以「近似格局」（complete=false）弱化展示，避免误判。
 */
import { majorStarLabel, threeSidesAndCenter } from './palaces';
import type { Brightness, Chart, Mutagen, Palace, Star } from './types';

export type PatternCondition =
  /** 某星落在某宫（可按宫名或地支限定） */
  | { kind: 'star-in-palace'; star: string; palace?: string; branch?: string }
  /** 多星同宫 */
  | { kind: 'stars-together'; stars: string[] }
  /** 命宫三方四正（本宫+对宫+两三合宫）包含全部这些星 */
  | { kind: 'triad-contains'; stars: string[] }
  /** 某星亮度属于给定集合 */
  | { kind: 'star-brightness'; star: string; brightness: Brightness[] }
  /** 某宫无十四主星（空宫） */
  | { kind: 'empty-palace'; palace: string }
  /** 命宫所在宫地支 */
  | { kind: 'palace-branch'; palace: string; branch: string }
  /** 多个化象同宫 */
  | { kind: 'mutagen-together'; mutagens: Mutagen[] }
  /** 命宫两侧（相邻两宫）见这些星 */
  | { kind: 'surrounded-by'; stars: string[] }
  /** 命宫两侧见某化象 */
  | { kind: 'surrounded-mutagen'; mutagen: Mutagen };

export interface PatternRule {
  id: string;
  name: string;
  /** 全部满足才算成立 */
  conditions: PatternCondition[];
  /** 中性结构说明，不含吉凶判断 */
  description: string;
  source: string;
}

export interface PatternHit {
  id: string;
  name: string;
  description: string;
  source: string;
  /** 逐条条件对应的实测证据（命中的星曜与宫位） */
  evidences: string[];
  /** true=完全成立；false=近似格局（差一条） */
  complete: boolean;
}

/** P0 覆盖 20 个最常见格局（PRD F8：P0 支持 20 个，P1 扩展至 60+） */
export const PATTERN_RULES: PatternRule[] = [
  {
    id: 'zi-fu-chao-yuan',
    name: '紫府朝垣',
    conditions: [{ kind: 'triad-contains', stars: ['紫微', '天府'] }],
    description: '紫微与天府同现于命宫三方四正，为斗数中最受关注的星系组合之一。',
    source: '《紫微斗数全书》',
  },
  {
    id: 'ji-xiang-li-ming',
    name: '极向离明',
    conditions: [{ kind: 'star-in-palace', star: '紫微', branch: '午' }],
    description: '紫微坐午宫，传统视为「离明」之位，星系结构上有其特定说法。',
    source: '《紫微斗数全集》',
  },
  {
    id: 'ri-yue-bing-ming',
    name: '日月并明',
    conditions: [
      { kind: 'triad-contains', stars: ['太阳', '太阴'] },
      { kind: 'star-brightness', star: '太阳', brightness: ['庙', '旺'] },
      { kind: 'star-brightness', star: '太阴', brightness: ['庙', '旺'] },
    ],
    description: '太阳、太阴同现三方四正且皆处庙旺之地。',
    source: '《紫微斗数全书》',
  },
  {
    id: 'ri-yue-tong-lin',
    name: '日月同临',
    conditions: [{ kind: 'stars-together', stars: ['太阳', '太阴'] }],
    description: '太阳与太阴同宫（常见于丑、未二宫）。',
    source: '《紫微斗数全集》',
  },
  {
    id: 'ming-zhu-chu-hai',
    name: '明珠出海',
    conditions: [
      { kind: 'empty-palace', palace: '命宫' },
      { kind: 'palace-branch', palace: '命宫', branch: '未' },
      { kind: 'star-in-palace', star: '太阳', branch: '卯' },
      { kind: 'star-in-palace', star: '太阴', branch: '亥' },
    ],
    description: '命宫在未且无主星，太阳在卯、太阴在亥，借对宫与三合之星成局。',
    source: '《紫微斗数全书》',
  },
  {
    id: 'ji-yue-tong-liang',
    name: '机月同梁',
    conditions: [{ kind: 'triad-contains', stars: ['天机', '太阴', '天同', '天梁'] }],
    description: '天机、太阴、天同、天梁会于命宫三方四正，属「机月同梁」星系结构。',
    source: '《紫微斗数全集》',
  },
  {
    id: 'sha-po-lang',
    name: '杀破狼',
    conditions: [{ kind: 'triad-contains', stars: ['七杀', '破军', '贪狼'] }],
    description: '七杀、破军、贪狼会于命宫三方四正，为变动性星系的代表组合。',
    source: '《紫微斗数全集》',
  },
  {
    id: 'huo-tan',
    name: '火贪格',
    conditions: [{ kind: 'stars-together', stars: ['火星', '贪狼'] }],
    description: '火星与贪狼同宫。',
    source: '《紫微斗数全书》',
  },
  {
    id: 'ling-tan',
    name: '铃贪格',
    conditions: [{ kind: 'stars-together', stars: ['铃星', '贪狼'] }],
    description: '铃星与贪狼同宫。',
    source: '《紫微斗数全书》',
  },
  {
    id: 'yang-liang-chang-lu',
    name: '阳梁昌禄',
    conditions: [{ kind: 'triad-contains', stars: ['太阳', '天梁', '文昌', '禄存'] }],
    description: '太阳、天梁、文昌、禄存会于命宫三方四正。',
    source: '《紫微斗数全集》',
  },
  {
    id: 'quan-lu-xun-feng',
    name: '权禄巡逢',
    conditions: [{ kind: 'mutagen-together', mutagens: ['权', '禄'] }],
    description: '化权与化禄同落一宫。',
    source: '《紫微斗数全书》',
  },
  {
    id: 'shuang-lu-jia-ming',
    name: '双禄夹命',
    conditions: [
      { kind: 'surrounded-by', stars: ['禄存'] },
      { kind: 'surrounded-mutagen', mutagen: '禄' },
    ],
    description: '命宫两侧（父母、兄弟）分别见禄存与化禄，形成「夹命」结构。',
    source: '《紫微斗数全集》',
  },
  {
    id: 'fu-bi-gong-ming',
    name: '辅弼拱命',
    conditions: [{ kind: 'triad-contains', stars: ['左辅', '右弼'] }],
    description: '左辅、右弼会于命宫三方四正。',
    source: '《紫微斗数全集》',
  },
  {
    id: 'zuo-you-tong-gong',
    name: '左右同宫',
    conditions: [{ kind: 'stars-together', stars: ['左辅', '右弼'] }],
    description: '左辅与右弼同宫。',
    source: '《紫微斗数全集》',
  },
  {
    id: 'kui-yue-jia-ming',
    name: '魁钺夹命',
    conditions: [{ kind: 'surrounded-by', stars: ['天魁', '天钺'] }],
    description: '天魁、天钺分列命宫两侧，形成「夹命」结构。',
    source: '《紫微斗数全集》',
  },
  {
    id: 'tian-yi-gong-ming',
    name: '天乙拱命',
    conditions: [{ kind: 'triad-contains', stars: ['天魁', '天钺'] }],
    description: '天魁、天钺会于命宫三方四正。',
    source: '《紫微斗数全集》',
  },
  {
    id: 'ju-ri-tong-gong',
    name: '巨日同宫',
    conditions: [{ kind: 'stars-together', stars: ['巨门', '太阳'] }],
    description: '巨门与太阳同宫（常见于寅、申二宫）。',
    source: '《紫微斗数全集》',
  },
  {
    id: 'ying-xing-ru-miao',
    name: '英星入庙',
    conditions: [
      { kind: 'star-in-palace', star: '破军', branch: '子' },
      { kind: 'star-brightness', star: '破军', brightness: ['庙', '旺'] },
    ],
    description: '破军坐子宫且处庙旺之地。',
    source: '《紫微斗数全集》',
  },
  {
    id: 'shou-xing-ru-miao',
    name: '寿星入庙',
    conditions: [
      { kind: 'star-in-palace', star: '天梁', branch: '午' },
      { kind: 'star-brightness', star: '天梁', brightness: ['庙', '旺'] },
    ],
    description: '天梁坐午宫且处庙旺之地。',
    source: '《紫微斗数全集》',
  },
  {
    id: 'wen-xing-gong-ming',
    name: '文星拱命',
    conditions: [{ kind: 'triad-contains', stars: ['文昌', '文曲'] }],
    description: '文昌、文曲会于命宫三方四正。',
    source: '《紫微斗数全集》',
  },
];

function allStars(p: Palace): Star[] {
  return [...p.majorStars, ...p.minorStars, ...p.adjectiveStars];
}

function findStar(chart: Chart, star: string): { palace: Palace; info: Star } | undefined {
  for (const p of chart.palaces) {
    const s = allStars(p).find((x) => x.name === star);
    if (s) return { palace: p, info: s };
  }
  return undefined;
}

function matchCondition(chart: Chart, cond: PatternCondition): { ok: boolean; evidence: string } {
  switch (cond.kind) {
    case 'star-in-palace': {
      const hit = findStar(chart, cond.star);
      const okPalace = !cond.palace || hit?.palace.name === cond.palace;
      const okBranch = !cond.branch || hit?.palace.earthlyBranch === cond.branch;
      const ok = !!hit && okPalace && okBranch;
      const where = hit ? `${hit.palace.name}（${hit.palace.earthlyBranch}宫）` : '未落盘';
      return {
        ok,
        evidence: `${cond.star}${
          cond.branch ? `坐${cond.branch}宫` : cond.palace ? `在${cond.palace}` : '在盘'
        }　→　${where}`,
      };
    }
    case 'stars-together': {
      const p = chart.palaces.find((x) =>
        cond.stars.every((n) => allStars(x).some((s) => s.name === n)),
      );
      return {
        ok: !!p,
        evidence: `${cond.stars.join('、')}同宫${p ? `　→　${p.name}（${p.earthlyBranch}宫）` : '　未成立'}`,
      };
    }
    case 'triad-contains': {
      const idxs = threeSidesAndCenter(chart.soulPalaceIndex);
      const missing = cond.stars.filter(
        (n) => !idxs.some((i) => allStars(chart.palaces[i]).some((s) => s.name === n)),
      );
      return {
        ok: missing.length === 0,
        evidence:
          missing.length === 0
            ? `命宫三方四正见 ${cond.stars.join('、')}`
            : `命宫三方四正见 ${cond.stars.join('、')}　→　缺 ${missing.join('、')}`,
      };
    }
    case 'star-brightness': {
      const hit = findStar(chart, cond.star);
      const ok = !!hit?.info?.brightness && cond.brightness.includes(hit.info.brightness);
      return {
        ok,
        evidence: `${cond.star}亮度属${cond.brightness.join('/')}${hit?.info?.brightness ? `　→　${hit.info.brightness}` : ''}`,
      };
    }
    case 'empty-palace': {
      const p = chart.palaces.find((x) => x.name === cond.palace);
      const ok = !!p && p.majorStars.length === 0;
      return {
        ok,
        evidence: `${cond.palace}无十四主星${p && p.majorStars.length ? `　→　${majorStarLabel(p)}` : ''}`,
      };
    }
    case 'palace-branch': {
      const p = chart.palaces.find((x) => x.name === cond.palace);
      const ok = p?.earthlyBranch === cond.branch;
      return { ok, evidence: `${cond.palace}在${cond.branch}宫${p ? `　→　实测${p.earthlyBranch}` : ''}` };
    }
    case 'mutagen-together': {
      const p = chart.palaces.find((x) =>
        cond.mutagens.every((m) => allStars(x).some((s) => s.mutagen === m)),
      );
      return {
        ok: !!p,
        evidence: `${cond.mutagens.map((m) => `化${m}`).join('、')}同宫${p ? `　→　${p.name}` : '　未成立'}`,
      };
    }
    case 'surrounded-by': {
      // 命宫两侧相邻宫：十二宫自命宫逆行安兄弟…父母，故兄弟为 -1、父母为 +1
      const soul = chart.soulPalaceIndex;
      const l = (soul + 11) % 12;
      const r = (soul + 1) % 12;
      const left = chart.palaces[l];
      const right = chart.palaces[r];
      const pool = [...allStars(left), ...allStars(right)];
      const missing = cond.stars.filter((n) => !pool.some((s) => s.name === n));
      return {
        ok: missing.length === 0,
        evidence: missing.length === 0
          ? `命宫两侧（${left.name}／${right.name}）见 ${cond.stars.join('、')}`
          : `命宫两侧（${left.name}／${right.name}）见 ${cond.stars.join('、')}　→　缺 ${missing.join('、')}`,
      };
    }
    case 'surrounded-mutagen': {
      const soul = chart.soulPalaceIndex;
      const l = (soul + 11) % 12;
      const r = (soul + 1) % 12;
      const pool = [...allStars(chart.palaces[l]), ...allStars(chart.palaces[r])];
      const ok = pool.some((s) => s.mutagen === cond.mutagen);
      return {
        ok,
        evidence: `命宫两侧见化${cond.mutagen}${ok ? '' : '　未成立'}`,
      };
    }
  }
}

/**
 * 识别命盘命中的格局。
 * 完全成立返回 complete=true；只差一条条件时以「近似格局」返回 complete=false。
 */
export function detectPatterns(chart: Chart): PatternHit[] {
  const hits: PatternHit[] = [];

  for (const rule of PATTERN_RULES) {
    const results = rule.conditions.map((c) => matchCondition(chart, c));
    const okCount = results.filter((r) => r.ok).length;
    const all = okCount === rule.conditions.length;
    // 单条件格局不存在「近似」；多条件时差一条按近似处理
    const partial = !all && rule.conditions.length > 1 && okCount === rule.conditions.length - 1;
    if (!all && !partial) continue;

    hits.push({
      id: rule.id,
      name: rule.name,
      description: rule.description,
      source: rule.source,
      evidences: results.map((r) => r.evidence),
      complete: all,
    });
  }

  // 完全成立的排在前面
  return hits.sort((a, b) => Number(b.complete) - Number(a.complete));
}
